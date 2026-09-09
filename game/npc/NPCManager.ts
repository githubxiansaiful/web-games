import * as THREE from 'three';
import { NPC } from './NPC';
import { World } from '../world/World';
import { EventBus } from '../core/EventBus';

export class NPCManager {
  public npcs: NPC[] = [];
  private scene: THREE.Scene;
  private world: World;
  private eventBus: EventBus;

  constructor(scene: THREE.Scene, world: World) {
    this.scene = scene;
    this.world = world;
    this.eventBus = EventBus.getInstance();

    this.spawnCivilians();
    this.spawnMissionGuards();

    // Listen to gunshots to alert nearby civilians to flee
    this.eventBus.on('WEAPON_FIRED', (data: { position: THREE.Vector3 }) => {
      if (data?.position) {
        this.npcs.forEach((npc) => npc.onGunshotHeard(data.position));
      }
    });
  }

  private spawnCivilians(): void {
    // Flat test map - no civilian objects
  }

  public spawnMissionGuards(): void {
    // Flat test map - no guard objects
  }

  public update(deltaTime: number, playerPosition: THREE.Vector3): number {
    let collectedCash = 0;

    for (const npc of this.npcs) {
      npc.update(deltaTime, playerPosition);

      // Check if player walks over dropped cash
      const cash = npc.checkLootPickup(playerPosition);
      if (cash > 0) {
        collectedCash += cash;
      }
    }

    return collectedCash;
  }

  public getLivingTargets(): NPC[] {
    return this.npcs.filter((n) => !n.isDead);
  }

  public destroy(): void {
    for (const npc of this.npcs) {
      this.scene.remove(npc.mesh);
      if (npc.lootCashMesh) {
        this.scene.remove(npc.lootCashMesh);
      }
    }
    this.npcs = [];
  }
}
