export interface VehicleConfig {
  id: string;
  name: string;
  type: 'sports' | 'police' | 'taxi';
  maxSpeed: number; // m/s
  reverseMaxSpeed: number;
  acceleration: number; // m/s^2
  brakeForce: number;
  turnSpeed: number; // rad/s
  mass: number;
  health: number;
  primaryColor: number;
  roofColor?: number;
  hasSiren?: boolean;
}

export const VEHICLE_CONFIGS: Record<string, VehicleConfig> = {
  gt_coupe: {
    id: 'gt_coupe',
    name: 'Apex GT-99',
    type: 'sports',
    maxSpeed: 42, // ~150 km/h
    reverseMaxSpeed: 14,
    acceleration: 24,
    brakeForce: 38,
    turnSpeed: 2.5,
    mass: 1350,
    health: 400,
    primaryColor: 0x06b6d4, // Neon cyan
    roofColor: 0x0f172a, // Dark carbon
    hasSiren: false,
  },
  police_cruiser: {
    id: 'police_cruiser',
    name: 'Metro Interceptor',
    type: 'police',
    maxSpeed: 45, // ~162 km/h
    reverseMaxSpeed: 16,
    acceleration: 26,
    brakeForce: 42,
    turnSpeed: 2.6,
    mass: 1800,
    health: 600,
    primaryColor: 0x0f172a, // Black & white
    roofColor: 0xffffff,
    hasSiren: true,
  },
  taxi_sedan: {
    id: 'taxi_sedan',
    name: 'City Crown Cab',
    type: 'taxi',
    maxSpeed: 32,
    reverseMaxSpeed: 10,
    acceleration: 16,
    brakeForce: 30,
    turnSpeed: 2.1,
    mass: 1550,
    health: 350,
    primaryColor: 0xeab308, // Classic Yellow Cab
    roofColor: 0x1e293b,
    hasSiren: false,
  },
};
