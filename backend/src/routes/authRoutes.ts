import { Router } from 'express';
import { findAccountById, findAccountByKey, toPublicUser } from '../data/accounts.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { createSession, deleteSession } from '../sessionStore.js';
import { createSessionToken } from '../utils/token.js';

export const authRoutes = Router();

authRoutes.post('/login', async (request, response) => {
  const accountKey = typeof request.body.accountKey === 'string' ? request.body.accountKey.trim() : '';

  if (!accountKey) {
    response.status(400).json({ message: 'անհրաժեշտ է բանալի' });
    return;
  }

  const account = await findAccountByKey(accountKey);
  if (!account) {
    response.status(401).json({ message: 'խոտան բանալի' });
    return;
  }

  const token = createSessionToken();
  createSession(token, account.accountId);

  response.json({
    token,
    user: toPublicUser(account)
  });
});

authRoutes.get('/session', authMiddleware, async (request, response) => {
  const account = await findAccountById(request.authAccountId!);

  if (!account) {
    response.status(404).json({ message: 'հաշիվը չգտնվեց' });
    return;
  }

  response.json({ user: toPublicUser(account) });
});

authRoutes.post('/logout', authMiddleware, (request, response) => {
  deleteSession(request.authToken!);
  response.json({ success: true });
});
