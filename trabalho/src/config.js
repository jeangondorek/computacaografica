// Configurações globais do jogo Explorador Estelar
// Proporções: Planetas imensos e distâncias cósmicas para sensação autêntica de exploração espacial

export const CONFIG = {
  // Configurações de Mundo e Câmera
  WORLD: {
    FOV: 65,
    NEAR: 0.5,
    FAR: 250000,
    CAMERA_OFFSET: { x: 0, y: 2.2, z: 6.8 }, // Posição em 3ª pessoa atrás da nave
    CAMERA_LOOK_AHEAD: 14,
    CAMERA_LERP: 0.08
  },

  // Sol Central
  SUN: {
    name: 'Sol Prime',
    radius: 2600, // Sol majestoso e imenso
    color: 0xffaa00,
    emissive: 0xff7700,
    lightIntensity: 3.5,
    lightDistance: 120000,
    coronaRadius: 3600
  },

  // Planetas Temáticos com Tamanhos Imensos e Órbitas Lentas e Estáveis:
  // 1. Planeta Vermelho (Ignis) - tamanho Lua gigante (raio 420)
  // 2. Planeta de Água (Oceanus) - tamanho médio (raio 850)
  // 3. Planeta dos Asteroides (Kronos) - super gigante colossal (raio 1600)
  PLANETS: [
    {
      id: 'vermelho',
      name: 'Planeta Vermelho (Ignis)',
      type: 'red',
      radius: 420, // Planeta grande
      distance: 7500,
      orbitSpeed: 0.000045, // Órbita lenta e suave
      rotationSpeed: 0.0012,
      orbitAngle: 0.5,
      color: 0xff3300,
      emissive: 0x441100,
      description: 'Mundo vulcânico avermelhado com fissuras incandescentes de magma.',
      crystalColor: 0xff4400,
      crystalEmissive: 0xff1100,
      moons: [
        {
          name: 'Piro',
          radius: 75,
          distance: 750,
          orbitSpeed: 0.0004,
          rotationSpeed: 0.001,
          color: 0x773322
        }
      ]
    },
    {
      id: 'agua',
      name: 'Planeta de Água (Oceanus)',
      type: 'water',
      radius: 850, // Planeta mediano-grande
      distance: 18000,
      orbitSpeed: 0.000022, // Órbita lenta
      rotationSpeed: 0.0009,
      orbitAngle: 2.2,
      color: 0x0077cc,
      atmosphereColor: 0x38bdf8,
      description: 'Planeta aquático translúcido com oceanos profundos reflexivos e nuvens atmosféricas.',
      crystalColor: 0x00e5ff,
      crystalEmissive: 0x0088cc,
      hasClouds: true,
      moons: [
        {
          name: 'Tritão',
          radius: 130,
          distance: 1550,
          orbitSpeed: 0.0003,
          rotationSpeed: 0.0008,
          color: 0xaaccdd
        }
      ]
    },
    {
      id: 'anel',
      name: 'Planeta dos Asteroides (Kronos)',
      type: 'ring_asteroids',
      radius: 1600, // Super-Planeta Colossal - O Mais Difícil!
      distance: 34000,
      orbitSpeed: 0.000012, // Órbita majestosa e muito lenta
      rotationSpeed: 0.0006,
      orbitAngle: 4.3,
      color: 0xcc8855,
      atmosphereColor: 0xffaa66,
      description: 'O maior e mais perigoso planeta, cercado por um colossal anel de asteroides.',
      crystalColor: 0xffaa00,
      crystalEmissive: 0xcc6600,
      hasDenseAsteroidRing: true,
      ringInnerRadius: 2100,
      ringOuterRadius: 3600,
      ringAsteroidCount: 180,
      moons: [
        {
          name: 'Titanis',
          radius: 160,
          distance: 4500,
          orbitSpeed: 0.00025,
          rotationSpeed: 0.0006,
          color: 0x998877
        },
        {
          name: 'Fobos-X',
          radius: 95,
          distance: 6200,
          orbitSpeed: 0.00015,
          rotationSpeed: 0.0008,
          color: 0x776655
        }
      ]
    }
  ],

  // Cinturões de Asteroides
  ASTEROID_BELTS: [
    {
      name: 'Cinturão de Brasas',
      innerRadius: 11500,
      outerRadius: 14500,
      count: 280,
      heightSpread: 650,
      minSize: 18,
      maxSize: 65
    },
    {
      name: 'Cinturão Glacial Exterior',
      innerRadius: 23500,
      outerRadius: 28500,
      count: 420,
      heightSpread: 900,
      minSize: 25,
      maxSize: 90
    }
  ],

  // Parâmetros da Nave Espacial
  SHIP: {
    scale: 0.85,
    maxHealth: 30,
    maxHullHealth: 200,
    speedCruise: 55,
    speedMaxNormal: 80,
    speedBoost: 200, // Progressão inicial; upgrades levam aos limites configurados
    maxSpeedLimit: 150,
    maxBoostSpeed: 1000,
    maxEngineLevels: 8,
    maxFuelLevels: 4,
    maxHullLevels: 9,
    acceleration: 80,
    deceleration: 45,
    pitchRate: 1.6,
    yawRate: 1.5,
    rollRate: 2.2,
    boostMaxFuel: 40,
    boostDrainRate: 20,
    boostRechargeRate: 18,
    invulnerabilityTimeOnDamage: 2.0,
    collisionRadius: 2.5
  },

  // Cristais / Amostras por planeta
  SAMPLES_PER_PLANET: 10,
  TOTAL_SAMPLES: 30,
  SAMPLE_REGENERATION_SECONDS: 300,
  INVENTORY: {
    initialCapacity: 1,
    maxCapacity: 15,
    maxPerPlanet: 5,
    capacityUpgradeSize: 1,
    capacityUpgradeCost: 250
  },

  // Pontos de Spawn / Início (seguro, fora do Sol)
  START_POSITION: { x: 0, y: 50, z: 6200 }
};
