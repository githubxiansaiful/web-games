import * as THREE from 'three';
import { VehicleConfig } from '../data/vehicleData';
import { Damageable, DamageEvent } from '../combat/DamageSystem';
import { SoundManager } from '../core/SoundManager';
import { World } from '../world/World';

export class Vehicle implements Damageable {
  public id: string;
  public config: VehicleConfig;
  public mesh: THREE.Group;
  public isDead: boolean = false;
  public health: number;
  public maxHealth: number;

  public position: THREE.Vector3 = new THREE.Vector3();
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public speed: number = 0; // m/s (forward is positive, reverse is negative)
  public heading: number = 0; // Rotation around Y axis in radians
  public steerAngle: number = 0;

  public isOccupied: boolean = false;
  public isPlayerDriving: boolean = false;

  private wheels: THREE.Mesh[] = [];
  private frontWheelAnchors: THREE.Group[] = [];
  private headlightMeshes: THREE.Mesh[] = [];
  private taillightMeshes: THREE.Mesh[] = [];
  private sirenMesh: THREE.Mesh | null = null;
  private sirenLight: THREE.PointLight | null = null;
  private sirenTimer: number = 0;

  // Custom 3D Vehicle Model (GLTF / GLB)
  public customModel: THREE.Object3D | null = null;
  public isCustomModelLoaded: boolean = false;
  private proceduralRig: THREE.Group | null = null;
  private frontWheelBones: THREE.Bone[] = [];
  private rearWheelBones: THREE.Bone[] = [];
  private steeringWheelBone: THREE.Bone | null = null;
  private spoilerBone: THREE.Bone | null = null;
  private wheelSpinAngle: number = 0;

  private soundManager: SoundManager;
  private world: World;

  constructor(config: VehicleConfig, initialPos: THREE.Vector3, initialHeading: number, world: World) {
    this.id = `${config.id}_${Math.random().toString(36).substring(2, 7)}`;
    this.config = config;
    this.health = config.health;
    this.maxHealth = config.health;
    this.position.copy(initialPos);
    this.heading = initialHeading;
    this.world = world;
    this.soundManager = SoundManager.getInstance();

    this.mesh = new THREE.Group();
    this.mesh.name = `Vehicle_${config.id}`;
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.heading;

    // 1. Build Procedural Rig (immediate visual fallback while 3D model loads)
    this.proceduralRig = this.buildVehicleMesh();
    this.mesh.add(this.proceduralRig);

    // 2. Asynchronously load high-detail 3D car model if configured
    if (this.config.modelPath) {
      this.loadCustomModel(this.config.modelPath);
    }
  }

