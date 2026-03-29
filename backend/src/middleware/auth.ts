import { Request, Response, NextFunction } from 'express';
import { clerkClient, getAuth } from '@clerk/express';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { CREDITS_PER_SUBSCRIPTION } from '../lib/constants.js';

export interface AuthRequest extends Request {
  userId?: string;       // internal DB user ID (ObjectId)
  clerkUserId?: string;  // Clerk user ID
  dbUser?: {
    id: string;
    isPaid: boolean;
    subscriptionStatus: string;
  };
}

/**
 * Verifies the Clerk session, upserts the user in our DB,
 * and attaches user info to the request.
 * Requires clerkMiddleware() to be applied globally first.
 */
export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const auth = getAuth(req);
    const clerkUserId = auth.userId;

    if (!clerkUserId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Upsert user in our DB
    let user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });

    if (!user) {
      // Fetch user details from Clerk
      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      const email = clerkUser.emailAddresses[0]?.emailAddress || '';

      user = await prisma.user.create({
        data: {
          clerkId: clerkUserId,
          email,
          name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null,
          imageUrl: clerkUser.imageUrl || null,
        },
      });
      logger.info(`New user created: ${user.id} (${email})`);
    }

    // Backfill credits for existing paid users who have 0 credits
    if (user.isPaid && user.creditsTotal === 0) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { creditsTotal: CREDITS_PER_SUBSCRIPTION },
      });
      logger.info(`Backfilled credits for user ${user.id}`);
    }

    req.clerkUserId = clerkUserId;
    req.userId = user.id;
    req.dbUser = {
      id: user.id,
      isPaid: user.isPaid,
      subscriptionStatus: user.subscriptionStatus,
    };

    next();
  } catch (err) {
    logger.error('Auth middleware error:', err);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Middleware to check if user has an active subscription.
 * Must be used after `authenticate`.
 */
export function requirePaid(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.dbUser?.isPaid) {
    res.status(403).json({ error: 'Active subscription required', code: 'SUBSCRIPTION_REQUIRED' });
    return;
  }
  next();
}
