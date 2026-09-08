/**
 * TerrainMaterial.ts
 * High-performance PBR terrain material supporting blended Grass, Dirt,
 * Rock, and Sand based on terrain slope, elevation, and regional biomes.
 */

import * as THREE from 'three';

export interface BiomeWeights {
  mountain: number;
  forest: number;
  desert: number;
  city: number;
  beach: number;
  lake: number;
}

// Smoothstep utility
function smoothstep(min: number, max: number, value: number): number {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

// Color palettes
const PALETTE = {
  // Grass variants
  grassLowland: new THREE.Color(0x48792c),   // Vibrant open valley grass
  grassForest: new THREE.Color(0x2f541e),    // Dark rich woodland grass
  grassCity: new THREE.Color(0x436d2a),      // Manicured city park turf

  // Dirt & Soil variants
  dirtLoam: new THREE.Color(0x5c442a),       // Rich forest loam
  dirtTrail: new THREE.Color(0x6e5233),      // Exposed hillside earth

  // Rock & Stone variants
  rockAlpine: new THREE.Color(0x636a73),     // Weathered alpine granite
  rockCliff: new THREE.Color(0x434950),      // Dark slate cliff faces

  // Sand variants
  sandBeach: new THREE.Color(0xd2b175),      // Warm coastal beach sand
  sandDesert: new THREE.Color(0xc49752),     // Golden desert dune sand
};

/**
 * Computes exact RGB vertex color for any terrain point
 * taking into account local slope, altitude, and regional biomes.
 */
export function computeTerrainVertexColor(
  x: number,
  y: number,
  z: number,
  normal: THREE.Vector3,
  biomes: BiomeWeights
): THREE.Color {
  // 1. Slope: normal.y = 1.0 is completely flat, 0.0 is vertical cliff
  const slope = 1.0 - Math.max(0, Math.min(1, normal.y));

  // 2. Rock Weight (Steep cliffs + Alpine peaks)
  const cliffWeight = smoothstep(0.28, 0.52, slope);
  const alpineWeight = smoothstep(32.0, 58.0, y);
  let rockWeight = Math.min(1.0, cliffWeight * 1.2 + alpineWeight);

  // 3. Sand Weight (Low coastal shorelines + Desert biome)
  const coastalSand = smoothstep(2.6, 0.3, y);
  const desertSand = biomes.desert;
  let sandWeight = Math.max(coastalSand, desertSand) * (1.0 - rockWeight);

  // 4. Dirt Weight (Transition slopes between grass & rock, or forest understory)
  const slopeDirt = smoothstep(0.12, 0.32, slope) * (1.0 - rockWeight - sandWeight);
  const forestFloorDirt = biomes.forest * 0.35 * (1.0 - rockWeight - sandWeight);
  let dirtWeight = Math.min(1.0 - rockWeight - sandWeight, slopeDirt + forestFloorDirt);

  // 5. Grass Weight (Flatter ground, lush valleys, mid elevations)
  let grassWeight = Math.max(0, 1.0 - rockWeight - sandWeight - dirtWeight);

  // Normalize all 4 weights to sum to 1.0
  const totalWeight = rockWeight + sandWeight + dirtWeight + grassWeight;
  if (totalWeight > 0.0001) {
    rockWeight /= totalWeight;
    sandWeight /= totalWeight;
    dirtWeight /= totalWeight;
    grassWeight /= totalWeight;
  }

  // 6. Sub-palette selection based on biome
  // Grass selection
  const grassCol = new THREE.Color();
  if (biomes.forest > 0.3) {
    grassCol.copy(PALETTE.grassLowland).lerp(PALETTE.grassForest, biomes.forest);
  } else if (biomes.city > 0.4) {
    grassCol.copy(PALETTE.grassCity);
  } else {
    grassCol.copy(PALETTE.grassLowland);
  }

  // Rock selection
  const rockCol = new THREE.Color();
  if (y > 35) {
    rockCol.copy(PALETTE.rockAlpine);
  } else {
    rockCol.copy(PALETTE.rockCliff);
  }

  // Sand selection
  const sandCol = new THREE.Color();
  if (biomes.desert > 0.3) {
    sandCol.copy(PALETTE.sandDesert);
  } else {
    sandCol.copy(PALETTE.sandBeach);
  }

  // Dirt selection
  const dirtCol = biomes.forest > 0.3 ? PALETTE.dirtLoam : PALETTE.dirtTrail;

  // 7. Composite final blended color
  const r = grassCol.r * grassWeight + dirtCol.r * dirtWeight + rockCol.r * rockWeight + sandCol.r * sandWeight;
  const g = grassCol.g * grassWeight + dirtCol.g * dirtWeight + rockCol.g * rockWeight + sandCol.g * sandWeight;
  const b = grassCol.b * grassWeight + dirtCol.b * dirtWeight + rockCol.b * rockWeight + sandCol.b * sandWeight;
  const finalColor = new THREE.Color(r, g, b);

  // 8. Natural micro-color variegation (breaks up any repeating look across large terrain)
  const microNoise = Math.sin(x * 0.12) * Math.cos(z * 0.12) * 0.035 +
                     Math.sin(x * 0.4 + z * 0.3) * 0.02;
  finalColor.r = Math.max(0, Math.min(1, finalColor.r + microNoise));
  finalColor.g = Math.max(0, Math.min(1, finalColor.g + microNoise * 1.1));
  finalColor.b = Math.max(0, Math.min(1, finalColor.b + microNoise * 0.8));

  return finalColor;
}

/**
 * Creates a seamless procedural bump texture for realistic granular surface depth.
 */
function createProceduralNoiseTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const imgData = ctx.createImageData(256, 256);
  const data = imgData.data;

  // Generate multi-frequency high-contrast noise
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const idx = (y * 256 + x) * 4;
      const n1 = Math.sin(x * 0.15) * Math.cos(y * 0.15);
      const n2 = Math.sin(x * 0.35 + 1.2) * Math.cos(y * 0.35 + 0.8);
      const n3 = (Math.random() - 0.5) * 0.3;
      const val = Math.floor(THREE.MathUtils.clamp((n1 * 0.4 + n2 * 0.3 + n3 + 0.5) * 255, 0, 255));

      data[idx] = val;
      data[idx + 1] = val;
      data[idx + 2] = val;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(120, 120);
  texture.needsUpdate = true;
  return texture;
}

export class TerrainMaterialManager {
  public material: THREE.MeshStandardMaterial;
  private noiseTexture: THREE.CanvasTexture | null = null;

  constructor() {
    this.noiseTexture = createProceduralNoiseTexture();

    this.material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.88,
      metalness: 0.04,
      flatShading: false,
    });

    if (this.noiseTexture) {
      this.material.bumpMap = this.noiseTexture;
      this.material.bumpScale = 0.06;
    }
  }

  public dispose(): void {
    this.material.dispose();
    if (this.noiseTexture) {
      this.noiseTexture.dispose();
    }
  }
}
