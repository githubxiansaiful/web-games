/**
 * DUO RAMPAGE: DHAKA PARKOUR - 2D Canvas Engine & Visual Experience
 * Commercial-Grade Anime-Inspired Cinematic Platformer
 *
 * Implements:
 * - 7-Layer Parallax Background & Foreground (Sky, Clouds, Megacity, Midground, Near-Midground, World, Foreground 2.5D, Screen Effects)
 * - Golden Hour / Sunset Volumetric Lighting & Atmospheric Haze
 * - Authentic Dhaka Rooftop Architecture & Props (Gazi/Sintex water tanks, AC compressors with spinning fans,
 *   swaying colorful clotheslines, satellite dishes, antennas, puddles with sky reflections, tin sheds, Bengali neon signs)
 * - 3D Rotating Gold Coins & Celestial Secret Emblem
 * - Non-Intrusive Contextual Holographic Movement Glyphs
 * - Cinematic Responsive Camera with Dynamic Sprint/Dash Zoom, Micro-Shake on Hard Landing, and Dual-Player Framing
 * - 2D High-Definition Anime Runner Sprites with dynamic rim lighting and ghost motion trails
 * - 3 Strategic Checkpoints with instant respawn
 * - Finish Gate with sweeping searchlights & fireworks
 */

import { ParkourRunner2D, ParkourInput, PlatformRect, ParkourVfxType } from '../character/ParkourRunner2D';
import { ParkourCamera2D } from './ParkourCamera2D';
import {
  buildLevel01RooftopIntro,
  DhakaParkourLevelData,
  LevelCollectible,
  LevelCheckpoint,
} from '../levels/Level01RooftopIntro';
import { duoAudio } from '../../audio/DuoAudioEngine';
import { parkourAnimator } from '../character/ParkourSpriteAnimator';
import { getCharacterDef } from '../character/ParkourCharacters';
import { parkourRenderer, AtmosphericDustMote } from '../render/ParkourCinematicRenderer';

export interface ParkourEngineCallbacks {
  onUpdateTelemetry: (data: {
    speedKmh: number;
    state: string;
    coyoteRemaining: number;
    jumpBufferRemaining: number;
    canDoubleJump: boolean;
    x: number;
    y: number;
    coins: number;
    totalCoins: number;
    timer: number;
    targetSeconds: number;
    checkpointIndex: number;
    totalCheckpoints: number;
    secretEmblem: boolean;
    bannerNotification: string | null;
  }) => void;
  onLevelComplete: (stats: {
    timeSeconds: number;
    coins: number;
    totalCoins: number;
    stars: number;
    secretEmblem: boolean;
    targetSeconds: number;
  }) => void;
  onExit: () => void;
}

