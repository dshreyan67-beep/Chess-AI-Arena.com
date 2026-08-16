import React from 'react';
import { HintInfo } from '../types';
import { Lightbulb, X, Sparkles } from 'lucide-react';

interface HintBoxProps {
  hint: HintInfo | null;
  onDismiss: () => void;
}

export const HintBox: React.FC<HintBoxProps> = ({ hint, onDismiss }) => {
  if (!hint) return null;

  return (
    <div
      id="hint-callout"
      className="p-3.5 bg-[#16191E] border border-emerald-500/30 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0 mt-0.5">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">Suggested Move:</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-mono font-bold text-xs border border-emerald-500/30">
                {hint.san}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                ({hint.from} → {hint.to})
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{hint.explanation}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          title="Dismiss Hint"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
