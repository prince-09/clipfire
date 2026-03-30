import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { upload } from '../lib/upload.js';
import { logger } from '../lib/logger.js';
import { runPipeline, regenerateClips } from '../services/pipeline.js';
import { AuthRequest } from '../middleware/auth.js';
import { MAX_VIDEO_SIZE_BYTES } from '../lib/constants.js';
import { uploadFile, deleteFile, downloadFile, getTempDir } from '../lib/storage.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

const execAsync = promisify(exec);
const router = Router();

// List all projects for current user
router.get('/', async (req: AuthRequest, res: Response) => {
  const projects = await prisma.project.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: 'desc' },
  });

  const projectsWithCount = await Promise.all(
    projects.map(async (p) => ({
      id: p.id,
      title: p.title,
      status: p.status,
      sourceUrl: p.sourceUrl,
      durationSeconds: p.durationSeconds,
      clipCount: await prisma.clip.count({ where: { projectId: p.id } }),
      createdAt: p.createdAt,
    }))
  );

  res.json({ projects: projectsWithCount });
});

// Get single project (scoped to user)
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const project = await prisma.project.findFirst({
    where: { id: req.params.id as string, userId: req.userId! },
    include: {
      clips: { orderBy: { confidenceScore: 'desc' } },
      transcript: { select: { id: true, language: true, createdAt: true } },
    },
  });

  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  res.json({ project });
});

// Create project — file upload or YouTube URL
router.post('/', upload.single('video'), async (req: AuthRequest, res: Response) => {
  try {
    const title = req.body.title?.trim();
    const sourceUrl = req.body.sourceUrl?.trim();

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    if (!req.file && !sourceUrl) {
      res.status(400).json({ error: 'Provide a video file or YouTube URL' });
      return;
    }

    let videoPath: string | null = null;
    let status = 'uploading';

    // Case 1: Direct file upload — upload to GCS
    if (req.file) {
      const gcsKey = `uploads/${req.file.filename}`;
      videoPath = await uploadFile(req.file.path, gcsKey);
      status = 'uploaded';
      logger.info(`File uploaded: ${req.file.originalname} → ${videoPath}`);
    }

    const project = await prisma.project.create({
      data: {
        userId: req.userId!,
        title,
        status,
        sourceUrl: sourceUrl || null,
        videoPath,
      },
    });

    // Case 2: YouTube URL — download in background
    if (sourceUrl && !req.file) {
      downloadYouTubeVideo(project.id, sourceUrl);
    }

    // If file was uploaded, get duration
    if (req.file && videoPath) {
      getVideoDuration(project.id, videoPath);
    }

    res.status(201).json({ project });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err) {
      const multerErr = err as { code: string; message: string };
      if (multerErr.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ error: 'File too large. Maximum size is 2GB.' });
        return;
      }
    }
    throw err;
  }
});

// Trigger processing pipeline
router.post('/:id/process', async (req: AuthRequest, res: Response) => {
  const project = await prisma.project.findFirst({
    where: { id: req.params.id as string, userId: req.userId! },
  });

  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  if (!project.videoPath) {
    res.status(400).json({ error: 'No video file available yet' });
    return;
  }

  if (project.status === 'processing') {
    res.status(409).json({ error: 'Already processing' });
    return;
  }

  // Check credits
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (user) {
    const remaining = user.creditsTotal - user.creditsUsed;
    const videoDuration = project.durationSeconds || 0;

    if (remaining <= 0) {
      res.status(403).json({
        error: 'No credits remaining. Please upgrade your plan.',
        code: 'NO_CREDITS',
      });
      return;
    }

    if (videoDuration > remaining) {
      const remainingMin = Math.floor(remaining / 60);
      res.status(403).json({
        error: `Not enough credits. You have ${remainingMin} min left but this video is ${Math.ceil(videoDuration / 60)} min.`,
        code: 'INSUFFICIENT_CREDITS',
      });
      return;
    }

    await prisma.user.update({
      where: { id: req.userId! },
      data: { creditsUsed: { increment: videoDuration } },
    });
  }

  runPipeline(project.id).catch((err) => {
    logger.error(`Pipeline failed for ${project.id}:`, err);
  });

  res.json({ message: 'Processing started', projectId: project.id });
});

