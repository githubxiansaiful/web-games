/**
 * DUO RAMPAGE: DHAKA PARKOUR - Core Runner Physics & State Machine
 * Based on Dhaka-Parkour.md Sections 8, 9, 46-52
 *
 * Highly Responsive Platformer Physics:
 * - Immediate, fluid running & sprinting (380 / 580 px/s)
 * - 100% reliable Slide: always slides forward in facing direction (580 px/s) even from standstill
 * - Forgiving Coyote time (140ms) & Jump buffer (160ms)
 * - Wall Slide only activates when actively pushing into a vertical wall in mid-air
 * - Wall Jump never launches backwards unless gripping a wall
 * - Ladder climb requires active UP/DOWN input (never traps runners jumping nearby)
 * - Ledge Grab pulls up cleanly onto rooftops with Jump or UP
 */

export interface ParkourInput {
  moveX: number;        // -1 (left) to 1 (right)
  moveY?: number;       // -1 (up) to 1 (down)
  jumpPressed: boolean; // Just pressed this frame
  jumpHeld: boolean;    // Currently holding jump (for variable jump height)
  sprintHeld: boolean;  // Holding sprint/shift
  slidePressed: boolean;// Pressed slide/down
  resetPressed?: boolean;
}

export interface PlatformRect {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'solid' | 'low_gap_barrier' | 'vault_obstacle' | 'ladder' | 'pipe' | 'scaffold';
}

export type ParkourVfxType =
  | 'jump'
  | 'double_jump'
  | 'slide_sparks'
  | 'land'
  | 'wall_slide'
  | 'wall_jump'
  | 'vault'
  | 'ledge_grab'
  | 'climb_step';

export class ParkourRunner2D {
  // Position & Velocity
  public x: number = 100;
  public y: number = 300;
  public vx: number = 0;
  public vy: number = 0;

  // Dimensions
  public readonly width: number = 44;
  public readonly standingHeight: number = 72;
  public readonly slidingHeight: number = 38;
  public readonly hangingHeight: number = 76;
  public currentHeight: number = 72;

  // Facing & Direction (1 = right, -1 = left)
  public facing: number = 1;

  // State flags
  public onGround: boolean = false;
  public isSprinting: boolean = false;
  public isSliding: boolean = false;
  public canDoubleJump: boolean = true;
  public hasDoubleJumped: boolean = false;

  // Timers
  public coyoteTimer: number = 0;
  public jumpBufferTimer: number = 0;
  public slideTimer: number = 0;
  public readonly maxSlideDuration: number = 0.7;

  // Advanced Traversal Flags & Timers
  public isWallSliding: boolean = false;
  public wallDir: number = 0; // -1 = wall on left, 1 = wall on right
  public wallCoyoteTimer: number = 0;
  public lastWallDir: number = 0;

  public isVaulting: boolean = false;
  public vaultTimer: number = 0;
  public readonly vaultDuration: number = 0.22;
  public vaultStartX: number = 0;
  public vaultStartY: number = 0;
  public vaultTargetX: number = 0;
  public vaultTargetY: number = 0;

  public isLedgeGrabbing: boolean = false;
  public ledgeFacing: number = 1;
  public ledgePlat: PlatformRect | null = null;
  public ledgeCooldownTimer: number = 0;

  public isClimbing: boolean = false;
  public climbPlat: PlatformRect | null = null;

  // Motion Trail history for sprint/slide/walljump VFX
  public trail: Array<{ x: number; y: number; h: number; facing: number; alpha: number; color?: string }> = [];

  // Spawn Point
  public spawnX: number = 100;
  public spawnY: number = 300;

  // Movement Constants
  private readonly walkSpeed = 390;
  private readonly sprintSpeed = 590;
  private readonly accel = 3200;
  private readonly friction = 2600;
  private readonly slideFriction = 550;
  private readonly gravity = 1650;
  private readonly jumpForce = -650;
  private readonly doubleJumpForce = -590;
  private readonly wallJumpForceY = -620;
  private readonly wallJumpForceX = 490;
  private readonly wallSlideSpeed = 135;
  private readonly climbSpeed = 270;

