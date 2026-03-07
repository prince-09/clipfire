# Content Repurpose - AI Video Repurposer

## Product Overview

A creator-first AI tool that converts long-form videos (podcasts, interviews, lectures, YouTube videos) into ready-to-post vertical short-form clips. Users bring their own AI API keys (BYOK model) to control costs.

**Core promise:** Upload 1 long video -> get 10-30 post-ready vertical shorts in under 10 minutes.

---

## Target Users

- Podcast creators
- YouTube educators
- Interview channels
- Coaches / influencers
- Content repurposing agencies

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TailwindCSS, Remotion (video composition) |
| Backend | Node.js / Express |
| Video Processing | FFmpeg |
| Speech-to-Text | OpenAI Whisper API (via user's key) |
| AI Processing | User-provided API keys (OpenAI, Gemini, Claude) |
| Database | PostgreSQL with Prisma ORM (v5.x) |
| Storage | S3-compatible (AWS S3 / Cloudflare R2) |
| Queue | BullMQ + Redis (job processing) |
| Auth | NextAuth.js |

---

## MVP Features (Must-Have)

### Feature 1: BYOK - Bring Your Own API Key

**Purpose:** Users provide their own AI API keys so the platform bears zero AI inference cost.

**Requirements:**
- Settings page where users add/manage API keys
- Supported providers for MVP: OpenAI (primary), Google Gemini, Anthropic Claude
- Keys are AES-256 encrypted at rest in the database
- Keys are never exposed in API responses, logs, or admin panels
- Keys are only decrypted in-memory during processing
- Fallback logic: if primary provider fails, try next available provider
- Key validation: test key on save to confirm it works

**User flow:**
```
Settings -> AI Providers -> Add OpenAI Key -> Validate -> Save (encrypted)
```

---

### Feature 2: AI Clip Detection (Highlight Intelligence)

**Purpose:** This is THE core feature. Intelligently detect the best 10-30 moments from a long video. Quality of clip detection determines whether users return.

**Processing pipeline:**
1. User uploads video (or pastes YouTube URL)
2. Extract audio from video using FFmpeg
3. Transcribe audio using Whisper (via user's OpenAI key)
4. Send transcript to LLM with structured prompt
5. LLM returns ranked clip segments with metadata

**LLM must detect and classify segments as:**
- Strong Hook (attention-grabbing opener)
- Educational Insight (teach something)
- Hot Take / Opinion (debate-worthy)
- Funny Moment (humor, wit)
- Storytelling (narrative arc)

**Output per detected clip:**
```json
{
  "clip_id": 1,
  "start_time": "00:01:32",
  "end_time": "00:02:10",
  "duration_seconds": 38,
  "segment_type": "Strong Hook",
  "title": "Why most people fail at productivity",
  "transcript_excerpt": "...",
  "confidence": 0.87
}
```

**Clip constraints:**
- Duration: 15-90 seconds per clip
- Target: 10-30 clips per video
- Input: videos up to 2 hours long
- Must preserve complete sentences (no mid-sentence cuts)

**Quality priorities:**
- Clips must start with a strong opening line (not mid-thought)
- Clips must end at a natural pause (not abrupt cut)
- Prioritize moments with high energy, clarity, and standalone value

---

### Feature 3: Styled Captions on Export

**Purpose:** Creators need word-by-word animated captions baked into the video. Without this, the output isn't "post-ready" and users go to CapCut instead.

**Requirements:**
- Word-level timestamps from Whisper transcription
- Animated captions rendered onto the video (word-by-word highlight style)
- Caption styles for MVP:
  - Classic (white text, black outline, bottom-center)
  - Bold Pop (large bold text, center screen, word-by-word color highlight)
  - Minimal (clean sans-serif, subtle background)
- Font customization: size, color, position (top/center/bottom)
- Captions must be burned into the exported video (not separate SRT)

**Rendering approach:**
- Use Remotion for React-based video composition with caption overlays
- OR use FFmpeg ASS/subtitle filter for server-side rendering
- Decision: start with FFmpeg for simplicity, migrate to Remotion if richer styling needed

---

### Feature 4: One-Click Vertical Export

**Purpose:** Users must go from "select clip" to "download vertical short" in one click. No friction.

**Requirements:**
- Input: horizontal video (16:9)
- Output: vertical video (9:16) with center crop
- Additional format: square (1:1) for Instagram feed
- Resolution: 1080x1920 (9:16), 1080x1080 (1:1)
- Captions baked in (from Feature 3)
- Export format: MP4 (H.264, AAC audio)
- Processing must complete in under 60 seconds per clip

**Crop strategy for MVP:**
- Center crop (simple, reliable)
- No auto-zoom or speaker tracking in MVP (defer to v2)

**User flow:**
```
View clip list -> Preview clip -> Choose format (9:16 or 1:1) -> Toggle captions -> Download
```

---

### Feature 5: Clip Review Interface

**Purpose:** Users need to quickly review all detected clips, preview them, and select which ones to export. This is NOT a full timeline editor for MVP - it's a simple, fast review list.

**Requirements:**
- List view of all detected clips, sorted by confidence score
- Each clip card shows:
  - Thumbnail
  - Clip title (AI-generated)
  - Duration
  - Segment type badge (Hook, Insight, Funny, etc.)
  - Transcript excerpt
  - Confidence score (displayed as percentage)
- Click clip card -> inline video preview with playback
- Select/deselect clips for batch export
- Basic trim: adjust start/end time by +/- seconds
- Bulk actions: "Export selected" to download all chosen clips as zip

**NOT in MVP:**
- Full timeline editor with waveform
- Drag-and-drop reordering
- Auto-zoom / subject reframing
- Clip merging or splitting

---

## Video Processing Pipeline

```
[Upload / YouTube URL]
        |
        v
[Extract Audio] -- FFmpeg
        |
        v
[Transcribe] -- Whisper API (user's OpenAI key)
        |
        v
[AI Analysis] -- GPT-4 / Gemini / Claude (user's key)
        |        Returns: clip segments with timestamps
        v
[Generate Previews] -- FFmpeg (quick low-res previews)
        |
        v
[User Reviews & Selects Clips]
        |
        v
[Render Final Clips] -- FFmpeg
        |  - Crop to vertical (9:16) or square (1:1)
        |  - Burn in styled captions
        |  - Output MP4
        v
[Download / Batch ZIP]
```

---

## Project Structure

```
content-repurpose/
  frontend/                 # Next.js 14 app
    src/
      app/                  # App router pages
        (auth)/             # Login, register
        dashboard/          # Main dashboard
        project/[id]/       # Video project view
        settings/           # API key management
      components/           # React components
        ui/                 # Shared UI components
        video/              # Video player, clip cards
        captions/           # Caption style previews
      lib/                  # Utilities, API client
      hooks/                # Custom React hooks
  backend/                  # Express server
    src/
      routes/               # API routes
        auth.ts
        videos.ts
        clips.ts
        keys.ts
      middleware/            # Auth, validation, error handling
      services/
        video-processor.ts  # FFmpeg operations
        transcriber.ts      # Whisper integration
        ai-analyzer.ts      # LLM clip detection
        caption-renderer.ts # Caption generation
        key-manager.ts      # API key encryption/decryption
      workers/              # BullMQ job processors
      lib/                  # Utilities (S3, Redis, Prisma client)
    prisma/
      schema.prisma         # Database schema
    package.json
  shared/                   # Shared types/constants
  docker-compose.yml
  README.md
```

---

## Database Schema (Core Tables)

```
users
  id, email, password_hash, name, created_at

api_keys
  id, user_id, provider (openai|gemini|claude), encrypted_key, is_valid, created_at

projects (one per uploaded video)
  id, user_id, title, status (uploading|processing|ready|failed),
  source_url, video_path, duration_seconds, created_at

transcripts
  id, project_id, full_text, word_timestamps (JSONB), language, created_at

clips
  id, project_id, title, start_time, end_time, duration_seconds,
  segment_type, transcript_excerpt, confidence_score,
  is_selected, export_status, output_path, created_at

exports
  id, clip_id, format (9:16|1:1), caption_style, file_path,
  file_size_bytes, created_at
```

---

## API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/keys
POST   /api/keys                    # Add API key (encrypted)
DELETE /api/keys/:id
POST   /api/keys/:id/validate       # Test if key works

POST   /api/projects                # Upload video or submit URL
GET    /api/projects
GET    /api/projects/:id
DELETE /api/projects/:id
POST   /api/projects/:id/process    # Start AI processing

GET    /api/projects/:id/clips      # List detected clips
PATCH  /api/clips/:id               # Update clip (trim, select/deselect)
POST   /api/clips/:id/export        # Render single clip
POST   /api/projects/:id/export     # Batch export selected clips

GET    /api/exports/:id/download    # Download rendered clip
```

---

## MVP Constraints

**DO NOT build:**
- Social media auto-posting
- B-roll generation or insertion
- Video effects, transitions, or filters
- Analytics dashboard
- Team collaboration / multi-user workspaces
- Viral score prediction (defer to v2)
- Hook/caption text generator (defer to v2)
- Auto-zoom / speaker tracking (defer to v2)
- Webhook integrations
- Mobile app

**DO focus on:**
- Clip detection quality (prompt engineering is critical)
- Fast processing pipeline
- Clean, simple UI
- Reliable video rendering
- Styled captions that look professional

---

## Development Phases

### Phase 1: Foundation
- Project scaffolding (Next.js + FastAPI)
- Database setup (PostgreSQL + models)
- Auth system (register/login)
- API key management (CRUD + encryption)
- File upload infrastructure (S3)

### Phase 2: Video Processing Core
- Video upload + YouTube URL download
- Audio extraction (FFmpeg)
- Whisper transcription with word-level timestamps
- LLM clip detection with structured output
- Store clips in database

### Phase 3: Frontend - Clip Review
- Dashboard (list projects)
- Project view with clip list
- Clip preview player
- Select/deselect clips
- Basic trim controls

### Phase 4: Export Pipeline
- Vertical crop (center crop, 9:16)
- Square crop (1:1)
- Styled caption rendering (3 styles)
- Single clip export + download
- Batch export as ZIP

### Phase 5: Polish & Deploy
- Error handling and retry logic
- Processing status updates (WebSocket or polling)
- Loading states and progress indicators
- Deploy (Vercel + Railway/Fly.io + S3)
- End-to-end testing

---

## Non-Functional Requirements

- **Performance:** Full pipeline (upload to clips ready) under 5 minutes for a 30-min video
- **File limits:** Max video size 2GB, max duration 2 hours
- **Security:** API keys encrypted at rest, HTTPS only, JWT auth
- **Reliability:** Failed jobs retry up to 3 times with exponential backoff
- **Storage:** Video files cleaned up after 7 days (configurable)

---

## Key Technical Decisions

1. **FFmpeg over Remotion for MVP** - simpler, faster to implement, no browser rendering needed
2. **Center crop over auto-zoom** - reliable, no ML model needed, good enough for MVP
3. **Express over FastAPI for backend** - unified JS stack with Next.js frontend, simpler deployment
4. **Whisper API over local Whisper** - consistent with BYOK model, no GPU needed on server
5. **PostgreSQL JSONB for word timestamps** - flexible, avoids separate timestamp table
6. **Simple clip list over timeline editor** - faster to build, covers 90% of use cases
