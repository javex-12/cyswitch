
import { Level, Skin } from './types';

export const TILE_COLORS = [
  'transparent', // 0: Empty/Black
  'bg-red-500',    // 1
  'bg-blue-500',   // 2
  'bg-green-500',  // 3
  'bg-yellow-400', // 4
  'bg-purple-500', // 5
  'bg-cyan-400',   // 6
];

export const SKINS: Skin[] = [
  {
    id: 'neon',
    name: 'Neon Cyber',
    bg: 'bg-slate-900',
    accent: 'text-cyan-400',
    tileColors: {
      0: 'bg-slate-800 border border-slate-700',
      1: 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)] border border-rose-300',
      2: 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)] border border-blue-300',
      3: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)] border border-emerald-300',
      4: 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)] border border-amber-200',
      5: 'bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.6)] border border-fuchsia-300',
      6: 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)] border border-cyan-200',
    }
  },
  {
    id: 'pixel',
    name: '8-Bit Retro',
    bg: 'bg-gray-900',
    accent: 'text-green-400',
    tileColors: {
      0: 'bg-gray-800 border-4 border-gray-700',
      1: 'bg-red-600 border-4 border-red-800',
      2: 'bg-blue-600 border-4 border-blue-800',
      3: 'bg-green-600 border-4 border-green-800',
      4: 'bg-yellow-500 border-4 border-yellow-700',
      5: 'bg-purple-600 border-4 border-purple-800',
      6: 'bg-cyan-600 border-4 border-cyan-800',
    }
  },
  {
    id: 'flat',
    name: 'Clean Flat',
    bg: 'bg-slate-100',
    accent: 'text-indigo-600',
    tileColors: {
      0: 'bg-slate-200 rounded-lg',
      1: 'bg-red-400 rounded-lg',
      2: 'bg-blue-400 rounded-lg',
      3: 'bg-teal-400 rounded-lg',
      4: 'bg-orange-300 rounded-lg',
      5: 'bg-indigo-400 rounded-lg',
      6: 'bg-sky-400 rounded-lg',
    }
  }
];

export const MAX_LEVEL = 100;

export const generateLevel = (level: number): Level => {
  // Difficulty Scaling Logic
  const gridSize = level <= 5 ? 3 : level <= 20 ? 4 : 5;
  
  // Colors available increases with level (max 6 colors)
  const availableColors = Math.min(6, 2 + Math.floor((level - 1) / 15)); 
  
  // Chaos Interval (The "Health Drain" Speed)
  // Lvl 1: 12 seconds (Very chill). 
  // Lvl 100: ~3 seconds (Panic).
  const chaosInterval = Math.max(3000, 12000 - ((level - 1) * 90));
  
  // Generate Pattern
  const targetData: number[][] = [];
  for (let r = 0; r < gridSize; r++) {
    const row: number[] = [];
    for (let c = 0; c < gridSize; c++) {
      // 20% chance of empty tile for interest
      const isEmpty = Math.random() < 0.2;
      const type = isEmpty ? 0 : Math.floor(Math.random() * availableColors) + 1;
      row.push(type);
    }
    targetData.push(row);
  }

  // Determine difficulty label
  let difficulty: Level['difficulty'] = 'Easy';
  if (level > 10) difficulty = 'Medium';
  if (level > 40) difficulty = 'Hard';
  if (level > 80) difficulty = 'Insane';

  return {
    id: `level-${level}`,
    name: `Level ${level}`,
    difficulty,
    gridSize,
    targetData,
    chaosInterval
  };
};