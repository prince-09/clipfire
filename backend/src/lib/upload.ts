import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { MAX_VIDEO_SIZE_BYTES } from './constants.js';
import { getTempDir } from './storage.js';

const UPLOADS_DIR = path.resolve('uploads');

const ALLOWED_MIMETYPES = [
  'video/mp4',
  'video/quicktime',    // .mov
  'video/x-matroska',   // .mkv
  'video/webm',
  'video/avi',
  'video/x-msvideo',
];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    // On Cloud Run, upload to /tmp first, then we move to GCS
    cb(null, getTempDir());
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, name);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: MAX_VIDEO_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Accepted: MP4, MOV, MKV, WebM`));
    }
  },
});

export { UPLOADS_DIR };
