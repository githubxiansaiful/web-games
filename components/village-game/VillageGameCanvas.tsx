'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
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
  Radio,
  Eye,
  MapPin,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/context/AuthContext';
import { multiplayerClient } from '@/lib/multiplayerClient';
import { RoomState } from '@/lib/multiplayerTypes';
import { villageAudio } from './villageAudio';

interface VillageGameCanvasProps {
  mode: 'solo' | 'multiplayer';
  room?: RoomState | null;
  onGoHome: () => void;
}

type Vehicle3DType = 'bicycle' | 'motorcycle' | 'bus';
type Weapon3DType = 'pistol' | 'shotgun' | 'smg';

interface VehicleEntity {
  id: string;
  type: Vehicle3DType;
  mesh: THREE.Group;
  wheels: THREE.Mesh[];
  steeringPart?: THREE.Object3D;
  speed: number;
  maxSpeed: number;
  accel: number;
  turnSpeed: number;
  heading: number;
  driverId: string | null;
  hp: number;
  maxHp: number;
  isPolice?: boolean;
}

interface EnemyEntity {
  id: string;
  mesh: THREE.Group;
  speed: number;
  hp: number;
  maxHp: number;
  shootTimer: number;
  isPolice: boolean;
  targetPos: THREE.Vector3;
}

interface Bullet3D {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  dist: number;
  range: number;
  damage: number;
  isEnemy: boolean;
}

interface Particle3D {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export const VillageGameCanvas: React.FC<VillageGameCanvasProps> = ({ mode, room, onGoHome }) => {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const miniMapCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Audio & UI states
  const [isMuted, setIsMuted] = useState(false);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(0);
  const [playerHp, setPlayerHp] = useState(100);
  const [playerCoins, setPlayerCoins] = useState(0);
  const [playerBounty, setPlayerBounty] = useState(0);
  const [wantedLevel, setWantedLevel] = useState(0);
  const [activeWeapon, setActiveWeapon] = useState<Weapon3DType>('smg');
  const [ammoCount, setAmmoCount] = useState<Record<Weapon3DType, number>>({
    pistol: 999,
    shotgun: 24,
    smg: 120,
  });
  const [inVehicle, setInVehicle] = useState<Vehicle3DType | null>('motorcycle');
  const [gameOver, setGameOver] = useState(false);

  // Refs for 60 FPS Three.js loop
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const playerMeshRef = useRef<THREE.Group | null>(null);
  const partnerMeshRef = useRef<THREE.Group | null>(null);
  const vehiclesRef = useRef<VehicleEntity[]>([]);
  const enemiesRef = useRef<EnemyEntity[]>([]);
  const bulletsRef = useRef<Bullet3D[]>([]);
  const particlesRef = useRef<Particle3D[]>([]);
  const windmillsRef = useRef<THREE.Group[]>([]);
  const sirenLightRef = useRef<THREE.PointLight | null>(null);

  const activeVehicleIdRef = useRef<string | null>('v_moto_player');
  const inVehicleRef = useRef<Vehicle3DType | null>('motorcycle');
  const playerPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const playerRotRef = useRef<number>(0);
  const playerSpeedRef = useRef<number>(0);

  const keysRef = useRef<Record<string, boolean>>({});
  const mouseRef = useRef<{ isDown: boolean; x: number; y: number }>({ isDown: false, x: 0, y: 0 });
  const touchJoystickRef = useRef<{ active: boolean; dx: number; dy: number }>({ active: false, dx: 0, dy: 0 });

  const lastShootTimeRef = useRef<number>(0);
  const lastSyncTimeRef = useRef<number>(0);
  const wantedTimerRef = useRef<number>(0);

