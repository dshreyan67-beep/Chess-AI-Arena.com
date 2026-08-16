import { Chess, Move, Square, PieceSymbol, Color } from 'chess.js';
import { EloRating, HintInfo } from '../types';

// Standard piece values
const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece-Square Tables (from White's perspective, indexed 0..63 from a8 to h1)
const PAWN_PST = [
   0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 27, 27, 10,  5,  5,
   0,  0,  0, 22, 22,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0,
];

const KNIGHT_PST = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
];

const BISHOP_PST = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20,
];

const ROOK_PST = [
   0,  0,  0,  0,  0,  0,  0,  0,
   5, 10, 10, 10, 10, 10, 10,  5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
   0,  0,  0,  5,  5,  0,  0,  0,
];

const QUEEN_PST = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20,
];

const KING_MIDGAME_PST = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20,
];

// Openings book dictionary (Human-like opening trees with weighted choices)
const OPENING_BOOK: Record<string, { move: string; weight: number }[]> = {
  // Initial position
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -': [
    { move: 'e4', weight: 45 },
    { move: 'd4', weight: 35 },
    { move: 'Nf3', weight: 12 },
    { move: 'c4', weight: 8 },
  ],
  // 1. e4
  'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq -': [
    { move: 'e5', weight: 50 },
    { move: 'c5', weight: 25 },
    { move: 'e6', weight: 13 },
    { move: 'c6', weight: 12 },
  ],
  // 1. d4
  'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq -': [
    { move: 'd5', weight: 45 },
    { move: 'Nf6', weight: 35 },
    { move: 'e6', weight: 12 },
    { move: 'c5', weight: 8 },
  ],
  // 1. e4 e5
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -': [
    { move: 'Nf3', weight: 80 },
    { move: 'Bc4', weight: 12 },
    { move: 'Nc3', weight: 8 },
  ],
  // 1. e4 e5 2. Nf3
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq -': [
    { move: 'Nc6', weight: 75 },
    { move: 'Nf6', weight: 15 },
    { move: 'd6', weight: 10 },
  ],
  // 1. e4 e5 2. Nf3 Nc6
  'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq -': [
    { move: 'Bb5', weight: 45 }, // Ruy Lopez
    { move: 'Bc4', weight: 40 }, // Italian
    { move: 'd4', weight: 15 },  // Scotch
  ],
  // 1. e4 c5 (Sicilian)
  'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -': [
    { move: 'Nf3', weight: 75 },
    { move: 'Nc3', weight: 15 },
    { move: 'c3', weight: 10 },
  ],
  // 1. d4 d5
  'rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq -': [
    { move: 'c4', weight: 65 },  // Queen's Gambit
    { move: 'Nf3', weight: 20 },
    { move: 'Bf4', weight: 15 }, // London System
  ],
  // 1. d4 Nf6
  'rnbqkb1r/pppppppp/5n2/8/3P4/8/PPP1PPPP/RNBQKBNR w KQkq -': [
    { move: 'c4', weight: 60 },
    { move: 'Nf3', weight: 25 },
    { move: 'Bg5', weight: 15 },
  ],
};

function squareToIndex(sq: Square): number {
  const file = sq.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = 8 - parseInt(sq[1], 10);
  return rank * 8 + file;
}

export class HumanChessEngine {
  private evaluatePosition(chess: Chess): number {
    if (chess.isCheckmate()) {
      return chess.turn() === 'w' ? -20000 : 20000;
    }
    if (chess.isDraw()) {
      return 0;
    }

    let score = 0;
    const board = chess.board();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece) continue;

        const isW = piece.color === 'w';
        const multiplier = isW ? 1 : -1;
        const baseVal = PIECE_VALUES[piece.type];

        // PST index (flipped for black)
        const sqIndex = isW ? r * 8 + c : (7 - r) * 8 + c;

        let pstVal = 0;
        switch (piece.type) {
          case 'p': pstVal = PAWN_PST[sqIndex]; break;
          case 'n': pstVal = KNIGHT_PST[sqIndex]; break;
          case 'b': pstVal = BISHOP_PST[sqIndex]; break;
          case 'r': pstVal = ROOK_PST[sqIndex]; break;
          case 'q': pstVal = QUEEN_PST[sqIndex]; break;
          case 'k': pstVal = KING_MIDGAME_PST[sqIndex]; break;
        }

