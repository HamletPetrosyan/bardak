import type { Table } from '../../lobby/types';

type TableCardProps = {
  table: Table;
  isSelected: boolean;
  onToggleSelect: (tableId: string) => void;
  currentUserId: string;
  requiredPlayers: number;
  isUserSeatedInThisGame: boolean;
  onJoinSeat: (tableId: string, seatIndex: number) => void;
  onLeaveSeat: (tableId: string) => void;
  onSetReady: (tableId: string, isReady: boolean) => void;
  onStartTable: (tableId: string) => void;
  actionInProgress: boolean;
};

function occupiedCount(table: Table): number {
  return table.seats.filter((seat) => seat !== null).length;
}

function getCurrentUserSeatIndex(table: Table, currentUserId: string): number {
  return table.seats.findIndex((seat) => seat?.accountId === currentUserId);
}

function tableStatusLabelArmenian(status: Table['status']): string {
  if (status === 'waiting') {
    return 'սպասում';
  }

  if (status === 'ready-to-start') {
    return 'կազմ֊պատրաստ';
  }

  return 'ընթացքում';
}

export function TableCard(props: TableCardProps) {
  const {
    table,
    isSelected,
    onToggleSelect,
    currentUserId,
    requiredPlayers,
    isUserSeatedInThisGame,
    onJoinSeat,
    onLeaveSeat,
    onSetReady,
    onStartTable,
    actionInProgress
  } = props;

  const currentUserSeatIndex = getCurrentUserSeatIndex(table, currentUserId);
  const currentUserSeat = currentUserSeatIndex >= 0 ? table.seats[currentUserSeatIndex] : null;

  return (
    <div
      className={`cursor-pointer rounded-xl border p-4 transition ${
        isSelected
          ? 'border-blue-500 bg-slate-900 shadow-lg shadow-blue-900/20'
          : 'border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-900/80'
      }`}
      onClick={() => onToggleSelect(table.tableId)}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">սեղան {table.tableId}</h3>
          <p className="mt-1 text-sm text-slate-400">
            զբաղված աթոռներ․ {occupiedCount(table)} / {requiredPlayers}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            table.status === 'ready-to-start'
              ? 'bg-emerald-900/40 text-emerald-300'
              : table.status === 'in-game'
                ? 'bg-blue-900/40 text-blue-300'
                : 'bg-slate-800 text-slate-300'
          }`}
        >
          {tableStatusLabelArmenian(table.status)}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {table.seats.map((seat, index) => {
          const canJoinThisSeat = seat === null && !isUserSeatedInThisGame;

          return (
            <div
              key={index}
              className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${
                seat?.accountId === currentUserId
                  ? 'border-amber-400 bg-amber-500/20 shadow-[0_0_0_1px_rgba(251,191,36,0.35)]'
                  : 'border-slate-800 bg-slate-950/50'
              }`}
            >
              <div className={`text-sm ${seat?.accountId === currentUserId ? 'text-amber-100' : 'text-slate-200'}`}>
                <strong>աթոռ {index + 1}</strong>{' '}
                {seat ? (
                  <span className={seat?.accountId === currentUserId ? 'text-amber-200' : 'text-slate-300'}>
                    - {seat.displayName} ({seat.isReady ? 'պատրաստ' : 'անպատրաստ'})
                  </span>
                ) : (
                  <span className="text-slate-500">- ազատ</span>
                )}
              </div>

              {canJoinThisSeat && (
                <button
                  disabled={actionInProgress}
                  onClick={(event) => {
                    event.stopPropagation();
                    onJoinSeat(table.tableId, index);
                  }}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-700"
                >
                  նստել
                </button>
              )}
            </div>
          );
        })}

        {isSelected && (
          <>
            {currentUserSeat && (
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  disabled={actionInProgress}
                  onClick={(event) => {
                    event.stopPropagation();
                    onLeaveSeat(table.tableId);
                  }}
                  className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  կանգնել
                </button>
                <button
                  disabled={actionInProgress}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSetReady(table.tableId, !currentUserSeat.isReady);
                  }}
                  className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-700"
                >
                  {currentUserSeat.isReady ? 'սպասեք մի քիչ' : 'պատրաստ եմ'}
                </button>
              </div>
            )}

            {table.status === 'ready-to-start' && currentUserSeat && (
              <button
                disabled={actionInProgress}
                onClick={(event) => {
                  event.stopPropagation();
                  onStartTable(table.tableId);
                }}
                className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-700"
              >
                սկսել խաղը
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
