export class DuoCamera2D {
  public x: number = 0;
  public y: number = 0;
  public width: number = 1920;
  public height: number = 1080;
  public shakeDuration: number = 0;
  public shakeIntensity: number = 0;

  constructor(viewportWidth: number = 1920, viewportHeight: number = 1080) {
    this.width = viewportWidth;
    this.height = viewportHeight;
  }

  public addShake(intensity: number = 12, duration: number = 0.25) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = Math.max(this.shakeDuration, duration);
  }

  public update(
    dt: number,
    target1X: number,
    target1Y: number,
    target2X?: number,
    target2Y?: number,
    worldWidth: number = 3200,
    worldHeight: number = 1080
  ) {
    // 1. Calculate target center between both players
    let centerX = target1X;
    let centerY = target1Y;

    if (target2X !== undefined && target2Y !== undefined) {
      centerX = (target1X + target2X) * 0.5;
      centerY = (target1Y + target2Y) * 0.5;
    }

    // Desired camera position (centered on midpoint)
    const desiredX = centerX - this.width * 0.5;
    const desiredY = centerY - this.height * 0.58; // Slightly lower framing to see upper catwalks

    // Smooth lerp (10x dt)
    this.x += (desiredX - this.x) * Math.min(1, 10 * dt);
    this.y += (desiredY - this.y) * Math.min(1, 10 * dt);

    // Clamp to world boundaries
    const maxX = Math.max(0, worldWidth - this.width);
    const maxY = Math.max(0, worldHeight - this.height);
    this.x = Math.max(0, Math.min(maxX, this.x));
    this.y = Math.max(0, Math.min(maxY, this.y));

    // Screen Shake Decay
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      if (this.shakeDuration <= 0) {
        this.shakeIntensity = 0;
      }
    }
  }

  public getShakeOffset(): { sx: number; sy: number } {
    if (this.shakeDuration <= 0 || this.shakeIntensity <= 0) {
      return { sx: 0, sy: 0 };
    }
    const sx = (Math.random() - 0.5) * 2 * this.shakeIntensity;
    const sy = (Math.random() - 0.5) * 2 * this.shakeIntensity;
    return { sx, sy };
  }
}
