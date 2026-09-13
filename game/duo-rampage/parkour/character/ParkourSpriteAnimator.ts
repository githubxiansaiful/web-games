/**
 * DUO RAMPAGE: DHAKA PARKOUR - High-Definition 2D Sprite Animator
 * Preloads, manages, and renders 2D animated sprites from public/images/characters/2d/
 * Features sub-pixel anchor alignment (1024, 1785) for 100% ground-contact precision.
 */

import { ParkourRunner2D } from './ParkourRunner2D';
import { getCharacterDef } from './ParkourCharacters';

export class ParkourSpriteAnimator {
  private static instance: ParkourSpriteAnimator;
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private loadingSet: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): ParkourSpriteAnimator {
    if (!ParkourSpriteAnimator.instance) {
      ParkourSpriteAnimator.instance = new ParkourSpriteAnimator();
    }
    return ParkourSpriteAnimator.instance;
  }

  /**
   * Preloads essential animations for a given character ID
   */
  public preloadCharacter(characterId: string) {
    const def = getCharacterDef(characterId);
    const clips = [
      { name: 'idle', count: 6 },
      { name: 'walk', count: 8 },
      { name: 'jumpStart', count: 2 },
      { name: 'fall', count: 5 },
      { name: 'roll', count: 5 },
      { name: 'jumpEnd', count: 3 },
    ];

    for (const clip of clips) {
      for (let i = 0; i < clip.count; i++) {
        const url = `${def.basePath}/${clip.name}_${i}.png`;
        this.getImage(url);
      }
    }
  }

  private getImage(url: string): HTMLImageElement | null {
    if (typeof window === 'undefined') return null;

    if (this.imageCache.has(url)) {
      const img = this.imageCache.get(url)!;
      return img.complete && img.naturalWidth > 0 ? img : null;
    }

    if (!this.loadingSet.has(url)) {
      this.loadingSet.add(url);
      const img = new Image();
      img.src = url;
      img.onload = () => {
        this.imageCache.set(url, img);
        this.loadingSet.delete(url);
      };
      img.onerror = () => {
        this.loadingSet.delete(url);
      };
    }

    return null;
  }

  /**
   * Draws the animated 2D sprite.
   * Returns true if a loaded sprite was rendered, or false if fallback rendering should be used.
   */
  public drawRunnerSprite(
    ctx: CanvasRenderingContext2D,
    runner: ParkourRunner2D,
    characterId: string,
    animTime: number
  ): boolean {
    const def = getCharacterDef(characterId);
    let clipName = 'idle';
    let frameIndex = 0;

    // Action State Machine Mapping
    if (runner.isSliding || runner.isVaulting) {
      clipName = 'roll';
      frameIndex = Math.floor(animTime * 14) % 5;
    } else if (runner.isClimbing) {
      clipName = 'jumpStart';
      frameIndex = 1;
    } else if (runner.isLedgeGrabbing) {
      clipName = 'jumpStart';
      frameIndex = 0;
    } else if (runner.isWallSliding) {
      clipName = 'fall';
      frameIndex = 2;
    } else if (!runner.onGround) {
      if (runner.vy < -60) {
        clipName = 'jumpStart';
        frameIndex = runner.vy < -300 ? 0 : 1;
      } else {
        clipName = 'fall';
        frameIndex = Math.floor(animTime * 10) % 5;
      }
    } else if (Math.abs(runner.vx) > 30) {
      clipName = 'walk';
      const speedFactor = Math.min(2.2, Math.max(0.8, Math.abs(runner.vx) / 380));
      frameIndex = Math.floor(animTime * 12 * speedFactor) % 8;
    } else {
      clipName = 'idle';
      frameIndex = Math.floor(animTime * 7) % 6;
    }

    const frameUrl = `${def.basePath}/${clipName}_${frameIndex}.png`;
    const img = this.getImage(frameUrl);

    if (!img) {
      // Trigger preload for smooth appearance next frame
      this.preloadCharacter(characterId);
      return false;
    }

    // Mathematical Anchor & Scale:
    // Ground anchor is fixed at (1024, 1785) across all exported sprites.
    // Character height is ~720px in source; target height on rooftop is ~82px.
    const targetHeight = 84;
    const scale = targetHeight / 720;
    const anchorX = 1024;
    const anchorY = 1785;

    const footX = runner.x + runner.width * 0.5;
    const footY = runner.y + runner.standingHeight;

    ctx.save();
    ctx.translate(footX, footY);

    // Dynamic squash & stretch juice
    let sx = 1;
    let sy = 1;
    if (!runner.onGround && Math.abs(runner.vy) > 200) {
      sy = 1.08;
      sx = 0.94;
    } else if (runner.isSliding) {
      sy = 0.85;
      sx = 1.15;
    }

    if (runner.facing < 0) {
      ctx.scale(-sx, sy);
    } else {
      ctx.scale(sx, sy);
    }

    const destWidth = 2048 * scale;
    const destHeight = 2048 * scale;
    const destX = -anchorX * scale;
    const destY = -anchorY * scale;

    ctx.drawImage(img, destX, destY, destWidth, destHeight);
    ctx.restore();

    return true;
  }
}

export const parkourAnimator = ParkourSpriteAnimator.getInstance();
