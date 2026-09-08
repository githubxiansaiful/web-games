import * as THREE from 'three';
import { CITY_DATA } from '../data/cityData';
import { Roads } from './Roads';
import { Buildings } from './Buildings';
import { Props } from './Props';

export class World {
  public scene: THREE.Scene;
  public roads: Roads;
  public buildings: Buildings;
  public props: Props;
  public groundMesh: THREE.Mesh;
  public bounds: { minX: number; maxX: number; minZ: number; maxZ: number };

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.bounds = { minX: -200, maxX: 200, minZ: -200, maxZ: 200 };

    // 1. Atmosphere and Fog (Moody Cyberpunk Twilight City)
    this.scene.background = new THREE.Color(0x0a0f1d);
    this.scene.fog = new THREE.FogExp2(0x0a0f1d, 0.007);

    // 2. Lighting
    this.setupLighting();

    // 3. Ground Plane
    this.groundMesh = this.createGround();
    this.scene.add(this.groundMesh);

    // 4. Roads
    this.roads = new Roads(CITY_DATA.roads);
    this.scene.add(this.roads.group);

    // 5. Buildings
    this.buildings = new Buildings(CITY_DATA.buildings);
    this.scene.add(this.buildings.group);

    // 6. Props
    this.props = new Props(CITY_DATA.props);
    this.scene.add(this.props.group);
  }

  private setupLighting(): void {
    // Ambient moon / city light
    const ambientLight = new THREE.AmbientLight(0x2d3748, 1.2);
    this.scene.add(ambientLight);

    // Hemisphere sky bounce
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.7);
    this.scene.add(hemiLight);

    // Main moonlight / street directional light
    const dirLight = new THREE.DirectionalLight(0x93c5fd, 1.8);
    dirLight.position.set(80, 120, 60);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 300;
    dirLight.shadow.camera.left = -160;
    dirLight.shadow.camera.right = 160;
    dirLight.shadow.camera.top = 160;
    dirLight.shadow.camera.bottom = -160;
    dirLight.shadow.bias = -0.0005;
    this.scene.add(dirLight);
  }

  private createGround(): THREE.Mesh {
    const groundGeo = new THREE.PlaneGeometry(420, 420, 32, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    ground.name = 'Ground';
    return ground;
  }

  public getGroundHeight(_x: number, _z: number): number {
    return 0; // Flat city grid elevation
  }

  public resolveCollision(
    pos: THREE.Vector3,
    radius: number
  ): { collided: boolean; normal: THREE.Vector3 } {
    // 1. Check city boundary clamp
    let collided = false;
    const normal = new THREE.Vector3();

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

    // 2. Check building colliders
    const buildingRes = this.buildings.resolveCircleCollision(pos, radius);
    if (buildingRes.collided) {
      collided = true;
      normal.copy(buildingRes.normal);
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
      const hit = ray.intersectBox(c.box, intersectionPoint);
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

  public update(_deltaTime: number): void {
    // Dynamic lights or effects can be updated here
  }
}
