import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './lib/config.js';
import { logger } from './lib/logger.js';
import { errorHandler } from './middleware/error.js';
import videosRoutes from './routes/videos.js';
import clipsRoutes from './routes/clips.js';
import exportsRoutes from './routes/exports.js';
import licenseRoutes from './routes/license.js';
import userRoutes from './routes/user.js';
import { clerkMiddleware } from '@clerk/express';
import { authenticate, requirePaid } from './middleware/auth.js';
import { startCleanupScheduler } from './services/cleanup.js';

const app = express();

// Trust Railway's proxy so rate limiting uses real client IP
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json());
app.use(clerkMiddleware());

// --- Rate limiters ---

// Global: 100 requests per minute per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Strict: for expensive operations (upload, process, export)
// 5 requests per 15 minutes per IP
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded. Try again in a few minutes.' },
});

app.use('/api', globalLimiter);

// Serve uploaded videos and music tracks
app.use('/uploads', express.static(path.resolve('uploads')));
app.use('/music', express.static(path.resolve('music')));

// Apply strict limiter to expensive mutation routes
app.post('/api/projects', strictLimiter);           // Upload / create project
app.post('/api/projects/:id/process', strictLimiter);    // Triggers AI pipeline
app.post('/api/projects/:id/regenerate', strictLimiter); // Re-runs LLM only
app.use('/api/exports', strictLimiter);               // All export renders

// Auth-only routes (no payment required)
app.use('/api/license', licenseRoutes);
app.use('/api/user', userRoutes);

// Protected routes — require auth + active subscription
app.use('/api/projects', authenticate, requirePaid, videosRoutes);
app.use('/api/clips', authenticate, requirePaid, clipsRoutes);
app.use('/api/exports', authenticate, requirePaid, exportsRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`);
  startCleanupScheduler();
});

export default app;
