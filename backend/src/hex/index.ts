import { subscribeSessionStarts } from '../lobby/lobbyStore.js';
import { createHexSessionFromLobby } from './sessionStore.js';

export function initializeHexSessionBridge(): void {
  subscribeSessionStarts((gameType, sessionSummary) => {
    if (gameType !== 'hex') {
      return;
    }

    createHexSessionFromLobby({
      ...sessionSummary,
      gameType: 'hex'
    });
  });
}
