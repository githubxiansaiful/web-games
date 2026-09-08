import * as THREE from 'three';
import { Roads } from './Roads';
import { Buildings } from './Buildings';
import { Props } from './Props';
import { svgToWorld } from '../data/islandMapData';

export class World {
  public scene: THREE.Scene;
  public roads: Roads;
  public buildings: Buildings;
  public props: Props;
  public groundMesh: THREE.Mesh;
  public oceanMesh: THREE.Mesh;
  public lakeMesh: THREE.Mesh;
  public bounds: { minX: number; maxX: number; minZ: number; maxZ: number };

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.bounds = { minX: -650, maxX: 650, minZ: -500, maxZ: 500 };

    // 1. Atmosphere and Fog (Clear Daytime Sky)
    const skyColor = new THREE.Color(0x60a5fa); // Bright Clear Sky Blue
    const horizonColor = new THREE.Color(0xbae6fd); // Soft Horizon Blue
    this.scene.background = skyColor;
    this.scene.fog = new THREE.FogExp2(0xbae6fd, 0.0018);

    // 2. Daytime Sunlight & Atmospheric Lighting
    this.setupLighting();

    // 3. Ocean Water Plane
    this.oceanMesh = this.createOcean();
    this.scene.add(this.oceanMesh);

    // 4. Mainland Island Terrain
    this.groundMesh = this.createMainlandTerrain();
    this.scene.add(this.groundMesh);

    // 5. Inland Lake (Lakeview)
    this.lakeMesh = this.createInlandLake();
    this.scene.add(this.lakeMesh);

    // 6. SVG Roads & Arched Bridges
    this.roads = new Roads();
    this.scene.add(this.roads.group);

    // 7. Buildings across all 20 Districts
    this.buildings = new Buildings();
    this.scene.add(this.buildings.group);

    // 8. Props (Trees, Streetlights, Dumpsters, Barriers) with solid colliders
    this.props = new Props(this.buildings);
    this.scene.add(this.props.group);
  }

  private setupLighting(): void {
    // Soft natural daylight ambient fill
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.15);
    this.scene.add(ambientLight);

    // Sky and ground color bounce
    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x94a3b8, 1.2);
    hemiLight.position.set(0, 100, 0);
    this.scene.add(hemiLight);

    // Bright Golden Sun Directional Light (Clean daytime illumination without shadows)
    const sunLight = new THREE.DirectionalLight(0xfffaed, 2.1);
    sunLight.position.set(120, 200, 90);
    sunLight.castShadow = false;
    this.scene.add(sunLight);
  }

  private createOcean(): THREE.Mesh {
    const oceanGeo = new THREE.PlaneGeometry(2400, 2000, 16, 16);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0c344e, // Deep coastal turquoise/navy ocean
      roughness: 0.15,
      metalness: 0.8,
    });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -0.6; // Slightly below ground level
    ocean.name = 'Ocean';
    return ocean;
  }

  private createMainlandTerrain(): THREE.Mesh {
    // Island terrain plane covering entire SVG territory
    const groundGeo = new THREE.PlaneGeometry(1300, 950, 32, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x5e8248, // Lush green landscape matching map landGrad
      roughness: 0.9,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.name = 'MainlandGround';
    return ground;
  }

  private createInlandLake(): THREE.Mesh {
    // Lakeview recreation lake at SVG (535, 325) -> World (-215, -115)
    const lakePos = svgToWorld(535, 325);
    const lakeGeo = new THREE.CircleGeometry(65, 32);
    const lakeMat = new THREE.MeshStandardMaterial({
      color: 0x1c4f66,
      roughness: 0.2,
      metalness: 0.7,
    });
    const lake = new THREE.Mesh(lakeGeo, lakeMat);
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(lakePos.x, 0.01, lakePos.z);
    lake.name = 'LakeviewLake';
    return lake;
  }

  public getGroundHeight(x: number, z: number): number {
    const bridgeElev = this.roads.getBridgeElevation(x, z);
    if (bridgeElev > 0.05) {
      return bridgeElev;
    }
    return 0; // Base terrain elevation
  }

  public resolveCollision(
    pos: THREE.Vector3,
    radius: number
  ): { collided: boolean; normal: THREE.Vector3 } {
    let collided = false;
    const normal = new THREE.Vector3();

    // 1. Check island perimeter bounds
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

  public update(_deltaTime: number): void {}
}
