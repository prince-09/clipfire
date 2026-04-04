import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';
import { exportClipSchema, batchExportSchema } from '../lib/schemas.js';
import { renderClip, burnCaptions, mixBackgroundMusic, burnWatermark, cleanupFiles } from '../services/ffmpeg.js';
import { logger } from '../lib/logger.js';
import { downloadFile, uploadFile, getSignedUrl, getTempDir } from '../lib/storage.js';
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

// Download a single exported file (returns signed URL for GCS)
router.get('/download/:exportId', async (req: Request, res: Response) => {
  const exportRecord = await prisma.export.findUnique({
    where: { id: req.params.exportId as string },
    include: { clip: true },
  });

  if (!exportRecord) {
    res.status(404).json({ error: 'Export not found' });
    return;
  }

  const url = await getSignedUrl(exportRecord.filePath);
  const filename = `${exportRecord.clip.title.replace(/[^a-zA-Z0-9]/g, '_')}_${exportRecord.format.replace(':', 'x')}.mp4`;
  res.json({ url, filename });
});

// Download all exported clips for a project as ZIP
router.get('/download-zip/:projectId', async (req: Request, res: Response) => {
  const exports = await prisma.export.findMany({
    where: { clip: { projectId: req.params.projectId as string } },
    include: { clip: true },
  });

  if (exports.length === 0) {
    res.status(404).json({ error: 'No exported clips found' });
    return;
  }

  // Download all exports from GCS to temp for zipping
  const tempDir = getTempDir();
  const tempFiles: string[] = [];
  const fileEntries: { localPath: string; filename: string }[] = [];

  for (const exp of exports) {
    try {
      const localPath = await downloadFile(exp.filePath, path.join(tempDir, `zip-${crypto.randomBytes(4).toString('hex')}.mp4`));
      const filename = `${exp.clip.title.replace(/[^a-zA-Z0-9]/g, '_')}_${exp.format.replace(':', 'x')}.mp4`;
      fileEntries.push({ localPath, filename });
      if (localPath !== exp.filePath) tempFiles.push(localPath);
    } catch (err) {
      logger.warn(`Failed to download export ${exp.id} for zip`, err);
    }
  }

  if (fileEntries.length === 0) {
    res.status(404).json({ error: 'No exported clips available' });
    return;
  }

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename=clips.zip');

  const archive = archiver('zip', { zlib: { level: 1 } });
  archive.pipe(res);

  for (const entry of fileEntries) {
    archive.file(entry.localPath, { name: entry.filename });
  }

  await archive.finalize();

  // Clean up temp files after streaming
  cleanupFiles(...tempFiles);
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

  // Download source video from GCS to local temp for FFmpeg
  const localVideoPath = await downloadFile(videoPath);

  const tempDir = getTempDir();
  const baseName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const tempFiles: string[] = []; // track intermediate files for cleanup
  // Also clean up the downloaded source if it's a temp copy
  if (localVideoPath !== videoPath) tempFiles.push(localVideoPath);

  // Pipeline: render → captions → watermark → music → final
  const needsCaptions = !!captionStyle;
  const needsMusic = !!backgroundMusic;

  const finalLocalPath = path.join(tempDir, `${baseName}-final.mp4`);
  let stepNum = 0;

  const nextPath = (isLast: boolean) => {
    if (isLast) return finalLocalPath;
    stepNum++;
    const p = path.join(tempDir, `${baseName}-step${stepNum}.mp4`);
    tempFiles.push(p);
    return p;
  };

  const stepsRemaining = [true, needsCaptions, true /* watermark */, needsMusic].filter(Boolean);

  // Step 1: Render clip with crop
  let currentPath = nextPath(stepsRemaining.length === 1);

  logger.info(`[DEBUG EXPORT] Step 1: renderClip → ${currentPath}`);
  await renderClip({
    videoPath: localVideoPath,
    startTime: clip.startTime,
    endTime: clip.endTime,
    format: format as '9:16' | '1:1' | '16:9',
    outputPath: currentPath,
  });

  // Step 2: Burn captions if requested
  if (needsCaptions) {
    const prevPath = currentPath;
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
    currentPath = finalLocalPath;

    logger.info(`[DEBUG EXPORT] Step 3: mixing background music=${backgroundMusic}, volume=${musicVolume}`);
    await mixBackgroundMusic({
      videoPath: prevPath,
      musicTrack: backgroundMusic,
      volume: musicVolume,
      outputPath: currentPath,
    });
  }

  // Clean up intermediate files (not the final)
  cleanupFiles(...tempFiles);

  const stats = fs.statSync(finalLocalPath);

  // Upload final export to GCS
  const gcsKey = `exports/${baseName}-final.mp4`;
  const storedPath = await uploadFile(finalLocalPath, gcsKey);

  // Save export record
  const exportRecord = await prisma.export.create({
    data: {
      clipId: clip.id,
      format,
      captionStyle: captionStyle || null,
      filePath: storedPath,
      fileSizeBytes: stats.size,
    },
  });

  // Update clip status
  await prisma.clip.update({
    where: { id: clip.id },
    data: { exportStatus: 'exported', outputPath: storedPath },
  });

  return exportRecord;
}

export default router;
