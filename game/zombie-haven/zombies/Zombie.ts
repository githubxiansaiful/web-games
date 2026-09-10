/**
 * Zombie Haven - Stylized Low-Poly Zombie Character
 * Walker, Runner, Tank, and Screamer types with procedural animation,
 * glowing eyes, attack claws, hit stagger, and ragdoll death.
 */

import * as THREE from 'three';
import { ZombieType, ZombieState, ZombieConfig } from '../types';
import { zombieAudio } from '@/components/zombie-haven/ZombieHavenAudio';

export const ZOMBIE_CONFIGS: Record<ZombieType, ZombieConfig> = {
  walker: {
    type: 'walker',
    maxHealth: 100,
    speed: 1.8,
    damage: 10,
    attackRange: 1.6,
    attackCooldown: 1.4,
    detectRange: 45,
    scoreValue: 10,
    scale: 1.0,
    color: 0x4e6b4e, // sickly rotting undead green
  },
  runner: {
    type: 'runner',
    maxHealth: 60,
    speed: 4.2,
    damage: 8,
    attackRange: 1.5,
    attackCooldown: 0.9,
    detectRange: 60,
    scoreValue: 20,
    scale: 0.92,
    color: 0x993838, // furious crimson-tainted infected
  },
  tank: {
    type: 'tank',
    maxHealth: 350,
    speed: 1.25,
    damage: 26,
    attackRange: 2.2,
    attackCooldown: 1.8,
    detectRange: 40,
    scoreValue: 50,
    scale: 1.55,
    color: 0x475569, // massive slate-gray brute
  },
  screamer: {
    type: 'screamer',
    maxHealth: 80,
    speed: 2.4,
    damage: 6,
    attackRange: 1.4,
    attackCooldown: 1.6,
    detectRange: 55,
    scoreValue: 30,
    scale: 0.9,
    color: 0x6b4984, // ghastly pale purple-black banshee
  },
};

export class Zombie {
  public group: THREE.Group;
  public id: string;
  public type: ZombieType;
  public config: ZombieConfig;
  public health: number;
  public state: ZombieState = 'search';
  public lastAttackTime: number = 0;
  public deathTimer: number = 0;
  public isDead: boolean = false;

  // Body parts for procedural animation
  private torso: THREE.Mesh;
  private head: THREE.Mesh;
  private leftArm: THREE.Mesh;
  private rightArm: THREE.Mesh;
  private leftLeg: THREE.Mesh;
  private rightLeg: THREE.Mesh;
  private eyeMesh: THREE.Mesh;
  private skinMat: THREE.MeshLambertMaterial;

  private animTimer: number = Math.random() * 10;
  private staggerTimer: number = 0;
  private isAttacking: boolean = false;
  private attackAnimTime: number = 0;

