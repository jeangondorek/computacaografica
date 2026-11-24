// Contratos e melhorias da nave cargueira.
import { CONFIG } from '../config.js';
export class MarketManager {
  constructor(game) {
    this.game = game;
    this.credits = Number.parseInt(window.localStorage.getItem('explorador-estelar-creditos') || '0', 10) || 0;
    this.offers = [];
    this.activeContract = null;
    this.generateOffers();
  }

  generateOffers() {
    const planets = this.game.celestialSystem.planets;
    this.offers = Array.from({ length: 3 }, (_, index) => {
      const planet = planets[Math.floor(Math.random() * planets.length)];
      const quantity = 1 + Math.floor(Math.random() * (index + 1));
      const difficulty = planet.config.id === 'anel' ? 2 : planet.config.id === 'agua' ? 1 : 0;
      return {
        id: `${Date.now()}_${index}`,
        planetId: planet.config.id,
        planetName: planet.config.name,
        quantity,
        reward: 100 + quantity * 100 + difficulty * 150
      };
    });
  }

  acceptOffer(index) {
    if (this.activeContract) return false;
    const offer = this.offers[index];
    if (!offer) return false;
    this.activeContract = { ...offer, collected: 0 };
    // Também considera amostras já coletadas pelo hack de teste.
    this.syncContractProgress();
    return true;
  }

  syncContractProgress() {
    const contract = this.activeContract;
    if (!contract) return;
    const collected = this.game.collectibleManager.crystals.filter(crystal =>
      crystal.collected && crystal.planetId === contract.planetId
    ).length;
    contract.collected = Math.min(contract.quantity, collected);
  }

  registerSample(sample) {
    const contract = this.activeContract;
    if (!contract || contract.planetId !== sample.planetId || contract.collected >= contract.quantity) return;
    contract.collected++;
  }

  claimContract() {
    const contract = this.activeContract;
    if (!contract || contract.collected < contract.quantity) return false;
    const delivered = this.game.collectibleManager.deliverSamples(
      contract.planetId,
      contract.quantity
    );
    if (delivered < contract.quantity) return false;
    this.credits += contract.reward;
    this.saveCredits();
    this.activeContract = null;
    this.generateOffers();
    return true;
  }

  buyUpgrade(type) {
    const controls = this.game.controls;
    if (type === 'fuel' && this.credits >= 250) {
      if (controls.fuelLevel >= CONFIG.SHIP.maxFuelLevels) return false;
      this.credits -= 250;
      this.saveCredits();
      controls.fuelLevel++;
      controls.boostCapacity += 25;
      this.game.ship.boostFuel = controls.boostCapacity;
      return true;
    }
    if (type === 'engine' && this.credits >= 350) {
      if (controls.engineLevel >= CONFIG.SHIP.maxEngineLevels) return false;
      this.credits -= 350;
      this.saveCredits();
      controls.engineLevel++;
      controls.speedLimit = Math.min(CONFIG.SHIP.maxSpeedLimit, controls.speedLimit + 9);
      controls.boostSpeed = Math.min(CONFIG.SHIP.maxBoostSpeed, controls.boostSpeed + 100);
      return true;
    }
    if (type === 'hull' && this.credits >= 300) {
      if (this.game.ship.hullLevel >= CONFIG.SHIP.maxHullLevels) return false;
      this.credits -= 300;
      this.saveCredits();
      this.game.ship.hullLevel++;
      this.game.ship.maxHealth = Math.min(
        CONFIG.SHIP.maxHullHealth,
        this.game.ship.maxHealth + 20
      );
      this.game.ship.health = Math.min(this.game.ship.maxHealth, this.game.ship.health + 20);
      return true;
    }
    if (type === 'inventory' && this.credits >= CONFIG.INVENTORY.capacityUpgradeCost) {
      if (this.game.collectibleManager.inventoryCapacity >= CONFIG.INVENTORY.maxCapacity) return false;
      this.credits -= CONFIG.INVENTORY.capacityUpgradeCost;
      this.saveCredits();
      this.game.collectibleManager.inventoryCapacity = Math.min(
        CONFIG.INVENTORY.maxCapacity,
        this.game.collectibleManager.inventoryCapacity + CONFIG.INVENTORY.capacityUpgradeSize
      );
      return true;
    }
    if (type === 'repair' && this.credits >= 100 && this.game.ship.health < this.game.ship.maxHealth) {
      this.credits -= 100;
      this.saveCredits();
      this.game.ship.health = Math.min(this.game.ship.maxHealth, this.game.ship.health + 10);
      return true;
    }
    return false;
  }

  resetRun() {
    this.activeContract = null;
    this.generateOffers();
  }

  saveCredits() {
    window.localStorage.setItem('explorador-estelar-creditos', String(this.credits));
  }

  // Atalho de teste: adiciona créditos sem precisar completar contratos.
  addTestCredits(amount = 1000) {
    this.credits += amount;
    this.saveCredits();
  }
}
