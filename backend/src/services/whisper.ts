import OpenAI from 'openai';
import fs from 'fs';
import { logger } from '../lib/logger.js';
import { compressAudioForWhisper, splitAudioIfNeeded, getVideoDuration, cleanupFiles } from './ffmpeg.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface TranscriptionResult {
  fullText: string;
  wordTimestamps: WordTimestamp[];
  language: string;
}

/**
 * Transcribe audio using OpenAI Whisper API with word-level timestamps.
 * Handles files >25MB by splitting into chunks.
 */
export async function transcribeAudio(audioPath: string): Promise<TranscriptionResult> {
  // Compress first, then split if still too large
  const compressed = await compressAudioForWhisper(audioPath);
  const chunks = await splitAudioIfNeeded(compressed);

  let fullText = '';
  const allWords: WordTimestamp[] = [];
  let language = 'en';
  let timeOffset = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunkPath = chunks[i];
    logger.info(`Transcribing chunk ${i + 1}/${chunks.length}: ${chunkPath}`);

    // Get chunk duration for offset calculation
    const chunkDuration = await getVideoDuration(chunkPath);

    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(chunkPath),
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['word'],
    });

    // verbose_json response has words array
    const verboseResponse = response as unknown as {
      text: string;
      language: string;
      words?: { word: string; start: number; end: number }[];
    };

    if (i === 0 && verboseResponse.language) {
      language = verboseResponse.language;
    }

    fullText += (fullText ? ' ' : '') + verboseResponse.text;

    // Add word timestamps with offset for multi-chunk
    if (verboseResponse.words) {
      for (const w of verboseResponse.words) {
        allWords.push({
          word: w.word.trim(),
          start: Math.round((w.start + timeOffset) * 100) / 100,
          end: Math.round((w.end + timeOffset) * 100) / 100,
        });
      }
    }

    timeOffset += chunkDuration;

    // Clean up chunk files (not the original)
    if (chunkPath !== compressed && chunkPath !== audioPath) {
      cleanupFiles(chunkPath);
    }
  }

  // Clean up compressed file if different from original
  if (compressed !== audioPath) {
    cleanupFiles(compressed);
  }

  logger.info(`Transcription complete: ${allWords.length} words, language: ${language}`);

  return { fullText, wordTimestamps: allWords, language };
}
