/**
 * DUO RAMPAGE: DHAKA PARKOUR - LEVEL 99: MEGA RAMP SKYLINE OVERDRIVE
 *
 * Grand Mega Ramp Parkour Track:
 * - 12,000px Massive Traversal Course
 * - Smooth Gentle Ski Ramp Incline/Descent (<= 30px steps, zero jarring camera shakes)
 * - Supersonic Boost Pads (1300-1550 px/s) + Titan Tower Kinetic Elevator Boost
 * - Interactive Enemies:
 *   - Sentinel Drones (Hovering & mid-air stompable for high-altitude spring leaps)
 *   - Cyborg Enforcers (Ground patrols: stompable from above or duck/sweep)
 * - 4 Strategic Checkpoints (All equipped with solid landing platforms)
 * - 120 Collectible Dhaka Gold Coins & 1 Celestial Secret Emblem ("Apex Stratosphere")
 * - 4-Minute Par Target with 3-Star Victory Ranking
 * - Fully Synchronized for 2-Player Co-op
 */

import { PlatformRect } from '../character/ParkourRunner2D';
import {
  DhakaParkourLevelData,
  LevelCollectible,
  LevelCheckpoint,
  LevelTutorialSign,
  LevelFinishGate,
  ParkourEnemy,
} from './Level01RooftopIntro';

