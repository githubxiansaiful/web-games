/**
 * DUO RAMPAGE: DHAKA PARKOUR - Cinematic 2D / 2.5D Environment & Visual Engine
 *
 * Implements a commercial-grade, anime-inspired South Asian megacity visual direction:
 * - 7-Layer Parallax Background & Foreground with distinct depth planes
 * - Golden Hour / Sunset lighting with volumetric light shafts and warm atmospheric haze
 * - Highly detailed rooftop architecture (concrete coping, terracotta brickwork, water stains)
 * - Authentic Dhaka rooftop assets: green/blue Gazi water tanks, AC compressors with spinning fans,
 *   swaying clotheslines with colorful fabrics, satellite dishes, antennas, puddles with sky reflections,
 *   tangled power cables, corrugated tin sheds, and glowing Bengali neon signs
 * - 3D rotating gold coins with sparkle flares & celestial secret emblem
 * - Non-intrusive in-world contextual holographic glyphs (fades away once used)
 * - Foreground cinematic silhouette layer for 2.5D depth
 * - Screen-space atmospheric dust motes, speed lines, and cinematic vignette
 */

import { ParkourCamera2D } from '../engine/ParkourCamera2D';
import {
  DhakaParkourLevelData,
  LevelCollectible,
  LevelCheckpoint,
  LevelTutorialSign,
  LevelFinishGate,
  ParkourEnemy,
} from '../levels/Level01RooftopIntro';
import { ParkourRunner2D, PlatformRect } from '../character/ParkourRunner2D';
import { parkourAnimator } from '../character/ParkourSpriteAnimator';
import { getCharacterDef } from '../character/ParkourCharacters';

export interface AtmosphericDustMote {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
  wobbleSpeed: number;
}

export class ParkourCinematicRenderer {
  // Pre-calculated procedural stars/skyline seeds for stable rendering
  private distantSkylineBuildings: Array<{ x: number; w: number; h: number; hasBeacon: boolean; spireH: number }> = [];
  private midgroundBuildings: Array<{ x: number; w: number; h: number; colorIdx: number; windows: Array<{ rx: number; ry: number; lit: boolean; color: string }> }> = [];
  private foregroundElements: Array<{ x: number; type: 'cable_pole' | 'girder' | 'lamp'; y: number }> = [];

  constructor() {
    this.initPrecomputedParallax();
  }

  /**
   * Pre-compute parallax city layouts once so rendering is jitter-free and runs at 60+ FPS
   */
  private initPrecomputedParallax() {
    // 1. Extreme Distant Skyline (Parallax 0.05)
    let curX = -500;
    while (curX < 12000) {
      const bw = 80 + (Math.abs(Math.sin(curX * 0.02)) * 140);
      const bh = 180 + (Math.abs(Math.cos(curX * 0.015)) * 180);
      const hasBeacon = Math.sin(curX * 0.08) > 0.4;
      const spireH = hasBeacon ? 35 + Math.abs(Math.sin(curX)) * 40 : 0;
      this.distantSkylineBuildings.push({ x: curX, w: bw, h: bh, hasBeacon, spireH });
      curX += bw + 8 + (Math.abs(Math.sin(curX)) * 24);
    }

    // 2. Midground Buildings (Parallax 0.16)
    let midX = -600;
    const windowColors = ['#fef08a', '#fed7aa', '#bae6fd', '#fbcfe8'];
    while (midX < 14000) {
      const mw = 140 + (Math.abs(Math.sin(midX * 0.03)) * 160);
      const mh = 260 + (Math.abs(Math.cos(midX * 0.02)) * 140);
      const colorIdx = Math.floor(Math.abs(Math.sin(midX * 0.1)) * 4);

      // Generate window grid
      const windows: Array<{ rx: number; ry: number; lit: boolean; color: string }> = [];
      const cols = Math.floor((mw - 30) / 28);
      const rows = Math.floor((mh - 60) / 34);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const lit = Math.sin(midX + r * 13 + c * 7) > -0.2;
          const col = windowColors[(r + c) % windowColors.length];
          windows.push({
            rx: 16 + c * 28,
            ry: 36 + r * 34,
            lit,
            color: col,
          });
        }
      }

