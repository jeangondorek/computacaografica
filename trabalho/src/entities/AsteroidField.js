// Campos e Cinturões de Asteroides com Detecção de Colisão por Esferas Delimitadoras
// Cria obstáculos dinâmicos entre as órbitas planetárias que causam dano por impacto

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CONFIG } from '../config.js';

export class AsteroidField {
  constructor(scene, textureGenerator, celestialSystem) {
    this.scene = scene;
    this.textureGenerator = textureGenerator;
    this.asteroids = []; // Lista de objetos para física e colisão
    this.group = new THREE.Group();
    this.importedAsteroidTemplates = [];

    this.scene.add(this.group);
    this.loadImportedAsteroids(celestialSystem);
  }

  loadImportedAsteroids(celestialSystem) {
    const loader = new GLTFLoader();
    loader.load('./itens/asteroid.glb', gltf => {
      gltf.scene.traverse(node => {
        if (!node.isMesh) return;
        node.castShadow = true;
        node.receiveShadow = true;
        if (node.material) {
          node.material.color.setHex(0xffffff);
          node.material.roughness = 1;
          node.material.metalness = 0;
          if (node.material.map) {
            node.material.map.colorSpace = THREE.SRGBColorSpace;
            node.material.map.anisotropy = this.scene.userData.maxAnisotropy || 8;
          }
        }
      });
      this.importedAsteroidTemplates = [gltf.scene];
      this.initBelts(celestialSystem);
    }, undefined, () => {
      console.warn('Modelo asteroid.glb não carregou.');
    });
  }

  initBelts(celestialSystem) {
    CONFIG.ASTEROID_BELTS.forEach(belt => {
      for (let i = 0; i < belt.count; i++) {
        // Distribuição anular polar
        const radius = belt.innerRadius + Math.random() * (belt.outerRadius - belt.innerRadius);
        const theta = Math.random() * Math.PI * 2;
        const y = (Math.random() - 0.5) * belt.heightSpread;

        const x = Math.cos(theta) * radius;
        const z = Math.sin(theta) * radius;

        // Variação de tamanho da rocha
        const size = belt.minSize + Math.random() * (belt.maxSize - belt.minSize);
        const mesh = this.createAsteroidInstance(i, size);
        mesh.position.set(x, y, z);

        // Rotação inicial aleatória
        mesh.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );

        this.group.add(mesh);

        // Registro para colisão
        this.asteroids.push({
          position: mesh.position,
          radius: size * 0.5,
          mesh,
          rotSpeedX: (Math.random() - 0.5) * 0.008,
          rotSpeedY: (Math.random() - 0.5) * 0.008,
          rotSpeedZ: (Math.random() - 0.5) * 0.008,
          distFromSun: radius
        });
      }
    });

    // Cinturão do planeta Kronos: também usa somente os dois modelos GLB.
    celestialSystem.planets.forEach(planet => {
      if (!planet.config.hasDenseAsteroidRing) return;

      const ringGroup = new THREE.Group();
      ringGroup.rotation.x = Math.PI / 4;
      planet.planetGroup.add(ringGroup);
      planet.ringAsteroidGroup = ringGroup;
      planet.localAsteroids = [];

      const count = planet.config.ringAsteroidCount || 140;
      for (let i = 0; i < count; i++) {
        const dist = planet.config.ringInnerRadius +
          Math.random() * (planet.config.ringOuterRadius - planet.config.ringInnerRadius);
        const theta = Math.random() * Math.PI * 2;
        const yOffset = (Math.random() - 0.5) * 45;
        const size = 8 + Math.random() * 22;
        const mesh = this.createAsteroidInstance(i, size);

        mesh.position.set(Math.cos(theta) * dist, yOffset, Math.sin(theta) * dist);
        mesh.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
        ringGroup.add(mesh);
        planet.localAsteroids.push({
          mesh,
          radius: size * 0.5,
          dist,
          theta,
          speed: 0.001 + Math.random() * 0.001
        });
      }
    });

    this.initRoamingAsteroids();

