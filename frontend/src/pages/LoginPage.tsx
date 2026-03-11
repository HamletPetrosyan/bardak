import { FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const [accountKey, setAccountKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { token, login, loginError } = useAuth();
  const pendingRedirectPath = new URLSearchParams(window.location.search).get('redirect');

  if (token) {
    return <Navigate to={pendingRedirectPath && pendingRedirectPath !== '/' ? pendingRedirectPath : '/home'} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    await login(accountKey.trim());
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-md items-center justify-center">
        <div className="w-full rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-black/30">
          <h1 className="text-2xl font-bold tracking-tight text-white">մուտք</h1>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              id="accountKey"
              value={accountKey}
              onChange={(event) => setAccountKey(event.target.value)}
              placeholder="քո բանալին"
              autoComplete="off"
              className="block w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 shadow-sm outline-none ring-0 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
            />
            <button
              type="submit"
              disabled={submitting || accountKey.trim() === ''}
              className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              {submitting ? 'բացվում է...' : 'բացել'}
            </button>
          </form>
          {loginError && <p className="mt-4 text-sm text-rose-400">{loginError}</p>}
        </div>
      </div>
      <div className="mx-auto mt-4 max-w-md text-center text-xs text-slate-500">
        սերվերները չեն ընկել (դեռ)
      </div>
    </div>
  );
}
