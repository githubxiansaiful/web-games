/**
 * DUO RAMPAGE - Enemy Entity & AI Controller
 * Manages Basic Melee Runners, Ranged Shooters, Tank Brutes, and "The Mutant" Boss.
 */

import * as THREE from 'three';
import { EnemyEntityState, EnemyType } from '../types';
import { DuoCartoonModelFactory, CharacterRig } from '../animation/DuoCartoonModelFactory';
import { DuoPlayerEntity } from './DuoPlayerEntity';

export class DuoEnemyEntity {
  public state: EnemyEntityState;
  public rig: CharacterRig;
  public group: THREE.Group;

  private attackTimer: number = 0;
  private shootCooldown: number = 0;
  private deathTimer: number = 0;

  // Callbacks
  public onEnemyShoot?: (origin: THREE.Vector3, dir: THREE.Vector3, damage: number) => void;
  public onEnemyMeleeHit?: (targetId: string, damage: number) => void;
  public onDeath?: (enemy: DuoEnemyEntity) => void;

  constructor(id: string, type: EnemyType, startX: number, startZ: number) {
    let health = 60;
    let speed = 6.5;
    let score = 100;

    if (type === 'basic') {
      health = 60;
      speed = 7.2;
      score = 100;
    } else if (type === 'shooter') {
      health = 90;
      speed = 4.8;
      score = 250;
    } else if (type === 'tank') {
      health = 320;
      speed = 3.2;
      score = 500;
    } else if (type === 'boss') {
      health = 1200;
      speed = 4.2;
      score = 2500;
    }

    this.state = {
      id,
      type,
      x: startX,
      y: 0,
      z: startZ,
      health,
      maxHealth: health,
      facing: -1,
      speed,
      isAttacking: false,
      attackCooldown: 0,
      isDead: false,
      scoreValue: score,
      bossPhase: type === 'boss' ? 1 : undefined,
    };

    this.rig = DuoCartoonModelFactory.createEnemyRig(type);
    this.group = this.rig.group;
    this.group.position.set(startX, 0, startZ);
  }

  public takeDamage(amount: number): boolean {
    if (this.state.isDead) return false;

    this.state.health -= amount;

    // Flash white on hit
    this.rig.group.position.y += 0.1;
    setTimeout(() => {
      this.rig.group.position.y = 0;
    }, 60);

    // Update Boss phase based on health
    if (this.state.type === 'boss') {
      const pct = this.state.health / this.state.maxHealth;
      if (pct <= 0.35) {
        this.state.bossPhase = 3; // Enraged
        this.state.speed = 6.0;
      } else if (pct <= 0.7) {
        this.state.bossPhase = 2; // Ranged barrage
      }
    }

    if (this.state.health <= 0) {
      this.state.isDead = true;
      this.deathTimer = 1.0;
      this.onDeath?.(this);
      return true;
    }

    return false;
  }

  public update(delta: number, time: number, players: DuoPlayerEntity[]) {
    // 1. If Dead, play death collapse and fade out
    if (this.state.isDead) {
      this.deathTimer -= delta;
      this.rig.updateAnimation('down', time, this.state.facing, 0);
      if (this.deathTimer <= 0) {
        this.group.visible = false;
      }
      return;
    }

    // 2. Find Nearest Alive Player
    let targetPlayer: DuoPlayerEntity | null = null;
    let minDist = Infinity;

    players.forEach((p) => {
      if (!p.stats.isDown) {
        const d = Math.hypot(p.stats.x - this.state.x, p.stats.z - this.state.z);
        if (d < minDist) {
          minDist = d;
          targetPlayer = p;
        }
      }
    });

    // If no players are standing (both down), idle
    if (!targetPlayer) {
      this.rig.updateAnimation('idle', time, this.state.facing, 0);
      return;
    }

    const tPlayer: DuoPlayerEntity = targetPlayer;
    const dx = tPlayer.stats.x - this.state.x;
    const dz = tPlayer.stats.z - this.state.z;
    const dist = Math.hypot(dx, dz);
    this.state.facing = dx >= 0 ? 1 : -1;

    // 3. AI Behaviors by Enemy Type
    if (this.state.type === 'shooter') {
      // Shooter keeps 10-14 distance
      if (dist < 9) {
        // Back up
        this.state.x -= Math.sign(dx) * this.state.speed * delta;
      } else if (dist > 15) {
        // Move closer
        this.state.x += Math.sign(dx) * this.state.speed * delta;
        this.state.z += Math.sign(dz) * this.state.speed * delta * 0.5;
      }

      // Shoot plasma projectile
      this.shootCooldown -= delta;
      if (this.shootCooldown <= 0 && dist <= 20) {
        this.shootCooldown = 2.4;
        const origin = new THREE.Vector3(this.state.x, 1.2, this.state.z);
        const dir = new THREE.Vector3(dx / dist, 0, dz / dist);
        this.onEnemyShoot?.(origin, dir, 18);
      }
    } else {
      // Melee Runners, Tanks, and Boss charge towards player
      const attackRange = this.state.type === 'boss' ? 2.8 : this.state.type === 'tank' ? 2.4 : 1.6;

      if (dist > attackRange) {
        // March towards target
        const nx = dx / dist;
        const nz = dz / dist;
        this.state.x += nx * this.state.speed * delta;
        this.state.z += nz * this.state.speed * delta;
        this.state.isAttacking = false;
        this.rig.updateAnimation('run', time, this.state.facing, 0);
      } else {
        // In melee strike range!
        this.state.isAttacking = true;
        this.attackTimer += delta;
        this.rig.updateAnimation('melee', time, this.state.facing, 0);

        const attackInterval = this.state.type === 'tank' ? 1.6 : this.state.type === 'boss' ? 1.2 : 0.9;
        if (this.attackTimer >= attackInterval) {
          this.attackTimer = 0;
          const damage = this.state.type === 'boss' ? 35 : this.state.type === 'tank' ? 28 : 14;
          this.onEnemyMeleeHit?.(tPlayer.stats.id, damage);
        }
      }
    }

    // Keep in street bounds
    this.state.x = THREE.MathUtils.clamp(this.state.x, -52, 52);
    this.state.z = THREE.MathUtils.clamp(this.state.z, -4.2, 4.2);
    this.group.position.set(this.state.x, 0, this.state.z);
  }
}
