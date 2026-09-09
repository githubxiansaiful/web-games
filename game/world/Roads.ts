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
  isRoundabout: boolean;
}

const MULTI_JUNCTIONS: MultiJunction[] = [
  { x: 0, z: -22, radius: 18.0, isRoundabout: true },
  { x: 15, z: 188, radius: 14.0, isRoundabout: false },
  { x: -215, z: 65, radius: 14.0, isRoundabout: false },
  { x: -220, z: 248, radius: 14.0, isRoundabout: false },
  { x: 280, z: 108, radius: 14.0, isRoundabout: false },
  { x: 280, z: -58, radius: 14.0, isRoundabout: false },
  { x: 45, z: -248, radius: 14.0, isRoundabout: false },
  { x: 335, z: 278, radius: 13.0, isRoundabout: false },
  { x: -445, z: 100, radius: 14.0, isRoundabout: false },
  { x: -515, z: 318, radius: 14.0, isRoundabout: false },
];

function resamplePoints(points: THREE.Vector3[], maxStep: number = 8): THREE.Vector3[] {
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
  step: number = 8
): { points: THREE.Vector3[]; perps: THREE.Vector3[] } {
  const result: THREE.Vector3[] = [];
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

  return { points: result, perps };
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

    const islandGrassMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e3a24, // Central roundabout lawn green
      roughness: 0.92,
      metalness: 0.04,
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

    // 3. Process Road Segments (With Junction Trimming, Clean Crosswalks, and End-Caps)
    for (const segment of this.roadSegments) {
      const rawPoints = segment.points.map((pt) => {
        const w = svgToWorld(pt.x, pt.y);
        return new THREE.Vector3(w.x, 0, w.z);
      });

      if (rawPoints.length < 2) continue;

      const pts = resamplePoints(rawPoints, 8);
      const halfW = segment.width / 2;

      this.roadRibbons.push({ worldPoints: pts, halfW, isBridge: false });

      const cumDists = [0];
      for (let i = 0; i < pts.length - 1; i++) {
        cumDists.push(cumDists[i] + pts[i].distanceTo(pts[i + 1]));
      }
      const totalLen = cumDists[cumDists.length - 1];

      // Check if start or end touches a multi-way junction
      let startCut = 0;
      for (const j of MULTI_JUNCTIONS) {
        if (Math.hypot(pts[0].x - j.x, pts[0].z - j.z) < 2.5) {
          startCut = j.radius;
          break;
        }
      }

      let endCut = 0;
      const lastPt = pts[pts.length - 1];
      for (const j of MULTI_JUNCTIONS) {
        if (Math.hypot(lastPt.x - j.x, lastPt.z - j.z) < 2.5) {
          endCut = j.radius;
          break;
        }
      }

      const dStart = Math.min(startCut, totalLen * 0.45);
      const dEnd = Math.max(totalLen - endCut, dStart + 2.0);

      // A. Asphalt Ribbon: Extends 1.5m into junctions for seamless overlap with junction discs
      const asphSpan = samplePointsInRange(
        pts,
        cumDists,
        Math.max(0, dStart - 1.5),
        Math.min(totalLen, dEnd + 1.5),
        8
      );
      addRibbon(
        asphSpan.points,
        asphSpan.perps,
        () => -halfW,
        () => halfW,
        0.03,
        roadPos,
        roadNorm,
        roadInd,
        () => roadVO,
        (v) => (roadVO = v)
      );

      // B. Curbs, Sidewalks, and White Shoulder Lines: Strictly between dStart and dEnd
      // (They NEVER enter the intersection plaza!)
      const roadSpan = samplePointsInRange(pts, cumDists, dStart, dEnd, 8);
      const sPts = roadSpan.points;
      const sPerps = roadSpan.perps;

      if (sPts.length >= 2) {
        // White Outer Shoulder Lines
        addRibbon(
          sPts,
          sPerps,
          () => -halfW + 0.35,
          () => -halfW + 0.55,
          0.034,
          whitePos,
          whiteNorm,
          whiteInd,
          () => whiteVO,
          (v) => (whiteVO = v)
        );
        addRibbon(
          sPts,
          sPerps,
          () => halfW - 0.55,
          () => halfW - 0.35,
          0.034,
          whitePos,
          whiteNorm,
          whiteInd,
          () => whiteVO,
          (v) => (whiteVO = v)
        );

        // Curbs
        const curbW = 0.35;
        addRibbon(
          sPts,
          sPerps,
          () => -halfW - curbW,
          () => -halfW,
          0.045,
          curbPos,
          curbNorm,
          curbInd,
          () => curbVO,
          (v) => (curbVO = v)
        );
        addRibbon(
          sPts,
          sPerps,
          () => halfW,
          () => halfW + curbW,
          0.045,
          curbPos,
          curbNorm,
          curbInd,
          () => curbVO,
          (v) => (curbVO = v)
        );

        // Sidewalks
        const swW = 2.6;
        addRibbon(
          sPts,
          sPerps,
          () => -halfW - curbW - swW,
          () => -halfW - curbW,
          0.045,
          swPos,
          swNorm,
          swInd,
          () => swVO,
          (v) => (swVO = v)
        );
        addRibbon(
          sPts,
          sPerps,
          () => halfW + curbW,
          () => halfW + curbW + swW,
          0.045,
          swPos,
          swNorm,
          swInd,
          () => swVO,
          (v) => (swVO = v)
        );

        // Concrete Curb End-Caps sealing the sidewalk ends facing the street
        const endCapInfos = [
          { pt: sPts[0], perp: sPerps[0], tSign: 1, active: startCut > 0 },
          { pt: sPts[sPts.length - 1], perp: sPerps[sPerps.length - 1], tSign: -1, active: endCut > 0 },
        ];
        for (const ec of endCapInfos) {
          if (!ec.active) continue;
          const tang = new THREE.Vector3(ec.perp.z, 0, -ec.perp.x).multiplyScalar(ec.tSign);

          // Left sidewalk cap
          const l1 = ec.pt.clone().addScaledVector(ec.perp, -halfW - curbW - swW);
          const l2 = ec.pt.clone().addScaledVector(ec.perp, -halfW);
          const l3 = l2.clone().addScaledVector(tang, 0.35);
          const l4 = l1.clone().addScaledVector(tang, 0.35);
          addQuad(l1, l2, l3, l4, 0.045, curbPos, curbNorm, curbInd, () => curbVO, (v) => (curbVO = v));

          // Right sidewalk cap
          const r1 = ec.pt.clone().addScaledVector(ec.perp, halfW);
          const r2 = ec.pt.clone().addScaledVector(ec.perp, halfW + curbW + swW);
          const r3 = r2.clone().addScaledVector(tang, 0.35);
          const r4 = r1.clone().addScaledVector(tang, 0.35);
          addQuad(r1, r2, r3, r4, 0.045, curbPos, curbNorm, curbInd, () => curbVO, (v) => (curbVO = v));
        }

        // C. Clean Crosswalks and Stop Bars at Junction Entrances
        if (startCut > 0) {
          const pt = sPts[0];
          const perp = sPerps[0];
          const tang = new THREE.Vector3(perp.z, 0, -perp.x); // points into junction

          // Stop bar across the roadway
          const stopCenter = pt.clone().addScaledVector(tang, 0.6);
          const sl0 = stopCenter.clone().addScaledVector(perp, -halfW + 0.4).addScaledVector(tang, -0.25);
          const sl1 = stopCenter.clone().addScaledVector(perp, halfW - 0.4).addScaledVector(tang, -0.25);
          const sl2 = stopCenter.clone().addScaledVector(perp, halfW - 0.4).addScaledVector(tang, 0.25);
          const sl3 = stopCenter.clone().addScaledVector(perp, -halfW + 0.4).addScaledVector(tang, 0.25);
          addQuad(sl0, sl1, sl2, sl3, 0.035, whitePos, whiteNorm, whiteInd, () => whiteVO, (v) => (whiteVO = v));

          // Zebra pedestrian crossing stripes
          const zebraCenter = pt.clone().addScaledVector(tang, -2.2);
          const stripeW = 0.55;
          const stripeL = 3.2;
          const period = 1.1;
          const numStripes = Math.floor((halfW * 2 - 1.8) / period);
          for (let s = 0; s < numStripes; s++) {
            const off = -(numStripes - 1) * period * 0.5 + s * period;
            const sc = zebraCenter.clone().addScaledVector(perp, off);
            const z0 = sc.clone().addScaledVector(perp, -stripeW / 2).addScaledVector(tang, -stripeL / 2);
            const z1 = sc.clone().addScaledVector(perp, stripeW / 2).addScaledVector(tang, -stripeL / 2);
            const z2 = sc.clone().addScaledVector(perp, stripeW / 2).addScaledVector(tang, stripeL / 2);
            const z3 = sc.clone().addScaledVector(perp, -stripeW / 2).addScaledVector(tang, stripeL / 2);
            addQuad(z0, z1, z2, z3, 0.035, whitePos, whiteNorm, whiteInd, () => whiteVO, (v) => (whiteVO = v));
          }
        }

        if (endCut > 0) {
          const pt = sPts[sPts.length - 1];
          const perp = sPerps[sPerps.length - 1];
          const tang = new THREE.Vector3(-perp.z, 0, perp.x); // points into junction

          // Stop bar across the roadway
          const stopCenter = pt.clone().addScaledVector(tang, 0.6);
          const sl0 = stopCenter.clone().addScaledVector(perp, -halfW + 0.4).addScaledVector(tang, -0.25);
          const sl1 = stopCenter.clone().addScaledVector(perp, halfW - 0.4).addScaledVector(tang, -0.25);
          const sl2 = stopCenter.clone().addScaledVector(perp, halfW - 0.4).addScaledVector(tang, 0.25);
          const sl3 = stopCenter.clone().addScaledVector(perp, -halfW + 0.4).addScaledVector(tang, 0.25);
          addQuad(sl0, sl1, sl2, sl3, 0.035, whitePos, whiteNorm, whiteInd, () => whiteVO, (v) => (whiteVO = v));

          // Zebra pedestrian crossing stripes
          const zebraCenter = pt.clone().addScaledVector(tang, -2.2);
          const stripeW = 0.55;
          const stripeL = 3.2;
          const period = 1.1;
          const numStripes = Math.floor((halfW * 2 - 1.8) / period);
          for (let s = 0; s < numStripes; s++) {
            const off = -(numStripes - 1) * period * 0.5 + s * period;
            const sc = zebraCenter.clone().addScaledVector(perp, off);
            const z0 = sc.clone().addScaledVector(perp, -stripeW / 2).addScaledVector(tang, -stripeL / 2);
            const z1 = sc.clone().addScaledVector(perp, stripeW / 2).addScaledVector(tang, -stripeL / 2);
            const z2 = sc.clone().addScaledVector(perp, stripeW / 2).addScaledVector(tang, stripeL / 2);
            const z3 = sc.clone().addScaledVector(perp, -stripeW / 2).addScaledVector(tang, stripeL / 2);
            addQuad(z0, z1, z2, z3, 0.035, whitePos, whiteNorm, whiteInd, () => whiteVO, (v) => (whiteVO = v));
          }
        }
      }

      // D. Yellow Dashed Centerlines: Strictly inside [dStart + 4.5, dEnd - 4.5]
      // (Never enters the crosswalk or intersection!)
      const yStart = dStart + (startCut > 0 ? 4.5 : 1.0);
      const yEnd = dEnd - (endCut > 0 ? 4.5 : 1.0);
      if (yEnd > yStart + 4.0) {
        const dashSpan = yEnd - yStart;
        const period = 6.0;
        const numDashes = Math.floor(dashSpan / period);
        for (let d = 0; d < numDashes; d++) {
          const targetDist = yStart + (d + 0.5) * period;
          let curIdx = 0;
          while (curIdx < cumDists.length - 2 && cumDists[curIdx + 1] < targetDist) {
            curIdx++;
          }
          const span = cumDists[curIdx + 1] - cumDists[curIdx];
          const alpha = span > 0.0001 ? (targetDist - cumDists[curIdx]) / span : 0;
          const center = new THREE.Vector3().lerpVectors(pts[curIdx], pts[curIdx + 1], alpha);
          const tangent = new THREE.Vector3().subVectors(pts[curIdx + 1], pts[curIdx]).normalize();
          const perp = new THREE.Vector3(-tangent.z, 0, tangent.x);

          const hw = 0.175; // 35cm dash width
          const hl = 1.5;   // 3m dash length
          const c0 = center.clone().addScaledVector(perp, -hw).addScaledVector(tangent, -hl);
          const c1 = center.clone().addScaledVector(perp, hw).addScaledVector(tangent, -hl);
          const c2 = center.clone().addScaledVector(perp, hw).addScaledVector(tangent, hl);
          const c3 = center.clone().addScaledVector(perp, -hw).addScaledVector(tangent, hl);
          addQuad(c0, c1, c2, c3, 0.038, yellowPos, yellowNorm, yellowInd, () => yellowVO, (v) => (yellowVO = v));
        }
      }
    }

    // 4. Grand Roundabout ("4 road circle") at (0, -22)
    // Seamless circulating asphalt ring, raised central curb, green grass island, and circulating lane guide
    const rCenter = new THREE.Vector3(0, 0.03, -22);
    const rOuter = 18.8;
    const rInner = 6.0;

    // Asphalt Circulating Roadway Ring
    const ringGeo = new THREE.RingGeometry(rInner, rOuter, 48);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMesh = new THREE.Mesh(ringGeo, asphaltMaterial);
    ringMesh.position.set(rCenter.x, 0.03, rCenter.z);
    ringMesh.receiveShadow = true;
    this.group.add(ringMesh);

    // Central Island Curb Ring
    const islandCurbGeo = new THREE.RingGeometry(rInner - 0.5, rInner, 48);
    islandCurbGeo.rotateX(-Math.PI / 2);
    const islandCurbMesh = new THREE.Mesh(islandCurbGeo, curbMaterial);
    islandCurbMesh.position.set(rCenter.x, 0.055, rCenter.z);
    islandCurbMesh.receiveShadow = true;
    this.group.add(islandCurbMesh);

    // Central Island Green Grass Lawn
    const islandGrassGeo = new THREE.CircleGeometry(rInner - 0.5, 48);
    islandGrassGeo.rotateX(-Math.PI / 2);
    const islandGrassMesh = new THREE.Mesh(islandGrassGeo, islandGrassMaterial);
    islandGrassMesh.position.set(rCenter.x, 0.05, rCenter.z);
    islandGrassMesh.receiveShadow = true;
    this.group.add(islandGrassMesh);

    // Circulating Dashed White Lane Guide at R = 12.5m
    const rGuide = 12.5;
    const guideDashCount = 24;
    for (let i = 0; i < guideDashCount; i++) {
      const theta1 = (i / guideDashCount) * Math.PI * 2;
      const theta2 = ((i + 0.6) / guideDashCount) * Math.PI * 2;
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

    // 5. Clean Asphalt Discs for all other 3-Way Intersections (100% flat and open)
    for (const junc of MULTI_JUNCTIONS) {
      if (junc.isRoundabout) continue; // Roundabout handled above
      const juncGeo = new THREE.CircleGeometry(junc.radius + 0.5, 36);
      juncGeo.rotateX(-Math.PI / 2);
      const juncMesh = new THREE.Mesh(juncGeo, asphaltMaterial);
      juncMesh.position.set(junc.x, 0.0305, junc.z);
      juncMesh.receiveShadow = true;
      this.group.add(juncMesh);
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

    // White Edge Lines, Stop Bars, Crosswalks, and Circulating Guides
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

    // Curbs & Sidewalk End-Caps
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

      const pts = resamplePoints(rawPoints, 8);
      const halfW = segment.width / 2;

      const cumDists = [0];
      for (let i = 0; i < pts.length - 1; i++) {
        cumDists.push(cumDists[i] + pts[i].distanceTo(pts[i + 1]));
      }
      const totalLen = cumDists[cumDists.length - 1];

      let startCut = 0;
      for (const j of MULTI_JUNCTIONS) {
        if (Math.hypot(pts[0].x - j.x, pts[0].z - j.z) < 2.5) {
          startCut = j.radius;
          break;
        }
      }

      let endCut = 0;
      const lastPt = pts[pts.length - 1];
      for (const j of MULTI_JUNCTIONS) {
        if (Math.hypot(lastPt.x - j.x, lastPt.z - j.z) < 2.5) {
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
        const curbW = 0.35;
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
              // Glowing warm bulb
              instMat = new THREE.MeshStandardMaterial({
                color: 0xfffbeb,
                emissive: new THREE.Color(0xfef08a),
                emissiveIntensity: 0.9,
                roughness: 0.2,
              });
            } else {
              // Dark metallic street light pole
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

    // 2. Central Island Double Street Light at (0, -22) in the Grand Roundabout
    loader.load('/models/roads/light_curvedDouble.glb', (gltf) => {
      const centerLight = gltf.scene;
      centerLight.scale.set(8.5, 8.5, 8.5);
      centerLight.position.set(0, 0.055, -22);
      centerLight.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) {
          c.castShadow = true;
          const mesh = c as THREE.Mesh;
          if (mesh.material && (mesh.material as THREE.Material).name === 'light') {
            (mesh.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0xfef08a);
            (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.0;
          }
        }
      });
      this.group.add(centerLight);
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
