import * as THREE from 'three';
import { Damageable, DamageEvent } from '../combat/DamageSystem';
import { World } from '../world/World';
import { SoundManager } from '../core/SoundManager';
import { EventBus } from '../core/EventBus';

export type NPCType = 'civilian' | 'hostile' | 'police_officer';
export type NPCState = 'idle' | 'wander' | 'flee' | 'attack' | 'dead';

export class NPC implements Damageable {
  public id: string;
  public type: NPCType;
  public mesh: THREE.Group;
  public state: NPCState = 'idle';

  public isDead: boolean = false;
  public health: number = 60;
  public maxHealth: number = 60;

  public position: THREE.Vector3 = new THREE.Vector3();
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public facingAngle: number = 0;

  public targetDestination: THREE.Vector3 | null = null;
  public stateTimer: number = 0;
  private animTimer: number = 0;

  // Dropped Cash on Defeat
  public hasDroppedLoot: boolean = false;
  public lootCashMesh: THREE.Mesh | null = null;
  public lootValue: number = 100;

  private torsoMesh: THREE.Mesh;
  private leftLeg: THREE.Group;
  private rightLeg: THREE.Group;
  private leftArm: THREE.Group;
  private rightArm: THREE.Group;

  private world: World;
  private soundManager: SoundManager;
  private eventBus: EventBus;

  constructor(
    type: NPCType,
    initialPos: THREE.Vector3,
    world: World,
    shirtColor: number = 0x3b82f6
  ) {
    this.id = `npc_${type}_${Math.random().toString(36).substring(2, 7)}`;
    this.type = type;
    this.position.copy(initialPos);
    this.world = world;
    this.soundManager = SoundManager.getInstance();
    this.eventBus = EventBus.getInstance();

    if (type === 'hostile') {
      this.health = 80;
      this.maxHealth = 80;
      this.lootValue = 250;
      shirtColor = 0xb91c1c; // Dark Red Syndicate
    } else if (type === 'police_officer') {
      this.health = 100;
      this.maxHealth = 100;
      this.lootValue = 150;
      shirtColor = 0x1d4ed8; // Police Navy Blue
    }

    const rig = this.buildNPCMesh(shirtColor);
    this.mesh = rig.root;
    this.torsoMesh = rig.torso;
    this.leftLeg = rig.leftLeg;
    this.rightLeg = rig.rightLeg;
    this.leftArm = rig.leftArm;
    this.rightArm = rig.rightArm;

    this.mesh.position.copy(this.position);
    this.pickNewDestination();
  }

