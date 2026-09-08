import * as THREE from 'three';
import { RoadDef } from '../data/cityData';

export class Roads {
  public group: THREE.Group;
  private roadDefs: RoadDef[];

  constructor(roadDefs: RoadDef[]) {
    this.group = new THREE.Group();
    this.group.name = 'Roads';
    this.roadDefs = roadDefs;
    this.buildRoads();
  }

  private buildRoads(): void {
    const asphaltMaterial = new THREE.MeshStandardMaterial({
      color: 0x181e29,
      roughness: 0.85,
      metalness: 0.1,
    });

    const yellowLineMaterial = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
    });

    const whiteLineMaterial = new THREE.MeshBasicMaterial({
      color: 0xe2e8f0,
    });

    const sidewalkMaterial = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.9,
    });

    for (const r of this.roadDefs) {
      const isVertical = Math.abs(r.start[0] - r.end[0]) < 0.1;
      const length = isVertical
        ? Math.abs(r.end[1] - r.start[1])
        : Math.abs(r.end[0] - r.start[0]);
      const midX = (r.start[0] + r.end[0]) / 2;
      const midZ = (r.start[1] + r.end[1]) / 2;

      // 1. Asphalt Road Surface
      const roadGeo = new THREE.PlaneGeometry(
        isVertical ? r.width : length,
        isVertical ? length : r.width
      );
      const roadMesh = new THREE.Mesh(roadGeo, asphaltMaterial);
      roadMesh.rotation.x = -Math.PI / 2;
      roadMesh.position.set(midX, 0.02, midZ);
      roadMesh.receiveShadow = true;
      this.group.add(roadMesh);

      // 2. Center Dividing Line (Yellow Dashed)
      const numDashes = Math.floor(length / 8);
      const dashLength = 4;
      const dashWidth = 0.35;
      const dashGeo = new THREE.PlaneGeometry(
        isVertical ? dashWidth : dashLength,
        isVertical ? dashLength : dashWidth
      );

      for (let i = 0; i < numDashes; i++) {
        const offset = -length / 2 + i * 8 + 4;
        const dash = new THREE.Mesh(dashGeo, yellowLineMaterial);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(
          isVertical ? midX : midX + offset,
          0.04,
          isVertical ? midZ + offset : midZ
        );
        this.group.add(dash);
      }

      // 3. Sidewalks along both road edges
      const sidewalkWidth = 3.0;
      const curbHeight = 0.25;

      const sw1Geo = new THREE.BoxGeometry(
        isVertical ? sidewalkWidth : length,
        curbHeight,
        isVertical ? length : sidewalkWidth
      );
      const sw2Geo = new THREE.BoxGeometry(
        isVertical ? sidewalkWidth : length,
        curbHeight,
        isVertical ? length : sidewalkWidth
      );

      const sw1 = new THREE.Mesh(sw1Geo, sidewalkMaterial);
      const sw2 = new THREE.Mesh(sw2Geo, sidewalkMaterial);

      const halfRoad = r.width / 2 + sidewalkWidth / 2;
      if (isVertical) {
        sw1.position.set(midX - halfRoad, curbHeight / 2, midZ);
        sw2.position.set(midX + halfRoad, curbHeight / 2, midZ);
      } else {
        sw1.position.set(midX, curbHeight / 2, midZ - halfRoad);
        sw2.position.set(midX, curbHeight / 2, midZ + halfRoad);
      }
      sw1.receiveShadow = true;
      sw2.receiveShadow = true;
      this.group.add(sw1);
      this.group.add(sw2);
    }
  }
}
