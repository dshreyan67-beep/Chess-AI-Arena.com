import React from 'react';
import { Chess, PieceSymbol, Color } from 'chess.js';
import { ActiveColor, EloRating, GameStatus } from '../types';
import { ChessPiece } from '../utils/chessPieces';
import { User, Bot, Loader2, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface GameInfoProps {
  chess: Chess;
  userColor: ActiveColor;
  aiColor: ActiveColor;
  currentElo: EloRating;
  isAiTurn: boolean;
  aiStatusMessage: string;
  gameStatus: GameStatus;
  moveCount: number;
}

const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

export const GameInfo: React.FC<GameInfoProps> = ({
  chess,
  userColor,
  aiColor,
  currentElo,
  isAiTurn,
  aiStatusMessage,
  gameStatus,
  moveCount,
}) => {
  const currentTurn = chess.turn();
  const isUserTurn = currentTurn === userColor && gameStatus === 'playing';
  const inCheck = chess.inCheck() && gameStatus === 'playing';

  // Calculate captured pieces
  const capturedPieces = React.useMemo(() => {
    const fullSet: Record<Color, Record<PieceSymbol, number>> = {
      w: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 },
      b: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 },
    };

    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece) {
          fullSet[piece.color][piece.type]--;
        }
      }
    }

    const whiteLosses: PieceSymbol[] = [];
    const blackLosses: PieceSymbol[] = [];

    (['q', 'r', 'b', 'n', 'p'] as PieceSymbol[]).forEach(pt => {
      for (let i = 0; i < fullSet.w[pt]; i++) whiteLosses.push(pt);
      for (let i = 0; i < fullSet.b[pt]; i++) blackLosses.push(pt);
    });

    let whiteMaterial = 0;
    let blackMaterial = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p) {
          if (p.color === 'w') whiteMaterial += PIECE_VALUES[p.type];
          else blackMaterial += PIECE_VALUES[p.type];
        }
      }
    }

    const diff = whiteMaterial - blackMaterial; // >0 white ahead, <0 black ahead

    return {
      whiteCapturedByBlack: whiteLosses, // Black captured these white pieces
      blackCapturedByWhite: blackLosses, // White captured these black pieces
      diff,
    };
  }, [chess]);

  const userMaterialAdvantage =
    userColor === 'w' ? capturedPieces.diff : -capturedPieces.diff;
  const aiMaterialAdvantage = -userMaterialAdvantage;

  const userCapturedPieces =
    userColor === 'w'
      ? capturedPieces.blackCapturedByWhite
      : capturedPieces.whiteCapturedByBlack;
  const aiCapturedPieces =
    aiColor === 'w'
      ? capturedPieces.blackCapturedByWhite
      : capturedPieces.whiteCapturedByBlack;

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Top Player: AI */}
      <div
        id="player-card-ai"
        className={`p-3.5 rounded-xl border transition-all ${
          isAiTurn && gameStatus === 'playing'
            ? 'bg-[#16191E] border-emerald-500/60 shadow-lg shadow-emerald-950/30'
            : 'bg-[#16191E] border-white/5'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* AI Avatar */}
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-[#2D333B] flex items-center justify-center text-xl shadow-md">
                <span>🤖</span>
              </div>
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#16191E] flex items-center justify-center text-[9px] font-bold ${
                  aiColor === 'w' ? 'bg-white text-slate-900' : 'bg-[#0F1115] text-white'
                }`}
              >
                {aiColor === 'w' ? 'W' : 'B'}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-white">AI ({aiColor === 'w' ? 'White' : 'Black'})</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {currentElo} Elo • Human-like
                </span>
              </div>
              <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                <span>Plays {aiColor === 'w' ? 'White' : 'Black'}</span>
                {aiMaterialAdvantage > 0 && (
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    +{aiMaterialAdvantage}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* AI Status / Turn Indicator */}
          <div>
            {isAiTurn && gameStatus === 'playing' ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-medium animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{aiStatusMessage || 'AI is thinking...'}</span>
              </div>
            ) : inCheck && currentTurn === aiColor ? (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-red-500/15 text-red-400 border border-red-500/30 rounded-full text-xs font-bold">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>In Check</span>
              </div>
            ) : (
              <div className="text-xs text-slate-500 font-medium">Waiting</div>
            )}
          </div>
        </div>

        {/* AI Captured Pieces */}
        {aiCapturedPieces.length > 0 && (
          <div className="flex items-center gap-0.5 mt-2.5 pt-2 border-t border-white/5 overflow-x-auto">
            <span className="text-[10px] text-slate-500 uppercase font-bold mr-1.5">Captured:</span>
            {aiCapturedPieces.map((p, idx) => (
              <div key={idx} className="w-4 h-4 opacity-85">
                <ChessPiece piece={p} color={userColor} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Game Status Banner */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#16191E] border border-white/5 rounded-xl text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Turn:</span>
          <span className="font-bold text-white flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full inline-block ${
                currentTurn === 'w' ? 'bg-white shadow-[0_0_6px_#fff]' : 'bg-[#2D333B] border border-slate-400'
              }`}
            />
            {isUserTurn ? 'Your Move' : isAiTurn ? "AI's Move" : 'Game Over'}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-slate-400">
          <span>Ply {moveCount}</span>
          <span>•</span>
          <span className="font-semibold text-slate-300">
            {gameStatus === 'playing' ? (inCheck ? 'Check!' : 'In Progress') : gameStatus.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Bottom Player: User */}
      <div
        id="player-card-user"
        className={`p-3.5 rounded-xl border transition-all ${
          isUserTurn
            ? 'bg-[#16191E] border-emerald-500/60 shadow-lg shadow-emerald-950/20'
            : 'bg-[#16191E] border-white/5'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* User Avatar */}
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-xl font-bold text-white shadow-md">
                <span>U</span>
              </div>
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#16191E] flex items-center justify-center text-[9px] font-bold ${
                  userColor === 'w' ? 'bg-white text-slate-900' : 'bg-[#0F1115] text-white'
                }`}
              >
                {userColor === 'w' ? 'W' : 'B'}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-white">You ({userColor === 'w' ? 'White' : 'Black'})</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-slate-400 border border-white/10">
                  Guest Player
                </span>
              </div>
              <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                <span>Plays {userColor === 'w' ? 'White' : 'Black'}</span>
                {userMaterialAdvantage > 0 && (
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    +{userMaterialAdvantage}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* User Turn Indicator */}
          <div>
            {isUserTurn ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold">
                <span>Your Move</span>
              </div>
            ) : inCheck && currentTurn === userColor ? (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-red-500/15 text-red-400 border border-red-500/30 rounded-full text-xs font-bold">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>You're in Check</span>
              </div>
            ) : (
              <div className="text-xs text-slate-500 font-medium">Waiting for AI</div>
            )}
          </div>
        </div>

        {/* User Captured Pieces */}
        {userCapturedPieces.length > 0 && (
          <div className="flex items-center gap-0.5 mt-2.5 pt-2 border-t border-white/5 overflow-x-auto">
            <span className="text-[10px] text-slate-500 uppercase font-bold mr-1.5">Captured:</span>
            {userCapturedPieces.map((p, idx) => (
              <div key={idx} className="w-4 h-4 opacity-85">
                <ChessPiece piece={p} color={aiColor} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
