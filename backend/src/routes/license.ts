import { Router, Response } from 'express';
import { config } from '../lib/config.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { CREDITS_PER_SUBSCRIPTION } from '../lib/constants.js';

const router = Router();

// POST /api/license/activate — verify Gumroad key and link to user
router.post('/activate', authenticate, async (req: AuthRequest, res: Response) => {
  const { licenseKey } = req.body;

  if (!licenseKey || typeof licenseKey !== 'string') {
    res.status(400).json({ error: 'License key is required' });
    return;
  }

  if (!config.gumroadProductId) {
    // Dev mode — auto-activate
    await prisma.user.update({
      where: { id: req.userId! },
      data: {
        isPaid: true,
        licenseKey: licenseKey.trim(),
        subscriptionStatus: 'active',
        paidAt: new Date(),
        creditsTotal: CREDITS_PER_SUBSCRIPTION,
        creditsUsed: 0,
      },
    });
    res.json({ valid: true, message: 'Activated (dev mode)' });
    return;
  }

  try {
    const gumroadRes = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        product_id: config.gumroadProductId,
        license_key: licenseKey.trim(),
      }),
    });

    const data = await gumroadRes.json();

    if (!data.success) {
      res.status(401).json({ valid: false, error: 'Invalid license key' });
      return;
    }

    const purchase = data.purchase || {};

    // Update user with subscription info + grant credits
    await prisma.user.update({
      where: { id: req.userId! },
      data: {
        isPaid: true,
        licenseKey: licenseKey.trim(),
        gumroadSaleId: purchase.sale_id || null,
        subscriptionId: purchase.subscription_id || null,
        subscriptionStatus: 'active',
        paidAt: new Date(),
        creditsTotal: CREDITS_PER_SUBSCRIPTION,
        creditsUsed: 0,
        expiresAt: purchase.subscription_ended_at
          ? new Date(purchase.subscription_ended_at)
          : null,
      },
    });

    logger.info(`License activated for user ${req.userId}`);
    res.json({ valid: true });
  } catch (err) {
    logger.error('Gumroad verification failed', err);
    res.status(500).json({ error: 'Failed to verify license. Please try again.' });
  }
});

// GET /api/license/status — check current user's subscription
router.get('/status', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: {
      isPaid: true,
      subscriptionStatus: true,
      paidAt: true,
      expiresAt: true,
      creditsTotal: true,
      creditsUsed: true,
    },
  });

  const creditsRemaining = (user?.creditsTotal || 0) - (user?.creditsUsed || 0);

  res.json({
    subscription: user,
    credits: {
      totalMinutes: Math.floor((user?.creditsTotal || 0) / 60),
      usedMinutes: Math.floor((user?.creditsUsed || 0) / 60),
      remainingMinutes: Math.floor(creditsRemaining / 60),
      remainingSeconds: creditsRemaining,
    },
  });
});

export default router;
