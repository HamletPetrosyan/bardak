import crypto from 'crypto';

function getAccountKeyPepper(): string {
  const pepper = process.env.ACCOUNT_KEY_PEPPER;

  if (!pepper || pepper.trim() === '') {
    throw new Error('ACCOUNT_KEY_PEPPER is missing. Set it in backend/.env before starting the server.');
  }

  return pepper;
}

export function hashAccountKey(accountKey: string): string {
  const pepper = getAccountKeyPepper();

  return crypto
    .createHmac('sha256', pepper)
    .update(accountKey.trim(), 'utf8')
    .digest('hex');
}

export function safeHexEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a, 'hex');
  const bBuffer = Buffer.from(b, 'hex');

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}
