import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';
import { exportClipSchema, batchExportSchema } from '../lib/schemas.js';
import { renderClip, burnCaptions, mixBackgroundMusic, burnWatermark, cleanupFiles } from '../services/ffmpeg.js';
import { logger } from '../lib/logger.js';
import { UPLOADS_DIR } from '../lib/upload.js';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import archiver from 'archiver';

const router = Router();

// Export a single clip
router.post('/:id/export', validate(exportClipSchema), async (req: Request, res: Response) => {
  const clip = await prisma.clip.findUnique({
    where: { id: req.params.id as string },
    include: { project: true },
  });

  if (!clip) {
    res.status(404).json({ error: 'Clip not found' });
    return;
  }

  if (!clip.project.videoPath) {
    res.status(400).json({ error: 'Source video not available' });
    return;
  }

  const { format, captionStyle, captionPosition, captionFont, backgroundMusic, musicVolume } = req.body;

  try {
    const result = await renderAndSaveExport({
      clip,
      videoPath: clip.project.videoPath,
      projectId: clip.projectId,
      format,
      captionStyle,
      captionPosition,
      captionFont,
      backgroundMusic,
      musicVolume,
    });

    res.json({ export: result });
  } catch (err: any) {
    logger.error(`Export failed for clip ${clip.id}:`, err);
    if (err?.message?.includes('libfreetype')) {
      res.status(500).json({ error: 'Captions require FFmpeg with libfreetype. Export without captions or reinstall FFmpeg.' });
    } else {
      res.status(500).json({ error: 'Export rendering failed' });
    }
  }
});

// Batch export selected clips
router.post('/batch-export', validate(batchExportSchema), async (req: Request, res: Response) => {
  const { clipIds, format, captionStyle, captionPosition, captionFont, backgroundMusic, musicVolume } = req.body;

  const clips = await prisma.clip.findMany({
    where: { id: { in: clipIds } },
    include: { project: true },
  });

  if (clips.length === 0) {
    res.status(404).json({ error: 'No clips found' });
    return;
  }

  const results = [];

  for (const clip of clips) {
    if (!clip.project.videoPath) continue;

    try {
      const result = await renderAndSaveExport({
        clip,
        videoPath: clip.project.videoPath,
        projectId: clip.projectId,
        format,
        captionStyle,
        captionPosition,
        captionFont,
        backgroundMusic,
        musicVolume,
      });
      results.push(result);
    } catch (err) {
      logger.error(`Batch export failed for clip ${clip.id}:`, err);
    }
  }

  res.json({ exports: results, total: results.length });
});

// Download a single exported file
router.get('/download/:exportId', async (req: Request, res: Response) => {
  const exportRecord = await prisma.export.findUnique({
    where: { id: req.params.exportId as string },
    include: { clip: true },
  });

  if (!exportRecord || !fs.existsSync(exportRecord.filePath)) {
    res.status(404).json({ error: 'Export not found' });
    return;
  }

  const filename = `${exportRecord.clip.title.replace(/[^a-zA-Z0-9]/g, '_')}_${exportRecord.format.replace(':', 'x')}.mp4`;
  res.download(exportRecord.filePath, filename);
});

// Download all exported clips for a project as ZIP
router.get('/download-zip/:projectId', async (req: Request, res: Response) => {
  const exports = await prisma.export.findMany({
    where: { clip: { projectId: req.params.projectId as string } },
    include: { clip: true },
  });

  const validExports = exports.filter(e => fs.existsSync(e.filePath));

  if (validExports.length === 0) {
    res.status(404).json({ error: 'No exported clips found' });
    return;
  }

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename=clips.zip');

  const archive = archiver('zip', { zlib: { level: 1 } }); // fast compression for video
  archive.pipe(res);

  for (const exp of validExports) {
    const filename = `${exp.clip.title.replace(/[^a-zA-Z0-9]/g, '_')}_${exp.format.replace(':', 'x')}.mp4`;
    archive.file(exp.filePath, { name: filename });
  }

  await archive.finalize();
});

// --- Helper ---

