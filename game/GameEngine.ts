import * as THREE from 'three';
import { EventBus } from './core/EventBus';
import { Time } from './core/Time';
import { InputManager } from './core/InputManager';
import { SoundManager } from './core/SoundManager';
import { World } from './world/World';
import { ThirdPersonCamera } from './camera/ThirdPersonCamera';
import { BulletPool } from './combat/BulletPool';
import { WeaponManager } from './combat/Weapon';
import { VehicleManager } from './vehicles/VehicleManager';
import { Player } from './player/Player';
import { PlayerController } from './player/PlayerController';
import { NPCManager } from './npc/NPCManager';
import { PoliceSystem } from './police/PoliceSystem';
import { MissionManager } from './missions/MissionManager';
import { SaveManager } from './save/SaveManager';

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public container: HTMLElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;

  // Subsystems
  public eventBus: EventBus;
  public time: Time;
  public input: InputManager;
  public soundManager: SoundManager;
  public world: World;
  public tpCamera: ThirdPersonCamera;
  public bulletPool: BulletPool;
  public weaponManager: WeaponManager;
  public vehicleManager: VehicleManager;
  public player: Player;
  public playerController: PlayerController;
  public npcManager: NPCManager;
  public policeSystem: PoliceSystem;
  public missionManager: MissionManager;

  public isRunning: boolean = false;
  public isPaused: boolean = false;

  private animationFrameId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private hudSyncTimer: number = 0;

  constructor(canvas: HTMLCanvasElement, container: HTMLElement) {
    this.canvas = canvas;
    this.container = container;

    // 1. Core Event & Timing Systems
    this.eventBus = EventBus.getInstance();
    this.time = new Time();
    this.input = new InputManager();
    this.soundManager = SoundManager.getInstance();
    this.soundManager.init();

    // 2. Three.js Renderer Setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // 3. Scene & Camera
    this.scene = new THREE.Scene();
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.2, 500);

    // 4. World Environment
    this.world = new World(this.scene);

    // 5. Camera Rig
    this.tpCamera = new ThirdPersonCamera(this.camera, this.world);

    // 6. Combat & Effects
    this.bulletPool = new BulletPool(this.scene);
    this.weaponManager = new WeaponManager(this.bulletPool);

    // 7. Vehicles
    this.vehicleManager = new VehicleManager(this.scene, this.world);

    // 8. Player & Controller
    const spawnPos = new THREE.Vector3(0, 0, 10);
    this.player = new Player(spawnPos, this.world);
    this.scene.add(this.player.mesh);

    // Restore saved progress if available
    const saved = SaveManager.load();
    if (saved) {
      this.player.cash = Math.max(saved.cash, 250);
    }

    this.playerController = new PlayerController(
      this.player,
      this.input,
      this.tpCamera,
      this.vehicleManager,
      this.weaponManager,
      this.world
    );

    // 9. NPCs & Pedestrians
    this.npcManager = new NPCManager(this.scene, this.world);

    // 10. Police System
    this.policeSystem = new PoliceSystem(this.vehicleManager.policeVehicle);

    // 11. Mission Manager
    this.missionManager = new MissionManager(this.scene);

    // Attach input listeners to container
    this.input.attach(this.container);

    // Wire up events
    this.setupEventListeners();

    // Setup window / container resizing
    this.setupResizeHandler();
  }

  private setupEventListeners(): void {
    // Escaped heat cash reward
    this.eventBus.on('HEAT_ESCAPED', (data: { rewardCash: number }) => {
      this.player.addCash(data.rewardCash);
      SaveManager.save(this.player.cash);
    });

    // Mission reward cash & stars
    this.eventBus.on('MISSION_COMPLETED', (data: { rewardMoney: number; rewardStars: number; title: string }) => {
      this.player.addCash(data.rewardMoney);
      SaveManager.save(this.player.cash);
    });

    // Hostile fire damage dealt to player
    this.eventBus.on('HOSTILE_FIRED_AT_PLAYER', (data: { damage: number }) => {
      this.player.takeDamage({
        amount: data.damage,
        type: 'bullet',
        source: 'hostile',
      });
    });

    // Player death handling
    this.eventBus.on('PLAYER_DIED', () => {
      setTimeout(() => {
        // Respawn near downtown plaza
        this.player.respawn(new THREE.Vector3(0, 0, 10));
        this.policeSystem.reset();
      }, 3500);
    });
  }

  private setupResizeHandler(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        const height = entry.contentRect.height;
        if (width > 0 && height > 0) {
          this.camera.aspect = width / height;
          this.camera.updateProjectionMatrix();
          this.renderer.setSize(width, height);
        }
      }
    });
    this.resizeObserver.observe(this.container);
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.time.reset();
    this.weaponManager.emitState();
    this.player.emitStats();
    this.loop();
  }

  public pause(): void {
    this.isPaused = true;
    this.soundManager.stopEngineSound();
    this.soundManager.stopSiren();
  }

  public resume(): void {
    this.isPaused = false;
    this.time.reset();
  }

  private loop = (): void => {
    if (!this.isRunning) return;

    this.animationFrameId = requestAnimationFrame(this.loop);

    if (this.isPaused) {
      return;
    }

    // 1. Calculate delta time
    this.time.update();
    const dt = this.time.deltaTime;

    // 2. Process Mouse Rotation
    if (this.input.mouseDeltaX !== 0 || this.input.mouseDeltaY !== 0) {
      this.tpCamera.handleMouseMove(this.input.mouseDeltaX, this.input.mouseDeltaY);
    }

    // 3. Update Combat & Weapons
    this.weaponManager.update();
    this.bulletPool.update(dt);

    // 4. Update Player & Controller
    const livingTargets = this.npcManager.getLivingTargets();
    this.playerController.update(dt, livingTargets);

    // 5. Update Vehicles
    this.vehicleManager.update(dt);

    // 6. Update NPCs & Collect Cash
    const cashCollected = this.npcManager.update(dt, this.player.position);
    if (cashCollected > 0) {
      this.player.addCash(cashCollected);
      SaveManager.save(this.player.cash);
    }

    // 7. Update Police System
    this.policeSystem.update(dt, this.player.position);

    // 8. Update Mission Objectives
    this.missionManager.update(dt, this.player, this.policeSystem);

    // 9. Update Third-Person Camera Follow
    const followTarget = this.player.state === 'driving' && this.player.currentVehicle
      ? this.player.currentVehicle.position
      : this.player.position;

    const followHeading = this.player.state === 'driving' && this.player.currentVehicle
      ? this.player.currentVehicle.heading
      : this.player.facingAngle;

    const speed = this.player.state === 'driving' && this.player.currentVehicle
      ? this.player.currentVehicle.speed
      : 0;

    this.tpCamera.update(dt, followTarget, followHeading, speed);

    // 10. Periodic HUD State Broadcast (10 Hz, outside render loop to prevent React thrashing)
    this.hudSyncTimer += dt;
    if (this.hudSyncTimer >= 0.1) {
      this.hudSyncTimer = 0;
      this.broadcastMinimapData();
    }

    // 11. Render Scene
    this.renderer.render(this.scene, this.camera);

    // 12. Reset Frame Inputs
    this.input.update();
  };

  private broadcastMinimapData(): void {
    const waypoint = this.missionManager.getActiveWaypoint();
    this.eventBus.emit('MINIMAP_UPDATE', {
      playerPos: { x: this.player.position.x, z: this.player.position.z },
      playerAngle: this.tpCamera.yaw,
      waypoint: waypoint ? { x: waypoint.x, z: waypoint.z } : null,
      vehicles: this.vehicleManager.vehicles.map((v) => ({
        x: v.position.x,
        z: v.position.z,
        type: v.config.type,
      })),
      wantedLevel: this.policeSystem.wantedLevel,
    });
  }

  public destroy(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.input.detach();
    this.bulletPool.destroy();
    this.vehicleManager.destroy();
    this.npcManager.destroy();
    this.missionManager.destroy();
    this.soundManager.stopEngineSound();
    this.soundManager.stopSiren();

    // Dispose Three.js scene objects and renderer
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      }
    });

    this.renderer.dispose();
  }
}
