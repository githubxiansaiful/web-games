import {
  ControlKeys,
  LevelData,
  MovingPlatform,
  Particle,
  FloatingText,
  PlayerState,
  Rect,
  Hazard,
} from './types';
import { sounds } from './audio';

// Physics constants
export const GRAVITY = 1550;
export const MAX_FALL_SPEED = 780;
export const MAX_RUN_SPEED = 300;
export const GROUND_ACCEL = 2500;
export const GROUND_FRICTION = 2400;
export const AIR_ACCEL = 1700;
export const AIR_DRAG = 500;
export const JUMP_FORCE = -540;
export const DOUBLE_JUMP_FORCE = -500;
export const JUMP_RELEASE_DAMPING = 0.45;
export const COYOTE_TIME = 0.12;
export const JUMP_BUFFER_TIME = 0.12;

export function createInitialPlayer(spawn: { x: number; y: number }): PlayerState {
  return {
    x: spawn.x,
    y: spawn.y,
    vx: 0,
    vy: 0,
    width: 28,
    height: 38,
    grounded: false,
    ridingPlatform: null,
    facing: 1,
    isJumping: false,
    canDoubleJump: true,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    isDead: false,
    deathTimer: 0,
    respawnTimer: 0,
    invulnerableTimer: 0,
    activeCheckpointId: null,
    squashX: 1,
    squashY: 1,
    runFrame: 0,
    trail: [],
  };
}

export function checkAABB(r1: Rect, r2: Rect): boolean {
  return (
    r1.x < r2.x + r2.width &&
    r1.x + r1.width > r2.x &&
    r1.y < r2.y + r2.height &&
    r1.y + r1.height > r2.y
  );
}

export function updateMovingPlatforms(platforms: MovingPlatform[], dt: number) {
  for (const p of platforms) {
    if (p.progress === undefined) p.progress = 0;
    if (p.direction === undefined) p.direction = 1;

    const dx = p.endX - p.startX;
    const dy = p.endY - p.startY;
    const distance = Math.hypot(dx, dy);

    if (distance > 0) {
      const step = (p.speed * dt) / distance;
      p.progress += p.direction * step;

      if (p.progress >= 1) {
        p.progress = 1;
        p.direction = -1;
      } else if (p.progress <= 0) {
        p.progress = 0;
        p.direction = 1;
      }

      // Smooth sine easing for natural movement
      const t = 0.5 - 0.5 * Math.cos(p.progress * Math.PI);
      const newX = p.startX + dx * t;
      const newY = p.startY + dy * t;

      p.vx = (newX - p.x) / dt;
      p.vy = (newY - p.y) / dt;

      p.x = newX;
      p.y = newY;
    } else {
      p.vx = 0;
      p.vy = 0;
    }
  }
}

export function updateHazards(hazards: Hazard[], dt: number) {
  for (const h of hazards) {
    if (h.type === 'saw') {
      if (h.rotation === undefined) h.rotation = 0;
      h.rotation += 10 * dt;

      if (h.startX !== undefined && h.endX !== undefined && h.speed) {
        if (h.direction === undefined) h.direction = 1;
        h.x += h.direction * h.speed * dt;
        if (h.x >= h.endX) {
          h.x = h.endX;
          h.direction = -1;
        } else if (h.x <= h.startX) {
          h.x = h.startX;
          h.direction = 1;
        }
      }
    } else if (h.type === 'slime') {
      if (h.startX !== undefined && h.endX !== undefined && h.speed) {
        if (h.direction === undefined) h.direction = 1;
        h.x += h.direction * h.speed * dt;
        if (h.x >= h.endX) {
          h.x = h.endX;
          h.direction = -1;
        } else if (h.x <= h.startX) {
          h.x = h.startX;
          h.direction = 1;
        }
      }
    }
  }
}

