export interface MissionObjective {
  id: string;
  description: string;
  targetType: 'enter_vehicle' | 'drive_to' | 'eliminate_enemies' | 'collect_item' | 'escape_police';
  targetPosition?: { x: number; y: number; z: number };
  targetRadius?: number;
  requiredCount?: number;
}

export interface MissionData {
  id: string;
  title: string;
  subtitle: string;
  briefing: string;
  rewardMoney: number;
  rewardStars: number;
  objectives: MissionObjective[];
}

export const MISSIONS: MissionData[] = [
  {
    id: 'mission_001',
    title: 'The Downtown Drop',
    subtitle: 'Contract 1: Smuggled Tech Retrieval',
    briefing: 'Syndicate scouts located a prototype tech container in the Harborview Port District. Get into your vehicle, head east along the arterial highway to Harborview, neutralize the syndicate guards, secure the cargo, and lose the heat.',
    rewardMoney: 1500,
    rewardStars: 5,
    objectives: [
      {
        id: 'obj_enter_car',
        description: 'Locate your cyan Apex GT coupe and press [F] to enter.',
        targetType: 'enter_vehicle',
      },
      {
        id: 'obj_drive_warehouse',
        description: 'Drive to the Harborview Port Warehouse.',
        targetType: 'drive_to',
        targetPosition: { x: 280, y: 0, z: 108 },
        targetRadius: 16,
      },
      {
        id: 'obj_eliminate_guards',
        description: 'Neutralize the hostile syndicate guards at Harborview.',
        targetType: 'eliminate_enemies',
        requiredCount: 3,
      },
      {
        id: 'obj_collect_cache',
        description: 'Secure the glowing contraband tech briefcase.',
        targetType: 'collect_item',
        targetPosition: { x: 282, y: 1, z: 110 },
        targetRadius: 4,
      },
      {
        id: 'obj_escape_police',
        description: 'Escape the 3-Star Police chase and lose the heat!',
        targetType: 'escape_police',
      },
    ],
  },
  {
    id: 'mission_002',
    title: 'Midnight Blitz',
    subtitle: 'Contract 2: High-Speed Courier Run',
    briefing: 'A high-roller syndicate client needs a secure package delivered through island checkpoints before the district lockdown starts. Keep your speed up across the bridges.',
    rewardMoney: 2500,
    rewardStars: 10,
    objectives: [
      {
        id: 'obj_checkpoint_1',
        description: 'Hit the Oak Heights checkpoint.',
        targetType: 'drive_to',
        targetPosition: { x: 280, y: 0, z: -58 },
        targetRadius: 14,
      },
      {
        id: 'obj_checkpoint_2',
        description: 'Sprint across the Southbridge overpass.',
        targetType: 'drive_to',
        targetPosition: { x: 15, y: 0, z: 188 },
        targetRadius: 14,
      },
      {
        id: 'obj_checkpoint_3',
        description: 'Deliver to Riverside safehouse.',
        targetType: 'drive_to',
        targetPosition: { x: -215, y: 0, z: 65 },
        targetRadius: 14,
      },
      {
        id: 'obj_escape_final',
        description: 'Evade any pursuing patrol cruisers.',
        targetType: 'escape_police',
      },
    ],
  },
];
