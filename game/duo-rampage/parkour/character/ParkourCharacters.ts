/**
 * DUO RAMPAGE: DHAKA PARKOUR - Character Registry & Definitions
 * Contains full sprite paths, stats, and thematic colors for all selectable 2D runners.
 * Stored in public/images/characters/2d/ for multi-game reuse across the platform.
 */

export interface ParkourCharacterDef {
  id: string;
  name: string;
  codename: string;
  roleDescription: string;
  accentColor: string;
  basePath: string;
  thumbnailUrl: string;
  avatarUrl: string;
  stats: {
    speed: number;    // 0-100
    jump: number;     // 0-100
    agility: number;  // 0-100
  };
}

export const PARKOUR_CHARACTERS: ParkourCharacterDef[] = [
  {
    id: 'char_1',
    name: 'KOBRA',
    codename: 'Crimson Vanguard',
    roleDescription: 'Tactical ninja runner with razor-sharp slide recovery and high-velocity dashes.',
    accentColor: '#ef4444',
    basePath: '/images/characters/2d/Full body animated characters/Char 1/with hands',
    thumbnailUrl: '/images/characters/2d/thumbnails/char_1.png',
    avatarUrl: '/images/characters/2d/thumbnails/char_1_head.png',
    stats: { speed: 92, jump: 88, agility: 95 },
  },
  {
    id: 'char_2',
    name: 'PHANTOM',
    codename: 'Cyber Commando',
    roleDescription: 'Advanced cybernetic scout with enhanced sprint acceleration on long straights.',
    accentColor: '#06b6d4',
    basePath: '/images/characters/2d/Full body animated characters/Char 2/with hands',
    thumbnailUrl: '/images/characters/2d/thumbnails/char_2.png',
    avatarUrl: '/images/characters/2d/thumbnails/char_2_head.png',
    stats: { speed: 96, jump: 85, agility: 90 },
  },
  {
    id: 'char_3',
    name: 'STRIKER',
    codename: 'Urban Viper',
    roleDescription: 'Precision rooftop acrobat with extended vertical reach and sticky wall grip.',
    accentColor: '#22c55e',
    basePath: '/images/characters/2d/Full body animated characters/Char 3/with hands',
    thumbnailUrl: '/images/characters/2d/thumbnails/char_3.png',
    avatarUrl: '/images/characters/2d/thumbnails/char_3_head.png',
    stats: { speed: 89, jump: 96, agility: 94 },
  },
  {
    id: 'char_4',
    name: 'BLAZE',
    codename: 'Solar Punk',
    roleDescription: 'Dynamic trickster runner with explosive vault exit speed and high air control.',
    accentColor: '#f59e0b',
    basePath: '/images/characters/2d/Full body animated characters/Char 4/with hands',
    thumbnailUrl: '/images/characters/2d/thumbnails/char_4.png',
    avatarUrl: '/images/characters/2d/thumbnails/char_4_head.png',
    stats: { speed: 90, jump: 92, agility: 96 },
  },
  {
    id: 'enemy_1',
    name: 'CYBORG',
    codename: 'Steel Titan',
    roleDescription: 'Armored heavy operative with steady ground traction and shock-absorbent landings.',
    accentColor: '#8b5cf6',
    basePath: '/images/characters/2d/Full body animated characters/Enemies/Enemy 1',
    thumbnailUrl: '/images/characters/2d/thumbnails/enemy_1.png',
    avatarUrl: '/images/characters/2d/thumbnails/enemy_1_head.png',
    stats: { speed: 86, jump: 90, agility: 88 },
  },
  {
    id: 'enemy_4',
    name: 'NIGHTSHADE',
    codename: 'Shadow Infiltrator',
    roleDescription: 'Covert operative with low-friction rolls and rapid recovery through narrow ducts.',
    accentColor: '#ec4899',
    basePath: '/images/characters/2d/Full body animated characters/Enemies/Enemy 4',
    thumbnailUrl: '/images/characters/2d/thumbnails/enemy_4.png',
    avatarUrl: '/images/characters/2d/thumbnails/enemy_4_head.png',
    stats: { speed: 94, jump: 91, agility: 97 },
  },
];

export const DEFAULT_CHARACTER_ID = 'char_1';

export function getCharacterDef(id: string): ParkourCharacterDef {
  const found = PARKOUR_CHARACTERS.find((c) => c.id === id);
  return found || PARKOUR_CHARACTERS[0];
}