  // Toggle Mute
  const handleToggleMute = () => {
    const m = villageAudio.toggleMute();
    setIsMuted(m);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;

      // Mount/Dismount: E
      if (e.key.toLowerCase() === 'e') {
        handleToggleMount();
      }

      // Horn: H
      if (e.key.toLowerCase() === 'h') {
        handleTriggerHorn();
      }

      // Switch Weapon: 1, 2, 3
      if (e.key === '1') setActiveWeapon('pistol');
      if (e.key === '2') setActiveWeapon('shotgun');
      if (e.key === '3') setActiveWeapon('smg');
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

  // Mouse aim & fire
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) mouseRef.current.isDown = true;
    };
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) mouseRef.current.isDown = false;
    };
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Vehicle mount / dismount toggle
  const handleToggleMount = () => {
    if (inVehicleRef.current && activeVehicleIdRef.current) {
      // Exit vehicle
      const v = vehiclesRef.current.find((veh) => veh.id === activeVehicleIdRef.current);
      if (v) {
        v.driverId = null;
        v.speed = 0;
      }
      inVehicleRef.current = null;
      activeVehicleIdRef.current = null;
      setInVehicle(null);
      villageAudio.stopEngine();
      if (playerMeshRef.current) playerMeshRef.current.visible = true;
    } else {
      // Find closest vehicle within 7 meters
      const pPos = playerPosRef.current;
      let closest: VehicleEntity | null = null;
      let minDist = 7.0;

      for (const v of vehiclesRef.current) {
        if (v.driverId) continue;
        const d = pPos.distanceTo(v.mesh.position);
        if (d < minDist) {
          minDist = d;
          closest = v;
        }
      }

      if (closest) {
        closest.driverId = 'local_player';
        activeVehicleIdRef.current = closest.id;
        inVehicleRef.current = closest.type;
        setInVehicle(closest.type);
        playerPosRef.current.copy(closest.mesh.position);
        playerRotRef.current = closest.heading;
        if (playerMeshRef.current) playerMeshRef.current.visible = false;

        if (closest.type === 'bicycle') villageAudio.playBicycleBell();
        else if (closest.type === 'bus') villageAudio.playBusHorn();
      }
    }
  };

  // Horn trigger
  const handleTriggerHorn = () => {
    if (inVehicleRef.current === 'bus') {
      villageAudio.playBusHorn();
    } else if (inVehicleRef.current === 'bicycle' || inVehicleRef.current === 'motorcycle') {
      villageAudio.playBicycleBell();
    }

    if (mode === 'multiplayer' && inVehicleRef.current) {
      multiplayerClient.emitVillageActionSync({
        action: 'horn',
        vehicleType: inVehicleRef.current,
      });
    }
  };

  // Shoot weapon action
  const handleShoot = () => {
    const scene = sceneRef.current;
    if (!scene || gameOver) return;
    const now = Date.now();
    const fireRate = activeWeapon === 'smg' ? 110 : activeWeapon === 'shotgun' ? 650 : 250;

    if (now - lastShootTimeRef.current < fireRate) return;
    if (ammoCount[activeWeapon] <= 0 && activeWeapon !== 'pistol') return;

    lastShootTimeRef.current = now;
    if (activeWeapon !== 'pistol') {
      setAmmoCount((prev) => ({ ...prev, [activeWeapon]: prev[activeWeapon] - 1 }));
    }

    villageAudio.playGunshot(activeWeapon);

    // Spawn 3D bullet tracer
    const pPos = playerPosRef.current;
    const pRot = playerRotRef.current;
    const bulletGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 6);
    bulletGeo.rotateX(Math.PI / 2);
    const bulletMat = new THREE.MeshBasicMaterial({
      color: activeWeapon === 'shotgun' ? 0xf97316 : activeWeapon === 'smg' ? 0x38bdf8 : 0xfacc15,
    });

    const pellets = activeWeapon === 'shotgun' ? 4 : 1;
    for (let i = 0; i < pellets; i++) {
      const spread = (Math.random() - 0.5) * (activeWeapon === 'shotgun' ? 0.25 : 0.06);
      const bMesh = new THREE.Mesh(bulletGeo, bulletMat);
      bMesh.position.set(pPos.x + Math.sin(pRot) * 1.5, pPos.y + 1.2, pPos.z + Math.cos(pRot) * 1.5);
      bMesh.rotation.y = pRot + spread;
      scene.add(bMesh);

      const speed = 75;
      const bVel = new THREE.Vector3(Math.sin(pRot + spread) * speed, 0, Math.cos(pRot + spread) * speed);

      bulletsRef.current.push({
        mesh: bMesh,
        velocity: bVel,
        dist: 0,
        range: activeWeapon === 'shotgun' ? 45 : 95,
        damage: activeWeapon === 'shotgun' ? 22 : activeWeapon === 'smg' ? 18 : 30,
        isEnemy: false,
      });
    }

    // Multiplayer sync shot
    if (mode === 'multiplayer') {
      multiplayerClient.emitVillageShootSync({
        x: pPos.x,
        y: pPos.z,
        angle: pRot,
        weaponType: activeWeapon,
      });
    }

    // Alert police if shooting near police station (z: -180, x: 180)
    const distToPoliceStation = Math.hypot(pPos.x - 180, pPos.z - 180);
    if (distToPoliceStation < 85 && wantedLevel === 0) {
      setWantedLevel(1);
      wantedTimerRef.current = 20;
    }
  };

  // Save stats to database
  const saveStatsToDb = useCallback(
    async (coins: number, bounty: number) => {
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
              villageBounty: bounty,
              coinsTotal: coins,
            },
          }),
        });
      } catch (err) {
        console.warn('Could not save village stats:', err);
      }
    },
    [user]
  );

  // Initialize 3D Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.0035);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.2, 800);
    camera.position.set(0, 5, -8);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.25);
    sunLight.position.set(120, 180, 100);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 450;
    const shadowD = 150;
    sunLight.shadow.camera.left = -shadowD;
    sunLight.shadow.camera.right = shadowD;
    sunLight.shadow.camera.top = shadowD;
    sunLight.shadow.camera.bottom = -shadowD;
    scene.add(sunLight);

    // Flashing Police Siren Point Light
    const sirenLight = new THREE.PointLight(0x3b82f6, 0, 35);
    sirenLight.position.set(0, 3, 0);
    scene.add(sirenLight);
    sirenLightRef.current = sirenLight;

    // 5. Build 3D Terrain & Roads
    buildVillageEnvironment(scene);

    // 6. Build 3D Vehicles
    const vehicles = create3DVehicles(scene);
    vehiclesRef.current = vehicles;

    // 7. Build 3D Enemies (Bandits & Police)
    const enemies = create3DEnemies(scene);
    enemiesRef.current = enemies;

    // 8. Build 3D Local Player on foot mesh
    const playerGroup = create3DCharacterMesh('#22c55e');
    playerGroup.position.set(0, 0, 0);
    playerGroup.visible = false; // Starts driving the red motorcycle!
    scene.add(playerGroup);
    playerMeshRef.current = playerGroup;

    // 9. Resize listener
    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // 10. Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const now = clock.getElapsedTime();

      // Rotate windmills
      for (const wm of windmillsRef.current) {
        wm.rotation.z += delta * 1.5;
      }

      // Siren flashing
      if (sirenLightRef.current) {
        if (wantedLevel > 0) {
          const isBlue = Math.floor(now * 8) % 2 === 0;
          sirenLightRef.current.color.setHex(isBlue ? 0x2563eb : 0xdc2626);
          sirenLightRef.current.intensity = 4.5;
          villageAudio.updateSiren(true);
        } else {
          sirenLightRef.current.intensity = 0;
          villageAudio.stopSiren();
        }
      }

      // Input Driving / Walking
      const keys = keysRef.current;
      let throttle = 0;
      let steer = 0;

      if (keys['w'] || keys['arrowup']) throttle += 1;
      if (keys['s'] || keys['arrowdown']) throttle -= 0.6;
      if (keys['a'] || keys['arrowleft']) steer += 1;
      if (keys['d'] || keys['arrowright']) steer -= 1;

      // Mobile joystick override
      if (touchJoystickRef.current.active) {
        throttle = -touchJoystickRef.current.dy;
        steer = -touchJoystickRef.current.dx;
      }

      // Shoot on mouse click
      if (mouseRef.current.isDown || keys[' ']) {
        handleShoot();
      }

      // Update Vehicle Physics
      if (inVehicleRef.current && activeVehicleIdRef.current) {
        const activeVeh = vehiclesRef.current.find((v) => v.id === activeVehicleIdRef.current);
        if (activeVeh) {
          // Acceleration / Braking
          if (throttle > 0) {
            activeVeh.speed = Math.min(activeVeh.maxSpeed, activeVeh.speed + activeVeh.accel * delta * 60);
          } else if (throttle < 0) {
            activeVeh.speed = Math.max(-activeVeh.maxSpeed * 0.4, activeVeh.speed - activeVeh.accel * 0.7 * delta * 60);
          } else {
            activeVeh.speed *= Math.pow(0.96, delta * 60); // Friction
          }

          // Steering
          if (Math.abs(activeVeh.speed) > 0.1) {
            const dir = activeVeh.speed > 0 ? 1 : -1;
            activeVeh.heading += steer * activeVeh.turnSpeed * dir * delta * 60;
          }

          // Move vehicle mesh
          const vx = Math.sin(activeVeh.heading) * activeVeh.speed * delta * 60;
          const vz = Math.cos(activeVeh.heading) * activeVeh.speed * delta * 60;
          activeVeh.mesh.position.x += vx;
          activeVeh.mesh.position.z += vz;
          activeVeh.mesh.rotation.y = activeVeh.heading;

          // Rotate wheels
          for (const w of activeVeh.wheels) {
            w.rotation.x += (activeVeh.speed * delta * 60) / 0.8;
          }

          // Lean motorbike into turns
          if (activeVeh.type === 'motorcycle') {
            activeVeh.mesh.rotation.z = -steer * Math.min(0.28, Math.abs(activeVeh.speed) * 0.25);
          }

          // Audio engine rev
          const speedRatio = Math.abs(activeVeh.speed) / activeVeh.maxSpeed;
          villageAudio.updateEngine(speedRatio, activeVeh.type);
          setCurrentSpeedKmh(Math.round(speedRatio * 135));

          // Sync player pos
          playerPosRef.current.copy(activeVeh.mesh.position);
          playerRotRef.current = activeVeh.heading;
          playerSpeedRef.current = activeVeh.speed;

          // Attach siren light to police vehicle or player
          if (sirenLightRef.current) {
            sirenLightRef.current.position.set(
              activeVeh.mesh.position.x,
              activeVeh.mesh.position.y + 2.5,
              activeVeh.mesh.position.z
            );
          }
        }
      } else {
        // On Foot Movement
        const walkSpeed = 7.0;
        let mx = 0;
        let mz = 0;
        if (keys['w'] || keys['arrowup']) mz += 1;
        if (keys['s'] || keys['arrowdown']) mz -= 1;
        if (keys['a'] || keys['arrowleft']) mx += 1;
        if (keys['d'] || keys['arrowright']) mx -= 1;

        if (mx !== 0 || mz !== 0) {
          const moveAngle = Math.atan2(mx, mz);
          playerRotRef.current = moveAngle;
          playerPosRef.current.x += Math.sin(moveAngle) * walkSpeed * delta;
          playerPosRef.current.z += Math.cos(moveAngle) * walkSpeed * delta;
          setCurrentSpeedKmh(12);
        } else {
          setCurrentSpeedKmh(0);
        }

        if (playerMeshRef.current) {
          playerMeshRef.current.position.copy(playerPosRef.current);
          playerMeshRef.current.rotation.y = playerRotRef.current;
        }
      }

      // Smooth 3rd-Person Chase Camera
      const pPos = playerPosRef.current;
      const pRot = playerRotRef.current;
      const camDist = inVehicleRef.current === 'bus' ? 14 : inVehicleRef.current === 'motorcycle' ? 8.5 : 6.5;
      const camHeight = inVehicleRef.current === 'bus' ? 6.5 : 3.8;

      const targetCamX = pPos.x - Math.sin(pRot) * camDist;
      const targetCamY = pPos.y + camHeight;
      const targetCamZ = pPos.z - Math.cos(pRot) * camDist;

      camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), 0.12);
      camera.lookAt(pPos.x, pPos.y + 1.6, pPos.z);

      // Update 3D Bullets
      for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
        const b = bulletsRef.current[i];
        const step = b.velocity.clone().multiplyScalar(delta);
        b.mesh.position.add(step);
        b.dist += step.length();

        if (b.dist >= b.range) {
          scene.remove(b.mesh);
          bulletsRef.current.splice(i, 1);
          continue;
        }

        // Bullet hit enemy
        if (!b.isEnemy) {
          let hit = false;
          for (let j = enemiesRef.current.length - 1; j >= 0; j--) {
            const en = enemiesRef.current[j];
            const d = b.mesh.position.distanceTo(en.mesh.position);
            if (d < 2.0) {
              en.hp -= b.damage;
              scene.remove(b.mesh);
              bulletsRef.current.splice(i, 1);
              hit = true;

              if (en.hp <= 0) {
                scene.remove(en.mesh);
                enemiesRef.current.splice(j, 1);
                const bountyReward = en.isPolice ? 200 : 100;
                setPlayerCoins((prev) => prev + bountyReward);
                setPlayerBounty((prev) => prev + bountyReward * 2);
                villageAudio.playCoin();
                confetti({ particleCount: 25, spread: 50 });

                if (en.isPolice) {
                  setWantedLevel((w) => Math.min(4, w + 1));
                  wantedTimerRef.current = 25;
                }
              }
              break;
            }
          }
          if (hit) continue;
        }
      }

      // Update Enemy AI Chasing
      for (const en of enemiesRef.current) {
        const d = en.mesh.position.distanceTo(pPos);
        const shouldChase = en.isPolice ? wantedLevel > 0 && d < 120 : d < 45;

        if (shouldChase && !gameOver) {
          en.mesh.lookAt(pPos.x, en.mesh.position.y, pPos.z);
          const dir = pPos.clone().sub(en.mesh.position).normalize();
          if (d > 6.0) {
            en.mesh.position.add(dir.multiplyScalar(en.speed * delta));
          }

          // Enemy shoot
          en.shootTimer += delta;
          if (en.shootTimer >= 1.4 && d < 40) {
            en.shootTimer = 0;
            // Spawn enemy bullet
            const bGeo = new THREE.SphereGeometry(0.15, 6, 6);
            const bMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
            const bMesh = new THREE.Mesh(bGeo, bMat);
            bMesh.position.copy(en.mesh.position);
            bMesh.position.y += 1.2;
            scene.add(bMesh);

            const bVel = dir.clone().multiplyScalar(45);
            bulletsRef.current.push({
              mesh: bMesh,
              velocity: bVel,
              dist: 0,
              range: 45,
              damage: 16,
              isEnemy: true,
            });
          }
        }
      }

      // Wanted level cooldown timer
      if (wantedLevel > 0) {
        wantedTimerRef.current -= delta;
        if (wantedTimerRef.current <= 0) {
          setWantedLevel((prev) => {
            const next = Math.max(0, prev - 1);
            wantedTimerRef.current = next > 0 ? 15 : 0;
            return next;
          });
        }
      }

      // Multiplayer Room Synchronization (45ms)
      if (mode === 'multiplayer' && Date.now() - lastSyncTimeRef.current > 45) {
        lastSyncTimeRef.current = Date.now();
        multiplayerClient.emitVillagePlayerSync({
          x: pPos.x,
          y: pPos.z,
          angle: pRot,
          speed: playerSpeedRef.current,
          hp: playerHp,
          inVehicle: inVehicleRef.current,
          activeWeapon,
          wantedLevel,
          coins: playerCoins,
          bounty: playerBounty,
        });
      }

      // Render 3D Scene
      renderer.render(scene, camera);

      // Render Radar Mini-Map
      renderRadarMiniMap(pPos, pRot, vehiclesRef.current, enemiesRef.current);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [mode, gameOver, wantedLevel, activeWeapon]);

  // 2D Canvas Radar Mini-Map
  const renderRadarMiniMap = (
    playerPos: THREE.Vector3,
    playerRot: number,
    vehicles: VehicleEntity[],
    enemies: EnemyEntity[]
  ) => {
    const canvas = miniMapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 160;
    ctx.clearRect(0, 0, size, size);

    // Radar Base Circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, 0, size, size);

    // River Canal
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(size / 2 - 2, 0);
    ctx.bezierCurveTo(size / 2 + 15, 40, size / 2 - 15, 100, size / 2 + 5, size);
    ctx.stroke();

    // Roads
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.stroke();

    ctx.strokeStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.stroke();

    // Map World scale factor (World is ~400x400m around 0,0)
    const toMapX = (wx: number) => size / 2 + (wx / 280) * (size / 2);
    const toMapZ = (wz: number) => size / 2 + (wz / 280) * (size / 2);

    // Enemies
    for (const en of enemies) {
      const ex = toMapX(en.mesh.position.x);
      const ez = toMapZ(en.mesh.position.z);
      ctx.fillStyle = en.isPolice ? '#3b82f6' : '#ef4444';
      ctx.beginPath();
      ctx.arc(ex, ez, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Vehicles
    for (const v of vehicles) {
      if (!v.driverId) {
        const vx = toMapX(v.mesh.position.x);
        const vz = toMapZ(v.mesh.position.z);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(vx - 2, vz - 2, 4, 4);
      }
    }

    // Local Player (Green Heading Arrow)
    const px = toMapX(playerPos.x);
    const pz = toMapZ(playerPos.z);
    ctx.save();
    ctx.translate(px, pz);
    ctx.rotate(playerRot);
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.lineTo(-4, -4);
    ctx.lineTo(4, -4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.restore();

    // Radar Outer Ring
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
    ctx.stroke();
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 select-none touch-none">
      {/* 1. THREE.JS 3D WEBGL CONTAINER */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-crosshair" />

      {/* 2. TOP ACTION CONTROLS */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <button
          onClick={onGoHome}
          className="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5 shadow-xl transition active:scale-95"
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

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-900/85 border border-slate-700/80 rounded-xl text-xs font-bold text-emerald-400">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>3D OPEN WORLD</span>
        </div>
      </div>

      {/* 3. TOP-LEFT HUD (WANTED, HP, WEAPON) */}
      <div className="absolute top-16 left-4 z-20 w-64 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3.5 space-y-2 shadow-2xl">
        {/* Wanted Stars */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">WANTED</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((star) => (
              <span
                key={star}
                className={`text-base ${
                  star <= wantedLevel ? 'text-amber-400 animate-bounce' : 'text-slate-700'
                }`}
              >
                ★
              </span>
            ))}
          </div>
        </div>

        {/* Health Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-bold">
            <span className="text-slate-300">HP</span>
            <span className={playerHp > 30 ? 'text-emerald-400' : 'text-red-400'}>{playerHp} / 100</span>
          </div>
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-200 ${
                playerHp > 30 ? 'bg-emerald-500' : 'bg-red-500'
              }`}
              style={{ width: `${playerHp}%` }}
            />
          </div>
        </div>

        {/* Active Weapon & Coins */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs font-bold">
          <span className="text-cyan-400 uppercase tracking-wide">
            {activeWeapon}: {activeWeapon === 'pistol' ? '∞' : ammoCount[activeWeapon]}
          </span>
          <span className="text-amber-400 flex items-center gap-1">
            <Coins className="w-3 h-3 text-amber-400" />
            <span>${playerCoins}</span>
          </span>
        </div>
      </div>

      {/* 4. TOP-RIGHT RADAR MINI-MAP */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-1.5">
        <canvas
          ref={miniMapCanvasRef}
          width={160}
          height={160}
          className="w-36 h-36 rounded-full shadow-2xl border-2 border-cyan-500/80 bg-slate-950/80 backdrop-blur-md"
        />
        <div className="text-[10px] font-bold text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-full">
          RADAR MINI-MAP
        </div>
      </div>

      {/* 5. BOTTOM-RIGHT SPEEDOMETER & GEAR HUD */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3 pointer-events-none">
        <div className="flex flex-col items-center justify-center w-24 h-24 rounded-full bg-slate-900/90 border-2 border-cyan-500/60 shadow-2xl backdrop-blur-md">
          <span className="text-2xl font-black text-white font-mono leading-none">{currentSpeedKmh}</span>
          <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider">KM/H</span>
          <span className="text-[10px] font-bold text-emerald-400 uppercase">
            {inVehicle ? inVehicle : 'ON FOOT'}
          </span>
        </div>
      </div>

      {/* 6. BOTTOM CENTER KEYBOARD GUIDE */}
      <div className="hidden sm:block absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-slate-900/80 backdrop-blur-md border border-slate-700/80 px-4 py-1.5 rounded-full text-[11px] text-slate-300 font-semibold shadow-xl">
        WASD: Drive/Move • E: Ride/Dismount • Click/Space: Shoot • H: Horn • 1-3: Weapons
      </div>

      {/* 7. MOBILE TOUCH CONTROLS */}
      <div className="sm:hidden absolute bottom-6 left-6 z-30 pointer-events-auto">
        <div
          onTouchStart={() => {
            touchJoystickRef.current.active = true;
          }}
          onTouchMove={(e) => {
            const touch = e.touches[0];
            const target = e.currentTarget.getBoundingClientRect();
            const cx = target.left + target.width / 2;
            const cy = target.top + target.height / 2;
            touchJoystickRef.current.dx = Math.max(-1, Math.min(1, (touch.clientX - cx) / (target.width / 2)));
            touchJoystickRef.current.dy = Math.max(-1, Math.min(1, (touch.clientY - cy) / (target.height / 2)));
          }}
          onTouchEnd={() => {
            touchJoystickRef.current.active = false;
            touchJoystickRef.current.dx = 0;
            touchJoystickRef.current.dy = 0;
          }}
          className="w-28 h-28 rounded-full bg-slate-900/80 border-2 border-slate-700/80 flex items-center justify-center text-white/50 text-xs font-bold"
        >
          JOYSTICK
        </div>
      </div>

      {/* Mobile Action Buttons */}
      <div className="sm:hidden absolute bottom-28 right-6 z-30 flex flex-col gap-2 pointer-events-auto">
        <button
          onTouchStart={handleToggleMount}
          className="w-14 h-14 rounded-2xl bg-amber-600/90 active:bg-amber-500 font-black text-xs text-white shadow-xl"
        >
          RIDE
        </button>
        <button
          onTouchStart={handleTriggerHorn}
          className="w-14 h-14 rounded-2xl bg-indigo-600/90 active:bg-indigo-500 font-black text-xs text-white shadow-xl"
        >
          HORN
        </button>
        <button
          onTouchStart={handleShoot}
          className="w-14 h-14 rounded-2xl bg-red-600/90 active:bg-red-500 font-black text-xs text-white shadow-xl flex items-center justify-center"
        >
          <Crosshair className="w-5 h-5" />
        </button>
      </div>

      {/* 8. GAME OVER MODAL */}
      {gameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-red-500/50 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto text-3xl">
              💀
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white">WASTED</h3>
              <p className="text-xs text-slate-400">The village police or bandits took you down.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  setPlayerHp(100);
                  setWantedLevel(0);
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

// -------------------------------------------------------------
// 3D PROCEDURAL WORLD BUILDERS (THREE.JS)
// -------------------------------------------------------------

function buildVillageEnvironment(scene: THREE.Scene) {
  // 1. Sprawling Green Ground Plane (500m x 500m)
  const groundGeo = new THREE.PlaneGeometry(600, 600, 32, 32);
  groundGeo.rotateX(-Math.PI / 2);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x2e5c38,
    roughness: 0.9,
    metalness: 0.1,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.receiveShadow = true;
  scene.add(ground);

  // 2. Farmland Rice & Wheat Fields
  const wheatGeo = new THREE.PlaneGeometry(160, 140);
  wheatGeo.rotateX(-Math.PI / 2);
  const wheatMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.8 });
  const wheatField = new THREE.Mesh(wheatGeo, wheatMat);
  wheatField.position.set(120, 0.05, 120);
  wheatField.receiveShadow = true;
  scene.add(wheatField);

  const paddyGeo = new THREE.PlaneGeometry(140, 130);
  paddyGeo.rotateX(-Math.PI / 2);
  const paddyMat = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.7 });
  const paddyField = new THREE.Mesh(paddyGeo, paddyMat);
  paddyField.position.set(-120, 0.05, -120);
  paddyField.receiveShadow = true;
  scene.add(paddyField);

  // 3. Winding River Canal
  const riverGeo = new THREE.PlaneGeometry(24, 600);
  riverGeo.rotateX(-Math.PI / 2);
  const riverMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.2,
    metalness: 0.3,
  });
  const river = new THREE.Mesh(riverGeo, riverMat);
  river.position.set(0, 0.02, 0);
  scene.add(river);

  // 4. Roads (Paved Asphalt Highway & Dirt Trails)
  const hwyGeo = new THREE.PlaneGeometry(14, 600);
  hwyGeo.rotateX(-Math.PI / 2);
  const hwyMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });
  const hwy = new THREE.Mesh(hwyGeo, hwyMat);
  hwy.position.set(40, 0.04, 0);
  hwy.receiveShadow = true;
  scene.add(hwy);

  const dirtGeo = new THREE.PlaneGeometry(10, 600);
  dirtGeo.rotateX(-Math.PI / 2);
  dirtGeo.rotateY(Math.PI / 2);
  const dirtMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.95 });
  const dirtRoad = new THREE.Mesh(dirtGeo, dirtMat);
  dirtRoad.position.set(0, 0.04, 0);
  dirtRoad.receiveShadow = true;
  scene.add(dirtRoad);

  // 5. Wooden River Canal Bridges
  createBridge(scene, 0, 0, 0);
  createBridge(scene, 0, 0, 140);
  createBridge(scene, 0, 0, -140);

  // 6. Thatched Village Cottages & Stalls
  createVillageHouses(scene);

  // 7. 3D Palm Trees & Windmills
  createNatureAndProps(scene);
}

