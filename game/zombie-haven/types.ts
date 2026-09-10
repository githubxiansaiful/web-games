/**
 * Zombie Haven - Core Type Definitions
 * Based on Zombie Haven Game Design Document
 */

export type WeaponType = 'pistol' | 'shotgun' | 'rifle';

export interface WeaponConfig {
  id: WeaponType;
  name: string;
  damage: number;
  magazineSize: number;
  reserveMax: number;
  fireRate: number; // rounds per second
  pellets: number; // for shotgun
  spread: number;
  reloadTime: number; // in seconds
  recoil: number;
  range: number;
}

export interface WeaponState {
  type: WeaponType;
  ammoInClip: number;
  reserveAmmo: number;
  isReloading: boolean;
  reloadTimer: number;
  lastFireTime: number;
}

export type ZombieType = 'walker' | 'runner' | 'tank' | 'screamer';

export type ZombieState = 'idle' | 'search' | 'chase' | 'attack' | 'stagger' | 'dead';

export interface ZombieConfig {
  type: ZombieType;
  maxHealth: number;
  speed: number;
  damage: number;
  attackRange: number;
  attackCooldown: number;
  detectRange: number;
  scoreValue: number;
  scale: number;
  color: number;
}

export interface ZombieInstance {
  id: string;
  type: ZombieType;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  health: number;
  maxHealth: number;
  state: ZombieState;
  targetPlayerId: string | null;
  lastAttackTime: number;
  staggerTimer: number;
  isDead: boolean;
  deathTime?: number;
}

export type PlayerState = 'alive' | 'downed' | 'dead';

export interface PlayerStats {
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  isSprinting: boolean;
  isAiming: boolean;
  isDowned: boolean;
  bleedoutTimer: number; // e.g. 30s
  reviveProgress: number; // 0 to 8s
  score: number;
  kills: number;
  revivesDone: number;
  damageDealt: number;
  damageReceived: number;
}

export interface RemotePlayerSync {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  headPitch: number;
  activeWeapon: WeaponType;
  isAiming: boolean;
  isSprinting: boolean;
  isDowned: boolean;
  health: number;
  flashlightOn: boolean;
  animState: 'idle' | 'walk' | 'run' | 'shoot' | 'downed' | 'reviving';
}

export type LootType = 'medkit' | 'ammo_pistol' | 'ammo_shotgun' | 'ammo_rifle' | 'crate';

export interface LootItem {
  id: string;
  type: LootType;
  x: number;
  y: number;
  z: number;
  respawnTimer?: number;
  isAvailable: boolean;
}

export interface WaveState {
  currentWave: number;
  totalZombiesInWave: number;
  zombiesSpawned: number;
  zombiesRemaining: number;
  state: 'intermission' | 'active' | 'victory' | 'game_over';
  intermissionTimer: number; // 15 seconds between waves
}

export interface MatchStats {
  survivalTimeSeconds: number;
  highestWave: number;
  totalKills: number;
  player1Kills: number;
  player2Kills: number;
  player1Name: string;
  player2Name: string;
  revives: number;
  damageDealt: number;
  damageReceived: number;
}

export interface RoomParticipant {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
}

export interface ZombieRoom {
  code: string;
  hostId: string;
  status: 'lobby' | 'starting' | 'playing' | 'game_over';
  players: RoomParticipant[];
  createdAt: number;
}
