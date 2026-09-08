export interface Point2D {
  x: number;
  y: number;
}

export interface RoadSegment {
  id: string;
  isBridge: boolean;
  width: number;
  points: Point2D[]; // in SVG coords (0..1536, 0..1024)
}

export interface DistrictInfo {
  id: string;
  name: string;
  category: string;
  svgPos: Point2D;
  worldPos: { x: number; z: number };
  buildingCount: number;
  buildingType: 'skyscraper' | 'commercial' | 'industrial' | 'residential' | 'airport' | 'resort';
}

// Convert SVG coordinate (1536x1024) to 3D World (meters, centered on Central City 750, 440)
export function svgToWorld(svgX: number, svgY: number): { x: number; z: number } {
  return {
    x: svgX - 750,
    z: svgY - 440,
  };
}

export function worldToSvg(wx: number, wz: number): { x: number; y: number } {
  return {
    x: 750 + wx,
    y: 440 + wz,
  };
}

// Cubic Bezier interpolation helper
function sampleCubicBezier(
  p0: Point2D,
  cp1: Point2D,
  cp2: Point2D,
  p1: Point2D,
  steps: number = 10
): Point2D[] {
  const points: Point2D[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;

    points.push({
      x: uuu * p0.x + 3 * uu * t * cp1.x + 3 * u * tt * cp2.x + ttt * p1.x,
      y: uuu * p0.y + 3 * uu * t * cp1.y + 3 * u * tt * cp2.y + ttt * p1.y,
    });
  }
  return points;
}

export const ISLAND_DISTRICTS: DistrictInfo[] = [
  { id: 'central-city', name: 'Central City', category: 'DOWNTOWN', svgPos: { x: 750, y: 440 }, worldPos: svgToWorld(750, 440), buildingCount: 16, buildingType: 'skyscraper' },
  { id: 'riverside', name: 'Riverside', category: 'MIDTOWN', svgPos: { x: 535, y: 505 }, worldPos: svgToWorld(535, 505), buildingCount: 10, buildingType: 'commercial' },
  { id: 'oak-heights', name: 'Oak Heights', category: 'RESIDENTIAL', svgPos: { x: 1030, y: 382 }, worldPos: svgToWorld(1030, 382), buildingCount: 12, buildingType: 'residential' },
  { id: 'harborview', name: 'Harborview', category: 'PORT DISTRICT', svgPos: { x: 1030, y: 548 }, worldPos: svgToWorld(1030, 548), buildingCount: 8, buildingType: 'industrial' },
  { id: 'southbridge', name: 'Southbridge', category: 'COMMERCIAL', svgPos: { x: 765, y: 628 }, worldPos: svgToWorld(765, 628), buildingCount: 10, buildingType: 'commercial' },
  { id: 'sunset-bay', name: 'Sunset Bay', category: 'BEACH AREA', svgPos: { x: 1085, y: 718 }, worldPos: svgToWorld(1085, 718), buildingCount: 8, buildingType: 'resort' },
  { id: 'dragon-island', name: 'Dragon Island', category: 'PRIVATE ISLAND', svgPos: { x: 1255, y: 600 }, worldPos: svgToWorld(1255, 600), buildingCount: 6, buildingType: 'resort' },
  { id: 'west-end', name: 'West End', category: 'BUSINESS', svgPos: { x: 530, y: 688 }, worldPos: svgToWorld(530, 688), buildingCount: 10, buildingType: 'commercial' },
  { id: 'skyline-airport', name: 'Skyline Airport', category: 'INTERNATIONAL', svgPos: { x: 235, y: 758 }, worldPos: svgToWorld(235, 758), buildingCount: 6, buildingType: 'airport' },
  { id: 'pacific-bluffs', name: 'Pacific Bluffs', category: 'LUXURY HOMES', svgPos: { x: 305, y: 540 }, worldPos: svgToWorld(305, 540), buildingCount: 8, buildingType: 'residential' },
  { id: 'northwood', name: 'Northwood', category: 'RESIDENTIAL', svgPos: { x: 245, y: 262 }, worldPos: svgToWorld(245, 262), buildingCount: 8, buildingType: 'residential' },
  { id: 'lakeview', name: 'Lakeview', category: 'RECREATION', svgPos: { x: 535, y: 325 }, worldPos: svgToWorld(535, 325), buildingCount: 6, buildingType: 'residential' },
  { id: 'mount-crest', name: 'Mount Crest', category: 'NATIONAL PARK', svgPos: { x: 480, y: 108 }, worldPos: svgToWorld(480, 108), buildingCount: 4, buildingType: 'residential' },
  { id: 'redwood', name: 'Redwood', category: 'FOREST', svgPos: { x: 795, y: 192 }, worldPos: svgToWorld(795, 192), buildingCount: 4, buildingType: 'residential' },
  { id: 'caldera-pass', name: 'Caldera Pass', category: 'MOUNTAIN ROAD', svgPos: { x: 895, y: 50 }, worldPos: svgToWorld(895, 50), buildingCount: 3, buildingType: 'industrial' },
  { id: 'sandy-ridge', name: 'Sandy Ridge', category: 'DESERT', svgPos: { x: 1015, y: 160 }, worldPos: svgToWorld(1015, 160), buildingCount: 4, buildingType: 'industrial' },
  { id: 'eastvale', name: 'Eastvale', category: 'INDUSTRIAL', svgPos: { x: 1268, y: 325 }, worldPos: svgToWorld(1268, 325), buildingCount: 10, buildingType: 'industrial' },
  { id: 'twin-beaches', name: 'Twin Beaches', category: 'HOLIDAY ZONE', svgPos: { x: 485, y: 833 }, worldPos: svgToWorld(485, 833), buildingCount: 6, buildingType: 'resort' },
  { id: 'southport', name: 'Southport', category: 'INDUSTRIAL', svgPos: { x: 810, y: 828 }, worldPos: svgToWorld(810, 828), buildingCount: 8, buildingType: 'industrial' },
  { id: 'crescent-island', name: 'Crescent Island', category: 'RESORT', svgPos: { x: 1130, y: 868 }, worldPos: svgToWorld(1130, 868), buildingCount: 6, buildingType: 'resort' },
];