function createBridge(scene: THREE.Scene, x: number, y: number, z: number) {
  const bridge = new THREE.Group();
  const deckGeo = new THREE.BoxGeometry(26, 0.6, 12);
  const deckMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  const deck = new THREE.Mesh(deckGeo, deckMat);
  deck.position.y = 0.4;
  deck.receiveShadow = true;
  deck.castShadow = true;
  bridge.add(deck);

  // Railings
  const railGeo = new THREE.BoxGeometry(26, 0.8, 0.4);
  const railMat = new THREE.MeshStandardMaterial({ color: 0x451a03 });
  const rail1 = new THREE.Mesh(railGeo, railMat);
  rail1.position.set(0, 1.0, 5.8);
  const rail2 = new THREE.Mesh(railGeo, railMat);
  rail2.position.set(0, 1.0, -5.8);
  bridge.add(rail1, rail2);

  bridge.position.set(x, y, z);
  scene.add(bridge);
}

function createVillageHouses(scene: THREE.Scene) {
  const houseCoords = [
    { x: -50, z: -40, type: 'thatch' },
    { x: -75, z: -45, type: 'thatch' },
    { x: -50, z: 40, type: 'brick' },
    { x: 70, z: -50, type: 'brick' },
    { x: 85, z: 60, type: 'stall' },
    { x: 100, z: 60, type: 'stall' },
    { x: 150, z: 150, type: 'police' }, // Police HQ
    { x: -140, z: 140, type: 'sawmill' }, // Bandit Sawmill
  ];

  for (const h of houseCoords) {
    const group = new THREE.Group();
    const wallColor = h.type === 'police' ? 0x1e3a8a : h.type === 'sawmill' ? 0x451a03 : 0xfef08a;
    const roofColor = h.type === 'police' ? 0x1d4ed8 : h.type === 'thatch' ? 0xca8a04 : 0xb45309;

    // Walls
    const wGeo = new THREE.BoxGeometry(12, 6, 10);
    const wMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.8 });
    const walls = new THREE.Mesh(wGeo, wMat);
    walls.position.y = 3;
    walls.castShadow = true;
    walls.receiveShadow = true;
    group.add(walls);

    // Roof
    const rGeo = new THREE.ConeGeometry(9.5, 4, 4);
    rGeo.rotateY(Math.PI / 4);
    const rMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.7 });
    const roof = new THREE.Mesh(rGeo, rMat);
    roof.position.y = 8;
    roof.castShadow = true;
    group.add(roof);

    group.position.set(h.x, 0, h.z);
    scene.add(group);
  }
}

