import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/user/me — get current user profile + subscription + credits
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: {
      id: true,
      email: true,
      name: true,
      imageUrl: true,
      isPaid: true,
      subscriptionStatus: true,
      paidAt: true,
      expiresAt: true,
      creditsTotal: true,
      creditsUsed: true,
      createdAt: true,
    },
  });

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const creditsRemaining = user.creditsTotal - user.creditsUsed;

  res.json({
    user: {
      ...user,
      credits: {
        totalMinutes: Math.floor(user.creditsTotal / 60),
        usedMinutes: Math.floor(user.creditsUsed / 60),
        remainingMinutes: Math.floor(creditsRemaining / 60),
      },
    },
  });
});

export default router;
