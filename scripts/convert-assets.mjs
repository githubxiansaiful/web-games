/**
 * Zombie Haven Asset Pipeline
 * Converts Quaternius OBJ/MTL low-poly models into optimized GLB bundles:
 * - public/models/zombie/guns_pack.glb
 * - public/models/zombie/nature_pack.glb
 */

class MockFileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(buf => {
      this.result = buf;
      if (this.onloadend) this.onloadend();
      if (this.onload) this.onload();
    });
  }
}
globalThis.FileReader = MockFileReader;

import fs from 'fs';
import path from 'path';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

const GUN_PACK_DIR = 'C:/Users/xiansaiful/Downloads/Ultimate Gun Pack by Quaternius/OBJ';
const NATURE_PACK_DIR = 'C:/Users/xiansaiful/Downloads/Ultimate Nature Pack by Quaternius/OBJ';
const OUTPUT_DIR = 'public/models/zombie';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function loadOBJModel(dir, name) {
  const mtlPath = path.join(dir, `${name}.mtl`);
  const objPath = path.join(dir, `${name}.obj`);

  if (!fs.existsSync(mtlPath) || !fs.existsSync(objPath)) {
    console.warn(`Missing: ${name}`);
    return null;
  }

  const mtlContent = fs.readFileSync(mtlPath, 'utf-8');
  const objContent = fs.readFileSync(objPath, 'utf-8');

  const mtlLoader = new MTLLoader();
  const materials = mtlLoader.parse(mtlContent, '');
  materials.preload();

  const objLoader = new OBJLoader();
  objLoader.setMaterials(materials);
  const obj = objLoader.parse(objContent);

  // Convert materials to MeshStandardMaterial
  obj.traverse(child => {
    if (child.isMesh && child.material) {
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      const newMats = mats.map(m => {
        const matName = (m.name || '').toLowerCase();
        const isMetal = matName.includes('metal') || matName.includes('black') || matName.includes('steel');
        return new THREE.MeshStandardMaterial({
          name: m.name,
          color: m.color,
          roughness: isMetal ? 0.35 : 0.65,
          metalness: isMetal ? 0.75 : 0.05,
        });
      });
      child.material = newMats.length === 1 ? newMats[0] : newMats;
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return obj;
}

// --- 1. BUILD GUNS PACK ---
async function buildGunsPack() {
  console.log('--- Building Guns Pack ---');
  const gunsPackScene = new THREE.Scene();
  gunsPackScene.name = 'GunsPack';

  const gunConfigs = [
    { key: 'pistol', file: 'Pistol_1', scale: 0.14 },
    { key: 'shotgun', file: 'Shotgun_1', scale: 0.18 },
    { key: 'rifle', file: 'AssaultRifle_1', scale: 0.22 },
    { key: 'sniper', file: 'SniperRifle_1', scale: 0.17 },
    { key: 'revolver', file: 'Revolver_1', scale: 0.14 },
    { key: 'smg', file: 'SubmachineGun_1', scale: 0.20 },
  ];

  for (const cfg of gunConfigs) {
    const rawObj = loadOBJModel(GUN_PACK_DIR, cfg.file);
    if (!rawObj) continue;

    const gunGroup = new THREE.Group();
    gunGroup.name = cfg.key;

    // In raw OBJ:
    // Grip is at x ≈ 0, y ≈ 0, z = 0.
    // Barrel extends along +X.
    // Rotating by -PI/2 around Y maps +X (barrel) to +Z (forward inside weaponSocket), and -X (stock) to -Z.
    // Height remains +Y (up), and grip extends down along -Y.
    rawObj.children.forEach(mesh => {
      const clonedMesh = mesh.clone();
      clonedMesh.geometry = mesh.geometry.clone();
      clonedMesh.geometry.scale(cfg.scale, cfg.scale, cfg.scale);
      clonedMesh.geometry.rotateY(-Math.PI / 2);
      clonedMesh.geometry.computeVertexNormals();
      clonedMesh.geometry.computeBoundingBox();
      gunGroup.add(clonedMesh);
    });

    const gunBox = new THREE.Box3().setFromObject(gunGroup);

    // Muzzle is at the most forward tip of the barrel (max.z inside socket)
    const muzzle = new THREE.Object3D();
    muzzle.name = `${cfg.key}_muzzle`;
    const barrelHeight = gunBox.min.y + (gunBox.max.y - gunBox.min.y) * 0.72;
    muzzle.position.set(0, barrelHeight, gunBox.max.z + 0.02);
    gunGroup.add(muzzle);

    console.log(`Gun [${cfg.key}]: length=${(gunBox.max.z - gunBox.min.z).toFixed(2)}m, muzzle=[${muzzle.position.x.toFixed(2)}, ${muzzle.position.y.toFixed(2)}, ${muzzle.position.z.toFixed(2)}]`);
    gunsPackScene.add(gunGroup);
  }

  const exporter = new GLTFExporter();
  await new Promise((resolve, reject) => {
    exporter.parse(
      gunsPackScene,
      (glb) => {
        const dest = path.join(OUTPUT_DIR, 'guns_pack.glb');
        fs.writeFileSync(dest, Buffer.from(glb));
        console.log(`Successfully written: ${dest} (${(glb.byteLength / 1024).toFixed(1)} KB)`);
        resolve();
      },
      reject,
      { binary: true }
    );
  });
}

// --- 2. BUILD NATURE PACK ---
async function buildNaturePack() {
  console.log('--- Building Nature Pack ---');
  const natureScene = new THREE.Scene();
  natureScene.name = 'NaturePack';

  const natureModels = [
    { key: 'tree_common_1', file: 'CommonTree_1', scale: 2.2 },
    { key: 'tree_common_2', file: 'CommonTree_2', scale: 2.0 },
    { key: 'tree_common_3', file: 'CommonTree_3', scale: 2.4 },
    { key: 'tree_pine_1', file: 'PineTree_1', scale: 2.3 },
    { key: 'tree_pine_2', file: 'PineTree_2', scale: 2.5 },
    { key: 'tree_pine_3', file: 'PineTree_3', scale: 2.1 },
    { key: 'tree_birch_1', file: 'BirchTree_1', scale: 2.0 },
    { key: 'tree_birch_2', file: 'BirchTree_2', scale: 1.9 },
    { key: 'bush_1', file: 'Bush_1', scale: 1.4 },
    { key: 'bush_2', file: 'Bush_2', scale: 1.3 },
    { key: 'bush_berries', file: 'BushBerries_1', scale: 1.4 },
    { key: 'rock_1', file: 'Rock_1', scale: 1.8 },
    { key: 'rock_2', file: 'Rock_2', scale: 1.6 },
    { key: 'rock_3', file: 'Rock_3', scale: 1.5 },
    { key: 'rock_moss', file: 'Rock_Moss_1', scale: 1.7 },
    { key: 'wood_log', file: 'WoodLog', scale: 1.5 },
    { key: 'wood_log_moss', file: 'WoodLog_Moss', scale: 1.5 },
  ];

  for (const cfg of natureModels) {
    const rawObj = loadOBJModel(NATURE_PACK_DIR, cfg.file);
    if (!rawObj) continue;

    const group = new THREE.Group();
    group.name = cfg.key;

    // Calculate bounding box and ensure base sits at y = 0
    const rawBox = new THREE.Box3().setFromObject(rawObj);
    const minY = rawBox.min.y;

    rawObj.children.forEach(mesh => {
      const clonedMesh = mesh.clone();
      clonedMesh.geometry = mesh.geometry.clone();
      // Center base on floor (y = 0)
      clonedMesh.geometry.translate(0, -minY, 0);
      clonedMesh.geometry.scale(cfg.scale, cfg.scale, cfg.scale);
      clonedMesh.geometry.computeVertexNormals();
      group.add(clonedMesh);
    });

    const finalBox = new THREE.Box3().setFromObject(group);
    console.log(`Nature [${cfg.key}]: height=${finalBox.max.y.toFixed(2)}m`);
    natureScene.add(group);
  }

  const exporter = new GLTFExporter();
  await new Promise((resolve, reject) => {
    exporter.parse(
      natureScene,
      (glb) => {
        const dest = path.join(OUTPUT_DIR, 'nature_pack.glb');
        fs.writeFileSync(dest, Buffer.from(glb));
        console.log(`Successfully written: ${dest} (${(glb.byteLength / 1024).toFixed(1)} KB)`);
        resolve();
      },
      reject,
      { binary: true }
    );
  });
}

async function main() {
  await buildGunsPack();
  await buildNaturePack();
  console.log('All packs built successfully!');
}

main().catch(err => {
  console.error('Build packs failed:', err);
  process.exit(1);
});