export function killPlayer(
  player: PlayerState,
  particles: Particle[],
  floatingTexts: FloatingText[],
  onDeathIncrement?: () => void
) {
  if (player.isDead) return;

  player.isDead = true;
  player.deathTimer = 0.55;
  player.ridingPlatform = null;
  sounds.playDeath();
  if (onDeathIncrement) onDeathIncrement();

  // Spawn death burst particles
  const colors = ['#f43f5e', '#fb923c', '#fbbf24', '#ffffff', '#38bdf8'];
  for (let i = 0; i < 28; i++) {
    const angle = (Math.PI * 2 * i) / 28 + (Math.random() - 0.5) * 0.4;
    const speed = 120 + Math.random() * 260;
    particles.push({
      x: player.x + player.width / 2,
      y: player.y + player.height / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 60,
      life: 0.6 + Math.random() * 0.3,
      maxLife: 0.9,
      size: 4 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: 'square',
      rotation: Math.random() * Math.PI,
      vRot: (Math.random() - 0.5) * 12,
    });
  }

  floatingTexts.push({
    id: 'death_' + Date.now(),
    x: player.x + player.width / 2,
    y: player.y - 10,
    text: 'OOPS!',
    color: '#f43f5e',
    life: 0.6,
    maxLife: 0.6,
  });
}

export function respawnPlayer(player: PlayerState, level: LevelData) {
  let rx = level.spawn.x;
  let ry = level.spawn.y;

  if (player.activeCheckpointId) {
    const cp = level.checkpoints.find((c) => c.id === player.activeCheckpointId);
    if (cp) {
      rx = cp.respawnX;
      ry = cp.respawnY;
    }
  }

  player.x = rx;
  player.y = ry;
  player.vx = 0;
  player.vy = 0;
  player.isDead = false;
  player.deathTimer = 0;
  player.grounded = true;
  player.canDoubleJump = true;
  player.coyoteTimer = 0;
  player.jumpBufferTimer = 0;
  player.ridingPlatform = null;
  player.invulnerableTimer = 1.0; // 1s grace period
  player.squashX = 1;
  player.squashY = 1;
}

