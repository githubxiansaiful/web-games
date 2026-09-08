export class Time {
  public deltaTime: number = 0;
  public elapsedTime: number = 0;
  public timeScale: number = 1.0;
  public frameCount: number = 0;
  private lastTime: number = 0;

  constructor() {
    this.lastTime = performance.now();
  }

  public update(): void {
    const now = performance.now();
    const rawDelta = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Clamp delta time to maximum 0.1s (10 FPS floor) to prevent physics penetration
    this.deltaTime = Math.min(rawDelta, 0.1) * this.timeScale;
    this.elapsedTime += this.deltaTime;
    this.frameCount++;
  }

  public reset(): void {
    this.lastTime = performance.now();
    this.deltaTime = 0;
  }
}
