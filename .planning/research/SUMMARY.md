# Research Summary — AI Video Repurposer

## Key Findings

### Stack
- **Monorepo** with Next.js 14 + Express + PostgreSQL + Redis + S3
- **shadcn/ui** for components, **zustand** for state, **react-query** for server state
- **Prisma** ORM, **BullMQ** for jobs, **fluent-ffmpeg** for video processing
- **FFmpeg over Remotion** for MVP caption rendering (ASS subtitle filters)
- **yt-dlp** for YouTube downloads (CLI via child_process)

### Features
- **Table stakes:** AI clip detection, styled captions, vertical export, video preview, batch export
- **Differentiators:** BYOK model, clip quality focus, simple UX (list not timeline)
- **Anti-features:** Auto-zoom, B-roll, social posting, viral scores, timeline editor — deliberately excluded
- Feature chain is **strictly sequential** — each depends on the previous

### Architecture
- 4 components: Frontend, API, Workers, Storage
- Single orchestrator job pattern for MVP (extract -> transcribe -> analyze -> preview)
- Direct S3 upload via pre-signed URLs (bypass backend for large files)
- Polling via react-query for status updates (not WebSocket)

### Critical Risks
1. **LLM clip detection quality** — make or break, requires iterative prompt engineering
2. **Whisper 25MB limit** — must chunk audio for long videos
3. **Large file handling** — stream everything, never load full video into memory
4. **API key security** — AES-256-GCM encryption, never log keys

## Implications for Roadmap

### Build Order Must Follow Feature Dependencies
The entire product is a sequential pipeline. You can't build clip review UI without clips in the database, and you can't get clips without the transcription + LLM pipeline. Build order:

1. **Foundation** — scaffolding, DB, auth, key management
2. **Infrastructure** — S3, BullMQ, upload flow
3. **Pipeline** — FFmpeg, Whisper, LLM detection (the hard part)
4. **Frontend** — dashboard, clip review, preview, export UI
5. **Polish** — caption rendering, batch export, error handling

### Phase Count: 4-5 phases (coarse granularity)
Given sequential dependencies and coarse preference, 4-5 phases is optimal. Each phase should produce a testable vertical slice.

### Biggest Technical Risk
LLM prompt engineering for clip detection. This should be built early (Phase 3) with ability to iterate. The prompt will need tuning with real video transcripts.

## Confidence Assessment

| Area | Confidence | Notes |
|---|---|---|
| Stack choices | High | Well-known tools, strong ecosystem |
| Architecture | High | Standard patterns for video processing apps |
| Feature scope | High | Validated against competitor analysis |
| Build order | High | Driven by clear dependency chain |
| LLM prompt quality | Low | Requires iteration with real data |
| Caption rendering | Medium | FFmpeg ASS is capable but has learning curve |
| YouTube download | Medium | yt-dlp works well but YouTube can break it |
