/* ========================================
   HANDPLAY — Audio Manager
   Developed by Erick de S.C. Araujo + IA
   ======================================== */

class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.initialized = false;
    this.enabled = true;
    this.cache = {};
    this.loadingPromises = {};
  }

  async init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.connect(this.masterGain);

      this._applySettings();
      this.initialized = true;
      await this._preloadSounds();
    } catch (e) {
      console.warn('AudioManager: Web Audio not available', e);
    }
  }

  async playMusic(name) {
    if (!this.initialized || !this.enabled) return;
    this.resume();

    if (this.currentMusic) {
      try { this.currentMusic.stop(); } catch(e) {}
      this.currentMusic = null;
    }

    const buffer = this.cache[`music-${name}`];
    if (!buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(this.musicGain);
    source.start(0);
    this.currentMusic = source;
  }

  stopMusic() {
    if (this.currentMusic) {
      try { this.currentMusic.stop(); } catch(e) {}
      this.currentMusic = null;
    }
  }

  setMusicVolume(vol) {
    if (this.musicGain) {
      this.musicGain.gain.value = vol;
    }
  }

  async _getResourcesPath() {
    if (window.electronAPI) {
      return await window.electronAPI.getResourcesPath();
    }
    try {
      const test = await fetch('./resources/sounds/click.wav', { method: 'HEAD' });
      if (test.ok) return './resources';
    } catch (e) {}
    return '../resources';
  }

  async _preloadSounds() {
    const basePath = await this._getResourcesPath();

    const sounds = [
      'click', 'select', 'success', 'gameover', 'pop', 'score',
      'combo-1', 'combo-2', 'combo-3', 'combo-4', 'combo-5',
      'hit', 'miss', 'levelup',
      'balloon-pop', 'puzzle-snap', 'paddle-hit', 'coin',
      'dodge-hit', 'jump', 'step',
    ];

    for (const name of sounds) {
      this._loadSound(name, `${basePath}/sounds/${name}.wav`);
    }

    // Load music tracks
    const musicTracks = ['menu', 'game', 'ambient'];
    for (const name of musicTracks) {
      this._loadSound(`music-${name}`, `${basePath}/sounds/music-${name}.wav`);
    }
  }

  _loadSound(name, url) {
    if (this.loadingPromises[name]) return this.loadingPromises[name];

    this.loadingPromises[name] = fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then(buf => this.ctx.decodeAudioData(buf))
      .then(decoded => {
        this.cache[name] = decoded;
      })
      .catch(() => {
        // Sound file missing — will fall back to oscillator
        this.cache[name] = null;
      });

    return this.loadingPromises[name];
  }

  _applySettings() {
    if (!window.settingsManager) return;
    const master = window.settingsManager.get('audio.masterVolume') ?? 0.7;
    const sfx = window.settingsManager.get('audio.sfxVolume') ?? 0.8;
    const music = window.settingsManager.get('audio.musicVolume') ?? 0.5;
    this.enabled = window.settingsManager.get('audio.enabled') !== false;

    if (this.masterGain) this.masterGain.gain.value = this.enabled ? master : 0;
    if (this.sfxGain) this.sfxGain.gain.value = sfx;
    if (this.musicGain) this.musicGain.gain.value = music;
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  _playBuffer(name, playbackRate = 1.0) {
    if (!this.initialized || !this.enabled) return;
    this.resume();

    const buffer = this.cache[name];
    if (!buffer) {
      // Fallback to oscillator for missing sounds
      this._fallbackTone(name);
      return;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = playbackRate;
    source.connect(this.sfxGain);
    source.start(0);
  }

  _fallbackTone(name) {
    const toneMap = {
      click: { freq: 800, dur: 0.06 },
      select: { freq: 600, dur: 0.08 },
      pop: { freq: 1200, dur: 0.05 },
      score: { freq: 1000, dur: 0.05 },
      hit: { freq: 200, dur: 0.08 },
      miss: { freq: 150, dur: 0.12 },
      coin: { freq: 1500, dur: 0.05 },
      jump: { freq: 500, dur: 0.1 },
    };

    const t = toneMap[name];
    if (!t) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(t.freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + t.dur);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + t.dur);
  }

  playClick() { this._playBuffer('click'); this._playBuffer('click'); }
  playSelect() { this._playBuffer('select'); }
  playSuccess() { this._playBuffer('success'); }
  playGameOver() { this._playBuffer('gameover'); }
  playPop() { this._playBuffer('balloon-pop'); }
  playScore() { this._playBuffer('score'); }
  playHit() { this._playBuffer('hit'); }
  playMiss() { this._playBuffer('miss'); }
  playLevelUp() { this._playBuffer('levelup'); }
  playCoin() { this._playBuffer('coin'); }
  playJump() { this._playBuffer('jump'); }
  playStep() { this._playBuffer('step'); }
  playPaddleHit() { this._playBuffer('paddle-hit'); }
  playPuzzleSnap() { this._playBuffer('puzzle-snap'); }
  playDodgeHit() { this._playBuffer('dodge-hit'); }
  playBalloonPop() { this._playBuffer('balloon-pop'); }

  playCombo(multiplier) {
    const level = Math.min(5, Math.max(1, multiplier));
    this._playBuffer(`combo-${level}`);
  }
}

window.audioManager = new AudioManager();
