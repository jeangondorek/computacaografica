// Gerenciador e Entidades dos Corpos Celestes (Planetas e Luas)
// Aplica conceitos fundamentais de Computação Gráfica:
// - Transformações geométricas hierárquicas (Matrizes de translação e rotação em cascata)
// - Materiais MeshStandardMaterial com iluminação difusa, rugosidade e emissão
// - Transparência, camadas atmosféricas e sistemas de anéis planetários

import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class CelestialSystem {
  constructor(scene, textureGenerator) {
    this.scene = scene;
    this.textureGenerator = textureGenerator;
    this.planets = [];
    this.moons = [];

    this.init();
  }

  init() {
    CONFIG.PLANETS.forEach(planetConfig => {
      const planet = this.createPlanet(planetConfig);
      this.planets.push(planet);
    });
  }

  createPlanet(config) {
    // Grupo que gira em torno do Sol (Translação Orbital)
    const orbitGroup = new THREE.Group();
    orbitGroup.rotation.y = config.orbitAngle || 0;
    this.scene.add(orbitGroup);

    // Linha de órbita elíptica/circular para orientação espacial do jogador
    const orbitLine = this.createOrbitLine(config.distance, config.color);
    this.scene.add(orbitLine);

    // Grupo do próprio planeta posicionado na sua distância orbital
    const planetGroup = new THREE.Group();
    planetGroup.position.set(config.distance, 0, 0);
    orbitGroup.add(planetGroup);

    // Criação da malha principal do planeta com materiais distintos para cada corpo celeste
    const loader = new THREE.TextureLoader();
    let material;

    if (config.type === 'red' || config.type === 'lava') {
      // 1. Planeta Vermelho: MeshStandardMaterial com crosta vulcânica HD e magma emissivo
      const redTex = loader.load('./assets/planets/planet_vermelho.png');
      redTex.colorSpace = THREE.SRGBColorSpace;
      const emissiveTex = loader.load('./assets/planets/planet_vermelho_emissive.png');

      material = new THREE.MeshStandardMaterial({
        map: redTex,
        emissiveMap: emissiveTex,
        emissive: new THREE.Color(0xff3300),
        emissiveIntensity: 1.0,
        roughness: 0.85,
        metalness: 0.15
      });
    } else if (config.type === 'water' || config.type === 'forest') {
      // 2. Planeta de Água: mapa equiretangular próprio para esfera.
      // water_planet.png é um ícone quadrado com fundo preto e não pode ser
      // aplicado diretamente como textura de uma esfera 3D.
      const waterTex = loader.load('./assets/planets/planet_agua.png');
      waterTex.colorSpace = THREE.SRGBColorSpace;

      material = new THREE.MeshPhysicalMaterial({
        map: waterTex,
        emissive: new THREE.Color(0x061b2e),
        emissiveIntensity: 0.16,
        roughness: 0.08,
        metalness: 0.04,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        reflectivity: 0.98,
        transmission: 0.15
      });
    } else {
      // 3. Planeta com Anel de Asteroides (O Mais Difícil): MeshStandardMaterial rochoso estratificado
      const ringPlanetTex = loader.load('./assets/planets/planet_anel.png');
      ringPlanetTex.colorSpace = THREE.SRGBColorSpace;

      material = new THREE.MeshStandardMaterial({
        map: ringPlanetTex,
        emissive: new THREE.Color(0x241006),
        emissiveIntensity: 0.18,
        roughness: 0.90,
        metalness: 0.12
      });
    }

    const geometry = new THREE.SphereGeometry(config.radius, 64, 64);
    const planetMesh = new THREE.Mesh(geometry, material);
    planetMesh.castShadow = true;
    planetMesh.receiveShadow = true;
    planetGroup.add(planetMesh);

    // Camada de Nuvens para o planeta de Água (Oceanus)
    let cloudsMesh = null;
    if (config.hasClouds) {
      const cloudsTex = this.textureGenerator.createCloudsTexture();
      const cloudsGeo = new THREE.SphereGeometry(config.radius * 1.018, 48, 48);
      const cloudsMat = new THREE.MeshStandardMaterial({
        map: cloudsTex,
        transparent: true,
        opacity: 0.82,
        blending: THREE.NormalBlending,
        depthWrite: false
      });
      cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
      planetGroup.add(cloudsMesh);
    }

    // Camada de Brilho Atmosférico suave
    if (config.atmosphereColor) {
      const atmoGeo = new THREE.SphereGeometry(config.radius * 1.055, 32, 32);
      const atmoMat = new THREE.MeshBasicMaterial({
        color: config.atmosphereColor,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
      });
      const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
      planetGroup.add(atmoMesh);
    }

    // Sistema de Anéis de Gelo para Cryo ou Anel Denso de Asteroides
    let ringsMesh = null;
    let ringAsteroidGroup = null;
    let localAsteroids = [];

    if (config.hasDenseAsteroidRing) {
      // Planeta com Anel de Asteroides (O Mais Difícil): Cinturão 3D perigoso
      ringAsteroidGroup = new THREE.Group();
      ringAsteroidGroup.rotation.x = Math.PI / 4;
      planetGroup.add(ringAsteroidGroup);

      const ringTex = this.textureGenerator.createRingsTexture();
      const ringGeo = new THREE.RingGeometry(config.ringInnerRadius, config.ringOuterRadius, 64);
      ringGeo.rotateX(Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        map: ringTex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75
      });
      ringsMesh = new THREE.Mesh(ringGeo, ringMat);
      ringAsteroidGroup.add(ringsMesh);

      // Centenas de rochas de asteroides no anel planetário
      const astTex = this.textureGenerator.createAsteroidTexture();
      const astMat = new THREE.MeshStandardMaterial({
        map: astTex,
        roughness: 0.9,
        color: 0x887766
      });
      const astGeo = new THREE.IcosahedronGeometry(1, 1);

      const count = config.ringAsteroidCount || 140;
      for (let i = 0; i < count; i++) {
        const dist = config.ringInnerRadius + Math.random() * (config.ringOuterRadius - config.ringInnerRadius);
        const theta = Math.random() * Math.PI * 2;
        const yOffset = (Math.random() - 0.5) * 45;
        const scale = 8 + Math.random() * 22;

        const astMesh = new THREE.Mesh(astGeo, astMat);
        astMesh.position.set(Math.cos(theta) * dist, yOffset, Math.sin(theta) * dist);
        astMesh.scale.setScalar(scale);
        astMesh.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
        ringAsteroidGroup.add(astMesh);

        localAsteroids.push({
          mesh: astMesh,
          radius: scale * 0.95,
          dist,
          theta,
          speed: 0.001 + Math.random() * 0.001
        });
      }
    } else if (config.hasRings) {
      const ringsTex = this.textureGenerator.createRingsTexture();
      const ringGeo = new THREE.RingGeometry(config.ringInnerRadius, config.ringOuterRadius, 64);
      ringGeo.rotateX(Math.PI / 2.3);
      const ringMat = new THREE.MeshBasicMaterial({
        map: ringsTex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.88
      });
      ringsMesh = new THREE.Mesh(ringGeo, ringMat);
      planetGroup.add(ringsMesh);
    }

    // Checkpoints foram removidos: não há anel de renascimento nos planetas.
    const checkpointRing = null;
    const checkpointRingMat = null;

    // Criação das Luas Orbitais com textura lunar de alta definição
    const planetMoons = [];
    if (config.moons && config.moons.length > 0) {
      // Textura comum das luas. O mesmo objeto é usado nos materiais para que
      // o carregamento assíncrono do TextureLoader atualize todas elas.
      const moonTex = loader.load('./assets/planets/moon_hd.png');
      moonTex.colorSpace = THREE.SRGBColorSpace;
      moonTex.wrapS = THREE.RepeatWrapping;
      moonTex.wrapT = THREE.ClampToEdgeWrapping;
      moonTex.anisotropy = this.scene.userData.maxAnisotropy || 4;

      config.moons.forEach(mConfig => {
        const moonOrbitGroup = new THREE.Group();
        planetGroup.add(moonOrbitGroup);

        const moonGeo = new THREE.SphereGeometry(mConfig.radius, 32, 32);
        const moonMat = new THREE.MeshStandardMaterial({
          map: moonTex,
          // Mantém as cores e detalhes da textura baixada sem aplicar uma
          // tonalidade que possa esconder o mapa.
          color: 0xffffff,
          emissive: new THREE.Color(mConfig.color),
          emissiveIntensity: 0.04,
          roughness: 0.95,
          metalness: 0.05
        });
        const moonMesh = new THREE.Mesh(moonGeo, moonMat);
        moonMesh.position.set(mConfig.distance, 0, 0);
        moonOrbitGroup.add(moonMesh);

        const moonData = {
          name: mConfig.name,
          orbitGroup: moonOrbitGroup,
          mesh: moonMesh,
          orbitSpeed: mConfig.orbitSpeed,
          rotationSpeed: mConfig.rotationSpeed,
          radius: mConfig.radius,
          getWorldPosition: () => {
            const v = new THREE.Vector3();
            moonMesh.getWorldPosition(v);
            return v;
          }
        };
        planetMoons.push(moonData);
        this.moons.push(moonData);
      });
    }

    return {
      config,
      orbitGroup,
      planetGroup,
      mesh: planetMesh,
      cloudsMesh,
      checkpointRing,
      checkpointRingMat,
      moons: planetMoons,
      ringAsteroidGroup,
      localAsteroids,
      samplesCollected: 0,
      isCheckpointActive: false,
      // Helper para obter a posição absoluta no espaço 3D global
      getWorldPosition: () => {
        const v = new THREE.Vector3();
        planetGroup.getWorldPosition(v);
        return v;
      }
    };
  }

  // Desenha a linha da órbita com Shader/Linha
  createOrbitLine(radius, colorHex) {
    const points = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.16
    });
    return new THREE.Line(geometry, material);
  }

  update(delta) {
    this.planets.forEach(p => {
      // Translação orbital ao redor do Sol
      p.orbitGroup.rotation.y += p.config.orbitSpeed;

      // Rotação axial do planeta
      p.mesh.rotation.y += p.config.rotationSpeed;

      // Movimento independente das nuvens (ventos atmosféricos)
      if (p.cloudsMesh) {
        p.cloudsMesh.rotation.y += p.config.rotationSpeed * 1.35;
      }

      // Rotação do anel perigoso de asteroides (Planeta Mais Difícil)
      if (p.ringAsteroidGroup) {
        p.ringAsteroidGroup.rotation.y += 0.0014;
      }

      // Pulsação suave do anel de checkpoint
      if (p.checkpointRing) {
        p.checkpointRing.rotation.z += 0.005;
        if (p.isCheckpointActive) {
          const pulse = 0.65 + Math.sin(Date.now() * 0.004) * 0.25;
          p.checkpointRingMat.opacity = pulse;
        }
      }

      // Translação e rotação das luas em torno do planeta
      p.moons.forEach(m => {
        m.orbitGroup.rotation.y += m.orbitSpeed;
        m.mesh.rotation.y += m.rotationSpeed;
      });
    });
  }
}
