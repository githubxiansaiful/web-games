import { CharacterRole } from '../Duo2DTypes';
import { TouchControlsState, PlayerStats, DuoComboState, WaveState } from '../../types';
import { DaytimeSkylineLayer } from '../world/DaytimeSkylineLayer';
import { UrbanMidgroundLayer } from '../world/UrbanMidgroundLayer';
import { PlatformManager } from '../world/PlatformManager';
import { PropsManager } from '../world/PropsManager';
import { ParticleEngine2D } from '../effects/ParticleEngine2D';
import { WeaponSystem2D } from '../combat/WeaponSystem2D';
import { WaveSystem2D } from '../combat/WaveSystem2D';
import { DuoCamera2D } from './DuoCamera2D';
import { PlayerCharacter2D } from '../characters/PlayerCharacter2D';
import { Enemy2D } from '../characters/Enemy2D';
import { duoAudio } from '../../audio/DuoAudioEngine';

export interface Duo2DCallbacks {
  onUpdateStats: (
    p1: PlayerStats,
    p2: PlayerStats,
    combo: DuoComboState,
    wave: WaveState,
    bossHp?: { current: number; max: number; name: string } | null,
    warningStayTogether?: boolean
  ) => void;
  onGameOver: (victory: boolean, stats: { score: number; kills: number; maxCombo: number; wave: number }) => void;
  onShootBroadcast?: (origin: { x: number; y: number }, dir: { x: number; y: number }, weapon: any) => void;
  onMeleeBroadcast?: (x: number, y: number) => void;
  onGrenadeBroadcast?: (x: number, y: number, facing: 1 | -1) => void;
  onReviveSuccessBroadcast?: () => void;
}

