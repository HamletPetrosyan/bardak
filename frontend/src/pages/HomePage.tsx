import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function HomePage() {
  const { user, logout, changeDisplayName } = useAuth();
  const [displayNameInput, setDisplayNameInput] = useState(user?.displayName ?? '');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);

  async function handleDisplayNameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage(null);

    const nextName = displayNameInput.trim();
    if (!nextName) {
      setStatusMessage('Display name cannot be empty.');
      return;
    }

    const error = await changeDisplayName(nextName);
    if (error) {
      setStatusMessage(error);
      return;
    }

    setStatusMessage('Display name updated.');
    setIsEditingDisplayName(false);
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-black/30">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">հաշիվդ</h1>
            </div>
            <button
              onClick={() => void logout()}
              className="inline-flex items-center justify-center rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-700"
            >
              փակել
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Հաշիվի ID</p>
              <p className="mt-2 text-base font-semibold text-slate-200">{user.accountId}</p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Երևացող անունը</p>
                  <p className="mt-2 text-base font-semibold text-slate-200">{user.displayName}</p>
                </div>
                <button
                  onClick={() => {
                    setStatusMessage(null);
                    setDisplayNameInput(user.displayName);
                    setIsEditingDisplayName((value) => !value);
                  }}
                  className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  {isEditingDisplayName ? 'փոշմանեցի' : 'փոխել'}
                </button>
              </div>

              {isEditingDisplayName && (
                <form onSubmit={handleDisplayNameSubmit} className="mt-4 space-y-3">
                  <label htmlFor="displayName" className="block text-sm font-medium text-slate-300">
                    նոր անուն
                  </label>
                  <input
                    id="displayName"
                    value={displayNameInput}
                    onChange={(event) => setDisplayNameInput(event.target.value)}
                    placeholder="Type your display name"
                    className="block w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                  >
                    չփոշմանեցի
                  </button>
                </form>
              )}
            </div>
          </div>

          {statusMessage && <p className="mt-4 text-sm text-rose-400">{statusMessage}</p>}
        </header>

        <div className="grid gap-5 md:grid-cols-1">
          <Link
            to="/games/hex/lobby"
            className="group block overflow-hidden rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-900/80"
          >
            <div className="flex h-full flex-col">
              <div className="flex-1 rounded-lg border border-dashed border-slate-700 bg-slate-800/70 p-4">
                <div className="flex h-40 items-center justify-center rounded-md border border-slate-700 bg-slate-900/60 text-slate-500">
                  Hex cover image placeholder
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-slate-100">Հեքս</h3>
                <p className="mt-1 text-sm text-slate-400">
                  2 խաղացող
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
