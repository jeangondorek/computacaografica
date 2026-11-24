// Campos e Cinturões de Asteroides com Detecção de Colisão por Esferas Delimitadoras
// Cria obstáculos dinâmicos entre as órbitas planetárias que causam dano por impacto

import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class AsteroidField {
  constructor(scene, textureGenerator) {
    this.scene = scene;
    this.textureGenerator = textureGenerator;
    this.asteroids = []; // Lista de objetos para física e colisão
    this.group = new THREE.Group();

    this.initBelts();
  }

  initBelts() {
    const asteroidTex = this.textureGenerator.createAsteroidTexture();
    const material = new THREE.MeshStandardMaterial({
      map: asteroidTex,
      roughness: 0.95,
      metalness: 0.1,
      color: 0x9e9e9e
    });

    // Gera geometrias base com deformação procedural nos vértices para criar rochas irregulares
    const baseGeometries = [
      this.createDeformedRockGeometry(1.0, 1),
      this.createDeformedRockGeometry(1.0, 2)
    ];

    CONFIG.ASTEROID_BELTS.forEach(belt => {
      for (let i = 0; i < belt.count; i++) {
        // Distribuição anular polar
        const radius = belt.innerRadius + Math.random() * (belt.outerRadius - belt.innerRadius);
        const theta = Math.random() * Math.PI * 2;
        const y = (Math.random() - 0.5) * belt.heightSpread;

        const x = Math.cos(theta) * radius;
        const z = Math.sin(theta) * radius;

        // Variação de tamanho da rocha
        const scale = belt.minSize + Math.random() * (belt.maxSize - belt.minSize);
        const geo = baseGeometries[i % baseGeometries.length];

        const mesh = new THREE.Mesh(geo, material);
        mesh.position.set(x, y, z);
        mesh.scale.set(
          scale * (0.8 + Math.random() * 0.4),
          scale * (0.8 + Math.random() * 0.4),
          scale * (0.8 + Math.random() * 0.4)
        );

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
          radius: scale * 0.95, // Raio aproximado da esfera delimitadora
          mesh,
          rotSpeedX: (Math.random() - 0.5) * 0.008,
          rotSpeedY: (Math.random() - 0.5) * 0.008,
          rotSpeedZ: (Math.random() - 0.5) * 0.008,
          distFromSun: radius
        });
      }
    });

    this.scene.add(this.group);
  }

  // Deforma uma icosaedro para gerar rochas autorais facetadas
  createDeformedRockGeometry(size, detail) {
    const geo = new THREE.IcosahedronGeometry(size, detail);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);

      // Perturbação procedural dos vértices
      const noise = 0.82 + Math.sin(vx * 3 + vy * 4) * 0.18 + Math.cos(vz * 5) * 0.12;
      pos.setXYZ(i, vx * noise, vy * noise, vz * noise);
    }

    geo.computeVertexNormals();
    return geo;
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
    }
  }
}
