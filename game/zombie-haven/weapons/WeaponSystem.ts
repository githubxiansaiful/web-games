/**
 * Zombie Haven - Weapon System
 * Manages Pistol, Shotgun, and Assault Rifle stats, magazines, raycast hit detection,
 * muzzle flash, reload cycles, and dynamic recoil.
 */

import * as THREE from 'three';
import { WeaponType, WeaponConfig, WeaponState } from '../types';
import { zombieAudio } from '@/components/zombie-haven/ZombieHavenAudio';

export const WEAPON_CONFIGS: Record<WeaponType, WeaponConfig> = {
  pistol: {
    id: 'pistol',
    name: 'M1911 Service Pistol',
    damage: 25,
    magazineSize: 12,
    reserveMax: 48,
    fireRate: 3.5, // max shots/sec
    pellets: 1,
    spread: 0.015,
    reloadTime: 1.2,
    recoil: 0.04,
    range: 65,
  },
  shotgun: {
    id: 'shotgun',
    name: 'Remington 870 Pump',
    damage: 16, // per pellet (x8 = 128 max at point blank)
    magazineSize: 6,
    reserveMax: 24,
    fireRate: 1.1,
    pellets: 8,
    spread: 0.075,
    reloadTime: 2.2,
    recoil: 0.09,
    range: 35,
  },
  rifle: {
    id: 'rifle',
    name: 'M4A1 Carbine',
    damage: 22,
    magazineSize: 30,
    reserveMax: 120,
    fireRate: 8.5, // fully auto
    pellets: 1,
    spread: 0.032,
    reloadTime: 1.8,
    recoil: 0.035,
    range: 85,
  },
};

export class WeaponSystem {
  public activeWeapon: WeaponType = 'pistol';
  public weapons: Record<WeaponType, WeaponState>;
  public recoilKick: number = 0;
  public muzzleFlashMesh: THREE.Mesh | null = null;
  public muzzleFlashLight: THREE.PointLight | null = null;
  private flashTimer: number = 0;

  constructor() {
    this.weapons = {
      pistol: {
        type: 'pistol',
        ammoInClip: WEAPON_CONFIGS.pistol.magazineSize,
        reserveAmmo: WEAPON_CONFIGS.pistol.reserveMax,
        isReloading: false,
        reloadTimer: 0,
        lastFireTime: 0,
      },
      shotgun: {
        type: 'shotgun',
        ammoInClip: WEAPON_CONFIGS.shotgun.magazineSize,
        reserveAmmo: WEAPON_CONFIGS.shotgun.reserveMax,
        isReloading: false,
        reloadTimer: 0,
        lastFireTime: 0,
      },
      rifle: {
        type: 'rifle',
        ammoInClip: WEAPON_CONFIGS.rifle.magazineSize,
        reserveAmmo: WEAPON_CONFIGS.rifle.reserveMax,
        isReloading: false,
        reloadTimer: 0,
        lastFireTime: 0,
      },
    };
  }

