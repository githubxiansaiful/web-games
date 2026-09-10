/**
 * Zombie Haven - Player Controller
 * Handles keyboard WASD, mouse look, shooting, weapon switching, and physical collision resolution.
 */

import * as THREE from 'three';
import { SurvivorPlayer } from './SurvivorPlayer';
import { CameraController } from './CameraController';
import { WeaponSystem } from '../weapons/WeaponSystem';
import { DeadwoodVillage } from '../world/DeadwoodVillage';
import { PLAYER_MOVEMENT_CONFIG } from '../types';

export class PlayerController {
  private player: SurvivorPlayer;
  private cameraCtrl: CameraController;
  private weapons: WeaponSystem;
  private village: DeadwoodVillage;
  private domElement: HTMLElement;

  // Key states
  public keys: Record<string, boolean> = {};
  public isMouseDown: boolean = false;
  public isRightMouseDown: boolean = false;
  public isPointerLocked: boolean = false;

  // Movement physics
  public velocity: THREE.Vector3 = new THREE.Vector3();
  private verticalVelocity: number = 0;
  private isGrounded: boolean = true;

  // Callback listeners
  public onShootRequest?: () => void;
  public onInteractRequest?: () => void;

  constructor(
    player: SurvivorPlayer,
    cameraCtrl: CameraController,
    weapons: WeaponSystem,
    village: DeadwoodVillage,
    domElement: HTMLElement
  ) {
    this.player = player;
    this.cameraCtrl = cameraCtrl;
    this.weapons = weapons;
    this.village = village;
    this.domElement = domElement;

    this.setupListeners();
  }

