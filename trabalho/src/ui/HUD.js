// Interface HUD (Heads-Up Display) em Tempo Real
// Exibe Integridade da Nave, Tanque de Boost, Amostras Coletadas por Planeta,
// Velocímetro, Bússola/Radar 3D para objetivos e Notificações de Checkpoint

import * as THREE from 'three';

export class HUD {
  constructor() {
    this.domElements = {
      healthBar: document.getElementById('health-bar-fill'),
      healthText: document.getElementById('health-text'),
      boostBar: document.getElementById('boost-bar-fill'),
      boostText: document.getElementById('boost-text'),
      speedText: document.getElementById('speed-value'),
      warpBadge: document.getElementById('warp-badge'),
      totalCrystals: document.getElementById('total-crystals'),
      targetDistance: document.getElementById('target-distance'),
      targetName: document.getElementById('target-name'),
      radarArrow: document.getElementById('radar-arrow'),
      checkpointAlert: document.getElementById('checkpoint-alert'),
      checkpointAlertText: document.getElementById('checkpoint-alert-text'),
      deathScreen: document.getElementById('death-screen'),
      victoryScreen: document.getElementById('victory-screen')
    };

    this.alertTimeout = null;
  }

  // Atualização frame a frame das métricas do HUD
  update(ship, speedInfo, celestialSystem, collectibleManager, camera) {
    if (!this.domElements.healthBar) return;

    // 1. Integridade da Nave
    const maxHealth = ship.maxHealth || 100;
    const healthPercent = Math.max(0, Math.min(100, (ship.health / maxHealth) * 100));
    this.domElements.healthBar.style.width = `${healthPercent}%`;
    this.domElements.healthText.textContent = `${Math.ceil(ship.health)}/${Math.ceil(maxHealth)}`;

    if (healthPercent > 50) {
      this.domElements.healthBar.style.background = 'linear-gradient(90deg, #00ff88, #00d4ff)';
    } else if (healthPercent > 25) {
      this.domElements.healthBar.style.background = 'linear-gradient(90deg, #ffbb00, #ff8800)';
    } else {
      this.domElements.healthBar.style.background = 'linear-gradient(90deg, #ff3344, #ff0055)';
    }

    // 2. Tanque de Propulsão Boost
    const boostCapacity = speedInfo.boostCapacity || 100;
    const boostPercent = (ship.boostFuel / boostCapacity) * 100;
    this.domElements.boostBar.style.width = `${boostPercent}%`;
    this.domElements.boostText.textContent = `${Math.round(boostPercent)}%`;

    // 3. Velocímetro
    const curSpeed = Math.round(speedInfo.speed);
    this.domElements.speedText.textContent = `${curSpeed} u/s`;

    if (speedInfo.isBoosting && speedInfo.infiniteBoost) {
      this.domElements.warpBadge.classList.add('active');
      this.domElements.warpBadge.textContent = '⚡ TURBO INFINITO ATIVO';
    } else if (speedInfo.isBoosting) {
      this.domElements.warpBadge.classList.add('active');
      this.domElements.warpBadge.textContent = '⚡ PROPULSÃO TURBO ATIVA';
    } else {
      this.domElements.warpBadge.classList.remove('active');
      this.domElements.warpBadge.textContent = 'CRUZEIRO ESTELAR';
    }

    // 4. Progresso do estoque por planeta
    celestialSystem.planets.forEach(p => {
      const statEl = document.getElementById(`stat-${p.config.id}`);
      if (statEl) {
        statEl.textContent = `${p.samplesCollected}/5`;
      }
    });

    this.domElements.totalCrystals.textContent = `${collectibleManager.totalCollected}/${collectibleManager.inventoryCapacity}`;

    // 5. Radar e Direcionador do Alvo Mais Próximo
    const nearest = collectibleManager.getNearestActiveSample(ship.mesh.position);
    if (nearest) {
      this.domElements.targetName.textContent = `Amostra em ${nearest.crystal.planetName}`;
      this.domElements.targetDistance.textContent = `${Math.round(nearest.distance)} unidades`;

      // Projeta a posição do alvo na tela para guiar o radar/seta
      this.updateRadarArrow(nearest.position, ship.mesh, camera);
    } else {
      this.domElements.targetName.textContent = 'Todas as Amostras Coletadas!';
      this.domElements.targetDistance.textContent = 'Missão Concluída';
      if (this.domElements.radarArrow) {
        this.domElements.radarArrow.style.display = 'none';
      }
    }
  }

  // Calcula o ângulo na tela para a seta de navegação 3D
  updateRadarArrow(targetPos, shipMesh, camera) {
    if (!this.domElements.radarArrow) return;
    this.domElements.radarArrow.style.display = 'block';

    // Vetor direção local relativo à nave
    const shipPos = shipMesh.position;
    const toTarget = targetPos.clone().sub(shipPos).normalize();

    // Direção frontal e lateral da nave
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(shipMesh.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(shipMesh.quaternion);

    const dotForward = forward.dot(toTarget);
    const dotRight = right.dot(toTarget);

    // Ângulo de rotação da seta (0 graus = em frente)
    let angleRad = Math.atan2(dotRight, dotForward);
    let angleDeg = angleRad * (180 / Math.PI);

    this.domElements.radarArrow.style.transform = `rotate(${angleDeg}deg)`;
  }

  // Exibe uma notificação breve de sistema
  showCheckpointNotification(planetName) {
    if (!this.domElements.checkpointAlert) return;
    if (this.alertTimeout) clearTimeout(this.alertTimeout);

    this.domElements.checkpointAlertText.textContent = planetName;
    this.domElements.checkpointAlert.classList.add('visible');

    this.alertTimeout = setTimeout(() => {
      this.domElements.checkpointAlert.classList.remove('visible');
    }, 4500);
  }

  // Tela de Morte e Renascimento
  showDeathScreen(show = true) {
    if (this.domElements.deathScreen) {
      if (show) {
        this.domElements.deathScreen.classList.add('visible');
      } else {
        this.domElements.deathScreen.classList.remove('visible');
      }
    }
  }

  // Tela de Vitória ao coletar os 12 cristais
  showVictoryScreen(show = true) {
    if (this.domElements.victoryScreen) {
      if (show) {
        this.domElements.victoryScreen.classList.add('visible');
      } else {
        this.domElements.victoryScreen.classList.remove('visible');
      }
    }
  }
}
