/**
 * Zombie Haven - Low-Poly 3D Firearms Loader
 * Loads and caches Quaternius 3D firearms from guns_pack.glb:
 * - pistol (Pistol_1)
 * - shotgun (Shotgun_1)
 * - rifle (AssaultRifle_1)
 * - sniper (SniperRifle_1)
 * - revolver (Revolver_1)
 * - smg (SubmachineGun_1)
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { WeaponType } from '../types';

export class GunGLBLoader {
  private static instance: GunGLBLoader;
  private gltfCache: any = null;
  private loadPromise: Promise<any> | null = null;
  private loader: GLTFLoader;

  private constructor() {
    this.loader = new GLTFLoader();
  }

  public static getInstance(): GunGLBLoader {
    if (!GunGLBLoader.instance) {
      GunGLBLoader.instance = new GunGLBLoader();
    }
    return GunGLBLoader.instance;
  }

  public async load(): Promise<any> {
    if (this.gltfCache) return this.gltfCache;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = new Promise((resolve, reject) => {
      this.loader.load(
        '/models/zombie/guns_pack.glb',
        (gltf) => {
          this.gltfCache = gltf;
          resolve(gltf);
        },
        undefined,
        (err) => {
          console.warn('[GunGLBLoader] Failed to load guns pack:', err);
          reject(err);
        }
      );
    });

    return this.loadPromise;
  }

  /**
   * Returns a cloned gun group with attached muzzle marker
   */
  public getGunModel(type: WeaponType | string): { group: THREE.Group; muzzle: THREE.Object3D } | null {
    if (!this.gltfCache) return null;

    const rootGun = this.gltfCache.scene.getObjectByName(type);
    if (!rootGun) return null;

    const group = rootGun.clone(true) as THREE.Group;
    const muzzle = group.getObjectByName(`${type}_muzzle`) || new THREE.Object3D();

    return { group, muzzle };
  }
}

export const gunGLBLoader = GunGLBLoader.getInstance();
