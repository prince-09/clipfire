import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { logger } from '../lib/logger.js';
import { UPLOADS_DIR } from '../lib/upload.js';

// Resolve dirs relative to project root (works in both tsx dev and compiled dist)
const FONTS_DIR = path.resolve(process.cwd(), 'fonts');
const MUSIC_DIR = path.resolve(process.cwd(), 'music');

/** Map font key → ASS font family name (must match TTF metadata) */
const FONT_NAME_MAP: Record<string, string> = {
  'arial': 'Arial',
  'poppins': 'Poppins',
  'montserrat': 'Montserrat',
  'bangers': 'Bangers',
  'bebas-neue': 'Bebas Neue',
  'oswald': 'Oswald',
  'permanent-marker': 'Permanent Marker',
  'space-mono': 'Space Mono',
  'pacifico': 'Pacifico',
  'impact': 'Impact',
  'courier-new': 'Courier New',
  'georgia': 'Georgia',
};

const execAsync = promisify(exec);

let _drawTextAvailable: boolean | null = null;

export async function isDrawTextAvailable(): Promise<boolean> {
  if (_drawTextAvailable !== null) return _drawTextAvailable;
  try {
    const { stdout } = await execAsync('ffmpeg -filters 2>/dev/null');
    _drawTextAvailable = stdout.includes('drawtext');
  } catch {
    _drawTextAvailable = false;
  }
  if (!_drawTextAvailable) {
    logger.warn('FFmpeg drawtext filter not available. Install FFmpeg with libfreetype: brew reinstall ffmpeg');
  }
  return _drawTextAvailable;
}

export async function extractAudio(videoPath: string, maxDurationSeconds?: number): Promise<string> {
  const outputName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.wav`;
  const outputPath = path.join(UPLOADS_DIR, outputName);

  // Extract audio as mono 16kHz WAV (optimal for Whisper)
  const durationFlag = maxDurationSeconds ? `-t ${maxDurationSeconds}` : '';
  await execAsync(
    `ffmpeg -i "${videoPath}" ${durationFlag} -vn -acodec pcm_s16le -ar 16000 -ac 1 "${outputPath}" -y`,
    { timeout: 300_000 }
  );

  logger.info(`Audio extracted: ${outputPath}`);
  return outputPath;
}

export async function getVideoDuration(filePath: string): Promise<number> {
  const { stdout } = await execAsync(
    `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`
  );
  return Math.round(parseFloat(stdout.trim()));
}

export async function getVideoResolution(filePath: string): Promise<{ width: number; height: number }> {
  const { stdout } = await execAsync(
    `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "${filePath}"`
  );
  const [width, height] = stdout.trim().split(',').map(Number);
  return { width, height };
}

/**
 * Compress audio to fit Whisper's 25MB limit.
 * Converts to MP3 mono 16kHz which is much smaller than WAV.
 */
export async function compressAudioForWhisper(wavPath: string): Promise<string> {
  const stats = fs.statSync(wavPath);
  const maxSize = 24 * 1024 * 1024; // 24MB to be safe

  if (stats.size <= maxSize) {
    return wavPath; // Already small enough
  }

  const outputName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.mp3`;
  const outputPath = path.join(UPLOADS_DIR, outputName);

  await execAsync(
    `ffmpeg -i "${wavPath}" -ar 16000 -ac 1 -b:a 32k "${outputPath}" -y`,
    { timeout: 300_000 }
  );

  logger.info(`Audio compressed: ${stats.size} → ${fs.statSync(outputPath).size} bytes`);
  return outputPath;
}

/**
 * Split audio into chunks if it exceeds the size limit.
 * Returns array of chunk file paths.
 */
export async function splitAudioIfNeeded(audioPath: string, maxSizeBytes: number = 24 * 1024 * 1024): Promise<string[]> {
  const stats = fs.statSync(audioPath);

  if (stats.size <= maxSizeBytes) {
    return [audioPath];
  }

  // Get duration
  const duration = await getVideoDuration(audioPath);

  // Calculate number of chunks needed (aim for ~20MB each after compression)
  const numChunks = Math.ceil(stats.size / maxSizeBytes);
  const chunkDuration = Math.ceil(duration / numChunks);

  const chunks: string[] = [];

  for (let i = 0; i < numChunks; i++) {
    const start = i * chunkDuration;
    const chunkName = `${Date.now()}-chunk${i}-${crypto.randomBytes(4).toString('hex')}.mp3`;
    const chunkPath = path.join(UPLOADS_DIR, chunkName);

    await execAsync(
      `ffmpeg -i "${audioPath}" -ss ${start} -t ${chunkDuration} -ar 16000 -ac 1 -b:a 32k "${chunkPath}" -y`,
      { timeout: 120_000 }
    );

    chunks.push(chunkPath);
  }

  logger.info(`Audio split into ${chunks.length} chunks`);
  return chunks;
}

