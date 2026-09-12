/**
 * DUO RAMPAGE - Particle & Visual Effects Engine
 * Generates cartoon explosions, bullet trails, muzzle flashes, dash dust,
 * hit sparks, and floating damage numbers.
 */

import * as THREE from 'three';
import { DamageNumber } from '../types';

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  baseScale: number;
  fadeOut: boolean;
}

export class DuoParticleSystem {
  public group: THREE.Group;
  private particles: Particle[] = [];
  public damageNumbers: DamageNumber[] = [];
  public screenShakeIntensity: number = 0;

  // Reusable geometries and materials
  private sparkGeo: THREE.SphereGeometry;
  private smokeGeo: THREE.DodecahedronGeometry;
  private ringGeo: THREE.RingGeometry;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'duo_particle_system';

    this.sparkGeo = new THREE.SphereGeometry(0.12, 5, 5);
    this.smokeGeo = new THREE.DodecahedronGeometry(0.35, 0);
    this.ringGeo = new THREE.RingGeometry(0.3, 0.6, 16);
    this.ringGeo.rotateX(-Math.PI / 2);
  }

  public triggerScreenShake(intensity: number) {
    this.screenShakeIntensity = Math.min(1.2, this.screenShakeIntensity + intensity);
  }

  public addDamageNumber(text: string, x: number, y: number, z: number, isCrit: boolean = false) {
    this.damageNumbers.push({
      id: 'dmg_' + Math.random().toString(36).substring(2, 9),
      text,
      x,
      y: y + 1.2,
      z,
      color: isCrit ? '#facc15' : '#ffffff',
      isCrit,
      age: 0,
      maxAge: 0.85,
    });
  }

  public spawnExplosion(x: number, y: number, z: number, scale: number = 1.0) {
    this.triggerScreenShake(0.6 * scale);

    // 1. Core Fire Burst Particles (Orange & Yellow)
    const fireColors = [0xffea00, 0xff5500, 0xff0055, 0xf97316];
    for (let i = 0; i < 22; i++) {
      const color = fireColors[Math.floor(Math.random() * fireColors.length)];
      const mat = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(this.sparkGeo, mat);
      mesh.position.set(x, y + 0.3, z);
      this.group.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = (4 + Math.random() * 8) * scale;
      const p: Particle = {
        mesh,
        vx: Math.cos(angle) * speed,
        vy: (2 + Math.random() * 6) * scale,
        vz: Math.sin(angle) * speed * 0.5,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.25,
        baseScale: (0.8 + Math.random() * 0.8) * scale,
        fadeOut: true,
      };
      this.particles.push(p);
    }

    // 2. Cartoon Expanding Smoke Puffs (Slate grey)
    for (let s = 0; s < 10; s++) {
      const smokeMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.9,
        transparent: true,
        opacity: 0.8,
      });
      const smokeMesh = new THREE.Mesh(this.smokeGeo, smokeMat);
      smokeMesh.position.set(x + (Math.random() - 0.5) * scale, y + 0.2, z + (Math.random() - 0.5) * scale);
      this.group.add(smokeMesh);

      const p: Particle = {
        mesh: smokeMesh,
        vx: (Math.random() - 0.5) * 2 * scale,
        vy: (1.5 + Math.random() * 3) * scale,
        vz: (Math.random() - 0.5) * 1.5 * scale,
        life: 0,
        maxLife: 0.8 + Math.random() * 0.4,
        baseScale: (1.0 + Math.random() * 1.2) * scale,
        fadeOut: true,
      };
      this.particles.push(p);
    }

    // 3. Ground Shockwave Ring
    const shockMat = new THREE.MeshBasicMaterial({
      color: 0xffedd5,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });
    const shockMesh = new THREE.Mesh(this.ringGeo, shockMat);
    shockMesh.position.set(x, 0.05, z);
    this.group.add(shockMesh);

    const shockParticle: Particle = {
      mesh: shockMesh,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
      maxLife: 0.35,
      baseScale: 1.0,
      fadeOut: true,
    };
    this.particles.push(shockParticle);
  }

  public spawnDashTrail(x: number, y: number, z: number, colorHex: number) {
    const mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.6 });
    const mesh = new THREE.Mesh(this.sparkGeo, mat);
    mesh.position.set(x, y + 0.6, z);
    this.group.add(mesh);

    this.particles.push({
      mesh,
      vx: 0,
      vy: 0.4,
      vz: 0,
      life: 0,
      maxLife: 0.25,
      baseScale: 1.5,
      fadeOut: true,
    });
  }

  public spawnHitSparks(x: number, y: number, z: number, colorHex: number = 0xfacc15) {
    for (let i = 0; i < 6; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: colorHex });
      const mesh = new THREE.Mesh(this.sparkGeo, mat);
      mesh.position.set(x, y, z);
      this.group.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 4;
      this.particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: (Math.random() - 0.2) * 4,
        vz: Math.sin(angle) * speed * 0.5,
        life: 0,
        maxLife: 0.2 + Math.random() * 0.15,
        baseScale: 0.6,
        fadeOut: true,
      });
    }
  }

  public spawnReviveAura(x: number, z: number) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(this.ringGeo, mat);
    mesh.position.set(x, 0.08, z);
    this.group.add(mesh);

    this.particles.push({
      mesh,
      vx: 0,
      vy: 0.8,
      vz: 0,
      life: 0,
      maxLife: 0.5,
      baseScale: 1.5,
      fadeOut: true,
    });
  }

  public update(delta: number) {
    // Screen shake decay
    if (this.screenShakeIntensity > 0) {
      this.screenShakeIntensity = Math.max(0, this.screenShakeIntensity - delta * 3.5);
    }

    // Update Floating Damage Numbers
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dmg = this.damageNumbers[i];
      dmg.age += delta;
      dmg.y += delta * 1.5; // Float upwards
      if (dmg.age >= dmg.maxAge) {
        this.damageNumbers.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;
      const progress = p.life / p.maxLife;

      if (progress >= 1.0) {
        this.group.remove(p.mesh);
        p.mesh.geometry.dispose();
        if (Array.isArray(p.mesh.material)) {
          p.mesh.material.forEach((m) => m.dispose());
        } else {
          p.mesh.material.dispose();
        }
        this.particles.splice(i, 1);
        continue;
      }

      // Physics integration
      p.mesh.position.x += p.vx * delta;
      p.mesh.position.y += p.vy * delta;
      p.mesh.position.z += p.vz * delta;

      // Gravity on sparks
      p.vy -= 9.8 * delta * 0.7;

      // Scale & opacity animation
      const currentScale = p.baseScale * (1.0 + progress * 1.2);
      p.mesh.scale.set(currentScale, currentScale, currentScale);

      if (p.fadeOut) {
        const mat = p.mesh.material as any;
        if (mat.opacity !== undefined) {
          mat.opacity = 1.0 - progress;
        }
      }
    }
  }

  public clear() {
    this.particles.forEach((p) => {
      this.group.remove(p.mesh);
    });
    this.particles = [];
    this.damageNumbers = [];
    this.screenShakeIntensity = 0;
  }
}
