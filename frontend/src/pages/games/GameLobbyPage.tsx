import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  createTable,
  getLobbySnapshot,
  joinSeat,
  leaveSeat,
  setReady,
  startTable
} from '../../lib/api';
import { connectLobbySocket } from '../../lib/lobbySocket';
import { gameTitle, isGameType, type GameType, type LobbySnapshot } from '../../lobby/types';
import { TableCard } from '../../components/lobby/TableCard';

export function GameLobbyPage() {
  const { gameType: gameTypeParam } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [snapshot, setSnapshot] = useState<LobbySnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  if (!gameTypeParam || !isGameType(gameTypeParam)) {
    return <Navigate to="/home" replace />;
  }

  const gameType: GameType = gameTypeParam;

  useEffect(() => {
    if (!token || !user) {
      return;
    }

    let isMounted = true;

    setIsLoading(true);
    setErrorMessage(null);

    void getLobbySnapshot(token, gameType)
      .then((result) => {
        if (!isMounted) {
          return;
        }
        setSnapshot(result);
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }
        setErrorMessage(error instanceof Error ? error.message : 'սեղաններին չհասանք');
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    const disconnect = connectLobbySocket({
      token,
      gameType,
      onSnapshot(nextSnapshot) {
        if (!isMounted) {
          return;
        }
        setSnapshot(nextSnapshot);
        setIsLoading(false);
      },
      onSessionStarted(session) {
        if (!isMounted) {
          return;
        }

        const isCurrentUserInSession = session.players.some((player) => player.accountId === user.accountId);
        if (isCurrentUserInSession) {
          navigate(`/games/${gameType}/session/${session.sessionId}`);
        }
      },
      onError(message) {
        if (!isMounted) {
          return;
        }
        setErrorMessage(message);
      }
    });

    const pollTimer = window.setInterval(() => {
      void getLobbySnapshot(token, gameType)
        .then((result) => {
          if (!isMounted) {
            return;
          }

          setSnapshot(result);
          setIsLoading(false);
        })
        .catch(() => {
          // Keep the current snapshot if polling fails.
        });
    }, 2000);

    return () => {
      isMounted = false;
      window.clearInterval(pollTimer);
      disconnect();
    };
  }, [token, user, gameType, navigate]);

  const isUserSeatedInThisGame = useMemo(() => {
    if (!snapshot || !user) {
      return false;
    }

    return snapshot.tables.some((table) => table.seats.some((seat) => seat?.accountId === user.accountId));
  }, [snapshot, user]);

  const selectedTable = useMemo(() => {
    if (!snapshot || !selectedTableId) {
      return null;
    }

    return snapshot.tables.find((table) => table.tableId === selectedTableId) ?? null;
  }, [snapshot, selectedTableId]);

  useEffect(() => {
    if (!selectedTableId || !snapshot) {
      return;
    }

    const stillExists = snapshot.tables.some((table) => table.tableId === selectedTableId);
    if (!stillExists) {
      setSelectedTableId(null);
    }
  }, [snapshot, selectedTableId]);

  async function runAction(action: () => Promise<void>) {
    setActionInProgress(true);
    setActionMessage(null);

    try {
      await action();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'չստացվեց';
      setActionMessage(message);
    } finally {
      setActionInProgress(false);
    }
  }

  function toggleTableSelection(tableId: string): void {
    setSelectedTableId((current) => (current === tableId ? null : tableId));
  }

  if (!token || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-black/30">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">սպասում ենք {gameTitle(gameType)} խաղանք</h1>
              <p className="mt-1 text-sm text-slate-400"></p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/home"
                className="inline-flex items-center justify-center rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-700"
              >
                դեպի անցյալ
              </Link>
            </div>
          </div>

          {selectedTable && (
            <p className="mt-4 text-sm text-slate-300">
              ընտրված սեղան՝ <strong>{selectedTable.tableId}</strong>
            </p>
          )}
        </header>

        {isLoading && <p className="text-slate-400">սեղաններ...</p>}
        {errorMessage && <p className="text-sm text-rose-400">{errorMessage}</p>}
        {actionMessage && <p className="text-sm text-rose-400">{actionMessage}</p>}

        {!isLoading && snapshot && snapshot.tables.length === 0 && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-300">
            սեղան չկա
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          <button
            type="button"
            disabled={actionInProgress}
            onClick={() =>
              void runAction(async () => {
                await createTable(token, gameType);
              })
            }
            className="group flex min-h-[220px] w-full flex-col justify-between rounded-xl border border-dashed border-slate-700 bg-slate-900 p-5 text-left transition hover:border-blue-500 hover:bg-slate-900/80 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">նոր սեղան</p>
              <h3 className="mt-2 text-lg font-semibold text-white">իմ սեղանն եմ ուզում</h3>
            </div>
            <span className="mt-6 inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
              +
            </span>
          </button>

          {snapshot?.tables.map((table) => (
            <TableCard
              key={table.tableId}
              table={table}
              isSelected={table.tableId === selectedTableId}
              onToggleSelect={toggleTableSelection}
              currentUserId={user.accountId}
              requiredPlayers={snapshot.requiredPlayers}
              isUserSeatedInThisGame={isUserSeatedInThisGame}
              actionInProgress={actionInProgress}
              onJoinSeat={(tableId, seatIndex) =>
                void runAction(async () => {
                  await joinSeat(token, gameType, tableId, seatIndex);
                })
              }
              onLeaveSeat={(tableId) =>
                void runAction(async () => {
                  await leaveSeat(token, gameType, tableId);
                })
              }
              onSetReady={(tableId, isReady) =>
                void runAction(async () => {
                  await setReady(token, gameType, tableId, isReady);
                })
              }
              onStartTable={(tableId) =>
                void runAction(async () => {
                  await startTable(token, gameType, tableId);
                })
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
