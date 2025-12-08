
export enum GameState {
  MENU = 'MENU',
  LEVEL_SELECT = 'LEVEL_SELECT',
  MEMORIZING = 'MEMORIZING',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  WON = 'WON',
  GAME_OVER = 'GAME_OVER',
}

export type TileType = number; // 0: Empty, 1: Red, 2: Blue, etc.

export interface Tile {
  id: string;
  type: TileType;
  isLocked: boolean;
}

export interface GridState {
  rows: number;
  cols: number;
  data: Tile[][];
}

export interface Level {
  id: string;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Insane' | 'AI';
  gridSize: number;
  targetData: number[][]; // Simple number matrix for target
  chaosInterval: number; // ms
}

export enum PowerUpType {
  FREEZE = 'FREEZE',       // Stops chaos for X seconds
  LOCK_TILE = 'LOCK_TILE', // Locks a tile in place
  SLOW_CHAOS = 'SLOW_CHAOS', // Increases chaos interval
  PEEK = 'PEEK',           // Briefly show target
}

export interface Skin {
  id: string;
  name: string;
  bg: string;
  tileColors: Record<number, string>;
  accent: string;
}
