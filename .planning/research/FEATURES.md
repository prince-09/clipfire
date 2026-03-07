# Features Research — AI Video Repurposer

## Competitive Landscape

| Product | Pricing | Strengths | Weaknesses |
|---|---|---|---|
| **Opus Clip** | $19-99/mo | Best auto-clipping AI, virality score, auto-reframe | Expensive at scale, no BYOK |
| **Vizard** | $16-67/mo | Good clip detection, multi-language | Limited caption styles |
| **Descript** | $24-33/mo | Full editor, transcript-based editing | Overkill for repurposing, steep learning curve |
| **Submagic** | $19-49/mo | Great captions, emoji integration | Clip detection is basic |
| **Gling** | $16/mo | Good for removing silences | Not focused on viral clips |
| **Kapwing** | $16-33/mo | General editor with AI features | Jack of all trades, master of none |

## Feature Categories

### Table Stakes (Users leave without these)

| Feature | Why Critical | Complexity |
|---|---|---|
| **AI clip detection** | The entire value prop — without good clips, product is useless | High |
| **Styled captions** | Creators expect word-by-word animated captions (the Hormozi style) | Medium-High |
| **Vertical export (9:16)** | Output must be platform-ready for TikTok/Reels/Shorts | Medium |
| **Video preview** | Users must preview clips before exporting | Low-Medium |
| **Batch export** | Exporting clips one by one is painful | Low |
| **Upload + YouTube URL** | Both input methods expected | Low-Medium |

### Our Differentiators

| Feature | How It Differentiates | Complexity |
|---|---|---|
| **BYOK model** | No per-minute AI costs — unique in market | Medium |
| **Clip quality focus** | Invest in prompt engineering over feature breadth | Low (effort) / High (impact) |
| **Simple UX** | List view vs complex timeline — faster workflow | Low |
| **Multiple export formats** | 9:16 + 1:1 from same clip | Low |

### Anti-Features (Deliberately NOT building)

| Feature | Why Not | Competitor Has It? |
|---|---|---|
| Full timeline editor | Complex to build, list view covers 90% of use cases | Descript |
| Auto-zoom / speaker tracking | Hard to do well, bad auto-zoom is worse than no auto-zoom | Opus Clip |
| B-roll insertion | AI-generated B-roll is hit or miss, adds huge complexity | Opus Clip (basic) |
| Social media posting | Every platform has different APIs, auth flows, rate limits | Opus Clip, Vizard |
| Viral score prediction | Subjective, creators trust instinct, no training data for accuracy | Opus Clip |
| Hook/caption text gen | ChatGPT does this — not a reason to use our platform | Submagic |
| Team collaboration | Multi-user adds auth complexity, not needed for solo creators | Descript |
| Analytics dashboard | No data to show until users have posted content externally | None meaningful |

## Feature Dependencies

```
Auth system
    |
    v
BYOK key management
    |
    v
Video upload / YouTube URL download
    |
    v
Audio extraction (FFmpeg)
    |
    v
Whisper transcription (needs user's OpenAI key)
    |
    v
LLM clip detection (needs user's AI key + transcript)
    |
    v
Clip review UI (needs clips in database)
    |
    v
Video preview (needs clip timestamps + original video)
    |
    v
Vertical crop + caption rendering (FFmpeg)
    |
    v
Export / download (needs rendered files)
    |
    v
Batch export ZIP (needs multiple rendered files)
```

Key insight: **Everything is sequential.** Each feature depends on the previous one. This means phases must follow this dependency chain.

## Caption Styles — What Users Expect

Based on competitor analysis, 3 styles cover 80% of creator needs:

1. **Classic** — White text, black outline, bottom-center. Safe, readable, professional.
2. **Bold Pop** — Large bold text, center screen, word-by-word color highlight (yellow/green on white). The "Hormozi style" that went viral.
3. **Minimal** — Clean sans-serif (Inter/Montserrat), subtle dark background pill, bottom-third.

Implementation via FFmpeg ASS subtitle format:
- Word-level timestamps from Whisper enable per-word animation
- ASS supports styling (fonts, colors, positions, effects)
- Burned into video during FFmpeg render pass
