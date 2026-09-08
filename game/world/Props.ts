import * as THREE from 'three';
import { PropDef } from '../data/cityData';

export class Props {
  public group: THREE.Group;
  private propDefs: PropDef[];

  constructor(propDefs: PropDef[]) {
    this.group = new THREE.Group();
    this.group.name = 'Props';
    this.propDefs = propDefs;
    this.buildProps();
  }

  private buildProps(): void {
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 7.5, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 });

    const lampArmGeo = new THREE.BoxGeometry(0.15, 0.15, 2.2);
    const lampHeadGeo = new THREE.BoxGeometry(0.45, 0.25, 0.8);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.45, 3.5, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
    const leavesGeo = new THREE.DodecahedronGeometry(2.4, 1);
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });

    const dumpsterGeo = new THREE.BoxGeometry(2.2, 1.6, 1.4);
    const dumpsterMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.6 });

    const barrierGeo = new THREE.BoxGeometry(3.5, 0.9, 0.4);
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7 });

    for (const p of this.propDefs) {
      if (p.type === 'streetlight') {
        const lightGroup = new THREE.Group();
        lightGroup.position.set(p.position[0], 0, p.position[2]);

        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 3.75;
        pole.castShadow = true;
        lightGroup.add(pole);

        const arm = new THREE.Mesh(lampArmGeo, poleMat);
        arm.position.set(0, 7.3, 0.8);
        lightGroup.add(arm);

        const head = new THREE.Mesh(lampHeadGeo, poleMat);
        head.position.set(0, 7.2, 1.8);
        lightGroup.add(head);

        const bulbMatDay = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
        const bulb = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.6), bulbMatDay);
        bulb.rotation.x = Math.PI / 2;
        bulb.position.set(0, 7.05, 1.8);
        lightGroup.add(bulb);

        this.group.add(lightGroup);
      } else if (p.type === 'tree') {
        const treeGroup = new THREE.Group();
        treeGroup.position.set(p.position[0], 0, p.position[2]);

        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 1.75;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        const leaves = new THREE.Mesh(leavesGeo, leavesMat);
        leaves.position.y = 4.2;
        leaves.castShadow = true;
        treeGroup.add(leaves);

        this.group.add(treeGroup);
      } else if (p.type === 'dumpster') {
        const dumpster = new THREE.Mesh(dumpsterGeo, dumpsterMat);
        dumpster.position.set(p.position[0], 0.8, p.position[2]);
        dumpster.castShadow = true;
        this.group.add(dumpster);
      } else if (p.type === 'barrier') {
        const barrier = new THREE.Mesh(barrierGeo, barrierMat);
        barrier.position.set(p.position[0], 0.45, p.position[2]);
        barrier.castShadow = true;
        this.group.add(barrier);
      }
    }
  }
}
