// Gerenciador e Entidades dos Corpos Celestes (Planetas e Luas)
// Aplica conceitos fundamentais de Computação Gráfica:
// - Transformações geométricas hierárquicas (Matrizes de translação e rotação em cascata)
// - Materiais MeshStandardMaterial com iluminação difusa, rugosidade e emissão
// - Transparência, camadas atmosféricas e sistemas de anéis planetários

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
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
      const redTex = loader.load('./itens/MeinPlanet_composite.png');
      redTex.colorSpace = THREE.SRGBColorSpace;
      redTex.wrapS = THREE.RepeatWrapping;
      redTex.wrapT = THREE.ClampToEdgeWrapping;
      redTex.anisotropy = this.scene.userData.maxAnisotropy || 4;

      material = new THREE.MeshStandardMaterial({
        map: redTex,
        emissive: new THREE.Color(0xff3300),
        emissiveIntensity: 0.35,
        roughness: 0.85,
        metalness: 0.15
      });
    } else if (config.type === 'water' || config.type === 'forest') {
      // A superfície final é carregada do modelo earth-2.glb.
      const waterTex = loader.load('./assets/planets/planet_agua.png');
      waterTex.colorSpace = THREE.SRGBColorSpace;
      waterTex.wrapS = THREE.RepeatWrapping;
      waterTex.wrapT = THREE.ClampToEdgeWrapping;
      waterTex.anisotropy = this.scene.userData.maxAnisotropy || 4;
      material = new THREE.MeshStandardMaterial({ map: waterTex, color: 0xffffff, roughness: 0.75 });
    } else {
      // A superfície final é carregada do modelo planet_with_asteroid_belt.glb.
      const beltTex = loader.load('./assets/planets/planet_belt.jpg');
      beltTex.colorSpace = THREE.SRGBColorSpace;
      beltTex.wrapS = THREE.RepeatWrapping;
      beltTex.wrapT = THREE.ClampToEdgeWrapping;
      beltTex.anisotropy = this.scene.userData.maxAnisotropy || 4;
      material = new THREE.MeshStandardMaterial({ map: beltTex, color: 0xffffff, roughness: 0.82 });
    }

    const geometry = new THREE.SphereGeometry(config.radius, 64, 64);
    const planetMesh = new THREE.Mesh(geometry, material);
    planetMesh.castShadow = true;
    planetMesh.receiveShadow = true;
    planetGroup.add(planetMesh);

    // Camada de Nuvens para o planeta de Água (Oceanus)
    let cloudsMesh = null;
    let atmosphereMesh = null;
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
      atmosphereMesh = atmoMesh;
    }

    // Sistema de Anéis de Gelo para Cryo ou Anel Denso de Asteroides
    let ringsMesh = null;
    let ringAsteroidGroup = null;
    let localAsteroids = [];
    let importedModel = null;

    if (config.hasDenseAsteroidRing) {
      // O cinturão deste planeta vem exclusivamente do
      // planet_with_asteroid_belt.glb convertido do arquivo fornecido.
      ringAsteroidGroup = null;
      ringsMesh = null;
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

    // Usa o planeta/cinturão trazido pelo usuário e convertido do .blend.
    if (config.type === 'red') {
      const planetLoader = new GLTFLoader();
      planetMesh.visible = false;
      planetLoader.load('./itens/planet-textured.glb', (gltf) => {
        const importedPlanet = gltf.scene;
        importedModel = importedPlanet;
        planetGroup.userData.importedModel = importedPlanet;
        const redTexture = loader.load('./itens/MeinPlanet_composite.png');
        redTexture.colorSpace = THREE.SRGBColorSpace;
        redTexture.wrapS = THREE.RepeatWrapping;
        redTexture.wrapT = THREE.ClampToEdgeWrapping;
        redTexture.anisotropy = this.scene.userData.maxAnisotropy || 8;

        importedPlanet.traverse(node => {
          if (!node.isMesh) return;
          node.material = new THREE.MeshStandardMaterial({
            map: redTexture,
            color: 0xffffff,
            emissive: new THREE.Color(0xff3300),
            emissiveIntensity: 0.18,
            roughness: 0.82,
            metalness: 0.08
          });
          node.castShadow = true;
          node.receiveShadow = true;
        });
        importedPlanet.scale.setScalar(config.radius);
        planetGroup.add(importedPlanet);
      }, undefined, () => {
        planetMesh.visible = true;
        console.warn('planet-textured.glb não carregou; mantendo o fallback vermelho.');
      });
    }

    if (config.type === 'ring_asteroids') {
      const importedLoader = new GLTFLoader();
      planetMesh.visible = false;
      importedLoader.load('./itens/planet-belt-textured.glb', (gltf) => {
        const importedPlanet = gltf.scene;
        importedModel = importedPlanet;
        planetGroup.userData.importedModel = importedPlanet;
        const deepBlueCube = new THREE.CubeTextureLoader().load([
          './itens/deepblue-gas-giant-cubemap/small_deepblue-gasgiant-0.png',
          './itens/deepblue-gas-giant-cubemap/small_deepblue-gasgiant-1.png',
          './itens/deepblue-gas-giant-cubemap/small_deepblue-gasgiant-2.png',
          './itens/deepblue-gas-giant-cubemap/small_deepblue-gasgiant-3.png',
          './itens/deepblue-gas-giant-cubemap/small_deepblue-gasgiant-4.png',
          './itens/deepblue-gas-giant-cubemap/small_deepblue-gasgiant-5.png'
        ]);
        deepBlueCube.colorSpace = THREE.SRGBColorSpace;

        importedPlanet.traverse(node => {
          if (node.name === 'real_star_field.png') node.visible = false;
          if (node.name === 'Cube' || node.name === 'Cube.001' || node.name === 'emitter') node.visible = false;
          if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
          }
          if (node.name === 'Sphere') {
            node.scale.setScalar(config.radius);
            node.traverse(child => {
              if (child.isMesh) {
                if (!child.geometry.attributes.uv) {
                  const position = child.geometry.attributes.position;
                  const uv = new Float32Array(position.count * 2);
                  for (let i = 0; i < position.count; i++) {
                    const x = position.getX(i);
                    const y = position.getY(i);
                    const z = position.getZ(i);
                    const length = Math.sqrt(x * x + y * y + z * z) || 1;
                    uv[i * 2] = 0.5 + Math.atan2(z / length, x / length) / (Math.PI * 2);
                    uv[i * 2 + 1] = 0.5 - Math.asin(y / length) / Math.PI;
                  }
                  child.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
                }
                child.material = new THREE.MeshStandardMaterial({
                  envMap: deepBlueCube,
                  envMapIntensity: 1.35,
                  color: 0x4aa3ff,
                  roughness: 0.28,
                  metalness: 0.12
                });
              }
            });
          }
        });
        if (ringAsteroidGroup) ringAsteroidGroup.visible = false;
        planetGroup.add(importedPlanet);
      }, undefined, () => {
        planetMesh.visible = true;
        console.warn('planet_with_asteroid_belt.glb não carregou; mantendo o fallback do planeta.');
      });
    }

    // Planeta Terra importado do arquivo earth 2.blend.
    if (config.id === 'agua') {
      const earthLoader = new GLTFLoader();
      planetMesh.visible = false;
      if (cloudsMesh) cloudsMesh.visible = false;
      if (atmosphereMesh) atmosphereMesh.visible = false;
      earthLoader.load('./itens/earth-59-textured.glb', (gltf) => {
        const importedEarth = gltf.scene;
        importedModel = importedEarth;
        planetGroup.userData.importedModel = importedEarth;
        const earthTex = loader.load('./assets/planets/planet_agua.png');
        earthTex.colorSpace = THREE.SRGBColorSpace;
        earthTex.wrapS = THREE.RepeatWrapping;
        earthTex.wrapT = THREE.ClampToEdgeWrapping;
        earthTex.anisotropy = this.scene.userData.maxAnisotropy || 4;

        importedEarth.traverse(node => {
          if (!node.isMesh) return;
          node.castShadow = true;
          node.receiveShadow = true;
          if (node.name === 'earth') {
            node.material = new THREE.MeshStandardMaterial({
              map: earthTex,
              color: 0xffffff,
              roughness: 0.72,
              metalness: 0.05
            });
          } else if (node.name === 'clouds') {
            node.material = new THREE.MeshStandardMaterial({
              color: 0xffffff,
              transparent: true,
              opacity: 0.42,
              depthWrite: false,
              roughness: 0.9
            });
          } else if (node.name === 'atmo') {
            node.material = new THREE.MeshBasicMaterial({
              color: 0x38bdf8,
              transparent: true,
              opacity: 0.12,
              side: THREE.BackSide,
              blending: THREE.AdditiveBlending
            });
          }
        });
        importedEarth.scale.setScalar(config.radius / 10);
        planetGroup.add(importedEarth);
      }, undefined, () => {
        planetMesh.visible = true;
        if (cloudsMesh) cloudsMesh.visible = true;
        if (atmosphereMesh) atmosphereMesh.visible = true;
        console.warn('earth-2.glb não carregou; mantendo o planeta de água original.');
      });
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
        moonMesh.castShadow = true;
        moonMesh.receiveShadow = true;
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
      importedModel,
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
      if (p.planetGroup.userData.importedModel) {
        p.planetGroup.userData.importedModel.rotation.y += p.config.rotationSpeed;
      }

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
