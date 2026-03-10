import type { NextFunction, Request, Response } from 'express';
import { getAccountIdFromSession } from '../sessionStore.js';

declare global {
  namespace Express {
    interface Request {
      authAccountId?: string;
      authToken?: string;
    }
  }
}

export function authMiddleware(request: Request, response: Response, next: NextFunction): void {
  const authHeader = request.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    response.status(401).json({ message: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  const accountId = getAccountIdFromSession(token);

  if (!accountId) {
    response.status(401).json({ message: 'Session is invalid or expired' });
    return;
  }

  request.authToken = token;
  request.authAccountId = accountId;
  next();
}
