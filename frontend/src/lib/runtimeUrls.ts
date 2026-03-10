const DEFAULT_LOCAL_API_BASE_URL = 'http://localhost:4000';
const DEFAULT_LOCAL_WS_BASE_URL = 'ws://localhost:4000';

function normalizeBaseUrl(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

export function getApiBaseUrl(): string {
  const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (configuredApiBaseUrl) {
    return normalizeBaseUrl(configuredApiBaseUrl);
  }

  return DEFAULT_LOCAL_API_BASE_URL;
}

export function getWebSocketBaseUrl(): string {
  const configuredWsBaseUrl = import.meta.env.VITE_WS_BASE_URL?.trim();
  if (configuredWsBaseUrl) {
    return normalizeBaseUrl(configuredWsBaseUrl);
  }

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (apiBaseUrl) {
    return normalizeBaseUrl(apiBaseUrl.replace(/^http:\/\//, 'ws://').replace(/^https:\/\//, 'wss://'));
  }

  return DEFAULT_LOCAL_WS_BASE_URL;
}
