import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tile, Skin } from '../types';
import GridTile from './GridTile';
import { Hand, X, BrainCircuit, Shuffle, CheckCircle, Play, RotateCcw } from 'lucide-react';

interface TutorialModalProps {
  onClose: () => void;
  skin: Skin;
}

// 2x2 Grid with 4 DISTINCT colors to ensure swaps are always visible
// 1=Red, 2=Blue, 3=Green, 4=Yellow
const TARGET_GRID_DATA: Tile[][] = [
  [{ id: 't1', type: 1, isLocked: false }, { id: 't2', type: 2, isLocked: false }],
  [{ id: 't3', type: 3, isLocked: false }, { id: 't4', type: 4, isLocked: false }],
];

// Helper to deep copy grid
const cloneGrid = (grid: Tile[][]) => grid.map(row => row.map(t => ({ ...t })));

const TutorialModal: React.FC<TutorialModalProps> = ({ onClose, skin }) => {
  const [mode, setMode] = useState<'WATCH' | 'INTERACTIVE'>('WATCH');
  
  // --- WATCH MODE STATE ---
  const [demoStep, setDemoStep] = useState(0); // 0: Memorize, 1: Chaos, 2: Solve
  const [demoGrid, setDemoGrid] = useState<Tile[][]>(cloneGrid(TARGET_GRID_DATA));
  const [cursorPos, setCursorPos] = useState({ r: 0, c: 0, active: false });

  // --- INTERACTIVE MODE STATE ---
  const [testPhase, setTestPhase] = useState<'MEMORIZE' | 'SCRAMBLE' | 'SOLVE' | 'WON'>('MEMORIZE');
  const [userGrid, setUserGrid] = useState<Tile[][]>(cloneGrid(TARGET_GRID_DATA));
  const [selectedTile, setSelectedTile] = useState<{r: number, c: number} | null>(null);
  const [countDown, setCountDown] = useState(3);

  // --- DEMO LOOP (WATCH MODE) ---
  useEffect(() => {
    if (mode !== 'WATCH') return;

    let timeout: ReturnType<typeof setTimeout>;
    let isCancelled = false;

    const runDemo = async () => {
      // 1. Reset
      setDemoStep(0);
      setDemoGrid(cloneGrid(TARGET_GRID_DATA));
      setCursorPos({ r: -1, c: -1, active: false });
      
      await new Promise(r => timeout = setTimeout(r, 1500)); 
      if (isCancelled) return;

      // 2. Scramble
      setDemoStep(1);
      setDemoGrid(prev => {
        const newG = cloneGrid(prev);
        // Swap Right Column: (0,1) Blue <-> (1,1) Yellow
        const t1 = newG[0][1];
        const t2 = newG[1][1];
        newG[0][1] = t2;
        newG[1][1] = t1;
        return newG;
      });
      
      await new Promise(r => timeout = setTimeout(r, 1500));
      if (isCancelled) return;

      // 3. Solve Simulation
      setDemoStep(2);
      
      // Move to 0,1
      setCursorPos({ r: 0, c: 1, active: false });
      await new Promise(r => timeout = setTimeout(r, 500));
      setCursorPos(prev => ({ ...prev, active: true })); // Click
      await new Promise(r => timeout = setTimeout(r, 200));
      setCursorPos(prev => ({ ...prev, active: false }));
      await new Promise(r => timeout = setTimeout(r, 300));

      // Move to 1,1
      setCursorPos({ r: 1, c: 1, active: false });
      await new Promise(r => timeout = setTimeout(r, 500));
      setCursorPos(prev => ({ ...prev, active: true })); // Click
      
      // Swap Visual
      setDemoGrid(cloneGrid(TARGET_GRID_DATA));
      
      await new Promise(r => timeout = setTimeout(r, 200));
      setCursorPos(prev => ({ ...prev, active: false }));

      await new Promise(r => timeout = setTimeout(r, 1500));
      if (!isCancelled) runDemo();
    };

    runDemo();

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [mode]);

  // --- INTERACTIVE LOGIC ---
  const startTest = () => {
    setMode('INTERACTIVE');
    setTestPhase('MEMORIZE');
    setUserGrid(cloneGrid(TARGET_GRID_DATA));
    setCountDown(3);
    setSelectedTile(null);
  };

  useEffect(() => {
    if (mode !== 'INTERACTIVE') return;

    if (testPhase === 'MEMORIZE') {
      if (countDown > 0) {
        const timer = setTimeout(() => setCountDown(c => c - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setTestPhase('SCRAMBLE');
      }
    }

    if (testPhase === 'SCRAMBLE') {
      const timer = setTimeout(() => {
        // Scramble logic: Flip corners (Top-Left Red <-> Bottom-Right Yellow)
        // Since all 4 tiles are different colors, this swap is GUARANTEED to be visible.
        setUserGrid(prev => {
           const g = cloneGrid(prev);
           const t1 = g[0][0]; // Red
           const t2 = g[1][1]; // Yellow
           g[0][0] = t2;
           g[1][1] = t1;
           return g;
        });
        setTestPhase('SOLVE');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [mode, testPhase, countDown]);

  const handleUserClick = (r: number, c: number) => {
    if (testPhase !== 'SOLVE') return;

    if (selectedTile) {
      if (selectedTile.r === r && selectedTile.c === c) {
        setSelectedTile(null);
        return;
      }

      // Swap
      const newGrid = cloneGrid(userGrid);
      const t1 = newGrid[selectedTile.r][selectedTile.c];
      const t2 = newGrid[r][c];
      newGrid[selectedTile.r][selectedTile.c] = t2;
      newGrid[r][c] = t1;
      setUserGrid(newGrid);
      setSelectedTile(null);

      // Check Win
      let correct = true;
      for(let i=0; i<2; i++) {
        for(let j=0; j<2; j++) {
           if (newGrid[i][j].type !== TARGET_GRID_DATA[i][j].type) correct = false;
        }
      }

      if (correct) {
        setTestPhase('WON');
      }
    } else {
      setSelectedTile({ r, c });
    }
  };

  return (
    <div className="absolute inset-0 z-[70] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl p-6 relative flex flex-col items-center overflow-hidden">
        
        {mode === 'WATCH' && (
             <button 
             onClick={onClose}
             className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition"
           >
             <X size={20} />
           </button>
        )}

        {/* HEADER */}
        <h2 className="text-2xl font-display font-bold text-white mb-2 tracking-widest">
            {mode === 'WATCH' ? 'HOW TO PLAY' : 'SKILL TEST'}
        </h2>

        {/* INSTRUCTIONS */}
        <div className="h-14 flex items-center justify-center mb-6 w-full">
          <AnimatePresence mode='wait'>
            {mode === 'WATCH' ? (
                // DEMO LABELS
                <>
                {demoStep === 0 && (
                    <motion.div key="d0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-center">
                        <div className="text-green-400 font-bold flex gap-2 items-center justify-center"><BrainCircuit size={18}/> MEMORIZE</div>
                        <p className="text-slate-500 text-sm">Remember the pattern.</p>
                    </motion.div>
                )}
                {demoStep === 1 && (
                    <motion.div key="d1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-center">
                        <div className="text-red-500 font-bold flex gap-2 items-center justify-center"><Shuffle size={18}/> CHAOS</div>
                        <p className="text-slate-500 text-sm">The grid shifts randomly.</p>
                    </motion.div>
                )}
                {demoStep === 2 && (
                    <motion.div key="d2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-center">
                        <div className="text-cyan-400 font-bold flex gap-2 items-center justify-center"><Hand size={18}/> RESTORE</div>
                        <p className="text-slate-500 text-sm">Swap tiles to fix it.</p>
                    </motion.div>
                )}
                </>
            ) : (
                // TEST LABELS
                <>
                {testPhase === 'MEMORIZE' && (
                    <motion.div key="t0" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.5 }} className="text-center">
                        <div className="text-6xl font-black text-white drop-shadow-lg">{countDown}</div>
                    </motion.div>
                )}
                {testPhase === 'SCRAMBLE' && (
                    <motion.div key="t1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="text-center">
                        <div className="text-red-500 font-bold text-xl flex gap-2 items-center justify-center animate-pulse"><Shuffle /> SCRAMBLING...</div>
                    </motion.div>
                )}
                {testPhase === 'SOLVE' && (
                    <motion.div key="t2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-center">
                        <div className="text-cyan-400 font-bold flex gap-2 items-center justify-center">YOUR TURN</div>
                        <p className="text-slate-400 text-sm">Swap tiles to match the pattern!</p>
                    </motion.div>
                )}
                {testPhase === 'WON' && (
                    <motion.div key="t3" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                        <div className="text-green-400 font-bold text-xl flex gap-2 items-center justify-center"><CheckCircle /> EXCELLENT!</div>
                        <p className="text-slate-400 text-sm">You are ready.</p>
                    </motion.div>
                )}
                </>
            )}
          </AnimatePresence>
        </div>

        {/* GRID CONTAINER */}
        <div className="relative w-48 h-48 bg-slate-800 p-2 rounded-xl mb-8 border border-slate-700 shadow-inner">
           {/* Color Border State Indicator */}
           <div className={`absolute inset-0 rounded-xl border-4 transition-colors duration-500 pointer-events-none z-0 ${
             mode === 'WATCH' 
                ? (demoStep === 0 ? 'border-green-500/30' : demoStep === 1 ? 'border-red-500/30' : 'border-cyan-500/30')
                : (testPhase === 'MEMORIZE' ? 'border-white/50' : testPhase === 'SOLVE' ? 'border-cyan-500' : testPhase === 'WON' ? 'border-green-500' : 'border-red-500')
           }`}></div>

           <div className="grid grid-cols-2 gap-2 w-full h-full relative z-10">
              {(mode === 'WATCH' ? demoGrid : userGrid).map((row, r) => (
                row.map((tile, c) => (
                  <GridTile
                    key={tile.id}
                    tile={tile}
                    skin={skin}
                    isSelected={mode === 'INTERACTIVE' && selectedTile?.r === r && selectedTile?.c === c}
                    onClick={() => mode === 'INTERACTIVE' && handleUserClick(r, c)}
                    sizeClass="w-full h-full rounded-lg"
                  />
                ))
              ))}
           </div>

           {/* Watch Mode Cursor */}
           {mode === 'WATCH' && demoStep === 2 && cursorPos.r !== -1 && (
             <motion.div
               className="absolute z-50 text-white drop-shadow-lg pointer-events-none"
               animate={{ 
                 top: `${cursorPos.r * 50 + 25}%`, 
                 left: `${cursorPos.c * 50 + 25}%`,
                 scale: cursorPos.active ? 0.8 : 1
               }}
               transition={{ duration: 0.4, ease: "circOut" }}
             >
               <Hand 
                size={40} 
                fill={cursorPos.active ? "white" : "transparent"} 
                className="rotate-[-15deg]"
               />
             </motion.div>
           )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="w-full h-12">
            <AnimatePresence mode='wait'>
                {mode === 'WATCH' ? (
                    <motion.button 
                        key="try-btn"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        onClick={startTest}
                        className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
                    >
                        <Play size={20} fill="currentColor" /> TRY IT YOURSELF
                    </motion.button>
                ) : (
                    testPhase === 'WON' ? (
                        <motion.button 
                            key="finish-btn"
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            onClick={onClose}
                            className="w-full bg-green-500 hover:bg-green-400 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
                        >
                            <CheckCircle size={20} /> START GAME
                        </motion.button>
                    ) : (
                         testPhase === 'SOLVE' && (
                            <motion.button 
                                key="reset-btn"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                onClick={startTest}
                                className="w-full bg-slate-800 text-slate-400 hover:text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm"
                            >
                                <RotateCcw size={16} /> RESTART TEST
                            </motion.button>
                         )
                    )
                )}
            </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

export default TutorialModal;