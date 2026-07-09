/**
 * Gargantua 3D Black Hole Live Wallpaper - Pure Fullscreen 3D Raymarching Engine
 * Features Built-in FPS Limiter & Resolution Scaling for High Efficiency
 */

class CosmicAudioEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.volume = 0.55;
    this.masterGain = null;
    this.analyser = null;
    this.dataArray = null;
  }

  start() {
    if (this.isPlaying && this.ctx && this.ctx.state === 'running') return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!this.ctx) {
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      this.createDrone(43.65, 'sine', 0.42, 75);
      this.createDrone(43.95, 'triangle', 0.22, 110);

      this.createResonantPad(65.41, 0.16, 0.04);
      this.createResonantPad(77.78, 0.13, 0.035);
      this.createResonantPad(98.00, 0.11, 0.045);
      this.createResonantPad(130.81, 0.07, 0.03);

      this.createCosmicWind();
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isPlaying = true;
  }

  stop() {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend();
    }
    this.isPlaying = false;
  }

  setVolume(vol) {
    this.volume = vol;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.1);
    }
  }

  getAudioPulse() {
    if (!this.isPlaying || !this.analyser || !this.dataArray) return 0.0;
    this.analyser.getByteFrequencyData(this.dataArray);
    let sum = 0;
    for (let i = 0; i < 8; i++) {
      sum += this.dataArray[i];
    }
    const avg = sum / 8.0;
    return (avg / 255.0) * 1.5;
  }

  createDrone(freq, type, gainLevel, cutoff) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, this.ctx.currentTime);

    gain.gain.setValueAtTime(gainLevel, this.ctx.currentTime);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
  }

  createResonantPad(freq, gainLevel, lfoDepth) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 2.2, this.ctx.currentTime);
    filter.Q.setValueAtTime(4.5, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(0.04 + Math.random() * 0.03, this.ctx.currentTime);
    lfoGain.gain.setValueAtTime(freq * 0.6 * lfoDepth, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    gain.gain.setValueAtTime(gainLevel, this.ctx.currentTime);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
  }

  createCosmicWind() {
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 1.8;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(220, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(0.03, this.ctx.currentTime);
    lfoGain.gain.setValueAtTime(120, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.065, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start();
  }
}

class GargantuaEngine {
  constructor() {
    this.canvas = document.getElementById('glCanvas');

    this.config = {
      speed: 0.3,
      density: 1.0,
      lensing: 0.9,
      palette: 1,
      bloom: 0.8,
      scale: 0.7,
      autoOrbit: true,
      ambientMusic: true,
      musicVolume: 0.55,
      audioReact: true,
      fpsLimit: 30,
      qualityScale: 0.80,
      dopplerAsymmetry: 0.6,
      photonSparks: 1.0,
      nebulaBrightness: 1.0 // H-Alpha Crimson Emission Nebula brightness
    };

    this.audioEngine = new CosmicAudioEngine();

    this.cameraSpherical = {
      radius: 5.5,
      phi: 1.35,
      theta: 0.35
    };

    this.targetSpherical = { ...this.cameraSpherical };

    this.mouse = {
      isDragging: false,
      lastX: 0,
      lastY: 0
    };

    this.audioValue = 0.0;
    this.targetAudioValue = 0.0;
    this.lastFrameTime = performance.now();

    this.init();
  }

  init() {
    this.setupRenderer();
    this.setupScene();
    this.setupListeners();
    this.setupWallpaperEngineAPI();

    this.clock = new THREE.Clock();
    this.animate();
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      powerPreference: 'high-performance',
      antialias: false
    });
    this.applyResolutionScale();
  }

  applyResolutionScale() {
    const width = Math.floor(window.innerWidth * this.config.qualityScale);
    const height = Math.floor(window.innerHeight * this.config.qualityScale);
    this.renderer.setSize(width, height, false); // false keeps CSS display size at 100% fullscreen
    if (this.uniforms) {
      this.uniforms.uResolution.value.set(width, height);
    }
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.virtualCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    this.updateVirtualCamera();

    const renderWidth = Math.floor(window.innerWidth * this.config.qualityScale);
    const renderHeight = Math.floor(window.innerHeight * this.config.qualityScale);

    this.uniforms = {
      uResolution: { value: new THREE.Vector2(renderWidth, renderHeight) },
      uTime: { value: 0.0 },
      uCameraPos: { value: this.virtualCamera.position.clone() },
      uCameraMatrix: { value: this.virtualCamera.matrixWorld.clone() },
      uLensingStrength: { value: this.config.lensing },
      uDiskSpeed: { value: this.config.speed },
      uDiskDensity: { value: this.config.density },
      uColorPalette: { value: this.config.palette },
      uAudioPulse: { value: 0.0 },
      uBloomStrength: { value: this.config.bloom },
      uBlackHoleScale: { value: this.config.scale },
      uDopplerAsymmetry: { value: this.config.dopplerAsymmetry },
      uPhotonSparks: { value: this.config.photonSparks },
      uNebulaBrightness: { value: this.config.nebulaBrightness }
    };

    this.material = new THREE.ShaderMaterial({
      vertexShader: BlackHoleShader.vertexShader,
      fragmentShader: BlackHoleShader.fragmentShader,
      uniforms: this.uniforms,
      depthWrite: false,
      depthTest: false
    });

    const quadGeometry = new THREE.PlaneGeometry(2, 2);
    this.quad = new THREE.Mesh(quadGeometry, this.material);
    this.scene.add(this.quad);
  }

  updateVirtualCamera() {
    const r = this.cameraSpherical.radius;
    const phi = this.cameraSpherical.phi;
    const theta = this.cameraSpherical.theta;

    const x = r * Math.sin(phi) * Math.sin(theta);
    const y = r * Math.cos(phi);
    const z = r * Math.sin(phi) * Math.cos(theta);

    this.virtualCamera.position.set(x, y, z);
    this.virtualCamera.lookAt(0, -0.04, 0);
    this.virtualCamera.updateMatrixWorld(true);
  }

  setupListeners() {
    const startAudioInteraction = () => {
      if (this.config.ambientMusic && !this.audioEngine.isPlaying) {
        this.audioEngine.start();
      }
    };

    window.addEventListener('resize', () => this.onResize());

    window.addEventListener('mousedown', (e) => {
      startAudioInteraction();
      this.mouse.isDragging = true;
      this.mouse.lastX = e.clientX;
      this.mouse.lastY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      startAudioInteraction();
      if (!this.mouse.isDragging) return;
      const dx = e.clientX - this.mouse.lastX;
      const dy = e.clientY - this.mouse.lastY;

      this.targetSpherical.theta -= dx * 0.005;
      this.targetSpherical.phi = Math.max(0.2, Math.min(Math.PI - 0.2, this.targetSpherical.phi - dy * 0.005));

      this.mouse.lastX = e.clientX;
      this.mouse.lastY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.mouse.isDragging = false;
    });

    window.addEventListener('wheel', (e) => {
      this.targetSpherical.radius = Math.max(3.0, Math.min(10.0, this.targetSpherical.radius + e.deltaY * 0.003));
    });

    window.addEventListener('keydown', (e) => {
      startAudioInteraction();
      if (e.key.toLowerCase() === 'c') {
        this.config.palette = (this.config.palette + 1) % 7;
        this.uniforms.uColorPalette.value = this.config.palette;
      } else if (e.key === ' ') {
        this.config.autoOrbit = !this.config.autoOrbit;
      } else if (e.key.toLowerCase() === 'm') {
        this.config.ambientMusic = !this.config.ambientMusic;
        if (this.config.ambientMusic) {
          this.audioEngine.start();
        } else {
          this.audioEngine.stop();
        }
      }
    });
  }

  onResize() {
    this.virtualCamera.aspect = window.innerWidth / window.innerHeight;
    this.virtualCamera.updateProjectionMatrix();
    this.applyResolutionScale();
  }

  setupWallpaperEngineAPI() {
    window.wallpaperPropertyListener = {
      applyUserProperties: (properties) => {
        if (properties.scale) {
          this.config.scale = properties.scale.value;
          this.uniforms.uBlackHoleScale.value = this.config.scale;
        }
        if (properties.palette) {
          this.config.palette = properties.palette.value;
          this.uniforms.uColorPalette.value = this.config.palette;
        }
        if (properties.speed) {
          this.config.speed = properties.speed.value;
          this.uniforms.uDiskSpeed.value = this.config.speed;
        }
        if (properties.density) {
          this.config.density = properties.density.value;
          this.uniforms.uDiskDensity.value = this.config.density;
        }
        if (properties.lensing) {
          this.config.lensing = properties.lensing.value;
          this.uniforms.uLensingStrength.value = this.config.lensing;
        }
        if (properties.bloom) {
          this.config.bloom = properties.bloom.value;
          this.uniforms.uBloomStrength.value = this.config.bloom;
        }
        if (properties.autoOrbit !== undefined) {
          this.config.autoOrbit = properties.autoOrbit.value;
        }
        if (properties.ambientMusic !== undefined) {
          this.config.ambientMusic = properties.ambientMusic.value;
          if (this.config.ambientMusic) {
            this.audioEngine.start();
          } else {
            this.audioEngine.stop();
          }
        }
        if (properties.musicVolume !== undefined) {
          this.config.musicVolume = properties.musicVolume.value;
          this.audioEngine.setVolume(this.config.musicVolume);
        }
        if (properties.fpsLimit) {
          this.config.fpsLimit = properties.fpsLimit.value;
        }
        if (properties.qualityScale) {
          this.config.qualityScale = properties.qualityScale.value;
          this.applyResolutionScale();
        }
        if (properties.dopplerAsymmetry) {
          this.config.dopplerAsymmetry = properties.dopplerAsymmetry.value;
          this.uniforms.uDopplerAsymmetry.value = this.config.dopplerAsymmetry;
        }
        if (properties.photonSparks !== undefined) {
          this.config.photonSparks = properties.photonSparks.value ? 1.0 : 0.0;
          this.uniforms.uPhotonSparks.value = this.config.photonSparks;
        }
        if (properties.backgroundNebula) {
          this.config.nebulaBrightness = properties.backgroundNebula.value;
          this.uniforms.uNebulaBrightness.value = this.config.nebulaBrightness;
        }
      }
    };

    window.wallpaperRegisterAudioListener && window.wallpaperRegisterAudioListener((audioArray) => {
      if (!this.config.audioReact) return;
      let sum = 0;
      const sampleCount = Math.min(32, audioArray.length);
      for (let i = 0; i < sampleCount; i++) {
        sum += audioArray[i];
      }
      const avg = sum / sampleCount;
      this.targetAudioValue = Math.min(1.8, avg * 2.5);
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const now = performance.now();
    const elapsed = now - this.lastFrameTime;

    // Built-in FPS Limiter: if fpsLimit > 0, throttle to target interval; 0 = Unlimited / Uncapped
    if (this.config.fpsLimit > 0) {
      const frameInterval = 1000 / this.config.fpsLimit;
      if (elapsed < frameInterval) return;
      this.lastFrameTime = now - (elapsed % frameInterval);
    } else {
      this.lastFrameTime = now;
    }

    const dt = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    if (this.config.autoOrbit) {
      this.targetSpherical.theta += dt * 0.12;
    }

    this.cameraSpherical.radius += (this.targetSpherical.radius - this.cameraSpherical.radius) * 0.08;
    this.cameraSpherical.phi += (this.targetSpherical.phi - this.cameraSpherical.phi) * 0.08;
    this.cameraSpherical.theta += (this.targetSpherical.theta - this.cameraSpherical.theta) * 0.08;

    this.updateVirtualCamera();

    const internalPulse = this.audioEngine.getAudioPulse();
    this.targetAudioValue = Math.max(this.targetAudioValue, internalPulse);

    this.audioValue += (this.targetAudioValue - this.audioValue) * 0.15;
    this.targetAudioValue *= 0.96;

    if (this.uniforms) {
      this.uniforms.uTime.value = elapsedTime;
      this.uniforms.uCameraPos.value.copy(this.virtualCamera.position);
      this.uniforms.uCameraMatrix.value.copy(this.virtualCamera.matrixWorld);
      this.uniforms.uAudioPulse.value = this.audioValue;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.gargantuaApp = new GargantuaEngine();
});
