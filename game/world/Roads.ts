import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
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

interface MultiJunction {
  x: number;
  z: number;
  radius: number;
  isCentralRoundabout?: boolean;
}

/**
 * All major multi-way intersections across the island network.
 * Approaching roads are trimmed at `radius`, stopping curbs and sidewalks
 * outside the junction plaza and placing clean pedestrian crossings and stop bars.
 */
const MULTI_JUNCTIONS: MultiJunction[] = [
  // 1. Central City 5-Way Grand Junction (road-3, road-4, road-13, road-18, bridge-6)
  { x: 0, z: -22, radius: 21.0, isCentralRoundabout: true },

  // 2. 3-Way Highway Arterial Intersections across all districts
  { x: 15, z: 188, radius: 15.0 },     // Southbridge junction (road-2, road-3, road-16)
  { x: -220, z: 248, radius: 15.0 },   // West End junction (road-1, road-2, road-17)
  { x: -215, z: 65, radius: 15.0 },    // Riverside junction (road-4, road-5, road-8)
  { x: 45, z: -248, radius: 15.0 },    // Caldera / Mountain junction (road-9, road-10, road-11)
  { x: 280, z: 108, radius: 15.0 },    // Harborview junction (bridge-2, bridge-6, road-15)
  { x: 280, z: -58, radius: 15.0 },    // Oak Heights junction (road-13, road-14, road-15)
  { x: 335, z: 278, radius: 15.0 },    // Sunset Bay junction (bridge-2, bridge-3, bridge-4)
  { x: -445, z: 100, radius: 15.0 },   // Pacific Bluffs junction (road-6, road-7)
  { x: -515, z: 318, radius: 15.0 },   // Airport Parkway junction (road-1, road-7)
];

