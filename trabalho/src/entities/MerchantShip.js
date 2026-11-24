// Nave cargueira que funciona como comprador e loja orbital.
import * as THREE from 'three';

export class MerchantShip {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    // Base inicial próxima o suficiente para ser encontrada sem pouso.
    this.group.position.set(0, 500, 5200);
    this.group.rotation.y = Math.PI;
    this.createModel();
    scene.add(this.group);
  }

  createModel() {
    const hull = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.32 });
    const cargo = new THREE.MeshStandardMaterial({ color: 0x0e7490, emissive: 0x022c3a, emissiveIntensity: 0.5, metalness: 0.65, roughness: 0.25 });
    const light = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(170, 230, 900, 12), hull);
    body.rotation.z = Math.PI / 2;
    this.group.add(body);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(230, 260, 12), hull);
    nose.rotation.z = -Math.PI / 2;
    nose.position.x = 580;
    this.group.add(nose);

    const cargoBay = new THREE.Mesh(new THREE.BoxGeometry(520, 300, 520), cargo);
    cargoBay.position.x = -80;
    this.group.add(cargoBay);

    [-1, 1].forEach(side => {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(520, 28, 1000), hull);
      wing.position.set(-40, side * 230, 0);
      this.group.add(wing);

      const engine = new THREE.Mesh(new THREE.CylinderGeometry(55, 70, 160, 16), light);
      engine.rotation.z = Math.PI / 2;
      engine.position.set(-480, side * 230, 0);
      this.group.add(engine);
    });

    const beacon = new THREE.Mesh(new THREE.SphereGeometry(70, 24, 24), light);
    beacon.position.set(580, 0, 0);
    this.group.add(beacon);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(470, 10, 12, 64),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.75 })
    );
    ring.rotation.y = Math.PI / 2;
    this.group.add(ring);
    this.ring = ring;
  }

  getWorldPosition() {
    const position = new THREE.Vector3();
    this.group.getWorldPosition(position);
    return position;
  }

  update(delta) {
    this.group.rotation.y += delta * 0.05;
    this.ring.rotation.z += delta * 0.4;
  }
}
