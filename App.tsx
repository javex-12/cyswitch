import React, { useState, useEffect } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { SKINS, MAX_LEVEL } from './constants';
import { GameState, PowerUpType, Skin } from './types';
import GridTile from './components/GridTile';
import { Controls } from './components/Controls';
import TutorialModal from './components/TutorialModal';
import { 
  RotateCcw, Award, BrainCircuit, Zap, Pause, Play, 
  MoreVertical, ChevronRight, ChevronLeft, Lock, Heart, X, Home, HelpCircle, Trash2, Download
} from 'lucide-react';

// Custom event type for PWA installation
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const App: React.FC = () => {
  const {
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
  } = useGameEngine();

  const [currentSkin, setCurrentSkin] = useState<Skin>(SKINS[0]);
  const [selectedTile, setSelectedTile] = useState<{r: number, c: number} | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isLockingMode, setIsLockingMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Listen for PWA install event
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
        setInstallPrompt(null);
    }
  };

  // Handle Tile Click
  const handleTileClick = (r: number, c: number) => {
    if (gameState !== GameState.PLAYING) return;

    if (isLockingMode) {
      lockTile(r, c);
      setIsLockingMode(false);
      return;
    }

    if (selectedTile) {
      if (selectedTile.r === r && selectedTile.c === c) {
        setSelectedTile(null);
        return;
      }
      swapTiles(selectedTile.r, selectedTile.c, r, c);
      setSelectedTile(null);
    } else {
      setSelectedTile({ r, c });
    }
  };

  const handlePowerupClick = (type: PowerUpType) => {
    if (gameState !== GameState.PLAYING) return;

    if (type === PowerUpType.LOCK_TILE) {
      if (powerups.LOCK_TILE > 0) {
         setIsLockingMode(true);
         setMessage("Tap a tile to LOCK it!");
      }
    } else {
      usePowerup(type);
    }
  };

  // Improved Navigation Logic
  const handleMenuToggle = () => {
    if (isMenuOpen) {
        // Closing
        setIsMenuOpen(false);
        if (gameState === GameState.PAUSED) {
            togglePause();
        }
    } else {
        // Opening
        setIsMenuOpen(true);
        if (gameState === GameState.PLAYING || gameState === GameState.MEMORIZING) {
            togglePause();
        }
    }
  };

  const handleRestart = () => {
    setIsMenuOpen(false);
    if (currentLevelNum > 0) {
        startLevel(currentLevelNum);
    } else {
        // AI level restart isn't fully supported without re-gen, so we kick to menu or just reload prompt
        setGameState(GameState.LEVEL_SELECT);
    }
  };

  const handleExitToMenu = () => {
    setIsMenuOpen(false);
    setGameState(GameState.MENU);
  };

  const handleClearData = () => {
    if (confirm("Reset all game progress? This cannot be undone.")) {
        localStorage.removeItem('chaotic_shift_max_level');
        window.location.reload();
    }
  };

  return (
    <div className={`fixed inset-0 w-full h-full flex flex-col items-center ${currentSkin.bg} ${currentSkin.accent} transition-colors duration-300 overflow-hidden`}>
      
      {/* Messages */}
      {message && (
        <div className="absolute top-24 z-50 bg-slate-800/95 text-white px-6 py-3 rounded-full border border-slate-500 shadow-xl animate-bounce text-sm font-bold tracking-wide pointer-events-none">
          {message}
        </div>
      )}

      {/* Main Navigation Header */}
      <header className="w-full flex justify-between items-center p-4 bg-slate-900/50 backdrop-blur-sm border-b border-white/5 z-20 h-16 shrink-0">
        <button 
          onClick={handleMenuToggle}
          className="p-2 rounded-full hover:bg-slate-700/50 active:scale-95 transition text-slate-200"
          aria-label="Menu"
        >
          <MoreVertical size={24} />
        </button>
        
        <div className="flex flex-col items-center">
            <h1 className="text-xl font-display font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
            {gameState === GameState.MENU ? 'CHAOTIC SHIFT' : 
             gameState === GameState.LEVEL_SELECT ? 'MISSION SELECT' :
             `LEVEL ${currentLevelNum > 0 ? currentLevelNum : 'AI'}`}
            </h1>
            {gameState !== GameState.MENU && gameState !== GameState.LEVEL_SELECT && gameState !== GameState.GAME_OVER && (
                 <span className="text-[10px] text-slate-400 tracking-widest uppercase">{gameState === GameState.PAUSED ? 'PAUSED' : gameState}</span>
            )}
        </div>

        {gameState === GameState.PLAYING || gameState === GameState.PAUSED ? (
            <button 
                onClick={togglePause} 
                className={`p-2 rounded-full active:scale-95 transition ${gameState === GameState.PAUSED ? 'bg-yellow-500 text-slate-900 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'hover:bg-slate-700/50 text-slate-200'}`}
            >
                {gameState === GameState.PAUSED ? <Play size={24} fill="currentColor" /> : <Pause size={24} />}
            </button>
        ) : (
             <div className="w-10"></div> // Spacer
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full relative flex flex-col items-center justify-center p-2 overflow-hidden">
        
        {/* WELCOME SCREEN (MENU) */}
        {gameState === GameState.MENU && (
          <div className="flex flex-col items-center justify-center h-full gap-8 animate-fade-in w-full max-w-md">
             {/* Big Title Animation */}
             <div className="text-center space-y-2 mb-4">
                <h1 className="text-6xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-rose-500 tracking-tighter drop-shadow-lg">
                   CHAOTIC
                </h1>
                <h1 className="text-6xl font-display font-bold text-white tracking-[0.2em] drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                   SHIFT
                </h1>
                <div className="flex items-center justify-center gap-2 mt-4 text-slate-400 tracking-widest text-xs">
                   <div className="h-px w-8 bg-slate-600"></div>
                   <span>RESTORE ORDER. SURVIVE THE CHAOS.</span>
                   <div className="h-px w-8 bg-slate-600"></div>
                </div>
             </div>

             {/* Main Actions */}
             <div className="flex flex-col gap-4 w-full px-8">
                <button
                   onClick={() => setGameState(GameState.LEVEL_SELECT)}
                   className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 py-4 rounded-xl font-bold text-xl tracking-wider shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                   <Play fill="currentColor" size={24}/> START GAME
                </button>

                <button
                   onClick={() => setShowTutorial(true)}
                   className="w-full bg-slate-800 border border-slate-600 hover:bg-slate-700 text-slate-200 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                   <HelpCircle size={18} /> HOW TO PLAY
                </button>

                {installPrompt && (
                   <button
                      onClick={handleInstallClick}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 animate-pulse"
                   >
                      <Download size={18} /> INSTALL APP
                   </button>
                )}
             </div>

             {/* Footer Info */}
             <div className="absolute bottom-6 text-slate-600 text-xs text-center">
                <p>v1.2.0 • AI POWERED • PWA READY</p>
             </div>
          </div>
        )}

        {/* LEVEL SELECT SCREEN */}
        {gameState === GameState.LEVEL_SELECT && (
          <div className="w-full max-w-md h-full flex flex-col gap-4 animate-fade-in overflow-y-auto pb-20 px-2 scrollbar-hide">
             
             {/* Back Button */}
             <button 
                onClick={() => setGameState(GameState.MENU)}
                className="self-start flex items-center gap-1 text-slate-400 hover:text-white px-2 py-1 mb-2 text-sm font-bold active:scale-95 transition-transform"
             >
                <ChevronLeft size={16} /> BACK TO TITLE
             </button>

             {/* Campaign Section */}
             <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/10">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-cyan-400">
                    <Award /> CAMPAIGN
                </h2>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: MAX_LEVEL }).map((_, i) => {
                      const levelNum = i + 1;
                      const isLocked = levelNum > maxUnlockedLevel;
                      return (
                        <button 
                            key={levelNum}
                            disabled={isLocked}
                            onClick={() => startLevel(levelNum)}
                            className={`
                                aspect-square rounded-lg flex items-center justify-center text-sm font-bold relative
                                transition-all active:scale-95 duration-75
                                ${isLocked 
                                    ? 'bg-slate-800 text-slate-600 border border-slate-700' 
                                    : levelNum < maxUnlockedLevel 
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30' 
                                        : 'bg-cyan-500 text-slate-900 border border-cyan-400 hover:bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]'}
                            `}
                        >
                            {isLocked ? <Lock size={12} /> : levelNum}
                        </button>
                      );
                  })}
                </div>
             </div>

             {/* Skins Section */}
             <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/10">
               <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-purple-400"><Zap /> SKINS</h2>
               <div className="flex gap-2">
                 {SKINS.map(s => (
                   <button
                     key={s.id}
                     onClick={() => setCurrentSkin(s)}
                     className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all duration-150 ${currentSkin.id === s.id ? 'bg-slate-600 border-white text-white' : 'bg-slate-900/50 border-slate-700 text-slate-400'}`}
                   >
                     {s.name}
                   </button>
                 ))}
               </div>
             </div>

             {/* AI Section */}
             <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/10 mb-8">
                <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-rose-400"><BrainCircuit /> AI GENERATOR</h2>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Describe a pattern..."
                    className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-rose-400 transition"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                  />
                  <button 
                    onClick={() => loadAILevel(customPrompt || "Abstract art")}
                    className="bg-rose-600 hover:bg-rose-500 text-white px-4 rounded-lg font-bold text-sm active:scale-95 transition"
                  >
                    GEN
                  </button>
                </div>
             </div>
          </div>
        )}

        {/* GAME SCREEN */}
        {(gameState === GameState.PLAYING || gameState === GameState.MEMORIZING || gameState === GameState.PAUSED) && grid && (
          <div className="w-full max-w-md flex flex-col items-center h-full">
             
             {/* HUD */}
             <div className="w-full flex justify-between items-end mb-4 px-4 shrink-0">
               <div className="flex flex-col gap-1">
                 <div className="text-[10px] text-slate-400 tracking-wider">STABILITY</div>
                 <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                        <Heart 
                            key={i} 
                            fill={i <= lives ? "#ef4444" : "#334155"} 
                            stroke={i <= lives ? "#ef4444" : "#334155"}
                            size={24}
                            className={`transition-all duration-300 ${i <= lives ? 'animate-pulse' : 'scale-90'}`}
                        />
                    ))}
                 </div>
               </div>
               
               {/* Chaos Bar */}
               <div className="flex-1 mx-6 flex flex-col justify-end pb-2">
                 <div className="flex justify-between text-[10px] text-slate-400 mb-1 tracking-wider uppercase">
                   <span>Chaos Meter</span>
                   <span className={chaosTimer > 80 ? 'text-red-400 font-bold' : ''}>{Math.floor(chaosTimer)}%</span>
                 </div>
                 <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative">
                   <div 
                     className={`h-full transition-all duration-100 ${chaosTimer > 90 ? 'bg-red-500 chaos-warning' : 'bg-gradient-to-r from-blue-600 to-cyan-400'}`}
                     style={{ width: `${chaosTimer}%` }}
                   />
                 </div>
               </div>
             </div>

             {/* The GRID Container */}
             <div className="relative w-full px-4 flex-1 flex flex-col justify-center items-center">
                <div 
                    className={`
                        grid gap-1.5 p-3 bg-slate-800/50 rounded-2xl border border-white/10 shadow-2xl touch-none
                        transition-all duration-100 ease-out
                        ${gameState === GameState.PAUSED ? 'blur-xl opacity-50 scale-95' : 'opacity-100 scale-100'}
                    `}
                    style={{
                        gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))`,
                        aspectRatio: '1/1',
                        width: '100%',
                        maxWidth: '450px'
                    }}
                >
                    {grid.data.map((row, r) => (
                        row.map((tile, c) => (
                        <GridTile 
                            key={tile.id}
                            tile={tile}
                            skin={currentSkin}
                            isSelected={selectedTile?.r === r && selectedTile?.c === c}
                            onClick={() => handleTileClick(r, c)}
                            sizeClass="w-full h-full rounded-lg shadow-inner"
                        />
                        ))
                    ))}
                    
                    {isLockingMode && (
                        <div className="absolute inset-0 z-20 pointer-events-none border-4 border-red-500 rounded-2xl animate-pulse"></div>
                    )}
                </div>

                {/* PAUSED OVERLAY */}
                {gameState === GameState.PAUSED && !isMenuOpen && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center">
                        <div className="bg-slate-900/90 backdrop-blur border border-white/10 p-8 rounded-2xl flex flex-col items-center shadow-2xl">
                             <h2 className="text-2xl font-bold text-white mb-6 tracking-widest">PAUSED</h2>
                             <button onClick={togglePause} className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 px-8 py-3 rounded-full font-bold mb-4 w-full flex items-center justify-center gap-2">
                                <Play size={20} fill="currentColor" /> RESUME
                             </button>
                             <button onClick={handleMenuToggle} className="text-slate-400 hover:text-white underline text-sm">
                                More Options
                             </button>

                             {/* PWA Install Button (Pause Screen) */}
                             {installPrompt && (
                                <div className="mt-8 pt-6 border-t border-white/10 w-full flex flex-col items-center animate-fade-in">
                                    <p className="text-slate-400 text-xs mb-3 text-center">Install for offline play</p>
                                    <button 
                                        onClick={handleInstallClick} 
                                        className="bg-slate-800 border border-slate-600 hover:bg-slate-700 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 active:scale-95 transition-transform"
                                    >
                                        <Download size={16} className="text-purple-400"/> Install App
                                    </button>
                                </div>
                             )}
                        </div>
                    </div>
                )}

                {/* MEMORIZE OVERLAY */}
                {gameState === GameState.MEMORIZING && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white drop-shadow-md font-display tracking-[0.2em] mb-4">MEMORIZE</h2>
                            <div className="text-8xl font-black text-cyan-400 drop-shadow-[0_0_30px_rgba(34,211,238,0.6)] animate-ping-slow">
                                {memorizeTime}
                            </div>
                        </div>
                    </div>
                )}
             </div>

             {/* Controls Footer */}
             <div className="w-full shrink-0 pb-6 pt-2">
                 <Controls 
                    powerups={powerups}
                    onUsePowerup={handlePowerupClick}
                    activeEffects={activeEffects}
                 />
             </div>

          </div>
        )}

        {/* PEEK OVERLAY */}
        {activeEffects.peeking && targetGrid && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 animate-fade-in">
             <div className="relative w-full max-w-[300px]">
                 <div className="absolute -top-12 w-full text-center">
                     <h3 className="text-green-400 font-bold text-xl tracking-widest animate-pulse">TARGET</h3>
                 </div>
                 <div 
                    className="grid gap-1 bg-slate-900 p-2 rounded-xl mx-auto border-4 border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.4)]"
                    style={{
                    gridTemplateColumns: `repeat(${targetGrid.length}, minmax(0, 1fr))`,
                    aspectRatio: '1/1',
                    }}
                >
                    {targetGrid.map((row, r) => (
                    row.map((type, c) => (
                        <div 
                        key={`${r}-${c}`} 
                        className={`w-full h-full rounded ${currentSkin.tileColors[type]}`}
                        />
                    ))
                    ))}
                </div>
            </div>
          </div>
        )}

        {/* SYSTEM MENU MODAL */}
        {isMenuOpen && (
            <div className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
                <div className="w-full max-w-sm bg-slate-800 rounded-3xl border border-slate-600 shadow-2xl p-6 relative">
                    <button 
                        onClick={handleMenuToggle} 
                        className="absolute top-4 right-4 p-2 bg-slate-700/50 rounded-full text-slate-300 hover:bg-slate-700 hover:text-white"
                    >
                        <X size={20} />
                    </button>

                    <h2 className="text-2xl font-bold text-center mb-6 font-display tracking-wider text-white">SYSTEM</h2>
                    
                    {/* PWA Install Button (Menu) */}
                    {installPrompt && (
                        <button
                            onClick={handleInstallClick}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 mb-6 shadow-lg shadow-purple-900/50 animate-pulse hover:scale-105 transition-transform"
                        >
                            <Download size={20} /> INSTALL APP
                        </button>
                    )}

                    <div className="flex flex-col gap-3">
                        {gameState !== GameState.MENU && gameState !== GameState.LEVEL_SELECT && gameState !== GameState.GAME_OVER && gameState !== GameState.WON && (
                            <>
                                <button 
                                    onClick={handleMenuToggle} 
                                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-transform active:scale-95"
                                >
                                    <Play size={20} fill="currentColor" /> RESUME GAME
                                </button>
                                <button 
                                    onClick={handleRestart}
                                    className="bg-slate-700 hover:bg-slate-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-transform active:scale-95"
                                >
                                    <RotateCcw size={20} /> RESTART LEVEL
                                </button>
                                <div className="h-4"></div>
                            </>
                        )}
                        
                        <button 
                            onClick={() => { setShowTutorial(true); setIsMenuOpen(false); }}
                            className="bg-slate-900/50 rounded-xl p-4 text-sm text-slate-300 mb-2 border border-slate-700 hover:bg-slate-800 flex items-center justify-between group transition-colors"
                        >
                            <span className="font-bold text-white flex items-center gap-2"><HelpCircle size={16}/> HOW TO PLAY</span>
                            <span className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">WATCH &rarr;</span>
                        </button>

                        <button 
                            onClick={handleExitToMenu} 
                            className="border border-slate-600 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                            <Home size={18} /> MAIN MENU
                        </button>
                        
                        {(gameState === GameState.MENU || gameState === GameState.LEVEL_SELECT) && (
                            <button 
                                onClick={handleClearData}
                                className="mt-4 text-red-400/70 hover:text-red-400 text-xs flex items-center justify-center gap-1 py-2"
                            >
                                <Trash2 size={12} /> Reset Progress
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* TUTORIAL MODAL */}
        {showTutorial && (
            <TutorialModal skin={currentSkin} onClose={() => setShowTutorial(false)} />
        )}

        {/* WIN / GAME OVER SCREEN */}
        {(gameState === GameState.WON || gameState === GameState.GAME_OVER) && (
           <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in">
             <h2 className={`text-6xl font-display font-bold mb-2 tracking-tighter ${gameState === GameState.WON ? 'text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]' : 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]'}`}>
               {gameState === GameState.WON ? 'CLEARED' : 'FAILED'}
             </h2>
             
             {gameState === GameState.WON && (
                 <p className="text-slate-400 text-lg mb-8 tracking-widest uppercase">Level {currentLevelNum} Complete</p>
             )}

             <div className="flex flex-col gap-4 w-full max-w-xs">
                 {gameState === GameState.WON ? (
                     <button 
                        onClick={nextLevel}
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white py-4 rounded-xl font-bold text-xl shadow-lg hover:scale-105 transition-all"
                    >
                        NEXT LEVEL <ChevronRight />
                    </button>
                 ) : (
                    <button 
                        onClick={() => startLevel(currentLevelNum)}
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white py-4 rounded-xl font-bold text-xl shadow-lg hover:scale-105 transition-all"
                    >
                        RETRY <RotateCcw size={20} />
                    </button>
                 )}
                 
                 <button 
                    onClick={() => setGameState(GameState.LEVEL_SELECT)}
                    className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-bold transition-all border border-slate-700"
                 >
                    MISSION SELECT
                 </button>
             </div>
           </div>
        )}
      </main>
    </div>
  );
};

export default App;