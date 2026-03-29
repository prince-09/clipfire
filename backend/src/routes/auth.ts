import { Router, Request, Response } from 'express';

// Auth bypassed — stub routes so frontend doesn't 404
const router = Router();

router.post('/register', (_req: Request, res: Response) => {
  res.json({ message: 'Auth bypassed' });
});

router.post('/login', (_req: Request, res: Response) => {
  res.json({ message: 'Auth bypassed' });
});

router.get('/me', (_req: Request, res: Response) => {
  res.json({ user: { id: 'dev-user', name: 'Dev User', email: 'dev@local' } });
});

export default router;
