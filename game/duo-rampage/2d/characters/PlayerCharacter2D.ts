import { CharacterRole, PlayerAnimState, PlayerState2D, WeaponKind } from '../Duo2DTypes';
import { PlatformManager } from '../world/PlatformManager';
import { ParticleEngine2D } from '../effects/ParticleEngine2D';
import { duoAudio } from '../../audio/DuoAudioEngine';

export class PlayerCharacter2D {
  public state: PlayerState2D;
  private jumpHoldTimer: number = 0;
  private canDoubleJump: boolean = true;
  private ghostTrails: Array<{ x: number; y: number; facing: 1 | -1; alpha: number }> = [];

  constructor(id: string, role: CharacterRole, name: string, avatar?: string | null, startX: number = 400) {
    this.state = {
      id,
      role,
      name,
      avatar,
      x: startX,
      y: 700,
      vx: 0,
      vy: 0,
      w: 44,
      h: 72,
      facing: 1,
      health: 100,
      maxHealth: 100,
      shield: 50,
      maxShield: 50,
      isGrounded: false,
      isOnLadder: false,
      isDashing: false,
      dashTimer: 0,
      isMelee: false,
      meleeTimer: 0,
      isDowned: false,
      reviveProgress: 0,
      animState: 'idle',
      animFrame: 0,
      animTimer: 0,
      weapon: role === 'assault' ? 'rifle' : 'shotgun',
      ammo: role === 'assault' ? 30 : 12,
      maxAmmo: role === 'assault' ? 30 : 12,
      score: 0,
      kills: 0,
    };
  }

