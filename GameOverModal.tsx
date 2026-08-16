import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameStatus, ActiveColor, MoveRecord } from '../types';
import { Trophy, RefreshCw, Palette, AlertOctagon, Scale, Award } from 'lucide-react';

interface GameOverModalProps {
  status: GameStatus;
  winner: 'user' | 'ai' | 'draw' | null;
  userColor: ActiveColor;
  reason?: string;
  history: MoveRecord[];
  onPlayAgain: () => void;
  onChooseColors: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  status,
  winner,
  userColor,
  reason,
  history,
  onPlayAgain,
  onChooseColors,
}) => {
  const isUserWinner = winner === 'user';
  const isAiWinner = winner === 'ai';
  const isDraw = winner === 'draw' || status === 'stalemate' || status === 'draw';

  useEffect(() => {
    if (isUserWinner) {
      // Fire victory confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
        });
      } catch {
        // Safe fallback
      }
    }
  }, [isUserWinner]);

  let title = 'Game Over';
  let subtitle = '';
  let icon = <AlertOctagon className="w-8 h-8 text-neutral-400" />;

  if (status === 'checkmate') {
    if (isUserWinner) {
      title = 'Victory by Checkmate!';
      subtitle = 'Outstanding play! You outplayed the AI opponent.';
      icon = <Trophy className="w-10 h-10 text-amber-400" />;
    } else {
      title = 'Checkmate!';
      subtitle = 'The AI found the winning combination. Great game!';
      icon = <Award className="w-10 h-10 text-red-400" />;
    }
  } else if (status === 'stalemate') {
    title = 'Stalemate - Draw';
    subtitle = 'The active player has no legal moves and is not in check.';
    icon = <Scale className="w-10 h-10 text-blue-400" />;
  } else if (status === 'draw') {
    title = 'Game Drawn';
    subtitle = reason || 'The game concluded in a draw.';
    icon = <Scale className="w-10 h-10 text-blue-400" />;
  } else if (status === 'resigned') {
    title = isAiWinner ? 'You Resigned' : 'AI Resigned';
    subtitle = isAiWinner ? 'You conceded the game.' : 'AI conceded the position.';
    icon = <AlertOctagon className="w-10 h-10 text-amber-500" />;
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0F1115]/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#16191E] border border-white/10 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Header Icon */}
        <div className="mx-auto w-16 h-16 rounded-xl bg-[#1e2229] border border-white/10 flex items-center justify-center mb-4 shadow-inner">
          {icon}
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display mb-1.5">
          {title}
        </h2>
        <p className="text-xs text-slate-400 mb-6">{subtitle}</p>

        {/* Match Statistics Box */}
        <div className="bg-[#1e2229] rounded-xl p-4 border border-white/10 mb-6 text-left grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-slate-500 uppercase font-bold text-[10px]">Total Moves</span>
            <div className="font-bold text-white text-base font-mono">
              {Math.ceil(history.length / 2)} moves ({history.length} plies)
            </div>
          </div>
          <div>
            <span className="text-slate-500 uppercase font-bold text-[10px]">Your Side</span>
            <div className="font-bold text-white text-base">
              {userColor === 'w' ? 'White (First)' : 'Black (Second)'}
            </div>
          </div>
          <div className="col-span-2 pt-2 border-t border-white/10 flex items-center justify-between text-slate-400">
            <span>Result:</span>
            <span className="font-mono font-bold text-emerald-400">
              {isUserWinner ? (userColor === 'w' ? '1 - 0' : '0 - 1') : isAiWinner ? (userColor === 'w' ? '0 - 1' : '1 - 0') : '½ - ½'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onPlayAgain}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/40 active:scale-98 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Play Again</span>
          </button>
          <button
            type="button"
            onClick={onChooseColors}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-[#1e2229] hover:bg-[#252a33] text-slate-200 font-bold rounded-xl border border-white/10 active:scale-98 transition-all cursor-pointer"
          >
            <Palette className="w-4 h-4" />
            <span>Change Side</span>
          </button>
        </div>
      </div>
    </div>
  );
};
