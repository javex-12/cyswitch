
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
  let gridSize = 3;
  let availableColors = 2;
  let chaosInterval = 10000;
  let difficulty: Level['difficulty'] = 'Easy';
  let emptyChance = 0.2;
  let memorizeTime = 3; // Default

  // --- NEW PROGRESSION LOGIC (BEGINNER FRIENDLY) ---
  if (level <= 5) {
    // PHASE 0: BABY STEPS (Levels 1-5)
    // 3x3, 2 Colors.
    // Very slow chaos (18s) and LONG look time (6s)
    gridSize = 3;
    availableColors = 2;
    emptyChance = 0; 
    chaosInterval = 18000; 
    memorizeTime = 6;
    difficulty = 'Easy';
  } else if (level <= 10) {
    // PHASE 1: WARMUP (Levels 6-10)
    // Still 2 Colors. Speed up slightly.
    gridSize = 3;
    availableColors = 2; 
    emptyChance = 0; 
    chaosInterval = 15000; 
    memorizeTime = 5;
    difficulty = 'Easy';
  } else if (level <= 20) {
    // PHASE 2: GETTING COMFORTABLE (Levels 11-20)
    // Add Green. Normal speed.
    gridSize = 3;
    availableColors = 3;
    emptyChance = 0.1;
    chaosInterval = 12000; 
    memorizeTime = 4;
    difficulty = 'Easy';
  } else if (level <= 35) {
    // PHASE 3: THE JUMP (Levels 21-35)
    // Jump to 4x4. 
    gridSize = 4;
    availableColors = 3;
    emptyChance = 0.15;
    chaosInterval = 14000 - ((level - 20) * 200); 
    memorizeTime = 4;
    difficulty = 'Medium';
  } else if (level <= 55) {
    // PHASE 4: COMPLEXITY (Levels 36-55)
    // 4x4. Add Yellow. Speed up.
    gridSize = 4;
    availableColors = 4;
    emptyChance = 0.2;
    chaosInterval = 11000 - ((level - 35) * 150); 
    memorizeTime = 3;
    difficulty = 'Hard';
  } else {
    // PHASE 5: INSANITY (Levels 56+)
    // 5x5 grid. Max colors. Fast.
    gridSize = 5;
    availableColors = Math.min(6, 4 + Math.floor((level - 55) / 10));
    emptyChance = 0.25;
    chaosInterval = 12000 - ((level - 55) * 100); 
    memorizeTime = 3;
    difficulty = 'Insane';
  }

  // Absolute Cap for Speed (Never faster than 2.5s)
  chaosInterval = Math.max(2500, chaosInterval);

  // Generate Pattern
  const targetData: number[][] = [];
  for (let r = 0; r < gridSize; r++) {
    const row: number[] = [];
    for (let c = 0; c < gridSize; c++) {
      const isEmpty = Math.random() < emptyChance;
      const type = isEmpty ? 0 : Math.floor(Math.random() * availableColors) + 1;
      row.push(type);
    }
    targetData.push(row);
  }

  return {
    id: `level-${level}`,
    name: `Level ${level}`,
    difficulty,
    gridSize,
    targetData,
    chaosInterval,
    memorizeTime
  };
};