export function getIslandRoadNetwork(): RoadSegment[] {
  const roads: RoadSegment[] = [];

  // 1. Bridges from game-map.svg
  roads.push({
    id: 'bridge-1',
    isBridge: true,
    width: 14,
    points: [
      ...sampleCubicBezier({ x: 305, y: 540 }, { x: 299.2, y: 551.7 }, { x: 281.7, y: 573.7 }, { x: 270.0, y: 610.0 }, 8),
      ...sampleCubicBezier({ x: 270.0, y: 610.0 }, { x: 258.3, y: 646.3 }, { x: 240.8, y: 733.3 }, { x: 235.0, y: 758.0 }, 8).slice(1),
    ],
  });

  roads.push({
    id: 'bridge-2',
    isBridge: true,
    width: 14,
    points: [
      ...sampleCubicBezier({ x: 1030, y: 548 }, { x: 1034.2, y: 558.3 }, { x: 1045.8, y: 581.7 }, { x: 1055.0, y: 610.0 }, 8),
      ...sampleCubicBezier({ x: 1055.0, y: 610.0 }, { x: 1064.2, y: 638.3 }, { x: 1080.0, y: 700.0 }, { x: 1085.0, y: 718.0 }, 8).slice(1),
    ],
  });

  roads.push({
    id: 'bridge-3',
    isBridge: true,
    width: 14,
    points: [
      ...sampleCubicBezier({ x: 1085, y: 718 }, { x: 1099.2, y: 713.3 }, { x: 1141.7, y: 709.7 }, { x: 1170.0, y: 690.0 }, 8),
      ...sampleCubicBezier({ x: 1170.0, y: 690.0 }, { x: 1198.3, y: 670.3 }, { x: 1240.8, y: 615.0 }, { x: 1255.0, y: 600.0 }, 8).slice(1),
    ],
  });

  roads.push({
    id: 'bridge-4',
    isBridge: true,
    width: 14,
    points: [
      ...sampleCubicBezier({ x: 1085, y: 718 }, { x: 1088.3, y: 730.0 }, { x: 1097.5, y: 765.0 }, { x: 1105.0, y: 790.0 }, 8),
      ...sampleCubicBezier({ x: 1105.0, y: 790.0 }, { x: 1112.5, y: 815.0 }, { x: 1125.8, y: 855.0 }, { x: 1130.0, y: 868.0 }, 8).slice(1),
    ],
  });

  roads.push({
    id: 'bridge-5',
    isBridge: true,
    width: 14,
    points: [
      ...sampleCubicBezier({ x: 810, y: 828 }, { x: 783.3, y: 821.7 }, { x: 704.2, y: 789.2 }, { x: 650.0, y: 790.0 }, 8),
      ...sampleCubicBezier({ x: 650.0, y: 790.0 }, { x: 595.8, y: 790.8 }, { x: 512.5, y: 825.8 }, { x: 485.0, y: 833.0 }, 8).slice(1),
    ],
  });

  roads.push({
    id: 'bridge-6',
    isBridge: true,
    width: 14,
    points: [
      ...sampleCubicBezier({ x: 750, y: 418 }, { x: 775.0, y: 426.7 }, { x: 853.3, y: 448.3 }, { x: 900.0, y: 470.0 }, 8),
      ...sampleCubicBezier({ x: 900.0, y: 470.0 }, { x: 946.7, y: 491.7 }, { x: 1008.3, y: 535.0 }, { x: 1030.0, y: 548.0 }, 8).slice(1),
    ],
  });

  // 2. Highway Arterials & Roads from game-map.svg
  roads.push({
    id: 'road-1',
    isBridge: false,
    width: 16,
    points: [
      ...sampleCubicBezier({ x: 235, y: 758 }, { x: 250.8, y: 748.3 }, { x: 280.8, y: 711.7 }, { x: 330.0, y: 700.0 }, 8),
      ...sampleCubicBezier({ x: 330.0, y: 700.0 }, { x: 379.2, y: 688.3 }, { x: 496.7, y: 690.0 }, { x: 530.0, y: 688.0 }, 8).slice(1),
    ],
  });

  roads.push({
    id: 'road-2',
    isBridge: false,
    width: 16,
    points: [{ x: 530, y: 688 }, { x: 765, y: 628 }],
  });

  roads.push({
    id: 'road-3',
    isBridge: false,
    width: 18,
    points: [{ x: 765, y: 628 }, { x: 750, y: 418 }],
  });

  roads.push({
    id: 'road-4',
    isBridge: false,
    width: 16,
    points: [{ x: 750, y: 418 }, { x: 535, y: 505 }],
  });

  roads.push({
    id: 'road-5',
    isBridge: false,
    width: 16,
    points: [
      ...sampleCubicBezier({ x: 535, y: 505 }, { x: 512.5, y: 492.5 }, { x: 448.3, y: 470.5 }, { x: 400.0, y: 430.0 }, 8),
      ...sampleCubicBezier({ x: 400.0, y: 430.0 }, { x: 351.7, y: 389.5 }, { x: 270.8, y: 290.0 }, { x: 245.0, y: 262.0 }, 8).slice(1),
    ],
  });

  roads.push({
    id: 'road-6',
    isBridge: false,
    width: 16,
    points: [
      ...sampleCubicBezier({ x: 245, y: 262 }, { x: 252.5, y: 288.3 }, { x: 280.0, y: 373.7 }, { x: 290.0, y: 420.0 }, 8),
      ...sampleCubicBezier({ x: 290.0, y: 420.0 }, { x: 300.0, y: 466.3 }, { x: 302.5, y: 520.0 }, { x: 305.0, y: 540.0 }, 8).slice(1),
    ],
  });

  roads.push({
    id: 'road-7',
    isBridge: false,
    width: 16,
    points: [
      ...sampleCubicBezier({ x: 305, y: 540 }, { x: 299.2, y: 556.7 }, { x: 281.7, y: 603.7 }, { x: 270.0, y: 640.0 }, 8),
      ...sampleCubicBezier({ x: 270.0, y: 640.0 }, { x: 258.3, y: 676.3 }, { x: 240.8, y: 738.3 }, { x: 235.0, y: 758.0 }, 8).slice(1),
    ],
  });

  roads.push({
    id: 'road-8',
    isBridge: false,
    width: 16,
    points: [
      ...sampleCubicBezier({ x: 535, y: 505 }, { x: 525.8, y: 490.8 }, { x: 480.0, y: 450.0 }, { x: 480.0, y: 420.0 }, 8),
      ...sampleCubicBezier({ x: 480.0, y: 420.0 }, { x: 480.0, y: 390.0 }, { x: 525.8, y: 340.8 }, { x: 535.0, y: 325.0 }, 8).slice(1),
    ],
  });

  roads.push({
    id: 'road-9',
    isBridge: false,
    width: 16,
    points: [
      ...sampleCubicBezier({ x: 535, y: 325 }, { x: 554.2, y: 314.2 }, { x: 606.7, y: 282.2 }, { x: 650.0, y: 260.0 }, 8),
      ...sampleCubicBezier({ x: 650.0, y: 260.0 }, { x: 693.3, y: 237.8 }, { x: 770.8, y: 203.3 }, { x: 795.0, y: 192.0 }, 8).slice(1),
    ],
  });

  roads.push({
    id: 'road-10',
    isBridge: false,
    width: 14,
    points: [
      ...sampleCubicBezier({ x: 795, y: 192 }, { x: 800.8, y: 181.7 }, { x: 813.3, y: 153.7 }, { x: 830.0, y: 130.0 }, 8),
      ...sampleCubicBezier({ x: 830.0, y: 130.0 }, { x: 846.7, y: 106.3 }, { x: 884.2, y: 63.3 }, { x: 895.0, y: 50.0 }, 8).slice(1),
    ],
  });

  roads.push({
    id: 'road-11',
    isBridge: false,
    width: 16,
    points: [
      ...sampleCubicBezier({ x: 795, y: 192 }, { x: 809.2, y: 191.7 }, { x: 843.3, y: 195.3 }, { x: 880.0, y: 190.0 }, 8),
      ...sampleCubicBezier({ x: 880.0, y: 190.0 }, { x: 916.7, y: 184.7 }, { x: 992.5, y: 165.0 }, { x: 1015.0, y: 160.0 }, 8).slice(1),
    ],
  });

  roads.push({
    id: 'road-12',
    isBridge: false,
    width: 16,
    points: [
      ...sampleCubicBezier({ x: 1015, y: 160 }, { x: 1039.2, y: 171.7 }, { x: 1117.8, y: 202.5 }, { x: 1160.0, y: 230.0 }, 8),
      ...sampleCubicBezier({ x: 1160.0, y: 230.0 }, { x: 1202.2, y: 257.5 }, { x: 1250.0, y: 309.2 }, { x: 1268.0, y: 325.0 }, 8).slice(1),
    ],
  });

  roads.push({
    id: 'road-13',
    isBridge: false,
    width: 16,
    points: [
      ...sampleCubicBezier({ x: 750, y: 418 }, { x: 771.7, y: 415.0 }, { x: 833.3, y: 406.0 }, { x: 880.0, y: 400.0 }, 8),
      ...sampleCubicBezier({ x: 880.0, y: 400.0 }, { x: 926.7, y: 394.0 }, { x: 1005.0, y: 385.0 }, { x: 1030.0, y: 382.0 }, 8).slice(1),
    ],
  });

  roads.push({
    id: 'road-14',
    isBridge: false,
    width: 16,
    points: [
      ...sampleCubicBezier({ x: 1030, y: 382 }, { x: 1050.0, y: 375.0 }, { x: 1110.3, y: 349.5 }, { x: 1150.0, y: 340.0 }, 8),
      ...sampleCubicBezier({ x: 1150.0, y: 340.0 }, { x: 1189.7, y: 330.5 }, { x: 1248.3, y: 327.5 }, { x: 1268.0, y: 325.0 }, 8).slice(1),
    ],
  });

  roads.push({
    id: 'road-15',
    isBridge: false,
    width: 16,
    points: [
      ...sampleCubicBezier({ x: 1030, y: 382 }, { x: 1030.0, y: 396.7 }, { x: 1030.0, y: 442.3 }, { x: 1030.0, y: 470.0 }, 8),
      ...sampleCubicBezier({ x: 1030.0, y: 470.0 }, { x: 1030.0, y: 497.7 }, { x: 1030.0, y: 535.0 }, { x: 1030.0, y: 548.0 }, 8).slice(1),
    ],
  });

  roads.push({
    id: 'road-16',
    isBridge: false,
    width: 16,
    points: [
      ...sampleCubicBezier({ x: 765, y: 628 }, { x: 769.2, y: 645.0 }, { x: 782.5, y: 696.7 }, { x: 790.0, y: 730.0 }, 8),
      ...sampleCubicBezier({ x: 790.0, y: 730.0 }, { x: 797.5, y: 763.3 }, { x: 806.7, y: 811.7 }, { x: 810.0, y: 828.0 }, 8).slice(1),
    ],
  });

  roads.push({
    id: 'road-17',
    isBridge: false,
    width: 16,
    points: [
      ...sampleCubicBezier({ x: 530, y: 688 }, { x: 508.3, y: 690.0 }, { x: 407.5, y: 675.8 }, { x: 400.0, y: 700.0 }, 8),
      ...sampleCubicBezier({ x: 400.0, y: 700.0 }, { x: 392.5, y: 724.2 }, { x: 470.8, y: 810.8 }, { x: 485.0, y: 833.0 }, 8).slice(1),
    ],
  });

  roads.push({
    id: 'road-18',
    isBridge: false,
    width: 16,
    points: [
      ...sampleCubicBezier({ x: 750, y: 418 }, { x: 700.0, y: 380.0 }, { x: 495.0, y: 241.7 }, { x: 450.0, y: 190.0 }, 8),
      ...sampleCubicBezier({ x: 450.0, y: 190.0 }, { x: 405.0, y: 138.3 }, { x: 475.0, y: 121.7 }, { x: 480.0, y: 108.0 }, 8).slice(1),
    ],
  });

  return roads;
}
