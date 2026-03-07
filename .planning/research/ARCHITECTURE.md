# Architecture Research — AI Video Repurposer

## System Components

```
                    +-------------------+
                    |   Next.js App     |
                    |   (Frontend)      |
                    |   - Pages/UI      |
                    |   - API Routes    |
                    |     (BFF proxy)   |
                    +--------+----------+
                             |
                             | HTTP/REST
                             |
                    +--------v----------+
                    |   Express API     |
                    |   (Backend)       |
                    |   - Auth          |
                    |   - CRUD          |
                    |   - Job dispatch  |
                    +---+----------+----+
                        |          |
                   +----v---+  +---v---------+
                   | Prisma |  |   BullMQ    |
                   |   +    |  |   (Redis)   |
                   | PostgreSQL|  +---+-------+
                   +---------+      |
                                    | Job Workers
                              +-----v-----------+
                              |  Video Pipeline  |
                              |  - FFmpeg        |
                              |  - Whisper API   |
                              |  - LLM API       |
                              +-----+------------+
                                    |
                              +-----v-----+
                              |    S3     |
                              | (Storage) |
                              +-----------+
```

## Component Boundaries

### Frontend (Next.js)
- **Owns:** UI rendering, client-side state, form validation
- **Talks to:** Express API only (never directly to DB, Redis, or S3)
- **BFF pattern:** Next.js API routes can proxy to Express if needed for auth cookies
- **Does NOT:** Process video, call AI APIs, manage jobs

### Backend (Express)
- **Owns:** Business logic, auth, data validation, job orchestration
- **Talks to:** PostgreSQL (via Prisma), Redis (via BullMQ), S3 (via AWS SDK)
- **Dispatches:** Video processing jobs to BullMQ workers
- **Does NOT:** Render UI, hold video files in memory long-term

### Workers (BullMQ)
- **Owns:** Long-running video processing pipeline
- **Runs in:** Same Node.js process (MVP) or separate process (scale later)
- **Pipeline steps:** Each step is a separate job for reliability
- **Reports:** Progress back via BullMQ job progress events
- **Does NOT:** Handle HTTP requests, serve API responses

### Storage (S3)
- **Owns:** Video files, audio files, rendered clips, thumbnails
- **Access:** Pre-signed URLs for upload (frontend -> S3 direct) and download
- **Cleanup:** Cron job deletes files older than 7 days

## Data Flow — Full Pipeline

```
1. UPLOAD
   User -> Frontend: Upload video file or paste YouTube URL
   Frontend -> Express: POST /api/projects (multipart or URL)
   Express -> S3: Store original video
   Express -> PostgreSQL: Create project record (status: uploading)

2. PROCESS (triggered by user or auto after upload)
   Express -> BullMQ: Enqueue "process-video" job
   Express -> PostgreSQL: Update project (status: processing)

3. EXTRACT AUDIO
   Worker: Download video from S3
   Worker: FFmpeg extract audio -> WAV
   Worker -> S3: Store audio file
   Worker -> BullMQ: Report progress (step 1/4)

4. TRANSCRIBE
   Worker: Download audio from S3
   Worker -> Whisper API: Send audio (using user's OpenAI key)
   Worker: Receive transcript + word-level timestamps
   Worker -> PostgreSQL: Store transcript + timestamps
   Worker -> BullMQ: Report progress (step 2/4)

5. AI ANALYSIS
   Worker: Read transcript from DB
   Worker -> LLM API: Send transcript with clip detection prompt
   Worker: Parse structured response (clip segments)
   Worker -> PostgreSQL: Store clips (10-30 per video)
   Worker -> BullMQ: Report progress (step 3/4)

6. GENERATE PREVIEWS
   Worker: For each clip, generate low-res thumbnail
   Worker -> S3: Store thumbnails
   Worker -> PostgreSQL: Update project (status: ready)
   Worker -> BullMQ: Report progress (step 4/4, complete)

7. EXPORT (user-triggered per clip)
   Express -> BullMQ: Enqueue "render-clip" job
   Worker: Download original video from S3
   Worker: FFmpeg crop + caption burn-in
   Worker -> S3: Store rendered clip
   Worker -> PostgreSQL: Update export record
   Express -> User: Pre-signed download URL
```

## Job Queue Architecture

### Job Types

| Job | Queue | Priority | Timeout | Retries |
|---|---|---|---|---|
| `process-video` | `video-pipeline` | Normal | 10 min | 3 |
| `extract-audio` | `video-pipeline` | Normal | 5 min | 3 |
| `transcribe` | `ai-processing` | Normal | 5 min | 2 |
| `analyze-clips` | `ai-processing` | Normal | 3 min | 2 |
| `render-clip` | `video-render` | Normal | 2 min | 3 |
| `batch-export` | `video-render` | Low | 15 min | 2 |
| `cleanup-files` | `maintenance` | Low | 5 min | 1 |

### Pipeline Orchestration

Two approaches for chaining jobs:

**Option A: Single orchestrator job** (Recommended for MVP)
- One `process-video` job runs all steps sequentially
- Simpler error handling, single retry boundary
- Reports progress as it moves through steps

**Option B: Job chaining**
- Each step enqueues the next on completion
- More granular retry/resume
- More complex to implement and debug

**Decision: Option A for MVP.** A single worker function that runs extract -> transcribe -> analyze -> generate previews in sequence. If it fails, the whole job retries.

## Build Order (Dependencies)

```
Phase 1: Foundation
  - Project scaffolding (monorepo, TypeScript config)
  - Database schema + Prisma setup
  - Express API skeleton + auth
  - Next.js app skeleton + auth pages

Phase 2: Core Infrastructure
  - S3 upload/download utilities
  - BullMQ setup + worker scaffold
  - API key management (CRUD + encryption)

Phase 3: Video Processing Pipeline
  - Video upload endpoint + S3 storage
  - YouTube URL download (yt-dlp)
  - Audio extraction (FFmpeg)
  - Whisper transcription
  - LLM clip detection
  - Store results in DB

Phase 4: Frontend - Review & Export
  - Dashboard (project list)
  - Project detail (clip list)
  - Video preview player
  - Clip selection + basic trim
  - Export trigger + download

Phase 5: Caption Rendering + Polish
  - ASS subtitle generation from word timestamps
  - 3 caption styles
  - FFmpeg render with captions burned in
  - Batch export as ZIP
  - Error handling + status polling
```

## Key Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Monorepo | Yes (npm workspaces) | Shared types, single CI, simpler for solo dev |
| API pattern | REST | Simple, sufficient for this API surface |
| Job orchestration | Single job per pipeline | Simpler for MVP, can split later |
| File upload | Direct to S3 via pre-signed URL | Avoids backend memory pressure for large files |
| Status updates | Polling via react-query | SSE/WebSocket adds complexity, polling is fine for MVP |
| YouTube download | yt-dlp CLI | Best YouTube downloader, called from Node via child_process |
