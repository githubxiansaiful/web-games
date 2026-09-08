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
    briefing: 'Syndicate scouts located a prototype tech container in the Northside Shipping District. Get into your vehicle, head north to the compound, secure the cargo, and lose the heat.',
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
        description: 'Drive to the Northside Port Warehouse.',
        targetType: 'drive_to',
        targetPosition: { x: 0, y: 0, z: -140 },
        targetRadius: 12,
      },
      {
        id: 'obj_eliminate_guards',
        description: 'Neutralize the hostile syndicate syndicate guards.',
        targetType: 'eliminate_enemies',
        requiredCount: 3,
      },
      {
        id: 'obj_collect_cache',
        description: 'Secure the glowing contraband tech briefcase.',
        targetType: 'collect_item',
        targetPosition: { x: 4, y: 1, z: -148 },
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
    briefing: 'A high-roller client needs a secure package delivered through city checkpoints before the metro lockdown starts. Keep your speed up and do not wreck your ride.',
    rewardMoney: 2500,
    rewardStars: 10,
    objectives: [
      {
        id: 'obj_checkpoint_1',
        description: 'Hit the Financial District checkpoint.',
        targetType: 'drive_to',
        targetPosition: { x: 120, y: 0, z: 0 },
        targetRadius: 10,
      },
      {
        id: 'obj_checkpoint_2',
        description: 'Sprint across the Eastside Overpass.',
        targetType: 'drive_to',
        targetPosition: { x: 120, y: 0, z: 120 },
        targetRadius: 10,
      },
      {
        id: 'obj_checkpoint_3',
        description: 'Deliver to safehouse drop off.',
        targetType: 'drive_to',
        targetPosition: { x: -80, y: 0, z: 100 },
        targetRadius: 10,
      },
      {
        id: 'obj_escape_final',
        description: 'Evade any pursuing patrol cruisers.',
        targetType: 'escape_police',
      },
    ],
  },
];