  constructor(spawnX: number = 100, spawnY: number = 300) {
    this.spawnX = spawnX;
    this.spawnY = spawnY;
    this.reset();
  }

  public reset() {
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.onGround = false;
    this.isSprinting = false;
    this.isSliding = false;
    this.canDoubleJump = true;
    this.hasDoubleJumped = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.slideTimer = 0;
    this.isWallSliding = false;
    this.wallDir = 0;
    this.wallCoyoteTimer = 0;
    this.lastWallDir = 0;
    this.isVaulting = false;
    this.vaultTimer = 0;
    this.isLedgeGrabbing = false;
    this.ledgePlat = null;
    this.ledgeCooldownTimer = 0;
    this.isClimbing = false;
    this.climbPlat = null;
    this.currentHeight = this.standingHeight;
    this.trail = [];
  }

  public update(
    dt: number,
    input: ParkourInput,
    platforms: PlatformRect[],
    onVfx?: (type: ParkourVfxType, x: number, y: number) => void
  ) {
    if (input.resetPressed) {
      this.reset();
      return;
    }

    const moveY = input.moveY || 0;

    // Tick cooldowns
    if (this.ledgeCooldownTimer > 0) {
      this.ledgeCooldownTimer = Math.max(0, this.ledgeCooldownTimer - dt);
    }
    if (this.wallCoyoteTimer > 0) {
      this.wallCoyoteTimer = Math.max(0, this.wallCoyoteTimer - dt);
    }

    if (input.jumpPressed) {
      this.jumpBufferTimer = 0.16; // 160ms jump buffer
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
    }

    // =========================================================================
    // 1. CLIMBING MECHANIC (Requires explicit UP/DOWN to mount)
    // =========================================================================
    if (this.isClimbing && this.climbPlat) {
      const ladder = this.climbPlat;

      if (moveY < -0.15) {
        this.vy = -this.climbSpeed;
        if (Math.random() < 0.2) onVfx?.('climb_step', this.x + this.width * 0.5, this.y + 40);
      } else if (moveY > 0.15) {
        this.vy = this.climbSpeed;
      } else {
        this.vy = 0;
      }

      this.vx = 0;
      this.y += this.vy * dt;

      // Jump off ladder
      if (this.jumpBufferTimer > 0) {
        this.jumpBufferTimer = 0;
        this.isClimbing = false;
        this.climbPlat = null;
        this.vy = -540;
        const jumpDir = Math.abs(input.moveX) > 0.1 ? Math.sign(input.moveX) : this.facing;
        this.vx = jumpDir * 360;
        this.facing = jumpDir;
        onVfx?.('jump', this.x + this.width * 0.5, this.y + this.standingHeight);
        return;
      }

      // Reached top of ladder -> step onto platform
      if (this.y + this.standingHeight <= ladder.y + 14) {
        this.y = ladder.y - this.standingHeight;
        this.vy = 0;
        this.onGround = true;
        this.isClimbing = false;
        this.climbPlat = null;
        onVfx?.('land', this.x + this.width * 0.5, this.y + this.standingHeight);
        return;
      }

      // Reached bottom of ladder
      if (this.y + this.standingHeight >= ladder.y + ladder.h) {
        this.y = ladder.y + ladder.h - this.standingHeight;
        this.vy = 0;
        this.onGround = true;
        this.isClimbing = false;
        this.climbPlat = null;
        return;
      }

      return;
    }

    // Only mount ladder if actively pressing UP or DOWN
    if (Math.abs(moveY) > 0.25) {
      for (const plat of platforms) {
        if (plat.type === 'ladder' || plat.type === 'pipe' || plat.type === 'scaffold') {
          if (this.checkAABB(this.x, this.y, this.width, this.standingHeight, plat.x - 8, plat.y, plat.w + 16, plat.h)) {
            this.isClimbing = true;
            this.climbPlat = plat;
            this.x = plat.x + plat.w * 0.5 - this.width * 0.5;
            this.vx = 0;
            this.vy = 0;
            this.isSliding = false;
            this.isWallSliding = false;
            this.isLedgeGrabbing = false;
            return;
          }
        }
      }
    }

    // =========================================================================
    // 2. LEDGE GRAB & PULL UP
    // =========================================================================
    if (this.isLedgeGrabbing && this.ledgePlat) {
      this.vx = 0;
      this.vy = 0;
      this.currentHeight = this.hangingHeight;

      // Option A: Pull Up (Jump or Up or Forward into wall)
      const wantsPullUp =
        moveY < -0.2 ||
        (this.jumpBufferTimer > 0 && Math.sign(input.moveX) !== -this.ledgeFacing) ||
        (input.moveX * this.ledgeFacing > 0.3);

      if (wantsPullUp) {
        this.jumpBufferTimer = 0;
        this.y = this.ledgePlat.y - this.standingHeight;
        this.x = this.ledgeFacing > 0
          ? this.ledgePlat.x + 8
          : this.ledgePlat.x + this.ledgePlat.w - this.width - 8;
        this.onGround = true;
        this.isLedgeGrabbing = false;
        this.ledgePlat = null;
        this.currentHeight = this.standingHeight;
        this.ledgeCooldownTimer = 0.35;
        this.canDoubleJump = true;
        this.hasDoubleJumped = false;
        onVfx?.('land', this.x + this.width * 0.5, this.y + this.standingHeight);
        return;
      }

      // Option B: Drop Down (Down / Slide)
      const wantsDrop = moveY > 0.4 || input.slidePressed;
      if (wantsDrop) {
        this.isLedgeGrabbing = false;
        this.ledgePlat = null;
        this.currentHeight = this.standingHeight;
        this.vy = 80;
        this.ledgeCooldownTimer = 0.4;
        return;
      }

      // Option C: Wall Jump Away
      if (this.jumpBufferTimer > 0 && Math.sign(input.moveX) === -this.ledgeFacing) {
        this.jumpBufferTimer = 0;
        this.isLedgeGrabbing = false;
        this.ledgePlat = null;
        this.currentHeight = this.standingHeight;
        this.vx = -this.ledgeFacing * this.wallJumpForceX;
        this.vy = this.wallJumpForceY;
        this.facing = -this.ledgeFacing;
        this.canDoubleJump = true;
        this.hasDoubleJumped = false;
        this.ledgeCooldownTimer = 0.4;
        onVfx?.('wall_jump', this.x + this.width * 0.5, this.y + 20);
        return;
      }

      return;
    }

    // Check for Ledge Grab condition if airborne & falling
    if (
      !this.onGround &&
      !this.isLedgeGrabbing &&
      !this.isVaulting &&
      !this.isSliding &&
      this.vy >= -100 &&
      this.ledgeCooldownTimer <= 0
    ) {
      for (const plat of platforms) {
        if (plat.type !== 'solid') continue;

        const handY = this.y + 12;
        if (Math.abs(handY - plat.y) < 22) {
          // Left ledge of platform
          const distToLeftEdge = Math.abs((this.x + this.width) - plat.x);
          if (distToLeftEdge < 14 && (this.facing > 0 || input.moveX >= 0)) {
            if (!this.checkAABB(plat.x + 4, plat.y - this.standingHeight, this.width, this.standingHeight, plat.x, plat.y, plat.w, plat.h)) {
              this.isLedgeGrabbing = true;
              this.ledgeFacing = 1;
              this.facing = 1;
              this.ledgePlat = plat;
              this.x = plat.x - this.width + 4;
              this.y = plat.y - 12;
              this.vx = 0;
              this.vy = 0;
              this.isWallSliding = false;
              onVfx?.('ledge_grab', this.x + this.width, plat.y);
              return;
            }
          }

          // Right ledge of platform
          const distToRightEdge = Math.abs(this.x - (plat.x + plat.w));
          if (distToRightEdge < 14 && (this.facing < 0 || input.moveX <= 0)) {
            if (!this.checkAABB(plat.x + plat.w - this.width - 4, plat.y - this.standingHeight, this.width, this.standingHeight, plat.x, plat.y, plat.w, plat.h)) {
              this.isLedgeGrabbing = true;
              this.ledgeFacing = -1;
              this.facing = -1;
              this.ledgePlat = plat;
              this.x = plat.x + plat.w - 4;
              this.y = plat.y - 12;
              this.vx = 0;
              this.vy = 0;
              this.isWallSliding = false;
              onVfx?.('ledge_grab', this.x, plat.y);
              return;
            }
          }
        }
      }
    }

    // =========================================================================
    // 3. AUTO-VAULT MECHANIC
    // =========================================================================
    if (this.isVaulting) {
      this.vaultTimer += dt;
      const progress = Math.min(1, this.vaultTimer / this.vaultDuration);

      const arcHeight = 24 * Math.sin(progress * Math.PI);
      this.x = this.vaultStartX + (this.vaultTargetX - this.vaultStartX) * progress;
      this.y = this.vaultStartY + (this.vaultTargetY - this.vaultStartY) * progress - arcHeight;

      if (progress >= 1) {
        this.isVaulting = false;
        this.y = this.vaultTargetY;
        this.vx = this.facing * Math.max(Math.abs(this.vx), 460);
        this.onGround = true;
        onVfx?.('land', this.x + this.width * 0.5, this.y + this.standingHeight);
      }
      return;
    }

    // =========================================================================
    // 4. TIMERS & GROUND STATE
    // =========================================================================
    if (this.onGround) {
      this.coyoteTimer = 0.14; // 140ms coyote window
      this.canDoubleJump = true;
      this.hasDoubleJumped = false;
      this.isWallSliding = false;
      this.wallDir = 0;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    // Sprint handling
    this.isSprinting = input.sprintHeld && Math.abs(input.moveX) > 0.05 && !this.isSliding;

    // =========================================================================
    // 5. SLIDE MECHANIC (100% Guaranteed Forward Slide)
    // =========================================================================
    const wantsSlide = input.slidePressed || moveY > 0.6;
    if (wantsSlide && this.onGround && !this.isSliding) {
      this.isSliding = true;
      this.slideTimer = this.maxSlideDuration;
      this.currentHeight = this.slidingHeight;
      // Guaranteed slide boost in facing direction (at least 580 px/s)
      const slideBoost = Math.max(Math.abs(this.vx), 580);
      this.vx = this.facing * slideBoost;
      onVfx?.('slide_sparks', this.x + this.width * 0.5, this.y + this.currentHeight);
    }

    if (this.isSliding) {
      this.slideTimer -= dt;
      if (Math.abs(this.vx) > 0) {
        const dec = this.slideFriction * dt;
        if (Math.abs(this.vx) <= dec) {
          this.vx = 0;
        } else {
          this.vx -= Math.sign(this.vx) * dec;
        }
      }

      const canStand = !this.hasCeilingCollision(platforms);
      if ((this.slideTimer <= 0 || Math.abs(this.vx) < 70 || !this.onGround) && canStand) {
        this.isSliding = false;
        this.currentHeight = this.standingHeight;
      }
    } else {
      this.currentHeight = this.standingHeight;
    }

    // =========================================================================
    // 6. HORIZONTAL RUN & ACCELERATION (Left & Right)
    // =========================================================================
    if (!this.isSliding) {
      const targetMaxSpeed = this.isSprinting ? this.sprintSpeed : this.walkSpeed;
      if (Math.abs(input.moveX) > 0.05) {
        const dir = Math.sign(input.moveX);
        this.facing = dir;
        const targetVx = dir * targetMaxSpeed;

        if (dir > 0) {
          // Moving Right (D / ArrowRight / Right button)
          if (this.vx < targetVx) {
            this.vx += this.accel * dt;
            if (this.vx > targetVx) this.vx = targetVx;
          } else if (this.vx > targetVx) {
            this.vx -= this.friction * dt;
            if (this.vx < targetVx) this.vx = targetVx;
          }
        } else {
          // Moving Left (A / ArrowLeft / Left button)
          if (this.vx > targetVx) {
            this.vx -= this.accel * dt;
            if (this.vx < targetVx) this.vx = targetVx;
          } else if (this.vx < targetVx) {
            this.vx += this.friction * dt;
            if (this.vx > targetVx) this.vx = targetVx;
          }
        }
      } else {
        // Natural deceleration when no movement input
        if (Math.abs(this.vx) > 0) {
          const dec = this.friction * dt;
          if (Math.abs(this.vx) <= dec) {
            this.vx = 0;
          } else {
            this.vx -= Math.sign(this.vx) * dec;
          }
        }
      }
    }

    // =========================================================================
    // 7. JUMP EXECUTION (Ground Jump, Double Jump, Wall Jump)
    // =========================================================================
    if (this.jumpBufferTimer > 0) {
      if (this.isWallSliding) {
        // Wall Jump: push off away from wall
        const jumpDir = -this.wallDir;
        this.vx = jumpDir * this.wallJumpForceX;
        this.vy = this.wallJumpForceY;
        this.facing = jumpDir;
        this.isWallSliding = false;
        this.wallCoyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.canDoubleJump = true;
        this.hasDoubleJumped = false;
        onVfx?.('wall_jump', this.x + (this.wallDir > 0 ? this.width : 0), this.y + 30);
      } else if (this.coyoteTimer > 0) {
        // Normal Ground Jump
        this.vy = this.jumpForce;
        this.onGround = false;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        if (this.isSliding && !this.hasCeilingCollision(platforms)) {
          this.isSliding = false;
          this.currentHeight = this.standingHeight;
        }
        onVfx?.('jump', this.x + this.width * 0.5, this.y + this.currentHeight);
      } else if (this.canDoubleJump && !this.hasDoubleJumped) {
        // Double Jump
        this.vy = this.doubleJumpForce;
        this.hasDoubleJumped = true;
        this.canDoubleJump = false;
        this.jumpBufferTimer = 0;
        onVfx?.('double_jump', this.x + this.width * 0.5, this.y + this.currentHeight);
      }
    }

    // Variable Jump Cut (release button early = shorter hop)
    if (!input.jumpHeld && this.vy < -220 && !this.isWallSliding) {
      this.vy *= 0.55;
    }

    // =========================================================================
    // 8. WALL SLIDE & GRAVITY (Only engages when actively pushing into wall)
    // =========================================================================
    let foundWallDir = 0;
    if (!this.onGround && this.vy > 80 && !this.isSliding) {
      for (const plat of platforms) {
        if (plat.type !== 'solid') continue;

        // Wall must be vertical with at least 40px overlap
        const verticalOverlap = this.y + this.standingHeight > plat.y + 20 && this.y < plat.y + plat.h - 20;
        if (!verticalOverlap) continue;

        // Player must actively be pressing TOWARDS the wall!
        // Right wall: runner is to left of plat.x and pushing right
        if (Math.abs((this.x + this.width) - plat.x) < 8 && input.moveX > 0.2) {
          foundWallDir = 1;
          break;
        }
        // Left wall: runner is to right of (plat.x + plat.w) and pushing left
        if (Math.abs(this.x - (plat.x + plat.w)) < 8 && input.moveX < -0.2) {
          foundWallDir = -1;
          break;
        }
      }
    }

    if (foundWallDir !== 0) {
      this.isWallSliding = true;
      this.wallDir = foundWallDir;
      this.lastWallDir = foundWallDir;
      this.wallCoyoteTimer = 0.14;
      this.canDoubleJump = true;
      this.hasDoubleJumped = false;

      // Slow descent along wall
      this.vy = Math.min(this.vy, this.wallSlideSpeed);

      if (Math.random() < 0.3) {
        onVfx?.('wall_slide', this.x + (this.wallDir > 0 ? this.width : 0), this.y + 30);
      }
    } else {
      if (this.isWallSliding) {
        this.isWallSliding = false;
      }
      this.vy += this.gravity * dt;
      if (this.vy > 950) this.vy = 950;
    }

    // =========================================================================
    // 9. MOTION TRAILS
    // =========================================================================
    if (this.isSprinting || this.isSliding || this.hasDoubleJumped || this.isWallSliding) {
      this.trail.push({
        x: this.x,
        y: this.y,
        h: this.currentHeight,
        facing: this.facing,
        alpha: 0.45,
        color: this.isWallSliding ? '#38bdf8' : this.hasDoubleJumped ? '#60a5fa' : '#ef4444',
      });
    }

    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].alpha -= dt * 3.5;
      if (this.trail[i].alpha <= 0) {
        this.trail.splice(i, 1);
      }
    }

