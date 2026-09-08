export type VehicleType = 'bicycle' | 'motorcycle' | 'bus';

export type WeaponType = 'pistol' | 'shotgun' | 'smg';

export interface VehicleConfig {
  name: string;
  width: number;
  length: number;
  maxSpeed: number;
  accel: number;
  reverseSpeed: number;
  turnSpeed: number;
  maxHp: number;
  ramDamage: number;
  soundType: 'bicycle' | 'motorcycle' | 'bus';
}

export const VEHICLE_CONFIGS: Record<VehicleType, VehicleConfig> = {
  bicycle: {
    name: 'Village Cycle',
    width: 18,
    length: 44,
    maxSpeed: 6.0,
    accel: 0.25,
    reverseSpeed: 2.2,
    turnSpeed: 0.085,
    maxHp: 80,
    ramDamage: 10,
    soundType: 'bicycle',
  },
  motorcycle: {
    name: 'Street Motorbike',
    width: 22,
    length: 52,
    maxSpeed: 12.0,
    accel: 0.45,
    reverseSpeed: 3.5,
    turnSpeed: 0.065,
    maxHp: 180,
    ramDamage: 25,
    soundType: 'motorcycle',
  },
  bus: {
    name: 'Rural Express Bus',
    width: 48,
    length: 110,
    maxSpeed: 8.0,
    accel: 0.16,
    reverseSpeed: 2.5,
    turnSpeed: 0.032,
    maxHp: 450,
    ramDamage: 70,
    soundType: 'bus',
  },
};

export interface WeaponConfig {
  name: string;
  damage: number;
  fireRate: number; // ms
  speed: number;
  spread: number;
  pellets: number;
  range: number;
  magSize: number;
  color: string;
}

export const WEAPON_CONFIGS: Record<WeaponType, WeaponConfig> = {
  pistol: {
    name: 'Revolver .38',
    damage: 28,
    fireRate: 260,
    speed: 16,
    spread: 0.04,
    pellets: 1,
    range: 480,
    magSize: 12,
    color: '#fbbf24',
  },
  shotgun: {
    name: 'Pump Shotgun',
    damage: 18,
    fireRate: 700,
    speed: 14,
    spread: 0.26,
    pellets: 5,
    range: 340,
    magSize: 6,
    color: '#f97316',
  },
  smg: {
    name: 'Compact SMG',
    damage: 15,
    fireRate: 110,
    speed: 17,
    spread: 0.12,
    pellets: 1,
    range: 520,
    magSize: 30,
    color: '#38bdf8',
  },
};

export interface Vehicle {
  id: string;
  type: VehicleType;
  x: number;
  y: number;
  angle: number;
  speed: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  driverId: string | null;
  color: string;
  isPolice?: boolean;
  sirenTimer?: number;
}

export interface Player {
  id: string;
  name: string;
  x: number;
  y: number;
  angle: number;
  speed: number;
  hp: number;
  maxHp: number;
  coins: number;
  wantedLevel: number;
  wantedTimer: number;
  inVehicle: VehicleType | null;
  vehicleId: string | null;
  activeWeapon: WeaponType;
  ammo: Record<WeaponType, number>;
  bounty: number;
  kills: number;
  isFiring: boolean;
  color: string;
  isLocal?: boolean;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  damage: number;
  range: number;
  dist: number;
  shooterId: string;
  isEnemy?: boolean;
}

export interface Enemy {
  id: string;
  type: 'bandit_foot' | 'bandit_bike' | 'police_patrol' | 'police_jeep';
  x: number;
  y: number;
  angle: number;
  speed: number;
  hp: number;
  maxHp: number;
  weapon: WeaponType;
  shootTimer: number;
  state: 'idle' | 'patrol' | 'chase' | 'flee';
  inVehicle: VehicleType | null;
  vehicleId: string | null;
  color: string;
  patrolCenter: { x: number; y: number };
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  type: 'dust' | 'smoke' | 'spark' | 'blood' | 'muzzle' | 'skid';
}

export interface LootCrate {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  opened: boolean;
  type: 'coins' | 'ammo' | 'health' | 'shotgun' | 'smg';
  value: number;
}

export interface Building {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'stall' | 'house_thatch' | 'house_brick' | 'house_terracotta' | 'barn' | 'sawmill' | 'police_station' | 'windmill';
  color: string;
  roofColor: string;
  label?: string;
}

export interface RoadSegment {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  type: 'asphalt' | 'dirt' | 'bridge';
}

export interface WorldProp {
  x: number;
  y: number;
  radius: number;
  type: 'palm_tree' | 'banyan_tree' | 'hay_bale' | 'water_pond' | 'lantern' | 'fence';
  color?: string;
}

export interface VillageMultiplayerSync {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  speed: number;
  hp: number;
  inVehicle: VehicleType | null;
  vehicleId: string | null;
  activeWeapon: WeaponType;
  isFiring: boolean;
  horn: boolean;
  wantedLevel: number;
  coins: number;
  bounty: number;
}
