import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getHexSessionPublicState, playHexMove, voteHexRematch } from '../hex/sessionStore.js';

export const hexRoutes = Router();

hexRoutes.use(authMiddleware);

hexRoutes.get('/sessions/:sessionId', (request, response) => {
  const session = getHexSessionPublicState(request.params.sessionId);

  if (!session) {
    response.status(404).json({ message: 'Hex session not found' });
    return;
  }

  const belongsToSession = session.players.some((player) => player.accountId === request.authAccountId);
  if (!belongsToSession) {
    response.status(403).json({ message: 'You are not part of this Hex session' });
    return;
  }

  response.json({ session });
});

hexRoutes.post('/sessions/:sessionId/moves', (request, response) => {
  try {
    const { row, col } = request.body as { row?: unknown; col?: unknown };

    if (typeof row !== 'number' || typeof col !== 'number') {
      response.status(400).json({ message: 'row and col must be numbers' });
      return;
    }

    const session = playHexMove(request.params.sessionId, request.authAccountId!, {
      row,
      col
    });

    response.json({ session });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not play move';
    response.status(400).json({ message });
  }
});

hexRoutes.post('/sessions/:sessionId/rematch-vote', (request, response) => {
  try {
    const { wantsRematch } = request.body as { wantsRematch?: unknown };

    if (typeof wantsRematch !== 'boolean') {
      response.status(400).json({ message: 'wantsRematch must be boolean' });
      return;
    }

    const session = voteHexRematch(request.params.sessionId, request.authAccountId!, wantsRematch);
    response.json({ session });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update rematch vote';
    response.status(400).json({ message });
  }
});
