import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { FILE_CLEANUP_DAYS } from '../lib/constants.js';
import { UPLOADS_DIR } from '../lib/upload.js';

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // Run every hour

/**
 * Delete projects older than FILE_CLEANUP_DAYS along with all their files.
 */
async function cleanupOldProjects() {
  const cutoff = new Date(Date.now() - FILE_CLEANUP_DAYS * 24 * 60 * 60 * 1000);

  const oldProjects = await prisma.project.findMany({
    where: { createdAt: { lt: cutoff } },
    include: {
      clips: { include: { exports: true } },
    },
  });

  if (oldProjects.length === 0) return;

  logger.info(`[cleanup] Found ${oldProjects.length} projects older than ${FILE_CLEANUP_DAYS} days`);

  for (const project of oldProjects) {
    // Delete export files
    for (const clip of project.clips) {
      for (const exp of clip.exports) {
        deleteFile(exp.filePath);
      }
      // Delete rendered clip file
      if (clip.outputPath) {
        deleteFile(clip.outputPath);
      }
    }

    // Delete source video
    if (project.videoPath) {
      deleteFile(project.videoPath);
    }

    // Delete DB records (exports → clips → transcript → project)
    const clipIds = project.clips.map((c) => c.id);
    if (clipIds.length > 0) {
      await prisma.export.deleteMany({ where: { clipId: { in: clipIds } } });
      await prisma.clip.deleteMany({ where: { projectId: project.id } });
    }
    await prisma.transcript.deleteMany({ where: { projectId: project.id } });
    await prisma.project.delete({ where: { id: project.id } });

    logger.info(`[cleanup] Deleted project "${project.title}" (${project.id})`);
  }
}

/**
 * Delete orphaned temp files (.wav, .ass) older than the cutoff.
 */
function cleanupTempFiles() {
  if (!fs.existsSync(UPLOADS_DIR)) return;

  const cutoffMs = Date.now() - FILE_CLEANUP_DAYS * 24 * 60 * 60 * 1000;
  const tempExtensions = ['.wav', '.ass'];

  const files = fs.readdirSync(UPLOADS_DIR);
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!tempExtensions.includes(ext)) continue;

    const filePath = path.join(UPLOADS_DIR, file);
    try {
      const stat = fs.statSync(filePath);
      if (stat.mtimeMs < cutoffMs) {
        fs.unlinkSync(filePath);
        logger.info(`[cleanup] Deleted temp file: ${file}`);
      }
    } catch {
      // File may have been deleted already
    }
  }
}

function deleteFile(filePath: string) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    logger.warn(`[cleanup] Failed to delete file: ${filePath}`, err);
  }
}

function runCleanup() {
  Promise.all([cleanupOldProjects(), cleanupTempFiles()]).catch((err) => {
    logger.error('[cleanup] Cleanup failed:', err);
  });
}

export function startCleanupScheduler() {
  logger.info(`[cleanup] Scheduler started — deleting projects older than ${FILE_CLEANUP_DAYS} days, checking every hour`);
  // Run once on startup, then on interval
  runCleanup();
  setInterval(runCleanup, CLEANUP_INTERVAL_MS);
}
