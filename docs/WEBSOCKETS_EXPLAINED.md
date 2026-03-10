# WebSockets Explained (Milestone 3)

There are now two websocket channels:

1. Lobby channel (`/ws/lobby`)
2. Hex session channel (`/ws/hex-session`)

## 1) Lobby channel

Used for lobby/table updates:
- table create/join/leave/ready
- session started event

Messages:
- `lobby_snapshot`
- `session_started`

Files:
- backend: [lobbySocketServer.ts](/home/erankyun/Hpam/backend/src/websocket/lobbySocketServer.ts)
- frontend: [lobbySocket.ts](/home/erankyun/Hpam/frontend/src/lib/lobbySocket.ts)

## 2) Hex session channel

Used for active Hex gameplay session updates.

Message:
- `hex_state` (full authoritative session state)

Files:
- backend: [hexSocketServer.ts](/home/erankyun/Hpam/backend/src/websocket/hexSocketServer.ts)
- frontend: [hexSessionSocket.ts](/home/erankyun/Hpam/frontend/src/lib/hexSessionSocket.ts)

## Why full-state messages

For learning and clarity, server sends full latest state instead of fine-grained diffs.
This is simpler and avoids complex client merge logic.

## Authentication on websocket

Both channels use session token from login.
If token invalid, server closes connection.
