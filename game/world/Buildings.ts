import * as THREE from 'three';
import { ISLAND_DISTRICTS } from '../data/islandMapData';
import { Roads } from './Roads';

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

  constructor(roads?: Roads, getHeight?: (x: number, z: number) => number) {
    this.group = new THREE.Group();
    this.group.name = 'IslandBuildings';
    this.buildDistrictBuildings(roads, getHeight);
  }

  private buildDistrictBuildings(roads?: Roads, getHeight?: (x: number, z: number) => number): void {
    const textures: Record<string, THREE.CanvasTexture> = {
      skyscraper: this.generateFacadeTexture('skyscraper'),
      commercial: this.generateFacadeTexture('commercial'),
      residential: this.generateFacadeTexture('residential'),
      industrial: this.generateFacadeTexture('industrial'),
      resort: this.generateFacadeTexture('resort'),
      airport: this.generateFacadeTexture('industrial'),
    };

    const rooftopUnitMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.7,
      metalness: 0.4,
    });

    const entranceGlassMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85,
    });

    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.5,
      metalness: 0.6,
    });

    const antennaMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.85,
      roughness: 0.2,
    });

    const beaconLightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    for (const district of ISLAND_DISTRICTS) {
      const dGroup = new THREE.Group();
      dGroup.name = `District_${district.id}`;

      const count = district.buildingCount;
      const bType = district.buildingType;
      const facadeTex = textures[bType] || textures.commercial;

      for (let i = 0; i < count; i++) {
        // District block distribution
        const row = Math.floor(i / 4);
        const col = i % 4;
        let ox = (col < 2 ? -44 - (1 - col) * 36 : 44 + (col - 2) * 36);
        let oz = (row < 2 ? -44 - (1 - row) * 36 : 44 + (row - 2) * 36);

        let worldX = district.worldPos.x + ox;
        let worldZ = district.worldPos.z + oz;

        let w = 24;
        let d = 24;
        let h = 30;
        let colorHex = 0x1e293b;
        let neonHex = 0x06b6d4;

        if (bType === 'skyscraper') {
          w = 28 + (i % 3) * 6;
          d = 28 + ((i + 1) % 3) * 6;
          h = 48 + (i * 7); // 48m to 90m
          colorHex = i % 2 === 0 ? 0x090d16 : 0x172033;
          neonHex = i % 3 === 0 ? 0x06b6d4 : i % 3 === 1 ? 0x3b82f6 : 0x10b981;
        } else if (bType === 'industrial') {
          w = 36 + (i % 2) * 8;
          d = 34 + (i % 3) * 6;
          h = 16 + (i % 3) * 4;
          colorHex = 0x334155;
          neonHex = 0xf59e0b;
        } else if (bType === 'commercial') {
          w = 26 + (i % 2) * 4;
          d = 26 + (i % 3) * 4;
          h = 26 + (i % 4) * 6;
          colorHex = 0x181e28;
          neonHex = 0xec4899;
        } else if (bType === 'airport') {
          w = 44;
          d = 30;
          h = 18;
          colorHex = 0x334155;
          neonHex = 0x38bdf8;
        } else if (bType === 'resort') {
          w = 24;
          d = 24;
          h = 20 + (i % 3) * 6;
          colorHex = 0x0f172a;
          neonHex = 0x14b8a6;
        } else {
          // Residential
          w = 22 + (i % 2) * 4;
          d = 22 + (i % 2) * 4;
          h = 20 + (i % 3) * 4;
          colorHex = 0x24272e;
          neonHex = 0x8b5cf6;
        }

        // --- ROAD CLEARANCE CHECK ---
        // Ensure no building ever spawns on or overlaps the asphalt or sidewalks!
        if (roads) {
          let clearanceOk = false;
          for (let attempt = 0; attempt < 5; attempt++) {
            const roadTest = roads.getDistanceToRoad(worldX, worldZ);
            const requiredClearance = roadTest.halfWidth + Math.max(w, d) * 0.5 + 4.5;

            if (roadTest.distance >= requiredClearance) {
              clearanceOk = true;
              break;
            }

            // Push building outward away from road center
            const pushDir = new THREE.Vector2(worldX - roadTest.nearestPoint.x, worldZ - roadTest.nearestPoint.z);
            if (pushDir.lengthSq() < 0.01) {
              pushDir.set(roadTest.normal.x, roadTest.normal.z);
            }
            pushDir.normalize();

            const shift = requiredClearance - roadTest.distance + 4.0;
            worldX += pushDir.x * shift;
            worldZ += pushDir.y * shift;
          }

          if (!clearanceOk) {
            continue; // Skip building candidate if it cannot clear road or intersections
          }
        }

        const baseY = getHeight ? getHeight(worldX, worldZ) : 0;
        // Skip building if pushed off-island into water
        if (baseY < 0.2) continue;

        const bGroup = new THREE.Group();
        bGroup.position.set(worldX, 0, worldZ);

        // 1. Building Main Body (with foundation sink to prevent ground gaps)
        const foundationSink = 2.5;
        const bodyGeo = new THREE.BoxGeometry(w, h + foundationSink, d);

        const bodyMat = new THREE.MeshStandardMaterial({
          color: colorHex,
          roughness: 0.6,
          metalness: 0.35,
          map: facadeTex,
        });

        const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        bodyMesh.position.y = baseY + (h - foundationSink) / 2 + foundationSink / 2;
        bodyMesh.castShadow = true;
        bodyMesh.receiveShadow = true;
        bGroup.add(bodyMesh);

        // 2. Ground Floor Pedestrian Base & Glass Entrance Lobby
        const baseTrim = new THREE.Mesh(
          new THREE.BoxGeometry(w + 0.8, 4.2, d + 0.8),
          new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.7, metalness: 0.2 })
        );
        baseTrim.position.y = baseY + 2.1;
        baseTrim.castShadow = true;
        bGroup.add(baseTrim);

        // Front Entrance Double Glass Doors
        const entranceDoor = new THREE.Mesh(
          new THREE.BoxGeometry(w * 0.35, 3.2, 0.4),
          entranceGlassMat
        );
        entranceDoor.position.set(0, baseY + 1.6, d / 2 + 0.45);
        bGroup.add(entranceDoor);

        // Architectural Entrance Canopy Awning
        const entranceCanopy = new THREE.Mesh(
          new THREE.BoxGeometry(w * 0.45, 0.4, 3.2),
          canopyMat
        );
        entranceCanopy.position.set(0, baseY + 3.8, d / 2 + 1.8);
        entranceCanopy.castShadow = true;
        bGroup.add(entranceCanopy);

        // 3. Middle Setback / Architectural Trim Band
        if (h > 35) {
          const midTrim = new THREE.Mesh(
            new THREE.BoxGeometry(w + 0.6, 0.8, d + 0.6),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 })
          );
          midTrim.position.y = baseY + h * 0.55;
          bGroup.add(midTrim);

          // Glowing architectural neon accent line
          const neonBand = new THREE.Mesh(
            new THREE.BoxGeometry(w + 0.7, 0.35, d + 0.7),
            new THREE.MeshBasicMaterial({ color: neonHex })
          );
          neonBand.position.y = baseY + h * 0.55 + 0.55;
          bGroup.add(neonBand);
        }

        // 4. Roof Parapet Barrier Wall
        const parapet = new THREE.Mesh(
          new THREE.BoxGeometry(w + 0.4, 1.4, d + 0.4),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 })
        );
        parapet.position.y = baseY + h + 0.7;
        parapet.castShadow = true;
        bGroup.add(parapet);

        // 5. Rooftop Mechanical Features (HVAC units, elevator shafts, antennas)
        const elevatorHousing = new THREE.Mesh(
          new THREE.BoxGeometry(w * 0.35, 3.5, d * 0.35),
          rooftopUnitMat
        );
        elevatorHousing.position.set(-w * 0.15, baseY + h + 1.75, -d * 0.15);
        elevatorHousing.castShadow = true;
        bGroup.add(elevatorHousing);

        // HVAC Air Conditioner Chiller Box
        const acUnit = new THREE.Mesh(
          new THREE.BoxGeometry(4.2, 2.0, 3.0),
          rooftopUnitMat
        );
        acUnit.position.set(w * 0.2, baseY + h + 1.0, d * 0.15);
        acUnit.castShadow = true;
        bGroup.add(acUnit);

        // High-rise antenna spire with blinking red warning beacon
        if (h >= 50) {
          const antenna = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12, 0.35, 14, 8),
            antennaMat
          );
          antenna.position.set(0, baseY + h + 7.0, 0);
          antenna.castShadow = true;
          bGroup.add(antenna);

          const beacon = new THREE.Mesh(
            new THREE.SphereGeometry(0.35, 8, 8),
            beaconLightMat
          );
          beacon.position.set(0, baseY + h + 14.2, 0);
          bGroup.add(beacon);
        }

        dGroup.add(bGroup);

        // 6. Solid Physical AABB Collision Box
        const halfW = w / 2;
        const halfD = d / 2;

        this.colliders.push({
          id: `bld_${district.id}_${i}`,
          type: 'box',
          minX: worldX - halfW,
          maxX: worldX + halfW,
          minZ: worldZ - halfD,
          maxZ: worldZ + halfD,
          height: baseY + h + 2.0,
        });
      }

      this.group.add(dGroup);
    }
  }

  /**
   * Generates high-resolution multi-pane window facade textures
   * tailored to architectural styles.
   */
  private generateFacadeTexture(style: string): THREE.CanvasTexture {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return new THREE.CanvasTexture({} as any);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // 1. Wall facade background
    if (style === 'skyscraper') {
      ctx.fillStyle = '#0a101d';
    } else if (style === 'residential') {
      ctx.fillStyle = '#3a2d24'; // Warm brick tone
    } else if (style === 'industrial') {
      ctx.fillStyle = '#334155';
    } else if (style === 'resort') {
      ctx.fillStyle = '#f1f5f9';
    } else {
      ctx.fillStyle = '#1e293b';
    }
    ctx.fillRect(0, 0, 512, 512);

    // 2. High-resolution window grid
    const cols = 8;
    const rows = 8;
    const cellW = 512 / cols;
    const cellH = 512 / rows;
    const winPadX = style === 'skyscraper' ? 6 : 10;
    const winPadY = 8;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const wx = c * cellW + winPadX;
        const wy = r * cellH + winPadY;
        const ww = cellW - winPadX * 2;
        const wh = cellH - winPadY * 2;

        // Window frame border
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(wx - 1, wy - 1, ww + 2, wh + 2);

        // Glass pane color
        if (style === 'skyscraper') {
          // Reflective cyan/blue sky with interior variations
          const isInteriorLit = (r * 3 + c * 7) % 5 === 0;
          ctx.fillStyle = isInteriorLit ? '#fef08a' : (r + c) % 2 === 0 ? '#38bdf8' : '#0284c7';
        } else if (style === 'residential') {
          const isLit = (r * 2 + c * 3) % 4 === 0;
          ctx.fillStyle = isLit ? '#fde047' : '#1e3a8a';
        } else if (style === 'resort') {
          ctx.fillStyle = '#06b6d4';
        } else {
          ctx.fillStyle = '#0ea5e9';
        }
        ctx.fillRect(wx, wy, ww, wh);

        // Glass reflection diagonal highlight sheen
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.fillRect(wx, wy, ww, 4);

        // Window muntin horizontal divider
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(wx, wy + wh * 0.5, ww, 2);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    texture.needsUpdate = true;
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
