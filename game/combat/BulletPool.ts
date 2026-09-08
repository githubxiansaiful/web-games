import * as THREE from 'three';
import { ObjectPool } from '../core/ObjectPool';

export interface TracerLine {
  line: THREE.Line;
  geometry: THREE.BufferGeometry;
  startTime: number;
  duration: number;
  active: boolean;
}

export interface ImpactSpark {
  mesh: THREE.Points;
  geometry: THREE.BufferGeometry;
  velocities: Float32Array;
  startTime: number;
  duration: number;
  active: boolean;
}

export class BulletPool {
  private scene: THREE.Scene;
  private tracerPool: ObjectPool<TracerLine>;
  private activeTracers: TracerLine[] = [];

  private sparkPool: ObjectPool<ImpactSpark>;
  private activeSparks: ImpactSpark[] = [];

  private tracerMaterial: THREE.LineBasicMaterial;
  private sparkMaterial: THREE.PointsMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.tracerMaterial = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 2,
      transparent: true,
      opacity: 0.9,
    });

    this.sparkMaterial = new THREE.PointsMaterial({
      color: 0xfacc15,
      size: 0.25,
      transparent: true,
      opacity: 1,
    });

    // Initialize Tracer Pool
    this.tracerPool = new ObjectPool<TracerLine>(
      () => {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(6);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const line = new THREE.Line(geometry, this.tracerMaterial);
        line.visible = false;
        this.scene.add(line);
        return {
          line,
          geometry,
          startTime: 0,
          duration: 0.08,
          active: false,
        };
      },
      (t) => {
        t.line.visible = false;
        t.active = false;
      },
      30
    );

    // Initialize Impact Spark Pool
    this.sparkPool = new ObjectPool<ImpactSpark>(
      () => {
        const particleCount = 12;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mesh = new THREE.Points(geometry, this.sparkMaterial);
        mesh.visible = false;
        this.scene.add(mesh);
        return {
          mesh,
          geometry,
          velocities,
          startTime: 0,
          duration: 0.25,
          active: false,
        };
      },
      (s) => {
        s.mesh.visible = false;
        s.active = false;
      },
      15
    );
  }

  public spawnTracer(from: THREE.Vector3, to: THREE.Vector3, colorHex: number = 0x38bdf8): void {
    const tracer = this.tracerPool.get();
    tracer.active = true;
    tracer.startTime = performance.now();
    tracer.line.visible = true;

    const positions = tracer.geometry.attributes.position.array as Float32Array;
    positions[0] = from.x;
    positions[1] = from.y;
    positions[2] = from.z;
    positions[3] = to.x;
    positions[4] = to.y;
    positions[5] = to.z;
    tracer.geometry.attributes.position.needsUpdate = true;

    this.activeTracers.push(tracer);
  }

  public spawnImpactSparks(point: THREE.Vector3, normal?: THREE.Vector3): void {
    const spark = this.sparkPool.get();
    spark.active = true;
    spark.startTime = performance.now();
    spark.mesh.visible = true;

    const positions = spark.geometry.attributes.position.array as Float32Array;
    const baseNormal = normal || new THREE.Vector3(0, 1, 0);

    for (let i = 0; i < 12; i++) {
      const idx = i * 3;
      positions[idx] = point.x;
      positions[idx + 1] = point.y;
      positions[idx + 2] = point.z;

      // Random cone velocity along hit normal
      spark.velocities[idx] = (baseNormal.x + (Math.random() - 0.5) * 1.5) * 8;
      spark.velocities[idx + 1] = (baseNormal.y + (Math.random() - 0.2) * 1.5) * 8;
      spark.velocities[idx + 2] = (baseNormal.z + (Math.random() - 0.5) * 1.5) * 8;
    }

    spark.geometry.attributes.position.needsUpdate = true;
    this.activeSparks.push(spark);
  }

  public update(deltaTime: number): void {
    const now = performance.now();

    // 1. Update Tracers
    for (let i = this.activeTracers.length - 1; i >= 0; i--) {
      const t = this.activeTracers[i];
      const elapsed = (now - t.startTime) / 1000;
      if (elapsed > t.duration) {
        this.activeTracers.splice(i, 1);
        this.tracerPool.release(t);
      }
    }

    // 2. Update Sparks
    for (let i = this.activeSparks.length - 1; i >= 0; i--) {
      const s = this.activeSparks[i];
      const elapsed = (now - s.startTime) / 1000;
      if (elapsed > s.duration) {
        this.activeSparks.splice(i, 1);
        this.sparkPool.release(s);
      } else {
        const positions = s.geometry.attributes.position.array as Float32Array;
        for (let j = 0; j < 12; j++) {
          const idx = j * 3;
          positions[idx] += s.velocities[idx] * deltaTime;
          positions[idx + 1] += s.velocities[idx + 1] * deltaTime - 9.8 * deltaTime * deltaTime;
          positions[idx + 2] += s.velocities[idx + 2] * deltaTime;
        }
        s.geometry.attributes.position.needsUpdate = true;
      }
    }
  }

  public destroy(): void {
    this.activeTracers.forEach((t) => this.scene.remove(t.line));
    this.activeSparks.forEach((s) => this.scene.remove(s.mesh));
    this.tracerPool.clear();
    this.sparkPool.clear();
  }
}
