import { useEffect, useRef, useState } from 'react';
import { Application, Graphics, Polygon } from 'pixi.js';
import type { HexCellState, HexPlayerSide } from '../../hex/types';

type HexBoardPixiProps = {
  board: HexCellState[][];
  canPlay: boolean;
  onCellClick: (row: number, col: number) => void;
};

type PixelPoint = {
  x: number;
  y: number;
};

type TileStyle = {
  fillColor: number;
  borderColor: number;
  borderWidth: number;
};

const RED_COLOR = 0xef4444;
const BLUE_COLOR = 0x3b82f6;
const EMPTY_COLOR = 0x0f172a;
const EMPTY_HOVER_COLOR = 0x172554;
const TILE_BORDER_COLOR = 0x475569;
const TILE_HOVER_BORDER_COLOR = 0x93c5fd;
const BACKGROUND_COLOR = 0x020617;
const ENABLE_ANTIALIAS = true;

function hexCornerPoints(centerX: number, centerY: number, radius: number): PixelPoint[] {
  const angles = [-90, -30, 30, 90, 150, 210];

  return angles.map((angleDegrees) => {
    const angleRadians = (Math.PI / 180) * angleDegrees;

    return {
      x: centerX + radius * Math.cos(angleRadians),
      y: centerY + radius * Math.sin(angleRadians)
    };
  });
}

function polygonPoints(points: PixelPoint[]): number[] {
  return points.flatMap((point) => [point.x, point.y]);
}

function cellToPixel(row: number, col: number, radius: number): PixelPoint {
  const horizontalStep = (Math.sqrt(3) * radius) / 2;
  const verticalStep = 1.5 * radius;

  return {
    x: (col - row) * horizontalStep,
    y: (col + row) * verticalStep
  };
}

function sideColor(side: HexPlayerSide): number {
  return side === 'red' ? RED_COLOR : BLUE_COLOR;
}

function tileFillColor(cell: HexCellState): number {
  if (cell === 'red') {
    return 0x7f1d1d;
  }

  if (cell === 'blue') {
    return 0x1d4ed8;
  }

  return EMPTY_COLOR;
}

function drawHexPolygon(tile: Graphics, points: PixelPoint[], style: TileStyle): void {
  tile.clear();
  tile.lineStyle({
    color: style.borderColor,
    width: style.borderWidth,
    alignment: 0.5
  });
  tile.beginFill(style.fillColor, 1);
  tile.drawPolygon(polygonPoints(points));
  tile.endFill();
}

function drawBoundarySegments(edge: Graphics, segments: PixelPoint[][], color: number, width: number): void {
  edge.clear();
  edge.lineStyle({ color, width, join: 'round', cap: 'round' } as never);

  for (const points of segments) {
    if (points.length === 0) {
      continue;
    }

    edge.moveTo(points[0].x, points[0].y);

    for (let index = 1; index < points.length; index += 1) {
      edge.lineTo(points[index].x, points[index].y);
    }
  }
}

function createDefaultTileStyle(cell: HexCellState): TileStyle {
  if (cell === 'empty') {
    return {
      fillColor: EMPTY_COLOR,
      borderColor: TILE_BORDER_COLOR,
      borderWidth: 2.2
    };
  }

  return {
    fillColor: tileFillColor(cell),
    borderColor: sideColor(cell),
    borderWidth: 2.6
  };
}