/**
 * Render a clip from the source video with vertical crop (9:16) or square (1:1).
 */
export async function renderClip(opts: {
  videoPath: string;
  startTime: number;
  endTime: number;
  format: '9:16' | '1:1' | '16:9';
  outputPath: string;
}): Promise<void> {
  const { videoPath, startTime, endTime, format, outputPath } = opts;
  const duration = endTime - startTime;

  const { width, height } = await getVideoResolution(videoPath);

  let filterComplex: string;

  if (format === '9:16') {
    // Vertical: center crop to 9:16 aspect ratio, output 1080x1920
    const cropWidth = Math.min(width, Math.round(height * 9 / 16));
    const cropHeight = Math.min(height, Math.round(cropWidth * 16 / 9));
    const cropX = Math.round((width - cropWidth) / 2);
    const cropY = Math.round((height - cropHeight) / 2);
    filterComplex = `crop=${cropWidth}:${cropHeight}:${cropX}:${cropY},scale=1080:1920`;
  } else if (format === '1:1') {
    // Square: center crop to 1:1
    const side = Math.min(width, height);
    const cropX = Math.round((width - side) / 2);
    const cropY = Math.round((height - side) / 2);
    filterComplex = `crop=${side}:${side}:${cropX}:${cropY},scale=1080:1080`;
  } else {
    // 16:9: just scale down
    filterComplex = `scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2`;
  }

  // Use output seeking (-ss after -i) for frame-accurate cuts
  await execAsync(
    `ffmpeg -i "${videoPath}" -ss ${startTime} -t ${duration} -vf "${filterComplex}" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k "${outputPath}" -y`,
    { timeout: 300_000 }
  );

  logger.info(`Clip rendered: ${outputPath}`);
}

/**
 * Convert seconds to ASS timestamp format (H:MM:SS.cc)
 */
function toASSTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`;
}

/**
 * Generate ASS subtitle content with word-level highlighting.
 */
function generateASS(opts: {
  phrases: { words: { word: string; start: number; end: number }[]; start: number; end: number }[];
  fontName: string;
  fontSize: number;
  baseColor: string;    // ASS BGR format &HBBGGRR&
  highlightColor: string;
  borderWidth: number;
  bold: boolean;
  alignment: number;
  marginV: number;
  videoWidth: number;
  videoHeight: number;
  uppercase: boolean;
  shadow?: number;
  borderStyle?: number;
  backColor?: string;
}): string {
  const { phrases, fontName, fontSize, baseColor, highlightColor, borderWidth, bold, alignment, marginV, videoWidth, videoHeight, uppercase, shadow = 0, borderStyle = 1, backColor = '&H80000000&' } = opts;

  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: ${videoWidth}
PlayResY: ${videoHeight}
WrapStyle: 0

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Default,${fontName},${fontSize},${highlightColor},${baseColor},&H00000000&,${backColor},${bold ? -1 : 0},0,0,0,100,100,0,0,${borderStyle},${borderWidth},${shadow},${alignment},40,40,${marginV},1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text`;

  const events: string[] = [];

  for (const phrase of phrases) {
    const start = toASSTime(phrase.start);
    const end = toASSTime(phrase.end);

    // Build text with per-word color overrides using karaoke-style inline tags
    // For each word, during its active time it should be highlighted
    // ASS supports \kf (karaoke fill) for progressive highlighting
    // But for word-by-word highlight, we use \k (karaoke) tags
    // \k<duration_in_centiseconds> applies highlight progressively

    const parts: string[] = [];
    for (let i = 0; i < phrase.words.length; i++) {
      const w = phrase.words[i];
      const wordText = uppercase ? w.word.toUpperCase() : w.word;
      // \k = instant highlight (whole word at once), duration in centiseconds
      const durationCs = Math.round((w.end - w.start) * 100);
      // Include trailing space in the karaoke tag so it highlights with the word
      const space = i < phrase.words.length - 1 ? ' ' : '';
      parts.push(`{\\k${durationCs}}${wordText}${space}`);
    }

    const text = parts.join('');
    events.push(`Dialogue: 0,${start},${end},Default,,0,0,0,,${text}`);
  }

  return header + '\n' + events.join('\n') + '\n';
}

/**
 * Burn captions into a video using ASS subtitles with word-level highlighting.
 */