// Regenerate clips (LLM only — no Whisper, no credit cost)
router.post('/:id/regenerate', async (req: AuthRequest, res: Response) => {
  const project = await prisma.project.findFirst({
    where: { id: req.params.id as string, userId: req.userId! },
  });

  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  if (project.status === 'processing') {
    res.status(409).json({ error: 'Already processing' });
    return;
  }

  const transcript = await prisma.transcript.findUnique({ where: { projectId: project.id } });
  if (!transcript) {
    res.status(400).json({ error: 'No transcript found. Run full processing first.' });
    return;
  }

  regenerateClips(project.id).catch((err) => {
    logger.error(`Regenerate failed for ${project.id}:`, err);
  });

  res.json({ message: 'Regenerating clips', projectId: project.id });
});

// Delete project
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const project = await prisma.project.findFirst({
    where: { id: req.params.id as string, userId: req.userId! },
  });

  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  // Clean up video file from storage
  if (project.videoPath) {
    await deleteFile(project.videoPath);
  }

  // Clean up export files
  const clips = await prisma.clip.findMany({
    where: { projectId: project.id },
    select: { id: true, outputPath: true, exports: { select: { filePath: true } } },
  });
  for (const clip of clips) {
    if (clip.outputPath) await deleteFile(clip.outputPath);
    for (const exp of clip.exports) {
      await deleteFile(exp.filePath);
    }
  }

  // Delete DB records
  const clipIds = clips.map(c => c.id);
  if (clipIds.length > 0) {
    await prisma.export.deleteMany({ where: { clipId: { in: clipIds } } });
  }
  await prisma.clip.deleteMany({ where: { projectId: project.id } });
  await prisma.transcript.deleteMany({ where: { projectId: project.id } });
  await prisma.project.delete({ where: { id: project.id } });

  res.json({ message: 'Project deleted' });
});

// --- Background helpers ---

async function getVideoDuration(projectId: string, storedPath: string) {
  try {
    // Download from GCS to local for ffprobe
    const localPath = await downloadFile(storedPath);
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${localPath}"`
    );
    const duration = Math.round(parseFloat(stdout.trim()));
    await prisma.project.update({
      where: { id: projectId },
      data: { durationSeconds: duration },
    });
    // Clean up local temp if it's different from stored
    if (localPath !== storedPath && fs.existsSync(localPath)) fs.unlinkSync(localPath);
    logger.info(`Duration detected: ${duration}s for project ${projectId}`);
  } catch (err) {
    logger.error(`Failed to get duration for project ${projectId}`, err);
  }
}

async function downloadYouTubeVideo(projectId: string, url: string) {
  try {
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'downloading' },
    });

    const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.mp4`;
    const tempDir = getTempDir();
    const tempPath = path.join(tempDir, filename);

    logger.info(`Downloading YouTube video: ${url}`);

    await execAsync(
      `yt-dlp -f "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best[height<=720]" --merge-output-format mp4 -o "${tempPath}" "${url}"`,
      { timeout: 600_000 }
    );

    // Trim if too large
    const fileSize = fs.statSync(tempPath).size;
    if (fileSize > MAX_VIDEO_SIZE_BYTES) {
      const { stdout: durStr } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of csv=p=0 "${tempPath}"`
      );
      const fullDuration = parseFloat(durStr.trim());
      const maxDuration = Math.floor(fullDuration * (MAX_VIDEO_SIZE_BYTES / fileSize));

      const trimmedPath = tempPath.replace('.mp4', '-trimmed.mp4');
      await execAsync(
        `ffmpeg -y -i "${tempPath}" -t ${maxDuration} -c copy "${trimmedPath}"`,
        { timeout: 300_000 }
      );
      fs.unlinkSync(tempPath);
      fs.renameSync(trimmedPath, tempPath);
      logger.info(`Trimmed video to ${maxDuration}s to fit size limit`);
    }

    // Get duration
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${tempPath}"`
    );
    const duration = Math.round(parseFloat(stdout.trim()));

    // Upload to GCS
    const gcsKey = `uploads/${filename}`;
    const storedPath = await uploadFile(tempPath, gcsKey);

    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'uploaded',
        videoPath: storedPath,
        durationSeconds: duration,
      },
    });

    logger.info(`YouTube download complete: ${filename} (${duration}s)`);
  } catch (err) {
    logger.error(`YouTube download failed for project ${projectId}`, err);
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'failed',
        errorMessage: err instanceof Error ? err.message : 'YouTube download failed',
      },
    });
  }
}

export default router;
