/**
 * Zombie Haven - Zombie Horde Manager
 * Controls spawning, AI pathfinding, targeting nearest survivor,
 * attack cooldowns, raycast hit tests, and dead entity cleanup.
 */

import * as THREE from 'three';
import { Zombie } from './Zombie';
import { ZombieType } from '../types';
import { DeadwoodVillage } from '../world/DeadwoodVillage';
import { SurvivorPlayer } from '../player/SurvivorPlayer';
import { zombieAudio } from '@/components/zombie-haven/ZombieHavenAudio';
import { zombieGLBLoader } from './ZombieGLBLoader';

export class ZombieHordeManager {
  public zombies: Zombie[] = [];
  public scene: THREE.Scene;
  public village: DeadwoodVillage;
  private nextZombieId: number = 1;
  private ambientGroanTimer: number = 5;

  constructor(scene: THREE.Scene, village: DeadwoodVillage) {
    this.scene = scene;
    this.village = village;
    zombieGLBLoader.load();
  }

  public spawnZombie(type: ZombieType, spawnPos?: THREE.Vector3): Zombie {
    let pos: THREE.Vector3;

    if (spawnPos) {
      pos = spawnPos.clone();
    } else {
      // Pick random spawn point from village boundary
      const spawnPoints = this.village.zombieSpawnPoints;
      const idx = Math.floor(Math.random() * spawnPoints.length);
      pos = spawnPoints[idx].clone();
      // Add slight jitter
      pos.x += (Math.random() - 0.5) * 8;
      pos.z += (Math.random() - 0.5) * 8;
    }

    const id = `z_${this.nextZombieId++}`;
    const zombie = new Zombie(id, type, pos);
    this.zombies.push(zombie);
    this.scene.add(zombie.group);

    return zombie;
  }

  /**
   * Spawns a batch of zombies for a wave
   */
  public spawnWaveBatch(count: number, waveNumber: number, playerPos: THREE.Vector3) {
    for (let i = 0; i < count; i++) {
      // Determine zombie type based on wave
      let type: ZombieType = 'walker';
      const roll = Math.random();

      if (waveNumber >= 5 && roll < 0.12) {
        type = 'tank'; // Tank appears on Wave 5+
      } else if (waveNumber >= 4 && roll < 0.22) {
        type = 'screamer';
      } else if (waveNumber >= 2 && roll < 0.45) {
        type = 'runner'; // Fast runner appears on Wave 2+
      }

      // Choose spawn at least 35m away from player
      let bestSpawn = this.village.zombieSpawnPoints[0];
      for (let s = 0; s < 4; s++) {
        const candidate =
          this.village.zombieSpawnPoints[
            Math.floor(Math.random() * this.village.zombieSpawnPoints.length)
          ];
        if (candidate.distanceTo(playerPos) > 35) {
          bestSpawn = candidate;
          break;
        }
      }

      this.spawnZombie(type, bestSpawn);
    }
  }

  /**
   * Raycast Hit Test against all active zombies
   * Returns hit zombie if ray intersects bounding cylinder/box
   */
  public testBulletHit(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    maxRange: number
  ): { zombie: Zombie; hitPoint: THREE.Vector3; isHeadshot: boolean } | null {
    let closestZombie: Zombie | null = null;
    let closestDist = maxRange;
    let hitPoint = new THREE.Vector3();
    let isHeadshot = false;

    for (let i = 0; i < this.zombies.length; i++) {
      const z = this.zombies[i];
      if (z.isDead) continue;

      const zPos = z.group.position;
      // Cylinder bounding check around zombie (radius ~0.55m, height ~1.85m)
      const toZombie = zPos.clone().add(new THREE.Vector3(0, 1.0, 0)).sub(origin);
      const proj = toZombie.dot(direction);

      if (proj > 0 && proj < closestDist) {
        const closestPointOnRay = origin.clone().addScaledVector(direction, proj);
        const distToCenter = closestPointOnRay.distanceTo(zPos.clone().add(new THREE.Vector3(0, 1.0, 0)));

        const hitRadius = 0.65 * z.config.scale;
        if (distToCenter < hitRadius) {
          closestDist = proj;
          closestZombie = z;
          hitPoint.copy(closestPointOnRay);
          // Check if headshot (hit above 1.45m height)
          isHeadshot = closestPointOnRay.y > zPos.y + 1.35 * z.config.scale;
        }
      }
    }

    if (closestZombie) {
      return { zombie: closestZombie, hitPoint, isHeadshot };
    }
    return null;
  }

  public update(
    delta: number,
    localPlayer: SurvivorPlayer,
    remotePlayer: THREE.Vector3 | null = null,
    onPlayerDamaged?: (damage: number) => void
  ) {
    const now = performance.now() / 1000;

    // Ambient groans
    this.ambientGroanTimer -= delta;
    if (this.ambientGroanTimer <= 0) {
      this.ambientGroanTimer = 4 + Math.random() * 6;
      if (this.zombies.length > 0) {
        zombieAudio.playZombieGrowl(0.9 + Math.random() * 0.3);
      }
    }

    const localPos = localPlayer.group.position;
    const isLocalAlive = !localPlayer.stats.isDowned && localPlayer.stats.health > 0;

    // Update each zombie
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];

      // Remove dead zombies after 4.5s
      if (z.isDead) {
        if (z.deathTimer > 4.5) {
          this.scene.remove(z.group);
          this.zombies.splice(i, 1);
        }
        continue;
      }

      // Find nearest alive target
      let targetPos: THREE.Vector3 | null = null;
      let targetDist = Infinity;

      if (isLocalAlive) {
        targetPos = localPos;
        targetDist = z.group.position.distanceTo(localPos);
      }

      if (remotePlayer) {
        const distRemote = z.group.position.distanceTo(remotePlayer);
        if (!targetPos || distRemote < targetDist) {
          targetPos = remotePlayer;
          targetDist = distRemote;
        }
      }

      // Check obstacle collision for zombie movement (slide along walls)
      const prevX = z.group.position.x;
      const prevZ = z.group.position.z;

      z.update(delta, targetPos);

      // If collided with village wall/building, revert movement
      if (this.village.checkCollision(z.group.position.x, z.group.position.z, 0.45)) {
        // Try slide on X
        if (!this.village.checkCollision(z.group.position.x, prevZ, 0.45)) {
          z.group.position.z = prevZ;
        } else if (!this.village.checkCollision(prevX, z.group.position.z, 0.45)) {
          z.group.position.x = prevX;
        } else {
          z.group.position.x = prevX;
          z.group.position.z = prevZ;
        }
      }

      // Attack player if in range and ready
      if (targetPos && targetDist <= z.config.attackRange) {
        if (now - z.lastAttackTime > z.config.attackCooldown) {
          z.lastAttackTime = now;
          z.startAttack();

          // Damage local player if local player was the target
          if (targetPos === localPos && isLocalAlive && onPlayerDamaged) {
            onPlayerDamaged(z.config.damage);
          }
        }
      }
    }
  }

  public clearAll() {
    for (const z of this.zombies) {
      this.scene.remove(z.group);
    }
    this.zombies = [];
  }
}
