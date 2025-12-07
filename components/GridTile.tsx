import React from 'react';
import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tile, Skin } from '../types';

interface GridTileProps {
  tile: Tile;
  skin: Skin;
  isSelected: boolean;
  onClick: () => void;
  sizeClass: string;
}

const GridTile: React.FC<GridTileProps> = ({ tile, skin, isSelected, onClick, sizeClass }) => {
  const colorClass = skin.tileColors[tile.type] || skin.tileColors[0];
  
  return (
    <motion.div
      layout
      layoutId={tile.id}
      initial={false}
      onClick={onClick}
      // Instant visual feedback using GPU transforms
      whileHover={{ scale: 1.05, zIndex: 20 }}
      whileTap={{ scale: 0.9 }}
      animate={{ 
        scale: isSelected ? 1.15 : 1,
        boxShadow: isSelected 
          ? '0 0 0 4px rgba(255, 255, 255, 1), 0 0 20px rgba(255, 255, 255, 0.5)' 
          : '0 0 0 0px rgba(255, 255, 255, 0)',
        filter: isSelected ? 'brightness(1.2)' : 'brightness(1)'
      }}
      className={`
        ${sizeClass}
        relative
        flex items-center justify-center
        cursor-pointer
        ${colorClass}
        ${isSelected ? 'z-30' : 'z-10'}
      `}
      // Ultra-fast physics config: High stiffness + Low mass = Instant Snap
      transition={{
        type: "spring",
        stiffness: 1500,
        damping: 80,
        mass: 0.2
      }}
    >
      {tile.isLocked && (
        <Lock className="w-1/2 h-1/2 text-white/80 animate-pulse drop-shadow-md" />
      )}
    </motion.div>
  );
};

export default React.memo(GridTile);