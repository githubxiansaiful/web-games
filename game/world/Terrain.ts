/**
 * Terrain.ts
 * Procedural 3D Terrain System with dynamic chunk streaming, continuous analytical
 * elevation function, regional biomes, seamless normal derivation, and LOD management.
 */

import * as THREE from 'three';
import {
  WORLD_CONFIG,
  TERRAIN_REGIONS,
  worldToChunkCoord,
  chunkCoordToKey,
  ChunkCoord,
} from './WorldCoordinates';
import { TerrainMaterialManager, BiomeWeights } from './TerrainMaterial';
import { TerrainChunk } from './TerrainChunk';

// Lightweight, deterministic 2D Simplex / Gradient Noise generator
class FastNoise2D {
  private perm: Uint8Array;
  private gradP: Float32Array;

  constructor(seed: number = 42) {
    this.perm = new Uint8Array(512);
    this.gradP = new Float32Array(512 * 2);

    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;

    // Deterministic Fisher-Yates shuffle with seed
    let s = seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 1664525 + 1013904223) % 4294967296;
      const j = Math.floor((s / 4294967296) * (i + 1));
      const temp = p[i];
      p[i] = p[j];
      p[j] = temp;
    }

    const gradients: [number, number][] = [
      [1, 1], [-1, 1], [1, -1], [-1, -1],
      [1, 0], [-1, 0], [0, 1], [0, -1],
    ];

    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
      const g = gradients[this.perm[i] % gradients.length];
      this.gradP[i * 2] = g[0];
      this.gradP[i * 2 + 1] = g[1];
    }
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  public noise(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = this.fade(xf);
    const v = this.fade(yf);

    const aa = this.perm[X] + Y;
    const ab = this.perm[X] + Y + 1;
    const ba = this.perm[X + 1] + Y;
    const bb = this.perm[X + 1] + Y + 1;

    const gAA_x = this.gradP[aa * 2];
    const gAA_y = this.gradP[aa * 2 + 1];
    const gBA_x = this.gradP[ba * 2];
    const gBA_y = this.gradP[ba * 2 + 1];
    const gAB_x = this.gradP[ab * 2];
    const gAB_y = this.gradP[ab * 2 + 1];
    const gBB_x = this.gradP[bb * 2];
    const gBB_y = this.gradP[bb * 2 + 1];

    const dAA = gAA_x * xf + gAA_y * yf;
    const dBA = gBA_x * (xf - 1) + gBA_y * yf;
    const dAB = gAB_x * xf + gAB_y * (yf - 1);
    const dBB = gBB_x * (xf - 1) + gBB_y * (yf - 1);

    const x1 = this.lerp(dAA, dBA, u);
    const x2 = this.lerp(dAB, dBB, u);
    return this.lerp(x1, x2, v);
  }

  public fbm(x: number, y: number, octaves: number = 3, lacunarity: number = 2.0, gain: number = 0.5): number {
    let sum = 0;
    let amp = 1;
    let freq = 1;
    let maxAmp = 0;

    for (let i = 0; i < octaves; i++) {
      sum += this.noise(x * freq, y * freq) * amp;
      maxAmp += amp;
      amp *= gain;
      freq *= lacunarity;
    }

    return sum / maxAmp;
  }
}

export class Terrain {
  public group: THREE.Group;
  public materialManager: TerrainMaterialManager;
  private chunks: Map<string, TerrainChunk> = new Map();
  private noise: FastNoise2D;
  private lastPlayerChunk: ChunkCoord = { cx: 9999, cz: 9999 };

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'OpenWorldTerrain';
    this.materialManager = new TerrainMaterialManager();
    this.noise = new FastNoise2D(1337);

