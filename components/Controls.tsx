
import React from 'react';
import { Snowflake, Lock, Turtle, Eye } from 'lucide-react';
import { PowerUpType } from '../types';

interface ControlsProps {
  powerups: Record<PowerUpType, number>;
  onUsePowerup: (type: PowerUpType) => void;
  activeEffects: { frozen: boolean; slowed: boolean };
}

export const Controls: React.FC<ControlsProps> = ({ powerups, onUsePowerup, activeEffects }) => {
  return (
    <div className="flex justify-between items-center gap-2 py-4 w-full max-w-sm mx-auto px-4">
      <button 
        className={`flex-1 aspect-square rounded-2xl relative transition-all flex items-center justify-center shadow-lg active:scale-95 ${activeEffects.frozen ? 'bg-blue-500 text-white animate-pulse ring-2 ring-white' : 'bg-slate-700 text-blue-300 hover:bg-slate-600'}`}
        onClick={() => onUsePowerup(PowerUpType.FREEZE)}
        disabled={powerups.FREEZE === 0}
      >
        <Snowflake size={24} />
        <span className="absolute -top-2 -right-2 bg-white text-slate-900 text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-slate-800">
          {powerups.FREEZE}
        </span>
      </button>

      <button 
        className="flex-1 aspect-square rounded-2xl relative bg-slate-700 text-red-300 hover:bg-slate-600 transition-all flex items-center justify-center shadow-lg active:scale-95"
        onClick={() => onUsePowerup(PowerUpType.LOCK_TILE)}
        disabled={powerups.LOCK_TILE === 0}
      >
        <Lock size={24} />
        <span className="absolute -top-2 -right-2 bg-white text-slate-900 text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-slate-800">
          {powerups.LOCK_TILE}
        </span>
      </button>

      <button 
        className={`flex-1 aspect-square rounded-2xl relative transition-all flex items-center justify-center shadow-lg active:scale-95 ${activeEffects.slowed ? 'bg-green-500 text-white ring-2 ring-white' : 'bg-slate-700 text-green-300 hover:bg-slate-600'}`}
        onClick={() => onUsePowerup(PowerUpType.SLOW_CHAOS)}
        disabled={powerups.SLOW_CHAOS === 0}
      >
        <Turtle size={24} />
        <span className="absolute -top-2 -right-2 bg-white text-slate-900 text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-slate-800">
          {powerups.SLOW_CHAOS}
        </span>
      </button>

      <button 
        className="flex-1 aspect-square rounded-2xl relative bg-slate-700 text-yellow-300 hover:bg-slate-600 transition-all flex items-center justify-center shadow-lg active:scale-95"
        onClick={() => onUsePowerup(PowerUpType.PEEK)}
        disabled={powerups.PEEK === 0}
      >
        <Eye size={24} />
        <span className="absolute -top-2 -right-2 bg-white text-slate-900 text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-slate-800">
          {powerups.PEEK}
        </span>
      </button>
    </div>
  );
};