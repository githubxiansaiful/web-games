export type PlayerColor = {
  id: string;
  name: string;
  primary: string;
  glow: string;
};

export const PLAYER_COLORS: PlayerColor[] = [
  { id: 'cyan', name: 'Cyber Cyan', primary: '#06b6d4', glow: 'rgba(6, 182, 212, 0.6)' },
  { id: 'pink', name: 'Neon Pink', primary: '#ec4899', glow: 'rgba(236, 72, 153, 0.6)' },
  { id: 'lime', name: 'Emerald Lime', primary: '#10b981', glow: 'rgba(16, 185, 129, 0.6)' },
  { id: 'gold', name: 'Solar Gold', primary: '#eab308', glow: 'rgba(234, 179, 8, 0.6)' },
  { id: 'orange', name: 'Flame Orange', primary: '#f97316', glow: 'rgba(249, 115, 22, 0.6)' },
  { id: 'purple', name: 'Phantom Purple', primary: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.6)' },
];

export type RoomPlayer = {
  id: string;
  name: string;
  color: string;
  isHost: boolean;
  isReady: boolean;
  finished?: boolean;
  finishRank?: number;
  finishTime?: number;
  coins?: number;
};

export type RoomState = {
  code: string;
  gameType?: 'runner';
  hostId: string;
  stageId: number;
  status: 'lobby' | 'countdown' | 'in_game' | 'finished';
  players: RoomPlayer[];
};

export type RemotePlayerState = {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  grounded: boolean;
  isDead: boolean;
  squashX: number;
  squashY: number;
  runFrame: number;
  name: string;
  color: string;
  progressPercent: number;
  coins: number;
  finished?: boolean;
  finishRank?: number;
  finishTime?: number;
  currentEmote?: { emoji: string; timer: number } | null;
  trail: Array<{ x: number; y: number; alpha: number }>;
};
