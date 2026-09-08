import {
  FloatingText,
  Hazard,
  LevelData,
  MovingPlatform,
  Particle,
  PlayerState,
} from './types';

export class GameRenderer {
  public cameraX: number = 0;
  public cameraY: number = 0;
  public shakeIntensity: number = 0;
  private animTime: number = 0;

  public getMobileZoom(viewWidth: number, viewHeight: number): number {
    if (viewWidth < 768) {
      // In portrait or small mobile screen, zoom out slightly so player has great field of view
      return Math.max(0.72, Math.min(1.0, viewWidth / 700));
    }
    if (viewHeight < 450) {
      // In mobile landscape with low height
      return Math.max(0.78, Math.min(1.0, viewHeight / 440));
    }
    return 1.0;
  }

  public updateCamera(
    player: PlayerState,
    level: LevelData,
    viewWidth: number,
    viewHeight: number,
    dt: number
  ) {
    this.animTime += dt;

    if (this.shakeIntensity > 0) {
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 25);
    }

    const zoom = this.getMobileZoom(viewWidth, viewHeight);
    const effW = viewWidth / zoom;
    const effH = viewHeight / zoom;

    // Lookahead in facing direction
    const lookaheadX = player.facing * 60;
    const targetX = player.x + player.width / 2 + lookaheadX - effW / 2;
    const targetY = player.y + player.height / 2 - effH / 2 - 35;

    // Smooth exponential lerp
    const lerpRate = 1 - Math.exp(-8 * dt);
    this.cameraX += (targetX - this.cameraX) * lerpRate;
    this.cameraY += (targetY - this.cameraY) * lerpRate;

    // Clamp camera to level edges
    const maxCamX = Math.max(0, level.width - effW);
    const maxCamY = Math.max(0, level.height - effH);

