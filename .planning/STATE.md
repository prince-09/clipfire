# Project State — AI Video Repurposer

## Current Status
- **Milestone:** 1 (MVP Launch)
- **Phase:** 1 (not started)
- **Status:** Planning complete, ready to plan Phase 1

## Completed
- [x] Project initialization
- [x] Research (stack, features, architecture, pitfalls)
- [x] Requirements definition
- [x] Roadmap creation (4 phases)

## Key Decisions Log
| Date | Decision | Context |
|---|---|---|
| 2026-03-08 | Node.js/Express over Python/FastAPI | User preference for unified JS stack |
| 2026-03-08 | Coarse phase granularity (4 phases) | User preference |
| 2026-03-08 | Sequential execution | User preference |
| 2026-03-08 | FFmpeg for captions, not Remotion | Simpler for MVP |
| 2026-03-08 | Center crop, no auto-zoom | Reliable, no ML needed |
| 2026-03-08 | Single orchestrator job pattern | Simpler error handling for MVP |
| 2026-03-08 | Polling over WebSocket for status | Simpler, react-query handles it |

## Blockers
None

## Notes
- LLM prompt engineering for clip detection is the highest-risk area — needs iteration with real transcripts
- Whisper API 25MB limit requires audio chunking for long videos
- Pre-signed URLs for S3 upload to avoid backend memory pressure
