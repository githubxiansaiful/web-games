import { LevelData } from './types';

export const LEVELS: LevelData[] = [
  // ==========================================
  // LEVEL 1: Greenhorn Grasslands
  // ==========================================
  {
    id: 1,
    name: 'Greenhorn Grasslands',
    subtitle: 'Learn to run, jump & double-jump!',
    theme: {
      name: 'meadow',
      skyGradient: ['#38bdf8', '#7dd3fc', '#bae6fd'],
      mountainColor: '#6ee7b7',
      hillColor: '#34d399',
      groundTopColor: '#22c55e',
      groundBodyColor: '#78350f',
      platformColor: '#15803d',
      platformAccent: '#4ade80',
      accentColor: '#fbbf24',
    },
    width: 3200,
    height: 900,
    deathY: 850,
    spawn: { x: 80, y: 600 },
    platforms: [
      // Starting base ground
      { x: 0, y: 660, width: 500, height: 240, type: 'ground' },
      
      // Step platforms to teach basic jump
      { x: 360, y: 560, width: 100, height: 40, type: 'floating' },
      { x: 520, y: 480, width: 120, height: 40, type: 'floating' },

      // Second island
      { x: 700, y: 660, width: 350, height: 240, type: 'ground' },

      // High ledge teaching double-jump
      { x: 860, y: 430, width: 120, height: 30, type: 'stone' },

      // Third island (pre-checkpoint)
      { x: 1140, y: 660, width: 380, height: 240, type: 'ground' },

      // Elevated pillars across a chasm
      { x: 1600, y: 600, width: 110, height: 300, type: 'ground' },
      { x: 1950, y: 550, width: 120, height: 350, type: 'ground' },

      // Final stretch to goal
      { x: 2360, y: 660, width: 840, height: 240, type: 'ground' },
      { x: 2600, y: 540, width: 110, height: 30, type: 'floating' },
      { x: 2780, y: 440, width: 120, height: 30, type: 'floating' },
      { x: 2980, y: 360, width: 160, height: 30, type: 'stone' }, // Goal platform
    ],
    movingPlatforms: [
      // Platform 1: Horizontal crossing between island 2 and 3
      {
        id: 'l1_p1',
        x: 1060,
        y: 650,
        width: 90,
        height: 22,
        startX: 1050,
        startY: 650,
        endX: 1140,
        endY: 650,
        speed: 80,
      },
      // Platform 2: Large horizontal ferry across the deep gorge
      {
        id: 'l1_p2',
        x: 1720,
        y: 600,
        width: 100,
        height: 22,
        startX: 1720,
        startY: 600,
        endX: 1930,
        endY: 600,
        speed: 95,
      },
      // Platform 3: Vertical elevator to the final high area
      {
        id: 'l1_p3',
        x: 2150,
        y: 620,
        width: 100,
        height: 22,
        startX: 2150,
        startY: 640,
        endX: 2150,
        endY: 480,
        speed: 85,
      },
    ],
    coins: [
      // Starting tutorial trail
      { id: 'c1', x: 220, y: 610, radius: 12, collected: false, animOffset: 0 },
      { id: 'c2', x: 270, y: 610, radius: 12, collected: false, animOffset: 0.3 },
      { id: 'c3', x: 320, y: 610, radius: 12, collected: false, animOffset: 0.6 },

      // Over the first step
      { id: 'c4', x: 410, y: 510, radius: 12, collected: false, animOffset: 0.2 },
      { id: 'c5', x: 580, y: 430, radius: 12, collected: false, animOffset: 0.5 },

      // High double-jump reward
      { id: 'c6', x: 920, y: 380, radius: 12, collected: false, animOffset: 0.1 },
      { id: 'c7', x: 880, y: 380, radius: 12, collected: false, animOffset: 0.4 },
      { id: 'c8', x: 960, y: 380, radius: 12, collected: false, animOffset: 0.7 },

      // Above moving platform 1
      { id: 'c9', x: 1100, y: 580, radius: 12, collected: false, animOffset: 0.2 },

      // Arc over spikes on island 3
      { id: 'c10', x: 1280, y: 570, radius: 12, collected: false, animOffset: 0.8 },
      { id: 'c11', x: 1330, y: 540, radius: 12, collected: false, animOffset: 1.1 },
      { id: 'c12', x: 1380, y: 570, radius: 12, collected: false, animOffset: 1.4 },

      // Gorge crossing coins
      { id: 'c13', x: 1650, y: 540, radius: 12, collected: false, animOffset: 0.4 },
      { id: 'c14', x: 1820, y: 530, radius: 12, collected: false, animOffset: 0.9 },
      { id: 'c15', x: 2010, y: 490, radius: 12, collected: false, animOffset: 1.2 },

      // Vertical elevator path coins
      { id: 'c16', x: 2150, y: 560, radius: 12, collected: false, animOffset: 0.1 },
      { id: 'c17', x: 2150, y: 440, radius: 12, collected: false, animOffset: 0.5 },

      // Final staircase coins
      { id: 'c18', x: 2650, y: 490, radius: 12, collected: false, animOffset: 0.3 },
      { id: 'c19', x: 2840, y: 390, radius: 12, collected: false, animOffset: 0.7 },
      { id: 'c20', x: 3060, y: 310, radius: 12, collected: false, animOffset: 1.0 },
    ],
    hazards: [
      // Spikes on island 3
      { id: 'h1', type: 'spike_up', x: 1300, y: 640, width: 60, height: 20 },
      // Spikes on ground before final climb
      { id: 'h2', type: 'spike_up', x: 2460, y: 640, width: 80, height: 20 },
      // Gentle pacing slime on starting area
      {
        id: 'h3',
        type: 'slime',
        x: 780,
        y: 636,
        width: 32,
        height: 24,
        startX: 720,
        endX: 860,
        speed: 50,
      },
    ],
    checkpoints: [
      {
        id: 'cp_1_1',
        x: 1200,
        y: 600,
        width: 30,
        height: 60,
        active: false,
        respawnX: 1200,
        respawnY: 610,
      },
      {
        id: 'cp_1_2',
        x: 2390,
        y: 600,
        width: 30,
        height: 60,
        active: false,
        respawnX: 2390,
        respawnY: 610,
      },
    ],
    springs: [
      { id: 'sp1', x: 2490, y: 642, width: 34, height: 18, force: -720 },
    ],
    goal: {
      x: 3080,
      y: 280,
      width: 40,
      height: 80,
      reached: false,
    },
    parTime: 45,
  },

  // ==========================================
  // LEVEL 2: Clockwork Cavern
  // ==========================================
  {
    id: 2,
    name: 'Clockwork Cavern',
    subtitle: 'Hazardous saws, moving gears & spike chasms!',
    theme: {
      name: 'cavern',
      skyGradient: ['#1e1b4b', '#312e81', '#4338ca'],
      mountainColor: '#374151',
      hillColor: '#4b5563',
      groundTopColor: '#0284c7',
      groundBodyColor: '#1f2937',
      platformColor: '#475569',
      platformAccent: '#38bdf8',
      accentColor: '#f43f5e',
    },
    width: 3800,
    height: 1000,
    deathY: 950,
    spawn: { x: 90, y: 700 },
    platforms: [
      // Starting zone
      { x: 0, y: 760, width: 450, height: 240, type: 'stone' },

      // First pit stepping stones
      { x: 530, y: 720, width: 90, height: 40, type: 'floating' },
      { x: 700, y: 670, width: 90, height: 40, type: 'floating' },

      // Island 2
      { x: 880, y: 760, width: 420, height: 240, type: 'stone' },

      // Elevated chamber
      { x: 1390, y: 640, width: 140, height: 360, type: 'stone' },
      { x: 1610, y: 520, width: 160, height: 40, type: 'floating' },
      
      // Upper checkpoint platform
      { x: 1850, y: 440, width: 260, height: 40, type: 'stone' },

      // Danger descent
      { x: 2200, y: 620, width: 110, height: 40, type: 'floating' },
      { x: 2400, y: 760, width: 340, height: 240, type: 'stone' },

      // Precision moving platform bay
      { x: 2840, y: 680, width: 100, height: 40, type: 'floating' },

      // Final citadel base
      { x: 3300, y: 740, width: 500, height: 260, type: 'stone' },
      { x: 3420, y: 620, width: 110, height: 30, type: 'floating' },
      { x: 3580, y: 500, width: 110, height: 30, type: 'floating' },
      { x: 3660, y: 380, width: 130, height: 30, type: 'stone' },
    ],
    movingPlatforms: [
      // Fast horizontal shuttle 1
      {
        id: 'l2_p1',
        x: 980,
        y: 600,
        width: 85,
        height: 20,
        startX: 950,
        startY: 600,
        endX: 1180,
        endY: 600,
        speed: 110,
      },
      // Vertical elevator 1
      {
        id: 'l2_p2',
        x: 1250,
        y: 720,
        width: 85,
        height: 20,
        startX: 1250,
        startY: 720,
        endX: 1250,
        endY: 520,
        speed: 100,
      },
      // Diagonal or oscillating horizontal across spike zone
      {
        id: 'l2_p3',
        x: 2540,
        y: 620,
        width: 80,
        height: 20,
        startX: 2500,
        startY: 620,
        endX: 2760,
        endY: 620,
        speed: 120,
      },
      // High elevator to final stretch
      {
        id: 'l2_p4',
        x: 3030,
        y: 700,
        width: 90,
        height: 20,
        startX: 3030,
        startY: 720,
        endX: 3030,
        endY: 480,
        speed: 105,
      },
      // Shuttle to citadel
      {
        id: 'l2_p5',
        x: 3170,
        y: 480,
        width: 85,
        height: 20,
        startX: 3150,
        startY: 480,
        endX: 3300,
        endY: 480,
        speed: 90,
      },
    ],
    coins: [
      { id: 'c2_1', x: 220, y: 710, radius: 12, collected: false, animOffset: 0.1 },
      { id: 'c2_2', x: 320, y: 710, radius: 12, collected: false, animOffset: 0.3 },
      { id: 'c2_3', x: 575, y: 660, radius: 12, collected: false, animOffset: 0.6 },
      { id: 'c2_4', x: 745, y: 610, radius: 12, collected: false, animOffset: 0.2 },
      { id: 'c2_5', x: 1070, y: 540, radius: 12, collected: false, animOffset: 0.5 },
      { id: 'c2_6', x: 1250, y: 470, radius: 12, collected: false, animOffset: 0.8 },
      { id: 'c2_7', x: 1460, y: 580, radius: 12, collected: false, animOffset: 0.4 },
      { id: 'c2_8', x: 1690, y: 460, radius: 12, collected: false, animOffset: 0.7 },
      { id: 'c2_9', x: 1920, y: 390, radius: 12, collected: false, animOffset: 0.1 },
      { id: 'c2_10', x: 1980, y: 390, radius: 12, collected: false, animOffset: 0.3 },
      { id: 'c2_11', x: 2040, y: 390, radius: 12, collected: false, animOffset: 0.5 },
      { id: 'c2_12', x: 2250, y: 560, radius: 12, collected: false, animOffset: 0.9 },
      { id: 'c2_13', x: 2630, y: 560, radius: 12, collected: false, animOffset: 0.3 },
      { id: 'c2_14', x: 2890, y: 620, radius: 12, collected: false, animOffset: 0.7 },
      { id: 'c2_15', x: 3030, y: 430, radius: 12, collected: false, animOffset: 0.2 },
      { id: 'c2_16', x: 3230, y: 430, radius: 12, collected: false, animOffset: 0.6 },
      { id: 'c2_17', x: 3370, y: 680, radius: 12, collected: false, animOffset: 0.4 },
      { id: 'c2_18', x: 3470, y: 560, radius: 12, collected: false, animOffset: 0.8 },
      { id: 'c2_19', x: 3630, y: 440, radius: 12, collected: false, animOffset: 1.1 },
      { id: 'c2_20', x: 3720, y: 320, radius: 12, collected: false, animOffset: 1.3 },
    ],
    hazards: [
      // Floor spikes under first floating platforms
      { id: 'h2_1', type: 'spike_up', x: 480, y: 920, width: 360, height: 20 },
      // Spikes on Island 2
      { id: 'h2_2', type: 'spike_up', x: 1010, y: 740, width: 80, height: 20 },
      // Moving Saw on Island 2
      {
        id: 'h2_3',
        type: 'saw',
        x: 1160,
        y: 730,
        width: 36,
        height: 36,
        startX: 1100,
        endX: 1240,
        speed: 90,
      },
      // Chasm spikes
      { id: 'h2_4', type: 'spike_up', x: 2500, y: 740, width: 120, height: 20 },
      // Patrolling enemy near checkpoint 2
      {
        id: 'h2_5',
        type: 'slime',
        x: 2470,
        y: 736,
        width: 32,
        height: 24,
        startX: 2420,
        endX: 2560,
        speed: 60,
      },
      // Buzz saw guarding citadel entrance
      {
        id: 'h2_6',
        type: 'saw',
        x: 3220,
        y: 440,
        width: 40,
        height: 40,
        startX: 3170,
        endX: 3270,
        speed: 120,
      },
    ],
    checkpoints: [
      {
        id: 'cp_2_1',
        x: 1880,
        y: 380,
        width: 30,
        height: 60,
        active: false,
        respawnX: 1880,
        respawnY: 390,
      },
      {
        id: 'cp_2_2',
        x: 2680,
        y: 700,
        width: 30,
        height: 60,
        active: false,
        respawnX: 2680,
        respawnY: 710,
      },
    ],
    springs: [
      { id: 'sp2_1', x: 890, y: 742, width: 34, height: 18, force: -760 },
      { id: 'sp2_2', x: 2710, y: 742, width: 34, height: 18, force: -780 },
    ],
    goal: {
      x: 3720,
      y: 300,
      width: 40,
      height: 80,
      reached: false,
    },
    parTime: 55,
  },

  // ==========================================
  // LEVEL 3: Starlight Skyway
  // ==========================================
  {
    id: 3,
    name: 'Starlight Skyway',
    subtitle: 'Super spring boosts & cosmic precision jumps!',
    theme: {
      name: 'skyway',
      skyGradient: ['#0f172a', '#1e1b4b', '#581c87'],
      mountainColor: '#3b0764',
      hillColor: '#6b21a8',
      groundTopColor: '#e879f9',
      groundBodyColor: '#2e1065',
      platformColor: '#701a75',
      platformAccent: '#f472b6',
      accentColor: '#38bdf8',
    },
    width: 4200,
    height: 1000,
    deathY: 950,
    spawn: { x: 100, y: 680 },
    platforms: [
      // Starting launch pad
      { x: 0, y: 740, width: 400, height: 260, type: 'ground' },

      // High floating constellation pillars
      { x: 500, y: 640, width: 100, height: 30, type: 'floating' },
      { x: 700, y: 520, width: 100, height: 30, type: 'floating' },
      { x: 920, y: 420, width: 140, height: 30, type: 'stone' },

      // First resting island
      { x: 1200, y: 540, width: 280, height: 40, type: 'stone' },

      // Aerial highway
      { x: 1680, y: 460, width: 110, height: 30, type: 'floating' },
      { x: 1980, y: 380, width: 240, height: 40, type: 'stone' }, // Checkpoint 1 island

      // Stepping sequence over bottomless void
      { x: 2360, y: 480, width: 90, height: 30, type: 'floating' },
      { x: 2600, y: 580, width: 100, height: 30, type: 'floating' },
      { x: 2820, y: 500, width: 260, height: 40, type: 'stone' }, // Checkpoint 2 island

      // Sky bounce arena
      { x: 3260, y: 560, width: 120, height: 30, type: 'floating' },
      { x: 3500, y: 420, width: 110, height: 30, type: 'floating' },

      // Grand Pinnacle
      { x: 3750, y: 340, width: 420, height: 60, type: 'stone' },
    ],
    movingPlatforms: [
      // High speed horizontal shuttle
      {
        id: 'l3_p1',
        x: 1080,
        y: 480,
        width: 80,
        height: 20,
        startX: 1070,
        startY: 480,
        endX: 1180,
        endY: 480,
        speed: 130,
      },
      // Fast vertical elevator across void
      {
        id: 'l3_p2',
        x: 1520,
        y: 560,
        width: 90,
        height: 20,
        startX: 1520,
        startY: 620,
        endX: 1520,
        endY: 420,
        speed: 125,
      },
      // Oscillating platform
      {
        id: 'l3_p3',
        x: 2230,
        y: 420,
        width: 85,
        height: 20,
        startX: 2210,
        startY: 420,
        endX: 2340,
        endY: 420,
        speed: 140,
      },
      // Long glide platform to the bounce arena
      {
        id: 'l3_p4',
        x: 3090,
        y: 520,
        width: 85,
        height: 20,
        startX: 3080,
        startY: 520,
        endX: 3240,
        endY: 520,
        speed: 120,
      },
      // Super vertical elevator
      {
        id: 'l3_p5',
        x: 3630,
        y: 460,
        width: 85,
        height: 20,
        startX: 3630,
        startY: 480,
        endX: 3630,
        endY: 310,
        speed: 115,
      },
    ],
    coins: [
      { id: 'c3_1', x: 200, y: 690, radius: 12, collected: false, animOffset: 0.1 },
      { id: 'c3_2', x: 300, y: 690, radius: 12, collected: false, animOffset: 0.3 },
      { id: 'c3_3', x: 550, y: 580, radius: 12, collected: false, animOffset: 0.6 },
      { id: 'c3_4', x: 750, y: 460, radius: 12, collected: false, animOffset: 0.2 },
      { id: 'c3_5', x: 990, y: 360, radius: 12, collected: false, animOffset: 0.5 },
      { id: 'c3_6', x: 1130, y: 420, radius: 12, collected: false, animOffset: 0.8 },
      { id: 'c3_7', x: 1300, y: 480, radius: 12, collected: false, animOffset: 0.3 },
      { id: 'c3_8', x: 1360, y: 480, radius: 12, collected: false, animOffset: 0.6 },
      { id: 'c3_9', x: 1520, y: 370, radius: 12, collected: false, animOffset: 0.9 },
      { id: 'c3_10', x: 1730, y: 400, radius: 12, collected: false, animOffset: 0.2 },
      { id: 'c3_11', x: 2040, y: 320, radius: 12, collected: false, animOffset: 0.4 },
      { id: 'c3_12', x: 2100, y: 320, radius: 12, collected: false, animOffset: 0.7 },
      { id: 'c3_13', x: 2270, y: 360, radius: 12, collected: false, animOffset: 1.0 },
      { id: 'c3_14', x: 2410, y: 420, radius: 12, collected: false, animOffset: 0.3 },
      { id: 'c3_15', x: 2650, y: 520, radius: 12, collected: false, animOffset: 0.8 },
      { id: 'c3_16', x: 2900, y: 440, radius: 12, collected: false, animOffset: 0.1 },
      { id: 'c3_17', x: 2960, y: 440, radius: 12, collected: false, animOffset: 0.4 },
      { id: 'c3_18', x: 3160, y: 460, radius: 12, collected: false, animOffset: 0.7 },
      { id: 'c3_19', x: 3320, y: 490, radius: 12, collected: false, animOffset: 0.2 },
      { id: 'c3_20', x: 3550, y: 360, radius: 12, collected: false, animOffset: 0.5 },
      { id: 'c3_21', x: 3820, y: 280, radius: 12, collected: false, animOffset: 0.9 },
      { id: 'c3_22', x: 3880, y: 280, radius: 12, collected: false, animOffset: 1.2 },
      { id: 'c3_23', x: 3940, y: 280, radius: 12, collected: false, animOffset: 1.5 },
    ],
    hazards: [
      // Saw hovering between pillars
      {
        id: 'h3_1',
        type: 'saw',
        x: 830,
        y: 470,
        width: 36,
        height: 36,
        startX: 810,
        endX: 890,
        speed: 80,
      },
      // Spikes on island 1
      { id: 'h3_2', type: 'spike_up', x: 1380, y: 520, width: 60, height: 20 },
      // High speed saw on aerial route
      {
        id: 'h3_3',
        type: 'saw',
        x: 1830,
        y: 420,
        width: 38,
        height: 38,
        startX: 1790,
        endX: 1910,
        speed: 130,
      },
      // Spikes guarding checkpoint 2
      { id: 'h3_4', type: 'spike_up', x: 2990, y: 480, width: 70, height: 20 },
      // Slime guarding the pinnacle
      {
        id: 'h3_5',
        type: 'slime',
        x: 3920,
        y: 316,
        width: 32,
        height: 24,
        startX: 3850,
        endX: 4020,
        speed: 80,
      },
    ],
    checkpoints: [
      {
        id: 'cp_3_1',
        x: 2000,
        y: 320,
        width: 30,
        height: 60,
        active: false,
        respawnX: 2000,
        respawnY: 330,
      },
      {
        id: 'cp_3_2',
        x: 2860,
        y: 440,
        width: 30,
        height: 60,
        active: false,
        respawnX: 2860,
        respawnY: 450,
      },
    ],
    springs: [
      { id: 'sp3_1', x: 330, y: 722, width: 34, height: 18, force: -800 },
      { id: 'sp3_2', x: 3310, y: 542, width: 34, height: 18, force: -840 },
    ],
    goal: {
      x: 4080,
      y: 260,
      width: 40,
      height: 80,
      reached: false,
    },
    parTime: 65,
  },
];
