import * as THREE from 'three';
import { ISLAND_DISTRICTS, DistrictInfo } from '../data/islandMapData';

export interface ObstacleCollider {
  id: string;
  type: 'box' | 'cylinder';
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  centerX?: number;
  centerZ?: number;
  radius?: number;
  height?: number;
}

export class Buildings {
  public group: THREE.Group;
  public colliders: ObstacleCollider[] = [];

  constructor(getHeight?: (x: number, z: number) => number) {
    this.group = new THREE.Group();
    this.group.name = 'IslandBuildings';
    this.buildDistrictBuildings(getHeight);
  }

  private buildDistrictBuildings(getHeight?: (x: number, z: number) => number): void {
    const windowTexture = this.generateWindowTexture();

    for (const district of ISLAND_DISTRICTS) {
      const dGroup = new THREE.Group();
      dGroup.name = `District_${district.id}`;
      dGroup.position.set(district.worldPos.x, 0, district.worldPos.z);

      const count = district.buildingCount;
      const bType = district.buildingType;

      for (let i = 0; i < count; i++) {
        // Arrange buildings neatly in district blocks leaving wide avenue corridors clear
        const row = Math.floor(i / 4);
        const col = i % 4;
        const ox = (col < 2 ? -34 - (1 - col) * 32 : 34 + (col - 2) * 32);
        const oz = (row < 2 ? -34 - (1 - row) * 32 : 34 + (row - 2) * 32);

        const worldX = district.worldPos.x + ox;
        const worldZ = district.worldPos.z + oz;
        const baseY = getHeight ? getHeight(worldX, worldZ) : 0;

        let w = 24;
        let d = 24;
        let h = 30;
        let colorHex = 0x1e293b;
        let neonHex = 0x06b6d4;

        if (bType === 'skyscraper') {
          w = 26 + (i % 3) * 4;
          d = 26 + ((i + 1) % 3) * 4;
          h = 45 + (i * 7); // Tall skyscrapers 45m to 90m
          colorHex = i % 2 === 0 ? 0x0f172a : 0x1e293b;
          neonHex = i % 3 === 0 ? 0x06b6d4 : i % 3 === 1 ? 0x3b82f6 : 0x10b981;
        } else if (bType === 'industrial') {
          w = 34 + (i % 2) * 6;
          d = 36 + (i % 3) * 4;
          h = 16 + (i % 3) * 4; // Wide warehouse sheds
          colorHex = 0x334155;
          neonHex = 0xf59e0b;
        } else if (bType === 'commercial') {
          w = 26;
          d = 26;
          h = 24 + (i % 4) * 6;
          colorHex = 0x1e1e24;
          neonHex = 0xec4899;
        } else if (bType === 'airport') {
          w = 42;
          d = 28;
          h = 18;
          colorHex = 0x475569;
          neonHex = 0x38bdf8;
        } else if (bType === 'resort') {
          w = 22;
          d = 22;
          h = 18 + (i % 3) * 6;
          colorHex = 0x0f172a;
          neonHex = 0x14b8a6;
        } else {
          // Residential
          w = 20 + (i % 2) * 4;
          d = 20 + (i % 2) * 4;
          h = 18 + (i % 3) * 4;
          colorHex = 0x27272a;
          neonHex = 0x8b5cf6;
        }

        // 1. Building Mesh Body (anchored slightly into ground so no gap on sloped terrain)
        const foundationSink = 2.0;
        const bodyGeo = new THREE.BoxGeometry(w, h + foundationSink, d);
        const clonedMat = new THREE.MeshStandardMaterial({
          color: colorHex,
          roughness: 0.6,
          metalness: 0.35,
          map: windowTexture,
        });

        const bodyMesh = new THREE.Mesh(bodyGeo, clonedMat);
        bodyMesh.position.set(ox, baseY + (h - foundationSink) / 2 + foundationSink / 2, oz);
        bodyMesh.castShadow = true;
        bodyMesh.receiveShadow = true;
        dGroup.add(bodyMesh);

        // 2. Base Pedestrian Trim
        const baseTrim = new THREE.Mesh(
          new THREE.BoxGeometry(w + 0.8, 3.5, d + 0.8),
          new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.8 })
        );
        baseTrim.position.set(ox, baseY + 1.75, oz);
        dGroup.add(baseTrim);

        // 3. Roof Parapet
        const roofTrim = new THREE.Mesh(
          new THREE.BoxGeometry(w + 0.4, 1.2, d + 0.4),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 })
        );
        roofTrim.position.set(ox, baseY + h + 0.6, oz);
        dGroup.add(roofTrim);

        // 4. Glowing Neon Accent Trim
        const neonMat = new THREE.MeshBasicMaterial({ color: neonHex });
        const neonBand = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, 0.5, d + 0.5), neonMat);
        neonBand.position.set(ox, baseY + 3.6, oz);
        dGroup.add(neonBand);

        // 5. Register Physical AABB Collision Box in World Coords
        const halfW = w / 2;
        const halfD = d / 2;

        this.colliders.push({
          id: `bld_${district.id}_${i}`,
          type: 'box',
          minX: worldX - halfW,
          maxX: worldX + halfW,
          minZ: worldZ - halfD,
          maxZ: worldZ + halfD,
          height: baseY + h,
        });
      }

      this.group.add(dGroup);
    }
  }

  private generateWindowTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // Daytime Concrete facade
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, 128, 128);

    // Reflective glass grid
    const cols = 4;
    const rows = 4;
    const winW = 18;
    const winH = 22;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isSkyReflect = (r + c) % 2 === 0;
        ctx.fillStyle = isSkyReflect ? '#38bdf8' : '#0284c7';
        ctx.fillRect(8 + c * 28, 6 + r * 28, winW, winH);

        // White glass reflection sheen
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(8 + c * 28, 6 + r * 28, winW, 3);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  public registerCustomCollider(collider: ObstacleCollider): void {
    this.colliders.push(collider);
  }

  public resolveCircleCollision(
    pos: THREE.Vector3,
    radius: number
  ): { collided: boolean; normal: THREE.Vector3 } {
    let collided = false;
    const normal = new THREE.Vector3();

    for (const c of this.colliders) {
      if (pos.y >= (c.height || 40)) continue;

      if (c.type === 'cylinder' && c.centerX !== undefined && c.centerZ !== undefined && c.radius !== undefined) {
        const dx = pos.x - c.centerX;
        const dz = pos.z - c.centerZ;
        const totalR = radius + c.radius;
        const distSq = dx * dx + dz * dz;

        if (distSq < totalR * totalR) {
          collided = true;
          const dist = Math.max(0.0001, Math.sqrt(distSq));
          const nx = dx / dist;
          const nz = dz / dist;
          const overlap = totalR - dist;

          pos.x += nx * overlap;
          pos.z += nz * overlap;

          normal.x = nx;
          normal.z = nz;
        }
      } else {
        // Box AABB
        if (
          pos.x >= c.minX - radius &&
          pos.x <= c.maxX + radius &&
          pos.z >= c.minZ - radius &&
          pos.z <= c.maxZ + radius
        ) {
          collided = true;

          // Calculate penetration depth to all 4 faces
          const toMinX = Math.abs(pos.x - (c.minX - radius));
          const toMaxX = Math.abs(c.maxX + radius - pos.x);
          const toMinZ = Math.abs(pos.z - (c.minZ - radius));
          const toMaxZ = Math.abs(c.maxZ + radius - pos.z);

          const minEdge = Math.min(toMinX, toMaxX, toMinZ, toMaxZ);

          if (minEdge === toMinX) {
            pos.x = c.minX - radius;
            normal.x = -1;
          } else if (minEdge === toMaxX) {
            pos.x = c.maxX + radius;
            normal.x = 1;
          } else if (minEdge === toMinZ) {
            pos.z = c.minZ - radius;
            normal.z = -1;
          } else {
            pos.z = c.maxZ + radius;
            normal.z = 1;
          }
        }
      }
    }

    return { collided, normal };
  }
}