async function renderAndSaveExport(opts: {
  clip: { id: string; title: string; startTime: number; endTime: number; projectId: string };
  videoPath: string;
  projectId: string;
  format: '9:16' | '1:1' | '16:9';
  captionStyle: string | null;
  captionPosition: string;
  captionFont?: string | null;
  backgroundMusic?: string | null;
  musicVolume?: number;
}) {
  const { clip, videoPath, format, captionStyle, captionPosition, captionFont, backgroundMusic, musicVolume = 0.12 } = opts;

  logger.info(`[DEBUG EXPORT] clipId=${clip.id}, captionStyle=${JSON.stringify(captionStyle)}, captionPosition=${captionPosition}, format=${format}, music=${backgroundMusic}`);

  const baseName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const tempFiles: string[] = [];

  // Pipeline: render → captions → watermark → music → final
  // Each step gets a unique temp file; only the very last step writes to finalPath.
  const needsCaptions = !!captionStyle;
  const needsMusic = !!backgroundMusic;

  const finalPath = path.join(UPLOADS_DIR, `${baseName}-final.mp4`);
  let stepNum = 0;

  const nextPath = (isLast: boolean) => {
    if (isLast) return finalPath;
    stepNum++;
    const p = path.join(UPLOADS_DIR, `${baseName}-step${stepNum}.mp4`);
    tempFiles.push(p);
    return p;
  };

  // Determine which steps remain after each one
  const stepsRemaining = [true, needsCaptions, true /* watermark */, needsMusic].filter(Boolean);

  // Step 1: Render clip with crop
  let currentPath = nextPath(stepsRemaining.length === 1);

  logger.info(`[DEBUG EXPORT] Step 1: renderClip → ${currentPath}`);
  await renderClip({
    videoPath,
    startTime: clip.startTime,
    endTime: clip.endTime,
    format: format as '9:16' | '1:1' | '16:9',
    outputPath: currentPath,
  });

  // Step 2: Burn captions if requested
  if (needsCaptions) {
    const prevPath = currentPath;
    const isLast = !needsMusic; // watermark still comes next, so not last
    currentPath = nextPath(false);

    logger.info(`[DEBUG EXPORT] Step 2: burning captions with style=${captionStyle}`);
    const transcript = await prisma.transcript.findUnique({
      where: { projectId: clip.projectId },
    });

    if (transcript) {
      const wordTimestamps = transcript.wordTimestamps as unknown as { word: string; start: number; end: number }[];

      await burnCaptions({
        videoPath: prevPath,
        words: wordTimestamps,
        clipStartTime: clip.startTime,
        clipEndTime: clip.endTime,
        style: captionStyle as any,
        position: (captionPosition || 'bottom') as 'top' | 'center' | 'bottom',
        outputPath: currentPath,
        videoHeight: format === '1:1' ? 1080 : format === '9:16' ? 1920 : 1080,
        fontOverride: captionFont || null,
      });
      logger.info(`[DEBUG EXPORT] Captions burned successfully`);
    } else {
      logger.warn(`[DEBUG EXPORT] No transcript found — skipping captions`);
      fs.copyFileSync(prevPath, currentPath);
    }
  }

  // Step 3: Burn watermark
  {
    const prevPath = currentPath;
    currentPath = nextPath(!needsMusic);

    logger.info(`[DEBUG EXPORT] Watermark step`);
    await burnWatermark({
      videoPath: prevPath,
      outputPath: currentPath,
      format: format as '9:16' | '1:1' | '16:9',
    });
  }

  // Step 4: Mix background music if requested
  if (needsMusic) {
    const prevPath = currentPath;
    currentPath = finalPath;

    logger.info(`[DEBUG EXPORT] Step 3: mixing background music=${backgroundMusic}, volume=${musicVolume}`);
    await mixBackgroundMusic({
      videoPath: prevPath,
      musicTrack: backgroundMusic,
      volume: musicVolume,
      outputPath: currentPath,
    });
  }

  // Clean up intermediate files
  cleanupFiles(...tempFiles);

  const stats = fs.statSync(finalPath);

  // Save export record
  const exportRecord = await prisma.export.create({
    data: {
      clipId: clip.id,
      format,
      captionStyle: captionStyle || null,
      filePath: finalPath,
      fileSizeBytes: stats.size,
    },
  });

  // Update clip status
  await prisma.clip.update({
    where: { id: clip.id },
    data: { exportStatus: 'exported', outputPath: finalPath },
  });

  return exportRecord;
}

export default router;
