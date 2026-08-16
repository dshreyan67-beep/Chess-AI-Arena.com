import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Chess, Square, PieceSymbol, Color, Move } from 'chess.js';
import { ActiveColor, BoardTheme, ArrowInfo } from '../types';
import { ChessPiece } from '../utils/chessPieces';
import { ChessArrow } from './ChessArrow';

interface ChessBoardProps {
  chess: Chess;
  orientation: ActiveColor; // 'w' = White bottom, 'b' = Black bottom
  userColor: ActiveColor;
  isAiTurn: boolean;
  theme: BoardTheme;
  arrows: ArrowInfo[];
  lastMove: { from: Square; to: Square } | null;
  onUserMove: (from: Square, to: Square, promotion?: PieceSymbol) => boolean;
  disabled?: boolean;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  chess,
  orientation,
  userColor,
  isAiTurn,
  theme,
  arrows,
  lastMove,
  onUserMove,
  disabled = false,
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [boardDimension, setBoardDimension] = useState<number>(560);

  // ResizeObserver to ensure SVG arrows scale properly on any screen
  useEffect(() => {
    if (!boardRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setBoardDimension(entry.contentRect.width);
        }
      }
    });
    observer.observe(boardRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute legal moves for currently selected square
  const legalMovesForSelected = useMemo(() => {
    if (!selectedSquare || disabled || isAiTurn) return [];
    try {
      return chess.moves({ square: selectedSquare, verbose: true });
    } catch {
      return [];
    }
  }, [chess, selectedSquare, disabled, isAiTurn]);

  // Find King square if currently in check
  const checkSquare = useMemo<Square | null>(() => {
    if (!chess.inCheck()) return null;
    const turn = chess.turn();
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'k' && p.color === turn) {
          const file = String.fromCharCode('a'.charCodeAt(0) + c);
          const rank = 8 - r;
          return `${file}${rank}` as Square;
        }
      }
    }
    return null;
  }, [chess]);

  // Handle clicking a square
  const handleSquareClick = (sq: Square) => {
    if (disabled || isAiTurn) return;

    // If waiting for promotion selection, ignore clicks on the board
    if (pendingPromotion) return;

    const piece = chess.get(sq);

    // If clicking on one's own piece, select it
    if (piece && piece.color === userColor) {
      setSelectedSquare(sq);
      return;
    }

    // If a piece was already selected and user clicks destination
    if (selectedSquare) {
      const isLegal = legalMovesForSelected.some(m => m.to === sq);
      if (isLegal) {
        const selectedPiece = chess.get(selectedSquare);
        // Check if move is a pawn promotion
        const isPromotion =
          selectedPiece?.type === 'p' &&
          ((userColor === 'w' && sq.endsWith('8')) || (userColor === 'b' && sq.endsWith('1')));

        if (isPromotion) {
          setPendingPromotion({ from: selectedSquare, to: sq });
          return;
        }

        const success = onUserMove(selectedSquare, sq);
        if (success) {
          setSelectedSquare(null);
        }
      } else {
        // Clicked an invalid square, deselect
        setSelectedSquare(null);
      }
    }
  };

  const handlePromotionPick = (pieceType: PieceSymbol) => {
    if (!pendingPromotion) return;
    onUserMove(pendingPromotion.from, pendingPromotion.to, pieceType);
    setPendingPromotion(null);
    setSelectedSquare(null);
  };

  // Build 8x8 grid based on orientation
  const ranks = orientation === 'w' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  const files = orientation === 'w' ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];

  return (
    <div className="relative w-full max-w-[560px] mx-auto select-none">
      {/* Board Outer Container */}
      <div
        ref={boardRef}
        id="chess-board-container"
        className={`relative aspect-square w-full rounded-lg overflow-hidden shadow-2xl border-[10px] sm:border-[12px] ${theme.borderColor} transition-colors duration-300`}
      >
        {/* 8x8 Grid */}
        <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
          {ranks.map((rank, rIdx) =>
            files.map((file, fIdx) => {
              const sq = `${file}${rank}` as Square;
              const isLight = (rIdx + fIdx) % 2 === 0;
              const isSelected = selectedSquare === sq;
              const isLastMoveFrom = lastMove?.from === sq;
              const isLastMoveTo = lastMove?.to === sq;
              const isKingInCheck = checkSquare === sq;

              // Check if this square is a legal destination for the selected piece
              const legalMoveTarget = legalMovesForSelected.find(m => m.to === sq);
              const pieceOnSquare = chess.get(sq);

              // Square background styling
              let squareBgClass = isLight ? theme.lightSquare : theme.darkSquare;
              if (isLastMoveFrom || isLastMoveTo) {
                squareBgClass = isLight ? theme.lightHighlight : theme.darkHighlight;
              }
              if (isSelected) {
                squareBgClass = 'bg-[#f6f669] ring-2 ring-amber-400 ring-inset';
              }

              return (
                <div
                  key={sq}
                  id={`square-${sq}`}
                  onClick={() => handleSquareClick(sq)}
                  className={`relative flex items-center justify-center cursor-pointer transition-colors duration-150 ${squareBgClass}`}
                >
                  {/* Rank / File Coordinate Labels on edges */}
                  {fIdx === 0 && (
                    <span
                      className={`absolute top-0.5 left-1 text-[10px] sm:text-xs font-bold pointer-events-none ${
                        isLight ? 'text-black/35' : 'text-white/35'
                      }`}
                    >
                      {rank}
                    </span>
                  )}
                  {rIdx === 7 && (
                    <span
                      className={`absolute bottom-0.5 right-1 text-[10px] sm:text-xs font-bold pointer-events-none ${
                        isLight ? 'text-black/35' : 'text-white/35'
                      }`}
                    >
                      {file}
                    </span>
                  )}

                  {/* King in Check indicator */}
                  {isKingInCheck && (
                    <div className="absolute inset-0 bg-red-600/60 rounded-full animate-ping pointer-events-none" />
                  )}

                  {/* Chess Piece */}
                  {pieceOnSquare && (
                    <div className="w-[82%] h-[82%] flex items-center justify-center z-10 transition-transform active:scale-95">
                      <ChessPiece piece={pieceOnSquare.type} color={pieceOnSquare.color} />
                    </div>
                  )}

                  {/* Legal Move Indicators */}
                  {legalMoveTarget && !pieceOnSquare && (
                    <div className="absolute w-[26%] h-[26%] rounded-full bg-black/15 pointer-events-none z-20" />
                  )}

                  {legalMoveTarget && pieceOnSquare && (
                    <div className="absolute inset-1 rounded-full border-4 border-red-500/70 bg-red-500/20 pointer-events-none z-20" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* SVG Arrow Layer */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-30 overflow-visible"
          viewBox={`0 0 ${boardDimension} ${boardDimension}`}
        >
          {arrows.map(arrow => (
            <ChessArrow
              key={arrow.id}
              arrow={arrow}
              orientation={orientation}
              boardSize={boardDimension}
            />
          ))}
        </svg>

        {/* Pawn Promotion Modal Popup */}
        {pendingPromotion && (
          <div className="absolute inset-0 z-50 bg-[#0F1115]/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#16191E] border border-white/10 rounded-2xl p-5 shadow-2xl text-center max-w-xs w-full animate-in fade-in zoom-in-95 duration-200">
              <h3 className="text-base font-bold text-white mb-1">Promote Pawn</h3>
              <p className="text-xs text-slate-400 mb-4">Choose a piece for promotion:</p>
              <div className="grid grid-cols-4 gap-2">
                {(['q', 'r', 'b', 'n'] as PieceSymbol[]).map(pType => (
                  <button
                    key={pType}
                    id={`promo-btn-${pType}`}
                    onClick={() => handlePromotionPick(pType)}
                    className="p-3 bg-[#1e2229] hover:bg-[#252a33] active:bg-emerald-600 rounded-xl border border-white/10 hover:border-emerald-500/60 transition-all flex flex-col items-center justify-center gap-1 group"
                  >
                    <div className="w-10 h-10 group-hover:scale-110 transition-transform">
                      <ChessPiece piece={pType} color={userColor} />
                    </div>
                    <span className="text-[10px] font-bold uppercase text-slate-300 group-hover:text-white">
                      {pType === 'q' ? 'Queen' : pType === 'r' ? 'Rook' : pType === 'b' ? 'Bishop' : 'Knight'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
