/**
 * DUO RAMPAGE - Layer 1: Daytime Far Skyline
 * Renders a vibrant, sunny daytime Dhaka skyline with suspension bridge,
 * clouds, and subtle atmospheric sunbeams.
 */

export class DaytimeSkylineLayer {
  private clouds: Array<{ x: number; y: number; speed: number; scale: number }> = [];

  constructor() {
    // Seed clouds
    for (let i = 0; i < 8; i++) {
      this.clouds.push({
        x: Math.random() * 3000,
        y: 40 + Math.random() * 160,
        speed: 8 + Math.random() * 12,
        scale: 0.8 + Math.random() * 0.8,
      });
    }
  }

  public update(dt: number) {
    for (const c of this.clouds) {
      c.x += c.speed * dt;
      if (c.x > 3200) c.x = -400;
    }
  }

  public render(ctx: CanvasRenderingContext2D, width: number, height: number, cameraX: number) {
    // 1. Daytime Sky Gradient (Vibrant Dhaka morning/afternoon sun)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#1e68d7'); // Rich celestial blue
    skyGrad.addColorStop(0.35, '#38bdf8'); // Sky cyan
    skyGrad.addColorStop(0.7, '#bae6fd'); // Soft atmospheric blue
    skyGrad.addColorStop(1, '#fef08a'); // Warm sunny horizon glow
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Sunlight Disk & God Rays
    const sunX = width * 0.72 - cameraX * 0.02;
    const sunY = height * 0.22;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 260);
    sunGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    sunGrad.addColorStop(0.2, 'rgba(254, 240, 138, 0.6)');
    sunGrad.addColorStop(0.6, 'rgba(253, 186, 116, 0.2)');
    sunGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 260, 0, Math.PI * 2);
    ctx.fill();

    // 3. Clouds (Layer 1 Parallax ~ 0.06)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    for (const c of this.clouds) {
      const renderX = (c.x - cameraX * 0.06) % (width + 600) - 200;
      this.drawCloud(ctx, renderX, c.y, c.scale);
    }

    // 4. Distant Dhaka Skyline & Iconic Suspension Bridge (Parallax 0.12)
    const parallaxOffset = cameraX * 0.12;
    ctx.save();
    ctx.translate(-parallaxOffset, 0);

    // Far Skyline Silhouettes (Steel blue / lavender silhouette)
    ctx.fillStyle = 'rgba(71, 108, 160, 0.45)';
    this.drawSkylineBuildings(ctx, height, 0, 3600);

    // Iconic Suspension Bridge (Padma / Meghna style cable-stay bridge spanning horizon)
    this.drawSuspensionBridge(ctx, height, 200);
    this.drawSuspensionBridge(ctx, height, 1800);

    ctx.restore();
  }

  private drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.arc(28, -10, 38, 0, Math.PI * 2);
    ctx.arc(65, -6, 32, 0, Math.PI * 2);
    ctx.arc(95, 2, 24, 0, Math.PI * 2);
    ctx.arc(45, 12, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawSkylineBuildings(ctx: CanvasRenderingContext2D, height: number, startX: number, endX: number) {
    ctx.beginPath();
    let currentX = startX;
    const baseY = height * 0.76;

    while (currentX < endX) {
      const bWidth = 40 + (currentX % 70);
      const bHeight = 90 + ((currentX * 13) % 150);
      ctx.rect(currentX, baseY - bHeight, bWidth, bHeight + 200);

      // Antenna / Spire on some buildings
      if (currentX % 140 < 50) {
        ctx.rect(currentX + bWidth * 0.5 - 2, baseY - bHeight - 35, 4, 35);
      }
      currentX += bWidth + 12;
    }
    ctx.fill();
  }

  private drawSuspensionBridge(ctx: CanvasRenderingContext2D, height: number, bridgeX: number) {
    const bridgeY = height * 0.68;
    ctx.strokeStyle = 'rgba(56, 92, 142, 0.65)';
    ctx.lineWidth = 4;

    // Dual Pylons
    const pylon1X = bridgeX + 240;
    const pylon2X = bridgeX + 680;
    const pylonTopY = bridgeY - 180;

    // Tower 1
    ctx.beginPath();
    ctx.moveTo(pylon1X - 16, bridgeY + 40);
    ctx.lineTo(pylon1X, pylonTopY);
    ctx.lineTo(pylon1X + 16, bridgeY + 40);
    ctx.stroke();

    // Tower 2
    ctx.beginPath();
    ctx.moveTo(pylon2X - 16, bridgeY + 40);
    ctx.lineTo(pylon2X, pylonTopY);
    ctx.lineTo(pylon2X + 16, bridgeY + 40);
    ctx.stroke();

    // Main Suspension Cable
    ctx.beginPath();
    ctx.moveTo(bridgeX, bridgeY);
    ctx.quadraticCurveTo(pylon1X, pylonTopY, (pylon1X + pylon2X) / 2, bridgeY - 30);
    ctx.quadraticCurveTo(pylon2X, pylonTopY, bridgeX + 920, bridgeY);
    ctx.stroke();

    // Cable Stay Lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(70, 110, 165, 0.4)';
    for (let i = 1; i <= 8; i++) {
      const t = i / 9;
      // Cable 1
      ctx.beginPath();
      ctx.moveTo(pylon1X, pylonTopY + 15);
      ctx.lineTo(bridgeX + 240 * t, bridgeY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(pylon1X, pylonTopY + 15);
      ctx.lineTo(pylon1X + 220 * t, bridgeY);
      ctx.stroke();

      // Cable 2
      ctx.beginPath();
      ctx.moveTo(pylon2X, pylonTopY + 15);
      ctx.lineTo(pylon1X + 220 + 220 * t, bridgeY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(pylon2X, pylonTopY + 15);
      ctx.lineTo(pylon2X + 240 * t, bridgeY);
      ctx.stroke();
    }

    // Bridge Deck
    ctx.fillStyle = 'rgba(45, 80, 125, 0.85)';
    ctx.fillRect(bridgeX - 40, bridgeY, 1000, 14);
  }
}
