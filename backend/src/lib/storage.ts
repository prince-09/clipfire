import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';
import { logger } from './logger.js';

const GCS_BUCKET = process.env.GCS_BUCKET || '';
const USE_GCS = !!GCS_BUCKET;

const storage = USE_GCS ? new Storage() : null;
const bucket = storage?.bucket(GCS_BUCKET) || null;

// Local fallback dir for dev
const LOCAL_DIR = path.resolve('uploads');

/**
 * Upload a local file to GCS (or keep locally in dev).
 * Returns the stored path (GCS key or local path).
 */
export async function uploadFile(localPath: string, gcsKey?: string): Promise<string> {
  if (!USE_GCS) return localPath;

  const key = gcsKey || `uploads/${path.basename(localPath)}`;
  await bucket!.upload(localPath, { destination: key });
  logger.info(`[GCS] Uploaded ${key}`);

  // Delete local temp file after upload
  if (fs.existsSync(localPath)) fs.unlinkSync(localPath);

  return key;
}

/**
 * Download a file from GCS to a local temp path for processing.
 * In dev mode, returns the path as-is (already local).
 */
export async function downloadFile(storedPath: string, localDest?: string): Promise<string> {
  if (!USE_GCS) return storedPath;

  const dest = localDest || path.join('/tmp', path.basename(storedPath));
  await bucket!.file(storedPath).download({ destination: dest });
  logger.info(`[GCS] Downloaded ${storedPath} → ${dest}`);
  return dest;
}

/**
 * Delete a file from GCS (or local in dev).
 */
export async function deleteFile(storedPath: string): Promise<void> {
  if (!storedPath) return;

  if (!USE_GCS) {
    if (fs.existsSync(storedPath)) fs.unlinkSync(storedPath);
    return;
  }

  try {
    await bucket!.file(storedPath).delete();
    logger.info(`[GCS] Deleted ${storedPath}`);
  } catch (err: any) {
    if (err?.code !== 404) {
      logger.warn(`[GCS] Failed to delete ${storedPath}`, err);
    }
  }
}

/**
 * Generate a signed URL for downloading (valid for 1 hour).
 * In dev mode, returns the local static URL.
 */
export async function getSignedUrl(storedPath: string): Promise<string> {
  if (!USE_GCS) {
    // Dev: served via express.static
    return `/${storedPath.startsWith('/') ? storedPath.slice(1) : storedPath}`;
  }

  const [url] = await bucket!.file(storedPath).getSignedUrl({
    action: 'read',
    expires: Date.now() + 60 * 60 * 1000, // 1 hour
  });
  return url;
}

/**
 * Delete multiple files from storage.
 */
export async function deleteFiles(paths: string[]): Promise<void> {
  await Promise.all(paths.filter(Boolean).map(p => deleteFile(p)));
}

/**
 * Get the temp directory for processing.
 * Cloud Run uses /tmp (in-memory), local dev uses uploads/.
 */
export function getTempDir(): string {
  return USE_GCS ? '/tmp' : LOCAL_DIR;
}

export { USE_GCS, GCS_BUCKET };