    // Initial pre-generation of core island chunks around origin (0, 0)
    this.prepopulateIslandChunks();
  }

  /**
   * Pre-loads the core territory so the player immediately enters
   * an active 3D world with no loading delay.
   */
  private prepopulateIslandChunks(): void {
    const radius = 6; // -6 to +6 chunks = 1300m x 1300m initial active zone
    for (let cx = -radius; cx <= radius; cx++) {
      for (let cz = -radius; cz <= radius; cz++) {
        const distSq = (cx * 100) ** 2 + (cz * 100) ** 2;
        const lod = distSq < 160 * 160 ? 0 : distSq < 360 * 360 ? 1 : 2;
        this.getOrCreateChunk(cx, cz, lod);
      }
    }
  }

  /**
   * Master Continuous Analytical Elevation Function H(x, z).
   * Evaluates elevation at any world coordinate in microseconds.
   */
  public getHeightAt = (x: number, z: number): number => {
    // 1. Distance from island center & coastal dropoff
    // The island spans roughly -650 to 650 in X, -480 to 480 in Z
    const normX = x / 660;
    const normZ = z / 490;
    const islandDist = Math.sqrt(normX * normX + normZ * normZ);

    // Fractal coastline variation
    const coastNoise = this.noise.noise(x * 0.005, z * 0.005) * 0.12 +
                       this.noise.noise(x * 0.015, z * 0.015) * 0.05;
    const effectiveDist = islandDist + coastNoise;

    // 2. Open Ocean Water Bed (Beyond coastal perimeter)
    if (effectiveDist > 1.35) {
      // Distant backdrop mountains around far horizon (x > 1800, z < -1600)
      if (z < -1400 || Math.abs(x) > 1800) {
        const backdropMtn = Math.max(0, this.noise.fbm(x * 0.002, z * 0.002, 3) * 65);
        return backdropMtn > 5 ? backdropMtn - 2 : -4.0;
      }
      return -3.5; // Coastal shallow sea bed
    }

    // 3. Regional Biome Influences
    let totalWeight = 0;
    let cityWeight = 0;
    let mountainWeight = 0;
    let forestWeight = 0;
    let desertWeight = 0;
    let lakeWeight = 0;
    let beachWeight = 0;

    for (const reg of TERRAIN_REGIONS) {
      const dx = x - reg.centerX;
      const dz = z - reg.centerZ;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d < reg.radius) {
        const w = (1 - d / reg.radius) ** 2; // Smooth quadratic falloff
        totalWeight += w;

        if (reg.biome === 'city') cityWeight += w;
        else if (reg.biome === 'mountain') mountainWeight += w;
        else if (reg.biome === 'forest') forestWeight += w;
        else if (reg.biome === 'desert') desertWeight += w;
        else if (reg.biome === 'lake') lakeWeight += w;
        else if (reg.biome === 'beach') beachWeight += w;
      }
    }

    if (totalWeight > 0.0001) {
      cityWeight /= totalWeight;
      mountainWeight /= totalWeight;
      forestWeight /= totalWeight;
      desertWeight /= totalWeight;
      lakeWeight /= totalWeight;
      beachWeight /= totalWeight;
    }

    // 4. Base Elevation Calculations per Biome

    // A. Northern Mountains (Mount Crest & Caldera Pass: z < -140)
    let mountainH = 0;
    if (z < -100 || mountainWeight > 0.05) {
      const mtnBase = (1.0 - Math.abs(this.noise.noise(x * 0.0045, z * 0.0045))) * 50.0;
      const mtnRidge = (1.0 - Math.abs(this.noise.noise(x * 0.009, z * 0.009))) * 26.0;
      const mtnMicro = this.noise.noise(x * 0.02, z * 0.02) * 5.0;
      const northFactor = Math.max(0, Math.min(1, (-z - 120) / 220));
      const mFactor = Math.max(mountainWeight, northFactor * 0.85);
      mountainH = (mtnBase + mtnRidge + mtnMicro) * mFactor;
    }

    // B. Forest Hills (Redwood & Northwood)
    let forestH = 0;
    if (forestWeight > 0.05) {
      const fHills = this.noise.fbm(x * 0.007, z * 0.007, 3) * 22.0 + 8.0;
      forestH = fHills * forestWeight;
    }

    // C. Desert Dunes (Sandy Ridge)
    let desertH = 0;
    if (desertWeight > 0.05) {
      const duneWaves = Math.sin((x * 0.7 + z * 0.5) * 0.035) * 4.5;
      const duneNoise = this.noise.noise(x * 0.008, z * 0.008) * 14.0 + 7.0;
      desertH = (duneWaves + duneNoise) * desertWeight;
    }

    // D. Central City & Commercial Plains (Flat, smooth foundation for streets & buildings)
    let cityH = 0;
    if (cityWeight > 0.05) {
      cityH = 0.8 * cityWeight;
    }

    // E. Lakeview Crater Depression
    let lakeOffset = 0;
    if (lakeWeight > 0.05) {
      lakeOffset = -2.2 * lakeWeight;
    }

    // F. General rolling lowlands
    const baseLowlands = (this.noise.fbm(x * 0.004, z * 0.004, 2) + 0.5) * 4.0;

    // 5. Combine and Smoothly Blend
    let finalHeight = baseLowlands * (1.0 - cityWeight * 0.95);
    finalHeight += mountainH;
    finalHeight += forestH;
    finalHeight += desertH;
    finalHeight += cityH;
    finalHeight += lakeOffset;

    // If cityWeight dominates, clamp roughness strictly for smooth urban roads
    if (cityWeight > 0.5) {
      finalHeight = THREE.MathUtils.lerp(finalHeight, 0.8, cityWeight * 0.85);
    }

    // 6. Coastal Edge Falloff to Beach and Ocean
    // Shoreline zone: effectiveDist between 0.85 and 1.25
    if (effectiveDist > 0.85) {
      const shoreT = Math.max(0, Math.min(1, (effectiveDist - 0.85) / 0.4));
      // Slopes down into water level (-0.5m)
      finalHeight = THREE.MathUtils.lerp(finalHeight, -0.6, shoreT);
    }

    return finalHeight;
  };

  /**
   * Continuous Analytical Normal Vector calculation
   * Uses central symmetric difference to guarantee zero visible chunk borders.
   */
  public getNormalAt = (x: number, z: number): THREE.Vector3 => {
    const eps = 0.5;
    const hL = this.getHeightAt(x - eps, z);
    const hR = this.getHeightAt(x + eps, z);
    const hD = this.getHeightAt(x, z - eps);
    const hU = this.getHeightAt(x, z + eps);

    const dx = (hR - hL) / (2 * eps);
    const dz = (hU - hD) / (2 * eps);

    const normal = new THREE.Vector3(-dx, 1.0, -dz).normalize();
    return normal;
  };

  /**
   * Returns biome influence weights at (x, z) for material shading.
   */
  public getBiomeWeightsAt = (x: number, z: number): BiomeWeights => {
    let mountain = 0;
    let forest = 0;
    let desert = 0;
    let city = 0;
    let beach = 0;
    let lake = 0;
    let total = 0;

    for (const reg of TERRAIN_REGIONS) {
      const dx = x - reg.centerX;
      const dz = z - reg.centerZ;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d < reg.radius) {
        const w = (1 - d / reg.radius) ** 2;
        total += w;
        if (reg.biome === 'mountain') mountain += w;
        else if (reg.biome === 'forest') forest += w;
        else if (reg.biome === 'desert') desert += w;
        else if (reg.biome === 'city') city += w;
        else if (reg.biome === 'beach') beach += w;
        else if (reg.biome === 'lake') lake += w;
      }
    }

    if (total > 0.0001) {
      mountain /= total;
      forest /= total;
      desert /= total;
      city /= total;
      beach /= total;
      lake /= total;
    }

    // Also consider altitude for alpine/mountain
    const y = this.getHeightAt(x, z);
    if (y > 32) {
      mountain = Math.max(mountain, Math.min(1, (y - 30) / 25));
    }

    // Also consider coastal proximity for beach
    const distToCenter = Math.sqrt((x / 660) ** 2 + (z / 490) ** 2);
    if (distToCenter > 0.85 && distToCenter < 1.25 && y < 3.0) {
      beach = Math.max(beach, 0.85);
    }

    return { mountain, forest, desert, city, beach, lake };
  };

  /**
   * Retrieves or instantiates a chunk with specified LOD.
   */
  private getOrCreateChunk(cx: number, cz: number, lod: number): TerrainChunk {
    const key = chunkCoordToKey(cx, cz);
    let chunk = this.chunks.get(key);

    if (!chunk) {
      chunk = new TerrainChunk(
        cx,
        cz,
        this.materialManager.material,
        this.getHeightAt,
        this.getNormalAt,
        this.getBiomeWeightsAt
      );
      this.chunks.set(key, chunk);
    }

    chunk.setLOD(lod, this.group);
    return chunk;
  }

  /**
   * Updates terrain chunks around player's active position.
   * Dynamically loads new chunks, adjusts LOD levels, and cleans up distant chunks.
   */
  public update(playerPos: THREE.Vector3): void {
    const playerChunk = worldToChunkCoord(playerPos.x, playerPos.z);

    // Only run chunk grid scan if player crossed into a new chunk or on periodic checks
    const chunkDx = Math.abs(playerChunk.cx - this.lastPlayerChunk.cx);
    const chunkDz = Math.abs(playerChunk.cz - this.lastPlayerChunk.cz);
    if (chunkDx < 1 && chunkDz < 1) return;

    this.lastPlayerChunk = playerChunk;

    const viewChunkRadius = Math.ceil(WORLD_CONFIG.VIEW_DISTANCE / WORLD_CONFIG.CHUNK_SIZE);
    const activeKeys = new Set<string>();

    for (let dx = -viewChunkRadius; dx <= viewChunkRadius; dx++) {
      for (let dz = -viewChunkRadius; dz <= viewChunkRadius; dz++) {
        const cx = playerChunk.cx + dx;
        const cz = playerChunk.cz + dz;

        const worldCenterX = (cx + 0.5) * WORLD_CONFIG.CHUNK_SIZE;
        const worldCenterZ = (cz + 0.5) * WORLD_CONFIG.CHUNK_SIZE;
        const distToPlayer = Math.sqrt(
          (worldCenterX - playerPos.x) ** 2 + (worldCenterZ - playerPos.z) ** 2
        );

        if (distToPlayer > WORLD_CONFIG.VIEW_DISTANCE) continue;

        const key = chunkCoordToKey(cx, cz);
        activeKeys.add(key);

        const lod = distToPlayer < WORLD_CONFIG.LOD0_DISTANCE
          ? 0
          : distToPlayer < WORLD_CONFIG.LOD1_DISTANCE
          ? 1
          : 2;

        this.getOrCreateChunk(cx, cz, lod);
      }
    }

    // Clean up out-of-range chunks
    const maxRetainDistance = WORLD_CONFIG.VIEW_DISTANCE + 150;
    const toRemove: string[] = [];

    this.chunks.forEach((chunk, key) => {
      const dist = Math.sqrt(
        (chunk.bounds.centerX - playerPos.x) ** 2 + (chunk.bounds.centerZ - playerPos.z) ** 2
      );
      if (dist > maxRetainDistance) {
        chunk.dispose(this.group);
        toRemove.push(key);
      }
    });

    for (const key of toRemove) {
      this.chunks.delete(key);
    }
  }

  public dispose(): void {
    this.chunks.forEach((chunk) => chunk.dispose(this.group));
    this.chunks.clear();
    this.materialManager.dispose();
  }
}
