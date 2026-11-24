// Ponto de Entrada Principal - Explorador Estelar
// Inicializa o motor Three.js, entidades astronômicas, controles, HUD e laço de animação

import * as THREE from 'three';
import { CONFIG } from './config.js';
import { TextureGenerator } from './utils/TextureGenerator.js';
import { AudioManager } from './audio.js';
import { Sun } from './entities/Sun.js';
import { CelestialSystem } from './entities/CelestialSystem.js';
import { AsteroidField } from './entities/AsteroidField.js';
import { CollectibleManager } from './entities/Collectible.js';
import { Ship } from './entities/Ship.js';
import { ShipControls } from './controls/ShipControls.js';
import { Starfield } from './environment/Starfield.js';
import { HUD } from './ui/HUD.js';
import { MerchantShip } from './entities/MerchantShip.js';
import { MarketManager } from './entities/MarketManager.js';

class Game {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.clock = new THREE.Clock();
    this.syncedPlanet = null;
    this.lastPlanetWorldPos = new THREE.Vector3();
    this.marketOpen = false;
    this.runWasReset = false;

    this.initRenderer();
    this.initSceneAndCamera();
    this.initModules();
    this.bindEvents();

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      logarithmicDepthBuffer: true // Permite profundidade precisa de 0.5 a 120.000 unidades
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);
  }

  initSceneAndCamera() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020308);

    this.camera = new THREE.PerspectiveCamera(
      CONFIG.WORLD.FOV,
      window.innerWidth / window.innerHeight,
      CONFIG.WORLD.NEAR,
      CONFIG.WORLD.FAR
    );
    this.camera.position.set(0, 35, 2520);
  }

  initModules() {
    // 1. Gerador de Texturas Procedurais Autorais
    this.textureGenerator = new TextureGenerator();

    // 2. Sintetizador de Áudio Web Audio API
    this.audio = new AudioManager();

    // 3. Fundo Estelar Cósmico e Poeira de Velocidade
    this.starfield = new Starfield(this.scene);

    // 4. Sol Central
    this.sun = new Sun(this.scene, this.textureGenerator);

    // 5. Sistema Planetário (3 Planetas e Luas com proporções cósmicas)
    this.celestialSystem = new CelestialSystem(this.scene, this.textureGenerator);

    // 6. Cinturões de Asteroides com Colisão
    this.asteroidField = new AsteroidField(this.scene, this.textureGenerator);

    // 7. Amostras Científicas de Cristais (4 por planeta)
    this.collectibleManager = new CollectibleManager(
      this.scene,
      this.textureGenerator,
      this.celestialSystem
    );

    // 8. Nave Espacial do Jogador
    this.ship = new Ship(this.scene, this.textureGenerator);

    // 9. Controles em 3ª Pessoa e Dinâmica de Voo
    this.controls = new ShipControls(this.ship, this.camera, this.renderer.domElement);

    // Nave cargueira/comprador: base segura para contratos e melhorias.
    this.merchantShip = new MerchantShip(this.scene);
    this.marketManager = new MarketManager(this);

    // 10. Interface HUD em Tempo Real
    this.hud = new HUD();
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Ativa áudio na primeira interação do usuário
    const unlockAudio = () => {
      this.audio.init();
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('click', unlockAudio);
    };
    window.addEventListener('keydown', unlockAudio);
    window.addEventListener('click', unlockAudio);

    // Botão de Renascer da tela de destruição
    const respawnBtn = document.getElementById('respawn-btn');
    if (respawnBtn) {
      respawnBtn.addEventListener('click', () => {
        // Reinício total: recria a cena e todos os estados como um F5.
        window.location.reload();
      });
    }

    // Modal de Controles
    const controlsBtn = document.getElementById('controls-btn');
    const controlsModal = document.getElementById('controls-modal');
    const closeControlsBtn = document.getElementById('close-controls-btn');

    if (controlsBtn && controlsModal) {
      controlsBtn.addEventListener('click', () => {
        controlsModal.classList.add('visible');
      });
    }

    if (closeControlsBtn && controlsModal) {
      closeControlsBtn.addEventListener('click', () => {
        controlsModal.classList.remove('visible');
      });
    }

    // Tecla 'H' para abrir/fechar ajuda
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyH' && controlsModal) {
        controlsModal.classList.toggle('visible');
      }
      if (e.code === 'KeyO') {
        this.toggleOrbitSync();
      }
      if (e.code === 'Digit9' || e.code === 'Numpad9') {
        this.activateCollectionHack();
      }
      if (e.code === 'Digit5' || e.code === 'Numpad5') {
        this.marketManager.addTestCredits(1000);
        this.hud.showCheckpointNotification('Hack: +1000 créditos adicionados.');
        if (this.marketOpen) this.renderMarket();
      }
      if ((e.code === 'Digit0' || e.code === 'Numpad0') && !e.repeat) {
        this.collectibleManager.clearCollectedSamples();
        this.marketManager.syncContractProgress();
        this.hud.showCheckpointNotification('Hack: estoque de amostras zerado.');
        if (this.marketOpen) this.renderMarket();
      }
      if (e.code === 'KeyM' && !e.repeat) {
        this.toggleMarket();
      }
    });

    // Botão de Sincronização Orbital na tela
    const syncBtn = document.getElementById('sync-orbit-btn');
    if (syncBtn) {
      syncBtn.addEventListener('click', () => {
        this.toggleOrbitSync();
      });
    }

    const marketBtn = document.getElementById('market-btn');
    if (marketBtn) marketBtn.addEventListener('click', () => this.toggleMarket());

    const closeMarketBtn = document.getElementById('close-market-btn');
    if (closeMarketBtn) closeMarketBtn.addEventListener('click', () => this.closeMarket());

    const upgradeFuel = document.getElementById('upgrade-fuel');
    if (upgradeFuel) upgradeFuel.addEventListener('click', () => {
      if (this.marketManager.buyUpgrade('fuel')) this.renderMarket();
    });

    const upgradeEngine = document.getElementById('upgrade-engine');
    if (upgradeEngine) upgradeEngine.addEventListener('click', () => {
      if (this.marketManager.buyUpgrade('engine')) this.renderMarket();
    });

    const upgradeHull = document.getElementById('upgrade-hull');
    if (upgradeHull) upgradeHull.addEventListener('click', () => {
      if (this.marketManager.buyUpgrade('hull')) this.renderMarket();
    });

    const upgradeInventory = document.getElementById('upgrade-inventory');
    if (upgradeInventory) upgradeInventory.addEventListener('click', () => {
      if (this.marketManager.buyUpgrade('inventory')) this.renderMarket();
    });

    const repairShip = document.getElementById('repair-ship');
    if (repairShip) repairShip.addEventListener('click', () => {
      if (this.marketManager.buyUpgrade('repair')) this.renderMarket();
    });
  }

  toggleMarket() {
    const distance = this.ship.mesh.position.distanceTo(this.merchantShip.getWorldPosition());
    if (distance > 1400) {
      this.hud.showCheckpointNotification('Aproxime-se da nave cargueira para negociar [M].');
      return;
    }

    this.marketOpen = !this.marketOpen;
    const marketScreen = document.getElementById('market-screen');
    if (!marketScreen) return;
    marketScreen.classList.toggle('visible', this.marketOpen);
    if (this.marketOpen) {
      if (!this.marketManager.activeContract) this.marketManager.generateOffers();
      this.renderMarket();
    }
  }

  closeMarket() {
    this.marketOpen = false;
    const marketScreen = document.getElementById('market-screen');
    if (marketScreen) marketScreen.classList.remove('visible');
  }

  renderMarket() {
    const manager = this.marketManager;
    manager.syncContractProgress();
    const credits = document.getElementById('market-credits');
    const offers = document.getElementById('market-offers');
    const active = document.getElementById('market-active');
    const stats = document.getElementById('market-stats');
    if (!credits || !offers || !active) return;

    credits.textContent = `${manager.credits} créditos`;
    if (stats) {
      stats.textContent = `Vida: ${Math.ceil(this.ship.health)}/${Math.ceil(this.ship.maxHealth)} · ` +
        `Velocidade: ${Math.round(this.controls.speedLimit)} · ` +
        `Turbo: ${Math.round(this.controls.boostSpeed)} · ` +
        `Motor: ${this.controls.engineLevel}/${CONFIG.SHIP.maxEngineLevels} · ` +
        `Tanque: ${Math.round(this.controls.boostCapacity)} (${this.controls.fuelLevel}/${CONFIG.SHIP.maxFuelLevels}) · ` +
        `Estoque: ${this.collectibleManager.totalCollected}/${this.collectibleManager.inventoryCapacity} · ` +
        `Casco: ${this.ship.hullLevel}/${CONFIG.SHIP.maxHullLevels}`;
    }
    offers.innerHTML = manager.offers.map((offer, index) => `
      <div class="market-offer">
        <strong>Pacote ${index + 1}: ${offer.planetName}</strong>
        <span>Coletar ${offer.quantity} amostra(s) · ${offer.reward} créditos</span>
        <button class="btn-primary market-action" data-offer="${index}">Aceitar</button>
      </div>
    `).join('');
    offers.querySelectorAll('[data-offer]').forEach(button => {
      button.addEventListener('click', () => {
        if (manager.acceptOffer(Number(button.dataset.offer))) this.renderMarket();
      });
    });

    if (manager.activeContract) {
      const contract = manager.activeContract;
      active.innerHTML = `Contrato ativo: ${contract.collected}/${contract.quantity} amostras em ${contract.planetName}` +
        (contract.collected >= contract.quantity
          ? ' <button class="btn-primary market-action" id="claim-contract">Vender pacote</button>'
          : '');
      const claim = document.getElementById('claim-contract');
      if (claim) claim.addEventListener('click', () => {
        manager.claimContract();
        this.renderMarket();
      });
    } else {
      active.textContent = 'Nenhum contrato ativo.';
    }
  }

  activateCollectionHack() {
    const collected = this.collectibleManager.fillHackStock(5);
    collected.forEach(sample => this.marketManager.registerSample(sample));
    this.marketManager.syncContractProgress();
    this.hud.showCheckpointNotification('Hack: estoque preenchido com 5 amostras de cada planeta.');
  }

  resetRun() {
    this.collectibleManager.resetInventory();
    this.marketManager.resetRun();
    this.controls.resetUpgrades();
    this.ship.maxHealth = CONFIG.SHIP.maxHealth;
    this.ship.hullLevel = 0;
  }

  handleShipDeath() {
    if (this.runWasReset) return;
    this.runWasReset = true;
    this.resetRun();
    this.audio.playShipExplosion();
    this.hud.showDeathScreen(true);
  }

  // Alterna a Sincronização Orbital com o Planeta mais próximo
  toggleOrbitSync() {
    if (this.syncedPlanet) {
      this.syncedPlanet = null;
      this.hud.showCheckpointNotification('Voo Livre: Órbita Desconectada');
      const syncBtn = document.getElementById('sync-orbit-btn');
      if (syncBtn) syncBtn.style.background = 'rgba(14, 165, 233, 0.25)';
      return;
    }

    const shipPos = this.ship.mesh.position;
    let closestPlanet = null;
    let minDistance = Infinity;

    for (let i = 0; i < this.celestialSystem.planets.length; i++) {
      const p = this.celestialSystem.planets[i];
      const pPos = p.getWorldPosition();
      const dist = shipPos.distanceTo(pPos);
      const maxSyncRange = p.config.radius * 4.5;
      if (dist < maxSyncRange && dist < minDistance) {
        minDistance = dist;
        closestPlanet = p;
      }
    }

    if (closestPlanet) {
      this.syncedPlanet = closestPlanet;
      this.lastPlanetWorldPos.copy(closestPlanet.getWorldPosition());
      this.audio.playCheckpointActivated();
      this.hud.showCheckpointNotification(`🛰️ ÓRBITA SINCRONIZADA com ${closestPlanet.config.name}!`);
      const syncBtn = document.getElementById('sync-orbit-btn');
      if (syncBtn) syncBtn.style.background = 'rgba(0, 255, 136, 0.45)';
    } else {
      this.hud.showCheckpointNotification('Aproxime-se da órbita de um planeta para sincronizar [O]!');
    }
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    // 1. Atualização dos Controles e Dinâmica da Nave
    const flightInfo = this.controls.update(delta);

    if (flightInfo) {
      // Modulação sonora dos propulsores da nave
      this.audio.updateEngine(flightInfo.throttleRatio, flightInfo.isBoosting);

      // Partículas de velocidade relativa
      this.starfield.update(this.ship.mesh.position, flightInfo.velocity, flightInfo.isBoosting);
    }

    // 2. Atualização dos Corpos Celestes (Translação e Rotação)
    this.sun.update(delta);
    this.celestialSystem.update(delta);
    this.asteroidField.update(delta);
    this.merchantShip.update(delta);
    const regeneratedSamples = this.collectibleManager.update(delta);
    if (regeneratedSamples) {
      this.hud.showCheckpointNotification('As 30 amostras foram regeneradas em novas posições.');
    }

    // 2.5 Sincronização Orbital: Move a nave junto com o planeta sincronizado
    if (this.syncedPlanet) {
      // Desconecta se o jogador usar propulsão manual
      if (this.controls.keys.forward || this.controls.keys.boost || this.controls.keys.reverse) {
        this.syncedPlanet = null;
        this.hud.showCheckpointNotification('Voo Livre: Órbita Desconectada');
        const syncBtn = document.getElementById('sync-orbit-btn');
        if (syncBtn) syncBtn.style.background = 'rgba(14, 165, 233, 0.25)';
      } else {
        // Calcula o delta de posição do planeta entre frames e aplica à nave
        const newPlanetPos = this.syncedPlanet.getWorldPosition();
        const deltaPos = newPlanetPos.clone().sub(this.lastPlanetWorldPos);
        this.ship.mesh.position.add(deltaPos);
        this.lastPlanetWorldPos.copy(newPlanetPos);
      }
    }

    // 3. Verificação de Colisão Física (Planetas, Luas, Sol e Asteroides)
    // A resposta física (push-out + rebote) SEMPRE acontece quando há sobreposição,
    // independentemente da invulnerabilidade. Dano é aplicado separadamente.
    if (!this.ship.isDead) {
      const shipPos = this.ship.mesh.position;
      const shipRad = CONFIG.SHIP.collisionRadius;

      // A) Colisão com o Sol Central
      const sunDist = shipPos.length();
      const sunMinSafe = CONFIG.SUN.radius + shipRad;
      if (sunDist < sunMinSafe) {
        // Resposta física: empurra nave para fora SEMPRE
        const normal = shipPos.clone().normalize();
        this.ship.mesh.position.copy(normal.multiplyScalar(sunMinSafe + 25));
        // Rebote: inverte e reduz velocidade
        if (this.controls.speed > 0) this.controls.speed = -this.controls.speed * 0.5;

        // Dano: apenas se não estiver invulnerável
        if (this.ship.takeDamage(50)) {
          this.audio.playCollision();
          if (this.ship.isDead) {
            this.handleShipDeath();
          }
        }
      }

      // B) Colisão com a Superfície dos Planetas e suas Luas
      for (let i = 0; i < this.celestialSystem.planets.length; i++) {
        const p = this.celestialSystem.planets[i];
        const pPos = p.getWorldPosition();
        const dist = shipPos.distanceTo(pPos);
        const minSafeDist = p.config.radius + shipRad;

        if (dist < minSafeDist) {
          // Resposta física: empurra nave para fora SEMPRE
          const normal = shipPos.clone().sub(pPos).normalize();
          this.ship.mesh.position.copy(pPos).addScaledVector(normal, minSafeDist + 15);
          // Rebote
          if (this.controls.speed > 0) this.controls.speed = -this.controls.speed * 0.4;

          // Dano
          if (this.ship.takeDamage(35)) {
            this.audio.playCollision();
            if (this.ship.isDead) {
              this.handleShipDeath();
            }
          }
        }

        // Colisão com as Luas
        if (p.moons) {
          for (let m = 0; m < p.moons.length; m++) {
            const moon = p.moons[m];
            const mPos = moon.getWorldPosition ? moon.getWorldPosition() : pPos;
            const mDist = shipPos.distanceTo(mPos);
            const mMinDist = moon.radius + shipRad;

            if (mDist < mMinDist) {
              // Resposta física: empurra nave para fora SEMPRE
              const normal = shipPos.clone().sub(mPos).normalize();
              this.ship.mesh.position.copy(mPos).addScaledVector(normal, mMinDist + 10);
              if (this.controls.speed > 0) this.controls.speed = -this.controls.speed * 0.4;

              // Dano
              if (this.ship.takeDamage(35)) {
                this.audio.playCollision();
                if (this.ship.isDead) {
                  this.handleShipDeath();
                }
              }
            }
          }
        }
      }

      // C) Colisão com Asteroides (Cinturões e Anéis)
      const collision = this.asteroidField.checkCollision(
        this.ship.mesh.position,
        CONFIG.SHIP.collisionRadius,
        this.celestialSystem
      );

      if (collision.collided) {
        // Resposta física SEMPRE: empurra para fora e rebote
        const astMinSafe = (collision.asteroid ? collision.asteroid.radius : 10) + shipRad;
        this.ship.mesh.position.addScaledVector(collision.normal, astMinSafe + 5);
        if (this.controls.speed > 0) this.controls.speed = -this.controls.speed * 0.3;

        // Dano
        if (this.ship.takeDamage(collision.damage)) {
          this.audio.playCollision();
          if (this.ship.isDead) {
            this.handleShipDeath();
          }
        }
      }
    }

    // 4. Verificação de Coleta de Amostras Científicas
    if (!this.ship.isDead) {
      const collected = this.collectibleManager.checkCollection(
        this.ship.mesh.position,
        32,
        this.controls.keys.collecting
      );
      if (collected.length > 0) {
        this.audio.playCrystalPickup();

        collected.forEach(c => {
          this.marketManager.registerSample(c);
        });
      }
    }

    // 5. Atualização da Interface HUD
    if (flightInfo) {
      this.hud.update(
        this.ship,
        flightInfo,
        this.celestialSystem,
        this.collectibleManager,
        this.camera
      );
    }

    // 6. Renderização da Cena
    this.renderer.render(this.scene, this.camera);
  }
}

// Inicia o jogo ao carregar o DOM
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
