/**
 * Zombie Haven - Third Person Tactical Camera Controller
 * Smooth over-the-shoulder orbital camera, right-click ADS zoom,
 * damped building collision avoidance, and weapon recoil shake.
 */

import * as THREE from 'three';
import { DeadwoodVillage } from '../world/DeadwoodVillage';
import { CAMERA_CONFIG } from '../types';

export class CameraController {
  public camera: THREE.PerspectiveCamera;
  public yaw: number = 0;
  public pitch: number = 0.12; // slight natural downward angle
  public mouseSensitivity: number = 0.0022;

  private currentDistance: number = CAMERA_CONFIG.defaultDistance; // 5.0m
  private currentHeight: number = CAMERA_CONFIG.defaultHeight;     // 2.8m
  private currentShoulderOffset: number = 0.55;
  private targetFOV: number = CAMERA_CONFIG.defaultFOV;            // 60 deg

  private boomDistanceFactor: number = 1.0;
  private smoothedCamPos: THREE.Vector3 = new THREE.Vector3(0, 2.8, 19);
  private smoothedLookTarget: THREE.Vector3 = new THREE.Vector3(0, 1.4, 0);

  private trauma: number = 0; // for camera screen shake

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(CAMERA_CONFIG.defaultFOV, aspect, 0.1, 800);
    this.camera.position.set(0, 2.8, 19);
    this.smoothedCamPos.copy(this.camera.position);
  }

  public handleMouseMove(deltaX: number, deltaY: number) {
    // Clamp mouse delta to prevent sudden spikes / jerks
    const clampedX = Math.max(-80, Math.min(80, deltaX));
    const clampedY = Math.max(-80, Math.min(80, deltaY));

    this.yaw -= clampedX * this.mouseSensitivity;
    this.pitch -= clampedY * this.mouseSensitivity;

    // Clamp pitch between -1.0 (-57 deg) and 1.2 (+68 deg)
    this.pitch = Math.max(-1.0, Math.min(1.2, this.pitch));
  }

  public addShake(amount = 0.22) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  public update(
    delta: number,
    targetPos: THREE.Vector3,
    isAiming: boolean,
    village: DeadwoodVillage,
    recoilKick = 0
  ) {
    // 1. Third Person & Right-Shoulder ADS Zoom lerping (Spec Section 20 & 23)
    const targetDist = isAiming ? CAMERA_CONFIG.aimDistance : CAMERA_CONFIG.defaultDistance; // 3.5m vs 5.0m
    const targetH = isAiming ? CAMERA_CONFIG.aimHeight : CAMERA_CONFIG.defaultHeight;         // 2.2m vs 2.8m
    const targetOffset = isAiming ? CAMERA_CONFIG.shoulderOffset : 0.55;                      // 0.75m vs 0.55m
    this.targetFOV = isAiming ? CAMERA_CONFIG.aimFOV : CAMERA_CONFIG.defaultFOV;              // 55 deg vs 60 deg

    this.currentDistance = THREE.MathUtils.lerp(this.currentDistance, targetDist, delta * 10);
    this.currentHeight = THREE.MathUtils.lerp(this.currentHeight, targetH, delta * 10);
    this.currentShoulderOffset = THREE.MathUtils.lerp(this.currentShoulderOffset, targetOffset, delta * 10);

    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, this.targetFOV, delta * 10);
    this.camera.updateProjectionMatrix();

    // 2. Camera target pivot point (Survivor chest/eye level: y = 1.40m)
    const pivot = targetPos.clone().add(new THREE.Vector3(0, CAMERA_CONFIG.targetHeight, 0));

    // Calculate rotation vectors from yaw and pitch (plus recoil kick)
    const effPitch = this.pitch + recoilKick;
    const cosPitch = Math.cos(effPitch);
    const sinPitch = Math.sin(effPitch);
    const sinYaw = Math.sin(this.yaw);
    const cosYaw = Math.cos(this.yaw);

    // Forward vector (direction player/camera is looking)
    const forward = new THREE.Vector3(-sinYaw * cosPitch, sinPitch, -cosYaw * cosPitch).normalize();
    // Right vector (for shoulder offset)
    const right = new THREE.Vector3(cosYaw, 0, -sinYaw).normalize();

    // Desired full-boom camera position
    const fullCamPos = pivot
      .clone()
      .addScaledVector(right, this.currentShoulderOffset)
      .addScaledVector(forward, -this.currentDistance)
      .add(new THREE.Vector3(0, this.currentHeight - 1.40, 0));

    // 3. Smooth Building Collision Avoidance (Damped boom without snap jitter)
    const rayVec = fullCamPos.clone().sub(pivot);
    const rayDist = rayVec.length();
    const rayDir = rayVec.clone().normalize();

    let targetFactor = 1.0;
    const stepCount = 10;
    for (let i = 1; i <= stepCount; i++) {
      const testDist = (rayDist * i) / stepCount;
      const testPoint = pivot.clone().addScaledVector(rayDir, testDist);
      if (village.checkCameraObstacle(testPoint.x, testPoint.y, testPoint.z, 0.35)) {
        targetFactor = Math.max(0.25, (testDist - 0.3) / rayDist);
        break;
      }
    }

    // Smoothly damp boom distance (fast retract, smooth ease back)
    if (targetFactor < this.boomDistanceFactor) {
      this.boomDistanceFactor = THREE.MathUtils.lerp(this.boomDistanceFactor, targetFactor, delta * 16);
    } else {
      this.boomDistanceFactor = THREE.MathUtils.lerp(this.boomDistanceFactor, targetFactor, delta * 6);
    }

    let finalCamPos = pivot.clone().addScaledVector(rayDir, rayDist * this.boomDistanceFactor);

    // 4. Subtle Trauma / Recoil Shake
    if (this.trauma > 0) {
      const shakeX = (Math.random() - 0.5) * this.trauma * 0.08;
      const shakeY = (Math.random() - 0.5) * this.trauma * 0.08;
      finalCamPos.x += shakeX;
      finalCamPos.y += shakeY;
      this.trauma = Math.max(0, this.trauma - delta * 3.0);
    }

    // 5. Smooth Camera Movement & Look Target to eliminate micro-jitter
    this.smoothedCamPos.lerp(finalCamPos, Math.min(1, delta * 24));
    this.camera.position.copy(this.smoothedCamPos);

    const targetLook = pivot.clone().addScaledVector(forward, 25);
    this.smoothedLookTarget.lerp(targetLook, Math.min(1, delta * 24));
    this.camera.lookAt(this.smoothedLookTarget);
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
