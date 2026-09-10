/**
 * Zombie Haven - Procedural Stylized Low-Poly 3D Props
 * Generates modular buildings, abandoned vehicles, barricades, crates, and foliage
 */

import * as THREE from 'three';

export interface CollisionBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  height?: number;
}

export class VillageProps {
  // Shared materials for optimal batching & low draw calls
  private static matWood: THREE.MeshLambertMaterial;
  private static matDarkWood: THREE.MeshLambertMaterial;
  private static matHouseWall: THREE.MeshLambertMaterial;
  private static matHouseRoof: THREE.MeshLambertMaterial;
  private static matBarnWall: THREE.MeshLambertMaterial;
  private static matMetalRust: THREE.MeshLambertMaterial;
  private static matCarPaint: THREE.MeshLambertMaterial;
  private static matGlass: THREE.MeshLambertMaterial;
  private static matStone: THREE.MeshLambertMaterial;
  private static matLeaves: THREE.MeshLambertMaterial;
  private static matDeadWood: THREE.MeshLambertMaterial;

  public static initMaterials() {
    if (this.matWood) return;

    this.matWood = new THREE.MeshLambertMaterial({ color: 0xb45309 }); // warm golden timber plank
    this.matDarkWood = new THREE.MeshLambertMaterial({ color: 0x78350f });
    this.matHouseWall = new THREE.MeshLambertMaterial({ color: 0xc4b5a0 }); // light sunlit clapboard siding
    this.matHouseRoof = new THREE.MeshLambertMaterial({ color: 0x64748b }); // light slate shingles
    this.matBarnWall = new THREE.MeshLambertMaterial({ color: 0xdc2626 }); // vibrant country barn red
    this.matMetalRust = new THREE.MeshLambertMaterial({ color: 0x854d0e });
    this.matCarPaint = new THREE.MeshLambertMaterial({ color: 0x3b82f6 }); // sedan bright enamel blue
    this.matGlass = new THREE.MeshLambertMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.65 });
    this.matStone = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
    this.matLeaves = new THREE.MeshLambertMaterial({ color: 0x22c55e }); // vibrant lush pine & oak green
    this.matDeadWood = new THREE.MeshLambertMaterial({ color: 0x71717a });
  }

  /**
   * Builds an enterable house with doorway, windows, and interior floor
   */
  public static createHouse(width = 12, depth = 10, height = 5): { group: THREE.Group; colliders: CollisionBox[] } {
    this.initMaterials();
    const group = new THREE.Group();
    const colliders: CollisionBox[] = [];

    // Interior floor (flush with terrain)
    const floorGeo = new THREE.BoxGeometry(width, 0.02, depth);
    const floor = new THREE.Mesh(floorGeo, this.matWood);
    floor.position.y = 0.01;
    floor.receiveShadow = false;
    group.add(floor);

    // Wall thickness
    const t = 0.4;
    const wallH = height;

    // Back Wall (Solid)
    const backGeo = new THREE.BoxGeometry(width, wallH, t);
    const backWall = new THREE.Mesh(backGeo, this.matHouseWall);
    backWall.position.set(0, wallH / 2, -depth / 2 + t / 2);
    backWall.castShadow = false;
    backWall.receiveShadow = false;
    group.add(backWall);

    // Left Wall
    const sideGeo = new THREE.BoxGeometry(t, wallH, depth);
    const leftWall = new THREE.Mesh(sideGeo, this.matHouseWall);
    leftWall.position.set(-width / 2 + t / 2, wallH / 2, 0);
    leftWall.castShadow = false;
    group.add(leftWall);

    // Right Wall
    const rightWall = new THREE.Mesh(sideGeo, this.matHouseWall);
    rightWall.position.set(width / 2 - t / 2, wallH / 2, 0);
    rightWall.castShadow = false;
    group.add(rightWall);

    // Front Wall with Doorway (two wall pieces leaving 2.2m door in center)
    const doorW = 2.4;
    const frontPartW = (width - doorW) / 2;
    const frontPartGeo = new THREE.BoxGeometry(frontPartW, wallH, t);

    const frontL = new THREE.Mesh(frontPartGeo, this.matHouseWall);
    frontL.position.set(-width / 2 + frontPartW / 2, wallH / 2, depth / 2 - t / 2);
    frontL.castShadow = false;
    group.add(frontL);

    const frontR = new THREE.Mesh(frontPartGeo, this.matHouseWall);
    frontR.position.set(width / 2 - frontPartW / 2, wallH / 2, depth / 2 - t / 2);
    frontR.castShadow = false;
    group.add(frontR);

    // Doorway Lintel beam
    const lintelH = 1.4;
    const lintelGeo = new THREE.BoxGeometry(doorW, lintelH, t);
    const lintel = new THREE.Mesh(lintelGeo, this.matHouseWall);
    lintel.position.set(0, wallH - lintelH / 2, depth / 2 - t / 2);
    group.add(lintel);

    // Pitched Roof
    const roofH = 3;
    const roofGeo = new THREE.ConeGeometry(Math.max(width, depth) * 0.75, roofH, 4);
    const roof = new THREE.Mesh(roofGeo, this.matHouseRoof);
    roof.position.set(0, wallH + roofH / 2, 0);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = false;
    group.add(roof);

    return { group, colliders };
  }

  /**
   * Builds a large Red Barn (defensive fortress)
   */
  public static createBarn(width = 16, depth = 22, height = 7): { group: THREE.Group } {
    this.initMaterials();
    const group = new THREE.Group();

    // Barn body
    const bodyGeo = new THREE.BoxGeometry(width, height, depth);
    const body = new THREE.Mesh(bodyGeo, this.matBarnWall);
    body.position.y = height / 2;
    body.castShadow = false;
    body.receiveShadow = false;
    group.add(body);

    // Gambrel roof
    const roofH = 4;
    const roofGeo = new THREE.CylinderGeometry(0.5, width * 0.65, depth + 1, 4, 1, false, 0, Math.PI);
    const roof = new THREE.Mesh(roofGeo, this.matDarkWood);
    roof.position.set(0, height + roofH * 0.4, 0);
    roof.rotation.x = Math.PI / 2;
    roof.rotation.z = Math.PI / 4;
    roof.castShadow = false;
    group.add(roof);

    // Barn Door Arch (Open double doors)
    const doorFrameGeo = new THREE.BoxGeometry(4.5, 5, 0.4);
    const doorFrame = new THREE.Mesh(doorFrameGeo, this.matDarkWood);
    doorFrame.position.set(0, 2.5, depth / 2 + 0.1);
    group.add(doorFrame);

    return { group };
  }

  /**
   * Creates an abandoned rusty station sedan
   */
  public static createAbandonedCar(): THREE.Group {
    this.initMaterials();
    const group = new THREE.Group();

    // Body
    const bodyGeo = new THREE.BoxGeometry(2.1, 0.9, 4.4);
    const body = new THREE.Mesh(bodyGeo, this.matMetalRust);
    body.position.y = 0.8;
    body.castShadow = false;
    group.add(body);

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(1.8, 0.7, 2.2);
    const cabin = new THREE.Mesh(cabinGeo, this.matGlass);
    cabin.position.set(0, 1.45, -0.2);
    cabin.castShadow = false;
    group.add(cabin);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 10);
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x18181b });
    const wheelPos = [
      [-1.0, 0.4, 1.3],
      [1.0, 0.4, 1.3],
      [-1.0, 0.4, -1.3],
      [1.0, 0.4, -1.3],
    ];
    wheelPos.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, wy, wz);
      wheel.castShadow = false;
      group.add(wheel);
    });

    return group;
  }

  /**
   * Creates village stone water well with wooden roof
   */
  public static createWaterWell(): THREE.Group {
    this.initMaterials();
    const group = new THREE.Group();

    // Stone base cylinder
    const baseGeo = new THREE.CylinderGeometry(1.4, 1.5, 1.1, 12, 1, true);
    const base = new THREE.Mesh(baseGeo, this.matStone);
    base.position.y = 0.55;
    base.castShadow = false;
    group.add(base);

    // Water surface inside
    const waterGeo = new THREE.CircleGeometry(1.3, 12);
    const waterMat = new THREE.MeshBasicMaterial({ color: 0x0c4a6e });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.4;
    group.add(water);

    // Two wooden posts
    const postGeo = new THREE.BoxGeometry(0.18, 2.4, 0.18);
    const p1 = new THREE.Mesh(postGeo, this.matWood);
    p1.position.set(-1.2, 1.2, 0);
    const p2 = new THREE.Mesh(postGeo, this.matWood);
    p2.position.set(1.2, 1.2, 0);
    group.add(p1, p2);

    // Roof
    const roofGeo = new THREE.ConeGeometry(2.0, 1.2, 4);
    const roof = new THREE.Mesh(roofGeo, this.matDarkWood);
    roof.position.y = 2.8;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = false;
    group.add(roof);

    return group;
  }

  /**
   * Creates street lamp with real light source
   */
  public static createStreetLamp(): { group: THREE.Group; light: THREE.PointLight } {
    this.initMaterials();
    const group = new THREE.Group();

    // Post
    const postGeo = new THREE.CylinderGeometry(0.1, 0.14, 5.0, 8);
    const post = new THREE.Mesh(postGeo, this.matMetalRust);
    post.position.y = 2.5;
    post.castShadow = false;
    group.add(post);

    // Lantern arm
    const armGeo = new THREE.BoxGeometry(0.8, 0.1, 0.1);
    const arm = new THREE.Mesh(armGeo, this.matMetalRust);
    arm.position.set(0.35, 4.9, 0);
    group.add(arm);

    // Lantern Head
    const headGeo = new THREE.BoxGeometry(0.35, 0.5, 0.35);
    const headMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0.7, 4.7, 0);
    group.add(head);

    // Amber PointLight
    const light = new THREE.PointLight(0xfef08a, 1.8, 16, 1.8);
    light.position.set(0.7, 4.5, 0);
    light.castShadow = false; // keep perf optimal
    group.add(light);

    return { group, light };
  }

  /**
   * Creates a burning trash drum emitting flame light and embers
   */
  public static createBarrelFire(): { group: THREE.Group; light: THREE.PointLight } {
    this.initMaterials();
    const group = new THREE.Group();

    // Metal barrel
    const barrelGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 10);
    const barrel = new THREE.Mesh(barrelGeo, this.matMetalRust);
    barrel.position.y = 0.6;
    barrel.castShadow = false;
    group.add(barrel);

    // Fire core
    const fireGeo = new THREE.ConeGeometry(0.35, 0.7, 6);
    const fireMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    const fire = new THREE.Mesh(fireGeo, fireMat);
    fire.position.y = 1.35;
    group.add(fire);

    // Flickering orange point light
    const light = new THREE.PointLight(0xf97316, 2.5, 18, 1.6);
    light.position.set(0, 1.5, 0);
    group.add(light);

    return { group, light };
  }

  /**
   * Pine Tree
   */
  public static createPineTree(scale = 1.0): THREE.Group {
    this.initMaterials();
    const group = new THREE.Group();

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.25 * scale, 0.4 * scale, 3 * scale, 6);
    const trunk = new THREE.Mesh(trunkGeo, this.matDarkWood);
    trunk.position.y = 1.5 * scale;
    trunk.castShadow = false;
    group.add(trunk);

    // Foliage cones (3 stacked)
    const levels = [
      { r: 2.2 * scale, h: 3.0 * scale, y: 3.5 * scale },
      { r: 1.7 * scale, h: 2.6 * scale, y: 5.0 * scale },
      { r: 1.2 * scale, h: 2.2 * scale, y: 6.3 * scale },
    ];
    levels.forEach((lvl) => {
      const coneGeo = new THREE.ConeGeometry(lvl.r, lvl.h, 7);
      const cone = new THREE.Mesh(coneGeo, this.matLeaves);
      cone.position.y = lvl.y;
      cone.castShadow = false;
      group.add(cone);
    });

    return group;
  }

  /**
   * Spooky Gnarled Dead Tree
   */
  public static createDeadTree(scale = 1.0): THREE.Group {
    this.initMaterials();
    const group = new THREE.Group();

    const trunkGeo = new THREE.CylinderGeometry(0.2 * scale, 0.45 * scale, 5 * scale, 6);
    const trunk = new THREE.Mesh(trunkGeo, this.matDeadWood);
    trunk.position.y = 2.5 * scale;
    trunk.rotation.z = (Math.random() - 0.5) * 0.15;
    trunk.castShadow = false;
    group.add(trunk);

    // Branches
    for (let b = 0; b < 4; b++) {
      const bGeo = new THREE.CylinderGeometry(0.08 * scale, 0.15 * scale, 2.2 * scale, 5);
      const branch = new THREE.Mesh(bGeo, this.matDeadWood);
      branch.position.set(0, (3.2 + b * 0.6) * scale, 0);
      branch.rotation.z = (b % 2 === 0 ? 0.7 : -0.7) + (Math.random() - 0.5) * 0.2;
      branch.rotation.y = (b * Math.PI) / 2;
      branch.castShadow = false;
      group.add(branch);
    }

    return group;
  }

  /**
   * Wooden split rail fence segment
   */
  public static createFenceSegment(length = 4): THREE.Group {
    this.initMaterials();
    const group = new THREE.Group();

    const postGeo = new THREE.BoxGeometry(0.2, 1.3, 0.2);
    const p1 = new THREE.Mesh(postGeo, this.matWood);
    p1.position.set(-length / 2, 0.65, 0);
    p1.castShadow = false;

    const p2 = new THREE.Mesh(postGeo, this.matWood);
    p2.position.set(length / 2, 0.65, 0);
    p2.castShadow = false;
    group.add(p1, p2);

    const railGeo = new THREE.BoxGeometry(length, 0.12, 0.08);
    const r1 = new THREE.Mesh(railGeo, this.matWood);
    r1.position.set(0, 0.95, 0);
    const r2 = new THREE.Mesh(railGeo, this.matWood);
    r2.position.set(0, 0.45, 0);
    group.add(r1, r2);

    return group;
  }
}
