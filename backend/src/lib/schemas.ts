import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  sourceUrl: z.string().url().optional(),
});

export const updateClipSchema = z.object({
  startTime: z.number().min(0).optional(),
  endTime: z.number().min(0).optional(),
  isSelected: z.boolean().optional(),
});

const captionFontEnum = z.enum(['arial', 'poppins', 'montserrat', 'bangers', 'bebas-neue', 'oswald', 'permanent-marker', 'space-mono', 'pacifico', 'impact', 'courier-new', 'georgia']);
const backgroundMusicEnum = z.enum(['chill', 'upbeat', 'cinematic', 'lofi', 'hype', 'motivational']);

export const exportClipSchema = z.object({
  format: z.enum(['9:16', '1:1', '16:9']),
  captionStyle: z.enum(['classic', 'bold-pop', 'minimal', 'karaoke', 'neon-glow', 'boxed', 'typewriter', 'pastel', 'outline-only', 'impact']).nullable().default(null),
  captionPosition: z.enum(['top', 'center', 'bottom']).default('bottom'),
  captionFont: captionFontEnum.nullable().default(null),
  backgroundMusic: backgroundMusicEnum.nullable().default(null),
  musicVolume: z.number().min(0.01).max(0.5).default(0.12),
});

export const batchExportSchema = z.object({
  clipIds: z.array(z.string()).min(1, 'Select at least one clip'),
  format: z.enum(['9:16', '1:1', '16:9']),
  captionStyle: z.enum(['classic', 'bold-pop', 'minimal', 'karaoke', 'neon-glow', 'boxed', 'typewriter', 'pastel', 'outline-only', 'impact']).nullable().default(null),
  captionPosition: z.enum(['top', 'center', 'bottom']).default('bottom'),
  captionFont: captionFontEnum.nullable().default(null),
  backgroundMusic: backgroundMusicEnum.nullable().default(null),
  musicVolume: z.number().min(0.01).max(0.5).default(0.12),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateClipInput = z.infer<typeof updateClipSchema>;
export type ExportClipInput = z.infer<typeof exportClipSchema>;
export type BatchExportInput = z.infer<typeof batchExportSchema>;
