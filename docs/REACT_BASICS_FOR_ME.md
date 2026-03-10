# React Basics For This Project

## How pages work here

Pages are React components in `frontend/src/pages`.

Examples:
- [LoginPage.tsx](/home/erankyun/Hpam/frontend/src/pages/LoginPage.tsx)
- [HomePage.tsx](/home/erankyun/Hpam/frontend/src/pages/HomePage.tsx)

Each page is just a function returning JSX.

## How routing works

Routes are defined in [App.tsx](/home/erankyun/Hpam/frontend/src/App.tsx) with `react-router-dom`.

Important routes now:
- `/login`
- `/home`
- `/games/:gameType/lobby`
- `/games/:gameType/session/:sessionId`

## What AuthContext does

[AuthContext.tsx](/home/erankyun/Hpam/frontend/src/context/AuthContext.tsx) keeps shared auth state:
- logged in user
- session token
- loading state
- login/logout/update actions

Any component can read this using `useAuth()`.

## Why ProtectedRoute exists

[ProtectedRoute.tsx](/home/erankyun/Hpam/frontend/src/components/ProtectedRoute.tsx) checks if token exists.
- If no token: redirect to `/login`
- If token exists: show requested page

This prevents direct access to private pages from the URL bar.

## Good reading order for frontend code

1. [main.tsx](/home/erankyun/Hpam/frontend/src/main.tsx)
2. [App.tsx](/home/erankyun/Hpam/frontend/src/App.tsx)
3. [AuthContext.tsx](/home/erankyun/Hpam/frontend/src/context/AuthContext.tsx)
4. [ProtectedRoute.tsx](/home/erankyun/Hpam/frontend/src/components/ProtectedRoute.tsx)
5. [LoginPage.tsx](/home/erankyun/Hpam/frontend/src/pages/LoginPage.tsx)
6. [HomePage.tsx](/home/erankyun/Hpam/frontend/src/pages/HomePage.tsx)
7. [GameLobbyPage.tsx](/home/erankyun/Hpam/frontend/src/pages/games/GameLobbyPage.tsx)
8. [TableCard.tsx](/home/erankyun/Hpam/frontend/src/components/lobby/TableCard.tsx)
9. [lobbySocket.ts](/home/erankyun/Hpam/frontend/src/lib/lobbySocket.ts)
10. [api.ts](/home/erankyun/Hpam/frontend/src/lib/api.ts)
