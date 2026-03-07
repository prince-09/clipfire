# Pitfalls Research — AI Video Repurposer

## Critical Pitfalls

### 1. FFmpeg Command Complexity

**Problem:** FFmpeg has thousands of flags and options. Wrong codec settings, filter chains, or container formats produce silent failures — output files that look fine but have sync issues, no audio, or wrong resolution.

**Warning signs:**
- Rendered clips have audio/video desync
- Output file is 0 bytes or unexpectedly small
- Captions appear at wrong timestamps

**Prevention:**
- Build a small library of tested FFmpeg command templates
- Always validate output file (check duration, file size, codec info)
- Test with multiple input formats (MP4/MKV/MOV/WebM) early
- Use `ffprobe` to inspect both input and output files programmatically
- **Phase:** Address in Phase 3 (Video Processing Pipeline)

### 2. Whisper API Limitations

**Problem:** OpenAI Whisper API has a 25MB file size limit per request. A 2-hour video's audio file can be 200MB+.

**Warning signs:**
- API returns 413 (Request Entity Too Large)
- Transcription fails silently on long videos

**Prevention:**
- Split audio into chunks (10-15 min segments) before sending to Whisper
- Use compressed audio format (MP3/OGG at 64kbps) not WAV
- Implement chunked transcription with timestamp offset merging
- Fallback: if user's key supports Whisper v2, use it; otherwise chunk
- **Phase:** Address in Phase 3

### 3. LLM Clip Detection Quality

**Problem:** This is the make-or-break feature. Poor prompt engineering = irrelevant clips = users churn immediately. LLMs can hallucinate timestamps, return inconsistent JSON, or miss the best moments.

**Warning signs:**
- Clips start/end mid-sentence
- Timestamps don't match actual content
- All clips are the same type (e.g., all "Educational")
- LLM returns invalid JSON or wrong format

**Prevention:**
- Use structured output (JSON mode / function calling) not free-form text
- Provide the full transcript with timestamps so LLM has accurate reference
- Include few-shot examples in the prompt
- Validate LLM output: check timestamps are within video duration, duration is 15-90s, no overlapping clips
- Post-process: snap to sentence boundaries using word-level timestamps
- Iterate on prompts with real transcripts — this is ongoing work
- **Phase:** Address in Phase 3, iterate throughout

### 4. Large File Handling

**Problem:** Video files are 500MB-2GB. Naive handling (loading into memory, synchronous processing) will crash the server.

**Warning signs:**
- Node.js OOM (Out of Memory) errors
- Upload timeouts
- Server becomes unresponsive during processing

**Prevention:**
- Upload directly to S3 via pre-signed URLs (never through backend)
- Stream files from S3 to FFmpeg (pipe, don't download entire file)
- Set appropriate memory limits for worker processes
- Implement upload progress tracking on frontend
- Set file size limits and validate before upload starts
- **Phase:** Address in Phase 2 (infrastructure) and Phase 3

### 5. YouTube Download Reliability

**Problem:** YouTube frequently changes its internal API. `yt-dlp` is the best tool but can break after YouTube updates. Also, downloading copyrighted content has legal implications.

**Warning signs:**
- yt-dlp returns errors on previously working URLs
- Downloads hang or produce incomplete files
- Legal takedown notices

**Prevention:**
- Pin yt-dlp version but have easy update path
- Add error handling for common yt-dlp failures
- Implement timeout for downloads (max 10 minutes)
- Show clear error message to user if download fails
- Terms of Service should clarify user is responsible for content rights
- **Phase:** Address in Phase 3

### 6. Job Queue Failures and Recovery

**Problem:** Video processing jobs take 2-10 minutes. If the server crashes mid-job, partial files are left in S3 and the project is stuck in "processing" state forever.

**Warning signs:**
- Projects stuck in "processing" status indefinitely
- Orphaned files in S3 accumulating storage costs
- Users see no progress updates

**Prevention:**
- BullMQ has built-in retry with exponential backoff — use it
- Implement job progress events so frontend can show step-by-step status
- Add a "stale job detector" — if a job hasn't progressed in 5 minutes, mark it failed
- Allow users to manually retry failed processing
- Clean up partial files on job failure
- **Phase:** Address in Phase 2 (infrastructure), refine in Phase 5

### 7. API Key Security

**Problem:** Users are trusting you with their AI API keys. A breach exposes their billing accounts. Keys in logs, error messages, or API responses are a liability.

**Warning signs:**
- Keys appear in server logs during debugging
- Error responses include key in request details
- Database backup contains plaintext keys

**Prevention:**
- AES-256-GCM encryption with unique IV per key
- Encryption key stored in environment variable, never in code
- Scrub all log output — never log request bodies for key endpoints
- Keys decrypted only in-memory, only when needed, immediately discarded
- Never return key value in any API response (return masked version like `sk-...xxxx`)
- **Phase:** Address in Phase 2

### 8. Caption Rendering Performance

**Problem:** Generating ASS subtitle files with word-by-word timing for 3 different styles, then rendering with FFmpeg, can be slow. Each clip render adds 15-60 seconds.

**Warning signs:**
- Export takes more than 60 seconds per clip
- Batch export of 20 clips takes 20+ minutes
- FFmpeg process hangs on complex ASS filters

**Prevention:**
- Pre-generate ASS files during clip detection (not during export)
- Use hardware acceleration if available (libx264 with `-preset fast`)
- Limit caption styling complexity in FFmpeg (avoid heavy animations)
- For batch export, process clips in parallel (2-3 concurrent FFmpeg processes)
- **Phase:** Address in Phase 5

### 9. CORS and Pre-signed URL Issues

**Problem:** Direct S3 uploads from browser require proper CORS configuration. Pre-signed URLs expire. Mixing HTTP/HTTPS causes failures.

**Warning signs:**
- Upload works in dev but fails in production
- "CORS policy" errors in browser console
- Pre-signed URLs return 403 after expiry

**Prevention:**
- Configure S3 CORS policy explicitly during setup
- Set reasonable pre-signed URL expiry (1 hour for upload, 24 hours for download)
- Always use HTTPS for S3 endpoints
- Test upload flow early with actual S3/R2 bucket
- **Phase:** Address in Phase 2

### 10. Word-Level Timestamp Accuracy

**Problem:** Whisper's word-level timestamps can be slightly off, especially for fast speech, overlapping speakers, or background music. This makes word-by-word caption animation look wrong.

**Warning signs:**
- Captions appear before/after the word is spoken
- Words highlight out of sync with audio
- Gaps or overlaps between word timestamps

**Prevention:**
- Use `timestamp_granularities=["word"]` in Whisper API request
- Add small buffer (50-100ms) between word highlights
- Test with different content types (fast talkers, music, multiple speakers)
- Allow manual offset adjustment if needed (v2 feature)
- **Phase:** Address in Phase 3, refine in Phase 5

## Summary — Risk Matrix

| Pitfall | Severity | Likelihood | Phase to Address |
|---|---|---|---|
| LLM clip detection quality | Critical | High | Phase 3 |
| Whisper 25MB limit | High | Certain | Phase 3 |
| Large file handling | High | High | Phase 2-3 |
| API key security | High | Medium | Phase 2 |
| FFmpeg complexity | Medium | High | Phase 3 |
| Job queue failures | Medium | Medium | Phase 2, 5 |
| YouTube download reliability | Medium | Medium | Phase 3 |
| Caption rendering perf | Medium | Medium | Phase 5 |
| CORS / pre-signed URLs | Low | High | Phase 2 |
| Word timestamp accuracy | Low | Medium | Phase 3, 5 |
