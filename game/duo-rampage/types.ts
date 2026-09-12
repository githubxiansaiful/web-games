/**
 * DUO RAMPAGE - Core Type Definitions
 * Based on Master Game Specification
 */

export type PlayerRole = 'assault' | 'heavy';
export type WeaponType = 'pistol' | 'rifle' | 'shotgun';
export type EnemyType = 'basic' | 'shooter' | 'tank' | 'boss';

export interface WeaponData {
  type: WeaponType;
  name: string;
  damage: number;
  fireRate: number; // shots per second
  range: number;
  spread: number; // bullet spread angle in radians
  pellets: number; // pellets per shot (e.g. shotgun = 6)
  magSize: number;
  reloadTime: number; // in seconds
  bulletSpeed: number;
  color: string;
  recoil: number;
}

export interface PlayerStats {
  id: string;
  name: string;
  role: PlayerRole;
  isHost: boolean;
  isReady: boolean;
  health: number;
  maxHealth: number;
  isDown: boolean;
  downTimer: number; // 10s countdown when downed
  isReviving: boolean;
  reviveProgress: number; // 0 to 1
  weapon: WeaponType;
  ammo: number;
  maxAmmo: number;
  isReloading: boolean;
  reloadProgress: number;
  specialCooldown: number; // seconds remaining
  specialMaxCooldown: number;
  dashCooldown: number;
  score: number;
  kills: number;
  x: number;
  y: number;
  z: number;
  facing: number; // 1 = right, -1 = left
  animState: 'idle' | 'run' | 'shoot' | 'melee' | 'dash' | 'down' | 'revive' | 'victory';
}

export interface EnemyEntityState {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  z: number;
  health: number;
  maxHealth: number;
  facing: number;
  speed: number;
  isAttacking: boolean;
  attackCooldown: number;
  isDead: boolean;
  scoreValue: number;
  targetPlayerId?: string;
  bossPhase?: number; // 1, 2, or 3 for The Mutant
}

export interface DestructibleProp {
  id: string;
  type: 'crate' | 'barrel' | 'barrier';
  x: number;
  y: number;
  z: number;
  health: number;
  maxHealth: number;
  isDestroyed: boolean;
  isExplosive: boolean;
  explosionRadius?: number;
  explosionDamage?: number;
}

export interface DuoComboState {
  count: number;
  multiplier: number; // 1x, 2x, 5x, 10x
  timer: number; // seconds remaining before combo drops
  maxTimer: number;
  isRampage: boolean;
  rampageTimer: number;
  rampageMaxTimer: number;
}

export interface WaveState {
  currentWave: number;
  totalWaves: number;
  enemiesRemaining: number;
  status: 'preparing' | 'in_progress' | 'wave_cleared' | 'boss_incoming' | 'boss_active' | 'victory' | 'defeat';
  countdown: number;
  waveAnnounceText: string;
}

export interface DamageNumber {
  id: string;
  text: string;
  x: number;
  y: number;
  z: number;
  color: string;
  isCrit: boolean;
  age: number;
  maxAge: number;
}

export interface BulletProjectile {
  id: string;
  ownerId: string;
  isEnemy: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  damage: number;
  color: string;
  life: number;
  maxLife: number;
  radius: number;
}

export interface GrenadeProjectile {
  id: string;
  ownerId: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  timer: number;
  radius: number;
  damage: number;
}

export interface DuoRoomData {
  code: string; // e.g. "#123456"
  hostId: string;
  status: 'lobby' | 'countdown' | 'playing' | 'victory' | 'defeat';
  countdownTimer: number;
  players: {
    id: string;
    name: string;
    avatar?: string;
    role: PlayerRole;
    isHost: boolean;
    isReady: boolean;
  }[];
  wave: number;
  comboCount: number;
}

export interface TouchControlsState {
  moveX: number; // -1 to 1
  moveZ: number; // -1 to 1
  isShooting: boolean;
  isReloading: boolean;
  isDashing: boolean;
  isMelee: boolean;
  isGrenade: boolean;
  isSpecial: boolean;
  isReviving: boolean;
}
