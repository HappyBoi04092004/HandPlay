/* ========================================
   HANDPLAY — Game Engine
   Developed by Erick de S.C. Araujo + IA
   ======================================== */

class Game {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.icon = config.icon;
    this.desc = config.desc;

    this.state = HP.GAME_STATES.LOADING;
    this.score = 0;
    this.level = 1;
    this.startTime = 0;
    this.elapsedTime = 0;
    this.timer = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.moves = 0;
    this.totalMoves = 0;
    this.hits = 0;
    this.misses = 0;

    this.canvas = null;
    this.ctx = null;
    this.running = false;
    this.animFrameId = null;
    this.lastFrameTime = 0;
  }

  start(canvas) {
    this.canvas = canvas || document.getElementById('game-canvas');
    this.ctx = this.canvas?.getContext('2d');
    this.score = 0;
    this.level = 1;
    this.moves = 0;
    this.hits = 0;
    this.misses = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.startTime = performance.now();
    this.elapsedTime = 0;
    this.timer = 0;
    this.state = HP.GAME_STATES.PLAYING;
    this.running = true;
    this.lastFrameTime = performance.now();
    this._gameLoop();
  }

  _gameLoop() {
    if (!this.running) return;

    const now = performance.now();
    const dt = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;
    this.elapsedTime = (now - this.startTime) / 1000;

    this.update(dt);

    window.particleSystem.update(dt);
    window.comboPopupSystem.update(dt);

    // Apply screen shake
    const shake = window.comboPopupSystem.getShakeOffset();
    if (this.ctx && (shake.x !== 0 || shake.y !== 0)) {
      this.ctx.save();
      this.ctx.translate(shake.x, shake.y);
    }

    this.render();

    if (this.ctx && (shake.x !== 0 || shake.y !== 0)) {
      this.ctx.restore();
    }

    window.particleSystem.render(this.ctx);
    window.comboPopupSystem.render(this.ctx);

    this.animFrameId = requestAnimationFrame(() => this._gameLoop());
  }

  update(dt) {
    // Override in subclasses
  }

  render() {
    // Override in subclasses
  }

  handleGesture(event) {
    // Override in subclasses
  }

  handleHands(hands) {
    // Override in subclasses
  }

  pause() {
    this.state = HP.GAME_STATES.PAUSED;
    this.running = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
  }

  resume() {
    this.state = HP.GAME_STATES.PLAYING;
    this.running = true;
    this.lastFrameTime = performance.now();
    this._gameLoop();
  }

  stop() {
    this.running = false;
    this.state = HP.GAME_STATES.STOPPED;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.particleSystem.clear();
    window.comboPopupSystem.clear();
  }

  gameOver() {
    this.state = HP.GAME_STATES.GAME_OVER;
    this.running = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
  }

  getResult() {
    return {
      game: this.id,
      score: this.score,
      accuracy: this.totalMoves > 0 ? Math.round((this.hits / this.totalMoves) * 100) : 0,
      time: Math.round(this.elapsedTime * 10) / 10,
      level: this.level,
      moves: this.moves,
      maxCombo: this.maxCombo,
    };
  }

  addScore(points) {
    const multiplier = Math.max(1, this.combo);
    this.score += points * multiplier;

    // Show popup at center-top
    const x = window.innerWidth / 2;
    const y = 120;
    window.comboPopupSystem.showScore(x, y, points * multiplier);
  }

  incrementCombo() {
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
  }

  resetCombo() {
    this.combo = 0;
  }

  _drawBackground(ctx) {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Draw camera feed as background if available
    const video = window.cameraManager?.getVideoElement();
    if (video && window.cameraManager?.isActive() && video.videoWidth && video.videoHeight) {
      ctx.save();
      if (window.renderer?.mirrored) {
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
      }
      const videoAspect = video.videoWidth / video.videoHeight;
      const canvasAspect = w / h;
      let drawW, drawH, drawX, drawY;
      if (videoAspect > canvasAspect) {
        drawH = h; drawW = h * videoAspect; drawX = (w - drawW) / 2; drawY = 0;
      } else {
        drawW = w; drawH = w / videoAspect; drawX = 0; drawY = (h - drawH) / 2;
      }
      ctx.globalAlpha = 0.7;
      ctx.drawImage(video, drawX, drawY, drawW, drawH);
      ctx.globalAlpha = 1;
      ctx.restore();
    } else {
      ctx.fillStyle = HP.COLORS.BG_PRIMARY;
      ctx.fillRect(0, 0, w, h);
    }
  }

  _drawText(ctx, text, x, y, options = {}) {
    const { size = 24, color = HP.COLORS.WHITE, align = 'center', font = 'Segoe UI' } = options;
    ctx.font = `${options.weight || 600} ${size}px "${font}", system-ui, sans-serif`;
    ctx.textAlign = align;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }
}

class GameEngine {
  constructor() {
    this.registry = {};
    this.currentGame = null;
    this.isTransitioning = false;

    this._gestureHandler = null;
    this._handsHandler = null;
  }

  register(gameClass, config) {
    this.registry[config.id] = {
      Class: gameClass,
      config: config,
    };
  }

  getGames() {
    return Object.values(this.registry).map(entry => entry.config);
  }

  getGameConfig(gameId) {
    return this.registry[gameId]?.config;
  }

  async launchGame(gameId) {
    if (this.isTransitioning) return false;

    const entry = this.registry[gameId];
    if (!entry) return false;

    this.isTransitioning = true;

    if (this.currentGame) {
      this.stopCurrentGame();
    }

    try {
      const canvas = document.getElementById('game-canvas');
      this.currentGame = new entry.Class(entry.config);

      this._gestureHandler = (event) => {
        if (this.currentGame && this.currentGame.state === HP.GAME_STATES.PLAYING) {
          this.currentGame.handleGesture(event);
        }
      };

    this._handsHandler = (hands) => {
      if (this.currentGame && this.currentGame.state === HP.GAME_STATES.PLAYING) {
        this.currentGame.handleHands(hands);
      }
    };

    window.gestureRecognition.onGesture(this._gestureHandler);
    window.handTracking.onResults(this._handsHandler);

    // Also connect fallback hands to game engine
    if (window.fallbackControls) {
      window.fallbackControls.onGesture(this._gestureHandler);
    }

      this.currentGame.start(canvas);
      this.isTransitioning = false;
      return true;
    } catch (e) {
      console.error('Failed to launch game:', e);
      this.isTransitioning = false;
      return false;
    }
  }

  stopCurrentGame() {
    if (this.currentGame) {
      this.currentGame.stop();
      this.currentGame = null;
    }

    if (this._gestureHandler) {
      window.gestureRecognition.removeGestureListener(this._gestureHandler);
      this._gestureHandler = null;
    }

    if (this._handsHandler) {
      window.handTracking.onResults(() => {});
      this._handsHandler = null;
    }
  }

  pauseCurrentGame() {
    if (this.currentGame) {
      this.currentGame.pause();
    }
  }

  resumeCurrentGame() {
    if (this.currentGame) {
      this.currentGame.resume();
    }
  }

  getCurrentGame() {
    return this.currentGame;
  }
}

window.Game = Game;
window.gameEngine = new GameEngine();