    this.cameraX = Math.max(0, Math.min(maxCamX, this.cameraX));
    this.cameraY = Math.max(0, Math.min(maxCamY, this.cameraY));
  }

  public triggerScreenShake(intensity: number = 8) {
    this.shakeIntensity = intensity;
  }

  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    player: PlayerState,
    level: LevelData,
    particles: Particle[],
    floatingTexts: FloatingText[],
    localPlayerColor: string = '#06b6d4',
    localPlayerName: string = 'You',
    localPlayerId: string = 'local',
    remotePlayers?: Map<string, any>,
    leaderId?: string | null,
    localEmote?: { emoji: string; timer: number } | null
  ) {
    ctx.clearRect(0, 0, width, height);

    const zoom = this.getMobileZoom(width, height);
    const effW = width / zoom;
    const effH = height / zoom;

    // Camera shake offset
    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeIntensity > 0) {
      shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
    }

    ctx.save();
    ctx.scale(zoom, zoom);

    // ==========================================
    // 1. PARALLAX SKY & BACKGROUND
    // ==========================================
    this.drawSky(ctx, effW, effH, level.theme.skyGradient);
    this.drawMountains(ctx, effW, effH, level.theme.mountainColor, this.cameraX * 0.12);
    this.drawHills(ctx, effW, effH, level.theme.hillColor, this.cameraX * 0.28);

    // ==========================================
    // 2. WORLD SPACE (Camera Transform & Culling)
    // ==========================================
    ctx.save();
    ctx.translate(-Math.floor(this.cameraX + shakeX), -Math.floor(this.cameraY + shakeY));

    // Viewport frustum culling bounds (skip drawing offscreen entities for 3x higher mobile FPS)
    const cullMinX = this.cameraX - 80;
    const cullMaxX = this.cameraX + effW + 80;

    // Moving Platform Tracks (dashed path lines)
    this.drawMovingPlatformTracks(ctx, level.movingPlatforms, cullMinX, cullMaxX);

    // Checkpoints
    this.drawCheckpoints(ctx, level, cullMinX, cullMaxX);

    // Springs
    if (level.springs) {
      this.drawSprings(ctx, level, cullMinX, cullMaxX);
    }

    // Goal Flag
    this.drawGoalFlag(ctx, level);

    // Static Platforms & Terrain
    this.drawPlatforms(ctx, level, cullMinX, cullMaxX);

    // Moving Platforms
    this.drawMovingPlatforms(ctx, level.movingPlatforms, level.theme.accentColor, cullMinX, cullMaxX);

    // Hazards
    this.drawHazards(ctx, level.hazards, cullMinX, cullMaxX);

    // Coins
    this.drawCoins(ctx, level.coins, cullMinX, cullMaxX);

    // Particles
    this.drawParticles(ctx, particles);

    // Remote Players (Multiplayer)
    if (remotePlayers) {
      for (const [id, rp] of remotePlayers.entries()) {
        if (!rp.isDead) {
          const isLeader = leaderId === id;
          this.drawPlayerVisual(
            ctx,
            rp.x,
            rp.y,
            rp.facing,
            rp.squashX || 1,
            rp.squashY || 1,
            rp.width || 28,
            rp.height || 38,
            rp.vx,
            rp.grounded,
            rp.canDoubleJump ?? false,
            rp.color || '#ec4899',
            rp.name || 'Rival',
            isLeader,
            rp.currentEmote?.emoji,
            0,
            rp.trail || []
          );
        }
      }
    }

    // Local Player
    if (!player.isDead) {
      const isLeader = leaderId === 'local' || leaderId === localPlayerId;
      this.drawPlayerVisual(
        ctx,
        player.x,
        player.y,
        player.facing,
        player.squashX,
        player.squashY,
        player.width,
        player.height,
        player.vx,
        player.grounded,
        player.canDoubleJump,
        localPlayerColor,
        localPlayerName,
        isLeader,
        localEmote?.emoji,
        player.invulnerableTimer,
        player.trail
      );
    }

    // Floating combat / score texts
    this.drawFloatingTexts(ctx, floatingTexts);

    ctx.restore(); // restore camera transform
    ctx.restore(); // restore zoom transform
  }

  private drawSky(ctx: CanvasRenderingContext2D, w: number, h: number, colors: [string, string, string]) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, colors[0]);
    grad.addColorStop(0.6, colors[1]);
    grad.addColorStop(1, colors[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle clouds or stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    for (let i = 0; i < 6; i++) {
      const cx = ((i * 320 - this.cameraX * 0.05) % (w + 400)) - 100;
      const cy = 60 + (i % 3) * 45;
      ctx.beginPath();
      ctx.arc(cx, cy, 32, 0, Math.PI * 2);
      ctx.arc(cx + 25, cy - 8, 38, 0, Math.PI * 2);
      ctx.arc(cx + 55, cy, 30, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawMountains(ctx: CanvasRenderingContext2D, w: number, h: number, color: string, offsetX: number) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, h);

    const mWidth = 260;
    const count = Math.ceil(w / mWidth) + 2;
    const startIdx = Math.floor(offsetX / mWidth) - 1;

    for (let i = startIdx; i < startIdx + count; i++) {
      const peakX = i * mWidth - offsetX + mWidth / 2;
      const peakY = h * 0.45 + ((i * 73) % 90);
      ctx.lineTo(peakX - mWidth / 2, h);
      ctx.lineTo(peakX, peakY);
      ctx.lineTo(peakX + mWidth / 2, h);
    }

    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  }

  private drawHills(ctx: CanvasRenderingContext2D, w: number, h: number, color: string, offsetX: number) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, h);

    const hWidth = 200;
    const count = Math.ceil(w / hWidth) + 2;
    const startIdx = Math.floor(offsetX / hWidth) - 1;

    for (let i = startIdx; i < startIdx + count; i++) {
      const x = i * hWidth - offsetX;
      const cy = h * 0.65 + ((i * 47) % 40);
      ctx.quadraticCurveTo(x + hWidth / 2, cy - 45, x + hWidth, cy + 20);
    }

    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  }

  private drawMovingPlatformTracks(
    ctx: CanvasRenderingContext2D,
    platforms: MovingPlatform[],
    cullMinX?: number,
    cullMaxX?: number
  ) {
    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 2;

    for (const p of platforms) {
      if (cullMinX !== undefined && cullMaxX !== undefined) {
        const minTrackX = Math.min(p.startX, p.endX) - 10;
        const maxTrackX = Math.max(p.startX, p.endX) + p.width + 10;
        if (maxTrackX < cullMinX || minTrackX > cullMaxX) continue;
      }

      ctx.beginPath();
      ctx.moveTo(p.startX + p.width / 2, p.startY + p.height / 2);
      ctx.lineTo(p.endX + p.width / 2, p.endY + p.height / 2);
      ctx.stroke();

      // Path endpoints
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(p.startX + p.width / 2, p.startY + p.height / 2, 4, 0, Math.PI * 2);
      ctx.arc(p.endX + p.width / 2, p.endY + p.height / 2, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawPlatforms(
    ctx: CanvasRenderingContext2D,
    level: LevelData,
    cullMinX?: number,
    cullMaxX?: number
  ) {
    const { groundTopColor, groundBodyColor, platformColor, platformAccent } = level.theme;

    for (const p of level.platforms) {
      // Frustum culling: Skip offscreen platforms
      if (cullMinX !== undefined && cullMaxX !== undefined) {
        if (p.x + p.width < cullMinX || p.x > cullMaxX) continue;
      }

      if (p.type === 'ground') {
        // Thick main ground with styled top grass/lip
        ctx.fillStyle = groundBodyColor;
        ctx.fillRect(p.x, p.y, p.width, p.height);

        // Ground top edge
        ctx.fillStyle = groundTopColor;
        ctx.fillRect(p.x, p.y, p.width, 10);

        // Hanging grass/detail tufts
        ctx.beginPath();
        for (let x = p.x + 8; x < p.x + p.width - 8; x += 22) {
          ctx.moveTo(x, p.y + 10);
          ctx.lineTo(x + 5, p.y + 16);
          ctx.lineTo(x + 10, p.y + 10);
        }
        ctx.fill();
      } else {
        // Floating platform / stone block
        ctx.fillStyle = platformColor;
        this.roundRect(ctx, p.x, p.y, p.width, p.height, 6);
        ctx.fill();

        // Top highlight
        ctx.fillStyle = platformAccent;
        this.roundRect(ctx, p.x, p.y, p.width, 6, [6, 6, 0, 0]);
        ctx.fill();

        // Platform border highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1.5;
        this.roundRect(ctx, p.x, p.y, p.width, p.height, 6);
        ctx.stroke();
      }
    }
  }

  private drawMovingPlatforms(
    ctx: CanvasRenderingContext2D,
    platforms: MovingPlatform[],
    accentColor: string,
    cullMinX?: number,
    cullMaxX?: number
  ) {
    for (const p of platforms) {
      // Frustum culling: Skip offscreen moving platforms
      if (cullMinX !== undefined && cullMaxX !== undefined) {
        if (p.x + p.width < cullMinX || p.x > cullMaxX) continue;
      }

      // Platform body
      ctx.fillStyle = '#334155';
      this.roundRect(ctx, p.x, p.y, p.width, p.height, 6);
      ctx.fill();

      // Glowing top strip
      ctx.fillStyle = accentColor;
      this.roundRect(ctx, p.x + 2, p.y, p.width - 4, 4, [4, 4, 0, 0]);
      ctx.fill();

      // Mechanical core / chevron indicators
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      const midX = p.x + p.width / 2;
      const midY = p.y + p.height / 2 + 1;
      ctx.beginPath();
      ctx.arc(midX - 12, midY, 2.5, 0, Math.PI * 2);
      ctx.arc(midX, midY, 3, 0, Math.PI * 2);
      ctx.arc(midX + 12, midY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Border outline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1.5;
      this.roundRect(ctx, p.x, p.y, p.width, p.height, 6);
      ctx.stroke();
    }
  }

  private drawCoins(
    ctx: CanvasRenderingContext2D,
    coins: any[],
    cullMinX?: number,
    cullMaxX?: number
  ) {
    for (const c of coins) {
      if (c.collected) continue;

      // Frustum culling: Skip offscreen coins
      if (cullMinX !== undefined && cullMaxX !== undefined) {
        if (c.x + c.radius < cullMinX || c.x - c.radius > cullMaxX) continue;
      }

      const bobY = Math.sin(this.animTime * 3.5 + c.animOffset) * 5;
      const spinScaleX = Math.cos(this.animTime * 4.5 + c.animOffset);

      ctx.save();
      ctx.translate(c.x, c.y + bobY);
      ctx.scale(Math.abs(spinScaleX), 1);

      // Fast zero-cost glow halo (avoids mobile Safari Gaussian blur lag)
      ctx.fillStyle = 'rgba(250, 204, 21, 0.22)';
      ctx.beginPath();
      ctx.arc(0, 0, c.radius + 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Coin base gold
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
      ctx.fill();

      // Inner coin ring
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(0, 0, c.radius * 0.75, 0, Math.PI * 2);
      ctx.fill();

      // Center star / symbol
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, c.radius * 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  private drawHazards(
    ctx: CanvasRenderingContext2D,
    hazards: Hazard[],
    cullMinX?: number,
    cullMaxX?: number
  ) {
    for (const h of hazards) {
      // Frustum culling: Skip offscreen hazards
      if (cullMinX !== undefined && cullMaxX !== undefined) {
        if (h.x + h.width < cullMinX || h.x > cullMaxX) continue;
      }

      if (h.type === 'spike_up') {
        const spikeCount = Math.max(1, Math.floor(h.width / 18));
        const sWidth = h.width / spikeCount;

        for (let i = 0; i < spikeCount; i++) {
          const sx = h.x + i * sWidth;
          const sy = h.y + h.height;

          // Spike gradient
          const grad = ctx.createLinearGradient(sx, sy, sx, h.y);
          grad.addColorStop(0, '#475569');
          grad.addColorStop(0.7, '#cbd5e1');
          grad.addColorStop(1, '#ef4444'); // Crimson warning tip

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + sWidth / 2, h.y);
          ctx.lineTo(sx + sWidth, sy);
          ctx.closePath();
          ctx.fill();

          // Spike shine line
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(sx + sWidth / 2, h.y);
          ctx.lineTo(sx + sWidth / 2, sy);
          ctx.stroke();
        }
      } else if (h.type === 'saw') {
        const cx = h.x + h.width / 2;
        const cy = h.y + h.height / 2;
        const r = h.width / 2;
        const rot = h.rotation || 0;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);

        // Saw blade teeth
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        const teeth = 8;
        for (let i = 0; i < teeth; i++) {
          const a = (i * Math.PI * 2) / teeth;
          const aNext = ((i + 0.5) * Math.PI * 2) / teeth;
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          ctx.lineTo(Math.cos(aNext) * (r * 0.75), Math.sin(aNext) * (r * 0.75));
        }
        ctx.closePath();
        ctx.fill();

        // Inner metallic plate
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // Center bolt
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      } else if (h.type === 'slime') {
        // Cute bouncy crawling slime
        const bounce = Math.abs(Math.sin(this.animTime * 6)) * 4;
        const sx = h.x;
        const sy = h.y + bounce;
        const sw = h.width;
        const sh = h.height - bounce;

        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.ellipse(sx + sw / 2, sy + sh * 0.6, sw / 2, sh / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Slime eyes
        const eyeOffset = (h.direction || 1) * 4;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sx + sw / 2 + eyeOffset - 4, sy + sh * 0.45, 3.5, 0, Math.PI * 2);
        ctx.arc(sx + sw / 2 + eyeOffset + 4, sy + sh * 0.45, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.arc(sx + sw / 2 + eyeOffset - 4 + (h.direction || 1), sy + sh * 0.45, 1.8, 0, Math.PI * 2);
        ctx.arc(sx + sw / 2 + eyeOffset + 4 + (h.direction || 1), sy + sh * 0.45, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawSprings(
    ctx: CanvasRenderingContext2D,
    level: LevelData,
    cullMinX?: number,
    cullMaxX?: number
  ) {
    if (!level.springs) return;
    for (const s of level.springs) {
      // Frustum culling: Skip offscreen springs
      if (cullMinX !== undefined && cullMaxX !== undefined) {
        if (s.x + s.width < cullMinX || s.x > cullMaxX) continue;
      }

      const comp = s.compressed || 0;
      const springH = s.height * (1 - comp * 0.45);
      const topY = s.y + s.height - springH;

      // Base plate
      ctx.fillStyle = '#475569';
      ctx.fillRect(s.x, s.y + s.height - 4, s.width, 4);

      // Spring coil coils
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(s.x + 6, s.y + s.height - 4);
      ctx.lineTo(s.x + s.width - 6, topY + springH * 0.6);
      ctx.lineTo(s.x + 6, topY + springH * 0.3);
      ctx.lineTo(s.x + s.width - 6, topY + 2);
      ctx.stroke();

      // Top bounce pad
      ctx.fillStyle = '#f59e0b';
      this.roundRect(ctx, s.x, topY, s.width, 5, 2);
      ctx.fill();
    }
  }

  private drawCheckpoints(
    ctx: CanvasRenderingContext2D,
    level: LevelData,
    cullMinX?: number,
    cullMaxX?: number
  ) {
    for (const cp of level.checkpoints) {
      // Frustum culling: Skip offscreen checkpoints
      if (cullMinX !== undefined && cullMaxX !== undefined) {
        if (cp.x + 36 < cullMinX || cp.x - 10 > cullMaxX) continue;
      }

      const poleX = cp.x + 6;
      const poleY = cp.y;
      const poleH = cp.height;

      // Base stone
      ctx.fillStyle = '#64748b';
      ctx.fillRect(cp.x - 2, poleY + poleH - 8, 16, 8);

      // Metal pole
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(poleX, poleY, 4, poleH);

      // Flag banner
      const wave = Math.sin(this.animTime * 5 + cp.x) * 4;

      if (cp.active) {
        // Glowing active banner halo (zero-cost alpha arc instead of shadowBlur)
        ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
        ctx.beginPath();
        ctx.arc(poleX + 2, poleY, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.moveTo(poleX + 4, poleY + 4);
        ctx.lineTo(poleX + 32, poleY + 12 + wave);
        ctx.lineTo(poleX + 4, poleY + 24);
        ctx.closePath();
        ctx.fill();

        // Crystal orb on top
        ctx.fillStyle = '#34d399';
        ctx.beginPath();
        ctx.arc(poleX + 2, poleY, 5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Inactive dull banner
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.moveTo(poleX + 4, poleY + 4);
        ctx.lineTo(poleX + 24, poleY + 10 + wave * 0.3);
        ctx.lineTo(poleX + 4, poleY + 20);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(poleX + 2, poleY, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawGoalFlag(ctx: CanvasRenderingContext2D, level: LevelData) {
    const g = level.goal;
    const poleX = g.x + 8;
    const poleY = g.y;
    const poleH = g.height;

    // Base pedestal
    ctx.fillStyle = '#d97706';
    this.roundRect(ctx, g.x - 4, poleY + poleH - 10, 24, 10, 3);
    ctx.fill();

    // Brass pole
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(poleX, poleY, 5, poleH);

    // Goal aura halo (avoids mobile Safari shadowBlur Gaussian cost)
    ctx.fillStyle = g.reached ? 'rgba(245, 158, 11, 0.45)' : 'rgba(251, 191, 36, 0.25)';
    ctx.beginPath();
    ctx.arc(poleX + 2.5, poleY, g.reached ? 16 : 11, 0, Math.PI * 2);
    ctx.fill();

    // Golden sphere on top
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(poleX + 2.5, poleY, 7, 0, Math.PI * 2);
    ctx.fill();

    // Waving checkered or victory flag
    const wave = Math.sin(this.animTime * 6) * 5;
    const flagW = 42;
    const flagH = 30;

    ctx.fillStyle = g.reached ? '#f59e0b' : '#3b82f6';
    ctx.beginPath();
    ctx.moveTo(poleX + 5, poleY + 4);
    ctx.lineTo(poleX + 5 + flagW, poleY + 10 + wave);
    ctx.lineTo(poleX + 5 + flagW * 0.8, poleY + 10 + flagH / 2 + wave);
    ctx.lineTo(poleX + 5 + flagW, poleY + 4 + flagH + wave);
    ctx.lineTo(poleX + 5, poleY + 4 + flagH);
    ctx.closePath();
    ctx.fill();

    // Flag emblem star
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(poleX + 16, poleY + 18 + wave * 0.5, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawPlayerVisual(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    facing: 1 | -1,
    squashX: number,
    squashY: number,
    width: number,
    height: number,
    vx: number,
    grounded: boolean,
    canDoubleJump: boolean,
    color: string,
    name: string,
    isLeader: boolean,
    emoji?: string,
    invulnerableTimer: number = 0,
    trail: Array<{ x: number; y: number; alpha: number }> = []
  ) {
    ctx.save();

    // Invulnerability flashing
    if (invulnerableTimer > 0 && Math.floor(invulnerableTimer * 12) % 2 === 0) {
      ctx.globalAlpha = 0.35;
    }

    // Double jump ghosts / trail
    for (const tr of trail) {
      ctx.save();
      ctx.globalAlpha = tr.alpha * 0.4;
      ctx.fillStyle = color;
      this.roundRect(ctx, tr.x, tr.y, width, height, 8);
      ctx.fill();
      ctx.restore();
    }

    // Pivot around bottom-center for squash & stretch
    const cx = x + width / 2;
    const cy = y + height;

    ctx.translate(cx, cy);
    ctx.scale(facing * squashX, squashY);

    const w = width;
    const h = height;

    // Cape / Scarf fluttering behind player
    const capeTilt = -facing * (vx / 300) * 16;
    const capeFlap = Math.sin(this.animTime * 12) * 5;
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.moveTo(-w * 0.2, -h * 0.65);
    ctx.lineTo(-w * 0.7 + capeTilt, -h * 0.35 + capeFlap);
    ctx.lineTo(-w * 0.2, -h * 0.45);
    ctx.closePath();
    ctx.fill();

    // Hero Main Body Suit with chosen color
    ctx.fillStyle = color;
    this.roundRect(ctx, -w / 2, -h, w, h * 0.85, 8);
    ctx.fill();

    // Belt / Accent Stripe
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-w / 2, -h * 0.42, w, 4);

    // Head / Helmet
    ctx.fillStyle = color;
    this.roundRect(ctx, -w * 0.45, -h * 0.95, w * 0.9, h * 0.45, 6);
    ctx.fill();

    // Helmet subtle shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    this.roundRect(ctx, -w * 0.45, -h * 0.95, w * 0.9, h * 0.45, 6);
    ctx.fill();

    // Glowing Visor (clean 2-pass accent without expensive shadowBlur)
    ctx.fillStyle = color;
    ctx.fillRect(-w * 0.08, -h * 0.88, w * 0.51, 9);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-w * 0.05, -h * 0.85, w * 0.45, 7);

    // Feet / Shoes
    ctx.fillStyle = '#0f172a';
    if (grounded) {
      const legRun = Math.sin(this.animTime * 14) * 4;
      ctx.fillRect(-w * 0.4, -h * 0.15 + (vx !== 0 ? legRun : 0), w * 0.35, h * 0.15);
      ctx.fillRect(w * 0.05, -h * 0.15 - (vx !== 0 ? legRun : 0), w * 0.35, h * 0.15);
    } else {
      ctx.fillRect(-w * 0.4, -h * 0.25, w * 0.35, h * 0.2);
      ctx.fillRect(w * 0.05, -h * 0.2, w * 0.35, h * 0.2);
    }

    // Double Jump Aura ring when in air with double jump ready
    if (!grounded && canDoubleJump) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, -h * 0.5, w * 0.8, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();

    // ==========================================
    // FLOATING HEAD OVERLAYS (Name Tag, Crown, Emote)
    // ==========================================
    ctx.save();
    ctx.translate(cx, y);

    // 1. Race Leader Crown 👑
    if (isLeader) {
      const crownBob = Math.sin(this.animTime * 6) * 3;
      ctx.font = '16px serif';
      ctx.textAlign = 'center';
      ctx.fillText('👑', 0, -38 + crownBob);
    }

    // 2. Player Name Tag
    if (name) {
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      const textMetrics = ctx.measureText(name);
      const tagW = Math.max(36, textMetrics.width + 12);
      const tagH = 16;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      this.roundRect(ctx, -tagW / 2, -22, tagW, tagH, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.fillText(name, 0, -10);
    }

    // 3. Active Emote Speech Bubble
    if (emoji) {
      const emoteBob = Math.sin(this.animTime * 8) * 4;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      this.roundRect(ctx, -16, -58 + emoteBob, 32, 28, 8);
      ctx.fill();
      ctx.stroke();

      ctx.font = '16px serif';
      ctx.textAlign = 'center';
      ctx.fillText(emoji, 0, -39 + emoteBob);
    }

    ctx.restore();
  }

  private drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
    for (const p of particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      if (p.shape === 'spark') {
        ctx.translate(p.x, p.y);
        if (p.rotation !== undefined) ctx.rotate(p.rotation);
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.3, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size * 0.3, 0);
        ctx.closePath();
        ctx.fill();
      } else if (p.shape === 'square') {
        ctx.translate(p.x, p.y);
        if (p.rotation !== undefined) ctx.rotate(p.rotation);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private drawFloatingTexts(ctx: CanvasRenderingContext2D, texts: FloatingText[]) {
    for (const t of texts) {
      const alpha = Math.max(0, t.life / t.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${t.fontSize || 14}px system-ui, sans-serif`;
      ctx.textAlign = 'center';

      // Text stroke for high readability
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3.5;
      ctx.strokeText(t.text, t.x, t.y);

      // Text fill
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);

      ctx.restore();
    }
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number | number[]
  ) {
    if (typeof (ctx as any).roundRect === 'function') {
      ctx.beginPath();
      (ctx as any).roundRect(x, y, w, h, r);
      return;
    }

    if (typeof r === 'number') {
      r = [r, r, r, r];
    }
    const [tl, tr, br, bl] = r;
    ctx.beginPath();
    ctx.moveTo(x + tl, y);
    ctx.lineTo(x + w - tr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
    ctx.lineTo(x + w, y + h - br);
    ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
    ctx.lineTo(x + bl, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
    ctx.lineTo(x, y + tl);
    ctx.quadraticCurveTo(x, y, x + tl, y);
  }
}
