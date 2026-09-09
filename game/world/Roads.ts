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
  name: string;
  x: number;
  z: number;
  radius: number;
  isCentralRoundabout?: boolean;
}

/**
 * The 10 multi-way highway intersections across the island network.
 * Approaching road ribbons terminate cleanly outside the junction radius,
 * where zebra pedestrian crossings, stop bars, and corner curb fillets connect them.
 */
const MULTI_JUNCTIONS: MultiJunction[] = [
  // 1. Central City Grand 5-Way Roundabout (bridge-6, road-3, road-4, road-13, road-18)
  { name: 'Central Roundabout', x: 0, z: -22, radius: 25.0, isCentralRoundabout: true },

  // 2. Highway Arterial 3-Way Intersections across all island districts
  { name: 'Southbridge', x: 15, z: 188, radius: 16.0 },
  { name: 'West End', x: -220, z: 248, radius: 16.0 },
  { name: 'Riverside', x: -215, z: 65, radius: 16.0 },
  { name: 'Caldera Pass', x: 45, z: -248, radius: 16.0 },
  { name: 'Harborview', x: 280, z: 108, radius: 16.0 },
  { name: 'Oak Heights', x: 280, z: -58, radius: 16.0 },
  { name: 'Sunset Bay', x: 335, z: 278, radius: 16.0 },
  { name: 'Pacific Bluffs', x: -445, z: 100, radius: 16.0 },
  { name: 'Airport Parkway', x: -515, z: 318, radius: 16.0 },
];

/**
 * 4 Scenic Viewpoint Dead-Ends with circular cul-de-sac turn-around loops.
 */
const DEAD_ENDS: Array<{ x: number; z: number; radius: number }> = [
  { x: 505, z: 160, radius: 16.0 },  // Dragon Island Resort Overlook (bridge-3)
  { x: 380, z: 428, radius: 16.0 },  // Crescent Island Beach Loop (bridge-4)
  { x: 145, z: -390, radius: 16.0 }, // Caldera Mountain Peak Summit (road-10)
  { x: -270, z: -332, radius: 16.0 }, // Mount Crest National Park Cul-de-sac (road-18)
];

interface UnifiedRoad {
  id: string;
  width: number;
  isBridge: boolean;
  points: THREE.Vector3[];
}

