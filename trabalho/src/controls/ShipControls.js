// Controlador de Voo em Terceira Pessoa e Dinâmica Espacial
// Implementa física inercial de voo espacial, manobras de rolagem (roll), arfagem (pitch),
// guinada (yaw), impulso turbo (boost/warp) e câmera perseguidora suave (chase camera)

import * as THREE from 'three';
import { CONFIG } from '../config.js';

export class ShipControls {
  constructor(ship, camera, domElement) {
    this.ship = ship;
    this.camera = camera;
    this.domElement = domElement || document.body;

    // Estado das teclas
    this.keys = {
      pitchUp: false,     // S ou Seta Baixo
      pitchDown: false,   // W ou Seta Cima
      yawLeft: false,     // A ou Seta Esquerda
      yawRight: false,    // D ou Seta Direita
      rollLeft: false,    // Q
      rollRight: false,   // E
      forward: false,     // Space
      reverse: false,     // Shift Direito ou B
      boost: false,       // Shift Esquerdo
      collecting: false   // G: coleta amostras enquanto pressionada
    };

    // Física e velocidades
    this.speed = 0;
    this.targetSpeed = 0;
    this.speedLimit = CONFIG.SHIP.speedMaxNormal;
    this.boostSpeed = CONFIG.SHIP.speedBoost;
    this.engineLevel = 0;
    this.boostCapacity = CONFIG.SHIP.boostMaxFuel;
    this.fuelLevel = 0;
    this.infiniteBoost = false;
    this.velocity = new THREE.Vector3();
    this.angularVelocity = new THREE.Vector3();

    // Modos de câmera (0: 3ª pessoa padrão, 1: 3ª pessoa afastada, 2: 1ª pessoa cockpit)
    this.cameraMode = 0;
    this.cameraOffsets = [
      new THREE.Vector3(0, 2.2, -7.2),  // Padrão atrás da nave
      new THREE.Vector3(0, 5.0, -16.0), // Ampla visão tática
      new THREE.Vector3(0, 0.45, 0.6)   // Cockpit
    ];

    this.currentCameraPos = new THREE.Vector3();
    this.currentLookAt = new THREE.Vector3();

    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
  }

