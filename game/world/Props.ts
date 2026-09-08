import * as THREE from 'three';
import { Buildings, ObstacleCollider } from './Buildings';
import { ISLAND_DISTRICTS } from '../data/islandMapData';

export class Props {
  public group: THREE.Group;
  private buildings: Buildings;

  constructor(buildings: Buildings) {
    this.group = new THREE.Group();
    this.group.name = 'IslandProps';
    this.buildings = buildings;
    this.buildDistrictProps();
  }

  private buildDistrictProps(): void {
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

    // Place trees, streetlights, and barriers in every district along roadsides
    for (const district of ISLAND_DISTRICTS) {
      const cx = district.worldPos.x;
      const cz = district.worldPos.z;

      // 1. Streetlights along district avenues
      const lampOffsets = [
        { x: -18, z: -18 },
        { x: 18, z: -18 },
        { x: -18, z: 18 },
        { x: 18, z: 18 },
      ];

      for (let i = 0; i < lampOffsets.length; i++) {
        const off = lampOffsets[i];
        const lx = cx + off.x;
        const lz = cz + off.z;

        const lightGroup = new THREE.Group();
        lightGroup.position.set(lx, 0, lz);

        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 3.75;
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

        // Solid physical cylinder obstacle collider (cannot walk or drive through pole)
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
          height: 8.0,
        });
      }

      // 2. Trees (Park & Sidewalk trees)
      const treeOffsets = [
        { x: -32, z: 0 },
        { x: 32, z: 0 },
        { x: 0, z: -32 },
        { x: 0, z: 32 },
      ];

      for (let i = 0; i < treeOffsets.length; i++) {
        const off = treeOffsets[i];
        const tx = cx + off.x;
        const tz = cz + off.z;

        const treeGroup = new THREE.Group();
        treeGroup.position.set(tx, 0, tz);

        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 2.1;
        treeGroup.add(trunk);

        const leaves = new THREE.Mesh(foliageGeo, foliageMat);
        leaves.position.y = 5.2;
        treeGroup.add(leaves);

        this.group.add(treeGroup);

        // Solid trunk obstacle collider (character CANNOT go over or through tree trunk!)
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
          height: 9.0,
        });
      }

      // 3. Dumpsters & Barriers
      const dumpster = new THREE.Mesh(dumpsterGeo, dumpsterMat);
      const dx = cx - 22;
      const dz = cz + 14;
      dumpster.position.set(dx, 0.8, dz);
      this.group.add(dumpster);

      this.buildings.registerCustomCollider({
        id: `dumpster_${district.id}`,
        type: 'box',
        minX: dx - 1.3,
        maxX: dx + 1.3,
        minZ: dz - 0.9,
        maxZ: dz + 0.9,
        height: 2.0,
      });

      const barrier = new THREE.Mesh(barrierGeo, barrierMat);
      const bx = cx + 22;
      const bz = cz - 14;
      barrier.position.set(bx, 0.5, bz);
      this.group.add(barrier);

      this.buildings.registerCustomCollider({
        id: `barrier_${district.id}`,
        type: 'box',
        minX: bx - 1.9,
        maxX: bx + 1.9,
        minZ: bz - 0.4,
        maxZ: bz + 0.4,
        height: 1.5,
      });
    }
  }
}
