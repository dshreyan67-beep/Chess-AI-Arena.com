import React from 'react';
import { PlayerColorChoice, EloRating } from '../types';
import { ChessPiece } from '../utils/chessPieces';
import { Sparkles, Dices, Brain, Zap, Trophy } from 'lucide-react';

interface ColorSelectionModalProps {
  onStartGame: (choice: PlayerColorChoice, elo: EloRating) => void;
  currentElo: EloRating;
  onEloChange: (elo: EloRating) => void;
}

export const ColorSelectionModal: React.FC<ColorSelectionModalProps> = ({
  onStartGame,
  currentElo,
  onEloChange,
}) => {
  const eloOptions: { elo: EloRating; label: string; desc: string }[] = [
    { elo: 800, label: '800 Elo', desc: 'Beginner • Casual moves' },
    { elo: 900, label: '900 Elo', desc: '900 Elo • Club beginner' },
    { elo: 950, label: '950 Elo (Default)', desc: '950 Elo • Natural human play' },
    { elo: 1000, label: '1000 Elo', desc: '1000 Elo • Solid fundamentals' },
    { elo: 1100, label: '1100 Elo', desc: '1100 Elo • Intermediate tactics' },
    { elo: 1200, label: '1200 Elo', desc: '1200 Elo • Sharp tactical play' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#0F1115]/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#16191E] border border-white/10 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold mb-2 text-white">
            Select Your Side
          </h2>
          <p className="text-xs text-slate-400">
            Choose your side and challenge a realistic 900–1200 Elo human-like AI.
          </p>
        </div>

        {/* AI Elo Level Selector */}
        <div className="mb-6">
          <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            <span className="flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-emerald-400" />
              Opponent Strength
            </span>
            <span className="text-emerald-400 font-mono font-semibold">~{currentElo} Elo</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {eloOptions.map(opt => (
              <button
                key={opt.elo}
                type="button"
                onClick={() => onEloChange(opt.elo)}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  currentElo === opt.elo
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 ring-1 ring-emerald-500/40'
                    : 'bg-[#1e2229] border-white/10 text-slate-300 hover:border-emerald-500/60 hover:bg-[#252a33]'
                }`}
              >
                <div className="font-semibold text-xs text-white">{opt.label}</div>
                <div className="text-[10px] text-slate-400 line-clamp-1">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Color Choice Options */}
        <div className="space-y-3 mb-6">
          <div className="grid grid-cols-3 gap-3">
            {/* White */}
            <button
              id="select-color-white"
              type="button"
              onClick={() => onStartGame('w', currentElo)}
              className="group flex flex-col items-center justify-center p-5 bg-[#1e2229] border border-white/10 rounded-xl hover:border-emerald-500 hover:bg-[#252a33] transition-all cursor-pointer"
            >
              <span className="text-5xl sm:text-6xl mb-3 group-hover:scale-110 transition-transform">♔</span>
              <span className="font-medium text-sm text-white">Play as White</span>
              <span className="text-[10px] text-slate-400 mt-0.5">You move 1st</span>
            </button>

            {/* Random */}
            <button
              id="select-color-random"
              type="button"
              onClick={() => onStartGame('random', currentElo)}
              className="group flex flex-col items-center justify-center p-5 bg-[#1e2229] border border-white/10 rounded-xl hover:border-emerald-500 hover:bg-[#252a33] transition-all cursor-pointer"
            >
              <span className="text-5xl sm:text-6xl mb-3 group-hover:scale-110 transition-transform">🎲</span>
              <span className="font-medium text-sm text-emerald-400">Random Color</span>
              <span className="text-[10px] text-slate-400 mt-0.5">50 / 50</span>
            </button>

            {/* Black */}
            <button
              id="select-color-black"
              type="button"
              onClick={() => onStartGame('b', currentElo)}
              className="group flex flex-col items-center justify-center p-5 bg-[#1e2229] border border-white/10 rounded-xl hover:border-emerald-500 hover:bg-[#252a33] transition-all cursor-pointer"
            >
              <span className="text-5xl sm:text-6xl mb-3 group-hover:scale-110 transition-transform">♚</span>
              <span className="font-medium text-sm text-white">Play as Black</span>
              <span className="text-[10px] text-slate-400 mt-0.5">AI moves 1st</span>
            </button>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="bg-[#1e2229]/60 rounded-xl p-3 border border-white/5 text-xs text-slate-400 flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Calibrated human play: opening principles, tactical intuition, move arrows, and dynamic hints.
          </span>
        </div>
      </div>
    </div>
  );
};
