# How Auth Works (Simple Version)

## 1) Account keys

Backend has a small in-memory account list in [accounts.ts](/home/erankyun/Hpam/backend/src/data/accounts.ts).
Each account has:
- `accountId`
- `accountKey`
- `displayName`

## 2) Login

Frontend sends account key to:
- `POST /api/auth/login`

Backend:
- checks if key exists
- creates random session token
- stores token -> accountId in memory ([sessionStore.ts](/home/erankyun/Hpam/backend/src/sessionStore.ts))
- returns token + user info

Frontend:
- stores token in `localStorage` ([authStorage.ts](/home/erankyun/Hpam/frontend/src/lib/authStorage.ts))

## 3) Staying logged in after refresh

When app starts, [AuthContext.tsx](/home/erankyun/Hpam/frontend/src/context/AuthContext.tsx) reads token from `localStorage`.
Then it calls:
- `GET /api/auth/session`

If token is valid, user stays logged in.
If token is invalid, token is removed and user returns to login.

## 4) Protected API routes

Backend middleware [authMiddleware.ts](/home/erankyun/Hpam/backend/src/middleware/authMiddleware.ts) checks:
- `Authorization: Bearer <token>`
- token exists in session store

If invalid, backend returns `401`.

## 5) Logout

Frontend calls:
- `POST /api/auth/logout`

Backend removes token from memory, and frontend clears `localStorage` token.

## Important limitation in milestone 2

Sessions and accounts are in memory.
If backend restarts, active sessions are lost.
This is expected for milestone 2.
