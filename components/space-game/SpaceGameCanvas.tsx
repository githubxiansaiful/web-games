'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Home, Trophy, Shield, Bomb, Zap, Sparkles, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/context/AuthContext';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  damage: number;
  isEnemy?: boolean;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  type: 'drone' | 'cruiser' | 'asteroid' | 'boss';
  health: number;
  maxHealth: number;
  color: string;
  shootTimer?: number;
  rotation?: number;
  rotSpeed?: number;
}

interface PowerUp {
  x: number;
  y: number;
  vy: number;
  type: 'weapon' | 'shield' | 'bomb' | 'coin';
  radius: number;
  color: string;
}

interface SpaceGameCanvasProps {
  onGoHome: () => void;
}

export const SpaceGameCanvas: React.FC<SpaceGameCanvasProps> = ({ onGoHome }) => {
  const { user, refreshUser } = useAuth();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [highScore, setHighScore] = useState(user?.stats?.spaceHighScore || 0);
  const [isMuted, setIsMuted] = useState(false);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [bombsCount, setBombsCount] = useState(2);
  const [shieldHp, setShieldHp] = useState(100);

  // Audio Context synth for zero-latency retro sound FX
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSound = useCallback((type: 'laser' | 'explosion' | 'powerup' | 'bomb' | 'gameover') => {
    if (isMuted || typeof window === 'undefined') return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'laser') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'explosion') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'powerup') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.25);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'bomb') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.6);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      }
    } catch {
      // ignore
    }
  }, [isMuted]);

  // Keys & Touch state
  const keysRef = useRef<{ left: boolean; right: boolean; up: boolean; down: boolean; fire: boolean }>({
    left: false,
    right: false,
    up: false,
    down: false,
    fire: false,
  });

  // Game Engine State
  const gameStateRef = useRef({
    player: {
      x: 400,
      y: 600,
      width: 38,
      height: 44,
      vx: 0,
      vy: 0,
      speed: 380,
      weaponLevel: 1,
      shield: 100,
      maxShield: 100,
      bombs: 2,
      shootCooldown: 0,
    },
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    powerUps: [] as PowerUp[],
    particles: [] as Particle[],
    stars: [] as Array<{ x: number; y: number; speed: number; size: number; alpha: number }>,
    enemySpawnTimer: 0,
    waveTimer: 0,
    score: 0,
    wave: 1,
    bossSpawned: false,
  });

  // Mobile virtual touch controls
  const touchOriginRef = useRef<{ x: number; y: number } | null>(null);

  const triggerBomb = useCallback(() => {
    const s = gameStateRef.current;
    if (s.player.bombs <= 0) return;

    s.player.bombs -= 1;
    setBombsCount(s.player.bombs);
    playSound('bomb');

    // Clear all enemy bullets & damage all enemies
    s.bullets = s.bullets.filter((b) => !b.isEnemy);
    s.enemies.forEach((e) => {
      e.health -= 150;
      // Spawn explosion shockwave particles
      for (let i = 0; i < 20; i++) {
        s.particles.push({
          x: e.x + e.width / 2,
          y: e.y + e.height / 2,
          vx: (Math.random() - 0.5) * 400,
          vy: (Math.random() - 0.5) * 400,
          color: '#38bdf8',
          size: Math.random() * 4 + 2,
          life: 0.5,
          maxLife: 0.5,
        });
      }
    });
  }, [playSound]);

  const restartGame = useCallback(() => {
    const s = gameStateRef.current;
    s.player.x = 400;
    s.player.y = 550;
    s.player.vx = 0;
    s.player.vy = 0;
    s.player.weaponLevel = 1;
    s.player.shield = 100;
    s.player.bombs = 2;
    s.bullets = [];
    s.enemies = [];
    s.powerUps = [];
    s.particles = [];
    s.score = 0;
    s.wave = 1;
    s.bossSpawned = false;
    s.enemySpawnTimer = 0;

    setScore(0);
    setWave(1);
    setShieldHp(100);
    setBombsCount(2);
    setIsGameOver(false);
    setIsNewHighScore(false);
  }, []);

  // Main 60FPS Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    // Initialize starry space backdrop
    const state = gameStateRef.current;
    state.stars = [];
    for (let i = 0; i < 80; i++) {
      state.stars.push({
        x: Math.random() * 900,
        y: Math.random() * 700,
        speed: Math.random() * 120 + 30,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.7 + 0.3,
      });
    }

    const loop = (time: number) => {
      animId = requestAnimationFrame(loop);

      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      // Match canvas internal size to client size with DPR capping
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.floor((canvas.clientWidth || 800) * dpr);
      const h = Math.floor((canvas.clientHeight || 600) * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      const cw = canvas.clientWidth || 800;
      const ch = canvas.clientHeight || 600;

      // 1. Draw Space Background
      ctx.fillStyle = '#050814';
      ctx.fillRect(0, 0, cw, ch);

      // Starfield movement
      ctx.fillStyle = '#ffffff';
      for (const st of state.stars) {
        st.y += st.speed * dt;
        if (st.y > ch) {
          st.y = 0;
          st.x = Math.random() * cw;
        }
        ctx.globalAlpha = st.alpha;
        ctx.fillRect(st.x, st.y, st.size, st.size);
      }
      ctx.globalAlpha = 1;

      if (!isPaused && !isGameOver) {
        // 2. Player Input & Physics
        const p = state.player;
        let moveX = 0;
        let moveY = 0;
        if (keysRef.current.left) moveX -= 1;
        if (keysRef.current.right) moveX += 1;
        if (keysRef.current.up) moveY -= 1;
        if (keysRef.current.down) moveY += 1;

        // Normalize diagonal speed
        if (moveX !== 0 && moveY !== 0) {
          moveX *= 0.707;
          moveY *= 0.707;
        }

        p.x += moveX * p.speed * dt;
        p.y += moveY * p.speed * dt;

        // Keep inside bounds
        p.x = Math.max(10, Math.min(cw - p.width - 10, p.x));
        p.y = Math.max(40, Math.min(ch - p.height - 15, p.y));

        // Player Thruster Particles
        if (Math.random() < 0.6) {
          state.particles.push({
            x: p.x + p.width / 2 + (Math.random() - 0.5) * 8,
            y: p.y + p.height,
            vx: (Math.random() - 0.5) * 25,
            vy: Math.random() * 120 + 80,
            color: '#38bdf8',
            size: Math.random() * 3 + 2,
            life: 0.25,
            maxLife: 0.25,
          });
        }

        // 3. Firing Lasers
        p.shootCooldown -= dt;
        if ((keysRef.current.fire || true) && p.shootCooldown <= 0) {
          p.shootCooldown = 0.16; // firing rate
          playSound('laser');

          const midX = p.x + p.width / 2;
          if (p.weaponLevel === 1) {
            state.bullets.push({ x: midX, y: p.y, vx: 0, vy: -650, radius: 3, color: '#38bdf8', damage: 30 });
          } else if (p.weaponLevel === 2) {
            state.bullets.push(
              { x: midX - 8, y: p.y, vx: 0, vy: -650, radius: 3.5, color: '#38bdf8', damage: 30 },
              { x: midX + 8, y: p.y, vx: 0, vy: -650, radius: 3.5, color: '#38bdf8', damage: 30 }
            );
          } else {
            state.bullets.push(
              { x: midX - 10, y: p.y, vx: -80, vy: -640, radius: 3.5, color: '#a855f7', damage: 35 },
              { x: midX, y: p.y, vx: 0, vy: -660, radius: 4, color: '#38bdf8', damage: 45 },
              { x: midX + 10, y: p.y, vx: 80, vy: -640, radius: 3.5, color: '#a855f7', damage: 35 }
            );
          }
        }

        // 4. Enemy Spawning & Wave Progression
        state.enemySpawnTimer -= dt;
        if (state.enemySpawnTimer <= 0) {
          state.enemySpawnTimer = Math.max(0.6, 2.0 - state.wave * 0.15);

          const spawnTypeRand = Math.random();
          const spawnX = Math.random() * (cw - 60) + 30;

          if (spawnTypeRand < 0.5) {
            // Scout Drone
            state.enemies.push({
              id: Date.now() + Math.random(),
              x: spawnX,
              y: -40,
              vx: (Math.random() - 0.5) * 120,
              vy: Math.random() * 80 + 130,
              width: 32,
              height: 32,
              type: 'drone',
              health: 30,
              maxHealth: 30,
              color: '#f43f5e',
            });
          } else if (spawnTypeRand < 0.8) {
            // Asteroid
            state.enemies.push({
              id: Date.now() + Math.random(),
              x: spawnX,
              y: -50,
              vx: (Math.random() - 0.5) * 60,
              vy: Math.random() * 60 + 90,
              width: 42,
              height: 42,
              type: 'asteroid',
              health: 80,
              maxHealth: 80,
              color: '#94a3b8',
              rotation: 0,
              rotSpeed: (Math.random() - 0.5) * 3,
            });
          } else {
            // Cruiser Bomber
            state.enemies.push({
              id: Date.now() + Math.random(),
              x: spawnX,
              y: -60,
              vx: (Math.random() - 0.5) * 70,
              vy: 70,
              width: 48,
              height: 48,
              type: 'cruiser',
              health: 120,
              maxHealth: 120,
              color: '#fbbf24',
              shootTimer: 1.5,
            });
          }
        }

        // Check for Boss Spawn at every 10,000 points
        if (state.score > 0 && Math.floor(state.score / 6000) >= state.wave && !state.bossSpawned) {
          state.bossSpawned = true;
          state.enemies.push({
            id: Date.now(),
            x: cw / 2 - 60,
            y: -100,
            vx: 80,
            vy: 40,
            width: 120,
            height: 90,
            type: 'boss',
            health: 800 + state.wave * 200,
            maxHealth: 800 + state.wave * 200,
            color: '#c084fc',
            shootTimer: 0.8,
          });
        }

        // 5. Update Bullets
        for (let i = state.bullets.length - 1; i >= 0; i--) {
          const b = state.bullets[i];
          b.x += b.vx * dt;
          b.y += b.vy * dt;

          if (b.y < -20 || b.y > ch + 20 || b.x < -20 || b.x > cw + 20) {
            state.bullets.splice(i, 1);
            continue;
          }

          // Check player collision with enemy bullets
          if (b.isEnemy) {
            const dist = Math.hypot(b.x - (p.x + p.width / 2), b.y - (p.y + p.height / 2));
            if (dist < b.radius + p.width * 0.4) {
              p.shield -= b.damage;
              setShieldHp(Math.max(0, p.shield));
              state.bullets.splice(i, 1);

              if (p.shield <= 0) {
                // Game Over
                setIsGameOver(true);
                playSound('explosion');

                // Save game stats
                fetch('/api/games/stats', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    userId: user?.id,
                    gameId: 'space-survivor',
                    stats: {
                      spaceHighScore: Math.max(state.score, highScore),
                    },
                  }),
                }).then(() => refreshUser());

                if (state.score > highScore) {
                  setHighScore(state.score);
                  setIsNewHighScore(true);
                  try {
                    confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
                  } catch {
                    // ignore
                  }
                }
              }
            }
          }
        }

        // 6. Update Enemies & Collisions
        for (let i = state.enemies.length - 1; i >= 0; i--) {
          const e = state.enemies[i];
          e.x += e.vx * dt;
          e.y += e.vy * dt;

          if (e.type === 'asteroid' && e.rotation !== undefined && e.rotSpeed !== undefined) {
            e.rotation += e.rotSpeed * dt;
          }

          // Boss horizontal patrol
          if (e.type === 'boss') {
            if (e.y < 70) e.y += 35 * dt;
            if (e.x <= 20 || e.x >= cw - e.width - 20) e.vx = -e.vx;
          }

          // Enemy shooting
          if (e.shootTimer !== undefined) {
            e.shootTimer -= dt;
            if (e.shootTimer <= 0) {
              e.shootTimer = e.type === 'boss' ? 0.7 : 1.8;
              state.bullets.push({
                x: e.x + e.width / 2,
                y: e.y + e.height,
                vx: 0,
                vy: 320,
                radius: e.type === 'boss' ? 5 : 3.5,
                color: '#f43f5e',
                damage: e.type === 'boss' ? 25 : 15,
                isEnemy: true,
              });
            }
          }

          // Off-screen cleanup
          if (e.y > ch + 60) {
            state.enemies.splice(i, 1);
            continue;
          }

          // Collisions with player bullets
          for (let j = state.bullets.length - 1; j >= 0; j--) {
            const b = state.bullets[j];
            if (b.isEnemy) continue;

            if (
              b.x >= e.x &&
              b.x <= e.x + e.width &&
              b.y >= e.y &&
              b.y <= e.y + e.height
            ) {
              e.health -= b.damage;
              state.bullets.splice(j, 1);

              // Sparks
              for (let k = 0; k < 4; k++) {
                state.particles.push({
                  x: b.x,
                  y: b.y,
                  vx: (Math.random() - 0.5) * 160,
                  vy: (Math.random() - 0.5) * 160,
                  color: e.color,
                  size: 2.5,
                  life: 0.2,
                  maxLife: 0.2,
                });
              }

              // Enemy Destroyed
              if (e.health <= 0) {
                playSound('explosion');
                const pts = e.type === 'boss' ? 2500 : e.type === 'cruiser' ? 300 : e.type === 'asteroid' ? 150 : 100;
                state.score += pts;
                setScore(state.score);

                // Big explosion particles
                for (let k = 0; k < (e.type === 'boss' ? 50 : 15); k++) {
                  state.particles.push({
                    x: e.x + e.width / 2,
                    y: e.y + e.height / 2,
                    vx: (Math.random() - 0.5) * (e.type === 'boss' ? 400 : 220),
                    vy: (Math.random() - 0.5) * (e.type === 'boss' ? 400 : 220),
                    color: e.color,
                    size: Math.random() * 4 + 2,
                    life: 0.4,
                    maxLife: 0.4,
                  });
                }

                // Power-up drops
                if (Math.random() < 0.25 || e.type === 'boss') {
                  const ptypes: Array<'weapon' | 'shield' | 'bomb' | 'coin'> = ['weapon', 'shield', 'bomb', 'coin'];
                  const chosenType = ptypes[Math.floor(Math.random() * ptypes.length)];
                  state.powerUps.push({
                    x: e.x + e.width / 2,
                    y: e.y + e.height / 2,
                    vy: 110,
                    type: chosenType,
                    radius: 12,
                    color: chosenType === 'weapon' ? '#38bdf8' : chosenType === 'shield' ? '#34d399' : chosenType === 'bomb' ? '#f43f5e' : '#fbbf24',
                  });
                }

                if (e.type === 'boss') {
                  state.bossSpawned = false;
                  state.wave += 1;
                  setWave(state.wave);
                }

                state.enemies.splice(i, 1);
                break;
              }
            }
          }
        }

        // 7. Update Power-ups
        for (let i = state.powerUps.length - 1; i >= 0; i--) {
          const pu = state.powerUps[i];
          pu.y += pu.vy * dt;

          // Player pickup
          const dist = Math.hypot(pu.x - (p.x + p.width / 2), pu.y - (p.y + p.height / 2));
          if (dist < pu.radius + p.width / 2) {
            playSound('powerup');
            if (pu.type === 'weapon') {
              p.weaponLevel = Math.min(3, p.weaponLevel + 1);
            } else if (pu.type === 'shield') {
              p.shield = Math.min(100, p.shield + 40);
              setShieldHp(p.shield);
            } else if (pu.type === 'bomb') {
              p.bombs += 1;
              setBombsCount(p.bombs);
            } else if (pu.type === 'coin') {
              state.score += 500;
              setScore(state.score);
            }
            state.powerUps.splice(i, 1);
            continue;
          }

          if (pu.y > ch + 20) state.powerUps.splice(i, 1);
        }

        // 8. Update Particles
        for (let i = state.particles.length - 1; i >= 0; i--) {
          const pt = state.particles[i];
          pt.x += pt.vx * dt;
          pt.y += pt.vy * dt;
          pt.life -= dt;
          if (pt.life <= 0) state.particles.splice(i, 1);
        }
      }

      // ==========================================
      // 9. DRAW SCENE
      // ==========================================

      // Draw Power-ups
      for (const pu of state.powerUps) {
        ctx.fillStyle = pu.color;
        ctx.beginPath();
        ctx.arc(pu.x, pu.y, pu.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = pu.type === 'weapon' ? 'W' : pu.type === 'shield' ? 'S' : pu.type === 'bomb' ? 'B' : '★';
        ctx.fillText(label, pu.x, pu.y);
      }

      // Draw Bullets
      for (const b of state.bullets) {
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Enemies
      for (const e of state.enemies) {
        ctx.save();
        ctx.translate(e.x + e.width / 2, e.y + e.height / 2);

        if (e.type === 'asteroid') {
          if (e.rotation !== undefined) ctx.rotate(e.rotation);
          ctx.fillStyle = '#475569';
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          const sides = 7;
          for (let s = 0; s < sides; s++) {
            const a = (s * Math.PI * 2) / sides;
            const r = (e.width / 2) * (0.8 + ((s % 3) * 0.15));
            if (s === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (e.type === 'drone') {
          // Sharp neon triangular dart
          ctx.fillStyle = e.color;
          ctx.beginPath();
          ctx.moveTo(0, e.height / 2);
          ctx.lineTo(-e.width / 2, -e.height / 2);
          ctx.lineTo(0, -e.height * 0.2);
          ctx.lineTo(e.width / 2, -e.height / 2);
          ctx.closePath();
          ctx.fill();
        } else if (e.type === 'cruiser') {
          // Heavy armored alien wing
          ctx.fillStyle = e.color;
          ctx.beginPath();
          ctx.moveTo(0, e.height / 2);
          ctx.lineTo(-e.width / 2, 0);
          ctx.lineTo(-e.width / 3, -e.height / 2);
          ctx.lineTo(e.width / 3, -e.height / 2);
          ctx.lineTo(e.width / 2, 0);
          ctx.closePath();
          ctx.fill();
        } else if (e.type === 'boss') {
          // Colossal Dreadnought
          ctx.fillStyle = e.color;
          ctx.beginPath();
          ctx.moveTo(0, e.height / 2);
          ctx.lineTo(-e.width / 2, -e.height / 3);
          ctx.lineTo(-e.width / 3, -e.height / 2);
          ctx.lineTo(e.width / 3, -e.height / 2);
          ctx.lineTo(e.width / 2, -e.height / 3);
          ctx.closePath();
          ctx.fill();

          // Boss Health Bar above
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(-e.width / 2, -e.height / 2 - 14, e.width, 6);
          ctx.fillStyle = '#ec4899';
          const hpPct = Math.max(0, e.health / e.maxHealth);
          ctx.fillRect(-e.width / 2, -e.height / 2 - 14, e.width * hpPct, 6);
        }

        ctx.restore();
      }

      // Draw Particles
      for (const pt of state.particles) {
        ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Draw Player Starfighter
      const p = state.player;
      ctx.save();
      ctx.translate(p.x + p.width / 2, p.y + p.height / 2);

      // Deflector Shield Bubble
      if (p.shield > 0) {
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.3 + (p.shield / 100) * 0.4})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, p.width * 0.8, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Ship Wings & Hull
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(0, -p.height / 2);
      ctx.lineTo(p.width / 2, p.height / 2);
      ctx.lineTo(p.width / 4, p.height / 3);
      ctx.lineTo(0, p.height * 0.45);
      ctx.lineTo(-p.width / 4, p.height / 3);
      ctx.lineTo(-p.width / 2, p.height / 2);
      ctx.closePath();
      ctx.fill();

      // Cockpit Glow
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, -p.height * 0.15, p.width * 0.15, p.height * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      ctx.restore();
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPaused, isGameOver, highScore, playSound, user, refreshUser]);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keysRef.current.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keysRef.current.right = true;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') keysRef.current.up = true;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') keysRef.current.down = true;
      if (e.code === 'Space') keysRef.current.fire = true;
      if (e.code === 'KeyB') triggerBomb();
      if (e.code === 'KeyP' || e.code === 'Escape') setIsPaused((prev) => !prev);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keysRef.current.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keysRef.current.right = false;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') keysRef.current.up = false;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') keysRef.current.down = false;
      if (e.code === 'Space') keysRef.current.fire = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [triggerBomb]);

  // Touch Virtual Joystick Handlers for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchOriginRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchOriginRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchOriginRef.current.x;
    const dy = touch.clientY - touchOriginRef.current.y;

    keysRef.current.left = dx < -20;
    keysRef.current.right = dx > 20;
    keysRef.current.up = dy < -20;
    keysRef.current.down = dy > 20;
  };

  const handleTouchEnd = () => {
    touchOriginRef.current = null;
    keysRef.current.left = false;
    keysRef.current.right = false;
    keysRef.current.up = false;
    keysRef.current.down = false;
  };

  return (
    <div className="relative w-full h-screen bg-slate-950 flex flex-col items-center justify-center select-none overflow-hidden">
      {/* Top HUD Bar */}
      <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 flex items-center justify-between z-20 pointer-events-none safe-top">
        {/* Left Side: Back & Score */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onGoHome}
            className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 rounded-xl text-slate-300 hover:text-white transition cursor-pointer shadow-md"
            title="Exit to Xian's Game World"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="bg-slate-900/85 border border-indigo-500/50 rounded-xl px-3 py-1 text-white shadow-md">
            <span className="text-[10px] text-slate-400 block font-bold leading-none">SCORE</span>
            <span className="font-mono text-sm sm:text-base font-black text-cyan-400">{score.toLocaleString()}</span>
          </div>
          <div className="hidden xs:flex bg-slate-900/85 border border-slate-700/60 rounded-xl px-3 py-1 text-white shadow-md">
            <span className="text-[10px] text-slate-400 block font-bold leading-none">WAVE</span>
            <span className="font-mono text-sm font-black text-indigo-300">{wave}</span>
          </div>
        </div>

        {/* Center: Shield & Bombs */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-slate-900/85 border border-slate-700/60 rounded-xl px-2.5 py-1 text-xs flex items-center gap-1.5 shadow-md">
            <Shield className="w-3.5 h-3.5 text-sky-400" />
            <div className="w-16 h-2 bg-slate-850 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 transition-all duration-200"
                style={{ width: `${shieldHp}%` }}
              />
            </div>
          </div>
          <button
            onClick={triggerBomb}
            className="bg-rose-950/80 hover:bg-rose-900 border border-rose-500/60 text-rose-300 rounded-xl px-2.5 py-1 text-xs font-bold flex items-center gap-1 shadow-md cursor-pointer transition active:scale-95"
            title="Trigger Smart Bomb (Key B)"
          >
            <Bomb className="w-3.5 h-3.5 text-rose-400" />
            <span>{bombsCount}</span>
          </button>
        </div>

        {/* Right Side: Mute & Pause */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => setIsMuted((prev) => !prev)}
            className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-slate-300 transition cursor-pointer shadow-md"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full h-full block cursor-crosshair touch-none select-none"
      />

      {/* Mobile Bomb Button */}
      <div className="sm:hidden absolute bottom-6 right-6 z-20 flex gap-3 pointer-events-auto">
        <button
          onClick={triggerBomb}
          className="w-14 h-14 rounded-full bg-rose-600/90 border-2 border-rose-400 text-white font-black text-xs flex flex-col items-center justify-center shadow-2xl active:scale-90 transition cursor-pointer"
        >
          <Bomb className="w-5 h-5 mb-0.5" />
          <span>BOMB</span>
        </button>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-rose-500/50 rounded-3xl max-w-sm w-full p-6 text-center text-white shadow-2xl">
            <h2 className="text-3xl font-black text-rose-500 mb-1">MISSION FAILED</h2>
            <p className="text-xs text-slate-400 mb-5">Your ship was blasted by enemy fire!</p>

            <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-4 mb-5 space-y-2 text-left text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Final Score:</span>
                <span className="font-mono font-bold text-cyan-400 text-sm">{score.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Waves Survived:</span>
                <span className="font-mono font-bold text-indigo-300">{wave}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Personal Best:</span>
                <span className="font-mono font-bold text-amber-400">{Math.max(score, highScore).toLocaleString()}</span>
              </div>
            </div>

            {isNewHighScore && (
              <div className="mb-4 p-2.5 bg-amber-500/20 border border-amber-500/50 rounded-xl text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 animate-bounce">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>NEW HIGH SCORE RECORD!</span>
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <button
                onClick={restartGame}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Launch Again</span>
              </button>
              <button
                onClick={onGoHome}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-bold text-sm text-slate-300 cursor-pointer transition"
              >
                Exit to Xian&apos;s Game World
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
