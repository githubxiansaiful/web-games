import * as THREE from 'three';
import { World } from '../world/World';

export type CameraMode = 'on_foot' | 'aim' | 'vehicle';

export enum CameraViewPreset {
  CLOSE = 0,
  MEDIUM = 1, // Standard GTA V default
  FAR = 2,
}

export class ThirdPersonCamera {
  public camera: THREE.PerspectiveCamera;
  public mode: CameraMode = 'on_foot';

  // Base spherical orbit coordinates
  public yaw: number = 0; // Horizontal orbit angle (radians)
  public pitch: number = 0.13; // Vertical orbit angle (radians) - GTA V eye-level slight downward tilt

  public currentPosition: THREE.Vector3 = new THREE.Vector3();
  public currentLookAt: THREE.Vector3 = new THREE.Vector3();

  private targetPosition: THREE.Vector3 = new THREE.Vector3();
  private targetLookAt: THREE.Vector3 = new THREE.Vector3();

  private world: World;
  private sensitivity: number = 0.0022;
  private userOrbitTimer: number = 0;
  private recentMovementTimer: number = 0;

  // GTA V View Presets & Look-Behind
  public viewPreset: CameraViewPreset = CameraViewPreset.MEDIUM;
  public isLookingBehind: boolean = false;

  // Shake timer for high-speed rumble
  private speedShakeTimer: number = 0;

  public resetUserOrbit(): void {
    this.userOrbitTimer = 0;
  }

  constructor(camera: THREE.PerspectiveCamera, world: World) {
    this.camera = camera;
    this.world = world;

    // Set authentic GTA V base FOV and near clipping plane
    this.camera.fov = 58;
    this.camera.near = 0.1;
    this.camera.updateProjectionMatrix();
  }

  public setMode(mode: CameraMode, initialHeading?: number): void {
    if (this.mode === mode) return;

    this.mode = mode;
    if (mode === 'vehicle') {
      if (initialHeading !== undefined) {
        this.yaw = initialHeading + Math.PI;
      }
      // Low, sleek GTA V vehicle camera pitch
      this.pitch = 0.11;
      this.userOrbitTimer = 0;
    } else if (mode === 'aim') {
      // Keep current yaw/pitch for instant aim alignment
    } else {
      // Returning on foot
      this.pitch = 0.13;
    }
  }

  public cycleView(): void {
    // Cycle: Close (0) -> Medium (1) -> Far (2) -> Close (0)
    this.viewPreset = ((this.viewPreset + 1) % 3) as CameraViewPreset;
  }

  public adjustDistance(direction: number): void {
    // direction > 0 zooms out (towards Far), < 0 zooms in (towards Close)
    if (direction > 0 && this.viewPreset < CameraViewPreset.FAR) {
      this.viewPreset++;
    } else if (direction < 0 && this.viewPreset > CameraViewPreset.CLOSE) {
      this.viewPreset--;
    }
  }

  public setLookBehind(active: boolean): void {
    this.isLookingBehind = active;
  }

  public handleMouseMove(deltaX: number, deltaY: number): void {
    this.yaw -= deltaX * this.sensitivity;
    this.pitch -= deltaY * this.sensitivity;

    if (this.mode === 'vehicle') {
      // Flag manual orbit to allow inspecting car; auto-recenters after 1.2s
      this.userOrbitTimer = 1.2;
      // Vehicle pitch clamp: can look slightly up from pavement, or down at roof
      this.pitch = Math.max(-0.15, Math.min(0.52, this.pitch));
    } else if (this.mode === 'aim') {
      // Wide vertical aiming clamp for high vantage points and ground targets
      this.pitch = Math.max(-0.75, Math.min(1.15, this.pitch));
    } else {
      // On-foot GTA V pitch: look up at skyscrapers or down at boots
      this.pitch = Math.max(-0.75, Math.min(1.20, this.pitch));
      // Manual mouse look active; auto-recenters after 0.8s of inactivity or on A/D steering
      this.userOrbitTimer = 0.8;
    }
  }

