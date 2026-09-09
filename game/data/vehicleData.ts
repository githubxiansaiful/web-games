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
  modelPath?: string;
}

export const VEHICLE_CONFIGS: Record<string, VehicleConfig> = {
  lamborghini_fenomeno: {
    id: 'lamborghini_fenomeno',
    name: 'Lamborghini Fenomeno 2026',
    type: 'sports',
    maxSpeed: 46, // ~165 km/h (fast & exciting, yet controllable on city streets)
    reverseMaxSpeed: 14,
    acceleration: 22, // Progressive, punchy V12 launch
    brakeForce: 45, // Carbon ceramic brakes
    turnSpeed: 2.6, // Nimble, responsive supercar turning
    mass: 1420,
    health: 600,
    primaryColor: 0xfacc15, // Vibrant Giallo Auge Lamborghini Pearl Yellow
    roofColor: 0x09090b,
    hasSiren: false,
    modelPath: '/models/vehicles/lamborghini.glb',
  },
  gt_coupe: {
    id: 'gt_coupe',
    name: 'Apex GT-99',
    type: 'sports',
    maxSpeed: 36, // ~130 km/h
    reverseMaxSpeed: 12,
    acceleration: 16,
    brakeForce: 35,
    turnSpeed: 1.6,
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
    maxSpeed: 38, // ~137 km/h
    reverseMaxSpeed: 14,
    acceleration: 18,
    brakeForce: 38,
    turnSpeed: 1.5,
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
    maxSpeed: 28, // ~100 km/h
    reverseMaxSpeed: 10,
    acceleration: 13,
    brakeForce: 28,
    turnSpeed: 1.35,
    mass: 1550,
    health: 350,
    primaryColor: 0xeab308, // Classic Yellow Cab
    roofColor: 0x1e293b,
    hasSiren: false,
  },
};
