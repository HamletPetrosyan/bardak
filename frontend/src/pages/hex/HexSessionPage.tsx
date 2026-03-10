import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getHexSessionState, playHexMove, voteHexRematch } from '../../lib/api';
import { connectHexSessionSocket } from '../../lib/hexSessionSocket';
import { HexBoardPixi } from '../../components/hex/HexBoardPixi';
import type { HexSessionState } from '../../hex/types';

type HexSessionPageProps = {
  sessionId: string;
};

export function HexSessionPage({ sessionId }: HexSessionPageProps) {
  const { token, user } = useAuth();

  const [session, setSession] = useState<HexSessionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    let isMounted = true;

    setLoading(true);
    setErrorMessage(null);

    void getHexSessionState(token, sessionId)
      .then((result) => {
        if (!isMounted) {
          return;
        }
        setSession((currentSession) => {
          if (currentSession && currentSession.updatedAt === result.updatedAt) {
            return currentSession;
          }

          return result;
        });
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }
        setErrorMessage(error instanceof Error ? error.message : 'էս հեքսի կատկեն փուչ');
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    const disconnect = connectHexSessionSocket({
      token,
      sessionId,
      onState(nextSession) {
        if (!isMounted) {
          return;
        }

        setSession((currentSession) => {
          if (currentSession && currentSession.updatedAt === nextSession.updatedAt) {
            return currentSession;
          }

          return nextSession;
        });
        setLoading(false);
      },
      onError(message) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(message);
      }
    });

    const pollTimer = window.setInterval(() => {
      void getHexSessionState(token, sessionId)
        .then((result) => {
          if (!isMounted) {
            return;
          }

          setSession((currentSession) => {
            if (currentSession && currentSession.updatedAt === result.updatedAt) {
              return currentSession;
            }

            return result;
          });
        })
        .catch(() => {
          // Keep the current state if the refresh fails.
        });
    }, 1500);

    return () => {
      isMounted = false;
      window.clearInterval(pollTimer);
      disconnect();
    };
  }, [token, sessionId]);

  const myPlayer = useMemo(() => {
    if (!session || !user) {
      return null;
    }

    return session.players.find((player) => player.accountId === user.accountId) ?? null;
  }, [session, user]);

  const playerNames = useMemo(() => {
    if (!session) {
      return {
        red: 'Red',
        blue: 'Blue'
      };
    }

    return {
      red: session.players.find((player) => player.side === 'red')?.displayName ?? 'Red',
      blue: session.players.find((player) => player.side === 'blue')?.displayName ?? 'Blue'
    };
  }, [session]);

  const isMyTurn =
    session?.gameState.status === 'playing' && myPlayer?.side === session.gameState.currentTurn && !actionInProgress;

  const myRematchVote = myPlayer ? session?.rematchVotes[myPlayer.side] ?? false : false;
  const rematchVoteCount = session ? Number(session.rematchVotes.red) + Number(session.rematchVotes.blue) : 0;

  const statusLabel = useMemo(() => {
    if (!session) {
      return '';
    }

    if (session.gameState.status === 'game-over') {
      if (session.gameState.winnerSide === 'red') {
        return `${playerNames.red} հաղթող`;
      }

      if (session.gameState.winnerSide === 'blue') {
        return `${playerNames.blue} հաղթող`;
      }

      return 'վերջ խաղին';
    }

    return isMyTurn ? 'Քո քայլը' : `${playerNames[session.gameState.currentTurn]}`;
  }, [isMyTurn, playerNames, session]);

  const statusColorClass = useMemo(() => {
    if (!session) {
      return 'text-slate-200';
    }

    if (session.gameState.status === 'game-over') {
      return session.gameState.winnerSide === 'red' ? 'text-rose-400' : 'text-blue-400';
    }

    return session.gameState.currentTurn === 'red' ? 'text-rose-400' : 'text-blue-400';
  }, [session]);

  async function runAction(action: () => Promise<void>): Promise<void> {
    setActionInProgress(true);

    try {
      await action();
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Action failed');
    } finally {
      setActionInProgress(false);
    }
  }

  const handleCellClick = useCallback((row: number, col: number): void => {
    if (!token || !session || !isMyTurn) {
      return;
    }

    void runAction(async () => {
      const updatedSession = await playHexMove(token, session.sessionId, row, col);
      setSession(updatedSession);
    });
  }, [isMyTurn, session, token]);

  const handleRematchVote = useCallback((wantsRematch: boolean): void => {
    if (!token || !session || session.gameState.status !== 'game-over') {
      return;
    }

    void runAction(async () => {
      const updatedSession = await voteHexRematch(token, session.sessionId, wantsRematch);
      setSession(updatedSession);
    });
  }, [session, token]);

  if (loading) {
    return <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-300">Loading Hex session...</div>;
  }

  if (errorMessage && !session) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 px-6 text-center text-rose-400">
        {errorMessage}
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="h-screen w-screen bg-[radial-gradient(circle_at_top,#172554_0%,#020617_45%,#000000_100%)]">
      <div
        className="pointer-events-auto fixed left-4 top-4 z-10 max-w-xs select-text rounded-xl border border-slate-800/80 bg-slate-950/82 px-4 py-3 text-sm text-slate-100 shadow-xl backdrop-blur-md"
        style={{ fontFamily: 'Trigram, Adwaita Mono, JetBrains Mono, Fira Code, monospace' }}
      >
        <div className={`text-lg font-semibold ${statusColorClass}`}>{statusLabel}</div>

        {session.gameState.status === 'game-over' && (
          <div className="mt-3 space-y-3 border-t border-slate-800 pt-3">
            <div className="text-xs text-slate-400">
              Մի հատ էլ են քցում: {rematchVoteCount}/2
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  handleRematchVote(true);
                }}
                disabled={actionInProgress || myRematchVote}
                className="rounded-lg border border-emerald-700 bg-emerald-900/40 px-3 py-2 text-sm text-emerald-200 transition hover:bg-emerald-800/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {myRematchVote ? 'քցենք բա ինչ' : 'մի հատ էլ'}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleRematchVote(false);
                }}
                disabled={actionInProgress || !myRematchVote}
                className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                փչել
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="h-full w-full overflow-hidden">
        <HexBoardPixi
          board={session.gameState.board}
          canPlay={Boolean(isMyTurn)}
          onCellClick={handleCellClick}
        />
      </div>
      {errorMessage && (
        <div className="pointer-events-none fixed bottom-4 left-1/2 -translate-x-1/2 rounded-md border border-rose-900 bg-rose-950/80 px-4 py-2 text-sm text-rose-200">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
