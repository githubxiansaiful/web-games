import { PlatformTile, Ladder } from '../Duo2DTypes';

export class PlatformManager {
  public platforms: PlatformTile[] = [];
  public ladders: Ladder[] = [];
  public worldWidth: number = 3200;
  public worldHeight: number = 1080;
  public groundY: number = 880;

  constructor() {
    this.buildStagePlatforms();
  }

  private buildStagePlatforms() {
    this.platforms = [];
    this.ladders = [];

    const GY = this.groundY; // 880

    // 1. MAIN GROUND PLATFORM (Solid)
    this.platforms.push({
      id: 'ground_main',
      x: -500,
      y: GY,
      w: this.worldWidth + 1000,
      h: 220,
      type: 'ground',
      hazardStripes: false,
    });

    // 2. MIDDLE PLATFORMS (Concrete Ledge & Deck at Y = 660, ~220px above ground)
    // Left Middle Deck
    this.platforms.push({
      id: 'plat_mid_left',
      x: 180,
      y: 660,
      w: 620,
      h: 40,
      type: 'jump_through',
      hazardStripes: true,
    });

    // Center Middle Deck
    this.platforms.push({
      id: 'plat_mid_center',
      x: 1050,
      y: 670,
      w: 800,
      h: 40,
      type: 'jump_through',
      hazardStripes: true,
    });

    // Right Middle Deck
    this.platforms.push({
      id: 'plat_mid_right',
      x: 2150,
      y: 650,
      w: 750,
      h: 40,
      type: 'jump_through',
      hazardStripes: true,
    });

    // 3. UPPER PLATFORMS (Steel Girder Catwalks at Y = 460, ~420px above ground)
    // Upper Left High Catwalk
    this.platforms.push({
      id: 'plat_high_left',
      x: 350,
      y: 460,
      w: 480,
      h: 30,
      type: 'jump_through',
      hazardStripes: true,
    });

    // Upper Center Bridge
    this.platforms.push({
      id: 'plat_high_center',
      x: 1250,
      y: 440,
      w: 520,
      h: 30,
      type: 'jump_through',
      hazardStripes: true,
    });

    // Upper Right Rooftop
    this.platforms.push({
      id: 'plat_high_right',
      x: 2300,
      y: 450,
      w: 500,
      h: 30,
      type: 'jump_through',
      hazardStripes: true,
    });

    // 4. LADDERS (Connecting Ground -> Mid, and Mid -> High)
    // Ladder 1: Ground to Left Mid Deck
    this.ladders.push({
      id: 'ladder_1',
      x: 380,
      topY: 660,
      bottomY: GY,
      w: 36,
    });

    // Ladder 2: Left Mid Deck to Left High Catwalk
    this.ladders.push({
      id: 'ladder_2',
      x: 720,
      topY: 460,
      bottomY: 660,
      w: 36,
    });

    // Ladder 3: Ground to Center Mid Deck
    this.ladders.push({
      id: 'ladder_3',
      x: 1450,
      topY: 670,
      bottomY: GY,
      w: 36,
    });

    // Ladder 4: Center Mid Deck to Center High Bridge
    this.ladders.push({
      id: 'ladder_4',
      x: 1650,
      topY: 440,
      bottomY: 670,
      w: 36,
    });

    // Ladder 5: Ground to Right Mid Deck
    this.ladders.push({
      id: 'ladder_5',
      x: 2450,
      topY: 650,
      bottomY: GY,
      w: 36,
    });
  }

  public render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number) {
    // 1. Draw Ladders First (Behind platforms)
    for (const lad of this.ladders) {
      this.drawLadder(ctx, lad);
    }

    // 2. Draw Platforms
    for (const p of this.platforms) {
      this.drawPlatform(ctx, p);
    }
  }

  private drawPlatform(ctx: CanvasRenderingContext2D, p: PlatformTile) {
    if (p.type === 'ground') {
      // Main Ground Deck (Detailed Road Asphalt & Concrete Curb)
      const grad = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
      grad.addColorStop(0, '#1e293b'); // Dark asphalt
      grad.addColorStop(0.3, '#0f172a');
      grad.addColorStop(1, '#050b14');
      ctx.fillStyle = grad;
      ctx.fillRect(p.x, p.y, p.w, p.h);

      // Top Concrete Curb
      ctx.fillStyle = '#64748b';
      ctx.fillRect(p.x, p.y, p.w, 8);

      // Road Dash Lines
      ctx.fillStyle = 'rgba(250, 204, 21, 0.45)'; // Yellow road dashes
      for (let rx = p.x; rx < p.x + p.w; rx += 140) {
        ctx.fillRect(rx, p.y + 60, 70, 8);
      }
    } else {
      // Elevated Concrete / Metal Platform
      // Platform Body
      ctx.fillStyle = '#334155';
      ctx.fillRect(p.x, p.y, p.w, p.h);

      // Under-beam shadow
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(p.x, p.y + p.h - 8, p.w, 8);

      // Top Edge Hazard Warning Stripes (Yellow and Black Diagonal)
      if (p.hazardStripes) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(p.x, p.y, p.w, 10);
        ctx.clip();

        ctx.fillStyle = '#eab308'; // Safety Yellow
        ctx.fillRect(p.x, p.y, p.w, 10);

        ctx.fillStyle = '#0f172a'; // Black hazard stripes
        const stripeW = 14;
        for (let sx = p.x - 20; sx < p.x + p.w + 20; sx += stripeW * 2) {
          ctx.beginPath();
          ctx.moveTo(sx, p.y + 10);
          ctx.lineTo(sx + stripeW, p.y + 10);
          ctx.lineTo(sx + stripeW + 10, p.y);
          ctx.lineTo(sx + 10, p.y);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // Metal Rivets / Fasteners along the beam
      ctx.fillStyle = '#94a3b8';
      for (let rx = p.x + 25; rx < p.x + p.w - 15; rx += 60) {
        ctx.beginPath();
        ctx.arc(rx, p.y + p.h - 14, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Vertical Structural Support Girders beneath elevated decks
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(p.x + 30, p.y + p.h, 16, 70);
      ctx.fillRect(p.x + p.w - 46, p.y + p.h, 16, 70);
    }
  }

  private drawLadder(ctx: CanvasRenderingContext2D, lad: Ladder) {
    const rungs = Math.floor((lad.bottomY - lad.topY) / 18);
    const sideW = 5;

    // Steel Vertical Rails
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(lad.x, lad.topY, sideW, lad.bottomY - lad.topY);
    ctx.fillRect(lad.x + lad.w - sideW, lad.topY, sideW, lad.bottomY - lad.topY);

    // Rail Highlights
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(lad.x + 1, lad.topY, 2, lad.bottomY - lad.topY);
    ctx.fillRect(lad.x + lad.w - sideW + 1, lad.topY, 2, lad.bottomY - lad.topY);

    // Horizontal Steel Rungs
    ctx.fillStyle = '#e2e8f0';
    for (let i = 0; i <= rungs; i++) {
      const ry = lad.topY + i * 18;
      ctx.fillRect(lad.x + sideW, ry, lad.w - sideW * 2, 4);
    }
  }

  public getLadderAt(x: number, y: number): Ladder | null {
    for (const l of this.ladders) {
      if (x >= l.x - 15 && x <= l.x + l.w + 15 && y >= l.topY - 30 && y <= l.bottomY + 10) {
        return l;
      }
    }
    return null;
  }
}
