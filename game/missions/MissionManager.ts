import * as THREE from 'three';
import { MissionData, MISSIONS } from '../data/missionData';
import { Player } from '../player/Player';
import { PoliceSystem } from '../police/PoliceSystem';
import { SoundManager } from '../core/SoundManager';
import { EventBus } from '../core/EventBus';

export class MissionManager {
  public activeMission: MissionData | null = null;
  public currentObjectiveIndex: number = 0;
  public eliminatedHostilesCount: number = 0;

  private scene: THREE.Scene;
  private beaconGroup: THREE.Group;
  private beaconMesh: THREE.Mesh;
  private beaconMarkerRing: THREE.Mesh;
  private beaconAnimTimer: number = 0;

  // Mission Contraband Item (Briefcase)
  private contrabandMesh: THREE.Mesh | null = null;

  private soundManager: SoundManager;
  private eventBus: EventBus;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.soundManager = SoundManager.getInstance();
    this.eventBus = EventBus.getInstance();

    // 1. Build In-World 3D Waypoint Beacon
    this.beaconGroup = new THREE.Group();
    this.beaconGroup.visible = false;

    // Vertical translucent light pillar
    const beaconGeo = new THREE.CylinderGeometry(1.5, 1.5, 45, 16, 1, true);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15, // Bright yellow GPS marker
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    this.beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    this.beaconMesh.position.y = 22.5;
    this.beaconGroup.add(this.beaconMesh);

