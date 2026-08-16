import React from 'react';
import { Square } from 'chess.js';
import { ArrowInfo, ActiveColor } from '../types';

interface ChessArrowProps {
  arrow: ArrowInfo;
  orientation: ActiveColor; // 'w' = White at bottom, 'b' = Black at bottom
  boardSize: number; // in pixels (e.g. 560)
}

function squareToCoord(sq: Square, orientation: ActiveColor, boardSize: number): { x: number; y: number } {
  const file = sq.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = parseInt(sq[1], 10) - 1; // 0..7 (0 = rank 1, 7 = rank 8)
  const sqSize = boardSize / 8;

  let col = file;
  let row = 7 - rank;

  if (orientation === 'b') {
    col = 7 - file;
    row = rank;
  }

  return {
    x: col * sqSize + sqSize / 2,
    y: row * sqSize + sqSize / 2,
  };
}

export const ChessArrow: React.FC<ChessArrowProps> = ({ arrow, orientation, boardSize }) => {
  if (boardSize <= 0) return null;

  const start = squareToCoord(arrow.from, orientation, boardSize);
  const end = squareToCoord(arrow.to, orientation, boardSize);

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) return null;

  const sqSize = boardSize / 8;
  const arrowWidth = Math.max(7, sqSize * 0.18);
  const headSize = Math.max(16, sqSize * 0.42);

  // Unit vector in arrow direction
  const ux = dx / length;
  const uy = dy / length;

  // Perpendicular unit vector
  const px = -uy;
  const py = ux;

  // Shorten shaft slightly so arrowhead fits nicely
  const shaftEndX = end.x - ux * headSize;
  const shaftEndY = end.y - uy * headSize;

  // Arrowhead polygon vertices
  const tipX = end.x - ux * (sqSize * 0.12);
  const tipY = end.y - uy * (sqSize * 0.12);

  const leftWingX = shaftEndX + px * (headSize * 0.7);
  const leftWingY = shaftEndY + py * (headSize * 0.7);

  const rightWingX = shaftEndX - px * (headSize * 0.7);
  const rightWingY = shaftEndY - py * (headSize * 0.7);

  // Styling based on arrow type
  let fillColor = arrow.color || 'rgba(16, 185, 129, 0.85)';
  let glowFilter = 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.5))';
  let isHint = arrow.type === 'hint';
  let isAi = arrow.type === 'ai';

  if (isHint) {
    fillColor = 'rgba(245, 158, 11, 0.9)';
    glowFilter = 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.7))';
  } else if (arrow.type === 'user') {
    fillColor = 'rgba(59, 130, 246, 0.75)';
    glowFilter = 'drop-shadow(0 0 3px rgba(59, 130, 246, 0.4))';
  }

  return (
    <g
      id={`arrow-${arrow.id}`}
      className={`transition-opacity duration-300 pointer-events-none ${
        isAi ? 'ai-arrow-pulse' : isHint ? 'hint-arrow-pulse' : ''
      }`}
      style={{ filter: glowFilter }}
    >
      {/* Arrow Shaft */}
      <line
        x1={start.x}
        y1={start.y}
        x2={shaftEndX}
        y2={shaftEndY}
        stroke={fillColor}
        strokeWidth={arrowWidth}
        strokeLinecap="round"
      />

      {/* Arrowhead */}
      <polygon
        points={`${tipX},${tipY} ${leftWingX},${leftWingY} ${rightWingX},${rightWingY}`}
        fill={fillColor}
      />
    </g>
  );
};