export function HexBoardPixi({ board, canPlay, onCellClick }: HexBoardPixiProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const pixiAppRef = useRef<Application | null>(null);
  const previousBoardRef = useRef<HexCellState[][] | null>(null);
  const onCellClickRef = useRef(onCellClick);
  const [resizeVersion, setResizeVersion] = useState(0);

  useEffect(() => {
    onCellClickRef.current = onCellClick;
  }, [onCellClick]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const app = new Application({
      backgroundAlpha: 0,
      antialias: ENABLE_ANTIALIAS,
      autoDensity: true,
      resolution: Math.max(1, window.devicePixelRatio || 1),
      resizeTo: host
    });

    pixiAppRef.current = app;
    host.appendChild(app.view as HTMLCanvasElement);

    const handleResize = () => {
      setResizeVersion((value) => value + 1);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      app.destroy(true);
      pixiAppRef.current = null;
    };
  }, []);

  useEffect(() => {
    const app = pixiAppRef.current;
    if (!app) {
      return;
    }

    const boardSize = board.length;
    if (boardSize === 0) {
      return;
    }

    const removedChildren = app.stage.removeChildren();
    removedChildren.forEach((child) => child.destroy());

    const width = app.screen.width;
    const height = app.screen.height;
    const padding = Math.max(24, Math.min(width, height) * 0.04);

    const boardWidthFactor = Math.sqrt(3) * (boardSize - 1) + 2.4;
    const boardHeightFactor = 3 * (boardSize - 1) + 2.4;
    const radiusFromWidth = (width - padding * 2) / boardWidthFactor;
    const radiusFromHeight = (height - padding * 2) / boardHeightFactor;
    const radius = Math.max(12, Math.min(radiusFromWidth, radiusFromHeight));

    const centers: PixelPoint[][] = [];
    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (let row = 0; row < boardSize; row += 1) {
      const centerRow: PixelPoint[] = [];

      for (let col = 0; col < boardSize; col += 1) {
        const point = cellToPixel(row, col, radius);
        centerRow.push(point);

        minX = Math.min(minX, point.x - radius);
        maxX = Math.max(maxX, point.x + radius);
        minY = Math.min(minY, point.y - radius);
        maxY = Math.max(maxY, point.y + radius);
      }

      centers.push(centerRow);
    }

    const offsetX = (width - (maxX - minX)) / 2 - minX;
    const offsetY = (height - (maxY - minY)) / 2 - minY;

    const background = new Graphics();
    background.beginFill(BACKGROUND_COLOR, 1);
    background.drawRect(0, 0, width, height);
    background.endFill();
    background.eventMode = 'none';
    app.stage.addChild(background);

    let placedCell:
      | {
          row: number;
          col: number;
          side: HexPlayerSide;
        }
      | null = null;

    const previousBoard = previousBoardRef.current;
    if (previousBoard) {
      for (let row = 0; row < boardSize; row += 1) {
        for (let col = 0; col < boardSize; col += 1) {
          if (previousBoard[row][col] === 'empty' && board[row][col] !== 'empty') {
            placedCell = {
              row,
              col,
              side: board[row][col] as HexPlayerSide
            };
          }
        }
      }
    }

    const redBoundarySegments: PixelPoint[][] = [];
    const blueBoundarySegments: PixelPoint[][] = [];

    for (let row = 0; row < boardSize; row += 1) {
      for (let col = 0; col < boardSize; col += 1) {
        const center = centers[row][col];
        const centerX = offsetX + center.x;
        const centerY = offsetY + center.y;
        const corners = hexCornerPoints(centerX, centerY, radius * 0.92);
        const cell = board[row][col];

        const tile = new Graphics();
        const defaultStyle = createDefaultTileStyle(cell);
        drawHexPolygon(tile, corners, defaultStyle);
        tile.hitArea = new Polygon(polygonPoints(corners));

        if (canPlay && cell === 'empty') {
          const hoverStyle: TileStyle = {
            fillColor: EMPTY_HOVER_COLOR,
            borderColor: TILE_HOVER_BORDER_COLOR,
            borderWidth: 2.8
          };

          tile.eventMode = 'static';
          tile.cursor = 'pointer';
          tile.on('pointertap', () => {
            onCellClickRef.current(row, col);
          });
          tile.on('pointerover', () => {
            drawHexPolygon(tile, corners, hoverStyle);
          });
          tile.on('pointerout', () => {
            drawHexPolygon(tile, corners, defaultStyle);
          });
        } else {
          tile.eventMode = 'none';
        }

        app.stage.addChild(tile);

        if (row === 0) {
          redBoundarySegments.push([corners[0], corners[1], corners[2]]);
        }

        if (row === boardSize - 1) {
          redBoundarySegments.push([corners[5], corners[4], corners[3]]);
        }

        if (col === 0) {
          blueBoundarySegments.push([corners[4], corners[5], corners[0]]);
        }

        if (col === boardSize - 1) {
          blueBoundarySegments.push([corners[1], corners[2], corners[3]]);
        }

        if (placedCell && placedCell.row === row && placedCell.col === col) {
          const fillOverlay = new Graphics();
          fillOverlay.beginFill(sideColor(placedCell.side), 1);
          fillOverlay.drawPolygon(polygonPoints(corners));
          fillOverlay.endFill();
          fillOverlay.alpha = 0;
          fillOverlay.eventMode = 'none';
          app.stage.addChild(fillOverlay);

          let frameCount = 0;
          const animatePlacement = () => {
            frameCount += 1;
            const progress = Math.min(frameCount / 10, 1);
            fillOverlay.alpha = progress;

            if (frameCount >= 10) {
              app.ticker.remove(animatePlacement);
              fillOverlay.destroy();
            }
          };

          app.ticker.add(animatePlacement);
        }
      }
    }

    const redBoundary = new Graphics();
    redBoundary.eventMode = 'none';
    drawBoundarySegments(redBoundary, redBoundarySegments, RED_COLOR, 4);
    app.stage.addChild(redBoundary);

    const blueBoundary = new Graphics();
    blueBoundary.eventMode = 'none';
    drawBoundarySegments(blueBoundary, blueBoundarySegments, BLUE_COLOR, 4);
    app.stage.addChild(blueBoundary);

    previousBoardRef.current = board.map((boardRow) => [...boardRow]);
  }, [board, canPlay, resizeVersion]);

  return <div ref={hostRef} className="hex-board-canvas" />;
}
