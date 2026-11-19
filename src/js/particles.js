/* ========================================
   HANDPLAY — Particle Effects System
   Developed by Erick de S.C. Araujo + IA
   ======================================== */

class Particle {
  constructor(config) {
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.vx = config.vx || 0;
    this.vy = config.vy || 0;
    this.ax = config.ax || 0;
    this.ay = config.ay || 0;
    this.size = config.size || 3;
    this.sizeEnd = config.sizeEnd !== undefined ? config.sizeEnd : 0;
    this.color = config.color || HP.COLORS.ACCENT;
    this.alpha = config.alpha !== undefined ? config.alpha : 1;
    this.alphaEnd = config.alphaEnd !== undefined ? config.alphaEnd : 0;
    this.life = config.life || 1;
    this.maxLife = config.life || 1;
    this.rotation = config.rotation || 0;
    this.rotSpeed = config.rotSpeed || 0;
    this.shape = config.shape || 'circle';
    this.blendMode = config.blendMode || 'source-over';
    this.alive = true;
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) {
      this.alive = false;
      return;
    }

    this.vx += this.ax * dt;
    this.vy += this.ay * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotation += this.rotSpeed * dt;
  }

  render(ctx) {
    if (!this.alive) return;

    const progress = 1 - (this.life / this.maxLife);
    const size = this.size + (this.sizeEnd - this.size) * progress;
    const alpha = this.alpha + (this.alphaEnd - this.alpha) * progress;

    if (alpha <= 0 || size <= 0) return;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = this.blendMode;

    if (this.rotation !== 0) {
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.translate(-this.x, -this.y);
    }

    ctx.fillStyle = this.color;

    switch (this.shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'square':
        ctx.fillRect(this.x - size, this.y - size, size * 2, size * 2);
        break;

      case 'line':
        ctx.strokeStyle = this.color;
        ctx.lineWidth = size * 0.5;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.vx * 0.02, this.y - this.vy * 0.02);
        ctx.stroke();
        break;

      case 'star':
        this._drawStar(ctx, this.x, this.y, 5, size, size * 0.5);
        break;

      case 'ring':
        ctx.strokeStyle = this.color;
        ctx.lineWidth = Math.max(1, size * 0.2);
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
        ctx.stroke();
        break;

      case 'glow':
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, size
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
        ctx.fill();
        break;
    }

    ctx.restore();
  }

  _drawStar(ctx, cx, cy, spikes, outerR, innerR) {
    let rot = Math.PI / 2 * 3;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
      rot += step;
    }
    ctx.closePath();
    ctx.fill();
  }
}

class ParticleEmitter {
  constructor(config = {}) {
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.active = false;
    this.duration = config.duration || Infinity;
    this.age = 0;
    this.rate = config.rate || 20;
    this.emitTimer = 0;

    this.particleConfig = {
      vx: config.vx || { min: -50, max: 50 },
      vy: config.vy || { min: -100, max: -20 },
      size: config.size || { min: 2, max: 5 },
      sizeEnd: config.sizeEnd !== undefined ? config.sizeEnd : 0,
      color: config.color || HP.COLORS.ACCENT,
      alpha: config.alpha !== undefined ? config.alpha : 1,
      alphaEnd: config.alphaEnd !== undefined ? config.alphaEnd : 0,
      life: config.life || { min: 0.3, max: 0.8 },
      gravity: config.gravity !== undefined ? config.gravity : 150,
      shape: config.shape || 'circle',
      blendMode: config.blendMode || 'source-over',
      rotSpeed: config.rotSpeed || { min: -3, max: 3 },
    };
  }

  start() {
    this.active = true;
    this.age = 0;
    this.emitTimer = 0;
  }

  stop() {
    this.active = false;
  }

  update(dt, particleSystem) {
    if (!this.active) return;

    this.age += dt;
    if (this.age >= this.duration) {
      this.active = false;
      return;
    }

    this.emitTimer += dt;
    const interval = 1 / this.rate;

    while (this.emitTimer >= interval) {
      this.emitTimer -= interval;
      this._emit(particleSystem);
    }
  }

  _emit(system) {
    const cfg = this.particleConfig;

    const particle = new Particle({
      x: this.x + (Math.random() - 0.5) * 10,
      y: this.y + (Math.random() - 0.5) * 10,
      vx: this._range(cfg.vx),
      vy: this._range(cfg.vy),
      size: this._range(cfg.size),
      sizeEnd: typeof cfg.sizeEnd === 'object' ? this._range(cfg.sizeEnd) : cfg.sizeEnd,
      color: typeof cfg.color === 'function' ? cfg.color() : cfg.color,
      alpha: typeof cfg.alpha === 'object' ? this._range(cfg.alpha) : cfg.alpha,
      alphaEnd: typeof cfg.alphaEnd === 'object' ? this._range(cfg.alphaEnd) : cfg.alphaEnd,
      life: this._range(cfg.life),
      ay: cfg.gravity,
      shape: cfg.shape,
      blendMode: cfg.blendMode,
      rotSpeed: this._range(cfg.rotSpeed),
    });

    system.add(particle);
  }

