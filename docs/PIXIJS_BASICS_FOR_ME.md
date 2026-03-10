# PixiJS Basics For Me

## Where Pixi is integrated

Main file:
- [HexBoardPixi.tsx](/home/erankyun/Hpam/frontend/src/components/hex/HexBoardPixi.tsx)

This component owns the Pixi canvas for Hex board rendering.

## Lifecycle in React

1. On mount, component creates `new Application(...)`.
2. Canvas (`app.view`) is appended into a normal React `<div>`.
3. Another effect draws/re-draws board graphics from server state.
4. On unmount, component calls `app.destroy(true)`.

## How drawing works

For each board cell:
- compute pixel center from `(row, col)`
- draw hex polygon (`Graphics.drawPolygon`)
- if occupied, draw stone circle with side color

Also draws side-edge hints:
- red edges = top/bottom
- blue edges = left/right

## How clicks work

For playable empty cells:
- set Pixi object interactive (`eventMode = 'static'`)
- attach `pointertap` handler
- callback sends `(row, col)` to React page

React page then calls backend API to request move.

## Important idea

Pixi only draws what server state says.
Frontend does not authoritatively decide legal moves.
