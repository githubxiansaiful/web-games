export interface WeaponConfig {
  id: string;
  name: string;
  type: 'pistol' | 'smg' | 'shotgun';
  damage: number;
  fireRate: number; // milliseconds between shots
  magazineSize: number;
  reloadTime: number; // milliseconds
  range: number;
  pellets: number;
  spread: number;
  color: string;
  icon: string;
  modelPath?: string;
}

export const WEAPON_CONFIGS: Record<string, WeaponConfig> = {
  pistol: {
    id: 'pistol',
    name: 'Tactical 9mm',
    type: 'pistol',
    damage: 28,
    fireRate: 350,
    magazineSize: 12,
    reloadTime: 1400,
    range: 120,
    pellets: 1,
    spread: 0.02,
    color: '#38bdf8',
    icon: '🔫',
  },
  smg: {
    id: 'smg',
    name: 'Tactical PDW-9',
    type: 'smg',
    damage: 22,
    fireRate: 105,
    magazineSize: 32,
    reloadTime: 1600,
    range: 110,
    pellets: 1,
    spread: 0.045,
    color: '#a855f7',
    icon: '⚡',
    modelPath: '/models/weapons/gun.glb',
  },
  shotgun: {
    id: 'shotgun',
    name: 'Apex Street Breaker',
    type: 'shotgun',
    damage: 22, // 22 per pellet x 6 = 132 max point-blank damage
    fireRate: 850,
    magazineSize: 6,
    reloadTime: 2400,
    range: 55,
    pellets: 6,
    spread: 0.12,
    color: '#f97316',
    icon: '💥',
  },
};
