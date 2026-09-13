/**
 * DUO RAMPAGE: DHAKA PARKOUR - LEVEL 01: Rooftop Introduction
 * Master Level Blueprint based on Dhaka-Parkour.md Section 11, 24-26, 52 (Task 05)
 *
 * Full 5-Minute Traversable Dhaka Rooftop Level:
 * - Start & Tutorial prompts (Run, Sprint, Jump, Double Jump, Slide, Ledge Grab)
 * - Multiple platform heights (Apartments, water tanks, tin sheds, scaffolding)
 * - 45 Collectible Dhaka Gold Coins
 * - 1 Secret Emblem: "Rooftop Pioneer" (Hidden on high shortcut water tank)
 * - 1 Clear Bifurcation: Safe Lower Path vs High-Speed Shortcut Route
 * - 3 Strategic Checkpoints with instant under-2s respawn
 * - Finish Gate with fireworks, timing, and 3-Star victory calculation
 */

import { PlatformRect } from '../character/ParkourRunner2D';

export interface LevelCollectible {
  id: string;
  type: 'coin' | 'secret_emblem';
  x: number;
  y: number;
  collected: boolean;
  name?: string;
}

export interface LevelCheckpoint {
  id: string;
  name: string;
  x: number;
  y: number;
  activated: boolean;
}

export interface LevelTutorialSign {
  id: string;
  x: number;
  y: number;
  action: string;
  instruction: string;
  desktopKey: string;
  icon: string;
}

