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

  public destroy(): void {
    for (const v of this.vehicles) {
      this.scene.remove(v.mesh);
    }
    this.vehicles = [];
  }
}
