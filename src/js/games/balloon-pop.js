/* ========================================
   HANDPLAY — Balloon Pop
   Developed by Erick de S.C. Araujo + IA
   ======================================== */

class BalloonPopGame extends Game {
  constructor(config) {
    super(config);
    this.balloons = [];
    this.gameTimer = 30;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 0.8;
    this.popCount = 0;
    this.missCount = 0;
    this.difficulty = 1;
  }

  start(canvas) {
    super.start(canvas);
    this.gameTimer = 30;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.popCount = 0;
    this.missCount = 0;
    this.balloons = [];
    this.spawnTimer = 0;
    this.difficulty = 1;
    this._updateHUD();
  }

  _spawnBalloon() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const margin = 50;

    const size = 35 + Math.random() * 30;
    const x = margin + Math.random() * (w - margin * 2 - size);
    const y = h + size;

    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#6366f1', '#ec4899'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const speed = (1.0 + Math.random() * 1.5) * (1 + this.difficulty * 0.15);

    this.balloons.push({
      x, y, size, color,
      speed,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleAmp: 10 + Math.random() * 15,
      wobbleFreq: 2 + Math.random() * 2,
      alpha: 1,
      points: Math.round(10 * (1 + (70 - size) / 10)),
      popped: false,
      isSpecial: Math.random() < 0.05,
    });
  }

  update(dt) {
    this.gameTimer -= dt;
    if (this.gameTimer <= 0) {
      this.gameTimer = 0;
      this.gameOver();
      this._showResult();
      return;
    }

    this.difficulty = 1 + Math.floor((30 - this.gameTimer) / 10);
    this.spawnInterval = Math.max(0.3, 0.8 - this.difficulty * 0.05);

    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this._spawnBalloon();
      if (this.difficulty >= 3 && Math.random() < 0.3) {
        this._spawnBalloon();
      }
    }

    for (const balloon of this.balloons) {
      if (balloon.popped) continue;

      balloon.y -= balloon.speed;
      balloon.x += Math.sin(balloon.wobblePhase) * balloon.wobbleAmp * dt;
      balloon.wobblePhase += balloon.wobbleFreq * dt;

      if (balloon.y < -balloon.size * 2) {
        balloon.alpha -= dt * 2;
        this.combo = 0;
      }
    }

    this.balloons = this.balloons.filter(b => !b.popped && b.alpha > 0);

    this._updateHUD();
  }

  render() {
    const ctx = this.ctx;
    if (!ctx) return;

    this._drawBackground(ctx);

    for (const balloon of this.balloons) {
      this._drawBalloon(ctx, balloon);
    }
  }

  _drawBalloon(ctx, balloon) {
    ctx.save();
    ctx.globalAlpha = balloon.alpha;

    const cx = balloon.x + balloon.size / 2;
    const cy = balloon.y;

    if (balloon.isSpecial) {
      ctx.shadowColor = balloon.color;
      ctx.shadowBlur = 15;
    }

    ctx.beginPath();
    ctx.arc(cx, cy, balloon.size / 2, 0, Math.PI * 2);
    ctx.fillStyle = balloon.color;
    ctx.fill();

    const gradient = ctx.createRadialGradient(
      cx - balloon.size * 0.15, cy - balloon.size * 0.15, balloon.size * 0.05,
      cx, cy, balloon.size / 2
    );
    gradient.addColorStop(0, 'rgba(255,255,255,0.4)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx, cy + balloon.size / 2);
    ctx.lineTo(cx - 3, cy + balloon.size / 2 + 10);
    ctx.lineTo(cx + 3, cy + balloon.size / 2 + 10);
    ctx.closePath();
    ctx.fillStyle = balloon.color;
    ctx.fill();

    ctx.shadowBlur = 0;

    if (balloon.isSpecial) {
      ctx.font = `${Math.round(balloon.size * 0.4)}px "Segoe UI", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText('⭐', cx, cy);
    }

    ctx.restore();
  }

  handleHands(hands) {
    if (hands.length === 0) return;

    const hand = hands[0];
    const ix = hand.indexTip.x * window.innerWidth;
    const iy = hand.indexTip.y * window.innerHeight;

    for (const balloon of this.balloons) {
      if (balloon.popped) continue;

      const cx = balloon.x + balloon.size / 2;
      const cy = balloon.y;
      const dist = Math.hypot(ix - cx, iy - cy);

      if (dist < balloon.size * 0.7) {
        this._popBalloon(balloon);
      }
    }
  }

  handleGesture(event) {
    if (event.type === HP.GESTURES.OPEN_HAND) {
      const hand = window.handTracking?.getHands()?.[0];
      if (!hand) return;

      const ix = hand.indexTip.x * window.innerWidth;
      const iy = hand.indexTip.y * window.innerHeight;

      for (const balloon of this.balloons) {
        if (balloon.popped) continue;
        const cx = balloon.x + balloon.size / 2;
        const cy = balloon.y;
        if (Math.hypot(ix - cx, iy - cy) < balloon.size) {
          this._popBalloon(balloon);
        }
      }
    }
  }

  _popBalloon(balloon) {
    balloon.popped = true;
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.popCount++;

    const bonus = balloon.isSpecial ? 5 : 1;
    this.score += balloon.points * this.combo * bonus;

    const cx = balloon.x + balloon.size / 2;
    const cy = balloon.y;

    window.particleSystem.burst(cx, cy, balloon.color, 10);

    window.audioManager?.playBalloonPop();
    if (this.combo >= 3) {
      window.audioManager?.playCombo(this.combo);
    }
  }

  _updateHUD() {
    const scoreEl = document.getElementById('hud-score');
    const timerEl = document.getElementById('hud-timer');
    const titleEl = document.getElementById('hud-title');

    if (scoreEl) scoreEl.textContent = `Điểm: ${this.score}  |  Combo: x${this.combo}`;
    if (timerEl) timerEl.textContent = `⏱ ${Math.ceil(this.gameTimer)}s`;
    if (titleEl) titleEl.textContent = 'Bắn Bóng Bay';
  }

  _showResult() {
    const overlay = document.getElementById('game-overlay');
    const content = document.getElementById('overlay-content');
    if (!overlay || !content) return;

    content.innerHTML = `
      <h2>Bóng Nổ Rực Rỡ!</h2>
      <div class="big-score">${this.score.toLocaleString()}</div>
      <p>Số bóng đã nổ: ${this.popCount}</p>
      <p>Combo cao nhất: x${this.maxCombo}</p>
      <div class="overlay-btns">
        <button class="btn-retry" onclick="window.app?.restartGame()">Chơi lại</button>
        <button class="btn-back" onclick="window.app?.backToGames()">Quay lại</button>
      </div>
    `;
    overlay.classList.remove('hidden');

    window.scoreManager?.addScore('balloonPop', this.getResult());
  }
}

window.gameEngine.register(BalloonPopGame, HP.GAMES.balloonPop);