function createNatureAndProps(scene: THREE.Scene) {
  // Palm Trees
  for (let i = 0; i < 45; i++) {
    const tx = (Math.random() - 0.5) * 450;
    const tz = (Math.random() - 0.5) * 450;
    if (Math.abs(tx) < 18) continue; // don't block river

    const tree = new THREE.Group();
    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.55, 7, 7);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 3.5;
    trunk.castShadow = true;
    tree.add(trunk);

    // Leaves
    const leavesGeo = new THREE.ConeGeometry(3.5, 4, 6);
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.y = 8;
    leaves.castShadow = true;
    tree.add(leaves);

    tree.position.set(tx, 0, tz);
    scene.add(tree);
  }

  // Windmill in Farmland
  const wmGroup = new THREE.Group();
  const towerGeo = new THREE.CylinderGeometry(2, 3.5, 16, 8);
  const towerMat = new THREE.MeshStandardMaterial({ color: 0xfef08a });
  const tower = new THREE.Mesh(towerGeo, towerMat);
  tower.position.y = 8;
  tower.castShadow = true;
  wmGroup.add(tower);

  // Rotating Sails
  const sailsGroup = new THREE.Group();
  for (let s = 0; s < 4; s++) {
    const sailGeo = new THREE.BoxGeometry(0.6, 7, 0.1);
    const sailMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const sail = new THREE.Mesh(sailGeo, sailMat);
    sail.position.y = 3.5;
    sail.rotation.z = (s * Math.PI) / 2;
    sailsGroup.add(sail);
  }
  sailsGroup.position.set(0, 15, 2.1);
  wmGroup.add(sailsGroup);

  wmGroup.position.set(130, 0, 140);
  scene.add(wmGroup);
}

