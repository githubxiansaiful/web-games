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
    // 1. Player's Cyan Apex GT-99 parked near downtown plaza
    const gtCar = new Vehicle(
      VEHICLE_CONFIGS.gt_coupe,
      new THREE.Vector3(6, 0, 15),
      0, // Facing North
      this.world
    );
    this.vehicles.push(gtCar);
    this.playerVehicle = gtCar;
    this.scene.add(gtCar.mesh);

    // 2. Metro Police Interceptor parked near Police Station HQ
    const policeCar = new Vehicle(
      VEHICLE_CONFIGS.police_cruiser,
      new THREE.Vector3(-18, 0, 45),
      Math.PI / 2, // Facing East
      this.world
    );
    this.vehicles.push(policeCar);
    this.policeVehicle = policeCar;
    this.scene.add(policeCar.mesh);

    // 3. City Taxi Cab on boulevard
    const taxiCar = new Vehicle(
      VEHICLE_CONFIGS.taxi_sedan,
      new THREE.Vector3(18, 0, -35),
      Math.PI, // Facing South
      this.world
    );
    this.vehicles.push(taxiCar);
    this.scene.add(taxiCar.mesh);
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
