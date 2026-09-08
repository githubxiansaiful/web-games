'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  ArrowLeft,
  Shield,
  Crosshair,
  Coins,
  AlertTriangle,
  RotateCcw,
  Zap,
  MapPin,
  Compass,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/context/AuthContext';
import { multiplayerClient } from '@/lib/multiplayerClient';
import { RoomState } from '@/lib/multiplayerTypes';
import {
  Player,
  Vehicle,
  Enemy,
  Bullet,
  Particle,
  LootCrate,
  Building,
  RoadSegment,
  WorldProp,
  WeaponType,
  VehicleType,
  VEHICLE_CONFIGS,
  WEAPON_CONFIGS,
} from './types';
import {
  WORLD_WIDTH,
  WORLD_HEIGHT,
  RIVER_POINTS,
  RIVER_WIDTH,
  BRIDGES,
  generateRoads,
  generateBuildings,
  generateWorldProps,
  generateLootCrates,
  generateInitialVehicles,
  generateInitialEnemies,
} from './villageMap';
import { villageAudio } from './villageAudio';

interface VillageGameCanvasProps {
  mode: 'solo' | 'multiplayer';
  room?: RoomState | null;
  onGoHome: () => void;
}

export const VillageGameCanvas: React.FC<VillageGameCanvasProps> = ({ mode, room, onGoHome }) => {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Audio mute state
  const [isMuted, setIsMuted] = useState(false);
  const [showMiniMapFull, setShowMiniMapFull] = useState(false);

  // Game Over / Win HUD modal state
  const [gameOver, setGameOver] = useState(false);
  const [gameStats, setGameStats] = useState({ coinsEarned: 0, kills: 0, bounty: 0 });

  // Player state refs for 60fps loop
  const playerRef = useRef<Player>({
    id: user?.id || 'player_local_' + Math.random().toString(36).substring(2, 6),
    name: user?.name || 'Outlaw Rider',
    x: 1700,
    y: 2000,
    angle: 0,
    speed: 0,
    hp: 100,
    maxHp: 100,
    coins: 0,
    wantedLevel: 0,
    wantedTimer: 0,
    inVehicle: null,
    vehicleId: null,
    activeWeapon: 'pistol',
    ammo: { pistol: 999, shotgun: 18, smg: 90 },
    bounty: 0,
    kills: 0,
    isFiring: false,
    color: '#22c55e',
    isLocal: true,
  });

  const partnerRef = useRef<Player | null>(null);
  const vehiclesRef = useRef<Vehicle[]>(generateInitialVehicles());
  const enemiesRef = useRef<Enemy[]>(generateInitialEnemies());
  const bulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const cratesRef = useRef<LootCrate[]>(generateLootCrates());
  const roadsRef = useRef<RoadSegment[]>(generateRoads());
  const buildingsRef = useRef<Building[]>(generateBuildings());
  const propsRef = useRef<WorldProp[]>(generateWorldProps());

  // Input states
  const keysRef = useRef<Record<string, boolean>>({});
  const mouseRef = useRef<{ x: number; y: number; isDown: boolean }>({ x: 0, y: 0, isDown: false });
  const touchJoystickRef = useRef<{ active: boolean; dx: number; dy: number }>({ active: false, dx: 0, dy: 0 });
  const lastShotTimeRef = useRef<number>(0);
  const lastSyncTimeRef = useRef<number>(0);

  // Toggle Mute
  const handleToggleMute = () => {
    const muted = villageAudio.toggleMute();
    setIsMuted(muted);
  };

  // Keyboard input listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;

      // Mount / Dismount vehicle: E key
      if (e.key.toLowerCase() === 'e') {
        toggleVehicleMount();
      }

      // Horn / Bell: H key
      if (e.key.toLowerCase() === 'h') {
        triggerHorn();
      }

      // Weapon Switching
      if (e.key === '1') playerRef.current.activeWeapon = 'pistol';
      if (e.key === '2') playerRef.current.activeWeapon = 'shotgun';
      if (e.key === '3') playerRef.current.activeWeapon = 'smg';

      // Toggle Mini-map: M key
      if (e.key.toLowerCase() === 'm') {
        setShowMiniMapFull((prev) => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      villageAudio.stopEngine();
      villageAudio.stopSiren();
    };
  }, []);

  // Mouse aim & fire listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        mouseRef.current.isDown = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        mouseRef.current.isDown = false;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Multiplayer Socket listeners
  useEffect(() => {
    if (mode !== 'multiplayer') return;

    const handleRemotePlayerSync = (data: any) => {
      if (!data || data.id === playerRef.current.id) return;
      if (!partnerRef.current) {
        partnerRef.current = {
          id: data.id,
          name: data.name || 'Co-Op Partner',
          x: data.x,
          y: data.y,
          angle: data.angle,
          speed: data.speed,
          hp: data.hp,
          maxHp: 100,
          coins: data.coins,
          wantedLevel: data.wantedLevel,
          wantedTimer: 0,
          inVehicle: data.inVehicle,
          vehicleId: data.vehicleId,
          activeWeapon: data.activeWeapon,
          ammo: { pistol: 999, shotgun: 18, smg: 90 },
          bounty: data.bounty,
          kills: 0,
          isFiring: data.isFiring,
          color: '#06b6d4',
          isLocal: false,
        };
      } else {
        // Interpolate partner state
        partnerRef.current.x = data.x;
        partnerRef.current.y = data.y;
        partnerRef.current.angle = data.angle;
        partnerRef.current.speed = data.speed;
        partnerRef.current.hp = data.hp;
        partnerRef.current.inVehicle = data.inVehicle;
        partnerRef.current.vehicleId = data.vehicleId;
        partnerRef.current.activeWeapon = data.activeWeapon;
        partnerRef.current.isFiring = data.isFiring;
        partnerRef.current.wantedLevel = data.wantedLevel;
      }
    };

    const handleRemoteShootSync = (data: any) => {
      if (!data || data.shooterId === playerRef.current.id) return;
      spawnBullet(data.x, data.y, data.angle, data.weaponType, data.shooterId, false);
    };

    const handleRemoteActionSync = (data: any) => {
      if (data.action === 'horn') {
        if (data.vehicleType === 'bus') villageAudio.playBusHorn();
        else if (data.vehicleType === 'bicycle') villageAudio.playBicycleBell();
      }
    };

    multiplayerClient.on('remote_village_player_sync', handleRemotePlayerSync);
    multiplayerClient.on('remote_village_shoot_sync', handleRemoteShootSync);
    multiplayerClient.on('remote_village_action_sync', handleRemoteActionSync);

    return () => {
      multiplayerClient.off('remote_village_player_sync', handleRemotePlayerSync);
      multiplayerClient.off('remote_village_shoot_sync', handleRemoteShootSync);
      multiplayerClient.off('remote_village_action_sync', handleRemoteActionSync);
    };
  }, [mode]);

  // Vehicle Mount / Dismount
  const toggleVehicleMount = () => {
    const p = playerRef.current;
    if (p.inVehicle && p.vehicleId) {
      // Dismount vehicle
      const v = vehiclesRef.current.find((veh) => veh.id === p.vehicleId);
      if (v) {
        v.driverId = null;
        v.speed = 0;
      }
      p.inVehicle = null;
      p.vehicleId = null;
      p.speed = 0;
      villageAudio.stopEngine();
    } else {
      // Look for closest parked vehicle within 75px
      let closest: Vehicle | null = null;
      let minDist = 75;

      for (const v of vehiclesRef.current) {
        if (v.driverId) continue; // already driven
        const dist = Math.hypot(v.x - p.x, v.y - p.y);
        if (dist < minDist) {
          minDist = dist;
          closest = v;
        }
      }

      if (closest) {
        closest.driverId = p.id;
        p.inVehicle = closest.type;
        p.vehicleId = closest.id;
        p.x = closest.x;
        p.y = closest.y;
        p.angle = closest.angle;
        if (closest.type === 'bicycle') villageAudio.playBicycleBell();
        else if (closest.type === 'bus') villageAudio.playBusHorn();
      }
    }
  };

  // Horn Trigger
  const triggerHorn = () => {
    const p = playerRef.current;
    if (p.inVehicle === 'bicycle') {
      villageAudio.playBicycleBell();
    } else if (p.inVehicle === 'bus') {
      villageAudio.playBusHorn();
    } else if (p.inVehicle === 'motorcycle') {
      villageAudio.playBicycleBell();
    }

    if (mode === 'multiplayer' && p.inVehicle) {
      multiplayerClient.emitVillageActionSync({
        action: 'horn',
        vehicleType: p.inVehicle,
      });
    }
  };

  // Spawn Bullet helper
  const spawnBullet = (
    startX: number,
    startY: number,
    angle: number,
    weaponType: WeaponType,
    shooterId: string,
    isEnemy: boolean = false
  ) => {
    const cfg = WEAPON_CONFIGS[weaponType];
    const spreadAngle = (Math.random() - 0.5) * cfg.spread;
    const finalAngle = angle + spreadAngle;

    for (let i = 0; i < cfg.pellets; i++) {
      const pelletSpread = (Math.random() - 0.5) * (cfg.spread * 0.8);
      const dir = finalAngle + pelletSpread;
      const speed = cfg.speed * (0.95 + Math.random() * 0.1);

      bulletsRef.current.push({
        id: 'b_' + Math.random().toString(36).substring(2, 7),
        x: startX + Math.cos(dir) * 20,
        y: startY + Math.sin(dir) * 20,
        vx: Math.cos(dir) * speed,
        vy: Math.sin(dir) * speed,
        radius: weaponType === 'shotgun' ? 3.5 : 2.5,
        color: cfg.color,
        damage: cfg.damage,
        range: cfg.range,
        dist: 0,
        shooterId,
        isEnemy,
      });
    }

    // Muzzle flash particle
    particlesRef.current.push({
      x: startX + Math.cos(angle) * 22,
      y: startY + Math.sin(angle) * 22,
      vx: 0,
      vy: 0,
      size: 14,
      color: '#fef08a',
      life: 4,
      maxLife: 4,
      type: 'muzzle',
    });

    if (!isEnemy && shooterId === playerRef.current.id) {
      villageAudio.playGunshot(weaponType);
    }
  };

  // Shoot weapon action
  const handleShoot = () => {
    const p = playerRef.current;
    const now = Date.now();
    const cfg = WEAPON_CONFIGS[p.activeWeapon];

    if (now - lastShotTimeRef.current < cfg.fireRate) return;
    if (p.ammo[p.activeWeapon] <= 0 && p.activeWeapon !== 'pistol') return;

    lastShotTimeRef.current = now;
    if (p.activeWeapon !== 'pistol') {
      p.ammo[p.activeWeapon] -= 1;
    }

    // Aim angle
    let aimAngle = p.angle;
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const screenCenterX = rect.width / 2;
      const screenCenterY = rect.height / 2;
      aimAngle = Math.atan2(mouseRef.current.y - screenCenterY, mouseRef.current.x - screenCenterX);
    }

    spawnBullet(p.x, p.y, aimAngle, p.activeWeapon, p.id, false);

    // If multiplayer, sync shot
    if (mode === 'multiplayer') {
      multiplayerClient.emitVillageShootSync({
        x: p.x,
        y: p.y,
        angle: aimAngle,
        weaponType: p.activeWeapon,
      });
    }

    // Police Alert if fired within 800px of police station
    const distToPoliceHQ = Math.hypot(p.x - 3350, p.y - 3250);
    if (distToPoliceHQ < 900 && p.wantedLevel === 0) {
      p.wantedLevel = 1;
      p.wantedTimer = 18;
    }
  };

  // Save game stats to database
  const saveStatsToDb = useCallback(
    async (finalCoins: number, finalBounty: number) => {
      if (!user?.id) return;
      try {
        await fetch('/api/games/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            gameId: 'village-outlaws',
            stats: {
              villageGames: 1,
              villageBounty: finalBounty,
              coinsTotal: finalCoins,
            },
          }),
        });
      } catch (err) {
        console.warn('Could not save village stats:', err);
      }
    },
    [user]
  );

  // Main 60 FPS Engine Game Loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to full window
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const updateAndRender = () => {
      const p = playerRef.current;
      const keys = keysRef.current;

      // 1. UPDATE PLAYER PHYSICS
      if (p.hp > 0) {
        let forward = 0;
        let turn = 0;

        // Keyboard Drive Input
        if (keys['w'] || keys['arrowup']) forward += 1;
        if (keys['s'] || keys['arrowdown']) forward -= 0.6;
        if (keys['a'] || keys['arrowleft']) turn -= 1;
        if (keys['d'] || keys['arrowright']) turn += 1;

        // Mobile touch joystick override
        if (touchJoystickRef.current.active) {
          const tj = touchJoystickRef.current;
          forward = -tj.dy;
          turn = tj.dx;
        }

        // Fire on mouse click / hold
        if (mouseRef.current.isDown || keys[' ']) {
          handleShoot();
        }

        // Check ground type for traction & dust
        let isDirt = false;
        for (const road of roadsRef.current) {
          if (road.type === 'dirt') {
            const minX = Math.min(road.x1, road.x2) - road.width;
            const maxX = Math.max(road.x1, road.x2) + road.width;
            const minY = Math.min(road.y1, road.y2) - road.width;
            const maxY = Math.max(road.y1, road.y2) + road.width;
            if (p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY) {
              isDirt = true;
              break;
            }
          }
        }

        if (p.inVehicle && p.vehicleId) {
          // --- VEHICLE DRIVING PHYSICS ---
          const vConfig = VEHICLE_CONFIGS[p.inVehicle];
          const veh = vehiclesRef.current.find((v) => v.id === p.vehicleId);

          if (veh) {
            // Acceleration / braking
            if (forward > 0) {
              veh.speed = Math.min(vConfig.maxSpeed, veh.speed + vConfig.accel);
            } else if (forward < 0) {
              veh.speed = Math.max(-vConfig.reverseSpeed, veh.speed - vConfig.accel * 0.8);
            } else {
              veh.speed *= 0.94; // natural deceleration friction
            }

            // Steering
            if (Math.abs(veh.speed) > 0.3) {
              const turnFactor = veh.speed > 0 ? 1 : -1;
              veh.angle += turn * vConfig.turnSpeed * turnFactor;
            }

            // Move vehicle
            veh.vx = Math.cos(veh.angle) * veh.speed;
            veh.vy = Math.sin(veh.angle) * veh.speed;
            veh.x += veh.vx;
            veh.y += veh.vy;

            // Sync player with vehicle
            p.x = veh.x;
            p.y = veh.y;
            p.angle = veh.angle;
            p.speed = veh.speed;

            // Engine audio modulation
            const speedRatio = Math.abs(veh.speed) / vConfig.maxSpeed;
            villageAudio.updateEngine(speedRatio, p.inVehicle);

            // Tire skid & dust particles
            if (Math.abs(veh.speed) > 3.0 && (isDirt || keys['shift'])) {
              particlesRef.current.push({
                x: veh.x - Math.cos(veh.angle) * (vConfig.length * 0.4),
                y: veh.y - Math.sin(veh.angle) * (vConfig.length * 0.4),
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5,
                size: Math.random() * 7 + 4,
                color: isDirt ? '#d97706' : '#64748b',
                life: 14,
                maxLife: 14,
                type: 'dust',
              });
            }
          }
        } else {
          // --- ON-FOOT WALKING PHYSICS ---
          villageAudio.stopEngine();
          const walkSpeed = 3.5;
          let moveX = 0;
          let moveY = 0;

          if (keys['w'] || keys['arrowup']) moveY -= 1;
          if (keys['s'] || keys['arrowdown']) moveY += 1;
          if (keys['a'] || keys['arrowleft']) moveX -= 1;
          if (keys['d'] || keys['arrowright']) moveX += 1;

          if (moveX !== 0 || moveY !== 0) {
            const moveLen = Math.hypot(moveX, moveY);
            p.x += (moveX / moveLen) * walkSpeed;
            p.y += (moveY / moveLen) * walkSpeed;
          }

          // Aim rotation points to mouse cursor
          const screenCenterX = canvas.width / 2;
          const screenCenterY = canvas.height / 2;
          p.angle = Math.atan2(mouseRef.current.y - screenCenterY, mouseRef.current.x - screenCenterX);
          p.speed = Math.hypot(moveX, moveY) > 0 ? walkSpeed : 0;
        }

        // Clamp to world borders
        p.x = Math.max(80, Math.min(WORLD_WIDTH - 80, p.x));
        p.y = Math.max(80, Math.min(WORLD_HEIGHT - 80, p.y));

        // Wanted Level Cooldown Timer
        if (p.wantedLevel > 0) {
          p.wantedTimer -= 1 / 60;
          if (p.wantedTimer <= 0) {
            p.wantedLevel = Math.max(0, p.wantedLevel - 1);
            p.wantedTimer = p.wantedLevel > 0 ? 15 : 0;
          }
        }
      }

      // 2. MULTIPLAYER SYNC (Emit every 45ms)
      const now = Date.now();
      if (mode === 'multiplayer' && now - lastSyncTimeRef.current > 45) {
        lastSyncTimeRef.current = now;
        multiplayerClient.emitVillagePlayerSync({
          x: p.x,
          y: p.y,
          vx: Math.cos(p.angle) * p.speed,
          vy: Math.sin(p.angle) * p.speed,
          angle: p.angle,
          speed: p.speed,
          hp: p.hp,
          inVehicle: p.inVehicle,
          vehicleId: p.vehicleId,
          activeWeapon: p.activeWeapon,
          isFiring: mouseRef.current.isDown,
          wantedLevel: p.wantedLevel,
          coins: p.coins,
          bounty: p.bounty,
        });
      }

      // 3. UPDATE BULLETS
      for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
        const b = bulletsRef.current[i];
        b.x += b.vx;
        b.y += b.vy;
        b.dist += Math.hypot(b.vx, b.vy);

        if (b.dist >= b.range) {
          bulletsRef.current.splice(i, 1);
          continue;
        }

        // Check bullet hit on player (if enemy bullet)
        if (b.isEnemy && p.hp > 0) {
          const dist = Math.hypot(b.x - p.x, b.y - p.y);
          if (dist < 22) {
            p.hp = Math.max(0, p.hp - b.damage);
            villageAudio.playHit();
            bulletsRef.current.splice(i, 1);

            // Blood particle
            particlesRef.current.push({
              x: p.x,
              y: p.y,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              size: 6,
              color: '#dc2626',
              life: 12,
              maxLife: 12,
              type: 'blood',
            });

            if (p.hp <= 0 && !gameOver) {
              setGameOver(true);
              setGameStats({ coinsEarned: p.coins, kills: p.kills, bounty: p.bounty });
              saveStatsToDb(p.coins, p.bounty);
            }
            continue;
          }
        }

        // Check bullet hit on enemies (if player bullet)
        if (!b.isEnemy) {
          let hitEnemy = false;
          for (let j = enemiesRef.current.length - 1; j >= 0; j--) {
            const en = enemiesRef.current[j];
            const dist = Math.hypot(b.x - en.x, b.y - en.y);
            if (dist < 26) {
              en.hp -= b.damage;
              hitEnemy = true;
              bulletsRef.current.splice(i, 1);

              // Sparks & impact
              particlesRef.current.push({
                x: en.x,
                y: en.y,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                size: 7,
                color: '#f59e0b',
                life: 10,
                maxLife: 10,
                type: 'spark',
              });

              // Enemy defeated
              if (en.hp <= 0) {
                enemiesRef.current.splice(j, 1);
                p.kills += 1;
                const reward = en.type.includes('police') ? 150 : 80;
                p.coins += reward;
                p.bounty += reward * 2;
                villageAudio.playCoin();

                // If killed police, escalate wanted level
                if (en.type.includes('police')) {
                  p.wantedLevel = Math.min(4, p.wantedLevel + 1);
                  p.wantedTimer = 22;
                }
              }
              break;
            }
          }
          if (hitEnemy) continue;
        }

        // Check bullet collision with buildings
        for (const bld of buildingsRef.current) {
          if (b.x >= bld.x && b.x <= bld.x + bld.w && b.y >= bld.y && b.y <= bld.y + bld.h) {
            bulletsRef.current.splice(i, 1);
            particlesRef.current.push({
              x: b.x,
              y: b.y,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              size: 5,
              color: '#94a3b8',
              life: 8,
              maxLife: 8,
              type: 'spark',
            });
            break;
          }
        }
      }

      // 4. UPDATE ENEMY AI (Bandits & Police)
      for (const en of enemiesRef.current) {
        const distToPlayer = Math.hypot(p.x - en.x, p.y - en.y);

        // Police trigger chase if wanted > 0
        const isPolice = en.type.includes('police');
        const shouldChase = isPolice ? p.wantedLevel > 0 && distToPlayer < 900 : distToPlayer < 450;

        if (shouldChase && p.hp > 0) {
          en.state = 'chase';
          en.angle = Math.atan2(p.y - en.y, p.x - en.x);

          // Move towards player
          if (distToPlayer > 130) {
            en.x += Math.cos(en.angle) * en.speed;
            en.y += Math.sin(en.angle) * en.speed;
          }

          // Shoot at player
          en.shootTimer += 1 / 60;
          if (en.shootTimer >= 1.2 && distToPlayer < 400) {
            en.shootTimer = 0;
            spawnBullet(en.x, en.y, en.angle, en.weapon, en.id, true);
          }
        } else {
          // Idle patrol around center
          en.state = 'patrol';
          const distToCenter = Math.hypot(en.patrolCenter.x - en.x, en.patrolCenter.y - en.y);
          if (distToCenter > 120) {
            en.angle = Math.atan2(en.patrolCenter.y - en.y, en.patrolCenter.x - en.x);
            en.x += Math.cos(en.angle) * (en.speed * 0.5);
            en.y += Math.sin(en.angle) * (en.speed * 0.5);
          }
        }
      }

      // 5. UPDATE LOOT CRATES INTERACTION
      for (const crate of cratesRef.current) {
        if (!crate.opened) {
          const dist = Math.hypot(p.x - (crate.x + crate.w / 2), p.y - (crate.y + crate.h / 2));
          if (dist < 40) {
            crate.opened = true;
            villageAudio.playCoin();
            if (crate.type === 'coins') p.coins += crate.value;
            if (crate.type === 'health') p.hp = Math.min(p.maxHp, p.hp + crate.value);
            if (crate.type === 'shotgun') {
              p.ammo.shotgun += 12;
              p.activeWeapon = 'shotgun';
            }
            if (crate.type === 'smg') {
              p.ammo.smg += 60;
              p.activeWeapon = 'smg';
            }
            confetti({ particleCount: 20, spread: 45, origin: { x: 0.5, y: 0.5 } });
          }
        }
      }

      // 6. UPDATE PARTICLES
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const pt = particlesRef.current[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life -= 1;
        if (pt.life <= 0) {
          particlesRef.current.splice(i, 1);
        }
      }

      // 7. CAMERA TRACKING
      const camX = p.x - canvas.width / 2;
      const camY = p.y - canvas.height / 2;

      // -------------------------------------------------------------
      // RENDERING (World -> Camera Space with Viewport Culling)
      // -------------------------------------------------------------
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Base Grass Green Countryside
      ctx.fillStyle = '#1e392a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.translate(-camX, -camY);

      // Grass Texture / Paddy Field Bands
      ctx.fillStyle = '#162e21';
      for (let y = 0; y < WORLD_HEIGHT; y += 400) {
        ctx.fillRect(0, y, WORLD_WIDTH, 180);
      }

      // Golden Farmlands in North-East
      ctx.fillStyle = '#854d0e';
      ctx.fillRect(2700, 200, 1200, 1400);
      ctx.fillStyle = '#a16207';
      ctx.fillRect(2750, 250, 1100, 1300);

      // Rice Paddy Fields in South-West (Water-filled terraces)
      ctx.fillStyle = '#065f46';
      ctx.fillRect(300, 2600, 1300, 1200);
      ctx.fillStyle = '#047857';
      ctx.fillRect(350, 2650, 1200, 1100);

      // Render River Canal
      ctx.lineWidth = RIVER_WIDTH;
      ctx.strokeStyle = '#0284c7';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(RIVER_POINTS[0].x, RIVER_POINTS[0].y);
      for (let i = 1; i < RIVER_POINTS.length; i++) {
        ctx.lineTo(RIVER_POINTS[i].x, RIVER_POINTS[i].y);
      }
      ctx.stroke();

      // Render Roads
      for (const road of roadsRef.current) {
        ctx.beginPath();
        ctx.moveTo(road.x1, road.y1);
        ctx.lineTo(road.x2, road.y2);
        ctx.lineWidth = road.width;
        ctx.lineCap = 'round';

        if (road.type === 'asphalt') {
          ctx.strokeStyle = '#334155';
          ctx.stroke();
          // Dashed center line
          ctx.setLineDash([20, 20]);
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#f8fafc';
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (road.type === 'dirt') {
          ctx.strokeStyle = '#92400e';
          ctx.stroke();
        } else if (road.type === 'bridge') {
          ctx.strokeStyle = '#78350f';
          ctx.stroke();
        }
      }

      // Render Bridges (Wooden and Stone)
      for (const br of BRIDGES) {
        ctx.fillStyle = br.type === 'wooden' ? '#854d0e' : '#64748b';
        ctx.fillRect(br.x, br.y, br.w, br.h);
        // Bridge railings
        ctx.fillStyle = '#3e240c';
        ctx.fillRect(br.x, br.y, br.w, 10);
        ctx.fillRect(br.x, br.y + br.h - 10, br.w, 10);
      }

      // Render Buildings
      for (const bld of buildingsRef.current) {
        // Viewport culling
        if (
          bld.x + bld.w < camX - 100 ||
          bld.x > camX + canvas.width + 100 ||
          bld.y + bld.h < camY - 100 ||
          bld.y > camY + canvas.height + 100
        ) {
          continue;
        }

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(bld.x + 8, bld.y + 8, bld.w, bld.h);

        // Building Walls
        ctx.fillStyle = bld.color;
        ctx.fillRect(bld.x, bld.y, bld.w, bld.h);

        // Roof Trim
        ctx.fillStyle = bld.roofColor;
        ctx.fillRect(bld.x - 4, bld.y - 4, bld.w + 8, 16);

        // Label on Roof
        if (bld.label) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(bld.label, bld.x + bld.w / 2, bld.y + bld.h / 2);
        }
      }

      // Render World Props (Trees, Ponds, Hay)
      for (const pr of propsRef.current) {
        if (
          pr.x + pr.radius < camX - 80 ||
          pr.x - pr.radius > camX + canvas.width + 80 ||
          pr.y + pr.radius < camY - 80 ||
          pr.y - pr.radius > camY + canvas.height + 80
        ) {
          continue;
        }

        if (pr.type === 'palm_tree') {
          // Palm trunk and leaves
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.beginPath();
          ctx.arc(pr.x + 4, pr.y + 4, pr.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#15803d';
          ctx.beginPath();
          ctx.arc(pr.x, pr.y, pr.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.arc(pr.x, pr.y, pr.radius * 0.6, 0, Math.PI * 2);
          ctx.fill();
        } else if (pr.type === 'hay_bale') {
          ctx.fillStyle = '#ca8a04';
          ctx.fillRect(pr.x - pr.radius, pr.y - pr.radius, pr.radius * 2, pr.radius * 2);
        } else if (pr.type === 'water_pond') {
          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.arc(pr.x, pr.y, pr.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Render Loot Crates
      for (const cr of cratesRef.current) {
        if (cr.opened) continue;
        ctx.fillStyle = cr.type === 'shotgun' || cr.type === 'smg' ? '#ef4444' : '#eab308';
        ctx.fillRect(cr.x, cr.y, cr.w, cr.h);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(cr.type === 'shotgun' ? '🔫' : cr.type === 'smg' ? '⚡' : '💰', cr.x + cr.w / 2, cr.y + cr.h - 6);
      }

      // Render Vehicles
      for (const v of vehiclesRef.current) {
        ctx.save();
        ctx.translate(v.x, v.y);
        ctx.rotate(v.angle);

        const vCfg = VEHICLE_CONFIGS[v.type];

        // Vehicle Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(-vCfg.length / 2 + 4, -vCfg.width / 2 + 4, vCfg.length, vCfg.width);

        if (v.type === 'bicycle') {
          // Bicycle frame
          ctx.strokeStyle = v.color;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(-16, 0);
          ctx.lineTo(16, 0);
          ctx.stroke();

          // Wheels
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-20, -3, 8, 6);
          ctx.fillRect(12, -3, 8, 6);
        } else if (v.type === 'motorcycle') {
          // Motorbike body
          ctx.fillStyle = v.color;
          ctx.fillRect(-vCfg.length / 2, -vCfg.width / 2, vCfg.length, vCfg.width);

          // Wheels
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-vCfg.length / 2 - 4, -4, 8, 8);
          ctx.fillRect(vCfg.length / 2 - 4, -4, 8, 8);

          // Headlight
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(vCfg.length / 2 - 2, -3, 4, 6);
        } else if (v.type === 'bus') {
          // Rural Express Bus
          ctx.fillStyle = v.color;
          ctx.fillRect(-vCfg.length / 2, -vCfg.width / 2, vCfg.length, vCfg.width);

          // Roof Rails & Passenger Windows
          ctx.fillStyle = '#e2e8f0';
          for (let wx = -vCfg.length / 2 + 15; wx < vCfg.length / 2 - 15; wx += 20) {
            ctx.fillRect(wx, -vCfg.width / 2 + 4, 12, 6);
            ctx.fillRect(wx, vCfg.width / 2 - 10, 12, 6);
          }

          // Windshield
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(vCfg.length / 2 - 14, -vCfg.width / 2 + 6, 10, vCfg.width - 12);
        }

        ctx.restore();
      }

      // Render Enemies
      for (const en of enemiesRef.current) {
        ctx.save();
        ctx.translate(en.x, en.y);
        ctx.rotate(en.angle);

        // Body
        ctx.fillStyle = en.color;
        ctx.beginPath();
        ctx.arc(0, 0, 13, 0, Math.PI * 2);
        ctx.fill();

        // Gun nozzle
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(8, -2, 12, 4);

        // Health bar above enemy
        ctx.rotate(-en.angle);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-15, -22, 30, 4);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(-15, -22, 30 * (en.hp / en.maxHp), 4);

        ctx.restore();
      }

      // Render Co-Op Partner (if active)
      if (partnerRef.current && partnerRef.current.hp > 0) {
        const pt = partnerRef.current;
        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.angle);

        // Partner Indicator
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();

        // Name tag
        ctx.rotate(-pt.angle);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(pt.name, 0, -22);

        ctx.restore();
      }

      // Render Local Player
      if (p.hp > 0) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        if (!p.inVehicle) {
          // On-foot player body
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, 14, 0, Math.PI * 2);
          ctx.fill();

          // Head & Helmet
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(2, 0, 9, 0, Math.PI * 2);
          ctx.fill();

          // Gun in hand
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(10, 4, 14, 4);
        } else {
          // Riding on vehicle: Driver marker
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.arc(0, 0, 9, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // Render Bullets
      for (const b of bulletsRef.current) {
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Render Particles
      for (const pt of particlesRef.current) {
        const alpha = pt.life / pt.maxLife;
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size * (alpha + 0.2), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      ctx.restore(); // Restore camera space

      // -------------------------------------------------------------
      // 8. HUD & RADAR MINI-MAP (Drawn in Screen Space)
      // -------------------------------------------------------------
      renderHUD(ctx, canvas.width, canvas.height, p);

      animId = requestAnimationFrame(updateAndRender);
    };

    animId = requestAnimationFrame(updateAndRender);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [mode, gameOver, saveStatsToDb]);

  // Screen HUD Rendering Function
  const renderHUD = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    p: Player
  ) => {
    // 1. TOP-LEFT: WANTED STARS, HEALTH & WEAPON
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(16, 16, 260, 110, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Wanted Stars
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = p.wantedLevel > 0 ? '#ef4444' : '#94a3b8';
    ctx.fillText('WANTED LEVEL:', 28, 38);

    for (let s = 1; s <= 4; s++) {
      ctx.fillStyle = s <= p.wantedLevel ? '#eab308' : '#334155';
      ctx.font = '16px sans-serif';
      ctx.fillText('★', 130 + s * 22, 40);
    }

    // Health Bar
    ctx.fillStyle = '#334155';
    ctx.fillRect(28, 52, 236, 12);
    ctx.fillStyle = p.hp > 30 ? '#22c55e' : '#ef4444';
    ctx.fillRect(28, 52, Math.max(0, (p.hp / p.maxHp) * 236), 12);

    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`HP: ${Math.round(p.hp)} / ${p.maxHp}`, 32, 62);

    // Active Weapon & Coins
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#38bdf8';
    const ammoCount =
      p.activeWeapon === 'pistol' ? '∞' : String(p.ammo[p.activeWeapon]);
    ctx.fillText(
      `${WEAPON_CONFIGS[p.activeWeapon].name}: ${ammoCount}`,
      28,
      86
    );

    ctx.fillStyle = '#eab308';
    ctx.fillText(`💰 COINS: ${p.coins}  |  🎯 BOUNTY: $${p.bounty}`, 28, 108);

    // 2. TOP-RIGHT: CIRCULAR RADAR MINI-MAP
    const miniSize = showMiniMapFull ? 280 : 150;
    const miniX = width - miniSize - 20;
    const miniY = 20;

    // Mini-map background circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(
      miniX + miniSize / 2,
      miniY + miniSize / 2,
      miniSize / 2,
      0,
      Math.PI * 2
    );
    ctx.clip();

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(miniX, miniY, miniSize, miniSize);

    // River on mini-map
    ctx.lineWidth = (RIVER_WIDTH / WORLD_WIDTH) * miniSize * 1.5;
    ctx.strokeStyle = '#0284c7';
    ctx.beginPath();
    for (let i = 0; i < RIVER_POINTS.length; i++) {
      const rx = miniX + (RIVER_POINTS[i].x / WORLD_WIDTH) * miniSize;
      const ry = miniY + (RIVER_POINTS[i].y / WORLD_HEIGHT) * miniSize;
      if (i === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    }
    ctx.stroke();

    // Roads on mini-map
    for (const r of roadsRef.current) {
      const x1 = miniX + (r.x1 / WORLD_WIDTH) * miniSize;
      const y1 = miniY + (r.y1 / WORLD_HEIGHT) * miniSize;
      const x2 = miniX + (r.x2 / WORLD_WIDTH) * miniSize;
      const y2 = miniY + (r.y2 / WORLD_HEIGHT) * miniSize;

      ctx.lineWidth = r.type === 'asphalt' ? 3 : 2;
      ctx.strokeStyle = r.type === 'asphalt' ? '#64748b' : '#b45309';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Enemies on mini-map
    for (const en of enemiesRef.current) {
      const ex = miniX + (en.x / WORLD_WIDTH) * miniSize;
      const ey = miniY + (en.y / WORLD_HEIGHT) * miniSize;
      ctx.fillStyle = en.type.includes('police') ? '#3b82f6' : '#ef4444';
      ctx.beginPath();
      ctx.arc(ex, ey, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Vehicles on mini-map
    for (const v of vehiclesRef.current) {
      if (!v.driverId) {
        const vx = miniX + (v.x / WORLD_WIDTH) * miniSize;
        const vy = miniY + (v.y / WORLD_HEIGHT) * miniSize;
        ctx.fillStyle = '#eab308';
        ctx.fillRect(vx - 2, vy - 2, 4, 4);
      }
    }

    // Partner on mini-map (if co-op)
    if (partnerRef.current) {
      const px = miniX + (partnerRef.current.x / WORLD_WIDTH) * miniSize;
      const py = miniY + (partnerRef.current.y / WORLD_HEIGHT) * miniSize;
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Local Player on mini-map (Green Triangle)
    const plX = miniX + (p.x / WORLD_WIDTH) * miniSize;
    const plY = miniY + (p.y / WORLD_HEIGHT) * miniSize;
    ctx.save();
    ctx.translate(plX, plY);
    ctx.rotate(p.angle);
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(-5, -4);
    ctx.lineTo(-5, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.restore(); // end mini-map clipping

    // Mini-map Border Ring
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(
      miniX + miniSize / 2,
      miniY + miniSize / 2,
      miniSize / 2,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    // 3. BOTTOM HELPER HINTS (PC Keyboard)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(width / 2 - 240, height - 44, 480, 32);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      'WASD: Drive/Move  |  E: Mount/Dismount  |  Click/Space: Shoot  |  H: Horn  |  1-3: Weapons  |  M: Map',
      width / 2,
      height - 24
    );

    ctx.restore();
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black select-none touch-none">
      {/* 1. Main Game Canvas */}
      <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair" />

      {/* 2. Top Action Controls Overlay */}
      <div className="absolute top-4 left-72 z-20 flex items-center gap-2">
        <button
          onClick={onGoHome}
          className="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 shadow-xl transition active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit Village</span>
        </button>

        <button
          onClick={handleToggleMute}
          className="p-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white shadow-xl transition active:scale-95"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>
      </div>

      {/* 3. Mobile Touch Virtual Controls Overlay */}
      <div className="sm:hidden absolute bottom-6 left-6 z-30 pointer-events-auto">
        <div
          onTouchStart={(e) => {
            touchJoystickRef.current.active = true;
          }}
          onTouchMove={(e) => {
            const touch = e.touches[0];
            const target = e.currentTarget.getBoundingClientRect();
            const centerX = target.left + target.width / 2;
            const centerY = target.top + target.height / 2;
            const dx = (touch.clientX - centerX) / (target.width / 2);
            const dy = (touch.clientY - centerY) / (target.height / 2);
            touchJoystickRef.current.dx = Math.max(-1, Math.min(1, dx));
            touchJoystickRef.current.dy = Math.max(-1, Math.min(1, dy));
          }}
          onTouchEnd={() => {
            touchJoystickRef.current.active = false;
            touchJoystickRef.current.dx = 0;
            touchJoystickRef.current.dy = 0;
          }}
          className="w-28 h-28 rounded-full bg-slate-900/70 border-2 border-slate-700/80 flex items-center justify-center text-white/50 text-xs font-bold"
        >
          JOYSTICK
        </div>
      </div>

      {/* Mobile Action Buttons Bottom Right */}
      <div className="sm:hidden absolute bottom-6 right-6 z-30 flex flex-col gap-2.5 pointer-events-auto">
        <div className="flex gap-2">
          <button
            onTouchStart={toggleVehicleMount}
            className="w-14 h-14 rounded-2xl bg-amber-600/90 active:bg-amber-500 border border-amber-400 font-black text-xs text-white shadow-xl"
          >
            RIDE
          </button>
          <button
            onTouchStart={triggerHorn}
            className="w-14 h-14 rounded-2xl bg-indigo-600/90 active:bg-indigo-500 border border-indigo-400 font-black text-xs text-white shadow-xl"
          >
            HORN
          </button>
        </div>
        <button
          onTouchStart={handleShoot}
          className="w-full h-14 rounded-2xl bg-red-600/90 active:bg-red-500 border border-red-400 font-black text-xs text-white shadow-xl flex items-center justify-center gap-1"
        >
          <Crosshair className="w-4 h-4" />
          <span>FIRE</span>
        </button>
      </div>

      {/* 4. Game Over Modal */}
      {gameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-red-500/50 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto text-3xl">
              💀
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white">WASTED IN ACTION</h3>
              <p className="text-xs text-slate-400">The village police or bandits took you down.</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Coins Collected:</span>
                <span className="font-bold text-amber-400">+{gameStats.coinsEarned}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Enemies Defeated:</span>
                <span className="font-bold text-emerald-400">{gameStats.kills}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Bounty:</span>
                <span className="font-bold text-cyan-400">${gameStats.bounty}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  playerRef.current.hp = 100;
                  playerRef.current.x = 1700;
                  playerRef.current.y = 2000;
                  playerRef.current.wantedLevel = 0;
                  playerRef.current.inVehicle = null;
                  playerRef.current.vehicleId = null;
                  enemiesRef.current = generateInitialEnemies();
                  setGameOver(false);
                }}
                className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
              >
                Respawn
              </button>
              <button
                onClick={onGoHome}
                className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition"
              >
                Return Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
