/**
 * DUO RAMPAGE - Player Character Entity
 * Controls movement, weapons, shooting, recoil, dash, melee, abilities,
 * down state, and teammate revive mechanics.
 */

import * as THREE from 'three';
import { PlayerRole, PlayerStats, WeaponType, TouchControlsState } from '../types';
import { DuoCartoonModelFactory, CharacterRig } from '../animation/DuoCartoonModelFactory';
import { WEAPON_CONFIGS } from '../weapons/WeaponConfig';
import { duoAudio } from '../audio/DuoAudioEngine';

export class DuoPlayerEntity {
  public stats: PlayerStats;
  public rig: CharacterRig;
  public group: THREE.Group;

  // Timers & Cooldowns
  private shotCooldown: number = 0;
  private recoilTimer: number = 0;
  private meleeTimer: number = 0;
  private isDashing: boolean = false;
  private dashDuration: number = 0;
  public shieldDuration: number = 0;

  // Callbacks
  public onShoot?: (origin: THREE.Vector3, dir: THREE.Vector3, weapon: WeaponType) => void;
  public onMelee?: (hitbox: { x: number; z: number; radius: number; damage: number }) => void;
  public onSpecialAbility?: (role: PlayerRole, pos: { x: number; z: number; facing: number }) => void;
  public onDown?: () => void;
  public onRevived?: () => void;

  constructor(id: string, name: string, role: PlayerRole, isHost: boolean, startX: number, startZ: number) {
    this.stats = {
      id,
      name,
      role,
      isHost,
      isReady: isHost,
      health: 100,
      maxHealth: 100,
      isDown: false,
      downTimer: 10.0,
      isReviving: false,
      reviveProgress: 0,
      weapon: role === 'assault' ? 'rifle' : 'shotgun',
      ammo: WEAPON_CONFIGS[role === 'assault' ? 'rifle' : 'shotgun'].magSize,
      maxAmmo: WEAPON_CONFIGS[role === 'assault' ? 'rifle' : 'shotgun'].magSize,
      isReloading: false,
      reloadProgress: 0,
      specialCooldown: 0,
      specialMaxCooldown: role === 'assault' ? 12 : 15,
      dashCooldown: 0,
      score: 0,
      kills: 0,
      x: startX,
      y: 0,
      z: startZ,
      facing: 1,
      animState: 'idle',
    };

    this.rig = DuoCartoonModelFactory.createPlayerRig(role);
    this.group = this.rig.group;
    this.group.position.set(startX, 0, startZ);
  }

  public setWeapon(weapon: WeaponType) {
    this.stats.weapon = weapon;
    const cfg = WEAPON_CONFIGS[weapon];
    this.stats.ammo = cfg.magSize;
    this.stats.maxAmmo = cfg.magSize;
    this.stats.isReloading = false;
  }

  public switchWeapon() {
    if (this.stats.isDown) return;
    const weapons: WeaponType[] = ['pistol', 'rifle', 'shotgun'];
    const currIdx = weapons.indexOf(this.stats.weapon);
    const nextIdx = (currIdx + 1) % weapons.length;
    this.setWeapon(weapons[nextIdx]);
    duoAudio.playReload();
  }

  public takeDamage(amount: number): boolean {
    if (this.stats.isDown || this.isDashing || this.shieldDuration > 0) return false;

    this.stats.health = Math.max(0, this.stats.health - amount);
    duoAudio.playPlayerHit();

    if (this.stats.health <= 0) {
      this.stats.isDown = true;
      this.stats.downTimer = 10.0;
      this.stats.isReviving = false;
      this.stats.animState = 'down';
      this.onDown?.();
      return true; // Downed!
    }
    return false;
  }

  public startReviving() {
    this.stats.isReviving = true;
  }

  public cancelReviving() {
    this.stats.isReviving = false;
    this.stats.reviveProgress = 0;
  }

  public reviveSuccess() {
    this.stats.isDown = false;
    this.stats.health = 50;
    this.stats.downTimer = 10.0;
    this.stats.isReviving = false;
    this.stats.reviveProgress = 0;
    this.stats.animState = 'idle';
    duoAudio.playReviveSuccess();
    this.onRevived?.();
  }

  public triggerDash() {
    if (this.stats.isDown || this.stats.dashCooldown > 0 || this.isDashing) return;
    this.isDashing = true;
    this.dashDuration = 0.2;
    this.stats.dashCooldown = 1.8;
    this.stats.animState = 'dash';
    duoAudio.playDash();
  }

  public triggerReload(isRampage: boolean) {
    if (this.stats.isDown || this.stats.isReloading || isRampage) return;
    if (this.stats.ammo >= this.stats.maxAmmo) return;

    this.stats.isReloading = true;
    this.stats.reloadProgress = 0;
    duoAudio.playReload();
  }

  public triggerMelee() {
    if (this.stats.isDown || this.meleeTimer > 0) return;
    this.meleeTimer = 0.45;
    this.stats.animState = 'melee';
    duoAudio.playMelee();

    const range = this.stats.role === 'heavy' ? 3.0 : 2.2;
    const damage = this.stats.role === 'heavy' ? 75 : 55;
    this.onMelee?.({
      x: this.stats.x + this.stats.facing * (range * 0.6),
      z: this.stats.z,
      radius: range,
      damage,
    });
  }

