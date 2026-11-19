/* ========================================
   HANDPLAY — Dodge Hand
   Developed by Erick de S.C. Araujo + IA
   ======================================== */

class DodgeHandGame extends Game {
  constructor(config) {
    super(config);
    this.playerX = 0.5;
    this.playerY = 0.5;
    this.playerSize = 30;
    this.obstacles = [];
    this.spawnTimer = 0;
    this.spawnInterval = 1.2;
    this.speed = 150;
    this.gameTimer = 0;
    this.score = 0;
    this.distance = 0;
    this.difficulty = 1;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.screenShake = 0;
    this.lives = 3;
  }

  start(canvas) {
    super.start(canvas);
    this.gameTimer = 0;
    this.score = 0;
    this.distance = 0;
    this.lives = 3;
    this.difficulty = 1;
    this.obstacles = [];
    this.spawnTimer = 0;
    this.invincible = false;
    this._updateHUD();
  }

  update(dt) {
    this.gameTimer += dt;
    this.difficulty = 1 + Math.floor(this.gameTimer / 10);
    this.speed = 150 + this.gameTimer * 5;
    this.spawnInterval = Math.max(0.3, 1.2 - this.difficulty * 0.1);

    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this._spawnObstacle();
    }

    this.distance += this.speed * dt;
    this.score = Math.round(this.distance / 10);

    for (const obs of this.obstacles) {
      obs.x += obs.vx * dt;
      obs.y += obs.vy * dt;
      obs.age += dt;
    }

    this.obstacles = this.obstacles.filter(o =>
      o.age < o.lifetime &&
      o.x > -100 && o.x < window.innerWidth + 100 &&
      o.y > -100 && o.y < window.innerHeight + 100
    );

    if (this.invincible) {
      this.invincibleTimer -= dt;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
      }
    }

    if (this.screenShake > 0) {
      this.screenShake -= dt * 8;
    }

    this._checkCollision();
    this._updateHUD();
  }

  _spawnObstacle() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const side = Math.floor(Math.random() * 4);

    let x, y, vx, vy;
    const spd = this.speed * (0.8 + Math.random() * 0.6);
    const targetX = w * (0.2 + Math.random() * 0.6);
    const targetY = h * (0.2 + Math.random() * 0.6);

    switch (side) {
      case 0: x = -30; y = Math.random() * h; break;
      case 1: x = w + 30; y = Math.random() * h; break;
      case 2: x = Math.random() * w; y = -30; break;
      case 3: x = Math.random() * w; y = h + 30; break;
    }

    const angle = Math.atan2(targetY - y, targetX - x);
    vx = Math.cos(angle) * spd;
    vy = Math.sin(angle) * spd;

    const size = 15 + Math.random() * 20 * Math.min(2, this.difficulty * 0.3);
    const isVertical = Math.abs(vy) > Math.abs(vx);

    this.obstacles.push({
      x, y, vx, vy, size,
      isVertical,
      color: `hsl(${Math.random() * 40 + 350}, 80%, 60%)`,
      age: 0,
      lifetime: 8,
      rotation: 0,
      rotSpeed: (Math.random() - 0.5) * 5,
    });
  }

  _checkCollision() {
    if (this.invincible) return;

    const px = this.playerX * window.innerWidth;
    const py = this.playerY * window.innerHeight;

    for (const obs of this.obstacles) {
      const dist = Math.hypot(px - obs.x, py - obs.y);
      if (dist < this.playerSize + obs.size) {
        this._hit();
        return;
      }
    }
  }

  _hit() {
    this.lives--;
    this.invincible = true;
    this.invincibleTimer = 1.5;
    this.screenShake = 1;
    this.combo = 0;

    window.audioManager?.playDodgeHit();

    if (this.lives <= 0) {
      this.gameOver();
      this._showResult();
    }
  }

  render() {
    const ctx = this.ctx;
    if (!ctx) return;

    const w = window.innerWidth;
    const h = window.innerHeight;

    ctx.save();
    if (this.screenShake > 0) {
      ctx.translate(
        (Math.random() - 0.5) * this.screenShake * 10,
        (Math.random() - 0.5) * this.screenShake * 10
      );
    }

    this._drawBackground(ctx);

    for (const obs of this.obstacles) {
      this._drawObstacle(ctx, obs);
    }

    const px = this.playerX * w;
    const py = this.playerY * h;

    if (this.invincible) {
      ctx.globalAlpha = 0.5 + Math.sin(performance.now() / 100) * 0.3;
    }

    ctx.beginPath();
    ctx.arc(px, py, this.playerSize, 0, Math.PI * 2);
    ctx.fillStyle = HP.COLORS.ACCENT;
    ctx.fill();
    ctx.strokeStyle = HP.COLORS.WHITE;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(px, py, this.playerSize + 5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.globalAlpha = 1;

    for (let i = 0; i < this.lives; i++) {
      ctx.beginPath();
      ctx.arc(px - 30 + i * 25, py - this.playerSize - 20, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
    }

    ctx.restore();
  }

  _drawObstacle(ctx, obs) {
    ctx.save();
    ctx.translate(obs.x, obs.y);
    ctx.rotate(obs.age * obs.rotSpeed);

    ctx.fillStyle = obs.color;
    ctx.shadowColor = obs.color;
    ctx.shadowBlur = 10;

    if (obs.isVertical) {
      ctx.fillRect(-obs.size * 0.3, -obs.size, obs.size * 0.6, obs.size * 2);
    } else {
      ctx.fillRect(-obs.size, -obs.size * 0.3, obs.size * 2, obs.size * 0.6);
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  handleHands(hands) {
    if (hands.length === 0) return;

    const hand = hands[0];
    const palm = hand.palmCenter;

    const targetX = palm.x;
    const targetY = palm.y;

    this.playerX += (targetX - this.playerX) * 0.2;
    this.playerY += (targetY - this.playerY) * 0.2;
  }

  _updateHUD() {
    const scoreEl = document.getElementById('hud-score');
    const timerEl = document.getElementById('hud-timer');
    const titleEl = document.getElementById('hud-title');

    if (scoreEl) scoreEl.textContent = `Điểm: ${this.score}  |  Mạng: ${'❤️'.repeat(this.lives)}`;
    if (timerEl) timerEl.textContent = `Khoảng cách: ${Math.round(this.distance)}m`;
    if (titleEl) titleEl.textContent = 'Né Tránh Chướng Ngại';
  }

  _showResult() {
    const overlay = document.getElementById('game-overlay');
    const content = document.getElementById('overlay-content');
    if (!overlay || !content) return;

    content.innerHTML = `
      <h2>Đã né được ${Math.round(this.distance)}m!</h2>
      <div class="big-score">${this.score.toLocaleString()}</div>
      <p>Khoảng cách: ${Math.round(this.distance)}m</p>
      <p>Thời gian: ${Math.round(this.gameTimer)}s</p>
      <div class="overlay-btns">
        <button class="btn-retry" onclick="window.app?.restartGame()">Chơi lại</button>
        <button class="btn-back" onclick="window.app?.backToGames()">Quay lại</button>
      </div>
    `;
    overlay.classList.remove('hidden');

    window.scoreManager?.addScore('dodgeHand', this.getResult());
  }
}

window.gameEngine.register(DodgeHandGame, HP.GAMES.dodgeHand);