// -------------------------------------------------------------
// 3D VEHICLE MESH BUILDERS
// -------------------------------------------------------------

function create3DVehicles(scene: THREE.Scene): VehicleEntity[] {
  const vehicles: VehicleEntity[] = [];

  // 1. Red Dirt Motorcycle (Player's Starting Ride)
  const moto = createMotorcycleMesh(0xef4444);
  moto.mesh.position.set(0, 0, 0);
  scene.add(moto.mesh);
  vehicles.push({
    id: 'v_moto_player',
    type: 'motorcycle',
    mesh: moto.mesh,
    wheels: moto.wheels,
    speed: 0,
    maxSpeed: 2.2,
    accel: 0.055,
    turnSpeed: 0.045,
    heading: 0,
    driverId: 'local_player',
    hp: 180,
    maxHp: 180,
  });

  // 2. Vintage Village Express Bus (parked across bridge)
  const bus = createBusMesh(0x2563eb);
  bus.mesh.position.set(25, 0, 40);
  scene.add(bus.mesh);
  vehicles.push({
    id: 'v_bus_express',
    type: 'bus',
    mesh: bus.mesh,
    wheels: bus.wheels,
    speed: 0,
    maxSpeed: 1.5,
    accel: 0.022,
    turnSpeed: 0.022,
    heading: 0,
    driverId: null,
    hp: 450,
    maxHp: 450,
  });

  // 3. Vintage Village Bicycle (parked near cottages)
  const bike = createBicycleMesh(0x10b981);
  bike.mesh.position.set(-40, 0, -35);
  scene.add(bike.mesh);
  vehicles.push({
    id: 'v_bike_village',
    type: 'bicycle',
    mesh: bike.mesh,
    wheels: bike.wheels,
    speed: 0,
    maxSpeed: 1.1,
    accel: 0.038,
    turnSpeed: 0.065,
    heading: Math.PI / 2,
    driverId: null,
    hp: 80,
    maxHp: 80,
  });

  return vehicles;
}

