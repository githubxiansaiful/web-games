import * as THREE from 'three';
import { WeaponConfig, WEAPON_CONFIGS } from '../data/weaponData';
import { Damageable } from './DamageSystem';
import { BulletPool } from './BulletPool';
import { SoundManager } from '../core/SoundManager';
import { EventBus } from '../core/EventBus';

export interface WeaponState {
  config: WeaponConfig;
  currentAmmo: number;
  reserveAmmo: number;
  isReloading: boolean;
}

export class WeaponManager {
  public weapons: WeaponState[] = [];
  public currentWeaponIndex: number = 0;
  private lastFireTime: number = 0;
  private reloadStartTime: number = 0;
  private bulletPool: BulletPool;
  private soundManager: SoundManager;
  private eventBus: EventBus;

  constructor(bulletPool: BulletPool) {
    this.bulletPool = bulletPool;
    this.soundManager = SoundManager.getInstance();
    this.eventBus = EventBus.getInstance();

    // Default arsenal: Pistol (unlimited reserve), SMG, Shotgun
    this.weapons = [
      {
        config: WEAPON_CONFIGS.pistol,
        currentAmmo: 12,
        reserveAmmo: 999,
        isReloading: false,
      },
      {
        config: WEAPON_CONFIGS.smg,
        currentAmmo: 32,
        reserveAmmo: 120,
        isReloading: false,
      },
      {
        config: WEAPON_CONFIGS.shotgun,
        currentAmmo: 6,
        reserveAmmo: 36,
        isReloading: false,
      },
    ];
  }

  public getCurrentWeapon(): WeaponState {
    return this.weapons[this.currentWeaponIndex];
  }

  public switchWeapon(index: number): void {
    if (index >= 0 && index < this.weapons.length && index !== this.currentWeaponIndex) {
      this.currentWeaponIndex = index;
      this.emitState();
    }
  }

  public nextWeapon(): void {
    this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.weapons.length;
    this.emitState();
  }

  public reload(): void {
    const current = this.getCurrentWeapon();
    if (current.isReloading) return;
    if (current.currentAmmo >= current.config.magazineSize) return;
    if (current.reserveAmmo <= 0) return;

    current.isReloading = true;
    this.reloadStartTime = performance.now();
    this.soundManager.playReload();
    this.emitState();
  }

  public update(): void {
    const current = this.getCurrentWeapon();
    if (current.isReloading) {
      const elapsed = performance.now() - this.reloadStartTime;
      if (elapsed >= current.config.reloadTime) {
        current.isReloading = false;
        const needed = current.config.magazineSize - current.currentAmmo;
        const toLoad = Math.min(needed, current.reserveAmmo);
        current.currentAmmo += toLoad;
        if (current.reserveAmmo < 900) {
          current.reserveAmmo -= toLoad;
        }
        this.emitState();
      }
    }
  }

  public shoot(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    targets: Damageable[],
    environmentRaycastFn: (origin: THREE.Vector3, dir: THREE.Vector3, maxDist: number) => { hit: boolean; distance: number; point: THREE.Vector3 }
  ): boolean {
    const current = this.getCurrentWeapon();
    const now = performance.now();

    if (current.isReloading) return false;

    if (current.currentAmmo <= 0) {
      this.reload();
      return false;
    }

    if (now - this.lastFireTime < current.config.fireRate) {
      return false;
    }

    this.lastFireTime = now;
    current.currentAmmo--;

    // Play synthesized gunfire
    this.soundManager.playGunshot(current.config.type);

    // Fire pellets
    for (let p = 0; p < current.config.pellets; p++) {
      // Add spread perturbation
      const spreadDir = direction.clone();
      if (current.config.spread > 0) {
        spreadDir.x += (Math.random() - 0.5) * current.config.spread;
        spreadDir.y += (Math.random() - 0.5) * current.config.spread;
        spreadDir.z += (Math.random() - 0.5) * current.config.spread;
        spreadDir.normalize();
      }

      // Check environment collision first
      const envHit = environmentRaycastFn(origin, spreadDir, current.config.range);
      let maxHitDistance = envHit.hit ? envHit.distance : current.config.range;
      let hitTarget: Damageable | null = null;
      let hitPoint = envHit.hit ? envHit.point : origin.clone().add(spreadDir.clone().multiplyScalar(current.config.range));

      // Check living targets
      const ray = new THREE.Ray(origin, spreadDir);
      for (const t of targets) {
        if (t.isDead) continue;
        const targetMesh = (t as any).mesh as THREE.Object3D | undefined;
        if (!targetMesh) continue;

        // Approximate target bounding sphere
        const targetCenter = (t as any).position || targetMesh.position;
        const sphere = new THREE.Sphere(targetCenter.clone().setY(targetCenter.y + 0.9), 0.9);
        const intersectPoint = new THREE.Vector3();

        if (ray.intersectSphere(sphere, intersectPoint)) {
          const dist = origin.distanceTo(intersectPoint);
          if (dist < maxHitDistance) {
            maxHitDistance = dist;
            hitTarget = t;
            hitPoint = intersectPoint;
          }
        }
      }

      // Spawn visual tracer and sparks
      this.bulletPool.spawnTracer(origin, hitPoint);
      this.bulletPool.spawnImpactSparks(hitPoint);

      // Apply damage to target if hit
      if (hitTarget) {
        hitTarget.takeDamage({
          amount: current.config.damage,
          type: 'bullet',
          hitPosition: hitPoint,
          attackerPosition: origin,
          source: 'player',
        });
      }
    }

    this.eventBus.emit('WEAPON_FIRED', {
      weaponId: current.config.id,
      position: origin,
    });

    this.emitState();
    return true;
  }

  public emitState(): void {
    const current = this.getCurrentWeapon();
    this.eventBus.emit('WEAPON_STATE_CHANGED', {
      name: current.config.name,
      icon: current.config.icon,
      currentAmmo: current.currentAmmo,
      reserveAmmo: current.reserveAmmo,
      isReloading: current.isReloading,
    });
  }
}
