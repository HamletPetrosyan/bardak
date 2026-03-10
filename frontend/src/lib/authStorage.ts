const SESSION_TOKEN_KEY = 'hpam_session_token';

export function saveSessionToken(token: string): void {
  localStorage.setItem(SESSION_TOKEN_KEY, token);
}

export function getSessionToken(): string | null {
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

export function clearSessionToken(): void {
  localStorage.removeItem(SESSION_TOKEN_KEY);
}
