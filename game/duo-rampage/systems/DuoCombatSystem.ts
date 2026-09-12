/**
 * DUO RAMPAGE - Combat & Projectile System
 * Handles hit detection, damage calculation, critical strikes,
 * shotgun pellet spreads, barrel explosions, and combo integration.
 */

import * as THREE from 'three';
import { BulletProjectile, WeaponType } from '../types';
import { WEAPON_CONFIGS } from '../weapons/WeaponConfig';
import { DuoParticleSystem } from './DuoParticleSystem';
import { DuoComboSystem } from './DuoComboSystem';
import { AbandonedCityEnvironment } from '../world/AbandonedCityEnvironment';
import { DuoEnemyEntity } from '../entities/DuoEnemyEntity';
import { DuoPlayerEntity } from '../entities/DuoPlayerEntity';
import { duoAudio } from '../audio/DuoAudioEngine';

export class DuoCombatSystem {
  public bullets: BulletProjectile[] = [];
  public bulletMeshes: Map<string, THREE.Mesh> = new Map();
  public group: THREE.Group;

  private bulletGeo: THREE.SphereGeometry;
  private particleSystem: DuoParticleSystem;
  private comboSystem: DuoComboSystem;
  private environment: AbandonedCityEnvironment;

  constructor(
    particleSystem: DuoParticleSystem,
    comboSystem: DuoComboSystem,
    environment: AbandonedCityEnvironment
  ) {
    this.group = new THREE.Group();
    this.group.name = 'duo_combat_system';
    this.particleSystem = particleSystem;
    this.comboSystem = comboSystem;
    this.environment = environment;

    this.bulletGeo = new THREE.SphereGeometry(0.16, 6, 6);
  }

  public firePlayerWeapon(
    ownerId: string,
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    weaponType: WeaponType,
    isRampage: boolean
  ) {
    const config = WEAPON_CONFIGS[weaponType];
    const pellets = config.pellets;

    for (let p = 0; p < pellets; p++) {
      const id = 'b_' + Math.random().toString(36).substring(2, 9);
      const spreadAngle = (Math.random() - 0.5) * config.spread;
      const baseDir = direction.clone();

      // Apply spread in X-Z plane
      const vx = (baseDir.x * Math.cos(spreadAngle) - baseDir.z * Math.sin(spreadAngle)) * config.bulletSpeed;
      const vz = (baseDir.x * Math.sin(spreadAngle) + baseDir.z * Math.cos(spreadAngle)) * config.bulletSpeed;

      const bulletMat = new THREE.MeshBasicMaterial({
        color: isRampage ? 0xff0055 : config.color,
      });
      const mesh = new THREE.Mesh(this.bulletGeo, bulletMat);
      mesh.position.copy(origin);
      this.group.add(mesh);
      this.bulletMeshes.set(id, mesh);

      const damageMult = isRampage ? 2.0 : 1.0;
      this.bullets.push({
        id,
        ownerId,
        isEnemy: false,
        x: origin.x,
        y: origin.y,
        z: origin.z,
        vx,
        vz,
        damage: config.damage * damageMult,
        color: config.color,
        life: 0,
        maxLife: config.range / config.bulletSpeed,
        radius: 0.35,
      });
    }

    // Trigger minor screen shake on shotgun or heavy weapons
    if (weaponType === 'shotgun') {
      this.particleSystem.triggerScreenShake(0.25);
    }
  }

