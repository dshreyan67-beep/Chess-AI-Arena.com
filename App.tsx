/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chess, Square, PieceSymbol } from 'chess.js';
import {
  PlayerColorChoice,
  ActiveColor,
  EloRating,
  GameStatus,
  MoveRecord,
  ArrowInfo,
  HintInfo,
  GameSettings,
} from './types';
import { ChessBoard } from './components/ChessBoard';
import { GameInfo } from './components/GameInfo';
import { MoveHistory } from './components/MoveHistory';
import { ColorSelectionModal } from './components/ColorSelectionModal';
import { GameOverModal } from './components/GameOverModal';
import { SettingsModal } from './components/SettingsModal';
import { HintBox } from './components/HintBox';
import { humanEngine } from './engine/humanEngine';
import { soundManager } from './utils/soundEffects';
import { getTheme } from './utils/themes';
import {
  RotateCcw,
  Lightbulb,
  Flag,
  Settings,
  ArrowLeftRight,
  Volume2,
  VolumeX,
  Play,
  Shield,
  Sparkles,
  Trophy,
} from 'lucide-react';

const THINKING_MESSAGES = [
  'Thinking...',
  'Calculating lines...',
  'Looking for tactics...',
  'Considering my move...',
  'Evaluating position...',
  'Developing pieces...',
];

