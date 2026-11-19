/* ========================================
   HANDPLAY — Air Runner
   Developed by Erick de S.C. Araujo + IA
   ======================================== */

class AirRunnerGame extends Game {
  constructor(config) {
    super(config);
    this.runner = { x: 0, y: 0, vy: 0, jumping: false, ducking: false, grounded: true };
    this.groundY = 0;
    this.speed = 300;
    this.maxSpeed = 800;
    this.obstacles = [];
    this.coins = [];
    this.spawnTimer = 0;
    this.coinTimer = 0;
    this.distance = 0;
    this.coinCount = 0;
    this.score = 0;
    this.lives = 3;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.screenShake = 0;
    this.parallaxBg = [];
    this.gravity = 1500;
  }

  start(canvas) {
    super.start(canvas);
    const h = window.innerHeight;
    this.groundY = h - 100;
    this.runner = {
      x: 120,
      y: this.groundY,
      vy: 0,
      jumping: false,
      ducking: false,
      grounded: true,
    };
    this.speed = 300;
    this.distance = 0;
    this.coinCount = 0;
    this.score = 0;
    this.lives = 3;
    this.obstacles = [];
    this.coins = [];
    this.spawnTimer = 0;
    this.coinTimer = 0;

    for (let i = 0; i < 5; i++) {
      this.parallaxBg.push({
        x: i * 300,
        y: 0,
        w: 300,
        h: this.groundY,
        speed: 0.3 + Math.random() * 0.4,
        color: `rgba(99, 102, 241, ${0.02 + Math.random() * 0.03})`,
      });
    }

    this._updateHUD();
  }

  update(dt) {
    this.speed = Math.min(this.maxSpeed, this.speed + dt * 10);
    this.distance += this.speed * dt;
    this.score = Math.round(this.distance / 10) + this.coinCount * 50;

    this.runner.vy += this.gravity * dt;
    this.runner.y += this.runner.vy * dt;

    if (this.runner.y >= this.groundY) {
      this.runner.y = this.groundY;
      this.runner.vy = 0;
      this.runner.jumping = false;
      this.runner.grounded = true;
    } else {
      this.runner.grounded = false;
    }

    const runnerH = this.runner.ducking ? 30 : 60;
    const runnerW = this.runner.ducking ? 60 : 30;

    this.spawnTimer += dt;
    if (this.spawnTimer >= Math.max(0.6, 1.5 - (this.speed - 300) / 500)) {
      this.spawnTimer = 0;
      this._spawnObstacle();
    }

    this.coinTimer += dt;
    if (this.coinTimer >= 0.8) {
      this.coinTimer = 0;
      if (Math.random() < 0.5) this._spawnCoin();
    }

    for (const obs of this.obstacles) {
      obs.x -= this.speed * dt;
      obs.age += dt;
    }

    for (const coin of this.coins) {
      coin.x -= this.speed * dt;
      coin.phase += dt * 5;
    }

    this.coins = this.coins.filter(c => c.x > -50);
    this.obstacles = this.obstacles.filter(o => o.x > -100);

    for (const coin of this.coins) {
      const cx = coin.x;
      const cy = coin.y;
      const dist = Math.hypot(this.runner.x - cx, (this.runner.y - runnerH / 2) - cy);
      if (dist < 35) {
        coin.collected = true;
        this.coinCount++;
        window.audioManager?.playCoin();
        window.particleSystem.spark(cx, cy, '#eab308', 6);
      }
    }
    this.coins = this.coins.filter(c => !c.collected);

    for (const obs of this.obstacles) {
      if (obs.hit) continue;
      const ox = obs.x;
      const oy = obs.y;
      const ow = obs.width;
      const oh = obs.height;

      const px = this.runner.x - runnerW / 2;
      const py = this.runner.y - runnerH;
      const pw = runnerW;
      const ph = runnerH;

      if (px < ox + ow && px + pw > ox && py < oy + oh && py + ph > oy) {
        if (!this.invincible) {
          obs.hit = true;
          this._hit();
        }
      }
    }

    for (const bg of this.parallaxBg) {
      bg.x -= this.speed * bg.speed * dt;
      if (bg.x + bg.w < 0) {
        bg.x += 5 * bg.w;
      }
    }

    if (this.invincible) {
      this.invincibleTimer -= dt;
      if (this.invincibleTimer <= 0) this.invincible = false;
    }

    if (this.screenShake > 0) this.screenShake -= dt * 5;

    this._updateHUD();
  }

  _spawnObstacle() {
    const h = window.innerHeight;
    const type = Math.random();
    let obs;

    if (type < 0.5) {
      obs = {
        x: window.innerWidth + 50,
        y: this.groundY - 50,
        width: 25,
        height: 50,
        type: 'spike',
        color: '#ef4444',
      };
    } else if (type < 0.8) {
      obs = {
        x: window.innerWidth + 50,
        y: this.groundY - 90,
        width: 60,
        height: 90,
        type: 'wall',
        color: '#f97316',
      };
    } else {
      obs = {
        x: window.innerWidth + 50,
        y: this.groundY - 150,
        width: 40,
        height: 25,
        type: 'flying',
        color: '#a855f7',
      };
    }

    this.obstacles.push({ ...obs, age: 0, hit: false });
  }

