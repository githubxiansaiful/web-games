import { Particle2D, FloatingText2D } from '../Duo2DTypes';

export class ParticleEngine2D {
  public particles: Particle2D[] = [];
  public floatingTexts: FloatingText2D[] = [];

  public update(dt: number) {
    // 1. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.gravity) {
        p.vy += p.gravity * dt;
      }

      if (p.vRot && p.rotation !== undefined) {
        p.rotation += p.vRot * dt;
      }

      if (p.sizeGrowth) {
        p.size += p.sizeGrowth * dt;
      }

      p.alpha -= p.decay * dt;

      if (p.alpha <= 0 || p.size <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 2. Update Floating Damage Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.x += t.vx * dt;
      t.y += t.vy * dt;
      t.alpha -= 0.8 * dt;

      if (t.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    // 1. Render Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));

      if (p.type === 'shockwave') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'shell') {
        // Spent bullet casing
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size * 0.5, -p.size * 0.25, p.size, p.size * 0.5);
      } else {
        // Spark / Fire / Smoke circle
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 2. Render Floating Damage Numbers
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const t of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, t.alpha));
      ctx.font = `${t.bold ? '900' : '700'} ${t.size}px "Rajdhani", sans-serif`;

      // Text Outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeText(t.text, t.x, t.y);

      // Main Color
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }
  }

  // --- Particle Spawners ---

  public spawnMuzzleFlash(x: number, y: number, facing: 1 | -1) {
    // Starburst Flash
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * 80 + facing * 90,
        vy: Math.sin(angle) * 80,
        color: i % 2 === 0 ? '#fef08a' : '#f97316',
        alpha: 1,
        decay: 14,
        size: 7,
        sizeGrowth: -12,
      });
    }

    // Spent Brass Casing
    this.particles.push({
      x: x - facing * 8,
      y: y - 4,
      vx: -facing * (70 + Math.random() * 40),
      vy: -140 - Math.random() * 60,
      gravity: 520,
      rotation: Math.random() * Math.PI,
      vRot: (Math.random() - 0.5) * 20,
      color: '#fbbf24',
      alpha: 1,
      decay: 0.9,
      size: 6,
      type: 'shell',
    });
  }

  public spawnHitSparks(x: number, y: number, color: string = '#fde047', count: number = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 70 + Math.random() * 180;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 280,
        color,
        alpha: 1,
        decay: 4 + Math.random() * 3,
        size: 3 + Math.random() * 3,
      });
    }
  }

  public spawnExplosion(x: number, y: number, radius: number = 120) {
    // 1. Shockwave Ring
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      color: '#fef08a',
      alpha: 1,
      decay: 2.5,
      size: 15,
      sizeGrowth: radius * 3.5,
      type: 'shockwave',
    });

    // 2. Fireballs
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (radius * 0.7);
      const colors = ['#ffffff', '#fef08a', '#f97316', '#ef4444', '#dc2626'];
      this.particles.push({
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        vx: Math.cos(angle) * (120 + Math.random() * 260),
        vy: Math.sin(angle) * (120 + Math.random() * 260),
        gravity: 120,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 1.8 + Math.random() * 1.5,
        size: 16 + Math.random() * 22,
        sizeGrowth: -10,
        type: 'fire',
      });
    }

    // 3. Heavy Dark Smoke Puffs
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * (60 + Math.random() * 140),
        vy: -80 - Math.random() * 120, // Rises
        color: 'rgba(30, 41, 59, 0.8)',
        alpha: 0.9,
        decay: 0.8 + Math.random() * 0.6,
        size: 20 + Math.random() * 25,
        sizeGrowth: 15,
        type: 'smoke',
      });
    }

    // 4. Shrapnel / Debris
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 180 + Math.random() * 320;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 480,
        color: i % 2 === 0 ? '#475569' : '#b45309',
        alpha: 1,
        decay: 1.2,
        size: 5 + Math.random() * 4,
        type: 'debris',
      });
    }
  }

  public spawnDamageText(text: string, x: number, y: number, color: string = '#ffffff', bold: boolean = false, size: number = 22) {
    this.floatingTexts.push({
      text,
      x: x + (Math.random() - 0.5) * 20,
      y: y - 10,
      vx: (Math.random() - 0.5) * 40,
      vy: -75 - Math.random() * 35,
      alpha: 1,
      color,
      bold,
      size,
    });
  }
}
