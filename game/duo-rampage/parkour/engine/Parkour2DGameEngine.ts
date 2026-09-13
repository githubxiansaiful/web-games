/**
 * DUO RAMPAGE: DHAKA PARKOUR - 2D Canvas Engine & Level 01 Experience
 * Based on Dhaka-Parkour.md Sections 6, 7, 11, 24-26, 52 (Task 05)
 *
 * Implements:
 * - Full 5-minute Level 01: Rooftop Introduction
 * - Layered Cinematic 2D Parallax (Sky, Far Skyline, Midground Apartments, Gameplay, Atmosphere)
 * - Collectible Gold Coins & Secret Emblem with audio/particle juice
 * - 3 Strategic Checkpoints with instant under-2s respawn
 * - Tutorial Movement Signs (Run, Sprint, Jump, Slide, Ledge Grab, Vault)
 * - Bifurcation Route: Safe Lower Path vs High-Speed Shortcut
 * - Finish Gate with 3-Star Rating System & Level Complete Fanfare
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
  private dustMotes: Array<{ x: number; y: number; size: number; speed: number; alpha: number }> = [];

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

    // Initialize atmospheric sunset dust
    for (let i = 0; i < 40; i++) {
      this.dustMotes.push({
        x: Math.random() * 2000,
        y: Math.random() * 800,
        size: 1.5 + Math.random() * 2,
        speed: 15 + Math.random() * 25,
        alpha: 0.2 + Math.random() * 0.5,
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

  public resize = () => {
    if (!this.container || this.isDestroyed) return;
    const rect = this.container.getBoundingClientRect();
    const cw = rect.width || window.innerWidth || 1280;
    const ch = rect.height || window.innerHeight || 720;
    const aspect = Math.max(0.5, cw / Math.max(1, ch));

    const isMobile = cw <= 1024 || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);
    const baseHeight = isMobile ? 580 : 720;

    let viewHeight = baseHeight;
    let viewWidth = Math.round(viewHeight * aspect);

    if (viewWidth < 680) {
      viewWidth = 680;
      viewHeight = Math.round(viewWidth / aspect);
    }
    if (viewHeight > 1100) {
      viewHeight = 1100;
      viewWidth = Math.round(viewHeight * aspect);
    }

    if (this.canvas.width !== viewWidth || this.canvas.height !== viewHeight) {
      this.canvas.width = viewWidth;
      this.canvas.height = viewHeight;
    }
    this.camera.width = viewWidth;
    this.camera.height = viewHeight;
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
      this.resizeObserver = null;
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

  private spawnParticles(type: ParkourVfxType, x: number, y: number) {
    if (type === 'jump') {
      for (let i = 0; i < 7; i++) {
        this.particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 160,
          vy: Math.random() * -100 - 30,
          color: '#cbd5e1',
          size: 3 + Math.random() * 3,
          life: 0.25,
          maxLife: 0.25,
        });
      }
    } else if (type === 'double_jump') {
      for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 120 + Math.random() * 140;
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
      for (let i = 0; i < 8; i++) {
        this.particles.push({
          x: x + (Math.random() - 0.5) * 30,
          y,
          vx: (Math.random() - 0.5) * 180,
          vy: -30 - Math.random() * 50,
          color: '#94a3b8',
          size: 3 + Math.random() * 3,
          life: 0.25,
          maxLife: 0.25,
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
    for (let i = 0; i < 45; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 160 + Math.random() * 260;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 4,
        life: 0.8 + Math.random() * 0.4,
        maxLife: 1.2,
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
          for (let p = 0; p < 6; p++) {
            this.particles.push({
              x: c.x,
              y: c.y,
              vx: (Math.random() - 0.5) * 120,
              vy: (Math.random() - 0.5) * 120,
              color: '#facc15',
              size: 3,
              life: 0.3,
              maxLife: 0.3,
            });
          }
        } else if (c.type === 'secret_emblem') {
          this.secretEmblemFound = true;
          duoAudio.playReviveSuccess();
          this.bannerNotification = `SECRET EMBLEM: ${c.name || 'UNLOCKED'}!`;
          this.bannerTimer = 3.5;
          this.triggerCelebrationFireworks(c.x, c.y);
        }
      }
    }

    // 3. Check Checkpoint Triggers (Under-2s respawn anchors)
    for (let idx = 0; idx < this.levelData.checkpoints.length; idx++) {
      const cp = this.levelData.checkpoints[idx];
      const dist = Math.abs((this.runner.x + this.runner.width * 0.5) - cp.x);
      if (dist < 40 && Math.abs(this.runner.y - (cp.y - this.runner.standingHeight)) < 120) {
        if (!cp.activated) {
          cp.activated = true;
          this.activeCheckpoint = cp;
          duoAudio.playCheckpoint();
          this.bannerNotification = `CHECKPOINT ${idx + 1}: ${cp.name.toUpperCase()}`;
          this.bannerTimer = 3.0;
          // Checkpoint beacon flare
          for (let p = 0; p < 18; p++) {
            this.particles.push({
              x: cp.x,
              y: cp.y - 20,
              vx: (Math.random() - 0.5) * 140,
              vy: -Math.random() * 180 - 40,
              color: '#38bdf8',
              size: 4,
              life: 0.6,
              maxLife: 0.6,
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

    // 7. Update Camera Lookahead
    this.camera.update(
      dt,
      this.runner.x,
      this.runner.y,
      this.runner.vx,
      this.runner.facing,
      this.levelData.worldWidth,
      this.levelData.worldHeight
    );

    // 8. Update Dust Motes
    for (const d of this.dustMotes) {
      d.x += d.speed * dt;
      if (d.x > this.camera.x + this.camera.width + 100) {
        d.x = this.camera.x - 100;
        d.y = Math.random() * 800;
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
  // CINEMATIC 2D PARALLAX RENDERING
  // ===========================================================================
  private render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cam = this.camera;

    // LAYER 0: Sky (Full Summer Daylight Azure Blue Gradient)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#0284c7'); // Deep radiant summer sky blue
    skyGrad.addColorStop(0.35, '#38bdf8'); // Daylight tropical cyan
    skyGrad.addColorStop(0.7, '#7dd3fc'); // Soft sky blue
    skyGrad.addColorStop(0.9, '#bae6fd'); // Warm summer horizon haze
    skyGrad.addColorStop(1, '#e0f2fe'); // Crisp sunny horizon
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Blazing Summer Sun (White-hot core with golden summer corona)
    const sunX = w * 0.7 - cam.x * 0.01;
    const sunY = h * 0.28;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 160);
    sunGrad.addColorStop(0, 'rgba(255, 255, 255, 1.0)'); // Blazing white core
    sunGrad.addColorStop(0.2, 'rgba(254, 240, 138, 0.9)'); // Warm yellow glow
    sunGrad.addColorStop(0.55, 'rgba(253, 224, 71, 0.35)'); // Summer sun aura
    sunGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 160, 0, Math.PI * 2);
    ctx.fill();

    // Summer Cumulus Clouds (Parallax 0.03)
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    const cloudOffset = -cam.x * 0.03 + (this.levelTimer * 12);
    for (let cx = -300; cx < w + 600; cx += 320) {
      const cy = 60 + Math.sin(cx * 0.01) * 35;
      const cPos = (cx + cloudOffset) % (w + 600) - 200;
      ctx.beginPath();
      ctx.arc(cPos, cy, 32, 0, Math.PI * 2);
      ctx.arc(cPos + 24, cy - 14, 38, 0, Math.PI * 2);
      ctx.arc(cPos + 54, cy - 8, 30, 0, Math.PI * 2);
      ctx.arc(cPos + 74, cy, 26, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // LAYER 1: Far Dhaka Skyline (Sunny Atmospheric Blue-Slate, Parallax 0.05)
    ctx.save();
    ctx.fillStyle = '#94a3b8'; // Light sunny atmospheric building silhouettes
    const farOffset = -cam.x * 0.05;
    for (let bx = -200; bx < w + 600; bx += 90) {
      const bh = 150 + Math.sin(bx * 0.015) * 70 + (bx % 3 === 0 ? 80 : 0);
      ctx.fillRect(bx + (farOffset % 90), h - bh, 80, bh);

      // Sunlit rooftop edges
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(bx + (farOffset % 90), h - bh, 80, 4);
      ctx.fillStyle = '#94a3b8';
    }
    ctx.restore();

    // LAYER 2: Midground Dhaka Buildings (Warm Terracotta Brick & Concrete, Parallax 0.18)
    ctx.save();
    ctx.fillStyle = '#64748b'; // Midground slate-brick silhouettes
    const midOffset = -cam.x * 0.18;
    for (let mx = -300; mx < w + 800; mx += 140) {
      const mh = 230 + Math.cos(mx * 0.01) * 80 + (mx % 5 === 0 ? 90 : 0);
      ctx.fillRect(mx + (midOffset % 140), h - mh, 125, mh);

      // Sunlit rooftop coping & warm brick accent
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(mx + (midOffset % 140), h - mh, 125, 5);

      // Midground windows reflecting blue sky
      ctx.fillStyle = '#bae6fd';
      for (let wy = h - mh + 25; wy < h - 40; wy += 35) {
        ctx.fillRect(mx + (midOffset % 140) + 18, wy, 16, 20);
        ctx.fillRect(mx + (midOffset % 140) + 48, wy, 16, 20);
        ctx.fillRect(mx + (midOffset % 140) + 78, wy, 16, 20);
      }
      ctx.fillStyle = '#64748b';
    }
    ctx.restore();

    // LAYER 3: World Space (Parallax 1.0)
    ctx.save();
    ctx.translate(-cam.x, -cam.y);

    // A. Render Skyline Doodads (Water Tanks, Clotheslines, Antennas, Neon Signs)
    this.renderDoodads(ctx);

    // B. Render Platforms (Rooftops, tin sheds, ladders, slide ducts)
    this.renderPlatforms(ctx);

    // C. Render Tutorial Signs (In-world holographic prompt boards)
    this.renderTutorialSigns(ctx);

    // D. Render Checkpoints
    this.renderCheckpoints(ctx);

    // E. Render Finish Gate
    this.renderFinishGate(ctx);

    // F. Render Collectibles (Coins & Secret Emblem)
    this.renderCollectibles(ctx);

    // G. Render Runner Trails & High-Definition 2D Animated Sprites
    if (this.partnerRunner) {
      this.renderRunnerTrails(ctx, this.partnerRunner);
      this.renderRunner(
        ctx,
        this.partnerRunner,
        false,
        this.myRole === 'assault' ? 'heavy' : 'assault',
        this.partnerPlayerName,
        this.partnerCharacterId
      );
    }

    this.renderRunnerTrails(ctx, this.runner);
    this.renderRunner(
      ctx,
      this.runner,
      true,
      this.myRole,
      this.localPlayerName,
      this.localCharacterId
    );

    // H. Render Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

      // Atmosphere: Floating Summer Sun Glints / Dust Motes
    for (const d of this.dustMotes) {
      ctx.save();
      ctx.globalAlpha = d.alpha * (0.6 + 0.4 * Math.sin(this.levelTimer * 2 + d.x));
      ctx.fillStyle = '#fef08a'; // Radiant golden summer sun glints
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  private renderDoodads(ctx: CanvasRenderingContext2D) {
    for (const d of this.levelData.skylineDoodads) {
      if (d.type === 'water_tank') {
        const w = d.w || 80;
        const h = d.h || 100;
        // Classic Dhaka Blue Water Tank on Sturdy Steel Legs
        ctx.fillStyle = '#475569';
        ctx.fillRect(d.x + 10, d.y + h - 18, 10, 18);
        ctx.fillRect(d.x + w - 20, d.y + h - 18, 10, 18);

        // Cylinder body in bright Dhaka sky blue
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.roundRect(d.x, d.y, w, h - 18, 8);
        ctx.fill();

        // Metallic bands & sun highlight
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(d.x, d.y + 16, w, 4);
        ctx.fillRect(d.x, d.y + (h - 18) * 0.5, w, 4);
        ctx.fillRect(d.x, d.y + h - 34, w, 4);

        // Sunlit specular reflection
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(d.x + 8, d.y + 4, 12, h - 26);
      } else if (d.type === 'clothesline') {
        const w = d.w || 160;
        // Cable
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.quadraticCurveTo(d.x + w * 0.5, d.y + 14, d.x + w, d.y);
        ctx.stroke();

        // Hanging clothes
        const colors = ['#ef4444', '#38bdf8', '#fbbf24', '#f8fafc', '#a855f7'];
        for (let cx = d.x + 20; cx < d.x + w - 20; cx += 26) {
          ctx.fillStyle = colors[(cx / 26) % colors.length];
          const clothH = 22 + Math.sin(cx) * 6;
          ctx.fillRect(cx, d.y + 6, 16, clothH);
        }
      } else if (d.type === 'antenna') {
        // TV Antenna mast
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y + 100);
        ctx.lineTo(d.x, d.y);
        ctx.moveTo(d.x - 14, d.y + 20);
        ctx.lineTo(d.x + 14, d.y + 20);
        ctx.moveTo(d.x - 10, d.y + 40);
        ctx.lineTo(d.x + 10, d.y + 40);
        ctx.stroke();
      } else if (d.type === 'neon_sign') {
        // Glowing Bengali Neon Sign
        const w = d.w || 200;
        const h = d.h || 60;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(d.x, d.y, w, h);
        ctx.strokeStyle = d.color || '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(d.x, d.y, w, h);

        ctx.fillStyle = d.color || '#38bdf8';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(d.text || '', d.x + w * 0.5, d.y + h * 0.5 + 4);
        ctx.textAlign = 'left';
      }
    }
  }

  private renderPlatforms(ctx: CanvasRenderingContext2D) {
    for (const plat of this.levelData.platforms) {
      if (plat.type === 'low_gap_barrier') {
        // Slide duct (Hazard orange/red)
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

        // Yellow warning stripe
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(plat.x, plat.y + plat.h - 6, plat.w, 6);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('▼ LOW DUCT (SLIDE)', plat.x + 16, plat.y - 8);
      } else if (plat.type === 'vault_obstacle') {
        // Vault Crate / Railing
        ctx.fillStyle = '#b45309';
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(plat.x, plat.y, plat.w, 4);

        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('↷ VAULT', plat.x - 2, plat.y - 6);
      } else if (plat.type === 'ladder') {
        // Vertical ladder
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(plat.x, plat.y, 6, plat.h);
        ctx.fillRect(plat.x + plat.w - 6, plat.y, 6, plat.h);

        ctx.fillStyle = '#38bdf8';
        for (let ry = plat.y + 16; ry < plat.y + plat.h; ry += 24) {
          ctx.fillRect(plat.x + 4, ry, plat.w - 8, 4);
        }

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('▲ CLIMB', plat.x - 6, plat.y - 8);
      } else {
        // Solid Dhaka Rooftop / Platform
        ctx.fillStyle = '#1e293b'; // Slate concrete
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

        // Top edge neon turquoise trim
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(plat.x, plat.y, plat.w, 4);

        // Brick mortar pattern for realism
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);

        for (let by = plat.y + 24; by < plat.y + plat.h; by += 32) {
          ctx.beginPath();
          ctx.moveTo(plat.x, by);
          ctx.lineTo(plat.x + plat.w, by);
          ctx.stroke();
        }
      }
    }
  }

  private renderTutorialSigns(ctx: CanvasRenderingContext2D) {
    for (const tut of this.levelData.tutorialSigns) {
      ctx.save();
      const pw = 240;
      const ph = 52;
      const px = tut.x - pw * 0.5;
      const py = tut.y - ph;

      // Holographic board background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, 8);
      ctx.fill();

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Icon & Action
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`${tut.icon} ${tut.action}`, px + 10, py + 18);

      // Desktop / Mobile Instruction
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '10px monospace';
      ctx.fillText(tut.instruction, px + 10, py + 34);

      // Desktop Key Badge
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`[${tut.desktopKey}]`, px + 10, py + 46);

      ctx.restore();
    }
  }

  private renderCheckpoints(ctx: CanvasRenderingContext2D) {
    for (let i = 0; i < this.levelData.checkpoints.length; i++) {
      const cp = this.levelData.checkpoints[i];
      ctx.save();

      // Checkpoint Base
      ctx.fillStyle = cp.activated ? '#22c55e' : '#64748b';
      ctx.fillRect(cp.x - 16, cp.y - 8, 32, 8);

      // Holographic Light Pillar
      const grad = ctx.createLinearGradient(0, cp.y - 120, 0, cp.y);
      grad.addColorStop(0, cp.activated ? 'rgba(34, 197, 94, 0)' : 'rgba(56, 189, 248, 0)');
      grad.addColorStop(1, cp.activated ? 'rgba(34, 197, 94, 0.45)' : 'rgba(56, 189, 248, 0.25)');
      ctx.fillStyle = grad;
      ctx.fillRect(cp.x - 12, cp.y - 120, 24, 120);

      // Checkpoint Beacon Ring
      ctx.fillStyle = cp.activated ? '#4ade80' : '#38bdf8';
      ctx.beginPath();
      ctx.arc(cp.x, cp.y - 70, 8, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = cp.activated ? '#86efac' : '#94a3b8';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(cp.activated ? `✓ CP ${i + 1} SAVED` : `CP ${i + 1}`, cp.x, cp.y - 86);

      ctx.restore();
    }
  }

  private renderFinishGate(ctx: CanvasRenderingContext2D) {
    const fg = this.levelData.finishGate;
    ctx.save();

    // Twin Neon Gate Towers
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(fg.x, fg.y, 14, fg.h);
    ctx.fillRect(fg.x + fg.w - 14, fg.y, 14, fg.h);

    // Arch Overhead Banner
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(fg.x, fg.y, fg.w, 36);

    // Chequered Finish Line Pattern
    for (let bx = fg.x; bx < fg.x + fg.w; bx += 10) {
      for (let by = fg.y; by < fg.y + 36; by += 10) {
        if ((bx + by) % 20 === 0) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(bx, by, 10, 10);
        }
      }
    }

    // Finish Text
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('★ FINISH ★', fg.x + fg.w * 0.5, fg.y + 24);

    ctx.restore();
  }

  private renderCollectibles(ctx: CanvasRenderingContext2D) {
    const time = this.levelTimer;

    for (const c of this.levelData.collectibles) {
      if (c.collected) continue;

      if (c.type === 'coin') {
        // Rotating Gold Coin with 3D elliptical oscillation
        const scaleX = Math.abs(Math.cos(time * 4 + c.x * 0.1));
        const floatY = c.y + Math.sin(time * 3 + c.x) * 4;

        ctx.save();
        ctx.translate(c.x, floatY);

        // Gold outer ring
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.ellipse(0, 0, Math.max(3, 11 * scaleX), 11, 0, 0, Math.PI * 2);
        ctx.fill();

        // Specular inner shine
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.ellipse(0, 0, Math.max(1.5, 7 * scaleX), 7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      } else if (c.type === 'secret_emblem') {
        // Secret Emblem: Radiant Star Crest
        const floatY = c.y + Math.sin(time * 2.5) * 6;
        ctx.save();
        ctx.translate(c.x, floatY);

        // Glowing outer aura
        ctx.fillStyle = 'rgba(234, 179, 8, 0.35)';
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.fill();

        // Golden Diamond Crest
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(16, 0);
        ctx.lineTo(0, 18);
        ctx.lineTo(-16, 0);
        ctx.closePath();
        ctx.fill();

        // Core star
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SECRET EMBLEM', 0, -26);

        ctx.restore();
      }
    }
  }

  private renderRunnerTrails(ctx: CanvasRenderingContext2D, r: ParkourRunner2D = this.runner) {
    for (const t of r.trail) {
      ctx.save();
      ctx.globalAlpha = t.alpha;
      ctx.fillStyle = t.color || '#ef4444';
      ctx.fillRect(t.x, t.y, r.width, t.h);
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
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
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
