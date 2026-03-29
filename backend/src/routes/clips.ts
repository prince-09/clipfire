import { Router, Request, Response } from 'express';
import { updateClipSchema } from '../lib/schemas.js';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.patch('/:id', validate(updateClipSchema), async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const clip = await prisma.clip.findUnique({ where: { id } });

  if (!clip) {
    res.status(404).json({ error: 'Clip not found' });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (req.body.startTime !== undefined) updates.startTime = req.body.startTime;
  if (req.body.endTime !== undefined) updates.endTime = req.body.endTime;
  if (req.body.isSelected !== undefined) updates.isSelected = req.body.isSelected;

  if (updates.startTime !== undefined && updates.endTime !== undefined) {
    updates.durationSeconds = (updates.endTime as number) - (updates.startTime as number);
  } else if (updates.startTime !== undefined) {
    updates.durationSeconds = clip.endTime - (updates.startTime as number);
  } else if (updates.endTime !== undefined) {
    updates.durationSeconds = (updates.endTime as number) - clip.startTime;
  }

  const updated = await prisma.clip.update({ where: { id }, data: updates });
  res.json({ clip: updated });
});

export default router;
