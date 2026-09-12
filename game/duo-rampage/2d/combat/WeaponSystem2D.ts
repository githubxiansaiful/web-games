import { Bullet2D, Grenade2D, WeaponKind } from '../Duo2DTypes';
import { ParticleEngine2D } from '../effects/ParticleEngine2D';
import { duoAudio } from '../../audio/DuoAudioEngine';

export interface WeaponProfile {
  name: string;
  damage: number;
  fireRate: number; // Shots per second
  bulletSpeed: number;
  pelletCount: number;
  spread: number;
  bulletColor: string;
  bulletLength: number;
  bulletThickness: number;
}

export const WEAPON_PROFILES: Record<WeaponKind, WeaponProfile> = {
  rifle: {
    name: 'Tactical Assault Rifle',
    damage: 32,
    fireRate: 8,
    bulletSpeed: 1400,
    pelletCount: 1,
    spread: 0.04,
    bulletColor: '#fde047',
    bulletLength: 22,
    bulletThickness: 4,
  },
  shotgun: {
    name: 'Combat Auto-Shotgun',
    damage: 18, // per pellet
    fireRate: 2.2,
    bulletSpeed: 1100,
    pelletCount: 6,
    spread: 0.22,
    bulletColor: '#fb923c',
    bulletLength: 14,
    bulletThickness: 5,
  },
  minigun: {
    name: 'Heavy Vulcan Minigun',
    damage: 24,
    fireRate: 14,
    bulletSpeed: 1500,
    pelletCount: 1,
    spread: 0.08,
    bulletColor: '#f43f5e',
    bulletLength: 26,
    bulletThickness: 5,
  },
  pistol: {
    name: 'Magnum Pistol',
    damage: 45,
    fireRate: 3.5,
    bulletSpeed: 1250,
    pelletCount: 1,
    spread: 0.02,
    bulletColor: '#38bdf8',
    bulletLength: 18,
    bulletThickness: 4,
  },
};

export class WeaponSystem2D {
  public bullets: Bullet2D[] = [];
  public grenades: Grenade2D[] = [];

  public update(dt: number, particles: ParticleEngine2D, onExplosion?: (x: number, y: number, radius: number, damage: number) => void) {
    // 1. Update Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      const stepX = b.vx * dt;
      const stepY = b.vy * dt;
      const dist = Math.hypot(stepX, stepY);

      b.x += stepX;
      b.y += stepY;
      b.rangeRemaining -= dist;

      if (b.rangeRemaining <= 0) {
        this.bullets.splice(i, 1);
      }
    }

    // 2. Update Grenades (Gravity, arc, ground bounce)
    for (let i = this.grenades.length - 1; i >= 0; i--) {
      const g = this.grenades[i];
      g.vy += 850 * dt; // Gravity
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      g.timer -= dt;

      // Ground bounce
      if (g.y >= 880 - 10) {
        g.y = 880 - 10;
        g.vy = -g.vy * 0.45;
        g.vx *= 0.7;
      }

      if (g.timer <= 0 && !g.exploded) {
        g.exploded = true;
        particles.spawnExplosion(g.x, g.y, g.radius);
        duoAudio.playExplosion();
        onExplosion?.(g.x, g.y, g.radius, g.damage);
        this.grenades.splice(i, 1);
      }
    }
  }

  public fireWeapon(
    weapon: WeaponKind,
    originX: number,
    originY: number,
    facing: 1 | -1,
    aimAngle: number,
    isPlayer: boolean,
    playerId: string | undefined,
    isRampage: boolean,
    particles: ParticleEngine2D
  ) {
    const profile = WEAPON_PROFILES[weapon] || WEAPON_PROFILES.rifle;
    const damageMult = isRampage ? 2.0 : 1.0;

    particles.spawnMuzzleFlash(originX, originY, facing);
    duoAudio.playGunshot(weapon === 'shotgun' ? 'shotgun' : weapon === 'rifle' ? 'rifle' : 'pistol');

    for (let p = 0; p < profile.pelletCount; p++) {
      const spreadOffset = (Math.random() - 0.5) * profile.spread;
      const finalAngle = aimAngle + spreadOffset;

      this.bullets.push({
        id: 'b_' + Math.random().toString(36).substr(2, 9),
        x: originX,
        y: originY,
        vx: Math.cos(finalAngle) * profile.bulletSpeed,
        vy: Math.sin(finalAngle) * profile.bulletSpeed,
        damage: Math.round(profile.damage * damageMult),
        isPlayer,
        playerId,
        color: isRampage ? '#f43f5e' : profile.bulletColor,
        length: profile.bulletLength,
        thickness: profile.bulletThickness,
        rangeRemaining: 1800,
      });
    }
  }

  public throwGrenade(originX: number, originY: number, facing: 1 | -1, isPlayer: boolean) {
    this.grenades.push({
      id: 'g_' + Math.random().toString(36).substr(2, 9),
      x: originX,
      y: originY,
      vx: facing * 450,
      vy: -520,
      timer: 1.4,
      radius: 140,
      damage: 150,
      isPlayer,
      exploded: false,
    });
  }

  public render(ctx: CanvasRenderingContext2D) {
    // 1. Render Glowing Tracer Bullets
    for (const b of this.bullets) {
      const angle = Math.atan2(b.vy, b.vx);

      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(angle);

      // Outer Glow
      ctx.strokeStyle = b.color;
      ctx.lineWidth = b.thickness + 2;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(-b.length, 0);
      ctx.lineTo(0, 0);
      ctx.stroke();

      // White Core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1, b.thickness - 2);
      ctx.beginPath();
      ctx.moveTo(-b.length * 0.8, 0);
      ctx.lineTo(0, 0);
      ctx.stroke();

      ctx.restore();
    }

    // 2. Render Grenades
    for (const g of this.grenades) {
      ctx.save();
      ctx.translate(g.x, g.y);

      // Grenade Shell
      ctx.fillStyle = '#15803d'; // Army Green
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();

      // Fuse cap
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-2, -10, 4, 4);

      // Flashing warning red dot
      if (Math.floor(Date.now() / 120) % 2 === 0) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}
