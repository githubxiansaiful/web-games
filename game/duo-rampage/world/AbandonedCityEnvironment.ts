/**
 * DUO RAMPAGE - Abandoned City Environment
 * Modern 3D cartoon side-scrolling urban battleground:
 * - Wide multi-lane asphalt highway with yellow & white road markings
 * - Sidewalks, curbs, and backdrop buildings with lit windows
 * - Stylized neon billboards ("DUO RAMPAGE", "CYBER BAR", "ARCADE", "OVERDRIVE")
 * - Streetlights casting volumetric glow pools
 * - Burning cartoon car with animated flame & smoke particles
 * - Destructible wooden crates and explosive red barrels
 */

import * as THREE from 'three';
import { DestructibleProp } from '../types';

export class AbandonedCityEnvironment {
  public group: THREE.Group;
  public destructibles: DestructibleProp[] = [];
  public propMeshes: Map<string, THREE.Object3D> = new Map();
  private fireParticles: THREE.Points | null = null;
  private fireGeo: THREE.BufferGeometry | null = null;
  private firePositions: Float32Array | null = null;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'abandoned_city_environment';

    this.buildRoadAndSidewalks();
    this.buildCityBackdrop();
    this.buildStreetlights();
    this.buildBurningCar();
    this.spawnDestructibleProps();
  }

  private buildRoadAndSidewalks() {
    // 1. Asphalt Road Plane (Span: X: -60 to +60, Z: -5 to +5)
    const roadGeo = new THREE.PlaneGeometry(120, 14);
    roadGeo.rotateX(-Math.PI / 2);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x18181b, // Dark charcoal asphalt
      roughness: 0.8,
      metalness: 0.1,
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    this.group.add(roadMesh);

    // 2. Dashed Yellow Highway Center Lines
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    for (let x = -55; x <= 55; x += 5) {
      const lineGeo = new THREE.PlaneGeometry(2.5, 0.25);
      lineGeo.rotateX(-Math.PI / 2);
      const lineMesh = new THREE.Mesh(lineGeo, lineMat);
      lineMesh.position.set(x, 0.01, 0);
      this.group.add(lineMesh);
    }

    // 3. White Boundary Lines
    const whiteLineMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
    const lineNorthGeo = new THREE.PlaneGeometry(120, 0.2);
    lineNorthGeo.rotateX(-Math.PI / 2);
    const lineNorth = new THREE.Mesh(lineNorthGeo, whiteLineMat);
    lineNorth.position.set(0, 0.01, -4.5);
    this.group.add(lineNorth);

    const lineSouth = new THREE.Mesh(lineNorthGeo, whiteLineMat);
    lineSouth.position.set(0, 0.01, 4.5);
    this.group.add(lineSouth);

    // 4. Concrete Sidewalks & Curbs
    const sidewalkMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Slate concrete
      roughness: 0.7,
    });
    const northSidewalkGeo = new THREE.BoxGeometry(120, 0.3, 6);
    const northSidewalk = new THREE.Mesh(northSidewalkGeo, sidewalkMat);
    northSidewalk.position.set(0, 0.15, -7.5);
    northSidewalk.receiveShadow = true;
    this.group.add(northSidewalk);

    const southSidewalk = new THREE.Mesh(northSidewalkGeo, sidewalkMat);
    southSidewalk.position.set(0, 0.15, 7.5);
    southSidewalk.receiveShadow = true;
    this.group.add(southSidewalk);

    // 5. Reflective Dark Wet Puddles (Glossy asphalt reflections)
    const puddleMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.12,
      metalness: 0.8,
    });
    const puddleLocations = [-38, -20, -6, 10, 24, 40];
    puddleLocations.forEach((px, idx) => {
      const pGeo = new THREE.CircleGeometry(1.6 + (idx % 3) * 0.4, 16);
      pGeo.rotateX(-Math.PI / 2);
      const pMesh = new THREE.Mesh(pGeo, puddleMat);
      pMesh.position.set(px, 0.015, idx % 2 === 0 ? 1.8 : -1.8);
      pMesh.receiveShadow = true;
      this.group.add(pMesh);
    });
  }

  private buildCityBackdrop() {
    // Backdrop Buildings Group (Z: -12 to -30)
    const buildingMatDark = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Deep slate navy
      roughness: 0.5,
    });
    const buildingMatAccent = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b, // Deep indigo
      roughness: 0.4,
    });
    const windowMatLit = new THREE.MeshBasicMaterial({
      color: 0x38bdf8, // Cyan lit window
    });
    const windowMatAmber = new THREE.MeshBasicMaterial({
      color: 0xfbbf24, // Warm gold window
    });

    // Neon signs definitions
    const neonConfigs = [
      { text: 'RAMPAGE', color: 0xff0055, x: -30, y: 16, z: -14 },
      { text: 'CYBER BAR', color: 0x00f0ff, x: -10, y: 14, z: -15 },
      { text: 'MOTEL 99', color: 0xffb703, x: 12, y: 18, z: -16 },
      { text: 'OVERDRIVE', color: 0x7209b7, x: 32, y: 15, z: -14 },
    ];

    // Generate cartoon skyline blocks
    for (let i = -6; i <= 6; i++) {
      const bWidth = 8 + (Math.abs(i) % 3) * 2;
      const bHeight = 18 + (Math.abs(i * 7) % 16);
      const bDepth = 10;
      const bX = i * 11;
      const bZ = -18 - (Math.abs(i * 3) % 8);

      const bGeo = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
      const bMesh = new THREE.Mesh(bGeo, i % 2 === 0 ? buildingMatDark : buildingMatAccent);
      bMesh.position.set(bX, bHeight / 2, bZ);
      this.group.add(bMesh);

      // Add a few bright cartoon window grids on front facade
      for (let wy = 3; wy < bHeight - 3; wy += 3.5) {
        for (let wx = -bWidth / 2 + 1.8; wx < bWidth / 2 - 1.8; wx += 2.2) {
          if (Math.random() > 0.45) {
            const wGeo = new THREE.PlaneGeometry(1.2, 1.6);
            const wMesh = new THREE.Mesh(wGeo, Math.random() > 0.5 ? windowMatLit : windowMatAmber);
            wMesh.position.set(bX + wx, wy, bZ + bDepth / 2 + 0.05);
            this.group.add(wMesh);
          }
        }
      }
    }

    // Add bright 3D Neon Billboards
    neonConfigs.forEach((cfg) => {
      const signGroup = new THREE.Group();
      signGroup.position.set(cfg.x, cfg.y, cfg.z);

      const frameGeo = new THREE.BoxGeometry(9, 3.2, 0.4);
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.8 });
      const frame = new THREE.Mesh(frameGeo, frameMat);
      signGroup.add(frame);

      // Glowing Neon border
      const glowGeo = new THREE.BoxGeometry(8.6, 2.8, 0.2);
      const glowMat = new THREE.MeshBasicMaterial({ color: cfg.color });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.z = 0.25;
      signGroup.add(glow);

      // Ambient Point Light from Neon
      const neonLight = new THREE.PointLight(cfg.color, 1.8, 22);
      neonLight.position.set(0, 0, 1.5);
      signGroup.add(neonLight);

      this.group.add(signGroup);
    });
  }

  private buildStreetlights() {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    const xPositions = [-40, -20, 0, 20, 40];
    xPositions.forEach((x) => {
      const lightPole = new THREE.Group();
      lightPole.position.set(x, 0, -5.2);

      // Pole
      const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 7.5, 8);
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 3.75;
      lightPole.add(pole);

      // Overhang Arm
      const armGeo = new THREE.BoxGeometry(0.12, 0.12, 1.8);
      const arm = new THREE.Mesh(armGeo, poleMat);
      arm.position.set(0, 7.2, 0.9);
      lightPole.add(arm);

      // Lamp Head
      const lampGeo = new THREE.ConeGeometry(0.45, 0.4, 8);
      lampGeo.rotateX(Math.PI);
      const lamp = new THREE.Mesh(lampGeo, lampMat);
      lamp.position.set(0, 7.0, 1.7);
      lightPole.add(lamp);

      // Ground Pool SpotLight
      const spotLight = new THREE.SpotLight(0xfef08a, 2.2, 18, Math.PI / 4, 0.4, 1.5);
      spotLight.position.set(0, 7.0, 1.7);
      spotLight.target.position.set(0, 0, 1.7);
      lightPole.add(spotLight);
      lightPole.add(spotLight.target);

      this.group.add(lightPole);
    });
  }

  private buildBurningCar() {
    // Stylized abandoned police cruiser on fire at X: -16, Z: 2.2
    const carGroup = new THREE.Group();
    carGroup.position.set(-16, 0.6, 2.2);
    carGroup.rotation.y = -0.3;

    const carBodyGeo = new THREE.BoxGeometry(4.2, 1.1, 2.1);
    const carBodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Scorched steel
      roughness: 0.7,
    });
    const carBody = new THREE.Mesh(carBodyGeo, carBodyMat);
    carBody.castShadow = true;
    carGroup.add(carBody);

    const cabinGeo = new THREE.BoxGeometry(2.4, 0.85, 1.8);
    const cabin = new THREE.Mesh(cabinGeo, carBodyMat);
    cabin.position.set(-0.2, 0.95, 0);
    carGroup.add(cabin);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.35, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x09090b });

    const w1 = new THREE.Mesh(wheelGeo, wheelMat);
    w1.position.set(-1.3, -0.2, 1.1);
    carGroup.add(w1);
    const w2 = new THREE.Mesh(wheelGeo, wheelMat);
    w2.position.set(1.3, -0.2, 1.1);
    carGroup.add(w2);
    const w3 = new THREE.Mesh(wheelGeo, wheelMat);
    w3.position.set(-1.3, -0.2, -1.1);
    carGroup.add(w3);
    const w4 = new THREE.Mesh(wheelGeo, wheelMat);
    w4.position.set(1.3, -0.2, -1.1);
    carGroup.add(w4);

    // Fire Light
    const fireLight = new THREE.PointLight(0xf97316, 3.5, 14);
    fireLight.position.set(0.6, 1.2, 0);
    carGroup.add(fireLight);

    this.group.add(carGroup);

    // Register car as high-health explosive destructible
    const carProp: DestructibleProp = {
      id: 'destructible_car_police',
      type: 'barrel',
      x: -16,
      y: 0.6,
      z: 2.2,
      health: 140,
      maxHealth: 140,
      isDestroyed: false,
      isExplosive: true,
      explosionRadius: 9.0,
      explosionDamage: 180,
    };
    this.destructibles.push(carProp);
    this.propMeshes.set('destructible_car_police', carGroup);

    // Setup Animated Fire & Smoke Particles
    const particleCount = 45;
    this.fireGeo = new THREE.BufferGeometry();
    this.firePositions = new Float32Array(particleCount * 3);
    for (let p = 0; p < particleCount; p++) {
      this.firePositions[p * 3] = -15.4 + (Math.random() - 0.5) * 1.5;
      this.firePositions[p * 3 + 1] = 1.2 + Math.random() * 2.5;
      this.firePositions[p * 3 + 2] = 2.2 + (Math.random() - 0.5) * 1.2;
    }
    this.fireGeo.setAttribute('position', new THREE.BufferAttribute(this.firePositions, 3));

    const fireMat = new THREE.PointsMaterial({
      color: 0xff5500,
      size: 0.45,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    this.fireParticles = new THREE.Points(this.fireGeo, fireMat);
    this.group.add(this.fireParticles);
  }

  private spawnDestructibleProps() {
    // Spawns wooden crates and red explosive barrels across the street
    const propLocations = [
      { type: 'crate' as const, x: -28, z: -2.5 },
      { type: 'barrel' as const, x: -26, z: 1.8 },
      { type: 'crate' as const, x: -10, z: -3.0 },
      { type: 'crate' as const, x: -9, z: -3.0 },
      { type: 'barrel' as const, x: 4, z: 2.5 },
      { type: 'crate' as const, x: 16, z: -1.5 },
      { type: 'barrel' as const, x: 25, z: -2.0 },
      { type: 'crate' as const, x: 34, z: 2.2 },
    ];

    const crateMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Cartoon warm wood
      roughness: 0.6,
    });
    const barrelMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626, // Bright explosive red
      roughness: 0.35,
      metalness: 0.3,
    });
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 }); // Yellow hazard band

    propLocations.forEach((loc, idx) => {
      const id = `prop_${idx}_${loc.type}`;
      const isBarrel = loc.type === 'barrel';

      const propData: DestructibleProp = {
        id,
        type: loc.type,
        x: loc.x,
        y: 0,
        z: loc.z,
        health: isBarrel ? 35 : 50,
        maxHealth: isBarrel ? 35 : 50,
        isDestroyed: false,
        isExplosive: isBarrel,
        explosionRadius: isBarrel ? 5.5 : 0,
        explosionDamage: isBarrel ? 110 : 0,
      };
      this.destructibles.push(propData);

      const propGroup = new THREE.Group();
      propGroup.position.set(loc.x, 0, loc.z);

      if (isBarrel) {
        // Red Explosive Barrel
        const bGeo = new THREE.CylinderGeometry(0.45, 0.45, 1.2, 10);
        const bMesh = new THREE.Mesh(bGeo, barrelMat);
        bMesh.position.y = 0.6;
        bMesh.castShadow = true;
        propGroup.add(bMesh);

        // Yellow Hazard Stripe
        const sGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.25, 10);
        const sMesh = new THREE.Mesh(sGeo, stripeMat);
        sMesh.position.y = 0.6;
        propGroup.add(sMesh);
      } else {
        // Wooden Crate
        const cGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
        const cMesh = new THREE.Mesh(cGeo, crateMat);
        cMesh.position.y = 0.45;
        cMesh.castShadow = true;
        propGroup.add(cMesh);
      }

      this.group.add(propGroup);
      this.propMeshes.set(id, propGroup);
    });
  }

  public update(delta: number, time: number) {
    // Animate Fire and Smoke particles
    if (this.firePositions && this.fireGeo) {
      const count = this.firePositions.length / 3;
      for (let p = 0; p < count; p++) {
        this.firePositions[p * 3 + 1] += delta * (1.5 + (p % 3) * 0.8);
        this.firePositions[p * 3] += Math.sin(time * 5 + p) * delta * 0.4;
        if (this.firePositions[p * 3 + 1] > 3.8) {
          this.firePositions[p * 3 + 1] = 1.2;
          this.firePositions[p * 3] = -15.4 + (Math.random() - 0.5) * 1.5;
        }
      }
      this.fireGeo.attributes.position.needsUpdate = true;
    }
  }

  public damageProp(id: string, damage: number): { destroyed: boolean; prop?: DestructibleProp } {
    const prop = this.destructibles.find((p) => p.id === id);
    if (!prop || prop.isDestroyed) return { destroyed: false };

    prop.health -= damage;
    const mesh = this.propMeshes.get(id);
    if (mesh) {
      // Jolt mesh on impact
      mesh.scale.set(1.15, 0.85, 1.15);
      setTimeout(() => {
        if (!prop.isDestroyed && mesh) mesh.scale.set(1, 1, 1);
      }, 100);
    }

    if (prop.health <= 0) {
      prop.isDestroyed = true;
      if (mesh) {
        this.group.remove(mesh);
      }
      return { destroyed: true, prop };
    }

    return { destroyed: false, prop };
  }
}
