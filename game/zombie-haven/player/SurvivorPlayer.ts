/**
 * Zombie Haven - Survivor Player 3D Character
 * Stylized low-poly survivor model with animated limbs, weapon attachments,
 * mounted flashlight, health & stamina stats, and downed/crawling posture.
 */

import * as THREE from 'three';
import { PlayerStats, WeaponType } from '../types';
import { DeadwoodVillage } from '../world/DeadwoodVillage';

export class SurvivorPlayer {
  public group: THREE.Group;
  public stats: PlayerStats;
  public flashlight: THREE.SpotLight;
  public flashlightTarget: THREE.Object3D;
  public flashlightOn: boolean = true;

  // Character body parts for procedural animation
  private head: THREE.Mesh;
  private torso: THREE.Mesh;
  private leftArm: THREE.Mesh;
  private rightArm: THREE.Mesh;
  private leftLeg: THREE.Mesh;
  private rightLeg: THREE.Mesh;
  private weaponMeshGroup: THREE.Group;

  // Procedural weapon meshes
  private pistolMesh: THREE.Group;
  private shotgunMesh: THREE.Group;
  private rifleMesh: THREE.Group;

  // Animation state
  private animTimer: number = 0;

  constructor(isLocal = true, customColor = 0x3b82f6) {
    this.group = new THREE.Group();

    this.stats = {
      health: 100,
      maxHealth: 100,
      stamina: 100,
      maxStamina: 100,
      isSprinting: false,
      isAiming: false,
      isDowned: false,
      bleedoutTimer: 35,
      reviveProgress: 0,
      score: 0,
      kills: 0,
      revivesDone: 0,
      damageDealt: 0,
      damageReceived: 0,
    };

    // --- 1. Humanoid Mesh Assembly ---
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xe0a98b });
    const jacketMat = new THREE.MeshLambertMaterial({ color: customColor });
    const pantsMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    const bootsMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });

    // Torso (0.6w, 0.75h, 0.35d)
    const torsoGeo = new THREE.BoxGeometry(0.65, 0.75, 0.38);
    this.torso = new THREE.Mesh(torsoGeo, jacketMat);
    this.torso.position.y = 1.15;
    this.torso.castShadow = true;
    this.group.add(this.torso);

    // Head (0.35 cube)
    const headGeo = new THREE.BoxGeometry(0.35, 0.38, 0.35);
    this.head = new THREE.Mesh(headGeo, skinMat);
    this.head.position.set(0, 0.58, 0.05);
    this.head.castShadow = true;
    this.torso.add(this.head);

    // Tactical cap/hair
    const capGeo = new THREE.BoxGeometry(0.37, 0.12, 0.42);
    const capMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.set(0, 0.18, 0.02);
    this.head.add(cap);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.18, 0.65, 0.18);
    this.leftArm = new THREE.Mesh(armGeo, jacketMat);
    this.leftArm.position.set(-0.45, 0.05, 0);
    this.leftArm.castShadow = true;
    this.torso.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, jacketMat);
    this.rightArm.position.set(0.45, 0.05, 0);
    this.rightArm.castShadow = true;
    this.torso.add(this.rightArm);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.22, 0.75, 0.22);
    this.leftLeg = new THREE.Mesh(legGeo, pantsMat);
    this.leftLeg.position.set(-0.18, 0.42, 0);
    this.leftLeg.castShadow = true;
    this.group.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, pantsMat);
    this.rightLeg.position.set(0.18, 0.42, 0);
    this.rightLeg.castShadow = true;
    this.group.add(this.rightLeg);

    // Boots
    const bootGeo = new THREE.BoxGeometry(0.24, 0.18, 0.32);
    const b1 = new THREE.Mesh(bootGeo, bootsMat);
    b1.position.set(0, -0.32, 0.04);
    this.leftLeg.add(b1);
    const b2 = new THREE.Mesh(bootGeo, bootsMat);
    b2.position.set(0, -0.32, 0.04);
    this.rightLeg.add(b2);

    // --- 2. Tactical Flashlight ---
    this.flashlightTarget = new THREE.Object3D();
    this.flashlightTarget.position.set(0, 1.2, 20);
    this.group.add(this.flashlightTarget);

    this.flashlight = new THREE.SpotLight(0xfef9c3, 2.5, 38, Math.PI / 6, 0.45, 1.2);
    this.flashlight.position.set(0.25, 1.3, 0.25);
    this.flashlight.target = this.flashlightTarget;
    this.flashlight.castShadow = isLocal;
    this.group.add(this.flashlight);

    // --- 3. Weapon Attachments ---
    this.weaponMeshGroup = new THREE.Group();
    this.weaponMeshGroup.position.set(0.25, 0.1, 0.35);
    this.torso.add(this.weaponMeshGroup);

    this.pistolMesh = this.buildPistolModel();
    this.shotgunMesh = this.buildShotgunModel();
    this.rifleMesh = this.buildRifleModel();

    this.weaponMeshGroup.add(this.pistolMesh);
    this.weaponMeshGroup.add(this.shotgunMesh);
    this.weaponMeshGroup.add(this.rifleMesh);

    this.setWeaponVisual('pistol');
  }

  private buildPistolModel(): THREE.Group {
    const group = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: 0x18181b });
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.08), mat);
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.22), mat);
    barrel.position.set(0, 0.08, 0.06);
    group.add(grip, barrel);
    return group;
  }

  private buildShotgunModel(): THREE.Group {
    const group = new THREE.Group();
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x543821 });
    const metalMat = new THREE.MeshLambertMaterial({ color: 0x27272a });

    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.12, 0.25), woodMat);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.65, 8), metalMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.05, 0.32);
    group.add(stock, barrel);
    return group;
  }

  private buildRifleModel(): THREE.Group {
    const group = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: 0x1c1917 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.12, 0.55), mat);
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.09), mat);
    mag.position.set(0, -0.1, 0.05);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.35, 6), mat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.03, 0.38);
    group.add(body, mag, barrel);
    return group;
  }

  public setWeaponVisual(weapon: WeaponType) {
    this.pistolMesh.visible = weapon === 'pistol';
    this.shotgunMesh.visible = weapon === 'shotgun';
    this.rifleMesh.visible = weapon === 'rifle';
  }

  public toggleFlashlight(): boolean {
    this.flashlightOn = !this.flashlightOn;
    this.flashlight.intensity = this.flashlightOn ? 2.5 : 0;
    return this.flashlightOn;
  }

  public applyDamage(dmg: number) {
    if (this.stats.isDowned || this.stats.health <= 0) return;

    this.stats.health = Math.max(0, this.stats.health - dmg);
    this.stats.damageReceived += dmg;

    if (this.stats.health === 0) {
      this.enterDownedState();
    }
  }

  public enterDownedState() {
    this.stats.isDowned = true;
    this.stats.isSprinting = false;
    this.stats.bleedoutTimer = 35;
    this.stats.reviveProgress = 0;

    // Downed crawling posture
    this.torso.rotation.x = Math.PI / 3;
    this.torso.position.y = 0.5;
    this.leftLeg.position.y = 0.2;
    this.rightLeg.position.y = 0.2;
    this.leftLeg.rotation.x = Math.PI / 4;
    this.rightLeg.rotation.x = Math.PI / 4;
  }

  public revive() {
    this.stats.isDowned = false;
    this.stats.health = 50; // revive with 50% HP
    this.stats.reviveProgress = 0;

    // Stand back up
    this.torso.rotation.x = 0;
    this.torso.position.y = 1.15;
    this.leftLeg.position.set(-0.18, 0.42, 0);
    this.rightLeg.position.set(0.18, 0.42, 0);
    this.leftLeg.rotation.x = 0;
    this.rightLeg.rotation.x = 0;
  }

  public update(delta: number, velocity: THREE.Vector3, isAiming: boolean, isSprinting: boolean) {
    // Stamina drain and regeneration
    if (isSprinting && velocity.lengthSq() > 0.1 && !this.stats.isDowned) {
      this.stats.stamina = Math.max(0, this.stats.stamina - delta * 22);
      if (this.stats.stamina === 0) {
        this.stats.isSprinting = false;
      } else {
        this.stats.isSprinting = true;
      }
    } else {
      this.stats.isSprinting = false;
      this.stats.stamina = Math.min(this.stats.maxStamina, this.stats.stamina + delta * 18);
    }

    this.stats.isAiming = isAiming;

    // Downed Bleedout Timer
    if (this.stats.isDowned) {
      this.stats.bleedoutTimer -= delta;
      return;
    }

    // Procedural walk / run animation
    const speed = velocity.length();
    if (speed > 0.2) {
      const animSpeed = isSprinting ? 12 : 7;
      this.animTimer += delta * animSpeed;

      const legSwing = Math.sin(this.animTimer) * (isSprinting ? 0.85 : 0.45);
      this.leftLeg.rotation.x = legSwing;
      this.rightLeg.rotation.x = -legSwing;

      if (!isAiming) {
        this.leftArm.rotation.x = -legSwing * 0.6;
        this.rightArm.rotation.x = legSwing * 0.6;
      }
    } else {
      // Idle breathing
      this.animTimer += delta * 2;
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.torso.position.y = 1.15 + Math.sin(this.animTimer) * 0.015;
    }

    // Aiming arm posture (point gun forward)
    if (isAiming) {
      this.rightArm.rotation.x = -Math.PI / 2 + 0.1;
      this.leftArm.rotation.x = -Math.PI / 2.2;
      this.leftArm.rotation.y = 0.3;
    }
  }
}
