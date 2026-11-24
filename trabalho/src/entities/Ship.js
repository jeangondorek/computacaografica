// Modelo 3D Autoral da Nave Espacial do Jogador
// Construída proceduralmente combinando primitivas geométricas (fuselagem, asas delta, cockpit de vidro, propulsores iônicos e escudo de energia)

import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class Ship {
  constructor(scene, textureGenerator) {
    this.scene = scene;
    this.textureGenerator = textureGenerator;

    this.mesh = new THREE.Group();
    this.maxHealth = CONFIG.SHIP.maxHealth;
    this.hullLevel = 0;
    this.health = this.maxHealth;
    this.boostFuel = CONFIG.SHIP.boostMaxFuel;
    this.isDead = false;
    this.invulnerableTimer = 0;
    this.initModel();
  }

  initModel() {
    const loader = new THREE.TextureLoader();
    let hullTex = this.textureGenerator.createHullTexture();
    try {
      const customHull = loader.load('./assets/spaceship/hull_diffuse.png');
      if (customHull) hullTex = customHull;
    } catch (e) {}

    const hullMaterial = new THREE.MeshStandardMaterial({
      map: hullTex,
      metalness: 0.85,
      roughness: 0.35,
      color: 0xdddddd
    });

    const accentMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      metalness: 0.6,
      roughness: 0.3
    });

    const darkMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a202c,
      metalness: 0.9,
      roughness: 0.2
    });

    const cockpitMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x00e5ff,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.85,
      transparent: true,
      opacity: 0.85,
      reflectivity: 0.9
    });

    // 1. Fuselagem Principal (Corpo aerodinâmico afunilado)
    const bodyGeo = new THREE.ConeGeometry(0.9, 4.2, 8);
    bodyGeo.rotateX(Math.PI / 2); // Aponta para frente (eixo -Z ou +Z)
    const bodyMesh = new THREE.Mesh(bodyGeo, hullMaterial);
    bodyMesh.scale.set(1.1, 0.55, 1.0);
    this.mesh.add(bodyMesh);

    // 2. Cockpit / Dossel de Vidro Translúcido
    const cockpitGeo = new THREE.SphereGeometry(0.48, 16, 16);
    cockpitGeo.scale(0.7, 0.45, 1.6);
    const cockpitMesh = new THREE.Mesh(cockpitGeo, cockpitMaterial);
    cockpitMesh.position.set(0, 0.38, 0.3);
    this.mesh.add(cockpitMesh);

    // 3. Asas Delta (Esquerda e Direita)
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(2.4, -0.6);
    wingShape.lineTo(2.2, -1.8);
    wingShape.lineTo(0, -1.3);
    wingShape.closePath();

    const extrudeSettings = { depth: 0.08, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 };
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
    wingGeo.rotateX(-Math.PI / 2);

    // Asa Direita
    const rightWing = new THREE.Mesh(wingGeo, hullMaterial);
    rightWing.position.set(0.3, 0.05, 0.4);
    this.mesh.add(rightWing);

    // Asa Esquerda (Espelhada)
    const leftWingGeo = wingGeo.clone();
    leftWingGeo.scale(-1, 1, 1);
    const leftWing = new THREE.Mesh(leftWingGeo, hullMaterial);
    leftWing.position.set(-0.3, 0.05, 0.4);
    this.mesh.add(leftWing);

    // Pontas das asas / Wingtips verticais
    const tipGeo = new THREE.BoxGeometry(0.08, 0.65, 0.8);
    const rightTip = new THREE.Mesh(tipGeo, accentMaterial);
    rightTip.position.set(2.4, 0.3, -0.8);
    this.mesh.add(rightTip);

    const leftTip = new THREE.Mesh(tipGeo, accentMaterial);
    leftTip.position.set(-2.4, 0.3, -0.8);
    this.mesh.add(leftTip);

    // 4. Estabilizadores Verticais Traseiros (Lemes duplos)
    const finGeo = new THREE.BoxGeometry(0.08, 0.8, 1.1);
    finGeo.rotateZ(0.2);
    const rightFin = new THREE.Mesh(finGeo, accentMaterial);
    rightFin.position.set(0.55, 0.5, -1.2);
    this.mesh.add(rightFin);

    const leftFinGeo = finGeo.clone();
    leftFinGeo.rotateZ(-0.4);
    const leftFin = new THREE.Mesh(leftFinGeo, accentMaterial);
    leftFin.position.set(-0.55, 0.5, -1.2);
    this.mesh.add(leftFin);

    // 5. Motores Iônicos Traseiros Duplos
    const engineGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.9, 16);
    engineGeo.rotateX(Math.PI / 2);

    const rightEngine = new THREE.Mesh(engineGeo, darkMaterial);
    rightEngine.position.set(0.48, 0.05, -1.75);
    this.mesh.add(rightEngine);

    const leftEngine = new THREE.Mesh(engineGeo, darkMaterial);
    leftEngine.position.set(-0.48, 0.05, -1.75);
    this.mesh.add(leftEngine);

    // Chamas de propulsão dos motores (Sprites de plasma ciano/laranja)
    const flameTex = this.textureGenerator.createGlowSprite('#00ffff', 128);
    const flameMat = new THREE.SpriteMaterial({
      map: flameTex,
      color: 0x00ffff,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.9
    });

    this.flameRight = new THREE.Sprite(flameMat);
    this.flameRight.scale.set(0.9, 0.9, 1);
    this.flameRight.position.set(0.48, 0.05, -2.4);
    this.mesh.add(this.flameRight);

    this.flameLeft = new THREE.Sprite(flameMat.clone());
    this.flameLeft.scale.set(0.9, 0.9, 1);
    this.flameLeft.position.set(-0.48, 0.05, -2.4);
    this.mesh.add(this.flameLeft);

    // 6. Cúpula de Escudo de Força (visível ao sofrer dano por impacto)
    const shieldGeo = new THREE.SphereGeometry(2.7, 24, 24);
    this.shieldMaterial = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.0,
      wireframe: true,
      blending: THREE.AdditiveBlending
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, this.shieldMaterial);
    this.mesh.add(this.shieldMesh);

    // Posiciona e escala a nave no mundo
    this.mesh.scale.setScalar(CONFIG.SHIP.scale);
    this.mesh.position.set(
      CONFIG.START_POSITION.x,
      CONFIG.START_POSITION.y,
      CONFIG.START_POSITION.z
    );
    this.scene.add(this.mesh);
  }

  // Aplica dano de colisão com asteroides
  takeDamage(amount) {
    if (this.invulnerableTimer > 0 || this.isDead) return false;

    this.health = Math.max(0, this.health - amount);
    this.invulnerableTimer = CONFIG.SHIP.invulnerabilityTimeOnDamage;

    // Pisca o escudo de força com impacto
    if (this.shieldMaterial) {
      this.shieldMaterial.opacity = 0.85;
      this.shieldMaterial.color.setHex(0xff3344); // Vermelho de alerta de dano
    }

    if (this.health <= 0) {
      this.isDead = true;
    }
    return true;
  }

  // Reinício da tentativa no ponto inicial.
  respawn() {
    this.health = this.maxHealth;
    this.boostFuel = CONFIG.SHIP.boostMaxFuel;
    this.isDead = false;
    this.invulnerableTimer = 2.0;

    this.mesh.position.set(
      CONFIG.START_POSITION.x,
      CONFIG.START_POSITION.y,
      CONFIG.START_POSITION.z
    );
    this.mesh.rotation.set(0, 0, 0);

    if (this.shieldMaterial) {
      this.shieldMaterial.opacity = 0.6;
      this.shieldMaterial.color.setHex(0x00e5ff);
    }
  }

  update(delta, throttleRatio, isBoosting) {
    // Atualiza temporizador de invulnerabilidade
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= delta;
      // Efeito de piscar visibilidade enquanto invulnerável
      this.mesh.visible = Math.floor(Date.now() / 80) % 2 === 0;

      // Desvanece o escudo
      if (this.shieldMaterial && this.shieldMaterial.opacity > 0) {
        this.shieldMaterial.opacity = Math.max(0, this.shieldMaterial.opacity - delta * 1.5);
      }
    } else {
      this.mesh.visible = true;
      if (this.shieldMaterial) this.shieldMaterial.opacity = 0;
    }

    // Animação das chamas dos motores
    const flicker = 0.85 + Math.random() * 0.3;
    let flameScale = (0.7 + throttleRatio * 0.9) * flicker;
    let flameColor = 0x00e5ff;

    if (isBoosting) {
      flameScale *= 1.85;
      flameColor = 0xff7700; // Alaranjado hiperpropulsão
    }

    if (this.flameRight && this.flameLeft) {
      this.flameRight.scale.set(flameScale, flameScale, 1);
      this.flameLeft.scale.set(flameScale, flameScale, 1);
      this.flameRight.material.color.setHex(flameColor);
      this.flameLeft.material.color.setHex(flameColor);
    }
  }
}
