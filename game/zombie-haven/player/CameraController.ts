/**
 * Zombie Haven - Third Person Tactical Camera Controller
 * Smooth over-the-shoulder orbital camera, right-click ADS zoom,
 * wall obstacle collision prevention, and weapon recoil shake.
 */

import * as THREE from 'three';
import { DeadwoodVillage } from '../world/DeadwoodVillage';

export class CameraController {
  public camera: THREE.PerspectiveCamera;
  public yaw: number = 0;
  public pitch: number = 0.15; // slight downward look
  public mouseSensitivity: number = 0.0022;

  private currentDistance: number = 4.2;
  private currentHeight: number = 2.4;
  private currentShoulderOffset: number = 0.65;
  private targetFOV: number = 65;

  private trauma: number = 0; // for camera screen shake

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 800);
    this.camera.position.set(0, 3, 5);
  }

  public handleMouseMove(deltaX: number, deltaY: number) {
    this.yaw -= deltaX * this.mouseSensitivity;
    this.pitch -= deltaY * this.mouseSensitivity;

    // Clamp pitch between -1.0 (-57 deg) and 1.2 (+68 deg)
    this.pitch = Math.max(-1.0, Math.min(1.2, this.pitch));
  }

  public addShake(amount = 0.3) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  public update(
    delta: number,
    targetPos: THREE.Vector3,
    isAiming: boolean,
    village: DeadwoodVillage,
    recoilKick = 0
  ) {
    // 1. ADS Zoom lerping
    const targetDist = isAiming ? 2.3 : 4.0;
    const targetH = isAiming ? 2.0 : 2.4;
    const targetOffset = isAiming ? 0.75 : 0.65;
    this.targetFOV = isAiming ? 50 : 65;

    this.currentDistance = THREE.MathUtils.lerp(this.currentDistance, targetDist, delta * 12);
    this.currentHeight = THREE.MathUtils.lerp(this.currentHeight, targetH, delta * 12);
    this.currentShoulderOffset = THREE.MathUtils.lerp(this.currentShoulderOffset, targetOffset, delta * 12);

    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, this.targetFOV, delta * 10);
    this.camera.updateProjectionMatrix();

    // 2. Camera target pivot point (Survivor shoulder/head level)
    const pivot = targetPos.clone().add(new THREE.Vector3(0, 1.45, 0));

    // Calculate rotation matrix from yaw and pitch (plus recoil kick)
    const effPitch = this.pitch + recoilKick;
    const cosPitch = Math.cos(effPitch);
    const sinPitch = Math.sin(effPitch);
    const sinYaw = Math.sin(this.yaw);
    const cosYaw = Math.cos(this.yaw);

    // Forward vector (direction player/camera is looking)
    const forward = new THREE.Vector3(-sinYaw * cosPitch, sinPitch, -cosYaw * cosPitch).normalize();
    // Right vector (for shoulder offset)
    const right = new THREE.Vector3(cosYaw, 0, -sinYaw).normalize();

    // Ideal camera position behind player with shoulder offset
    let desiredCamPos = pivot
      .clone()
      .addScaledVector(right, this.currentShoulderOffset)
      .addScaledVector(forward, -this.currentDistance)
      .add(new THREE.Vector3(0, this.currentHeight - 1.45, 0));

    // 3. Obstacle Collision Prevention (Raycast from pivot to camera)
    const rayDir = desiredCamPos.clone().sub(pivot).normalize();
    const rayDist = desiredCamPos.distanceTo(pivot);

    // Step along ray to find any collision with buildings or rocks
    const stepCount = 8;
    for (let i = 1; i <= stepCount; i++) {
      const testDist = (rayDist * i) / stepCount;
      const testPoint = pivot.clone().addScaledVector(rayDir, testDist);
      if (village.checkCollision(testPoint.x, testPoint.z, 0.35)) {
        // Collided! Pull camera closer to pivot
        desiredCamPos = pivot.clone().addScaledVector(rayDir, Math.max(0.8, testDist - 0.3));
        break;
      }
    }

    // 4. Camera Trauma / Recoil Shake
    if (this.trauma > 0) {
      const shakeX = (Math.random() - 0.5) * this.trauma * 0.12;
      const shakeY = (Math.random() - 0.5) * this.trauma * 0.12;
      desiredCamPos.x += shakeX;
      desiredCamPos.y += shakeY;
      this.trauma = Math.max(0, this.trauma - delta * 2.5);
    }

    // Apply smoothed position and orientation
    this.camera.position.lerp(desiredCamPos, Math.min(1, delta * 35));
    // Look at point slightly in front of player plus shoulder focus
    const lookTarget = pivot.clone().addScaledVector(forward, 25);
    this.camera.lookAt(lookTarget);
  }

  /**
   * Returns forward vector in world space for hitscan raycasting
   */
  public getForwardVector(): THREE.Vector3 {
    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);
    const sinYaw = Math.sin(this.yaw);
    const cosYaw = Math.cos(this.yaw);
    return new THREE.Vector3(-sinYaw * cosPitch, sinPitch, -cosYaw * cosPitch).normalize();
  }
}
