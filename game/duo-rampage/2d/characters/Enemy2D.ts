import { EnemyStats2D, EnemyType } from '../Duo2DTypes';
import { PlatformManager } from '../world/PlatformManager';
import { ParticleEngine2D } from '../effects/ParticleEngine2D';
import { duoAudio } from '../../audio/DuoAudioEngine';

export class Enemy2D {
  public stats: EnemyStats2D;
  private animTimer: number = 0;
  private hurtTimer: number = 0;

  constructor(id: string, type: EnemyType, startX: number, startY: number) {
    let health = 60;
    let w = 40;
    let h = 68;
    let scoreValue = 100;
    let shieldHealth = 0;

    if (type === 'shield') {
      health = 90;
      shieldHealth = 120;
      w = 44;
      h = 70;
      scoreValue = 180;
    } else if (type === 'drone') {
      health = 45;
      w = 42;
      h = 36;
      scoreValue = 150;
    } else if (type === 'brute') {
      health = 240;
      w = 60;
      h = 92;
      scoreValue = 350;
    } else if (type === 'boss') {
      health = 1200;
      w = 140;
      h = 160;
      scoreValue = 2500;
    }

    this.stats = {
      id,
      type,
      x: startX,
      y: startY,
      vx: 0,
      vy: 0,
      w,
      h,
      health,
      maxHealth: health,
      facing: startX > 1600 ? -1 : 1,
      isGrounded: false,
      state: 'run',
      attackCooldown: 1.0 + Math.random() * 0.5,
      scoreValue,
      shieldHealth,
    };
  }

  public update(
    dt: number,
    targetX: number,
    targetY: number,
    platformMgr: PlatformManager,
    particles: ParticleEngine2D,
    onEnemyAttack?: (type: EnemyType, x: number, y: number, facing: 1 | -1) => void
  ): boolean {
    const s = this.stats;
    if (s.state === 'dead') return false;

    this.animTimer += dt;
    if (this.hurtTimer > 0) this.hurtTimer -= dt;

    // Face target player
    s.facing = targetX > s.x ? 1 : -1;

    // 1. DRONE FLYING AI
    if (s.type === 'drone') {
      const hoverY = targetY - 140 + Math.sin(this.animTimer * 4) * 30;
      s.vx = (targetX - s.x) * 1.2;
      s.vy = (hoverY - s.y) * 1.4;

      s.x += s.vx * dt;
      s.y += s.vy * dt;

      // Attack
      s.attackCooldown -= dt;
      if (s.attackCooldown <= 0 && Math.abs(targetX - s.x) < 550) {
        s.attackCooldown = 2.2;
        onEnemyAttack?.('drone', s.x + s.w * 0.5, s.y + s.h * 0.5, s.facing);
      }
      return true;
    }

    // 2. GROUND UNITS AI (Thug, Shield, Brute, Boss)
    const moveSpeed = s.type === 'thug' ? 220 : s.type === 'shield' ? 140 : s.type === 'brute' ? 120 : 70;
    s.vx = s.facing * moveSpeed;

    // Gravity
    s.vy += 1300 * dt;
    s.vy = Math.min(s.vy, 950);

    s.x += s.vx * dt;
    s.y += s.vy * dt;

    // Platform Collisions
    s.isGrounded = false;
    if (s.y + s.h >= platformMgr.groundY) {
      s.y = platformMgr.groundY - s.h;
      s.vy = 0;
      s.isGrounded = true;
    }

    for (const p of platformMgr.platforms) {
      if (p.type === 'jump_through') {
        const prevY = s.y - s.vy * dt + s.h;
        const currentY = s.y + s.h;
        if (
          s.x + s.w * 0.8 > p.x &&
          s.x + s.w * 0.2 < p.x + p.w &&
          prevY <= p.y + 12 &&
          currentY >= p.y
        ) {
          s.y = p.y - s.h;
          s.vy = 0;
          s.isGrounded = true;
          break;
        }
      }
    }

    // Attack cooldown
    s.attackCooldown -= dt;
    const attackRange = s.type === 'boss' ? 700 : s.type === 'brute' ? 80 : 55;
    const distToTarget = Math.hypot(targetX - s.x, targetY - s.y);

    if (distToTarget < attackRange && s.attackCooldown <= 0) {
      s.attackCooldown = s.type === 'boss' ? 3.0 : 1.4;
      onEnemyAttack?.(s.type, s.x + (s.facing === 1 ? s.w : 0), s.y + s.h * 0.5, s.facing);
    }

    return true;
  }

