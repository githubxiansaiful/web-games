import { Building, RoadSegment, WorldProp, LootCrate, Vehicle, Enemy } from './types';

export const WORLD_WIDTH = 4000;
export const WORLD_HEIGHT = 4000;

// River centerline points from North to South
export const RIVER_POINTS: { x: number; y: number }[] = [
  { x: 1980, y: 0 },
  { x: 2020, y: 600 },
  { x: 1950, y: 1200 }, // Northern Wooden Bridge location
  { x: 1920, y: 1700 },
  { x: 2000, y: 2200 },
  { x: 2060, y: 2600 }, // Southern Stone Bridge location
  { x: 2080, y: 3200 },
  { x: 2020, y: 4000 },
];

export const RIVER_WIDTH = 130;

// Bridges across the river
export const BRIDGES = [
  { id: 'bridge_north', x: 1880, y: 1120, w: 160, h: 90, type: 'wooden' },
  { id: 'bridge_south', x: 1980, y: 2540, w: 180, h: 100, type: 'stone' },
];

export function generateRoads(): RoadSegment[] {
  return [
    // 1. Main Asphalt Highway (West -> Central Bazaar -> Stone Bridge -> East)
    { id: 'hwy_w1', x1: 0, y1: 2000, x2: 1500, y2: 2000, width: 90, type: 'asphalt' },
    { id: 'hwy_w2', x1: 1500, y1: 2000, x2: 1980, y2: 2540, width: 90, type: 'asphalt' },
    { id: 'hwy_bridge_s', x1: 1980, y1: 2540, x2: 2160, y2: 2540, width: 90, type: 'bridge' },
    { id: 'hwy_e1', x1: 2160, y1: 2540, x2: 3200, y2: 2540, width: 90, type: 'asphalt' },
    { id: 'hwy_e2', x1: 3200, y1: 2540, x2: 4000, y2: 2540, width: 90, type: 'asphalt' },

    // 2. North-South Highway
    { id: 'hwy_n1', x1: 1950, y1: 0, x2: 1880, y2: 1120, width: 85, type: 'asphalt' },
    { id: 'hwy_bridge_n', x1: 1880, y1: 1120, x2: 2040, y2: 1120, width: 85, type: 'bridge' },
    { id: 'hwy_n2', x1: 2040, y1: 1120, x2: 2100, y2: 1800, width: 85, type: 'asphalt' },
    { id: 'hwy_n3', x1: 2100, y1: 1800, x2: 2160, y2: 2540, width: 85, type: 'asphalt' },

    // 3. South Police Highway
    { id: 'hwy_s1', x1: 2160, y1: 2540, x2: 2600, y2: 3200, width: 85, type: 'asphalt' },
    { id: 'hwy_s2', x1: 2600, y1: 3200, x2: 3300, y2: 3300, width: 85, type: 'asphalt' },
    { id: 'hwy_s3', x1: 2600, y1: 3200, x2: 2600, y2: 4000, width: 85, type: 'asphalt' },

    // 4. Dirt Country Trails: North-West Bandit Sawmill Loop
    { id: 'dirt_nw1', x1: 800, y1: 2000, x2: 600, y2: 1200, width: 65, type: 'dirt' },
    { id: 'dirt_nw2', x1: 600, y1: 1200, x2: 650, y2: 500, width: 65, type: 'dirt' },
    { id: 'dirt_nw3', x1: 650, y1: 500, x2: 1200, y2: 450, width: 65, type: 'dirt' },
    { id: 'dirt_nw4', x1: 1200, y1: 450, x2: 1880, y2: 1120, width: 65, type: 'dirt' },

    // 5. Dirt Country Trails: North-East Golden Windmill Loop
    { id: 'dirt_ne1', x1: 2040, y1: 1120, x2: 2700, y2: 800, width: 65, type: 'dirt' },
    { id: 'dirt_ne2', x1: 2700, y1: 800, x2: 3400, y2: 750, width: 65, type: 'dirt' },
    { id: 'dirt_ne3', x1: 3400, y1: 750, x2: 3500, y2: 1500, width: 65, type: 'dirt' },
    { id: 'dirt_ne4', x1: 3500, y1: 1500, x2: 2800, y2: 2000, width: 65, type: 'dirt' },
    { id: 'dirt_ne5', x1: 2800, y1: 2000, x2: 2160, y2: 2540, width: 65, type: 'dirt' },

    // 6. Dirt Country Trails: South-West Rice Paddy & Duck Pond Track
    { id: 'dirt_sw1', x1: 1500, y1: 2000, x2: 1100, y2: 2700, width: 65, type: 'dirt' },
    { id: 'dirt_sw2', x1: 1100, y1: 2700, x2: 500, y2: 3100, width: 65, type: 'dirt' },
    { id: 'dirt_sw3', x1: 500, y1: 3100, x2: 700, y2: 3700, width: 65, type: 'dirt' },
    { id: 'dirt_sw4', x1: 700, y1: 3700, x2: 1500, y2: 3600, width: 65, type: 'dirt' },
    { id: 'dirt_sw5', x1: 1500, y1: 3600, x2: 1980, y2: 2540, width: 65, type: 'dirt' },
  ];
}

