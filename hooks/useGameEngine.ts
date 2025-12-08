
import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { GridState, Tile, Level, GameState, PowerUpType } from '../types';
import { generateAILevel } from '../services/aiService';
import { generateLevel } from '../constants';

// Helper to create grid from number matrix
const createGridFromData = (data: number[][]): GridState => {
  const rows = data.length;
  const cols = data[0].length;
  const tiles: Tile[][] = data.map((row) =>
    row.map((type) => ({
      id: uuidv4(),
      type,
      isLocked: false,
    }))
  );
  return { rows, cols, data: tiles };
};

// Helper to shuffle grid 
const shuffleGrid = (grid: Tile[][]): Tile[][] => {
  const flat = grid.flat();
  for (let i = flat.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [flat[i], flat[j]] = [flat[j], flat[i]];
  }
  const newGrid: Tile[][] = [];
  for (let r = 0; r < grid.length; r++) {
    newGrid.push(flat.slice(r * grid.length, (r + 1) * grid.length));
  }
  return newGrid;
};

export const useGameEngine = () => {
  const [grid, setGrid] = useState<GridState | null>(null);
  const [targetGrid, setTargetGrid] = useState<number[][] | null>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  
  // Level Management
  const [currentLevelNum, setCurrentLevelNum] = useState(1);
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState(1);

  // Game Stats
  const [lives, setLives] = useState(3);
  const [memorizeTime, setMemorizeTime] = useState(3);
  const [chaosTimer, setChaosTimer] = useState(100); 
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');
  
  // Powerups
  const [powerups, setPowerups] = useState<Record<PowerUpType, number>>({
    [PowerUpType.FREEZE]: 1,
    [PowerUpType.LOCK_TILE]: 2,
    [PowerUpType.SLOW_CHAOS]: 1,
    [PowerUpType.PEEK]: 3,
  });
  const [activeEffects, setActiveEffects] = useState({
    frozen: false,
    slowed: false,
    peeking: false,
  });

  // Chaos Refs
  const chaosIntervalRef = useRef<number>(5000);
  const nextChaosTimeRef = useRef<number>(0);
  const freezeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pauseTimeRef = useRef<number>(0);

  // Load Unlocked Level from Storage
  useEffect(() => {
    const saved = localStorage.getItem('chaotic_shift_max_level');
    if (saved) {
      setMaxUnlockedLevel(parseInt(saved, 10));
    }
  }, []);

  const saveProgress = (levelWon: number) => {
    if (levelWon >= maxUnlockedLevel) {
      const next = levelWon + 1;
      setMaxUnlockedLevel(next);
      localStorage.setItem('chaotic_shift_max_level', next.toString());
    }
  };

  // Initialize Level
  const loadLevel = useCallback((level: Level) => {
    const solvedGrid = createGridFromData(level.targetData);
    
    setGrid({
      rows: level.gridSize,
      cols: level.gridSize,
      data: solvedGrid.data,
    });
    setTargetGrid(level.targetData);
    setLives(3); // Start with 3 Hearts
    chaosIntervalRef.current = level.chaosInterval;
    setChaosTimer(0);
    setGameState(GameState.MEMORIZING);
    setMemorizeTime(3); 
    setScore(0);
    setActiveEffects({ frozen: false, slowed: false, peeking: false });
    
    // Generous Powerups
    const bonus = level.difficulty === 'Insane' ? 2 : level.difficulty === 'Hard' ? 1 : 0;
    setPowerups({
        [PowerUpType.FREEZE]: 1 + bonus,
        [PowerUpType.LOCK_TILE]: 2 + bonus,
        [PowerUpType.SLOW_CHAOS]: 1 + bonus,
        [PowerUpType.PEEK]: 3, // Always 3 Peeks
    });
  }, []);

  const startLevel = (levelNum: number) => {
    setCurrentLevelNum(levelNum);
    const levelData = generateLevel(levelNum);
    loadLevel(levelData);
  };

  const nextLevel = () => {
    startLevel(currentLevelNum + 1);
  };

  const loadAILevel = async (prompt: string) => {
    setMessage("AI is generating level...");
    const data = await generateAILevel(prompt);
    if (data) {
      const level: Level = {
        id: 'ai-gen',
        name: 'AI Generated',
        difficulty: 'Insane',
        gridSize: data.length,
        chaosInterval: 8000,
        targetData: data
      };
      loadLevel(level);
      setCurrentLevelNum(-1);
      setMessage("");
    } else {
      setMessage("AI Failed. Try checking API Key.");
    }
  };

  const togglePause = () => {
    if (gameState === GameState.PLAYING) {
      setGameState(GameState.PAUSED);
      pauseTimeRef.current = Date.now();
    } else if (gameState === GameState.PAUSED) {
      const pauseDuration = Date.now() - pauseTimeRef.current;
      nextChaosTimeRef.current += pauseDuration;
      setGameState(GameState.PLAYING);
    }
  };

  // Chaos Engine Logic
  const triggerChaos = useCallback(() => {
    if (!grid) return;
    
    // Damage Player
    setLives(prev => {
        const newLives = prev - 1;
        if (newLives <= 0) {
            setGameState(GameState.GAME_OVER);
        }
        return newLives;
    });

    // Animate Hearts Breaking (Visual only handled in App.tsx via state)
    setMessage("CHAOS STRIKE! -1 HEART");
    setTimeout(() => setMessage(""), 2000);

    // Shift Grid
    const isRow = Math.random() > 0.5;
    const index = Math.floor(Math.random() * grid.rows);
    const direction = Math.random() > 0.5 ? 1 : -1;

    setGrid(prev => {
      if (!prev) return null;
      const newData = prev.data.map(row => [...row]); 
      
      if (isRow) {
        const row = newData[index];
        if (row.some(t => t.isLocked)) return prev; 
        
        if (direction === 1) { 
          const last = row.pop()!;
          row.unshift(last);
        } else { 
          const first = row.shift()!;
          row.push(first);
        }
      } else {
        const colIdx = index;
        if (newData.some(row => row[colIdx].isLocked)) return prev;

        if (direction === 1) { 
          const last = newData[prev.rows - 1][colIdx];
          for (let r = prev.rows - 1; r > 0; r--) {
            newData[r][colIdx] = newData[r - 1][colIdx];
          }
          newData[0][colIdx] = last;
        } else { 
          const first = newData[0][colIdx];
          for (let r = 0; r < prev.rows - 1; r++) {
            newData[r][colIdx] = newData[r + 1][colIdx];
          }
          newData[prev.rows - 1][colIdx] = first;
        }
      }
      return { ...prev, data: newData };
    });
  }, [grid]);

  // Memorization Timer
  useEffect(() => {
    if (gameState !== GameState.MEMORIZING) return;

    if (memorizeTime <= 0) {
      setGrid(prev => prev ? { ...prev, data: shuffleGrid(prev.data) } : null);
      setGameState(GameState.PLAYING);
      nextChaosTimeRef.current = Date.now() + chaosIntervalRef.current;
      return;
    }

    const timer = setTimeout(() => {
      setMemorizeTime(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [gameState, memorizeTime]);

  // Playing Loop (High Speed: 100ms)
  useEffect(() => {
    if (gameState !== GameState.PLAYING) return;

    const interval = setInterval(() => {
      const now = Date.now();
      
      // Chaos Logic
      if (!activeEffects.frozen) {
        const intervalDuration = activeEffects.slowed ? chaosIntervalRef.current * 2 : chaosIntervalRef.current;
        
        if (now >= nextChaosTimeRef.current) {
          triggerChaos();
          nextChaosTimeRef.current = now + intervalDuration;
          setChaosTimer(0);
        } 
      }

    }, 100); 
    
    return () => clearInterval(interval);
  }, [gameState, activeEffects, triggerChaos]);

  // Visual Animation Loop for Smooth Chaos Bar
  useEffect(() => {
    if (gameState !== GameState.PLAYING || activeEffects.frozen) return;
    
    let frameId: number;
    const animate = () => {
       const now = Date.now();
       const intervalDuration = activeEffects.slowed ? chaosIntervalRef.current * 2 : chaosIntervalRef.current;
       const remaining = nextChaosTimeRef.current - now;
       const progress = 100 - (remaining / intervalDuration) * 100;
       setChaosTimer(Math.max(0, Math.min(100, progress)));
       frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [gameState, activeEffects]);

  // Win Check
  useEffect(() => {
    if (!grid || !targetGrid || gameState !== GameState.PLAYING) return;

    let matches = 0;
    let total = 0;
    let isWin = true;

    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        total++;
        if (grid.data[r][c].type === targetGrid[r][c]) {
          matches++;
        } else {
          isWin = false;
        }
      }
    }
    
    setScore(Math.floor((matches / total) * 1000));

    if (isWin) {
      setGameState(GameState.WON);
      if (currentLevelNum > 0) {
        saveProgress(currentLevelNum);
      }
    }
  }, [grid, targetGrid, gameState, currentLevelNum, maxUnlockedLevel]);

  // Actions
  const swapTiles = (r1: number, c1: number, r2: number, c2: number) => {
    setGrid(prev => {
      if (!prev) return null;
      const newData = prev.data.map(r => [...r]);
      const tile1 = newData[r1][c1];
      const tile2 = newData[r2][c2];

      if (tile1.isLocked || tile2.isLocked) return prev;

      newData[r1][c1] = tile2;
      newData[r2][c2] = tile1;
      return { ...prev, data: newData };
    });
  };

  const usePowerup = (type: PowerUpType) => {
    if (powerups[type] <= 0) return;

    setPowerups(prev => ({ ...prev, [type]: prev[type] - 1 }));

    if (type === PowerUpType.FREEZE) {
      setActiveEffects(prev => ({ ...prev, frozen: true }));
      const id = setTimeout(() => {
        setActiveEffects(prev => ({ ...prev, frozen: false }));
        // When unfreezing, reset the next chaos time based on full interval to be fair
        nextChaosTimeRef.current = Date.now() + chaosIntervalRef.current;
        freezeTimeoutRef.current = null;
      }, 5000);
      freezeTimeoutRef.current = id;
    }
    
    if (type === PowerUpType.SLOW_CHAOS) {
      setActiveEffects(prev => ({ ...prev, slowed: true }));
      setTimeout(() => {
         setActiveEffects(prev => ({ ...prev, slowed: false }));
      }, 10000);
    }

    if (type === PowerUpType.PEEK) {
        setActiveEffects(prev => ({ ...prev, peeking: true }));
        setTimeout(() => {
            setActiveEffects(prev => ({ ...prev, peeking: false }));
        }, 2000);
    }
  };
  
  const lockTile = (r: number, c: number) => {
     if (!grid || powerups[PowerUpType.LOCK_TILE] <= 0) return;
     setPowerups(prev => ({ ...prev, [PowerUpType.LOCK_TILE]: prev[PowerUpType.LOCK_TILE] - 1 }));
     
     setGrid(prev => {
       if(!prev) return null;
       const newData = prev.data.map(row => [...row]);
       newData[r][c] = { ...newData[r][c], isLocked: true };
       return { ...prev, data: newData };
     });
  };

  return {
    gameState,
    setGameState,
    grid,
    targetGrid,
    lives,
    memorizeTime,
    chaosTimer,
    score,
    powerups,
    activeEffects,
    startLevel,
    nextLevel,
    loadAILevel,
    swapTiles,
    usePowerup,
    lockTile,
    message, 
    setMessage,
    togglePause,
    currentLevelNum,
    maxUnlockedLevel
  };
};