export function updatePhysics(
  player: PlayerState,
  level: LevelData,
  keys: ControlKeys,
  dt: number,
  particles: Particle[],
  floatingTexts: FloatingText[],
  onDeath?: () => void,
  onCoinCollected?: () => void,
  onGoalReached?: () => void
) {
  // Handle death timer
  if (player.isDead) {
    player.deathTimer -= dt;
    if (player.deathTimer <= 0) {
      respawnPlayer(player, level);
    }
    return;
  }

  if (player.invulnerableTimer > 0) {
    player.invulnerableTimer -= dt;
  }

  // Smooth squash & stretch relaxation
  player.squashX += (1 - player.squashX) * 15 * dt;
  player.squashY += (1 - player.squashY) * 15 * dt;

  // Jump buffer countdown
  if (keys.jumpJustPressed) {
    player.jumpBufferTimer = JUMP_BUFFER_TIME;
  } else if (player.jumpBufferTimer > 0) {
    player.jumpBufferTimer -= dt;
  }

  // Horizontal Movement Input
  let moveDir = 0;
  if (keys.left) moveDir -= 1;
  if (keys.right) moveDir += 1;

  if (moveDir !== 0) {
    player.facing = moveDir as 1 | -1;
    player.runFrame += Math.abs(player.vx) * dt * 0.05;
  }

  // Horizontal Acceleration / Friction
  const accel = player.grounded ? GROUND_ACCEL : AIR_ACCEL;
  const friction = player.grounded ? GROUND_FRICTION : AIR_DRAG;

  if (moveDir !== 0) {
    player.vx += moveDir * accel * dt;
    if (Math.abs(player.vx) > MAX_RUN_SPEED) {
      player.vx = Math.sign(player.vx) * MAX_RUN_SPEED;
    }
  } else {
    // Decelerate smoothly
    if (Math.abs(player.vx) > 0) {
      const decel = friction * dt;
      if (Math.abs(player.vx) <= decel) {
        player.vx = 0;
      } else {
        player.vx -= Math.sign(player.vx) * decel;
      }
    }
  }

  // Ground dust particles when running
  if (player.grounded && Math.abs(player.vx) > 80 && Math.random() < 0.25) {
    particles.push({
      x: player.x + (player.facing === 1 ? 4 : player.width - 4),
      y: player.y + player.height,
      vx: -player.facing * (20 + Math.random() * 40),
      vy: -10 - Math.random() * 25,
      life: 0.25,
      maxLife: 0.25,
      size: 2.5 + Math.random() * 2,
      color: 'rgba(200, 200, 200, 0.6)',
      shape: 'circle',
    });
  }

  // Coyote time handling
  if (player.grounded) {
    player.coyoteTimer = COYOTE_TIME;
    player.canDoubleJump = true;
    player.isJumping = false;
  } else {
    player.coyoteTimer = Math.max(0, player.coyoteTimer - dt);
  }

  // JUMP LOGIC
  const wantsJump = player.jumpBufferTimer > 0;

  if (wantsJump) {
    // Standard jump (grounded or within coyote time)
    if (player.coyoteTimer > 0) {
      player.vy = JUMP_FORCE;
      player.grounded = false;
      player.coyoteTimer = 0;
      player.jumpBufferTimer = 0;
      player.isJumping = true;
      player.ridingPlatform = null;
      player.squashX = 0.75;
      player.squashY = 1.35;
      sounds.playJump();

      // Jump dust puff
      for (let i = 0; i < 6; i++) {
        particles.push({
          x: player.x + player.width / 2 + (Math.random() - 0.5) * 16,
          y: player.y + player.height,
          vx: (Math.random() - 0.5) * 80,
          vy: -20 - Math.random() * 30,
          life: 0.3,
          maxLife: 0.3,
          size: 3 + Math.random() * 2,
          color: 'rgba(220, 220, 220, 0.7)',
          shape: 'circle',
        });
      }
    }
    // Double jump (in air with double jump available)
    else if (player.canDoubleJump) {
      player.vy = DOUBLE_JUMP_FORCE;
      player.canDoubleJump = false;
      player.jumpBufferTimer = 0;
      player.isJumping = true;
      player.squashX = 0.8;
      player.squashY = 1.3;
      sounds.playDoubleJump();

      // Double jump energy burst particles
      for (let i = 0; i < 14; i++) {
        const angle = (Math.PI * 2 * i) / 14;
        particles.push({
          x: player.x + player.width / 2,
          y: player.y + player.height - 5,
          vx: Math.cos(angle) * (60 + Math.random() * 60),
          vy: Math.sin(angle) * 35 + 20,
          life: 0.35,
          maxLife: 0.35,
          size: 3.5 + Math.random() * 2,
          color: '#38bdf8',
          shape: 'spark',
        });
      }

      floatingTexts.push({
        id: 'dj_' + Date.now(),
        x: player.x + player.width / 2,
        y: player.y - 14,
        text: 'DOUBLE JUMP!',
        color: '#38bdf8',
        life: 0.5,
        maxLife: 0.5,
      });
    }
  }

  // Variable jump height: release jump button early to cut jump height
  if (!keys.jump && player.isJumping && player.vy < 0) {
    player.vy *= JUMP_RELEASE_DAMPING;
    player.isJumping = false;
  }

  // Apply Gravity
  player.vy += GRAVITY * dt;
  if (player.vy > MAX_FALL_SPEED) {
    player.vy = MAX_FALL_SPEED;
  }

  // If riding a moving platform, follow its movement before axis checks
  if (player.ridingPlatform) {
    const p = player.ridingPlatform;
    player.x += (p.vx || 0) * dt;
    player.y += (p.vy || 0) * dt;
  }

  // ===============================
  // X AXIS MOVEMENT & COLLISION
  // ===============================
  player.x += player.vx * dt;

  // Level horizontal boundaries
  if (player.x < 0) {
    player.x = 0;
    player.vx = 0;
  } else if (player.x + player.width > level.width) {
    player.x = level.width - player.width;
    player.vx = 0;
  }

  // Collide X with solid platforms
  const pBoxX: Rect = {
    x: player.x,
    y: player.y,
    width: player.width,
    height: player.height,
  };

  for (const plat of level.platforms) {
    if (plat.isOneWay) continue; // One-way platforms don't block sideways
    if (checkAABB(pBoxX, plat)) {
      if (player.vx > 0) {
        player.x = plat.x - player.width;
      } else if (player.vx < 0) {
        player.x = plat.x + plat.width;
      }
      player.vx = 0;
    }
  }

  // ===============================
  // Y AXIS MOVEMENT & COLLISION
  // ===============================
  const prevY = player.y;
  player.y += player.vy * dt;
  let landedThisFrame = false;
  let onGround = false;

  const pBoxY: Rect = {
    x: player.x,
    y: player.y,
    width: player.width,
    height: player.height,
  };

  // Check static platforms
  for (const plat of level.platforms) {
    if (plat.isOneWay) {
      // One way platform: only land when falling down through the top
      const prevBottom = prevY + player.height;
      const currBottom = player.y + player.height;
      if (
        player.vy >= 0 &&
        prevBottom <= plat.y + 6 &&
        currBottom >= plat.y &&
        player.x + player.width > plat.x + 4 &&
        player.x < plat.x + plat.width - 4
      ) {
        player.y = plat.y - player.height;
        player.vy = 0;
        onGround = true;
        landedThisFrame = !player.grounded;
      }
    } else {
      if (checkAABB(pBoxY, plat)) {
        if (player.vy > 0) {
          // Landing on top
          player.y = plat.y - player.height;
          player.vy = 0;
          onGround = true;
          landedThisFrame = !player.grounded;
        } else if (player.vy < 0) {
          // Hitting ceiling
          player.y = plat.y + plat.height;
          player.vy = 0;
        }
      }
    }
  }

  // Check moving platforms
  let matchedMovingPlatform: MovingPlatform | null = null;
  for (const mp of level.movingPlatforms) {
    const prevBottom = prevY + player.height;
    const currBottom = player.y + player.height;
    const isAbove = prevBottom <= mp.y + 12;
    const isWithinX =
      player.x + player.width > mp.x + 2 && player.x < mp.x + mp.width - 2;

    if (player.vy >= 0 && isAbove && currBottom >= mp.y && isWithinX) {
      player.y = mp.y - player.height;
      player.vy = 0;
      onGround = true;
      landedThisFrame = !player.grounded;
      matchedMovingPlatform = mp;
    }
  }

  player.ridingPlatform = matchedMovingPlatform;
  player.grounded = onGround;

  // Landing visual juice (squash effect and dust)
  if (landedThisFrame) {
    player.squashX = 1.3;
    player.squashY = 0.7;
    for (let i = 0; i < 5; i++) {
      particles.push({
        x: player.x + player.width / 2 + (Math.random() - 0.5) * 18,
        y: player.y + player.height,
        vx: (Math.random() - 0.5) * 50,
        vy: -10 - Math.random() * 20,
        life: 0.2,
        maxLife: 0.2,
        size: 2.5,
        color: 'rgba(230, 230, 230, 0.6)',
        shape: 'circle',
      });
    }
  }

  // ===============================
  // SPRING / BOUNCE PADS
  // ===============================
  if (level.springs) {
    for (const spring of level.springs) {
      if (checkAABB(player, spring) && player.vy >= 0) {
        player.vy = spring.force;
        player.canDoubleJump = true;
        player.ridingPlatform = null;
        player.grounded = false;
        player.squashX = 0.7;
        player.squashY = 1.4;
        spring.compressed = 1.0;
        sounds.playSpring();

        // Bounce sparkles
        for (let i = 0; i < 10; i++) {
          particles.push({
            x: spring.x + spring.width / 2,
            y: spring.y,
            vx: (Math.random() - 0.5) * 90,
            vy: -40 - Math.random() * 80,
            life: 0.35,
            maxLife: 0.35,
            size: 3.5,
            color: '#fbbf24',
            shape: 'spark',
          });
        }

        floatingTexts.push({
          id: 'spring_' + Date.now(),
          x: spring.x + spring.width / 2,
          y: spring.y - 12,
          text: 'BOING!',
          color: '#fbbf24',
          life: 0.5,
          maxLife: 0.5,
        });
      }
      if (spring.compressed && spring.compressed > 0) {
        spring.compressed = Math.max(0, spring.compressed - dt * 4);
      }
    }
  }

  // ===============================
  // COINS COLLISION
  // ===============================
  const pCenterX = player.x + player.width / 2;
  const pCenterY = player.y + player.height / 2;

  for (const coin of level.coins) {
    if (!coin.collected) {
      const dist = Math.hypot(pCenterX - coin.x, pCenterY - coin.y);
      if (dist < coin.radius + 18) {
        coin.collected = true;
        sounds.playCoin();
        if (onCoinCollected) onCoinCollected();

        // Coin sparkle particles
        for (let i = 0; i < 12; i++) {
          const angle = (Math.PI * 2 * i) / 12;
          const spd = 50 + Math.random() * 80;
          particles.push({
            x: coin.x,
            y: coin.y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd - 30,
            life: 0.4,
            maxLife: 0.4,
            size: 3 + Math.random() * 3,
            color: '#facc15',
            shape: 'spark',
          });
        }

        floatingTexts.push({
          id: 'coin_' + coin.id,
          x: coin.x,
          y: coin.y - 15,
          text: '+1 COIN',
          color: '#facc15',
          life: 0.6,
          maxLife: 0.6,
        });
      }
    }
  }

  // ===============================
  // HAZARDS & ENEMIES
  // ===============================
  if (player.invulnerableTimer <= 0) {
    for (const h of level.hazards) {
      if (h.type === 'spike_up' || h.type === 'spike_down' || h.type === 'spike_left' || h.type === 'spike_right') {
        // Inset hitbox slightly so it feels fair
        const spikeHitbox: Rect = {
          x: h.x + 4,
          y: h.y + 4,
          width: h.width - 8,
          height: h.height - 4,
        };
        if (checkAABB(player, spikeHitbox)) {
          killPlayer(player, particles, floatingTexts, onDeath);
          return;
        }
      } else if (h.type === 'saw') {
        const sawCenterX = h.x + h.width / 2;
        const sawCenterY = h.y + h.height / 2;
        const dist = Math.hypot(pCenterX - sawCenterX, pCenterY - sawCenterY);
        if (dist < h.width / 2 + 10) {
          killPlayer(player, particles, floatingTexts, onDeath);
          return;
        }
      } else if (h.type === 'slime') {
        const slimeBox: Rect = {
          x: h.x,
          y: h.y,
          width: h.width,
          height: h.height,
        };

        if (checkAABB(player, slimeBox)) {
          // Check stomp from above
          if (player.vy > 0 && player.y + player.height <= h.y + 14) {
            // Stomped enemy!
            player.vy = -460;
            player.canDoubleJump = true;
            sounds.playStomp();

            // Squash slime or push backwards
            h.x = h.startX ?? h.x;

            // Stomp particles
            for (let i = 0; i < 14; i++) {
              particles.push({
                x: h.x + h.width / 2,
                y: h.y + h.height / 2,
                vx: (Math.random() - 0.5) * 120,
                vy: -30 - Math.random() * 60,
                life: 0.4,
                maxLife: 0.4,
                size: 3.5,
                color: '#a855f7',
                shape: 'square',
              });
            }

            floatingTexts.push({
              id: 'stomp_' + Date.now(),
              x: h.x + h.width / 2,
              y: h.y - 12,
              text: 'STOMP! +100',
              color: '#a855f7',
              life: 0.6,
              maxLife: 0.6,
            });
          } else {
            // Hit by enemy
            killPlayer(player, particles, floatingTexts, onDeath);
            return;
          }
        }
      }
    }
  }

  // ===============================
  // PIT / DEATH BOUNDARY
  // ===============================
  if (player.y > level.deathY) {
    killPlayer(player, particles, floatingTexts, onDeath);
    return;
  }

  // ===============================
  // CHECKPOINT SYSTEM
  // ===============================
  for (const cp of level.checkpoints) {
    if (checkAABB(player, cp)) {
      if (!cp.active) {
        // Deactivate other checkpoints
        for (const other of level.checkpoints) {
          other.active = false;
        }
        cp.active = true;
        player.activeCheckpointId = cp.id;
        sounds.playCheckpoint();

        // Checkpoint burst
        for (let i = 0; i < 20; i++) {
          const angle = (Math.PI * 2 * i) / 20;
          particles.push({
            x: cp.x + cp.width / 2,
            y: cp.y + 15,
            vx: Math.cos(angle) * (70 + Math.random() * 80),
            vy: Math.sin(angle) * 70 - 40,
            life: 0.6,
            maxLife: 0.6,
            size: 4 + Math.random() * 3,
            color: '#10b981',
            shape: 'spark',
          });
        }

        floatingTexts.push({
          id: 'cp_' + cp.id,
          x: cp.x + cp.width / 2,
          y: cp.y - 18,
          text: 'CHECKPOINT SAVED!',
          color: '#10b981',
          life: 1.2,
          maxLife: 1.2,
        });
      }
    }
  }

  // ===============================
  // GOAL FLAG SYSTEM
  // ===============================
  if (!level.goal.reached && checkAABB(player, level.goal)) {
    level.goal.reached = true;
    sounds.playVictory();
    if (onGoalReached) onGoalReached();

    // Triumphant goal confetti / fireworks particles
    const confettiColors = ['#f43f5e', '#3b82f6', '#10b981', '#facc15', '#a855f7', '#ffffff'];
    for (let i = 0; i < 50; i++) {
      const angle = (Math.PI * 2 * i) / 50 + (Math.random() - 0.5) * 0.3;
      const spd = 100 + Math.random() * 200;
      particles.push({
        x: level.goal.x + level.goal.width / 2,
        y: level.goal.y + 20,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 80,
        life: 0.8 + Math.random() * 0.5,
        maxLife: 1.3,
        size: 5 + Math.random() * 4,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        shape: Math.random() > 0.5 ? 'spark' : 'square',
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 14,
      });
    }

    floatingTexts.push({
      id: 'victory_' + Date.now(),
      x: level.goal.x + level.goal.width / 2,
      y: level.goal.y - 25,
      text: 'LEVEL COMPLETE!',
      color: '#facc15',
      life: 2.0,
      maxLife: 2.0,
      fontSize: 22,
    });
  }

  // Player motion trail for double jump
  if (!player.canDoubleJump && Math.random() < 0.3) {
    player.trail.push({
      x: player.x,
      y: player.y,
      alpha: 0.45,
    });
  }

  // Fade trail
  for (let i = player.trail.length - 1; i >= 0; i--) {
    player.trail[i].alpha -= dt * 2.5;
    if (player.trail[i].alpha <= 0) {
      player.trail.splice(i, 1);
    }
  }
}

export function updateParticles(particles: Particle[], dt: number) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 400 * dt; // light particle gravity

    if (p.vRot && p.rotation !== undefined) {
      p.rotation += p.vRot * dt;
    }
  }
}

export function updateFloatingTexts(texts: FloatingText[], dt: number) {
  for (let i = texts.length - 1; i >= 0; i--) {
    const t = texts[i];
    t.life -= dt;
    if (t.life <= 0) {
      texts.splice(i, 1);
      continue;
    }
    t.y -= 35 * dt; // gently float upward
  }
}
