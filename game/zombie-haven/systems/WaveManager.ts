/**
 * Zombie Haven - Wave Manager
 * Scales wave zombie counts according to GDD specifications,
 * manages 15-second intermission countdowns, and triggers wave banners.
 */

import { WaveState } from '../types';
import { zombieAudio } from '@/components/zombie-haven/ZombieHavenAudio';

export const WAVE_ZOMBIE_COUNTS: Record<number, number> = {
  1: 5,
  2: 8,
  3: 12,
  4: 17,
  5: 23,
  6: 30,
  7: 38,
  8: 47,
  9: 57,
  10: 68,
};

export class WaveManager {
  public state: WaveState;
  public onWaveStart?: (waveNum: number, totalZombies: number) => void;
  public onWaveComplete?: (waveNum: number) => void;

  constructor() {
    this.state = {
      currentWave: 1,
      totalZombiesInWave: WAVE_ZOMBIE_COUNTS[1] || 5,
      zombiesSpawned: 0,
      zombiesRemaining: WAVE_ZOMBIE_COUNTS[1] || 5,
      state: 'intermission',
      intermissionTimer: 8, // initial 8s prep before Wave 1
    };
  }

  public startFirstWave() {
    this.state.state = 'active';
    this.state.currentWave = 1;
    this.state.totalZombiesInWave = WAVE_ZOMBIE_COUNTS[1] || 5;
    this.state.zombiesSpawned = 0;
    this.state.zombiesRemaining = this.state.totalZombiesInWave;
    zombieAudio.playWaveStart();

    if (this.onWaveStart) {
      this.onWaveStart(1, this.state.totalZombiesInWave);
    }
  }

  public onZombieKilled() {
    this.state.zombiesRemaining = Math.max(0, this.state.zombiesRemaining - 1);

    if (this.state.zombiesRemaining === 0 && this.state.state === 'active') {
      this.completeWave();
    }
  }

  private completeWave() {
    this.state.state = 'intermission';
    this.state.intermissionTimer = 15; // 15 seconds prep between waves (from GDD)
    zombieAudio.playWaveCleared();

    if (this.onWaveComplete) {
      this.onWaveComplete(this.state.currentWave);
    }
  }

  public update(delta: number): { waveStarted: boolean } {
    if (this.state.state === 'intermission') {
      this.state.intermissionTimer -= delta;

      if (this.state.intermissionTimer <= 0) {
        // Advance to next wave
        this.state.currentWave += 1;
        const count =
          WAVE_ZOMBIE_COUNTS[this.state.currentWave] ||
          Math.floor(this.state.currentWave * 7.5 + 5);

        this.state.totalZombiesInWave = count;
        this.state.zombiesSpawned = 0;
        this.state.zombiesRemaining = count;
        this.state.state = 'active';

        zombieAudio.playWaveStart();

        if (this.onWaveStart) {
          this.onWaveStart(this.state.currentWave, count);
        }

        return { waveStarted: true };
      }
    }
    return { waveStarted: false };
  }
}
