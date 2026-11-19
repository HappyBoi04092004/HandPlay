/* ========================================
   HANDPLAY — Target Hunter
   Developed by Erick de S.C. Araujo + IA
   ======================================== */

class TargetHunterGame extends Game {
  constructor(config) {
    super(config);
    this.targets = [];
    this.spawnTimer = 0;
    this.spawnInterval = 2.0;
    this.gameTimer = 30;
    this.hits = 0;
    this.misses = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.score = 0;
    this.difficulty = 1;
    this.baseSpeed = 1;
  }

  start(canvas) {
    super.start(canvas);
    this.gameTimer = 30;
    this.score = 0;
    this.hits = 0;
    this.misses = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.difficulty = 1;
    this.targets = [];
    this.spawnTimer = 0;
    this.spawnInterval = 2.0;
    this._spawnTarget();
    this._updateHUD();
  }

  _spawnTarget() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const margin = 80;

    const size = Math.max(30, 60 - this.difficulty * 5);
    const x = margin + Math.random() * (w - margin * 2 - size);
    const y = margin + Math.random() * (h - margin * 2 - size);

    const isMoving = this.difficulty >= 2 && Math.random() < 0.3;
    const moveSpeed = this.baseSpeed * (0.5 + Math.random() * 0.5);
    const angle = Math.random() * Math.PI * 2;

    this.targets.push({
      x, y, size,
      color: this._randomColor(),
      alpha: 1,
      lifetime: Math.max(1.5, 4 - this.difficulty * 0.3),
      age: 0,
      points: Math.round(100 * (1 + this.difficulty * 0.2)),
      moving: isMoving,
      vx: Math.cos(angle) * moveSpeed,
      vy: Math.sin(angle) * moveSpeed,
      ringScale: 0,
      hit: false,
    });
  }

  _randomColor() {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#6366f1', '#ec4899'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  update(dt) {
    this.gameTimer -= dt;
    if (this.gameTimer <= 0) {
      this.gameTimer = 0;
      this.score = this.hits * 100 * Math.max(1, this.maxCombo * 0.5);
      this.gameOver();
      this._showResult();
      return;
    }

    this.difficulty = 1 + Math.floor((30 - this.gameTimer) / 8);
    this.spawnInterval = Math.max(0.5, 2.0 - this.difficulty * 0.2);

    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this._spawnTarget();
    }

    const w = window.innerWidth;
    const h = window.innerHeight;

    for (const target of this.targets) {
      if (target.hit) continue;

      target.age += dt;

      if (target.age >= target.lifetime) {
        target.alpha -= dt * 3;
        if (target.alpha <= 0) {
          this.misses++;
          this.combo = 0;
        }
      }

      if (target.moving) {
        target.x += target.vx * this.baseSpeed;
        target.y += target.vy * this.baseSpeed;

        if (target.x < 0 || target.x > w - target.size) target.vx *= -1;
        if (target.y < 60 || target.y > h - target.size) target.vy *= -1;
      }

      target.ringScale = Math.sin(target.age * 4) * 0.2 + 1;
    }

    this.targets = this.targets.filter(t => t.alpha > 0 && !t.hit);

    this._updateHUD();
  }

  render() {
    const ctx = this.ctx;
    if (!ctx) return;

    this._drawBackground(ctx);

    for (const target of this.targets) {
      this._drawTarget(ctx, target);
    }

    this._drawCrosshair(ctx);
  }

  _drawTarget(ctx, target) {
    ctx.save();
    ctx.globalAlpha = target.alpha;

    const scale = target.ringScale;
    const cx = target.x + target.size / 2;
    const cy = target.y + target.size / 2;
    const r = target.size / 2 * scale;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = target.color;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fill();

    const progress = 1 - target.age / target.lifetime;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  _drawCrosshair(ctx) {
    const hand = window.handTracking?.getHands()?.[0];
    if (!hand) return;

    const x = hand.indexTip.x * window.innerWidth;
    const y = hand.indexTip.y * window.innerHeight;

    ctx.save();
    ctx.strokeStyle = 'rgba(165, 180, 252, 0.6)';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x - 20, y);
    ctx.lineTo(x - 8, y);
    ctx.moveTo(x + 8, y);
    ctx.lineTo(x + 20, y);
    ctx.moveTo(x, y - 20);
    ctx.lineTo(x, y - 8);
    ctx.moveTo(x, y + 8);
    ctx.lineTo(x, y + 20);
    ctx.stroke();

    ctx.restore();
  }

  handleGesture(event) {
    if (event.type !== HP.GESTURES.PINCH_START) return;

    const hand = window.handTracking?.getHands()?.[0];
    if (!hand) return;

    const px = hand.indexTip.x * window.innerWidth;
    const py = hand.indexTip.y * window.innerHeight;

    let hitTarget = null;
    for (const target of this.targets) {
      if (target.hit) continue;
      const cx = target.x + target.size / 2;
      const cy = target.y + target.size / 2;
      const dist = Math.hypot(px - cx, py - cy);

      if (dist < target.size) {
        hitTarget = target;
        break;
      }
    }

    if (hitTarget) {
      hitTarget.hit = true;
      this.hits++;
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);

      const cx = hitTarget.x + hitTarget.size / 2;
      const cy = hitTarget.y + hitTarget.size / 2;

      this.score += hitTarget.points * this.combo;
      window.particleSystem.burst(cx, cy, hitTarget.color, 12);

      window.audioManager?.playPop();
      if (this.combo >= 3) {
        window.audioManager?.playCombo(this.combo);
      }
    }
  }

  _updateHUD() {
    const scoreEl = document.getElementById('hud-score');
    const timerEl = document.getElementById('hud-timer');
    const titleEl = document.getElementById('hud-title');

    if (scoreEl) scoreEl.textContent = `Điểm: ${this.score}  |  Combo: x${this.combo}`;
    if (timerEl) timerEl.textContent = `⏱ ${Math.ceil(this.gameTimer)}s`;
    if (titleEl) titleEl.textContent = 'Thợ Săn Mục Tiêu';
  }

  _showResult() {
    const overlay = document.getElementById('game-overlay');
    const content = document.getElementById('overlay-content');
    if (!overlay || !content) return;

    const accuracy = this.hits + this.misses > 0 ? Math.round((this.hits / (this.hits + this.misses)) * 100) : 0;

    content.innerHTML = `
      <h2>Hết Giờ!</h2>
      <div class="big-score">${this.score.toLocaleString()}</div>
      <p>Trúng: ${this.hits} | Hụt: ${this.misses}</p>
      <p>Chính xác: ${accuracy}%</p>
      <p>Combo cao nhất: x${this.maxCombo}</p>
      <div class="overlay-btns">
        <button class="btn-retry" onclick="window.app?.restartGame()">Chơi lại</button>
        <button class="btn-back" onclick="window.app?.backToGames()">Quay lại</button>
      </div>
    `;
    overlay.classList.remove('hidden');

    window.scoreManager?.addScore('targetHunter', this.getResult());
  }
}

window.gameEngine.register(TargetHunterGame, HP.GAMES.targetHunter);
