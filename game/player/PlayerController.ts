import * as THREE from 'three';
import { Player } from './Player';
import { InputManager } from '../core/InputManager';
import { ThirdPersonCamera } from '../camera/ThirdPersonCamera';
import { VehicleManager } from '../vehicles/VehicleManager';
import { WeaponManager } from '../combat/Weapon';
import { Damageable } from '../combat/DamageSystem';
import { World } from '../world/World';
import { EventBus } from '../core/EventBus';

export class PlayerController {
  private player: Player;
  private input: InputManager;
  private camera: ThirdPersonCamera;
  private vehicleManager: VehicleManager;
  private weaponManager: WeaponManager;
  private world: World;
  private eventBus: EventBus;

  constructor(
    player: Player,
    input: InputManager,
    camera: ThirdPersonCamera,
    vehicleManager: VehicleManager,
    weaponManager: WeaponManager,
    world: World
  ) {
    this.player = player;
    this.input = input;
    this.camera = camera;
    this.vehicleManager = vehicleManager;
    this.weaponManager = weaponManager;
    this.world = world;
    this.eventBus = EventBus.getInstance();
  }

  public update(deltaTime: number, potentialTargets: Damageable[]): void {
    if (this.player.isDead) return;

    // Check weapon switching (Keys 1, 2, 3)
    if (this.input.wasJustPressed('Digit1')) this.weaponManager.switchWeapon(0);
    if (this.input.wasJustPressed('Digit2')) this.weaponManager.switchWeapon(1);
    if (this.input.wasJustPressed('Digit3')) this.weaponManager.switchWeapon(2);

    if (this.player.state === 'driving' && this.player.currentVehicle) {
      this.updateDrivingMode(deltaTime);
    } else {
      this.updateOnFootMode(deltaTime, potentialTargets);
    }
  }

  private updateOnFootMode(deltaTime: number, potentialTargets: Damageable[]): void {
    // 1. Check Enter Vehicle Interaction (Press F)
    const nearestVehicle = this.vehicleManager.findNearestVehicle(this.player.position, 3.8);

    if (nearestVehicle) {
      this.eventBus.emit('INTERACTION_PROMPT', {
        text: `Press [F] to enter ${nearestVehicle.config.name}`,
        visible: true,
      });

      if (this.input.isInteractingF()) {
        this.player.enterVehicle(nearestVehicle);
        this.camera.setMode('vehicle', nearestVehicle.heading);
        this.eventBus.emit('INTERACTION_PROMPT', { visible: false });
        return;
      }
    } else {
      this.eventBus.emit('INTERACTION_PROMPT', { visible: false });
    }

    // 2. Camera Mode (Aim vs Normal)
    const isAiming = this.input.isAiming();
    this.camera.setMode(isAiming ? 'aim' : 'on_foot');

    // 3. Movement Direction Relative to Camera Forward Vector
    const fwdAxis = this.input.getForwardAxis();
    const rightAxis = this.input.getRightAxis();

    const camForward = this.camera.getForwardVector();
    const camRight = this.camera.getRightVector();

    const moveDir = new THREE.Vector3()
      .addScaledVector(camForward, fwdAxis)
      .addScaledVector(camRight, rightAxis);

    const hasInput = moveDir.lengthSq() > 0.01;
    if (hasInput) {
      moveDir.normalize();
    }

    // Determine target speed (sprint vs walk)
    const isSprinting = this.input.isSprinting() && !isAiming && fwdAxis > 0;
    const moveSpeed = isSprinting ? 9.2 : 4.6;

    const isShooting = this.input.isShooting();
    const lockFacing = isAiming || isShooting;

    if (hasInput) {
      this.player.velocity.x = moveDir.x * moveSpeed;
      this.player.velocity.z = moveDir.z * moveSpeed;

      // Face direction of movement or face camera aim/fire direction (GTA V style)
      if (lockFacing) {
        this.player.facingAngle = this.camera.yaw + Math.PI;
      } else {
        const targetAngle = Math.atan2(moveDir.x, moveDir.z);
        // Smooth rotation
        const diff = targetAngle - this.player.facingAngle;
        const normalizedDiff = Math.atan2(Math.sin(diff), Math.cos(diff));
        this.player.facingAngle += normalizedDiff * Math.min(1, 14 * deltaTime);
      }
      this.player.state = isSprinting ? 'run' : 'walk';
    } else {
      // Decelerate
      this.player.velocity.x = 0;
      this.player.velocity.z = 0;
      if (lockFacing) {
        this.player.facingAngle = this.camera.yaw + Math.PI;
      }
      this.player.state = 'idle';
    }

    // 4. Jump
    if (this.input.isJumping() && this.player.isGrounded) {
      this.player.velocity.y = 8.5;
      this.player.isGrounded = false;
      this.player.state = 'jump';
      this.player.triggerJump();
    }

    // 5. Reload (Press R)
    if (this.input.isReloading()) {
      this.weaponManager.reload();
    }

    // 6. Shooting / Fire Weapon (Left Click)
    if (this.input.isShooting()) {
      // Fire from character chest towards center of screen/camera crosshair
      const shootOrigin = this.player.position.clone().add(new THREE.Vector3(0, 1.4, 0));
      const shootDir = new THREE.Vector3();
      this.camera.camera.getWorldDirection(shootDir);

      this.weaponManager.shoot(shootOrigin, shootDir, potentialTargets, (orig, dir, maxD) => {
        const rayHit = this.world.raycastObstacle(orig, dir, maxD);
        return {
          hit: rayHit.hit,
          distance: rayHit.distance,
          point: rayHit.point,
        };
      });
    }

    // Update player physical movement
    this.player.update(deltaTime);
  }

  private updateDrivingMode(deltaTime: number): void {
    const vehicle = this.player.currentVehicle!;

    // 1. Check Exit Vehicle Interaction (Press F)
    this.eventBus.emit('INTERACTION_PROMPT', {
      text: 'Press [F] to exit vehicle',
      visible: true,
    });

    if (this.input.isInteractingF()) {
      this.player.exitVehicle();
      this.camera.setMode('on_foot');
      this.eventBus.emit('INTERACTION_PROMPT', { visible: false });
      return;
    }

    // 2. Throttle & Steering Controls
    const throttle = this.input.getForwardAxis();
    const steer = -this.input.getRightAxis(); // A/D
    const handbrake = this.input.isDown('Space');

    // Car horn (H or E)
    if (this.input.wasJustPressed('KeyH') || this.input.wasJustPressed('KeyE')) {
      // Horn sound
    }

    vehicle.update(deltaTime, throttle, steer, handbrake);

    // Sync player position to car position and keep mesh invisible
    this.player.position.copy(vehicle.position);
    this.player.mesh.position.copy(vehicle.position);
    this.player.mesh.visible = false;
    this.player.emitStats();
  }
}