    // Ground pulsing halo ring
    const ringGeo = new THREE.RingGeometry(1.8, 2.4, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      side: THREE.DoubleSide,
    });
    this.beaconMarkerRing = new THREE.Mesh(ringGeo, ringMat);
    this.beaconMarkerRing.rotation.x = -Math.PI / 2;
    this.beaconMarkerRing.position.y = 0.08;
    this.beaconGroup.add(this.beaconMarkerRing);

    this.scene.add(this.beaconGroup);

    // Start Mission 001 automatically
    this.startMission(MISSIONS[0]);

    // Listen to hostile deaths
    this.eventBus.on('NPC_DIED', (data: { type: string }) => {
      if (data?.type === 'hostile') {
        this.eliminatedHostilesCount++;
        this.checkObjectiveProgress();
      }
    });
  }

  public startMission(mission: MissionData): void {
    this.activeMission = mission;
    this.currentObjectiveIndex = 0;
    this.eliminatedHostilesCount = 0;
    this.updateWaypointMarker();

    this.eventBus.emit('MISSION_STARTED', {
      title: mission.title,
      subtitle: mission.subtitle,
      briefing: mission.briefing,
      currentObjective: mission.objectives[0].description,
    });
  }

  public update(deltaTime: number, player: Player, police: PoliceSystem): void {
    if (!this.activeMission) return;

    // Animate beacon rotation and breathing opacity
    this.beaconAnimTimer += deltaTime;
    this.beaconGroup.rotation.y += deltaTime * 1.5;
    const pulse = 0.3 + Math.sin(this.beaconAnimTimer * 4) * 0.15;
    (this.beaconMesh.material as THREE.MeshBasicMaterial).opacity = pulse;

    const currentObj = this.activeMission.objectives[this.currentObjectiveIndex];
    if (!currentObj) return;

    // Evaluate Objective Requirements
    if (currentObj.targetType === 'enter_vehicle') {
      if (player.state === 'driving' && player.currentVehicle) {
        this.completeCurrentObjective(police);
      }
    } else if (currentObj.targetType === 'drive_to' && currentObj.targetPosition) {
      const targetPos = new THREE.Vector3(
        currentObj.targetPosition.x,
        0,
        currentObj.targetPosition.z
      );
      const dist = player.position.distanceTo(targetPos);
      const radius = currentObj.targetRadius || 10;

      if (dist <= radius) {
        this.completeCurrentObjective(police);
      }
    } else if (currentObj.targetType === 'eliminate_enemies') {
      if (this.eliminatedHostilesCount >= (currentObj.requiredCount || 3)) {
        this.completeCurrentObjective(police);
      }
    } else if (currentObj.targetType === 'collect_item') {
      if (this.contrabandMesh) {
        this.contrabandMesh.rotation.y += deltaTime * 2;
        if (this.contrabandMesh.position.distanceTo(player.position) < 3.2) {
          this.scene.remove(this.contrabandMesh);
          this.contrabandMesh = null;
          this.soundManager.playCashSound();
          this.completeCurrentObjective(police);
        }
      }
    } else if (currentObj.targetType === 'escape_police') {
      if (police.wantedLevel === 0) {
        this.completeCurrentObjective(police);
      }
    }
  }

  private completeCurrentObjective(police: PoliceSystem): void {
    if (!this.activeMission) return;

    this.currentObjectiveIndex++;

    if (this.currentObjectiveIndex >= this.activeMission.objectives.length) {
      // Entire Mission Completed!
      this.completeMission();
    } else {
      // Advance to next objective
      const nextObj = this.activeMission.objectives[this.currentObjectiveIndex];
      this.soundManager.playCashSound();

      // If next objective is collecting the item, spawn the 3D contraband container!
      if (nextObj.targetType === 'collect_item' && nextObj.targetPosition) {
        this.spawnContrabandBriefcase(nextObj.targetPosition);
      }

      // If next objective is escaping police, trigger 3-Star pursuit alert!
      if (nextObj.targetType === 'escape_police') {
        police.setWantedLevel(3);
      }

      this.updateWaypointMarker();

      this.eventBus.emit('MISSION_OBJECTIVE_COMPLETED', {
        nextObjective: nextObj.description,
        objectiveIndex: this.currentObjectiveIndex,
        totalObjectives: this.activeMission.objectives.length,
      });
    }
  }

  private completeMission(): void {
    if (!this.activeMission) return;

    const mission = this.activeMission;
    this.beaconGroup.visible = false;
    this.soundManager.playMissionComplete();

    this.eventBus.emit('MISSION_COMPLETED', {
      title: mission.title,
      rewardMoney: mission.rewardMoney,
      rewardStars: mission.rewardStars,
    });

    // Auto-advance to Mission 002 if available
    const nextMission = MISSIONS.find((m) => m.id !== mission.id);
    if (nextMission) {
      setTimeout(() => {
        this.startMission(nextMission);
      }, 5000);
    } else {
      this.activeMission = null;
    }
  }

  private checkObjectiveProgress(): void {
    if (!this.activeMission) return;
    const currentObj = this.activeMission.objectives[this.currentObjectiveIndex];
    if (currentObj && currentObj.targetType === 'eliminate_enemies') {
      const remaining = (currentObj.requiredCount || 3) - this.eliminatedHostilesCount;
      this.eventBus.emit('MISSION_PROGRESS_UPDATE', {
        detail: `Syndicate guards remaining: ${Math.max(0, remaining)}`,
      });
    }
  }

  private updateWaypointMarker(): void {
    if (!this.activeMission) {
      this.beaconGroup.visible = false;
      return;
    }

    const currentObj = this.activeMission.objectives[this.currentObjectiveIndex];
    if (currentObj && currentObj.targetPosition) {
      this.beaconGroup.position.set(
        currentObj.targetPosition.x,
        0,
        currentObj.targetPosition.z
      );
      this.beaconGroup.visible = true;
    } else {
      this.beaconGroup.visible = false;
    }
  }

  private spawnContrabandBriefcase(pos: { x: number; y: number; z: number }): void {
    if (this.contrabandMesh) {
      this.scene.remove(this.contrabandMesh);
    }

    const caseGeo = new THREE.BoxGeometry(0.8, 0.45, 0.35);
    const caseMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x0891b2,
      emissiveIntensity: 0.8,
    });
    this.contrabandMesh = new THREE.Mesh(caseGeo, caseMat);
    this.contrabandMesh.position.set(pos.x, 0.6, pos.z);

    const glowLight = new THREE.PointLight(0x06b6d4, 2, 12);
    glowLight.position.set(0, 0.4, 0);
    this.contrabandMesh.add(glowLight);

    this.scene.add(this.contrabandMesh);
  }

  public getActiveWaypoint(): THREE.Vector3 | null {
    if (this.beaconGroup.visible) {
      return this.beaconGroup.position;
    }
    return null;
  }

  public destroy(): void {
    this.scene.remove(this.beaconGroup);
    if (this.contrabandMesh) {
      this.scene.remove(this.contrabandMesh);
    }
  }
}
