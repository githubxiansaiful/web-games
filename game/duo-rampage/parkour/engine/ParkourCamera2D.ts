/**
 * DUO RAMPAGE: DHAKA PARKOUR - Cinematic Responsive Camera 2D
 * Upgraded for Anime-inspired Cinematic Platformer
 *
 * Implements:
 * - Smooth follow damping with velocity-based predictive lookahead
 * - Dynamic Sprint Framing (wider zoom and forward lead)
 * - Dash Forward Emphasis
 * - High-jump vertical follow anticipation
 * - Micro-impact camera shake on hard landing & explosions
 * - Dual-Player Co-op framing: smoothly encloses both players and scales zoom gracefully
 */

export interface CameraTarget {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: number;
  isDashing?: boolean;
  isSprinting?: boolean;
}

export class ParkourCamera2D {
  public x: number = 0;
  public y: number = 0;
  public width: number = 1280;
  public height: number = 720;

  // Zoom management (1.0 = normal, 0.9 = wider for sprint/duo, 1.05 = close-up)
  public zoom: number = 1.0;
  public targetZoom: number = 1.0;

  // Lookahead and offset
  private currentLookaheadX: number = 0;
  private currentLookaheadY: number = 0;

  // Camera Shake
  public shakeOffsetX: number = 0;
  public shakeOffsetY: number = 0;
  private shakeIntensity: number = 0;
  private shakeTimer: number = 0;
  private shakeDuration: number = 0;

  constructor(viewportWidth: number = 1280, viewportHeight: number = 720) {
    this.width = viewportWidth;
    this.height = viewportHeight;
  }

  public setViewport(w: number, h: number) {
    this.width = w;
    this.height = h;
  }

  /**
   * Trigger cinematic camera shake on landing or explosive impact
   */
  public triggerShake(intensity: number = 5, duration: number = 0.15) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }

  /**
   * Update camera for a single local player
   */
  public update(
    dt: number,
    targetX: number,
    targetY: number,
    targetVx: number,
    targetVy: number,
    facing: number,
    isDashing: boolean = false,
    isSprinting: boolean = false,
    worldWidth: number = 6000,
    worldHeight: number = 1400
  ) {
    // 1. Process Camera Shake
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const progress = Math.max(0, this.shakeTimer / this.shakeDuration);
      const currentAmp = this.shakeIntensity * progress;
      this.shakeOffsetX = (Math.random() * 2 - 1) * currentAmp;
      this.shakeOffsetY = (Math.random() * 2 - 1) * currentAmp;
      if (this.shakeTimer <= 0) {
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
        this.shakeIntensity = 0;
      }
    }

    // 2. Dynamic Framing & Zoom (Sprint expands viewport for wider tactical awareness)
    if (isDashing) {
      this.targetZoom = 0.94;
    } else if (isSprinting || Math.abs(targetVx) > 420) {
      this.targetZoom = 0.93;
    } else {
      this.targetZoom = 1.0;
    }
    this.zoom += (this.targetZoom - this.zoom) * Math.min(1, 4.0 * dt);

    // 3. Dynamic Predictive Lookahead
    const speedRatio = Math.min(1, Math.abs(targetVx) / 550);
    let targetLookaheadX = facing * (90 + speedRatio * 140);
    if (isDashing) {
      targetLookaheadX += facing * 80;
    }

    // Smoothly interpolate lookahead
    this.currentLookaheadX += (targetLookaheadX - this.currentLookaheadX) * Math.min(1, 5.5 * dt);

    // Vertical lookahead: lower camera slightly when descending fast, raise slightly when jumping high
    const vertSpeedRatio = Math.max(-1, Math.min(1, targetVy / 600));
    const targetLookaheadY = vertSpeedRatio * 60;
    this.currentLookaheadY += (targetLookaheadY - this.currentLookaheadY) * Math.min(1, 4.0 * dt);

    // 4. Compute desired camera center
    const effectiveWidth = this.width / this.zoom;
    const effectiveHeight = this.height / this.zoom;

    const desiredX = targetX + this.currentLookaheadX - effectiveWidth * 0.45;
    const desiredY = targetY + this.currentLookaheadY - effectiveHeight * 0.58;

    // 5. Smooth Damping (horizontal is slightly faster for high-velocity parkour)
    const lerpSpeedX = 8.5;
    const lerpSpeedY = 6.5;
    this.x += (desiredX - this.x) * Math.min(1, lerpSpeedX * dt);
    this.y += (desiredY - this.y) * Math.min(1, lerpSpeedY * dt);

    // 6. World Bounds Clamping
    const maxX = Math.max(0, worldWidth - effectiveWidth);
    const maxY = Math.max(0, worldHeight - effectiveHeight);
    this.x = Math.max(0, Math.min(maxX, this.x));
    this.y = Math.max(-200, Math.min(maxY, this.y));
  }

  /**
   * Dual-player cooperative framing: smoothly keeps both players visible
   */
  public updateDuo(
    dt: number,
    p1: CameraTarget,
    p2: CameraTarget,
    worldWidth: number = 6000,
    worldHeight: number = 1400
  ) {
    // 1. Process Camera Shake
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const progress = Math.max(0, this.shakeTimer / this.shakeDuration);
      const currentAmp = this.shakeIntensity * progress;
      this.shakeOffsetX = (Math.random() * 2 - 1) * currentAmp;
      this.shakeOffsetY = (Math.random() * 2 - 1) * currentAmp;
      if (this.shakeTimer <= 0) {
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
        this.shakeIntensity = 0;
      }
    }

    // 2. Midpoint & Separation
    const midX = (p1.x + p2.x) * 0.5;
    const midY = (p1.y + p2.y) * 0.5;
    const dx = Math.abs(p1.x - p2.x);
    const dy = Math.abs(p1.y - p2.y);

    // 3. Dynamic Zoom based on distance
    const margin = 240;
    const neededW = dx + margin * 2;
    const neededH = dy + margin * 2;

    const zoomX = this.width / Math.max(this.width, neededW);
    const zoomY = this.height / Math.max(this.height, neededH);
    const calculatedZoom = Math.max(0.72, Math.min(1.0, Math.min(zoomX, zoomY)));

    this.targetZoom = calculatedZoom;
    this.zoom += (this.targetZoom - this.zoom) * Math.min(1, 3.5 * dt);

    const effectiveWidth = this.width / this.zoom;
    const effectiveHeight = this.height / this.zoom;

    // 4. Smooth Lead based on average velocity
    const avgVx = (p1.vx + p2.vx) * 0.5;
    const avgFacing = avgVx >= 0 ? 1 : -1;
    const speedRatio = Math.min(1, Math.abs(avgVx) / 500);
    const targetLookaheadX = avgFacing * (60 + speedRatio * 80);
    this.currentLookaheadX += (targetLookaheadX - this.currentLookaheadX) * Math.min(1, 5 * dt);

    const desiredX = midX + this.currentLookaheadX - effectiveWidth * 0.5;
    const desiredY = midY - effectiveHeight * 0.58;

    const lerpSpeedX = 7.5;
    const lerpSpeedY = 6.0;
    this.x += (desiredX - this.x) * Math.min(1, lerpSpeedX * dt);
    this.y += (desiredY - this.y) * Math.min(1, lerpSpeedY * dt);

    const maxX = Math.max(0, worldWidth - effectiveWidth);
    const maxY = Math.max(0, worldHeight - effectiveHeight);
    this.x = Math.max(0, Math.min(maxX, this.x));
    this.y = Math.max(-200, Math.min(maxY, this.y));
  }
}