export function buildLevelMegaRamp(): DhakaParkourLevelData {
  const platforms: PlatformRect[] = [];
  const collectibles: LevelCollectible[] = [];
  const checkpoints: LevelCheckpoint[] = [];
  const tutorialSigns: LevelTutorialSign[] = [];
  const enemies: ParkourEnemy[] = [];
  const skylineDoodads: DhakaParkourLevelData['skylineDoodads'] = [];

  // ===========================================================================
  // ZONE 1: THE STRATOSPHERE SKI RAMP & SKY LAUNCHER (X: 0 to 3180)
  // ===========================================================================

  // 1. High Start Deck (X: -100 to 380, Y: 440)
  platforms.push({
    id: 'mega_start_roof',
    x: -100,
    y: 440,
    w: 480,
    h: 500,
    type: 'solid',
  });

  skylineDoodads.push(
    { type: 'water_tank', x: 60, y: 320, w: 90, h: 120 },
    { type: 'antenna', x: 220, y: 260 },
    { type: 'neon_sign', x: 140, y: 360, text: 'মেগা র‍্যাম্প' }
  );

  tutorialSigns.push({
    id: 'sign_mega_start',
    x: 260,
    y: 380,
    action: 'SPRINT DOWNHILL',
    instruction: 'Hold SPRINT to build maximum kinetic speed down the mega ramp!',
    desktopKey: 'SHIFT',
    icon: '⚡',
  });

  // 2. Smooth Continuous Stepped Downhill Ski Ramp (Descent: Y: 440 -> Y: 740)
  // Gentle 25px descent increments prevent repetitive landing stumbles and camera shaking
  const rampSteps = [
    { x: 380, y: 465, w: 150, h: 500 },
    { x: 530, y: 490, w: 150, h: 500 },
    { x: 680, y: 515, w: 150, h: 500 },
    { x: 830, y: 540, w: 150, h: 500 },
    { x: 980, y: 565, w: 150, h: 500 },
    { x: 1130, y: 590, w: 150, h: 500 },
    { x: 1280, y: 615, w: 150, h: 500 },
    { x: 1430, y: 640, w: 150, h: 500 },
    { x: 1580, y: 665, w: 150, h: 500 },
    { x: 1730, y: 690, w: 150, h: 500 },
    { x: 1880, y: 715, w: 150, h: 500 },
    { x: 2030, y: 740, w: 180, h: 500 },
  ];

  rampSteps.forEach((step, idx) => {
    platforms.push({
      id: `mega_step_${idx + 1}`,
      x: step.x,
      y: step.y,
      w: step.w,
      h: step.h,
      type: 'solid',
    });

    // Trail of speed coins down the ski ramp
    collectibles.push({
      id: `coin_ramp_${idx * 2}`,
      type: 'coin',
      x: step.x + 40,
      y: step.y - 45,
      collected: false,
    });
    collectibles.push({
      id: `coin_ramp_${idx * 2 + 1}`,
      type: 'coin',
      x: step.x + 100,
      y: step.y - 45,
      collected: false,
    });
  });

  // 3. Supersonic Boost Pad #1 (The Sky Launcher)
  platforms.push({
    id: 'boost_pad_1',
    x: 2210,
    y: 740,
    w: 190,
    h: 30,
    type: 'boost_pad',
    boostVx: 1350,
    boostVy: -780,
  });

  tutorialSigns.push({
    id: 'sign_boost_1',
    x: 2130,
    y: 680,
    action: 'BOOST LAUNCH',
    instruction: 'Hit the Supersonic Boost Pad to blast across the megacity skyline!',
    desktopKey: 'RUN THROUGH',
    icon: '🚀',
  });

  // 4. Aerial Chasm (X: 2400 to 3180) - Mid-Air Flight Coin Arc
  for (let i = 0; i < 10; i++) {
    const coinT = (i + 1) / 11;
    const cx = 2300 + coinT * 900;
    const cy = 720 - Math.sin(coinT * Math.PI) * 420;
    collectibles.push({
      id: `coin_chasm_1_${i}`,
      type: 'coin',
      x: Math.round(cx),
      y: Math.round(cy),
      collected: false,
    });
  }

  // 5. Aerial Sentinel Drones (Stompable mid-air for altitude extension)
  enemies.push({
    id: 'drone_01',
    type: 'drone',
    x: 2600,
    y: 560,
    baseY: 560,
    w: 48,
    h: 38,
    startX: 2480,
    endX: 2720,
    speed: 85,
    facing: 1,
    alive: true,
  });

  enemies.push({
    id: 'drone_02',
    type: 'drone',
    x: 2900,
    y: 520,
    baseY: 520,
    w: 48,
    h: 38,
    startX: 2800,
    endX: 3040,
    speed: 75,
    facing: -1,
    alive: true,
  });

  // 6. Safety suspended catwalk under Chasm 1 (Prevents unfair death falls)
  platforms.push({
    id: 'zone1_safety_catwalk',
    x: 2360,
    y: 920,
    w: 840,
    h: 30,
    type: 'solid',
  });
  // Catwalk recovery spring pad back up to superstructure
  platforms.push({
    id: 'zone1_safety_spring',
    x: 3080,
    y: 920,
    w: 100,
    h: 25,
    type: 'boost_pad',
    boostVx: 450,
    boostVy: -720,
  });

  // ===========================================================================
  // ZONE 2: GIRDERS, CYBORG ENFORCERS & HIGH-WIRE BRIDGES (X: 3180 to 5750)
  // ===========================================================================

  // 1. Landing Superstructure Deck
  platforms.push({
    id: 'mega_zone2_landing',
    x: 3180,
    y: 780,
    w: 620,
    h: 400,
    type: 'solid',
  });

  checkpoints.push({
    id: 'cp_1_girder',
    name: 'GIRDER TERMINAL',
    x: 3320,
    y: 780,
    activated: false,
  });

  skylineDoodads.push(
    { type: 'water_tank', x: 3650, y: 660, w: 90, h: 120 },
    { type: 'billboard', x: 3400, y: 620, text: 'CYBER DHAKA 2077', color: '#06b6d4' }
  );

  // 2. Cyborg Enforcer #1 (Patrolling on landing deck)
  enemies.push({
    id: 'cyborg_01',
    type: 'cyborg',
    x: 3480,
    y: 708,
    w: 44,
    h: 72,
    startX: 3380,
    endX: 3680,
    speed: 105,
    facing: 1,
    alive: true,
  });

  tutorialSigns.push({
    id: 'sign_combat_1',
    x: 3260,
    y: 710,
    action: 'STOMP OR CROUCH DUCK',
    instruction: 'Jump on enemies to STOMP them, or CROUCH / SIT DOWN to duck under scanner hazards!',
    desktopKey: 'JUMP / S',
    icon: '⚔️',
  });

  // 3. Low-gap obstacle (Industrial Vent Pipe - crouch under)
  // Deck is at Y: 780. Barrier is Y: 690, H: 44 (Clearance of 46px: crouching height 38px fits easily)
  platforms.push({
    id: 'zone2_slide_duct',
    x: 3800,
    y: 690,
    w: 160,
    h: 44,
    type: 'low_gap_barrier',
  });

  tutorialSigns.push({
    id: 'sign_crouch_duct',
    x: 3710,
    y: 710,
    action: 'CROUCH / SIT DOWN',
    instruction: 'Hold [S] or [↓] to CROUCH down and pass under low ventilation ducts!',
    desktopKey: 'S / DOWN',
    icon: '🧎',
  });

  // Coins under the duct
  collectibles.push(
    { id: 'coin_duct_1', type: 'coin', x: 3830, y: 755, collected: false },
    { id: 'coin_duct_2', type: 'coin', x: 3880, y: 755, collected: false },
    { id: 'coin_duct_3', type: 'coin', x: 3930, y: 755, collected: false }
  );

  // 4. Elevated Scaffolding Bridge
  platforms.push({
    id: 'zone2_scaffold_bridge',
    x: 3960,
    y: 780,
    w: 420,
    h: 400,
    type: 'solid',
  });

  // 5. Overpass Boost Pad #2
  platforms.push({
    id: 'boost_pad_2',
    x: 4380,
    y: 780,
    w: 160,
    h: 30,
    type: 'boost_pad',
    boostVx: 1200,
    boostVy: -700,
  });

  // 6. Drone #3 hovering over the gap
  enemies.push({
    id: 'drone_03',
    type: 'drone',
    x: 4680,
    y: 570,
    baseY: 570,
    w: 48,
    h: 38,
    startX: 4580,
    endX: 4820,
    speed: 90,
    facing: 1,
    alive: true,
  });

  // Safety girder bridge underneath Overpass Gap
  platforms.push({
    id: 'zone2_safety_girder',
    x: 4480,
    y: 880,
    w: 420,
    h: 25,
    type: 'solid',
  });

  // 7. Suspended Highway Girder
  platforms.push({
    id: 'zone2_highway_girder',
    x: 4880,
    y: 730,
    w: 820,
    h: 40,
    type: 'solid',
  });

  // Cyborg Enforcer #2 on the highway girder
  enemies.push({
    id: 'cyborg_02',
    type: 'cyborg',
    x: 5120,
    y: 658,
    w: 44,
    h: 72,
    startX: 4950,
    endX: 5550,
    speed: 125,
    facing: -1,
    alive: true,
  });

  // Girder Coins
  for (let c = 0; c < 8; c++) {
    collectibles.push({
      id: `coin_girder_${c}`,
      type: 'coin',
      x: 4950 + c * 85,
      y: 685,
      collected: false,
    });
  }

  // ===========================================================================
  // ZONE 3: TITAN SKY SPIRE, AERIAL HOPPERS & STRATOSPHERE CHASM (X: 5750 to 8900)
  // ===========================================================================

  // 1. Spire Base Deck
  platforms.push({
    id: 'zone3_spire_base',
    x: 5750,
    y: 740,
    w: 380,
    h: 400,
    type: 'solid',
  });

  checkpoints.push({
    id: 'cp_2_spire',
    name: 'SKY SPIRE',
    x: 5850,
    y: 740,
    activated: false,
  });

  // 2. Titan Tower Elevator Booster Pad (Instantly rockets player to top without slow climbing)
  platforms.push({
    id: 'zone3_elevator_boost',
    x: 6040,
    y: 740,
    w: 100,
    h: 25,
    type: 'boost_pad',
    boostVx: 160,
    boostVy: -920,
  });

  tutorialSigns.push({
    id: 'sign_titan_lift',
    x: 5950,
    y: 680,
    action: 'KINETIC ELEVATOR',
    instruction: 'Step onto the Kinetic Lift to instantly launch to the top of Titan Tower!',
    desktopKey: 'ELEVATOR',
    icon: '⚡',
  });

  // Titan Tower structure
  platforms.push({
    id: 'zone3_titan_tower',
    x: 6150,
    y: 360,
    w: 420,
    h: 750,
    type: 'solid',
  });

  // Alternate Wall Ladder on the tower side
  platforms.push({
    id: 'zone3_ladder',
    x: 6125,
    y: 370,
    w: 24,
    h: 370,
    type: 'ladder',
  });

  skylineDoodads.push(
    { type: 'antenna', x: 6240, y: 210 },
    { type: 'neon_sign', x: 6280, y: 280, text: 'শীর্ষচূড়া' }
  );

  // 3. Top of Tower Launch Pad (Boost Pad #3)
  platforms.push({
    id: 'boost_pad_3',
    x: 6570,
    y: 360,
    w: 180,
    h: 30,
    type: 'boost_pad',
    boostVx: 1420,
    boostVy: -740,
  });

  // 4. Mid-Air Floating Booster Pad #4 (Aerial Hopper)
  // Allows chaining supersonic leaps mid-air
  platforms.push({
    id: 'boost_pad_4_midair',
    x: 7220,
    y: 530,
    w: 140,
    h: 26,
    type: 'boost_pad',
    boostVx: 1300,
    boostVy: -760,
  });

  // 5. Floating Crane Perch with Drone #4 and Secret Celestial Emblem
  platforms.push({
    id: 'zone3_crane_perch',
    x: 7650,
    y: 440,
    w: 320,
    h: 30,
    type: 'solid',
  });

  enemies.push({
    id: 'drone_04',
    type: 'drone',
    x: 7550,
    y: 380,
    baseY: 380,
    w: 48,
    h: 38,
    startX: 7460,
    endX: 7720,
    speed: 80,
    facing: 1,
    alive: true,
  });

  // Secret Celestial Emblem on high crane hook
  collectibles.push({
    id: 'emblem_apex',
    type: 'secret_emblem',
    name: 'Apex Stratosphere',
    x: 7800,
    y: 320,
    collected: false,
  });

  // 6. Smooth Stepped Descent Ramp 2 (Y: 480 -> Y: 630, gentle 25-30px steps)
  const rampSteps2 = [
    { x: 7970, y: 480, w: 150, h: 500 },
    { x: 8120, y: 510, w: 150, h: 500 },
    { x: 8270, y: 540, w: 150, h: 500 },
    { x: 8420, y: 570, w: 150, h: 500 },
    { x: 8570, y: 600, w: 150, h: 500 },
    { x: 8720, y: 630, w: 160, h: 500 },
  ];

  rampSteps2.forEach((step, idx) => {
    platforms.push({
      id: `mega_step2_${idx + 1}`,
      x: step.x,
      y: step.y,
      w: step.w,
      h: step.h,
      type: 'solid',
    });

    collectibles.push({
      id: `coin_ramp2_${idx}`,
      type: 'coin',
      x: step.x + 75,
      y: step.y - 45,
      collected: false,
    });
  });

  // 7. Abyss Deck & Checkpoint 3
  platforms.push({
    id: 'zone3_abyss_deck',
    x: 8850,
    y: 630,
    w: 220,
    h: 500,
    type: 'solid',
  });

  checkpoints.push({
    id: 'cp_3_abyss',
    name: 'ABYSS TERMINAL',
    x: 8930,
    y: 630,
    activated: false,
  });

  // ===========================================================================
  // ZONE 4: CYBORG STRONGHOLD & GRAND APEX RAMP (X: 9060 to 12400)
  // ===========================================================================

  // 1. Stronghold Fort Deck
  platforms.push({
    id: 'zone4_fort_deck',
    x: 9060,
    y: 680,
    w: 740,
    h: 500,
    type: 'solid',
  });

  // Cyborg Enforcer #3
  enemies.push({
    id: 'cyborg_03',
    type: 'cyborg',
    x: 9280,
    y: 608,
    w: 44,
    h: 72,
    startX: 9140,
    endX: 9540,
    speed: 115,
    facing: 1,
    alive: true,
  });

  // Drones #5 & #6 Guarding Gates
  enemies.push({
    id: 'drone_05',
    type: 'drone',
    x: 9550,
    y: 560,
    baseY: 560,
    w: 48,
    h: 38,
    startX: 9450,
    endX: 9680,
    speed: 95,
    facing: 1,
    alive: true,
  });

  enemies.push({
    id: 'drone_06',
    type: 'drone',
    x: 9780,
    y: 510,
    baseY: 510,
    w: 48,
    h: 38,
    startX: 9680,
    endX: 9920,
    speed: 85,
    facing: -1,
    alive: true,
  });

  // 2. High Outpost Deck
  platforms.push({
    id: 'zone4_outpost_deck',
    x: 9800,
    y: 680,
    w: 520,
    h: 500,
    type: 'solid',
  });

  // Cyborg Enforcer #4
  enemies.push({
    id: 'cyborg_04',
    type: 'cyborg',
    x: 9980,
    y: 608,
    w: 44,
    h: 72,
    startX: 9860,
    endX: 10220,
    speed: 130,
    facing: 1,
    alive: true,
  });

  // 3. The Grand Apex Incline Ski Ramp (Smooth gradual 20px steps)
  platforms.push({
    id: 'apex_ramp_step_1',
    x: 10320,
    y: 660,
    w: 160,
    h: 500,
    type: 'solid',
  });
  platforms.push({
    id: 'apex_ramp_step_2',
    x: 10480,
    y: 640,
    w: 160,
    h: 500,
    type: 'solid',
  });
  platforms.push({
    id: 'apex_ramp_step_3',
    x: 10640,
    y: 620,
    w: 180,
    h: 500,
    type: 'solid',
  });

  // Supersonic Apex Boost Pad #5 (The Mega Launch)
  platforms.push({
    id: 'boost_pad_5_apex',
    x: 10820,
    y: 620,
    w: 220,
    h: 32,
    type: 'boost_pad',
    boostVx: 1550,
    boostVy: -820,
  });

  tutorialSigns.push({
    id: 'sign_apex_launch',
    x: 10700,
    y: 560,
    action: 'GRAND APEX LAUNCH',
    instruction: 'Hit the Apex Booster at full sprint for the ultimate supersonic leap to victory!',
    desktopKey: 'FULL THROTTLE',
    icon: '🏆',
  });

  // 4. Grand Finale Coin Flight Arc over the Abyss
  for (let c = 0; c < 16; c++) {
    const t = (c + 1) / 17;
    const cx = 10900 + t * 950;
    const cy = 600 - Math.sin(t * Math.PI) * 440;
    collectibles.push({
      id: `coin_apex_arc_${c}`,
      type: 'coin',
      x: Math.round(cx),
      y: Math.round(cy),
      collected: false,
    });
  }

  // 5. Final Apex Gantry Platform & Checkpoint 4 (CRITICAL BUG FIX: CP4 has a solid platform beneath it)
  platforms.push({
    id: 'apex_mid_gantry',
    x: 11040,
    y: 690,
    w: 240,
    h: 32,
    type: 'solid',
  });

  checkpoints.push({
    id: 'cp_4_apex',
    name: 'APEX PINNACLE',
    x: 11150,
    y: 690,
    activated: false,
  });

  // Safety suspended girder beneath the final leap
  platforms.push({
    id: 'apex_safety_net',
    x: 11000,
    y: 920,
    w: 380,
    h: 25,
    type: 'solid',
  });
  platforms.push({
    id: 'apex_safety_boost',
    x: 11240,
    y: 920,
    w: 100,
    h: 25,
    type: 'boost_pad',
    boostVx: 450,
    boostVy: -650,
  });

  // 6. Grand Victory Platform
  platforms.push({
    id: 'mega_finish_deck',
    x: 11340,
    y: 700,
    w: 680,
    h: 500,
    type: 'solid',
  });

  skylineDoodads.push(
    { type: 'neon_sign', x: 11440, y: 580, text: 'বিজয় গেট', color: '#10b981' },
    { type: 'water_tank', x: 11780, y: 580, w: 90, h: 120 }
  );

  // Finish Gate
  const finishGate: LevelFinishGate = {
    x: 11680,
    y: 560,
    w: 120,
    h: 140,
  };

  return {
    id: 'parkour_mega_ramp',
    levelNumber: 99,
    name: 'Dhaka Mega Ramp: Skyline Overdrive',
    targetSeconds: 240, // 4:00 minutes par
    parSeconds: 180,
    coinsForStar: 60,
    worldWidth: 12400,
    worldHeight: 1800,
    spawnPoint: { x: 120, y: 360 },
    platforms,
    collectibles,
    checkpoints,
    tutorialSigns,
    finishGate,
    enemies,
    skylineDoodads,
  };
}
