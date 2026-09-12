import { DestructibleProp } from '../Duo2DTypes';

export class PropsManager {
  public props: DestructibleProp[] = [];

  constructor() {
    this.buildProps();
  }

  public buildProps() {
    this.props = [];

    const GY = 880; // Main ground Y

    // 1. CRATES (Wood supply crates)
    this.props.push({
      id: 'crate_1',
      type: 'crate',
      x: 260,
      y: GY - 48,
      w: 48,
      h: 48,
      health: 40,
      maxHealth: 40,
      isDestroyed: false,
    });

    this.props.push({
      id: 'crate_2',
      type: 'crate',
      x: 310,
      y: GY - 48,
      w: 48,
      h: 48,
      health: 40,
      maxHealth: 40,
      isDestroyed: false,
    });

    this.props.push({
      id: 'crate_3',
      type: 'crate',
      x: 285,
      y: GY - 96,
      w: 48,
      h: 48,
      health: 40,
      maxHealth: 40,
      isDestroyed: false,
    });

    // Crate on mid left platform
    this.props.push({
      id: 'crate_mid_1',
      type: 'crate',
      x: 480,
      y: 660 - 48,
      w: 48,
      h: 48,
      health: 40,
      maxHealth: 40,
      isDestroyed: false,
    });

    // Crate on mid center platform
    this.props.push({
      id: 'crate_mid_2',
      type: 'crate',
      x: 1320,
      y: 670 - 48,
      w: 48,
      h: 48,
      health: 40,
      maxHealth: 40,
      isDestroyed: false,
    });

    // 2. EXPLOSIVE RED BARRELS
    this.props.push({
      id: 'barrel_1',
      type: 'barrel',
      x: 580,
      y: GY - 56,
      w: 40,
      h: 56,
      health: 30,
      maxHealth: 30,
      isDestroyed: false,
    });

    this.props.push({
      id: 'barrel_2',
      type: 'barrel',
      x: 1150,
      y: 670 - 56,
      w: 40,
      h: 56,
      health: 30,
      maxHealth: 30,
      isDestroyed: false,
    });

    this.props.push({
      id: 'barrel_3',
      type: 'barrel',
      x: 2350,
      y: GY - 56,
      w: 40,
      h: 56,
      health: 30,
      maxHealth: 30,
      isDestroyed: false,
    });

    // 3. CONCRETE HIGHWAY COVER BARRIERS (With hazard yellow/black stripes)
    this.props.push({
      id: 'barrier_1',
      type: 'barrier',
      x: 750,
      y: GY - 46,
      w: 80,
      h: 46,
      health: 120,
      maxHealth: 120,
      isDestroyed: false,
    });

    this.props.push({
      id: 'barrier_2',
      type: 'barrier',
      x: 1800,
      y: GY - 46,
      w: 80,
      h: 46,
      health: 120,
      maxHealth: 120,
      isDestroyed: false,
    });

    // 4. PARKED VEHICLE (Underpass urban cover)
    this.props.push({
      id: 'vehicle_1',
      type: 'vehicle',
      x: 1480,
      y: GY - 70,
      w: 160,
      h: 70,
      health: 250,
      maxHealth: 250,
      isDestroyed: false,
    });
  }

  public damageProp(id: string, amount: number): { destroyed: boolean; prop?: DestructibleProp } {
    const p = this.props.find((item) => item.id === id);
    if (!p || p.isDestroyed) return { destroyed: false };

    p.health -= amount;
    if (p.health <= 0) {
      p.health = 0;
      p.isDestroyed = true;
      return { destroyed: true, prop: p };
    }
    return { destroyed: false, prop: p };
  }

  public render(ctx: CanvasRenderingContext2D) {
    for (const p of this.props) {
      if (p.isDestroyed) continue;

      if (p.type === 'crate') {
        this.drawCrate(ctx, p);
      } else if (p.type === 'barrel') {
        this.drawBarrel(ctx, p);
      } else if (p.type === 'barrier') {
        this.drawBarrier(ctx, p);
      } else if (p.type === 'vehicle') {
        this.drawVehicle(ctx, p);
      }
    }
  }

  private drawCrate(ctx: CanvasRenderingContext2D, p: DestructibleProp) {
    // Wood Box Base
    ctx.fillStyle = '#b45309'; // Warm wood
    ctx.fillRect(p.x, p.y, p.w, p.h);

    // Dark Border Frame
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 4;
    ctx.strokeRect(p.x + 2, p.y + 2, p.w - 4, p.h - 4);

    // Inner X Bracing
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p.x + 4, p.y + 4);
    ctx.lineTo(p.x + p.w - 4, p.y + p.h - 4);
    ctx.moveTo(p.x + p.w - 4, p.y + 4);
    ctx.lineTo(p.x + 4, p.y + p.h - 4);
    ctx.stroke();

