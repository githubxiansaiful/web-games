/**
 * Zombie Haven - Master 3D Game Engine
 * Orchestrates rendering, physical collision, weapon hitscan, zombie horde AI,
 * wave transitions, cooperative revive mechanics, and multiplayer replication.
 */

import * as THREE from 'three';
import { DeadwoodVillage } from './world/DeadwoodVillage';
import { SurvivorPlayer } from './player/SurvivorPlayer';
import { CameraController } from './player/CameraController';
import { PlayerController } from './player/PlayerController';
import { WeaponSystem } from './weapons/WeaponSystem';
import { ZombieHordeManager } from './zombies/ZombieHordeManager';
import { WaveManager } from './systems/WaveManager';
import { LootSystem } from './systems/LootSystem';
import { ReviveSystem } from './systems/ReviveSystem';
import { zombieAudio } from '@/components/zombie-haven/ZombieHavenAudio';
import { zombieSocket } from './network/ZombieSocketClient';
import { MatchStats, LootItem } from './types';

export class ZombieGameEngine {
  private canvas: HTMLCanvasElement;
  private container: HTMLElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;

  // Subsystems
  public village: DeadwoodVillage;
  public localPlayer: SurvivorPlayer;
  public remotePlayerModel: SurvivorPlayer | null = null;
  public cameraCtrl: CameraController;
  public playerCtrl: PlayerController;
  public weapons: WeaponSystem;
  public horde: ZombieHordeManager;
  public waves: WaveManager;
  public loot: LootSystem;
  public revive: ReviveSystem;

  // Visual Effects: Bullet Tracer lines & Muzzle Smoke
  private tracers: { line: THREE.Line; life: number }[] = [];
  private smokeParticles: { mesh: THREE.Mesh; life: number; maxLife: number; velocity: THREE.Vector3 }[] = [];

  // Match statistics & state
  public isRunning: boolean = true;
  public isGameOver: boolean = false;
  public matchStartTime: number = Date.now();
  public stats: MatchStats;

  // Hitmarker UI flag
  public hitmarkerActive: boolean = false;
  public isHeadshotKill: boolean = false;
  private hitmarkerTimer: number = 0;

  // Nearby scavenge loot target
  public activeLootTarget: LootItem | null = null;

  // Revive UI state
  public canReviveTeammate: boolean = false;
  public revivePercent: number = 0;

  // Loop clock
  private clock: THREE.Clock;
  private animationFrameId: number | null = null;
  private networkSyncTimer: number = 0;

  // Event callbacks to React HUD
  public onStateChange?: () => void;
  public onGameOver?: (stats: MatchStats) => void;

