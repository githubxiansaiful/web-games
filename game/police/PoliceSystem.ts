import * as THREE from 'three';
import { Vehicle } from '../vehicles/Vehicle';
import { SoundManager } from '../core/SoundManager';
import { EventBus } from '../core/EventBus';

export class PoliceSystem {
  public wantedLevel: number = 0; // 0 to 5 Stars
  private policeVehicle: Vehicle | null = null;
  private escapeTimer: number = 0;
  private escapeDurationNeeded: number = 12.0; // Seconds to lose heat
  private isEscaping: boolean = false;

  private soundManager: SoundManager;
  private eventBus: EventBus;

  constructor(policeVehicle: Vehicle | null) {
    this.policeVehicle = policeVehicle;
    this.soundManager = SoundManager.getInstance();
    this.eventBus = EventBus.getInstance();

    // Listen to crime events
    this.eventBus.on('CRIME_COMMITTED', (data: { type: string }) => {
      if (data?.type === 'assault_civilian') {
        this.increaseWantedLevel(1);
      } else if (data?.type === 'murder') {
        this.increaseWantedLevel(2);
      }
    });

    this.eventBus.on('WEAPON_FIRED', () => {
      if (this.wantedLevel === 0 && Math.random() < 0.25) {
        this.increaseWantedLevel(1);
      }
    });
  }

  public setPoliceVehicle(vehicle: Vehicle): void {
    this.policeVehicle = vehicle;
  }

  public increaseWantedLevel(amount: number = 1): void {
    const oldLevel = this.wantedLevel;
    this.wantedLevel = Math.min(5, this.wantedLevel + amount);

    if (this.wantedLevel !== oldLevel) {
      this.escapeTimer = 0;
      this.isEscaping = false;

      // Start police siren if reaching 3+ stars
      if (this.wantedLevel >= 3 && oldLevel < 3) {
        this.soundManager.startSiren();
      }

      this.emitWantedState();
    }
  }

  public setWantedLevel(level: number): void {
    const oldLevel = this.wantedLevel;
    this.wantedLevel = Math.max(0, Math.min(5, level));

    if (this.wantedLevel !== oldLevel) {
      this.escapeTimer = 0;
      this.isEscaping = false;

      if (this.wantedLevel >= 3 && oldLevel < 3) {
        this.soundManager.startSiren();
      } else if (this.wantedLevel < 3 && oldLevel >= 3) {
        this.soundManager.stopSiren();
      }

      this.emitWantedState();
    }
  }

  public update(deltaTime: number, playerPosition: THREE.Vector3): boolean {
    if (this.wantedLevel === 0) {
      return false;
    }

    // Distance to police cruiser
    let distToPolice = 100;
    if (this.policeVehicle && !this.policeVehicle.isDead) {
      distToPolice = this.policeVehicle.position.distanceTo(playerPosition);
      this.updatePoliceVehicleAI(deltaTime, playerPosition, distToPolice);
    }

    // Escape Logic: If player is outside search radius (65m), heat cool-down timer ticks
    if (distToPolice > 65) {
      this.isEscaping = true;
      this.escapeTimer += deltaTime;

      if (this.escapeTimer >= this.escapeDurationNeeded) {
        // Escaped successfully!
        this.setWantedLevel(0);
        this.soundManager.stopSiren();
        this.soundManager.playCashSound();
        this.eventBus.emit('HEAT_ESCAPED', { rewardCash: 300 });
        return true;
      }
    } else {
      this.isEscaping = false;
      this.escapeTimer = 0;
    }

    return false;
  }

  private updatePoliceVehicleAI(deltaTime: number, playerPosition: THREE.Vector3, dist: number): void {
    const pv = this.policeVehicle!;

    if (this.wantedLevel >= 2 && dist < 160) {
      // Steer police cruiser towards player position
      const targetDir = playerPosition.clone().sub(pv.position).setY(0);
      const targetAngle = Math.atan2(targetDir.x, targetDir.z);

      const diff = targetAngle - pv.heading;
      const normalizedDiff = Math.atan2(Math.sin(diff), Math.cos(diff));

      // Steer input -1 to 1
      const steer = THREE.MathUtils.clamp(normalizedDiff * 2.5, -1, 1);
      // Throttle: full acceleration if facing roughly right way
      const throttle = Math.abs(normalizedDiff) < 1.4 ? 1.0 : 0.3;

      pv.update(deltaTime, throttle, steer, false);
    } else {
      // Idle brake
      pv.update(deltaTime, 0, 0, true);
    }
  }

  private emitWantedState(): void {
    this.eventBus.emit('WANTED_LEVEL_CHANGED', {
      wantedLevel: this.wantedLevel,
      isEscaping: this.isEscaping,
      escapeProgress: this.escapeTimer / this.escapeDurationNeeded,
    });
  }

  public reset(): void {
    this.wantedLevel = 0;
    this.escapeTimer = 0;
    this.isEscaping = false;
    this.soundManager.stopSiren();
    this.emitWantedState();
  }
}
