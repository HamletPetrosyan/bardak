# Lobby And Tables Explained

## Core model

Each game (`hex`, `belote`) has its own lobby.
Each lobby has user-created tables.

A table contains:
- `tableId`
- `gameType`
- `status`
- `seats`
- `createdAt`
- `updatedAt`
- `emptySince`

## Table sizes

- Hex: exactly 2 seats
- Belote: exactly 4 seats

## Rules enforced on backend

- User must be authenticated.
- User can sit in at most one seat per game lobby.
- Seat index must be valid.
- Occupied seat cannot be taken.
- Only seated user can set ready/unready.
- Only seated user can manually start.
- Start requires all seats occupied and all ready.

## Ready behavior

When composition changes (join or leave):
- backend resets all seated players to `not ready`

Why:
- avoids accidental ready carryover when table members changed
- keeps logic explicit and fair

## Start behavior

Table becomes startable when:
- required number of players are seated
- all seated players are ready

Then either:
- auto-start happens immediately after ready update, or
- user can click manual "Start Game Now"

On start:
- backend creates a placeholder session summary
- backend removes table from lobby
- backend broadcasts `session_started`
- frontend navigates relevant users to session page

## Inactivity + cleanup rule

This milestone defines inactivity as:
- table has zero seated users (`emptySince` is set)

Cleanup behavior:
- if table remains empty for 10 minutes, delete it
- cleanup task runs every 60 seconds
- non-empty tables are never deleted by this cleanup

Code location:
- cleanup logic in [lobbyStore.ts](/home/erankyun/Hpam/backend/src/lobby/lobbyStore.ts)
- cleanup timer setup in [index.ts](/home/erankyun/Hpam/backend/src/index.ts)
