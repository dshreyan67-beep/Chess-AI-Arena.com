import React from 'react';
import { GameSettings, EloRating } from '../types';
import { BOARD_THEMES } from '../utils/themes';
import { X, Volume2, VolumeX, Eye, Sparkles, Sliders, Palette, Brain } from 'lucide-react';

interface SettingsModalProps {
  settings: GameSettings;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSettings: (updater: Partial<GameSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  isOpen,
  onClose,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const elos: EloRating[] = [800, 900, 950, 1000, 1100, 1200];

  return (
    <div className="fixed inset-0 z-50 bg-[#0F1115]/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#16191E] border border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-5">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white font-display">Settings</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* AI Difficulty */}
          <div>
            <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              <span className="flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-emerald-400" />
                AI Opponent Strength
              </span>
              <span className="text-emerald-400 font-mono">~{settings.elo} Elo</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {elos.map(elo => (
                <button
                  key={elo}
                  type="button"
                  onClick={() => onUpdateSettings({ elo })}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    settings.elo === elo
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 ring-1 ring-emerald-500/50'
                      : 'bg-[#1e2229] border-white/10 text-slate-300 hover:border-emerald-500/50 hover:bg-[#252a33]'
                  }`}
                >
                  {elo} Elo {elo === 950 ? '(Def)' : ''}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Adjusts tactical depth, candidate move selection, and human-like mistake probability.
            </p>
          </div>

          {/* Board Theme */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              <Palette className="w-4 h-4 text-emerald-400" />
              Board Theme
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {BOARD_THEMES.map(theme => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => onUpdateSettings({ themeId: theme.id })}
                  className={`p-2 rounded-xl border text-left flex flex-col gap-1.5 transition-all ${
                    settings.themeId === theme.id
                      ? 'bg-[#252a33] border-emerald-500 ring-1 ring-emerald-500/40'
                      : 'bg-[#1e2229] border-white/10 hover:border-emerald-500/40'
                  }`}
                >
                  {/* Swatch Preview */}
                  <div className="w-full h-8 rounded-lg overflow-hidden grid grid-cols-2 border border-white/10">
                    <div className={theme.lightSquare} />
                    <div className={theme.darkSquare} />
                  </div>
                  <span className="text-xs font-semibold text-slate-200 truncate">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Move Arrows Configuration */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              <Eye className="w-4 h-4 text-emerald-400" />
              Arrow Display Settings
            </label>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-xl bg-[#1e2229] border border-white/10 cursor-pointer hover:bg-[#252a33] transition-colors">
                <div>
                  <div className="text-xs font-semibold text-white">Show AI Move Arrow</div>
                  <div className="text-[11px] text-slate-400">
                    Animates glowing green arrow showing AI's move after it plays
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showAiArrow}
                  onChange={e => onUpdateSettings({ showAiArrow: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#1e2229] border border-white/10 cursor-pointer hover:bg-[#252a33] transition-colors">
                <div>
                  <div className="text-xs font-semibold text-white">Show Last Move Arrow</div>
                  <div className="text-[11px] text-slate-400">
                    Draws a subtle arrow showing the most recent move played
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showLastMoveArrow}
                  onChange={e => onUpdateSettings({ showLastMoveArrow: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#1e2229] border border-white/10 cursor-pointer hover:bg-[#252a33] transition-colors">
                <div>
                  <div className="text-xs font-semibold text-white">Show Hint Arrow</div>
                  <div className="text-[11px] text-slate-400">
                    Displays animated arrow when Hint button is pressed
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showHintArrow}
                  onChange={e => onUpdateSettings({ showHintArrow: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Sound Toggle */}
          <div>
            <label className="flex items-center justify-between p-3 rounded-xl bg-[#1e2229] border border-white/10 cursor-pointer hover:bg-[#252a33] transition-colors">
              <div className="flex items-center gap-2.5">
                {settings.soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <VolumeX className="w-5 h-5 text-slate-500" />
                )}
                <div>
                  <div className="text-xs font-semibold text-white">Sound Effects</div>
                  <div className="text-[11px] text-slate-400">Piece movement, captures, and checks</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={e => onUpdateSettings({ soundEnabled: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
