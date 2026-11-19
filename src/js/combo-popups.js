/* ========================================
   HANDPLAY — Combo Popup System
   Animated score and combo feedback during gameplay
   Developed by Erick de S.C. Araujo + IA
   ======================================== */

class ComboPopup {
  constructor(config) {
    this.x = config.x || window.innerWidth / 2;
    this.y = config.y || window.innerHeight / 2;
    this.text = config.text || '+100';
    this.subtext = config.subtext || '';
    this.color = config.color || '#6366f1';
    this.size = config.size || 28;
    this.life = 0;
    this.maxLife = config.duration || 1.2;
    this.vy = config.vy || -60;
    this.vx = config.vx || 0;
    this.gravity = config.gravity || 15;
    this.scale = config.scale || 1.5;
    this.targetScale = 1;
    this.alpha = 1;
    this.alive = true;
    this.type = config.type || 'score';
    this.fontSize = config.fontSize || 24;
    this.subFontSize = config.subFontSize || 14;
  }

  update(dt) {
    this.life += dt;
    if (this.life >= this.maxLife) {
      this.alive = false;
      return;
    }

    const t = this.life / this.maxLife;

    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Scale animation: pop in then stay
    if (this.life < 0.15) {
      this.scale = this.scale + (this.targetScale - this.scale) * 0.3;
    }

    // Fade out
    this.alpha = t > 0.6 ? 1 - ((t - 0.6) / 0.4) : 1;
  }

  render(ctx) {
    if (!this.alive) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Main text
    ctx.font = `700 ${Math.round(this.fontSize * this.scale)}px "Segoe UI", system-ui, sans-serif`;

    // Glow effect
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, this.x, this.y);

    // White overlay for brightness
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(this.text, this.x, this.y);

    // Subtext
    if (this.subtext && this.alpha > 0.5) {
      ctx.font = `600 ${Math.round(this.subFontSize * this.scale)}px "Segoe UI", system-ui, sans-serif`;
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.alpha * 0.7;
      ctx.fillText(this.subtext, this.x, this.y + this.fontSize * this.scale * 0.8);
    }

    ctx.restore();
  }
}

class ComboPopupSystem {
  constructor() {
    this.popups = [];
    this.comboCount = 0;
    this.comboTimer = 0;
    this.comboTimeout = 2.0;
    this.lastComboX = 0;
    this.lastComboY = 0;
    this.screenShake = 0;
    this.screenShakeX = 0;
    this.screenShakeY = 0;
  }

  update(dt) {
    // Update popups
    for (let i = this.popups.length - 1; i >= 0; i--) {
      this.popups[i].update(dt);
      if (!this.popups[i].alive) {
        this.popups.splice(i, 1);
      }
    }

    // Combo timeout
    if (this.comboCount > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
      }
    }

    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake *= 0.9;
      this.screenShakeX = (Math.random() - 0.5) * this.screenShake;
      this.screenShakeY = (Math.random() - 0.5) * this.screenShake;
      if (this.screenShake < 0.5) {
        this.screenShake = 0;
        this.screenShakeX = 0;
        this.screenShakeY = 0;
      }
    }
  }

  render(ctx) {
    for (const popup of this.popups) {
      popup.render(ctx);
    }
  }

  showScore(x, y, points, color) {
    this.comboCount++;
    this.comboTimer = this.comboTimeout;
    this.lastComboX = x;
    this.lastComboY = y;

    const totalPoints = points * Math.max(1, this.comboCount);
    const comboText = this.comboCount > 1 ? ` x${this.comboCount}` : '';
    const subtext = this.comboCount >= 3 ? `${this.comboCount}x COMBO!` : '';

    this.popups.push(new ComboPopup({
      x,
      y: y - 20,
      text: `+${totalPoints}${comboText}`,
      subtext,
      color: color || HP.COLORS.ACCENT_LIGHTER,
      fontSize: 24 + Math.min(this.comboCount * 2, 16),
      subFontSize: 14 + Math.min(this.comboCount, 6),
      vy: -70,
      duration: 1.2,
      scale: 1.2 + Math.min(this.comboCount * 0.05, 0.4),
      gravity: 10,
    }));

    // Pop-in screen shake for big combos
    if (this.comboCount >= 5) {
      this.screenShake = Math.min(this.comboCount * 1.5, 8);
    }
  }

  showCombo(x, y, multiplier) {
    const colors = ['#6366f1', '#818cf8', '#a5b4fc', '#22c55e', '#eab308', '#ef4444', '#ec4899'];
    const color = colors[Math.min(multiplier - 1, colors.length - 1)];

    this.popups.push(new ComboPopup({
      x,
      y: y - 40,
      text: `COMBO x${multiplier}`,
      subtext: multiplier >= 5 ? '🔥 ĐỈNH CAO!' : multiplier >= 3 ? '⚡ TUYỆT VỜI!' : '',
      color,
      fontSize: 30 + multiplier * 3,
      subFontSize: 16,
      vy: -50,
      gravity: 8,
      duration: 1.5,
      scale: 1.4 + multiplier * 0.05,
    }));

    this.screenShake = Math.min(multiplier * 2, 12);
  }

  showHit(x, y) {
    this.popups.push(new ComboPopup({
      x: x + (Math.random() - 0.5) * 30,
      y: y + (Math.random() - 0.5) * 30,
      text: 'TRÚNG!',
      color: '#22c55e',
      fontSize: 18,
      vy: -40,
      gravity: 20,
      duration: 0.8,
      scale: 1.0,
    }));
  }

  showMiss(x, y) {
    this.popups.push(new ComboPopup({
      x: x + (Math.random() - 0.5) * 30,
      y,
      text: 'HỤT',
      color: '#ef4444',
      fontSize: 16,
      vy: 20,
      gravity: 10,
      duration: 0.7,
      scale: 0.9,
    }));
  }

  showLevelUp(level) {
    this.popups.push(new ComboPopup({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2 - 50,
      text: `CẤP ĐỘ ${level}`,
      subtext: '🔥',
      color: '#eab308',
      fontSize: 40,
      subFontSize: 20,
      vy: -30,
      gravity: 5,
      duration: 2.0,
      scale: 1.8,
    }));

    this.screenShake = 10;
  }

  showGameOver(score) {
    this.popups.push(new ComboPopup({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2 - 60,
      text: 'KẾT THÚC',
      subtext: `Điểm: ${score.toLocaleString()}`,
      color: '#ef4444',
      fontSize: 36,
      subFontSize: 20,
      vy: -20,
      gravity: 3,
      duration: 2.5,
      scale: 1.6,
    }));
  }

  showVictory(score) {
    this.popups.push(new ComboPopup({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2 - 60,
      text: '🎉 CHIẾN THẮNG!',
      subtext: `Điểm: ${score.toLocaleString()}`,
      color: '#22c55e',
      fontSize: 40,
      subFontSize: 22,
      vy: -25,
      gravity: 4,
      duration: 2.5,
      scale: 1.8,
    }));

    this.screenShake = 8;
  }

  getShakeOffset() {
    return { x: this.screenShakeX, y: this.screenShakeY };
  }

  clear() {
    this.popups = [];
    this.comboCount = 0;
    this.screenShake = 0;
    this.screenShakeX = 0;
    this.screenShakeY = 0;
  }
}

window.ComboPopup = ComboPopup;
window.comboPopupSystem = new ComboPopupSystem();
