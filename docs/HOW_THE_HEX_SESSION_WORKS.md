# How The Hex Session Works

## Core files

Backend:
- [hex/index.ts](/home/erankyun/Hpam/backend/src/hex/index.ts)
- [hex/sessionStore.ts](/home/erankyun/Hpam/backend/src/hex/sessionStore.ts)
- [routes/hexRoutes.ts](/home/erankyun/Hpam/backend/src/routes/hexRoutes.ts)
- [websocket/hexSocketServer.ts](/home/erankyun/Hpam/backend/src/websocket/hexSocketServer.ts)

Frontend:
- [HexSessionPage.tsx](/home/erankyun/Hpam/frontend/src/pages/hex/HexSessionPage.tsx)
- [hexSessionSocket.ts](/home/erankyun/Hpam/frontend/src/lib/hexSessionSocket.ts)

## Session creation

When lobby marks a Hex table as started, it emits a `session_started` event.
`initializeHexSessionBridge()` listens to that and creates an initial Hex session:
- assigns player 1 -> red
- assigns player 2 -> blue
- creates empty board
- starts with red turn

## Real-time updates

- REST actions change state (`move`, `rematch vote`).
- Session store emits updated state.
- Hex WebSocket server broadcasts `hex_state` to session clients.
- React page updates local state and re-renders.

## Rematch design (simple)

- only available after game over
- each side can vote true/false
- when both votes are true:
  - board resets
  - round number increments
  - starting side alternates each round
  - votes reset to false

## Server-authoritative rule

Frontend can disable obvious invalid actions, but backend always validates:
- turn owner
- coordinates
- empty cell
- game status
- player belongs to session