        score += multiplier * (baseVal + pstVal);
      }
    }

    // Positional bonuses: Center control & development
    const centerSquares: Square[] = ['e4', 'd4', 'e5', 'd5'];
    for (const sq of centerSquares) {
      const piece = chess.get(sq);
      if (piece) {
        score += (piece.color === 'w' ? 1 : -1) * 15;
      }
    }

    return score;
  }

  // Quiescence search to avoid the horizon effect on captures
  private quiescence(chess: Chess, alpha: number, beta: number, depth: number): number {
    const standPat = this.evaluatePosition(chess) * (chess.turn() === 'w' ? 1 : -1);
    if (depth <= 0) return standPat;
    if (standPat >= beta) return beta;
    if (alpha < standPat) alpha = standPat;

    const moves = chess.moves({ verbose: true }).filter(m => m.captured);
    for (const move of moves) {
      chess.move(move);
      const score = -this.quiescence(chess, -beta, -alpha, depth - 1);
      chess.undo();

      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  }

  // Minimax with Alpha-Beta
  private minimax(chess: Chess, depth: number, alpha: number, beta: number, isMaximizing: boolean): number {
    if (depth === 0 || chess.isGameOver()) {
      return this.evaluatePosition(chess);
    }

    const moves = chess.moves({ verbose: true });
    // Sort moves: captures and checks first
    moves.sort((a, b) => {
      const aScore = (a.captured ? PIECE_VALUES[a.captured] : 0) + (a.san.includes('+') ? 50 : 0);
      const bScore = (b.captured ? PIECE_VALUES[b.captured] : 0) + (b.san.includes('+') ? 50 : 0);
      return bScore - aScore;
    });

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        chess.move(move);
        const evalScore = this.minimax(chess, depth - 1, alpha, beta, false);
        chess.undo();
        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        chess.move(move);
        const evalScore = this.minimax(chess, depth - 1, alpha, beta, true);
        chess.undo();
        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  // Human-like Move Selection calibrated by Elo (800..1200, default 950)
  public getBestMove(chess: Chess, elo: EloRating = 950): { move: Move; isBrilliant?: boolean; comment?: string } {
    const legalMoves = chess.moves({ verbose: true });
    if (legalMoves.length === 0) {
      throw new Error('No legal moves available');
    }

    const currentTurn = chess.turn();
    const isMaximizing = currentTurn === 'w';

    // 1. Check opening book first
    const fen = chess.fen();
    const fenPrefix = fen.split(' ').slice(0, 3).join(' ');
    const openingCandidates = OPENING_BOOK[fenPrefix];

    if (openingCandidates && openingCandidates.length > 0) {
      // 85% chance to play from opening book if available, allowing natural human deviation
      if (Math.random() < 0.88) {
        const totalWeight = openingCandidates.reduce((sum, item) => sum + item.weight, 0);
        let randomVal = Math.random() * totalWeight;
        for (const candidate of openingCandidates) {
          randomVal -= candidate.weight;
          if (randomVal <= 0) {
            const foundMove = legalMoves.find(m => m.san === candidate.move);
            if (foundMove) {
              return { move: foundMove, comment: 'Plays a standard opening principle' };
            }
          }
        }
      }
    }

    // 2. Evaluate all candidate moves with depth calibrated to Elo
    const searchDepth = elo >= 1150 ? 3 : elo >= 950 ? 2 : 2;

    const scoredMoves: { move: Move; score: number; tacticalTension: boolean; isCapture: boolean; isCheck: boolean }[] = [];

    for (const move of legalMoves) {
      chess.move(move);
      let score = this.minimax(chess, searchDepth - 1, -Infinity, Infinity, !isMaximizing);
      // Normalized from current player's perspective
      const normalizedScore = isMaximizing ? score : -score;

      const isCapture = !!move.captured;
      const isCheck = chess.inCheck();
      const tacticalTension = isCapture || isCheck || move.promotion !== undefined;

      // Small positional heuristics (e.g. slight preference for developing minor pieces early)
      let bonus = 0;
      if (['n', 'b'].includes(move.piece) && (move.from.endsWith('1') || move.from.endsWith('8'))) {
        bonus += 12; // develop back rank
      }
      if (move.san === 'O-O' || move.san === 'O-O-O') {
        bonus += 25; // castling safety
      }

      scoredMoves.push({
        move,
        score: normalizedScore + bonus,
        tacticalTension,
        isCapture,
        isCheck,
      });

      chess.undo();
    }

    // Sort from best to worst
    scoredMoves.sort((a, b) => b.score - a.score);

    const best = scoredMoves[0];

    // 3. Human-like error / brilliancy probability matrix based on Elo
    // Elo 800: ~50% best, 32% 2nd best, 12% inaccurate, 6% blunder
    // Elo 900: ~58% best, 28% 2nd best, 10% inaccurate, 4% blunder
    // Elo 950: ~66% best, 24% 2nd best, 7% inaccurate, 3% blunder
    // Elo 1000: ~72% best, 20% 2nd best, 6% inaccurate, 2% blunder
    // Elo 1100: ~80% best, 15% 2nd best, 4% inaccurate, 1% blunder
    // Elo 1200: ~88% best, 10% 2nd best, 2% inaccurate, 0% blunder

    const rng = Math.random();

    // Check for rare tactical brilliancy (sacrificing material for king attack or tactical fork)
    const tacticalSacrifices = scoredMoves.filter(
      sm => sm.isCapture && sm.isCheck && PIECE_VALUES[sm.move.piece] >= 300 && sm.score > -150
    );

    const brilliantChance = elo >= 1100 ? 0.08 : elo >= 950 ? 0.05 : 0.03;
    if (tacticalSacrifices.length > 0 && rng < brilliantChance) {
      return {
        move: tacticalSacrifices[0].move,
        isBrilliant: true,
        comment: 'Finds an unexpected tactical attack!',
      };
    }

    let blunderRate = 0.03;
    let inaccuracyRate = 0.07;
    let secondBestRate = 0.24;

    if (elo <= 850) {
      blunderRate = 0.07;
      inaccuracyRate = 0.14;
      secondBestRate = 0.32;
    } else if (elo <= 950) {
      blunderRate = 0.035;
      inaccuracyRate = 0.08;
      secondBestRate = 0.24;
    } else if (elo <= 1050) {
      blunderRate = 0.02;
      inaccuracyRate = 0.05;
      secondBestRate = 0.18;
    } else {
      blunderRate = 0.008;
      inaccuracyRate = 0.03;
      secondBestRate = 0.12;
    }

    // Realistic blunder: never hangs queen for no reason; instead picks a slightly flawed move or misses undefended pawn
    if (rng < blunderRate && scoredMoves.length > 2) {
      // Pick a candidate move that is 100-250 centipawns worse (e.g. loses a pawn or gives up center)
      const blunderCandidates = scoredMoves.filter(
        sm => sm.score >= best.score - 280 && sm.score <= best.score - 70 && sm.move.piece !== 'q'
      );
      if (blunderCandidates.length > 0) {
        const picked = blunderCandidates[Math.floor(Math.random() * blunderCandidates.length)];
        return { move: picked.move, comment: 'Overlooked a subtle positional vulnerability' };
      }
    }

    // Realistic inaccuracy: plays a natural, passive, or slightly suboptimal move
    if (rng < blunderRate + inaccuracyRate && scoredMoves.length > 1) {
      const inaccuracyCandidates = scoredMoves.filter(
        sm => sm.score >= best.score - 90 && sm.score <= best.score - 20
      );
      if (inaccuracyCandidates.length > 0) {
        const picked = inaccuracyCandidates[Math.floor(Math.random() * inaccuracyCandidates.length)];
        return { move: picked.move, comment: 'Natural developing move' };
      }
    }

    // Solid second-best move
    if (rng < blunderRate + inaccuracyRate + secondBestRate && scoredMoves.length > 1) {
      const topCandidates = scoredMoves.slice(0, Math.min(3, scoredMoves.length));
      const picked = topCandidates[Math.floor(Math.random() * topCandidates.length)];
      return { move: picked.move, comment: 'Sensible active move' };
    }

    // Default: Best move
    return { move: best.move };
  }

  // Generate a helpful hint for the user
  public getHint(chess: Chess): HintInfo | null {
    const legalMoves = chess.moves({ verbose: true });
    if (legalMoves.length === 0) return null;

    const isMaximizing = chess.turn() === 'w';
    const scoredMoves: { move: Move; score: number }[] = [];

    for (const move of legalMoves) {
      chess.move(move);
      const score = this.minimax(chess, 2, -Infinity, Infinity, !isMaximizing);
      const normalizedScore = isMaximizing ? score : -score;
      scoredMoves.push({ move, score: normalizedScore });
      chess.undo();
    }

    scoredMoves.sort((a, b) => b.score - a.score);
    const best = scoredMoves[0].move;

    // Generate educational explanation
    let explanation = `Consider ${best.san}. `;
    if (best.san.includes('#')) {
      explanation += 'Delivers checkmate!';
    } else if (best.captured) {
      const capturedName = this.getPieceName(best.captured);
      explanation += `Captures the ${capturedName} and wins material.`;
    } else if (best.san.includes('+')) {
      explanation += 'Applies immediate check and creates attacking pressure.';
    } else if (best.san === 'O-O' || best.san === 'O-O-O') {
      explanation += 'Castles to safeguard your King and activate the Rook.';
    } else if (['n', 'b'].includes(best.piece) && (best.to.includes('3') || best.to.includes('4') || best.to.includes('5') || best.to.includes('6'))) {
      explanation += 'Develops a minor piece toward the central squares.';
    } else if (best.piece === 'p' && (best.to.includes('4') || best.to.includes('5'))) {
      explanation += 'Claims key central space and opens lines for your pieces.';
    } else {
      explanation += 'Improves your piece activity and coordinates your position.';
    }

    return {
      from: best.from,
      to: best.to,
      san: best.san,
      explanation,
    };
  }

  private getPieceName(p: PieceSymbol): string {
    switch (p) {
      case 'p': return 'pawn';
      case 'n': return 'knight';
      case 'b': return 'bishop';
      case 'r': return 'rook';
      case 'q': return 'queen';
      case 'k': return 'king';
      default: return 'piece';
    }
  }
}

export const humanEngine = new HumanChessEngine();