export function generateBuildings(): Building[] {
  return [
    // 1. Central Village Bazaar Market
    { id: 'b_market_1', x: 1550, y: 1880, w: 90, h: 60, type: 'stall', color: '#92400e', roofColor: '#ea580c', label: 'TEA & SPICE' },
    { id: 'b_market_2', x: 1670, y: 1880, w: 85, h: 60, type: 'stall', color: '#78350f', roofColor: '#f97316', label: 'FRESH FRUITS' },
    { id: 'b_market_3', x: 1780, y: 1880, w: 100, h: 65, type: 'stall', color: '#854d0e', roofColor: '#eab308', label: 'VILLAGE BAKE' },
    { id: 'b_market_4', x: 1550, y: 2060, w: 90, h: 60, type: 'stall', color: '#713f12', roofColor: '#059669', label: 'FISH STALL' },
    { id: 'b_market_5', x: 1670, y: 2060, w: 95, h: 65, type: 'stall', color: '#92400e', roofColor: '#dc2626', label: 'CLOTH & RUGS' },
    { id: 'b_market_6', x: 1790, y: 2060, w: 90, h: 60, type: 'stall', color: '#7c2d12', roofColor: '#d97706', label: 'CYCLE REPAIR' },

    // Central Village Houses
    { id: 'b_house_c1', x: 1400, y: 1750, w: 110, h: 90, type: 'house_terracotta', color: '#fef3c7', roofColor: '#b45309', label: 'Post Office' },
    { id: 'b_house_c2', x: 1400, y: 2180, w: 120, h: 95, type: 'house_brick', color: '#f3e8ff', roofColor: '#7e22ce', label: 'Doctor Clinic' },
    { id: 'b_house_c3', x: 1750, y: 1730, w: 130, h: 100, type: 'house_thatch', color: '#ffedd5', roofColor: '#ca8a04', label: 'Elder House' },

    // 2. North-West Bandit Sawmill Outpost
    { id: 'b_sawmill_main', x: 750, y: 450, w: 160, h: 120, type: 'sawmill', color: '#451a03', roofColor: '#78350f', label: 'BANDIT SAWMILL' },
    { id: 'b_sawmill_shed', x: 940, y: 480, w: 90, h: 70, type: 'barn', color: '#57534e', roofColor: '#44403c', label: 'Timber Shed' },
    { id: 'b_sawmill_shack', x: 680, y: 620, w: 80, h: 60, type: 'house_thatch', color: '#3f3f46', roofColor: '#27272a', label: 'Ammo Stash' },

    // 3. North-East Golden Farmlands & Windmill
    { id: 'b_windmill_1', x: 3100, y: 650, w: 90, h: 90, type: 'windmill', color: '#fef08a', roofColor: '#854d0e', label: 'WINDMILL' },
    { id: 'b_barn_ne', x: 3350, y: 720, w: 150, h: 110, type: 'barn', color: '#991b1b', roofColor: '#7f1d1d', label: 'Grain Silo' },
    { id: 'b_house_ne1', x: 2950, y: 920, w: 110, h: 80, type: 'house_thatch', color: '#fef9c3', roofColor: '#ca8a04', label: 'Farmstead' },

    // 4. South-West Rice Paddy Cottages
    { id: 'b_house_sw1', x: 800, y: 2950, w: 100, h: 80, type: 'house_thatch', color: '#ecfdf5', roofColor: '#15803d', label: 'Fisher Shack' },
    { id: 'b_house_sw2', x: 600, y: 3500, w: 110, h: 85, type: 'house_thatch', color: '#fef08a', roofColor: '#a16207', label: 'Rice Barn' },
    { id: 'b_house_sw3', x: 1300, y: 3400, w: 105, h: 85, type: 'house_thatch', color: '#fefce8', roofColor: '#ca8a04', label: 'Paddy Hut' },

    // 5. South-East District Police Station & Jail
    { id: 'b_police_hq', x: 3350, y: 3250, w: 170, h: 130, type: 'police_station', color: '#1e3a8a', roofColor: '#1d4ed8', label: 'POLICE DISTRICT HQ' },
    { id: 'b_police_armory', x: 3200, y: 3260, w: 100, h: 80, type: 'house_brick', color: '#1e293b', roofColor: '#334155', label: 'Armory' },
    { id: 'b_police_tower', x: 3550, y: 3250, w: 60, h: 60, type: 'house_brick', color: '#0f172a', roofColor: '#0284c7', label: 'Watchtower' },
  ];
}