  private setupListeners() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('wheel', this.handleWheel, { passive: true });

    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
  }

  public requestPointerLock() {
    if (!this.isPointerLocked && this.domElement) {
      this.domElement.requestPointerLock();
    }
  }

  private handlePointerLockChange = () => {
    this.isPointerLocked = document.pointerLockElement === this.domElement;
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;

    // Weapon switching: 1, 2, 3
    if (e.code === 'Digit1' || e.code === 'KeyQ') {
      this.weapons.switchWeapon('pistol');
      this.player.setWeaponVisual('pistol');
    } else if (e.code === 'Digit2') {
      this.weapons.switchWeapon('shotgun');
      this.player.setWeaponVisual('shotgun');
    } else if (e.code === 'Digit3') {
      this.weapons.switchWeapon('rifle');
      this.player.setWeaponVisual('rifle');
    }

    // Reload: R
    if (e.code === 'KeyR') {
      this.weapons.startReload();
      this.player.playReload();
    }

    // Flashlight toggle: F
    if (e.code === 'KeyF') {
      this.player.toggleFlashlight();
    }

    // Interact / Revive: E
    if (e.code === 'KeyE') {
      if (this.onInteractRequest) {
        this.onInteractRequest();
      }
    }

    // Cycle Survivor Skin: K
    if (e.code === 'KeyK') {
      this.player.cycleNextSkin();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (!this.isPointerLocked) {
      this.requestPointerLock();
      return;
    }

    if (e.button === 0) {
      this.isMouseDown = true;
      this.player.playShoot();
      if (this.onShootRequest) {
        this.onShootRequest();
      }
    } else if (e.button === 2) {
      this.isRightMouseDown = true;
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      this.isMouseDown = false;
    } else if (e.button === 2) {
      this.isRightMouseDown = false;
    }
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isPointerLocked) return;
    this.cameraCtrl.handleMouseMove(e.movementX, e.movementY);
  };

  private handleWheel = (e: WheelEvent) => {
    // Quick weapon switch with mouse wheel
    const order: ('pistol' | 'shotgun' | 'rifle')[] = ['pistol', 'shotgun', 'rifle'];
    const curIdx = order.indexOf(this.weapons.activeWeapon);
    if (e.deltaY > 0) {
      const next = order[(curIdx + 1) % order.length];
      this.weapons.switchWeapon(next);
      this.player.setWeaponVisual(next);
    } else if (e.deltaY < 0) {
      const prev = order[(curIdx - 1 + order.length) % order.length];
      this.weapons.switchWeapon(prev);
      this.player.setWeaponVisual(prev);
    }
  };

  public update(delta: number) {
    if (this.player.stats.isDowned) {
      this.velocity.set(0, 0, 0);
      return;
    }

    // Direct continuous shoot on left mouse down (respecting fire rate, like PUBG Mobile)
    if (this.isMouseDown && this.onShootRequest) {
      this.onShootRequest();
    }

    // Determine movement direction relative to camera yaw
    const forward = (this.keys['KeyW'] || this.keys['ArrowUp'] ? 1 : 0) -
                    (this.keys['KeyS'] || this.keys['ArrowDown'] ? 1 : 0);
    const strafe = (this.keys['KeyD'] || this.keys['ArrowRight'] ? 1 : 0) -
                   (this.keys['KeyA'] || this.keys['ArrowLeft'] ? 1 : 0);

    const isMoving = forward !== 0 || strafe !== 0;
    const isSprintKey = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
    const canSprint = isSprintKey && forward > 0 && this.player.stats.stamina > 5;

    // Movement speed from shared config (Spec Section 11)
    let baseSpeed = PLAYER_MOVEMENT_CONFIG.runSpeed; // 4.5 m/s
    if (canSprint) {
      baseSpeed = PLAYER_MOVEMENT_CONFIG.sprintSpeed; // 6.0 m/s
    } else if (this.isMouseDown) {
      baseSpeed = PLAYER_MOVEMENT_CONFIG.aimSpeed; // 2.8 m/s
    } else if (forward < 0) {
      baseSpeed = PLAYER_MOVEMENT_CONFIG.walkSpeed; // 3.0 m/s
    }

    // Calculate move vector in world space
    const yaw = this.cameraCtrl.yaw;
    const sinYaw = Math.sin(yaw);
    const cosYaw = Math.cos(yaw);

    const moveX = (strafe * cosYaw - forward * sinYaw);
    const moveZ = (-strafe * sinYaw - forward * cosYaw);

    const moveDir = new THREE.Vector2(moveX, moveZ);
    if (moveDir.lengthSq() > 0.001) {
      moveDir.normalize();
    }

    const targetVx = moveDir.x * (isMoving ? baseSpeed : 0);
    const targetVz = moveDir.y * (isMoving ? baseSpeed : 0);

    // Smooth velocity acceleration
    const accel = isMoving ? 16 : 22;
    this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, targetVx, delta * accel);
    this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, targetVz, delta * accel);

    // Jump / Gravity
    if (this.keys['Space'] && this.isGrounded && this.player.stats.stamina >= 10) {
      this.verticalVelocity = 5.8;
      this.isGrounded = false;
      this.player.stats.stamina -= 10;
      this.player.playJump();
    }

    if (!this.isGrounded) {
      this.verticalVelocity -= 16.0 * delta; // gravity
      this.player.group.position.y += this.verticalVelocity * delta;
      if (this.player.group.position.y <= 0) {
        this.player.group.position.y = 0;
        this.verticalVelocity = 0;
        this.isGrounded = true;
      }
    } else {
      this.player.group.position.y = 0;
    }

    // Collision detection & smooth sliding resolution (Spec Section 35 & 36)
    const currentPos = this.player.group.position;
    const targetX = currentPos.x + this.velocity.x * delta;
    const targetZ = currentPos.z + this.velocity.z * delta;

    const resolved = this.village.resolveCollision(targetX, targetZ, PLAYER_MOVEMENT_CONFIG.colliderRadius);
    currentPos.x = resolved.x;
    currentPos.z = resolved.z;
    if (this.isGrounded) {
      currentPos.y = 0;
    }

    // Player facing direction (GTA 5 / PUBG Third Person):
    // When firing: character snaps to camera yaw to shoot straight into crosshair
    // When running: character smoothly turns toward movement direction (W = straight forward into distance)
    // When idle: character smoothly aligns with camera yaw with back towards camera
    if (this.isMouseDown) {
      this.player.group.rotation.y = THREE.MathUtils.lerp(this.player.group.rotation.y, yaw, delta * 30);
    } else if (isMoving && this.velocity.lengthSq() > 0.05) {
      // Model naturally faces -Z, so target angle for velocity (vx, vz) is Math.atan2(-vx, -vz)
      const moveAngle = Math.atan2(-this.velocity.x, -this.velocity.z);
      let diff = (moveAngle - this.player.group.rotation.y) % (Math.PI * 2);
      if (diff < -Math.PI) diff += Math.PI * 2;
      if (diff > Math.PI) diff -= Math.PI * 2;
      this.player.group.rotation.y += diff * Math.min(1, delta * 18);
    } else {
      let diff = (yaw - this.player.group.rotation.y) % (Math.PI * 2);
      if (diff < -Math.PI) diff += Math.PI * 2;
      if (diff > Math.PI) diff -= Math.PI * 2;
      this.player.group.rotation.y += diff * Math.min(1, delta * 22);
    }

    // Flashlight target follows forward camera ray
    const camFwd = this.cameraCtrl.getForwardVector();
    this.player.flashlightTarget.position.copy(camFwd).multiplyScalar(30);

    // Update Player character animation
    this.player.update(delta, this.velocity, this.isMouseDown, canSprint, this.isGrounded);
  }

  public dispose() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('wheel', this.handleWheel);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
  }
}
