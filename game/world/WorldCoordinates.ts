/**
 * WorldCoordinates.ts
 * Manages spatial metrics, chunk coordinates, region configurations,
 * and biome properties across the 10,000m open world.
 */

export const WORLD_CONFIG = {
  TOTAL_WORLD_SIZE: 10000,   // 10,000m x 10,000m total world dimension
  PLAYABLE_RADIUS: 1200,     // Primary island active territory
  CHUNK_SIZE: 100,           // 100m x 100m per terrain chunk
  VIEW_DISTANCE: 650,        // Radius around player where chunks are loaded
  LOD0_DISTANCE: 160,        // LOD0 (High Detail) within 160m
  LOD1_DISTANCE: 360,        // LOD1 (Medium Detail) within 360m
  // Beyond LOD1 is LOD2 (Low Detail)
};

export interface ChunkCoord {
  cx: number;
  cz: number;
}

export interface ChunkBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  centerX: number;
  centerZ: number;
}

export function worldToChunkCoord(x: number, z: number): ChunkCoord {
  return {
    cx: Math.floor(x / WORLD_CONFIG.CHUNK_SIZE),
    cz: Math.floor(z / WORLD_CONFIG.CHUNK_SIZE),
  };
}

export function chunkCoordToKey(cx: number, cz: number): string {
  return `${cx}_${cz}`;
}

export function keyToChunkCoord(key: string): ChunkCoord {
  const parts = key.split('_');
  return {
    cx: parseInt(parts[0], 10),
    cz: parseInt(parts[1], 10),
  };
}

export function getChunkBounds(cx: number, cz: number): ChunkBounds {
  const minX = cx * WORLD_CONFIG.CHUNK_SIZE;
  const minZ = cz * WORLD_CONFIG.CHUNK_SIZE;
  const maxX = minX + WORLD_CONFIG.CHUNK_SIZE;
  const maxZ = minZ + WORLD_CONFIG.CHUNK_SIZE;
  return {
    minX,
    maxX,
    minZ,
    maxZ,
    centerX: (minX + maxX) * 0.5,
    centerZ: (minZ + maxZ) * 0.5,
  };
}

export type BiomeType = 'mountain' | 'forest' | 'desert' | 'city' | 'beach' | 'lake' | 'plains';

export interface RegionSettings {
  id: string;
  name: string;
  centerX: number;
  centerZ: number;
  radius: number;
  baseHeight: number;
  maxElevation: number;
  roughness: number;
  biome: BiomeType;
}

/**
 * Open world region presets aligned with islandMapData districts.
 */
export const TERRAIN_REGIONS: RegionSettings[] = [
  // 1. Northern Alpine Ridge (Mount Crest & Caldera Pass)
  {
    id: 'northern-mountains',
    name: 'Mount Crest & Caldera Ridge',
    centerX: -60,
    centerZ: -360,
    radius: 340,
    baseHeight: 18,
    maxElevation: 72,
    roughness: 0.85,
    biome: 'mountain',
  },
  // 2. Redwood Forest Hills
  {
    id: 'redwood-forest',
    name: 'Redwood Forest Hills',
    centerX: 45,
    centerZ: -240,
    radius: 220,
    baseHeight: 9,
    maxElevation: 28,
    roughness: 0.6,
    biome: 'forest',
  },
  // 3. Northwood Wooded Valley
  {
    id: 'northwood-valley',
    name: 'Northwood Valley',
    centerX: -490,
    centerZ: -170,
    radius: 200,
    baseHeight: 7,
    maxElevation: 22,
    roughness: 0.55,
    biome: 'forest',
  },
  // 4. Sandy Ridge Desert Dunes & Sandstone
  {
    id: 'sandy-ridge',
    name: 'Sandy Ridge Desert',
    centerX: 260,
    centerZ: -270,
    radius: 210,
    baseHeight: 6,
    maxElevation: 24,
    roughness: 0.4,
    biome: 'desert',
  },
  // 5. Central City & Downtown Plaza (Flattest for urban street grid)
  {
    id: 'central-city',
    name: 'Central City Downtown',
    centerX: 0,
    centerZ: 0,
    radius: 250,
    baseHeight: 0.8,
    maxElevation: 1.6,
    roughness: 0.04,
    biome: 'city',
  },
  // 6. Riverside & Midtown
  {
    id: 'riverside',
    name: 'Riverside Midtown',
    centerX: -215,
    centerZ: 65,
    radius: 190,
    baseHeight: 0.6,
    maxElevation: 1.4,
    roughness: 0.05,
    biome: 'city',
  },
  // 7. Southbridge & Commercial Avenue
  {
    id: 'southbridge',
    name: 'Southbridge Commercial',
    centerX: 15,
    centerZ: 188,
    radius: 200,
    baseHeight: 0.5,
    maxElevation: 1.2,
    roughness: 0.05,
    biome: 'city',
  },
  // 8. West End Business & Financial
  {
    id: 'west-end',
    name: 'West End Business',
    centerX: -220,
    centerZ: 248,
    radius: 190,
    baseHeight: 0.5,
    maxElevation: 1.2,
    roughness: 0.05,
    biome: 'city',
  },
  // 9. Harborview & East Port
  {
    id: 'harborview',
    name: 'Harborview Port',
    centerX: 280,
    centerZ: 108,
    radius: 190,
    baseHeight: 0.4,
    maxElevation: 1.2,
    roughness: 0.05,
    biome: 'city',
  },
  // 10. Lakeview Recreation Crater
  {
    id: 'lakeview',
    name: 'Lakeview Basin',
    centerX: -215,
    centerZ: -115,
    radius: 95,
    baseHeight: -1.2,
    maxElevation: 0.0,
    roughness: 0.2,
    biome: 'lake',
  },
  // 11. Sunset Bay Coastal Beach
  {
    id: 'sunset-bay',
    name: 'Sunset Bay Beaches',
    centerX: 335,
    centerZ: 278,
    radius: 160,
    baseHeight: 0.3,
    maxElevation: 1.8,
    roughness: 0.15,
    biome: 'beach',
  },
  // 12. Twin Beaches Holiday Shore
  {
    id: 'twin-beaches',
    name: 'Twin Beaches',
    centerX: -265,
    centerZ: 393,
    radius: 170,
    baseHeight: 0.3,
    maxElevation: 1.8,
    roughness: 0.15,
    biome: 'beach',
  },
  // 13. Crescent Island
  {
    id: 'crescent-island',
    name: 'Crescent Island',
    centerX: 380,
    centerZ: 428,
    radius: 140,
    baseHeight: 0.5,
    maxElevation: 4.5,
    roughness: 0.2,
    biome: 'beach',
  },
  // 14. Dragon Island
  {
    id: 'dragon-island',
    name: 'Dragon Island',
    centerX: 505,
    centerZ: 160,
    radius: 160,
    baseHeight: 0.6,
    maxElevation: 8.0,
    roughness: 0.3,
    biome: 'beach',
  },
];