    // Corner metal brackets
    ctx.fillStyle = '#475569';
    const bSize = 8;
    ctx.fillRect(p.x, p.y, bSize, bSize);
    ctx.fillRect(p.x + p.w - bSize, p.y, bSize, bSize);
    ctx.fillRect(p.x, p.y + p.h - bSize, bSize, bSize);
    ctx.fillRect(p.x + p.w - bSize, p.y + p.h - bSize, bSize, bSize);
  }

  private drawBarrel(ctx: CanvasRenderingContext2D, p: DestructibleProp) {
    // Red Explosive Metal Drum
    const grad = ctx.createLinearGradient(p.x, 0, p.x + p.w, 0);
    grad.addColorStop(0, '#991b1b');
    grad.addColorStop(0.3, '#dc2626');
    grad.addColorStop(0.7, '#f87171');
    grad.addColorStop(1, '#7f1d1d');
    ctx.fillStyle = grad;

    // Rounded barrel silhouette
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, p.w, p.h, 6);
    ctx.fill();

    // Metal Rib Rings
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(p.x, p.y + 12, p.w, 5);
    ctx.fillRect(p.x, p.y + p.h - 17, p.w, 5);

    // Flame / Biohazard Symbol in Center
    ctx.fillStyle = '#fef08a'; // Bright yellow badge
    ctx.beginPath();
    ctx.arc(p.x + p.w * 0.5, p.y + p.h * 0.5, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#b91c1c';
    ctx.font = '900 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', p.x + p.w * 0.5, p.y + p.h * 0.5);
  }

  private drawBarrier(ctx: CanvasRenderingContext2D, p: DestructibleProp) {
    // Concrete Barrier (Jersey Barrier style with yellow hazard tape)
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(p.x + 10, p.y);
    ctx.lineTo(p.x + p.w - 10, p.y);
    ctx.lineTo(p.x + p.w, p.y + p.h);
    ctx.lineTo(p.x, p.y + p.h);
    ctx.closePath();
    ctx.fill();

    // Hazard Stripes across upper half
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(p.x + 8, p.y + 6);
    ctx.lineTo(p.x + p.w - 8, p.y + 6);
    ctx.lineTo(p.x + p.w - 4, p.y + 24);
    ctx.lineTo(p.x + 4, p.y + 24);
    ctx.closePath();
    ctx.clip();

    ctx.fillStyle = '#eab308';
    ctx.fillRect(p.x, p.y, p.w, p.h);

    ctx.fillStyle = '#0f172a';
    for (let sx = p.x - 20; sx < p.x + p.w + 20; sx += 24) {
      ctx.beginPath();
      ctx.moveTo(sx, p.y + 30);
      ctx.lineTo(sx + 12, p.y + 30);
      ctx.lineTo(sx + 24, p.y);
      ctx.lineTo(sx + 12, p.y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  private drawVehicle(ctx: CanvasRenderingContext2D, p: DestructibleProp) {
    // Parked Urban Sedan (Car Body)
    ctx.fillStyle = '#0369a1'; // Deep Blue
    // Lower Chassis
    ctx.beginPath();
    ctx.roundRect(p.x, p.y + 26, p.w, p.h - 26, 8);
    ctx.fill();

    // Cabin / Roof
    ctx.beginPath();
    ctx.moveTo(p.x + 35, p.y + 26);
    ctx.lineTo(p.x + 55, p.y + 6);
    ctx.lineTo(p.x + 120, p.y + 6);
    ctx.lineTo(p.x + 140, p.y + 26);
    ctx.closePath();
    ctx.fill();

    // Tinted Windows
    ctx.fillStyle = '#bae6fd';
    ctx.beginPath();
    ctx.moveTo(p.x + 40, p.y + 24);
    ctx.lineTo(p.x + 58, p.y + 10);
    ctx.lineTo(p.x + 85, p.y + 10);
    ctx.lineTo(p.x + 85, p.y + 24);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(p.x + 90, p.y + 24);
    ctx.lineTo(p.x + 90, p.y + 10);
    ctx.lineTo(p.x + 116, p.y + 10);
    ctx.lineTo(p.x + 134, p.y + 24);
    ctx.closePath();
    ctx.fill();

    // Rubber Wheels with Steel Rims
    const wRadius = 14;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(p.x + 32, p.y + p.h, wRadius, 0, Math.PI * 2);
    ctx.arc(p.x + p.w - 32, p.y + p.h, wRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(p.x + 32, p.y + p.h, wRadius * 0.45, 0, Math.PI * 2);
    ctx.arc(p.x + p.w - 32, p.y + p.h, wRadius * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Headlights
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(p.x + 2, p.y + 32, 8, 8);
    // Taillights
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(p.x + p.w - 10, p.y + 32, 8, 8);
  }
}