  _range(val) {
    if (typeof val === 'number') return val;
    return val.min + Math.random() * (val.max - val.min);
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.emitters = [];
    this.maxParticles = 500;
    this.enabled = true;
  }

  update(dt) {
    if (!this.enabled) return;

    for (const emitter of this.emitters) {
      emitter.update(dt, this);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update(dt);
      if (!this.particles[i].alive) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx) {
    if (!this.enabled) return;
    for (const p of this.particles) {
      p.render(ctx);
    }
  }

  add(particle) {
    if (this.particles.length < this.maxParticles) {
      this.particles.push(particle);
    }
  }

  addEmitter(config) {
    const emitter = new ParticleEmitter(config);
    this.emitters.push(emitter);
    return emitter;
  }

  removeEmitter(emitter) {
    emitter.stop();
    this.emitters = this.emitters.filter(e => e !== emitter);
  }

  clear() {
    this.particles = [];
    this.emitters = [];
  }

  get activeCount() {
    return this.particles.length;
  }

  // === PRESET EMITTERS ===

  burst(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.3;
      const speed = 80 + Math.random() * 120;
      this.add(new Particle({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        sizeEnd: 0,
        color,
        alpha: 1,
        alphaEnd: 0,
        life: 0.3 + Math.random() * 0.4,
        gravity: 100,
        shape: 'circle',
      }));
    }
  }

  confetti(x, y, count = 20) {
    const colors = ['#6366f1', '#ef4444', '#22c55e', '#eab308', '#ec4899', '#06b6d4'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 150;
      this.add(new Particle({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 100,
        size: 3 + Math.random() * 4,
        sizeEnd: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        alphaEnd: 0,
        life: 0.8 + Math.random() * 0.6,
        gravity: 200,
        shape: Math.random() < 0.5 ? 'square' : 'circle',
        rotSpeed: (Math.random() - 0.5) * 10,
      }));
    }
  }

  spark(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 80;
      this.add(new Particle({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.5 + Math.random() * 2,
        sizeEnd: 0,
        color,
        alpha: 1,
        alphaEnd: 0,
        life: 0.2 + Math.random() * 0.3,
        gravity: 0,
        shape: 'glow',
        blendMode: 'lighter',
      }));
    }
  }

  trail(x, y, color) {
    this.add(new Particle({
      x, y,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      size: 2 + Math.random() * 2,
      sizeEnd: 0,
      color,
      alpha: 0.6,
      alphaEnd: 0,
      life: 0.3 + Math.random() * 0.2,
      gravity: 0,
      shape: 'glow',
    }));
  }

  explosion(x, y, count = 30) {
    const hue = Math.random() * 60 + 10;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 200;
      this.add(new Particle({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 6,
        sizeEnd: 0,
        color: `hsl(${hue + Math.random() * 30}, 90%, ${50 + Math.random() * 30}%)`,
        alpha: 1,
        alphaEnd: 0,
        life: 0.4 + Math.random() * 0.5,
        gravity: 120,
        shape: Math.random() < 0.3 ? 'star' : 'circle',
        rotSpeed: (Math.random() - 0.5) * 8,
      }));
    }
  }

  firework(x, y) {
    const color = `hsl(${Math.random() * 360}, 80%, 60%)`;
    this.burst(x, y, color, 24);
    this.spark(x, y, color, 8);

    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i;
      const dist = 20 + Math.random() * 30;
      this.add(new Particle({
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        vx: Math.cos(angle) * 60,
        vy: Math.sin(angle) * 60,
        size: 6,
        sizeEnd: 0,
        color,
        alpha: 0.8,
        alphaEnd: 0,
        life: 0.5,
        gravity: 0,
        shape: 'ring',
      }));
    }
  }

  shimmer(x, y, color = HP.COLORS.ACCENT_LIGHTER, count = 6) {
    for (let i = 0; i < count; i++) {
      this.add(new Particle({
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 40,
        vx: 0,
        vy: -20 - Math.random() * 30,
        size: 1.5 + Math.random() * 2,
        sizeEnd: 0,
        color,
        alpha: 0.8,
        alphaEnd: 0,
        life: 0.5 + Math.random() * 0.5,
        gravity: 0,
        shape: 'star',
      }));
    }
  }
}

window.Particle = Particle;
window.ParticleEmitter = ParticleEmitter;
window.particleSystem = new ParticleSystem();