  private buildNPCMesh(shirtColor: number): {
    root: THREE.Group;
    torso: THREE.Mesh;
    leftLeg: THREE.Group;
    rightLeg: THREE.Group;
    leftArm: THREE.Group;
    rightArm: THREE.Group;
  } {
    const root = new THREE.Group();
    const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.7 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xdfa06e, roughness: 0.8 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x09090b });

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.7, 0.35), shirtMat);
    torso.position.y = 1.25;
    torso.castShadow = true;
    root.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.38, 0.36), skinMat);
    head.position.y = 1.76;
    head.castShadow = true;
    root.add(head);

    // Left Leg
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.18, 0.88, 0);
    const legLeftMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.74, 0.24), pantsMat);
    legLeftMesh.position.y = -0.37;
    leftLeg.add(legLeftMesh);
    const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.15, 0.32), shoeMat);
    shoeL.position.set(0, -0.74, 0.04);
    leftLeg.add(shoeL);
    root.add(leftLeg);

    // Right Leg
    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.18, 0.88, 0);
    const legRightMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.74, 0.24), pantsMat);
    legRightMesh.position.y = -0.37;
    rightLeg.add(legRightMesh);
    const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.15, 0.32), shoeMat);
    shoeR.position.set(0, -0.74, 0.04);
    rightLeg.add(shoeR);
    root.add(rightLeg);

    // Arms
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.42, 1.48, 0);
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.62, 0.18), shirtMat);
    armL.position.y = -0.31;
    leftArm.add(armL);
    root.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.42, 1.48, 0);
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.62, 0.18), shirtMat);
    armR.position.y = -0.31;
    rightArm.add(armR);

    // Give hostile guard a firearm model
    if (this.type === 'hostile' || this.type === 'police_officer') {
      const gunMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.18, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x09090b, metalness: 0.9 })
      );
      gunMesh.position.set(0, -0.6, 0.2);
      rightArm.add(gunMesh);
    }

    root.add(rightArm);

    return { root, torso, leftLeg, rightLeg, leftArm, rightArm };
  }

  public update(deltaTime: number, playerPosition: THREE.Vector3): void {
    if (this.isDead) return;

    this.stateTimer += deltaTime;
    const distToPlayer = this.position.distanceTo(playerPosition);

    // Hostile AI Logic: Attack Player if detected nearby
    if (this.type === 'hostile') {
      if (distToPlayer < 40) {
        this.state = 'attack';
      }
    }

    if (this.state === 'attack') {
      // Turn towards player and advance or shoot
      const targetDir = playerPosition.clone().sub(this.position).setY(0);
      this.facingAngle = Math.atan2(targetDir.x, targetDir.z);

      if (distToPlayer > 12) {
        // Move towards player
        targetDir.normalize();
        this.velocity.x = targetDir.x * 4.2;
        this.velocity.z = targetDir.z * 4.2;
      } else {
        // Stop and fire
        this.velocity.set(0, 0, 0);
        // Shoot interval
        if (this.stateTimer > 1.2) {
          this.stateTimer = 0;
          this.soundManager.playGunshot('smg');
          this.eventBus.emit('HOSTILE_FIRED_AT_PLAYER', { damage: 8, attackerId: this.id });
        }
      }
    } else if (this.state === 'flee') {
      // Run away from player
      const fleeDir = this.position.clone().sub(playerPosition).setY(0).normalize();
      this.velocity.x = fleeDir.x * 6.5;
      this.velocity.z = fleeDir.z * 6.5;
      this.facingAngle = Math.atan2(fleeDir.x, fleeDir.z);

      if (this.stateTimer > 7.0) {
        this.state = 'wander';
        this.pickNewDestination();
      }
    } else if (this.state === 'wander' && this.targetDestination) {
      // Walk towards destination
      const toDest = this.targetDestination.clone().sub(this.position).setY(0);
      const dist = toDest.length();

      if (dist < 1.5 || this.stateTimer > 15) {
        this.state = 'idle';
        this.stateTimer = 0;
        this.velocity.set(0, 0, 0);
      } else {
        toDest.normalize();
        this.velocity.x = toDest.x * 2.2;
        this.velocity.z = toDest.z * 2.2;
        this.facingAngle = Math.atan2(toDest.x, toDest.z);
      }
    } else if (this.state === 'idle') {
      this.velocity.set(0, 0, 0);
      if (this.stateTimer > 3.5) {
        this.pickNewDestination();
        this.state = 'wander';
        this.stateTimer = 0;
      }
    }

    // Integrate Position
    this.position.x += this.velocity.x * deltaTime;
    this.position.z += this.velocity.z * deltaTime;

    // Resolve building collision
    this.world.resolveCollision(this.position, 0.45);

    // Visual Mesh Sync
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.facingAngle;

    // Leg & Arm Animations
    this.animate(deltaTime);
  }

  private animate(deltaTime: number): void {
    const moveSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);

    if (moveSpeed > 0.2) {
      this.animTimer += deltaTime * (moveSpeed > 5 ? 12 : 7);
      const stride = Math.sin(this.animTimer) * 0.5;

      this.leftLeg.rotation.x = stride;
      this.rightLeg.rotation.x = -stride;
      this.leftArm.rotation.x = -stride * 0.7;
      this.rightArm.rotation.x = stride * 0.7;
      this.torsoMesh.position.y = 1.25 + Math.abs(Math.sin(this.animTimer)) * 0.04;
    } else {
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.leftArm.rotation.x = 0;
      this.rightArm.rotation.x = this.state === 'attack' ? -0.7 : 0;
      this.torsoMesh.position.y = 1.25;
    }
  }

  private pickNewDestination(): void {
    const angle = Math.random() * Math.PI * 2;
    const distance = 15 + Math.random() * 30;
    this.targetDestination = new THREE.Vector3(
      this.position.x + Math.sin(angle) * distance,
      0,
      this.position.z + Math.cos(angle) * distance
    );
  }

  public onGunshotHeard(gunshotPos: THREE.Vector3): void {
    if (this.isDead) return;
    if (this.type === 'civilian' && this.position.distanceTo(gunshotPos) < 50) {
      this.state = 'flee';
      this.stateTimer = 0;
    }
  }

  public takeDamage(event: DamageEvent): void {
    if (this.isDead) return;

    this.health -= event.amount;
    this.soundManager.playDamageSound();

    if (this.type === 'civilian') {
      this.state = 'flee';
      this.stateTimer = 0;
      this.eventBus.emit('CRIME_COMMITTED', { type: 'assault_civilian' });
    }

    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
      this.state = 'dead';
      this.mesh.rotation.z = Math.PI / 2;
      this.mesh.position.y = 0.2;

      // Spawn glowing cash loot pickup!
      this.spawnCashLoot();

      this.eventBus.emit('NPC_DIED', {
        id: this.id,
        type: this.type,
        position: this.position.clone(),
      });
    }
  }

  private spawnCashLoot(): void {
    if (this.hasDroppedLoot) return;
    this.hasDroppedLoot = true;

    const lootGeo = new THREE.BoxGeometry(0.55, 0.15, 0.35);
    const lootMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.3,
      emissive: 0x15803d,
      emissiveIntensity: 0.6,
    });
    this.lootCashMesh = new THREE.Mesh(lootGeo, lootMat);
    this.lootCashMesh.position.set(this.position.x, 0.2, this.position.z);
    this.world.scene.add(this.lootCashMesh);
  }

  public checkLootPickup(playerPos: THREE.Vector3): number {
    if (this.lootCashMesh && this.hasDroppedLoot) {
      if (this.lootCashMesh.position.distanceTo(playerPos) < 2.2) {
        this.world.scene.add(this.lootCashMesh);
        this.world.scene.remove(this.lootCashMesh);
        this.lootCashMesh = null;
        return this.lootValue;
      }
    }
    return 0;
  }
}
