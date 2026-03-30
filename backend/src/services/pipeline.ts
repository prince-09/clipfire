import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { extractAudio, getVideoDuration, cleanupFiles } from './ffmpeg.js';
import { transcribeAudio } from './whisper.js';
import { detectClips } from './llm.js';
import { downloadFile } from '../lib/storage.js';
import fs from 'fs';

/**
 * Run the full processing pipeline for a project.
 * Skips steps that are already completed (e.g., transcription on retry).
 */
export async function runPipeline(projectId: string): Promise<void> {
  let audioPath: string | null = null;
  let localVideoPath: string | null = null;

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });

    if (!project || !project.videoPath) {
      throw new Error('Project not found or no video file');
    }

    // Update status
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'processing', errorMessage: null },
    });

    // Download video from GCS to local temp for FFmpeg processing
    localVideoPath = await downloadFile(project.videoPath);

    // Step 1: Get video duration (if not already set)
    let duration = project.durationSeconds;
    if (!duration) {
      logger.info(`[Pipeline] Step 1: Getting video duration...`);
      duration = await getVideoDuration(localVideoPath);
      await prisma.project.update({
        where: { id: projectId },
        data: { durationSeconds: duration },
      });
    } else {
      logger.info(`[Pipeline] Step 1: Duration already known (${duration}s), skipping.`);
    }

    // Cap processing to first 6 minutes
    const MAX_DURATION_SECONDS = 360;
    if (duration > MAX_DURATION_SECONDS) {
      logger.info(`[Pipeline] Video is ${Math.ceil(duration / 60)} min, capping to first ${MAX_DURATION_SECONDS / 60} min`);
      duration = MAX_DURATION_SECONDS;
    }

    // Step 2 & 3: Check if transcript already exists
    let transcript = await prisma.transcript.findUnique({
      where: { projectId },
    });

    if (transcript) {
      logger.info(`[Pipeline] Steps 2-3: Transcript already exists (${(transcript.wordTimestamps as unknown as unknown[]).length} words), skipping.`);
    } else {
      // Step 2: Extract audio
      logger.info(`[Pipeline] Step 2: Extracting audio...`);
      audioPath = await extractAudio(localVideoPath, duration);

      // Step 3: Transcribe with Whisper
      logger.info(`[Pipeline] Step 3: Transcribing with Whisper...`);
      const transcription = await transcribeAudio(audioPath);

      transcript = await prisma.transcript.create({
        data: {
          projectId,
          fullText: transcription.fullText,
          wordTimestamps: transcription.wordTimestamps as unknown as Prisma.InputJsonValue,
          language: transcription.language,
        },
      });

      logger.info(`[Pipeline] Transcript saved: ${transcription.wordTimestamps.length} words`);
    }

    // Step 4: Detect clips with LLM (always re-run on retry — clips are the thing that failed)
    // Delete any existing exports and clips first (partial state from previous failed run)
    const existingClips = await prisma.clip.findMany({ where: { projectId }, select: { id: true } });
    if (existingClips.length > 0) {
      await prisma.export.deleteMany({ where: { clipId: { in: existingClips.map(c => c.id) } } });
    }
    await prisma.clip.deleteMany({ where: { projectId } });

    const wordTimestamps = transcript.wordTimestamps as unknown as { word: string; start: number; end: number }[];

    logger.info(`[Pipeline] Step 4: Detecting clips with LLM...`);
    const detectedClips = await detectClips(
      transcript.fullText,
      wordTimestamps,
      duration
    );

    // Save clips to DB
    if (detectedClips.length === 0) {
      throw new Error('No valid clips detected. Try processing again.');
    }

    await prisma.clip.createMany({
      data: detectedClips.map(c => ({
        projectId,
        title: c.title,
        startTime: c.startTime,
        endTime: c.endTime,
        durationSeconds: c.durationSeconds,
        segmentType: c.segmentType,
        transcriptExcerpt: c.transcriptExcerpt,
        confidenceScore: c.confidenceScore,
        viralScore: c.viralScore,
        scoreBreakdown: c.scoreBreakdown as unknown as Prisma.InputJsonValue,
        hooks: c.hooks as unknown as Prisma.InputJsonValue,
        caption: c.caption,
        hashtags: c.hashtags as unknown as Prisma.InputJsonValue,
        isSelected: true,
        exportStatus: 'pending',
      })),
    });

    // Update project status
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'ready' },
    });

    logger.info(`[Pipeline] Complete! ${detectedClips.length} clips detected for project ${projectId}`);
  } catch (err) {
    logger.error(`[Pipeline] Failed for project ${projectId}:`, err);

    // Refund credits on failure
    const failedProject = await prisma.project.findUnique({ where: { id: projectId } });
    if (failedProject?.userId && failedProject.durationSeconds) {
      await prisma.user.update({
        where: { id: failedProject.userId },
        data: { creditsUsed: { decrement: failedProject.durationSeconds } },
      });
      logger.info(`[Pipeline] Refunded ${failedProject.durationSeconds}s credits to user ${failedProject.userId}`);
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'failed',
        errorMessage: err instanceof Error ? err.message : 'Processing failed',
      },
    });

    throw err;
  } finally {
    if (audioPath) cleanupFiles(audioPath);
    // Clean up local temp video downloaded from GCS
    if (localVideoPath && localVideoPath.startsWith('/tmp') && fs.existsSync(localVideoPath)) {
      fs.unlinkSync(localVideoPath);
    }
  }
}

