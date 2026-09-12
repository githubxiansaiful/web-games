/**
 * DUO RAMPAGE - Wave Management System
 * Controls 5 progressive waves culminating in "The Mutant" Boss fight:
 * Wave 1: 10 Basic Runners
 * Wave 2: 14 Enemies (Runners + Ranged Shooters)
 * Wave 3: 18 Enemies (Runners + Shooters + Armored Tank)
 * Wave 4: 22 Enemies (Elite Horde with multiple Tanks)
 * Wave 5: Final Boss "THE MUTANT" (1200 HP) + Minions
 */

import { WaveState, EnemyType } from '../types';
import { duoAudio } from '../audio/DuoAudioEngine';

export class DuoWaveSystem {
  public state: WaveState;
  private spawnQueue: EnemyType[] = [];
  private spawnTimer: number = 0;
  private betweenWaveTimer: number = 3.5;

  public onSpawnEnemy?: (type: EnemyType, x: number, z: number) => void;
  public onWaveStart?: (waveNum: number) => void;
  public onWaveCleared?: (waveNum: number) => void;
  public onVictory?: () => void;

  constructor() {
    this.state = {
      currentWave: 1,
      totalWaves: 5,
      enemiesRemaining: 0,
      status: 'preparing',
      countdown: 3.0,
      waveAnnounceText: 'WAVE 1: SECTOR INVASION',
    };
  }

  public startWave(waveNum: number) {
    this.state.currentWave = waveNum;
    this.state.status = 'in_progress';
    this.spawnTimer = 0.5;

    this.spawnQueue = [];

    if (waveNum === 1) {
      this.state.waveAnnounceText = 'WAVE 1: URBAN INVASION';
      for (let i = 0; i < 10; i++) this.spawnQueue.push('basic');
    } else if (waveNum === 2) {
      this.state.waveAnnounceText = 'WAVE 2: PLASMA SNIPERS';
      for (let i = 0; i < 9; i++) this.spawnQueue.push('basic');
      for (let i = 0; i < 5; i++) this.spawnQueue.push('shooter');
    } else if (waveNum === 3) {
      this.state.waveAnnounceText = 'WAVE 3: HEAVY ARMOR BRUTES';
      for (let i = 0; i < 10; i++) this.spawnQueue.push('basic');
      for (let i = 0; i < 6; i++) this.spawnQueue.push('shooter');
      for (let i = 0; i < 2; i++) this.spawnQueue.push('tank');
    } else if (waveNum === 4) {
      this.state.waveAnnounceText = 'WAVE 4: ELITE ONSLAUGHT';
      for (let i = 0; i < 12; i++) this.spawnQueue.push('basic');
      for (let i = 0; i < 6; i++) this.spawnQueue.push('shooter');
      for (let i = 0; i < 4; i++) this.spawnQueue.push('tank');
    } else {
      this.state.waveAnnounceText = 'FINAL WAVE: THE MUTANT BOSS';
      this.state.status = 'boss_active';
      this.spawnQueue.push('boss');
      for (let i = 0; i < 6; i++) this.spawnQueue.push('basic');
      for (let i = 0; i < 4; i++) this.spawnQueue.push('shooter');
    }

    this.state.enemiesRemaining = this.spawnQueue.length;
    this.onWaveStart?.(waveNum);
    duoAudio.playCountdown(0);
  }

  public onEnemyKilled() {
    this.state.enemiesRemaining = Math.max(0, this.state.enemiesRemaining - 1);

    if (this.state.enemiesRemaining === 0 && this.spawnQueue.length === 0) {
      if (this.state.currentWave >= this.state.totalWaves) {
        this.state.status = 'victory';
        this.state.waveAnnounceText = 'CITY LIBERATED! VICTORY!';
        this.onVictory?.();
      } else {
        this.state.status = 'wave_cleared';
        this.state.waveAnnounceText = `WAVE ${this.state.currentWave} CLEARED!`;
        this.betweenWaveTimer = 3.5;
        this.onWaveCleared?.(this.state.currentWave);
      }
    }
  }

  public update(delta: number, playerX: number) {
    // 1. Initial Countdown
    if (this.state.status === 'preparing') {
      this.state.countdown -= delta;
      if (this.state.countdown <= 0) {
        this.startWave(1);
      }
      return;
    }

    // 2. Wave Cleared Intermission
    if (this.state.status === 'wave_cleared') {
      this.betweenWaveTimer -= delta;
      if (this.betweenWaveTimer <= 0) {
        this.startWave(this.state.currentWave + 1);
      }
      return;
    }

    // 3. Spawning from Queue
    if (this.spawnQueue.length > 0) {
      this.spawnTimer -= delta;
      if (this.spawnTimer <= 0) {
        this.spawnTimer = 1.2;
        const enemyType = this.spawnQueue.shift()!;

        // Spawn offscreen either left or right of player
        const spawnSide = Math.random() > 0.5 ? 1 : -1;
        const spawnX = Math.min(48, Math.max(-48, playerX + spawnSide * (18 + Math.random() * 8)));
        const spawnZ = (Math.random() - 0.5) * 6.5;

        this.onSpawnEnemy?.(enemyType, spawnX, spawnZ);
      }
    }
  }
}
