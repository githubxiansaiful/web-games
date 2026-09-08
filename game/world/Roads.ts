import * as THREE from 'three';
import { getIslandRoadNetwork, svgToWorld, RoadSegment } from '../data/islandMapData';

export interface RoadRibbon {
  worldPoints: THREE.Vector3[];
  halfW: number;
  isBridge: boolean;
}

export interface RoadDistanceResult {
  distance: number;
  halfWidth: number;
  isBridge: boolean;
  nearestPoint: THREE.Vector3;
  tangent: THREE.Vector3;
  normal: THREE.Vector3;
}

export class Roads {
  public group: THREE.Group;
  public roadSegments: RoadSegment[];
  public roadRibbons: RoadRibbon[] = [];
  private bridgeSegments: Array<{ worldPoints: THREE.Vector3[]; halfW: number }> = [];

  constructor(getHeight?: (x: number, z: number) => number) {
    this.group = new THREE.Group();
    this.group.name = 'IslandRoads';
    this.roadSegments = getIslandRoadNetwork();
    this.buildIslandRoads(getHeight);
  }

  private buildIslandRoads(getHeight?: (x: number, z: number) => number): void {
    const asphaltMaterial = new THREE.MeshStandardMaterial({
      color: 0x181e28,
      roughness: 0.82,
      metalness: 0.12,
    });

    const yellowLineMaterial = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
    });

    const curbMaterial = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.75,
      metalness: 0.2,
    });

    const sidewalkMaterial = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.88,
      metalness: 0.05,
    });

    const bridgePierMaterial = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.7,
      metalness: 0.3,
    });

    const guardrailMaterial = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.8,
      roughness: 0.3,
    });

    for (const segment of this.roadSegments) {
      const worldPoints: THREE.Vector3[] = [];
      const count = segment.points.length;

      for (let i = 0; i < count; i++) {
        const pt = segment.points[i];
        const w = svgToWorld(pt.x, pt.y);
        const groundY = getHeight ? getHeight(w.x, w.z) : 0;

        let elevation = groundY + 0.08;
        if (segment.isBridge) {
          const t = i / (count - 1);
          // Arch elevation profile (up to 8m in center, anchored to coastal ground)
          const archH = Math.sin(t * Math.PI) * 8.0;
          elevation = Math.max(groundY + 0.1, archH + 0.3);
        }

        worldPoints.push(new THREE.Vector3(w.x, elevation, w.z));
      }

      if (worldPoints.length < 2) continue;

      const halfW = segment.width / 2;
      this.roadRibbons.push({ worldPoints, halfW, isBridge: segment.isBridge });

      if (segment.isBridge) {
        this.bridgeSegments.push({ worldPoints, halfW });
      }

      // Pre-calculate per-point tangents and perpendicular normals on XZ plane
      const perps: THREE.Vector3[] = [];
      for (let i = 0; i < worldPoints.length; i++) {
        const curr = worldPoints[i];
        let tangent = new THREE.Vector3();

        if (i === 0) {
          tangent.subVectors(worldPoints[1], curr).normalize();
        } else if (i === worldPoints.length - 1) {
          tangent.subVectors(curr, worldPoints[i - 1]).normalize();
        } else {
          tangent.subVectors(worldPoints[i + 1], worldPoints[i - 1]).normalize();
        }

        perps.push(new THREE.Vector3(-tangent.z, 0, tangent.x).normalize());
      }

      // 1. Build Smooth Continuous Road Asphalt Ribbon
      const positions: number[] = [];
      const normals: number[] = [];
      const uvs: number[] = [];
      const indices: number[] = [];

      let totalDist = 0;

      for (let i = 0; i < worldPoints.length; i++) {
        const curr = worldPoints[i];
        const perp = perps[i];

        const left = curr.clone().addScaledVector(perp, -halfW);
        const right = curr.clone().addScaledVector(perp, halfW);

        positions.push(left.x, left.y, left.z);
        positions.push(right.x, right.y, right.z);

        normals.push(0, 1, 0, 0, 1, 0);

        if (i > 0) {
          totalDist += curr.distanceTo(worldPoints[i - 1]);
        }
        uvs.push(0, totalDist * 0.1, 1, totalDist * 0.1);

        if (i < worldPoints.length - 1) {
          const base = i * 2;
          indices.push(base, base + 1, base + 2);
          indices.push(base + 1, base + 3, base + 2);
        }
      }

      const roadGeo = new THREE.BufferGeometry();
      roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      roadGeo.setIndex(indices);

      const roadMesh = new THREE.Mesh(roadGeo, asphaltMaterial);
      roadMesh.receiveShadow = true;
      this.group.add(roadMesh);

      // 2. Build Realistic Concrete Curbs & Sidewalks (for land roads)
      if (!segment.isBridge) {
        const sidewalkW = 2.8;
        const curbW = 0.35;
        const curbLift = 0.12;

        // Both sides: -1 (left), +1 (right)
        for (const side of [-1, 1]) {
          const swPositions: number[] = [];
          const swNormals: number[] = [];
          const swUvs: number[] = [];
          const swIndices: number[] = [];

          for (let i = 0; i < worldPoints.length; i++) {
            const curr = worldPoints[i];
            const perp = perps[i];

            // Inner edge of sidewalk (curb edge adjacent to asphalt)
            const innerOff = side * halfW;
            const outerOff = side * (halfW + curbW + sidewalkW);

            const innerPt = curr.clone().addScaledVector(perp, innerOff);
            innerPt.y += curbLift;

            const outerPt = curr.clone().addScaledVector(perp, outerOff);
            outerPt.y += curbLift;

            swPositions.push(innerPt.x, innerPt.y, innerPt.z);
            swPositions.push(outerPt.x, outerPt.y, outerPt.z);

            swNormals.push(0, 1, 0, 0, 1, 0);
            swUvs.push(0, totalDist * 0.2, 1, totalDist * 0.2);

            if (i < worldPoints.length - 1) {
              const base = i * 2;
              swIndices.push(base, base + 1, base + 2);
              swIndices.push(base + 1, base + 3, base + 2);
            }
          }

          const swGeo = new THREE.BufferGeometry();
          swGeo.setAttribute('position', new THREE.Float32BufferAttribute(swPositions, 3));
          swGeo.setAttribute('normal', new THREE.Float32BufferAttribute(swNormals, 3));
          swGeo.setAttribute('uv', new THREE.Float32BufferAttribute(swUvs, 2));
          swGeo.setIndex(swIndices);

          const swMesh = new THREE.Mesh(swGeo, sidewalkMaterial);
          swMesh.receiveShadow = true;
          this.group.add(swMesh);
        }
      }

      // 3. Yellow Dashed Centerlines
      for (let i = 0; i < worldPoints.length - 1; i += 2) {
        const p1 = worldPoints[i];
        const p2 = worldPoints[Math.min(i + 1, worldPoints.length - 1)];
        const mid = p1.clone().lerp(p2, 0.5);
        const dir = p2.clone().sub(p1);
        const len = dir.length();
        if (len < 0.2) continue;

        const dashGeo = new THREE.PlaneGeometry(0.35, len * 0.65);
        const dashMesh = new THREE.Mesh(dashGeo, yellowLineMaterial);
        dashMesh.rotation.x = -Math.PI / 2;
        dashMesh.rotation.z = -Math.atan2(dir.x, dir.z);
        dashMesh.position.set(mid.x, mid.y + 0.02, mid.z);
        this.group.add(dashMesh);
      }

      // 4. Bridge Pillars and Guardrails if bridge
      if (segment.isBridge) {
        for (let i = 1; i < worldPoints.length - 1; i += 3) {
          const p = worldPoints[i];
          if (p.y > 1.5) {
            // Support pier down to water/ocean bed
            const pierGeo = new THREE.BoxGeometry(2.4, p.y + 2, 2.4);
            const pier = new THREE.Mesh(pierGeo, bridgePierMaterial);
            pier.position.set(p.x, (p.y - 2) / 2, p.z);
            pier.castShadow = true;
            this.group.add(pier);
          }
        }

        // Bridge side concrete guardrails
        for (let side = -1; side <= 1; side += 2) {
          const railPositions: number[] = [];
          for (let i = 0; i < worldPoints.length; i++) {
            const curr = worldPoints[i];
            const perp = perps[i];
            const railPos = curr.clone().addScaledVector(perp, side * (halfW + 0.3));
            railPositions.push(railPos.x, railPos.y + 0.6, railPos.z);
          }

          if (railPositions.length >= 6) {
            const railCurve = new THREE.CatmullRomCurve3(
              worldPoints.map((_, idx) => new THREE.Vector3(
                railPositions[idx * 3],
                railPositions[idx * 3 + 1],
                railPositions[idx * 3 + 2]
              ))
            );
            const railGeo = new THREE.TubeGeometry(railCurve, 32, 0.25, 6, false);
            const railMesh = new THREE.Mesh(railGeo, guardrailMaterial);
            railMesh.castShadow = true;
            this.group.add(railMesh);
          }
        }
      }
    }
  }

  /**
   * Fast 2D query returning distance from (x, z) to nearest road centerline,
   * road width, nearest point on road, and outward normal vector.
   */
  public getDistanceToRoad(x: number, z: number): RoadDistanceResult {
    let minDistance = 999999;
    let minHalfWidth = 8;
    let isBridge = false;
    let nearestPoint = new THREE.Vector3();
    let bestTangent = new THREE.Vector3(1, 0, 0);
    let bestNormal = new THREE.Vector3(0, 0, 1);

    for (const ribbon of this.roadRibbons) {
      const pts = ribbon.worldPoints;
      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const dx = p2.x - p1.x;
        const dz = p2.z - p1.z;
        const lenSq = dx * dx + dz * dz;
        if (lenSq < 0.001) continue;

        const t = Math.max(0, Math.min(1, ((x - p1.x) * dx + (z - p1.z) * dz) / lenSq));
        const projX = p1.x + t * dx;
        const projY = p1.y + t * (p2.y - p1.y);
        const projZ = p1.z + t * dz;

        const distSq = (x - projX) * (x - projX) + (z - projZ) * (z - projZ);
        const dist = Math.sqrt(distSq);

        if (dist < minDistance) {
          minDistance = dist;
          minHalfWidth = ribbon.halfW;
          isBridge = ribbon.isBridge;
          nearestPoint.set(projX, projY, projZ);

          const len = Math.sqrt(lenSq);
          bestTangent.set(dx / len, (p2.y - p1.y) / len, dz / len);
          bestNormal.set(-bestTangent.z, 0, bestTangent.x);
        }
      }
    }

    return {
      distance: minDistance,
      halfWidth: minHalfWidth,
      isBridge,
      nearestPoint,
      tangent: bestTangent,
      normal: bestNormal,
    };
  }

  public getBridgeElevation(x: number, z: number): number {
    for (const bridge of this.bridgeSegments) {
      const pts = bridge.worldPoints;
      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const dx = p2.x - p1.x;
        const dz = p2.z - p1.z;
        const lenSq = dx * dx + dz * dz;
        if (lenSq < 0.01) continue;

        const t = Math.max(0, Math.min(1, ((x - p1.x) * dx + (z - p1.z) * dz) / lenSq));
        const projX = p1.x + t * dx;
        const projZ = p1.z + t * dz;
        const distSq = (x - projX) * (x - projX) + (z - projZ) * (z - projZ);

        if (distSq <= (bridge.halfW + 1.2) * (bridge.halfW + 1.2)) {
          return p1.y + t * (p2.y - p1.y);
        }
      }
    }
    return 0;
  }
}
