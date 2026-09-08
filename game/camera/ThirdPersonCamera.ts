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
  private userOrbitTimer: number = 0;

  constructor(camera: THREE.PerspectiveCamera, world: World) {
    this.camera = camera;
    this.world = world;
  }

  public setMode(mode: CameraMode, initialHeading?: number): void {
    this.mode = mode;
    if (mode === 'vehicle') {
      if (initialHeading !== undefined) {
        this.yaw = initialHeading + Math.PI;
      }
      this.pitch = 0.22;
      this.userOrbitTimer = 0;
    }
  }

  public handleMouseMove(deltaX: number, deltaY: number): void {
    this.yaw -= deltaX * this.sensitivity;
    this.pitch -= deltaY * this.sensitivity;

    // In vehicle mode, flag that player is manually orbiting camera
    if (this.mode === 'vehicle') {
      this.userOrbitTimer = 1.2; // 1.2s before auto-re-centering behind vehicle
      this.pitch = Math.max(0.04, Math.min(0.55, this.pitch));
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
    let lerpFactor = 1 - Math.exp(-14 * deltaTime);

    if (this.mode === 'aim') {
      targetDistance = 2.2;
      targetHeight = 1.7;
      shoulderOffset = 0.85;
      targetFov = 48;
      lerpFactor = 1 - Math.exp(-22 * deltaTime);
    } else if (this.mode === 'vehicle') {
      const absSpeed = speed ? Math.abs(speed) : 0;
      // GTA chase camera distance scales with driving velocity
      targetDistance = 6.8 + Math.min(absSpeed / 7, 2.5);
      targetHeight = 2.2 + Math.min(absSpeed / 18, 0.6);
      shoulderOffset = 0.0;
      // Wide FOV sensation at high speed
      targetFov = 66 + Math.min(absSpeed / 3.2, 11);
      lerpFactor = 1 - Math.exp(-10 * deltaTime);

      // Decrement manual orbit timer
      if (this.userOrbitTimer > 0) {
        this.userOrbitTimer -= deltaTime;
      }

      // Auto-center camera behind the vehicle (GTA 5 style)
      if (facingAngle !== undefined) {
        const targetYaw = facingAngle + Math.PI;
        const diff = targetYaw - this.yaw;
        const normalizedDiff = Math.atan2(Math.sin(diff), Math.cos(diff));

        // When user is not manually rotating or when moving at speed, swing behind car
        const autoCenterStrength = this.userOrbitTimer > 0
          ? (absSpeed > 6 ? 2.0 : 0.0)
          : (absSpeed > 1 ? 4.5 : 2.2);

        if (autoCenterStrength > 0) {
          this.yaw += normalizedDiff * Math.min(1, autoCenterStrength * deltaTime);
        }

        // Return pitch smoothly to standard driving vantage (0.22 rad)
        if (this.userOrbitTimer <= 0) {
          this.pitch = THREE.MathUtils.lerp(this.pitch, 0.22, 3.5 * deltaTime);
        }
      }
    }

    // Smooth FOV transitions
    if (Math.abs(this.camera.fov - targetFov) > 0.1) {
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, lerpFactor);
      this.camera.updateProjectionMatrix();
    }

    // 2. Compute LookAt Target point (player head / vehicle forward lookahead)
    const lookAtOrigin = followPosition.clone();
    if (this.mode === 'vehicle') {
      lookAtOrigin.y += 1.2;
      // Look slightly forward ahead over the hood of the vehicle (GTA style)
      if (facingAngle !== undefined) {
        const fwdX = Math.sin(facingAngle) * 2.8;
        const fwdZ = Math.cos(facingAngle) * 2.8;
        lookAtOrigin.x += fwdX;
        lookAtOrigin.z += fwdZ;
      }
    } else {
      lookAtOrigin.y += targetHeight * 0.9;
    }

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
