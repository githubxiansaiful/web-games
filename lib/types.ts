export type ControlKeys = {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  jumpJustPressed: boolean;
};

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type MovingPlatform = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  speed: number;
  color?: string;
  isOneWay?: boolean;
  progress?: number;
  direction?: number;
  vx?: number;
  vy?: number;
};

export type Coin = {
  id: string;
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  animOffset: number;
};

export type HazardType = 'spike_up' | 'spike_down' | 'spike_left' | 'spike_right' | 'saw' | 'slime';

export type Hazard = {
  id: string;
  type: HazardType;
  x: number;
  y: number;
  width: number;
  height: number;
  startX?: number;
  endX?: number;
  speed?: number;
  direction?: number;
  rotation?: number;
};

export type Checkpoint = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  respawnX: number;
  respawnY: number;
};

export type GoalFlag = {
  x: number;
  y: number;
  width: number;
  height: number;
  reached: boolean;
};

export type Spring = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  force: number;
  compressed?: number;
};

export type Platform = {
  x: number;
  y: number;
  width: number;
  height: number;
  type?: 'ground' | 'stone' | 'wood' | 'one_way' | 'floating' | 'ice';
  isOneWay?: boolean;
};

export type LevelTheme = {
  name: string;
  skyGradient: [string, string, string];
  mountainColor: string;
  hillColor: string;
  groundTopColor: string;
  groundBodyColor: string;
  platformColor: string;
  platformAccent: string;
  accentColor: string;
};

export type LevelData = {
  id: number;
  name: string;
  subtitle: string;
  theme: LevelTheme;
  width: number;
  height: number;
  deathY: number;
  spawn: { x: number; y: number };
  platforms: Platform[];
  movingPlatforms: MovingPlatform[];
  coins: Coin[];
  hazards: Hazard[];
  checkpoints: Checkpoint[];
  springs?: Spring[];
  goal: GoalFlag;
  parTime: number; // in seconds for 3-star rating
};

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  shape?: 'circle' | 'square' | 'spark' | 'ring';
  rotation?: number;
  vRot?: number;
};

export type FloatingText = {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  fontSize?: number;
};

export type PlayerState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  grounded: boolean;
  ridingPlatform: MovingPlatform | null;
  facing: 1 | -1; // 1 = right, -1 = left
  isJumping: boolean;
  canDoubleJump: boolean;
  coyoteTimer: number;
  jumpBufferTimer: number;
  isDead: boolean;
  deathTimer: number;
  respawnTimer: number;
  invulnerableTimer: number;
  activeCheckpointId: string | null;
  squashX: number;
  squashY: number;
  runFrame: number;
  trail: Array<{ x: number; y: number; alpha: number }>;
};

export type GameStats = {
  levelId: number;
  coinsCollected: number;
  totalCoins: number;
  deaths: number;
  timeElapsed: number;
  isCompleted: boolean;
  stars: number;
};

export type LevelProgress = {
  stars: number;
  bestTime: number;
  coinsFound: number;
  totalCoins: number;
  completed: boolean;
};
