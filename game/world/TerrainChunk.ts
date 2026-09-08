/**
 * TerrainChunk.ts
 * Manages an individual terrain chunk with dynamic LOD geometry generation,
 * smooth vertex normals, blended vertex colors, and shadow reception.
 */

import * as THREE from 'three';
import { WORLD_CONFIG, getChunkBounds, ChunkBounds } from './WorldCoordinates';
import { BiomeWeights, computeTerrainVertexColor } from './TerrainMaterial';

export type HeightFunction = (x: number, z: number) => number;
export type NormalFunction = (x: number, z: number) => THREE.Vector3;
export type BiomeFunction = (x: number, z: number) => BiomeWeights;

export class TerrainChunk {
  public cx: number;
  public cz: number;
  public bounds: ChunkBounds;
  public currentLOD: number = -1;
  public mesh: THREE.Mesh | null = null;
  public isDisposed: boolean = false;

  private material: THREE.Material;
  private getHeight: HeightFunction;
  private getNormal: NormalFunction;
  private getBiomes: BiomeFunction;

  constructor(
    cx: number,
    cz: number,
    material: THREE.Material,
    getHeight: HeightFunction,
    getNormal: NormalFunction,
    getBiomes: BiomeFunction
  ) {
    this.cx = cx;
    this.cz = cz;
    this.bounds = getChunkBounds(cx, cz);
    this.material = material;
    this.getHeight = getHeight;
    this.getNormal = getNormal;
    this.getBiomes = getBiomes;
  }

  /**
   * Builds or updates chunk geometry for the specified LOD level.
   * LOD 0: 24x24 quads (high detail near player)
   * LOD 1: 12x12 quads (mid detail)
   * LOD 2: 6x6 quads (distant terrain)
   */
  public setLOD(lod: number, parentGroup: THREE.Group): void {
    if (this.isDisposed || this.currentLOD === lod) return;

    this.currentLOD = lod;
    const segments = lod === 0 ? 24 : lod === 1 ? 12 : 6;
    const vertexCountX = segments + 1;
    const vertexCountZ = segments + 1;
    const totalVerts = vertexCountX * vertexCountZ;

    const positions = new Float32Array(totalVerts * 3);
    const normals = new Float32Array(totalVerts * 3);
    const colors = new Float32Array(totalVerts * 3);
    const uvs = new Float32Array(totalVerts * 2);

    const chunkSize = WORLD_CONFIG.CHUNK_SIZE;
    let vIdx = 0;
    let uvIdx = 0;

    for (let j = 0; j <= segments; j++) {
      const v = j / segments;
      const wz = this.bounds.minZ + v * chunkSize;

      for (let i = 0; i <= segments; i++) {
        const u = i / segments;
        const wx = this.bounds.minX + u * chunkSize;
        const wy = this.getHeight(wx, wz);

        // Position
        positions[vIdx * 3] = wx;
        positions[vIdx * 3 + 1] = wy;
        positions[vIdx * 3 + 2] = wz;

        // Normal (continuous analytical normal matching neighbor chunks)
        const norm = this.getNormal(wx, wz);
        normals[vIdx * 3] = norm.x;
        normals[vIdx * 3 + 1] = norm.y;
        normals[vIdx * 3 + 2] = norm.z;

        // Blended Biome & Slope Vertex Color
        const biomes = this.getBiomes(wx, wz);
        const col = computeTerrainVertexColor(wx, wy, wz, norm, biomes);
        colors[vIdx * 3] = col.r;
        colors[vIdx * 3 + 1] = col.g;
        colors[vIdx * 3 + 2] = col.b;

        // UV
        uvs[uvIdx * 2] = u;
        uvs[uvIdx * 2 + 1] = v;

        vIdx++;
        uvIdx++;
      }
    }

    // Generate triangle indices
    const indices: number[] = [];
    for (let j = 0; j < segments; j++) {
      for (let i = 0; i < segments; i++) {
        const a = j * vertexCountX + i;
        const b = j * vertexCountX + (i + 1);
        const c = (j + 1) * vertexCountX + i;
        const d = (j + 1) * vertexCountX + (i + 1);

        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    if (this.mesh) {
      // Replace existing geometry
      const oldGeo = this.mesh.geometry;
      this.mesh.geometry = geometry;
      oldGeo.dispose();
    } else {
      // Create new mesh
      this.mesh = new THREE.Mesh(geometry, this.material);
      this.mesh.name = `TerrainChunk_${this.cx}_${this.cz}`;
      this.mesh.receiveShadow = true;
      this.mesh.castShadow = false; // Ground receives shadows from buildings & props
      parentGroup.add(this.mesh);
    }
  }

  public dispose(parentGroup: THREE.Group): void {
    this.isDisposed = true;
    if (this.mesh) {
      parentGroup.remove(this.mesh);
      if (this.mesh.geometry) {
        this.mesh.geometry.dispose();
      }
      this.mesh = null;
    }
  }
}