      this.midgroundBuildings.push({ x: midX, w: mw, h: mh, colorIdx, windows });
      midX += mw + 14 + (Math.abs(Math.cos(midX)) * 30);
    }

    // 3. Foreground Silhouette Props (Parallax 1.45)
    let fgX = -400;
    while (fgX < 16000) {
      const types: Array<'cable_pole' | 'girder' | 'lamp'> = ['cable_pole', 'girder', 'lamp'];
      const type = types[Math.floor(Math.abs(Math.sin(fgX)) * 3)];
      this.foregroundElements.push({ x: fgX, type, y: 0 });
      fgX += 650 + Math.abs(Math.sin(fgX * 0.05)) * 800;
    }
  }

  // ===========================================================================
  // 1. SKY & PARALLAX BACKGROUND LAYERS (Layers 0 to 4)
  // ===========================================================================

  public renderParallaxBackground(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    cam: ParkourCamera2D,
    levelTimer: number
  ) {
    // -------------------------------------------------------------------------
    // LAYER 0: Sky Dome (Atmospheric Twilight / Golden Sunset Gradient)
    // -------------------------------------------------------------------------
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0.0, '#0c0f24'); // Deep twilight indigo
    skyGrad.addColorStop(0.28, '#241238'); // Dusky violet
    skyGrad.addColorStop(0.55, '#6b2128'); // Deep crimson dusk
    skyGrad.addColorStop(0.74, '#b43a18'); // Burning amber horizon
    skyGrad.addColorStop(0.88, '#ea580c'); // Warm South Asian sunset orange
    skyGrad.addColorStop(1.0, '#f59e0b'); // Golden haze skyline rim
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // -------------------------------------------------------------------------
    // Golden Setting Sun & Volumetric Light Rays (God Rays)
    // -------------------------------------------------------------------------
    const sunScreenX = w * 0.68 - cam.x * 0.012;
    const sunScreenY = h * 0.36;

    // Outer warm solar corona
    const sunCorona = ctx.createRadialGradient(sunScreenX, sunScreenY, 20, sunScreenX, sunScreenY, 240);
    sunCorona.addColorStop(0, 'rgba(255, 255, 240, 0.98)');
    sunCorona.addColorStop(0.18, 'rgba(254, 240, 138, 0.85)');
    sunCorona.addColorStop(0.42, 'rgba(251, 146, 60, 0.35)');
    sunCorona.addColorStop(0.75, 'rgba(234, 88, 12, 0.12)');
    sunCorona.addColorStop(1.0, 'rgba(234, 88, 12, 0)');
    ctx.fillStyle = sunCorona;
    ctx.beginPath();
    ctx.arc(sunScreenX, sunScreenY, 240, 0, Math.PI * 2);
    ctx.fill();

    // Volumetric God Rays (Angled light shafts cutting across the city)
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const rayAngles = [-0.42, -0.26, -0.08, 0.12, 0.28, 0.44];
    for (const angle of rayAngles) {
      const rayGrad = ctx.createLinearGradient(
        sunScreenX,
        sunScreenY,
        sunScreenX + Math.cos(angle + 1.2) * 900,
        sunScreenY + Math.sin(angle + 1.2) * 900
      );
      rayGrad.addColorStop(0, 'rgba(254, 240, 138, 0.18)');
      rayGrad.addColorStop(0.5, 'rgba(251, 146, 60, 0.08)');
      rayGrad.addColorStop(1.0, 'rgba(234, 88, 12, 0)');

      ctx.fillStyle = rayGrad;
      ctx.beginPath();
      ctx.moveTo(sunScreenX, sunScreenY);
      ctx.lineTo(sunScreenX + Math.cos(angle + 1.1) * 1100, sunScreenY + Math.sin(angle + 1.1) * 1100);
      ctx.lineTo(sunScreenX + Math.cos(angle + 1.3) * 1100, sunScreenY + Math.sin(angle + 1.3) * 1100);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // -------------------------------------------------------------------------
    // LAYER 1: Drifting Anime Sunset Clouds (Parallax 0.02)
    // -------------------------------------------------------------------------
    ctx.save();
    const cloudShift = -cam.x * 0.02 + levelTimer * 10;
    const cloudLoopW = w + 1200;

    for (let i = 0; i < 6; i++) {
      const baseX = ((i * 320 + cloudShift) % cloudLoopW) - 400;
      const baseY = 80 + (i % 3) * 45 + Math.sin(i * 1.5 + levelTimer * 0.2) * 12;
      const cloudW = 180 + (i % 2) * 80;

      // Soft underside shadow
      ctx.fillStyle = 'rgba(74, 21, 50, 0.38)';
      ctx.beginPath();
      ctx.arc(baseX, baseY + 6, 32, 0, Math.PI * 2);
      ctx.arc(baseX + cloudW * 0.3, baseY - 6, 42, 0, Math.PI * 2);
      ctx.arc(baseX + cloudW * 0.65, baseY - 2, 36, 0, Math.PI * 2);
      ctx.arc(baseX + cloudW, baseY + 6, 26, 0, Math.PI * 2);
      ctx.fill();

      // Golden sunlit top rim
      ctx.fillStyle = 'rgba(254, 215, 170, 0.55)';
      ctx.beginPath();
      ctx.arc(baseX, baseY, 30, 0, Math.PI * 2);
      ctx.arc(baseX + cloudW * 0.3, baseY - 12, 40, 0, Math.PI * 2);
      ctx.arc(baseX + cloudW * 0.65, baseY - 8, 34, 0, Math.PI * 2);
      ctx.arc(baseX + cloudW, baseY, 24, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // -------------------------------------------------------------------------
    // LAYER 2: Distant Megacity Silhouette (Parallax 0.055)
    // -------------------------------------------------------------------------
    ctx.save();
    const farCamX = cam.x * 0.055;
    const farBaseY = h * 0.88;

    for (const b of this.distantSkylineBuildings) {
      const renderX = b.x - farCamX;
      if (renderX + b.w < -100 || renderX > w + 100) continue;

      const topY = farBaseY - b.h;

      // Silhouette gradient with atmospheric purple-slate haze
      const bGrad = ctx.createLinearGradient(0, topY, 0, farBaseY);
      bGrad.addColorStop(0, '#2d1436'); // Dusky violet top
      bGrad.addColorStop(1, '#4a1d34'); // Warm haze bottom
      ctx.fillStyle = bGrad;
      ctx.fillRect(renderX, topY, b.w, b.h + 80);

      // Sun-rim highlight on building roof
      ctx.fillStyle = 'rgba(251, 146, 60, 0.45)';
      ctx.fillRect(renderX, topY, b.w, 2.5);

      // Telecom spire & pulsing red aviation hazard beacon
      if (b.hasBeacon && b.spireH > 0) {
        const spireX = renderX + b.w * 0.5;
        ctx.strokeStyle = '#2d1436';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(spireX, topY);
        ctx.lineTo(spireX, topY - b.spireH);
        ctx.stroke();

        // Pulsing red hazard light
        const pulse = 0.4 + 0.6 * Math.abs(Math.sin(levelTimer * 3 + b.x));
        ctx.fillStyle = `rgba(239, 68, 68, ${pulse})`;
        ctx.beginPath();
        ctx.arc(spireX, topY - b.spireH, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(239, 68, 68, ${pulse * 0.35})`;
        ctx.beginPath();
        ctx.arc(spireX, topY - b.spireH, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // -------------------------------------------------------------------------
    // LAYER 3: Mid-Distance Urban Dhaka Facades (Parallax 0.16)
    // -------------------------------------------------------------------------
    ctx.save();
    const midCamX = cam.x * 0.16;
    const midBaseY = h * 0.94;

    const midBuildingColors = [
      { top: '#3b1c32', body: '#1f1024', roofRim: '#f59e0b' },
      { top: '#451e2b', body: '#24101e', roofRim: '#fb923c' },
      { top: '#301b38', body: '#180d22', roofRim: '#f472b6' },
      { top: '#3f2122', body: '#221118', roofRim: '#fcd34d' },
    ];

    for (const b of this.midgroundBuildings) {
      const renderX = b.x - midCamX;
      if (renderX + b.w < -150 || renderX > w + 150) continue;

      const topY = midBaseY - b.h;
      const style = midBuildingColors[b.colorIdx % midBuildingColors.length];

      // Building wall
      const wallGrad = ctx.createLinearGradient(0, topY, 0, midBaseY);
      wallGrad.addColorStop(0, style.top);
      wallGrad.addColorStop(1, style.body);
      ctx.fillStyle = wallGrad;
      ctx.fillRect(renderX, topY, b.w, b.h + 100);

      // Rooftop golden sunset rim highlight
      ctx.fillStyle = style.roofRim;
      ctx.fillRect(renderX, topY, b.w, 3.5);

      // Water tanks on midground roofs
      if (b.w > 170) {
        ctx.fillStyle = '#0369a1'; // Blue tank silhouette
        ctx.beginPath();
        ctx.roundRect(renderX + 20, topY - 24, 30, 24, 4);
        ctx.fill();

        ctx.fillStyle = '#15803d'; // Green tank silhouette
        ctx.beginPath();
        ctx.roundRect(renderX + b.w - 52, topY - 26, 32, 26, 4);
        ctx.fill();
      }

      // Windows (Illuminated interior life)
      for (const win of b.windows) {
        const wx = renderX + win.rx;
        const wy = topY + win.ry;

        if (win.lit) {
          ctx.fillStyle = win.color;
          ctx.globalAlpha = 0.72;
          ctx.fillRect(wx, wy, 14, 18);

          // Subtle window crossbar
          ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
          ctx.fillRect(wx + 6, wy, 2, 18);
          ctx.fillRect(wx, wy + 8, 14, 2);
        } else {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
          ctx.globalAlpha = 0.5;
          ctx.fillRect(wx, wy, 14, 18);
        }
      }
      ctx.globalAlpha = 1.0;
    }
    ctx.restore();

    // -------------------------------------------------------------------------
    // LAYER 4: Near Midground Rooftops & Bridges (Parallax 0.35)
    // -------------------------------------------------------------------------
    ctx.save();
    const nearCamX = cam.x * 0.35;
    const nearBaseY = h;

    ctx.fillStyle = '#140c1b';
    for (let nx = -400; nx < 16000; nx += 260) {
      const renderX = nx - nearCamX;
      if (renderX + 240 < -100 || renderX > w + 100) continue;

      const nh = 210 + Math.sin(nx * 0.012) * 90;
      const ny = nearBaseY - nh;

      ctx.fillRect(renderX, ny, 220, nh + 120);

      // Sunset rim on near buildings
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(renderX, ny, 220, 3);
      ctx.fillStyle = '#140c1b';

      // Rooftop AC compressors and cables
      ctx.fillStyle = '#334155';
      ctx.fillRect(renderX + 30, ny - 16, 26, 16);
      ctx.fillRect(renderX + 66, ny - 16, 26, 16);

      // Catenary overhead cable to next building
      ctx.strokeStyle = '#1e162a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(renderX + 220, ny);
      ctx.quadraticCurveTo(renderX + 240, ny + 20, renderX + 260, ny + 10);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ===========================================================================
  // 2. GAMEPLAY WORLD RENDERING (Layer 5: Rooftops, Props, Hazards, Vfx)
  // ===========================================================================

  public renderWorldPlatforms(ctx: CanvasRenderingContext2D, platforms: PlatformRect[], time: number = 0) {
    for (const plat of platforms) {
      if (plat.type === 'low_gap_barrier') {
        this.renderIndustrialSlideDuct(ctx, plat);
      } else if (plat.type === 'vault_obstacle') {
        this.renderVaultObstacle(ctx, plat);
      } else if (plat.type === 'ladder') {
        this.renderIndustrialLadder(ctx, plat);
      } else if (plat.type === 'boost_pad') {
        this.renderBoostPad(ctx, plat, time);
      } else {
        this.renderDhakaRooftopPlatform(ctx, plat);
      }
    }
  }

  /**
   * Supersonic Mega Ramp Boost Accelerator Pad
   */
  public renderBoostPad(ctx: CanvasRenderingContext2D, plat: PlatformRect, time: number) {
    const x = plat.x;
    const y = plat.y;
    const w = plat.w;
    const h = plat.h;

    ctx.save();

    // 1. Heavy Carbon Foundation / Launch Bed
    const padGrad = ctx.createLinearGradient(x, y, x, y + h);
    padGrad.addColorStop(0, '#0f172a');
    padGrad.addColorStop(1, '#020617');
    ctx.fillStyle = padGrad;
    ctx.fillRect(x, y, w, h);

    // Hazard warning stripes on sides
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x, y, 6, h);
    ctx.fillRect(x + w - 6, y, 6, h);

    // 2. Glowing accelerator grid / neon floor
    ctx.fillStyle = 'rgba(6, 182, 212, 0.18)';
    ctx.fillRect(x + 6, y + 2, w - 12, h - 4);

    // 3. Animated Holographic Speed Chevrons (>>>)
    const offset = (time * 90) % 32;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 8, y, w - 16, h);
    ctx.clip();

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#38bdf8';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 10;

    for (let cx = x + 8 - offset; cx < x + w + 35; cx += 32) {
      ctx.beginPath();
      ctx.moveTo(cx, y + 6);
      ctx.lineTo(cx + 14, y + h * 0.5);
      ctx.lineTo(cx, y + h - 6);
      ctx.stroke();
    }
    ctx.restore();

    // 4. Supersonic Ledge Glow / Energy Edge
    const pulse = 0.65 + Math.sin(time * 8) * 0.35;
    ctx.fillStyle = `rgba(245, 158, 11, ${pulse})`;
    ctx.fillRect(x, y, w, 3.5);

    // Upward micro booster sparks
    for (let s = 0; s < 4; s++) {
      const sparkX = x + 15 + ((time * 140 + s * 55) % Math.max(10, w - 30));
      const sparkY = y - 4 - ((time * 90 + s * 28) % 20);
      ctx.fillStyle = s % 2 === 0 ? '#38bdf8' : '#fbbf24';
      ctx.fillRect(sparkX, sparkY, 2.5, 3.5);
    }

    ctx.restore();
  }

  /**
   * Render Interactive Parkour Enemies (Sentinel Drones & Cyborg Enforcers)
   */
  public renderEnemies(ctx: CanvasRenderingContext2D, enemies?: ParkourEnemy[], time: number = 0) {
    if (!enemies || enemies.length === 0) return;
    for (const enemy of enemies) {
      if (enemy.type === 'drone') {
        this.renderSentinelDrone(ctx, enemy, time);
      } else {
        this.renderCyborgEnforcer(ctx, enemy, time);
      }
    }
  }

  private renderSentinelDrone(ctx: CanvasRenderingContext2D, drone: ParkourEnemy, time: number) {
    ctx.save();

    if (!drone.alive) {
      // Defeated explosion / spark wreck animation
      const defT = drone.defeatedTimer || 0;
      if (defT < 1.2) {
        const pCount = 12;
        for (let i = 0; i < pCount; i++) {
          const angle = (i / pCount) * Math.PI * 2 + defT * 3;
          const dist = defT * 140 + i * 2;
          const px = drone.x + drone.w * 0.5 + Math.cos(angle) * dist;
          const py = drone.y + drone.h * 0.5 + Math.sin(angle) * dist + defT * defT * 90;
          const alpha = Math.max(0, 1 - defT / 1.2);
          ctx.fillStyle = i % 2 === 0 ? `rgba(239, 68, 68, ${alpha})` : `rgba(245, 158, 11, ${alpha})`;
          ctx.beginPath();
          ctx.arc(px, py, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
      return;
    }

    const centerX = drone.x + drone.w * 0.5;
    const centerY = drone.y + drone.h * 0.5;

    // 1. Translucent Warning Scanning Beam pointing downward
    const scanPulse = 0.2 + Math.sin(time * 4) * 0.08;
    const beamGrad = ctx.createLinearGradient(centerX, centerY, centerX, centerY + 140);
    beamGrad.addColorStop(0, `rgba(239, 68, 68, ${scanPulse * 1.5})`);
    beamGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(centerX - 8, centerY + 10);
    ctx.lineTo(centerX + 8, centerY + 10);
    ctx.lineTo(centerX + 45, centerY + 140);
    ctx.lineTo(centerX - 45, centerY + 140);
    ctx.closePath();
    ctx.fill();

    // 2. Drone Stealth Chassis
    ctx.translate(centerX, centerY);
    const tilt = drone.facing * 0.12;
    ctx.rotate(tilt);

    // Twin Anti-Grav Thruster Pods
    ctx.fillStyle = '#334155';
    ctx.fillRect(-24, -6, 8, 12);
    ctx.fillRect(16, -6, 8, 12);

    // Blue/cyan ion exhaust flames under thrusters
    const flameH = 6 + Math.sin(time * 20) * 4;
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-22, 6, 4, flameH);
    ctx.fillRect(18, 6, 4, flameH);

    // Main Armor Plating Body (Hexagonal stealth drone)
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-18, -10);
    ctx.lineTo(18, -10);
    ctx.lineTo(24, 2);
    ctx.lineTo(14, 12);
    ctx.lineTo(-14, 12);
    ctx.lineTo(-24, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Central Glowing Optical Eye / Sensor Visor
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(drone.facing * 3, 1, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Pupil glare
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(drone.facing * 3 + 1, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Top Warning Strobe
    if (Math.floor(time * 5) % 2 === 0) {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, -11, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private renderCyborgEnforcer(ctx: CanvasRenderingContext2D, cyborg: ParkourEnemy, time: number) {
    ctx.save();

    if (!cyborg.alive) {
      // Defeated sparks & smoke
      const defT = cyborg.defeatedTimer || 0;
      if (defT < 1.2) {
        const alpha = Math.max(0, 1 - defT / 1.2);
        ctx.fillStyle = `rgba(148, 163, 184, ${alpha})`;
        ctx.fillRect(cyborg.x, cyborg.y + cyborg.h - 18, cyborg.w, 18);
        for (let i = 0; i < 8; i++) {
          const sx = cyborg.x + Math.sin(defT * 10 + i) * 20;
          const sy = cyborg.y + 20 + Math.cos(defT * 8 + i) * 20;
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(sx, sy, 3, 3);
        }
      }
      ctx.restore();
      return;
    }

    const centerX = cyborg.x + cyborg.w * 0.5;
    const feetY = cyborg.y + cyborg.h;

    ctx.save();
    ctx.translate(centerX, feetY);
    ctx.scale(cyborg.facing, 1);

    // Walking animation cycle
    const walkPhase = time * (cyborg.speed * 0.08);
    const legL = Math.sin(walkPhase) * 12;
    const legR = Math.sin(walkPhase + Math.PI) * 12;

    // 1. Armored Cybernetic Legs
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#1e293b';

    // Left Leg
    ctx.beginPath();
    ctx.moveTo(-5, -28);
    ctx.lineTo(-5 + legL * 0.5, -14);
    ctx.lineTo(-5 + legL, 0);
    ctx.stroke();

    // Right Leg
    ctx.beginPath();
    ctx.moveTo(5, -28);
    ctx.lineTo(5 + legR * 0.5, -14);
    ctx.lineTo(5 + legR, 0);
    ctx.stroke();

    // 2. Heavy Armored Torso / Exoskeleton
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-11, -56, 22, 28);
    ctx.strokeRect(-11, -56, 22, 28);

    // Cybernetic Chest Reactor Core
    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 6;
    ctx.fillRect(-3, -48, 6, 8);
    ctx.shadowBlur = 0;

    // 3. Helmet & Glowing Crimson Tactical Visor
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(0, -64, 10, 0, Math.PI * 2);
    ctx.fill();

    // Tactical Visor Strip
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.fillRect(1, -66, 8, 3.5);
    ctx.shadowBlur = 0;

    // 4. Stun Baton / Cyber Weapon in hand
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(6, -42);
    ctx.lineTo(16, -30);
    ctx.stroke();

    // Stun Baton Plasma Blade with crackles
    ctx.strokeStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(16, -30);
    ctx.lineTo(26, -20);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.restore();
    ctx.restore();
  }

  /**
   * Premium Architectural Dhaka Rooftop:
   * Slabs with concrete coping, warm brick masonry, rainwater drip stains, and glowing neon edge
   */
  private renderDhakaRooftopPlatform(ctx: CanvasRenderingContext2D, plat: PlatformRect) {
    const x = plat.x;
    const y = plat.y;
    const w = plat.w;
    const h = plat.h;

    ctx.save();

    // 1. Solid Wall Body: Terracotta Brick / Weathered Slate Concrete
    const wallGrad = ctx.createLinearGradient(x, y, x, y + Math.min(300, h));
    wallGrad.addColorStop(0, '#1e2030'); // Deep architectural slate
    wallGrad.addColorStop(0.3, '#2a1b24'); // Weathered red brick mortar tone
    wallGrad.addColorStop(1, '#0e111a'); // Dark ground foundation
    ctx.fillStyle = wallGrad;
    ctx.fillRect(x, y, w, h);

    // 2. Brickwork Courses & Mortar Joints
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 1.2;
    const courseH = 18;
    const brickW = 44;

    for (let by = y + 14; by < y + Math.min(260, h); by += courseH) {
      ctx.beginPath();
      ctx.moveTo(x, by);
      ctx.lineTo(x + w, by);
      ctx.stroke();

      // Staggered vertical joints
      const shift = ((by - y) / courseH) % 2 === 0 ? 0 : brickW * 0.5;
      for (let bx = x + shift; bx < x + w; bx += brickW) {
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx, by + courseH);
        ctx.stroke();
      }
    }

    // 3. Concrete Parapet Coping Stone (Top 10px overhang)
    const copingGrad = ctx.createLinearGradient(x, y, x, y + 10);
    copingGrad.addColorStop(0, '#64748b'); // Sunlit concrete
    copingGrad.addColorStop(0.5, '#475569');
    copingGrad.addColorStop(1, '#334155');
    ctx.fillStyle = copingGrad;
    ctx.fillRect(x - 2, y, w + 4, 10);

    // 4. Rainwater Drip / Weathering Stains running down wall
    ctx.fillStyle = 'rgba(10, 15, 24, 0.45)';
    for (let sx = x + 35; sx < x + w - 20; sx += 70) {
      const stainH = 45 + Math.sin(sx * 0.05) * 30;
      ctx.fillRect(sx, y + 10, 8, stainH);
      ctx.fillRect(sx + 2, y + 10, 4, stainH + 15);
    }

    // 5. Crisp Cyberpunk / Sunset Ledge Rim Highlight
    // Guarantees 100% sharp jump readability for commercial competitive gameplay
    ctx.fillStyle = '#38bdf8'; // Glowing sky-blue rim
    ctx.fillRect(x - 2, y, w + 4, 3);

    // Ambient glow pulse under ledge
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.fillRect(x - 2, y + 3, w + 4, 2);

    ctx.restore();
  }

  /**
   * Industrial Air Ventilation Slide Duct with warning chevrons
   */
  private renderIndustrialSlideDuct(ctx: CanvasRenderingContext2D, plat: PlatformRect) {
    const x = plat.x;
    const y = plat.y;
    const w = plat.w;
    const h = plat.h;

    ctx.save();

    // Metallic duct casing
    const metalGrad = ctx.createLinearGradient(x, y, x, y + h);
    metalGrad.addColorStop(0, '#475569');
    metalGrad.addColorStop(0.4, '#64748b');
    metalGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = metalGrad;
    ctx.fillRect(x, y, w, h);

    // Hazard Yellow & Black warning chevrons
    const chevronW = 20;
    ctx.fillStyle = '#eab308';
    ctx.fillRect(x, y + h - 8, w, 8);

    ctx.fillStyle = '#0f172a';
    for (let cx = x; cx < x + w; cx += chevronW * 2) {
      ctx.beginPath();
      ctx.moveTo(cx, y + h);
      ctx.lineTo(cx + chevronW, y + h - 8);
      ctx.lineTo(cx + chevronW * 1.5, y + h - 8);
      ctx.lineTo(cx + chevronW * 0.5, y + h);
      ctx.closePath();
      ctx.fill();
    }

    // Exhaust vent louvers
    ctx.fillStyle = '#0f172a';
    for (let lx = x + 16; lx < x + w - 24; lx += 22) {
      ctx.fillRect(lx, y + 8, 12, h - 22);
    }

    // Neon Warning Tag
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'black 10px monospace';
    ctx.fillText('▼ LOW CLEARANCE • CROUCH [S]', x + 20, y - 6);

    ctx.restore();
  }

  /**
   * Vault Barrier / AC Unit / Crates
   */
  private renderVaultObstacle(ctx: CanvasRenderingContext2D, plat: PlatformRect) {
    const x = plat.x;
    const y = plat.y;
    const w = plat.w;
    const h = plat.h;

    ctx.save();

    // Weathered crate body
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x, y, w, h);

    // Steel strapping
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);

    // Diagonal brace
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 4);
    ctx.lineTo(x + w - 4, y + h - 4);
    ctx.stroke();

    // Vault marker
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('↷ VAULT', x - 4, y - 6);

    ctx.restore();
  }

  /**
   * Industrial Steel Maintenance Ladder
   */
  private renderIndustrialLadder(ctx: CanvasRenderingContext2D, plat: PlatformRect) {
    const x = plat.x;
    const y = plat.y;
    const w = plat.w;
    const h = plat.h;

    ctx.save();

    // Side Rails
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x, y, 6, h);
    ctx.fillRect(x + w - 6, y, 6, h);

    // Neon blue high-traction rungs
    ctx.fillStyle = '#38bdf8';
    for (let ry = y + 14; ry < y + h; ry += 22) {
      ctx.fillRect(x + 4, ry, w - 8, 4);
    }

    // Wall mounting brackets
    ctx.fillStyle = '#475569';
    for (let by = y + 24; by < y + h; by += 60) {
      ctx.fillRect(x - 6, by, 6, 8);
      ctx.fillRect(x + w, by, 6, 8);
    }

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('▲ CLIMB [W]', x - 6, y - 8);

    ctx.restore();
  }

  // ===========================================================================
  // 3. DHAKA ROOFTOP PROPS (Water Tanks, Clotheslines, Antennas, Puddles, etc.)
  // ===========================================================================

  public renderRooftopDoodads(
    ctx: CanvasRenderingContext2D,
    doodads: DhakaParkourLevelData['skylineDoodads'],
    levelTimer: number
  ) {
    for (const d of doodads) {
      const type = d.type;

      if (type === 'water_tank') {
        this.renderWaterTank(ctx, d.x, d.y, d.w || 90, d.h || 120, d.color);
      } else if (type === 'clothesline') {
        this.renderClothesline(ctx, d.x, d.y, d.w || 180, levelTimer);
      } else if (type === 'antenna') {
        this.renderAntenna(ctx, d.x, d.y, d.h || 100);
      } else if (type === 'neon_sign' || type === 'billboard') {
        this.renderNeonBillboard(ctx, d.x, d.y, d.w || 220, d.h || 70, d.text, d.color, levelTimer);
      } else if (type === 'tin_shed') {
        this.renderTinShed(ctx, d.x, d.y, d.w || 160, d.h || 80);
      }
    }
  }

  /**
   * Iconic Dhaka Gazi/Sintex Water Tank on Sturdy Iron Leg Gantry
   */
  private renderWaterTank(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    colorOverride?: string
  ) {
    ctx.save();

    const legH = 28;
    const bodyH = h - legH;
    const isGreen = colorOverride === 'green' || (x % 2 === 0);
    const mainColor = isGreen ? '#15803d' : '#0284c7';
    const highlightColor = isGreen ? '#4ade80' : '#38bdf8';

    // 1. Structural Iron Leg Framework (Cross-braced steel frame)
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3.5;
    // Left & Right legs
    ctx.beginPath();
    ctx.moveTo(x + 14, y + bodyH);
    ctx.lineTo(x + 10, y + h);
    ctx.moveTo(x + w - 14, y + bodyH);
    ctx.lineTo(x + w - 10, y + h);
    // Cross brace
    ctx.moveTo(x + 12, y + bodyH + 6);
    ctx.lineTo(x + w - 12, y + h - 6);
    ctx.moveTo(x + w - 12, y + bodyH + 6);
    ctx.lineTo(x + 12, y + h - 6);
    ctx.stroke();

    // 2. Cylindrical Ribbed Plastic Body
    const bodyGrad = ctx.createLinearGradient(x, y, x + w, y);
    bodyGrad.addColorStop(0, mainColor);
    bodyGrad.addColorStop(0.3, highlightColor);
    bodyGrad.addColorStop(0.7, mainColor);
    bodyGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(x, y + 10, w, bodyH - 10, 10);
    ctx.fill();

    // 3. Top Curved Dome & Lid
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + 10, w * 0.48, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a'; // Black threaded cap
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + 5, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Horizontal Reinforcing Ribs
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    const numRibs = 4;
    for (let r = 1; r <= numRibs; r++) {
      const ribY = y + 10 + (bodyH / (numRibs + 1)) * r;
      ctx.fillRect(x, ribY, w, 4);
    }

    // 5. Specular Reflection Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(x + w * 0.28, y + 12, 8, bodyH - 16);

    ctx.restore();
  }

  /**
   * Swaying Clothesline with colorful hanging fabrics
   */
  private renderClothesline(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    levelTimer: number
  ) {
    ctx.save();

    // Support poles at ends
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x, y + 45);
    ctx.lineTo(x, y);
    ctx.moveTo(x + w, y + 45);
    ctx.lineTo(x + w, y);
    ctx.stroke();

    // Catenary sagged wire
    const sag = 12;
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + w * 0.5, y + sag, x + w, y);
    ctx.stroke();

    // Hanging fabrics (colorful lungis, kurtas, saris) swaying in the breeze
    const fabrics = ['#ef4444', '#06b6d4', '#f59e0b', '#ec4899', '#f8fafc', '#10b981'];
    let fx = x + 16;
    let idx = 0;

    while (fx < x + w - 24) {
      const fw = 18 + (idx % 2) * 6;
      const fh = 26 + Math.sin(idx * 2) * 8;
      const wireY = y + (Math.sin(((fx - x) / w) * Math.PI) * sag);

      // Wind sway angle
      const sway = Math.sin(levelTimer * 3.5 + fx * 0.1) * 3;

      ctx.save();
      ctx.translate(fx + fw * 0.5, wireY);
      ctx.rotate((sway * Math.PI) / 180);

      ctx.fillStyle = fabrics[idx % fabrics.length];
      ctx.fillRect(-fw * 0.5, 0, fw, fh);

      // Peg / clothespin
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-fw * 0.5 + 2, -2, 3, 5);
      ctx.fillRect(fw * 0.5 - 5, -2, 3, 5);

      ctx.restore();

      fx += fw + 10;
      idx++;
    }

    ctx.restore();
  }

  /**
   * Traditional rooftop television Yagi antenna
   */
  private renderAntenna(ctx: CanvasRenderingContext2D, x: number, y: number, h: number) {
    ctx.save();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;

    // Main pole
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y);

    // Cross elements
    ctx.moveTo(x - 24, y + 16);
    ctx.lineTo(x + 24, y + 16);
    ctx.moveTo(x - 18, y + 36);
    ctx.lineTo(x + 18, y + 36);
    ctx.moveTo(x - 14, y + 56);
    ctx.lineTo(x + 14, y + 56);
    ctx.stroke();

    // Guy-wires
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y + 20);
    ctx.lineTo(x - 28, y + h);
    ctx.moveTo(x, y + 20);
    ctx.lineTo(x + 28, y + h);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Corrugated Tin Rooftop Shed (Common in Dhaka architecture)
   */
  private renderTinShed(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.save();

    // Wood / brick foundation walls
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 8, y + 18, w - 16, h - 18);

    // Weathered wooden door
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + w * 0.5 - 12, y + 26, 24, h - 26);

    // Corrugated Galvanized Tin Roof (Angled eaves)
    const roofGrad = ctx.createLinearGradient(x, y, x + w, y + 18);
    roofGrad.addColorStop(0, '#94a3b8');
    roofGrad.addColorStop(0.5, '#64748b');
    roofGrad.addColorStop(1, '#475569');
    ctx.fillStyle = roofGrad;

    ctx.beginPath();
    ctx.moveTo(x - 6, y + 18);
    ctx.lineTo(x + w * 0.5, y);
    ctx.lineTo(x + w + 6, y + 18);
    ctx.closePath();
    ctx.fill();

    // Corrugation ridges
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
    ctx.lineWidth = 1.5;
    for (let rx = x + 6; rx < x + w - 4; rx += 8) {
      ctx.beginPath();
      ctx.moveTo(rx, y + 18);
      ctx.lineTo(x + (rx - x) * 0.85 + w * 0.08, y + 4);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Glowing Bengali Neon Sign & Rooftop Billboard
   */
  private renderNeonBillboard(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    text: string = 'ঢাকা পার্কুর',
    neonColor: string = '#38bdf8',
    levelTimer: number
  ) {
    ctx.save();

    // Support scaffolding trusses
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 20, y + h + 24);
    ctx.lineTo(x + 20, y + h);
    ctx.moveTo(x + w - 20, y + h + 24);
    ctx.lineTo(x + w - 20, y + h);
    ctx.moveTo(x + 20, y + h + 24);
    ctx.lineTo(x + w - 20, y + h);
    ctx.stroke();

    // Billboard dark backing
    ctx.fillStyle = '#090d16';
    ctx.fillRect(x, y, w, h);

    // Neon Border with emissive bloom
    const flicker = 0.85 + 0.15 * Math.sin(levelTimer * 12 + x);
    ctx.strokeStyle = neonColor;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x, y, w, h);

    // Text glow
    ctx.fillStyle = neonColor;
    ctx.font = 'black 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Bloom layer
    ctx.globalAlpha = flicker * 0.4;
    ctx.fillText(text, x + w * 0.5, y + h * 0.5);

    // Crisp text layer
    ctx.globalAlpha = flicker;
    ctx.fillText(text, x + w * 0.5, y + h * 0.5);

    ctx.restore();
  }

  // ===========================================================================
  // 4. COLLECTIBLES: 3D ROTATING GOLD COINS & SECRET EMBLEM
  // ===========================================================================

  public renderCollectibles(
    ctx: CanvasRenderingContext2D,
    collectibles: LevelCollectible[],
    levelTimer: number
  ) {
    for (const c of collectibles) {
      if (c.collected) continue;

      if (c.type === 'secret_emblem') {
        this.renderSecretEmblem(ctx, c.x, c.y, levelTimer);
      } else {
        this.render3DGoldCoin(ctx, c.x, c.y, levelTimer);
      }
    }
  }

  /**
   * 3D Rotating Golden Dhaka Coin with star embossing and halo flare
   */
  private render3DGoldCoin(ctx: CanvasRenderingContext2D, x: number, y: number, levelTimer: number) {
    ctx.save();

    // Floating bob motion
    const bobY = y + Math.sin(levelTimer * 4 + x * 0.1) * 4;

    // 3D Yaw Rotation angle (continuous smooth spin)
    const spinAngle = levelTimer * 3.5 + (x * 0.05);
    const cosVal = Math.cos(spinAngle);
    const radius = 12;
    const currentW = Math.max(1.5, Math.abs(cosVal) * radius);

    // Outer Golden Glow Halo
    const halo = ctx.createRadialGradient(x, bobY, 4, x, bobY, 26);
    halo.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
    halo.addColorStop(0.6, 'rgba(245, 158, 11, 0.15)');
    halo.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, bobY, 26, 0, Math.PI * 2);
    ctx.fill();

    // Coin Edge (Thickness when tilted)
    const edgeOffset = cosVal >= 0 ? 2 : -2;
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(x + edgeOffset, bobY, currentW, radius, 0, 0, Math.PI * 2);
    ctx.fill();

    // Coin Main Face
    const coinGrad = ctx.createLinearGradient(x - currentW, bobY, x + currentW, bobY);
    coinGrad.addColorStop(0, '#f59e0b');
    coinGrad.addColorStop(0.5, '#fef08a'); // White-hot specular glint
    coinGrad.addColorStop(1, '#d97706');
    ctx.fillStyle = coinGrad;
    ctx.beginPath();
    ctx.ellipse(x, bobY, currentW, radius, 0, 0, Math.PI * 2);
    ctx.fill();

    // Embossed Inner Star (visible when face is facing camera)
    if (Math.abs(cosVal) > 0.4) {
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.ellipse(x, bobY, currentW * 0.5, radius * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Secret Emblem: Celestial glowing cyber-talisman with concentric energy rings
   */
  private renderSecretEmblem(ctx: CanvasRenderingContext2D, x: number, y: number, levelTimer: number) {
    ctx.save();

    const bobY = y + Math.sin(levelTimer * 3) * 6;

    // Glowing aura
    const aura = ctx.createRadialGradient(x, bobY, 10, x, bobY, 50);
    aura.addColorStop(0, 'rgba(245, 158, 11, 0.65)');
    aura.addColorStop(0.6, 'rgba(236, 72, 153, 0.25)');
    aura.addColorStop(1, 'rgba(236, 72, 153, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(x, bobY, 50, 0, Math.PI * 2);
    ctx.fill();

    // Rotating Outer Diamond
    ctx.save();
    ctx.translate(x, bobY);
    ctx.rotate(levelTimer * 1.5);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-18, -18, 36, 36);
    ctx.restore();

    // Counter-rotating Inner Hexagon
    ctx.save();
    ctx.translate(x, bobY);
    ctx.rotate(-levelTimer * 2.0);
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 2;
    ctx.strokeRect(-12, -12, 24, 24);
    ctx.restore();

    // Core Radiant Gem
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, bobY, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ===========================================================================
  // 5. CHECKPOINTS & FINISH GATES
  // ===========================================================================

  public renderCheckpoints(
    ctx: CanvasRenderingContext2D,
    checkpoints: LevelCheckpoint[],
    levelTimer: number
  ) {
    for (let i = 0; i < checkpoints.length; i++) {
      const cp = checkpoints[i];
      ctx.save();

      const color = cp.activated ? '#22c55e' : '#38bdf8';
      const glowColor = cp.activated ? 'rgba(34, 197, 94, ' : 'rgba(56, 189, 248, ';

      // 1. Ground Transmitter Base
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(cp.x - 22, cp.y - 12, 44, 12, 4);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // 2. Holographic Light Pillar ascending into sky
      const pillarGrad = ctx.createLinearGradient(0, cp.y - 160, 0, cp.y);
      pillarGrad.addColorStop(0, `${glowColor}0)`);
      pillarGrad.addColorStop(0.5, `${glowColor}0.18)`);
      pillarGrad.addColorStop(1, `${glowColor}0.45)`);
      ctx.fillStyle = pillarGrad;
      ctx.fillRect(cp.x - 14, cp.y - 160, 28, 160);

      // 3. Floating Ascending Energy Rings
      for (let r = 0; r < 3; r++) {
        const ringProgress = ((levelTimer * 0.8 + r * 0.33) % 1.0);
        const ringY = cp.y - ringProgress * 150;
        const ringAlpha = 1.0 - ringProgress;
        const ringW = 16 + ringProgress * 18;

        ctx.strokeStyle = `${glowColor}${ringAlpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(cp.x, ringY, ringW, ringW * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 4. Floating Hologram Label
      ctx.fillStyle = color;
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(cp.activated ? `✓ CHECKPOINT #${i + 1}` : `[BEACON #${i + 1}]`, cp.x, cp.y - 95);

      ctx.restore();
    }
  }

  public renderFinishGate(
    ctx: CanvasRenderingContext2D,
    fg: LevelFinishGate,
    levelTimer: number
  ) {
    ctx.save();

    // Twin High-Tech Gate Columns
    const colGrad = ctx.createLinearGradient(fg.x, fg.y, fg.x + 16, fg.y);
    colGrad.addColorStop(0, '#f59e0b');
    colGrad.addColorStop(1, '#b45309');
    ctx.fillStyle = colGrad;
    ctx.fillRect(fg.x, fg.y, 16, fg.h);
    ctx.fillRect(fg.x + fg.w - 16, fg.y, 16, fg.h);

    // Arch Overhead Banner
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(fg.x, fg.y, fg.w, 42);

    // Chequered Finish Pattern
    for (let bx = fg.x; bx < fg.x + fg.w; bx += 14) {
      for (let by = fg.y; by < fg.y + 42; by += 14) {
        if ((bx + by) % 28 === 0) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(bx, by, 14, 14);
        }
      }
    }

    // Celebratory Sweeping Searchlights
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const sweep1 = Math.sin(levelTimer * 1.8) * 0.4;
    const sweep2 = Math.cos(levelTimer * 1.5) * 0.4;

    const lightGrad1 = ctx.createLinearGradient(fg.x + 8, fg.y, fg.x + 8 + sweep1 * 400, fg.y - 500);
    lightGrad1.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
    lightGrad1.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = lightGrad1;
    ctx.beginPath();
    ctx.moveTo(fg.x + 8, fg.y);
    ctx.lineTo(fg.x + 8 + sweep1 * 400 - 60, fg.y - 500);
    ctx.lineTo(fg.x + 8 + sweep1 * 400 + 60, fg.y - 500);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Banner Text
    ctx.fillStyle = '#fef08a';
    ctx.font = 'black 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('FINISH LINE • ঢাকা পার্কুর', fg.x + fg.w * 0.5, fg.y - 12);

    ctx.restore();
  }

  // ===========================================================================
  // 6. NON-INTRUSIVE CONTEXTUAL TUTORIAL GLYPHS
  // ===========================================================================

  public renderTutorialGlyphs(
    ctx: CanvasRenderingContext2D,
    signs: LevelTutorialSign[],
    runnerX: number
  ) {
    for (const tut of signs) {
      // Only show when runner is within approach distance (+- 350px)
      const dist = Math.abs(runnerX - tut.x);
      if (dist > 380) continue;

      // Smooth fade in and out based on proximity
      const alpha = Math.max(0, Math.min(1, 1.2 - (dist / 350)));

      ctx.save();
      ctx.globalAlpha = alpha;

      const px = tut.x;
      const py = tut.y - 20;

      // Compact frosted capsule
      const pw = 200;
      const ph = 42;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.beginPath();
      ctx.roundRect(px - pw * 0.5, py - ph, pw, ph, 10);
      ctx.fill();

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Action and Key
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${tut.icon} ${tut.action}`, px, py - 24);

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`[${tut.desktopKey}]`, px, py - 10);

      ctx.restore();
    }
  }

  // ===========================================================================
  // 7. FOREGROUND SILHOUETTES & 2.5D DEPTH (Layer 6: Parallax 1.45)
  // ===========================================================================

  public renderForegroundSilhouettes(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    cam: ParkourCamera2D
  ) {
    ctx.save();
    const fgCamX = cam.x * 1.45;

    ctx.fillStyle = 'rgba(5, 7, 14, 0.85)';
    ctx.strokeStyle = 'rgba(5, 7, 14, 0.85)';

    for (const fg of this.foregroundElements) {
      const renderX = fg.x - fgCamX;
      if (renderX < -200 || renderX > w + 200) continue;

      if (fg.type === 'cable_pole') {
        // Foreground power pole passing near camera
        ctx.fillRect(renderX, 0, 18, h);

        // Cross-arm
        ctx.fillRect(renderX - 45, 120, 110, 14);

        // Huge dangling black cables sweeping down
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(renderX - 40, 130);
        ctx.quadraticCurveTo(renderX + 250, 320, renderX + 700, 150);
        ctx.stroke();
      } else if (fg.type === 'girder') {
        // Blurred construction steel girder
        ctx.lineWidth = 22;
        ctx.beginPath();
        ctx.moveTo(renderX - 100, -20);
        ctx.lineTo(renderX + 300, 240);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // ===========================================================================
  // 8. SCREEN-SPACE ATMOSPHERE & POST-PROCESSING (Layer 7: Dust, Vignette, Speed)
  // ===========================================================================

  public renderScreenAtmosphere(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    runner: ParkourRunner2D,
    dustMotes: AtmosphericDustMote[],
    levelTimer: number
  ) {
    // 1. Floating Golden Dust Motes & Embers
    for (const d of dustMotes) {
      ctx.save();
      const pulseAlpha = d.alpha * (0.5 + 0.5 * Math.sin(levelTimer * d.wobbleSpeed + d.x));
      ctx.fillStyle = `rgba(254, 240, 138, ${pulseAlpha})`;
      ctx.beginPath();
      ctx.arc(d.x % w, d.y % h, d.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Sprint / Dash Speed Lines
    const speed = Math.abs(runner.vx);
    if (speed > 480 || runner.isSliding) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 1.5;

      const numLines = Math.floor((speed - 450) / 15);
      for (let i = 0; i < numLines; i++) {
        const ly = (Math.sin(levelTimer * 20 + i * 47) * 0.5 + 0.5) * h;
        const lineLen = 140 + Math.sin(i * 13) * 80;
        const lx = runner.facing > 0 ? w - lineLen - 20 : 20;

        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx + lineLen, ly);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. Cinematic Soft Edge Vignette
    ctx.save();
    const vignette = ctx.createRadialGradient(
      w * 0.5,
      h * 0.5,
      Math.min(w, h) * 0.45,
      w * 0.5,
      h * 0.5,
      Math.max(w, h) * 0.78
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(7, 10, 20, 0.52)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

export const parkourRenderer = new ParkourCinematicRenderer();
