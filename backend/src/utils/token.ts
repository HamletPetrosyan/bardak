import crypto from 'crypto';

export function createSessionToken(): string {
  return crypto.randomBytes(24).toString('hex');
}
