// Sintetizador de Áudio Procedural usando a Web Audio API nativa
// Gera efeitos sonoros em tempo real sem precisar de arquivos externos de áudio

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.engineOsc = null;
    this.engineGain = null;
    this.engineFilter = null;
    this.isMuted = false;
  }

  // Inicializa o contexto de áudio após interação do usuário (clique ou tecla)
  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.setupEngineSound();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API não suportada neste ambiente.', e);
    }
  }

  setupEngineSound() {
    if (!this.ctx) return;

    // Oscilador de zumbido do motor estelar
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // Tom grave

    // Filtro passa-baixa para suavizar o timbre metálico
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(140, this.ctx.currentTime);

    // Controle de volume
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    this.engineOsc.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);

    this.engineOsc.start();
  }

  // Modula o som do propulsor com base na aceleração e impulso
  updateEngine(throttleRatio, isBoosting) {
    if (!this.initialized || !this.ctx || this.isMuted) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;
    let targetFreq = 50 + throttleRatio * 75;
    let filterFreq = 120 + throttleRatio * 220;
    let targetGain = 0.03 + throttleRatio * 0.08;

    if (isBoosting) {
      targetFreq += 80;
      filterFreq += 400;
      targetGain += 0.08;
    }

    this.engineOsc.frequency.setTargetAtTime(targetFreq, t, 0.08);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, t, 0.08);
    this.engineGain.gain.setTargetAtTime(targetGain, t, 0.08);
  }

  // Som de coleta de amostra científica de cristal (acorde arpejado brilhante)
  playCrystalPickup() {
    if (!this.initialized || !this.ctx || this.isMuted) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // Acorde Maior C5, E5, G5, C6
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.18, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.36);
    });
  }

  // Som de colisão com asteroide (impacto com ruído metálico)
  playCollision() {
    if (!this.initialized || !this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Ruído branco sintetizado
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, now);
    filter.Q.setValueAtTime(1.5, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.28);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);

    // Oscilador grave de estalo
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);

    oscGain.gain.setValueAtTime(0.3, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.23);
  }

  // Som de Checkpoint seguro ativado (fanfarra sintetizada triunfal)
  playCheckpointActivated() {
    if (!this.initialized || !this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const melody = [
      { f: 440, t: 0.0 },   // A4
      { f: 554.37, t: 0.15 }, // C#5
      { f: 659.25, t: 0.30 }, // E5
      { f: 880, t: 0.45 }    // A5
    ];

    melody.forEach(m => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(m.f, now + m.t);
      gain.gain.setValueAtTime(0.2, now + m.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + m.t + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + m.t);
      osc.stop(now + m.t + 0.45);
    });
  }

  // Som de destruição da nave
  playShipExplosion() {
    if (!this.initialized || !this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.8;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.25));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.78);

    noise.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }
}
