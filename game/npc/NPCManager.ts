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
    const civilianSpawns = [
      { pos: new THREE.Vector3(-14, 0, -25), color: 0x3b82f6 },
      { pos: new THREE.Vector3(14, 0, -20), color: 0xec4899 },
      { pos: new THREE.Vector3(-14, 0, 25), color: 0x10b981 },
      { pos: new THREE.Vector3(14, 0, 30), color: 0xf59e0b },
      { pos: new THREE.Vector3(25, 0, 10), color: 0x8b5cf6 },
      { pos: new THREE.Vector3(-25, 0, -10), color: 0x06b6d4 },
      { pos: new THREE.Vector3(60, 0, 40), color: 0xf43f5e },
      { pos: new THREE.Vector3(40, 0, 60), color: 0x64748b },
    ];

    civilianSpawns.forEach((s) => {
      const npc = new NPC('civilian', s.pos, this.world, s.color);
      this.npcs.push(npc);
      this.scene.add(npc.mesh);
    });
  }

  public spawnMissionGuards(): void {
    // 3 Hostile syndicate guards stationed at Harborview Port Warehouse (X = 280, Z = 108)
    const guardSpawns = [
      new THREE.Vector3(274, 0, 104),
      new THREE.Vector3(282, 0, 114),
      new THREE.Vector3(288, 0, 106),
    ];

    guardSpawns.forEach((pos) => {
      const guard = new NPC('hostile', pos, this.world);
      this.npcs.push(guard);
      this.scene.add(guard.mesh);
    });
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
