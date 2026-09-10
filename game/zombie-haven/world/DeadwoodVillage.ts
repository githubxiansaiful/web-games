/**
 * Zombie Haven - Deadwood Village World Generator
 * Creates the complete 3D environment: Terrain, Roads, Houses, Barn, Farm,
 * Streetlights, Fences, Forest, and solid obstacle Collision detection.
 */

import * as THREE from 'three';
import { VillageProps, CollisionBox } from './VillageProps';

export class DeadwoodVillage {
  public rootGroup: THREE.Group;
  public colliders: CollisionBox[] = [];
  public pointLights: THREE.PointLight[] = [];
  public houseSpawnPoints: THREE.Vector3[] = [];
  public zombieSpawnPoints: THREE.Vector3[] = [];

  constructor() {
    this.rootGroup = new THREE.Group();
    this.buildTerrain();
    this.buildRoadNetwork();
    this.buildVillageCenter();
    this.buildResidentialArea();
    this.buildFarmArea();
    this.buildGarageArea();
    this.buildPerimeterForest();
  }

  // --- 1. TERRAIN & GROUND ---
  private buildTerrain() {
    // 600m x 600m active ground plane with dark mossy soil
    const groundGeo = new THREE.PlaneGeometry(600, 600, 32, 32);
    // Subtle undulation
    const posAttr = groundGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      // Keep village center flat (within 140m), add gentle rolling hills outside
      const dist = Math.hypot(vx, vy);
      if (dist > 120) {
        const h = Math.sin(vx * 0.02) * Math.cos(vy * 0.02) * 3.5;
        posAttr.setZ(i, h);
      }
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1c2419, // dark damp forest grass
      roughness: 0.9,
      metalness: 0.05,
    });

    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.rootGroup.add(ground);
  }

  // --- 2. ROAD NETWORK ---
  private buildRoadNetwork() {
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x22262b, // weathered cracked asphalt
      roughness: 0.85,
    });
    const gravelMat = new THREE.MeshStandardMaterial({
      color: 0x3d3935, // dirty brown farm path
      roughness: 0.95,
    });

    // Main East-West Highway (10m wide, 400m long)
    const mainRoadGeo = new THREE.PlaneGeometry(400, 10);
    const mainRoad = new THREE.Mesh(mainRoadGeo, roadMat);
    mainRoad.rotation.x = -Math.PI / 2;
    mainRoad.position.y = 0.02;
    mainRoad.receiveShadow = true;
    this.rootGroup.add(mainRoad);

    // North-South Crossroads (8m wide, 350m long)
    const crossRoadGeo = new THREE.PlaneGeometry(8, 350);
    const crossRoad = new THREE.Mesh(crossRoadGeo, roadMat);
    crossRoad.rotation.x = -Math.PI / 2;
    crossRoad.position.y = 0.025;
    crossRoad.receiveShadow = true;
    this.rootGroup.add(crossRoad);

    // Farm dirt track curving South-West
    const farmPathGeo = new THREE.PlaneGeometry(6, 120);
    const farmPath = new THREE.Mesh(farmPathGeo, gravelMat);
    farmPath.rotation.x = -Math.PI / 2;
    farmPath.rotation.z = Math.PI / 6;
    farmPath.position.set(-50, 0.03, -70);
    farmPath.receiveShadow = true;
    this.rootGroup.add(farmPath);
  }

  // --- 3. ZONE A: VILLAGE CENTER ---
  private buildVillageCenter() {
    // Stone Water Well right at center plaza (x: 0, z: 0)
    const well = VillageProps.createWaterWell();
    well.position.set(0, 0, 0);
    this.rootGroup.add(well);
    this.addCollider(-1.6, 1.6, -1.6, 1.6);

    // 4 Plaza Street Lamps
    const lampCoords = [
      [12, 12],
      [-12, 12],
      [12, -12],
      [-12, -12],
    ];
    lampCoords.forEach(([lx, lz]) => {
      const { group: lamp, light } = VillageProps.createStreetLamp();
      lamp.position.set(lx, 0, lz);
      this.rootGroup.add(lamp);
      this.pointLights.push(light);
      this.addCollider(lx - 0.3, lx + 0.3, lz - 0.3, lz + 0.3);
    });

    // Flaming Barrels in Plaza
    const { group: fire1, light: fLight1 } = VillageProps.createBarrelFire();
    fire1.position.set(6, 0, -5);
    this.rootGroup.add(fire1);
    this.pointLights.push(fLight1);
    this.addCollider(5.3, 6.7, -5.7, -4.3);

    // General Store Building (North-East of square)
    const { group: store } = VillageProps.createHouse(14, 12, 5.5);
    store.position.set(28, 0, 24);
    store.rotation.y = -Math.PI / 2;
    this.rootGroup.add(store);
    this.addCollider(21, 35, 17, 31);
    this.houseSpawnPoints.push(new THREE.Vector3(28, 0.5, 24));

    // Abandoned Sedan parked in front of Store
    const car1 = VillageProps.createAbandonedCar();
    car1.position.set(15, 0, 22);
    car1.rotation.y = 0.4;
    this.rootGroup.add(car1);
    this.addCollider(13.8, 16.2, 19.8, 24.2);
  }

  // --- 4. ZONE B: RESIDENTIAL AREA (Houses & Garages) ---
  private buildResidentialArea() {
    const houseConfigs = [
      // House 1 (North-West)
      { x: -35, z: 32, rot: Math.PI / 2, w: 12, d: 10 },
      // House 2 (West)
      { x: -45, z: -10, rot: 0, w: 11, d: 9 },
      // House 3 (South-East)
      { x: 38, z: -35, rot: Math.PI, w: 13, d: 11 },
      // House 4 (North)
      { x: -5, z: 65, rot: 0, w: 12, d: 10 },
    ];

    houseConfigs.forEach((cfg) => {
      const { group: house } = VillageProps.createHouse(cfg.w, cfg.d, 5);
      house.position.set(cfg.x, 0, cfg.z);
      house.rotation.y = cfg.rot;
      this.rootGroup.add(house);

      const hw = cfg.w / 2;
      const hd = cfg.d / 2;
      this.addCollider(cfg.x - hw, cfg.x + hw, cfg.z - hd, cfg.z + hd);
      this.houseSpawnPoints.push(new THREE.Vector3(cfg.x, 0.5, cfg.z));

      // Fencing around residential lots
      const fence = VillageProps.createFenceSegment(8);
      fence.position.set(cfg.x - hw - 2, 0, cfg.z);
      fence.rotation.y = Math.PI / 2;
      this.rootGroup.add(fence);
    });

    // Street lamps along residential lanes
    const lampLane = [
      [-30, 10],
      [30, -10],
      [0, 45],
      [0, -45],
    ];
    lampLane.forEach(([lx, lz]) => {
      const { group: lamp, light } = VillageProps.createStreetLamp();
      lamp.position.set(lx, 0, lz);
      this.rootGroup.add(lamp);
      this.pointLights.push(light);
    });
  }

  // --- 5. ZONE C: THE OLD FARM (Red Barn & Farmhouse) ---
  private buildFarmArea() {
    // Big Red Barn (South-West)
    const { group: barn } = VillageProps.createBarn(18, 24, 8);
    barn.position.set(-80, 0, -85);
    barn.rotation.y = Math.PI / 4;
    this.rootGroup.add(barn);
    this.addCollider(-92, -68, -98, -72);
    this.houseSpawnPoints.push(new THREE.Vector3(-80, 0.5, -85));

    // Farmhouse
    const { group: farmHouse } = VillageProps.createHouse(14, 12, 5.5);
    farmHouse.position.set(-50, 0, -120);
    this.rootGroup.add(farmHouse);
    this.addCollider(-58, -42, -127, -113);
    this.houseSpawnPoints.push(new THREE.Vector3(-50, 0.5, -120));

    // Abandoned Truck near Barn
    const truck = VillageProps.createAbandonedCar();
    truck.position.set(-65, 0, -75);
    truck.rotation.y = -0.6;
    this.rootGroup.add(truck);
    this.addCollider(-66.5, -63.5, -77, -73);

    // Barrel fire at barn entrance
    const { group: barnFire, light: bLight } = VillageProps.createBarrelFire();
    barnFire.position.set(-72, 0, -74);
    this.rootGroup.add(barnFire);
    this.pointLights.push(bLight);
  }

  // --- 6. ZONE E: GARAGE & INDUSTRIAL SCRAPYARD ---
  private buildGarageArea() {
    // Metal Garage / Workshop (East)
    const { group: garage } = VillageProps.createHouse(16, 14, 5);
    garage.position.set(85, 0, -25);
    garage.rotation.y = -Math.PI / 2;
    this.rootGroup.add(garage);
    this.addCollider(76, 94, -33, -17);
    this.houseSpawnPoints.push(new THREE.Vector3(85, 0.5, -25));

    // Wrecked cars
    const wreck1 = VillageProps.createAbandonedCar();
    wreck1.position.set(70, 0, -15);
    wreck1.rotation.y = 1.2;
    this.rootGroup.add(wreck1);
    this.addCollider(68.5, 71.5, -17.5, -12.5);

    const wreck2 = VillageProps.createAbandonedCar();
    wreck2.position.set(72, 0, -35);
    wreck2.rotation.y = -0.8;
    this.rootGroup.add(wreck2);
    this.addCollider(70.5, 73.5, -37.5, -32.5);
  }

  // --- 7. ZONE D: PERIMETER FOREST & VEGETATION ---
  private buildPerimeterForest() {
    // Distribute pine trees and dead spooky trees along borders and fields
    const treePositions: { x: number; z: number; type: 'pine' | 'dead'; scale: number }[] = [];

    // Outer forest ring (110m to 250m radius)
    const count = 160;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.1;
      const dist = 110 + Math.random() * 140;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const type = Math.random() > 0.4 ? 'pine' : 'dead';
      const scale = 0.8 + Math.random() * 0.6;
      treePositions.push({ x, z, type, scale });

      // Add zombie spawn positions out in the woods (50m - 120m away)
      if (i % 8 === 0) {
        this.zombieSpawnPoints.push(new THREE.Vector3(x * 0.7, 0, z * 0.7));
      }
    }

    // A few spooky dead trees inside the village
    const innerTrees = [
      { x: -18, z: 25, type: 'dead' as const, scale: 0.9 },
      { x: 18, z: -25, type: 'dead' as const, scale: 1.0 },
      { x: -22, z: -35, type: 'dead' as const, scale: 0.85 },
      { x: 45, z: 45, type: 'pine' as const, scale: 1.1 },
      { x: -60, z: 45, type: 'pine' as const, scale: 1.2 },
    ];
    treePositions.push(...innerTrees);

    treePositions.forEach((tp) => {
      const tree =
        tp.type === 'pine' ? VillageProps.createPineTree(tp.scale) : VillageProps.createDeadTree(tp.scale);
      tree.position.set(tp.x, 0, tp.z);
      this.rootGroup.add(tree);

      // Colliders for trees near central gameplay area (< 110m)
      if (Math.hypot(tp.x, tp.z) < 110) {
        const tr = 0.5 * tp.scale;
        this.addCollider(tp.x - tr, tp.x + tr, tp.z - tr, tp.z + tr);
      }
    });

    // Ensure we have at least 16 good zombie spawn points
    if (this.zombieSpawnPoints.length < 16) {
      const defaultSpawns = [
        [60, 60],
        [-60, 60],
        [60, -60],
        [-60, -60],
        [85, 10],
        [-85, 10],
        [10, 85],
        [10, -85],
      ];
      defaultSpawns.forEach(([sx, sz]) => {
        this.zombieSpawnPoints.push(new THREE.Vector3(sx, 0, sz));
      });
    }
  }

  private addCollider(minX: number, maxX: number, minZ: number, maxZ: number) {
    this.colliders.push({ minX, maxX, minZ, maxZ });
  }

  /**
   * Circle vs AABB Collision Check
   * Returns true if (x, z) with radius collides with any solid building, car, fence, or boundary
   */
  public checkCollision(x: number, z: number, radius = 0.5): boolean {
    // Map outer perimeter boundary clamp (±260m)
    if (Math.abs(x) > 260 || Math.abs(z) > 260) {
      return true;
    }

    for (let i = 0; i < this.colliders.length; i++) {
      const c = this.colliders[i];
      const closestX = Math.max(c.minX, Math.min(x, c.maxX));
      const closestZ = Math.max(c.minZ, Math.min(z, c.maxZ));

      const dx = x - closestX;
      const dz = z - closestZ;
      if (dx * dx + dz * dz < radius * radius) {
        return true;
      }
    }
    return false;
  }
}
