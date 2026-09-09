import * as THREE from 'three';
import { Roads } from './Roads';
import { Buildings } from './Buildings';
import { Props } from './Props';
import { Terrain } from './Terrain';
import { Landmarks } from './Landmarks';

export class World {
  public scene: THREE.Scene;
  public terrain: Terrain;
  public roads: Roads;
  public buildings: Buildings;
  public props: Props;
  public landmarks: Landmarks;
  public groundPlane: THREE.Mesh;
  public gridHelper: THREE.GridHelper;
  public sunLight!: THREE.DirectionalLight;
  public bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  public vehicleManager: any = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    // Expansive 4km x 4km open boundary
    this.bounds = { minX: -2000, maxX: 2000, minZ: -2000, maxZ: 2000 };

    // 1. Clear Atmospheric Sky Horizon
    const skyColor = new THREE.Color(0x60a5fa); // Bright Clear Sky Blue
    const horizonColor = new THREE.Color(0xcce2f8); // Soft Horizon
    this.scene.background = skyColor;
    this.scene.fog = new THREE.FogExp2(0xcce2f8, 0.0007);

    // 2. Daytime Sunlight & PBR Atmospheric Lighting
    this.setupLighting();

    // 3. Full Flat Ground Plane at Y = 0 (No hills, water, or elevation changes)
    const groundGeo = new THREE.PlaneGeometry(4000, 4000, 1, 1);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a24, // Clean natural meadow terrain green
      roughness: 0.92,
      metalness: 0.04,
    });
    this.groundPlane = new THREE.Mesh(groundGeo, groundMat);
    this.groundPlane.rotation.x = -Math.PI / 2;
    this.groundPlane.position.y = 0;
    this.groundPlane.receiveShadow = true;
    this.groundPlane.name = 'FlatGroundPlane';
    this.scene.add(this.groundPlane);

    // 4. Subtle distance grid markings (hidden now that realistic roads provide visual motion)
    this.gridHelper = new THREE.GridHelper(3000, 300, 0x38bdf8, 0x334155);
    this.gridHelper.position.y = 0.01;
    (this.gridHelper.material as THREE.Material).transparent = true;
    (this.gridHelper.material as THREE.Material).opacity = 0.0;
    this.gridHelper.visible = false;

    // 5. Flat Road Network (Asphalt ribbons, junction pads, markings, curbs, and sidewalks)
    this.terrain = new Terrain();
    this.roads = new Roads(() => 0);
    this.scene.add(this.roads.group);

    // Clean stubs for external references to maintain full type compatibility
    // (None of their visual meshes or collision obstacles are added to the scene)
    this.buildings = new Buildings();
    this.buildings.colliders = []; // Zero building colliders
    this.props = new Props(this.buildings);
    this.landmarks = new Landmarks(new THREE.Scene(), this.buildings);
  }

  private setupLighting(): void {
    // Soft natural daylight ambient fill
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    this.scene.add(ambientLight);

    // Sky and ground color bounce
    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x94a3b8, 1.0);
    hemiLight.position.set(0, 150, 0);
    this.scene.add(hemiLight);

    // Golden Sun Directional Light with Soft Shadows
    this.sunLight = new THREE.DirectionalLight(0xfff8ea, 2.0);
    this.sunLight.position.set(120, 220, 90);
    this.sunLight.castShadow = true;

    // Crisp shadow map
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 650;

    const d = 200;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0004;
    this.sunLight.shadow.normalBias = 0.03;

    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);
  }

  public getGroundHeight(_x: number, _z: number): number {
    // 100% Flat Ground Elevation everywhere
    return 0;
  }

  public resolveCollision(
    pos: THREE.Vector3,
    radius: number
  ): { collided: boolean; normal: THREE.Vector3 } {
    let collided = false;
    const normal = new THREE.Vector3();

    // World perimeter bounds check
    if (pos.x < this.bounds.minX + radius) {
      pos.x = this.bounds.minX + radius;
      normal.x = 1;
      collided = true;
    } else if (pos.x > this.bounds.maxX - radius) {
      pos.x = this.bounds.maxX - radius;
      normal.x = -1;
      collided = true;
    }

    if (pos.z < this.bounds.minZ + radius) {
      pos.z = this.bounds.minZ + radius;
      normal.z = 1;
      collided = true;
    } else if (pos.z > this.bounds.maxZ - radius) {
      pos.z = this.bounds.maxZ - radius;
      normal.z = -1;
      collided = true;
    }

    // Vehicle Collisions (Solid obstacles)
    if (this.vehicleManager) {
      const vCol = this.vehicleManager.resolveCollision(pos, radius);
      if (vCol.collided) {
        collided = true;
        normal.copy(vCol.normal);
      }
    }

    return { collided, normal };
  }

  public raycastObstacle(
    _origin: THREE.Vector3,
    _direction: THREE.Vector3,
    maxDist: number
  ): { hit: boolean; distance: number; point: THREE.Vector3; colliderId?: string } {
    // Flat open world - no obstacles blocking bullets or camera
    return {
      hit: false,
      distance: maxDist,
      point: new THREE.Vector3(),
    };
  }

  public update(_deltaTime: number, playerPos?: THREE.Vector3): void {
    if (!playerPos) return;

    // Center directional sun shadow frustum on player position
    this.sunLight.position.set(playerPos.x + 120, playerPos.y + 220, playerPos.z + 90);
    this.sunLight.target.position.copy(playerPos);
    this.sunLight.target.updateMatrixWorld();
  }
}