    // =========================================================================
    // 10. PHYSICS INTEGRATION & VAULT TRIGGERING
    // =========================================================================
    this.integrateMovementAndCollisions(dt, platforms, onVfx);
  }

  private integrateMovementAndCollisions(
    dt: number,
    platforms: PlatformRect[],
    onVfx?: (type: ParkourVfxType, x: number, y: number) => void
  ) {
    // Horizontal Movement
    const nextX = this.x + this.vx * dt;
    let resolvedX = nextX;

    for (const plat of platforms) {
      if (plat.type === 'ladder' || plat.type === 'pipe' || plat.type === 'scaffold') continue;

      if (this.checkAABB(resolvedX, this.y, this.width, this.currentHeight, plat.x, plat.y, plat.w, plat.h)) {
        // Auto-Vault Check: low obstacles
        const isVaultCandidate =
          plat.type === 'vault_obstacle' ||
          (plat.h <= 48 && plat.w <= 80 && plat.y >= this.y + 24 && plat.y <= this.y + this.standingHeight - 8);

        if (isVaultCandidate && !this.isSliding && !this.isVaulting && Math.abs(this.vx) > 100) {
          this.isVaulting = true;
          this.vaultTimer = 0;
          this.vaultStartX = this.x;
          this.vaultStartY = this.y;
          this.vaultTargetX = this.facing > 0 ? plat.x + plat.w + 14 : plat.x - this.width - 14;
          this.vaultTargetY = plat.y - this.standingHeight;
          this.vx = this.facing * Math.max(Math.abs(this.vx), 460);
          this.vy = 0;
          onVfx?.('vault', this.x + this.width * 0.5, plat.y);
          return;
        }

        // Solid horizontal wall resolution
        if (this.vx > 0) {
          resolvedX = plat.x - this.width;
          this.vx = 0;
        } else if (this.vx < 0) {
          resolvedX = plat.x + plat.w;
          this.vx = 0;
        }
      }
    }
    this.x = resolvedX;
    if (this.x < 10) {
      this.x = 10;
      if (this.vx < 0) this.vx = 0;
    }

    // Vertical Movement
    const nextY = this.y + this.vy * dt;
    let resolvedY = nextY;
    const wasOnGround = this.onGround;
    this.onGround = false;

    for (const plat of platforms) {
      if (plat.type === 'ladder' || plat.type === 'pipe' || plat.type === 'scaffold') continue;

      if (this.checkAABB(this.x, resolvedY, this.width, this.currentHeight, plat.x, plat.y, plat.w, plat.h)) {
        if (this.vy > 0) {
          resolvedY = plat.y - this.currentHeight;
          this.vy = 0;
          this.onGround = true;

          if (!wasOnGround) {
            onVfx?.('land', this.x + this.width * 0.5, resolvedY + this.currentHeight);
          }
        } else if (this.vy < 0) {
          resolvedY = plat.y + plat.h;
          this.vy = 0;
        }
      }
    }
    this.y = resolvedY;

    // Pit fall safety respawn
    if (this.y > 1500) {
      this.reset();
    }
  }

  private hasCeilingCollision(platforms: PlatformRect[]): boolean {
    const checkHeight = this.standingHeight;
    for (const plat of platforms) {
      if (plat.type === 'ladder' || plat.type === 'pipe' || plat.type === 'scaffold') continue;
      if (this.checkAABB(this.x, this.y, this.width, checkHeight, plat.x, plat.y, plat.w, plat.h)) {
        return true;
      }
    }
    return false;
  }

  public checkAABB(
    ax: number, ay: number, aw: number, ah: number,
    bx: number, by: number, bw: number, bh: number
  ): boolean {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  public getMovementState(): string {
    if (this.isClimbing) return 'CLIMBING';
    if (this.isLedgeGrabbing) return 'LEDGE GRAB';
    if (this.isVaulting) return 'VAULTING';
    if (this.isWallSliding) return 'WALL SLIDE';
    if (this.isSliding) return 'SLIDING';
    if (!this.onGround) return this.hasDoubleJumped ? 'DOUBLE JUMP' : this.vy < 0 ? 'JUMPING' : 'FALLING';
    if (this.isSprinting) return 'SPRINTING';
    if (Math.abs(this.vx) > 20) return 'RUNNING';
    return 'IDLE';
  }
}
