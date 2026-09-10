/**
 * Zombie Haven - Cooperative Revive System
 * Manages downed states, bleedout countdowns, 8-second hold-E revive channeling,
 * and game-over detection when both players are incapacitated.
 */

import * as THREE from 'three';
import { SurvivorPlayer } from '../player/SurvivorPlayer';
import { zombieAudio } from '@/components/zombie-haven/ZombieHavenAudio';

export class ReviveSystem {
  public isReviving: boolean = false;
  public reviveProgress: number = 0; // 0 to 8 seconds
  public readonly REVIVE_DURATION = 8.0;

  constructor() {}

  /**
   * Updates revive channel and bleedout
   */
  public update(
    delta: number,
    isHoldingE: boolean,
    localPlayer: SurvivorPlayer,
    remotePos: THREE.Vector3 | null,
    isRemoteDowned: boolean,
    onRemoteRevived?: () => void
  ): { canRevive: boolean; progressPercent: number } {
    // 1. If Local Player is Downed
    if (localPlayer.stats.isDowned) {
      this.isReviving = false;
      this.reviveProgress = 0;
      return { canRevive: false, progressPercent: 0 };
    }

    // 2. Check if Remote Teammate is Downed and Nearby
    if (!remotePos || !isRemoteDowned) {
      this.isReviving = false;
      this.reviveProgress = 0;
      return { canRevive: false, progressPercent: 0 };
    }

    const dist = localPlayer.group.position.distanceTo(remotePos);
    const canRevive = dist <= 2.8;

    if (canRevive && isHoldingE) {
      this.isReviving = true;
      this.reviveProgress += delta;

      if (this.reviveProgress >= this.REVIVE_DURATION) {
        // Revive completed!
        this.isReviving = false;
        this.reviveProgress = 0;
        localPlayer.stats.revivesDone += 1;
        zombieAudio.playRevivedChime();

        if (onRemoteRevived) {
          onRemoteRevived();
        }
      }
    } else {
      // Stopped holding E or walked away
      this.isReviving = false;
      this.reviveProgress = Math.max(0, this.reviveProgress - delta * 3); // gradual decay
    }

    const progressPercent = Math.min(100, Math.round((this.reviveProgress / this.REVIVE_DURATION) * 100));
    return { canRevive, progressPercent };
  }
}
