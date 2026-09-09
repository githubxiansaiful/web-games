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

function resamplePoints(points: THREE.Vector3[], maxStep: number = 14): THREE.Vector3[] {
  const result: THREE.Vector3[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const dist = p1.distanceTo(p2);
    const steps = Math.max(1, Math.ceil(dist / maxStep));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      result.push(new THREE.Vector3().lerpVectors(p1, p2, t));
    }
  }
  result.push(points[points.length - 1].clone());
  return result;
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

  private buildIslandRoads(_getHeight?: (x: number, z: number) => number): void {
    // 1. Materials
    const asphaltMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e2430, // Rich dark slate asphalt
      roughness: 0.84,
      metalness: 0.10,
    });

    const whiteLineMaterial = new THREE.MeshBasicMaterial({
      color: 0xf1f5f9, // Crisp white lane boundary paint
    });

    const yellowLineMaterial = new THREE.MeshBasicMaterial({
      color: 0xfacc15, // Vibrant highway yellow centerline paint
    });

    const curbMaterial = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // Light concrete curb stone
      roughness: 0.65,
      metalness: 0.15,
    });

    const sidewalkMaterial = new THREE.MeshStandardMaterial({
      color: 0x475569, // Clean slate pedestrian sidewalk paving
      roughness: 0.88,
      metalness: 0.05,
    });

    // 2. Geometry Buffers for High Performance (Single draw call per material)
    const roadPos: number[] = [], roadNorm: number[] = [], roadInd: number[] = [];
    let roadVO = 0;

    const whitePos: number[] = [], whiteNorm: number[] = [], whiteInd: number[] = [];
    let whiteVO = 0;

    const curbPos: number[] = [], curbNorm: number[] = [], curbInd: number[] = [];
    let curbVO = 0;

    const swPos: number[] = [], swNorm: number[] = [], swInd: number[] = [];
    let swVO = 0;

    const yellowPos: number[] = [], yellowNorm: number[] = [], yellowInd: number[] = [];
    let yellowVO = 0;

    const addRibbon = (
      pts: THREE.Vector3[],
      perps: THREE.Vector3[],
      innerOffsetFunc: (i: number) => number,
      outerOffsetFunc: (i: number) => number,
      yElev: number,
      posArr: number[],
      normArr: number[],
      indArr: number[],
      getVO: () => number,
      setVO: (v: number) => void
    ) => {
      const vOffset = getVO();
      for (let i = 0; i < pts.length; i++) {
        const curr = pts[i];
        const perp = perps[i];
        const left = curr.clone().addScaledVector(perp, innerOffsetFunc(i));
        const right = curr.clone().addScaledVector(perp, outerOffsetFunc(i));

        posArr.push(left.x, yElev, left.z, right.x, yElev, right.z);
        normArr.push(0, 1, 0, 0, 1, 0);

        if (i < pts.length - 1) {
          const base = vOffset + i * 2;
          indArr.push(base, base + 1, base + 2);
          indArr.push(base + 1, base + 3, base + 2);
        }
      }
      setVO(vOffset + pts.length * 2);
    };

    // Junction Map to place circular asphalt plaza pads at all connecting intersections
    const junctionMap = new Map<string, { x: number; z: number; radius: number }>();

    for (const segment of this.roadSegments) {
      const rawPoints = segment.points.map((pt) => {
        const w = svgToWorld(pt.x, pt.y);
        return new THREE.Vector3(w.x, 0.03, w.z);
      });

      if (rawPoints.length < 2) continue;

      const pts = resamplePoints(rawPoints, 14);
      const halfW = segment.width / 2;

      this.roadRibbons.push({ worldPoints: pts, halfW, isBridge: false });

      // Track junctions
      const endPts = [segment.points[0], segment.points[segment.points.length - 1]];
      for (const ep of endPts) {
        const ew = svgToWorld(ep.x, ep.y);
        const key = `${Math.round(ew.x)},${Math.round(ew.z)}`;
        const cur = junctionMap.get(key);
        if (!cur) {
          junctionMap.set(key, { x: ew.x, z: ew.z, radius: halfW });
        } else {
          cur.radius = Math.max(cur.radius, halfW);
        }
      }

      // Pre-calculate tangents and perpendicular normals on XZ plane
      const perps: THREE.Vector3[] = [];
      for (let i = 0; i < pts.length; i++) {
        const curr = pts[i];
        let tangent = new THREE.Vector3();
        if (i === 0) {
          tangent.subVectors(pts[1], curr).normalize();
        } else if (i === pts.length - 1) {
          tangent.subVectors(curr, pts[i - 1]).normalize();
        } else {
          tangent.subVectors(pts[i + 1], pts[i - 1]).normalize();
        }
        perps.push(new THREE.Vector3(-tangent.z, 0, tangent.x).normalize());
      }

      // 1. Asphalt Road Ribbon (Y = 0.03)
      addRibbon(pts, perps, () => -halfW, () => halfW, 0.03, roadPos, roadNorm, roadInd, () => roadVO, (v) => (roadVO = v));

      // 2. White Shoulder Outer Lane Lines (Y = 0.034)
      addRibbon(pts, perps, () => -halfW + 0.35, () => -halfW + 0.55, 0.034, whitePos, whiteNorm, whiteInd, () => whiteVO, (v) => (whiteVO = v));
      addRibbon(pts, perps, () => halfW - 0.55, () => halfW - 0.35, 0.034, whitePos, whiteNorm, whiteInd, () => whiteVO, (v) => (whiteVO = v));

      // 3. Concrete Curbs (Y = 0.045)
      const curbW = 0.35;
      addRibbon(pts, perps, () => -halfW - curbW, () => -halfW, 0.045, curbPos, curbNorm, curbInd, () => curbVO, (v) => (curbVO = v));
      addRibbon(pts, perps, () => halfW, () => halfW + curbW, 0.045, curbPos, curbNorm, curbInd, () => curbVO, (v) => (curbVO = v));

      // 4. Sidewalks (Y = 0.045)
      const swW = 2.6;
      addRibbon(pts, perps, () => -halfW - curbW - swW, () => -halfW - curbW, 0.045, swPos, swNorm, swInd, () => swVO, (v) => (swVO = v));
      addRibbon(pts, perps, () => halfW + curbW, () => halfW + curbW + swW, 0.045, swPos, swNorm, swInd, () => swVO, (v) => (swVO = v));

      // 5. Yellow Dashed Centerlines (Y = 0.038)
      const cumDists = [0];
      for (let i = 0; i < pts.length - 1; i++) {
        cumDists.push(cumDists[i] + pts[i].distanceTo(pts[i + 1]));
      }
      const totalLen = cumDists[cumDists.length - 1];
      const period = 6.0;
      const numDashes = Math.floor(totalLen / period);

      let curIdx = 0;
      for (let d = 0; d < numDashes; d++) {
        const targetDist = (d + 0.5) * period;
        while (curIdx < cumDists.length - 2 && cumDists[curIdx + 1] < targetDist) {
          curIdx++;
        }
        const p1 = pts[curIdx];
        const p2 = pts[curIdx + 1];
        const segSpan = cumDists[curIdx + 1] - cumDists[curIdx];
        const alpha = segSpan > 0.001 ? (targetDist - cumDists[curIdx]) / segSpan : 0;
        const center = new THREE.Vector3().lerpVectors(p1, p2, alpha);
        const tangent = new THREE.Vector3().subVectors(p2, p1).normalize();
        const perp = new THREE.Vector3(-tangent.z, 0, tangent.x);

        const hw = 0.175; // 35cm dash width
        const hl = 1.5;   // 3m dash length
        const c0 = center.clone().addScaledVector(perp, -hw).addScaledVector(tangent, -hl);
        const c1 = center.clone().addScaledVector(perp, hw).addScaledVector(tangent, -hl);
        const c2 = center.clone().addScaledVector(perp, hw).addScaledVector(tangent, hl);
        const c3 = center.clone().addScaledVector(perp, -hw).addScaledVector(tangent, hl);

        const base = yellowVO;
        yellowPos.push(c0.x, 0.038, c0.z, c1.x, 0.038, c1.z, c2.x, 0.038, c2.z, c3.x, 0.038, c3.z);
        yellowNorm.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
        yellowInd.push(base, base + 1, base + 2, base, base + 2, base + 3);
        yellowVO += 4;
      }
    }

    // 6. Assemble and Add Combined Meshes
    // Road Asphalt
    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadPos, 3));
    roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(roadNorm, 3));
    roadGeo.setIndex(roadInd);
    const roadMesh = new THREE.Mesh(roadGeo, asphaltMaterial);
    roadMesh.receiveShadow = true;
    this.group.add(roadMesh);

    // Junction Asphalt Discs (Seals all intersection connections seamlessly)
    for (const junc of junctionMap.values()) {
      const juncGeo = new THREE.CircleGeometry(junc.radius + 0.3, 32);
      juncGeo.rotateX(-Math.PI / 2);
      const juncMesh = new THREE.Mesh(juncGeo, asphaltMaterial);
      juncMesh.position.set(junc.x, 0.028, junc.z);
      juncMesh.receiveShadow = true;
      this.group.add(juncMesh);
    }

    // White Edge Lines
    if (whitePos.length > 0) {
      const whiteGeo = new THREE.BufferGeometry();
      whiteGeo.setAttribute('position', new THREE.Float32BufferAttribute(whitePos, 3));
      whiteGeo.setAttribute('normal', new THREE.Float32BufferAttribute(whiteNorm, 3));
      whiteGeo.setIndex(whiteInd);
      const whiteMesh = new THREE.Mesh(whiteGeo, whiteLineMaterial);
      this.group.add(whiteMesh);
    }

    // Yellow Dashed Centerlines
    if (yellowPos.length > 0) {
      const yellowGeo = new THREE.BufferGeometry();
      yellowGeo.setAttribute('position', new THREE.Float32BufferAttribute(yellowPos, 3));
      yellowGeo.setAttribute('normal', new THREE.Float32BufferAttribute(yellowNorm, 3));
      yellowGeo.setIndex(yellowInd);
      const yellowMesh = new THREE.Mesh(yellowGeo, yellowLineMaterial);
      this.group.add(yellowMesh);
    }

    // Curbs
    if (curbPos.length > 0) {
      const curbGeo = new THREE.BufferGeometry();
      curbGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbPos, 3));
      curbGeo.setAttribute('normal', new THREE.Float32BufferAttribute(curbNorm, 3));
      curbGeo.setIndex(curbInd);
      const curbMesh = new THREE.Mesh(curbGeo, curbMaterial);
      curbMesh.receiveShadow = true;
      this.group.add(curbMesh);
    }

    // Sidewalks
    if (swPos.length > 0) {
      const swGeo = new THREE.BufferGeometry();
      swGeo.setAttribute('position', new THREE.Float32BufferAttribute(swPos, 3));
      swGeo.setAttribute('normal', new THREE.Float32BufferAttribute(swNorm, 3));
      swGeo.setIndex(swInd);
      const swMesh = new THREE.Mesh(swGeo, sidewalkMaterial);
      swMesh.receiveShadow = true;
      this.group.add(swMesh);
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

  public getBridgeElevation(_x: number, _z: number): number {
    return 0.03;
  }
}
