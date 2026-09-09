import * as THREE from 'three';
import { Vehicle } from './Vehicle';
import { VEHICLE_CONFIGS } from '../data/vehicleData';
import { World } from '../world/World';

export class VehicleManager {
  public vehicles: Vehicle[] = [];
  public playerVehicle: Vehicle | null = null;
  public policeVehicle: Vehicle | null = null;
  private scene: THREE.Scene;
  private world: World;

  constructor(scene: THREE.Scene, world: World) {
    this.scene = scene;
    this.world = world;
    this.spawnInitialVehicles();
  }

  private spawnInitialVehicles(): void {
    // Keep ONLY the one 3D vehicle: 2026 Lamborghini Fenomeno parked next to player
    const lambo = new Vehicle(
      VEHICLE_CONFIGS.lamborghini_fenomeno,
      new THREE.Vector3(4, 0, 10),
      Math.PI, // Facing North (matches player orientation)
      this.world
    );
    this.vehicles.push(lambo);
    this.playerVehicle = lambo;
    this.scene.add(lambo.mesh);
  }

  public findNearestVehicle(position: THREE.Vector3, maxDist: number = 4.5): Vehicle | null {
    let nearest: Vehicle | null = null;
    let minDist = maxDist;

    for (const v of this.vehicles) {
      if (v.isDead || v.isOccupied) continue;
      const dist = v.position.distanceTo(position);
      if (dist < minDist) {
        minDist = dist;
        nearest = v;
      }
    }
    return nearest;
  }

  public update(deltaTime: number): void {
    for (const v of this.vehicles) {
      if (!v.isPlayerDriving) {
        // Ambient / non-player vehicle idle friction
        v.update(deltaTime, 0, 0);
      }
    }
  }

  public resolveCollision(
    position: THREE.Vector3,
    radius: number,
    excludeVehicle?: Vehicle | null
  ): { collided: boolean; normal: THREE.Vector3 } {
    let anyCollided = false;
    const finalNormal = new THREE.Vector3();

    for (const vehicle of this.vehicles) {
      if (vehicle === excludeVehicle || vehicle.isDead) continue;

      // Quick broadphase distance check (sphere radius ~3.0m + character radius ~0.5m = 3.5m)
      const dx = position.x - vehicle.position.x;
      const dz = position.z - vehicle.position.z;
      const distSq = dx * dx + dz * dz;
      if (distSq > 16) continue;

      // Vertical height check: vehicle roof is ~1.25m above ground
      if (position.y > vehicle.position.y + 1.35 || position.y < vehicle.position.y - 0.5) {
        continue;
      }

      // Exact OBB collision box for Lamborghini Fenomeno (half-width 1.15m, half-length 2.50m)
      const hw = 1.15;
      const hl = 2.50;

      const cos = Math.cos(vehicle.heading);
      const sin = Math.sin(vehicle.heading);

      let lx = dx * cos - dz * sin;
      let lz = dx * sin + dz * cos;

      const cx = Math.max(-hw, Math.min(hw, lx));
      const cz = Math.max(-hl, Math.min(hl, lz));

      const diffX = lx - cx;
      const diffZ = lz - cz;
      const dSq = diffX * diffX + diffZ * diffZ;

      if (dSq > 0.00001) {
        if (dSq < radius * radius) {
          anyCollided = true;
          const dist = Math.sqrt(dSq);
          const overlap = radius - dist;
          const nx = diffX / dist;
          const nz = diffZ / dist;

          lx += nx * overlap;
          lz += nz * overlap;

          // Convert local normal to world space
          finalNormal.x += nx * cos + nz * sin;
          finalNormal.z += -nx * sin + nz * cos;
        }
      } else {
        // Deep inside box: push out to nearest edge
        anyCollided = true;
        const dLeft = lx + hw;
        const dRight = hw - lx;
        const dBack = lz + hl;
        const dFront = hl - lz;
        const minD = Math.min(dLeft, dRight, dBack, dFront);

        if (minD === dLeft) {
          lx = -hw - radius;
          finalNormal.x += -cos;
          finalNormal.z += sin;
        } else if (minD === dRight) {
          lx = hw + radius;
          finalNormal.x += cos;
          finalNormal.z += -sin;
        } else if (minD === dBack) {
          lz = -hl - radius;
          finalNormal.x += -sin;
          finalNormal.z += -cos;
        } else {
          lz = hl + radius;
          finalNormal.x += sin;
          finalNormal.z += cos;
        }
      }

      if (anyCollided) {
        // Project corrected local position back to world coordinates
        position.x = vehicle.position.x + lx * cos + lz * sin;
        position.z = vehicle.position.z - lx * sin + lz * cos;
      }
    }

    if (anyCollided && (finalNormal.x !== 0 || finalNormal.z !== 0)) {
      finalNormal.normalize();
    }

    return { collided: anyCollided, normal: finalNormal };
  }

  public destroy(): void {
    for (const v of this.vehicles) {
      this.scene.remove(v.mesh);
    }
    this.vehicles = [];
  }
}
