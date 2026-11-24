// Gerador Procedural de Texturas Autorais usando HTML5 Canvas e Three.js
// Cria texturas 100% originais e autorais sem depender de imagens externas baixadas,
// atendendo diretamente aos critérios de avaliação da disciplina de Computação Gráfica.

import * as THREE from 'three';

// Implementação leve de Simplex/Perlin Noise 2D para geração procedural
class SimpleNoise {
  constructor(seed = 12345) {
    this.p = new Uint8Array(512);
    const perm = new Uint8Array(256);
    for (let i = 0; i < 256; i++) perm[i] = i;
    
    // Embaralha com semente
    let s = seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = s % (i + 1);
      const tmp = perm[i];
      perm[i] = perm[j];
      perm[j] = tmp;
    }
    for (let i = 0; i < 512; i++) {
      this.p[i] = perm[i & 255];
    }
  }

  fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  lerp(t, a, b) { return a + t * (b - a); }
  grad(hash, x, y) {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise2D(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = this.fade(xf);
    const v = this.fade(yf);

    const aa = this.p[this.p[X] + Y];
    const ab = this.p[this.p[X] + Y + 1];
    const ba = this.p[this.p[X + 1] + Y];
    const bb = this.p[this.p[X + 1] + Y + 1];

    return this.lerp(v,
      this.lerp(u, this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf)),
      this.lerp(u, this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1))
    );
  }

  // Ruído fractal (Fractal Brownian Motion)
  fbm(x, y, octaves = 5, persistence = 0.5, lacunarity = 2.0) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }
    return total / maxValue;
  }
}

export class TextureGenerator {
  constructor() {
    this.noise = new SimpleNoise(4242);
    this.cache = new Map();
  }

