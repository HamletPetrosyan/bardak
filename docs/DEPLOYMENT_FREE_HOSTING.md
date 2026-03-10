# Free Deployment Guide

This guide is for the current `Hpam` repository as it exists now.

Target hosting:

- Frontend: Cloudflare Pages
- Backend: Render Web Service

This is written for the current codebase, not a generic React/Node project.

## 1. Repository Inspection Summary

### Frontend

- Location: `frontend/`
- Main app files:
  - [frontend/src/main.tsx](/home/erankyun/Hpam/frontend/src/main.tsx)
  - [frontend/src/App.tsx](/home/erankyun/Hpam/frontend/src/App.tsx)
- Build command:
  - `npm run build`
- Output directory:
  - `frontend/dist`
- Current backend connection:
  - HTTP API: [frontend/src/lib/api.ts](/home/erankyun/Hpam/frontend/src/lib/api.ts)
  - Lobby WebSocket: [frontend/src/lib/lobbySocket.ts](/home/erankyun/Hpam/frontend/src/lib/lobbySocket.ts)
  - Hex session WebSocket: [frontend/src/lib/hexSessionSocket.ts](/home/erankyun/Hpam/frontend/src/lib/hexSessionSocket.ts)
  - Runtime URL resolver: [frontend/src/lib/runtimeUrls.ts](/home/erankyun/Hpam/frontend/src/lib/runtimeUrls.ts)

### Backend

- Location: `backend/`
- Main server file:
  - [backend/src/index.ts](/home/erankyun/Hpam/backend/src/index.ts)
- Build command:
  - `npm run build`
- Start command:
  - `npm run start`
- Port:
  - uses `process.env.PORT`, fallback `4000`
  - see [backend/src/config.ts](/home/erankyun/Hpam/backend/src/config.ts)
- WebSockets:
  - yes
  - `/ws/lobby`
  - `/ws/hex-session`

### Environment Variables Used

Frontend:

- `VITE_API_BASE_URL`
- `VITE_WS_BASE_URL` optional

Backend:

- `PORT`
- `FRONTEND_ORIGIN`
- `HEX_BOARD_SIZE`
- `ACCOUNT_KEY_PEPPER`
- `ACCOUNT_KEY_ALICE` optional seed only
- `ACCOUNT_KEY_BOB` optional seed only

### Deployment Risks Found

1. Frontend previously depended on localhost fallbacks.
   This is now handled by [frontend/src/lib/runtimeUrls.ts](/home/erankyun/Hpam/frontend/src/lib/runtimeUrls.ts).

2. The app uses `BrowserRouter`.
   Cloudflare Pages needs a SPA rewrite rule.
   This is now handled by [frontend/public/_redirects](/home/erankyun/Hpam/frontend/public/_redirects).

3. Backend CORS must match the real frontend domain.
   This is controlled by `FRONTEND_ORIGIN`.

4. Current backend persistence uses SQLite files under `backend/storage/`.
   This is not durable on a free Render web service, because Render free web services do not provide persistent local disk.

## 2. Required Code Changes

These changes are already applied in the repository.

### Frontend Changes

- API and WebSocket URLs now resolve from env vars:
  - [frontend/src/lib/runtimeUrls.ts](/home/erankyun/Hpam/frontend/src/lib/runtimeUrls.ts)
- Updated API file:
  - [frontend/src/lib/api.ts](/home/erankyun/Hpam/frontend/src/lib/api.ts)
- Updated WebSocket files:
  - [frontend/src/lib/lobbySocket.ts](/home/erankyun/Hpam/frontend/src/lib/lobbySocket.ts)
  - [frontend/src/lib/hexSessionSocket.ts](/home/erankyun/Hpam/frontend/src/lib/hexSessionSocket.ts)
- SPA redirects for Cloudflare Pages:
  - [frontend/public/_redirects](/home/erankyun/Hpam/frontend/public/_redirects)

### Backend Changes

The backend is already production-friendly in these areas:

- listens on `process.env.PORT`
- has CORS config
- provides `/api/health`
- uses one HTTP server for both HTTP and WebSockets

### Environment Variable Files

- Frontend example: [frontend/.env.example](/home/erankyun/Hpam/frontend/.env.example)
- Backend example: [backend/.env.example](/home/erankyun/Hpam/backend/.env.example)

## 3. Environment Variables

### Local Development

Frontend `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:4000
VITE_WS_BASE_URL=ws://localhost:4000
```