  public fireEnemyProjectile(origin: THREE.Vector3, direction: THREE.Vector3, damage: number) {
    const id = 'eb_' + Math.random().toString(36).substring(2, 9);
    const speed = 22;
    const vx = direction.x * speed;
    const vz = direction.z * speed;

    const bulletMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 }); // Violet plasma
    const mesh = new THREE.Mesh(this.bulletGeo, bulletMat);
    mesh.position.copy(origin);
    this.group.add(mesh);
    this.bulletMeshes.set(id, mesh);

    this.bullets.push({
      id,
      ownerId: 'enemy',
      isEnemy: true,
      x: origin.x,
      y: origin.y,
      z: origin.z,
      vx,
      vz,
      damage,
      color: '#a855f7',
      life: 0,
      maxLife: 1.5,
      radius: 0.45,
    });
  }

  public update(
    delta: number,
    enemies: DuoEnemyEntity[],
    players: DuoPlayerEntity[],
    onScoreGain: (pts: number) => void
  ) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.life += delta;
      b.x += b.vx * delta;
      b.z += b.vz * delta;

      const mesh = this.bulletMeshes.get(b.id);
      if (mesh) {
        mesh.position.set(b.x, b.y, b.z);
      }

      // 1. Max Range / Life Expiration
      if (b.life >= b.maxLife) {
        this.removeBullet(b.id, i);
        continue;
      }

      // 2. Player Bullets vs Enemies
      if (!b.isEnemy) {
        let bulletHit = false;

        // Check Enemies
        for (const enemy of enemies) {
          if (enemy.state.isDead) continue;
          const dist = Math.hypot(enemy.state.x - b.x, enemy.state.z - b.z);
          const hitRadius = enemy.state.type === 'boss' ? 1.8 : enemy.state.type === 'tank' ? 1.2 : 0.75;

          if (dist <= hitRadius) {
            bulletHit = true;

            // Calculate Critical Strike (15% chance for 1.8x damage)
            const isCrit = Math.random() < 0.15;
            const finalDamage = Math.round(b.damage * (isCrit ? 1.8 : 1.0));

            const died = enemy.takeDamage(finalDamage);

            // Register Duo Combo Hit
            const comboInfo = this.comboSystem.registerHit();

            // Spawn Damage Number & Hit Sparks
            this.particleSystem.addDamageNumber(
              isCrit ? `${finalDamage} CRIT!` : `${finalDamage}`,
              enemy.state.x,
              1.4,
              enemy.state.z,
              isCrit
            );
            this.particleSystem.spawnHitSparks(b.x, b.y, b.z);

            if (died) {
              this.particleSystem.spawnExplosion(enemy.state.x, 0.8, enemy.state.z, 0.9);
              onScoreGain(enemy.state.scoreValue * comboInfo.multiplier);
            }

            break;
          }
        }

        // Check Destructible Props (Crates & Red Barrels)
        if (!bulletHit) {
          for (const prop of this.environment.destructibles) {
            if (prop.isDestroyed) continue;
            const dist = Math.hypot(prop.x - b.x, prop.z - b.z);
            if (dist <= 0.8) {
              bulletHit = true;
              const result = this.environment.damageProp(prop.id, b.damage);
              this.particleSystem.spawnHitSparks(b.x, b.y, b.z, 0xd97706);

              if (result.destroyed && prop.isExplosive) {
                // RED BARREL EXPLOSION!
                this.particleSystem.spawnExplosion(prop.x, 0.6, prop.z, 1.8);
                duoAudio.playExplosion();

                // Blast damage nearby enemies
                enemies.forEach((e) => {
                  if (e.state.isDead) return;
                  const eDist = Math.hypot(e.state.x - prop.x, e.state.z - prop.z);
                  if (eDist <= 5.5) {
                    const blastDamage = Math.round(110 * (1 - eDist / 5.5));
                    if (e.takeDamage(blastDamage)) {
                      onScoreGain(e.state.scoreValue * 2);
                    }
                    this.particleSystem.addDamageNumber(
                      `${blastDamage}`,
                      e.state.x,
                      1.5,
                      e.state.z,
                      true
                    );
                  }
                });
              }
              break;
            }
          }
        }

        if (bulletHit) {
          this.removeBullet(b.id, i);
          continue;
        }
      }

      // 3. Enemy Bullets vs Players
      if (b.isEnemy) {
        let playerHit = false;
        for (const player of players) {
          if (player.stats.isDown) continue;
          const dist = Math.hypot(player.stats.x - b.x, player.stats.z - b.z);
          if (dist <= 0.8) {
            playerHit = true;
            player.takeDamage(b.damage);
            this.particleSystem.addDamageNumber(`-${b.damage}`, player.stats.x, 1.6, player.stats.z, false);
            this.particleSystem.spawnHitSparks(b.x, b.y, b.z, 0xef4444);
            break;
          }
        }

        if (playerHit) {
          this.removeBullet(b.id, i);
          continue;
        }
      }
    }
  }

  private removeBullet(id: string, index: number) {
    const mesh = this.bulletMeshes.get(id);
    if (mesh) {
      this.group.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      this.bulletMeshes.delete(id);
    }
    this.bullets.splice(index, 1);
  }

  public clear() {
    this.bulletMeshes.forEach((mesh) => {
      this.group.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
    this.bulletMeshes.clear();
    this.bullets = [];
  }
}