    this.scene.add(this.group);
  }

  initRoamingAsteroids() {
    const roaming = CONFIG.ROAMING_ASTEROIDS;
    if (!roaming) return;

    for (let i = 0; i < roaming.count; i++) {
      let x;
      let y;
      let z;

      do {
        x = (Math.random() - 0.5) * roaming.mapRadius * 2;
        y = (Math.random() - 0.5) * roaming.mapRadius * 0.55;
        z = (Math.random() - 0.5) * roaming.mapRadius * 2;
      } while (Math.sqrt(x * x + z * z) < 3000);

      const size = roaming.minSize + Math.random() * (roaming.maxSize - roaming.minSize);
      const mesh = this.createAsteroidInstance(i, size);
      mesh.position.set(x, y, z);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      this.group.add(mesh);

      const direction = new THREE.Vector3(
        Math.random() - 0.5,
        (Math.random() - 0.5) * 0.35,
        Math.random() - 0.5
      ).normalize();
      const speed = roaming.minSpeed + Math.random() * (roaming.maxSpeed - roaming.minSpeed);

      this.asteroids.push({
        position: mesh.position,
        radius: size * 0.5,
        mesh,
        velocity: direction.multiplyScalar(speed),
        rotSpeedX: (Math.random() - 0.5) * 0.014,
        rotSpeedY: (Math.random() - 0.5) * 0.014,
        rotSpeedZ: (Math.random() - 0.5) * 0.014,
        distFromSun: Math.sqrt(x * x + z * z),
        roaming: true
      });
    }
  }

  createAsteroidInstance(index, targetDiameter) {
    const model = this.importedAsteroidTemplates[index % this.importedAsteroidTemplates.length].clone(true);
    const asteroidColors = [0x8faaa6, 0xa68f78, 0x64758a, 0x91849b];
    const tint = asteroidColors[index % asteroidColors.length];

    model.traverse(node => {
      if (!node.isMesh) return;
      if (node.material) {
        node.material = node.material.clone();
        node.material.color.setHex(tint);
        node.material.roughness = 0.82;
        node.material.metalness = 0.06;
      }
    });

    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);
    if (maxDimension > 0) model.scale.multiplyScalar(targetDiameter / maxDimension);

    const centeredBounds = new THREE.Box3().setFromObject(model);
    const center = centeredBounds.getCenter(new THREE.Vector3());
    model.position.sub(center);

    const instance = new THREE.Group();
    instance.add(model);
    return instance;
  }

  // Detecção rápida de colisão com a nave usando particionamento radial e verificação do anel planetário
  checkCollision(shipPosition, shipRadius = 2.5, celestialSystem = null) {
    // 1. Verificação de colisão nos asteroides do anel do planeta mais difícil
    if (celestialSystem && celestialSystem.planets) {
      for (let p = 0; p < celestialSystem.planets.length; p++) {
        const planet = celestialSystem.planets[p];
        if (planet.config.hasDenseAsteroidRing && planet.localAsteroids && planet.localAsteroids.length > 0) {
          const planetPos = planet.getWorldPosition();
          const distToPlanet = shipPosition.distanceTo(planetPos);
          if (distToPlanet <= planet.config.ringOuterRadius + 120 && distToPlanet >= planet.config.ringInnerRadius - 120) {
            const tempPos = new THREE.Vector3();
            for (let i = 0; i < planet.localAsteroids.length; i++) {
              const ast = planet.localAsteroids[i];
              ast.mesh.getWorldPosition(tempPos);
              const distSq = shipPosition.distanceToSquared(tempPos);
              const minSafe = ast.radius + shipRadius;
              if (distSq < minSafe * minSafe) {
                const normal = shipPosition.clone().sub(tempPos).normalize();
                return {
                  collided: true,
                  normal,
                  asteroid: ast,
                  damage: 30
                };
              }
            }
          }
        }
      }
    }

    // 2. Verificação nos cinturões do sistema solar
    const shipDistFromSun = Math.sqrt(
      shipPosition.x * shipPosition.x + shipPosition.z * shipPosition.z
    );

    // Só testa asteroides cujas órbitas estão próximas da distância atual da nave ao Sol
    const candidateRange = 220;

    for (let i = 0; i < this.asteroids.length; i++) {
      const ast = this.asteroids[i];

      if (Math.abs(ast.distFromSun - shipDistFromSun) > candidateRange) {
        continue;
      }

      const dx = shipPosition.x - ast.position.x;
      const dy = shipPosition.y - ast.position.y;
      const dz = shipPosition.z - ast.position.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      const minSafeDist = ast.radius + shipRadius;

      if (distSq < minSafeDist * minSafeDist) {
        // Colisão confirmada!
        const normal = new THREE.Vector3(dx, dy, dz).normalize();
        return {
          collided: true,
          normal,
          asteroid: ast,
          damage: 25
        };
      }
    }

    return { collided: false };
  }

  update(delta) {
    // Rotação axial lenta e contínua dos asteroides
    for (let i = 0; i < this.asteroids.length; i++) {
      const ast = this.asteroids[i];
      ast.mesh.rotation.x += ast.rotSpeedX;
      ast.mesh.rotation.y += ast.rotSpeedY;
      ast.mesh.rotation.z += ast.rotSpeedZ;

      if (ast.roaming && ast.velocity) {
        ast.mesh.position.addScaledVector(ast.velocity, delta);
        ast.distFromSun = Math.sqrt(
          ast.mesh.position.x * ast.mesh.position.x +
          ast.mesh.position.z * ast.mesh.position.z
        );

        const roaming = CONFIG.ROAMING_ASTEROIDS;
        const limitX = roaming.mapRadius;
        const limitZ = roaming.mapRadius;
        const limitY = roaming.mapRadius * 0.275;

        if (Math.abs(ast.mesh.position.x) > limitX) ast.velocity.x *= -1;
        if (Math.abs(ast.mesh.position.y) > limitY) ast.velocity.y *= -1;
        if (Math.abs(ast.mesh.position.z) > limitZ) ast.velocity.z *= -1;
      }
    }
  }
}
