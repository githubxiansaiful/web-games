/**
 * DUO RAMPAGE - Master 3D WebGL Game Engine
 * 2.5D Side-scrolling action brawler with dynamic dual-player auto-zooming camera,
 * 60 FPS Three.js rendering, Abandoned City environment, procedural cartoon characters,
 * combat system, particle effects, and sound orchestration.
 */

import * as THREE from 'three';
import { PlayerRole, TouchControlsState, WaveState, DuoComboState, DamageNumber } from './types';
import { AbandonedCityEnvironment } from './world/AbandonedCityEnvironment';
import { DuoParticleSystem } from './systems/DuoParticleSystem';
import { DuoComboSystem } from './systems/DuoComboSystem';
import { DuoCombatSystem } from './systems/DuoCombatSystem';
import { DuoWaveSystem } from './systems/DuoWaveSystem';
import { DuoPlayerEntity } from './entities/DuoPlayerEntity';
import { DuoEnemyEntity } from './entities/DuoEnemyEntity';
import { DuoPickupSystem } from './systems/DuoPickupSystem';
import { duoAudio } from './audio/DuoAudioEngine';

export interface EngineCallbacks {
  onUpdateStats?: (
    p1Stats: any,
    p2Stats: any,
    combo: DuoComboState,
    wave: WaveState,
    damageNumbers: DamageNumber[],
    warningStayTogether: boolean
  ) => void;
  onGameOver?: (victory: boolean, stats: { score: number; kills: number; maxCombo: number; wave: number }) => void;
  onShootBroadcast?: (origin: THREE.Vector3, dir: THREE.Vector3, weapon: any) => void;
  onReviveSuccessBroadcast?: () => void;
}

