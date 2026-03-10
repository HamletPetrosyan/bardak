import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { updateAccountDisplayName } from '../data/accounts.js';

export const userRoutes = Router();

userRoutes.patch('/display-name', authMiddleware, (request, response) => {
  const displayName = typeof request.body.displayName === 'string' ? request.body.displayName.trim() : '';

  if (!displayName) {
    response.status(400).json({ message: 'Display name is required' });
    return;
  }

  if (displayName.length > 30) {
    response.status(400).json({ message: 'Display name must be 30 characters or fewer' });
    return;
  }

  const user = updateAccountDisplayName(request.authAccountId!, displayName);

  if (!user) {
    response.status(404).json({ message: 'Account not found' });
    return;
  }

  response.json({ user });
});