  public update(
    deltaTime: number,
    followPosition: THREE.Vector3,
    facingAngle?: number,
    speed?: number
  ): void {
    const absSpeed = speed ? Math.abs(speed) : 0;

    // Decrement manual inspection timer across all camera modes
    if (this.userOrbitTimer > 0) {
      this.userOrbitTimer -= deltaTime;
    }

    // Track recent movement to finish settling camera smoothly after walking/turning
    if (absSpeed > 0.4) {
      this.recentMovementTimer = 0.5;
    } else if (this.recentMovementTimer > 0) {
      this.recentMovementTimer -= deltaTime;
    }

    // 1. Calculate Target Parameters based on GTA V camera specifications
    let targetDistance: number;
    let lookAtHeight: number;
    let shoulderOffset: number;
    let targetFov: number;
    let posLerpSpeed: number;
    let lookLerpSpeed: number;

    if (this.mode === 'aim') {
      // GTA V Over-The-Shoulder (OTS) Aiming:
      // Tight, zoomed over right shoulder with clear reticle line of fire
      targetDistance = 1.65;
      lookAtHeight = 1.36; // Chest / upper torso
      shoulderOffset = 0.62; // Pushes character into left third of screen
      targetFov = 48; // Snappy zoom
      posLerpSpeed = 24;
      lookLerpSpeed = 24;
    } else if (this.mode === 'vehicle') {
      // GTA V Low-Slung Supercar Chase Camera:
      // Planted low behind rear bumper/taillights looking down the road
      const speedDistanceOffset = Math.min(absSpeed / 10, 1.2);
      switch (this.viewPreset) {
        case CameraViewPreset.CLOSE:
          targetDistance = 4.5 + speedDistanceOffset * 0.8;
          lookAtHeight = 0.82;
          break;
        case CameraViewPreset.FAR:
          targetDistance = 6.4 + speedDistanceOffset * 1.3;
          lookAtHeight = 0.90;
          break;
        case CameraViewPreset.MEDIUM:
        default:
          targetDistance = 5.3 + speedDistanceOffset;
          lookAtHeight = 0.85;
          break;
      }

      shoulderOffset = 0.0;
      // High-speed FOV tunnel effect (60° -> up to 73° at top speed)
      targetFov = 60 + Math.min(absSpeed / 3.0, 13);
      posLerpSpeed = 10; // Smooth elastic lag behind vehicle momentum
      lookLerpSpeed = 12;

      // GTA V Auto-recenter behind vehicle
      if (facingAngle !== undefined && !this.isLookingBehind) {
        const targetYaw = facingAngle + Math.PI;
        const diff = targetYaw - this.yaw;
        const normalizedDiff = Math.atan2(Math.sin(diff), Math.cos(diff));

        // When moving or when manual orbit timer expires, swing behind car
        const autoCenterRate = this.userOrbitTimer > 0
          ? (absSpeed > 6 ? 2.2 : 0.0)
          : (absSpeed > 1 ? 4.8 : 2.4);

        if (autoCenterRate > 0) {
          this.yaw += normalizedDiff * Math.min(1, autoCenterRate * deltaTime);
        }

        // Return pitch smoothly to sleek driving angle (~0.11 rad)
        if (this.userOrbitTimer <= 0) {
          this.pitch = THREE.MathUtils.lerp(this.pitch, 0.11, 3.5 * deltaTime);
        }
      }
    } else {
      // GTA V Standard On-Foot Third-Person Camera:
      // Eye-level / upper-back framing. Full character visible, boots near bottom edge.
      switch (this.viewPreset) {
        case CameraViewPreset.CLOSE:
          targetDistance = 2.15;
          lookAtHeight = 1.25;
          shoulderOffset = 0.28;
          targetFov = 58;
          break;
        case CameraViewPreset.FAR:
          targetDistance = 3.80;
          lookAtHeight = 1.32;
          shoulderOffset = 0.16;
          targetFov = 60;
          break;
        case CameraViewPreset.MEDIUM:
        default:
          targetDistance = 2.85;
          lookAtHeight = 1.28; // Upper chest / between shoulder blades
          shoulderOffset = 0.22; // Subtle right offset for clear forward line of sight
          targetFov = 58;
          break;
      }

      posLerpSpeed = 14;
      lookLerpSpeed = 18;

      // GTA V Auto-follow behind character when walking or steering with A / D
      if (facingAngle !== undefined && !this.isLookingBehind && this.userOrbitTimer <= 0) {
        if (this.recentMovementTimer > 0) {
          const targetYaw = facingAngle + Math.PI;
          const diff = targetYaw - this.yaw;
          const normalizedDiff = Math.atan2(Math.sin(diff), Math.cos(diff));

          // Responsive turning rate when steering with A/D; smooth follow when moving straight
          const followRate = Math.abs(normalizedDiff) > 0.5 ? 4.8 : 2.8;
          this.yaw += normalizedDiff * Math.min(1, followRate * deltaTime);
        }
      }
    }

    // 2. Smooth FOV transitions
    const fovLerpFactor = 1 - Math.exp(-posLerpSpeed * deltaTime);
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, fovLerpFactor);
      this.camera.updateProjectionMatrix();
    }

    // 3. Compute LookAt Target Point
    const lookAtOrigin = followPosition.clone();
    lookAtOrigin.y += lookAtHeight;

    if (this.mode === 'vehicle' && facingAngle !== undefined) {
      // Look forward through the car over the hood / down the street (GTA V signature)
      const leadDistance = 2.4;
      lookAtOrigin.x += Math.sin(facingAngle) * leadDistance;
      lookAtOrigin.z += Math.cos(facingAngle) * leadDistance;
    }

    // 4. Effective Yaw & Pitch (Handle GTA V Look-Behind "C" Key)
    let effectiveYaw = this.yaw;
    let effectivePitch = this.pitch;
    let effectiveShoulderOffset = shoulderOffset;

    if (this.isLookingBehind) {
      effectiveYaw += Math.PI; // Flip 180 degrees
      effectiveShoulderOffset = 0; // Centered rearview
      if (this.mode === 'vehicle') {
        effectivePitch = 0.08; // Level rear window glance
      }
    }

    // High-speed subtle road rumble
    if (this.mode === 'vehicle' && absSpeed > 16) {
      this.speedShakeTimer += deltaTime * 28;
      const shakeMagnitude = Math.min((absSpeed - 16) / 40, 1.0) * 0.003;
      effectiveYaw += Math.sin(this.speedShakeTimer) * shakeMagnitude;
      effectivePitch += Math.cos(this.speedShakeTimer * 1.3) * shakeMagnitude;
    }

    // 5. Spherical Coordinate Geometry for Ideal Camera Position
    const cosPitch = Math.cos(effectivePitch);
    const sinPitch = Math.sin(effectivePitch);
    const sinYaw = Math.sin(effectiveYaw);
    const cosYaw = Math.cos(effectiveYaw);

    const orbitDir = new THREE.Vector3(
      sinYaw * cosPitch,
      sinPitch,
      cosYaw * cosPitch
    ).normalize();

    const rightDir = new THREE.Vector3(cosYaw, 0, -sinYaw).normalize();

    let idealCamPos = lookAtOrigin
      .clone()
      .add(orbitDir.clone().multiplyScalar(targetDistance))
      .add(rightDir.clone().multiplyScalar(effectiveShoulderOffset));

    // 6. Raycast Obstacle Collision (Buildings / Walls) with Anti-Clipping Buffer
    const rayDir = idealCamPos.clone().sub(lookAtOrigin).normalize();
    const maxRayDist = idealCamPos.distanceTo(lookAtOrigin);
    const hitTest = this.world.raycastObstacle(lookAtOrigin, rayDir, maxRayDist);

    if (hitTest.hit) {
      // Pull camera forward with safety buffer
      const safeDist = Math.max(0.6, hitTest.distance - 0.25);
      idealCamPos = lookAtOrigin.clone().add(rayDir.multiplyScalar(safeDist));

      // If compressed against player, raise slightly and center to prevent clipping
      if (safeDist < 1.1) {
        idealCamPos.y += (1.1 - safeDist) * 0.25;
      }
    }

    // Ground clearance: ensure camera never dips below asphalt or terrain
    const groundUnderCam = this.world.getGroundHeight(idealCamPos.x, idealCamPos.z);
    if (idealCamPos.y < groundUnderCam + 0.45) {
      idealCamPos.y = groundUnderCam + 0.45;
    }

    // 7. Apply Dual-Stage Frame-Rate Independent Exponential Smoothing
    this.targetPosition.copy(idealCamPos);
    this.targetLookAt.copy(lookAtOrigin);

    if (this.currentPosition.lengthSq() < 0.001) {
      this.currentPosition.copy(this.targetPosition);
      this.currentLookAt.copy(this.targetLookAt);
    } else {
      const posFactor = 1 - Math.exp(-posLerpSpeed * deltaTime);
      const lookFactor = 1 - Math.exp(-lookLerpSpeed * deltaTime);
      this.currentPosition.lerp(this.targetPosition, posFactor);
      this.currentLookAt.lerp(this.targetLookAt, lookFactor);
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