export function generateWorldProps(): WorldProp[] {
  const props: WorldProp[] = [];

  // Coconut Palm Trees along river
  for (let i = 0; i < 35; i++) {
    const rx = 1860 + (Math.random() * 400 - 200);
    const ry = Math.random() * 3900 + 50;
    // Don't place on bridges
    if ((ry > 1050 && ry < 1200) || (ry > 2480 && ry < 2620)) continue;
    props.push({ x: rx, y: ry, radius: 24, type: 'palm_tree' });
  }

  // Deep Forest Grove (North-West around Sawmill)
  for (let i = 0; i < 40; i++) {
    props.push({
      x: 200 + Math.random() * 1000,
      y: 200 + Math.random() * 900,
      radius: 28 + Math.random() * 10,
      type: 'banyan_tree',
    });
  }

  // Hay Bales in North-East Farmlands
  const hayCoords = [
    { x: 2850, y: 680 },
    { x: 2950, y: 720 },
    { x: 3250, y: 620 },
    { x: 3520, y: 800 },
    { x: 3450, y: 1350 },
    { x: 3200, y: 1450 },
  ];
  hayCoords.forEach((c) => {
    props.push({ x: c.x, y: c.y, radius: 18, type: 'hay_bale' });
  });

  // Duck Ponds in South-West
  props.push({ x: 950, y: 3300, radius: 85, type: 'water_pond' });
  props.push({ x: 450, y: 2800, radius: 70, type: 'water_pond' });

  // Street Lanterns at Bazaar & Bridges
  const lanternCoords = [
    { x: 1530, y: 1980 },
    { x: 1720, y: 1980 },
    { x: 1910, y: 1980 },
    { x: 1870, y: 1100 },
    { x: 2050, y: 1100 },
    { x: 1970, y: 2520 },
    { x: 2170, y: 2520 },
    { x: 3180, y: 3230 },
    { x: 3530, y: 3230 },
  ];
  lanternCoords.forEach((c) => {
    props.push({ x: c.x, y: c.y, radius: 10, type: 'lantern' });
  });

  return props;
}

export function generateLootCrates(): LootCrate[] {
  return [
    // Bazaar Caches
    { id: 'crate_m1', x: 1730, y: 1960, w: 28, h: 28, opened: false, type: 'coins', value: 75 },
    { id: 'crate_m2', x: 1420, y: 1860, w: 28, h: 28, opened: false, type: 'health', value: 40 },

    // Bandit Outpost Stash
    { id: 'crate_b1', x: 790, y: 410, w: 32, h: 32, opened: false, type: 'shotgun', value: 1 },
    { id: 'crate_b2', x: 920, y: 440, w: 30, h: 30, opened: false, type: 'smg', value: 1 },
    { id: 'crate_b3', x: 710, y: 690, w: 28, h: 28, opened: false, type: 'coins', value: 250 },

    // Windmill & Farmlands
    { id: 'crate_w1', x: 3080, y: 610, w: 28, h: 28, opened: false, type: 'coins', value: 120 },
    { id: 'crate_w2', x: 3380, y: 840, w: 28, h: 28, opened: false, type: 'ammo', value: 45 },

    // Rice Paddy Shack Stash
    { id: 'crate_r1', x: 820, y: 3040, w: 28, h: 28, opened: false, type: 'coins', value: 90 },
    { id: 'crate_r2', x: 620, y: 3590, w: 28, h: 28, opened: false, type: 'health', value: 50 },

    // Police HQ Contraband Locker
    { id: 'crate_p1', x: 3220, y: 3350, w: 32, h: 32, opened: false, type: 'smg', value: 1 },
    { id: 'crate_p2', x: 3370, y: 3390, w: 30, h: 30, opened: false, type: 'coins', value: 300 },
  ];
}

