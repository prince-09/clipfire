# Requirements — AI Video Repurposer MVP

## Functional Requirements

### FR-1: User Authentication
- FR-1.1: Users can register with email and password
- FR-1.2: Users can log in and receive a JWT token
- FR-1.3: Protected routes require valid JWT
- FR-1.4: Passwords are hashed with bcrypt (min 10 rounds)
- FR-1.5: JWT tokens expire after 7 days

### FR-2: API Key Management (BYOK)
- FR-2.1: Users can add API keys for OpenAI, Anthropic, and Google Gemini
- FR-2.2: Keys are validated on save (test API call to confirm key works)
- FR-2.3: Keys are encrypted with AES-256-GCM before storage
- FR-2.4: Keys are never returned in API responses (only masked: `sk-...xxxx`)
- FR-2.5: Keys are never logged or included in error messages
- FR-2.6: Users can delete their API keys
- FR-2.7: At minimum, an OpenAI key is required (for Whisper transcription)

### FR-3: Video Ingestion
- FR-3.1: Users can upload video files (MP4, MOV, MKV, WebM) up to 2GB
- FR-3.2: Users can paste a YouTube URL to download the video
- FR-3.3: Upload goes directly to S3 via pre-signed URL
- FR-3.4: A "project" record is created for each uploaded video
- FR-3.5: Video duration is extracted and stored (max 2 hours)
- FR-3.6: Upload progress is shown to the user

### FR-4: Video Processing Pipeline
- FR-4.1: Audio is extracted from video using FFmpeg (output: compressed audio)
- FR-4.2: Audio is chunked if larger than 25MB for Whisper API compliance
- FR-4.3: Audio is transcribed via Whisper API with word-level timestamps
- FR-4.4: Transcript + word timestamps are stored in database (JSONB)
- FR-4.5: Transcript is sent to LLM with structured prompt for clip detection
- FR-4.6: LLM returns 10-30 clip segments with: start_time, end_time, title, segment_type, transcript_excerpt, confidence_score
- FR-4.7: Clip segment types: Strong Hook, Educational Insight, Hot Take/Opinion, Funny Moment, Storytelling
- FR-4.8: Clips are 15-90 seconds, preserve complete sentences
- FR-4.9: Processing runs as background job with progress reporting
- FR-4.10: Failed jobs retry up to 3 times with exponential backoff
- FR-4.11: Processing completes in under 5 minutes for a 30-minute video

### FR-5: Clip Review Interface
- FR-5.1: List view of all detected clips, sorted by confidence score
- FR-5.2: Each clip card shows: thumbnail, title, duration, segment type badge, transcript excerpt, confidence percentage
- FR-5.3: Clicking a clip card opens inline video preview with playback
- FR-5.4: Users can select/deselect clips for batch export
- FR-5.5: Users can adjust clip start/end time by +/- seconds (basic trim)
- FR-5.6: "Select all" and "Deselect all" bulk actions

### FR-6: Styled Captions
- FR-6.1: Word-level timestamps from Whisper are used for per-word caption animation
- FR-6.2: Three caption styles available:
  - Classic (white text, black outline, bottom-center)
  - Bold Pop (large bold, center screen, word-by-word color highlight)
  - Minimal (clean sans-serif, subtle background pill)
- FR-6.3: Captions are burned into the exported video (not separate SRT)
- FR-6.4: Caption rendering uses FFmpeg ASS subtitle filter
- FR-6.5: Users can toggle captions on/off per export
- FR-6.6: Users can choose caption position (top/center/bottom)

### FR-7: One-Click Export
- FR-7.1: Export to vertical format (9:16, 1080x1920) with center crop
- FR-7.2: Export to square format (1:1, 1080x1080) with center crop
- FR-7.3: Export format is MP4 (H.264 video, AAC audio)
- FR-7.4: Single clip export completes in under 60 seconds
- FR-7.5: Exported file is stored in S3 with pre-signed download URL
- FR-7.6: Batch export of selected clips as downloadable ZIP
- FR-7.7: Export progress is shown to the user

### FR-8: Dashboard
- FR-8.1: List of all user projects with status (processing/ready/failed)
- FR-8.2: Project cards show: title, duration, clip count, status, created date
- FR-8.3: Click project to navigate to clip review
- FR-8.4: Delete project (removes video, clips, and exports from S3)

## Non-Functional Requirements

### NFR-1: Performance
- NFR-1.1: Full pipeline (upload to clips ready) under 5 minutes for 30-min video
- NFR-1.2: Single clip export under 60 seconds
- NFR-1.3: Page load under 2 seconds
- NFR-1.4: API response time under 500ms for CRUD operations

### NFR-2: Security
- NFR-2.1: API keys encrypted at rest with AES-256-GCM
- NFR-2.2: HTTPS only in production
- NFR-2.3: JWT authentication on all protected endpoints
- NFR-2.4: Input validation on all API endpoints (zod schemas)
- NFR-2.5: No API keys in logs, error messages, or responses
- NFR-2.6: CORS restricted to frontend origin

### NFR-3: Reliability
- NFR-3.1: Failed processing jobs retry 3 times with exponential backoff
- NFR-3.2: Stale jobs (no progress for 5 min) automatically marked as failed
- NFR-3.3: Users can manually retry failed processing
- NFR-3.4: Partial files cleaned up on job failure

### NFR-4: Storage
- NFR-4.1: Video files auto-deleted after 7 days
- NFR-4.2: Max upload size: 2GB
- NFR-4.3: Max video duration: 2 hours
- NFR-4.4: Pre-signed URLs expire: 1 hour (upload), 24 hours (download)

## User Stories

### US-1: First-Time Setup
> As a creator, I want to register, add my OpenAI API key, and upload my first video so I can see the platform work end-to-end.

**Acceptance criteria:**
- [ ] Register with email/password
- [ ] Add OpenAI key in settings, see validation confirmation
- [ ] Upload a video or paste YouTube URL
- [ ] See processing progress
- [ ] View list of detected clips when processing completes

### US-2: Clip Review & Export
> As a creator, I want to review detected clips, preview them, select the best ones, and download them as vertical shorts with styled captions.

**Acceptance criteria:**
- [ ] See all clips sorted by confidence with type badges
- [ ] Preview any clip with inline video player
- [ ] Select multiple clips for export
- [ ] Choose export format (9:16 or 1:1)
- [ ] Toggle captions on/off, choose caption style
- [ ] Download individual clips or batch ZIP

### US-3: Multi-Video Workflow
> As a creator, I want to process multiple videos and manage them from a dashboard.

**Acceptance criteria:**
- [ ] Dashboard shows all projects with status
- [ ] Can have multiple projects in different states
- [ ] Can delete old projects
- [ ] Can navigate between projects easily
