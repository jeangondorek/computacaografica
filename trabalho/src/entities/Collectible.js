// Sistema de Amostras Científicas (Cristais de Energia em Órbita)
// 4 amostras por planeta, com rotação contínua, brilho pulsante e detecção de coleta

import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class CollectibleManager {
  constructor(scene, textureGenerator, celestialSystem) {
    this.scene = scene;
    this.textureGenerator = textureGenerator;
    this.celestialSystem = celestialSystem;
    this.crystals = []; // Lista de todos os cristais
    this.totalCollected = 0;
    this.inventoryCapacity = CONFIG.INVENTORY.initialCapacity;
    this.regenerationTimer = null;

    this.initCrystals();
  }

  initCrystals() {
    this.celestialSystem.planets.forEach(planet => {
      const pConfig = planet.config;
      const count = CONFIG.SAMPLES_PER_PLANET;

      // Distribui 4 cristais em órbitas equidistantes ao redor do planeta
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const orbitRadius = pConfig.radius * (1.25 + Math.random() * 0.5);
        const heightOffset = ((Math.random() * 0.8) - 0.4) * pConfig.radius;

        const crystal = this.createCrystal(pConfig, orbitRadius, angle, heightOffset);
        planet.planetGroup.add(crystal.group);

        this.crystals.push({
          id: `${pConfig.id}_crystal_${i}`,
          planetId: pConfig.id,
          planetName: pConfig.name,
          group: crystal.group,
          mesh: crystal.mesh,
          sparkle: crystal.sparkle,
          orbitRadius,
          angle,
          orbitSpeed: 0.00035 + Math.random() * 0.00035,
          collected: false,
          exhausted: false,
          color: pConfig.crystalColor,
          getWorldPosition: () => {
            const v = new THREE.Vector3();
            crystal.group.getWorldPosition(v);
            return v;
          }
        });
      }
    });
  }

  createCrystal(pConfig, radius, initialAngle, height) {
    const group = new THREE.Group();
    group.position.set(
      Math.cos(initialAngle) * radius,
      height,
      Math.sin(initialAngle) * radius
    );

    // Geometria cristalina facetada (Octaedro com facetas reluzentes aumentado para visibilidade)
    const geometry = new THREE.OctahedronGeometry(12, 0);
    const material = new THREE.MeshStandardMaterial({
      color: pConfig.crystalColor,
      emissive: pConfig.crystalEmissive,
      emissiveIntensity: 1.4,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.95
    });

    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    // Estrutura de arame externa (holográfica)
    const wireGeo = new THREE.WireframeGeometry(geometry);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85
    });
    const wireframe = new THREE.LineSegments(wireGeo, wireMat);
    wireframe.scale.setScalar(1.1);
    group.add(wireframe);

    // Halo brilhante ao redor da amostra
    const glowTex = this.textureGenerator.createGlowSprite('#ffffff', 128);
    const spriteMat = new THREE.SpriteMaterial({
      map: glowTex,
      color: pConfig.crystalColor,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.9
    });
    const sparkle = new THREE.Sprite(spriteMat);
    sparkle.scale.set(38, 38, 1);
    group.add(sparkle);

    return { group, mesh, sparkle };
  }

  // Verifica colisão e atração magnética da nave com os cristais.
  // A coleta só é permitida enquanto o jogador mantém G pressionado.
  checkCollection(shipPosition, collectionRadius = 45, collecting = false) {
    const collectedNow = [];

    this.crystals.forEach(crystal => {
      if (crystal.collected || crystal.exhausted) return;
      if (this.totalCollected >= this.inventoryCapacity) return;

      const collectedFromPlanet = this.crystals.filter(item =>
        item.collected && item.planetId === crystal.planetId
      ).length;
      if (collectedFromPlanet >= CONFIG.INVENTORY.maxPerPlanet) return;

      const crystalPos = crystal.getWorldPosition();
      const dist = shipPosition.distanceTo(crystalPos);

      // Efeito de Raio Trator / Atração magnética ao chegar perto
      if (dist < 140) {
        // Brilho intenso indicando proximidade
        crystal.sparkle.scale.set(65, 65, 1);
      }

      if (collecting && dist <= collectionRadius) {
        crystal.collected = true;
        crystal.group.visible = false;
        this.totalCollected++;

        // Atualiza contagem do planeta
        const planet = this.celestialSystem.planets.find(p => p.config.id === crystal.planetId);
        if (planet) {
          planet.samplesCollected++;
        }

        collectedNow.push(crystal);
      }
    });

    return collectedNow;
  }

  resetInventory() {
    this.crystals.forEach(crystal => {
      crystal.collected = false;
      crystal.exhausted = false;
      crystal.group.visible = true;
    });
    this.totalCollected = 0;
    this.inventoryCapacity = CONFIG.INVENTORY.initialCapacity;
    this.regenerationTimer = null;
    this.celestialSystem.planets.forEach(planet => {
      planet.samplesCollected = 0;
      planet.isCheckpointActive = false;
    });
  }

  // Hack de teste: limpa o estoque, mas preserva a capacidade comprada.
  clearCollectedSamples() {
    this.crystals.forEach(crystal => {
      crystal.collected = false;
      crystal.exhausted = false;
      crystal.group.visible = true;
    });
    this.totalCollected = 0;
    this.regenerationTimer = null;
    this.celestialSystem.planets.forEach(planet => {
      planet.samplesCollected = 0;
    });
  }

  // Atalho de teste: coleta todas as amostras de uma vez.
  collectAll() {
    const collectedNow = [];
    this.inventoryCapacity = CONFIG.INVENTORY.maxCapacity;
    this.crystals.forEach(crystal => {
      if (crystal.collected || crystal.exhausted) return;
      crystal.collected = true;
      crystal.group.visible = false;
      collectedNow.push(crystal);

      const planet = this.celestialSystem.planets.find(p => p.config.id === crystal.planetId);
      if (planet) planet.samplesCollected++;
    });

    this.totalCollected += collectedNow.length;
    return collectedNow;
  }

  fillHackStock(perPlanet = 5) {
    const collectedNow = [];
    this.inventoryCapacity = CONFIG.INVENTORY.maxCapacity;
    this.celestialSystem.planets.forEach(planet => {
      const available = this.crystals.filter(crystal =>
        crystal.planetId === planet.config.id && !crystal.collected && !crystal.exhausted
      );
      const alreadyStored = this.crystals.filter(crystal =>
        crystal.planetId === planet.config.id && crystal.collected
      ).length;
      available.slice(0, Math.max(0, perPlanet - alreadyStored)).forEach(crystal => {
        crystal.collected = true;
        crystal.group.visible = false;
        planet.samplesCollected++;
        this.totalCollected++;
        collectedNow.push(crystal);
      });
    });
    return collectedNow;
  }

  // Entrega amostras ao comprador e libera os cristais para novos contratos.
  deliverSamples(planetId, quantity) {
    let delivered = 0;
    this.crystals.forEach(crystal => {
      if (delivered >= quantity || !crystal.collected || crystal.planetId !== planetId) return;

      crystal.collected = false;
      crystal.exhausted = true;
      crystal.group.visible = false;
      delivered++;

      const planet = this.celestialSystem.planets.find(p => p.config.id === crystal.planetId);
      if (planet) planet.samplesCollected = Math.max(0, planet.samplesCollected - 1);
    });

    this.totalCollected = Math.max(0, this.totalCollected - delivered);
    return delivered;
  }

  regenerateSamples() {
    this.crystals.forEach(crystal => {
      crystal.collected = false;
      crystal.exhausted = false;
      crystal.angle = Math.random() * Math.PI * 2;
      crystal.orbitRadius = this.celestialSystem.planets.find(p => p.config.id === crystal.planetId)
        .config.radius * (1.25 + Math.random() * 0.5);
      crystal.group.position.set(
        Math.cos(crystal.angle) * crystal.orbitRadius,
        ((Math.random() * 0.8) - 0.4) * crystal.orbitRadius,
        Math.sin(crystal.angle) * crystal.orbitRadius
      );
      crystal.group.visible = true;
    });
    this.totalCollected = 0;
    this.celestialSystem.planets.forEach(planet => { planet.samplesCollected = 0; });
    this.regenerationTimer = null;
    return true;
  }

  // Retorna a amostra ativa mais próxima para o radar/bússola
  getNearestActiveSample(shipPosition) {
    let nearest = null;
    let minDist = Infinity;

    this.crystals.forEach(c => {
      if (c.collected || c.exhausted) return;
      const pos = c.getWorldPosition();
      const dist = shipPosition.distanceTo(pos);
      if (dist < minDist) {
        minDist = dist;
        nearest = { crystal: c, position: pos, distance: dist };
      }
    });

    return nearest;
  }

  update(delta) {
    const allDepleted = this.crystals.length > 0 && this.crystals.every(c => c.collected || c.exhausted);
    if (allDepleted) {
      if (this.regenerationTimer === null) this.regenerationTimer = CONFIG.SAMPLE_REGENERATION_SECONDS;
      this.regenerationTimer -= delta;
      if (this.regenerationTimer <= 0) return this.regenerateSamples();
    } else {
      this.regenerationTimer = null;
    }

    const time = Date.now() * 0.003;

    this.crystals.forEach(c => {
      if (c.collected || c.exhausted) return;

      // Animação de rotação do cristal
      c.mesh.rotation.x += 0.02;
      c.mesh.rotation.y += 0.025;
      c.mesh.rotation.z += 0.015;

      // Pulsação suave do halo
      const pulse = 14 + Math.sin(time * 3 + c.angle) * 4;
      c.sparkle.scale.set(pulse, pulse, 1);

      // Órbita serena e suave ao redor do planeta
      c.angle += c.orbitSpeed * delta * 4;
      c.group.position.x = Math.cos(c.angle) * c.orbitRadius;
      c.group.position.z = Math.sin(c.angle) * c.orbitRadius;
    });
    return false;
  }
}