function resamplePoints(points: THREE.Vector3[], maxStep: number = 6): THREE.Vector3[] {
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

function samplePointsInRange(
  pts: THREE.Vector3[],
  cumDists: number[],
  dStart: number,
  dEnd: number,
  step: number = 6
): { points: THREE.Vector3[]; perps: THREE.Vector3[]; dists: number[] } {
  const result: THREE.Vector3[] = [];
  const dists: number[] = [];
  const totalLen = cumDists[cumDists.length - 1];
  const clampedStart = Math.max(0, Math.min(totalLen, dStart));
  const clampedEnd = Math.max(clampedStart + 0.1, Math.min(totalLen, dEnd));
  const span = clampedEnd - clampedStart;
  const numSteps = Math.max(2, Math.ceil(span / step));

  for (let s = 0; s <= numSteps; s++) {
    const d = clampedStart + (s / numSteps) * span;
    let curIdx = 0;
    while (curIdx < cumDists.length - 2 && cumDists[curIdx + 1] < d) {
      curIdx++;
    }
    const segSpan = cumDists[curIdx + 1] - cumDists[curIdx];
    const alpha = segSpan > 0.0001 ? (d - cumDists[curIdx]) / segSpan : 0;
    result.push(new THREE.Vector3().lerpVectors(pts[curIdx], pts[curIdx + 1], alpha));
    dists.push(d);
  }

  const perps: THREE.Vector3[] = [];
  for (let i = 0; i < result.length; i++) {
    const curr = result[i];
    let tangent = new THREE.Vector3();
    if (i === 0) {
      tangent.subVectors(result[1], curr).normalize();
    } else if (i === result.length - 1) {
      tangent.subVectors(curr, result[i - 1]).normalize();
    } else {
      tangent.subVectors(result[i + 1], result[i - 1]).normalize();
    }
    perps.push(new THREE.Vector3(-tangent.z, 0, tangent.x).normalize());
  }

  return { points: result, perps, dists };
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
    this.loadStreetFurniture();
  }

  private buildIslandRoads(_getHeight?: (x: number, z: number) => number): void {
    const texLoader = new THREE.TextureLoader();

    // 1. PBR Road Textures
    // Master Road Surface Texture (dark asphalt, tire wear, white edge lines, double yellow centerline, beveled curb, slate sidewalk)
    const roadTexture = texLoader.load('/textures/roads/road_surface.png');
    roadTexture.wrapS = THREE.ClampToEdgeWrapping;
    roadTexture.wrapT = THREE.RepeatWrapping;
    roadTexture.colorSpace = THREE.SRGBColorSpace;
    roadTexture.generateMipmaps = true;
    roadTexture.anisotropy = 16;

    // Clean Matching Asphalt Texture for Intersection Plazas
    const asphaltTexture = texLoader.load('/textures/roads/asphalt_clean.png');
    asphaltTexture.wrapS = THREE.RepeatWrapping;
    asphaltTexture.wrapT = THREE.RepeatWrapping;
    asphaltTexture.colorSpace = THREE.SRGBColorSpace;
    asphaltTexture.generateMipmaps = true;
    asphaltTexture.anisotropy = 16;

    // 2. High-Performance PBR Materials
    const roadMaterial = new THREE.MeshStandardMaterial({
      map: roadTexture,
      roughness: 0.82,
      metalness: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: -1.0,
      polygonOffsetUnits: -2.0,
    });

    const intersectionMaterial = new THREE.MeshStandardMaterial({
      map: asphaltTexture,
      roughness: 0.82,
      metalness: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: -1.0,
      polygonOffsetUnits: -2.0,
    });

    const whitePaintMaterial = new THREE.MeshBasicMaterial({
      color: 0xf8fafc,
      polygonOffset: true,
      polygonOffsetFactor: -2.0,
      polygonOffsetUnits: -4.0,
    });

    const curbStoneMaterial = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.65,
      metalness: 0.12,
      polygonOffset: true,
      polygonOffsetFactor: -1.5,
      polygonOffsetUnits: -3.0,
    });

    const islandGrassMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e3a24,
      roughness: 0.92,
      metalness: 0.04,
    });

    // 3. Geometry Buffers
    // Master Textured Road Mesh (Continuous 3D profile with UVs)
    const roadPos: number[] = [], roadNorm: number[] = [], roadUv: number[] = [], roadInd: number[] = [];
    let roadVO = 0;

    // Asphalt Underlap Mesh (Prevents any seams between roads and intersection plazas)
    const underPos: number[] = [], underNorm: number[] = [], underUv: number[] = [], underInd: number[] = [];
    let underVO = 0;

    // White Intersection Markings (Stop bars & Zebra pedestrian crossings)
    const whitePos: number[] = [], whiteNorm: number[] = [], whiteInd: number[] = [];
    let whiteVO = 0;

    // Curb End-Caps (Seals sidewalk ends at intersection entrances)
    const curbPos: number[] = [], curbNorm: number[] = [], curbInd: number[] = [];
    let curbVO = 0;

    const addQuad = (
      c0: THREE.Vector3,
      c1: THREE.Vector3,
      c2: THREE.Vector3,
      c3: THREE.Vector3,
      yElev: number,
      posArr: number[],
      normArr: number[],
      indArr: number[],
      getVO: () => number,
      setVO: (v: number) => void
    ) => {
      const base = getVO();
      posArr.push(c0.x, yElev, c0.z, c1.x, yElev, c1.z, c2.x, yElev, c2.z, c3.x, yElev, c3.z);
      normArr.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
      indArr.push(base, base + 1, base + 2, base, base + 2, base + 3);
      setVO(base + 4);
    };

    // 4. Process Every Road Segment in Island Network
    for (const segment of this.roadSegments) {
      const rawPoints = segment.points.map((pt) => {
        const w = svgToWorld(pt.x, pt.y);
        return new THREE.Vector3(w.x, 0, w.z);
      });

      if (rawPoints.length < 2) continue;

      const pts = resamplePoints(rawPoints, 6);
      const halfW = segment.width / 2;
      const curbW = 0.40;  // 40cm beveled concrete curb
      const swW = 2.40;    // 2.4m paved pedestrian sidewalk
      const totalHalfW = halfW + curbW + swW;

      this.roadRibbons.push({ worldPoints: pts, halfW, isBridge: false });

      const cumDists = [0];
      for (let i = 0; i < pts.length - 1; i++) {
        cumDists.push(cumDists[i] + pts[i].distanceTo(pts[i + 1]));
      }
      const totalLen = cumDists[cumDists.length - 1];

      // Check if start or end touches a multi-way junction
      let startCut = 0;
      for (const j of MULTI_JUNCTIONS) {
        if (Math.hypot(pts[0].x - j.x, pts[0].z - j.z) < 8.0) {
          startCut = j.radius;
          break;
        }
      }

      let endCut = 0;
      const lastPt = pts[pts.length - 1];
      for (const j of MULTI_JUNCTIONS) {
        if (Math.hypot(lastPt.x - j.x, lastPt.z - j.z) < 8.0) {
          endCut = j.radius;
          break;
        }
      }

      const dStart = Math.min(startCut, totalLen * 0.45);
      const dEnd = Math.max(totalLen - endCut, dStart + 2.0);

      // A. Seamless Asphalt Underlap: Extends 2.5m into intersection plazas to guarantee 100% gapless connection
      const underSpan = samplePointsInRange(
        pts,
        cumDists,
        Math.max(0, dStart - 2.5),
        Math.min(totalLen, dEnd + 2.5),
        6
      );
      if (underSpan.points.length >= 2) {
        const uVO = underVO;
        const uPts = underSpan.points;
        const uPerps = underSpan.perps;
        const uDists = underSpan.dists;

        for (let i = 0; i < uPts.length; i++) {
          const curr = uPts[i];
          const perp = uPerps[i];
          const left = curr.clone().addScaledVector(perp, -halfW - 0.5);
          const right = curr.clone().addScaledVector(perp, halfW + 0.5);
          const v = uDists[i] / 8.0;

          underPos.push(left.x, 0.029, left.z, right.x, 0.029, right.z);
          underNorm.push(0, 1, 0, 0, 1, 0);
          underUv.push(0, v, 1, v);

          if (i < uPts.length - 1) {
            const base = uVO + i * 2;
            underInd.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
          }
        }
        underVO = uVO + uPts.length * 2;
      }

      // B. Master Road Surface (Full 3D stepped cross-section with PBR texture coordinates)
      // Sidewalks & curbs run strictly between dStart and dEnd (never invading intersection plazas)
      const roadSpan = samplePointsInRange(pts, cumDists, dStart, dEnd, 6);
      const sPts = roadSpan.points;
      const sPerps = roadSpan.perps;
      const sDists = roadSpan.dists;

      if (sPts.length >= 2) {
        const rVO = roadVO;

        for (let i = 0; i < sPts.length; i++) {
          const curr = sPts[i];
          const perp = sPerps[i];
          const v = sDists[i] / 8.0; // repeats every 8 meters along road

          // 6 Cross-section profile points across the road:
          // P0: Left Sidewalk Outer
          const p0 = curr.clone().addScaledVector(perp, -totalHalfW);
          // P1: Left Sidewalk Inner / Curb Top
          const p1 = curr.clone().addScaledVector(perp, -(halfW + curbW));
          // P2: Left Curb Bottom / Road Edge
          const p2 = curr.clone().addScaledVector(perp, -halfW);
          // P3: Right Curb Bottom / Road Edge
          const p3 = curr.clone().addScaledVector(perp, halfW);
          // P4: Right Sidewalk Inner / Curb Top
          const p4 = curr.clone().addScaledVector(perp, halfW + curbW);
          // P5: Right Sidewalk Outer
          const p5 = curr.clone().addScaledVector(perp, totalHalfW);

          // Positions: Physical 3D elevations (Sidewalks at 4.5cm, Road at 3.0cm)
          roadPos.push(
            p0.x, 0.045, p0.z,
            p1.x, 0.045, p1.z,
            p2.x, 0.030, p2.z,
            p3.x, 0.030, p3.z,
            p4.x, 0.045, p4.z,
            p5.x, 0.045, p5.z
          );

          roadNorm.push(
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0
          );

          // Texture coordinates mapped across the profile layout:
          // [0.00: Left Sidewalk, 0.12: Curb Top, 0.145: Road Edge,
          //  0.855: Road Edge, 0.88: Curb Top, 1.00: Right Sidewalk]
          roadUv.push(
            0.000, v,
            0.120, v,
            0.145, v,
            0.855, v,
            0.880, v,
            1.000, v
          );

          // Quads connecting step i to step i + 1
          if (i < sPts.length - 1) {
            const b0 = rVO + i * 6;
            const b1 = rVO + (i + 1) * 6;

            for (let s = 0; s < 5; s++) {
              roadInd.push(
                b0 + s, b1 + s, b1 + s + 1,
                b0 + s, b1 + s + 1, b0 + s + 1
              );
            }
          }
        }

        roadVO = rVO + sPts.length * 6;

        // C. Clean Intersection Entrances: Stop Bars, Zebra Crossings, and Curb End-Caps
        const entranceConfigs = [
          { pt: sPts[0], perp: sPerps[0], tangDir: 1, active: startCut > 0 },
          { pt: sPts[sPts.length - 1], perp: sPerps[sPerps.length - 1], tangDir: -1, active: endCut > 0 },
        ];

        for (const ec of entranceConfigs) {
          if (!ec.active) continue;
          // Tangent vector pointing into the junction plaza
          const tang = new THREE.Vector3(ec.perp.z, 0, -ec.perp.x).multiplyScalar(ec.tangDir);

          // 1. Concrete Curb End-Caps sealing the sidewalk ends
          const l1 = ec.pt.clone().addScaledVector(ec.perp, -totalHalfW);
          const l2 = ec.pt.clone().addScaledVector(ec.perp, -halfW);
          const l3 = l2.clone().addScaledVector(tang, 0.35);
          const l4 = l1.clone().addScaledVector(tang, 0.35);
          addQuad(l1, l2, l3, l4, 0.045, curbPos, curbNorm, curbInd, () => curbVO, (v) => (curbVO = v));

          const r1 = ec.pt.clone().addScaledVector(ec.perp, halfW);
          const r2 = ec.pt.clone().addScaledVector(ec.perp, totalHalfW);
          const r3 = r2.clone().addScaledVector(tang, 0.35);
          const r4 = r1.clone().addScaledVector(tang, 0.35);
          addQuad(r1, r2, r3, r4, 0.045, curbPos, curbNorm, curbInd, () => curbVO, (v) => (curbVO = v));

          // 2. Stop Bar across the roadway entrance
          const stopCenter = ec.pt.clone().addScaledVector(tang, 0.8);
          const sb0 = stopCenter.clone().addScaledVector(ec.perp, -halfW + 0.4).addScaledVector(tang, -0.22);
          const sb1 = stopCenter.clone().addScaledVector(ec.perp, halfW - 0.4).addScaledVector(tang, -0.22);
          const sb2 = stopCenter.clone().addScaledVector(ec.perp, halfW - 0.4).addScaledVector(tang, 0.22);
          const sb3 = stopCenter.clone().addScaledVector(ec.perp, -halfW + 0.4).addScaledVector(tang, 0.22);
          addQuad(sb0, sb1, sb2, sb3, 0.034, whitePos, whiteNorm, whiteInd, () => whiteVO, (v) => (whiteVO = v));

          // 3. Pedestrian Zebra Crossing Stripes
          const zebraCenter = ec.pt.clone().addScaledVector(tang, -2.4);
          const stripeW = 0.55;
          const stripeL = 3.2;
          const period = 1.1;
          const numStripes = Math.floor((halfW * 2 - 1.8) / period);
          for (let s = 0; s < numStripes; s++) {
            const off = -(numStripes - 1) * period * 0.5 + s * period;
            const sc = zebraCenter.clone().addScaledVector(ec.perp, off);
            const z0 = sc.clone().addScaledVector(ec.perp, -stripeW / 2).addScaledVector(tang, -stripeL / 2);
            const z1 = sc.clone().addScaledVector(ec.perp, stripeW / 2).addScaledVector(tang, -stripeL / 2);
            const z2 = sc.clone().addScaledVector(ec.perp, stripeW / 2).addScaledVector(tang, stripeL / 2);
            const z3 = sc.clone().addScaledVector(ec.perp, -stripeW / 2).addScaledVector(tang, stripeL / 2);
            addQuad(z0, z1, z2, z3, 0.034, whitePos, whiteNorm, whiteInd, () => whiteVO, (v) => (whiteVO = v));
          }
        }
      }
    }

    // 5. Multi-Way Intersection Plazas (Seamless matching asphalt & open geometry)
    for (const junc of MULTI_JUNCTIONS) {
      if (junc.isCentralRoundabout) {
        // Grand Central 5-Way Roundabout at (0, -22)
        const rCenter = new THREE.Vector3(junc.x, 0.03, junc.z);
        const rOuter = junc.radius; // 21.0m
        const rInner = 6.0;

        // Circulating PBR Asphalt Ring
        const ringGeo = new THREE.RingGeometry(rInner, rOuter, 64);
        ringGeo.rotateX(-Math.PI / 2);
        // Map UVs to world coordinates for seamless asphalt texture
        const ringPos = ringGeo.attributes.position;
        const ringUvs = new Float32Array(ringPos.count * 2);
        for (let i = 0; i < ringPos.count; i++) {
          ringUvs[i * 2] = (ringPos.getX(i) + rCenter.x) / 8.0;
          ringUvs[i * 2 + 1] = (ringPos.getZ(i) + rCenter.z) / 8.0;
        }
        ringGeo.setAttribute('uv', new THREE.BufferAttribute(ringUvs, 2));

        const ringMesh = new THREE.Mesh(ringGeo, intersectionMaterial);
        ringMesh.position.set(rCenter.x, 0.0305, rCenter.z);
        ringMesh.receiveShadow = true;
        this.group.add(ringMesh);

        // Raised Central Island Curb
        const islandCurbGeo = new THREE.RingGeometry(rInner - 0.5, rInner, 64);
        islandCurbGeo.rotateX(-Math.PI / 2);
        const islandCurbMesh = new THREE.Mesh(islandCurbGeo, curbStoneMaterial);
        islandCurbMesh.position.set(rCenter.x, 0.055, rCenter.z);
        islandCurbMesh.receiveShadow = true;
        this.group.add(islandCurbMesh);

        // Landscaped Central Island Green Lawn
        const islandGrassGeo = new THREE.CircleGeometry(rInner - 0.5, 64);
        islandGrassGeo.rotateX(-Math.PI / 2);
        const islandGrassMesh = new THREE.Mesh(islandGrassGeo, islandGrassMaterial);
        islandGrassMesh.position.set(rCenter.x, 0.050, rCenter.z);
        islandGrassMesh.receiveShadow = true;
        this.group.add(islandGrassMesh);

        // Circulating Dashed White Lane Guide at R = 12.5m
        const rGuide = 12.5;
        const guideDashCount = 28;
        for (let i = 0; i < guideDashCount; i++) {
          const theta1 = (i / guideDashCount) * Math.PI * 2;
          const theta2 = ((i + 0.55) / guideDashCount) * Math.PI * 2;
          const steps = 3;
          for (let s = 0; s < steps; s++) {
            const a1 = theta1 + (s / steps) * (theta2 - theta1);
            const a2 = theta1 + ((s + 1) / steps) * (theta2 - theta1);
            const w = 0.25;
            const p1Left = new THREE.Vector3(rCenter.x + (rGuide - w / 2) * Math.cos(a1), 0.035, rCenter.z + (rGuide - w / 2) * Math.sin(a1));
            const p1Right = new THREE.Vector3(rCenter.x + (rGuide + w / 2) * Math.cos(a1), 0.035, rCenter.z + (rGuide + w / 2) * Math.sin(a1));
            const p2Left = new THREE.Vector3(rCenter.x + (rGuide - w / 2) * Math.cos(a2), 0.035, rCenter.z + (rGuide - w / 2) * Math.sin(a2));
            const p2Right = new THREE.Vector3(rCenter.x + (rGuide + w / 2) * Math.cos(a2), 0.035, rCenter.z + (rGuide + w / 2) * Math.sin(a2));
            addQuad(p1Left, p1Right, p2Right, p2Left, 0.035, whitePos, whiteNorm, whiteInd, () => whiteVO, (v) => (whiteVO = v));
          }
        }
      } else {
        // Standard Multi-Way Intersection Plazas (100% flat, open, and matching asphalt)
        const juncGeo = new THREE.CircleGeometry(junc.radius + 1.0, 40);
        juncGeo.rotateX(-Math.PI / 2);
        const jPos = juncGeo.attributes.position;
        const jUvs = new Float32Array(jPos.count * 2);
        for (let i = 0; i < jPos.count; i++) {
          jUvs[i * 2] = (jPos.getX(i) + junc.x) / 8.0;
          jUvs[i * 2 + 1] = (jPos.getZ(i) + junc.z) / 8.0;
        }
        juncGeo.setAttribute('uv', new THREE.BufferAttribute(jUvs, 2));

        const juncMesh = new THREE.Mesh(juncGeo, intersectionMaterial);
        juncMesh.position.set(junc.x, 0.0305, junc.z);
        juncMesh.receiveShadow = true;
        this.group.add(juncMesh);
      }
    }

    // 6. Assemble and Add Combined Meshes
    // A. Master Textured Road Surface Mesh
    if (roadPos.length > 0) {
      const roadGeo = new THREE.BufferGeometry();
      roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadPos, 3));
      roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(roadNorm, 3));
      roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUv, 2));
      roadGeo.setIndex(roadInd);
      const roadMesh = new THREE.Mesh(roadGeo, roadMaterial);
      roadMesh.receiveShadow = true;
      this.group.add(roadMesh);
    }

    // B. Asphalt Underlap Mesh
    if (underPos.length > 0) {
      const underGeo = new THREE.BufferGeometry();
      underGeo.setAttribute('position', new THREE.Float32BufferAttribute(underPos, 3));
      underGeo.setAttribute('normal', new THREE.Float32BufferAttribute(underNorm, 3));
      underGeo.setAttribute('uv', new THREE.Float32BufferAttribute(underUv, 2));
      underGeo.setIndex(underInd);
      const underMesh = new THREE.Mesh(underGeo, intersectionMaterial);
      underMesh.receiveShadow = true;
      this.group.add(underMesh);
    }

    // C. White Stop Bars, Zebra Markings & Circulating Guides
    if (whitePos.length > 0) {
      const whiteGeo = new THREE.BufferGeometry();
      whiteGeo.setAttribute('position', new THREE.Float32BufferAttribute(whitePos, 3));
      whiteGeo.setAttribute('normal', new THREE.Float32BufferAttribute(whiteNorm, 3));
      whiteGeo.setIndex(whiteInd);
      const whiteMesh = new THREE.Mesh(whiteGeo, whitePaintMaterial);
      this.group.add(whiteMesh);
    }

    // D. Curb End-Caps
    if (curbPos.length > 0) {
      const curbGeo = new THREE.BufferGeometry();
      curbGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbPos, 3));
      curbGeo.setAttribute('normal', new THREE.Float32BufferAttribute(curbNorm, 3));
      curbGeo.setIndex(curbInd);
      const curbMesh = new THREE.Mesh(curbGeo, curbStoneMaterial);
      curbMesh.receiveShadow = true;
      this.group.add(curbMesh);
    }
  }

  private loadStreetFurniture(): void {
    const loader = new GLTFLoader();

    // 1. Calculate transforms for street lights along road segments (strictly outside intersections)
    const lightTransforms: THREE.Matrix4[] = [];
    let lightIndex = 0;

    for (const segment of this.roadSegments) {
      const rawPoints = segment.points.map((pt) => {
        const w = svgToWorld(pt.x, pt.y);
        return new THREE.Vector3(w.x, 0, w.z);
      });
      if (rawPoints.length < 2) continue;

      const pts = resamplePoints(rawPoints, 6);
      const halfW = segment.width / 2;

      const cumDists = [0];
      for (let i = 0; i < pts.length - 1; i++) {
        cumDists.push(cumDists[i] + pts[i].distanceTo(pts[i + 1]));
      }
      const totalLen = cumDists[cumDists.length - 1];

      let startCut = 0;
      for (const j of MULTI_JUNCTIONS) {
        if (Math.hypot(pts[0].x - j.x, pts[0].z - j.z) < 8.0) {
          startCut = j.radius;
          break;
        }
      }

      let endCut = 0;
      const lastPt = pts[pts.length - 1];
      for (const j of MULTI_JUNCTIONS) {
        if (Math.hypot(lastPt.x - j.x, lastPt.z - j.z) < 8.0) {
          endCut = j.radius;
          break;
        }
      }

      const lightStart = startCut + 6.0;
      const lightEnd = totalLen - endCut - 6.0;
      if (lightEnd <= lightStart + 15.0) continue;

      const lightSpan = lightEnd - lightStart;
      const period = 38.0; // 38m between street lamps
      const numLights = Math.floor(lightSpan / period);

      for (let d = 0; d < numLights; d++) {
        const targetDist = lightStart + (d + 0.5) * period;
        let curIdx = 0;
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

        // Alternate left and right sidewalks
        const side = lightIndex % 2 === 0 ? 1 : -1;
        lightIndex++;

        // Place on sidewalk just past the curb (halfW + curbW + 0.65m)
        const curbW = 0.40;
        const lampPos = center.clone().addScaledVector(perp, side * (halfW + curbW + 0.65));

        // Arm points inward toward the road center
        const inward = perp.clone().multiplyScalar(-side);
        const angle = Math.atan2(inward.x, inward.z);

        const dummy = new THREE.Object3D();
        dummy.position.set(lampPos.x, 0.045, lampPos.z);
        dummy.rotation.set(0, angle, 0);
        dummy.scale.set(8.5, 8.5, 8.5);
        dummy.updateMatrix();

        lightTransforms.push(dummy.matrix.clone());
      }
    }

    // Load light_curved.glb from Kenney City Kit Roads and create InstancedMeshes
    loader.load(
      '/models/roads/light_curved.glb',
      (gltf) => {
        const meshes: THREE.Mesh[] = [];
        gltf.scene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            meshes.push(child as THREE.Mesh);
          }
        });

        meshes.forEach((m) => {
          let instMat: THREE.Material;
          if (m.material) {
            const originalMat = Array.isArray(m.material) ? m.material[0] : m.material;
            if (originalMat.name === 'light') {
              instMat = new THREE.MeshStandardMaterial({
                color: 0xfffbeb,
                emissive: new THREE.Color(0xfef08a),
                emissiveIntensity: 0.9,
                roughness: 0.2,
              });
            } else {
              instMat = new THREE.MeshStandardMaterial({
                color: 0x475569,
                metalness: 0.7,
                roughness: 0.35,
              });
            }
          } else {
            instMat = new THREE.MeshStandardMaterial({ color: 0x64748b });
          }

          const instancedMesh = new THREE.InstancedMesh(m.geometry, instMat, lightTransforms.length);
          instancedMesh.castShadow = true;
          instancedMesh.receiveShadow = true;

          for (let i = 0; i < lightTransforms.length; i++) {
            instancedMesh.setMatrixAt(i, lightTransforms[i]);
          }
          instancedMesh.instanceMatrix.needsUpdate = true;
          this.group.add(instancedMesh);
        });
      },
      undefined,
      (err) => console.warn('Could not load light_curved.glb:', err)
    );

    // 2. Corner Street Lights at the 4 Sidewalk Corners of Central Roundabout (0, -22)
    const cornerLightCoords = [
      { x: 23.0, z: -2.5, rotY: -Math.PI * 0.75 },   // South-East corner
      { x: -23.0, z: -2.5, rotY: Math.PI * 0.75 },    // South-West corner
      { x: 23.0, z: -41.5, rotY: -Math.PI * 0.25 },  // North-East corner
      { x: -23.0, z: -41.5, rotY: Math.PI * 0.25 },   // North-West corner
    ];

    loader.load('/models/roads/light_curved.glb', (gltf) => {
      for (const pos of cornerLightCoords) {
        const light = gltf.scene.clone();
        light.scale.set(8.5, 8.5, 8.5);
        light.position.set(pos.x, 0.045, pos.z);
        light.rotation.y = pos.rotY;
        light.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) {
            c.castShadow = true;
            const mesh = c as THREE.Mesh;
            if (mesh.material && (mesh.material as THREE.Material).name === 'light') {
              (mesh.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0xfef08a);
              (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.0;
            }
          }
        });
        this.group.add(light);
      }
    });

    // 3. Roadside Safety Work Zone (Kenney Traffic Cones, Barriers, Hazard Beacon)
    // Placed curbside on the right shoulder of road-3
    loader.load('/models/roads/construction_pylon.glb', (gltf) => {
      for (let i = 0; i < 6; i++) {
        const cone = gltf.scene.clone();
        cone.scale.set(8.5, 8.5, 8.5);
        cone.position.set(6.8 + i * 0.15, 0.045, 12.0 - i * 3.5);
        cone.rotation.y = Math.PI * 0.1 * i;
        cone.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) {
            c.castShadow = true;
            c.receiveShadow = true;
          }
        });
        this.group.add(cone);
      }
    });

    loader.load('/models/roads/construction_barrier.glb', (gltf) => {
      for (let i = 0; i < 2; i++) {
        const barrier = gltf.scene.clone();
        barrier.scale.set(8.5, 8.5, 8.5);
        barrier.position.set(8.5, 0.045, 8.0 - i * 4.5);
        barrier.rotation.y = -Math.PI / 16;
        barrier.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) {
            c.castShadow = true;
            c.receiveShadow = true;
          }
        });
        this.group.add(barrier);
      }
    });

    loader.load('/models/roads/construction_light.glb', (gltf) => {
      const beacon = gltf.scene.clone();
      beacon.scale.set(8.5, 8.5, 8.5);
      beacon.position.set(8.5, 0.045, 13.5);
      beacon.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) {
          c.castShadow = true;
          const mesh = c as THREE.Mesh;
          if (mesh.material && (mesh.material as THREE.Material).name === 'light') {
            (mesh.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0xf59e0b);
            (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.2;
          }
        }
      });
      this.group.add(beacon);
    });
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
