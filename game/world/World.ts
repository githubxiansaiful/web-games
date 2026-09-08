import * as THREE from 'three';
import { Roads } from './Roads';
import { Buildings } from './Buildings';
import { Props } from './Props';
import { Terrain } from './Terrain';
import { svgToWorld } from '../data/islandMapData';

export class World {
  public scene: THREE.Scene;
  public terrain: Terrain;
  public roads: Roads;
  public buildings: Buildings;
  public props: Props;
  public oceanMesh: THREE.Mesh;
  public lakeMesh: THREE.Mesh;
  public sunLight!: THREE.DirectionalLight;
  public bounds: { minX: number; maxX: number; minZ: number; maxZ: number };

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    // Generous open world perimeter allowing exploration of all districts, mountains, and beaches
    this.bounds = { minX: -2000, maxX: 2000, minZ: -2000, maxZ: 2000 };

    // 1. Atmospheric Fog & Sky Horizon
    const skyColor = new THREE.Color(0x60a5fa);    // Bright Clear Sky Blue
    const horizonColor = new THREE.Color(0xcce2f8); // Soft Atmospheric Horizon
    this.scene.background = skyColor;
    this.scene.fog = new THREE.FogExp2(0xcce2f8, 0.0012);

    // 2. Daytime Sunlight & PBR Atmospheric Lighting
    this.setupLighting();

    // 3. Ocean Water Plane (Covering vast territory)
    this.oceanMesh = this.createOcean();
    this.scene.add(this.oceanMesh);

    // 4. Procedural 3D Terrain System (Multi-surface: Grass, Dirt, Rock, Sand)
    this.terrain = new Terrain();
    this.scene.add(this.terrain.group);

    // 5. Inland Lake (Lakeview)
    this.lakeMesh = this.createInlandLake();
    this.scene.add(this.lakeMesh);

    // 6. SVG Roads & Arched Bridges (anchored to terrain elevation with sidewalks & curbs)
    this.roads = new Roads(this.terrain.getHeightAt);
    this.scene.add(this.roads.group);

    // 7. Buildings across all 20 Districts (with road clearance & architecture)
    this.buildings = new Buildings(this.roads, this.terrain.getHeightAt);
    this.scene.add(this.buildings.group);

    // 8. Props (Trees, Streetlights, Dumpsters, Barriers) strictly off roads
    this.props = new Props(this.buildings, this.roads, this.terrain.getHeightAt);
    this.scene.add(this.props.group);
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

    // Crisp high-resolution shadow map
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 650;

    // Shadow frustum covering 400m active player radius
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

  private createOcean(): THREE.Mesh {
    const oceanGeo = new THREE.PlaneGeometry(8000, 8000, 16, 16);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0c3852, // Coastal navy turquoise ocean
      roughness: 0.12,
      metalness: 0.75,
    });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -0.2; // Ocean water level
    ocean.receiveShadow = true;
    ocean.name = 'Ocean';
    return ocean;
  }

  private createInlandLake(): THREE.Mesh {
    // Lakeview recreation lake at SVG (535, 325) -> World (-215, -115)
    const lakePos = svgToWorld(535, 325);
    const lakeGeo = new THREE.CircleGeometry(65, 32);
    const lakeMat = new THREE.MeshStandardMaterial({
      color: 0x1a4a5e,
      roughness: 0.15,
      metalness: 0.65,
    });
    const lake = new THREE.Mesh(lakeGeo, lakeMat);
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(lakePos.x, 0.02, lakePos.z);
    lake.receiveShadow = true;
    lake.name = 'LakeviewLake';
    return lake;
  }

  public getGroundHeight(x: number, z: number): number {
    const bridgeElev = this.roads.getBridgeElevation(x, z);
    if (bridgeElev > 0.05) {
      return bridgeElev;
    }
    return this.terrain.getHeightAt(x, z);
  }

  public resolveCollision(
    pos: THREE.Vector3,
    radius: number
  ): { collided: boolean; normal: THREE.Vector3 } {
    let collided = false;
    const normal = new THREE.Vector3();

    // 1. Check world perimeter bounds
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

    // 2. Physical Obstacle Colliders (Buildings, Trees, Streetlights, Dumpsters, Barriers)
    const obstRes = this.buildings.resolveCircleCollision(pos, radius);
    if (obstRes.collided) {
      collided = true;
      normal.copy(obstRes.normal);
    }

    return { collided, normal };
  }

  public raycastObstacle(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    maxDist: number
  ): { hit: boolean; distance: number; point: THREE.Vector3; colliderId?: string } {
    const ray = new THREE.Ray(origin, direction.clone().normalize());
    let closestDist = maxDist;
    let hitPoint: THREE.Vector3 = new THREE.Vector3();
    let hitFound = false;
    let hitColliderId: string | undefined;

    const intersectionPoint = new THREE.Vector3();

    for (const c of this.buildings.colliders) {
      const box = new THREE.Box3(
        new THREE.Vector3(c.minX, 0, c.minZ),
        new THREE.Vector3(c.maxX, c.height || 40, c.maxZ)
      );

      const hit = ray.intersectBox(box, intersectionPoint);
      if (hit) {
        const dist = origin.distanceTo(intersectionPoint);
        if (dist < closestDist) {
          closestDist = dist;
          hitPoint.copy(intersectionPoint);
          hitFound = true;
          hitColliderId = c.id;
        }
      }
    }

    return {
      hit: hitFound,
      distance: closestDist,
      point: hitPoint,
      colliderId: hitColliderId,
    };
  }

  /**
   * Per-frame update for dynamic terrain chunk streaming and player-focused shadow frustum.
   */
  public update(_deltaTime: number, playerPos?: THREE.Vector3): void {
    if (!playerPos) return;

    // 1. Update procedural terrain chunk streaming and LOD around player
    this.terrain.update(playerPos);

    // 2. Center directional sun shadow frustum on player position
    this.sunLight.position.set(playerPos.x + 120, playerPos.y + 220, playerPos.z + 90);
    this.sunLight.target.position.copy(playerPos);
    this.sunLight.target.updateMatrixWorld();
  }
}
