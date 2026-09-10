/**
 * Zombie Haven - Survivor Player 3D Character ("Xian")
 * Implemented according to Zombie Haven Character, Camera, and Shooting Specification.
 *
 * Stylized low-poly 3D survivor:
 * - 1.8m human proportions (Head 0.24m, Neck 0.10m, Torso 0.55m, Hips 0.25m, Legs 0.84m)
 * - Multi-layered stylized hair, ears, eyes, eyebrows, nose, mouth, jawline
 * - Blue survivor jacket with inner T-shirt, survival backpack, belt with pouches
 * - Dark cargo pants with knee protectors, tactical combat boots with rubber sole
 * - Dedicated right-hand WeaponSocket (weapon NEVER attached to chest)
 * - Support left-hand aiming postures for two-handed and handgun stances
 * - Dedicated Muzzle attachment points at the barrel tip of every firearm
 * - Hip pivots preventing foot floor clipping across walk, run, sprint, jump, and downed postures
 */

import * as THREE from 'three';
import { PlayerStats, WeaponType, PLAYER_MOVEMENT_CONFIG } from '../types';
import { characterGLBLoader, SurvivorSkin } from './CharacterGLBLoader';
import { gunGLBLoader } from '../weapons/GunGLBLoader';
import { ualAnimationLoader } from '../animation/UALAnimationLoader';

export class SurvivorPlayer {
  public group: THREE.Group;
  public stats: PlayerStats;
  public flashlight: THREE.SpotLight;
  public flashlightTarget: THREE.Object3D;
  public flashlightOn: boolean = false;

  // Active Skin and Model Containers
  public activeSkin: SurvivorSkin | 'procedural' = 'xian';
  public proceduralModel: THREE.Group;
  public glbModelContainer: THREE.Group;
  public ualModelContainer: THREE.Group;
  public ualModel: THREE.Group | null = null;

  // UAL 3D Skeletal Animation System
  public animMixer: THREE.AnimationMixer | null = null;
  private animActions: {
    idle?: THREE.AnimationAction;
    pistolIdle?: THREE.AnimationAction;
    walk?: THREE.AnimationAction;
    jog?: THREE.AnimationAction;
    sprint?: THREE.AnimationAction;
    jumpStart?: THREE.AnimationAction;
    jumpLoop?: THREE.AnimationAction;
    jumpLand?: THREE.AnimationAction;
    shoot?: THREE.AnimationAction;
    reload?: THREE.AnimationAction;
    hit?: THREE.AnimationAction;
    death?: THREE.AnimationAction;
  } = {};
  private currentAnimAction: THREE.AnimationAction | null = null;
  private wasGrounded: boolean = true;

  // Character body joints and segments
  private pelvis: THREE.Group;
  private torso: THREE.Group;
  private neck: THREE.Mesh;
  private head: THREE.Group;
  private leftArmPivot: THREE.Group;
  private rightArmPivot: THREE.Group;
  private leftElbowPivot: THREE.Group;
  private rightElbowPivot: THREE.Group;
  private leftHand: THREE.Group;
  private rightHand: THREE.Group;
  private leftLegPivot: THREE.Group;
  private rightLegPivot: THREE.Group;

  // Dedicated Weapon Attachment Socket on Right Hand (Spec Section 13 & 14)
  public weaponSocket: THREE.Group;

  // Procedural weapon meshes attached inside weaponSocket
  private pistolMesh: THREE.Group;
  private shotgunMesh: THREE.Group;
  private rifleMesh: THREE.Group;

  // Barrel Muzzle Attachment Points (Spec Section 16 & 32)
  public pistolMuzzle: THREE.Object3D;
  public shotgunMuzzle: THREE.Object3D;
  public rifleMuzzle: THREE.Object3D;

  public currentWeaponVisual: WeaponType = 'pistol';

  // Animation state
  private animTimer: number = 0;