  public triggerSpecialAbility() {
    if (this.stats.isDown || this.stats.specialCooldown > 0) return;
    this.stats.specialCooldown = this.stats.specialMaxCooldown;

    if (this.stats.role === 'heavy') {
      this.shieldDuration = 4.0;
    }

    this.onSpecialAbility?.(this.stats.role, {
      x: this.stats.x,
      z: this.stats.z,
      facing: this.stats.facing,
    });
  }

  public update(
    delta: number,
    time: number,
    controls: TouchControlsState,
    isRampage: boolean
  ) {
    if (this.shieldDuration > 0) this.shieldDuration -= delta;
    if (controls.isDashing) this.triggerDash();
    if (controls.isReloading) this.triggerReload(isRampage);
    if (controls.isMelee) this.triggerMelee();
    if (controls.isSpecial) this.triggerSpecialAbility();
    // 1. If Player is DOWN: handle 10-second countdown
    if (this.stats.isDown) {
      if (!this.stats.isReviving) {
        this.stats.downTimer -= delta;
      } else {
        // Teammate is actively reviving this player
        this.stats.reviveProgress += delta / 2.5; // Takes 2.5 seconds to revive
        if (this.stats.reviveProgress >= 1.0) {
          this.reviveSuccess();
        }
      }
      this.rig.updateAnimation('down', time, this.stats.facing, 0, false);
      return;
    }

    // 2. Cooldown decays
    if (this.stats.dashCooldown > 0) this.stats.dashCooldown -= delta;
    if (this.stats.specialCooldown > 0) this.stats.specialCooldown -= delta;
    if (this.shotCooldown > 0) this.shotCooldown -= delta;
    if (this.recoilTimer > 0) this.recoilTimer -= delta;
    if (this.meleeTimer > 0) {
      this.meleeTimer -= delta;
      if (this.meleeTimer <= 0) this.stats.animState = 'idle';
    }

    // 3. Reload Progression
    const currentWeapon = WEAPON_CONFIGS[this.stats.weapon];
    if (this.stats.isReloading) {
      this.stats.reloadProgress += delta / currentWeapon.reloadTime;
      if (this.stats.reloadProgress >= 1.0) {
        this.stats.ammo = currentWeapon.magSize;
        this.stats.isReloading = false;
        this.stats.reloadProgress = 0;
      }
    }

    // 4. Movement Logic
    const baseSpeed = this.stats.role === 'assault' ? 10.5 : 9.0;
    const speedMult = isRampage ? 1.4 : 1.0;
    let speed = baseSpeed * speedMult;

    if (this.isDashing) {
      speed *= 2.8;
      this.dashDuration -= delta;
      if (this.dashDuration <= 0) {
        this.isDashing = false;
      }
    }

    let mx = controls.moveX;
    let mz = controls.moveZ;

    // Normalize diagonal movement
    const len = Math.hypot(mx, mz);
    if (len > 1.0) {
      mx /= len;
      mz /= len;
    }

    if (Math.abs(mx) > 0.05 || Math.abs(mz) > 0.05) {
      this.stats.x += mx * speed * delta;
      this.stats.z += mz * speed * delta;

      if (Math.abs(mx) > 0.1) {
        this.stats.facing = mx > 0 ? 1 : -1;
      }

      if (!this.isDashing && this.meleeTimer <= 0) {
        this.stats.animState = 'run';
      }
    } else if (!this.isDashing && this.meleeTimer <= 0) {
      this.stats.animState = 'idle';
    }

    // Clamp inside highway boundary
    this.stats.x = THREE.MathUtils.clamp(this.stats.x, -50, 50);
    this.stats.z = THREE.MathUtils.clamp(this.stats.z, -4.2, 4.2);
    this.group.position.set(this.stats.x, 0, this.stats.z);

    // 5. Shooting Mechanics
    if (controls.isShooting && this.shotCooldown <= 0 && !this.stats.isReloading && this.meleeTimer <= 0) {
      const fireInterval = 1.0 / (currentWeapon.fireRate * (isRampage ? 1.6 : 1.0));
      this.shotCooldown = fireInterval;
      this.recoilTimer = 0.12;

      // Consume ammo if not in Rampage mode
      if (!isRampage) {
        this.stats.ammo--;
        if (this.stats.ammo <= 0) {
          this.triggerReload(isRampage);
        }
      }

      duoAudio.playGunshot(this.stats.weapon);

      // Determine muzzle position & firing direction
      const muzzleWorldPos = new THREE.Vector3();
      this.rig.muzzleNode.getWorldPosition(muzzleWorldPos);

      // Aim forward with slight spread
      const dir = new THREE.Vector3(this.stats.facing, 0, 0);
      this.onShoot?.(muzzleWorldPos, dir, this.stats.weapon);
    }

    // Update Rig Procedural Animation
    this.rig.updateAnimation(
      this.stats.animState,
      time,
      this.stats.facing,
      this.recoilTimer,
      isRampage
    );
  }
}