export default function App() {
  // Core Chess instance
  const [chess] = useState(() => new Chess());

  // Game setup states
  const [showColorModal, setShowColorModal] = useState<boolean>(true);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [gameStatus, setGameStatus] = useState<GameStatus>('setup');
  const [gameWinner, setGameWinner] = useState<'user' | 'ai' | 'draw' | null>(null);
  const [drawReason, setDrawReason] = useState<string | undefined>(undefined);

  // Player & AI identities
  const [userColor, setUserColor] = useState<ActiveColor>('w');
  const [aiColor, setAiColor] = useState<ActiveColor>('b');
  const [boardOrientation, setBoardOrientation] = useState<ActiveColor>('w');

  // Move & History states
  const [history, setHistory] = useState<MoveRecord[]>([]);
  const [lastMoveSquares, setLastMoveSquares] = useState<{ from: Square; to: Square } | null>(null);
  const [arrows, setArrows] = useState<ArrowInfo[]>([]);
  const [activeHint, setActiveHint] = useState<HintInfo | null>(null);

  // AI execution state
  const [isAiTurn, setIsAiTurn] = useState<boolean>(false);
  const [aiStatusMessage, setAiStatusMessage] = useState<string>('Thinking...');

  // Settings
  const [settings, setSettings] = useState<GameSettings>({
    elo: 950,
    playerColorChoice: 'w',
    themeId: 'emerald',
    showAiArrow: true,
    showLastMoveArrow: true,
    showHintArrow: true,
    soundEnabled: true,
    showLegalMoveDots: true,
  });

  const aiMoveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync sound settings
  useEffect(() => {
    soundManager.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (aiMoveTimerRef.current) clearTimeout(aiMoveTimerRef.current);
    };
  }, []);

  const currentTheme = getTheme(settings.themeId);

  // Check Game Over conditions
  const checkGameOver = useCallback(() => {
    if (chess.isCheckmate()) {
      const winner = chess.turn() === userColor ? 'ai' : 'user';
      setGameStatus('checkmate');
      setGameWinner(winner);
      soundManager.playGameOver(winner === 'user');
      return true;
    }

    if (chess.isStalemate()) {
      setGameStatus('stalemate');
      setGameWinner('draw');
      setDrawReason('Stalemate - No legal moves available.');
      soundManager.playGameOver(false);
      return true;
    }

    if (chess.isThreefoldRepetition()) {
      setGameStatus('draw');
      setGameWinner('draw');
      setDrawReason('Draw by Threefold Repetition.');
      soundManager.playGameOver(false);
      return true;
    }

    if (chess.isInsufficientMaterial()) {
      setGameStatus('draw');
      setGameWinner('draw');
      setDrawReason('Draw by Insufficient Material.');
      soundManager.playGameOver(false);
      return true;
    }

    if (chess.isDraw()) {
      setGameStatus('draw');
      setGameWinner('draw');
      setDrawReason('Draw by 50-move rule.');
      soundManager.playGameOver(false);
      return true;
    }

    return false;
  }, [chess, userColor]);

  // AI Move Engine Loop
  const triggerAiMove = useCallback(() => {
    if (chess.isGameOver()) {
      checkGameOver();
      return;
    }

    setIsAiTurn(true);
    // Pick random human-like status text
    const randomMsg = THINKING_MESSAGES[Math.floor(Math.random() * THINKING_MESSAGES.length)];
    setAiStatusMessage(randomMsg);

    // Prompt requires: "the AI should very quickly play it's moves within 1 sec."
    // We add a realistic 380ms - 780ms thinking delay
    const thinkDelay = Math.floor(Math.random() * 400) + 380;

    if (aiMoveTimerRef.current) clearTimeout(aiMoveTimerRef.current);

    aiMoveTimerRef.current = setTimeout(() => {
      try {
        const { move, isBrilliant, comment } = humanEngine.getBestMove(chess, settings.elo);
        const from = move.from as Square;
        const to = move.to as Square;
        const piece = move.piece;
        const captured = move.captured;
        const isCastle = move.san === 'O-O' || move.san === 'O-O-O';

        const result = chess.move(move);
        if (!result) {
          setIsAiTurn(false);
          return;
        }

        // Play matching audio
        if (chess.inCheck()) {
          soundManager.playCheck();
        } else if (captured) {
          soundManager.playCapture();
        } else if (isCastle) {
          soundManager.playCastle();
        } else {
          soundManager.playMove();
        }

        const newRecord: MoveRecord = {
          from,
          to,
          san: result.san,
          piece: result.piece,
          color: result.color,
          captured: result.captured,
          promotion: result.promotion,
          ply: chess.history().length,
          moveNumber: Math.floor((chess.history().length - 1) / 2) + 1,
          fenAfter: chess.fen(),
          isCheck: chess.inCheck(),
          isCheckmate: chess.isCheckmate(),
          classification: isBrilliant ? 'brilliant' : undefined,
          comment,
          playedBy: 'ai',
          timestamp: Date.now(),
        };

        setHistory(prev => [...prev, newRecord]);
        setLastMoveSquares({ from, to });

        // Build arrows list: display AI move arrow
        const newArrows: ArrowInfo[] = [];

        if (settings.showAiArrow) {
          newArrows.push({
            id: `ai-move-${Date.now()}`,
            from,
            to,
            color: 'rgba(16, 185, 129, 0.9)',
            type: 'ai',
            pulse: true,
          });
        }

        setArrows(newArrows);

        // Auto-fade the prominent AI arrow after 2 seconds if desired, but keep last-move arrow
        setTimeout(() => {
          setArrows(prev => {
            if (!settings.showLastMoveArrow) return [];
            return prev.map(a =>
              a.type === 'ai' ? { ...a, color: 'rgba(16, 185, 129, 0.45)', pulse: false } : a
            );
          });
        }, 2200);

        setIsAiTurn(false);
        checkGameOver();
      } catch (err) {
        console.error('Error during AI move:', err);
        setIsAiTurn(false);
      }
    }, thinkDelay);
  }, [chess, settings.elo, settings.showAiArrow, settings.showLastMoveArrow, checkGameOver]);

  // Start / Restart Game with selected parameters
  const handleStartGame = (colorChoice: PlayerColorChoice, elo: EloRating) => {
    chess.reset();
    if (aiMoveTimerRef.current) clearTimeout(aiMoveTimerRef.current);

    let assignedUserColor: ActiveColor = 'w';
    if (colorChoice === 'random') {
      assignedUserColor = Math.random() < 0.5 ? 'w' : 'b';
    } else {
      assignedUserColor = colorChoice;
    }

    const assignedAiColor: ActiveColor = assignedUserColor === 'w' ? 'b' : 'w';

    setUserColor(assignedUserColor);
    setAiColor(assignedAiColor);
    setBoardOrientation(assignedUserColor);
    setHistory([]);
    setLastMoveSquares(null);
    setArrows([]);
    setActiveHint(null);
    setGameStatus('playing');
    setGameWinner(null);
    setDrawReason(undefined);
    setShowColorModal(false);
    setIsAiTurn(false);

    setSettings(prev => ({
      ...prev,
      elo,
      playerColorChoice: colorChoice,
    }));

    // If User chose Black, AI (White) moves first
    if (assignedUserColor === 'b') {
      setIsAiTurn(true);
      setAiStatusMessage('Opening move...');
      setTimeout(() => {
        triggerAiMove();
      }, 450);
    }
  };

  // User Move Handler
  const handleUserMove = (from: Square, to: Square, promotion?: PieceSymbol): boolean => {
    if (gameStatus !== 'playing' || isAiTurn) return false;

    try {
      const isCastleAttempt =
        chess.get(from)?.type === 'k' &&
        (Math.abs(from.charCodeAt(0) - to.charCodeAt(0)) === 2);

      const moveResult = chess.move({
        from,
        to,
        promotion: promotion || 'q', // default queen promotion
      });

      if (!moveResult) return false;

      // Play matching audio
      if (chess.inCheck()) {
        soundManager.playCheck();
      } else if (moveResult.captured) {
        soundManager.playCapture();
      } else if (isCastleAttempt || moveResult.san === 'O-O' || moveResult.san === 'O-O-O') {
        soundManager.playCastle();
      } else {
        soundManager.playMove();
      }

      const newRecord: MoveRecord = {
        from,
        to,
        san: moveResult.san,
        piece: moveResult.piece,
        color: moveResult.color,
        captured: moveResult.captured,
        promotion: moveResult.promotion,
        ply: chess.history().length,
        moveNumber: Math.floor((chess.history().length - 1) / 2) + 1,
        fenAfter: chess.fen(),
        isCheck: chess.inCheck(),
        isCheckmate: chess.isCheckmate(),
        playedBy: 'user',
        timestamp: Date.now(),
      };

      setHistory(prev => [...prev, newRecord]);
      setLastMoveSquares({ from, to });
      setActiveHint(null); // Clear hint on move

      // User last move arrow
      const newArrows: ArrowInfo[] = [];
      if (settings.showLastMoveArrow) {
        newArrows.push({
          id: `user-move-${Date.now()}`,
          from,
          to,
          color: 'rgba(59, 130, 246, 0.75)',
          type: 'user',
        });
      }
      setArrows(newArrows);

      // Check if game ended after user's move
      const isOver = checkGameOver();
      if (!isOver) {
        // Trigger AI's response
        triggerAiMove();
      }

      return true;
    } catch (err) {
      console.warn('Invalid user move attempted:', err);
      return false;
    }
  };

  // Hint Button Handler
  const handleRequestHint = () => {
    if (gameStatus !== 'playing' || isAiTurn || chess.turn() !== userColor) return;

    const hint = humanEngine.getHint(chess);
    if (!hint) return;

    setActiveHint(hint);

    if (settings.showHintArrow) {
      const hintArrow: ArrowInfo = {
        id: `hint-${Date.now()}`,
        from: hint.from,
        to: hint.to,
        color: 'rgba(245, 158, 11, 0.95)',
        type: 'hint',
        pulse: true,
      };

      // Keep user's last move arrow if present, but add hint arrow
      setArrows(prev => [...prev.filter(a => a.type !== 'hint'), hintArrow]);
    }
  };

  // Resign Button Handler
  const handleResign = () => {
    if (gameStatus !== 'playing') return;
    setGameStatus('resigned');
    setGameWinner('ai');
    soundManager.playGameOver(false);
  };

  // Flip Board orientation
  const handleFlipBoard = () => {
    setBoardOrientation(prev => (prev === 'w' ? 'b' : 'w'));
  };

  // Copy PGN
  const handleCopyPgn = () => {
    const pgn = chess.pgn();
    navigator.clipboard.writeText(pgn || 'No moves yet.');
  };

  // Copy FEN
  const handleCopyFen = () => {
    const fen = chess.fen();
    navigator.clipboard.writeText(fen);
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="border-b border-white/5 bg-[#16191E] sticky top-0 z-40 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md text-xl leading-none">
              <span>♚</span>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Chess AI Arena
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {settings.elo} Elo • Human-like
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Realistic human play style with tactical intuition and visual move arrows
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <button
              id="header-sound-btn"
              type="button"
              onClick={() => setSettings(s => ({ ...s, soundEnabled: !s.soundEnabled }))}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition-colors cursor-pointer"
              title={settings.soundEnabled ? 'Mute Sound' : 'Enable Sound'}
            >
              {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            <button
              id="header-settings-btn"
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden md:inline">Settings</span>
            </button>

            <button
              id="header-new-game-btn"
              type="button"
              onClick={() => setShowColorModal(true)}
              className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-medium text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>New Game</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Game Arena */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Chess Board Section (Span 7 on desktop) */}
          <div className="lg:col-span-7 flex flex-col items-center gap-4">
            {/* Interactive Chess Board */}
            <ChessBoard
              chess={chess}
              orientation={boardOrientation}
              userColor={userColor}
              isAiTurn={isAiTurn}
              theme={currentTheme}
              arrows={arrows}
              lastMove={lastMoveSquares}
              onUserMove={handleUserMove}
              disabled={gameStatus !== 'playing'}
            />

            {/* Hint Box (if active) */}
            <div className="w-full max-w-[560px]">
              <HintBox hint={activeHint} onDismiss={() => setActiveHint(null)} />
            </div>

            {/* In-Game Action Bar */}
            <div className="w-full max-w-[560px] grid grid-cols-4 gap-2">
              {/* Hint Button */}
              <button
                id="btn-hint"
                type="button"
                onClick={handleRequestHint}
                disabled={gameStatus !== 'playing' || isAiTurn || chess.turn() !== userColor}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 text-emerald-400 border border-emerald-500/20 disabled:opacity-40 disabled:pointer-events-none transition-all font-semibold text-xs shadow-sm cursor-pointer"
                title="Get a sensible move hint"
              >
                <Lightbulb className="w-4 h-4" />
                <span>Hint</span>
              </button>

              {/* Flip Board */}
              <button
                id="btn-flip"
                type="button"
                onClick={handleFlipBoard}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#16191E] hover:bg-white/5 active:scale-95 text-slate-200 border border-white/5 transition-all font-semibold text-xs shadow-sm cursor-pointer"
                title="Flip Board View"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>Flip</span>
              </button>

              {/* Resign */}
              <button
                id="btn-resign"
                type="button"
                onClick={handleResign}
                disabled={gameStatus !== 'playing'}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 active:scale-95 text-red-400 border border-red-500/20 disabled:opacity-40 disabled:pointer-events-none transition-all font-semibold text-xs shadow-sm cursor-pointer"
                title="Resign current game"
              >
                <Flag className="w-4 h-4" />
                <span>Resign</span>
              </button>

              {/* New Game */}
              <button
                id="btn-new-game"
                type="button"
                onClick={() => setShowColorModal(true)}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#16191E] hover:bg-white/5 active:scale-95 text-slate-200 border border-white/5 transition-all font-semibold text-xs shadow-sm cursor-pointer"
                title="Start a new game"
              >
                <RotateCcw className="w-4 h-4" />
                <span>New</span>
              </button>
            </div>
          </div>

          {/* Right Column: Game Info + Move History + Analysis (Span 5 on desktop) */}
          <div className="lg:col-span-5 flex flex-col gap-4 w-full">
            {/* Player Cards & Turn Status */}
            <GameInfo
              chess={chess}
              userColor={userColor}
              aiColor={aiColor}
              currentElo={settings.elo}
              isAiTurn={isAiTurn}
              aiStatusMessage={aiStatusMessage}
              gameStatus={gameStatus}
              moveCount={history.length}
            />

            {/* Move History Panel */}
            <div className="w-full">
              <MoveHistory
                history={history}
                currentPly={history.length}
                userColor={userColor}
                aiColor={aiColor}
                gameStatus={gameStatus}
                isAiTurn={isAiTurn}
                onCopyFen={handleCopyFen}
                onCopyPgn={handleCopyPgn}
              />
            </div>

            {/* Information Card on AI Humanization */}
            <div className="bg-[#16191E] border border-white/5 rounded-xl p-4 text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Human-like AI Behavior</span>
              </div>
              <p className="leading-relaxed text-[11px] text-slate-400">
                Calibrated to play naturally at <strong>{settings.elo} Elo</strong>. It applies opening principles, controls central files, builds piece coordination, and calculates realistic tactics with human-like variability.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] text-slate-300">
                  Dynamic Move Arrows
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] text-slate-300">
                  Book Openings
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] text-slate-300">
                  Fast &lt;1s Response
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Color Selection Modal (Shown on startup or New Game) */}
      {showColorModal && (
        <ColorSelectionModal
          currentElo={settings.elo}
          onEloChange={elo => setSettings(s => ({ ...s, elo }))}
          onStartGame={handleStartGame}
        />
      )}

      {/* Game Over Modal */}
      {gameStatus !== 'setup' && gameStatus !== 'playing' && (
        <GameOverModal
          status={gameStatus}
          winner={gameWinner}
          userColor={userColor}
          reason={drawReason}
          history={history}
          onPlayAgain={() => handleStartGame(settings.playerColorChoice, settings.elo)}
          onChooseColors={() => setShowColorModal(true)}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        settings={settings}
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onUpdateSettings={newSettings => setSettings(prev => ({ ...prev, ...newSettings }))}
      />
    </div>
  );
}