export interface LevelFinishGate {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ParkourEnemy {
  id: string;
  type: 'drone' | 'cyborg';
  x: number;
  y: number;
  w: number;
  h: number;
  startX: number;
  endX: number;
  speed: number;
  facing: number;
  alive: boolean;
  baseY?: number;
  bobOffset?: number;
  defeatedTimer?: number;
}

export interface DhakaParkourLevelData {
  id: string;
  levelNumber: number;
  name: string;
  targetSeconds: number;
  parSeconds: number;
  coinsForStar: number;
  worldWidth: number;
  worldHeight: number;
  spawnPoint: { x: number; y: number };
  platforms: PlatformRect[];
  collectibles: LevelCollectible[];
  checkpoints: LevelCheckpoint[];
  tutorialSigns: LevelTutorialSign[];
  finishGate: LevelFinishGate;
  enemies?: ParkourEnemy[];
  skylineDoodads: Array<{
    type: 'water_tank' | 'clothesline' | 'antenna' | 'neon_sign' | 'tin_shed' | 'billboard';
    x: number;
    y: number;
    w?: number;
    h?: number;
    text?: string;
    color?: string;
  }>;
}

export function buildLevel01RooftopIntro(): DhakaParkourLevelData {
  const platforms: PlatformRect[] = [];
  const collectibles: LevelCollectible[] = [];
  const checkpoints: LevelCheckpoint[] = [];
  const tutorialSigns: LevelTutorialSign[] = [];
  const skylineDoodads: DhakaParkourLevelData['skylineDoodads'] = [];

  // ===========================================================================
  // SECTION 1: START & TUTORIAL BASICS (X: 0 to 1800)
  // Apartment roofs, laundry lines, first jump gap, and low slide duct
  // ===========================================================================

  // 1. Starting Apartment Rooftop (X: -100 to 650, Y: 760)
  platforms.push({
    id: 'sec1_start_roof',
    x: -100,
    y: 760,
    w: 750,
    h: 300,
    type: 'solid',
  });

  skylineDoodads.push(
    { type: 'water_tank', x: 80, y: 640, w: 90, h: 120 },
    { type: 'clothesline', x: 240, y: 710, w: 180, h: 50 },
    { type: 'antenna', x: 500, y: 660, w: 30, h: 100 }
  );

  tutorialSigns.push({
    id: 'tut_run',
    x: 180,
    y: 690,
    action: 'MOVE & SPRINT',
    instruction: 'Hold [Shift] or Joystick to Sprint',
    desktopKey: 'A / D + SHIFT',
    icon: '⚡',
  });

  // Coins along starting roof
  for (let cx = 150; cx <= 550; cx += 80) {
    collectibles.push({
      id: `coin_start_${cx}`,
      type: 'coin',
      x: cx,
      y: 710,
      collected: false,
    });
  }

  tutorialSigns.push({
    id: 'tut_jump',
    x: 580,
    y: 680,
    action: 'JUMP & 2× JUMP',
    instruction: 'Press Jump over gaps, Jump again mid-air',
    desktopKey: 'SPACE / W',
    icon: '▲',
  });

  // 2. Second Apartment Rooftop across gap (X: 770 to 1250, Y: 740)
  platforms.push({
    id: 'sec1_roof_2',
    x: 770,
    y: 740,
    w: 480,
    h: 320,
    type: 'solid',
  });

  skylineDoodads.push(
    { type: 'tin_shed', x: 860, y: 670, w: 160, h: 70 },
    { type: 'antenna', x: 1140, y: 640, w: 30, h: 100 }
  );

  // Coins in jump arc across gap
  collectibles.push(
    { id: 'coin_gap1_1', type: 'coin', x: 670, y: 670, collected: false },
    { id: 'coin_gap1_2', type: 'coin', x: 715, y: 640, collected: false },
    { id: 'coin_gap1_3', type: 'coin', x: 760, y: 660, collected: false }
  );

  // 3. Corrugated Tin Shed with Low Slide Obstacle (X: 1330 to 1850, Y: 740)
  platforms.push({
    id: 'sec1_roof_3_slide',
    x: 1330,
    y: 740,
    w: 520,
    h: 320,
    type: 'solid',
  });

  // Overhead air-con exhaust duct (forces slide!)
  platforms.push({
    id: 'sec1_slide_duct',
    x: 1450,
    y: 668,
    w: 240,
    h: 44,
    type: 'low_gap_barrier',
  });

  tutorialSigns.push({
    id: 'tut_slide',
    x: 1390,
    y: 690,
    action: 'CROUCH DOWN',
    instruction: 'Hold [S] or [↓] to crouch down and pass under low ducts',
    desktopKey: 'S / DOWN',
    icon: '🧎',
  });

  // Coins inside slide tunnel
  collectibles.push(
    { id: 'coin_slide_1', type: 'coin', x: 1490, y: 715, collected: false },
    { id: 'coin_slide_2', type: 'coin', x: 1570, y: 715, collected: false },
    { id: 'coin_slide_3', type: 'coin', x: 1650, y: 715, collected: false }
  );

  // CHECKPOINT 1: Water Tank Station (X: 1820, Y: 740)
  checkpoints.push({
    id: 'cp_1',
    name: 'Sector 1: Water Tank Terrace',
    x: 1800,
    y: 740,
    activated: false,
  });

  // ===========================================================================
  // SECTION 2: BIFURCATION — SHORTCUT vs SAFE ROUTE (X: 1900 to 3600)
  // Safe Lower Route: Wide platforms, wooden planks, lower speed
  // High Shortcut Route: Elevated neon billboards, high water tower, secret emblem!
  // ===========================================================================

  tutorialSigns.push({
    id: 'tut_branch',
    x: 1980,
    y: 670,
    action: 'CHOOSE YOUR PATH',
    instruction: '▲ UPPER SHORTCUT (High Risk) vs ▼ SAFE ROUTE',
    desktopKey: 'EXPLORE',
    icon: '↱',
  });

  // --- LOWER SAFE ROUTE ---
  // Lower Platform 1
  platforms.push({
    id: 'sec2_safe_plat1',
    x: 2050,
    y: 760,
    w: 360,
    h: 300,
    type: 'solid',
  });

  // Lower Scaffold bridge
  platforms.push({
    id: 'sec2_safe_bridge',
    x: 2460,
    y: 760,
    w: 380,
    h: 40,
    type: 'solid',
  });

  // Lower Rooftop 2
  platforms.push({
    id: 'sec2_safe_plat2',
    x: 2890,
    y: 760,
    w: 480,
    h: 300,
    type: 'solid',
  });

  skylineDoodads.push(
    { type: 'tin_shed', x: 2950, y: 690, w: 180, h: 70 },
    { type: 'clothesline', x: 3160, y: 710, w: 140, h: 50 }
  );

  // Coins on safe route
  for (let cx = 2100; cx <= 3200; cx += 140) {
    collectibles.push({
      id: `coin_safe_${cx}`,
      type: 'coin',
      x: cx,
      y: 715,
      collected: false,
    });
  }

  // --- UPPER SHORTCUT ROUTE ---
  // High Step 1: Scaffolding access ladder
  platforms.push({
    id: 'sec2_ladder_shortcut',
    x: 2120,
    y: 500,
    w: 40,
    h: 260,
    type: 'ladder',
  });

  // High Shortcut Perch 1: Elevated Water Tank Roof
  platforms.push({
    id: 'sec2_sc_perch1',
    x: 2180,
    y: 500,
    w: 220,
    h: 36,
    type: 'solid',
  });

  // High Shortcut Perch 2: Giant Dhaka Neon Sign Beam ("ঢাকা নিয়ন")
  platforms.push({
    id: 'sec2_sc_neon_beam',
    x: 2480,
    y: 430,
    w: 280,
    h: 32,
    type: 'solid',
  });

  skylineDoodads.push({
    type: 'neon_sign',
    x: 2510,
    y: 350,
    w: 220,
    h: 70,
    text: 'ঢাকা নিয়ন • DHAKA NEON',
    color: '#38bdf8',
  });

  // High Shortcut Perch 3: Construction Beam
  platforms.push({
    id: 'sec2_sc_beam3',
    x: 2840,
    y: 380,
    w: 260,
    h: 32,
    type: 'solid',
  });

  // SECRET EMBLEM: Perched on top of the high water reservoir
  skylineDoodads.push({
    type: 'water_tank',
    x: 2920,
    y: 260,
    w: 100,
    h: 120,
  });

  collectibles.push({
    id: 'secret_emblem_01',
    type: 'secret_emblem',
    name: 'Rooftop Pioneer',
    x: 2970,
    y: 230,
    collected: false,
  });

  // Dense bonus coins along the shortcut path
  collectibles.push(
    { id: 'sc_coin_1', type: 'coin', x: 2280, y: 460, collected: false },
    { id: 'sc_coin_2', type: 'coin', x: 2360, y: 460, collected: false },
    { id: 'sc_coin_3', type: 'coin', x: 2560, y: 390, collected: false },
    { id: 'sc_coin_4', type: 'coin', x: 2640, y: 390, collected: false },
    { id: 'sc_coin_5', type: 'coin', x: 2720, y: 390, collected: false },
    { id: 'sc_coin_6', type: 'coin', x: 2890, y: 340, collected: false },
    { id: 'sc_coin_7', type: 'coin', x: 3040, y: 340, collected: false }
  );

  // High slope dropping back down
  platforms.push({
    id: 'sec2_sc_drop_step',
    x: 3170,
    y: 480,
    w: 180,
    h: 36,
    type: 'solid',
  });

  // CHECKPOINT 2: Reconvergence Terrace (X: 3450, Y: 700)
  platforms.push({
    id: 'sec2_reconvergence_terrace',
    x: 3420,
    y: 700,
    w: 460,
    h: 360,
    type: 'solid',
  });

  skylineDoodads.push(
    { type: 'water_tank', x: 3480, y: 580, w: 90, h: 120 },
    { type: 'antenna', x: 3760, y: 600, w: 30, h: 100 }
  );

  checkpoints.push({
    id: 'cp_2',
    name: 'Sector 2: Puran Dhaka Junction',
    x: 3500,
    y: 700,
    activated: false,
  });

  // ===========================================================================
  // SECTION 3: INDUSTRIAL ROOFTOPS & LEDGE CLIMB (X: 3900 to 5400)
  // Vault obstacles, elevated high ledges requiring ledge grab, and ladder tower
  // ===========================================================================

  // Vault Obstacle (Hurdle / Crate on rooftop)
  platforms.push({
    id: 'sec3_vault_crate',
    x: 3960,
    y: 664,
    w: 48,
    h: 36,
    type: 'vault_obstacle',
  });

  tutorialSigns.push({
    id: 'tut_vault',
    x: 3910,
    y: 650,
    action: 'AUTO VAULT',
    instruction: 'Sprint towards low obstacles to automatically vault',
    desktopKey: 'SPRINT FORWARD',
    icon: '↷',
  });

  // Platform 1 of Section 3 (X: 4040 to 4420, Y: 680)
  platforms.push({
    id: 'sec3_factory_roof1',
    x: 4040,
    y: 680,
    w: 380,
    h: 380,
    type: 'solid',
  });

  // Coins across factory roof
  collectibles.push(
    { id: 'coin_ind_1', type: 'coin', x: 4120, y: 640, collected: false },
    { id: 'coin_ind_2', type: 'coin', x: 4220, y: 640, collected: false },
    { id: 'coin_ind_3', type: 'coin', x: 4320, y: 640, collected: false }
  );

  // High Ledge Wall (Requires jumping and Ledge Grab & Pull Up!)
  // Lip is at Y: 520, runner jumps from Y: 680
  platforms.push({
    id: 'sec3_high_ledge_terrace',
    x: 4520,
    y: 520,
    w: 400,
    h: 540,
    type: 'solid',
  });

  tutorialSigns.push({
    id: 'tut_ledge',
    x: 4460,
    y: 620,
    action: 'LEDGE GRAB & PULL UP',
    instruction: 'Jump towards the ledge to grab. Press [W / UP] to climb up!',
    desktopKey: 'W / UP',
    icon: '◄',
  });

  skylineDoodads.push({
    type: 'neon_sign',
    x: 4550,
    y: 440,
    w: 240,
    h: 60,
    text: 'অগ্রযাত্রা • ADVANCE',
    color: '#22c55e',
  });

  // Coins waiting on top of the high ledge
  collectibles.push(
    { id: 'coin_ledge_1', type: 'coin', x: 4620, y: 480, collected: false },
    { id: 'coin_ledge_2', type: 'coin', x: 4720, y: 480, collected: false },
    { id: 'coin_ledge_3', type: 'coin', x: 4820, y: 480, collected: false }
  );

  // Ladder Tower to Skyline Crane Scaffolding
  platforms.push({
    id: 'sec3_ladder_crane',
    x: 4940,
    y: 320,
    w: 44,
    h: 200,
    type: 'ladder',
  });

  platforms.push({
    id: 'sec3_high_crane_catwalk',
    x: 4900,
    y: 320,
    w: 320,
    h: 36,
    type: 'solid',
  });

  skylineDoodads.push({
    type: 'billboard',
    x: 4920,
    y: 220,
    w: 280,
    h: 90,
    text: 'DUO RAMPAGE • DHAKA 2026',
    color: '#f59e0b',
  });

  // Dropping down to Checkpoint 3
  platforms.push({
    id: 'sec3_cp3_rooftop',
    x: 5280,
    y: 640,
    w: 460,
    h: 420,
    type: 'solid',
  });

  // CHECKPOINT 3: Skyline Scaffold Tower (X: 5350, Y: 640)
  checkpoints.push({
    id: 'cp_3',
    name: 'Sector 3: Skyline Scaffolding',
    x: 5350,
    y: 640,
    activated: false,
  });

  // ===========================================================================
  // SECTION 4: DOWNHILL SPRINT & FINISH LINE (X: 5500 to 7000)
  // Stepped downhill roofs, fast slide under neon billboard, and final leap to victory
  // ===========================================================================

  tutorialSigns.push({
    id: 'tut_final_sprint',
    x: 5460,
    y: 590,
    action: 'FINAL SPRINT TO GLORY',
    instruction: 'Full speed downhill sprint to the Finish Gate!',
    desktopKey: 'SHIFT + RUN',
    icon: '🏁',
  });

  // Downhill Step 1
  platforms.push({
    id: 'sec4_downhill_1',
    x: 5780,
    y: 690,
    w: 360,
    h: 380,
    type: 'solid',
  });

  // High-Speed Slide under billboard banner
  platforms.push({
    id: 'sec4_finish_slide_barrier',
    x: 5900,
    y: 622,
    w: 200,
    h: 42,
    type: 'low_gap_barrier',
  });

  collectibles.push(
    { id: 'coin_fin_1', type: 'coin', x: 5940, y: 665, collected: false },
    { id: 'coin_fin_2', type: 'coin', x: 6020, y: 665, collected: false }
  );

  // Downhill Step 2 across small gap
  platforms.push({
    id: 'sec4_downhill_2',
    x: 6180,
    y: 720,
    w: 380,
    h: 340,
    type: 'solid',
  });

  skylineDoodads.push(
    { type: 'clothesline', x: 6240, y: 670, w: 160, h: 50 },
    { type: 'antenna', x: 6480, y: 620, w: 30, h: 100 }
  );

  // Final Victory Terrace
  platforms.push({
    id: 'sec4_finish_terrace',
    x: 6600,
    y: 700,
    w: 600,
    h: 360,
    type: 'solid',
  });

  skylineDoodads.push({
    type: 'neon_sign',
    x: 6720,
    y: 530,
    w: 240,
    h: 70,
    text: 'সমাপ্তি • FINISH LINE',
    color: '#facc15',
  });

  // FINISH GATE ARCH (X: 6840, Y: 520, W: 80, H: 180)
  const finishGate: LevelFinishGate = {
    x: 6840,
    y: 520,
    w: 80,
    h: 180,
  };

  return {
    id: 'parkour_01',
    levelNumber: 1,
    name: 'Rooftop Introduction',
    targetSeconds: 75, // 1m 15s speedrun gold target
    parSeconds: 300,    // 5 minutes par time
    coinsForStar: 20,   // Need at least 20 coins for 2nd star
    worldWidth: 7400,
    worldHeight: 1200,
    spawnPoint: { x: 80, y: 680 },
    platforms,
    collectibles,
    checkpoints,
    tutorialSigns,
    finishGate,
    skylineDoodads,
  };
}
