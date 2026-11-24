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
      0.85
    );
    this.group.add(this.light);

    // Luz ambiente suave para garantir visibilidade do lado escuro dos planetas
    const ambientLight = new THREE.AmbientLight(0x222633, 0.45);
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