  constructor(
    isLocal = true,
    customColor = 0x2563eb,
    skin: SurvivorSkin | 'procedural' = isLocal ? 'xian' : 'crimson'
  ) {
    this.group = new THREE.Group();
    this.activeSkin = skin;

    this.proceduralModel = new THREE.Group();
    this.proceduralModel.rotation.y = Math.PI; // Face -Z forward with back towards camera
    this.group.add(this.proceduralModel);

    this.glbModelContainer = new THREE.Group();
    this.group.add(this.glbModelContainer);
    this.glbModelContainer.visible = false;

    this.ualModelContainer = new THREE.Group();
    this.group.add(this.ualModelContainer);

    this.stats = {
      health: 100,
      maxHealth: 100,
      stamina: PLAYER_MOVEMENT_CONFIG.maxStamina,
      maxStamina: PLAYER_MOVEMENT_CONFIG.maxStamina,
      isSprinting: false,
      isAiming: false,
      isDowned: false,
      bleedoutTimer: 35,
      reviveProgress: 0,
      score: 0,
      kills: 0,
      revivesDone: 0,
      damageDealt: 0,
      damageReceived: 0,
    };

    // --- 1. Materials Palette (Spec Section 45) ---
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xe0a98b });
    const jacketMat = new THREE.MeshLambertMaterial({ color: customColor });
    const darkJacketMat = new THREE.MeshLambertMaterial({ color: 0x1d4ed8 });
    const shirtMat = new THREE.MeshLambertMaterial({ color: 0x334155 }); // dark charcoal inner T-shirt
    const pantsMat = new THREE.MeshLambertMaterial({ color: 0x1e293b }); // dark cargo navy
    const kneePadMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
    const bootsMat = new THREE.MeshLambertMaterial({ color: 0x18181b });
    const soleMat = new THREE.MeshLambertMaterial({ color: 0x09090b });
    const hairMat = new THREE.MeshLambertMaterial({ color: 0x18181b }); // dark black stylized hair
    const eyeScleraMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
    const browMat = new THREE.MeshBasicMaterial({ color: 0x18181b });
    const backpackMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
    const bedrollMat = new THREE.MeshLambertMaterial({ color: 0x64748b });
    const beltMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
    const buckleMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });

    // --- 2. Pelvis & Utility Belt (y = 0.98m) ---
    this.pelvis = new THREE.Group();
    this.pelvis.position.set(0, 0.98, 0);
    this.proceduralModel.add(this.pelvis);

    const beltGeo = new THREE.BoxGeometry(0.38, 0.08, 0.26);
    const beltMesh = new THREE.Mesh(beltGeo, beltMat);
    this.pelvis.add(beltMesh);

    // Belt metal buckle
    const buckleGeo = new THREE.BoxGeometry(0.08, 0.06, 0.02);
    const buckle = new THREE.Mesh(buckleGeo, buckleMat);
    buckle.position.set(0, 0, 0.135);
    this.pelvis.add(buckle);

    // Ammo pouch on hip
    const pouchGeo = new THREE.BoxGeometry(0.06, 0.09, 0.10);
    const pouch = new THREE.Mesh(pouchGeo, kneePadMat);
    pouch.position.set(0.20, -0.01, 0.02);
    this.pelvis.add(pouch);

    // --- 3. Legs & Boots (Hip Pivot at y = 0.98m) ---
    // Total leg height from hip to bottom of boot sole is exactly 0.98m
    // Bottom of boot sole rests exactly at y = 0.00 at rest!
    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-0.16, 0.98, 0);
    this.proceduralModel.add(this.leftLegPivot);

    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(0.16, 0.98, 0);
    this.proceduralModel.add(this.rightLegPivot);

    // Build leg limbs inside pivots
    [
      { pivot: this.leftLegPivot, isLeft: true },
      { pivot: this.rightLegPivot, isLeft: false },
    ].forEach(({ pivot, isLeft }) => {
      // Upper leg (Thigh) - hangs from 0 down to -0.42
      const thighGeo = new THREE.BoxGeometry(0.19, 0.40, 0.19);
      const thigh = new THREE.Mesh(thighGeo, pantsMat);
      thigh.position.set(0, -0.20, 0);
      thigh.castShadow = true;
      pivot.add(thigh);

      // Outer thigh cargo pocket
      const pocketGeo = new THREE.BoxGeometry(0.04, 0.14, 0.12);
      const pocket = new THREE.Mesh(pocketGeo, kneePadMat);
      pocket.position.set(isLeft ? -0.105 : 0.105, -0.22, 0);
      pivot.add(pocket);

      // Knee reinforcement pad at y = -0.42
      const kneeGeo = new THREE.BoxGeometry(0.17, 0.09, 0.06);
      const knee = new THREE.Mesh(kneeGeo, kneePadMat);
      knee.position.set(0, -0.41, 0.08);
      pivot.add(knee);

      // Lower leg (Calf) - hangs from -0.42 down to -0.82
      const calfGeo = new THREE.BoxGeometry(0.16, 0.38, 0.16);
      const calf = new THREE.Mesh(calfGeo, pantsMat);
      calf.position.set(0, -0.61, 0);
      calf.castShadow = true;
      pivot.add(calf);

      // Combat Boot upper
      const bootGeo = new THREE.BoxGeometry(0.18, 0.12, 0.24);
      const boot = new THREE.Mesh(bootGeo, bootsMat);
      boot.position.set(0, -0.88, 0.03);
      boot.castShadow = true;
      pivot.add(boot);

      // Rugged black rubber boot sole (hangs from -0.94 to -0.98 -> exact floor y = 0.00)
      const soleGeo = new THREE.BoxGeometry(0.20, 0.05, 0.27);
      const sole = new THREE.Mesh(soleGeo, soleMat);
      sole.position.set(0, -0.955, 0.035);
      sole.castShadow = true;
      pivot.add(sole);
    });

    // --- 4. Torso, Jacket & Survival Backpack ---
    this.torso = new THREE.Group();
    this.torso.position.set(0, 1.04, 0);
    this.proceduralModel.add(this.torso);

    // Waist / Lower Jacket
    const waistGeo = new THREE.BoxGeometry(0.38, 0.20, 0.25);
    const waist = new THREE.Mesh(waistGeo, jacketMat);
    waist.position.set(0, 0.10, 0);
    waist.castShadow = true;
    this.torso.add(waist);

    // Chest / Upper Jacket (broader shoulders)
    const chestGeo = new THREE.BoxGeometry(0.48, 0.28, 0.28);
    const chest = new THREE.Mesh(chestGeo, jacketMat);
    chest.position.set(0, 0.32, 0);
    chest.castShadow = true;
    this.torso.add(chest);

    // Shoulder trims
    const sTrimGeo = new THREE.BoxGeometry(0.12, 0.06, 0.29);
    const leftSTrim = new THREE.Mesh(sTrimGeo, darkJacketMat);
    leftSTrim.position.set(-0.21, 0.44, 0);
    this.torso.add(leftSTrim);

    const rightSTrim = new THREE.Mesh(sTrimGeo, darkJacketMat);
    rightSTrim.position.set(0.21, 0.44, 0);
    this.torso.add(rightSTrim);

    // Inner dark T-shirt exposed at open V-neck
    const shirtGeo = new THREE.BoxGeometry(0.18, 0.16, 0.04);
    const innerShirt = new THREE.Mesh(shirtGeo, shirtMat);
    innerShirt.position.set(0, 0.35, 0.135);
    this.torso.add(innerShirt);

    // Survival Backpack on back
    const packGeo = new THREE.BoxGeometry(0.34, 0.36, 0.15);
    const backpack = new THREE.Mesh(packGeo, backpackMat);
    backpack.position.set(0, 0.28, -0.19);
    backpack.castShadow = true;
    this.torso.add(backpack);

    // Bedroll / sleeping mat on top of pack
    const bedrollGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.36, 8);
    const bedroll = new THREE.Mesh(bedrollGeo, bedrollMat);
    bedroll.rotation.z = Math.PI / 2;
    bedroll.position.set(0, 0.48, -0.19);
    this.torso.add(bedroll);

    // Backpack front straps
    const strapGeo = new THREE.BoxGeometry(0.05, 0.34, 0.03);
    const leftStrap = new THREE.Mesh(strapGeo, backpackMat);
    leftStrap.position.set(-0.16, 0.31, 0.135);
    this.torso.add(leftStrap);

    const rightStrap = new THREE.Mesh(strapGeo, backpackMat);
    rightStrap.position.set(0.16, 0.31, 0.135);
    this.torso.add(rightStrap);

    // --- 5. Neck, Head & Stylized Face (Spec Section 3 & 4) ---
    const neckGeo = new THREE.BoxGeometry(0.14, 0.09, 0.14);
    this.neck = new THREE.Mesh(neckGeo, skinMat);
    this.neck.position.set(0, 0.49, 0.01);
    this.torso.add(this.neck);

    this.head = new THREE.Group();
    this.head.position.set(0, 0.64, 0.03);
    this.torso.add(this.head);

    // Head base block
    const headGeo = new THREE.BoxGeometry(0.26, 0.23, 0.26);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.castShadow = true;
    this.head.add(headMesh);

    // Defined chin / jawline
    const chinGeo = new THREE.BoxGeometry(0.16, 0.07, 0.10);
    const chin = new THREE.Mesh(chinGeo, skinMat);
    chin.position.set(0, -0.11, 0.07);
    this.head.add(chin);

    // Left and Right stylized ears
    const earGeo = new THREE.BoxGeometry(0.03, 0.07, 0.05);
    const leftEar = new THREE.Mesh(earGeo, skinMat);
    leftEar.position.set(-0.135, -0.01, -0.01);
    this.head.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, skinMat);
    rightEar.position.set(0.135, -0.01, -0.01);
    this.head.add(rightEar);

    // Stylized Face Features
    // Eyes: white sclera
    const eyeWhiteGeo = new THREE.BoxGeometry(0.05, 0.025, 0.02);
    const leftEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeScleraMat);
    leftEyeWhite.position.set(-0.065, 0.015, 0.132);
    this.head.add(leftEyeWhite);

    const rightEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeScleraMat);
    rightEyeWhite.position.set(0.065, 0.015, 0.132);
    this.head.add(rightEyeWhite);

    // Pupils: dark focused pupils
    const pupilGeo = new THREE.BoxGeometry(0.025, 0.025, 0.02);
    const leftPupil = new THREE.Mesh(pupilGeo, eyePupilMat);
    leftPupil.position.set(-0.065, 0.015, 0.137);
    this.head.add(leftPupil);

    const rightPupil = new THREE.Mesh(pupilGeo, eyePupilMat);
    rightPupil.position.set(0.065, 0.015, 0.137);
    this.head.add(rightPupil);

    // Eyebrows
    const browGeo = new THREE.BoxGeometry(0.06, 0.016, 0.02);
    const leftBrow = new THREE.Mesh(browGeo, browMat);
    leftBrow.position.set(-0.065, 0.05, 0.135);
    leftBrow.rotation.z = -0.08;
    this.head.add(leftBrow);

    const rightBrow = new THREE.Mesh(browGeo, browMat);
    rightBrow.position.set(0.065, 0.05, 0.135);
    rightBrow.rotation.z = 0.08;
    this.head.add(rightBrow);

    // Nose: small stylized bridge
    const noseGeo = new THREE.BoxGeometry(0.035, 0.05, 0.04);
    const nose = new THREE.Mesh(noseGeo, skinMat);
    nose.position.set(0, -0.015, 0.145);
    this.head.add(nose);

    // Mouth line
    const mouthGeo = new THREE.BoxGeometry(0.07, 0.015, 0.02);
    const mouth = new THREE.Mesh(mouthGeo, browMat);
    mouth.position.set(0, -0.07, 0.132);
    this.head.add(mouth);

    // Layered Stylized Hair (Spec Section 4)
    // Main top hair cap
    const hairTopGeo = new THREE.BoxGeometry(0.28, 0.10, 0.28);
    const hairTop = new THREE.Mesh(hairTopGeo, hairMat);
    hairTop.position.set(0, 0.12, -0.01);
    this.head.add(hairTop);

    // Front bangs swept across forehead
    const bangsGeo = new THREE.BoxGeometry(0.22, 0.06, 0.07);
    const bangs = new THREE.Mesh(bangsGeo, hairMat);
    bangs.position.set(0.02, 0.08, 0.12);
    bangs.rotation.z = -0.06;
    this.head.add(bangs);

    // Left & Right sideburns
    const sideburnGeo = new THREE.BoxGeometry(0.035, 0.10, 0.08);
    const leftBurn = new THREE.Mesh(sideburnGeo, hairMat);
    leftBurn.position.set(-0.135, 0.04, 0.03);
    this.head.add(leftBurn);

    const rightBurn = new THREE.Mesh(sideburnGeo, hairMat);
    rightBurn.position.set(0.135, 0.04, 0.03);
    this.head.add(rightBurn);

    // Back hair taper
    const hairBackGeo = new THREE.BoxGeometry(0.27, 0.12, 0.05);
    const hairBack = new THREE.Mesh(hairBackGeo, hairMat);
    hairBack.position.set(0, 0.02, -0.135);
    this.head.add(hairBack);

    // --- 6. Arms, Elbows, Hands & Dedicated WeaponSocket (Spec Section 6, 7, 13, 14) ---
    // Shoulder joints at upper corners of chest (y = 0.40 in torso coords)
    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-0.29, 0.40, 0);
    this.torso.add(this.leftArmPivot);

    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.29, 0.40, 0);
    this.torso.add(this.rightArmPivot);

    // Left Arm Hierarchy: Shoulder -> Upper Arm -> Elbow -> Forearm -> Hand
    const upperArmGeo = new THREE.BoxGeometry(0.15, 0.28, 0.15);
    const leftUpperArm = new THREE.Mesh(upperArmGeo, jacketMat);
    leftUpperArm.position.set(0, -0.14, 0);
    leftUpperArm.castShadow = true;
    this.leftArmPivot.add(leftUpperArm);

    this.leftElbowPivot = new THREE.Group();
    this.leftElbowPivot.position.set(0, -0.28, 0);
    this.leftArmPivot.add(this.leftElbowPivot);

    const forearmGeo = new THREE.BoxGeometry(0.13, 0.26, 0.13);
    const leftForearm = new THREE.Mesh(forearmGeo, jacketMat);
    leftForearm.position.set(0, -0.13, 0);
    leftForearm.castShadow = true;
    this.leftElbowPivot.add(leftForearm);

    this.leftHand = new THREE.Group();
    this.leftHand.position.set(0, -0.26, 0);
    this.leftElbowPivot.add(this.leftHand);

    const handGeo = new THREE.BoxGeometry(0.09, 0.11, 0.11);
    const leftHandMesh = new THREE.Mesh(handGeo, skinMat);
    leftHandMesh.position.set(0, -0.05, 0);
    this.leftHand.add(leftHandMesh);

    // Right Arm Hierarchy: Shoulder -> Upper Arm -> Elbow -> Forearm -> Hand -> WeaponSocket
    const rightUpperArm = new THREE.Mesh(upperArmGeo, jacketMat);
    rightUpperArm.position.set(0, -0.14, 0);
    rightUpperArm.castShadow = true;
    this.rightArmPivot.add(rightUpperArm);

    this.rightElbowPivot = new THREE.Group();
    this.rightElbowPivot.position.set(0, -0.28, 0);
    this.rightArmPivot.add(this.rightElbowPivot);

    const rightForearm = new THREE.Mesh(forearmGeo, jacketMat);
    rightForearm.position.set(0, -0.13, 0);
    rightForearm.castShadow = true;
    this.rightElbowPivot.add(rightForearm);

    this.rightHand = new THREE.Group();
    this.rightHand.position.set(0, -0.26, 0);
    this.rightElbowPivot.add(this.rightHand);

    const rightHandMesh = new THREE.Mesh(handGeo, skinMat);
    rightHandMesh.position.set(0, -0.05, 0);
    this.rightHand.add(rightHandMesh);

    // WeaponSocket: attached directly to right hand (Spec Section 14)
    // The weapon is structurally attached to the hand and follows all hand rotations
    this.weaponSocket = new THREE.Group();
    this.weaponSocket.position.set(0, -0.05, 0.06);
    this.rightHand.add(this.weaponSocket);

    // Build procedural weapons with dedicated Muzzle points (Spec Section 15 & 16)
    const { group: pistol, muzzle: pMuzzle } = this.buildPistolModel();
    this.pistolMesh = pistol;
    this.pistolMuzzle = pMuzzle;
    this.weaponSocket.add(this.pistolMesh);

    const { group: shotgun, muzzle: sMuzzle } = this.buildShotgunModel();
    this.shotgunMesh = shotgun;
    this.shotgunMuzzle = sMuzzle;
    this.weaponSocket.add(this.shotgunMesh);

    const { group: rifle, muzzle: rMuzzle } = this.buildRifleModel();
    this.rifleMesh = rifle;
    this.rifleMuzzle = rMuzzle;
    this.weaponSocket.add(this.rifleMesh);

    this.setWeaponVisual('pistol');

    // --- 7. Tactical Flashlight ---
    this.flashlightTarget = new THREE.Object3D();
    this.flashlightTarget.position.set(0, 1.2, -30);
    this.group.add(this.flashlightTarget);

    this.flashlight = new THREE.SpotLight(0xfef9c3, 0, 42, Math.PI / 5.5, 0.4, 1.2);
    this.flashlight.position.set(0.22, 1.4, -0.15);
    this.flashlight.target = this.flashlightTarget;
    this.flashlight.castShadow = isLocal;
    this.group.add(this.flashlight);

    // Asynchronously load low-poly 3D character pack model
    if (this.activeSkin !== 'procedural') {
      this.loadGLBCharacter(this.activeSkin);
    }

    // Asynchronously load low-poly 3D firearms pack
    this.loadGLBGuns();

    // Asynchronously load UAL 3D rigged character with 43 animations
    this.loadUALCharacter(customColor);
  }

  /**
   * Builds tactical pistol with grip in palm and forward muzzle
   */
  private buildPistolModel(): { group: THREE.Group; muzzle: THREE.Object3D } {
    const group = new THREE.Group();
    const gunMetal = new THREE.MeshLambertMaterial({ color: 0x18181b });
    const slideMetal = new THREE.MeshLambertMaterial({ color: 0x27272a });

    // Grip fits in right palm
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.12, 0.07), gunMetal);
    grip.rotation.x = -0.15;
    group.add(grip);

    // Slide & Barrel
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.065, 0.22), slideMetal);
    slide.position.set(0, 0.07, 0.06);
    group.add(slide);

    // Barrel Muzzle point at tip of barrel (Spec Section 16)
    const muzzle = new THREE.Object3D();
    muzzle.position.set(0, 0.07, 0.18);
    group.add(muzzle);

    return { group, muzzle };
  }

  /**
   * Builds pump-action shotgun with stock, receiver, pump slide, and forward muzzle
   */
  private buildShotgunModel(): { group: THREE.Group; muzzle: THREE.Object3D } {
    const group = new THREE.Group();
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x78350f }); // walnut stock
    const steelMat = new THREE.MeshLambertMaterial({ color: 0x27272a });

    // Stock extends back behind hand
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.10, 0.28), woodMat);
    stock.position.set(0, 0.02, -0.16);
    group.add(stock);

    // Receiver above grip
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.08, 0.20), steelMat);
    receiver.position.set(0, 0.06, 0.08);
    group.add(receiver);

    // Long Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.55, 8), steelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.065, 0.44);
    group.add(barrel);

    // Tubular Magazine underneath barrel
    const mag = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.48, 8), steelMat);
    mag.rotation.x = Math.PI / 2;
    mag.position.set(0, 0.03, 0.40);
    group.add(mag);

    // Pump slide (fore-end where left hand supports)
    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.16), woodMat);
    pump.position.set(0, 0.035, 0.36);
    group.add(pump);

    // Muzzle attachment at barrel tip
    const muzzle = new THREE.Object3D();
    muzzle.position.set(0, 0.065, 0.72);
    group.add(muzzle);

    return { group, muzzle };
  }

  /**
   * Builds M4A1 tactical carbine with stock, mag, handguard, barrel, and flash hider
   */
  private buildRifleModel(): { group: THREE.Group; muzzle: THREE.Object3D } {
    const group = new THREE.Group();
    const carbineMat = new THREE.MeshLambertMaterial({ color: 0x1c1917 });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });

    // Stock extending rearward
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.11, 0.26), darkMat);
    stock.position.set(0, 0.03, -0.15);
    group.add(stock);

    // Receiver & Carry Handle / Sight
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.26), carbineMat);
    receiver.position.set(0, 0.06, 0.09);
    group.add(receiver);

    // Curved 30-round magazine extending down
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.18, 0.08), darkMat);
    mag.position.set(0, -0.08, 0.12);
    mag.rotation.x = 0.2;
    group.add(mag);

    // Handguard / Fore-end (where left hand grips)
    const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.07, 0.24), darkMat);
    handguard.position.set(0, 0.06, 0.32);
    group.add(handguard);

    // Barrel & Flash Hider
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.30, 8), carbineMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.06, 0.54);
    group.add(barrel);

    // Muzzle attachment at tip of barrel
    const muzzle = new THREE.Object3D();
    muzzle.position.set(0, 0.06, 0.70);
    group.add(muzzle);

    return { group, muzzle };
  }

  /**
   * Returns exact world-space position of active firearm muzzle (Spec Section 32)
   * Guaranteed to be outside the character body and at the actual barrel tip
   */
  public getMuzzleWorldPosition(): THREE.Vector3 {
    let activeMuzzle = this.pistolMuzzle;
    if (this.currentWeaponVisual === 'shotgun') activeMuzzle = this.shotgunMuzzle;
    else if (this.currentWeaponVisual === 'rifle') activeMuzzle = this.rifleMuzzle;

    const worldPos = new THREE.Vector3();
    activeMuzzle.getWorldPosition(worldPos);
    return worldPos;
  }

  public setWeaponVisual(weapon: WeaponType) {
    this.currentWeaponVisual = weapon;
    this.pistolMesh.visible = weapon === 'pistol';
    this.shotgunMesh.visible = weapon === 'shotgun';
    this.rifleMesh.visible = weapon === 'rifle';
  }

  public toggleFlashlight(): boolean {
    this.flashlightOn = !this.flashlightOn;
    this.flashlight.intensity = this.flashlightOn ? 2.5 : 0;
    return this.flashlightOn;
  }

  /**
   * Asynchronously loads and attaches the 3D low-poly survivor character model from GLB pack
   */
  public async loadGLBCharacter(skin: SurvivorSkin) {
    try {
      await characterGLBLoader.load();
      if (this.activeSkin === 'procedural') return;

      const model = characterGLBLoader.getCharacterModel(this.activeSkin as SurvivorSkin);
      if (model) {
        while (this.glbModelContainer.children.length > 0) {
          const child = this.glbModelContainer.children[0];
          if (child === this.weaponSocket) {
            this.group.add(this.weaponSocket);
          } else {
            this.glbModelContainer.remove(child);
          }
        }

        this.glbModelContainer.add(model);
        this.glbModelContainer.add(this.weaponSocket);
        this.glbModelContainer.visible = true;
        this.proceduralModel.visible = false;

        this.weaponSocket.position.set(0.28, 0.95, -0.25);
        this.weaponSocket.rotation.set(0.15, Math.PI, 0);
      }
    } catch (err) {
      console.warn('[SurvivorPlayer] Fallback to procedural model:', err);
      this.proceduralModel.visible = true;
      this.glbModelContainer.visible = false;
    }
  }

  /**
   * Asynchronously loads and upgrades weapons to authentic Quaternius 3D models
   */
  public async loadGLBGuns() {
    try {
      await gunGLBLoader.load();
      const p = gunGLBLoader.getGunModel('pistol');
      if (p) {
        this.weaponSocket.remove(this.pistolMesh);
        this.pistolMesh = p.group;
        this.pistolMuzzle = p.muzzle;
        this.weaponSocket.add(this.pistolMesh);
      }

      const s = gunGLBLoader.getGunModel('shotgun');
      if (s) {
        this.weaponSocket.remove(this.shotgunMesh);
        this.shotgunMesh = s.group;
        this.shotgunMuzzle = s.muzzle;
        this.weaponSocket.add(this.shotgunMesh);
      }

      const r = gunGLBLoader.getGunModel('rifle');
      if (r) {
        this.weaponSocket.remove(this.rifleMesh);
        this.rifleMesh = r.group;
        this.rifleMuzzle = r.muzzle;
        this.weaponSocket.add(this.rifleMesh);
      }

      this.setWeaponVisual(this.currentWeaponVisual);
    } catch (err) {
      console.warn('[SurvivorPlayer] Could not load 3D guns, keeping procedural models:', err);
    }
  }

  /**
   * Asynchronously loads and initializes UAL 3D rigged character with 43 animations
   */
  public async loadUALCharacter(customColor: number = 0x1d4ed8) {
    try {
      await ualAnimationLoader.load();
      const model = ualAnimationLoader.getMannequinModel();
      if (!model) return;

      while (this.ualModelContainer.children.length > 0) {
        this.ualModelContainer.remove(this.ualModelContainer.children[0]);
      }

      this.ualModel = model;
      // Rotate 180 degrees around Y so model faces -Z forward with back to camera (+Z)
      this.ualModel.rotation.y = Math.PI;

      // Custom survivor styling for mannequin skinned meshes
      this.ualModel.traverse((child: any) => {
        if (child.isSkinnedMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.name === 'Mannequin_1') {
            child.material = new THREE.MeshStandardMaterial({
              color: customColor,
              roughness: 0.45,
              metalness: 0.15,
            });
          } else if (child.name === 'Mannequin_2') {
            child.material = new THREE.MeshStandardMaterial({
              color: 0x1e293b,
              roughness: 0.65,
              metalness: 0.25,
            });
          }
        }
      });

      // Attach weaponSocket to right hand bone
      const handR = this.ualModel.getObjectByName('hand_r');
      if (handR) {
        handR.add(this.weaponSocket);
        this.weaponSocket.position.set(0, 0.07, 0.03);
        this.weaponSocket.rotation.set(-Math.PI / 2, 0, 0);
      }

      // Setup Animation Mixer & Actions
      this.animMixer = new THREE.AnimationMixer(this.ualModel);

      const getAction = (clipName: string) => {
        const clip = ualAnimationLoader.getClip(clipName);
        return clip ? this.animMixer!.clipAction(clip) : undefined;
      };

      this.animActions = {
        idle: getAction('Idle_Loop'),
        pistolIdle: getAction('Pistol_Idle_Loop'),
        walk: getAction('Walk_Loop'),
        jog: getAction('Jog_Fwd_Loop'),
        sprint: getAction('Sprint_Loop'),
        jumpStart: getAction('Jump_Start'),
        jumpLoop: getAction('Jump_Loop'),
        jumpLand: getAction('Jump_Land'),
        shoot: getAction('Pistol_Shoot'),
        reload: getAction('Pistol_Reload'),
        hit: getAction('Hit_Chest'),
        death: getAction('Death01'),
      };

      if (this.animActions.shoot) {
        this.animActions.shoot.setLoop(THREE.LoopOnce, 1);
        this.animActions.shoot.clampWhenFinished = false;
      }
      if (this.animActions.reload) {
        this.animActions.reload.setLoop(THREE.LoopOnce, 1);
        this.animActions.reload.clampWhenFinished = false;
      }
      if (this.animActions.hit) {
        this.animActions.hit.setLoop(THREE.LoopOnce, 1);
      }
      if (this.animActions.death) {
        this.animActions.death.setLoop(THREE.LoopOnce, 1);
        this.animActions.death.clampWhenFinished = true;
      }

      // Start in idle
      if (this.animActions.idle) {
        this.animActions.idle.play();
        this.currentAnimAction = this.animActions.idle;
      }

      this.ualModelContainer.add(this.ualModel);
      this.ualModelContainer.visible = true;
      this.proceduralModel.visible = false;
      this.glbModelContainer.visible = false;
    } catch (err) {
      console.warn('[SurvivorPlayer] Failed to load UAL animated character:', err);
    }
  }

  public playJump() {
    if (this.animActions.jumpStart) {
      this.animActions.jumpStart.reset().play();
    }
  }

  public playShoot() {
    if (this.animActions.shoot) {
      this.animActions.shoot.reset().play();
    }
  }

  public playReload() {
    if (this.animActions.reload) {
      this.animActions.reload.reset().play();
    }
  }

  public playHit() {
    if (this.animActions.hit) {
      this.animActions.hit.reset().play();
    }
  }

  /**
   * Switches active character skin between Xian, Crimson, Marcus, Elena, or procedural
   */
  public setSkin(skin: SurvivorSkin | 'procedural') {
    this.activeSkin = skin;
    if (skin === 'procedural') {
      this.glbModelContainer.visible = false;
      this.proceduralModel.visible = true;
      this.rightHand.add(this.weaponSocket);
      this.weaponSocket.position.set(0, -0.05, 0.06);
      this.weaponSocket.rotation.set(0, 0, 0);
      return;
    }

    const model = characterGLBLoader.getCharacterModel(skin);
    if (model) {
      while (this.glbModelContainer.children.length > 0) {
        const child = this.glbModelContainer.children[0];
        if (child === this.weaponSocket) {
          this.group.add(this.weaponSocket);
        } else {
          this.glbModelContainer.remove(child);
        }
      }

      this.glbModelContainer.add(model);
      this.glbModelContainer.add(this.weaponSocket);
      this.glbModelContainer.visible = true;
      this.proceduralModel.visible = false;
      this.weaponSocket.position.set(0.28, 0.95, -0.25);
      this.weaponSocket.rotation.set(0.15, Math.PI, 0);
    } else {
      this.loadGLBCharacter(skin);
    }
  }

  /**
   * Cycles to the next available survivor skin
   */
  public cycleNextSkin(): string {
    const skinOrder: (SurvivorSkin | 'procedural')[] = ['xian', 'marcus', 'crimson', 'elena', 'procedural'];
    const currentIdx = skinOrder.indexOf(this.activeSkin);
    const nextIdx = (currentIdx + 1) % skinOrder.length;
    const nextSkin = skinOrder[nextIdx];
    this.setSkin(nextSkin);
    return nextSkin;
  }

  public applyDamage(dmg: number) {
    if (this.stats.isDowned || this.stats.health <= 0) return;

    this.stats.health = Math.max(0, this.stats.health - dmg);
    this.stats.damageReceived += dmg;

    if (this.stats.health === 0) {
      this.enterDownedState();
    }
  }

  public enterDownedState() {
    this.stats.isDowned = true;
    this.stats.isSprinting = false;
    this.stats.bleedoutTimer = 35;
    this.stats.reviveProgress = 0;

    if (this.animActions.death) {
      if (this.currentAnimAction) this.currentAnimAction.fadeOut(0.2);
      this.animActions.death.reset().fadeIn(0.2).play();
      this.currentAnimAction = this.animActions.death;
    }

    if (this.glbModelContainer.visible) {
      // GLB model crawling posture safely above floor (y >= 0.15m)
      this.glbModelContainer.position.set(0, 0.18, -0.4);
      this.glbModelContainer.rotation.set(Math.PI / 2.2, 0, 0);
      this.weaponSocket.position.set(0.18, 0.22, 0.1);
      this.weaponSocket.rotation.set(Math.PI / 2.2, 0, 0);
    } else {
      // Realistic procedural crawling / downed posture on the ground (safely above floor: all y >= 0.12m)
      this.torso.position.set(0, 0.35, -0.12);
      this.torso.rotation.set(Math.PI / 2.2, 0, 0);

      this.leftLegPivot.position.set(-0.16, 0.26, -0.52);
      this.rightLegPivot.position.set(0.16, 0.26, -0.52);
      this.leftLegPivot.rotation.set(Math.PI / 2.1, 0, -0.15);
      this.rightLegPivot.rotation.set(Math.PI / 2.1, 0, 0.15);

      this.leftArmPivot.rotation.set(-0.3, 0, 0.35);
      this.rightArmPivot.rotation.set(-0.3, 0, -0.35);
      this.leftElbowPivot.rotation.set(0, 0, 0);
      this.rightElbowPivot.rotation.set(0, 0, 0);
    }
  }

  public revive() {
    this.stats.isDowned = false;
    this.stats.health = 50; // revive with 50% HP
    this.stats.reviveProgress = 0;

    if (this.animActions.death) this.animActions.death.fadeOut(0.3);
    if (this.animActions.idle) {
      this.animActions.idle.reset().fadeIn(0.3).play();
      this.currentAnimAction = this.animActions.idle;
    }

    if (this.glbModelContainer.visible) {
      this.glbModelContainer.position.set(0, 0, 0);
      this.glbModelContainer.rotation.set(0, 0, 0);
      this.weaponSocket.position.set(0.30, 0.90, 0.20);
      this.weaponSocket.rotation.set(0.25, 0, 0);
    } else {
      // Stand back up to upright position
      this.torso.position.set(0, 1.04, 0);
      this.torso.rotation.set(0, 0, 0);

      this.leftLegPivot.position.set(-0.16, 0.98, 0);
      this.rightLegPivot.position.set(0.16, 0.98, 0);
      this.leftLegPivot.rotation.set(0, 0, 0);
      this.rightLegPivot.rotation.set(0, 0, 0);

      this.leftArmPivot.rotation.set(0, 0, 0);
      this.rightArmPivot.rotation.set(0, 0, 0);
      this.leftElbowPivot.rotation.set(0, 0, 0);
      this.rightElbowPivot.rotation.set(0, 0, 0);
    }
  }

  public update(
    delta: number,
    velocity: THREE.Vector3,
    isAiming: boolean,
    isSprinting: boolean,
    isGrounded: boolean = true
  ) {
    // Stamina drain and regeneration (Spec Section 12)
    if (isSprinting && velocity.lengthSq() > 0.1 && !this.stats.isDowned) {
      this.stats.stamina = Math.max(0, this.stats.stamina - delta * PLAYER_MOVEMENT_CONFIG.sprintDrainRate);
      if (this.stats.stamina === 0) {
        this.stats.isSprinting = false;
      } else {
        this.stats.isSprinting = true;
      }
    } else {
      this.stats.isSprinting = false;
      this.stats.stamina = Math.min(
        this.stats.maxStamina,
        this.stats.stamina + delta * PLAYER_MOVEMENT_CONFIG.staminaRecoveryRate
      );
    }

    this.stats.isAiming = isAiming;

    // Downed Bleedout Timer
    if (this.stats.isDowned) {
      this.stats.bleedoutTimer -= delta;
      if (this.animMixer) this.animMixer.update(delta);
      return;
    }

    const speed = velocity.length();
    const isMoving = speed > 0.15;

    // --- 0. UAL 3D Skeletal Animation System (Universal Animation Library) ---
    if (this.animMixer && this.ualModelContainer.visible) {
      this.animMixer.update(delta);

      let targetAction: THREE.AnimationAction | undefined = this.animActions.idle;

      if (this.stats.isDowned) {
        targetAction = this.animActions.death;
      } else if (!isGrounded) {
        targetAction = this.animActions.jumpLoop;
      } else if (isMoving) {
        if (isSprinting) {
          targetAction = this.animActions.sprint;
          if (targetAction) targetAction.timeScale = 1.15;
        } else if (speed > 3.0) {
          targetAction = this.animActions.jog;
          if (targetAction) targetAction.timeScale = speed / 4.0;
        } else {
          targetAction = this.animActions.walk;
          if (targetAction) targetAction.timeScale = speed / 2.5;
        }
      } else {
        if (isAiming) {
          targetAction = this.animActions.pistolIdle || this.animActions.idle;
        } else {
          targetAction = this.animActions.idle;
        }
      }

      // Landing transition trigger
      if (isGrounded && !this.wasGrounded) {
        if (this.animActions.jumpLand) {
          this.animActions.jumpLand.reset().play();
        }
      }
      this.wasGrounded = isGrounded;

      // Smooth crossfade between locomotion actions
      if (targetAction && this.currentAnimAction !== targetAction) {
        if (this.currentAnimAction) {
          this.currentAnimAction.fadeOut(0.18);
        }
        targetAction.reset().fadeIn(0.18).play();
        this.currentAnimAction = targetAction;
      }
      return;
    }

    // --- A. GLB Model Animation ---
    if (this.glbModelContainer.visible) {
      if (isMoving) {
        const animSpeed = isSprinting ? 12.5 : 8.0;
        this.animTimer += delta * animSpeed;

        // Rhythmic walking/running step bobbing and turn lean
        this.glbModelContainer.position.y = Math.abs(Math.sin(this.animTimer * 2)) * (isSprinting ? 0.045 : 0.025);
        this.glbModelContainer.rotation.y = Math.sin(this.animTimer) * 0.035;
        this.glbModelContainer.rotation.x = isSprinting ? 0.10 : 0.03;
      } else {
        // Subtle idle breathing
        this.animTimer += delta * 2.2;
        this.glbModelContainer.position.y = Math.sin(this.animTimer) * 0.008;
        this.glbModelContainer.rotation.set(0, 0, 0);
      }

      // Weapon Socket Positioning for GLB Character (Points forward in -Z towards crosshair)
      if (isAiming) {
        // Aiming stance: weapon raised to shoulder/eye line pointing directly at crosshair
        this.weaponSocket.position.lerp(new THREE.Vector3(0.20, 1.25, -0.38), delta * 18);
        this.weaponSocket.rotation.x = THREE.MathUtils.lerp(this.weaponSocket.rotation.x, -0.05, delta * 18);
        this.weaponSocket.rotation.y = Math.PI;
      } else {
        // Low-ready resting pose near right hip
        this.weaponSocket.position.lerp(new THREE.Vector3(0.28, 0.95, -0.25), delta * 18);
        this.weaponSocket.rotation.x = THREE.MathUtils.lerp(this.weaponSocket.rotation.x, 0.15, delta * 18);
        this.weaponSocket.rotation.y = Math.PI;
      }
      return;
    }

    // --- B. Procedural Model Articulated Limb IK Animation ---
    if (isMoving) {
      const animSpeed = isSprinting ? 12.5 : 8.0;
      this.animTimer += delta * animSpeed;

      const legSwing = Math.sin(this.animTimer) * (isSprinting ? 0.72 : 0.45);
      this.leftLegPivot.rotation.x = legSwing;
      this.rightLegPivot.rotation.x = -legSwing;

      // Natural torso bobbing and sway
      this.torso.rotation.y = Math.sin(this.animTimer) * 0.04;
      this.torso.position.y = 1.04 + Math.abs(Math.sin(this.animTimer * 2)) * 0.022;

      // Arm swing when not aiming
      if (!isAiming) {
        // Right arm holds weapon at side in low-ready pose
        this.rightArmPivot.rotation.x = 0.28 + Math.sin(this.animTimer) * 0.12;
        this.rightArmPivot.rotation.y = -0.10;
        this.rightElbowPivot.rotation.x = 0.35;

        // Left arm swings naturally
        this.leftArmPivot.rotation.x = -legSwing * 0.75;
        this.leftArmPivot.rotation.y = 0.05;
        this.leftElbowPivot.rotation.x = Math.max(0, legSwing * 0.35);
      }
    } else {
      // Idle breathing
      this.animTimer += delta * 2.2;
      this.leftLegPivot.rotation.x = 0;
      this.rightLegPivot.rotation.x = 0;
      this.torso.rotation.y = 0;
      this.torso.position.y = 1.04 + Math.sin(this.animTimer) * 0.01;

      if (!isAiming) {
        // Weapon low-ready idle pose
        this.rightArmPivot.rotation.x = 0.25;
        this.rightArmPivot.rotation.y = -0.10;
        this.rightElbowPivot.rotation.x = 0.35;

        this.leftArmPivot.rotation.x = Math.sin(this.animTimer) * 0.04;
        this.leftArmPivot.rotation.y = 0.05;
        this.leftElbowPivot.rotation.x = 0.10;
      }
    }

    // Aiming arm posture (Spec Section 31: Arm & Weapon Synchronization)
    // Arms raise forward, weapon points toward crosshair target
    if (isAiming) {
      // Right arm raises weapon forward
      this.rightArmPivot.rotation.x = -Math.PI / 2 + 0.15;
      this.rightArmPivot.rotation.y = -0.10;
      this.rightElbowPivot.rotation.x = 0.12;

      if (this.currentWeaponVisual === 'rifle' || this.currentWeaponVisual === 'shotgun') {
        // Two-handed weapon: Left arm reaches forward to support handguard/barrel
        this.leftArmPivot.rotation.x = -Math.PI / 2 + 0.24;
        this.leftArmPivot.rotation.y = 0.52;
        this.leftElbowPivot.rotation.x = 0.48;
      } else {
        // Handgun: Left hand cups right hand in tactical two-handed Weaver stance
        this.leftArmPivot.rotation.x = -Math.PI / 2 + 0.18;
        this.leftArmPivot.rotation.y = 0.32;
        this.leftElbowPivot.rotation.x = 0.22;
      }
    }
  }
}
