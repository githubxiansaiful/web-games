/**
 * Zombie Haven - Loot & Supply System
 * Medkits (+40 HP), Ammunition Crates, and Supply Drops scattered across Deadwood Village.
 */

import * as THREE from 'three';
import { LootItem, LootType } from '../types';
import { SurvivorPlayer } from '../player/SurvivorPlayer';
import { WeaponSystem } from '../weapons/WeaponSystem';
import { zombieAudio } from '@/components/zombie-haven/ZombieHavenAudio';

export class LootSystem {
  public scene: THREE.Scene;
  public lootItems: (LootItem & { mesh: THREE.Group; light: THREE.PointLight })[] = [];
  public nearbyLoot: LootItem | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.spawnDefaultLoot();
  }

  private spawnDefaultLoot() {
    const locations: { type: LootType; x: number; z: number }[] = [
      // Town square well (moved to plaza corner with the well)
      { type: 'medkit', x: -12, z: 14 },
      { type: 'ammo_pistol', x: -16, z: 14 },
      // General store interior
      { type: 'medkit', x: 28, z: 24 },
      { type: 'ammo_shotgun', x: 26, z: 22 },
      { type: 'ammo_rifle', x: 30, z: 26 },
      // Residential Houses
      { type: 'medkit', x: -35, z: 32 },
      { type: 'ammo_pistol', x: -45, z: -18 },
      { type: 'ammo_rifle', x: 38, z: -35 },
      // Farm & Red Barn
      { type: 'medkit', x: -80, z: -85 },
      { type: 'ammo_shotgun', x: -82, z: -82 },
      { type: 'crate', x: -48, z: -120 },
      // Garage Industrial Yard
      { type: 'ammo_rifle', x: 85, z: -25 },
      { type: 'medkit', x: 82, z: -22 },
    ];

    locations.forEach((loc, idx) => {
      this.createLootMesh(`loot_${idx}`, loc.type, loc.x, loc.z);
    });
  }

  private createLootMesh(id: string, type: LootType, x: number, z: number) {
    const group = new THREE.Group();
    group.position.set(x, 0.45, z);

    let color = 0x22c55e;
    if (type === 'medkit') color = 0xef4444;
    else if (type === 'ammo_pistol') color = 0x38bdf8;
    else if (type === 'ammo_shotgun') color = 0xf59e0b;
    else if (type === 'ammo_rifle') color = 0xa855f7;

    // Box mesh
    const boxGeo = new THREE.BoxGeometry(0.55, 0.35, 0.4);
    const boxMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.4,
      metalness: 0.2,
      emissive: color,
      emissiveIntensity: 0.25,
    });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.castShadow = false;
    group.add(box);

    // Cross or icon emblem
    if (type === 'medkit') {
      const crossMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const hBar = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.42), crossMat);
      const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.25, 0.42), crossMat);
      group.add(hBar, vBar);
    }

    // Glowing Aura PointLight
    const light = new THREE.PointLight(color, 1.2, 5, 2);
    light.position.set(0, 0.5, 0);
    group.add(light);

    this.scene.add(group);

    this.lootItems.push({
      id,
      type,
      x,
      y: 0.45,
      z,
      isAvailable: true,
      mesh: group,
      light,
    });
  }

  public update(delta: number, playerPos: THREE.Vector3): LootItem | null {
    const time = performance.now() * 0.002;
    this.nearbyLoot = null;
    let closestDist = 2.4; // interact threshold

    this.lootItems.forEach((item) => {
      if (!item.isAvailable) return;

      // Bob and rotate
      item.mesh.position.y = 0.45 + Math.sin(time + item.x) * 0.08;
      item.mesh.rotation.y += delta * 1.5;

      const dist = playerPos.distanceTo(new THREE.Vector3(item.x, 0.5, item.z));
      if (dist < closestDist) {
        closestDist = dist;
        this.nearbyLoot = item;
      }
    });

    return this.nearbyLoot;
  }

  public collectLoot(item: LootItem, player: SurvivorPlayer, weapons: WeaponSystem): boolean {
    if (!item.isAvailable) return false;

    if (item.type === 'medkit') {
      if (player.stats.health >= player.stats.maxHealth) return false;
      player.stats.health = Math.min(player.stats.maxHealth, player.stats.health + 40);
    } else if (item.type === 'ammo_pistol') {
      weapons.addAmmo('pistol', 24);
    } else if (item.type === 'ammo_shotgun') {
      weapons.addAmmo('shotgun', 12);
    } else if (item.type === 'ammo_rifle') {
      weapons.addAmmo('rifle', 60);
    } else if (item.type === 'crate') {
      // Random high value supply crate
      player.stats.health = Math.min(player.stats.maxHealth, player.stats.health + 30);
      weapons.addAmmo('pistol', 12);
      weapons.addAmmo('shotgun', 6);
      weapons.addAmmo('rifle', 30);
    }

    // Hide mesh
    const found = this.lootItems.find((l) => l.id === item.id);
    if (found) {
      found.isAvailable = false;
      found.mesh.visible = false;
    }

    zombieAudio.playLootPickup();
    return true;
  }

  public respawnAll() {
    this.lootItems.forEach((l) => {
      l.isAvailable = true;
      l.mesh.visible = true;
    });
  }
}
