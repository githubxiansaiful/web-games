/**
 * DUO RAMPAGE - Layer 2: Urban Midground
 * Elevated Flyover Expressway, City Buildings, Billboards, Power Lines, and Dhaka Architecture.
 * Parallax speed: ~0.35.
 */

export class UrbanMidgroundLayer {
  private trafficVehicles: Array<{ x: number; speed: number; color: string; isTruck: boolean }> = [];

  constructor() {
    // Seed background traffic on the elevated expressway
    for (let i = 0; i < 5; i++) {
      this.trafficVehicles.push({
        x: i * 500 + Math.random() * 200,
        speed: 40 + Math.random() * 30,
        color: ['#e11d48', '#2563eb', '#ca8a04', '#16a34a', '#475569'][i % 5],
        isTruck: i % 3 === 0,
      });
    }
  }

  public update(dt: number) {
    for (const v of this.trafficVehicles) {
      v.x += v.speed * dt;
      if (v.x > 3600) v.x = -200;
    }
  }

  public render(ctx: CanvasRenderingContext2D, width: number, height: number, cameraX: number) {
    const parallaxOffset = cameraX * 0.35;
    ctx.save();
    ctx.translate(-parallaxOffset, 0);

    const groundY = height * 0.82;
    const flyoverY = height * 0.52;

    // 1. Midground Brick & Concrete Buildings
    this.drawMidgroundBuildings(ctx, groundY);

    // 2. Elevated Flyover Expressway
    this.drawFlyoverExpressway(ctx, flyoverY, groundY);

    // 3. Dhaka Billboards & Neon Signboards
    this.drawBillboards(ctx, flyoverY);

    // 4. Utility Power Poles & Hanging Overhead Cables
    this.drawUtilityPoles(ctx, groundY);

    ctx.restore();
  }

  private drawMidgroundBuildings(ctx: CanvasRenderingContext2D, groundY: number) {
    const buildingColors = ['#334155', '#1e293b', '#475569', '#3f3f46', '#27272a'];
    const accentColors = ['#0284c7', '#059669', '#d97706', '#dc2626'];

    for (let x = -200; x < 3800; x += 320) {
      const bW = 260 + (Math.abs(x) % 100);
      const bH = 280 + (Math.abs(x * 7) % 200);
      const color = buildingColors[Math.abs(Math.floor(x / 300)) % buildingColors.length];

      // Building Body
      ctx.fillStyle = color;
      ctx.fillRect(x, groundY - bH, bW, bH + 200);

      // Shadow / Depth edge
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(x + bW - 20, groundY - bH, 20, bH + 200);

      // Rooftop Water Tanks & Antennas (Classic Dhaka Skyline detail)
      ctx.fillStyle = '#0284c7'; // Blue water tank
      ctx.fillRect(x + 30, groundY - bH - 30, 28, 30);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(x + 70, groundY - bH - 45, 4, 45); // Antenna

      // Windows Grid (daylight reflections)
      ctx.fillStyle = 'rgba(186, 230, 253, 0.45)';
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 4; c++) {
          ctx.fillRect(x + 25 + c * 55, groundY - bH + 35 + r * 50, 32, 28);
        }
      }
    }
  }

  private drawFlyoverExpressway(ctx: CanvasRenderingContext2D, flyoverY: number, groundY: number) {
    // Heavy Concrete Pillars supporting flyover
    ctx.fillStyle = '#334155';
    for (let px = -100; px < 3800; px += 450) {
      ctx.fillRect(px, flyoverY + 28, 55, groundY - flyoverY);
      // Pillar Cap
      ctx.fillStyle = '#475569';
      ctx.fillRect(px - 15, flyoverY + 28, 85, 18);
      ctx.fillStyle = '#334155';
    }

    // Concrete Flyover Girder Deck
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-400, flyoverY, 4400, 32);

    // Flyover Guardrail (Safety barrier)
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-400, flyoverY - 14, 4400, 14);

    // Flyover Traffic
    for (const v of this.trafficVehicles) {
      ctx.fillStyle = v.color;
      if (v.isTruck) {
        ctx.fillRect(v.x, flyoverY - 32, 70, 20);
        // Cab
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(v.x + 50, flyoverY - 26, 20, 14);
      } else {
        // Car
        ctx.fillRect(v.x, flyoverY - 22, 45, 14);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(v.x + 10, flyoverY - 30, 24, 8); // Car Roof
      }
    }
  }

  private drawBillboards(ctx: CanvasRenderingContext2D, flyoverY: number) {
    // 1. DHAKA NEVER GIVES UP Billboard
    const bb1X = 520;
    const bb1Y = flyoverY - 140;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(bb1X, bb1Y, 260, 95);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#38bdf8';
    ctx.strokeRect(bb1X, bb1Y, 260, 95);

    // Neon / Daylight text
    ctx.font = '900 24px "Rajdhani", sans-serif';
    ctx.fillStyle = '#f43f5e';
    ctx.textAlign = 'center';
    ctx.fillText('DHAKA', bb1X + 130, bb1Y + 42);

    ctx.font = '700 13px "Rajdhani", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('NEVER GIVES UP', bb1X + 130, bb1Y + 68);

    // Legs of billboard
    ctx.fillStyle = '#475569';
    ctx.fillRect(bb1X + 40, bb1Y + 95, 12, 45);
    ctx.fillRect(bb1X + 210, bb1Y + 95, 12, 45);

    // 2. STRONGER TOGETHER Billboard
    const bb2X = 1750;
    const bb2Y = flyoverY - 130;
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(bb2X, bb2Y, 240, 80);
    ctx.strokeStyle = '#facc15';
    ctx.strokeRect(bb2X, bb2Y, 240, 80);

    ctx.font = '900 18px "Rajdhani", sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.fillText('STRONGER TOGETHER', bb2X + 120, bb2Y + 38);
    ctx.font = '700 12px "Rajdhani", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('DUO RAMPAGE CO-OP', bb2X + 120, bb2Y + 60);

    ctx.fillRect(bb2X + 35, bb2Y + 80, 10, 50);
    ctx.fillRect(bb2X + 195, bb2Y + 80, 10, 50);
  }

  private drawUtilityPoles(ctx: CanvasRenderingContext2D, groundY: number) {
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
    ctx.lineWidth = 1.5;

    // Power Lines
    ctx.beginPath();
    ctx.moveTo(-200, groundY - 260);
    for (let px = 200; px < 3800; px += 500) {
      ctx.quadraticCurveTo(px - 250, groundY - 230, px, groundY - 260);
    }
    ctx.stroke();

    // Wooden / Concrete Utility Poles
    for (let px = 200; px < 3800; px += 500) {
      ctx.fillStyle = '#475569';
      ctx.fillRect(px - 4, groundY - 280, 8, 280);
      // Crossarm
      ctx.fillStyle = '#64748b';
      ctx.fillRect(px - 30, groundY - 275, 60, 8);
    }
  }
}
