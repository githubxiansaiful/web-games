import { EnemyType } from '../Duo2DTypes';
import { Enemy2D } from '../characters/Enemy2D';

export interface WaveConfig2D {
  waveNumber: number;
  title: string;
  totalEnemies: number;
  spawnQueue: EnemyType[];
  spawnInterval: number;
}

export class WaveSystem2D {
  public currentWave: number = 1;
  public totalWaves: number = 5;
  public enemiesRemaining: number = 0;
  public waveAnnounceText: string = 'WAVE 1: URBAN INVASION';
  public waveAnnounceTimer: number = 3.0;

  private spawnQueue: EnemyType[] = [];
  private spawnTimer: number = 0;
  private spawnInterval: number = 1.8;
  private enemyCounter: number = 0;

  constructor() {
    this.startWave(1);
  }

  public startWave(waveNum: number) {
    this.currentWave = waveNum;
    this.spawnTimer = 0.5;

    let queue: EnemyType[] = [];
    let title = `WAVE ${waveNum}: URBAN ASSAULT`;
    let interval = 1.8;

    if (waveNum === 1) {
      title = 'WAVE 1: URBAN INVASION';
      queue = ['thug', 'thug', 'thug', 'thug', 'thug', 'thug', 'thug', 'thug'];
      interval = 2.0;
    } else if (waveNum === 2) {
      title = 'WAVE 2: AIRBORNE DRONE STRIKE';
      queue = ['thug', 'drone', 'thug', 'drone', 'thug', 'drone', 'thug', 'thug', 'drone', 'thug'];
      interval = 1.7;
    } else if (waveNum === 3) {
      title = 'WAVE 3: RIOT ENFORCERS';
      queue = ['shield', 'thug', 'drone', 'shield', 'thug', 'shield', 'drone', 'thug', 'shield', 'thug', 'shield', 'thug'];
      interval = 1.5;
    } else if (waveNum === 4) {
      title = 'WAVE 4: CYBER BRUTE RAMPAGE';
      queue = ['brute', 'shield', 'drone', 'thug', 'brute', 'shield', 'drone', 'brute', 'thug', 'shield', 'brute', 'drone', 'thug'];
      interval = 1.3;
    } else {
      title = 'WAVE 5: DHAKA TITAN MECH - BOSS ARENA';
      queue = ['boss', 'shield', 'drone', 'thug', 'brute', 'shield', 'drone'];
      interval = 2.5;
    }

    this.waveAnnounceText = title;
    this.waveAnnounceTimer = 3.5;
    this.spawnQueue = queue;
    this.enemiesRemaining = queue.length;
    this.spawnInterval = interval;
  }

  public update(dt: number, onSpawnEnemy: (enemy: Enemy2D) => void): boolean {
    if (this.waveAnnounceTimer > 0) {
      this.waveAnnounceTimer -= dt;
    }

    if (this.spawnQueue.length > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnTimer = this.spawnInterval;
        const type = this.spawnQueue.shift()!;
        this.enemyCounter++;

        // Alternate Spawning from Left (x = 80) and Right (x = 3050)
        const isLeft = this.enemyCounter % 2 === 0;
        const spawnX = isLeft ? 80 : 3050;

        // Multi-height spawns
        let spawnY = 880 - 70; // Ground
        if (type === 'drone') {
          spawnY = 400; // Sky
        } else if (this.enemyCounter % 3 === 0) {
          spawnY = 650 - 70; // Mid deck
        }

        const enemy = new Enemy2D(`enemy_${this.enemyCounter}`, type, spawnX, spawnY);
        onSpawnEnemy(enemy);
      }
    }

    return this.spawnQueue.length === 0 && this.enemiesRemaining <= 0;
  }

  public onEnemyKilled(): boolean {
    this.enemiesRemaining = Math.max(0, this.enemiesRemaining - 1);
    return this.enemiesRemaining === 0 && this.spawnQueue.length === 0;
  }
}
