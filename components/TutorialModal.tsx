import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tile, Skin, PowerUpType } from '../types';
import GridTile from './GridTile';
import { Hand, X, BrainCircuit, Shuffle, CheckCircle, Play, RotateCcw, Lock, Snowflake, Turtle, Eye, ChevronRight, ChevronLeft, Heart } from 'lucide-react';

interface TutorialModalProps {
  onClose: () => void;
  skin: Skin;
}

// 2x2 Grid with 4 DISTINCT colors
const TARGET_GRID_DATA: Tile[][] = [
  [{ id: 't1', type: 1, isLocked: false }, { id: 't2', type: 2, isLocked: false }],
  [{ id: 't3', type: 3, isLocked: false }, { id: 't4', type: 4, isLocked: false }],
];

// Helper to deep copy grid
const cloneGrid = (grid: Tile[][]) => grid.map(row => row.map(t => ({ ...t })));

const TutorialModal: React.FC<TutorialModalProps> = ({ onClose, skin }) => {
  const [slide, setSlide] = useState(0); // 0: Intro/Basics, 1: Powerups
  const TOTAL_SLIDES = 2;

  // --- BASICS STATE ---
  const [mode, setMode] = useState<'WATCH' | 'INTERACTIVE'>('WATCH');
  const [demoStep, setDemoStep] = useState(0); 
  const [demoGrid, setDemoGrid] = useState<Tile[][]>(cloneGrid(TARGET_GRID_DATA));
  const [cursorPos, setCursorPos] = useState({ r: 0, c: 0, active: false });
  
  // Interactive Basics State
  const [testPhase, setTestPhase] = useState<'MEMORIZE' | 'SCRAMBLE' | 'SOLVE' | 'WON'>('MEMORIZE');
  const [userGrid, setUserGrid] = useState<Tile[][]>(cloneGrid(TARGET_GRID_DATA));
  const [selectedTile, setSelectedTile] = useState<{r: number, c: number} | null>(null);
  const [countDown, setCountDown] = useState(3);

  // --- POWERUPS STATE ---
  const [activePowerDemo, setActivePowerDemo] = useState<PowerUpType | null>(null);
  const [powerGrid, setPowerGrid] = useState<Tile[][]>(cloneGrid(TARGET_GRID_DATA));
  const [chaosBarPercent, setChaosBarPercent] = useState(0);
  const [powerMessage, setPowerMessage] = useState("Select a powerup to see it in action!");

  // --------------------------------------------------------------------------
  // SLIDE 1: BASICS DEMO LOOP
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (slide !== 0 || mode !== 'WATCH') return;

    let timeout: ReturnType<typeof setTimeout>;
    let isCancelled = false;

    const runDemo = async () => {
      setDemoStep(0);
      setDemoGrid(cloneGrid(TARGET_GRID_DATA));
      setCursorPos({ r: -1, c: -1, active: false });
      
      await new Promise(r => timeout = setTimeout(r, 1500)); 
      if (isCancelled) return;

      setDemoStep(1); // Scramble
      setDemoGrid(prev => {
        const newG = cloneGrid(prev);
        const t1 = newG[0][1];
        const t2 = newG[1][1];
        newG[0][1] = t2;
        newG[1][1] = t1;
        return newG;
      });
      
      await new Promise(r => timeout = setTimeout(r, 1500));
      if (isCancelled) return;

      setDemoStep(2); // Solve
      
      setCursorPos({ r: 0, c: 1, active: false });
      await new Promise(r => timeout = setTimeout(r, 500));
      setCursorPos(prev => ({ ...prev, active: true })); // Click
      await new Promise(r => timeout = setTimeout(r, 200));
      setCursorPos(prev => ({ ...prev, active: false }));
      await new Promise(r => timeout = setTimeout(r, 300));

      setCursorPos({ r: 1, c: 1, active: false });
      await new Promise(r => timeout = setTimeout(r, 500));
      setCursorPos(prev => ({ ...prev, active: true })); // Click
      
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
  }, [slide, mode]);

  // --------------------------------------------------------------------------
  // SLIDE 1: INTERACTIVE BASICS
  // --------------------------------------------------------------------------
  const startTest = () => {
    setMode('INTERACTIVE');
    setTestPhase('MEMORIZE');
    setUserGrid(cloneGrid(TARGET_GRID_DATA));
    setCountDown(3);
    setSelectedTile(null);
  };

  useEffect(() => {
    if (slide !== 0 || mode !== 'INTERACTIVE') return;

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
  }, [slide, mode, testPhase, countDown]);

  const handleUserClick = (r: number, c: number) => {
    if (testPhase !== 'SOLVE') return;

    if (selectedTile) {
      if (selectedTile.r === r && selectedTile.c === c) {
        setSelectedTile(null);
        return;
      }
      const newGrid = cloneGrid(userGrid);
      const t1 = newGrid[selectedTile.r][selectedTile.c];
      const t2 = newGrid[r][c];
      newGrid[selectedTile.r][selectedTile.c] = t2;
      newGrid[r][c] = t1;
      setUserGrid(newGrid);
      setSelectedTile(null);

      let correct = true;
      for(let i=0; i<2; i++) {
        for(let j=0; j<2; j++) {
           if (newGrid[i][j].type !== TARGET_GRID_DATA[i][j].type) correct = false;
        }
      }
      if (correct) setTestPhase('WON');
    } else {
      setSelectedTile({ r, c });
    }
  };

  // --------------------------------------------------------------------------
  // SLIDE 2: POWERUP DEMOS
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (slide !== 1) return;

    // Simulate Chaos Bar
    const interval = setInterval(() => {
        setChaosBarPercent(prev => {
            if (activePowerDemo === PowerUpType.FREEZE) return prev; // Frozen
            if (prev >= 100) return 0;
            const increment = activePowerDemo === PowerUpType.SLOW_CHAOS ? 0.5 : 2;
            return prev + increment;
        });
    }, 50);

    return () => clearInterval(interval);
  }, [slide, activePowerDemo]);

  const triggerPowerDemo = async (type: PowerUpType) => {
    setActivePowerDemo(type);
    setPowerGrid(cloneGrid(TARGET_GRID_DATA));

    if (type === PowerUpType.PEEK) {
        setPowerMessage("PEEK: Shows the target pattern instantly.");
    } else if (type === PowerUpType.FREEZE) {
        setPowerMessage("FREEZE: Stops the Chaos Bar for a few seconds.");
    } else if (type === PowerUpType.SLOW_CHAOS) {
        setPowerMessage("SLOW: Chaos bar fills up 2x slower.");
    } else if (type === PowerUpType.LOCK_TILE) {
        setPowerMessage("LOCK: Prevents a row/column from moving!");
        // Simulate Locking
        setTimeout(() => {
            setPowerGrid(prev => {
                const g = cloneGrid(prev);
                g[0][0].isLocked = true;
                return g;
            });
            setPowerMessage("Tile Locked! Now watch Chaos fail...");
            
            // Simulate Shift Attempt
            setTimeout(() => {
                 // Shake animation logic would go here, effectively visualized by the lock remaining
                 setPowerMessage("Chaos tried to shift Top Row, but failed!");
            }, 1500);
        }, 1000);
    }
  };


  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------
  return (
    <div className="absolute inset-0 z-[70] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in text-white overflow-hidden">
      
      <div className="w-full max-w-sm flex-1 flex flex-col relative">
        <button 
             onClick={onClose}
             className="absolute top-0 right-0 p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition z-20"
           >
             <X size={20} />
        </button>

        {/* PROGRESS INDICATOR */}
        <div className="flex justify-center gap-2 mb-4 mt-2">
            {[0, 1].map(i => (
                <div key={i} className={`h-1 rounded-full transition-all ${slide === i ? 'w-8 bg-cyan-400' : 'w-2 bg-slate-700'}`} />
            ))}
        </div>

        {/* SLIDE CONTENT */}
        <div className="flex-1 flex flex-col items-center justify-center">
            
            {/* --- SLIDE 1: BASICS --- */}
            {slide === 0 && (
                <>
                    <h2 className="text-2xl font-display font-bold mb-2 tracking-widest text-center">BASICS</h2>
                    
                    {/* INSTRUCTION TEXT */}
                    <div className="h-12 mb-4 w-full text-center">
                        <AnimatePresence mode='wait'>
                            {mode === 'WATCH' ? (
                                demoStep === 0 ? <motion.div key="d0" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-green-400 font-bold"><BrainCircuit className="inline mr-1"/> MEMORIZE</motion.div> :
                                demoStep === 1 ? <motion.div key="d1" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-red-500 font-bold"><Shuffle className="inline mr-1"/> CHAOS</motion.div> :
                                <motion.div key="d2" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-cyan-400 font-bold"><Hand className="inline mr-1"/> SWAP TO FIX</motion.div>
                            ) : (
                                testPhase === 'MEMORIZE' ? <div className="text-4xl font-bold">{countDown}</div> :
                                testPhase === 'SCRAMBLE' ? <div className="text-red-500 font-bold">SCRAMBLING...</div> :
                                testPhase === 'SOLVE' ? <div className="text-cyan-400 font-bold">YOUR TURN</div> :
                                <div className="text-green-400 font-bold"><CheckCircle className="inline mr-1"/> SOLVED!</div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* GRID */}
                    <div className="relative w-48 h-48 bg-slate-800 p-2 rounded-xl mb-6 border border-slate-700">
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
                        {/* Cursor for Demo */}
                        {mode === 'WATCH' && demoStep === 2 && cursorPos.r !== -1 && (
                            <motion.div
                            className="absolute z-50 text-white drop-shadow-lg pointer-events-none"
                            animate={{ 
                                top: `${cursorPos.r * 50 + 25}%`, 
                                left: `${cursorPos.c * 50 + 25}%`,
                                scale: cursorPos.active ? 0.8 : 1
                            }}
                            >
                            <Hand size={40} fill={cursorPos.active ? "white" : "transparent"} className="rotate-[-15deg]"/>
                            </motion.div>
                        )}
                    </div>

                    {/* INTERACTIVE TOGGLE */}
                    <div className="w-full h-12 px-4">
                        {mode === 'WATCH' ? (
                            <button onClick={startTest} className="w-full bg-cyan-600 hover:bg-cyan-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm shadow-lg">
                                <Play size={18} fill="currentColor"/> TRY IT
                            </button>
                        ) : (
                            testPhase === 'WON' ? (
                                <button onClick={() => setSlide(1)} className="w-full bg-green-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm shadow-lg animate-pulse">
                                    NEXT: POWERUPS <ChevronRight size={18}/>
                                </button>
                            ) : (
                                <button onClick={startTest} className="w-full bg-slate-700 py-3 rounded-xl font-bold text-sm text-slate-300">
                                    <RotateCcw size={16} className="inline mr-1"/> RESET
                                </button>
                            )
                        )}
                    </div>
                </>
            )}

            {/* --- SLIDE 2: POWERUPS --- */}
            {slide === 1 && (
                <>
                    <h2 className="text-2xl font-display font-bold mb-4 tracking-widest text-center">SURVIVAL TOOLS</h2>
                    
                    {/* MINI HUD SIMULATION */}
                    <div className="w-full px-8 mb-4">
                        <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                             <div className="flex gap-1"><Heart fill="#ef4444" size={12}/><Heart fill="#ef4444" size={12}/><Heart fill="#334155" size={12}/></div>
                             <span>CHAOS METER</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                             <motion.div 
                                className={`h-full ${activePowerDemo === PowerUpType.FREEZE ? 'bg-blue-400' : 'bg-red-500'}`}
                                style={{ width: `${chaosBarPercent}%` }}
                             />
                        </div>
                    </div>

                    {/* MINI GRID */}
                    <div className="relative w-32 h-32 bg-slate-800 p-2 rounded-xl mb-4 border border-slate-700">
                        <div className="grid grid-cols-2 gap-1 w-full h-full">
                            {powerGrid.map((row, r) => row.map((tile, c) => (
                                <GridTile key={tile.id} tile={tile} skin={skin} isSelected={false} onClick={()=>{}} sizeClass="w-full h-full rounded-md"/>
                            )))}
                        </div>
                         {/* Peek Overlay */}
                         {activePowerDemo === PowerUpType.PEEK && (
                            <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center">
                                <span className="text-green-400 font-bold text-xs">TARGET</span>
                            </div>
                        )}
                    </div>

                    {/* INFO TEXT */}
                    <div className="h-16 w-full px-6 text-center text-sm text-cyan-300 mb-4 flex items-center justify-center bg-slate-900/50 rounded-lg mx-4 border border-slate-800">
                        {powerMessage}
                    </div>

                    {/* ICONS ROW */}
                    <div className="flex gap-4 justify-center w-full px-4">
                        <button onClick={() => triggerPowerDemo(PowerUpType.FREEZE)} className={`p-4 rounded-xl transition ${activePowerDemo === PowerUpType.FREEZE ? 'bg-blue-600 text-white scale-110 shadow-lg' : 'bg-slate-800 text-blue-400'}`}>
                            <Snowflake size={24}/>
                        </button>
                        <button onClick={() => triggerPowerDemo(PowerUpType.LOCK_TILE)} className={`p-4 rounded-xl transition ${activePowerDemo === PowerUpType.LOCK_TILE ? 'bg-red-600 text-white scale-110 shadow-lg' : 'bg-slate-800 text-red-400'}`}>
                            <Lock size={24}/>
                        </button>
                        <button onClick={() => triggerPowerDemo(PowerUpType.SLOW_CHAOS)} className={`p-4 rounded-xl transition ${activePowerDemo === PowerUpType.SLOW_CHAOS ? 'bg-green-600 text-white scale-110 shadow-lg' : 'bg-slate-800 text-green-400'}`}>
                            <Turtle size={24}/>
                        </button>
                        <button onClick={() => triggerPowerDemo(PowerUpType.PEEK)} className={`p-4 rounded-xl transition ${activePowerDemo === PowerUpType.PEEK ? 'bg-yellow-500 text-white scale-110 shadow-lg' : 'bg-slate-800 text-yellow-400'}`}>
                            <Eye size={24}/>
                        </button>
                    </div>
                </>
            )}

        </div>

        {/* BOTTOM NAV */}
        <div className="flex justify-between mt-6 px-4 pb-4">
            <button 
                onClick={() => setSlide(Math.max(0, slide - 1))}
                disabled={slide === 0}
                className="text-slate-400 disabled:opacity-30 hover:text-white"
            >
                <ChevronLeft size={32} />
            </button>

            {slide === TOTAL_SLIDES - 1 ? (
                <button onClick={onClose} className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-2 rounded-full font-bold shadow-lg active:scale-95">
                    PLAY NOW
                </button>
            ) : (
                <button onClick={() => setSlide(slide + 1)} className="text-white hover:text-cyan-400">
                    <ChevronRight size={32} />
                </button>
            )}
        </div>

      </div>
    </div>
  );
};

export default TutorialModal;