export class DuoRampageEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private isRunning: boolean = false;
  private animFrameId: number | null = null;
  private clock: THREE.Clock;

  // Subsystems
  public environment: AbandonedCityEnvironment;
  public particleSystem: DuoParticleSystem;
  public comboSystem: DuoComboSystem;
  public combatSystem: DuoCombatSystem;
  public waveSystem: DuoWaveSystem;
  public pickupSystem: DuoPickupSystem;

  // Players & Enemies
  public player1: DuoPlayerEntity;
  public player2: DuoPlayerEntity;
  public enemies: DuoEnemyEntity[] = [];

  // Local Controls State
  public localControls: TouchControlsState = {
    moveX: 0,
    moveZ: 0,
    isShooting: false,
    isReloading: false,
    isDashing: false,
    isMelee: false,
    isGrenade: false,
    isSpecial: false,
    isReviving: false,
  };

  // State Tracking
  public isSoloMode: boolean = false;
  public myRole: PlayerRole = 'assault';
  public totalScore: number = 0;
  public totalKills: number = 0;
  public maxComboReached: number = 0;
  private callbacks: EngineCallbacks;

  constructor(
    container: HTMLElement,
    role: PlayerRole = 'assault',
    isSolo: boolean = true,
    callbacks: EngineCallbacks = {}
  ) {
    this.container = container;
    this.myRole = role;
    this.isSoloMode = isSolo;
    this.callbacks = callbacks;
    this.clock = new THREE.Clock();

    // 1. Initialize Scene & 2.5D Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0e1a); // Deep modern cartoon night
    this.scene.fog = new THREE.FogExp2(0x0a0e1a, 0.015);

    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 150);
    this.camera.position.set(0, 7.5, 18);
    this.camera.lookAt(0, 1.5, 0);

    // 2. Initialize WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 3. Dynamic Lighting (High contrast cartoon style)
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1e1b4b, 1.2);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 2.0);
    dirLight.position.set(15, 25, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 60;
    dirLight.shadow.camera.left = -25;
    dirLight.shadow.camera.right = 25;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    this.scene.add(dirLight);

    // 4. Subsystem Instantiation
    this.environment = new AbandonedCityEnvironment();
    this.scene.add(this.environment.group);

    this.particleSystem = new DuoParticleSystem();
    this.scene.add(this.particleSystem.group);

    this.comboSystem = new DuoComboSystem({
      onRampageActivated: () => {
        this.particleSystem.triggerScreenShake(0.8);
      },
    });

    this.combatSystem = new DuoCombatSystem(
      this.particleSystem,
      this.comboSystem,
      this.environment
    );
    this.scene.add(this.combatSystem.group);
    this.waveSystem = new DuoWaveSystem();

    this.pickupSystem = new DuoPickupSystem(this.particleSystem);
    this.scene.add(this.pickupSystem.group);

    // 5. Initialize Players (Player 1 Assault & Player 2 Heavy)
    this.player1 = new DuoPlayerEntity('p1', 'Player 1 (Assault)', 'assault', true, -3, 0);
    this.scene.add(this.player1.group);

    this.player2 = new DuoPlayerEntity('p2', 'Player 2 (Heavy)', 'heavy', false, 3, 0);
    this.scene.add(this.player2.group);

    // Hook up shooting callbacks
    this.player1.onShoot = (origin, dir, weapon) => {
      this.combatSystem.firePlayerWeapon('p1', origin, dir, weapon, this.comboSystem.state.isRampage);
      if (!this.isSoloMode && this.myRole === 'assault') {
        this.callbacks.onShootBroadcast?.(origin, dir, weapon);
      }
    };
    this.player2.onShoot = (origin, dir, weapon) => {
      this.combatSystem.firePlayerWeapon('p2', origin, dir, weapon, this.comboSystem.state.isRampage);
      if (!this.isSoloMode && this.myRole === 'heavy') {
        this.callbacks.onShootBroadcast?.(origin, dir, weapon);
      }
    };

    // Hook up Melee
    this.player1.onMelee = (hitbox) => this.handleMeleeStrike(hitbox);
    this.player2.onMelee = (hitbox) => this.handleMeleeStrike(hitbox);

    // Hook up Special Abilities
    this.player1.onSpecialAbility = (role, pos) => this.handleSpecialAbility(role, pos);
    this.player2.onSpecialAbility = (role, pos) => this.handleSpecialAbility(role, pos);

    // Hook up Wave System
    this.waveSystem.onSpawnEnemy = (type, x, z) => {
      this.spawnEnemy(type, x, z);
    };
    this.waveSystem.onVictory = () => {
      this.handleGameOver(true);
    };

    // Handle Window Resizing
    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public spawnEnemy(type: any, x: number, z: number) {
    const id = 'enemy_' + Math.random().toString(36).substring(2, 9);
    const enemy = new DuoEnemyEntity(id, type, x, z);

    enemy.onEnemyShoot = (origin, dir, damage) => {
      this.combatSystem.fireEnemyProjectile(origin, dir, damage);
    };

    enemy.onEnemyMeleeHit = (targetId, damage) => {
      const target = targetId === 'p1' ? this.player1 : this.player2;
      target.takeDamage(damage);
      this.particleSystem.triggerScreenShake(0.2);
    };

    enemy.onDeath = (e) => {
      this.totalKills++;
      this.waveSystem.onEnemyKilled();

      // Chance to spawn ground supply pickup upon death
      const dropRoll = Math.random();
      if (e.state.type === 'boss' || e.state.type === 'tank') {
        this.pickupSystem.spawnPickup(dropRoll > 0.5 ? 'weapon_shotgun' : 'ammo', e.state.x, e.state.z);
      } else if (dropRoll < 0.3) {
        this.pickupSystem.spawnPickup(dropRoll < 0.15 ? 'health' : 'ammo', e.state.x, e.state.z);
      }

      setTimeout(() => {
        const idx = this.enemies.indexOf(e);
        if (idx !== -1) {
          this.scene.remove(e.group);
          this.enemies.splice(idx, 1);
        }
      }, 1200);
    };

    this.enemies.push(enemy);
    this.scene.add(enemy.group);
  }

  private handleMeleeStrike(hitbox: { x: number; z: number; radius: number; damage: number }) {
    this.particleSystem.spawnHitSparks(hitbox.x, 1.0, hitbox.z, 0x38bdf8);
    this.particleSystem.triggerScreenShake(0.35);

    this.enemies.forEach((enemy) => {
      if (enemy.state.isDead) return;
      const d = Math.hypot(enemy.state.x - hitbox.x, enemy.state.z - hitbox.z);
      if (d <= hitbox.radius) {
        const died = enemy.takeDamage(hitbox.damage);
        const comboInfo = this.comboSystem.registerHit();
        this.particleSystem.addDamageNumber(`${hitbox.damage} MELEE!`, enemy.state.x, 1.5, enemy.state.z, true);
        if (died) {
          this.totalScore += enemy.state.scoreValue * comboInfo.multiplier;
        }
      }
    });
  }

  private handleSpecialAbility(role: PlayerRole, pos: { x: number; z: number; facing: number }) {
    if (role === 'assault') {
      // Tactical Cluster Strike: 4 sequential explosions carpeting forward
      duoAudio.playExplosion();
      this.particleSystem.triggerScreenShake(0.8);
      for (let i = 1; i <= 4; i++) {
        setTimeout(() => {
          if (!this.isRunning) return;
          const targetX = pos.x + pos.facing * (i * 4.5);
          const targetZ = pos.z + (Math.random() - 0.5) * 2.5;
          this.particleSystem.spawnExplosion(targetX, 0.5, targetZ, 1.4);
          duoAudio.playExplosion();

          // Damage enemies in radius
          this.enemies.forEach((enemy) => {
            if (enemy.state.isDead) return;
            const d = Math.hypot(enemy.state.x - targetX, enemy.state.z - targetZ);
            if (d <= 4.5) {
              const dmg = 120;
              const died = enemy.takeDamage(dmg);
              const comboInfo = this.comboSystem.registerHit();
              this.particleSystem.addDamageNumber(`${dmg} AIRSTRIKE!`, enemy.state.x, 1.6, enemy.state.z, true);
              if (died) this.totalScore += enemy.state.scoreValue * comboInfo.multiplier;
            }
          });
        }, i * 150);
      }
    } else {
      // Titan Shockwave Slam
      duoAudio.playExplosion();
      this.particleSystem.spawnExplosion(pos.x, 0.5, pos.z, 2.2);
      this.particleSystem.triggerScreenShake(1.2);

      // Expanding Shockwave knockback
      this.enemies.forEach((enemy) => {
        if (enemy.state.isDead) return;
        const d = Math.hypot(enemy.state.x - pos.x, enemy.state.z - pos.z);
        if (d <= 7.5) {
          const dmg = 175;
          const died = enemy.takeDamage(dmg);
          // Knockback
          enemy.state.x += Math.sign(enemy.state.x - pos.x) * 4.0;
          const comboInfo = this.comboSystem.registerHit();
          this.particleSystem.addDamageNumber(`${dmg} SLAM!`, enemy.state.x, 1.8, enemy.state.z, true);
          if (died) this.totalScore += enemy.state.scoreValue * comboInfo.multiplier;
        }
      });
    }
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this.loop();
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private loop = () => {
    if (!this.isRunning) return;
    this.animFrameId = requestAnimationFrame(this.loop);

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.getElapsedTime();

    this.update(delta, time);
    this.render();
  };

  private update(delta: number, time: number) {
    const isRampage = this.comboSystem.state.isRampage;

    // 1. Update Controlled Player
    const activePlayer = this.myRole === 'assault' ? this.player1 : this.player2;
    const teammatePlayer = this.myRole === 'assault' ? this.player2 : this.player1;

    // Handle Reviving Check
    const distBetweenPlayers = Math.hypot(
      this.player1.stats.x - this.player2.stats.x,
      this.player1.stats.z - this.player2.stats.z
    );

    if (activePlayer.stats.isDown && !teammatePlayer.stats.isDown) {
      // Local player is down
    } else if (!activePlayer.stats.isDown && teammatePlayer.stats.isDown) {
      // Teammate is down: Can we revive them?
      if (distBetweenPlayers <= 3.2 && this.localControls.isReviving) {
        teammatePlayer.startReviving();
        this.particleSystem.spawnReviveAura(teammatePlayer.stats.x, teammatePlayer.stats.z);
      } else {
        teammatePlayer.cancelReviving();
      }
    }

    activePlayer.update(delta, time, this.localControls, isRampage);

    // 2. Solo Companion Bot AI (if Solo Mode active)
    if (this.isSoloMode) {
      this.updateBotTeammate(teammatePlayer, delta, time, isRampage);
    }

    // Check If Both Players are Down => Defeat!
    if (this.player1.stats.isDown && this.player2.stats.isDown) {
      this.handleGameOver(false);
      return;
    }

    // 3. Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      this.enemies[i].update(delta, time, [this.player1, this.player2]);
    }

    // 4. Update Combat & Bullets
    this.combatSystem.update(delta, this.enemies, [this.player1, this.player2], (pts) => {
      this.totalScore += pts;
    });

    // 5. Update Combo & Wave
    this.comboSystem.update(delta);
    if (this.comboSystem.state.count > this.maxComboReached) {
      this.maxComboReached = this.comboSystem.state.count;
    }

    const avgPlayerX = (this.player1.stats.x + this.player2.stats.x) / 2;
    this.waveSystem.update(delta, avgPlayerX);

    // 6. Update Environment & Particles & Pickups
    this.environment.update(delta, time);
    this.particleSystem.update(delta);
    this.pickupSystem.update(delta, time, [this.player1, this.player2]);

    // 7. Dynamic Camera Following & Auto-Zoom
    this.updateCamera(delta, avgPlayerX, distBetweenPlayers);

    // 8. Warning: STAY TOGETHER if players drift > 18 units apart
    const warningStayTogether = distBetweenPlayers > 18;

    // 9. Dispatch UI Stats Update
    this.callbacks.onUpdateStats?.(
      this.player1.stats,
      this.player2.stats,
      this.comboSystem.state,
      this.waveSystem.state,
      this.particleSystem.damageNumbers,
      warningStayTogether
    );
  }

  private updateBotTeammate(
    bot: DuoPlayerEntity,
    delta: number,
    time: number,
    isRampage: boolean
  ) {
    const userPlayer = this.myRole === 'assault' ? this.player1 : this.player2;

    const botControls: TouchControlsState = {
      moveX: 0,
      moveZ: 0,
      isShooting: false,
      isReloading: false,
      isDashing: false,
      isMelee: false,
      isGrenade: false,
      isSpecial: false,
      isReviving: false,
    };

    if (userPlayer.stats.isDown && !bot.stats.isDown) {
      // Rush to revive downed user!
      const dx = userPlayer.stats.x - bot.stats.x;
      const dz = userPlayer.stats.z - bot.stats.z;
      const d = Math.hypot(dx, dz);
      if (d > 2.0) {
        botControls.moveX = dx / d;
        botControls.moveZ = dz / d;
      } else {
        botControls.isReviving = true;
        userPlayer.startReviving();
        this.particleSystem.spawnReviveAura(userPlayer.stats.x, userPlayer.stats.z);
      }
    } else {
      // Follow player and shoot nearest enemies
      const dxToUser = userPlayer.stats.x - bot.stats.x;
      if (Math.abs(dxToUser) > 5) {
        botControls.moveX = Math.sign(dxToUser);
      }

      // Find enemy to target
      let nearestEnemy: DuoEnemyEntity | null = null;
      let minD = 22;
      this.enemies.forEach((e) => {
        if (!e.state.isDead) {
          const d = Math.hypot(e.state.x - bot.stats.x, e.state.z - bot.stats.z);
          if (d < minD) {
            minD = d;
            nearestEnemy = e;
          }
        }
      });

      if (nearestEnemy) {
        const ne: DuoEnemyEntity = nearestEnemy;
        const eX = ne.state.x - bot.stats.x;
        bot.stats.facing = eX >= 0 ? 1 : -1;
        botControls.isShooting = true;
      }
    }

    bot.update(delta, time, botControls, isRampage);
  }

  private updateCamera(delta: number, avgX: number, playerDist: number) {
    // Dynamic Camera Zoom based on dual player separation
    // Normal distance ~ 6 -> camZ = 18, Apart ~ 20 -> camZ = 25
    const targetZ = THREE.MathUtils.clamp(16 + playerDist * 0.45, 16, 26);
    const targetY = THREE.MathUtils.clamp(6.5 + playerDist * 0.15, 6.5, 10);
    const targetX = avgX;

    // Smooth lerp
    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetX, 0.1);
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetY, 0.08);
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetZ, 0.08);

    // Apply Screen Shake
    if (this.particleSystem.screenShakeIntensity > 0) {
      const shake = this.particleSystem.screenShakeIntensity * 0.4;
      this.camera.position.x += (Math.random() - 0.5) * shake;
      this.camera.position.y += (Math.random() - 0.5) * shake;
    }

    this.camera.lookAt(this.camera.position.x, 1.2, 0);
  }

  private handleGameOver(victory: boolean) {
    this.stop();
    this.callbacks.onGameOver?.(victory, {
      score: this.totalScore,
      kills: this.totalKills,
      maxCombo: this.maxComboReached,
      wave: this.waveSystem.state.currentWave,
    });
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  public destroy() {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    if (this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
