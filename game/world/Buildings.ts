import * as THREE from 'three';
import { BuildingDef } from '../data/cityData';

export interface BuildingCollider {
  id: string;
  box: THREE.Box3;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export class Buildings {
  public group: THREE.Group;
  public colliders: BuildingCollider[] = [];
  private buildingDefs: BuildingDef[];

  constructor(buildingDefs: BuildingDef[]) {
    this.group = new THREE.Group();
    this.group.name = 'Buildings';
    this.buildingDefs = buildingDefs;
    this.buildCityBuildings();
  }

  private buildCityBuildings(): void {
    const windowTexture = this.generateWindowTexture();

    for (const b of this.buildingDefs) {
      const buildingGroup = new THREE.Group();
      buildingGroup.position.set(b.position[0], 0, b.position[2]);

      const [w, h, d] = b.size;

      // 1. Main Structural Block
      const mainMat = new THREE.MeshStandardMaterial({
        color: b.color,
        roughness: 0.65,
        metalness: 0.3,
        map: windowTexture,
      });

      const bodyGeo = new THREE.BoxGeometry(w, h, d);
      // Adjust texture repeat to match building dimensions
      const clonedMat = mainMat.clone();
      if (clonedMat.map) {
        clonedMat.map = clonedMat.map.clone();
        clonedMat.map.repeat.set(Math.floor(w / 4), Math.floor(h / 4));
        clonedMat.map.needsUpdate = true;
      }

      const bodyMesh = new THREE.Mesh(bodyGeo, clonedMat);
      bodyMesh.position.y = h / 2;
      bodyMesh.castShadow = true;
      bodyMesh.receiveShadow = true;
      buildingGroup.add(bodyMesh);

      // 2. Base Pedestrian Trim / Entrance
      const baseTrimGeo = new THREE.BoxGeometry(w + 0.8, 3.5, d + 0.8);
      const baseTrimMat = new THREE.MeshStandardMaterial({
        color: 0x090d16,
        roughness: 0.8,
      });
      const baseTrim = new THREE.Mesh(baseTrimGeo, baseTrimMat);
      baseTrim.position.y = 1.75;
      baseTrim.receiveShadow = true;
      buildingGroup.add(baseTrim);

      // 3. Roof Parapet & Spire/Antenna
      const roofParapetGeo = new THREE.BoxGeometry(w + 0.4, 1.2, d + 0.4);
      const roofParapetMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.7,
      });
      const roofParapet = new THREE.Mesh(roofParapetGeo, roofParapetMat);
      roofParapet.position.y = h + 0.6;
      buildingGroup.add(roofParapet);

      // Roof HVAC unit
      const hvacGeo = new THREE.BoxGeometry(w * 0.3, 2, d * 0.3);
      const hvacMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5 });
      const hvac = new THREE.Mesh(hvacGeo, hvacMat);
      hvac.position.set(0, h + 1.6, 0);
      buildingGroup.add(hvac);

      // Antenna spire on tall skyscrapers
      if (b.type === 'skyscraper') {
        const antennaGeo = new THREE.CylinderGeometry(0.15, 0.4, 12, 8);
        const antennaMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const antenna = new THREE.Mesh(antennaGeo, antennaMat);
        antenna.position.set(0, h + 6.6, 0);
        buildingGroup.add(antenna);

        // Blinking beacon light
        const beaconLight = new THREE.PointLight(0xef4444, 1.5, 30);
        beaconLight.position.set(0, h + 12.5, 0);
        buildingGroup.add(beaconLight);
      }

      // 4. Glowing Neon Sign / Accent Trims
      if (b.neonColor) {
        const neonGeo = new THREE.BoxGeometry(w + 0.5, 0.5, d + 0.5);
        const neonMat = new THREE.MeshBasicMaterial({ color: b.neonColor });
        const neonBand = new THREE.Mesh(neonGeo, neonMat);
        neonBand.position.y = 3.6;
        buildingGroup.add(neonBand);

        const neonBandTop = new THREE.Mesh(neonGeo, neonMat);
        neonBandTop.position.y = h;
        buildingGroup.add(neonBandTop);
      }

      this.group.add(buildingGroup);

      // 5. Register Collision Bounding Box
      const halfW = w / 2 + 0.5;
      const halfD = d / 2 + 0.5;
      const min = new THREE.Vector3(b.position[0] - halfW, 0, b.position[2] - halfD);
      const max = new THREE.Vector3(b.position[0] + halfW, h + 2, b.position[2] + halfD);

      this.colliders.push({
        id: b.id,
        box: new THREE.Box3(min, max),
        minX: min.x,
        maxX: max.x,
        minZ: min.z,
        maxZ: max.z,
      });
    }
  }

  private generateWindowTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // Concrete facade background
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, 128, 128);

    // Draw grid of daytime reflective windows
    const cols = 4;
    const rows = 4;
    const winW = 18;
    const winH = 22;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Daytime sky reflection gradient
        const isSkyReflect = (r + c) % 2 === 0;
        ctx.fillStyle = isSkyReflect ? '#38bdf8' : '#0284c7';
        ctx.fillRect(8 + c * 28, 6 + r * 28, winW, winH);

        // Window white specular glare / frame
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(8 + c * 28, 6 + r * 28, winW, 3);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  public checkPointCollision(x: number, z: number, padding: number = 0.5): boolean {
    for (const c of this.colliders) {
      if (
        x >= c.minX - padding &&
        x <= c.maxX + padding &&
        z >= c.minZ - padding &&
        z <= c.maxZ + padding
      ) {
        return true;
      }
    }
    return false;
  }

  public resolveCircleCollision(
    pos: THREE.Vector3,
    radius: number
  ): { collided: boolean; normal: THREE.Vector3 } {
    let collided = false;
    const normal = new THREE.Vector3();

    for (const c of this.colliders) {
      // Find closest point on AABB to circle center
      const closestX = Math.max(c.minX, Math.min(pos.x, c.maxX));
      const closestZ = Math.max(c.minZ, Math.min(pos.z, c.maxZ));

      const distX = pos.x - closestX;
      const distZ = pos.z - closestZ;
      const distSq = distX * distX + distZ * distZ;

      if (distSq < radius * radius && distSq > 0.00001) {
        collided = true;
        const dist = Math.sqrt(distSq);
        const overlap = radius - dist;
        const nx = distX / dist;
        const nz = distZ / dist;

        pos.x += nx * overlap;
        pos.z += nz * overlap;

        normal.x = nx;
        normal.z = nz;
      }
    }

    return { collided, normal };
  }
}
