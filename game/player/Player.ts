import * as THREE from 'three';
import { Damageable, DamageEvent } from '../combat/DamageSystem';
import { Vehicle } from '../vehicles/Vehicle';
import { World } from '../world/World';
import { SoundManager } from '../core/SoundManager';
import { EventBus } from '../core/EventBus';

export type PlayerState = 'idle' | 'walk' | 'run' | 'jump' | 'driving' | 'dead';

export class Player implements Damageable {
  public id: string = 'player';
  public mesh: THREE.Group;
  public state: PlayerState = 'idle';

  public isDead: boolean = false;
  public health: number = 100;
  public maxHealth: number = 100;
  public armor: number = 100;
  public maxArmor: number = 100;
  public cash: number = 250;

  public position: THREE.Vector3 = new THREE.Vector3(0, 0, 10);
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public facingAngle: number = 0; // Radians around Y
  public isGrounded: boolean = true;

  public currentVehicle: Vehicle | null = null;

  // Procedural Limb Animation Anchors (Fallback)
  private placeholderRig!: THREE.Group;
  private torsoMesh!: THREE.Mesh;
  private headMesh!: THREE.Mesh;
  private leftLeg!: THREE.Group;
  private rightLeg!: THREE.Group;
  private leftArm!: THREE.Group;
  private rightArm!: THREE.Group;
  private gunMesh!: THREE.Mesh;
  private animTimer: number = 0;

  // Real Mixamo FBX / GLTF Character Model & Animation Rig
  public fbxModel: THREE.Object3D | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  private walkAction: THREE.AnimationAction | null = null;
  private idleAction: THREE.AnimationAction | null = null;
  public isFbxLoaded: boolean = false;

  private world: World;
  private soundManager: SoundManager;
  private eventBus: EventBus;

  constructor(initialPosition: THREE.Vector3, world: World) {
    this.world = world;
    this.position.copy(initialPosition);
    this.position.y = Math.max(initialPosition.y, this.world.getGroundHeight(this.position.x, this.position.z));
    this.soundManager = SoundManager.getInstance();
    this.eventBus = EventBus.getInstance();

    this.mesh = new THREE.Group();
    this.mesh.name = 'PlayerCharacter';

    // 1. Build Fallback Character Rig (active until character model finishes loading)
    const rig = this.buildCharacterRig();
    this.placeholderRig = rig.root;
    this.torsoMesh = rig.torso;
    this.headMesh = rig.head;
    this.leftLeg = rig.leftLeg;
    this.rightLeg = rig.rightLeg;
    this.leftArm = rig.leftArm;
    this.rightArm = rig.rightArm;
    this.gunMesh = rig.gun;
    this.mesh.add(this.placeholderRig);

    this.mesh.position.copy(this.position);

    // 2. Asynchronously Load Real Character Model & Walking/Idle Animation
    this.loadCharacterModel();
  }

