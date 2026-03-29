import OpenAI from 'openai';
import { logger } from '../lib/logger.js';
import { TARGET_CLIPS_MIN, TARGET_CLIPS_MAX, MIN_CLIP_DURATION_SECONDS, MAX_CLIP_DURATION_SECONDS } from '../lib/constants.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface DetectedClip {
  title: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  segmentType: string;
  transcriptExcerpt: string;
  confidenceScore: number;
  viralScore: number;
  scoreBreakdown: {
    hookStrength: number;
    emotionalIntensity: number;
    clarity: number;
    curiosityGap: number;
    durationFit: number;
    speechEnergy: number;
  };
  hooks: string[];
  caption: string;
  hashtags: string[];
}

/**
 * Analyze transcript with OpenAI GPT-4o-mini to detect viral clips, generate hooks & captions.
 */
export async function detectClips(
  fullText: string,
  wordTimestamps: WordTimestamp[],
  videoDuration: number
): Promise<DetectedClip[]> {
  const prompt = buildPrompt(fullText, wordTimestamps, videoDuration);

  logger.info('Sending transcript to OpenAI for clip detection...');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a viral content analyst. You identify the most engaging, shareable moments from video transcripts. You output ONLY valid JSON arrays — no markdown, no explanation, no code blocks.`
      },
      { role: 'user', content: prompt }
    ],
    temperature: 0.5,
    max_tokens: 8192,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from LLM');
  }

  // Parse JSON from response
  let parsed: { clips?: DetectedClip[] };

  try {
    parsed = JSON.parse(content);
  } catch {
    logger.error('Failed to parse LLM response as JSON:', content);
    throw new Error('LLM returned invalid JSON');
  }

  let clips = parsed.clips || (Array.isArray(parsed) ? parsed : []);

  if (!Array.isArray(clips)) {
    throw new Error('LLM response does not contain clips array');
  }

  const rawCount = clips.length;

  // Validate and clean up clips
  clips = clips
    .filter((c: DetectedClip) => {
      if (c.startTime == null || c.endTime == null || c.endTime <= c.startTime) {
        logger.info(`Filtered out clip "${c.title}": invalid timestamps (start=${c.startTime}, end=${c.endTime})`);
        return false;
      }
      const dur = c.endTime - c.startTime;
      if (dur < MIN_CLIP_DURATION_SECONDS || dur > MAX_CLIP_DURATION_SECONDS) {
        logger.info(`Filtered out clip "${c.title}": duration ${dur.toFixed(1)}s outside ${MIN_CLIP_DURATION_SECONDS}-${MAX_CLIP_DURATION_SECONDS}s range`);
        return false;
      }
      return true;
    })
    .map((c: DetectedClip) => ({
      title: c.title || 'Untitled Clip',
      startTime: Math.round(c.startTime * 100) / 100,
      endTime: Math.round(c.endTime * 100) / 100,
      durationSeconds: Math.round((c.endTime - c.startTime) * 100) / 100,
      segmentType: c.segmentType || 'quotable_moment',
      transcriptExcerpt: c.transcriptExcerpt || '',
      confidenceScore: Math.min(1, Math.max(0, c.confidenceScore || 0.5)),
      viralScore: Math.min(10, Math.max(0, c.viralScore || 5)),
      scoreBreakdown: {
        hookStrength: c.scoreBreakdown?.hookStrength ?? 5,
        emotionalIntensity: c.scoreBreakdown?.emotionalIntensity ?? 5,
        clarity: c.scoreBreakdown?.clarity ?? 5,
        curiosityGap: c.scoreBreakdown?.curiosityGap ?? 5,
        durationFit: c.scoreBreakdown?.durationFit ?? 5,
        speechEnergy: c.scoreBreakdown?.speechEnergy ?? 5,
      },
      hooks: Array.isArray(c.hooks) ? c.hooks.slice(0, 3) : [],
      caption: c.caption || '',
      hashtags: Array.isArray(c.hashtags) ? c.hashtags.slice(0, 10) : [],
    }));

  logger.info(`LLM returned ${rawCount} clips, ${clips.length} passed validation`);
  return clips;
}

function buildPrompt(fullText: string, wordTimestamps: WordTimestamp[], videoDuration: number): string {
  // Build a timestamped transcript for the LLM
  const lines: string[] = [];
  const wordsPerLine = 15;

  for (let i = 0; i < wordTimestamps.length; i += wordsPerLine) {
    const chunk = wordTimestamps.slice(i, i + wordsPerLine);
    const timestamp = formatTimestamp(chunk[0].start);
    const text = chunk.map(w => w.word).join(' ');
    lines.push(`[${timestamp}] ${text}`);
  }

  const timestampedTranscript = lines.join('\n');

  return `Analyze this video transcript (${Math.round(videoDuration / 60)} minutes long) and find the ${TARGET_CLIPS_MIN}-${TARGET_CLIPS_MAX} most viral-worthy moments.

TIMESTAMPED TRANSCRIPT:
${timestampedTranscript}

REQUIREMENTS:
- Each clip must be ${MIN_CLIP_DURATION_SECONDS}-${MAX_CLIP_DURATION_SECONDS} seconds long
- IMPORTANT: Vary clip durations naturally based on the content. Some clips should be 40s, some 50s, some 60s, some 70s. Do NOT make all clips the same length. Let the content dictate the natural start and end points.
- Use the exact timestamps from the transcript
- Clips should NOT overlap
- Prioritize: strong hooks, emotional peaks, quotable moments, educational insights, funny moments, controversial takes
- Score each clip 0-10 for viral potential

SEGMENT TYPES (pick one per clip):
- strong_hook: Grabs attention in first 3 seconds
- educational_insight: Clear, shareable "aha" moment
- debate_opinion: Controversial or bold take
- funny_moment: Laughter, wit, or unexpected reaction
- storytelling: Narrative arc with emotional pull
- emotional_peak: Vulnerable or deeply relatable moment
- quotable_moment: Short, punchy, caption-worthy line

For each clip, also generate:
- 3 hook options (attention-grabbing first lines for social posts)
- 1 caption (2-3 sentences for the post)
- 5-10 relevant hashtags

Return a JSON object with a "clips" array using this exact structure:
{
  "clips": [
    {
      "title": "clip title",
      "startTime": 12.5,
      "endTime": 67.8,
      "durationSeconds": 55.3,
      "segmentType": "strong_hook",
      "transcriptExcerpt": "first 20 words of the clip...",
      "confidenceScore": 0.87,
      "viralScore": 8.4,
      "scoreBreakdown": {
        "hookStrength": 9,
        "emotionalIntensity": 7,
        "clarity": 8,
        "curiosityGap": 9,
        "durationFit": 8,
        "speechEnergy": 7
      },
      "hooks": [
        "Nobody talks about this...",
        "This one mistake costs you...",
        "The truth about..."
      ],
      "caption": "Most people get this wrong. Here's what actually works...",
      "hashtags": ["#productivity", "#mindset", "#growth"]
    }
  ]
}`;
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
