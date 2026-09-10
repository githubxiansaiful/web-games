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

    // Clamp pitch: max -0.95 (looking down from above) and min 0.35 (looking slightly up)
    // Prevents camera from ever sinking beneath the terrain or under the feet
    this.pitch = Math.max(-0.95, Math.min(0.35, this.pitch));
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
    // 1. Steady GTA 5 / PUBG Third-Person Camera (No jarring right-click zoom, rock-steady 65 deg FOV)
    const targetDist = 4.0;
    const targetH = 2.0;
    const targetOffset = 0.48;
    this.targetFOV = 65;

    this.currentDistance = THREE.MathUtils.lerp(this.currentDistance, targetDist, delta * 12);
    this.currentHeight = THREE.MathUtils.lerp(this.currentHeight, targetH, delta * 12);
    this.currentShoulderOffset = THREE.MathUtils.lerp(this.currentShoulderOffset, targetOffset, delta * 12);

    this.camera.fov = this.targetFOV;
    this.camera.updateProjectionMatrix();

    // 2. Camera target pivot point (Survivor chest level: y = 1.30m)
    const pivot = targetPos.clone().add(new THREE.Vector3(0, 1.30, 0));

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

    // Strictly enforce ground clearance (camera never dips below floor or under feet)
    finalCamPos.y = Math.max(0.40, finalCamPos.y);

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
    this.smoothedCamPos.y = Math.max(0.40, this.smoothedCamPos.y);
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

  /**
   * Returns right vector perpendicular to view in horizontal plane
   */
  public getRightVector(): THREE.Vector3 {
    const sinYaw = Math.sin(this.yaw);
    const cosYaw = Math.cos(this.yaw);
    return new THREE.Vector3(cosYaw, 0, -sinYaw).normalize();
  }
}