function createMotorcycleMesh(bodyColor: number) {
  const group = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  // Main Chassis Frame
  const bodyGeo = new THREE.BoxGeometry(0.7, 0.75, 2.2);
  const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, metalness: 0.5, roughness: 0.3 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.85;
  body.castShadow = true;
  group.add(body);

  // Black Leather Seat
  const seatGeo = new THREE.BoxGeometry(0.5, 0.2, 0.9);
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
  const seat = new THREE.Mesh(seatGeo, seatMat);
  seat.position.set(0, 1.25, -0.2);
  group.add(seat);

  // Handlebars
  const barGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8);
  barGeo.rotateZ(Math.PI / 2);
  const barMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
  const bar = new THREE.Mesh(barGeo, barMat);
  bar.position.set(0, 1.5, 0.65);
  group.add(bar);

  // Headlight (Luminous front lamp)
  const lampGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 8);
  lampGeo.rotateX(Math.PI / 2);
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 0.8 });
  const lamp = new THREE.Mesh(lampGeo, lampMat);
  lamp.position.set(0, 1.15, 1.25);
  group.add(lamp);

  // Rotating Rubber Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.3, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });

  const frontWheel = new THREE.Mesh(wheelGeo, wheelMat);
  frontWheel.position.set(0, 0.45, 1.05);
  frontWheel.castShadow = true;
  group.add(frontWheel);
  wheels.push(frontWheel);

  const rearWheel = new THREE.Mesh(wheelGeo, wheelMat);
  rearWheel.position.set(0, 0.45, -1.05);
  rearWheel.castShadow = true;
  group.add(rearWheel);
  wheels.push(rearWheel);

  return { mesh: group, wheels };
}

