# AI Video Repurposer — MVP

Upload a long video → get 10-30 vertical short clips in under 10 minutes.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TailwindCSS
- **Backend:** Node.js / Express + TypeScript
- **Database:** MongoDB + Prisma
- **Video Processing:** FFmpeg (installed on server)
- **Transcription:** OpenAI Whisper API
- **AI (clip detection + hooks):** OpenAI API
- **Storage:** Local filesystem for dev, S3 for prod

## Project Structure

```
content-repurpose/
  backend/       # Express API
  frontend/      # Next.js app
  docker-compose.yml   # MongoDB
```

## Current State

- Auth: Clerk (sign-in/sign-up) + Gumroad license activation
- Pricing: $5/mo for 150 minutes of video processing (~$0.007/min cost, ~78% margin)
- Credits: tracked in seconds, deducted on process start, refunded on failure
- Dashboard: shows projects list + remaining minutes
- API routes: /api/projects, /api/clips, /api/health, /api/user/me, /api/license/*

## What Needs to Be Built

1. Video upload (local file + YouTube URL via yt-dlp)
2. FFmpeg audio extraction
3. Whisper transcription (word-level timestamps)
4. LLM clip detection via OpenRouter (find viral moments in transcript)
5. Clip review UI (list, preview, trim)
6. FFmpeg vertical crop (9:16) + caption burn-in
7. Export (single clip + batch ZIP download)

## Processing Pipeline

```
Upload video → FFmpeg extract audio → Whisper transcribe
→ LLM analyze transcript → detect clips → score & rank
→ user reviews/edits → FFmpeg render vertical + captions → export
```

## Key Decisions

- Minute-based pricing — $5/mo for 150 min (~$0.007/min AI cost)
- Auth via Clerk + Gumroad license key for subscription
- No Redis/BullMQ yet — add when background jobs are needed
- MongoDB not PostgreSQL
- OpenAI for both Whisper and LLM
- FFmpeg for captions (not Remotion)
- Center crop only for MVP (no face tracking)
- Polling for job status (no WebSocket)

## Env Variables

```
DATABASE_URL=mongodb://localhost:27017/content_repurpose
OPENAI_API_KEY=sk-...
GUMROAD_PRODUCT_ID=...  # leave empty for dev mode auto-activate
PORT=3001
FRONTEND_URL=http://localhost:3000
```
