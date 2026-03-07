# Content Repurpose — AI Video Repurposer

## What This Is

A creator-first AI tool that converts long-form videos (podcasts, interviews, lectures, YouTube videos) into ready-to-post vertical short-form clips with styled captions. Users bring their own AI API keys (BYOK model) to control costs. The platform charges for infrastructure/features, not AI usage.

## Core Value

**Upload 1 long video and get 10-30 post-ready vertical shorts with styled captions in under 10 minutes.** If clip detection quality is poor or exports aren't post-ready, nothing else matters.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] BYOK API key management (encrypted storage, validation, fallback logic)
- [ ] Video upload and YouTube URL ingestion
- [ ] Audio extraction and AI transcription with word-level timestamps
- [ ] AI-powered clip detection (10-30 clips per video, ranked by quality)
- [ ] Clip review interface (list view, preview, select/deselect, basic trim)
- [ ] Styled captions burned into exports (3 caption styles, word-by-word animation)
- [ ] One-click vertical export (9:16 center crop, MP4)
- [ ] Square export format (1:1 for Instagram feed)
- [ ] Batch export selected clips as ZIP
- [ ] User authentication (register, login, sessions)

### Out of Scope

- Social media auto-posting — high complexity, not core to repurposing value
- B-roll generation/insertion — too complex for MVP, defer to v2+
- Video effects/transitions/filters — not needed for post-ready shorts
- Analytics dashboard — no user data to analyze yet
- Team collaboration / multi-user workspaces — single creator focus for MVP
- Viral score prediction — nice-to-have, creators trust their own instinct
- Hook/caption text generator — ChatGPT already does this, not a retention driver
- Auto-zoom / speaker tracking — hard to do well, bad auto-zoom is worse than center crop
- Mobile app — web-first
- Webhook integrations — no downstream consumers yet
- Full timeline editor with waveform — simple list view covers 90% of use cases

## Context

- **Market:** Short-form content is the #1 distribution channel. Creators publish long videos but fail to extract multiple shorts. Competitors include Opus Clip, Vizard, Descript, Submagic.
- **Differentiation:** BYOK model reduces cost for high-volume creators. Focus on clip detection quality + styled caption export as the retention loop.
- **Target workflow:** Upload video -> AI finds best moments -> Preview & select clips -> Download vertical shorts with captions. Four steps, under 10 minutes.
- **Retention drivers:** (1) Accurate clip detection, (2) Professional styled captions baked in, (3) Fast one-click export. These three must be excellent.
- **Revenue model:** Platform fee ($20-50/mo) for processing/storage. AI costs on the user via BYOK.

## Constraints

- **Tech stack**: Next.js 14 (App Router) + Node.js/Express + PostgreSQL + Redis + S3-compatible storage
- **Video processing**: FFmpeg via fluent-ffmpeg (no browser-based rendering for MVP)
- **Transcription**: Whisper API via user's OpenAI key (BYOK consistent)
- **File limits**: Max video size 2GB, max duration 2 hours
- **Performance**: Full pipeline (upload to clips ready) under 5 minutes for a 30-min video
- **Security**: API keys AES-256 encrypted at rest, HTTPS only, JWT auth
- **Storage**: User video files cleaned up after 7 days (configurable)
- **Export**: Under 60 seconds render time per clip

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Node.js/Express over Python/FastAPI | Unified JS stack with Next.js frontend, simpler deployment, one runtime | — Pending |
| FFmpeg over Remotion for MVP | Simpler, faster to implement, no browser rendering needed server-side | — Pending |
| Center crop over auto-zoom | Reliable, no ML model needed, good enough for MVP | — Pending |
| Whisper API over local Whisper | Consistent with BYOK model, no GPU needed on server | — Pending |
| Simple clip list over timeline editor | Faster to build, covers 90% of use cases | — Pending |
| BullMQ + Redis for job queue | Lightweight, native Node.js, good for long-running video tasks | — Pending |
| 3 caption styles for MVP | Enough variety without over-engineering the rendering pipeline | — Pending |

---
*Last updated: 2026-03-08 after initialization*
