import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { upload, UPLOADS_DIR } from '../lib/upload.js';
import { logger } from '../lib/logger.js';
import { runPipeline, regenerateClips } from '../services/pipeline.js';
import { AuthRequest } from '../middleware/auth.js';
import { MAX_VIDEO_SIZE_BYTES } from '../lib/constants.js';
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

    // Must have either a file or a YouTube URL
    if (!req.file && !sourceUrl) {
      res.status(400).json({ error: 'Provide a video file or YouTube URL' });
      return;
    }

    let videoPath: string | null = null;
    let status = 'uploading';

    // Case 1: Direct file upload
    if (req.file) {
      videoPath = req.file.path;
      status = 'uploaded';
      logger.info(`File uploaded: ${req.file.originalname} → ${req.file.filename}`);
    }

    // Create project in DB
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
    if (videoPath) {
      getVideoDuration(project.id, videoPath);
    }

    res.status(201).json({ project });
  } catch (err: unknown) {
    // Multer errors (file too large, wrong type)
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

    // Deduct credits upfront
    await prisma.user.update({
      where: { id: req.userId! },
      data: { creditsUsed: { increment: videoDuration } },
    });
  }

  // Start pipeline in background
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

  // Must have an existing transcript
  const transcript = await prisma.transcript.findUnique({ where: { projectId: project.id } });
  if (!transcript) {
    res.status(400).json({ error: 'No transcript found. Run full processing first.' });
    return;
  }

  // Run LLM-only regeneration in background
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

  // Clean up video file
  if (project.videoPath && fs.existsSync(project.videoPath)) {
    fs.unlinkSync(project.videoPath);
  }

  // Delete related records then project (exports → clips → transcript)
  const clips = await prisma.clip.findMany({ where: { projectId: project.id }, select: { id: true } });
  if (clips.length > 0) {
    await prisma.export.deleteMany({ where: { clipId: { in: clips.map(c => c.id) } } });
  }
  await prisma.clip.deleteMany({ where: { projectId: project.id } });
  await prisma.transcript.deleteMany({ where: { projectId: project.id } });
  await prisma.project.delete({ where: { id: project.id } });

  res.json({ message: 'Project deleted' });
});

// --- Background helpers (fire-and-forget for now, will move to job queue later) ---

async function getVideoDuration(projectId: string, filePath: string) {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`
    );
    const duration = Math.round(parseFloat(stdout.trim()));
    await prisma.project.update({
      where: { id: projectId },
      data: { durationSeconds: duration },
    });
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
    const outputPath = path.join(UPLOADS_DIR, filename);

    logger.info(`Downloading YouTube video: ${url}`);

    // Download at 720p max to keep file sizes small
    await execAsync(
      `yt-dlp -f "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best[height<=720]" --merge-output-format mp4 -o "${outputPath}" "${url}"`,
      { timeout: 600_000 } // 10 min timeout
    );

    // If file is over 40MB, truncate to fit using ffmpeg
    const fileSize = fs.statSync(outputPath).size;
    if (fileSize > MAX_VIDEO_SIZE_BYTES) {
      // Estimate how many seconds fit in 40MB based on current bitrate
      const { stdout: durStr } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of csv=p=0 "${outputPath}"`
      );
      const fullDuration = parseFloat(durStr.trim());
      const maxDuration = Math.floor(fullDuration * (MAX_VIDEO_SIZE_BYTES / fileSize));

      const trimmedPath = outputPath.replace('.mp4', '-trimmed.mp4');
      await execAsync(
        `ffmpeg -y -i "${outputPath}" -t ${maxDuration} -c copy "${trimmedPath}"`,
        { timeout: 300_000 }
      );
      fs.unlinkSync(outputPath);
      fs.renameSync(trimmedPath, outputPath);
      logger.info(`Trimmed video to ${maxDuration}s to fit 40MB limit`);
    }

    // Get duration
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${outputPath}"`
    );
    const duration = Math.round(parseFloat(stdout.trim()));

    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'uploaded',
        videoPath: outputPath,
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