export function generateInitialVehicles(): Vehicle[] {
  return [
    // 1. Central Bazaar Parked Vehicles
    {
      id: 'v_cycle_bazaar',
      type: 'bicycle',
      x: 1610,
      y: 1980,
      angle: 0,
      speed: 0,
      vx: 0,
      vy: 0,
      hp: 80,
      maxHp: 80,
      driverId: null,
      color: '#10b981',
    },
    {
      id: 'v_moto_bazaar',
      type: 'motorcycle',
      x: 1740,
      y: 1990,
      angle: Math.PI / 4,
      speed: 0,
      vx: 0,
      vy: 0,
      hp: 180,
      maxHp: 180,
      driverId: null,
      color: '#ef4444',
    },
    {
      id: 'v_bus_bazaar',
      type: 'bus',
      x: 1850,
      y: 2000,
      angle: 0,
      speed: 0,
      vx: 0,
      vy: 0,
      hp: 450,
      maxHp: 450,
      driverId: null,
      color: '#3b82f6',
    },

    // 2. Bandit Outpost Motorcycle
    {
      id: 'v_moto_bandit',
      type: 'motorcycle',
      x: 820,
      y: 590,
      angle: -Math.PI / 2,
      speed: 0,
      vx: 0,
      vy: 0,
      hp: 180,
      maxHp: 180,
      driverId: null,
      color: '#18181b',
    },

    // 3. Farmland Bicycle
    {
      id: 'v_cycle_farm',
      type: 'bicycle',
      x: 2980,
      y: 890,
      angle: Math.PI / 2,
      speed: 0,
      vx: 0,
      vy: 0,
      hp: 80,
      maxHp: 80,
      driverId: null,
      color: '#f59e0b',
    },

    // 4. Rice Paddy Bicycle
    {
      id: 'v_cycle_paddy',
      type: 'bicycle',
      x: 780,
      y: 2930,
      angle: 0,
      speed: 0,
      vx: 0,
      vy: 0,
      hp: 80,
      maxHp: 80,
      driverId: null,
      color: '#06b6d4',
    },

    // 5. Eastern Farmland Bus
    {
      id: 'v_bus_farm',
      type: 'bus',
      x: 3400,
      y: 1520,
      angle: Math.PI,
      speed: 0,
      vx: 0,
      vy: 0,
      hp: 450,
      maxHp: 450,
      driverId: null,
      color: '#eab308',
    },

    // 6. Police Cruiser at District Station
    {
      id: 'v_police_hq',
      type: 'motorcycle',
      x: 3260,
      y: 3280,
      angle: Math.PI / 2,
      speed: 0,
      vx: 0,
      vy: 0,
      hp: 200,
      maxHp: 200,
      driverId: null,
      color: '#1e40af',
      isPolice: true,
    },
  ];
}

export function generateInitialEnemies(): Enemy[] {
  return [
    // Bandit Outpost Guards
    {
      id: 'en_bandit_1',
      type: 'bandit_foot',
      x: 720,
      y: 470,
      angle: 0,
      speed: 2.2,
      hp: 55,
      maxHp: 55,
      weapon: 'pistol',
      shootTimer: 0,
      state: 'patrol',
      inVehicle: null,
      vehicleId: null,
      color: '#dc2626',
      patrolCenter: { x: 720, y: 470 },
    },
    {
      id: 'en_bandit_2',
      type: 'bandit_foot',
      x: 900,
      y: 520,
      angle: Math.PI,
      speed: 2.2,
      hp: 65,
      maxHp: 65,
      weapon: 'shotgun',
      shootTimer: 0,
      state: 'patrol',
      inVehicle: null,
      vehicleId: null,
      color: '#b91c1c',
      patrolCenter: { x: 900, y: 520 },
    },
    {
      id: 'en_bandit_3',
      type: 'bandit_bike',
      x: 850,
      y: 650,
      angle: -Math.PI / 2,
      speed: 3.5,
      hp: 80,
      maxHp: 80,
      weapon: 'smg',
      shootTimer: 0,
      state: 'patrol',
      inVehicle: 'motorcycle',
      vehicleId: null,
      color: '#991b1b',
      patrolCenter: { x: 850, y: 650 },
    },

    // Farmland Scout Bandits
    {
      id: 'en_bandit_farm1',
      type: 'bandit_foot',
      x: 3200,
      y: 780,
      angle: Math.PI / 3,
      speed: 2.0,
      hp: 50,
      maxHp: 50,
      weapon: 'pistol',
      shootTimer: 0,
      state: 'patrol',
      inVehicle: null,
      vehicleId: null,
      color: '#dc2626',
      patrolCenter: { x: 3200, y: 780 },
    },

    // Police HQ Officers
    {
      id: 'en_police_officer1',
      type: 'police_patrol',
      x: 3300,
      y: 3280,
      angle: -Math.PI / 2,
      speed: 2.5,
      hp: 75,
      maxHp: 75,
      weapon: 'pistol',
      shootTimer: 0,
      state: 'patrol',
      inVehicle: null,
      vehicleId: null,
      color: '#2563eb',
      patrolCenter: { x: 3300, y: 3280 },
    },
    {
      id: 'en_police_officer2',
      type: 'police_patrol',
      x: 3450,
      y: 3320,
      angle: Math.PI,
      speed: 2.5,
      hp: 85,
      maxHp: 85,
      weapon: 'shotgun',
      shootTimer: 0,
      state: 'patrol',
      inVehicle: null,
      vehicleId: null,
      color: '#1d4ed8',
      patrolCenter: { x: 3450, y: 3320 },
    },
  ];
}