Backend `backend/.env`

```env
PORT=4000
FRONTEND_ORIGIN=http://localhost:5173
HEX_BOARD_SIZE=11
ACCOUNT_KEY_PEPPER=change-this-to-a-long-random-secret
ACCOUNT_KEY_ALICE=replace-with-real-alice-key
ACCOUNT_KEY_BOB=replace-with-real-bob-key
```

### Production

Cloudflare Pages:

```env
VITE_API_BASE_URL=https://your-backend.onrender.com
```

Optional:

```env
VITE_WS_BASE_URL=wss://your-backend.onrender.com
```

Render:

```env
FRONTEND_ORIGIN=https://your-project.pages.dev
HEX_BOARD_SIZE=11
ACCOUNT_KEY_PEPPER=<long-random-secret>
ACCOUNT_KEY_ALICE=<optional-first-seed-only>
ACCOUNT_KEY_BOB=<optional-first-seed-only>
```

`PORT` should normally be left alone on Render.

## 4. Deploy Backend to Render

### Step-by-step

1. Create a Render account.
2. Push your current repository to GitHub.
3. In Render, click `New`.
4. Choose `Web Service`.
5. Connect your GitHub account if needed.
6. Select this repository.
7. Configure the service:
   - Name: `hpam-backend`
   - Root Directory: `backend`
   - Runtime: `Node`
   - Branch: your main branch
8. Set Build Command:

```bash
npm install && npm run build
```

9. Set Start Command:

```bash
npm run start
```

10. Add Environment Variables:
   - `FRONTEND_ORIGIN=https://<your-pages-project>.pages.dev`
   - `HEX_BOARD_SIZE=11`
   - `ACCOUNT_KEY_PEPPER=<long-random-secret>`
   - optional:
     - `ACCOUNT_KEY_ALICE=...`
     - `ACCOUNT_KEY_BOB=...`

11. Optional Health Check Path:

```text
/api/health
```

12. Create the service.

### Expected backend URL

Example:

```text
https://hpam-backend.onrender.com
```

### Test the backend

Open:

```text
https://hpam-backend.onrender.com/api/health
```

Expected response:

```json
{ "status": "ok" }
```

### WebSockets on Render

This project uses WebSockets on the same backend service:

- `wss://<backend-domain>/ws/lobby`
- `wss://<backend-domain>/ws/hex-session`

Render web services support WebSockets.

## 5. Deploy Frontend to Cloudflare Pages

### Step-by-step

1. Create a Cloudflare account.
2. Go to `Workers & Pages`.
3. Click `Create application`.
4. Choose `Pages`.
5. Connect GitHub if needed.
6. Select this repository.
7. Configure build settings:
   - Framework preset: `React (Vite)` if shown
   - Root directory: `frontend`
   - Build command:

```bash
npm run build
```

   - Build output directory:

```text
dist
```

8. Add environment variable:

```env
VITE_API_BASE_URL=https://hpam-backend.onrender.com
```

Optional:

```env
VITE_WS_BASE_URL=wss://hpam-backend.onrender.com
```

9. Deploy.

### Expected frontend URL

Example:

```text
https://your-project.pages.dev
```

## 6. Connect Frontend to Backend

The frontend already reads production URLs from env vars.

Relevant files:

- [frontend/src/lib/runtimeUrls.ts](/home/erankyun/Hpam/frontend/src/lib/runtimeUrls.ts)
- [frontend/src/lib/api.ts](/home/erankyun/Hpam/frontend/src/lib/api.ts)
- [frontend/src/lib/lobbySocket.ts](/home/erankyun/Hpam/frontend/src/lib/lobbySocket.ts)
- [frontend/src/lib/hexSessionSocket.ts](/home/erankyun/Hpam/frontend/src/lib/hexSessionSocket.ts)

Recommended production setup:

```env
VITE_API_BASE_URL=https://hpam-backend.onrender.com
```

If `VITE_WS_BASE_URL` is omitted, the frontend derives it automatically:

- `http://...` -> `ws://...`
- `https://...` -> `wss://...`

## 7. Custom Domain Setup

Recommended structure:

- Frontend: `www.mydomain.com`
- Backend: `api.mydomain.com`

### Cloudflare Pages custom domain

1. Open your Pages project.
2. Go to `Custom domains`.
3. Add `www.mydomain.com`.
4. Cloudflare will guide you through the needed DNS record.

Usually this ends up as a CNAME for `www`.

### Render custom domain