  public takeDamage(
    amount: number,
    fromFacing: 1 | -1,
    particles: ParticleEngine2D
  ): { killed: boolean; score: number } {
    const s = this.stats;
    if (s.state === 'dead') return { killed: false, score: 0 };

    this.hurtTimer = 0.12;

    // Shield blocks damage from front
    if (s.type === 'shield' && s.shieldHealth && s.shieldHealth > 0 && fromFacing !== s.facing) {
      s.shieldHealth -= amount;
      particles.spawnHitSparks(s.x + (s.facing === 1 ? s.w : 0), s.y + s.h * 0.4, '#38bdf8', 8);
      particles.spawnDamageText('BLOCKED', s.x + s.w * 0.5, s.y - 10, '#38bdf8', true, 18);
      return { killed: false, score: 0 };
    }

    s.health -= amount;
    particles.spawnHitSparks(s.x + s.w * 0.5, s.y + s.h * 0.5, '#ef4444', 6);
    particles.spawnDamageText(`${amount}`, s.x + s.w * 0.5, s.y - 10, '#ffffff', false, 20);

    if (s.health <= 0) {
      s.health = 0;
      s.state = 'dead';
      particles.spawnExplosion(s.x + s.w * 0.5, s.y + s.h * 0.5, s.type === 'boss' ? 240 : 80);
      duoAudio.playExplosion();
      return { killed: true, score: s.scoreValue };
    }

    return { killed: false, score: 0 };
  }

  public render(ctx: CanvasRenderingContext2D) {
    const s = this.stats;
    if (s.state === 'dead') return;

    ctx.save();
    ctx.translate(s.x, s.y);

    if (s.facing === -1) {
      ctx.translate(s.w, 0);
      ctx.scale(-1, 1);
    }

    // Hurt Flash
    if (this.hurtTimer > 0) {
      ctx.filter = 'brightness(2.2)';
    }

    if (s.type === 'thug') {
      this.drawThug(ctx);
    } else if (s.type === 'shield') {
      this.drawShieldEnforcer(ctx);
    } else if (s.type === 'drone') {
      this.drawDrone(ctx);
    } else if (s.type === 'brute') {
      this.drawBrute(ctx);
    } else if (s.type === 'boss') {
      this.drawBossMech(ctx);
    }

    ctx.restore();

    // Overhead Health Bar
    if (s.type !== 'boss') {
      this.drawHealthBar(ctx);
    }
  }

  private drawThug(ctx: CanvasRenderingContext2D) {
    const s = this.stats;
    const runCycle = Math.sin(this.animTimer * 12);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(s.w * 0.5, s.h - 2, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.fillStyle = '#334155';
    ctx.fillRect(8, 44 - runCycle * 6, 10, 24 + runCycle * 6);
    ctx.fillRect(22, 44 + runCycle * 6, 10, 24 - runCycle * 6);

    // Torso (Dark Militia Jacket)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(8, 18, 24, 28);

    // Neon Yellow Armband
    ctx.fillStyle = '#eab308';
    ctx.fillRect(6, 22, 6, 8);

    // Head (Bandit Mask)
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(20, 10, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#475569';
    ctx.fillRect(10, 8, 20, 8); // Face mask

    // Weapon (Machete / Submachine gun)
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(24, 26, 20, 6);
  }

  private drawShieldEnforcer(ctx: CanvasRenderingContext2D) {
    const s = this.stats;

    // Body
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(4, 18, 26, 50);

    // Helmet with Red Visor
    ctx.fillStyle = '#334155';
    ctx.fillRect(8, 4, 20, 16);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(18, 10, 10, 4);

    // Riot Shield (Covering front)
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(26, 10, 16, 56);
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 2;
    ctx.strokeRect(26, 10, 16, 56);

    // Shield Viewport Glass
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(28, 18, 12, 10);
  }

  private drawDrone(ctx: CanvasRenderingContext2D) {
    const s = this.stats;
    const hoverWobble = Math.sin(this.animTimer * 8) * 3;

    // Drone Chassis
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(4, 10 + hoverWobble, 34, 18, 6);
    ctx.fill();

    // Dual Rotors
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, 4 + hoverWobble, 14, 4);
    ctx.fillRect(28, 4 + hoverWobble, 14, 4);

    // Glowing Sensor Eye
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(21, 19 + hoverWobble, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawBrute(ctx: CanvasRenderingContext2D) {
    const s = this.stats;

    // Massive Body
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(6, 18, 48, 72);

    // Spiked Armor Pads
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 16, 16, 20);
    ctx.fillRect(44, 16, 16, 20);

    // Head / Cyber Mask
    ctx.fillStyle = '#475569';
    ctx.fillRect(20, 2, 20, 18);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(28, 8, 12, 4);
  }

  private drawBossMech(ctx: CanvasRenderingContext2D) {
    const s = this.stats;

    // Titan Mech Cockpit Core
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(20, 20, 100, 110, 16);
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Twin Gatling Cannons
    ctx.fillStyle = '#334155';
    ctx.fillRect(100, 50, 45, 18);
    ctx.fillRect(100, 80, 45, 18);

    // Heavy Hydraulic Legs
    ctx.fillStyle = '#475569';
    ctx.fillRect(26, 120, 24, 40);
    ctx.fillRect(80, 120, 24, 40);

    // Glowing Core Reactor
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(70, 70, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawHealthBar(ctx: CanvasRenderingContext2D) {
    const s = this.stats;
    const barW = s.w;
    const barH = 5;
    const hpPercent = Math.max(0, s.health / s.maxHealth);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(s.x, s.y - 12, barW, barH);

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(s.x, s.y - 12, barW * hpPercent, barH);
  }
}