function createBusMesh(bodyColor: number) {
  const group = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  // Bus Main Body
  const bodyGeo = new THREE.BoxGeometry(3.2, 2.8, 8.5);
  const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, metalness: 0.3, roughness: 0.4 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 2.0;
  body.castShadow = true;
  group.add(body);

  // White Roof with Yellow Accent Stripe
  const stripeGeo = new THREE.BoxGeometry(3.25, 0.35, 8.55);
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xfacc15 });
  const stripe = new THREE.Mesh(stripeGeo, stripeMat);
  stripe.position.y = 2.2;
  group.add(stripe);

  // Translucent Windshield Glass
  const glassGeo = new THREE.BoxGeometry(3.0, 1.1, 0.2);
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1 });
  const frontGlass = new THREE.Mesh(glassGeo, glassMat);
  frontGlass.position.set(0, 2.4, 4.3);
  group.add(frontGlass);

  // 4 Rubber Bus Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.5, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });

  const wheelPositions = [
    [-1.6, 0.65, 2.4],
    [1.6, 0.65, 2.4],
    [-1.6, 0.65, -2.4],
    [1.6, 0.65, -2.4],
  ];

  for (const pos of wheelPositions) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.position.set(pos[0], pos[1], pos[2]);
    w.castShadow = true;
    group.add(w);
    wheels.push(w);
  }

  return { mesh: group, wheels };
}

