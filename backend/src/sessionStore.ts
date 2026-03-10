const sessionToAccountId = new Map<string, string>();

export function createSession(sessionToken: string, accountId: string): void {
  sessionToAccountId.set(sessionToken, accountId);
}

export function getAccountIdFromSession(sessionToken: string): string | null {
  return sessionToAccountId.get(sessionToken) ?? null;
}

export function deleteSession(sessionToken: string): void {
  sessionToAccountId.delete(sessionToken);
}
