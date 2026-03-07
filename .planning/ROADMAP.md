# Roadmap — AI Video Repurposer MVP

## Milestone 1: MVP Launch

### Phase 1: Project Foundation & Auth
**Goal:** Monorepo scaffolded, database running, users can register/login and manage API keys.

**Requirements covered:** FR-1 (all), FR-2 (all), NFR-2.1, NFR-2.3, NFR-2.4, NFR-2.6

**Deliverables:**
- Monorepo structure (frontend/ backend/ shared/) with TypeScript
- Next.js 14 app with TailwindCSS + shadcn/ui
- Express API with route structure
- PostgreSQL + Prisma schema (users, api_keys tables)
- JWT auth (register, login, protected middleware)
- API key CRUD with AES-256-GCM encryption
- Key validation endpoint (test key on save)
- Settings page UI for managing API keys
- Login/register pages

**Success criteria:**
- [ ] User can register, login, and stay authenticated
- [ ] User can add an OpenAI key, see it validated, see it masked in UI
- [ ] User can delete an API key
- [ ] Keys are encrypted in database (verify with raw SQL query)
- [ ] Invalid keys are rejected on save with clear error message

**Plans:** 2-3 plans (scaffolding, auth+DB, key management)

---

### Phase 2: Video Upload & Storage Infrastructure
**Goal:** Users can upload videos (or paste YouTube URLs), files are stored in S3, and the job queue is ready for processing.

**Requirements covered:** FR-3 (all), FR-8 (all), NFR-4 (all), NFR-3.4

**Deliverables:**
- S3 integration (upload via pre-signed URL, download, delete)
- Video upload endpoint + direct-to-S3 upload flow
- YouTube URL download via yt-dlp
- Project CRUD (create on upload, list, delete with S3 cleanup)
- BullMQ + Redis setup with worker scaffold
- Dashboard page (list projects with status)
- Upload UI with progress bar
- Video duration extraction via ffprobe

**Success criteria:**
- [ ] User can upload a video file and see it in dashboard
- [ ] User can paste YouTube URL and see video downloaded + appear in dashboard
- [ ] Files are stored in S3 (not on local disk)
- [ ] User can delete a project (removes S3 files)
- [ ] Dashboard shows project status correctly
- [ ] BullMQ worker starts and can process a test job

**Plans:** 2-3 plans (S3+upload, YouTube+projects, dashboard UI)

---

### Phase 3: AI Processing Pipeline
**Goal:** The core pipeline works end-to-end — upload triggers audio extraction, Whisper transcription, and LLM clip detection. Clips are stored in database.

**Requirements covered:** FR-4 (all), NFR-1.1, NFR-3.1, NFR-3.2, NFR-3.3

**Deliverables:**
- FFmpeg audio extraction from video
- Whisper transcription with word-level timestamps
- Audio chunking for files > 25MB
- LLM clip detection prompt with structured output
- Clip segment parsing, validation, and storage
- Processing job orchestration (extract -> transcribe -> analyze)
- Progress reporting from worker to API
- Processing status polling on frontend
- Retry logic with exponential backoff
- "Retry" button for failed processing

**Success criteria:**
- [ ] Upload a 30-min video -> get 10-30 clips in database within 5 minutes
- [ ] Clips have accurate start/end times that match video content
- [ ] Clips start at strong opening lines, end at natural pauses
- [ ] Word-level timestamps are stored for caption rendering
- [ ] Processing progress is visible on frontend
- [ ] Failed jobs retry automatically and user can manually retry

**Plans:** 3 plans (FFmpeg+Whisper, LLM detection, job orchestration+status)

---

### Phase 4: Clip Review, Export & Captions
**Goal:** Users can review clips, preview them, select for export, and download vertical shorts with styled captions. The product is end-to-end functional.

**Requirements covered:** FR-5 (all), FR-6 (all), FR-7 (all), NFR-1.2

**Deliverables:**
- Clip review list UI (cards with badges, confidence, transcript)
- Inline video preview player (seeks to clip timestamp)
- Clip selection (individual + select all)
- Basic trim controls (+/- seconds)
- FFmpeg center crop to 9:16 and 1:1
- ASS subtitle generation from word timestamps (3 styles)
- Caption burn-in during FFmpeg render
- Caption toggle and style selection UI
- Single clip export + download
- Batch export as ZIP
- Export progress display

**Success criteria:**
- [ ] User sees clip list sorted by confidence with type badges
- [ ] User can preview any clip with inline video player
- [ ] User can select clips and export in 9:16 format
- [ ] Exported clips have styled captions burned in
- [ ] All 3 caption styles render correctly
- [ ] Single clip export completes under 60 seconds
- [ ] Batch export downloads as ZIP
- [ ] User can toggle captions on/off
- [ ] User can choose caption position (top/center/bottom)

**Plans:** 3 plans (clip review UI, export pipeline, caption rendering)

---

## Requirement Coverage Matrix

| Requirement | Phase |
|---|---|
| FR-1: Authentication | Phase 1 |
| FR-2: API Key Management | Phase 1 |
| FR-3: Video Ingestion | Phase 2 |
| FR-4: Processing Pipeline | Phase 3 |
| FR-5: Clip Review | Phase 4 |
| FR-6: Styled Captions | Phase 4 |
| FR-7: One-Click Export | Phase 4 |
| FR-8: Dashboard | Phase 2 |
| NFR-1: Performance | Phase 3, 4 |
| NFR-2: Security | Phase 1 |
| NFR-3: Reliability | Phase 3 |
| NFR-4: Storage | Phase 2 |

## Phase Dependencies

```
Phase 1 (Auth + Keys)
    |
    v
Phase 2 (Upload + Storage)
    |
    v
Phase 3 (AI Pipeline)
    |
    v
Phase 4 (Review + Export + Captions)
```

All phases are strictly sequential — each depends on the previous phase's output.
