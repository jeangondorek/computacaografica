// Entidade do Sol Central (Sol Prime)
// Ponto de luz principal do sistema solar com textura dinâmica e coroa incandescente

import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class Sun {
  constructor(scene, textureGenerator) {
    this.scene = scene;
    this.textureGenerator = textureGenerator;
    this.group = new THREE.Group();

    this.init();
  }

  init() {
    const sunTex = this.textureGenerator.createSunTexture();

    // Geometria esférica do Sol
    const geometry = new THREE.SphereGeometry(CONFIG.SUN.radius, 48, 48);
    const material = new THREE.MeshBasicMaterial({
      map: sunTex,
      color: 0xffffff
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.group.add(this.mesh);

    // Luz Pontual Central (ilumina todo o sistema planetário)
    this.light = new THREE.PointLight(
      CONFIG.SUN.color,
      CONFIG.SUN.lightIntensity,
      CONFIG.SUN.lightDistance,
      1.25
    );
    this.light.castShadow = true;
    this.light.shadow.mapSize.set(2048, 2048);
    this.light.shadow.camera.near = 100;
    this.light.shadow.camera.far = CONFIG.SUN.lightDistance;
    this.light.shadow.bias = -0.00018;
    this.light.shadow.normalBias = 1.5;
    this.light.shadow.radius = 3;
    this.group.add(this.light);

    // O lado não iluminado fica escuro; o ambiente apenas revela contornos
    // mínimos e não substitui a iluminação direcional do Sol.
    const ambientLight = new THREE.AmbientLight(0x111827, 0.055);
    this.scene.add(ambientLight);

    // Coroa solar / Brilho atmosférico (Sprite aditivo)
    const glowTex = this.textureGenerator.createGlowSprite('#ff9922', 256);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: glowTex,
      color: 0xffaa33,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.85
    });

    this.coronaSprite = new THREE.Sprite(spriteMaterial);
    const s = CONFIG.SUN.coronaRadius * 2.8;
    this.coronaSprite.scale.set(s, s, 1);
    this.group.add(this.coronaSprite);

    this.scene.add(this.group);
  }

  update(delta) {
    // Rotação axial lenta do Sol
    if (this.mesh) {
      this.mesh.rotation.y += 0.0008;
    }
  }
}