  // 1. Textura do Sol (Plasma solar incandescente com manchas e convecção)
  createSunTexture(size = 1024) {
    if (this.cache.has('sun')) return this.cache.get('sun');

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size / 2;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(canvas.width, canvas.height);
    const data = imgData.data;

    for (let y = 0; y < canvas.height; y++) {
      const ny = (y / canvas.height) * Math.PI;
      const sinNy = Math.sin(ny);
      for (let x = 0; x < canvas.width; x++) {
        const nx = (x / canvas.width) * Math.PI * 2;
        // Mapeamento esférico
        const px = Math.cos(nx) * sinNy * 4;
        const py = Math.sin(nx) * sinNy * 4;
        const pz = Math.cos(ny) * 4;

        const n1 = (this.noise.fbm(px, py, 4) + 1) * 0.5;
        const n2 = (this.noise.fbm(py + 10, pz + 10, 3) + 1) * 0.5;
        const turbulence = Math.sin(px * 3 + n1 * 5) * 0.5 + 0.5;
        const val = n1 * 0.6 + turbulence * 0.4;

        const idx = (y * canvas.width + x) * 4;
        // Gradiente de plasma: branco amarelado -> laranja -> vermelho profundo
        data[idx] = Math.min(255, 255);                     // R
        data[idx + 1] = Math.min(255, Math.floor(160 + val * 95)); // G
        data[idx + 2] = Math.min(255, Math.floor(val * 80));       // B
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    this.cache.set('sun', texture);
    return texture;
  }

  // 2. Textura do Planeta de Lava (Ignis: crosta basáltica com fraturas de magma)
  createLavaTexture(size = 1024) {
    if (this.cache.has('lava')) return this.cache.get('lava');

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size / 2;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(canvas.width, canvas.height);
    const data = imgData.data;

    // Emissive canvas para fraturas brilhantes
    const emissiveCanvas = document.createElement('canvas');
    emissiveCanvas.width = canvas.width;
    emissiveCanvas.height = canvas.height;
    const eCtx = emissiveCanvas.getContext('2d');
    const eImgData = eCtx.createImageData(canvas.width, canvas.height);
    const eData = eImgData.data;

    for (let y = 0; y < canvas.height; y++) {
      const ny = (y / canvas.height) * Math.PI;
      const sinNy = Math.sin(ny);
      for (let x = 0; x < canvas.width; x++) {
        const nx = (x / canvas.width) * Math.PI * 2;
        const px = Math.cos(nx) * sinNy * 5;
        const py = Math.sin(nx) * sinNy * 5;
        const pz = Math.cos(ny) * 5;

        // Efeito de veias / rachaduras (Worley/Voronoi aproximado por abs(noise))
        const n = Math.abs(this.noise.fbm(px * 1.5, py * 1.5, 5));
        const cracks = Math.pow(1.0 - Math.min(1.0, n * 2.8), 3.0); // 1 = rachadura de magma

        const rockBase = (this.noise.fbm(px * 3, pz * 3, 3) + 1) * 0.5;

        const idx = (y * canvas.width + x) * 4;

        if (cracks > 0.35) {
          // Magma incandescente
          const intensity = (cracks - 0.35) / 0.65;
          data[idx] = 255;
          data[idx + 1] = Math.floor(100 + intensity * 155);
          data[idx + 2] = Math.floor(intensity * 40);
          data[idx + 3] = 255;

          eData[idx] = 255;
          eData[idx + 1] = Math.floor(80 + intensity * 140);
          eData[idx + 2] = 0;
          eData[idx + 3] = 255;
        } else {
          // Rocha basáltica escura
          const r = Math.floor(25 + rockBase * 35);
          data[idx] = r + 15;
          data[idx + 1] = r;
          data[idx + 2] = r - 5;
          data[idx + 3] = 255;

          eData[idx] = 0;
          eData[idx + 1] = 0;
          eData[idx + 2] = 0;
          eData[idx + 3] = 255;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    eCtx.putImageData(eImgData, 0, 0);

    const diffuse = new THREE.CanvasTexture(canvas);
    diffuse.wrapS = THREE.RepeatWrapping;
    diffuse.wrapT = THREE.ClampToEdgeWrapping;

    const emissive = new THREE.CanvasTexture(emissiveCanvas);
    emissive.wrapS = THREE.RepeatWrapping;
    emissive.wrapT = THREE.ClampToEdgeWrapping;

    const result = { diffuse, emissive };
    this.cache.set('lava', result);
    return result;
  }

  // 3. Textura do Planeta Floresta (Gaea: Oceanos azuis, continentes verdes e montanhas)
  createForestTexture(size = 1024) {
    if (this.cache.has('forest')) return this.cache.get('forest');

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size / 2;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(canvas.width, canvas.height);
    const data = imgData.data;

    for (let y = 0; y < canvas.height; y++) {
      const ny = (y / canvas.height) * Math.PI;
      const sinNy = Math.sin(ny);
      const isPolar = Math.abs(y - canvas.height / 2) / (canvas.height / 2); // 0 no equador, 1 nos polos

      for (let x = 0; x < canvas.width; x++) {
        const nx = (x / canvas.width) * Math.PI * 2;
        const px = Math.cos(nx) * sinNy * 3.5;
        const py = Math.sin(nx) * sinNy * 3.5;
        const pz = Math.cos(ny) * 3.5;

        // Elevação do terreno
        let height = (this.noise.fbm(px, py, 6) + 1) * 0.5;

        // Calotas polares
        const polarFactor = Math.pow(isPolar, 4.5);
        height += polarFactor * 0.5;

        const idx = (y * canvas.width + x) * 4;

        if (polarFactor > 0.45) {
          // Gelo polar
          data[idx] = 230;
          data[idx + 1] = 240;
          data[idx + 2] = 255;
        } else if (height < 0.46) {
          // Oceano profundo e águas costeiras
          const depth = height / 0.46;
          data[idx] = Math.floor(10 + depth * 25);
          data[idx + 1] = Math.floor(50 + depth * 70);
          data[idx + 2] = Math.floor(140 + depth * 80);
        } else if (height < 0.50) {
          // Praias / litoral de areia
          data[idx] = 195;
          data[idx + 1] = 180;
          data[idx + 2] = 130;
        } else if (height < 0.72) {
          // Florestas densas e vales verdes
          const lush = (height - 0.50) / 0.22;
          data[idx] = Math.floor(25 + lush * 40);
          data[idx + 1] = Math.floor(130 - lush * 35);
          data[idx + 2] = Math.floor(35 + lush * 20);
        } else if (height < 0.85) {
          // Montanhas rochosas
          const rock = (height - 0.72) / 0.13;
          data[idx] = Math.floor(110 + rock * 40);
          data[idx + 1] = Math.floor(95 + rock * 35);
          data[idx + 2] = Math.floor(80 + rock * 30);
        } else {
          // Picos nevados
          data[idx] = 240;
          data[idx + 1] = 245;
          data[idx + 2] = 250;
        }
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    this.cache.set('forest', texture);
    return texture;
  }

  // Camada de nuvens semi-transparentes para Gaea
  createCloudsTexture(size = 1024) {
    if (this.cache.has('clouds')) return this.cache.get('clouds');

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size / 2;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(canvas.width, canvas.height);
    const data = imgData.data;

    for (let y = 0; y < canvas.height; y++) {
      const ny = (y / canvas.height) * Math.PI;
      const sinNy = Math.sin(ny);
      for (let x = 0; x < canvas.width; x++) {
        const nx = (x / canvas.width) * Math.PI * 2;
        const px = Math.cos(nx) * sinNy * 4;
        const py = Math.sin(nx) * sinNy * 4;

        // Turbulência de nuvens atmosféricas
        const n = (this.noise.fbm(px * 1.8, py * 1.8, 5) + 1) * 0.5;
        const density = Math.max(0, (n - 0.48) / 0.52);

        const idx = (y * canvas.width + x) * 4;
        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
        data[idx + 3] = Math.floor(density * 220); // Transparência gradual
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    this.cache.set('clouds', texture);
    return texture;
  }

  // 4. Textura do Planeta de Gelo (Cryo: placas de gelo, geleiras azuladas e fendas)
  createIceTexture(size = 1024) {
    if (this.cache.has('ice')) return this.cache.get('ice');

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size / 2;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(canvas.width, canvas.height);
    const data = imgData.data;

    for (let y = 0; y < canvas.height; y++) {
      const ny = (y / canvas.height) * Math.PI;
      const sinNy = Math.sin(ny);
      for (let x = 0; x < canvas.width; x++) {
        const nx = (x / canvas.width) * Math.PI * 2;
        const px = Math.cos(nx) * sinNy * 5;
        const py = Math.sin(nx) * sinNy * 5;
        const pz = Math.cos(ny) * 5;

        const base = (this.noise.fbm(px, py, 5) + 1) * 0.5;
        const cracks = Math.abs(this.noise.fbm(px * 3, pz * 3, 4));

        const idx = (y * canvas.width + x) * 4;

        if (cracks < 0.12) {
          // Fissuras profundas de gelo ciano vítreo
          data[idx] = 40;
          data[idx + 1] = 160;
          data[idx + 2] = 220;
        } else {
          // Placas brancas e azuis de neve compacta
          data[idx] = Math.floor(190 + base * 65);
          data[idx + 1] = Math.floor(220 + base * 35);
          data[idx + 2] = 255;
        }
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    this.cache.set('ice', texture);
    return texture;
  }

  // Anéis planetários translúcidos com faixas estriadas para Cryo
  createRingsTexture(size = 512) {
    if (this.cache.has('rings')) return this.cache.get('rings');

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, size, 0);
    grad.addColorStop(0.0, 'rgba(180, 225, 255, 0.0)');
    grad.addColorStop(0.15, 'rgba(190, 230, 255, 0.7)');
    grad.addColorStop(0.28, 'rgba(150, 200, 240, 0.2)');
    grad.addColorStop(0.35, 'rgba(210, 240, 255, 0.85)');
    grad.addColorStop(0.55, 'rgba(140, 190, 235, 0.3)');
    grad.addColorStop(0.70, 'rgba(220, 245, 255, 0.9)');
    grad.addColorStop(0.85, 'rgba(180, 220, 250, 0.4)');
    grad.addColorStop(1.0, 'rgba(180, 220, 250, 0.0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, 32);

    // Linhas finas de divisão tipo Cassini
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(size * 0.48, 0, size * 0.04, 32);

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('rings', texture);
    return texture;
  }

  // Textura para Luas (rocha esburacada com crateras)
  createMoonTexture(size = 512) {
    if (this.cache.has('moon')) return this.cache.get('moon');

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size / 2;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(canvas.width, canvas.height);
    const data = imgData.data;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const u = x / canvas.width;
        const v = y / canvas.height;
        const n = (this.noise.fbm(u * 12, v * 12, 4) + 1) * 0.5;
        const gray = Math.floor(90 + n * 110);
        const idx = (y * canvas.width + x) * 4;
        data[idx] = gray;
        data[idx + 1] = gray;
        data[idx + 2] = gray + 5;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // Desenha círculos com gradiente simulando crateras de impacto
    for (let i = 0; i < 28; i++) {
      const cx = (Math.sin(i * 99) * 0.5 + 0.5) * canvas.width;
      const cy = (Math.cos(i * 37) * 0.5 + 0.5) * canvas.height;
      const cr = 6 + (i % 5) * 4;

      const radial = ctx.createRadialGradient(cx, cy, cr * 0.2, cx, cy, cr);
      radial.addColorStop(0, 'rgba(50, 50, 50, 0.7)');
      radial.addColorStop(0.7, 'rgba(80, 80, 80, 0.4)');
      radial.addColorStop(1, 'rgba(210, 210, 210, 0.8)'); // borda iluminada

      ctx.fillStyle = radial;
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    this.cache.set('moon', texture);
    return texture;
  }

  // Textura para Asteroides (rocha porosa irregular)
  createAsteroidTexture(size = 256) {
    if (this.cache.has('asteroid')) return this.cache.get('asteroid');

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const n = (this.noise.fbm(x / 30, y / 30, 4) + 1) * 0.5;
        const color = Math.floor(65 + n * 75);
        const idx = (y * size + x) * 4;
        data[idx] = color + 10;
        data[idx + 1] = color;
        data[idx + 2] = color - 10;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set('asteroid', texture);
    return texture;
  }

  // Textura metálica futurista para a fuselagem da nave
  createHullTexture(size = 512) {
    if (this.cache.has('hull')) return this.cache.get('hull');

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Fundo metálico titânio escuro
    ctx.fillStyle = '#1e242d';
    ctx.fillRect(0, 0, size, size);

    // Painéis de blindagem
    ctx.strokeStyle = '#384353';
    ctx.lineWidth = 3;
    const grid = 64;
    for (let x = 0; x < size; x += grid) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
    for (let y = 0; y < size; y += grid) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }

    // Rebites nos cantos dos painéis
    ctx.fillStyle = '#6b7a8d';
    for (let x = 0; x < size; x += grid) {
      for (let y = 0; y < size; y += grid) {
        ctx.beginPath();
        ctx.arc(x + 6, y + 6, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Faixa estilizada de pintura aeroespacial laranja néon
    ctx.fillStyle = '#ff7700';
    ctx.fillRect(0, size * 0.45, size, size * 0.08);

    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(size * 0.1, size * 0.55, size * 0.8, 4);

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('hull', texture);
    return texture;
  }

  // Converte string de cor ou hex para rgba CSS válido
  hexToRgba(color, alpha = 1.0) {
    if (typeof color === 'number') {
      const r = (color >> 16) & 255;
      const g = (color >> 8) & 255;
      const b = color & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    if (typeof color === 'string') {
      if (color.startsWith('rgb')) return color;
      let c = color.replace('#', '');
      if (c.length === 3) c = c.split('').map(x => x + x).join('');
      const num = parseInt(c, 16);
      if (!isNaN(num)) {
        const r = (num >> 16) & 255;
        const g = (num >> 8) & 255;
        const b = num & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
    }
    return `rgba(0, 229, 255, ${alpha})`;
  }

  // Sprite circular brilhante para propulsores da nave, sol e cristais
  createGlowSprite(colorHex = '#00ffff', size = 128) {
    const key = 'glow_' + colorHex;
    if (this.cache.has(key)) return this.cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.25, this.hexToRgba(colorHex, 0.95));
    grad.addColorStop(0.65, this.hexToRgba(colorHex, 0.35));
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set(key, texture);
    return texture;
  }
}