  public initMuzzleFlash(parent: THREE.Object3D) {
    const flashGeo = new THREE.DodecahedronGeometry(0.12, 1);
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffedd5, transparent: true, opacity: 0 });
    this.muzzleFlashMesh = new THREE.Mesh(flashGeo, flashMat);
    this.muzzleFlashMesh.position.set(0.2, 1.25, 0.65);
    parent.add(this.muzzleFlashMesh);

    this.muzzleFlashLight = new THREE.PointLight(0xf97316, 0, 8, 2);
    this.muzzleFlashLight.position.set(0.2, 1.25, 0.65);
    parent.add(this.muzzleFlashLight);
  }

  public getActiveConfig(): WeaponConfig {
    return WEAPON_CONFIGS[this.activeWeapon];
  }

  public getActiveState(): WeaponState {
    return this.weapons[this.activeWeapon];
  }

  public switchWeapon(type: WeaponType) {
    if (this.activeWeapon === type) return;
    const currentState = this.getActiveState();
    if (currentState.isReloading) {
      currentState.isReloading = false;
      currentState.reloadTimer = 0;
    }
    this.activeWeapon = type;
    zombieAudio.playReload();
  }

  public startReload() {
    const state = this.getActiveState();
    const config = this.getActiveConfig();

    if (state.isReloading || state.ammoInClip >= config.magazineSize || state.reserveAmmo <= 0) {
      return;
    }

    state.isReloading = true;
    state.reloadTimer = config.reloadTime;
    zombieAudio.playReload();
  }

  public addAmmo(type: WeaponType, amount: number) {
    const state = this.weapons[type];
    const config = WEAPON_CONFIGS[type];
    state.reserveAmmo = Math.min(config.reserveMax, state.reserveAmmo + amount);
  }

  public update(delta: number) {
    // Weapon reload timer
    const state = this.getActiveState();
    if (state.isReloading) {
      state.reloadTimer -= delta;
      if (state.reloadTimer <= 0) {
        state.isReloading = false;
        const config = this.getActiveConfig();
        const needed = config.magazineSize - state.ammoInClip;
        const available = Math.min(needed, state.reserveAmmo);
        state.ammoInClip += available;
        state.reserveAmmo -= available;
      }
    }

    // Recoil recovery
    if (this.recoilKick > 0) {
      this.recoilKick = Math.max(0, this.recoilKick - delta * 0.35);
    }

    // Muzzle flash fade
    if (this.flashTimer > 0) {
      this.flashTimer -= delta;
      if (this.flashTimer <= 0) {
        if (this.muzzleFlashMesh) {
          (this.muzzleFlashMesh.material as THREE.MeshBasicMaterial).opacity = 0;
        }
        if (this.muzzleFlashLight) {
          this.muzzleFlashLight.intensity = 0;
        }
      }
    }
  }

  /**
   * Fires the active weapon. Returns array of ray directions with spread applied
   */
  public shoot(isAiming = false, muzzlePos?: THREE.Vector3): { success: boolean; spreadDirs: THREE.Vector2[] } {
    const state = this.getActiveState();
    const config = this.getActiveConfig();
    const now = performance.now() / 1000;

    // Check fire rate
    if (now - state.lastFireTime < 1 / config.fireRate) {
      return { success: false, spreadDirs: [] };
    }

    // Check reloading
    if (state.isReloading) {
      return { success: false, spreadDirs: [] };
    }

    // Check ammo
    if (state.ammoInClip <= 0) {
      zombieAudio.playEmptyClick();
      this.startReload();
      return { success: false, spreadDirs: [] };
    }

    // Consume bullet
    state.ammoInClip -= 1;
    state.lastFireTime = now;
    this.recoilKick = config.recoil;

    // Play Audio
    if (this.activeWeapon === 'pistol') zombieAudio.playPistol();
    else if (this.activeWeapon === 'shotgun') zombieAudio.playShotgun();
    else if (this.activeWeapon === 'rifle') zombieAudio.playRifle();

    // Trigger Muzzle Flash at physical barrel tip
    this.triggerMuzzleFlash(muzzlePos);

    // Calculate spread directions (angular deflection in crosshair plane)
    const spreadMod = isAiming ? 0.35 : 0.75;
    const spreadDirs: THREE.Vector2[] = [];

    for (let p = 0; p < config.pellets; p++) {
      const spreadX = (Math.random() - 0.5) * config.spread * spreadMod;
      const spreadY = (Math.random() - 0.5) * config.spread * spreadMod;
      spreadDirs.push(new THREE.Vector2(spreadX, spreadY));
    }

    // Auto reload when empty
    if (state.ammoInClip === 0 && state.reserveAmmo > 0) {
      this.startReload();
    }

    return { success: true, spreadDirs };
  }

  public triggerMuzzleFlash(pos?: THREE.Vector3) {
    this.flashTimer = 0.06;
    if (pos) {
      if (this.muzzleFlashMesh) this.muzzleFlashMesh.position.copy(pos);
      if (this.muzzleFlashLight) this.muzzleFlashLight.position.copy(pos);
    }
    if (this.muzzleFlashMesh) {
      (this.muzzleFlashMesh.material as THREE.MeshBasicMaterial).opacity = 0.95;
    }
    if (this.muzzleFlashLight) {
      this.muzzleFlashLight.intensity = 3.5;
    }
  }
}
