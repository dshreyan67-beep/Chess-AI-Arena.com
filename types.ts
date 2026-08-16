import { Square, PieceSymbol, Color } from 'chess.js';

export type PlayerColorChoice = 'w' | 'b' | 'random';
export type ActiveColor = 'w' | 'b';

export type EloRating = 800 | 900 | 950 | 1000 | 1100 | 1200;

export type GameStatus = 'setup' | 'playing' | 'checkmate' | 'stalemate' | 'draw' | 'resigned';

export type DrawReason = 'threefold' | 'fifty-move' | 'insufficient-material' | 'stalemate' | 'agreement';

export type MoveClassification = 'brilliant' | 'great' | 'best' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';

export interface MoveRecord {
  from: Square;
  to: Square;
  san: string;
  piece: PieceSymbol;
  color: Color;
  captured?: PieceSymbol;
  promotion?: PieceSymbol;
  ply: number;
  moveNumber: number;
  fenAfter: string;
  isCheck: boolean;
  isCheckmate: boolean;
  classification?: MoveClassification;
  comment?: string;
  playedBy: 'user' | 'ai';
  timestamp: number;
}

export interface BoardTheme {
  id: string;
  name: string;
  lightSquare: string;
  darkSquare: string;
  lightHighlight: string;
  darkHighlight: string;
  borderColor: string;
  previewBg: string;
}

export interface ArrowInfo {
  id: string;
  from: Square;
  to: Square;
  color: string;
  type: 'ai' | 'user' | 'hint';
  pulse?: boolean;
}

export interface HintInfo {
  from: Square;
  to: Square;
  san: string;
  explanation: string;
}

export interface GameSettings {
  elo: EloRating;
  playerColorChoice: PlayerColorChoice;
  themeId: string;
  showAiArrow: boolean;
  showLastMoveArrow: boolean;
  showHintArrow: boolean;
  soundEnabled: boolean;
  showLegalMoveDots: boolean;
}

export interface EvaluationResult {
  score: number; // in centipawns from White's perspective
  bestMove?: {
    from: Square;
    to: Square;
    promotion?: PieceSymbol;
    san: string;
  };
  blunder?: boolean;
  brilliant?: boolean;
  inaccuracy?: boolean;
  explanation?: string;
}
