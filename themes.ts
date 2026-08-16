import { BoardTheme } from '../types';

export const BOARD_THEMES: BoardTheme[] = [
  {
    id: 'emerald',
    name: 'Emerald Tournament',
    lightSquare: 'bg-[#ebecd0]',
    darkSquare: 'bg-[#779556]',
    lightHighlight: 'bg-[#f6f669]/80',
    darkHighlight: 'bg-[#baca44]/80',
    borderColor: 'border-[#2D333B]',
    previewBg: 'from-[#ebecd0] to-[#779556]',
  },
  {
    id: 'classic-wood',
    name: 'Classic Walnut',
    lightSquare: 'bg-[#f0d9b5]',
    darkSquare: 'bg-[#b58863]',
    lightHighlight: 'bg-[#ced26b]/80',
    darkHighlight: 'bg-[#aaa23a]/80',
    borderColor: 'border-[#7a5839]',
    previewBg: 'from-[#f0d9b5] to-[#b58863]',
  },
  {
    id: 'midnight-slate',
    name: 'Midnight Slate',
    lightSquare: 'bg-[#dee3e6]',
    darkSquare: 'bg-[#8ca2ad]',
    lightHighlight: 'bg-[#98b898]/75',
    darkHighlight: 'bg-[#5e8f64]/75',
    borderColor: 'border-[#5a6e78]',
    previewBg: 'from-[#dee3e6] to-[#8ca2ad]',
  },
  {
    id: 'royal-ocean',
    name: 'Royal Ocean',
    lightSquare: 'bg-[#e0e8f0]',
    darkSquare: 'bg-[#4b7399]',
    lightHighlight: 'bg-[#89d6fb]/75',
    darkHighlight: 'bg-[#2980b9]/75',
    borderColor: 'border-[#2c4763]',
    previewBg: 'from-[#e0e8f0] to-[#4b7399]',
  },
  {
    id: 'warm-sand',
    name: 'Warm Sand',
    lightSquare: 'bg-[#eae3d2]',
    darkSquare: 'bg-[#c4a482]',
    lightHighlight: 'bg-[#f4d06f]/80',
    darkHighlight: 'bg-[#d49b4b]/80',
    borderColor: 'border-[#8f6e4d]',
    previewBg: 'from-[#eae3d2] to-[#c4a482]',
  },
  {
    id: 'dark-graphite',
    name: 'Dark Graphite',
    lightSquare: 'bg-[#404040]',
    darkSquare: 'bg-[#262626]',
    lightHighlight: 'bg-[#10b981]/50',
    darkHighlight: 'bg-[#059669]/60',
    borderColor: 'border-[#171717]',
    previewBg: 'from-[#404040] to-[#262626]',
  },
];

export function getTheme(id: string): BoardTheme {
  return BOARD_THEMES.find(t => t.id === id) || BOARD_THEMES[0];
}
