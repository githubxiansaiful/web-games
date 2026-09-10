/**
 * Zombie Haven - Modular 3D Zombie GLB Loader
 * Loads and manages Quaternius Ultimate Modular 3D zombie characters:
 * - Worker (zombie_worker.glb)
 * - Farmer (zombie_farmer.glb)
 * - Punk (zombie_punk.glb)
 * - Suit (zombie_suit.glb)
 * - Hoodie (zombie_hoodie.glb)
 * - Casual (zombie_casual.glb)
 * - SWAT (zombie_swat.glb - Tank archetype)
 * - Adventurer (zombie_adventurer.glb)
 *
 * Equipped with full skeletal animations (Walk, Run, Attack, Hit, Death, Idle),
 * custom zombie skin discoloration, and eerie glowing eyes.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { ZombieType } from '../types';

export type ZombieModelVariant =
  | 'worker'
  | 'farmer'
  | 'punk'
  | 'suit'
  | 'hoodie'
  | 'casual'
  | 'swat'
  | 'adventurer';

export interface ZombieInstance {
  model: THREE.Group;
  mixer: THREE.AnimationMixer;
  actions: {
    walk?: THREE.AnimationAction;
    run?: THREE.AnimationAction;
    attack?: THREE.AnimationAction;
    hit?: THREE.AnimationAction;
    death?: THREE.AnimationAction;
    idle?: THREE.AnimationAction;
  };
  skinMaterials: THREE.MeshStandardMaterial[];
  originalSkinColors: number[];
}

const ZOMBIE_MODEL_PATHS: Record<ZombieModelVariant, string> = {
  worker: '/models/zombie/zombies/zombie_worker.glb',
  farmer: '/models/zombie/zombies/zombie_farmer.glb',
  punk: '/models/zombie/zombies/zombie_punk.glb',
  suit: '/models/zombie/zombies/zombie_suit.glb',
  hoodie: '/models/zombie/zombies/zombie_hoodie.glb',
  casual: '/models/zombie/zombies/zombie_casual.glb',
  swat: '/models/zombie/zombies/zombie_swat.glb',
  adventurer: '/models/zombie/zombies/zombie_adventurer.glb',
};

const TYPE_VARIANT_MAP: Record<ZombieType, ZombieModelVariant[]> = {
  walker: ['farmer', 'worker', 'casual', 'suit', 'punk'],
  runner: ['hoodie', 'adventurer', 'punk'],
  tank: ['swat'],
  screamer: ['casual', 'punk'],
};

const ZOMBIE_SKIN_COLORS: Record<ZombieType, number> = {
  walker: 0x4e6b4e,   // rotting undead green
  runner: 0x8b3a3a,   // furious bloody infected
  tank: 0x374151,     // heavy bruised slate brute
  screamer: 0x6b4984, // ghastly pale banshee purple
};

const ZOMBIE_EYE_COLORS: Record<ZombieType, number> = {
  walker: 0xeab308,
  runner: 0xef4444,
  tank: 0xdc2626,
  screamer: 0xa855f7,
};

export class ZombieGLBLoader {
  private static instance: ZombieGLBLoader;
  private loader: GLTFLoader;
  private gltfCache: Map<ZombieModelVariant, any> = new Map();
  private loadPromise: Promise<void> | null = null;

  private constructor() {
    this.loader = new GLTFLoader();
  }

  public static getInstance(): ZombieGLBLoader {
    if (!ZombieGLBLoader.instance) {
      ZombieGLBLoader.instance = new ZombieGLBLoader();
    }
    return ZombieGLBLoader.instance;
  }

  public async load(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = new Promise(async (resolve) => {
      const variants = Object.keys(ZOMBIE_MODEL_PATHS) as ZombieModelVariant[];
      await Promise.allSettled(
        variants.map(async (variant) => {
          try {
            const gltf = await this.loader.loadAsync(ZOMBIE_MODEL_PATHS[variant]);
            this.gltfCache.set(variant, gltf);
          } catch (err) {
            console.warn(`[ZombieGLBLoader] Failed to load variant "${variant}":`, err);
          }
        })
      );
      resolve();
    });

    return this.loadPromise;
  }

  public isLoaded(): boolean {
    return this.gltfCache.size > 0;
  }

  /**
   * Instantiates a fully rigged, uniquely textured 3D zombie model
   */
  public createZombieInstance(type: ZombieType): ZombieInstance | null {
    const candidateVariants = TYPE_VARIANT_MAP[type] || ['worker'];
    const available = candidateVariants.filter((v) => this.gltfCache.has(v));
    const variant = available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : (this.gltfCache.keys().next().value as ZombieModelVariant | undefined);

    if (!variant || !this.gltfCache.has(variant)) return null;

    const cachedGltf = this.gltfCache.get(variant);
    const model = SkeletonUtils.clone(cachedGltf.scene) as THREE.Group;

    // Build AnimationMixer and extract clips
    const mixer = new THREE.AnimationMixer(model);
    const clips: THREE.AnimationClip[] = cachedGltf.animations || [];
    const getClip = (name: string) => clips.find((c) => c.name === name);

    const walkClip = getClip('Walk');
    const runClip = getClip('Run');
    const attackClip = getClip('Punch_Right') || getClip('Punch_Left');
    const hitClip = getClip('HitRecieve') || getClip('HitRecieve_2');
    const deathClip = getClip('Death');
    const idleClip = getClip('Idle');

    const actions: ZombieInstance['actions'] = {
      walk: walkClip ? mixer.clipAction(walkClip) : undefined,
      run: runClip ? mixer.clipAction(runClip) : undefined,
      attack: attackClip ? mixer.clipAction(attackClip) : undefined,
      hit: hitClip ? mixer.clipAction(hitClip) : undefined,
      death: deathClip ? mixer.clipAction(deathClip) : undefined,
      idle: idleClip ? mixer.clipAction(idleClip) : undefined,
    };

    if (actions.attack) {
      actions.attack.setLoop(THREE.LoopOnce, 1);
      actions.attack.clampWhenFinished = false;
    }
    if (actions.hit) {
      actions.hit.setLoop(THREE.LoopOnce, 1);
      actions.hit.clampWhenFinished = false;
    }
    if (actions.death) {
      actions.death.setLoop(THREE.LoopOnce, 1);
      actions.death.clampWhenFinished = true;
    }

    // Material customization: clone materials so each zombie can flash hit effects independently
    const skinMaterials: THREE.MeshStandardMaterial[] = [];
    const originalSkinColors: number[] = [];
    const targetSkinColor = ZOMBIE_SKIN_COLORS[type] || 0x4e6b4e;
    const targetEyeColor = ZOMBIE_EYE_COLORS[type] || 0xef4444;

    model.traverse((child: any) => {
      if (child.isMesh || child.isSkinnedMesh) {
        child.castShadow = false;
        child.receiveShadow = false;

        const processMaterial = (mat: any): THREE.Material => {
          if (!mat) return mat;
          const clonedMat = mat.clone() as THREE.MeshStandardMaterial;

          if (clonedMat.name === 'Skin') {
            clonedMat.color.setHex(targetSkinColor);
            clonedMat.roughness = 0.75;
            clonedMat.metalness = 0.05;
            skinMaterials.push(clonedMat);
            originalSkinColors.push(targetSkinColor);
          } else if (clonedMat.name === 'Eye') {
            clonedMat.color.setHex(0xffffff);
            clonedMat.emissive = new THREE.Color(targetEyeColor);
            clonedMat.emissiveIntensity = 1.6;
          }
          return clonedMat;
        };

        if (Array.isArray(child.material)) {
          child.material = child.material.map(processMaterial);
        } else if (child.material) {
          child.material = processMaterial(child.material);
        }
      }
    });

    return {
      model,
      mixer,
      actions,
      skinMaterials,
      originalSkinColors,
    };
  }
}

export const zombieGLBLoader = ZombieGLBLoader.getInstance();