  public update(
    dt: number,
    input: { moveX: number; moveY: number; jump: boolean; dropDown: boolean; dash: boolean; melee: boolean; shoot: boolean; revive: boolean },
    platformMgr: PlatformManager,
    particles: ParticleEngine2D
  ) {
    const s = this.state;

    // 1. Downed Handling
    if (s.health <= 0) {
      s.isDowned = true;
      s.health = 0;
      s.animState = 'downed';

      // Crawling physics
      s.vx = input.moveX * 60;
      s.vy += 1200 * dt;
      s.y += s.vy * dt;

      // Ground collision
      if (s.y >= platformMgr.groundY - s.h) {
        s.y = platformMgr.groundY - s.h;
        s.vy = 0;
        s.isGrounded = true;
      }
      return;
    }

    // 2. Dash Timer & Ghost Trail
    if (s.isDashing) {
      s.dashTimer -= dt;
      this.ghostTrails.push({ x: s.x, y: s.y, facing: s.facing, alpha: 0.7 });
      if (s.dashTimer <= 0) {
        s.isDashing = false;
      }
    }

    // Update Ghost Trails
    for (let i = this.ghostTrails.length - 1; i >= 0; i--) {
      this.ghostTrails[i].alpha -= 4 * dt;
      if (this.ghostTrails[i].alpha <= 0) {
        this.ghostTrails.splice(i, 1);
      }
    }

    // 3. Melee Timer
    if (s.isMelee) {
      s.meleeTimer -= dt;
      if (s.meleeTimer <= 0) {
        s.isMelee = false;
      }
    }

    // Trigger Melee
    if (input.melee && !s.isMelee) {
      s.isMelee = true;
      s.meleeTimer = 0.28;
      duoAudio.playMelee();
    }

    // Trigger Dash
    if (input.dash && !s.isDashing) {
      s.isDashing = true;
      s.dashTimer = 0.22;
      s.vx = s.facing * 750;
      duoAudio.playDash();
    }

    // 4. Ladder Interaction
    const ladder = platformMgr.getLadderAt(s.x + s.w * 0.5, s.y + s.h * 0.5);
    if (ladder && (input.moveY < -0.3 || (input.moveY > 0.3 && !s.isGrounded))) {
      s.isOnLadder = true;
      s.isGrounded = false;
      s.vx = 0;
    }

    if (s.isOnLadder) {
      if (!ladder || input.jump) {
        s.isOnLadder = false;
        if (input.jump) s.vy = -540;
      } else {
        s.vy = input.moveY * 260;
        s.y += s.vy * dt;
        s.x = ladder.x + ladder.w * 0.5 - s.w * 0.5; // Snap to ladder center

        if (input.moveX !== 0) s.facing = input.moveX > 0 ? 1 : -1;
        s.animState = Math.abs(input.moveY) > 0.1 ? 'ladder' : 'ladder';
        return;
      }
    }

    // 5. Normal Horizontal Movement
    if (!s.isDashing) {
      const targetSpeed = input.moveX * 360;
      s.vx += (targetSpeed - s.vx) * 16 * dt;

      if (input.moveX !== 0) {
        s.facing = input.moveX > 0 ? 1 : -1;
      }
    }

    // 6. Jump & Gravity
    if (input.jump && s.isGrounded && !input.dropDown) {
      s.vy = -640;
      s.isGrounded = false;
      this.canDoubleJump = true;
      duoAudio.playUiClick();
    } else if (input.jump && !s.isGrounded && this.canDoubleJump) {
      s.vy = -560;
      this.canDoubleJump = false;
      particles.spawnHitSparks(s.x + s.w * 0.5, s.y + s.h, '#38bdf8', 10);
      duoAudio.playDash();
    }

    // Gravity
    s.vy += 1350 * dt;
    s.vy = Math.min(s.vy, 950); // Terminal fall velocity

    // Update Position
    s.x += s.vx * dt;
    s.y += s.vy * dt;

    // Bound in world
    s.x = Math.max(20, Math.min(platformMgr.worldWidth - s.w - 20, s.x));

    // 7. Platform Collisions
    s.isGrounded = false;

    // Check Solid Ground
    if (s.y + s.h >= platformMgr.groundY) {
      s.y = platformMgr.groundY - s.h;
      s.vy = 0;
      s.isGrounded = true;
    }

    // Check Elevated Platforms
    if (!input.dropDown) {
      for (const p of platformMgr.platforms) {
        if (p.type === 'jump_through') {
          // Check if player feet landed on platform top
          const prevY = s.y - s.vy * dt + s.h;
          const currentY = s.y + s.h;

          if (
            s.x + s.w * 0.8 > p.x &&
            s.x + s.w * 0.2 < p.x + p.w &&
            prevY <= p.y + 12 &&
            currentY >= p.y
          ) {
            s.y = p.y - s.h;
            s.vy = 0;
            s.isGrounded = true;
            break;
          }
        }
      }
    }

    // 8. Animation State
    s.animTimer += dt;
    if (s.isDashing) {
      s.animState = 'dash';
    } else if (s.isMelee) {
      s.animState = 'melee';
    } else if (!s.isGrounded) {
      s.animState = s.vy < 0 ? 'jump' : 'fall';
    } else if (Math.abs(s.vx) > 30) {
      s.animState = 'run';
    } else {
      s.animState = 'idle';
    }
  }

  public takeDamage(amount: number, particles: ParticleEngine2D): boolean {
    const s = this.state;
    if (s.isDowned) return false;

    // Shield absorbs first
    if (s.shield > 0) {
      const absorbed = Math.min(s.shield, amount);
      s.shield -= absorbed;
      amount -= absorbed;
      particles.spawnHitSparks(s.x + s.w * 0.5, s.y + s.h * 0.5, '#38bdf8', 6);
    }

    if (amount > 0) {
      s.health -= amount;
      particles.spawnHitSparks(s.x + s.w * 0.5, s.y + s.h * 0.5, '#ef4444', 8);
      duoAudio.playPlayerHit();
      particles.spawnDamageText(`-${amount}`, s.x + s.w * 0.5, s.y, '#ef4444', true, 24);
    }

    if (s.health <= 0) {
      s.health = 0;
      s.isDowned = true;
      return true; // Downed
    }
    return false;
  }

  public switchWeapon() {
    const list: WeaponKind[] = ['rifle', 'shotgun', 'minigun', 'pistol'];
    const currentIdx = list.indexOf(this.state.weapon);
    const nextIdx = (currentIdx + 1) % list.length;
    this.state.weapon = list[nextIdx];
    this.state.ammo = this.state.maxAmmo;
    duoAudio.playReload();
  }

