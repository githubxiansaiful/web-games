/**
 * DUO RAMPAGE - 3D Cartoon Model & Rig Factory
 * Generates high-quality stylized 3D cartoon models for:
 * - Player 1 (Assault Hero)
 * - Player 2 (Heavy Hero)
 * - Basic Mutant (Fast runner)
 * - Shooter Mutant (Ranged laser/plasma)
 * - Tank Behemoth (Heavy armored brute)
 * - Boss: The Mutant (Colossal multi-phase boss)
 *
 * Each model features a structured hierarchical rig with procedural 60fps animations
 * (idle, run, shoot recoil, melee slash, dash trail, down posture, victory celebration).
 */

import * as THREE from 'three';
import { PlayerRole, EnemyType } from '../types';

export interface CharacterRig {
  group: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  gunGroup: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  muzzleNode: THREE.Object3D;
  muzzleFlash: THREE.Mesh;
  weaponType?: string;
  updateAnimation: (
    anim: 'idle' | 'run' | 'shoot' | 'melee' | 'dash' | 'down' | 'revive' | 'victory',
    time: number,
    facing: number,
    recoilTimer: number,
    isRampage?: boolean
  ) => void;
}

export class DuoCartoonModelFactory {
  /**
   * Create 3D Cartoon Player (Assault or Heavy)
   */
  public static createPlayerRig(role: PlayerRole): CharacterRig {
    const isAssault = role === 'assault';
    const group = new THREE.Group();
    group.name = `player_${role}`;

    // Color Palettes (High-contrast bright modern cartoon colors)
    const primaryMat = new THREE.MeshStandardMaterial({
      color: isAssault ? 0x0284c7 : 0xea580c, // Sky blue vs Flame Orange
      roughness: 0.35,
      metalness: 0.2,
    });
    const secondaryMat = new THREE.MeshStandardMaterial({
      color: isAssault ? 0x1e293b : 0x27272a, // Slate Dark vs Zinc
      roughness: 0.5,
      metalness: 0.1,
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: isAssault ? 0xfbcfe8 : 0xfcd34d,
      roughness: 0.6,
      metalness: 0.05,
    });
    const armorMat = new THREE.MeshStandardMaterial({
      color: isAssault ? 0x38bdf8 : 0xfbbf24, // Bright cyan vs Bright gold
      roughness: 0.25,
      metalness: 0.4,
      emissive: isAssault ? 0x0369a1 : 0xb45309,
      emissiveIntensity: 0.2,
    });
    const visorMat = new THREE.MeshBasicMaterial({
      color: isAssault ? 0x00ffff : 0xff3b30, // Cyan neon vs Red neon
    });
    const gunMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.2,
      metalness: 0.8,
    });

    const scale = isAssault ? 1.0 : 1.25;

    // Torso Group
    const torso = new THREE.Group();
    torso.position.y = 1.15 * scale;
    group.add(torso);

    const torsoGeo = new THREE.BoxGeometry(
      (isAssault ? 0.65 : 0.9) * scale,
      (isAssault ? 0.75 : 0.85) * scale,
      0.45 * scale
    );
    const torsoMesh = new THREE.Mesh(torsoGeo, primaryMat);
    torsoMesh.castShadow = true;
    torso.add(torsoMesh);

    // Armor Chestplate
    const chestGeo = new THREE.BoxGeometry(
      (isAssault ? 0.55 : 0.8) * scale,
      0.45 * scale,
      0.15 * scale
    );
    const chestMesh = new THREE.Mesh(chestGeo, armorMat);
    chestMesh.position.set(0, 0.1 * scale, 0.2 * scale);
    torso.add(chestMesh);

    // Head Group
    const head = new THREE.Group();
    head.position.y = (isAssault ? 0.55 : 0.6) * scale;
    torso.add(head);

    const headGeo = new THREE.BoxGeometry(0.45 * scale, 0.45 * scale, 0.45 * scale);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.castShadow = true;
    head.add(headMesh);

    // Helmet / Cap
    const helmGeo = new THREE.BoxGeometry(0.48 * scale, 0.22 * scale, 0.48 * scale);
    const helmMesh = new THREE.Mesh(helmGeo, secondaryMat);
    helmMesh.position.y = 0.15 * scale;
    head.add(helmMesh);

    // Glowing Tactical Visor
    const visorGeo = new THREE.BoxGeometry(0.38 * scale, 0.12 * scale, 0.1 * scale);
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.position.set(0, 0.05 * scale, 0.22 * scale);
    head.add(visorMesh);

    // Shoulders (Heavy has big shoulder pauldrons)
    if (!isAssault) {
      const pauldronGeo = new THREE.BoxGeometry(0.35 * scale, 0.35 * scale, 0.35 * scale);
      const pauldronL = new THREE.Mesh(pauldronGeo, armorMat);
      pauldronL.position.set(-0.55 * scale, 0.3 * scale, 0);
      torso.add(pauldronL);
      const pauldronR = new THREE.Mesh(pauldronGeo, armorMat);
      pauldronR.position.set(0.55 * scale, 0.3 * scale, 0);
      torso.add(pauldronR);
    }

    // Left Arm
    const armL = new THREE.Group();
    armL.position.set((-0.42 * (isAssault ? 1 : 1.3)) * scale, 0.25 * scale, 0);
    torso.add(armL);
    const armGeo = new THREE.BoxGeometry(0.22 * scale, 0.65 * scale, 0.22 * scale);
    const armLMesh = new THREE.Mesh(armGeo, primaryMat);
    armLMesh.position.y = -0.25 * scale;
    armLMesh.castShadow = true;
    armL.add(armLMesh);

    // Right Arm (Weapon Arm)
    const armR = new THREE.Group();
    armR.position.set((0.42 * (isAssault ? 1 : 1.3)) * scale, 0.25 * scale, 0);
    torso.add(armR);
    const armRMesh = new THREE.Mesh(armGeo, primaryMat);
    armRMesh.position.y = -0.25 * scale;
    armRMesh.castShadow = true;
    armR.add(armRMesh);

    // Weapon Group attached to Right Arm / Chest forward
    const gunGroup = new THREE.Group();
    gunGroup.position.set(0, -0.35 * scale, 0.35 * scale);
    armR.add(gunGroup);

    // Weapon Mesh
    const gunBodyGeo = new THREE.BoxGeometry(
      0.15 * scale,
      (isAssault ? 0.22 : 0.3) * scale,
      (isAssault ? 0.75 : 0.9) * scale
    );
    const gunBody = new THREE.Mesh(gunBodyGeo, gunMat);
    gunGroup.add(gunBody);

    const gunBarrelGeo = new THREE.CylinderGeometry(
      0.06 * scale,
      0.06 * scale,
      (isAssault ? 0.4 : 0.55) * scale,
      8
    );
    gunBarrelGeo.rotateX(Math.PI / 2);
    const gunBarrel = new THREE.Mesh(gunBarrelGeo, gunMat);
    gunBarrel.position.set(0, 0.05 * scale, (isAssault ? 0.45 : 0.6) * scale);
    gunGroup.add(gunBarrel);

    // Muzzle Attachment Node
    const muzzleNode = new THREE.Object3D();
    muzzleNode.position.set(0, 0.05 * scale, (isAssault ? 0.7 : 0.9) * scale);
    gunGroup.add(muzzleNode);

    // Cartoon Muzzle Flash (Starburst mesh)
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffea00,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const flashGeo = new THREE.SphereGeometry(0.28 * scale, 6, 6);
    const muzzleFlash = new THREE.Mesh(flashGeo, flashMat);
    muzzleNode.add(muzzleFlash);

    // Left Leg
    const legL = new THREE.Group();
    legL.position.set(-0.2 * scale, 0.75 * scale, 0);
    group.add(legL);
    const legGeo = new THREE.BoxGeometry(0.24 * scale, 0.75 * scale, 0.26 * scale);
    const legLMesh = new THREE.Mesh(legGeo, secondaryMat);
    legLMesh.position.y = -0.375 * scale;
    legLMesh.castShadow = true;
    legL.add(legLMesh);

    // Right Leg
    const legR = new THREE.Group();
    legR.position.set(0.2 * scale, 0.75 * scale, 0);
    group.add(legR);
    const legRMesh = new THREE.Mesh(legGeo, secondaryMat);
    legRMesh.position.y = -0.375 * scale;
    legRMesh.castShadow = true;
    legR.add(legRMesh);

    // Procedural Animation Loop
    const updateAnimation = (
      anim: 'idle' | 'run' | 'shoot' | 'melee' | 'dash' | 'down' | 'revive' | 'victory',
      time: number,
      facing: number,
      recoilTimer: number,
      isRampage: boolean = false
    ) => {
      // Facing rotation (facing right = 0, facing left = Math.PI)
      const targetRotationY = facing >= 0 ? 0 : Math.PI;
      group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, targetRotationY, 0.3);

      // Handle Muzzle Flash decay
      if (recoilTimer > 0) {
        muzzleFlash.visible = true;
        flashMat.opacity = Math.min(1, recoilTimer * 8);
        const scaleF = 1 + (1 - recoilTimer) * 0.8;
        muzzleFlash.scale.set(scaleF, scaleF, scaleF);
        gunGroup.position.z = (0.35 - recoilTimer * 0.2) * scale; // Gun kickback
      } else {
        muzzleFlash.visible = false;
        flashMat.opacity = 0;
        gunGroup.position.z = 0.35 * scale;
      }

      // If Rampage active, add pulsing glow
      if (isRampage) {
        armorMat.emissiveIntensity = 0.8 + Math.sin(time * 12) * 0.4;
      } else {
        armorMat.emissiveIntensity = 0.2;
      }

      if (anim === 'down') {
        // Player Down: Prone on ground
        torso.position.y = 0.3 * scale;
        torso.rotation.x = Math.PI / 2;
        torso.rotation.z = Math.PI / 4;
        legL.rotation.x = 0;
        legR.rotation.x = 0;
        armL.rotation.x = -Math.PI / 2;
        armR.rotation.x = -Math.PI / 2;
        return;
      }

      if (anim === 'victory') {
        // Victory fist pump!
        torso.position.y = (1.15 + Math.sin(time * 6) * 0.08) * scale;
        torso.rotation.x = 0;
        torso.rotation.z = 0;
        armL.rotation.x = -Math.PI * 0.85;
        armR.rotation.x = -Math.PI * 0.85;
        legL.rotation.x = 0;
        legR.rotation.x = 0;
        head.rotation.x = -0.2;
        return;
      }

      if (anim === 'dash') {
        // Forward lean dash
        torso.position.y = 0.9 * scale;
        torso.rotation.x = 0.45;
        armL.rotation.x = 0.6;
        armR.rotation.x = -0.6;
        legL.rotation.x = -0.5;
        legR.rotation.x = 0.5;
        return;
      }

      if (anim === 'run') {
        // High-energy cartoon running cycle
        const runFreq = 14;
        const bob = Math.abs(Math.sin(time * runFreq)) * 0.12 * scale;
        torso.position.y = (1.15 + bob) * scale;
        torso.rotation.x = 0.15;
        torso.rotation.z = Math.sin(time * runFreq * 0.5) * 0.08;

        legL.rotation.x = Math.sin(time * runFreq) * 0.75;
        legR.rotation.x = -Math.sin(time * runFreq) * 0.75;

        armL.rotation.x = -Math.sin(time * runFreq) * 0.6;
        armR.rotation.x = Math.sin(time * runFreq) * 0.4 - 0.3; // Stays near aiming
        head.rotation.x = -0.1;
      } else {
        // Idle animation: Gentle breathing
        const idleFreq = 3;
        const bob = Math.sin(time * idleFreq) * 0.03 * scale;
        torso.position.y = (1.15 + bob) * scale;
        torso.rotation.x = 0;
        torso.rotation.z = 0;

        legL.rotation.x = 0;
        legR.rotation.x = 0;

        armL.rotation.x = Math.sin(time * idleFreq) * 0.06;
        armR.rotation.x = -0.2 + Math.sin(time * idleFreq) * 0.04;
        head.rotation.x = 0;
      }

      // Melee Swing
      if (anim === 'melee') {
        armR.rotation.x = -Math.PI / 2 + Math.sin(time * 20) * 0.8;
        armR.rotation.y = Math.cos(time * 20) * 0.8;
      } else {
        armR.rotation.y = 0;
      }
    };

    return {
      group,
      torso,
      head,
      armL,
      armR,
      gunGroup,
      legL,
      legR,
      muzzleNode,
      muzzleFlash,
      updateAnimation,
    };
  }

  /**
   * Create 3D Cartoon Enemy Rig
   */
  public static createEnemyRig(type: EnemyType): CharacterRig {
    const group = new THREE.Group();
    group.name = `enemy_${type}`;

    let bodyColor = 0x16a34a; // Emerald green
    let eyeColor = 0xef4444; // Red glowing eyes
    let scale = 1.0;

    if (type === 'basic') {
      bodyColor = 0x4ade80; // Toxic green
      scale = 0.95;
    } else if (type === 'shooter') {
      bodyColor = 0x8b5cf6; // Cyber violet
      eyeColor = 0x06b6d4; // Cyan laser eye
      scale = 1.05;
    } else if (type === 'tank') {
      bodyColor = 0x78350f; // Armored rock brown
      eyeColor = 0xf59e0b; // Amber furnace
      scale = 1.6;
    } else if (type === 'boss') {
      bodyColor = 0x991b1b; // Crimson demon red
      eyeColor = 0xfacc15; // Electric gold
      scale = 2.4;
    }

    const matBody = new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.45,
      metalness: 0.2,
    });
    const matSpikes = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.3,
      metalness: 0.6,
    });
    const matEye = new THREE.MeshBasicMaterial({
      color: eyeColor,
    });

    // Torso
    const torso = new THREE.Group();
    torso.position.y = 1.0 * scale;
    group.add(torso);

    const torsoGeo = new THREE.BoxGeometry(0.7 * scale, 0.8 * scale, 0.5 * scale);
    const torsoMesh = new THREE.Mesh(torsoGeo, matBody);
    torsoMesh.castShadow = true;
    torso.add(torsoMesh);

    // Spikes on back / shoulders
    if (type === 'tank' || type === 'boss') {
      const spikeGeo = new THREE.ConeGeometry(0.18 * scale, 0.5 * scale, 5);
      const spike1 = new THREE.Mesh(spikeGeo, matSpikes);
      spike1.position.set(-0.35 * scale, 0.45 * scale, -0.2 * scale);
      spike1.rotation.z = 0.5;
      torso.add(spike1);
      const spike2 = new THREE.Mesh(spikeGeo, matSpikes);
      spike2.position.set(0.35 * scale, 0.45 * scale, -0.2 * scale);
      spike2.rotation.z = -0.5;
      torso.add(spike2);
    }

    // Head
    const head = new THREE.Group();
    head.position.set(0, 0.55 * scale, 0.15 * scale);
    torso.add(head);

    const headGeo = new THREE.BoxGeometry(0.45 * scale, 0.45 * scale, 0.5 * scale);
    const headMesh = new THREE.Mesh(headGeo, matBody);
    headMesh.castShadow = true;
    head.add(headMesh);

    // Glowing Eyes
    const eyeGeo = new THREE.BoxGeometry(0.12 * scale, 0.08 * scale, 0.05 * scale);
    const eyeL = new THREE.Mesh(eyeGeo, matEye);
    eyeL.position.set(-0.14 * scale, 0.05 * scale, 0.26 * scale);
    head.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, matEye);
    eyeR.position.set(0.14 * scale, 0.05 * scale, 0.26 * scale);
    head.add(eyeR);

    // Arms
    const armL = new THREE.Group();
    armL.position.set(-0.45 * scale, 0.2 * scale, 0);
    torso.add(armL);
    const armGeo = new THREE.BoxGeometry(0.24 * scale, 0.7 * scale, 0.24 * scale);
    const armLMesh = new THREE.Mesh(armGeo, matBody);
    armLMesh.position.y = -0.25 * scale;
    armLMesh.castShadow = true;
    armL.add(armLMesh);

    const armR = new THREE.Group();
    armR.position.set(0.45 * scale, 0.2 * scale, 0);
    torso.add(armR);
    const armRMesh = new THREE.Mesh(armGeo, matBody);
    armRMesh.position.y = -0.25 * scale;
    armRMesh.castShadow = true;
    armR.add(armRMesh);

    // Weapon or Claws
    const gunGroup = new THREE.Group();
    gunGroup.position.set(0, -0.35 * scale, 0.2 * scale);
    armR.add(gunGroup);

    if (type === 'shooter') {
      // Plasma Arm Cannon
      const cannonGeo = new THREE.CylinderGeometry(0.12 * scale, 0.14 * scale, 0.6 * scale, 8);
      cannonGeo.rotateX(Math.PI / 2);
      const cannonMesh = new THREE.Mesh(cannonGeo, matSpikes);
      gunGroup.add(cannonMesh);
    } else {
      // Claws / Heavy fists
      const clawGeo = new THREE.BoxGeometry(0.2 * scale, 0.3 * scale, 0.35 * scale);
      const clawMesh = new THREE.Mesh(clawGeo, matSpikes);
      gunGroup.add(clawMesh);
    }

    const muzzleNode = new THREE.Object3D();
    muzzleNode.position.set(0, 0, 0.4 * scale);
    gunGroup.add(muzzleNode);

    const flashGeo = new THREE.SphereGeometry(0.2 * scale, 6, 6);
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0 });
    const muzzleFlash = new THREE.Mesh(flashGeo, flashMat);
    muzzleNode.add(muzzleFlash);

    // Legs
    const legL = new THREE.Group();
    legL.position.set(-0.2 * scale, 0.65 * scale, 0);
    group.add(legL);
    const legGeo = new THREE.BoxGeometry(0.24 * scale, 0.65 * scale, 0.26 * scale);
    const legLMesh = new THREE.Mesh(legGeo, matBody);
    legLMesh.position.y = -0.325 * scale;
    legLMesh.castShadow = true;
    legL.add(legLMesh);

    const legR = new THREE.Group();
    legR.position.set(0.2 * scale, 0.65 * scale, 0);
    group.add(legR);
    const legRMesh = new THREE.Mesh(legGeo, matBody);
    legRMesh.position.y = -0.325 * scale;
    legRMesh.castShadow = true;
    legR.add(legRMesh);

    const updateAnimation = (
      anim: 'idle' | 'run' | 'shoot' | 'melee' | 'dash' | 'down' | 'revive' | 'victory',
      time: number,
      facing: number,
      recoilTimer: number
    ) => {
      const targetRotY = facing >= 0 ? 0 : Math.PI;
      group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, targetRotY, 0.25);

      if (anim === 'down') {
        // Enemy death collapse
        torso.position.y = THREE.MathUtils.lerp(torso.position.y, 0.15 * scale, 0.2);
        torso.rotation.x = Math.PI / 2;
        return;
      }

      const runFreq = type === 'basic' ? 15 : type === 'tank' ? 8 : 11;
      const bob = Math.abs(Math.sin(time * runFreq)) * 0.1 * scale;
      torso.position.y = (1.0 + bob) * scale;
      torso.rotation.x = 0.2; // Aggressive forward lunge

      legL.rotation.x = Math.sin(time * runFreq) * 0.7;
      legR.rotation.x = -Math.sin(time * runFreq) * 0.7;

      if (anim === 'melee') {
        armR.rotation.x = -Math.PI / 2 + Math.sin(time * 22) * 1.0;
        armL.rotation.x = -Math.PI / 2 + Math.cos(time * 22) * 1.0;
      } else {
        armR.rotation.x = -Math.sin(time * runFreq) * 0.5;
        armL.rotation.x = Math.sin(time * runFreq) * 0.5;
      }
    };

    return {
      group,
      torso,
      head,
      armL,
      armR,
      gunGroup,
      legL,
      legR,
      muzzleNode,
      muzzleFlash,
      updateAnimation,
    };
  }
}
