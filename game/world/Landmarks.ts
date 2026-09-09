import * as THREE from 'three';
import { Buildings } from './Buildings';

interface LandmarkInstance {
  name: string;
  x: number;
  z: number;
  rotationY: number;
}

export class Landmarks {
  public group: THREE.Group;
  private scene: THREE.Scene;
  private buildings: Buildings;
  private getHeight?: (x: number, z: number) => number;

  constructor(
    scene: THREE.Scene,
    buildings: Buildings,
    getHeight?: (x: number, z: number) => number
  ) {
    this.group = new THREE.Group();
    this.group.name = 'LandmarkFeatures';
    this.scene = scene;
    this.buildings = buildings;
    this.getHeight = getHeight;

    this.scene.add(this.group);
    this.loadModels();
  }

  private loadModels(): void {
    if (typeof window === 'undefined') return;

    import('three/examples/jsm/loaders/GLTFLoader.js').then(({ GLTFLoader }) => {
      const loader = new GLTFLoader();

      // 1. Town Bank (Stone bank with columned porch, hipped roof, vault door)
      loader.load(
        '/models/buildings/bank.glb',
        (gltf) => {
          this.setupModel(gltf.scene);
          this.spawnBanks(gltf.scene);
        },
        undefined,
        (err) => console.warn('Failed loading /models/buildings/bank.glb:', err)
      );

      // 2. Two-Storey Timber Framed Townhouse (Jetty band, curved braces, tiled roof)
      loader.load(
        '/models/buildings/townhouse.glb',
        (gltf) => {
          this.setupModel(gltf.scene);
          this.spawnTownhouses(gltf.scene);
        },
        undefined,
        (err) => console.warn('Failed loading /models/buildings/townhouse.glb:', err)
      );

      // 3. Grass Landing Strip Module (20x10m module with mown lane and white cones)
      loader.load(
        '/models/environment/landing_strip.glb',
        (gltf) => {
          this.setupModel(gltf.scene);
          this.spawnLandingStrips(gltf.scene);
        },
        undefined,
        (err) => console.warn('Failed loading /models/environment/landing_strip.glb:', err)
      );

      // 4. Grass Verge Tile (Mown sage surface with tufts for sidewalk verge)
      loader.load(
        '/models/environment/grass_verge.glb',
        (gltf) => {
          this.setupModel(gltf.scene);
          this.spawnGrassVerges(gltf.scene);
        },
        undefined,
        (err) => console.warn('Failed loading /models/environment/grass_verge.glb:', err)
      );
    });
  }

  private setupModel(model: THREE.Object3D): void {
    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  private spawnBanks(template: THREE.Object3D): void {
    const instances: LandmarkInstance[] = [
      // Central City Downtown Financial District (adjacent to player spawn)
      { name: 'Central_Bank', x: 22, z: 24, rotationY: -Math.PI / 2 },
      // Southbridge Commercial District
      { name: 'Southbridge_Bank', x: 28, z: 196, rotationY: 0 },
      // Oak Heights Financial Branch
      { name: 'OakHeights_Bank', x: 285, z: -52, rotationY: Math.PI / 4 },
    ];

    const bankW = 8.2;
    const bankD = 7.3;
    const bankH = 6.5;

    instances.forEach((inst, idx) => {
      const clone = template.clone();
      const groundY = this.getHeight ? this.getHeight(inst.x, inst.z) : 0;
      clone.position.set(inst.x, groundY, inst.z);
      clone.rotation.y = inst.rotationY;
      this.group.add(clone);

      // Register solid physical collider for player, car, and bullet collision
      this.buildings.registerCustomCollider({
        id: `bank_${idx}`,
        type: 'box',
        minX: inst.x - bankW / 2,
        maxX: inst.x + bankW / 2,
        minZ: inst.z - bankD / 2,
        maxZ: inst.z + bankD / 2,
        height: groundY + bankH + 1.0,
      });
    });
  }

  private spawnTownhouses(template: THREE.Object3D): void {
    const instances: LandmarkInstance[] = [
      // Central City Heritage Quarter (across street from bank)
      { name: 'Central_Townhouse', x: -22, z: 24, rotationY: Math.PI / 2 },
      // Pacific Bluffs Village
      { name: 'PacificBluffs_Townhouse', x: -440, z: 106, rotationY: 0 },
      // Northwood Historic Street
      { name: 'Northwood_Townhouse', x: -508, z: -176, rotationY: -Math.PI / 3 },
      // Lakeview Lakeside Promenade
      { name: 'Lakeview_Townhouse', x: -212, z: -112, rotationY: Math.PI / 6 },
    ];

    const houseW = 7.3;
    const houseD = 5.9;
    const houseH = 8.8;

    instances.forEach((inst, idx) => {
      const clone = template.clone();
      const groundY = this.getHeight ? this.getHeight(inst.x, inst.z) : 0;
      clone.position.set(inst.x, groundY, inst.z);
      clone.rotation.y = inst.rotationY;
      this.group.add(clone);

      // Register solid physical collider for player, car, and bullet collision
      this.buildings.registerCustomCollider({
        id: `townhouse_${idx}`,
        type: 'box',
        minX: inst.x - houseW / 2,
        maxX: inst.x + houseW / 2,
        minZ: inst.z - houseD / 2,
        maxZ: inst.z + houseD / 2,
        height: groundY + houseH + 1.0,
      });
    });
  }

  private spawnLandingStrips(template: THREE.Object3D): void {
    // 1. Skyline Airport Main Grass Runway (5 modular segments = 100m runway)
    const runwayCenterX = -515;
    const runwayCenterZ = 318;
    const moduleLength = 20;

    for (let i = -2; i <= 2; i++) {
      const clone = template.clone();
      const posX = runwayCenterX + i * moduleLength;
      const posZ = runwayCenterZ;
      const groundY = this.getHeight ? this.getHeight(posX, posZ) : 0;
      clone.position.set(posX, groundY + 0.02, posZ);
      this.group.add(clone);
    }

    // 2. Lakeview Bush Club Airfield (3 modular segments = 60m runway)
    const lakeAirfieldX = -250;
    const lakeAirfieldZ = -75;
    for (let i = -1; i <= 1; i++) {
      const clone = template.clone();
      const posX = lakeAirfieldX + i * moduleLength;
      const posZ = lakeAirfieldZ;
      const groundY = this.getHeight ? this.getHeight(posX, posZ) : 0;
      clone.position.set(posX, groundY + 0.02, posZ);
      clone.rotation.y = 0.2;
      this.group.add(clone);
    }
  }

  private spawnGrassVerges(template: THREE.Object3D): void {
    // Modular 4x4m grass verge tiles placed along central city sidewalks and road edges
    const vergePositions = [
      // East sidewalk strip
      { x: 10, z: 12 },
      { x: 10, z: 16 },
      { x: 10, z: 20 },
      { x: 10, z: 24 },
      { x: 10, z: 28 },
      { x: 10, z: 32 },
      // West sidewalk strip
      { x: -10, z: 12 },
      { x: -10, z: 16 },
      { x: -10, z: 20 },
      { x: -10, z: 24 },
      { x: -10, z: 28 },
      { x: -10, z: 32 },
    ];

    vergePositions.forEach((pos) => {
      const clone = template.clone();
      const groundY = this.getHeight ? this.getHeight(pos.x, pos.z) : 0;
      clone.position.set(pos.x, groundY + 0.01, pos.z);
      this.group.add(clone);
    });
  }
}
