import * as THREE from 'three';
import { Buildings, ObstacleCollider } from './Buildings';
import { ISLAND_DISTRICTS } from '../data/islandMapData';
import { Roads } from './Roads';

export class Props {
  public group: THREE.Group;
  private buildings: Buildings;

  constructor(buildings: Buildings, roads?: Roads, getHeight?: (x: number, z: number) => number) {
    this.group = new THREE.Group();
    this.group.name = 'IslandProps';
    this.buildings = buildings;
    this.buildDistrictProps(roads, getHeight);
  }

  private buildDistrictProps(roads?: Roads, getHeight?: (x: number, z: number) => number): void {
    const poleGeo = new THREE.CylinderGeometry(0.14, 0.18, 7.5, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 });

    const lampArmGeo = new THREE.BoxGeometry(0.15, 0.15, 2.2);
    const lampHeadGeo = new THREE.BoxGeometry(0.45, 0.25, 0.8);
    const bulbMatDay = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });

    const trunkGeo = new THREE.CylinderGeometry(0.4, 0.55, 4.2, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.9 });
    const foliageGeo = new THREE.DodecahedronGeometry(3.0, 1);
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });

    const dumpsterGeo = new THREE.BoxGeometry(2.4, 1.6, 1.6);
    const dumpsterMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.6 });

    const barrierGeo = new THREE.BoxGeometry(3.6, 1.0, 0.5);
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7 });

    for (const district of ISLAND_DISTRICTS) {
      const cx = district.worldPos.x;
      const cz = district.worldPos.z;

      // 1. Streetlights along sidewalks
      const lampOffsets = [
        { x: -26, z: -26 },
        { x: 26, z: -26 },
        { x: -26, z: 26 },
        { x: 26, z: 26 },
      ];

      for (let i = 0; i < lampOffsets.length; i++) {
        const off = lampOffsets[i];
        let lx = cx + off.x;
        let lz = cz + off.z;

        // Streetlight Road Clearance: snap to sidewalk verge (halfWidth + 1.2m)
        if (roads) {
          const roadTest = roads.getDistanceToRoad(lx, lz);
          if (roadTest.distance < roadTest.halfWidth + 3.5) {
            const pushDir = new THREE.Vector2(lx - roadTest.nearestPoint.x, lz - roadTest.nearestPoint.z);
            if (pushDir.lengthSq() < 0.01) pushDir.set(roadTest.normal.x, roadTest.normal.z);
            pushDir.normalize();
            lx = roadTest.nearestPoint.x + pushDir.x * (roadTest.halfWidth + 1.2);
            lz = roadTest.nearestPoint.z + pushDir.y * (roadTest.halfWidth + 1.2);
          }
        }

        const ly = getHeight ? getHeight(lx, lz) : 0;
        if (ly < 0.2) continue; // Skip if in water

        const lightGroup = new THREE.Group();
        lightGroup.position.set(lx, ly, lz);

        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 3.75;
        pole.castShadow = true;
        lightGroup.add(pole);

        const arm = new THREE.Mesh(lampArmGeo, poleMat);
        arm.position.set(0, 7.3, 0.8);
        lightGroup.add(arm);

        const head = new THREE.Mesh(lampHeadGeo, poleMat);
        head.position.set(0, 7.2, 1.8);
        lightGroup.add(head);

        const bulb = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.6), bulbMatDay);
        bulb.rotation.x = Math.PI / 2;
        bulb.position.set(0, 7.05, 1.8);
        lightGroup.add(bulb);

        this.group.add(lightGroup);

        this.buildings.registerCustomCollider({
          id: `lamp_${district.id}_${i}`,
          type: 'cylinder',
          centerX: lx,
          centerZ: lz,
          radius: 0.45,
          minX: lx - 0.45,
          maxX: lx + 0.45,
          minZ: lz - 0.45,
          maxZ: lz + 0.45,
          height: ly + 8.0,
        });
      }

      // 2. Trees (Park and Green Belt trees - STRICTLY OFF ROAD)
      const treeOffsets = [
        { x: -52, z: 0 },
        { x: 52, z: 0 },
        { x: 0, z: -52 },
        { x: 0, z: 52 },
      ];

      for (let i = 0; i < treeOffsets.length; i++) {
        const off = treeOffsets[i];
        let tx = cx + off.x;
        let tz = cz + off.z;

        // Tree Road Clearance: Trees must be at least halfWidth + 5.5m away from road center
        if (roads) {
          const roadTest = roads.getDistanceToRoad(tx, tz);
          const minTreeClearance = roadTest.halfWidth + 5.5;

          if (roadTest.distance < minTreeClearance) {
            const pushDir = new THREE.Vector2(tx - roadTest.nearestPoint.x, tz - roadTest.nearestPoint.z);
            if (pushDir.lengthSq() < 0.01) pushDir.set(roadTest.normal.x, roadTest.normal.z);
            pushDir.normalize();

            // Push outward into park / lawn zone
            tx = roadTest.nearestPoint.x + pushDir.x * (minTreeClearance + 2.0);
            tz = roadTest.nearestPoint.z + pushDir.y * (minTreeClearance + 2.0);
          }
        }

        const ty = getHeight ? getHeight(tx, tz) : 0;
        if (ty < 0.2) continue; // Skip if in water

        const treeGroup = new THREE.Group();
        treeGroup.position.set(tx, ty, tz);

        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 2.1;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        const leaves = new THREE.Mesh(foliageGeo, foliageMat);
        leaves.position.y = 5.2;
        leaves.castShadow = true;
        treeGroup.add(leaves);

        this.group.add(treeGroup);

        this.buildings.registerCustomCollider({
          id: `tree_${district.id}_${i}`,
          type: 'cylinder',
          centerX: tx,
          centerZ: tz,
          radius: 0.75,
          minX: tx - 0.75,
          maxX: tx + 0.75,
          minZ: tz - 0.75,
          maxZ: tz + 0.75,
          height: ty + 9.0,
        });
      }

      // 3. Dumpsters & Barriers (Alley & Sidewalk placement - STRICTLY OFF ROAD)
      let dx = cx - 38;
      let dz = cz + 24;

      if (roads) {
        let dCleared = false;
        for (let attempt = 0; attempt < 4; attempt++) {
          const rTest = roads.getDistanceToRoad(dx, dz);
          if (rTest.distance >= rTest.halfWidth + 3.0) {
            dCleared = true;
            break;
          }
          const pushDir = new THREE.Vector2(dx - rTest.nearestPoint.x, dz - rTest.nearestPoint.z);
          if (pushDir.lengthSq() < 0.01) pushDir.set(rTest.normal.x, rTest.normal.z);
          pushDir.normalize();
          dx = rTest.nearestPoint.x + pushDir.x * (rTest.halfWidth + 4.5);
          dz = rTest.nearestPoint.z + pushDir.y * (rTest.halfWidth + 4.5);
        }
        if (!dCleared) continue;
      }

      const dy = getHeight ? getHeight(dx, dz) : 0;
      if (dy >= 0.2) {
        const dumpster = new THREE.Mesh(dumpsterGeo, dumpsterMat);
        dumpster.position.set(dx, dy + 0.8, dz);
        dumpster.castShadow = true;
        this.group.add(dumpster);

        this.buildings.registerCustomCollider({
          id: `dumpster_${district.id}`,
          type: 'box',
          minX: dx - 1.3,
          maxX: dx + 1.3,
          minZ: dz - 0.9,
          maxZ: dz + 0.9,
          height: dy + 2.0,
        });
      }

      let bx = cx + 38;
      let bz = cz - 24;

      if (roads) {
        let bCleared = false;
        for (let attempt = 0; attempt < 4; attempt++) {
          const rTest = roads.getDistanceToRoad(bx, bz);
          if (rTest.distance >= rTest.halfWidth + 3.0) {
            bCleared = true;
            break;
          }
          const pushDir = new THREE.Vector2(bx - rTest.nearestPoint.x, bz - rTest.nearestPoint.z);
          if (pushDir.lengthSq() < 0.01) pushDir.set(rTest.normal.x, rTest.normal.z);
          pushDir.normalize();
          bx = rTest.nearestPoint.x + pushDir.x * (rTest.halfWidth + 4.5);
          bz = rTest.nearestPoint.z + pushDir.y * (rTest.halfWidth + 4.5);
        }
        if (!bCleared) continue;
      }

      const by = getHeight ? getHeight(bx, bz) : 0;
      if (by >= 0.2) {
        const barrier = new THREE.Mesh(barrierGeo, barrierMat);
        barrier.position.set(bx, by + 0.5, bz);
        barrier.castShadow = true;
        this.group.add(barrier);

        this.buildings.registerCustomCollider({
          id: `barrier_${district.id}`,
          type: 'box',
          minX: bx - 1.9,
          maxX: bx + 1.9,
          minZ: bz - 0.4,
          maxZ: bz + 0.4,
          height: by + 1.5,
        });
      }
    }
  }
}
