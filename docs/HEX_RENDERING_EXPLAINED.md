# Hex Rendering Explained

## Main rendering file

- [HexBoardPixi.tsx](/home/erankyun/Hpam/frontend/src/components/hex/HexBoardPixi.tsx)

## Coordinate mapping

Each hex cell `(row, col)` maps to pixel center using:
- `x = col * radius * 1.5`
- `y = (row + col * 0.5) * sqrt(3) * radius`

This creates a pointy-top hex layout.

## Draw steps per render

1. clear stage
2. compute board size/radius/offset to center board
3. draw border-edge hints (red and blue goal sides)
4. loop all cells:
   - draw hex polygon
   - attach click handlers for playable empty cells
   - draw stone circle for occupied cells
5. draw small legend text

## Click -> move flow

1. Pixi `pointertap` fires with cell row/col.
2. React callback in [HexSessionPage.tsx](/home/erankyun/Hpam/frontend/src/pages/hex/HexSessionPage.tsx) calls REST `POST /api/hex/sessions/:id/moves`.
3. Backend validates and updates state.
4. Backend broadcasts latest session over WebSocket.
5. React receives update and board redraws.

## Where to improve visuals later

- smoother hover/placement animations
- custom stone textures
- highlighted winning path
- responsive font and board spacing polish
