import React, { useRef, useEffect } from 'react';
import { MoveRecord, ActiveColor, GameStatus } from '../types';
import { Copy, Check, ScrollText, Sparkles } from 'lucide-react';

interface MoveHistoryProps {
  history: MoveRecord[];
  currentPly: number;
  userColor: ActiveColor;
  aiColor: ActiveColor;
  gameStatus: GameStatus;
  isAiTurn: boolean;
  onCopyFen: () => void;
  onCopyPgn: () => void;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({
  history,
  currentPly,
  userColor,
  aiColor,
  gameStatus,
  isAiTurn,
  onCopyFen,
  onCopyPgn,
}) => {
  const [copiedPgn, setCopiedPgn] = React.useState(false);
  const [copiedFen, setCopiedFen] = React.useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new move
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [history.length]);

  const handleCopyPgn = () => {
    onCopyPgn();
    setCopiedPgn(true);
    setTimeout(() => setCopiedPgn(false), 2000);
  };

  const handleCopyFen = () => {
    onCopyFen();
    setCopiedFen(true);
    setTimeout(() => setCopiedFen(false), 2000);
  };

  // Group moves into pairs (White move, Black move)
  const pairedMoves: { moveNumber: number; white?: MoveRecord; black?: MoveRecord }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    pairedMoves.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1],
    });
  }

  // Next move text calculation
  const nextPlayer = isAiTurn ? 'AI' : 'You';

  return (
    <div className="flex flex-col h-full bg-[#16191E] border border-white/5 rounded-xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#16191E]">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M12 2v20M2 12h20" />
          </svg>
          <span>Move History</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
            {history.length} plies
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopyPgn}
            title="Copy PGN Notation"
            className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/10 text-[10px] font-medium text-slate-300 rounded-lg transition-colors"
          >
            {copiedPgn ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>PGN</span>
          </button>
          <button
            type="button"
            onClick={handleCopyFen}
            title="Copy Current FEN"
            className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/10 text-[10px] font-medium text-slate-300 rounded-lg transition-colors"
          >
            {copiedFen ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>FEN</span>
          </button>
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-[36px_1fr_1fr] text-slate-500 text-xs px-4 pt-3 pb-1 font-mono border-b border-white/5">
        <span>#</span>
        <span>White</span>
        <span>Black</span>
      </div>

      {/* History List */}
      <div
        ref={scrollContainerRef}
        id="move-history-scroll"
        className="flex-1 p-3 overflow-y-auto max-h-56 sm:max-h-72 space-y-1 font-mono text-xs"
      >
        {history.length === 0 ? (
          <div className="h-full min-h-[100px] flex items-center justify-center text-xs text-slate-500 italic font-sans">
            No moves played yet.
          </div>
        ) : (
          pairedMoves.map(pair => {
            return (
              <div key={pair.moveNumber} className="flex flex-col gap-0.5">
                <div className="grid grid-cols-[36px_1fr_1fr] items-center py-1 px-1.5 rounded hover:bg-white/5 transition-colors">
                  {/* Move Number */}
                  <span className="text-slate-500">{pair.moveNumber}.</span>

                  {/* White Move */}
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-semibold ${
                        pair.white?.playedBy === 'user' ? 'text-slate-100' : 'text-emerald-300'
                      }`}
                    >
                      {pair.white?.san}
                    </span>
                    {pair.white?.classification === 'brilliant' && (
                      <span className="text-[10px] px-1 bg-cyan-500/20 text-cyan-300 rounded flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" /> !!
                      </span>
                    )}
                  </div>

                  {/* Black Move */}
                  <div className="flex items-center gap-1.5">
                    {pair.black ? (
                      <>
                        <span
                          className={`font-semibold ${
                            pair.black.playedBy === 'user' ? 'text-slate-100' : 'text-emerald-300'
                          }`}
                        >
                          {pair.black.san}
                        </span>
                        {pair.black.classification === 'brilliant' && (
                          <span className="text-[10px] px-1 bg-cyan-500/20 text-cyan-300 rounded flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" /> !!
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="bg-emerald-500/20 text-emerald-400 px-1 rounded animate-pulse">...</span>
                    )}
                  </div>
                </div>

                {/* Turn indicator updated every 3 individual moves / plies or at the active move */}
                {pair.white && (pair.white.ply % 3 === 0 || (pair.black && pair.black.ply % 3 === 0)) && (
                  <div className="text-[10px] text-slate-400 bg-white/5 border border-white/5 rounded-md px-2 py-0.5 my-0.5 flex items-center justify-between">
                    <span className="text-slate-500 font-sans">Ply {pair.black?.ply ?? pair.white.ply}</span>
                    <span className="font-semibold text-slate-300">
                      {gameStatus === 'playing' ? (
                        <>
                          Next: <strong className={isAiTurn ? 'text-emerald-400' : 'text-slate-200'}>{nextPlayer}</strong>
                        </>
                      ) : (
                        `Game ${gameStatus}`
                      )}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer next move banner */}
      {gameStatus === 'playing' && history.length > 0 && (
        <div className="px-4 py-2 bg-[#0F1115] border-t border-white/5 flex items-center justify-between text-xs">
          <span className="text-slate-400">Current Turn:</span>
          <span className={`font-bold ${isAiTurn ? 'text-emerald-400' : 'text-slate-200'}`}>
            {isAiTurn ? "AI is thinking..." : "Your move"}
          </span>
        </div>
      )}
    </div>
  );
};
