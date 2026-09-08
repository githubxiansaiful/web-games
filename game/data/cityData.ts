export interface BuildingDef {
  id: string;
  type: 'skyscraper' | 'commercial' | 'warehouse' | 'apartment' | 'garage';
  position: [number, number, number];
  size: [number, number, number]; // width, height, depth
  color: number;
  neonColor?: number;
  signText?: string;
}

export interface RoadDef {
  start: [number, number];
  end: [number, number];
  width: number;
  lanes: number;
}

export interface PropDef {
  type: 'streetlight' | 'tree' | 'barrier' | 'hydrant' | 'dumpster';
  position: [number, number, number];
  rotation?: number;
}

export interface CityData {
  roads: RoadDef[];
  buildings: BuildingDef[];
  props: PropDef[];
}

export const CITY_DATA: CityData = {
  roads: [
    // Central Main Grand Avenues
    { start: [0, -180], end: [0, 180], width: 18, lanes: 4 },
    { start: [-180, 0], end: [180, 0], width: 18, lanes: 4 },

    // Intermediate Cross Streets
    { start: [-180, -90], end: [180, -90], width: 14, lanes: 2 },
    { start: [-180, 90], end: [180, 90], width: 14, lanes: 2 },
    { start: [-90, -180], end: [-90, 180], width: 14, lanes: 2 },
    { start: [90, -180], end: [90, 180], width: 14, lanes: 2 },

    // Outer Perimeter Ring Roads
    { start: [-180, -180], end: [180, -180], width: 16, lanes: 2 },
    { start: [-180, 180], end: [180, 180], width: 16, lanes: 2 },
    { start: [-180, -180], end: [-180, 180], width: 16, lanes: 2 },
    { start: [180, -180], end: [180, 180], width: 16, lanes: 2 },
  ],

  buildings: [
    // Sector A: Downtown High-Rise Skyscrapers (East-North)
    { id: 'bld_corp_tower', type: 'skyscraper', position: [45, 35, -45], size: [28, 70, 28], color: 0x1e293b, neonColor: 0x06b6d4, signText: 'NEXUS CORP' },
    { id: 'bld_bank_spire', type: 'skyscraper', position: [135, 45, -45], size: [32, 90, 32], color: 0x0f172a, neonColor: 0x10b981, signText: 'METRO BANK' },
    { id: 'bld_office_1', type: 'commercial', position: [45, 22, -135], size: [30, 44, 30], color: 0x334155, neonColor: 0x3b82f6 },
    { id: 'bld_office_2', type: 'commercial', position: [135, 26, -135], size: [32, 52, 32], color: 0x1e293b, neonColor: 0x6366f1 },

    // Sector B: Northside Industrial Shipping Port & Warehouse (West-North)
    { id: 'bld_warehouse_main', type: 'warehouse', position: [-45, 12, -135], size: [42, 24, 48], color: 0x475569, neonColor: 0xf59e0b, signText: 'DOCK WAREHOUSE 07' },
    { id: 'bld_cargo_depot', type: 'warehouse', position: [-135, 10, -135], size: [40, 20, 42], color: 0x334155, neonColor: 0xef4444, signText: 'CONTAINER LOGISTICS' },
    { id: 'bld_fabrication', type: 'commercial', position: [-45, 16, -45], size: [30, 32, 30], color: 0x1e293b, neonColor: 0x0284c7 },
    { id: 'bld_power_sub', type: 'warehouse', position: [-135, 14, -45], size: [32, 28, 32], color: 0x334155, neonColor: 0xeab308 },

    // Sector C: Nightlife & Cyber District (East-South)
    { id: 'bld_neon_club', type: 'commercial', position: [45, 18, 45], size: [28, 36, 28], color: 0x18181b, neonColor: 0xec4899, signText: 'CLUB NEON' },
    { id: 'bld_arcade_casino', type: 'commercial', position: [135, 22, 45], size: [32, 44, 32], color: 0x1e1e24, neonColor: 0xa855f7, signText: 'CYBER CASINO' },
    { id: 'bld_hotel_luxe', type: 'skyscraper', position: [45, 30, 135], size: [30, 60, 30], color: 0x09090b, neonColor: 0x06b6d4, signText: 'THE APEX HOTEL' },
    { id: 'bld_strip_mall', type: 'commercial', position: [135, 14, 135], size: [34, 28, 34], color: 0x27272a, neonColor: 0xf43f5e },

    // Sector D: Residential Brownstones & Apex Garage (West-South)
    { id: 'bld_apex_garage', type: 'garage', position: [-45, 9, 45], size: [30, 18, 30], color: 0x292524, neonColor: 0x22c55e, signText: 'APEX CUSTOMS' },
    { id: 'bld_police_hq', type: 'commercial', position: [-135, 18, 45], size: [34, 36, 34], color: 0x1e293b, neonColor: 0x3b82f6, signText: 'POLICE PRECINCT 4' },
    { id: 'bld_apartments_1', type: 'apartment', position: [-45, 16, 135], size: [30, 32, 30], color: 0x3f3f46, neonColor: 0x8b5cf6 },
    { id: 'bld_apartments_2', type: 'apartment', position: [-135, 18, 135], size: [32, 36, 32], color: 0x27272a, neonColor: 0x10b981 },
  ],

  props: [
    // Streetlights along Central Grand Avenue (Z-axis)
    { type: 'streetlight', position: [-11, 0, -120] },
    { type: 'streetlight', position: [11, 0, -120] },
    { type: 'streetlight', position: [-11, 0, -60] },
    { type: 'streetlight', position: [11, 0, -60] },
    { type: 'streetlight', position: [-11, 0, 0] },
    { type: 'streetlight', position: [11, 0, 0] },
    { type: 'streetlight', position: [-11, 0, 60] },
    { type: 'streetlight', position: [11, 0, 60] },
    { type: 'streetlight', position: [-11, 0, 120] },
    { type: 'streetlight', position: [11, 0, 120] },

    // Streetlights along Boulevard (X-axis)
    { type: 'streetlight', position: [-120, 0, -11] },
    { type: 'streetlight', position: [-120, 0, 11] },
    { type: 'streetlight', position: [-60, 0, -11] },
    { type: 'streetlight', position: [-60, 0, 11] },
    { type: 'streetlight', position: [60, 0, -11] },
    { type: 'streetlight', position: [60, 0, 11] },
    { type: 'streetlight', position: [120, 0, -11] },
    { type: 'streetlight', position: [120, 0, 11] },

    // Plaza Trees
    { type: 'tree', position: [-14, 0, -15] },
    { type: 'tree', position: [14, 0, -15] },
    { type: 'tree', position: [-14, 0, 15] },
    { type: 'tree', position: [14, 0, 15] },
    { type: 'tree', position: [25, 0, 25] },
    { type: 'tree', position: [-25, 0, 25] },
    { type: 'tree', position: [25, 0, -25] },
    { type: 'tree', position: [-25, 0, -25] },

    // Dumpsters & Barriers
    { type: 'dumpster', position: [-32, 0, 32] },
    { type: 'dumpster', position: [32, 0, -32] },
    { type: 'dumpster', position: [-32, 0, -120] },
    { type: 'barrier', position: [-2, 0, -135] },
    { type: 'barrier', position: [2, 0, -135] },
  ],
};
