/**
 * DUO RAMPAGE - Ground Pickups & Weapon Drops System
 * Spawns glowing 3D crates on the asphalt street:
 * - Ammo Boxes (glowing cyan): Restores full ammo & resets reload
 * - Medkits (glowing green): Restores +40 HP
 * - Heavy Shotgun / Plasma Rifle Drops (glowing gold): Unlocks weapon upgrade
 * Rotating 3D models with vertical glowing light pillars.
 */

import * as THREE from 'three';
import { DuoPlayerEntity } from '../entities/DuoPlayerEntity';
import { DuoParticleSystem } from './DuoParticleSystem';
import { duoAudio } from '../audio/DuoAudioEngine';

export type PickupType = 'ammo' | 'health' | 'weapon_shotgun' | 'weapon_rifle';

export interface GroundPickupItem {
  id: string;
  type: PickupType;
  x: number;
  y: number;
  z: number;
  meshGroup: THREE.Group;
  collected: boolean;
}

export class DuoPickupSystem {
  public group: THREE.Group;
  public pickups: GroundPickupItem[] = [];
  private particleSystem: DuoParticleSystem;

  constructor(particleSystem: DuoParticleSystem) {
    this.group = new THREE.Group();
    this.group.name = 'duo_pickup_system';
    this.particleSystem = particleSystem;

    // Spawn initial tactical street supply drops
    this.spawnPickup('ammo', -12, 1.2);
    this.spawnPickup('health', 0, -2.2);
    this.spawnPickup('weapon_shotgun', 14, 1.5);
    this.spawnPickup('ammo', 28, -1.8);
  }

  public spawnPickup(type: PickupType, x: number, z: number) {
    const id = 'pickup_' + Math.random().toString(36).substring(2, 9);
    const meshGroup = new THREE.Group();
    meshGroup.position.set(x, 0.45, z);

    let color = 0x38bdf8; // Cyan Ammo
    let iconColor = 0xffffff;

    if (type === 'health') {
      color = 0x22c55e; // Green Health
    } else if (type === 'weapon_shotgun' || type === 'weapon_rifle') {
      color = 0xf59e0b; // Gold Weapon
    }

    // 1. Glowing Supply Box Mesh
    const boxGeo = new THREE.BoxGeometry(0.7, 0.5, 0.7);
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.4,
      roughness: 0.4,
    });
    const box = new THREE.Mesh(boxGeo, boxMat);
    meshGroup.add(box);

    // Glowing Neon Lid / Trim
    const trimGeo = new THREE.BoxGeometry(0.75, 0.12, 0.75);
    const trimMat = new THREE.MeshBasicMaterial({ color });
    const trim = new THREE.Mesh(trimGeo, trimMat);
    trim.position.y = 0.22;
    meshGroup.add(trim);

    // 2. Vertical Light Pillar
    const beamGeo = new THREE.CylinderGeometry(0.15, 0.4, 4.0, 8);
    const beamMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 2.0;
    meshGroup.add(beam);

    // 3. Point Light
    const light = new THREE.PointLight(color, 1.8, 6);
    light.position.set(0, 0.6, 0);
    meshGroup.add(light);

    this.group.add(meshGroup);

    this.pickups.push({
      id,
      type,
      x,
      y: 0.45,
      z,
      meshGroup,
      collected: false,
    });
  }

  public update(delta: number, time: number, players: DuoPlayerEntity[]) {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      if (p.collected) continue;

      // Animate gentle bobbing & rotation
      p.meshGroup.rotation.y += delta * 1.8;
      p.meshGroup.position.y = 0.45 + Math.sin(time * 3 + i) * 0.08;

      // Check proximity with all players
      for (const player of players) {
        if (player.stats.isDown) continue;
        const dist = Math.hypot(player.stats.x - p.x, player.stats.z - p.z);

        if (dist <= 1.6) {
          // Collect Pickup!
          p.collected = true;
          this.group.remove(p.meshGroup);

          this.particleSystem.spawnHitSparks(p.x, 1.0, p.z, 0xfacc15);
          duoAudio.playReviveSuccess();

          if (p.type === 'ammo') {
            player.stats.ammo = player.stats.maxAmmo;
            player.stats.isReloading = false;
            this.particleSystem.addDamageNumber('+FULL AMMO!', player.stats.x, 1.8, player.stats.z, true);
          } else if (p.type === 'health') {
            player.stats.health = Math.min(player.stats.maxHealth, player.stats.health + 45);
            this.particleSystem.addDamageNumber('+45 HP!', player.stats.x, 1.8, player.stats.z, true);
          } else if (p.type === 'weapon_shotgun') {
            player.setWeapon('shotgun');
            this.particleSystem.addDamageNumber('+HEAVY SHOTGUN!', player.stats.x, 1.8, player.stats.z, true);
          } else if (p.type === 'weapon_rifle') {
            player.setWeapon('rifle');
            this.particleSystem.addDamageNumber('+ASSAULT RIFLE!', player.stats.x, 1.8, player.stats.z, true);
          }

          this.pickups.splice(i, 1);
          break;
        }
      }
    }
  }

  public clear() {
    this.pickups.forEach((p) => {
      this.group.remove(p.meshGroup);
    });
    this.pickups = [];
  }
}