function resamplePoints(points: THREE.Vector3[], maxStep: number = 4): THREE.Vector3[] {
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
  step: number = 4
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

  constructor(getHeight?: (x: number, z: number) => number) {
    this.group = new THREE.Group();
    this.group.name = 'IslandRoads';
    this.group.renderOrder = 2;
    this.roadSegments = getIslandRoadNetwork();
    this.buildIslandRoads(getHeight);
    this.loadStreetFurniture();
  }

  private buildIslandRoads(_getHeight?: (x: number, z: number) => number): void {
    const texLoader = new THREE.TextureLoader();

    // 1. High-Definition Photorealistic PBR Textures
    const roadTexture = texLoader.load('/textures/roads/road_surface.png');
    roadTexture.wrapS = THREE.ClampToEdgeWrapping;
    roadTexture.wrapT = THREE.RepeatWrapping;
    roadTexture.colorSpace = THREE.SRGBColorSpace;
    roadTexture.generateMipmaps = true;
    roadTexture.anisotropy = 16;

    const asphaltTexture = texLoader.load('/textures/roads/asphalt_clean.png');
    asphaltTexture.wrapS = THREE.RepeatWrapping;
    asphaltTexture.wrapT = THREE.RepeatWrapping;
    asphaltTexture.colorSpace = THREE.SRGBColorSpace;
    asphaltTexture.generateMipmaps = true;
    asphaltTexture.anisotropy = 16;

    const sidewalkTexture = texLoader.load('/textures/roads/sidewalk.png');
    sidewalkTexture.wrapS = THREE.RepeatWrapping;
    sidewalkTexture.wrapT = THREE.RepeatWrapping;
    sidewalkTexture.colorSpace = THREE.SRGBColorSpace;
    sidewalkTexture.generateMipmaps = true;
    sidewalkTexture.anisotropy = 16;

    // 2. High-Performance Materials with DoubleSide & PolygonOffset
    const roadMaterial = new THREE.MeshStandardMaterial({
      map: roadTexture,
      roughness: 0.82,
      metalness: 0.05,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1.0,
      polygonOffsetUnits: -2.0,
    });

    const intersectionMaterial = new THREE.MeshStandardMaterial({
      map: asphaltTexture,
      roughness: 0.82,
      metalness: 0.05,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1.0,
      polygonOffsetUnits: -2.0,
    });

    const sidewalkMaterial = new THREE.MeshStandardMaterial({
      map: sidewalkTexture,
      roughness: 0.86,
      metalness: 0.04,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1.0,
      polygonOffsetUnits: -2.0,
    });

    const curbStoneMaterial = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.65,
      metalness: 0.12,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1.0,
      polygonOffsetUnits: -2.0,
    });

    const whitePaintMaterial = new THREE.MeshBasicMaterial({
      color: 0xf8fafc,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2.0,
      polygonOffsetUnits: -4.0,
    });

    const islandGrassMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e3a24,
      roughness: 0.92,
      metalness: 0.04,
      side: THREE.DoubleSide,
    });

    // 3. Assemble Unified Road Network
    // Welds all 2-road joints into continuous, smooth splines so NO roads ever collide at sharp angles
    const rawMap = new Map<string, RoadSegment>();
    for (const r of this.roadSegments) {
      rawMap.set(r.id, r);
    }

    const toWorldVecs = (seg: RoadSegment): THREE.Vector3[] =>
      seg.points.map((pt) => {
        const w = svgToWorld(pt.x, pt.y);
        return new THREE.Vector3(w.x, 0, w.z);
      });

    const unifiedRoads: UnifiedRoad[] = [];

    // Chain 1: Riverside -> Lakeview -> Caldera (road-8 + road-9)
    if (rawMap.has('road-8') && rawMap.has('road-9')) {
      const p8 = toWorldVecs(rawMap.get('road-8')!);
      const p9 = toWorldVecs(rawMap.get('road-9')!);
      unifiedRoads.push({
        id: 'arterial-riverside-caldera',
        width: 16,
        isBridge: false,
        points: [...p8, ...p9.slice(1)],
      });
    }

    // Chain 2: Riverside -> Northwood -> Pacific Bluffs (road-5 + road-6)
    if (rawMap.has('road-5') && rawMap.has('road-6')) {
      const p5 = toWorldVecs(rawMap.get('road-5')!);
      const p6 = toWorldVecs(rawMap.get('road-6')!);
      unifiedRoads.push({
        id: 'arterial-riverside-pacific',
        width: 16,
        isBridge: false,
        points: [...p5, ...p6.slice(1)],
      });
    }

    // Chain 3: Caldera -> Sandy Ridge -> Eastvale -> Oak Heights (road-11 + road-12 + reversed road-14)
    if (rawMap.has('road-11') && rawMap.has('road-12') && rawMap.has('road-14')) {
      const p11 = toWorldVecs(rawMap.get('road-11')!);
      const p12 = toWorldVecs(rawMap.get('road-12')!);
      const p14Rev = [...toWorldVecs(rawMap.get('road-14')!)].reverse();
      unifiedRoads.push({
        id: 'arterial-caldera-oakheights',
        width: 16,
        isBridge: false,
        points: [...p11, ...p12.slice(1), ...p14Rev.slice(1)],
      });
    }

    // Chain 4: Southbridge -> Southport -> Twin Beaches -> West End (road-16 + bridge-5 + reversed road-17)
    if (rawMap.has('road-16') && rawMap.has('bridge-5') && rawMap.has('road-17')) {
      const p16 = toWorldVecs(rawMap.get('road-16')!);
      const b5 = toWorldVecs(rawMap.get('bridge-5')!);
      const p17Rev = [...toWorldVecs(rawMap.get('road-17')!)].reverse();
      unifiedRoads.push({
        id: 'arterial-southbridge-westend',
        width: 16,
        isBridge: false,
        points: [...p16, ...b5.slice(1), ...p17Rev.slice(1)],
      });
    }

    // Standalone direct arterial roads
    const standalones = [
      'bridge-1', 'bridge-2', 'bridge-3', 'bridge-4', 'bridge-6',
      'road-1', 'road-2', 'road-3', 'road-4', 'road-7',
      'road-10', 'road-13', 'road-15', 'road-18',
    ];
    for (const sid of standalones) {
      if (rawMap.has(sid)) {
        const seg = rawMap.get(sid)!;
        unifiedRoads.push({
          id: seg.id,
          width: seg.width,
          isBridge: seg.isBridge,
          points: toWorldVecs(seg),
        });
      }
    }

    // 4. Geometry Buffers
    // Master Textured Road Mesh (10 profile vertices across road with dedicated centerline & subdivisions)
    const roadPos: number[] = [], roadNorm: number[] = [], roadUv: number[] = [], roadInd: number[] = [];
    let roadVO = 0;

    // White Intersection Markings (Stop lines & Zebra pedestrian crossings)
    const whitePos: number[] = [], whiteNorm: number[] = [], whiteInd: number[] = [];
    let whiteVO = 0;

    // Curb End-Caps
    const curbPos: number[] = [], curbNorm: number[] = [], curbInd: number[] = [];
    let curbVO = 0;

    // Corner Sidewalk Fillets
    const swPos: number[] = [], swNorm: number[] = [], swUv: number[] = [], swInd: number[] = [];
    let swVO = 0;

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
      // Upward counter-clockwise winding: (base, base + 2, base + 1) and (base, base + 3, base + 2)
      indArr.push(base, base + 2, base + 1, base, base + 3, base + 2);
      setVO(base + 4);
    };

    // Store junction entrance points to construct seamless corner fillets
    const junctionEntrances = new Map<string, Array<{
      roadId: string;
      center: THREE.Vector3;
      tangent: THREE.Vector3; // pointing INTO the junction
      perp: THREE.Vector3;
      halfW: number;
      curbW: number;
      swW: number;
    }>>();

    for (const j of MULTI_JUNCTIONS) {
      junctionEntrances.set(j.name, []);
    }

    // 5. Generate Road Spline Ribbons
    for (const road of unifiedRoads) {
      if (road.points.length < 2) continue;

      const pts = resamplePoints(road.points, 4);
      const halfW = road.width / 2;
      const curbW = 0.40;  // 40cm beveled concrete curb
      const swW = 2.40;    // 2.4m paved pedestrian sidewalk
      const totalHalfW = halfW + curbW + swW;

      this.roadRibbons.push({ worldPoints: pts, halfW, isBridge: road.isBridge });

      const cumDists = [0];
      for (let i = 0; i < pts.length - 1; i++) {
        cumDists.push(cumDists[i] + pts[i].distanceTo(pts[i + 1]));
      }
      const totalLen = cumDists[cumDists.length - 1];

      // Check if start touches a multi-way junction or dead-end
      let startCut = 0;
      let startJuncName: string | null = null;
      for (const j of MULTI_JUNCTIONS) {
        if (pts[0].distanceTo(new THREE.Vector3(j.x, 0, j.z)) < 8.0) {
          startCut = j.radius;
          startJuncName = j.name;
          break;
        }
      }
      if (!startJuncName) {
        for (const de of DEAD_ENDS) {
          if (pts[0].distanceTo(new THREE.Vector3(de.x, 0, de.z)) < 8.0) {
            startCut = de.radius;
            break;
          }
        }
      }

      // Check if end touches a multi-way junction or dead-end
      let endCut = 0;
      let endJuncName: string | null = null;
      const lastPt = pts[pts.length - 1];
      for (const j of MULTI_JUNCTIONS) {
        if (lastPt.distanceTo(new THREE.Vector3(j.x, 0, j.z)) < 8.0) {
          endCut = j.radius;
          endJuncName = j.name;
          break;
        }
      }
      if (!endJuncName) {
        for (const de of DEAD_ENDS) {
          if (lastPt.distanceTo(new THREE.Vector3(de.x, 0, de.z)) < 8.0) {
            endCut = de.radius;
            break;
          }
        }
      }

      const dStart = Math.min(startCut, totalLen * 0.45);
      const dEnd = Math.max(totalLen - endCut, dStart + 2.0);

      // Sample along road between dStart and dEnd
      const roadSpan = samplePointsInRange(pts, cumDists, dStart, dEnd, 4);
      const sPts = roadSpan.points;
      const sPerps = roadSpan.perps;
      const sDists = roadSpan.dists;

      if (sPts.length >= 2) {
        const rVO = roadVO;

        // Record entrance descriptors for corner curb fillets
        if (startJuncName && startCut > 0) {
          const tangIn = new THREE.Vector3().subVectors(pts[0], sPts[0]).normalize();
          junctionEntrances.get(startJuncName)?.push({
            roadId: road.id,
            center: sPts[0],
            tangent: tangIn,
            perp: sPerps[0],
            halfW,
            curbW,
            swW,
          });
        }
        if (endJuncName && endCut > 0) {
          const tangIn = new THREE.Vector3().subVectors(lastPt, sPts[sPts.length - 1]).normalize();
          junctionEntrances.get(endJuncName)?.push({
            roadId: road.id,
            center: sPts[sPts.length - 1],
            tangent: tangIn,
            perp: sPerps[sPerps.length - 1],
            halfW,
            curbW,
            swW,
          });
        }

        // Cross Section Profile (10 vertices across the road width):
        // Elevation: Sidewalks & curb tops at Y = 0.12m, Roadway at Y = 0.04m (clean 8cm 3D curb step)
        // Texture: Mapped cleanly across the 2048x1024 atlas with dedicated yellow centerline strip
        for (let i = 0; i < sPts.length; i++) {
          const curr = sPts[i];
          const perp = sPerps[i];
          const v = sDists[i] / 8.0; // repeats every 8 meters along road

          // 10 profile points:
          // P0: Left Sidewalk Outer
          const p0 = curr.clone().addScaledVector(perp, -totalHalfW);
          // P1: Left Sidewalk Inner / Curb Top
          const p1 = curr.clone().addScaledVector(perp, -(halfW + curbW));
          // P2: Left Curb Bottom / Road Edge
          const p2 = curr.clone().addScaledVector(perp, -halfW);
          // P3: Left Lane Mid
          const p3 = curr.clone().addScaledVector(perp, -halfW * 0.5);
          // P4: Centerline Left
          const p4 = curr.clone().addScaledVector(perp, -0.4);
          // P5: Centerline Right
          const p5 = curr.clone().addScaledVector(perp, 0.4);
          // P6: Right Lane Mid
          const p6 = curr.clone().addScaledVector(perp, halfW * 0.5);
          // P7: Right Curb Bottom / Road Edge
          const p7 = curr.clone().addScaledVector(perp, halfW);
          // P8: Right Sidewalk Inner / Curb Top
          const p8 = curr.clone().addScaledVector(perp, halfW + curbW);
          // P9: Right Sidewalk Outer
          const p9 = curr.clone().addScaledVector(perp, totalHalfW);

          roadPos.push(
            p0.x, 0.12, p0.z,
            p1.x, 0.12, p1.z,
            p2.x, 0.04, p2.z,
            p3.x, 0.04, p3.z,
            p4.x, 0.04, p4.z,
            p5.x, 0.04, p5.z,
            p6.x, 0.04, p6.z,
            p7.x, 0.04, p7.z,
            p8.x, 0.12, p8.z,
            p9.x, 0.12, p9.z
          );

          // Normals: upward on flats, beveled angle on curb slopes
          roadNorm.push(
            0, 1, 0,
            0, 1, 0,
            perp.x * 0.25, 0.96, perp.z * 0.25,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            -perp.x * 0.25, 0.96, -perp.z * 0.25,
            0, 1, 0,
            0, 1, 0
          );

          // Precise UV mapping matching master road_surface.png:
          roadUv.push(
            0.0000, v, // P0: Left Sidewalk Outer
            0.1367, v, // P1: Left Sidewalk Inner / Curb Top
            0.1660, v, // P2: Left Curb Bottom / Road Edge
            0.3270, v, // P3: Left Lane Mid
            0.4883, v, // P4: Centerline Left
            0.5117, v, // P5: Centerline Right
            0.6730, v, // P6: Right Lane Mid
            0.8340, v, // P7: Right Curb Bottom / Road Edge
            0.8633, v, // P8: Right Sidewalk Inner / Curb Top
            1.0000, v  // P9: Right Sidewalk Outer
          );

          // 9 Quad strips connecting step i to step i + 1
          // Correct upward counter-clockwise winding: (b0+s, b1+s+1, b1+s) and (b0+s, b0+s+1, b1+s+1)
          if (i < sPts.length - 1) {
            const b0 = rVO + i * 10;
            const b1 = rVO + (i + 1) * 10;
            for (let s = 0; s < 9; s++) {
              roadInd.push(
                b0 + s, b1 + s + 1, b1 + s,
                b0 + s, b0 + s + 1, b1 + s + 1
              );
            }
          }
        }

        roadVO = rVO + sPts.length * 10;

        // Clean Intersection Entrances: Stop Bars, Pedestrian Zebra Crossings, and Curb End-Caps
        const entranceConfigs = [
          { pt: sPts[0], perp: sPerps[0], tangDir: -1, active: startCut > 0 },
          { pt: sPts[sPts.length - 1], perp: sPerps[sPerps.length - 1], tangDir: 1, active: endCut > 0 },
        ];

        for (const ec of entranceConfigs) {
          if (!ec.active) continue;
          const tang = new THREE.Vector3(ec.perp.z, 0, -ec.perp.x).multiplyScalar(ec.tangDir);

          // 1. Concrete Curb End-Caps sealing the sidewalk ends at crosswalk
          const l1 = ec.pt.clone().addScaledVector(ec.perp, -totalHalfW);
          const l2 = ec.pt.clone().addScaledVector(ec.perp, -halfW);
          const l3 = l2.clone().addScaledVector(tang, 0.4);
          const l4 = l1.clone().addScaledVector(tang, 0.4);
          addQuad(l1, l2, l3, l4, 0.12, curbPos, curbNorm, curbInd, () => curbVO, (v) => (curbVO = v));

          const r1 = ec.pt.clone().addScaledVector(ec.perp, halfW);
          const r2 = ec.pt.clone().addScaledVector(ec.perp, totalHalfW);
          const r3 = r2.clone().addScaledVector(tang, 0.4);
          const r4 = r1.clone().addScaledVector(tang, 0.4);
          addQuad(r1, r2, r3, r4, 0.12, curbPos, curbNorm, curbInd, () => curbVO, (v) => (curbVO = v));

          // 2. Stop Bar across the roadway entrance
          const stopCenter = ec.pt.clone().addScaledVector(tang, 0.8);
          const sb0 = stopCenter.clone().addScaledVector(ec.perp, -halfW + 0.4).addScaledVector(tang, -0.25);
          const sb1 = stopCenter.clone().addScaledVector(ec.perp, halfW - 0.4).addScaledVector(tang, -0.25);
          const sb2 = stopCenter.clone().addScaledVector(ec.perp, halfW - 0.4).addScaledVector(tang, 0.25);
          const sb3 = stopCenter.clone().addScaledVector(ec.perp, -halfW + 0.4).addScaledVector(tang, 0.25);
          addQuad(sb0, sb1, sb2, sb3, 0.048, whitePos, whiteNorm, whiteInd, () => whiteVO, (v) => (whiteVO = v));

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
            addQuad(z0, z1, z2, z3, 0.048, whitePos, whiteNorm, whiteInd, () => whiteVO, (v) => (whiteVO = v));
          }
        }
      }
    }

    // 6. Multi-Way Intersection Plazas & Smooth Corner Sidewalk Fillets
    for (const junc of MULTI_JUNCTIONS) {
      if (junc.isCentralRoundabout) {
        // Grand Central 5-Way Roundabout at (0, -22)
        const rCenter = new THREE.Vector3(junc.x, 0.04, junc.z);
        const rOuter = junc.radius; // 25.0m
        const rInner = 8.0;

        // Circulating 2-Lane PBR Asphalt Ring
        const ringGeo = new THREE.RingGeometry(rInner, rOuter, 64);
        ringGeo.rotateX(-Math.PI / 2);
        const ringPosAttr = ringGeo.attributes.position;
        const ringUvs = new Float32Array(ringPosAttr.count * 2);
        for (let i = 0; i < ringPosAttr.count; i++) {
          ringUvs[i * 2] = (ringPosAttr.getX(i) + rCenter.x) / 8.0;
          ringUvs[i * 2 + 1] = (ringPosAttr.getZ(i) + rCenter.z) / 8.0;
        }
        ringGeo.setAttribute('uv', new THREE.BufferAttribute(ringUvs, 2));

        const ringMesh = new THREE.Mesh(ringGeo, intersectionMaterial);
        ringMesh.position.set(rCenter.x, 0.042, rCenter.z);
        ringMesh.receiveShadow = true;
        ringMesh.renderOrder = 2;
        this.group.add(ringMesh);

        // Raised Central Island Curb Stone (Y = 0.20m)
        const islandCurbGeo = new THREE.RingGeometry(rInner - 0.6, rInner, 64);
        islandCurbGeo.rotateX(-Math.PI / 2);
        const islandCurbMesh = new THREE.Mesh(islandCurbGeo, curbStoneMaterial);
        islandCurbMesh.position.set(rCenter.x, 0.20, rCenter.z);
        islandCurbMesh.receiveShadow = true;
        islandCurbMesh.renderOrder = 2;
        this.group.add(islandCurbMesh);

        // Landscaped Central Green Grass Lawn (Y = 0.18m)
        const islandGrassGeo = new THREE.CircleGeometry(rInner - 0.6, 64);
        islandGrassGeo.rotateX(-Math.PI / 2);
        const islandGrassMesh = new THREE.Mesh(islandGrassGeo, islandGrassMaterial);
        islandGrassMesh.position.set(rCenter.x, 0.18, rCenter.z);
        islandGrassMesh.receiveShadow = true;
        islandGrassMesh.renderOrder = 2;
        this.group.add(islandGrassMesh);

        // Circulating Dashed White Lane Divider at R = 16.5m
        const rGuide = 16.5;
        const guideDashCount = 32;
        for (let i = 0; i < guideDashCount; i++) {
          const theta1 = (i / guideDashCount) * Math.PI * 2;
          const theta2 = ((i + 0.5) / guideDashCount) * Math.PI * 2;
          const steps = 3;
          for (let s = 0; s < steps; s++) {
            const a1 = theta1 + (s / steps) * (theta2 - theta1);
            const a2 = theta1 + ((s + 1) / steps) * (theta2 - theta1);
            const w = 0.25;
            const p1Left = new THREE.Vector3(rCenter.x + (rGuide - w / 2) * Math.cos(a1), 0.048, rCenter.z + (rGuide - w / 2) * Math.sin(a1));
            const p1Right = new THREE.Vector3(rCenter.x + (rGuide + w / 2) * Math.cos(a1), 0.048, rCenter.z + (rGuide + w / 2) * Math.sin(a1));
            const p2Left = new THREE.Vector3(rCenter.x + (rGuide - w / 2) * Math.cos(a2), 0.048, rCenter.z + (rGuide - w / 2) * Math.sin(a2));
            const p2Right = new THREE.Vector3(rCenter.x + (rGuide + w / 2) * Math.cos(a2), 0.048, rCenter.z + (rGuide + w / 2) * Math.sin(a2));
            addQuad(p1Left, p1Right, p2Right, p2Left, 0.048, whitePos, whiteNorm, whiteInd, () => whiteVO, (v) => (whiteVO = v));
          }
        }
      } else {
        // Standard Multi-Way Highway Arterial Intersection Plazas (100% flat, seamless PBR asphalt)
        const juncGeo = new THREE.CircleGeometry(junc.radius + 1.5, 48);
        juncGeo.rotateX(-Math.PI / 2);
        const jPos = juncGeo.attributes.position;
        const jUvs = new Float32Array(jPos.count * 2);
        for (let i = 0; i < jPos.count; i++) {
          jUvs[i * 2] = (jPos.getX(i) + junc.x) / 8.0;
          jUvs[i * 2 + 1] = (jPos.getZ(i) + junc.z) / 8.0;
        }
        juncGeo.setAttribute('uv', new THREE.BufferAttribute(jUvs, 2));

        const juncMesh = new THREE.Mesh(juncGeo, intersectionMaterial);
        juncMesh.position.set(junc.x, 0.041, junc.z);
        juncMesh.receiveShadow = true;
        juncMesh.renderOrder = 2;
        this.group.add(juncMesh);
      }

      // Smooth Corner Sidewalk Fillets Connecting Adjacent Roads around each Junction
      const entrances = junctionEntrances.get(junc.name) || [];
      if (entrances.length >= 2) {
        // Sort entrances by angle around junction center
        entrances.sort((a, b) => {
          const angA = Math.atan2(a.center.z - junc.z, a.center.x - junc.x);
          const angB = Math.atan2(b.center.z - junc.z, b.center.x - junc.x);
          return angA - angB;
        });

        // For each adjacent pair, generate a smooth corner sidewalk fillet
        for (let k = 0; k < entrances.length; k++) {
          const eA = entrances[k];
          const eB = entrances[(k + 1) % entrances.length];

          // Right sidewalk corner of eA, Left sidewalk corner of eB
          const pA_curb = eA.center.clone().addScaledVector(eA.perp, eA.halfW);
          const pA_sw = eA.center.clone().addScaledVector(eA.perp, eA.halfW + eA.curbW + eA.swW);

          const pB_curb = eB.center.clone().addScaledVector(eB.perp, -eB.halfW);
          const pB_sw = eB.center.clone().addScaledVector(eB.perp, -(eB.halfW + eB.curbW + eB.swW));

          // Compute control point for corner arc
          const midCurb = new THREE.Vector3().lerpVectors(pA_curb, pB_curb, 0.5);
          const dirFromCenter = new THREE.Vector3().subVectors(midCurb, new THREE.Vector3(junc.x, 0, junc.z)).normalize();
          const cornerControl = new THREE.Vector3(junc.x, 0, junc.z).addScaledVector(dirFromCenter, junc.radius * 0.85);

          // Subdivide corner arc into 6 smooth segments
          const numArcSteps = 6;
          const arcCurbPts: THREE.Vector3[] = [];
          const arcSwPts: THREE.Vector3[] = [];

          for (let s = 0; s <= numArcSteps; s++) {
            const t = s / numArcSteps;
            const u = 1 - t;
            // Quadratic Bezier from pA_curb to pB_curb via cornerControl
            const curbPt = new THREE.Vector3(
              u * u * pA_curb.x + 2 * u * t * cornerControl.x + t * t * pB_curb.x,
              0.12,
              u * u * pA_curb.z + 2 * u * t * cornerControl.z + t * t * pB_curb.z
            );
            arcCurbPts.push(curbPt);

            // Sidewalk outer edge offset radially outward
            const radialOut = new THREE.Vector3().subVectors(curbPt, new THREE.Vector3(junc.x, 0, junc.z)).normalize();
            const swPt = curbPt.clone().addScaledVector(radialOut, eA.curbW + eA.swW);
            arcSwPts.push(swPt);
          }

          // Build sidewalk fillet quads with correct upward winding
          const baseSW = swVO;
          for (let s = 0; s <= numArcSteps; s++) {
            const cp = arcCurbPts[s];
            const sp = arcSwPts[s];
            swPos.push(cp.x, 0.12, cp.z, sp.x, 0.12, sp.z);
            swNorm.push(0, 1, 0, 0, 1, 0);
            swUv.push(cp.x / 4.0, cp.z / 4.0, sp.x / 4.0, sp.z / 4.0);
          }
          for (let s = 0; s < numArcSteps; s++) {
            const b = baseSW + s * 2;
            swInd.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
          }
          swVO = baseSW + (numArcSteps + 1) * 2;
        }
      }
    }

    // 7. Scenic Viewpoint Dead-End Cul-De-Sacs
    for (const de of DEAD_ENDS) {
      const deGeo = new THREE.CircleGeometry(de.radius + 0.5, 40);
      deGeo.rotateX(-Math.PI / 2);
      const dePos = deGeo.attributes.position;
      const deUvs = new Float32Array(dePos.count * 2);
      for (let i = 0; i < dePos.count; i++) {
        deUvs[i * 2] = (dePos.getX(i) + de.x) / 8.0;
        deUvs[i * 2 + 1] = (dePos.getZ(i) + de.z) / 8.0;
      }
      deGeo.setAttribute('uv', new THREE.BufferAttribute(deUvs, 2));

      const deMesh = new THREE.Mesh(deGeo, intersectionMaterial);
      deMesh.position.set(de.x, 0.041, de.z);
      deMesh.receiveShadow = true;
      deMesh.renderOrder = 2;
      this.group.add(deMesh);

      // Raised perimeter curb ring around the cul-de-sac
      const deCurbGeo = new THREE.RingGeometry(de.radius, de.radius + 0.5, 40);
      deCurbGeo.rotateX(-Math.PI / 2);
      const deCurbMesh = new THREE.Mesh(deCurbGeo, curbStoneMaterial);
      deCurbMesh.position.set(de.x, 0.12, de.z);
      deCurbMesh.receiveShadow = true;
      deCurbMesh.renderOrder = 2;
      this.group.add(deCurbMesh);
    }

    // 8. Assemble Combined Buffer Meshes
    // A. Master Textured Road Ribbon Mesh
    if (roadPos.length > 0) {
      const rGeo = new THREE.BufferGeometry();
      rGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadPos, 3));
      rGeo.setAttribute('normal', new THREE.Float32BufferAttribute(roadNorm, 3));
      rGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUv, 2));
      rGeo.setIndex(roadInd);
      const roadMesh = new THREE.Mesh(rGeo, roadMaterial);
      roadMesh.receiveShadow = true;
      roadMesh.renderOrder = 2;
      this.group.add(roadMesh);
    }

    // B. Corner Sidewalk Fillets Mesh
    if (swPos.length > 0) {
      const swGeo = new THREE.BufferGeometry();
      swGeo.setAttribute('position', new THREE.Float32BufferAttribute(swPos, 3));
      swGeo.setAttribute('normal', new THREE.Float32BufferAttribute(swNorm, 3));
      swGeo.setAttribute('uv', new THREE.Float32BufferAttribute(swUv, 2));
      swGeo.setIndex(swInd);
      const swMesh = new THREE.Mesh(swGeo, sidewalkMaterial);
      swMesh.receiveShadow = true;
      swMesh.renderOrder = 2;
      this.group.add(swMesh);
    }

    // C. White Stop Bars & Zebra Crossings
    if (whitePos.length > 0) {
      const whiteGeo = new THREE.BufferGeometry();
      whiteGeo.setAttribute('position', new THREE.Float32BufferAttribute(whitePos, 3));
      whiteGeo.setAttribute('normal', new THREE.Float32BufferAttribute(whiteNorm, 3));
      whiteGeo.setIndex(whiteInd);
      const whiteMesh = new THREE.Mesh(whiteGeo, whitePaintMaterial);
      whiteMesh.renderOrder = 3;
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
      curbMesh.renderOrder = 2;
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
        dummy.position.set(lampPos.x, 0.12, lampPos.z);
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
      { x: 26.0, z: -2.5, rotY: -Math.PI * 0.75 },   // South-East corner
      { x: -26.0, z: -2.5, rotY: Math.PI * 0.75 },    // South-West corner
      { x: 26.0, z: -41.5, rotY: -Math.PI * 0.25 },  // North-East corner
      { x: -26.0, z: -41.5, rotY: Math.PI * 0.25 },   // North-West corner
    ];

    loader.load('/models/roads/light_curved.glb', (gltf) => {
      for (const pos of cornerLightCoords) {
        const light = gltf.scene.clone();
        light.scale.set(8.5, 8.5, 8.5);
        light.position.set(pos.x, 0.12, pos.z);
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
    loader.load('/models/roads/construction_pylon.glb', (gltf) => {
      for (let i = 0; i < 6; i++) {
        const cone = gltf.scene.clone();
        cone.scale.set(8.5, 8.5, 8.5);
        cone.position.set(6.8 + i * 0.15, 0.12, 12.0 - i * 3.5);
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
        barrier.position.set(8.5, 0.12, 8.0 - i * 4.5);
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
      beacon.position.set(8.5, 0.12, 13.5);
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
    const nearestPoint = new THREE.Vector3();
    const bestTangent = new THREE.Vector3(1, 0, 0);
    const bestNormal = new THREE.Vector3(0, 0, 1);

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
    return 0.04;
  }
}
