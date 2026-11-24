// Campo de Estrelas e Partículas de Velocidade Espacial (Starfield & Warp Dust)
// Cria profundidade visual cósmica e sensação de velocidade estelar

import * as THREE from 'three';

export class Starfield {
  constructor(scene) {
    this.scene = scene;
    this.skyMesh = null;
    this.initBackgroundSkyDome();
    this.initBackgroundStars();
    this.initSpeedDust();
  }

  // Abóbada Celeste com imagem panorâmica 4K baixada pelo usuário
  initBackgroundSkyDome() {
    const loader = new THREE.TextureLoader();
    loader.load('./assets/background/space_bg.jpg', (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.colorSpace = THREE.SRGBColorSpace;

      const skyGeo = new THREE.SphereGeometry(85000, 48, 48);
      const skyMat = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.BackSide,
        depthWrite: false
      });
      this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
      this.scene.add(this.skyMesh);
    }, undefined, (err) => {
      console.warn('Usando fundo procedural estrelado padrão.');
    });
  }

  // Estrelas de fundo distantes
  initBackgroundStars() {
    const starCount = 6500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    const colorChoices = [
      new THREE.Color(0xffffff), // Branco estelar puro
      new THREE.Color(0xaad5ff), // Azul jovem quente
      new THREE.Color(0xffd599), // Dourada amarelada
      new THREE.Color(0xccaaff)  // Violeta pálida
    ];

    for (let i = 0; i < starCount; i++) {
      // Distribuição uniforme sobre uma esfera gigantesca
      const radius = 65000 + Math.random() * 25000;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const col = colorChoices[Math.floor(Math.random() * colorChoices.length)];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 65,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true
    });

    this.stars = new THREE.Points(geometry, material);
    this.scene.add(this.stars);
  }

  // Poeira espacial local que reage à velocidade da nave
  initSpeedDust() {
    this.dustCount = 500;
    this.dustSpread = 160;
    const geometry = new THREE.BufferGeometry();
    this.dustPositions = new Float32Array(this.dustCount * 3);

    for (let i = 0; i < this.dustCount; i++) {
      this.dustPositions[i * 3] = (Math.random() - 0.5) * this.dustSpread;
      this.dustPositions[i * 3 + 1] = (Math.random() - 0.5) * this.dustSpread;
      this.dustPositions[i * 3 + 2] = (Math.random() - 0.5) * this.dustSpread;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(this.dustPositions, 3));

    this.dustMaterial = new THREE.PointsMaterial({
      color: 0x88ccff,
      size: 1.8,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });

    this.dustPoints = new THREE.Points(geometry, this.dustMaterial);
    this.scene.add(this.dustPoints);
  }

  // Atualiza as partículas de poeira para seguir a nave e criar efeito de fluxo contínuo
  update(shipPosition, shipVelocity, isBoosting) {
    if (this.skyMesh) {
      this.skyMesh.position.copy(shipPosition);
    }
    if (!this.dustPoints) return;

    this.dustPoints.position.copy(shipPosition);

    const positions = this.dustPoints.geometry.attributes.position.array;
    const half = this.dustSpread / 2;

    const speed = shipVelocity.length();
    this.dustMaterial.opacity = isBoosting ? 0.8 : (0.2 + (speed / 150) * 0.4);
    this.dustMaterial.size = isBoosting ? 3.2 : 1.8;

    // Movimento relativo das partículas oposto à velocidade
    const dx = -shipVelocity.x * 0.05;
    const dy = -shipVelocity.y * 0.05;
    const dz = -shipVelocity.z * 0.05;

    for (let i = 0; i < this.dustCount; i++) {
      const idx = i * 3;
      positions[idx] += dx;
      positions[idx + 1] += dy;
      positions[idx + 2] += dz;

      // Wrap around bounds
      if (positions[idx] > half) positions[idx] -= this.dustSpread;
      if (positions[idx] < -half) positions[idx] += this.dustSpread;
      if (positions[idx + 1] > half) positions[idx + 1] -= this.dustSpread;
      if (positions[idx + 1] < -half) positions[idx + 1] += this.dustSpread;
      if (positions[idx + 2] > half) positions[idx + 2] -= this.dustSpread;
      if (positions[idx + 2] < -half) positions[idx + 2] += this.dustSpread;
    }

    this.dustPoints.geometry.attributes.position.needsUpdate = true;
  }
}