export interface ParkourEngineOptions {
  isMultiplayer?: boolean;
  myRole?: 'assault' | 'heavy';
  localPlayerName?: string;
  partnerPlayerName?: string;
  localCharacterId?: string;
  partnerCharacterId?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export class Parkour2DGameEngine {
  private container: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animFrameId: number | null = null;
  private lastTime: number = 0;
  private isDestroyed: boolean = false;
  private resizeObserver: ResizeObserver | null = null;

  // Level & World State
  public levelData: DhakaParkourLevelData;
  public runner: ParkourRunner2D;
  public partnerRunner: ParkourRunner2D | null = null;
  public isMultiplayer: boolean = false;
  public myRole: 'assault' | 'heavy' = 'assault';
  public localPlayerName: string = 'RAMPAGE#001';
  public partnerPlayerName: string = 'PARTNER';
  public localCharacterId: string = 'char_1';
  public partnerCharacterId: string = 'char_2';
  public camera: ParkourCamera2D;
  public particles: Particle[] = [];

  public levelTimer: number = 0;
  public coinsCollected: number = 0;
  public secretEmblemFound: boolean = false;
  public activeCheckpoint: LevelCheckpoint | null = null;
  public isLevelFinished: boolean = false;
  public bannerNotification: string | null = null;
  private bannerTimer: number = 0;

  // Local Controls Input
  public localInput: ParkourInput = {
    moveX: 0,
    moveY: 0,
    jumpPressed: false,
    jumpHeld: false,
    sprintHeld: false,
    slidePressed: false,
    resetPressed: false,
  };

  private callbacks: ParkourEngineCallbacks;

  // Visual Atmosphere Dust motes
  private dustMotes: AtmosphericDustMote[] = [];

  constructor(
    container: HTMLDivElement,
    callbacks: ParkourEngineCallbacks,
    options?: ParkourEngineOptions
  ) {
    this.container = container;
    this.callbacks = callbacks;

    if (options) {
      this.isMultiplayer = !!options.isMultiplayer;
      if (options.myRole) this.myRole = options.myRole;
      if (options.localPlayerName) this.localPlayerName = options.localPlayerName;
      if (options.partnerPlayerName) this.partnerPlayerName = options.partnerPlayerName;
      if (options.localCharacterId) this.localCharacterId = options.localCharacterId;
      if (options.partnerCharacterId) this.partnerCharacterId = options.partnerCharacterId;
    }

    // Preload character animations
    parkourAnimator.preloadCharacter(this.localCharacterId);
    if (this.isMultiplayer) {
      parkourAnimator.preloadCharacter(this.partnerCharacterId);
    }

    // 1. Setup Canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'block';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.position = 'absolute';
    this.canvas.style.inset = '0';
    this.container.innerHTML = '';
    this.container.appendChild(this.canvas);

    const ctx = this.canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Could not acquire 2D context');
    this.ctx = ctx;

    // 2. Load Level 01 Rooftop Introduction
    this.levelData = buildLevel01RooftopIntro();
    this.runner = new ParkourRunner2D(this.levelData.spawnPoint.x, this.levelData.spawnPoint.y);
    this.camera = new ParkourCamera2D(1280, 720);

    // Initialize atmospheric sunset dust motes & golden embers
    for (let i = 0; i < 48; i++) {
      this.dustMotes.push({
        x: Math.random() * 2000,
        y: Math.random() * 1000,
        size: 1.5 + Math.random() * 2.5,
        speed: 18 + Math.random() * 28,
        alpha: 0.25 + Math.random() * 0.55,
        wobbleSpeed: 1.5 + Math.random() * 2.5,
      });
    }

    // 3. Setup Responsive Canvas Sizing
    this.resize();
    window.addEventListener('resize', this.resize);
    window.addEventListener('orientationchange', this.resize);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.container);
    }
  }

  private resize = () => {
    if (!this.container || this.isDestroyed) return;
    const rect = this.container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2.0);

    let viewWidth = Math.round(rect.width * dpr);
    let viewHeight = Math.round(rect.height * dpr);

    if (viewWidth <= 0 || viewHeight <= 0) {
      viewWidth = 1280;
      viewHeight = 720;
    }

    // Lock standard 16:9 or ultra-wide aspect floor
    const aspect = viewWidth / viewHeight;
    if (viewWidth > 2200) {
      viewWidth = 2200;
      viewHeight = Math.round(viewWidth / aspect);
    }
    if (viewHeight > 1200) {
      viewHeight = 1200;
      viewWidth = Math.round(viewHeight * aspect);
    }

    if (this.canvas.width !== viewWidth || this.canvas.height !== viewHeight) {
      this.canvas.width = viewWidth;
      this.canvas.height = viewHeight;
    }
    this.camera.setViewport(viewWidth, viewHeight);
  };

  public start() {
    this.lastTime = performance.now();
    this.loop();
  }

  public restartLevel() {
    this.levelData = buildLevel01RooftopIntro();
    this.runner.reset();
    this.runner.x = this.levelData.spawnPoint.x;
    this.runner.y = this.levelData.spawnPoint.y;
    this.levelTimer = 0;
    this.coinsCollected = 0;
    this.secretEmblemFound = false;
    this.activeCheckpoint = null;
    this.isLevelFinished = false;
    this.bannerNotification = 'RUNNER DISPATCHED';
    this.bannerTimer = 2.0;
  }

  public updateRemotePlayer(state: any) {
    if (!state) return;
    if (!this.partnerRunner) {
      this.partnerRunner = new ParkourRunner2D(
        state.x ?? this.levelData.spawnPoint.x,
        state.y ?? this.levelData.spawnPoint.y
      );
    }
    const pr = this.partnerRunner;

    if (state.x !== undefined && state.y !== undefined) {
      const dx = state.x - pr.x;
      const dy = state.y - pr.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 300) {
        pr.x = state.x;
        pr.y = state.y;
      } else {
        pr.x += dx * 0.55;
        pr.y += dy * 0.55;
      }
    }

    if (state.vx !== undefined) pr.vx = state.vx;
    if (state.vy !== undefined) pr.vy = state.vy;
    if (state.facing !== undefined) pr.facing = state.facing;
    if (state.isSliding !== undefined) pr.isSliding = !!state.isSliding;
    if (state.isClimbing !== undefined) pr.isClimbing = !!state.isClimbing;
    if (state.isLedgeGrabbing !== undefined) pr.isLedgeGrabbing = !!state.isLedgeGrabbing;
    if (state.isWallSliding !== undefined) pr.isWallSliding = !!state.isWallSliding;
    if (state.isVaulting !== undefined) pr.isVaulting = !!state.isVaulting;
    if (state.hasDoubleJumped !== undefined) pr.hasDoubleJumped = !!state.hasDoubleJumped;
    if (state.currentHeight !== undefined) pr.currentHeight = state.currentHeight;

    if (state.characterId && state.characterId !== this.partnerCharacterId) {
      this.partnerCharacterId = state.characterId;
      parkourAnimator.preloadCharacter(state.characterId);
    }

    if (state.name && state.name !== this.partnerPlayerName) {
      this.partnerPlayerName = state.name;
    }
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('orientationchange', this.resize);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private loop = () => {
    if (this.isDestroyed) return;

    const now = performance.now();
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Clamp dt to avoid physics tunnelling during frame hitches
    if (dt > 0.08) dt = 0.08;
    if (dt <= 0) dt = 0.001;

    this.update(dt);
    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private spawnParticles(type: ParkourVfxType, x: number, y: number) {
    if (type === 'jump') {
      for (let i = 0; i < 7; i++) {
        this.particles.push({
          x: x + (Math.random() - 0.5) * 20,
          y,
          vx: (Math.random() - 0.5) * 120,
          vy: Math.random() * -60 - 20,
          color: '#fbbf24',
          size: 3 + Math.random() * 2.5,
          life: 0.25,
          maxLife: 0.25,
        });
      }
    } else if (type === 'double_jump') {
      for (let i = 0; i < 14; i++) {
        const angle = (i / 14) * Math.PI * 2;
        const speed = 110 + Math.random() * 70;
        this.particles.push({
          x,
          y: y - 10,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: '#38bdf8',
          size: 4 + Math.random() * 3,
          life: 0.35,
          maxLife: 0.35,
        });
      }
    } else if (type === 'slide_sparks') {
      for (let i = 0; i < 5; i++) {
        this.particles.push({
          x: x - this.runner.facing * 15,
          y,
          vx: -this.runner.facing * (150 + Math.random() * 100),
          vy: (Math.random() - 0.5) * 80 - 20,
          color: Math.random() > 0.5 ? '#f59e0b' : '#ef4444',
          size: 2.5 + Math.random() * 2.5,
          life: 0.3,
          maxLife: 0.3,
        });
      }
    } else if (type === 'land') {
      // Trigger subtle cinematic camera landing micro-shake
      this.camera.triggerShake(4.5, 0.12);
      for (let i = 0; i < 10; i++) {
        this.particles.push({
          x: x + (Math.random() - 0.5) * 36,
          y,
          vx: (Math.random() - 0.5) * 190,
          vy: -25 - Math.random() * 55,
          color: '#cbd5e1',
          size: 3.5 + Math.random() * 3,
          life: 0.28,
          maxLife: 0.28,
        });
      }
    } else if (type === 'wall_slide') {
      for (let i = 0; i < 3; i++) {
        this.particles.push({
          x,
          y: y + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 60,
          vy: -Math.random() * 40 - 10,
          color: '#38bdf8',
          size: 2.5 + Math.random() * 2,
          life: 0.2,
          maxLife: 0.2,
        });
      }
    } else if (type === 'wall_jump') {
      for (let i = 0; i < 10; i++) {
        this.particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 140,
          vy: Math.random() * -120 - 40,
          color: '#38bdf8',
          size: 3.5 + Math.random() * 2.5,
          life: 0.3,
          maxLife: 0.3,
        });
      }
    } else if (type === 'vault') {
      for (let i = 0; i < 6; i++) {
        this.particles.push({
          x,
          y,
          vx: this.runner.facing * (100 + Math.random() * 80),
          vy: -30 - Math.random() * 40,
          color: '#f59e0b',
          size: 3 + Math.random() * 2,
          life: 0.25,
          maxLife: 0.25,
        });
      }
    } else if (type === 'ledge_grab') {
      for (let i = 0; i < 6; i++) {
        this.particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 80,
          vy: -20 - Math.random() * 40,
          color: '#22c55e',
          size: 3 + Math.random() * 2,
          life: 0.25,
          maxLife: 0.25,
        });
      }
    } else if (type === 'climb_step') {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 14,
        y,
        vx: 0,
        vy: 10,
        color: '#fbbf24',
        size: 2,
        life: 0.15,
        maxLife: 0.15,
      });
    }
  }

  private triggerCelebrationFireworks(x: number, y: number) {
    const colors = ['#f59e0b', '#38bdf8', '#ef4444', '#22c55e', '#a855f7', '#facc15'];
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 160 + Math.random() * 280;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 4,
        life: 0.8 + Math.random() * 0.5,
        maxLife: 1.3,
      });
    }
  }

  private update(dt: number) {
    if (!this.isLevelFinished) {
      this.levelTimer += dt;
    }

    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) {
        this.bannerNotification = null;
      }
    }

    // 1. Update Runner Physics with Level Platforms
    this.runner.update(
      dt,
      this.localInput,
      this.levelData.platforms,
      (type, x, y) => this.spawnParticles(type, x, y)
    );

    // Consume single-frame inputs
    this.localInput.jumpPressed = false;
    this.localInput.slidePressed = false;
    this.localInput.resetPressed = false;

    // 2. Check Collectibles (Coins & Secret Emblem)
    for (const c of this.levelData.collectibles) {
      if (c.collected) continue;
      const radius = c.type === 'secret_emblem' ? 24 : 16;
      const dx = (this.runner.x + this.runner.width * 0.5) - c.x;
      const dy = (this.runner.y + this.runner.currentHeight * 0.5) - c.y;
      if (Math.hypot(dx, dy) < radius + 22) {
        c.collected = true;
        if (c.type === 'coin') {
          this.coinsCollected++;
          duoAudio.playCoinPickup();
          // Coin sparkle burst
          for (let p = 0; p < 7; p++) {
            this.particles.push({
              x: c.x,
              y: c.y,
              vx: (Math.random() - 0.5) * 140,
              vy: (Math.random() - 0.5) * 140,
              color: '#facc15',
              size: 3.5,
              life: 0.32,
              maxLife: 0.32,
            });
          }
        } else if (c.type === 'secret_emblem') {
          this.secretEmblemFound = true;
          duoAudio.playReviveSuccess();
          this.bannerNotification = `SECRET EMBLEM: ${c.name || 'UNLOCKED'}!`;
          this.bannerTimer = 3.5;
          this.camera.triggerShake(6, 0.2);
          this.triggerCelebrationFireworks(c.x, c.y);
        }
      }
    }

    // 3. Check Checkpoint Beacons
    for (let idx = 0; idx < this.levelData.checkpoints.length; idx++) {
      const cp = this.levelData.checkpoints[idx];
      if (!cp.activated) {
        const dx = Math.abs(this.runner.x - cp.x);
        const dy = Math.abs(this.runner.y - cp.y);
        if (dx < 60 && dy < 120) {
          cp.activated = true;
          this.activeCheckpoint = cp;
          duoAudio.playCheckpoint();
          this.bannerNotification = `CHECKPOINT ${idx + 1}: ${cp.name.toUpperCase()}`;
          this.bannerTimer = 3.0;
          this.camera.triggerShake(4, 0.12);

          // Checkpoint beacon flare
          for (let p = 0; p < 22; p++) {
            this.particles.push({
              x: cp.x,
              y: cp.y - 20,
              vx: (Math.random() - 0.5) * 160,
              vy: -Math.random() * 200 - 40,
              color: '#38bdf8',
              size: 4.5,
              life: 0.65,
              maxLife: 0.65,
            });
          }
        }
      }
    }

    // 4. Pit Fall & Hazard Detection (Instant Respawn < 2 seconds)
    if (this.runner.y > 1050) {
      duoAudio.playPlayerHit();
      const respawnX = this.activeCheckpoint ? this.activeCheckpoint.x : this.levelData.spawnPoint.x;
      const respawnY = this.activeCheckpoint ? this.activeCheckpoint.y - this.runner.standingHeight : this.levelData.spawnPoint.y;

      this.runner.x = respawnX;
      this.runner.y = respawnY;
      this.runner.vx = 0;
      this.runner.vy = 0;
      this.runner.isSliding = false;
      this.runner.isWallSliding = false;
      this.runner.isClimbing = false;
      this.runner.isLedgeGrabbing = false;
      this.runner.onGround = true;

      duoAudio.playRespawn();
      this.camera.triggerShake(6, 0.18);
      this.spawnParticles('land', respawnX, respawnY);
      this.bannerNotification = 'RESPAWNED AT CHECKPOINT';
      this.bannerTimer = 1.5;
    }

    // 5. Finish Gate Victory Detection
    const fg = this.levelData.finishGate;
    if (
      !this.isLevelFinished &&
      this.runner.x + this.runner.width >= fg.x &&
      this.runner.x <= fg.x + fg.w &&
      this.runner.y + this.runner.currentHeight >= fg.y &&
      this.runner.y <= fg.y + fg.h
    ) {
      this.isLevelFinished = true;
      duoAudio.playLevelComplete();
      this.camera.triggerShake(8, 0.35);
      this.triggerCelebrationFireworks(fg.x + fg.w * 0.5, fg.y + 40);

      // Star calculation:
      // Star 1: Finish level
      // Star 2: Collect at least 20 coins
      // Star 3: Complete under target time (75s)
      let stars = 1;
      if (this.coinsCollected >= this.levelData.coinsForStar) stars++;
      if (this.levelTimer <= this.levelData.targetSeconds) stars++;

      this.callbacks.onLevelComplete({
        timeSeconds: Math.round(this.levelTimer * 10) / 10,
        coins: this.coinsCollected,
        totalCoins: this.levelData.collectibles.filter((c) => c.type === 'coin').length,
        stars,
        secretEmblem: this.secretEmblemFound,
        targetSeconds: this.levelData.targetSeconds,
      });
    }

    // 6. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 6.5. Update Partner Runner Dead Reckoning & Motion Trails
    if (this.partnerRunner) {
      this.partnerRunner.x += this.partnerRunner.vx * dt;
      this.partnerRunner.y += this.partnerRunner.vy * dt;
      for (let i = this.partnerRunner.trail.length - 1; i >= 0; i--) {
        const t = this.partnerRunner.trail[i];
        t.alpha -= dt * 3.5;
        if (t.alpha <= 0) {
          this.partnerRunner.trail.splice(i, 1);
        }
      }
      if (Math.abs(this.partnerRunner.vx) > 300 || this.partnerRunner.isSliding) {
        this.partnerRunner.trail.push({
          x: this.partnerRunner.x,
          y: this.partnerRunner.y,
          h: this.partnerRunner.currentHeight,
          facing: this.partnerRunner.facing,
          alpha: 0.4,
          color: this.myRole === 'assault' ? '#06b6d4' : '#ef4444',
        });
      }
    }

    // 7. Update Responsive Cinematic Camera (Single or Dual Player Framing)
    if (this.partnerRunner && this.isMultiplayer) {
      this.camera.updateDuo(
        dt,
        {
          x: this.runner.x,
          y: this.runner.y,
          vx: this.runner.vx,
          vy: this.runner.vy,
          facing: this.runner.facing,
          isSprinting: this.runner.isSprinting,
          isDashing: this.runner.isSliding,
        },
        {
          x: this.partnerRunner.x,
          y: this.partnerRunner.y,
          vx: this.partnerRunner.vx,
          vy: this.partnerRunner.vy,
          facing: this.partnerRunner.facing,
          isSprinting: this.partnerRunner.isSprinting,
          isDashing: this.partnerRunner.isSliding,
        },
        this.levelData.worldWidth,
        this.levelData.worldHeight
      );
    } else {
      this.camera.update(
        dt,
        this.runner.x,
        this.runner.y,
        this.runner.vx,
        this.runner.vy,
        this.runner.facing,
        this.runner.isSliding,
        this.runner.isSprinting,
        this.levelData.worldWidth,
        this.levelData.worldHeight
      );
    }

    // 8. Update Dust Motes & Embers
    for (const d of this.dustMotes) {
      d.x += d.speed * dt;
      if (d.x > this.canvas.width + 100) {
        d.x = -60;
        d.y = Math.random() * this.canvas.height;
      }
    }

    // 9. Send Telemetry to React HUD
    const speedKmh = Math.round((Math.abs(this.runner.vx) * 3.6) / 30);
    const activeCpIdx = this.activeCheckpoint
      ? this.levelData.checkpoints.findIndex((c) => c.id === this.activeCheckpoint?.id) + 1
      : 0;

    this.callbacks.onUpdateTelemetry({
      speedKmh,
      state: this.runner.getMovementState(),
      coyoteRemaining: Math.round(this.runner.coyoteTimer * 1000),
      jumpBufferRemaining: Math.round(this.runner.jumpBufferTimer * 1000),
      canDoubleJump: this.runner.canDoubleJump && !this.runner.hasDoubleJumped,
      x: Math.round(this.runner.x),
      y: Math.round(this.runner.y),
      coins: this.coinsCollected,
      totalCoins: this.levelData.collectibles.filter((c) => c.type === 'coin').length,
      timer: this.levelTimer,
      targetSeconds: this.levelData.targetSeconds,
      checkpointIndex: activeCpIdx,
      totalCheckpoints: this.levelData.checkpoints.length,
      secretEmblem: this.secretEmblemFound,
      bannerNotification: this.bannerNotification,
    });
  }

  // ===========================================================================
  // CINEMATIC 2D / 2.5D PARALLAX RENDERING
  // ===========================================================================
  private render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cam = this.camera;

    // 1. LAYERS 0 to 4: Cinematic Parallax Background (Sky, Clouds, Megacity, Midground, Near-Midground)
    parkourRenderer.renderParallaxBackground(ctx, w, h, cam, this.levelTimer);

    // 2. LAYER 5: World Space (Platforms, Props, Collectibles, Checkpoints, Runners, Particles)
    ctx.save();
    // Smooth cinematic zoom centered on viewport
    ctx.translate(w * 0.5, h * 0.5);
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-w * 0.5, -h * 0.5);

    ctx.translate(-cam.x + cam.shakeOffsetX, -cam.y + cam.shakeOffsetY);

    // A. Render Rooftop Environment Props (Water Tanks, Clotheslines, Antennas, Neon Signs)
    parkourRenderer.renderRooftopDoodads(ctx, this.levelData.skylineDoodads, this.levelTimer);

    // B. Render Architectural Platforms (Rooftop slabs, brick masonry, ladders, slide ducts)
    parkourRenderer.renderWorldPlatforms(ctx, this.levelData.platforms);

    // C. Render In-World Contextual Holographic Movement Glyphs (Non-intrusive)
    parkourRenderer.renderTutorialGlyphs(ctx, this.levelData.tutorialSigns, this.runner.x);

    // D. Render Checkpoints
    parkourRenderer.renderCheckpoints(ctx, this.levelData.checkpoints, this.levelTimer);

    // E. Render Finish Gate
    parkourRenderer.renderFinishGate(ctx, this.levelData.finishGate, this.levelTimer);

    // F. Render Collectibles (3D Gold Coins & Secret Emblem)
    parkourRenderer.renderCollectibles(ctx, this.levelData.collectibles, this.levelTimer);

    // G. Render Partner Runner (if multiplayer active)
    if (this.partnerRunner && this.isMultiplayer) {
      const partnerDef = getCharacterDef(this.partnerCharacterId);
      this.renderRunnerTrails(ctx, this.partnerRunner, partnerDef.accentColor);
      this.renderRunner(
        ctx,
        this.partnerRunner,
        false,
        this.myRole === 'assault' ? 'heavy' : 'assault',
        this.partnerPlayerName,
        this.partnerCharacterId
      );
    }

    // H. Render Local Runner
    const localDef = getCharacterDef(this.localCharacterId);
    this.renderRunnerTrails(ctx, this.runner, localDef.accentColor);
    this.renderRunner(
      ctx,
      this.runner,
      true,
      this.myRole,
      this.localPlayerName,
      this.localCharacterId
    );

    // I. Render Particles
    this.renderParticles(ctx);

    ctx.restore();

    // 3. LAYER 6: Foreground Silhouettes & 2.5D Depth (Parallax 1.45)
    parkourRenderer.renderForegroundSilhouettes(ctx, w, h, cam);

    // 4. LAYER 7: Screen-Space Atmosphere (Dust motes, speed lines, vignette)
    parkourRenderer.renderScreenAtmosphere(ctx, w, h, this.runner, this.dustMotes, this.levelTimer);
  }

  private renderParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderRunnerTrails(
    ctx: CanvasRenderingContext2D,
    r: ParkourRunner2D = this.runner,
    accentColor: string = '#38bdf8'
  ) {
    for (const t of r.trail) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = t.alpha * 0.5;
      ctx.fillStyle = t.color || accentColor;
      ctx.beginPath();
      ctx.roundRect(t.x, t.y + 4, r.width, t.h - 8, 8);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderPlayerTag(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    name: string,
    accentColor: string
  ) {
    const cleanName = (name || '').trim();
    if (!cleanName) return;

    ctx.save();
    const centerX = x + width * 0.5;
    const tagY = y - 14;

    // Clean, modern, high-graphic typography (Name only)
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    const metrics = ctx.measureText(cleanName);
    const pillW = Math.max(46, metrics.width + 16);
    const pillH = 18;
    const pillX = centerX - pillW * 0.5;
    const pillY = tagY - pillH;

    // Sleek frosted translucent capsule
    ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 9);
    ctx.fill();

    // Subtle neon border
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.25;
    ctx.stroke();

    // Clean mini pointer arrow
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.moveTo(centerX - 3.5, tagY);
    ctx.lineTo(centerX + 3.5, tagY);
    ctx.lineTo(centerX, tagY + 3.5);
    ctx.closePath();
    ctx.fill();

    // Player name text only
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cleanName, centerX, pillY + pillH * 0.5);

    ctx.restore();
  }

  private renderRunner(
    ctx: CanvasRenderingContext2D,
    r: ParkourRunner2D = this.runner,
    isLocal: boolean = true,
    role: 'assault' | 'heavy' = this.myRole,
    playerName: string = this.localPlayerName,
    characterId: string = this.localCharacterId
  ) {
    const x = r.x;
    const y = r.y;
    const w = r.width;
    const h = r.currentHeight;

    const charDef = getCharacterDef(characterId);
    const accentColor = charDef.accentColor;

    // 0. Soft Ground Contact Drop Shadow
    if (r.onGround) {
      ctx.save();
      ctx.fillStyle = 'rgba(7, 10, 20, 0.45)';
      ctx.beginPath();
      ctx.ellipse(x + w * 0.5, y + r.standingHeight - 1, 18, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 1. Render High-Definition 2D Animated Sprite
    const spriteDrawn = parkourAnimator.drawRunnerSprite(
      ctx,
      r,
      characterId,
      this.levelTimer
    );

    // 2. Vector Fallback Silhouette (active while sprites are loading)
    if (!spriteDrawn) {
      const mainColor = role === 'assault' ? '#dc2626' : '#0284c7';
      const bandanaColor = role === 'assault' ? '#f87171' : '#38bdf8';

      ctx.save();
      if (r.isClimbing) {
        ctx.fillStyle = mainColor;
        ctx.fillRect(x + 6, y + 16, w - 12, h - 30);
        ctx.fillStyle = accentColor;
        ctx.fillRect(x - 4, y + 14, 10, 6);
        ctx.fillRect(x + w - 6, y + 14, 10, 6);
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(x + w * 0.5, y + 10, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = bandanaColor;
        ctx.fillRect(x + w * 0.5 - 8, y + 7, 16, 4);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x + 4, y + h - 16, 12, 16);
        ctx.fillRect(x + w - 16, y + h - 22, 12, 16);
      } else if (r.isLedgeGrabbing) {
        ctx.fillStyle = accentColor;
        ctx.fillRect(r.facing > 0 ? x + w - 6 : x - 4, y - 2, 10, 6);
        ctx.fillStyle = mainColor;
        ctx.fillRect(r.facing > 0 ? x + w - 12 : x + 2, y + 4, 10, 20);
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(x + w * 0.5, y + 18, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = mainColor;
        ctx.fillRect(x + 6, y + 26, w - 12, h - 42);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x + 8, y + h - 18, w - 16, 18);
      } else if (r.isWallSliding) {
        ctx.fillStyle = mainColor;
        ctx.fillRect(x + 4, y + 18, w - 8, h - 32);
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(x + w * 0.5 + (r.wallDir * 6), y + 12, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#38bdf8';
        const wallContactX = r.wallDir > 0 ? x + w - 2 : x - 6;
        ctx.fillRect(wallContactX, y + 22, 8, 8);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x + 6, y + h - 16, w - 12, 16);
      } else if (r.isVaulting || r.isSliding) {
        ctx.fillStyle = mainColor;
        ctx.fillRect(x, y + 8, w + 12, h - 8);
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(r.facing > 0 ? x + w + 4 : x - 4, y + 16, 10, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = mainColor;
        ctx.fillRect(x + 4, y + 20, w - 8, h - 34);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x + 6, y + h - 18, w - 12, 18);
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(x + w * 0.5 + r.facing * 2, y + 12, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = bandanaColor;
        ctx.fillRect(x + w * 0.5 - 10, y + 8, 20, 4);
      }

      if (r.hasDoubleJumped) {
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
      }
      ctx.restore();
    }

    // 3. Render clean floating player nameplate (ONLY the name, sleek & minimal)
    this.renderPlayerTag(ctx, x, y, w, playerName, accentColor);
  }
}
