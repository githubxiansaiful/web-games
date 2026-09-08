import * as THREE from 'three';
import { World } from '../world/World';

export type CameraMode = 'on_foot' | 'aim' | 'vehicle';

export class ThirdPersonCamera {
  public camera: THREE.PerspectiveCamera;
  public mode: CameraMode = 'on_foot';

  public yaw: number = 0; // Horizontal orbit angle (radians)
  public pitch: number = 0.25; // Vertical orbit angle (radians)

  public currentPosition: THREE.Vector3 = new THREE.Vector3();
  public currentLookAt: THREE.Vector3 = new THREE.Vector3();

  private targetPosition: THREE.Vector3 = new THREE.Vector3();
  private targetLookAt: THREE.Vector3 = new THREE.Vector3();

  private world: World;
  private sensitivity: number = 0.0022;

  constructor(camera: THREE.PerspectiveCamera, world: World) {
    this.camera = camera;
    this.world = world;
  }

  public setMode(mode: CameraMode): void {
    this.mode = mode;
  }

  public handleMouseMove(deltaX: number, deltaY: number): void {
    this.yaw -= deltaX * this.sensitivity;
    this.pitch -= deltaY * this.sensitivity;

    // Clamp pitch so camera cannot flip upside down
    if (this.mode === 'vehicle') {
      this.pitch = Math.max(-0.1, Math.min(0.85, this.pitch));
    } else if (this.mode === 'aim') {
      this.pitch = Math.max(-0.6, Math.min(1.1, this.pitch));
    } else {
      this.pitch = Math.max(-0.4, Math.min(1.25, this.pitch));
    }
  }

  public update(
    deltaTime: number,
    followPosition: THREE.Vector3,
    facingAngle?: number,
    speed?: number
  ): void {
    // 1. Determine camera offsets based on mode
    let targetDistance = 4.5;
    let targetHeight = 1.9;
    let shoulderOffset = 0.45;
    let targetFov = 65;
    let lerpFactor = 1 - Math.exp(-12 * deltaTime);

    if (this.mode === 'aim') {
      targetDistance = 2.2;
      targetHeight = 1.7;
      shoulderOffset = 0.85;
      targetFov = 48;
      lerpFactor = 1 - Math.exp(-22 * deltaTime);
    } else if (this.mode === 'vehicle') {
      targetDistance = 8.5 + (speed ? Math.min(speed / 6, 4.0) : 0);
      targetHeight = 3.2;
      shoulderOffset = 0.0;
      targetFov = 68;
      lerpFactor = 1 - Math.exp(-8 * deltaTime);

      // In vehicle mode, gently bias yaw towards vehicle facing when moving fast
      if (facingAngle !== undefined && speed && Math.abs(speed) > 5) {
        const diff = facingAngle - this.yaw;
        const normalizedDiff = Math.atan2(Math.sin(diff), Math.cos(diff));
        this.yaw += normalizedDiff * (deltaTime * 1.8);
      }
    }

    // Smooth FOV transitions
    if (Math.abs(this.camera.fov - targetFov) > 0.1) {
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, lerpFactor);
      this.camera.updateProjectionMatrix();
    }

    // 2. Compute LookAt Target point (player head / vehicle center)
    const lookAtOrigin = followPosition.clone();
    lookAtOrigin.y += this.mode === 'vehicle' ? 1.4 : targetHeight * 0.9;

    // 3. Compute Ideal Camera Position in spherical coordinates around target
    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);
    const sinYaw = Math.sin(this.yaw);
    const cosYaw = Math.cos(this.yaw);

    // Vector from target to camera
    const orbitDir = new THREE.Vector3(
      sinYaw * cosPitch,
      sinPitch,
      cosYaw * cosPitch
    ).normalize();

    // Right vector for shoulder offset
    const rightDir = new THREE.Vector3(cosYaw, 0, -sinYaw).normalize();

    let idealCamPos = lookAtOrigin
      .clone()
      .add(orbitDir.clone().multiplyScalar(targetDistance))
      .add(rightDir.clone().multiplyScalar(shoulderOffset));

    // 4. Raycast Camera Collision with Buildings / World
    const rayDir = idealCamPos.clone().sub(lookAtOrigin).normalize();
    const maxRayDist = idealCamPos.distanceTo(lookAtOrigin);
    const hitTest = this.world.raycastObstacle(lookAtOrigin, rayDir, maxRayDist);

    if (hitTest.hit) {
      // Pull camera forward ahead of the obstacle with 0.3m safety margin
      const safeDist = Math.max(0.8, hitTest.distance - 0.3);
      idealCamPos = lookAtOrigin.clone().add(rayDir.multiplyScalar(safeDist));
    }

    // Prevent camera dipping below ground or mountain terrain
    const groundUnderCam = this.world.getGroundHeight(idealCamPos.x, idealCamPos.z);
    if (idealCamPos.y < groundUnderCam + 0.6) {
      idealCamPos.y = groundUnderCam + 0.6;
    }

    // 5. Apply smooth damping
    this.targetPosition.copy(idealCamPos);
    this.targetLookAt.copy(lookAtOrigin);

    if (this.currentPosition.lengthSq() < 0.001) {
      this.currentPosition.copy(this.targetPosition);
      this.currentLookAt.copy(this.targetLookAt);
    } else {
      this.currentPosition.lerp(this.targetPosition, lerpFactor);
      this.currentLookAt.lerp(this.targetLookAt, lerpFactor);
    }

    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentLookAt);
  }

  public getForwardVector(): THREE.Vector3 {
    // Horizontal forward vector of the camera
    return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
  }

  public getRightVector(): THREE.Vector3 {
    // Horizontal right vector of the camera
    return new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();
  }
}