  public reviveSuccess() {
    this.state.isDowned = false;
    this.state.health = 50;
    this.state.shield = 25;
    this.state.animState = 'idle';
    duoAudio.playReviveSuccess();
  }

  public render(ctx: CanvasRenderingContext2D, isLocal: boolean, isRampage: boolean) {
    const s = this.state;

    // 1. Render Dash Ghost Trails
    for (const g of this.ghostTrails) {
      ctx.save();
      ctx.globalAlpha = g.alpha * 0.5;
      ctx.translate(g.x, g.y);
      if (g.facing === -1) {
        ctx.translate(s.w, 0);
        ctx.scale(-1, 1);
      }
      ctx.fillStyle = s.role === 'assault' ? '#ef4444' : '#0284c7';
      ctx.fillRect(0, 0, s.w, s.h);
      ctx.restore();
    }

    // 2. Render Player Character
    ctx.save();
    ctx.translate(s.x, s.y);

    // Flip horizontally when facing left
    if (s.facing === -1) {
      ctx.translate(s.w, 0);
      ctx.scale(-1, 1);
    }

    // Downed crawling pose
    if (s.isDowned) {
      this.drawDowned(ctx);
      ctx.restore();
      return;
    }

    // Rampage Flaming Aura
    if (isRampage) {
      ctx.save();
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 18;
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.6)';
      ctx.lineWidth = 4;
      ctx.strokeRect(-6, -6, s.w + 12, s.h + 12);
      ctx.restore();
    }

    // Draw Character Rig
    if (s.role === 'assault') {
      this.drawAssaultHero(ctx);
    } else {
      this.drawHeavyHero(ctx);
    }

    // Draw Melee Slash Arc Effect
    if (s.isMelee) {
      this.drawMeleeArc(ctx);
    }

    ctx.restore();