export class Duo2DGameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animFrameId: number | null = null;
  private lastTime: number = 0;
  private isDestroyed: boolean = false;

  // Systems
  public skylineLayer: DaytimeSkylineLayer;
  public midgroundLayer: UrbanMidgroundLayer;
  public platformMgr: PlatformManager;
  public propsMgr: PropsManager;
  public particles: ParticleEngine2D;
  public weapons: WeaponSystem2D;
  public waveSys: WaveSystem2D;
  public camera: DuoCamera2D;

  // Entities
  public player1: PlayerCharacter2D;
  public player2: PlayerCharacter2D;
  public enemies: Enemy2D[] = [];

  // Configuration
  public myRole: CharacterRole;
  public isSolo: boolean;
  public callbacks: Duo2DCallbacks;
  public localControls: TouchControlsState;

  // Co-op Synergy & Combo
  public isRampage: boolean = false;
  public comboCount: number = 0;
  public maxCombo: number = 0;
  public totalScore: number = 0;
  public totalKills: number = 0;
  public bossStats: { current: number; max: number; name: string } | null = null;

  // Revive channel timer
  private reviveTimer: number = 0;
  private shootCooldown: number = 0;

  constructor(
    container: HTMLElement,
    myRole: CharacterRole,
    isSolo: boolean,
    callbacks: Duo2DCallbacks
  ) {
    this.myRole = myRole;
    this.isSolo = isSolo;
    this.callbacks = callbacks;

    // Create Canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1920;
    this.canvas.height = 1080;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    this.canvas.style.objectFit = 'contain';
    container.innerHTML = '';
    container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d', { alpha: false })!;

    // Initialize Systems
    this.skylineLayer = new DaytimeSkylineLayer();
    this.midgroundLayer = new UrbanMidgroundLayer();
    this.platformMgr = new PlatformManager();
    this.propsMgr = new PropsManager();
    this.particles = new ParticleEngine2D();
    this.weapons = new WeaponSystem2D();
    this.waveSys = new WaveSystem2D();
    this.camera = new DuoCamera2D(1920, 1080);

    // Initialize Players
    this.player1 = new PlayerCharacter2D('p1', 'assault', 'Assault Hero', '/images/duo-rampage/player1.png', 480);
    this.player2 = new PlayerCharacter2D('p2', 'heavy', 'Heavy Heroine', '/images/duo-rampage/player2_hologram.png', 560);

    // Initial controls
    this.localControls = {
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
  }

  public start() {
    this.lastTime = performance.now();
    this.loop();
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private loop = () => {
    if (this.isDestroyed) return;

    const now = performance.now();
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    this.update(dt);
    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    // 1. Update Background Layers
    this.skylineLayer.update(dt);
    this.midgroundLayer.update(dt);
    this.particles.update(dt);

    // 2. Local Player Input Processing
    const localPlayer = this.myRole === 'assault' ? this.player1 : this.player2;
    const partner = this.myRole === 'assault' ? this.player2 : this.player1;

    // Solo Bot AI for partner if in solo mode
    if (this.isSolo) {
      this.updatePartnerBot(dt, partner, localPlayer);
    }

    const localInput = {
      moveX: this.localControls.moveX,
      moveY: this.localControls.moveZ, // W/S or joystick Y
      jump: this.localControls.moveZ < -0.6 || this.localControls.isDashing,
      dropDown: this.localControls.moveZ > 0.6,
      dash: this.localControls.isDashing,
      melee: this.localControls.isMelee,
      shoot: this.localControls.isShooting,
      revive: this.localControls.isReviving,
    };

    localPlayer.update(dt, localInput, this.platformMgr, this.particles);

    // 3. Player Shooting
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (localInput.shoot && this.shootCooldown <= 0 && !localPlayer.state.isDowned) {
      this.shootCooldown = 0.12;
      const muzzleX = localPlayer.state.x + (localPlayer.state.facing === 1 ? localPlayer.state.w + 10 : -10);
      const muzzleY = localPlayer.state.y + 32;
      const aimAngle = localPlayer.state.facing === 1 ? 0 : Math.PI;

      this.weapons.fireWeapon(
        localPlayer.state.weapon,
        muzzleX,
        muzzleY,
        localPlayer.state.facing,
        aimAngle,
        true,
        localPlayer.state.id,
        this.isRampage,
        this.particles
      );

      this.camera.addShake(localPlayer.state.weapon === 'shotgun' ? 5 : 2, 0.1);
      this.callbacks.onShootBroadcast?.(
        { x: muzzleX, y: muzzleY },
        { x: Math.cos(aimAngle), y: Math.sin(aimAngle) },
        localPlayer.state.weapon
      );
    }

    // 4. Player Grenade Throw
    if (this.localControls.isGrenade && !localPlayer.state.isDowned) {
      this.localControls.isGrenade = false;
      this.weapons.throwGrenade(
        localPlayer.state.x + localPlayer.state.w * 0.5,
        localPlayer.state.y + 20,
        localPlayer.state.facing,
        true
      );
      this.callbacks.onGrenadeBroadcast?.(localPlayer.state.x, localPlayer.state.y, localPlayer.state.facing);
    }

    // 5. Co-op Synergy ("Stay Together" 2x Rampage Boost)
    const playerDist = Math.hypot(this.player1.state.x - this.player2.state.x, this.player1.state.y - this.player2.state.y);
    const prevRampage = this.isRampage;
    this.isRampage = playerDist <= 280 && !this.player1.state.isDowned && !this.player2.state.isDowned;

    if (this.isRampage && !prevRampage) {
      duoAudio.playRampageMode();
      this.particles.spawnDamageText('RAMPAGE BOOST x2!', (this.player1.state.x + this.player2.state.x) * 0.5, this.player1.state.y - 40, '#f97316', true, 28);
    }

    // 6. Revive Interaction
    if (partner.state.isDowned && !localPlayer.state.isDowned && playerDist < 120 && localInput.revive) {
      this.reviveTimer += dt;
      partner.state.reviveProgress = Math.min(1, this.reviveTimer / 2.2);

      // Medical Energy Healing Particles
      this.particles.spawnHitSparks(partner.state.x + partner.state.w * 0.5, partner.state.y + 20, '#34d399', 3);

      if (this.reviveTimer >= 2.2) {
        partner.reviveSuccess();
        this.reviveTimer = 0;
        this.callbacks.onReviveSuccessBroadcast?.();
        this.particles.spawnDamageText('HERO REVIVED!', partner.state.x + partner.state.w * 0.5, partner.state.y - 30, '#34d399', true, 30);
      }
    } else {
      this.reviveTimer = 0;
      if (partner.state.isDowned) {
        partner.state.reviveProgress = 0;
      }
    }

    // Check Game Over (Both Downed)
    if (this.player1.state.isDowned && this.player2.state.isDowned) {
      this.callbacks.onGameOver(false, {
        score: this.totalScore,
        kills: this.totalKills,
        maxCombo: this.maxCombo,
        wave: this.waveSys.currentWave,
      });
      return;
    }

    // 7. Update Weapons & Grenade Detonations
    this.weapons.update(dt, this.particles, (gx, gy, radius, damage) => {
      this.camera.addShake(14, 0.35);
      // Damage enemies in blast radius
      for (const e of this.enemies) {
        const edist = Math.hypot(e.stats.x + e.stats.w * 0.5 - gx, e.stats.y + e.stats.h * 0.5 - gy);
        if (edist <= radius) {
          const falloff = 1 - edist / radius;
          const dmg = Math.round(damage * falloff);
          const res = e.takeDamage(dmg, gx < e.stats.x ? 1 : -1, this.particles);
          if (res.killed) {
            this.handleEnemyKilled(res.score);
          }
        }
      }

      // Damage props in blast radius
      for (const prop of this.propsMgr.props) {
        if (prop.isDestroyed) continue;
        const pdist = Math.hypot(prop.x + prop.w * 0.5 - gx, prop.y + prop.h * 0.5 - gy);
        if (pdist <= radius) {
          const res = this.propsMgr.damageProp(prop.id, damage);
          if (res.destroyed) {
            this.handlePropDestroyed(res.prop!);
          }
        }
      }
    });

    // 8. Bullet Collision against Enemies, Props, Barrels
    for (let bIdx = this.weapons.bullets.length - 1; bIdx >= 0; bIdx--) {
      const b = this.weapons.bullets[bIdx];

      // Bullet vs Enemies
      if (b.isPlayer) {
        let hit = false;
        for (const e of this.enemies) {
          if (
            b.x >= e.stats.x &&
            b.x <= e.stats.x + e.stats.w &&
            b.y >= e.stats.y &&
            b.y <= e.stats.y + e.stats.h
          ) {
            hit = true;
            const res = e.takeDamage(b.damage, b.vx > 0 ? 1 : -1, this.particles);
            this.weapons.bullets.splice(bIdx, 1);
            if (res.killed) {
              this.handleEnemyKilled(res.score);
            }
            break;
          }
        }

        if (hit) continue;

        // Bullet vs Destructible Props
        for (const prop of this.propsMgr.props) {
          if (prop.isDestroyed) continue;
          if (
            b.x >= prop.x &&
            b.x <= prop.x + prop.w &&
            b.y >= prop.y &&
            b.y <= prop.y + prop.h
          ) {
            hit = true;
            this.weapons.bullets.splice(bIdx, 1);
            const res = this.propsMgr.damageProp(prop.id, b.damage);
            this.particles.spawnHitSparks(b.x, b.y, '#f59e0b', 5);
            if (res.destroyed) {
              this.handlePropDestroyed(res.prop!);
            }
            break;
          }
        }
      } else {
        // Enemy bullet vs Players
        const p1 = this.player1.state;
        const p2 = this.player2.state;

        if (b.x >= p1.x && b.x <= p1.x + p1.w && b.y >= p1.y && b.y <= p1.y + p1.h) {
          this.player1.takeDamage(b.damage, this.particles);
          this.weapons.bullets.splice(bIdx, 1);
          this.camera.addShake(4, 0.15);
        } else if (b.x >= p2.x && b.x <= p2.x + p2.w && b.y >= p2.y && b.y <= p2.y + p2.h) {
          this.player2.takeDamage(b.damage, this.particles);
          this.weapons.bullets.splice(bIdx, 1);
          this.camera.addShake(4, 0.15);
        }
      }
    }

    // 9. Update Wave & Spawns
    const waveComplete = this.waveSys.update(dt, (newEnemy) => {
      this.enemies.push(newEnemy);
      if (newEnemy.stats.type === 'boss') {
        this.bossStats = { current: newEnemy.stats.health, max: newEnemy.stats.maxHealth, name: 'DHAKA TITAN MECH' };
        this.camera.addShake(18, 0.5);
      }
    });

    if (waveComplete) {
      if (this.waveSys.currentWave >= this.waveSys.totalWaves) {
        // Victory!
        this.callbacks.onGameOver(true, {
          score: this.totalScore + 5000,
          kills: this.totalKills,
          maxCombo: this.maxCombo,
          wave: this.waveSys.currentWave,
        });
        return;
      } else {
        this.waveSys.startWave(this.waveSys.currentWave + 1);
      }
    }

    // 10. Update Enemies
    const primaryTarget = !this.player1.state.isDowned ? this.player1.state : this.player2.state;
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const alive = e.update(
        dt,
        primaryTarget.x,
        primaryTarget.y,
        this.platformMgr,
        this.particles,
        (type, ex, ey, facing) => {
          // Enemy attacks
          if (type === 'drone') {
            // Drone fires plasma bolt
            this.weapons.bullets.push({
              id: 'eb_' + Math.random(),
              x: ex,
              y: ey,
              vx: facing * 600,
              vy: 0,
              damage: 18,
              isPlayer: false,
              color: '#ef4444',
              length: 16,
              thickness: 5,
              rangeRemaining: 1200,
            });
            duoAudio.playGunshot('pistol');
          } else if (type === 'boss') {
            // Boss fires twin heavy vulcan burst + shockwave
            this.weapons.bullets.push({
              id: 'bb_' + Math.random(),
              x: ex,
              y: ey - 10,
              vx: facing * 850,
              vy: (Math.random() - 0.5) * 80,
              damage: 25,
              isPlayer: false,
              color: '#dc2626',
              length: 26,
              thickness: 6,
              rangeRemaining: 1600,
            });
            this.camera.addShake(6, 0.2);
            duoAudio.playGunshot('shotgun');
          } else {
            // Melee swing
            const p1Dist = Math.hypot(this.player1.state.x - ex, this.player1.state.y - ey);
            if (p1Dist < 60) this.player1.takeDamage(22, this.particles);
            const p2Dist = Math.hypot(this.player2.state.x - ex, this.player2.state.y - ey);
            if (p2Dist < 60) this.player2.takeDamage(22, this.particles);
          }
        }
      );

      if (!alive) {
        this.enemies.splice(i, 1);
      }
    }

    // Update Boss Stats
    const boss = this.enemies.find((e) => e.stats.type === 'boss');
    if (boss) {
      this.bossStats = { current: boss.stats.health, max: boss.stats.maxHealth, name: 'DHAKA TITAN MECH' };
    } else if (this.bossStats) {
      this.bossStats = null;
    }

    // 11. Update Camera
    this.camera.update(
      dt,
      this.player1.state.x,
      this.player1.state.y,
      this.player2.state.x,
      this.player2.state.y,
      this.platformMgr.worldWidth,
      this.platformMgr.worldHeight
    );

    // 12. Send HUD Callbacks
    this.callbacks.onUpdateStats(
      this.toPlayerStats(this.player1.state),
      this.toPlayerStats(this.player2.state),
      {
        count: this.comboCount,
        multiplier: this.isRampage ? 2.0 : 1.0,
        timer: 5,
        maxTimer: 5,
        isRampage: this.isRampage,
        rampageTimer: 10,
        rampageMaxTimer: 10,
      },
      {
        currentWave: this.waveSys.currentWave,
        totalWaves: this.waveSys.totalWaves,
        enemiesRemaining: this.waveSys.enemiesRemaining,
        status: 'in_progress',
        countdown: 0,
        waveAnnounceText: this.waveSys.waveAnnounceTimer > 0 ? this.waveSys.waveAnnounceText : '',
      },
      this.bossStats,
      playerDist > 400
    );
  }

  private handleEnemyKilled(score: number) {
    this.totalKills++;
    this.comboCount++;
    this.maxCombo = Math.max(this.maxCombo, this.comboCount);
    const points = score * (this.isRampage ? 2 : 1);
    this.totalScore += points;
    this.waveSys.onEnemyKilled();
  }

  private handlePropDestroyed(prop: any) {
    if (prop.type === 'barrel') {
      // Barrel detonation
      this.particles.spawnExplosion(prop.x + prop.w * 0.5, prop.y + prop.h * 0.5, 220);
      duoAudio.playExplosion();
      this.camera.addShake(16, 0.4);

      // Damage nearby enemies
      for (const e of this.enemies) {
        const d = Math.hypot(e.stats.x + e.stats.w * 0.5 - prop.x, e.stats.y + e.stats.h * 0.5 - prop.y);
        if (d <= 220) {
          const res = e.takeDamage(240, 1, this.particles);
          if (res.killed) this.handleEnemyKilled(res.score);
        }
      }
    } else {
      // Crate breaks into wood splinters
      this.particles.spawnHitSparks(prop.x + prop.w * 0.5, prop.y + prop.h * 0.5, '#b45309', 14);
      duoAudio.playUiClick();
    }
  }

  private updatePartnerBot(dt: number, bot: PlayerCharacter2D, leader: PlayerCharacter2D) {
    const distToLeader = Math.hypot(leader.state.x - bot.state.x, leader.state.y - bot.state.y);
    let moveX = 0;
    let jump = false;

    if (distToLeader > 160) {
      moveX = leader.state.x > bot.state.x ? 1 : -1;
    }

    if (leader.state.y < bot.state.y - 60 && bot.state.isGrounded) {
      jump = true;
    }

    bot.update(
      dt,
      {
        moveX,
        moveY: 0,
        jump,
        dropDown: false,
        dash: false,
        melee: false,
        shoot: false,
        revive: leader.state.isDowned && distToLeader < 100,
      },
      this.platformMgr,
      this.particles
    );

    // Bot shoots nearest enemy
    if (this.enemies.length > 0 && Math.random() < 0.05) {
      const nearest = this.enemies[0];
      bot.state.facing = nearest.stats.x > bot.state.x ? 1 : -1;
      this.weapons.fireWeapon(
        bot.state.weapon,
        bot.state.x + (bot.state.facing === 1 ? bot.state.w : 0),
        bot.state.y + 30,
        bot.state.facing,
        bot.state.facing === 1 ? 0 : Math.PI,
        true,
        bot.state.id,
        this.isRampage,
        this.particles
      );
    }
  }

  private render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cam = this.camera;
    const { sx, sy } = cam.getShakeOffset();

    // 1. LAYER 1: Far Dhaka Skyline (Daytime Sky, Clouds, Bridges)
    this.skylineLayer.render(ctx, w, h, cam.x + sx);

    // 2. LAYER 2: Urban Midground (Elevated Expressway, Buildings, Billboards)
    this.midgroundLayer.render(ctx, w, h, cam.x + sx);

    // 3. LAYER 3: Gameplay Platforms, Ladders, Props, Characters & FX
    ctx.save();
    ctx.translate(-cam.x + sx, -cam.y + sy);

    // Platforms & Ladders
    this.platformMgr.render(ctx, cam.x, cam.y);

    // Props (Crates, Barrels, Barriers, Vehicles)
    this.propsMgr.render(ctx);

    // Co-op "Stay Together" Plasma Energy Tether (When Rampage is active)
    if (this.isRampage) {
      this.drawCoopTether(ctx);
    }

    // Revive Channel Beam
    if (this.player1.state.isDowned || this.player2.state.isDowned) {
      this.drawReviveBeam(ctx);
    }

    // Enemies
    for (const e of this.enemies) {
      e.render(ctx);
    }

    // Players
    this.player1.render(ctx, this.myRole === 'assault', this.isRampage);
    this.player2.render(ctx, this.myRole === 'heavy', this.isRampage);

    // Bullets & Grenades
    this.weapons.render(ctx);

    // Particles & Damage Numbers
    this.particles.render(ctx);

    ctx.restore();
  }

  private drawCoopTether(ctx: CanvasRenderingContext2D) {
    const p1 = this.player1.state;
    const p2 = this.player2.state;
    const p1Center = { x: p1.x + p1.w * 0.5, y: p1.y + 35 };
    const p2Center = { x: p2.x + p2.w * 0.5, y: p2.y + 35 };

    ctx.save();
    ctx.strokeStyle = '#f97316'; // Flaming orange
    ctx.lineWidth = 6;
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(p1Center.x, p1Center.y);
    ctx.lineTo(p2Center.x, p2Center.y);
    ctx.stroke();

    // White core lightning
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p1Center.x, p1Center.y);
    ctx.lineTo(p2Center.x, p2Center.y);
    ctx.stroke();
    ctx.restore();
  }

  private drawReviveBeam(ctx: CanvasRenderingContext2D) {
    const downed = this.player1.state.isDowned ? this.player1.state : this.player2.state;
    const reviver = this.player1.state.isDowned ? this.player2.state : this.player1.state;

    if (downed.reviveProgress > 0) {
      ctx.save();
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 5;
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(reviver.x + reviver.w * 0.5, reviver.y + 30);
      ctx.lineTo(downed.x + downed.w * 0.5, downed.y + 30);
      ctx.stroke();

      // Revive Progress Ring above downed player
      const rx = downed.x + downed.w * 0.5;
      const ry = downed.y - 18;
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(rx, ry, 16, -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * 2 * downed.reviveProgress);
      ctx.stroke();
      ctx.restore();
    }
  }

  private toPlayerStats(s: any): PlayerStats {
    return {
      id: s.id,
      name: s.name,
      role: s.role,
      avatar: s.avatar || null,
      isHost: s.id === 'p1',
      isReady: true,
      health: s.health,
      maxHealth: s.maxHealth,
      isDown: s.isDowned,
      downTimer: 10,
      isReviving: s.reviveProgress > 0,
      reviveProgress: s.reviveProgress,
      weapon: s.weapon === 'minigun' ? 'rifle' : s.weapon,
      ammo: s.ammo,
      maxAmmo: s.maxAmmo,
      isReloading: false,
      reloadProgress: 0,
      specialCooldown: 0,
      specialMaxCooldown: 10,
      dashCooldown: 0,
      score: s.score,
      kills: s.kills,
      x: s.x,
      y: 0,
      z: s.y, // 2D Y maps to Z for existing HUD compatibility
      facing: s.facing,
      animState: s.isDowned ? 'down' : s.animState === 'melee' ? 'melee' : s.animState === 'dash' ? 'dash' : s.animState === 'run' ? 'run' : s.animState === 'shoot' ? 'shoot' : 'idle',
    };
  }
}
