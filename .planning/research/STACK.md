# Stack Research — AI Video Repurposer

## Decided Stack

| Layer | Choice | Confidence |
|---|---|---|
| Frontend | Next.js 14 (App Router) | High |
| Styling | TailwindCSS 3.x | High |
| Backend | Node.js + Express | High |
| Database | PostgreSQL | High |
| ORM | Prisma | High |
| Job Queue | BullMQ + Redis | High |
| Video Processing | FFmpeg via fluent-ffmpeg | High |
| Speech-to-Text | OpenAI Whisper API | High |
| LLM Integration | OpenAI, Anthropic, Google SDKs | High |
| Storage | S3-compatible (AWS S3 / Cloudflare R2) | High |
| Auth | NextAuth.js v5 | Medium |
| Deployment | Vercel (frontend) + Railway/Fly.io (backend) | Medium |

## Library Recommendations

### Frontend

| Library | Purpose | Why |
|---|---|---|
| `next` 14.x | App framework | App Router, RSC, API routes for BFF pattern |
| `tailwindcss` 3.x | Styling | Rapid UI development, consistent design |
| `shadcn/ui` | Component library | Copy-paste components, fully customizable, TailwindCSS native |
| `react-player` | Video playback | Handles multiple video formats, simple API |
| `zustand` | Client state | Lightweight, no boilerplate vs Redux |
| `tanstack/react-query` | Server state | Caching, polling (for job status), optimistic updates |
| `axios` | HTTP client | Interceptors for auth, cleaner than fetch for complex cases |
| `react-hot-toast` | Notifications | Simple toast notifications for processing status |
| `lucide-react` | Icons | Modern, tree-shakeable icon set |

### Backend

| Library | Purpose | Why |
|---|---|---|
| `express` 4.x | HTTP framework | Mature, massive ecosystem, simple |
| `prisma` 5.x | ORM | Type-safe, great migrations, PostgreSQL JSONB support |
| `bullmq` 5.x | Job queue | Redis-backed, reliable, supports job progress tracking |
| `ioredis` | Redis client | Required by BullMQ, performant |
| `fluent-ffmpeg` | Video processing | Chainable API over FFmpeg CLI |
| `openai` SDK | Whisper + GPT | Official SDK, streaming support |
| `@anthropic-ai/sdk` | Claude | Official SDK |
| `@google/generative-ai` | Gemini | Official SDK |
| `@aws-sdk/client-s3` | S3 storage | Official AWS SDK v3, modular imports |
| `multer` + `multer-s3` | File uploads | Stream uploads directly to S3 |
| `jsonwebtoken` + `bcryptjs` | Auth | JWT token generation, password hashing |
| `zod` | Validation | Runtime validation, TypeScript inference |
| `helmet` + `cors` | Security | HTTP headers, CORS config |
| `winston` | Logging | Structured logging with transports |
| `dotenv` | Config | Environment variable management |

### Shared / Dev

| Library | Purpose | Why |
|---|---|---|
| `typescript` 5.x | Type safety | Shared types between frontend and backend |
| `tsx` | Dev runner | Fast TypeScript execution for backend dev |
| `vitest` | Testing | Fast, ESM-native, compatible with Jest API |
| `eslint` + `prettier` | Code quality | Consistent formatting |

## What NOT to Use

| Avoid | Why |
|---|---|
| `Remotion` (for MVP) | Requires headless browser for rendering, complex setup, overkill for caption overlay — FFmpeg ASS filters handle this |
| `mongoose` / MongoDB | Relational data (users, projects, clips) fits PostgreSQL better |
| `socket.io` | Heavyweight for just job status polling — use SSE or simple polling with react-query |
| `GraphQL` | Over-engineered for this API surface — REST is simpler and sufficient |
| `Redis` as primary DB | Only use for job queue and caching, not data storage |
| `Passport.js` | Over-abstracted for simple JWT auth — just use jsonwebtoken directly |
| Local Whisper | Requires GPU, inconsistent with BYOK model, API is simpler |

## FFmpeg Considerations

- Must be installed on the server (not a npm package — it's a system dependency)
- `fluent-ffmpeg` wraps the CLI, requires `ffmpeg` and `ffprobe` in PATH
- Key FFmpeg operations needed:
  - Audio extraction: `ffmpeg -i input.mp4 -vn -acodec pcm_s16le output.wav`
  - Center crop to 9:16: `-vf "crop=ih*9/16:ih"`
  - Caption burn-in: ASS subtitle filter `-vf "ass=captions.ass"`
  - Thumbnail generation: `-ss 00:01:00 -vframes 1 thumb.jpg`
- Docker images should include FFmpeg (use `node:20-slim` + `apt-get install ffmpeg`)

## Monorepo vs Separate Repos

**Recommendation: Monorepo with workspaces** (Confidence: High)

```
content-repurpose/
  packages/
    frontend/     # Next.js app
    backend/      # Express API
    shared/       # Shared types, constants, validation schemas
  package.json    # Workspace root
```

- Use npm/pnpm workspaces for shared dependencies
- Shared `zod` schemas between frontend and backend for type safety
- Single repo makes deployment coordination easier for MVP