  _spawnCoin() {
    const y = this.groundY - 40 - Math.random() * 120;
    this.coins.push({
      x: window.innerWidth + 50,
      y,
      phase: Math.random() * Math.PI * 2,
    });
  }

  _hit() {
    this.lives--;
    this.invincible = true;
    this.invincibleTimer = 1.5;
    this.screenShake = 1;
    window.audioManager?.playMiss();

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
        (Math.random() - 0.5) * this.screenShake * 8,
        (Math.random() - 0.5) * this.screenShake * 8
      );
    }

    this._drawBackground(ctx);

    for (const bg of this.parallaxBg) {
      ctx.fillStyle = bg.color;
      ctx.fillRect(bg.x, 0, bg.w, bg.h);
    }

    ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.fillRect(0, this.groundY, w, h - this.groundY);

    ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.groundY);
    ctx.lineTo(w, this.groundY);
    ctx.stroke();

    for (const coin of this.coins) {
      const alpha = 0.8 + Math.sin(coin.phase) * 0.2;
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(234, 179, 8, ${alpha})`;
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#92400e';
      ctx.fillText('¢', coin.x, coin.y + 1);
    }

    for (const obs of this.obstacles) {
      ctx.fillStyle = obs.color;
      ctx.shadowColor = obs.color;
      ctx.shadowBlur = 8;

      if (obs.type === 'spike') {
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + obs.height);
        ctx.lineTo(obs.x + obs.width / 2, obs.y);
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      }
      ctx.shadowBlur = 0;
    }

    const rW = this.runner.ducking ? 60 : 30;
    const rH = this.runner.ducking ? 30 : 60;

    if (this.invincible) {
      ctx.globalAlpha = 0.5 + Math.sin(performance.now() / 80) * 0.3;
    }

    ctx.fillStyle = HP.COLORS.ACCENT;
    ctx.fillRect(this.runner.x - rW / 2, this.runner.y - rH, rW, rH);

    ctx.fillStyle = 'rgba(165, 180, 252, 0.8)';
    ctx.beginPath();
    ctx.arc(this.runner.x, this.runner.y - rH - 8, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;

    ctx.restore();
  }

  handleGesture(event) {
    if (event.type === HP.GESTURES.SWIPE_UP || event.type === HP.GESTURES.OPEN_HAND) {
      if (this.runner.grounded) {
        this.runner.vy = -650;
        this.runner.jumping = true;
        this.runner.grounded = false;
        window.audioManager?.playJump();
      }
    }

    if (event.type === HP.GESTURES.FIST) {
      if (this.runner.grounded) {
        this.runner.ducking = true;
        setTimeout(() => { this.runner.ducking = false; }, 500);
      }
    }
  }

  handleHands(hands) {
    if (hands.length === 0) return;

    const hand = hands[0];
    const py = hand.palmCenter.y;

    if (py < 0.35 && this.runner.grounded && !this.runner.jumping) {
      this.runner.vy = -650;
      this.runner.jumping = true;
      this.runner.grounded = false;
    } else if (py > 0.75 && this.runner.grounded) {
      this.runner.ducking = true;
    } else {
      this.runner.ducking = false;
    }
  }

  _updateHUD() {
    const scoreEl = document.getElementById('hud-score');
    const timerEl = document.getElementById('hud-timer');
    const titleEl = document.getElementById('hud-title');

    if (scoreEl) scoreEl.textContent = `Điểm: ${this.score}  |  Xu: ${this.coinCount}  |  Mạng: ${'❤️'.repeat(this.lives)}`;
    if (timerEl) timerEl.textContent = `${Math.round(this.distance)}m`;
    if (titleEl) titleEl.textContent = 'Đường Chạy Không Gian';
  }

  _showResult() {
    const overlay = document.getElementById('game-overlay');
    const content = document.getElementById('overlay-content');
    if (!overlay || !content) return;

    content.innerHTML = `
      <h2>Kết Thúc Đường Chạy!</h2>
      <div class="big-score">${this.score.toLocaleString()}</div>
      <p>Quãng đường: ${Math.round(this.distance)}m</p>
      <p>Số xu: ${this.coinCount}</p>
      <div class="overlay-btns">
        <button class="btn-retry" onclick="window.app?.restartGame()">Chơi lại</button>
        <button class="btn-back" onclick="window.app?.backToGames()">Quay lại</button>
      </div>
    `;
    overlay.classList.remove('hidden');

    window.scoreManager?.addScore('airRunner', this.getResult());
  }
}

window.gameEngine.register(AirRunnerGame, HP.GAMES.airRunner);