  constructor(canvas: HTMLCanvasElement, container: HTMLElement, playerName = 'Survivor') {
    this.canvas = canvas;
    this.container = container;

    // 1. WebGL Renderer Setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.setClearColor(0x60a5fa, 1.0);

    // 2. Pure Radiant Daytime Sky (No Fog)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x60a5fa); // crystal clear bright sky blue
    this.scene.fog = null; // zero fog for 100% sharp daylight visibility

    // 3. High-Intensity Daytime Sunlight & Natural Fill
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x86efac, 1.4);
    this.scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 3.0);
    sunLight.position.set(90, 160, 70);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 300;
    sunLight.shadow.camera.left = -90;
    sunLight.shadow.camera.right = 90;
    sunLight.shadow.camera.top = 90;
    sunLight.shadow.camera.bottom = -90;
    sunLight.shadow.bias = 0.0002;
    sunLight.shadow.normalBias = 0.02;
    this.scene.add(sunLight);

    // 4. Initialize Core World & Systems
    this.village = new DeadwoodVillage();
    this.scene.add(this.village.rootGroup);

    // Local Player (Spawns at safe edge of town square: 0, 0, 14)
    this.localPlayer = new SurvivorPlayer(true, 0x3b82f6);
    this.localPlayer.group.position.set(0, 0, 14);
    this.scene.add(this.localPlayer.group);

    // Camera & Player Controls
    this.cameraCtrl = new CameraController(container.clientWidth / container.clientHeight);
    this.weapons = new WeaponSystem();
    this.weapons.initMuzzleFlash(this.scene);

    this.playerCtrl = new PlayerController(
      this.localPlayer,
      this.cameraCtrl,
      this.weapons,
      this.village,
      this.canvas
    );

    // Horde, Waves, Loot, Revive
    this.horde = new ZombieHordeManager(this.scene, this.village);
    this.waves = new WaveManager();
    this.loot = new LootSystem(this.scene);
    this.revive = new ReviveSystem();

    // Stats
    this.stats = {
      survivalTimeSeconds: 0,
      highestWave: 1,
      totalKills: 0,
      player1Kills: 0,
      player2Kills: 0,
      player1Name: playerName,
      player2Name: 'Partner',
      revives: 0,
      damageDealt: 0,
      damageReceived: 0,
    };

    this.clock = new THREE.Clock();

    // Hook callbacks
    this.setupShootAndInteraction();
    this.setupMultiplayerSync();
    this.setupWaveProgression();

    window.addEventListener('resize', this.handleResize);

    // Kick off first wave
    this.waves.startFirstWave();

    // Start game loop
    this.tick();
  }

  private setupShootAndInteraction() {
    // Shooting
    this.playerCtrl.onShootRequest = () => {
      if (this.localPlayer.stats.isDowned || this.isGameOver) return;

      const isAiming = true;
      const muzzlePos = this.localPlayer.getMuzzleWorldPosition();
      const { success, spreadDirs } = this.weapons.shoot(isAiming, muzzlePos);
      if (!success) return;

      const camOrigin = this.cameraCtrl.camera.position.clone();
      const baseFwd = this.cameraCtrl.getForwardVector();
      const right = this.cameraCtrl.getRightVector();
      const up = new THREE.Vector3().crossVectors(right, baseFwd).normalize();
      const config = this.weapons.getActiveConfig();

      spreadDirs.forEach((spread) => {
        // Offset base forward with spread in crosshair plane
        const shotDir = baseFwd
          .clone()
          .addScaledVector(right, spread.x)
          .addScaledVector(up, spread.y)
          .normalize();

        // Raycast against zombies
        const hitResult = this.horde.testBulletHit(camOrigin, shotDir, config.range);

        // Spawn visual tracer line and smoke from physical muzzle barrel tip
        const endPoint = hitResult ? hitResult.hitPoint : muzzlePos.clone().addScaledVector(shotDir, config.range);
        this.createTracer(muzzlePos, endPoint);
        this.createMuzzleSmoke(muzzlePos, shotDir);

        // Send shoot over multiplayer network
        zombieSocket.sendShoot(
          [muzzlePos.x, muzzlePos.y, muzzlePos.z],
          [shotDir.x, shotDir.y, shotDir.z],
          this.weapons.activeWeapon
        );

        if (hitResult) {
          const dmg = hitResult.isHeadshot ? config.damage * 2.0 : config.damage;
          const wasKilled = hitResult.zombie.takeDamage(dmg, shotDir);

          this.localPlayer.stats.damageDealt += dmg;
          this.localPlayer.stats.score += hitResult.zombie.config.scoreValue;

          // Trigger hitmarker UI
          this.hitmarkerActive = true;
          this.isHeadshotKill = hitResult.isHeadshot;
          this.hitmarkerTimer = 0.12;

          // Camera impact kick
          this.cameraCtrl.addShake(0.08);

          // Relay damage to multiplayer peers
          zombieSocket.sendZombieDamage(hitResult.zombie.id, dmg);

          if (wasKilled) {
            this.localPlayer.stats.kills += 1;
            this.stats.totalKills += 1;
            this.stats.player1Kills += 1;
            this.waves.onZombieKilled();
          }
        }
      });
    };

    // Interaction (E key)
    this.playerCtrl.onInteractRequest = () => {
      if (this.activeLootTarget) {
        this.loot.collectLoot(this.activeLootTarget, this.localPlayer, this.weapons);
        this.activeLootTarget = null;
      }
    };
  }

  private setupWaveProgression() {
    this.waves.onWaveStart = (waveNum, totalCount) => {
      // Spawn wave batch around village perimeter
      this.horde.spawnWaveBatch(totalCount, waveNum, this.localPlayer.group.position);
      this.stats.highestWave = Math.max(this.stats.highestWave, waveNum);
      // Respawn some loot crates during wave start
      this.loot.respawnAll();
    };
  }

  private setupMultiplayerSync() {
    // Check if remote partner exists in room
    if (zombieSocket.room && zombieSocket.room.players.length > 1) {
      const partner = zombieSocket.room.players.find((p) => p.id !== zombieSocket.myId);
      if (partner) {
        this.stats.player2Name = partner.name;
        // Instantiate remote player 3D mesh (crimson jacket)
        this.remotePlayerModel = new SurvivorPlayer(false, 0xec4899);
        this.remotePlayerModel.group.position.set(2, 0, 14);
        this.scene.add(this.remotePlayerModel.group);
      }
    }

    // Remote shoot visual tracer & smoke
    zombieSocket.onRemoteShoot = (data) => {
      const origin = new THREE.Vector3(...data.origin);
      const dir = new THREE.Vector3(...data.dir);
      const end = origin.clone().addScaledVector(dir, 45);
      this.createTracer(origin, end);
      this.createMuzzleSmoke(origin, dir);
    };

    // Remote zombie damage
    zombieSocket.onRemoteZombieDamage = ({ zombieId, damage }) => {
      const z = this.horde.zombies.find((zm) => zm.id === zombieId);
      if (z && !z.isDead) {
        const wasKilled = z.takeDamage(damage);
        if (wasKilled) {
          this.stats.totalKills += 1;
          this.stats.player2Kills += 1;
          this.waves.onZombieKilled();
        }
      }
    };
  }

  private createTracer(start: THREE.Vector3, end: THREE.Vector3) {
    const geo = new THREE.BufferGeometry().setFromPoints([start, end]);
    const mat = new THREE.LineBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.85,
    });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    this.tracers.push({ line, life: 0.07 });
  }

  private createMuzzleSmoke(pos: THREE.Vector3, dir: THREE.Vector3) {
    const count = 3;
    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.04 + Math.random() * 0.03, 5, 5);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xcccccc,
        transparent: true,
        opacity: 0.5,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos).add(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.06,
          (Math.random() - 0.5) * 0.06,
          (Math.random() - 0.5) * 0.06
        )
      );
      const velocity = dir.clone().multiplyScalar(1.5 + Math.random() * 1.5).add(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.4,
          Math.random() * 0.4,
          (Math.random() - 0.5) * 0.4
        )
      );
      this.scene.add(mesh);
      this.smokeParticles.push({
        mesh,
        life: 0.22 + Math.random() * 0.12,
        maxLife: 0.34,
        velocity,
      });
    }
  }

  private tick = () => {
    if (!this.isRunning) return;

    this.animationFrameId = requestAnimationFrame(this.tick);
    const delta = Math.min(this.clock.getDelta(), 0.1);

    // 1. Player Physics & Input Update
    this.playerCtrl.update(delta);
    this.weapons.update(delta);

    // 2. Camera Update (Third Person with Obstacle Avoidance)
    this.cameraCtrl.update(
      delta,
      this.localPlayer.group.position,
      this.playerCtrl.isRightMouseDown,
      this.village,
      this.weapons.recoilKick
    );

    // 3. Zombie Horde AI & Attacks
    const remotePos = this.remotePlayerModel ? this.remotePlayerModel.group.position : null;
    this.horde.update(delta, this.localPlayer, remotePos, (dmg) => {
      this.localPlayer.applyDamage(dmg);
      this.cameraCtrl.addShake(0.35);
      zombieAudio.playPlayerHurt();
    });

    // 4. Wave Progression & 15s Intermission
    this.waves.update(delta);

    // 5. Scavenge Loot Proximity
    this.activeLootTarget = this.loot.update(delta, this.localPlayer.group.position);

    // 6. Cooperative Revive System
    const isHoldingE = !!this.playerCtrl.keys['KeyE'];
    const isRemoteDowned = this.remotePlayerModel?.stats.isDowned || false;
    const { canRevive, progressPercent } = this.revive.update(
      delta,
      isHoldingE,
      this.localPlayer,
      remotePos,
      isRemoteDowned,
      () => {
        // Teammate Revived!
        if (this.remotePlayerModel) {
          this.remotePlayerModel.revive();
          zombieSocket.sendReviveDone();
        }
      }
    );
    this.canReviveTeammate = canRevive;
    this.revivePercent = progressPercent;

    // 7. Update Heartbeat Audio if low health
    const isLow = !this.localPlayer.stats.isDowned && this.localPlayer.stats.health < 30 && this.localPlayer.stats.health > 0;
    zombieAudio.updateHeartbeat(isLow);

    // 8. Multiplayer Sync Broadcast (25 Hz)
    this.networkSyncTimer += delta;
    if (this.networkSyncTimer >= 0.04) {
      this.networkSyncTimer = 0;
      zombieSocket.sendPlayerState({
        name: this.stats.player1Name,
        x: this.localPlayer.group.position.x,
        y: this.localPlayer.group.position.y,
        z: this.localPlayer.group.position.z,
        rotationY: this.localPlayer.group.rotation.y,
        headPitch: this.cameraCtrl.pitch,
        activeWeapon: this.weapons.activeWeapon,
        isAiming: this.playerCtrl.isRightMouseDown,
        isSprinting: this.localPlayer.stats.isSprinting,
        isDowned: this.localPlayer.stats.isDowned,
        health: this.localPlayer.stats.health,
        flashlightOn: this.localPlayer.flashlightOn,
        animState: this.localPlayer.stats.isDowned
          ? 'downed'
          : this.playerCtrl.velocity.lengthSq() > 0.1
          ? this.localPlayer.stats.isSprinting
            ? 'run'
            : 'walk'
          : 'idle',
      });

      // Interpolate Remote Player if received
      if (this.remotePlayerModel && zombieSocket.remotePlayer) {
        const rp = zombieSocket.remotePlayer;
        this.remotePlayerModel.group.position.lerp(new THREE.Vector3(rp.x, rp.y, rp.z), 0.3);
        this.remotePlayerModel.group.rotation.y = rp.rotationY;
        this.remotePlayerModel.stats.health = rp.health;
        this.remotePlayerModel.stats.isDowned = rp.isDowned;
        this.remotePlayerModel.setWeaponVisual(rp.activeWeapon);
        if (rp.isDowned && !this.remotePlayerModel.stats.isDowned) {
          this.remotePlayerModel.enterDownedState();
        } else if (!rp.isDowned && this.remotePlayerModel.stats.isDowned) {
          this.remotePlayerModel.revive();
        }
      }
    }

    // 9. Update Bullet Tracers
    for (let t = this.tracers.length - 1; t >= 0; t--) {
      const tracer = this.tracers[t];
      tracer.life -= delta;
      (tracer.line.material as THREE.LineBasicMaterial).opacity = tracer.life / 0.07;
      if (tracer.life <= 0) {
        this.scene.remove(tracer.line);
        this.tracers.splice(t, 1);
      }
    }

    // 9b. Update Muzzle Smoke Particles
    for (let s = this.smokeParticles.length - 1; s >= 0; s--) {
      const p = this.smokeParticles[s];
      p.life -= delta;
      p.mesh.position.addScaledVector(p.velocity, delta);
      p.velocity.multiplyScalar(0.91);
      const progress = Math.max(0, p.life / p.maxLife);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = progress * 0.45;
      p.mesh.scale.addScalar(delta * 1.3);
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.smokeParticles.splice(s, 1);
      }
    }

    // 10. Hitmarker Fade
    if (this.hitmarkerTimer > 0) {
      this.hitmarkerTimer -= delta;
      if (this.hitmarkerTimer <= 0) {
        this.hitmarkerActive = false;
      }
    }

    // 11. Check Game Over (Local player dead/downed and remote partner dead/downed, or solo bleedout)
    if (!this.isGameOver) {
      const localLost =
        this.localPlayer.stats.isDowned && this.localPlayer.stats.bleedoutTimer <= 0;
      const remoteLost = !this.remotePlayerModel || (this.remotePlayerModel.stats.isDowned && this.remotePlayerModel.stats.health <= 0);

      // In solo: downed bleedout = game over. In co-op: both downed = game over.
      const bothDowned = this.remotePlayerModel
        ? this.localPlayer.stats.isDowned && this.remotePlayerModel.stats.isDowned
        : this.localPlayer.stats.isDowned;

      if (localLost || (bothDowned && this.localPlayer.stats.bleedoutTimer <= 2)) {
        this.triggerGameOver();
      }
    }

    // Update survival timer
    this.stats.survivalTimeSeconds = Math.floor((Date.now() - this.matchStartTime) / 1000);

    // Notify React HUD
    if (this.onStateChange) {
      this.onStateChange();
    }

    // Render 3D Scene
    this.renderer.render(this.scene, this.cameraCtrl.camera);
  };

  private triggerGameOver() {
    this.isGameOver = true;
    this.stats.survivalTimeSeconds = Math.floor((Date.now() - this.matchStartTime) / 1000);
    zombieAudio.updateHeartbeat(false);

    if (this.onGameOver) {
      this.onGameOver(this.stats);
    }
  }

  public restartGame() {
    this.isGameOver = false;
    this.matchStartTime = Date.now();
    this.horde.clearAll();
    this.localPlayer.revive();
    this.localPlayer.stats.health = 100;
    this.localPlayer.group.position.set(0, 0, 14);

    if (this.remotePlayerModel) {
      this.remotePlayerModel.revive();
      this.remotePlayerModel.stats.health = 100;
      this.remotePlayerModel.group.position.set(2, 0, 14);
    }

    this.waves.startFirstWave();
  }

  private handleResize = () => {
    if (!this.container || !this.renderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.cameraCtrl.camera.aspect = width / height;
    this.cameraCtrl.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public dispose() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.handleResize);
    this.playerCtrl.dispose();
    zombieAudio.updateHeartbeat(false);

    for (const t of this.tracers) {
      this.scene.remove(t.line);
      t.line.geometry.dispose();
      (t.line.material as THREE.Material).dispose();
    }
    this.tracers = [];

    for (const p of this.smokeParticles) {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      (p.mesh.material as THREE.Material).dispose();
    }
    this.smokeParticles = [];

    this.renderer.dispose();
  }
}