  private loadCustomModel(path: string): void {
    if (typeof window === 'undefined') return;

    import('three/examples/jsm/loaders/GLTFLoader.js').then(({ GLTFLoader }) => {
      const loader = new GLTFLoader();
      loader.load(
        path,
        (gltf) => {
          this.customModel = gltf.scene;

          // Enable shadows and enhance PBR paint reflectiveness
          gltf.scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              const mesh = child as THREE.Mesh;
              if (mesh.material) {
                const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                mats.forEach((m) => {
                  if (m.name === 'Paint' && 'roughness' in m) {
                    (m as THREE.MeshStandardMaterial).roughness = 0.2;
                    (m as THREE.MeshStandardMaterial).metalness = 0.85;
                  }
                });
              }
            }
          });

          // Identify skeletal animation bones for steering, spinning, and active aero
          const fl = gltf.scene.getObjectByName('Wheel_Front_L_28');
          const fr = gltf.scene.getObjectByName('Wheel_Front_R_30');
          const rl = gltf.scene.getObjectByName('Wheel_Rear_L_32');
          const rr = gltf.scene.getObjectByName('Wheel_Rear_R_34');
          const sw = gltf.scene.getObjectByName('Animate_SteeringWheel_20');
          const sp = gltf.scene.getObjectByName('Animate_Spoiler_16');

          if (fl && (fl as THREE.Bone).isBone) this.frontWheelBones.push(fl as THREE.Bone);
          if (fr && (fr as THREE.Bone).isBone) this.frontWheelBones.push(fr as THREE.Bone);
          if (rl && (rl as THREE.Bone).isBone) this.rearWheelBones.push(rl as THREE.Bone);
          if (rr && (rr as THREE.Bone).isBone) this.rearWheelBones.push(rr as THREE.Bone);
          if (sw && (sw as THREE.Bone).isBone) this.steeringWheelBone = sw as THREE.Bone;
          if (sp && (sp as THREE.Bone).isBone) this.spoilerBone = sp as THREE.Bone;

          // Hide procedural box car and display the realistic 3D vehicle
          if (this.proceduralRig) {
            this.proceduralRig.visible = false;
          }
          this.mesh.add(gltf.scene);
          this.isCustomModelLoaded = true;
        },
        undefined,
        (err) => console.warn(`Failed loading custom vehicle model ${path}:`, err)
      );
    });
  }

  private buildVehicleMesh(): THREE.Group {
    const root = new THREE.Group();

    // 1. Lower Chassis
    const chassisGeo = new THREE.BoxGeometry(2.1, 0.65, 4.6);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: this.config.primaryColor,
      metalness: 0.6,
      roughness: 0.35,
    });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.y = 0.55;
    chassis.castShadow = true;
    root.add(chassis);

    // 2. Cabin / Greenhouse
    const cabinGeo = new THREE.BoxGeometry(1.8, 0.75, 2.3);
    const cabinMat = new THREE.MeshStandardMaterial({
      color: this.config.roofColor || 0x0f172a,
      metalness: 0.8,
      roughness: 0.2,
    });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 1.15, -0.2);
    cabin.castShadow = true;
    root.add(cabin);

    // Windshield & Windows
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.75,
    });
    const frontWindshieldGeo = new THREE.PlaneGeometry(1.7, 0.75);
    const frontWindshield = new THREE.Mesh(frontWindshieldGeo, glassMat);
    frontWindshield.rotation.x = -Math.PI / 4;
    frontWindshield.position.set(0, 1.15, 0.96);
    root.add(frontWindshield);

    // 3. Headlights (White/Cyan Glow)
    const hlGeo = new THREE.BoxGeometry(0.35, 0.2, 0.1);
    const hlMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
    const hlLeft = new THREE.Mesh(hlGeo, hlMat);
    hlLeft.position.set(-0.75, 0.55, 2.31);
    const hlRight = new THREE.Mesh(hlGeo, hlMat);
    hlRight.position.set(0.75, 0.55, 2.31);
    root.add(hlLeft);
    root.add(hlRight);
    this.headlightMeshes.push(hlLeft, hlRight);

    // 4. Taillights (Red)
    const tlGeo = new THREE.BoxGeometry(0.4, 0.18, 0.1);
    const tlMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const tlLeft = new THREE.Mesh(tlGeo, tlMat);
    tlLeft.position.set(-0.75, 0.6, -2.31);
    const tlRight = new THREE.Mesh(tlGeo, tlMat);
    tlRight.position.set(0.75, 0.6, -2.31);
    root.add(tlLeft);
    root.add(tlRight);
    this.taillightMeshes.push(tlLeft, tlRight);

    // 5. Police Siren Lightbar (if police vehicle)
    if (this.config.hasSiren) {
      const sirenBarGeo = new THREE.BoxGeometry(1.2, 0.2, 0.35);
      const sirenBarMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
      this.sirenMesh = new THREE.Mesh(sirenBarGeo, sirenBarMat);
      this.sirenMesh.position.set(0, 1.6, -0.2);
      root.add(this.sirenMesh);

      this.sirenLight = new THREE.PointLight(0x3b82f6, 3, 25);
      this.sirenLight.position.set(0, 1.8, -0.2);
      root.add(this.sirenLight);
    }

    // 6. Wheels (Front Left, Front Right, Rear Left, Rear Right)
    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.9,
    });

    const wheelPositions = [
      { x: -1.05, y: 0.38, z: 1.4, isFront: true }, // FL
      { x: 1.05, y: 0.38, z: 1.4, isFront: true }, // FR
      { x: -1.05, y: 0.38, z: -1.4, isFront: false }, // RL
      { x: 1.05, y: 0.38, z: -1.4, isFront: false }, // RR
    ];

    wheelPositions.forEach((wp) => {
      const wheelMesh = new THREE.Mesh(wheelGeo, wheelMat);
      wheelMesh.castShadow = true;

      if (wp.isFront) {
        const anchor = new THREE.Group();
        anchor.position.set(wp.x, wp.y, wp.z);
        wheelMesh.position.set(0, 0, 0);
        anchor.add(wheelMesh);
        root.add(anchor);
        this.frontWheelAnchors.push(anchor);
      } else {
        wheelMesh.position.set(wp.x, wp.y, wp.z);
        root.add(wheelMesh);
      }
      this.wheels.push(wheelMesh);
    });

    return root;
  }

  public update(deltaTime: number, throttle: number = 0, steer: number = 0, handbrake: boolean = false): void {
    if (this.isDead) return;

    // 1. Progressive Keyboard Steering with Speed-Dependent Lock & Stability
    const absSpeed = Math.abs(this.speed);
    // Smooth turn-in rate (7.0) and fast re-centering (12.0) for natural feel on A/D keys
    const steerResponseSpeed = Math.abs(steer) > 0.01 ? 7.0 : 12.0;
    const steerLerp = 1 - Math.exp(-steerResponseSpeed * deltaTime);

    // Speed-dependent max lock:
    // Full steering lock (~24 deg) at parking/city speeds for sharp intersections.
    // Clamped down smoothly to ~8 deg at high speeds so tapping A/D doesn't snap out of control!
    const speedRatio = Math.min(absSpeed / 30, 1.0);
    const maxLock = handbrake ? 0.46 : (0.42 - speedRatio * 0.28); // 0.42 -> 0.14 rad

    const targetSteerAngle = steer * maxLock;
    this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, targetSteerAngle, steerLerp);

    // Update front wheel visual turning (fallback procedural mesh)
    this.frontWheelAnchors.forEach((a) => {
      a.rotation.y = this.steerAngle;
    });

    // 2. Throttle & Acceleration
    if (throttle > 0) {
      this.speed += this.config.acceleration * throttle * deltaTime;
      if (this.speed > this.config.maxSpeed) {
        this.speed = this.config.maxSpeed;
      }
    } else if (throttle < 0) {
      if (this.speed > 0.5) {
        // Braking
        this.speed -= this.config.brakeForce * deltaTime;
        if (this.speed < 0) this.speed = 0;
      } else {
        // Reverse
        this.speed -= (this.config.acceleration * 0.65) * deltaTime;
        if (this.speed < -this.config.reverseMaxSpeed) {
          this.speed = -this.config.reverseMaxSpeed;
        }
      }
    } else {
      // Natural rolling friction resistance
      const friction = handbrake ? 35 : 6;
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - friction * deltaTime);
      } else if (this.speed < 0) {
        this.speed = Math.min(0, this.speed + friction * deltaTime);
      }
    }

    // 3. Heading rotation from front wheel steering (controlled understeer curve + handbrake drift)
    if (absSpeed > 0.1) {
      const turnFactor = this.speed >= 0 ? 1 : -1;
      // Realistic tire grip curve: nimble in streets, stable on straights without violent twitching
      const speedFactor = Math.min(absSpeed / 7, 1.0) / (1.0 + absSpeed * 0.032);
      const driftMultiplier = handbrake ? 2.2 : 1.0;
      const turnRate = this.steerAngle * this.config.turnSpeed * speedFactor * turnFactor * driftMultiplier;
      this.heading += turnRate * deltaTime;
    }

    // 4. Update Position along Forward Heading Vector
    const forwardX = Math.sin(this.heading);
    const forwardZ = Math.cos(this.heading);

    this.velocity.set(forwardX * this.speed, 0, forwardZ * this.speed);
    this.position.x += this.velocity.x * deltaTime;
    this.position.z += this.velocity.z * deltaTime;
    this.position.y = this.world.getGroundHeight(this.position.x, this.position.z);

    // 5. Collision Resolution with World Buildings
    const col = this.world.resolveCollision(this.position, 1.4);
    if (col.collided) {
      // Bounce and lose speed
      this.speed *= -0.3;
      this.soundManager.playDamageSound();
    }

    // 6. Visual Mesh Sync & Roll/Pitch Dynamics
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.heading;

    // Body roll when cornering
    const rollAngle = (this.steerAngle * (this.speed / 15)) * 0.15;
    this.mesh.rotation.z = -rollAngle;

    // Spin wheels according to speed
    const wheelRotDelta = (this.speed / 0.38) * deltaTime;
    this.wheels.forEach((w) => {
      w.rotation.x += wheelRotDelta;
    });

    // Custom 3D Vehicle Skeletal Animation (Wheel steer & spin, Cockpit steering wheel, Active Aero Spoiler)
    if (this.isCustomModelLoaded) {
      this.wheelSpinAngle += (this.speed / 0.35) * deltaTime;

      this.frontWheelBones.forEach((b) => {
        b.rotation.x = this.wheelSpinAngle;
        b.rotation.y = this.steerAngle;
      });

      this.rearWheelBones.forEach((b) => {
        b.rotation.x = this.wheelSpinAngle;
      });

      if (this.steeringWheelBone) {
        this.steeringWheelBone.rotation.z = -this.steerAngle * 2.2;
      }

      if (this.spoilerBone) {
        const targetSpoiler = Math.abs(this.speed) > 18 ? -0.22 : 0;
        this.spoilerBone.rotation.x = THREE.MathUtils.lerp(
          this.spoilerBone.rotation.x,
          targetSpoiler,
          5 * deltaTime
        );
      }
    }

    // 7. Police Siren Flasher (Alternating Red/Blue)
    if (this.config.hasSiren && this.sirenMesh && this.sirenLight) {
      this.sirenTimer += deltaTime * 8;
      const isRed = Math.sin(this.sirenTimer) > 0;
      const colHex = isRed ? 0xef4444 : 0x3b82f6;
      (this.sirenMesh.material as THREE.MeshBasicMaterial).color.setHex(colHex);
      this.sirenLight.color.setHex(colHex);
    }

    // 8. Engine Audio Pitch Sync for Player Vehicle
    if (this.isPlayerDriving) {
      const speedRatio = Math.abs(this.speed) / this.config.maxSpeed;
      this.soundManager.updateEnginePitch(speedRatio);
    }
  }

  public canEnter(playerPos: THREE.Vector3): boolean {
    return this.position.distanceTo(playerPos) < 3.8 && !this.isOccupied;
  }

  public enter(isPlayer: boolean = false): void {
    this.isOccupied = true;
    this.isPlayerDriving = isPlayer;
    if (isPlayer) {
      this.soundManager.playDoorEnter();
      this.soundManager.startEngineSound();
      if (this.config.hasSiren) {
        this.soundManager.startSiren();
      }
    }
  }

  public exit(): THREE.Vector3 {
    this.isOccupied = false;
    if (this.isPlayerDriving) {
      this.isPlayerDriving = false;
      this.soundManager.stopEngineSound();
      if (this.config.hasSiren) {
        this.soundManager.stopSiren();
      }
    }

    // Calculate exit position beside driver door (left side)
    const rightX = Math.cos(this.heading);
    const rightZ = -Math.sin(this.heading);
    return new THREE.Vector3(
      this.position.x - rightX * 2.2,
      0,
      this.position.z - rightZ * 2.2
    );
  }

  public takeDamage(event: DamageEvent): void {
    if (this.isDead) return;
    this.health -= event.amount;
    this.soundManager.playDamageSound();

    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
      // Darken wreckage
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          (child.material as any).color = new THREE.Color(0x1c1917);
        }
      });
      if (this.isPlayerDriving) {
        this.soundManager.stopEngineSound();
      }
    }
  }
}
