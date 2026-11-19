/* ========================================
   HANDPLAY — Screen Transitions
   Smooth animations between screens
   Developed by Erick de S.C. Araujo + IA
   ======================================== */

class TransitionManager {
  constructor() {
    this.active = false;
    this.queue = [];
    this.overlay = null;
    this.particlesCanvas = null;
    this.particlesCtx = null;
    this.transitionParticles = [];
  }

  init() {
    // Create transition overlay
    this.overlay = document.createElement('div');
    this.overlay.id = 'transition-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1000;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    // Create gradient sweep element
    const sweep = document.createElement('div');
    sweep.id = 'transition-sweep';
    sweep.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg,
        rgba(99, 102, 241, 0.95) 0%,
        rgba(15, 15, 42, 0.98) 50%,
        rgba(99, 102, 241, 0.95) 100%
      );
      transform: translateX(-100%);
      transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    `;

    // Logo text
    const logo = document.createElement('div');
    logo.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-family: 'Segoe UI', system-ui, sans-serif;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: 6px;
      color: white;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    logo.textContent = 'HANDPLAY';

    this.overlay.appendChild(sweep);
    this.overlay.appendChild(logo);
    document.body.appendChild(this.overlay);

    // Create particle canvas for transitions
    this.particlesCanvas = document.createElement('canvas');
    this.particlesCanvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 999;
      pointer-events: none;
    `;
    document.body.appendChild(this.particlesCanvas);
    this.particlesCtx = this.particlesCanvas.getContext('2d');
    this._resizeParticleCanvas();
    window.addEventListener('resize', () => this._resizeParticleCanvas());
  }

  _resizeParticleCanvas() {
    this.particlesCanvas.width = window.innerWidth;
    this.particlesCanvas.height = window.innerHeight;
  }

  async screenTransition(screenId, options = {}) {
    if (this.active) return;
    this.active = true;

    const {
      type = 'sweep',
      duration = 500,
      showLogo = false,
    } = options;

    const sweep = document.getElementById('transition-sweep');
    const logo = this.overlay.querySelector('div:last-child');

    switch (type) {
      case 'sweep':
        await this._sweepTransition(sweep, logo, showLogo, duration);
        break;
      case 'fade':
        await this._fadeTransition(screenId, duration);
        break;
      case 'particles':
        await this._particleTransition(screenId, duration);
        break;
      default:
        await this._sweepTransition(sweep, logo, showLogo, duration);
    }

    this.active = false;
  }

  async _sweepTransition(sweep, logo, showLogo, duration) {
    // Phase 1: Sweep in
    this.overlay.style.opacity = '1';
    this.overlay.style.pointerEvents = 'all';

    sweep.style.transform = 'translateX(0%)';

    if (showLogo && logo) {
      await this._delay(200);
      logo.style.opacity = '1';
    }

    await this._delay(duration / 2);

    // Navigate happens at midpoint
    const callback = this._pendingNavigate;
    if (callback) callback();

    // Phase 2: Sweep out
    if (showLogo && logo) {
      logo.style.opacity = '0';
      await this._delay(100);
    }

    sweep.style.transform = 'translateX(100%)';
    await this._delay(duration / 2);

    this.overlay.style.opacity = '0';
    this.overlay.style.pointerEvents = 'none';
  }

  async _fadeTransition(screenId, duration) {
    this.overlay.style.opacity = '1';
    this.overlay.style.background = 'var(--bg-primary)';
    this.overlay.style.pointerEvents = 'all';

    await this._delay(duration / 2);

    const callback = this._pendingNavigate;
    if (callback) callback();

    await this._delay(100);

    this.overlay.style.opacity = '0';
    this.overlay.style.background = 'transparent';
    this.overlay.style.pointerEvents = 'none';
  }

  async _particleTransition(screenId, duration) {
    this._spawnTransitionParticles(30);
    this._animateTransitionParticles();

    await this._delay(duration / 3);

    const callback = this._pendingNavigate;
    if (callback) callback();

    await this._delay(duration * 2 / 3);

    this.transitionParticles = [];
    this.particlesCtx.clearRect(0, 0, this.particlesCanvas.width, this.particlesCanvas.height);
  }

  _spawnTransitionParticles(count) {
    const w = this.particlesCanvas.width;
    const h = this.particlesCanvas.height;

    for (let i = 0; i < count; i++) {
      const startX = Math.random() < 0.5 ? -20 : w + 20;
      const endX = startX < 0 ? w + 20 : -20;

      this.transitionParticles.push({
        x: startX,
        y: Math.random() * h,
        targetX: endX,
        targetY: Math.random() * h,
        size: 4 + Math.random() * 8,
        color: `rgba(${99 + Math.random() * 50}, ${102 + Math.random() * 50}, 241, ${0.3 + Math.random() * 0.4})`,
        speed: 0,
        progress: Math.random() * 0.3,
      });
    }
  }

  _animateTransitionParticles() {
    if (this.transitionParticles.length === 0) return;

    const ctx = this.particlesCtx;
    ctx.clearRect(0, 0, this.particlesCanvas.width, this.particlesCanvas.height);

    for (const p of this.transitionParticles) {
      p.progress += 0.025;
      if (p.progress > 1) continue;

      const t = this._easeInOutCubic(p.progress);
      const x = p.x + (p.targetX - p.x) * t;
      const y = p.y + (p.targetY - p.y) * t;

      ctx.beginPath();
      ctx.arc(x, y, p.size * (1 - Math.abs(p.progress - 0.5) * 2), 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }

    if (this.transitionParticles.some(p => p.progress <= 1)) {
      requestAnimationFrame(() => this._animateTransitionParticles());
    }
  }

  _easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  setPendingNavigate(callback) {
    this._pendingNavigate = callback;
  }
}

window.transitionManager = new TransitionManager();
