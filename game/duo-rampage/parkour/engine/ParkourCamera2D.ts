/**
 * DUO RAMPAGE: DHAKA PARKOUR - 2D Smooth Lookahead Camera
 * Based on Dhaka-Parkour.md Section 5 & 9
 */

export class ParkourCamera2D {
  public x: number = 0;
  public y: number = 0;
  public width: number = 1280;
  public height: number = 720;

  // Lookahead offset based on movement velocity and facing
  private currentLookaheadX: number = 0;

  constructor(viewportWidth: number = 1280, viewportHeight: number = 720) {
    this.width = viewportWidth;
    this.height = viewportHeight;
  }

  public update(
    dt: number,
    targetX: number,
    targetY: number,
    targetVx: number,
    facing: number,
    worldWidth: number = 6000,
    worldHeight: number = 1200
  ) {
    // 1. Dynamic Lookahead (extends further forward at higher running speeds)
    const speedRatio = Math.min(1, Math.abs(targetVx) / 550);
    const targetLookaheadX = facing * (80 + speedRatio * 120);

    // Smoothly interpolate lookahead
    this.currentLookaheadX += (targetLookaheadX - this.currentLookaheadX) * Math.min(1, 5 * dt);

    // 2. Desired camera position
    const desiredX = targetX + this.currentLookaheadX - this.width * 0.45;
    const desiredY = targetY - this.height * 0.6; // lower framing to see upper platforms & sky

    // 3. Smooth Camera Follow (faster horizontally to keep up with sprinting)
    const lerpSpeedX = 8.0;
    const lerpSpeedY = 6.0;
    this.x += (desiredX - this.x) * Math.min(1, lerpSpeedX * dt);
    this.y += (desiredY - this.y) * Math.min(1, lerpSpeedY * dt);

    // 4. Clamping
    const maxX = Math.max(0, worldWidth - this.width);
    const maxY = Math.max(0, worldHeight - this.height);
    this.x = Math.max(0, Math.min(maxX, this.x));
    this.y = Math.max(0, Math.min(maxY, this.y));
  }
}