/**
 * Re-run only the LLM clip detection using the existing transcript.
 * No Whisper call, no credit deduction.
 */
export async function regenerateClips(projectId: string): Promise<void> {
  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error('Project not found');

    const transcript = await prisma.transcript.findUnique({ where: { projectId } });
    if (!transcript) throw new Error('No transcript found');

    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'processing', errorMessage: null },
    });

    // Delete existing exports and clips
    const existingClips = await prisma.clip.findMany({ where: { projectId }, select: { id: true } });
    if (existingClips.length > 0) {
      await prisma.export.deleteMany({ where: { clipId: { in: existingClips.map(c => c.id) } } });
    }
    await prisma.clip.deleteMany({ where: { projectId } });

    const wordTimestamps = transcript.wordTimestamps as unknown as { word: string; start: number; end: number }[];
    // Use the actual transcript duration (last word's end time), not the full video duration
    const lastWord = wordTimestamps[wordTimestamps.length - 1];
    const duration = lastWord ? Math.ceil(lastWord.end) : (project.durationSeconds || 360);

    logger.info(`[Regenerate] Re-detecting clips with LLM for project ${projectId} (transcript duration: ${duration}s)...`);
    const detectedClips = await detectClips(transcript.fullText, wordTimestamps, duration);

    if (detectedClips.length === 0) {
      throw new Error('No valid clips detected. Try regenerating again.');
    }

    await prisma.clip.createMany({
      data: detectedClips.map(c => ({
        projectId,
        title: c.title,
        startTime: c.startTime,
        endTime: c.endTime,
        durationSeconds: c.durationSeconds,
        segmentType: c.segmentType,
        transcriptExcerpt: c.transcriptExcerpt,
        confidenceScore: c.confidenceScore,
        viralScore: c.viralScore,
        scoreBreakdown: c.scoreBreakdown as unknown as Prisma.InputJsonValue,
        hooks: c.hooks as unknown as Prisma.InputJsonValue,
        caption: c.caption,
        hashtags: c.hashtags as unknown as Prisma.InputJsonValue,
        isSelected: true,
        exportStatus: 'pending',
      })),
    });

    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'ready' },
    });

    logger.info(`[Regenerate] Complete! ${detectedClips.length} clips for project ${projectId}`);
  } catch (err) {
    logger.error(`[Regenerate] Failed for project ${projectId}:`, err);
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'failed',
        errorMessage: err instanceof Error ? err.message : 'Regeneration failed',
      },
    });
    throw err;
  }
}
