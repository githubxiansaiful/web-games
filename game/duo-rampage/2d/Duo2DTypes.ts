export type CharacterRole = 'assault' | 'heavy';

export type PlayerAnimState = 
  | 'idle' 
  | 'run' 
  | 'jump' 
  | 'fall' 
  | 'ladder' 
  | 'dash' 
  | 'melee' 
  | 'shoot' 
  | 'downed' 
  | 'reviving';

export type WeaponKind = 'rifle' | 'shotgun' | 'minigun' | 'pistol';

export interface BoxCollider {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PlatformTile {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'solid' | 'jump_through' | 'ground';
  hazardStripes?: boolean;
}

export interface Ladder {
  id: string;
  x: number;
  topY: number;
  bottomY: number;
  w: number;
}

export interface DestructibleProp {
  id: string;
  type: 'crate' | 'barrel' | 'barrier' | 'vehicle';
  x: number;
  y: number;
  w: number;
  h: number;
  health: number;
  maxHealth: number;
  isDestroyed: boolean;
  color?: string;
}

export interface Bullet2D {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  isPlayer: boolean;
  playerId?: string;
  color: string;
  length: number;
  thickness: number;
  rangeRemaining: number;
  penetration?: number;
}

export interface Grenade2D {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  timer: number;
  radius: number;
  damage: number;
  isPlayer: boolean;
  exploded: boolean;
}

export interface Particle2D {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  decay: number;
  size: number;
  sizeGrowth?: number;
  gravity?: number;
  rotation?: number;
  vRot?: number;
  type?: 'spark' | 'smoke' | 'fire' | 'shell' | 'debris' | 'shockwave';
}

export interface FloatingText2D {
  text: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
  bold?: boolean;
}

export type EnemyType = 'thug' | 'shield' | 'drone' | 'brute' | 'boss';

export interface EnemyStats2D {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  health: number;
  maxHealth: number;
  facing: 1 | -1;
  isGrounded: boolean;
  state: 'run' | 'attack' | 'hurt' | 'dead';
  attackCooldown: number;
  scoreValue: number;
  shieldHealth?: number;
}

export interface PlayerState2D {
  id: string;
  role: CharacterRole;
  name: string;
  avatar?: string | null;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  facing: 1 | -1;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  isGrounded: boolean;
  isOnLadder: boolean;
  isDashing: boolean;
  dashTimer: number;
  isMelee: boolean;
  meleeTimer: number;
  isDowned: boolean;
  reviveProgress: number; // 0 to 1
  animState: PlayerAnimState;
  animFrame: number;
  animTimer: number;
  weapon: WeaponKind;
  ammo: number;
  maxAmmo: number;
  score: number;
  kills: number;
}