function createBicycleMesh(frameColor: number) {
  const group = new THREE.Group();
  const wheels: THREE.Mesh[] = [];

  // Thin Frame
  const frameGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.4, 6);
  frameGeo.rotateZ(Math.PI / 3);
  const frameMat = new THREE.MeshStandardMaterial({ color: frameColor });
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.y = 0.7;
  group.add(frame);

  // Spoked Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.1, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });

  const fw = new THREE.Mesh(wheelGeo, wheelMat);
  fw.position.set(0, 0.38, 0.8);
  group.add(fw);
  wheels.push(fw);

  const rw = new THREE.Mesh(wheelGeo, wheelMat);
  rw.position.set(0, 0.38, -0.8);
  group.add(rw);
  wheels.push(rw);

  return { mesh: group, wheels };
}

function create3DCharacterMesh(suitColor: string) {
  const group = new THREE.Group();

  // Torso
  const torsoGeo = new THREE.BoxGeometry(0.7, 0.9, 0.45);
  const torsoMat = new THREE.MeshStandardMaterial({ color: suitColor });
  const torso = new THREE.Mesh(torsoGeo, torsoMat);
  torso.position.y = 1.35;
  torso.castShadow = true;
  group.add(torso);

  // Helmet / Head
  const headGeo = new THREE.SphereGeometry(0.32, 12, 12);
  const headMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 2.05;
  head.castShadow = true;
  group.add(head);

  // Visor
  const visorGeo = new THREE.BoxGeometry(0.4, 0.15, 0.2);
  const visorMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8 });
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.position.set(0, 2.05, 0.24);
  group.add(visor);

  return group;
}

function create3DEnemies(scene: THREE.Scene): EnemyEntity[] {
  const enemies: EnemyEntity[] = [];

  // 1. Bandit Outpost Thugs (North-West)
  const b1 = create3DCharacterMesh('#dc2626');
  b1.position.set(-130, 0, 130);
  scene.add(b1);
  enemies.push({
    id: 'en_bandit_1',
    mesh: b1,
    speed: 5.5,
    hp: 60,
    maxHp: 60,
    shootTimer: 0,
    isPolice: false,
    targetPos: new THREE.Vector3(-130, 0, 130),
  });

  const b2 = create3DCharacterMesh('#b91c1c');
  b2.position.set(-150, 0, 145);
  scene.add(b2);
  enemies.push({
    id: 'en_bandit_2',
    mesh: b2,
    speed: 5.5,
    hp: 80,
    maxHp: 80,
    shootTimer: 0,
    isPolice: false,
    targetPos: new THREE.Vector3(-150, 0, 145),
  });

  // 2. Police Cruiser at District HQ (South-East)
  const pol = create3DCharacterMesh('#1d4ed8');
  pol.position.set(160, 0, 160);
  scene.add(pol);
  enemies.push({
    id: 'en_police_1',
    mesh: pol,
    speed: 7.0,
    hp: 110,
    maxHp: 110,
    shootTimer: 0,
    isPolice: true,
    targetPos: new THREE.Vector3(160, 0, 160),
  });

  return enemies;
}
