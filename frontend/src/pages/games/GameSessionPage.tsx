import { Navigate, useParams } from 'react-router-dom';
import { isGameType } from '../../lobby/types';
import { HexSessionPage } from '../hex/HexSessionPage';
import { BeloteSessionPlaceholderPage } from './BeloteSessionPlaceholderPage';

export function GameSessionPage() {
  const { gameType: gameTypeParam, sessionId } = useParams();

  if (!gameTypeParam || !isGameType(gameTypeParam) || !sessionId) {
    return <Navigate to="/home" replace />;
  }

  if (gameTypeParam === 'hex') {
    return <HexSessionPage sessionId={sessionId} />;
  }

  return <BeloteSessionPlaceholderPage sessionId={sessionId} />;
}