export async function burnCaptions(opts: {
  videoPath: string;
  words: { word: string; start: number; end: number }[];
  clipStartTime: number;
  clipEndTime: number;
  style: 'classic' | 'bold-pop' | 'minimal' | 'karaoke' | 'neon-glow' | 'boxed' | 'typewriter' | 'pastel' | 'outline-only' | 'impact';
  position: 'top' | 'center' | 'bottom';
  outputPath: string;
  videoHeight?: number;
  fontOverride?: string | null;
}): Promise<void> {
  const { videoPath, words, clipStartTime, clipEndTime, style, position, outputPath, videoHeight = 1920, fontOverride } = opts;

  logger.info(`[DEBUG CAPTIONS] burnCaptions called: style=${style}, position=${position}, words=${words.length}, clipRange=${clipStartTime}-${clipEndTime}`);

  const clipWords = words.filter(w => w.start >= clipStartTime && w.end <= clipEndTime);
  logger.info(`[DEBUG CAPTIONS] clipWords after filter: ${clipWords.length}`);
  const largeTextStyles = ['bold-pop', 'karaoke', 'neon-glow', 'outline-only', 'impact'];
  const wordsPerPhrase = largeTextStyles.includes(style) ? 3 : 5;

  // Group words into phrases with individual word timing
  const phrases: { words: { word: string; start: number; end: number }[]; start: number; end: number }[] = [];
  for (let i = 0; i < clipWords.length; i += wordsPerPhrase) {
    const chunk = clipWords.slice(i, i + wordsPerPhrase);
    if (chunk.length === 0) continue;
    phrases.push({
      words: chunk.map(w => ({
        word: w.word,
        start: w.start - clipStartTime,
        end: w.end - clipStartTime,
      })),
      start: chunk[0].start - clipStartTime,
      end: chunk[chunk.length - 1].end - clipStartTime,
    });
  }

  // Style config (ASS uses &HAABBGGRR& format — &H00BBGGRR&)
  const stylesCfg: Record<string, {
    fontSize: number; baseColor: string; highlightColor: string;
    border: number; bold: boolean; fontName: string; uppercase: boolean;
    shadow?: number; borderStyle?: number; backColor?: string;
  }> = {
    'classic':      { fontSize: 100, baseColor: '&H00FFFFFF&', highlightColor: '&H0000FFFF&', border: 5, bold: false, fontName: 'Arial', uppercase: false },
    'bold-pop':     { fontSize: 130, baseColor: '&H00FFFFFF&', highlightColor: '&H0000FFFF&', border: 6, bold: true, fontName: 'Arial', uppercase: true },
    'minimal':      { fontSize: 90, baseColor: '&H00FFFFFF&', highlightColor: '&H00FFFFFF&', border: 3, bold: false, fontName: 'Arial', uppercase: false },
    'karaoke':      { fontSize: 120, baseColor: '&H00FFFFFF&', highlightColor: '&H004080FF&', border: 5, bold: true, fontName: 'Arial', uppercase: false },
    'neon-glow':    { fontSize: 110, baseColor: '&H00FFFF00&', highlightColor: '&H0000FF00&', border: 6, bold: true, fontName: 'Courier New', uppercase: false, shadow: 3 },
    'boxed':        { fontSize: 100, baseColor: '&H00FFFFFF&', highlightColor: '&H0000FFFF&', border: 0, bold: true, fontName: 'Arial', uppercase: false, borderStyle: 3, backColor: '&HCC000000&' },
    'typewriter':   { fontSize: 95, baseColor: '&H00D0D0D0&', highlightColor: '&H00FFFFFF&', border: 2, bold: false, fontName: 'Courier New', uppercase: false },
    'pastel':       { fontSize: 100, baseColor: '&H00CBC0FF&', highlightColor: '&H009090FF&', border: 4, bold: false, fontName: 'Arial', uppercase: false, shadow: 2 },
    'outline-only': { fontSize: 110, baseColor: '&H00FFFFFF&', highlightColor: '&H0000FFFF&', border: 6, bold: true, fontName: 'Helvetica', uppercase: true },
    'impact':       { fontSize: 130, baseColor: '&H00FFFFFF&', highlightColor: '&H0000FFFF&', border: 7, bold: true, fontName: 'Impact', uppercase: true },
  };
  const cfg = stylesCfg[style];

  // If user selected a font, override the style default
  const resolvedFontName = fontOverride ? (FONT_NAME_MAP[fontOverride] || cfg.fontName) : cfg.fontName;

  // ASS alignment: 8=top-center, 5=mid-center, 2=bottom-center
  const alignment = position === 'top' ? 8 : position === 'center' ? 5 : 2;
  const marginV = position === 'top' ? 100 : position === 'bottom' ? 120 : 0;

  const assContent = generateASS({
    phrases,
    fontName: resolvedFontName,
    fontSize: cfg.fontSize,
    baseColor: cfg.baseColor,
    highlightColor: cfg.highlightColor,
    borderWidth: cfg.border,
    bold: cfg.bold,
    alignment,
    marginV,
    videoWidth: 1080,
    videoHeight,
    uppercase: cfg.uppercase,
    shadow: cfg.shadow,
    borderStyle: cfg.borderStyle,
    backColor: cfg.backColor,
  });

  // Write ASS file next to output
  const assPath = outputPath.replace('.mp4', '.ass');
  fs.writeFileSync(assPath, assContent);
  logger.info(`[DEBUG CAPTIONS] ASS file written: ${assPath}, phrases: ${phrases.length}`);

  // Burn subtitles using the subtitles filter with fontsdir for reliable font loading
  const escapedAssPath = assPath.replace(/'/g, "'\\''").replace(/:/g, '\\:');
  const escapedFontsDir = FONTS_DIR.replace(/'/g, "'\\''").replace(/:/g, '\\:');
  const cmd = `ffmpeg -i "${videoPath}" -vf "subtitles='${escapedAssPath}':fontsdir='${escapedFontsDir}'" -c:v libx264 -preset fast -crf 23 -c:a copy "${outputPath}" -y`;
  logger.info(`[DEBUG CAPTIONS] Font: ${resolvedFontName}, fontsdir: ${FONTS_DIR}, cmd: ${cmd}`);
  await execAsync(cmd, { timeout: 300_000 });

  cleanupFiles(assPath);
  logger.info(`[DEBUG CAPTIONS] Captions burned successfully: ${outputPath}`);
}

/**
 * Mix background music into a video at a given volume.
 * The music loops to fill the clip duration and is mixed under the original audio.
 */
export async function mixBackgroundMusic(opts: {
  videoPath: string;
  musicTrack: string;
  volume: number;
  outputPath: string;
}): Promise<void> {
  const { videoPath, musicTrack, volume, outputPath } = opts;

  const musicPath = path.join(MUSIC_DIR, `${musicTrack}.mp3`);
  if (!fs.existsSync(musicPath)) {
    logger.warn(`Music track not found: ${musicPath}, skipping`);
    fs.copyFileSync(videoPath, outputPath);
    return;
  }

  // stream_loop -1 loops the music, volume scales it down, amix mixes with original audio
  const cmd = `ffmpeg -i "${videoPath}" -stream_loop -1 -i "${musicPath}" -filter_complex "[1:a]volume=${volume}[m];[0:a][m]amix=inputs=2:duration=first:dropout_transition=2[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 128k "${outputPath}" -y`;
  logger.info(`[DEBUG MUSIC] Mixing: track=${musicTrack}, volume=${volume}`);
  await execAsync(cmd, { timeout: 300_000 });

  logger.info(`[DEBUG MUSIC] Background music mixed: ${outputPath}`);
}

/**
 * Burn a subtle "clipfire" watermark into the bottom-right corner of a video.
 * Small, semi-transparent, non-intrusive branding.
 */
export async function burnWatermark(opts: {
  videoPath: string;
  outputPath: string;
  format: '9:16' | '1:1' | '16:9';
}): Promise<void> {
  const { videoPath, outputPath, format } = opts;

  const fontSize = format === '16:9' ? 20 : 22;
  // Position: bottom-right with padding
  const x = 'w-tw-24';
  const y = format === '9:16' ? 'h-th-40' : 'h-th-20';

  const hasDrawtext = await isDrawTextAvailable();
  if (!hasDrawtext) {
    logger.warn('drawtext not available, skipping watermark');
    if (videoPath !== outputPath) fs.copyFileSync(videoPath, outputPath);
    return;
  }

  // drawtext doesn't support fontsdir — use fontfile or default font
  const poppinsPath = path.join(FONTS_DIR, 'Poppins-SemiBold.ttf');
  const fontOpt = fs.existsSync(poppinsPath)
    ? `:fontfile='${poppinsPath.replace(/'/g, "'\\''").replace(/:/g, '\\:')}'`
    : '';
  const cmd = `ffmpeg -i "${videoPath}" -vf "drawtext=text='clipfire'${fontOpt}:fontsize=${fontSize}:fontcolor=white@0.25:shadowcolor=black@0.15:shadowx=1:shadowy=1:x=${x}:y=${y}" -c:v libx264 -preset fast -crf 23 -c:a copy "${outputPath}" -y`;

  logger.info(`[WATERMARK] Burning watermark`);
  await execAsync(cmd, { timeout: 300_000 });
  logger.info(`[WATERMARK] Done: ${outputPath}`);
}

/**
 * Clean up temporary files.
 */
export function cleanupFiles(...paths: string[]) {
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch {
      logger.warn(`Failed to clean up: ${p}`);
    }
  }
}