    // 3. Floating Player Overhead Name Tag & Mini Health Pill
    this.drawOverheadTag(ctx, isLocal);
  }

  private drawAssaultHero(ctx: CanvasRenderingContext2D) {
    const s = this.state;
    const runCycle = Math.sin(s.animTimer * 14);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(s.w * 0.5, s.h - 2, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Boots & Legs
    ctx.fillStyle = '#1e293b'; // Combat pants
    const legOffset = s.animState === 'run' ? runCycle * 8 : 0;
    ctx.fillRect(8, 48 - legOffset, 11, 24 + legOffset);
    ctx.fillRect(25, 48 + legOffset, 11, 24 - legOffset);

    // Red Boots
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(6, s.h - 8 - legOffset, 14, 8);
    ctx.fillRect(23, s.h - 8 + legOffset, 14, 8);

    // Torso (Red Tactical Jacket / Hoodie)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(8, 20, 28, 30, 4);
    ctx.fill();

    // Black Tactical Vest Harness
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(14, 20, 16, 28);
    // Gold buckle
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(19, 32, 6, 6);

    // Head (Anime Spiky Brown Hair & Red Headband)
    ctx.fillStyle = '#fed7aa'; // Skin tone
    ctx.beginPath();
    ctx.arc(22, 12, 11, 0, Math.PI * 2);
    ctx.fill();

    // Red Headband with flowing ties
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(11, 6, 22, 5);
    ctx.beginPath();
    ctx.moveTo(11, 8);
    ctx.lineTo(-4, 12 + runCycle * 3);
    ctx.lineTo(11, 11);
    ctx.fill();

    // Spiky Hair
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.moveTo(12, 6);
    ctx.lineTo(8, -2);
    ctx.lineTo(18, 2);
    ctx.lineTo(24, -4);
    ctx.lineTo(28, 2);
    ctx.lineTo(34, -1);
    ctx.lineTo(32, 8);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(25, 10, 4, 3);

    // Assault Rifle Weapon in Hands
    ctx.fillStyle = '#334155';
    ctx.fillRect(24, 30, 26, 8); // Gun body
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(20, 34, 6, 10); // Gun grip
    ctx.fillStyle = '#64748b';
    ctx.fillRect(50, 32, 8, 4); // Barrel
  }

  private drawHeavyHero(ctx: CanvasRenderingContext2D) {
    const s = this.state;
    const runCycle = Math.sin(s.animTimer * 12);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(s.w * 0.5, s.h - 2, 20, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Heavy Armored Legs
    ctx.fillStyle = '#0f172a';
    const legOffset = s.animState === 'run' ? runCycle * 7 : 0;
    ctx.fillRect(7, 46 - legOffset, 13, 26 + legOffset);
    ctx.fillRect(24, 46 + legOffset, 13, 26 - legOffset);

    // Steel Boots
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(5, s.h - 9 - legOffset, 16, 9);
    ctx.fillRect(22, s.h - 9 + legOffset, 16, 9);

    // Heavy Chest Armor (Cyan / Steel Blue)
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(6, 18, 32, 32, 5);
    ctx.fill();

    // Armored Shoulders
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(2, 18, 8, 12);
    ctx.fillRect(34, 18, 8, 12);

    // Ammo Bandolier across chest
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(8, 20);
    ctx.lineTo(34, 48);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fbbf24';
    ctx.stroke();

    // Head (Anime Heroine with Tactical High Ponytail)
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(22, 11, 11, 0, Math.PI * 2);
    ctx.fill();

    // Black Hair & High Ponytail
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(20, 9, 12, Math.PI * 0.8, Math.PI * 2.1);
    ctx.fill();

    // Flowing Ponytail
    ctx.beginPath();
    ctx.moveTo(11, 6);
    ctx.quadraticCurveTo(-6, 8 + runCycle * 4, -8, 24);
    ctx.quadraticCurveTo(2, 16, 13, 11);
    ctx.fill();

    // Cyan Tactical Visor
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(23, 9, 8, 4);

    // Heavy Shotgun / Minigun
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(22, 28, 30, 12);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(40, 26, 6, 16); // Ammo drum
    ctx.fillStyle = '#64748b';
    ctx.fillRect(52, 30, 10, 8); // Double barrel
  }

  private drawMeleeArc(ctx: CanvasRenderingContext2D) {
    // Crescent neon slash
    ctx.save();
    ctx.strokeStyle = this.state.role === 'assault' ? '#ef4444' : '#38bdf8';
    ctx.lineWidth = 8;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 14;

    ctx.beginPath();
    ctx.arc(24, 34, 46, -Math.PI * 0.35, Math.PI * 0.35);
    ctx.stroke();
    ctx.restore();
  }

  private drawDowned(ctx: CanvasRenderingContext2D) {
    const pulse = Math.sin(Date.now() * 0.008) * 0.2 + 0.8;
    ctx.fillStyle = `rgba(239, 68, 68, ${pulse})`;

    // Crawling body silhouette
    ctx.beginPath();
    ctx.roundRect(0, 48, 54, 24, 8);
    ctx.fill();

    // Call for Revive Indicator
    ctx.fillStyle = '#fef08a';
    ctx.font = '900 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('REVIVE ME!', 27, 36);
  }

  private drawOverheadTag(ctx: CanvasRenderingContext2D, isLocal: boolean) {
    const s = this.state;
    const tagX = s.x + s.w * 0.5;
    const tagY = s.y - 14;

    // Player Name
    ctx.font = '700 12px "Rajdhani", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isLocal ? '#38bdf8' : '#facc15';
    ctx.fillText(s.name.toUpperCase(), tagX, tagY);

    // Mini Health Bar
    const barW = 38;
    const barH = 5;
    const hpPercent = Math.max(0, s.health / s.maxHealth);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(tagX - barW * 0.5, tagY + 3, barW, barH);

    ctx.fillStyle = hpPercent > 0.35 ? '#22c55e' : '#ef4444';
    ctx.fillRect(tagX - barW * 0.5, tagY + 3, barW * hpPercent, barH);
  }
}
