# Architecture (Milestone 3)

## Flow from login to Hex gameplay

1. User logs in.
2. User enters Hex lobby.
3. User creates/joins table and gets ready.
4. Table starts and lobby system creates a session summary.
5. Hex bridge listens to session-start events and creates Hex game state.
6. Frontend navigates to `/games/hex/session/:sessionId`.
7. Frontend loads Hex state by HTTP and subscribes to Hex session WebSocket.
8. Moves/rematch actions go to backend REST endpoints.
9. Backend validates and updates state, then broadcasts new Hex state via WebSocket.

## Backend structure

- `backend/src/lobby/*`: existing lobby/table/session-start flow.
- `backend/src/hex/types.ts`: Hex domain types.
- `backend/src/hex/engine.ts`: pure Hex game rules.
- `backend/src/hex/sessionStore.ts`: in-memory Hex session state and actions.
- `backend/src/hex/index.ts`: bridge from lobby session-start to Hex session creation.
- `backend/src/routes/hexRoutes.ts`: Hex HTTP API (`get state`, `move`, `rematch vote`).
- `backend/src/websocket/hexSocketServer.ts`: Hex session WebSocket broadcasting.

## Frontend structure

- `frontend/src/pages/hex/HexSessionPage.tsx`: main Hex screen and user actions.
- `frontend/src/components/hex/HexBoardPixi.tsx`: PixiJS canvas + board drawing + cell clicks.
- `frontend/src/lib/hexSessionSocket.ts`: WebSocket client for Hex session updates.
- `frontend/src/hex/types.ts`: Hex state/message types.
- `frontend/src/lib/api.ts`: REST calls for Hex endpoints.
- `frontend/src/pages/games/GameSessionPage.tsx`: routes Hex to real page, Belote to placeholder.

## Why this separation

- `engine.ts` is pure logic and easy to test.
- `sessionStore.ts` handles multiplayer/session concerns.
- rendering lives only in frontend Pixi component.
- transport (REST/WebSocket) stays separate from game rules.

## Where to improve later

- Belote gameplay module similar to Hex module.
- Better Hex visuals/animations in Pixi component.
- Persist sessions to database.
