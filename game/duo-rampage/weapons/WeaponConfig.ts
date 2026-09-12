import { WeaponData, WeaponType } from '../types';

export const WEAPON_CONFIGS: Record<WeaponType, WeaponData> = {
  pistol: {
    type: 'pistol',
    name: 'Tactical Pistol',
    damage: 28,
    fireRate: 4.5, // 4.5 rounds per second
    range: 22,
    spread: 0.04,
    pellets: 1,
    magSize: 15,
    reloadTime: 1.1,
    bulletSpeed: 42,
    color: '#38bdf8', // Neon cyan
    recoil: 0.08,
  },
  rifle: {
    type: 'rifle',
    name: 'Assault Rifle',
    damage: 34,
    fireRate: 8.5, // 8.5 rounds per second
    range: 28,
    spread: 0.07,
    pellets: 1,
    magSize: 32,
    reloadTime: 1.6,
    bulletSpeed: 48,
    color: '#f59e0b', // Amber/gold
    recoil: 0.12,
  },
  shotgun: {
    type: 'shotgun',
    name: 'Heavy Shotgun',
    damage: 22, // 22 x 6 pellets = 132 max point-blank damage
    fireRate: 1.6,
    range: 16,
    spread: 0.22,
    pellets: 6,
    magSize: 8,
    reloadTime: 2.2,
    bulletSpeed: 38,
    color: '#ef4444', // Red-orange
    recoil: 0.25,
  },
};
