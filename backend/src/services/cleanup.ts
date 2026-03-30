import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { FILE_CLEANUP_DAYS } from '../lib/constants.js';
import { deleteFile } from '../lib/storage.js';

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

async function cleanupOldProjects() {
  const cutoff = new Date(Date.now() - FILE_CLEANUP_DAYS * 24 * 60 * 60 * 1000);

  const oldProjects = await prisma.project.findMany({
    where: { createdAt: { lt: cutoff } },
    include: { clips: { include: { exports: true } } },
  });

  if (oldProjects.length === 0) return;

  logger.info(`[cleanup] Found ${oldProjects.length} projects older than ${FILE_CLEANUP_DAYS} days`);

  for (const project of oldProjects) {
    for (const clip of project.clips) {
      for (const exp of clip.exports) {
        await deleteFile(exp.filePath);
      }
      if (clip.outputPath) await deleteFile(clip.outputPath);
    }

    if (project.videoPath) await deleteFile(project.videoPath);

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

function runCleanup() {
  cleanupOldProjects().catch((err) => {
    logger.error('[cleanup] Cleanup failed:', err);
  });
}

export function startCleanupScheduler() {
  logger.info(`[cleanup] Scheduler started — deleting projects older than ${FILE_CLEANUP_DAYS} days, checking every hour`);
  runCleanup();
  setInterval(runCleanup, CLEANUP_INTERVAL_MS);
}
