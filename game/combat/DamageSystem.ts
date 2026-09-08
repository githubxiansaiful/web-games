import * as THREE from 'three';

export type DamageType = 'bullet' | 'melee' | 'vehicle' | 'explosion' | 'fall';

export interface DamageEvent {
  amount: number;
  type: DamageType;
  source?: string;
  hitPosition?: THREE.Vector3;
  attackerPosition?: THREE.Vector3;
}

export interface Damageable {
  id: string;
  isDead: boolean;
  health: number;
  maxHealth: number;
  takeDamage(event: DamageEvent): void;
}
