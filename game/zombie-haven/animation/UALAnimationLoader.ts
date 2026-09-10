/**
 * Zombie Haven - Universal Animation Library Loader
 * Loads and caches 43 high-quality in-place character animations from UAL1_Standard.glb:
 * - Movement: Idle_Loop, Walk_Loop, Jog_Fwd_Loop, Sprint_Loop, Crouch_Fwd_Loop
 * - Combat: Pistol_Aim_Neutral, Pistol_Shoot, Pistol_Reload, Pistol_Idle_Loop
 * - Reactions: Hit_Chest, Hit_Head, Death01, Roll, Jump_Start, Jump_Land
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

export class UALAnimationLoader {
  private static instance: UALAnimationLoader;
  private gltfCache: any = null;
  private maleCharCache: THREE.Group | null = null;
  private femaleCharCache: THREE.Group | null = null;
  private loadPromise: Promise<any> | null = null;
  private loader: GLTFLoader;
  private clipsMap: Map<string, THREE.AnimationClip> = new Map();

  private constructor() {
    this.loader = new GLTFLoader();
  }

  public static getInstance(): UALAnimationLoader {
    if (!UALAnimationLoader.instance) {
      UALAnimationLoader.instance = new UALAnimationLoader();
    }
    return UALAnimationLoader.instance;
  }

  public async load(): Promise<any> {
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = new Promise(async (resolve, reject) => {
      try {
        // 1. Load Universal Animation Library (43 clips + skeleton)
        const gltf = await this.loader.loadAsync('/models/zombie/UAL1_Standard.glb');
        this.gltfCache = gltf;
        gltf.animations.forEach((clip) => {
          this.clipsMap.set(clip.name, clip);
        });

        // 2. Asynchronously load Universal Base Characters (Male & Female)
        try {
          const maleGltf = await this.loader.loadAsync('/models/zombie/superhero_male.glb');
          this.maleCharCache = maleGltf.scene;
        } catch (mErr) {
          console.warn('[UALAnimationLoader] Could not load male character:', mErr);
        }

        try {
          const femaleGltf = await this.loader.loadAsync('/models/zombie/superhero_female.glb');
          this.femaleCharCache = femaleGltf.scene;
        } catch (fErr) {
          console.warn('[UALAnimationLoader] Could not load female character:', fErr);
        }

        resolve({ animGltf: gltf, male: this.maleCharCache, female: this.femaleCharCache });
      } catch (err) {
        console.warn('[UALAnimationLoader] Failed to load animation library:', err);
        reject(err);
      }
    });

    return this.loadPromise;
  }

  public getClip(name: string): THREE.AnimationClip | null {
    return this.clipsMap.get(name) || null;
  }

  public getAllClips(): THREE.AnimationClip[] {
    return this.gltfCache ? this.gltfCache.animations : [];
  }

  public getCharacterModel(gender: 'male' | 'female' = 'male'): THREE.Group | null {
    const src = gender === 'female' ? this.femaleCharCache : this.maleCharCache;
    if (src) {
      return SkeletonUtils.clone(src) as THREE.Group;
    }
    if (this.gltfCache) {
      return SkeletonUtils.clone(this.gltfCache.scene) as THREE.Group;
    }
    return null;
  }

  public getMannequinModel(): THREE.Group | null {
    if (!this.gltfCache) return null;
    return SkeletonUtils.clone(this.gltfCache.scene) as THREE.Group;
  }
}

export const ualAnimationLoader = UALAnimationLoader.getInstance();