  private loadCharacterModel(): void {
    if (typeof window === 'undefined') return;

    Promise.all([
      import('three/examples/jsm/loaders/GLTFLoader.js'),
      import('three/examples/jsm/loaders/FBXLoader.js'),
    ]).then(([{ GLTFLoader }, { FBXLoader }]) => {
      const gltfLoader = new GLTFLoader();
      const fbxLoader = new FBXLoader();

      // Priority 1: Maria (realistic clothed character model)
      gltfLoader.load(
        '/models/character/maria.glb',
        (gltf) => {
          this.fbxModel = gltf.scene;

          // Normalize bone names (Mixamo GLTF exporters often append _01, _02 suffixes)
          gltf.scene.traverse((child) => {
            if (child.name) {
              child.name = child.name.replace(/^mixamorig:?/, 'mixamorig').replace(/_\d+$/, '');
            }
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              const mesh = child as THREE.Mesh;
              if (mesh.material) {
                const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                mats.forEach((m) => {
                  if ('roughness' in m) {
                    (m as THREE.MeshStandardMaterial).roughness = Math.max(
                      (m as THREE.MeshStandardMaterial).roughness ?? 0.65,
                      0.5
                    );
                  }
                });
              }
            }
          });

          // Attach firearm weapon directly to right hand bone
          let rightHandBone: THREE.Bone | null = null;
          gltf.scene.traverse((child) => {
            if (child.name === 'mixamorigRightHand' && (child as THREE.Bone).isBone) {
              rightHandBone = child as THREE.Bone;
            }
          });

          if (rightHandBone) {
            const gunGeo = new THREE.BoxGeometry(6, 12, 38);
            const gunMat = new THREE.MeshStandardMaterial({ color: 0x09090b, metalness: 0.9, roughness: 0.2 });
            const handGun = new THREE.Mesh(gunGeo, gunMat);
            handGun.castShadow = true;
            handGun.position.set(0, -6, 14);
            handGun.rotation.x = -Math.PI / 2;
            (rightHandBone as THREE.Bone).add(handGun);
          }

          // Create AnimationMixer for Maria
          this.mixer = new THREE.AnimationMixer(gltf.scene);

          // Hide placeholder block model and display Maria
          this.placeholderRig.visible = false;
          this.mesh.add(gltf.scene);
          this.isFbxLoaded = true;

          // Load animations
          this.loadAnimations(fbxLoader);
        },
        undefined,
        (err) => {
          console.warn('maria.glb not found or failed, trying xbot.fbx fallback:', err);
          this.loadXBotFallback(fbxLoader);
        }
      );
    });
  }

  private loadXBotFallback(fbxLoader: any): void {
    fbxLoader.load(
      '/models/character/xbot.fbx',
      (fbx: any) => {
        this.fbxModel = fbx;
        fbx.scale.setScalar(0.0102);
        fbx.rotation.y = Math.PI;

        fbx.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              const mats = Array.isArray(child.material) ? child.material : [child.material];
              mats.forEach((m: any) => {
                m.roughness = 0.65;
                m.metalness = 0.25;
              });
            }
          }
        });

        let rightHandBone: THREE.Bone | null = null;
        fbx.traverse((child: any) => {
          if (child.name === 'mixamorigRightHand' && child.isBone) {
            rightHandBone = child as THREE.Bone;
          }
        });

        if (rightHandBone) {
          const gunGeo = new THREE.BoxGeometry(6, 12, 38);
          const gunMat = new THREE.MeshStandardMaterial({ color: 0x09090b, metalness: 0.9, roughness: 0.2 });
          const handGun = new THREE.Mesh(gunGeo, gunMat);
          handGun.castShadow = true;
          handGun.position.set(0, -6, 14);
          handGun.rotation.x = -Math.PI / 2;
          (rightHandBone as THREE.Bone).add(handGun);
        }

        this.mixer = new THREE.AnimationMixer(fbx);
        this.placeholderRig.visible = false;
        this.mesh.add(fbx);
        this.isFbxLoaded = true;

        this.loadAnimations(fbxLoader);
      },
      undefined,
      (err: any) => console.warn('Failed loading xbot.fbx fallback:', err)
    );
  }

  private loadAnimations(loader: any): void {
    loader.load(
      '/models/character/walking.fbx',
      (animFbx: any) => {
        if (animFbx.animations.length > 0 && this.mixer) {
          const walkClip = animFbx.animations[0];
          walkClip.name = 'walk';

          // In-Place Root Motion Filtering:
          // Lock horizontal X and Z on Hips position track so character walks in-place
          // while maintaining natural pelvic bobbing (Y) and full leg/arm stride!
          const hipPosTrack = walkClip.tracks.find((t: THREE.KeyframeTrack) => t.name.includes('Hips.position'));
          if (hipPosTrack && hipPosTrack.values) {
            const firstX = hipPosTrack.values[0];
            const firstZ = hipPosTrack.values[2];
            for (let i = 0; i < hipPosTrack.values.length; i += 3) {
              hipPosTrack.values[i] = firstX;
              hipPosTrack.values[i + 2] = firstZ;
            }
          }

          this.walkAction = this.mixer.clipAction(walkClip);
          this.walkAction.setLoop(THREE.LoopRepeat, Infinity);
          this.walkAction.clampWhenFinished = false;
          this.walkAction.play();
          this.walkAction.setEffectiveWeight(0);

          // Synthesize relaxed standing stance from frame 0 of walking animation
          // so the character NEVER freezes in a rigid T-pose when standing still!
          const restTracks: THREE.KeyframeTrack[] = [];
          walkClip.tracks.forEach((track: THREE.KeyframeTrack) => {
            if (track instanceof THREE.QuaternionKeyframeTrack) {
              const q0 = track.values.slice(0, 4);
              restTracks.push(new THREE.QuaternionKeyframeTrack(track.name, [0, 2], [...q0, ...q0]));
            } else if (track instanceof THREE.VectorKeyframeTrack && track.name.includes('Hips.position')) {
              const p0 = track.values.slice(0, 3);
              restTracks.push(new THREE.VectorKeyframeTrack(track.name, [0, 2], [...p0, ...p0]));
            }
          });
          const fallbackIdleClip = new THREE.AnimationClip('fallback_idle', 2, restTracks);
          this.idleAction = this.mixer.clipAction(fallbackIdleClip);
          this.idleAction.setLoop(THREE.LoopRepeat, Infinity);
          this.idleAction.play();
          this.idleAction.setEffectiveWeight(1.0);

          // Check and load official Idle animation if available (overrides fallback)
          loader.load(
            '/models/character/idle.fbx',
            (idleFbx: any) => {
              // Mixamo downloads with skin often have dummy Take 001 at index 0 and real animation at index 1
              const idleClip = idleFbx.animations.find((a: THREE.AnimationClip) => a.tracks.length > 0) || idleFbx.animations[0];
              if (idleClip && idleClip.tracks.length > 0 && this.mixer) {
                idleClip.name = 'idle';

                // Retarget Hips.position to character bind hip height (105.25cm)
                const hipPosTrack = idleClip.tracks.find((t: THREE.KeyframeTrack) => t.name.includes('Hips.position'));
                if (hipPosTrack && hipPosTrack.values) {
                  const firstY = hipPosTrack.values[1];
                  const bindY = 105.25;
                  for (let i = 0; i < hipPosTrack.values.length; i += 3) {
                    const deltaY = (hipPosTrack.values[i + 1] - firstY) * (bindY / (firstY || 1));
                    hipPosTrack.values[i] = 0;
                    hipPosTrack.values[i + 1] = bindY + deltaY;
                    hipPosTrack.values[i + 2] = 1.765;
                  }
                }

                // Stop previous fallback idle
                if (this.idleAction) {
                  this.idleAction.stop();
                }

                this.idleAction = this.mixer.clipAction(idleClip);
                this.idleAction.setLoop(THREE.LoopRepeat, Infinity);
                this.idleAction.play();
                this.idleAction.setEffectiveWeight(1.0);
              }
            },
            undefined,
            () => {
              // Idle animation not downloaded yet; fallback idle stance is active
            }
          );
        }
      },
      undefined,
      (err: any) => console.warn('Failed loading walking.fbx:', err)
    );
  }

  private buildCharacterRig(): {
    root: THREE.Group;
    torso: THREE.Mesh;
    head: THREE.Mesh;
    leftLeg: THREE.Group;
    rightLeg: THREE.Group;
    leftArm: THREE.Group;
    rightArm: THREE.Group;
    gun: THREE.Mesh;
  } {
    const root = new THREE.Group();
    root.name = 'PlayerCharacter';

    // Materials
    const jacketMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
      metalness: 0.2,
    });
    const neonTrimMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0a96d, roughness: 0.8 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 });
    const visorMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x09090b, metalness: 0.9, roughness: 0.2 });

    // Torso (Jacket)
    const torsoGeo = new THREE.BoxGeometry(0.68, 0.75, 0.38);
    const torso = new THREE.Mesh(torsoGeo, jacketMat);
    torso.position.y = 1.25;
    torso.castShadow = true;
    root.add(torso);

    // Neon jacket stripe
    const stripeGeo = new THREE.BoxGeometry(0.7, 0.08, 0.4);
    const stripe = new THREE.Mesh(stripeGeo, neonTrimMat);
    stripe.position.y = 1.15;
    root.add(stripe);

    // Head
    const headGeo = new THREE.BoxGeometry(0.38, 0.42, 0.38);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.8;
    head.castShadow = true;
    root.add(head);

    // Cyber Visor / Glasses
    const visorGeo = new THREE.BoxGeometry(0.4, 0.12, 0.15);
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 1.82, 0.18);
    root.add(visor);

    // Left Leg Anchor
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.2, 0.88, 0);
    const legGeo = new THREE.BoxGeometry(0.24, 0.76, 0.26);
    const legLeftMesh = new THREE.Mesh(legGeo, pantsMat);
    legLeftMesh.position.y = -0.38;
    legLeftMesh.castShadow = true;
    leftLeg.add(legLeftMesh);

    const shoeLeft = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.16, 0.35), shoeMat);
    shoeLeft.position.set(0, -0.76, 0.05);
    shoeLeft.castShadow = true;
    leftLeg.add(shoeLeft);
    root.add(leftLeg);

    // Right Leg Anchor
    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.2, 0.88, 0);
    const legRightMesh = new THREE.Mesh(legGeo, pantsMat);
    legRightMesh.position.y = -0.38;
    legRightMesh.castShadow = true;
    rightLeg.add(legRightMesh);

    const shoeRight = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.16, 0.35), shoeMat);
    shoeRight.position.set(0, -0.76, 0.05);
    shoeRight.castShadow = true;
    rightLeg.add(shoeRight);
    root.add(rightLeg);

    // Left Arm Anchor
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.46, 1.5, 0);
    const armGeo = new THREE.BoxGeometry(0.2, 0.65, 0.2);
    const armLeftMesh = new THREE.Mesh(armGeo, jacketMat);
    armLeftMesh.position.y = -0.32;
    armLeftMesh.castShadow = true;
    leftArm.add(armLeftMesh);
    root.add(leftArm);

    // Right Arm Anchor (Holds Weapon)
    const rightArm = new THREE.Group();
    rightArm.position.set(0.46, 1.5, 0);
    const armRightMesh = new THREE.Mesh(armGeo, jacketMat);
    armRightMesh.position.y = -0.32;
    armRightMesh.castShadow = true;
    rightArm.add(armRightMesh);

    // Equipped Weapon Mesh
    const gunGeo = new THREE.BoxGeometry(0.12, 0.22, 0.45);
    const gun = new THREE.Mesh(gunGeo, gunMat);
    gun.position.set(0, -0.65, 0.22);
    gun.castShadow = true;
    rightArm.add(gun);

    root.add(rightArm);

    return {
      root,
      torso,
      head,
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      gun,
    };
  }

  public update(deltaTime: number): void {
    if (this.isDead) return;

    if (this.state === 'driving' && this.currentVehicle) {
      // Attached to vehicle
      this.mesh.visible = false;
      this.position.copy(this.currentVehicle.position);
      return;
    }

    this.mesh.visible = true;

    // 1. Apply Gravity
    if (!this.isGrounded) {
      this.velocity.y -= 22 * deltaTime;
    }

    // 2. Integrate Position
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;

    // 3. Ground Elevation Floor Check
    const groundY = this.world.getGroundHeight(this.position.x, this.position.z);
    if (this.position.y <= groundY) {
      this.position.y = groundY;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    // 4. World Collision Resolution with City Buildings
    const col = this.world.resolveCollision(this.position, 0.45);
    if (col.collided) {
      this.velocity.x = 0;
      this.velocity.z = 0;
    }

    // 5. Update Visual Mesh Position & Rotation
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.facingAngle;

    // 6. Character Animations (Mixamo FBX Skinned Mesh or Procedural Fallback)
    const horizontalSpeed = Math.sqrt(
      this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z
    );

    if (this.isFbxLoaded && this.mixer) {
      this.mixer.update(deltaTime);

      if (this.walkAction) {
        if (this.isGrounded && horizontalSpeed > 0.3) {
          const curWalk = this.walkAction.getEffectiveWeight();
          this.walkAction.setEffectiveWeight(THREE.MathUtils.lerp(curWalk, 1.0, 12 * deltaTime));
          this.walkAction.timeScale = horizontalSpeed > 6.0 ? 1.6 : 1.1;

          if (this.idleAction) {
            const curIdle = this.idleAction.getEffectiveWeight();
            this.idleAction.setEffectiveWeight(THREE.MathUtils.lerp(curIdle, 0.0, 12 * deltaTime));
          }
        } else {
          const curWalk = this.walkAction.getEffectiveWeight();
          this.walkAction.setEffectiveWeight(THREE.MathUtils.lerp(curWalk, 0.0, 10 * deltaTime));

          if (this.idleAction) {
            const curIdle = this.idleAction.getEffectiveWeight();
            this.idleAction.setEffectiveWeight(THREE.MathUtils.lerp(curIdle, 1.0, 10 * deltaTime));
          }
        }
      }
    } else {
      this.animateLimbs(deltaTime);
    }
  }

  private animateLimbs(deltaTime: number): void {
    const horizontalSpeed = Math.sqrt(
      this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z
    );

    if (!this.isGrounded) {
      // In air jump pose
      this.leftLeg.rotation.x = -0.4;
      this.rightLeg.rotation.x = 0.5;
      this.leftArm.rotation.x = 0.6;
      this.rightArm.rotation.x = -0.4;
      this.torsoMesh.position.y = 1.25;
      return;
    }

    if (horizontalSpeed > 0.4) {
      // Walking / Sprinting stride
      const animFreq = horizontalSpeed > 6.0 ? 14 : 9;
      this.animTimer += deltaTime * animFreq;

      const strideAngle = Math.sin(this.animTimer) * (horizontalSpeed > 6.0 ? 0.75 : 0.45);

      this.leftLeg.rotation.x = strideAngle;
      this.rightLeg.rotation.x = -strideAngle;

      this.leftArm.rotation.x = -strideAngle * 0.8;
      // Keep right arm raised if aiming/holding gun
      this.rightArm.rotation.x = strideAngle * 0.4 - 0.3;

      // Slight vertical bobbing
      this.torsoMesh.position.y = 1.25 + Math.abs(Math.sin(this.animTimer)) * 0.06;
      this.headMesh.position.y = 1.8 + Math.abs(Math.sin(this.animTimer)) * 0.06;
    } else {
      // Idle Breathing
      this.animTimer += deltaTime * 2.5;
      const breath = Math.sin(this.animTimer) * 0.02;

      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.leftArm.rotation.x = breath;
      this.rightArm.rotation.x = -0.3 + breath;

      this.torsoMesh.position.y = 1.25 + breath;
      this.headMesh.position.y = 1.8 + breath;
    }
  }

  public enterVehicle(vehicle: Vehicle): void {
    this.currentVehicle = vehicle;
    this.state = 'driving';
    this.mesh.visible = false;
    this.position.copy(vehicle.position);
    this.mesh.position.copy(vehicle.position);
    vehicle.enter(true);
    this.eventBus.emit('PLAYER_ENTERED_VEHICLE', { vehicleId: vehicle.id });
  }

  public exitVehicle(): void {
    if (!this.currentVehicle) return;
    const exitPos = this.currentVehicle.exit();
    this.position.copy(exitPos);
    this.position.y = this.world.getGroundHeight(exitPos.x, exitPos.z);
    this.velocity.set(0, 0, 0);
    this.currentVehicle = null;
    this.state = 'idle';
    this.mesh.visible = true;
    this.mesh.position.copy(this.position);
    this.eventBus.emit('PLAYER_EXITED_VEHICLE');
  }

  public addCash(amount: number): void {
    this.cash += amount;
    this.soundManager.playCashSound();
    this.emitStats();
  }

  public takeDamage(event: DamageEvent): void {
    if (this.isDead) return;

    let remaining = event.amount;
    // Armor absorbs 70% of damage first
    if (this.armor > 0) {
      const armorAbsorb = Math.min(this.armor, remaining * 0.7);
      this.armor -= armorAbsorb;
      remaining -= armorAbsorb;
    }

    this.health -= remaining;
    this.soundManager.playDamageSound();

    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
      this.state = 'dead';
      // Fall down on defeat
      this.mesh.rotation.z = Math.PI / 2;
      this.mesh.position.y = this.world.getGroundHeight(this.position.x, this.position.z) + 0.2;
      this.eventBus.emit('PLAYER_DIED');
    }

    this.emitStats();
  }

  public respawn(spawnPosition: THREE.Vector3): void {
    this.isDead = false;
    this.health = 100;
    this.armor = 100;
    this.state = 'idle';
    this.position.copy(spawnPosition);
    this.position.y = Math.max(spawnPosition.y, this.world.getGroundHeight(this.position.x, this.position.z));
    this.velocity.set(0, 0, 0);
    this.mesh.rotation.set(0, 0, 0);
    this.mesh.visible = true;
    this.emitStats();
  }

  public emitStats(): void {
    this.eventBus.emit('PLAYER_STATS_CHANGED', {
      health: this.health,
      maxHealth: this.maxHealth,
      armor: this.armor,
      maxArmor: this.maxArmor,
      cash: this.cash,
      isDriving: this.state === 'driving',
      speed: this.currentVehicle ? Math.round(Math.abs(this.currentVehicle.speed) * 3.6) : 0,
    });
  }
}