  constructor(id: string, type: ZombieType, spawnPos: THREE.Vector3) {
    this.id = id;
    this.type = type;
    this.config = ZOMBIE_CONFIGS[type];
    this.health = this.config.maxHealth;

    this.group = new THREE.Group();
    this.group.position.copy(spawnPos);
    this.group.scale.setScalar(this.config.scale);

    // Zombie Materials
    this.skinMat = new THREE.MeshLambertMaterial({ color: this.config.color });
    const clothesMat = new THREE.MeshLambertMaterial({ color: 0x1f2937 });
    const pantsMat = new THREE.MeshLambertMaterial({ color: 0x111827 });

    // Torso
    const torsoH = 0.75;
    const torsoGeo = new THREE.BoxGeometry(0.6, torsoH, 0.35);
    this.torso = new THREE.Mesh(torsoGeo, clothesMat);
    this.torso.position.y = 1.15;
    this.torso.castShadow = false;
    this.group.add(this.torso);

    // Head
    const headGeo = new THREE.BoxGeometry(0.36, 0.38, 0.36);
    this.head = new THREE.Mesh(headGeo, this.skinMat);
    this.head.position.set(0, 0.58, 0.05);
    this.head.castShadow = false;
    this.torso.add(this.head);

    // Glowing Eyes
    const eyeGeo = new THREE.BoxGeometry(0.28, 0.08, 0.05);
    const eyeColor = type === 'runner' || type === 'tank' ? 0xef4444 : 0xeab308;
    const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });
    this.eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
    this.eyeMesh.position.set(0, 0.05, 0.19);
    this.head.add(this.eyeMesh);

    // Arms (reaching forward aggressively)
    const armGeo = new THREE.BoxGeometry(0.16, 0.65, 0.16);
    this.leftArm = new THREE.Mesh(armGeo, this.skinMat);
    this.leftArm.position.set(-0.42, 0.05, 0.15);
    this.leftArm.rotation.x = -Math.PI / 2.3; // outstretched claw
    this.leftArm.castShadow = false;
    this.torso.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, this.skinMat);
    this.rightArm.position.set(0.42, 0.05, 0.15);
    this.rightArm.rotation.x = -Math.PI / 2.2;
    this.rightArm.castShadow = false;
    this.torso.add(this.rightArm);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.2, 0.75, 0.2);
    this.leftLeg = new THREE.Mesh(legGeo, pantsMat);
    this.leftLeg.position.set(-0.16, 0.42, 0);
    this.leftLeg.castShadow = false;
    this.group.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, pantsMat);
    this.rightLeg.position.set(0.16, 0.42, 0);
    this.rightLeg.castShadow = false;
    this.group.add(this.rightLeg);
  }

  public takeDamage(damage: number, hitDir?: THREE.Vector3): boolean {
    if (this.isDead) return false;

    this.health = Math.max(0, this.health - damage);
    this.staggerTimer = 0.18;

    // Flash white/red on hit
    this.skinMat.color.setHex(0xf87171);

    if (this.health === 0) {
      this.die(hitDir);
      return true; // was killed
    }
    return false;
  }

  private die(hitDir?: THREE.Vector3) {
    this.isDead = true;
    this.state = 'dead';
    this.deathTimer = 0;
    zombieAudio.playZombieDeath();

    // Turn off glowing eyes
    this.eyeMesh.visible = false;

    // Death collapse animation
    this.group.position.y = 0.15;
    this.torso.rotation.x = Math.PI / 2.2;
    this.leftArm.rotation.x = 0;
    this.rightArm.rotation.x = 0;
    this.leftLeg.rotation.x = 0.2;
    this.rightLeg.rotation.x = -0.2;

    if (hitDir) {
      this.group.position.addScaledVector(hitDir, 0.6);
    }
  }

  public startAttack() {
    this.isAttacking = true;
    this.attackAnimTime = 0;
    zombieAudio.playZombieAttack();
  }

  public update(delta: number, targetPos: THREE.Vector3 | null, speedMultiplier = 1.0) {
    // If dead, fade and wait for removal
    if (this.isDead) {
      this.deathTimer += delta;
      return;
    }

    // Stagger recovery
    if (this.staggerTimer > 0) {
      this.staggerTimer -= delta;
      if (this.staggerTimer <= 0) {
        this.skinMat.color.setHex(this.config.color);
      }
    }

    this.animTimer += delta * (this.config.speed * 2.8);

    // Attack Claw Animation
    if (this.isAttacking) {
      this.attackAnimTime += delta * 4;
      const swipe = Math.sin(this.attackAnimTime * Math.PI);
      this.rightArm.rotation.x = -Math.PI / 2 - swipe * 0.8;
      this.leftArm.rotation.x = -Math.PI / 2 - swipe * 0.6;

      if (this.attackAnimTime >= 1) {
        this.isAttacking = false;
        this.rightArm.rotation.x = -Math.PI / 2.2;
        this.leftArm.rotation.x = -Math.PI / 2.3;
      }
      return;
    }

    // Move toward target if valid
    if (targetPos && this.staggerTimer <= 0) {
      const dx = targetPos.x - this.group.position.x;
      const dz = targetPos.z - this.group.position.z;
      const dist = Math.hypot(dx, dz);

      // Face target
      const angle = Math.atan2(dx, dz);
      this.group.rotation.y = angle;

      if (dist > this.config.attackRange) {
        this.state = 'chase';
        const moveDist = this.config.speed * speedMultiplier * delta;
        this.group.position.x += (dx / dist) * moveDist;
        this.group.position.z += (dz / dist) * moveDist;

        // Limping walk cycle
        const legSwing = Math.sin(this.animTimer) * 0.55;
        this.leftLeg.rotation.x = legSwing;
        this.rightLeg.rotation.x = -legSwing;

        // Body shambling sway
        this.torso.rotation.z = Math.sin(this.animTimer * 0.6) * 0.12;
        this.head.rotation.y = Math.sin(this.animTimer * 0.4) * 0.15;
      } else {
        this.state = 'attack';
        this.leftLeg.rotation.x = 0;
        this.rightLeg.rotation.x = 0;
      }
    }
  }
}