1. Open your backend service in Render.
2. Go to `Settings`.
3. Open `Custom Domains`.
4. Add `api.mydomain.com`.
5. Render will show the DNS target you must create.

Usually this is a CNAME for `api`.

### DNS example

- `www` -> Cloudflare Pages target
- `api` -> Render target

### HTTPS and WSS

If frontend uses HTTPS, backend WebSockets must use WSS.

That means production should be:

- frontend: `https://...`
- backend API: `https://...`
- websocket: `wss://...`

Do not use `ws://` from an HTTPS page.

## 8. Testing Checklist

Use this after both deployments are live.

1. Frontend loads from the Pages URL.
2. Refreshing `/home` works and does not return 404.
3. Login works.
4. Session is restored after refresh.
5. Home page loads.
6. Hex lobby loads.
7. Table creation works.
8. Joining and leaving seats works.
9. Ready state updates.
10. WebSocket connects.
11. Session starts correctly.
12. Hex board loads.
13. Moves broadcast to both players.
14. Winner detection works.
15. Rematch works.
16. `/api/health` returns OK.
17. No CORS errors appear in browser console.

## 9. Troubleshooting

### Frontend loads but API calls fail

- Check `VITE_API_BASE_URL` in Cloudflare Pages.
- Re-deploy frontend after changing env vars.
- Confirm backend `/api/health` works directly.

### CORS errors

- `FRONTEND_ORIGIN` must exactly match frontend domain.
- Example:
  - `https://your-project.pages.dev`
  - or `https://www.mydomain.com`

### WebSocket connection fails

- Ensure frontend is using `wss://` in production.
- Check backend health endpoint.
- Check Render service logs.

### Refresh gives 404

- This app uses `BrowserRouter`.
- Make sure `_redirects` is deployed:
  - [frontend/public/_redirects](/home/erankyun/Hpam/frontend/public/_redirects)

### Missing environment variables

- Frontend env vars are build-time values.
- Backend env vars are runtime values.
- After changes, redeploy or restart the affected service.

### Render service sleeps

- Free Render web services spin down after idle time.
- First request after sleep may be slow.

### Mixed content error

- Happens when frontend is `https://` but backend websocket is `ws://`
- Use `wss://`

### Data disappears after redeploy or restart

This is the major limitation of the current backend on free Render.

Current backend persistence:

- `backend/storage/accounts.sqlite`
- `backend/storage/hex-results.sqlite`

On free Render web services, local disk is not durable across service restarts/redeployments.

That means:

- account changes may be lost
- recorded game results may be lost

## 10. Important Reality Check About Free Hosting

Frontend on Cloudflare Pages is fine.

Backend on Render free web service will run, but your current SQLite persistence is not a stable production solution there.

If you deploy exactly as-is:

- app can work
- login/lobby/game can work
- but local database files are not guaranteed to survive

So you have two realistic choices:

1. Deploy now for testing and accept that stored names/results may reset.
2. Move backend persistence to a hosted database before relying on deployed data.

## 11. Exact Commands You May Need

Local frontend build:

```bash
cd /home/erankyun/Hpam/frontend
npm install
npm run build
```

Local backend build:

```bash
cd /home/erankyun/Hpam/backend
npm install
npm run build
```

Add or update an account in the backend DB:

```bash
cd /home/erankyun/Hpam/backend
npm run account:upsert -- --account-id charlie --display-name Charlie --account-key your-secret-key
```

## 12. Files You Should Read First

1. [frontend/src/lib/runtimeUrls.ts](/home/erankyun/Hpam/frontend/src/lib/runtimeUrls.ts)
2. [frontend/src/lib/api.ts](/home/erankyun/Hpam/frontend/src/lib/api.ts)
3. [frontend/src/lib/lobbySocket.ts](/home/erankyun/Hpam/frontend/src/lib/lobbySocket.ts)
4. [frontend/src/lib/hexSessionSocket.ts](/home/erankyun/Hpam/frontend/src/lib/hexSessionSocket.ts)
5. [backend/src/index.ts](/home/erankyun/Hpam/backend/src/index.ts)
6. [backend/src/config.ts](/home/erankyun/Hpam/backend/src/config.ts)
7. [backend/src/database/accountsDatabase.ts](/home/erankyun/Hpam/backend/src/database/accountsDatabase.ts)
8. [backend/src/database/hexResultsDatabase.ts](/home/erankyun/Hpam/backend/src/database/hexResultsDatabase.ts)
