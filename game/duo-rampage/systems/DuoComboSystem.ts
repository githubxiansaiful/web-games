/**
 * DUO RAMPAGE - Duo Combo & Rampage Mode System
 * Rewards rapid cooperative teamwork:
 * - Increases combo count on hits
 * - Stages: x1 -> x2 -> x5 -> x10
 * - Activates 10-second RAMPAGE MODE at 15+ combo
 * - Grants unlimited ammo, double damage, and hyper speed!
 */

import { DuoComboState } from '../types';
import { duoAudio } from '../audio/DuoAudioEngine';

export class DuoComboSystem {
  public state: DuoComboState;
  private onRampageActivated?: () => void;
  private onRampageEnded?: () => void;

  constructor(callbacks?: { onRampageActivated?: () => void; onRampageEnded?: () => void }) {
    this.state = {
      count: 0,
      multiplier: 1,
      timer: 0,
      maxTimer: 4.0, // 4 seconds grace period between hits
      isRampage: false,
      rampageTimer: 0,
      rampageMaxTimer: 10.0, // 10 seconds of pure Rampage!
    };
    this.onRampageActivated = callbacks?.onRampageActivated;
    this.onRampageEnded = callbacks?.onRampageEnded;
  }

  public registerHit(): { newCombo: number; multiplier: number; rampageTriggered: boolean } {
    this.state.count++;
    this.state.timer = this.state.maxTimer;

    // Determine Multiplier
    const prevMultiplier = this.state.multiplier;
    if (this.state.count >= 25) {
      this.state.multiplier = 10;
    } else if (this.state.count >= 15) {
      this.state.multiplier = 5;
    } else if (this.state.count >= 5) {
      this.state.multiplier = 2;
    } else {
      this.state.multiplier = 1;
    }

    // Audio cue on multiplier upgrade
    if (this.state.multiplier > prevMultiplier) {
      duoAudio.playComboUp(this.state.multiplier);
    }

    // Check Rampage Mode Trigger (At 15 hits)
    let rampageTriggered = false;
    if (this.state.count >= 15 && !this.state.isRampage) {
      this.state.isRampage = true;
      this.state.rampageTimer = this.state.rampageMaxTimer;
      rampageTriggered = true;
      duoAudio.playRampageMode();
      this.onRampageActivated?.();
    } else if (this.state.isRampage) {
      // Refresh rampage timer slightly on continuous hits
      this.state.rampageTimer = Math.min(this.state.rampageMaxTimer, this.state.rampageTimer + 0.4);
    }

    return {
      newCombo: this.state.count,
      multiplier: this.state.multiplier,
      rampageTriggered,
    };
  }

  public update(delta: number) {
    // 1. Update Rampage Mode Timer
    if (this.state.isRampage) {
      this.state.rampageTimer -= delta;
      if (this.state.rampageTimer <= 0) {
        this.state.isRampage = false;
        this.state.rampageTimer = 0;
        this.onRampageEnded?.();
      }
    }

    // 2. Update Combo Decay Timer (Paused during Rampage mode)
    if (!this.state.isRampage && this.state.count > 0) {
      this.state.timer -= delta;
      if (this.state.timer <= 0) {
        this.state.count = 0;
        this.state.multiplier = 1;
        this.state.timer = 0;
      }
    }
  }

  public reset() {
    this.state.count = 0;
    this.state.multiplier = 1;
    this.state.timer = 0;
    this.state.isRampage = false;
    this.state.rampageTimer = 0;
  }
}
