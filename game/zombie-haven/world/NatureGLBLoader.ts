/**
 * Zombie Haven - Low-Poly 3D Nature Pack Loader
 * Loads and caches Quaternius stylized nature models from nature_pack.glb:
 * - Trees: tree_common_1..3, tree_pine_1..3, tree_birch_1..2
 * - Foliage: bush_1, bush_2, bush_berries
 * - Rocks: rock_1..3, rock_moss
 * - Logs: wood_log, wood_log_moss
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class NatureGLBLoader {
  private static instance: NatureGLBLoader;
  private gltfCache: any = null;
  private loadPromise: Promise<any> | null = null;
  private loader: GLTFLoader;

  private constructor() {
    this.loader = new GLTFLoader();
  }

  public static getInstance(): NatureGLBLoader {
    if (!NatureGLBLoader.instance) {
      NatureGLBLoader.instance = new NatureGLBLoader();
    }
    return NatureGLBLoader.instance;
  }

  public async load(): Promise<any> {
    if (this.gltfCache) return this.gltfCache;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = new Promise((resolve, reject) => {
      this.loader.load(
        '/models/zombie/nature_pack.glb',
        (gltf) => {
          this.gltfCache = gltf;
          resolve(gltf);
        },
        undefined,
        (err) => {
          console.warn('[NatureGLBLoader] Failed to load nature pack:', err);
          reject(err);
        }
      );
    });

    return this.loadPromise;
  }

  /**
   * Returns a cloned nature model group by name
   */
  public getModel(name: string): THREE.Group | null {
    if (!this.gltfCache) return null;
    const node = this.gltfCache.scene.getObjectByName(name);
    if (!node) return null;
    return node.clone(true) as THREE.Group;
  }

  /**
   * Returns random tree model from common, pine, or birch sets
   */
  public getRandomTree(): THREE.Group | null {
    const trees = [
      'tree_common_1', 'tree_common_2', 'tree_common_3',
      'tree_pine_1', 'tree_pine_2', 'tree_pine_3',
      'tree_birch_1', 'tree_birch_2',
    ];
    const picked = trees[Math.floor(Math.random() * trees.length)];
    return this.getModel(picked);
  }

  /**
   * Returns random rock model
   */
  public getRandomRock(): THREE.Group | null {
    const rocks = ['rock_1', 'rock_2', 'rock_3', 'rock_moss'];
    const picked = rocks[Math.floor(Math.random() * rocks.length)];
    return this.getModel(picked);
  }

  /**
   * Returns random bush or foliage model
   */
  public getRandomBush(): THREE.Group | null {
    const bushes = ['bush_1', 'bush_2', 'bush_berries', 'wood_log', 'wood_log_moss'];
    const picked = bushes[Math.floor(Math.random() * bushes.length)];
    return this.getModel(picked);
  }
}

export const natureGLBLoader = NatureGLBLoader.getInstance();