  onKeyDown(e) {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.pitchDown = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.pitchUp = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.yawLeft = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.yawRight = true;
        break;
      case 'KeyQ':
        this.keys.rollLeft = true;
        break;
      case 'KeyE':
        this.keys.rollRight = true;
        break;
      case 'Space':
        this.keys.forward = true;
        break;
      case 'KeyX':
      case 'KeyB':
        this.keys.reverse = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.boost = true;
        break;
      case 'KeyC':
        // Alterna entre os modos de câmera
        this.cameraMode = (this.cameraMode + 1) % this.cameraOffsets.length;
        break;
      case 'KeyG':
        this.keys.collecting = true;
        break;
      case 'Digit8':
      case 'Numpad8':
        if (!e.repeat) this.infiniteBoost = !this.infiniteBoost;
        break;
    }
  }

  onKeyUp(e) {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.pitchDown = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.pitchUp = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.yawLeft = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.yawRight = false;
        break;
      case 'KeyQ':
        this.keys.rollLeft = false;
        break;
      case 'KeyE':
        this.keys.rollRight = false;
        break;
      case 'Space':
        this.keys.forward = false;
        break;
      case 'KeyX':
      case 'KeyB':
        this.keys.reverse = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.boost = false;
        break;
      case 'KeyG':
        this.keys.collecting = false;
        break;
    }
  }

  update(delta) {
    if (this.ship.isDead) return;

    // 1. Gerenciamento do Tanque de Boost (Turbo Warp)
    let isBoosting = false;
    if (this.keys.boost && (this.infiniteBoost || this.ship.boostFuel > 5) && this.keys.forward) {
      isBoosting = true;
      if (!this.infiniteBoost) {
        this.ship.boostFuel = Math.max(0, this.ship.boostFuel - CONFIG.SHIP.boostDrainRate * delta);
      }
    } else {
      this.ship.boostFuel = Math.min(
        this.boostCapacity,
        this.ship.boostFuel + CONFIG.SHIP.boostRechargeRate * delta
      );
    }

    // 2. Cálculo da Velocidade Alvo
    if (isBoosting) {
      this.targetSpeed = this.boostSpeed;
    } else if (this.keys.forward) {
      this.targetSpeed = this.speedLimit;
    } else if (this.keys.reverse) {
      this.targetSpeed = -CONFIG.SHIP.speedCruise * 0.4;
    } else {
      // Velocidade de cruzeiro inercial
      this.targetSpeed = CONFIG.SHIP.speedCruise * 0.3;
    }

    // Interpolação de aceleração
    const accelRate = (this.targetSpeed > this.speed) ? CONFIG.SHIP.acceleration : CONFIG.SHIP.deceleration;
    this.speed = THREE.MathUtils.lerp(this.speed, this.targetSpeed, Math.min(1.0, accelRate * delta * 0.05));

    // 3. Rotação e Manobrabilidade
    const rotSpeed = 1.6;
    let targetPitch = 0;
    let targetYaw = 0;
    let targetRoll = 0;

    if (this.keys.pitchDown) targetPitch += CONFIG.SHIP.pitchRate * rotSpeed;
    if (this.keys.pitchUp) targetPitch -= CONFIG.SHIP.pitchRate * rotSpeed;

    if (this.keys.yawLeft) {
      targetYaw += CONFIG.SHIP.yawRate * rotSpeed;
      targetRoll += 0.8; // Efeito de inclinação bancada ao virar
    }
    if (this.keys.yawRight) {
      targetYaw -= CONFIG.SHIP.yawRate * rotSpeed;
      targetRoll -= 0.8;
    }

    if (this.keys.rollLeft) targetRoll += CONFIG.SHIP.rollRate * rotSpeed;
    if (this.keys.rollRight) targetRoll -= CONFIG.SHIP.rollRate * rotSpeed;

    // Aplica rotações relativas aos eixos locais da nave
    this.ship.mesh.rotateX(targetPitch * delta);
    this.ship.mesh.rotateY(targetYaw * delta);
    this.ship.mesh.rotateZ(targetRoll * delta);

    // 4. Translação no Espaço 3D
    // A nave se desloca na direção frontal local (eixo +Z da geometria da nave)
    const forwardVector = new THREE.Vector3(0, 0, 1).applyQuaternion(this.ship.mesh.quaternion);
    this.velocity.copy(forwardVector).multiplyScalar(this.speed);
    this.ship.mesh.position.addScaledVector(this.velocity, delta);

    // 5. Atualização da Câmera em 3ª Pessoa (Chase Camera com Lerp)
    this.updateCamera(delta, isBoosting);

    // 6. Atualização visual dos efeitos da nave
    const throttleRatio = Math.max(0, this.speed / this.speedLimit);
    this.ship.update(delta, throttleRatio, isBoosting);

    return {
      speed: this.speed,
      throttleRatio,
      isBoosting,
      infiniteBoost: this.infiniteBoost,
      boostCapacity: this.boostCapacity,
      velocity: this.velocity
    };
  }

  // Zera o movimento residual ao reiniciar uma tentativa.
  resetMotion() {
    this.speed = 0;
    this.targetSpeed = 0;
    this.velocity.set(0, 0, 0);
    this.angularVelocity.set(0, 0, 0);
  }

  resetUpgrades() {
    this.speedLimit = CONFIG.SHIP.speedMaxNormal;
    this.boostSpeed = CONFIG.SHIP.speedBoost;
    this.engineLevel = 0;
    this.boostCapacity = CONFIG.SHIP.boostMaxFuel;
    this.fuelLevel = 0;
  }

  updateCamera(delta, isBoosting) {
    const offset = this.cameraOffsets[this.cameraMode].clone();

    // Dinâmica de recuo quando em alta velocidade / turbo
    if (isBoosting && this.cameraMode !== 2) {
      offset.z -= 3.5;
      offset.y += 0.6;
    }

    // Posição ideal no espaço global baseada na orientação da nave
    const idealOffset = offset.applyQuaternion(this.ship.mesh.quaternion);
    const idealPosition = this.ship.mesh.position.clone().add(idealOffset);

    // Ponto focal para onde a câmera deve olhar (à frente da nave)
    const lookAheadDist = (this.cameraMode === 2) ? 50 : 25;
    const lookAhead = new THREE.Vector3(0, 0, lookAheadDist)
      .applyQuaternion(this.ship.mesh.quaternion)
      .add(this.ship.mesh.position);

    // Suavização da câmera (Lerp)
    const lerpFactor = (this.cameraMode === 2) ? 1.0 : CONFIG.WORLD.CAMERA_LERP;
    this.camera.position.lerp(idealPosition, lerpFactor);

    if (this.currentLookAt.lengthSq() === 0) {
      this.currentLookAt.copy(lookAhead);
    } else {
      this.currentLookAt.lerp(lookAhead, lerpFactor * 1.5);
    }

    this.camera.lookAt(this.currentLookAt);

    // Efeito sutil de FOV dinâmico durante boost
    const speedRatio = Math.min(1, Math.abs(this.speed) / CONFIG.SHIP.maxBoostSpeed);
    const targetFov = CONFIG.WORLD.FOV + speedRatio * 25;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, delta * 3.0);
    this.camera.updateProjectionMatrix();
  }
}
