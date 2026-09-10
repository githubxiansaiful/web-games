/**
 * Zombie Haven - Character GLB Model Loader
 * Loads and caches character_low_poly_pack.glb, extracting and centering
 * the 4 stylized low-poly survivor models:
 * - Xian: Cube028 (Blue/navy jacket with khaki pants)
 * - Crimson: Cube026 (Crimson/red jacket survivor)
 * - Marcus: Cube025 (Amber/orange jacket survivor)
 * - Elena: Cube027 (Casual red variant)
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type SurvivorSkin = 'xian' | 'crimson' | 'marcus' | 'elena';

const SKIN_NODE_MAP: Record<SurvivorSkin, string> = {
  xian: 'Cube028',
  crimson: 'Cube026',
  marcus: 'Cube025',
  elena: 'Cube027',
};

export class CharacterGLBLoader {
  private static instance: CharacterGLBLoader;
  private gltfCache: any = null;
  private loadPromise: Promise<any> | null = null;
  private loader: GLTFLoader;

  private constructor() {
    this.loader = new GLTFLoader();
  }

  public static getInstance(): CharacterGLBLoader {
    if (!CharacterGLBLoader.instance) {
      CharacterGLBLoader.instance = new CharacterGLBLoader();
    }
    return CharacterGLBLoader.instance;
  }

  /**
   * Preloads the character pack GLB
   */
  public async load(): Promise<any> {
    if (this.gltfCache) return this.gltfCache;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = new Promise((resolve, reject) => {
      this.loader.load(
        '/models/zombie/character_low_poly_pack.glb',
        (gltf) => {
          gltf.scene.updateMatrixWorld(true);
          this.gltfCache = gltf;
          resolve(gltf);
        },
        undefined,
        (err) => {
          console.warn('[CharacterGLBLoader] Failed to load character GLB:', err);
          reject(err);
        }
      );
    });

    return this.loadPromise;
  }

  /**
   * Extracts a fully centered, floor-aligned, +Z facing character group
   */
  public getCharacterModel(skin: SurvivorSkin = 'xian'): THREE.Group | null {
    if (!this.gltfCache) return null;

    const nodeName = SKIN_NODE_MAP[skin] || 'Cube028';
    const charNode = this.gltfCache.scene.getObjectByName(nodeName);
    if (!charNode) return null;

    // 1. Calculate raw world bounding box
    const rawBox = new THREE.Box3();
    charNode.children.forEach((child: any) => {
      if (child.geometry) {
        const g = child.geometry.clone();
        g.applyMatrix4(child.matrixWorld);
        g.computeBoundingBox();
        rawBox.union(g.boundingBox);
      }
    });

    const rawCenter = new THREE.Vector3();
    rawBox.getCenter(rawCenter);
    const minY = rawBox.min.y;

    // 2. Clone each mesh and transform geometry directly to sit at y = 0 facing +Z
    const charGroup = new THREE.Group();
    charGroup.name = `character_${skin}`;

    charNode.children.forEach((child: any) => {
      if (!child.geometry) return;
      const g = child.geometry.clone();
      // Bake world matrix
      g.applyMatrix4(child.matrixWorld);
      // Center X and Z, align feet to y = 0
      g.translate(-rawCenter.x, -minY, -rawCenter.z);
      // Rotate 180 degrees around Y so model faces -Z forward with back to camera (+Z)
      g.rotateY(Math.PI);
      g.computeVertexNormals();

      const m = child.material ? child.material.clone() : new THREE.MeshLambertMaterial({ color: 0xcccccc });
      const mesh = new THREE.Mesh(g, m);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      charGroup.add(mesh);
    });

    return charGroup;
  }
}

export const characterGLBLoader = CharacterGLBLoader.getInstance();
