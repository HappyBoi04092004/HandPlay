/* ========================================
   HANDPLAY — Air Pong
   Developed by Erick de S.C. Araujo + IA
   ======================================== */

class AirPongGame extends Game {
  constructor(config) {
    super(config);
    this.playerPaddle = { y: 0, height: 100, width: 14 };
    this.aiPaddle = { y: 0, height: 100, width: 14 };
    this.ball = { x: 0, y: 0, vx: 0, vy: 0, radius: 8 };
    this.playerScore = 0;
    this.aiScore = 0;
    this.maxScore = 7;
    this.serving = true;
    this.serveDir = 1;
    this.paddleSpeed = 0;
    this.trail = [];
    this.gameTimer = 0;
  }

  start(canvas) {
    super.start(canvas);
    this.playerScore = 0;
    this.aiScore = 0;
    this.gameTimer = 0;
    this.trail = [];
    this._resetBall();
    this._updateHUD();
  }

  _resetBall() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.ball.x = w / 2;
    this.ball.y = h / 2;

    const speed = 300 + this.playerScore * 20 + this.aiScore * 20;
    const angle = (Math.random() * 0.8 - 0.4);
    this.ball.vx = speed * this.serveDir * Math.cos(angle);
    this.ball.vy = speed * Math.sin(angle);

    this.serving = true;
    setTimeout(() => { this.serving = false; }, 500);
  }

  update(dt) {
    this.gameTimer += dt;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const paddleH = h * 0.15;
    const margin = 40;

    this.playerPaddle.height = paddleH;
    this.aiPaddle.height = paddleH;
    this.playerPaddle.width = 14;
    this.aiPaddle.width = 14;
    this.playerPaddle.x = margin;
    this.aiPaddle.x = w - margin - 14;

    if (this.serving) return;

    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;

    if (this.ball.y - this.ball.radius < 50) {
      this.ball.y = 50 + this.ball.radius;
      this.ball.vy = Math.abs(this.ball.vy);
    }
    if (this.ball.y + this.ball.radius > h) {
      this.ball.y = h - this.ball.radius;
      this.ball.vy = -Math.abs(this.ball.vy);
    }

    if (this.ball.x < this.playerPaddle.x + this.playerPaddle.width + this.ball.radius &&
        this.ball.y >= this.playerPaddle.y &&
        this.ball.y <= this.playerPaddle.y + this.playerPaddle.height &&
        this.ball.vx < 0) {
      this.ball.vx = -this.ball.vx * 1.05;
      const hitPos = (this.ball.y - this.playerPaddle.y) / this.playerPaddle.height;
      this.ball.vy += (hitPos - 0.5) * 300;
      this.ball.x = this.playerPaddle.x + this.playerPaddle.width + this.ball.radius;
      window.audioManager?.playPaddleHit();
    }

    if (this.ball.x > this.aiPaddle.x - this.ball.radius &&
        this.ball.y >= this.aiPaddle.y &&
        this.ball.y <= this.aiPaddle.y + this.aiPaddle.height &&
        this.ball.vx > 0) {
      this.ball.vx = -this.ball.vx * 1.05;
      const hitPos = (this.ball.y - this.aiPaddle.y) / this.aiPaddle.height;
      this.ball.vy += (hitPos - 0.5) * 300;
      this.ball.x = this.aiPaddle.x - this.ball.radius;
    }

    const aiCenter = this.aiPaddle.y + this.aiPaddle.height / 2;
    const diff = this.ball.y - aiCenter;
    const aiSpeed = 250 + this.aiScore * 30;
    this.aiPaddle.y += Math.sign(diff) * Math.min(Math.abs(diff), aiSpeed * dt);
    this.aiPaddle.y = Math.max(50, Math.min(h - this.aiPaddle.height, this.aiPaddle.y));

    if (this.ball.x < -20) {
      this.aiScore++;
      this.serveDir = -1;
      window.audioManager?.playMiss();
      if (this.aiScore >= this.maxScore) {
        this.score = this.playerScore * 1000;
        this.gameOver();
        this._showResult(false);
        return;
      }
      this._resetBall();
    }

    if (this.ball.x > w + 20) {
      this.playerScore++;
      this.serveDir = 1;
      window.audioManager?.playScore();
      if (this.playerScore >= this.maxScore) {
        this.score = this.playerScore * 1000 + Math.round(this.gameTimer * 10);
        this.gameOver();
        this._showResult(true);
        return;
      }
      this._resetBall();
    }

    this.trail.push({ x: this.ball.x, y: this.ball.y });
    if (this.trail.length > 12) this.trail.shift();

    this._updateHUD();
  }

  render() {
    const ctx = this.ctx;
    if (!ctx) return;

    const w = window.innerWidth;
    const h = window.innerHeight;

    this._drawBackground(ctx);

    ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(w / 2, 50);
    ctx.lineTo(w / 2, h);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(99, 102, 241, 0.8)';
    ctx.fillRect(this.playerPaddle.x, this.playerPaddle.y, this.playerPaddle.width, this.playerPaddle.height);
    ctx.fillRect(this.aiPaddle.x, this.aiPaddle.y, this.aiPaddle.width, this.aiPaddle.height);

    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i];
      const alpha = (i / this.trail.length) * 0.3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, this.ball.radius * (i / this.trail.length), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(165, 180, 252, ${alpha})`;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = HP.COLORS.WHITE;
    ctx.shadowColor = HP.COLORS.ACCENT;
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.font = '48px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(165, 180, 252, 0.3)';
    ctx.fillText(this.playerScore, w / 4, 100);
    ctx.fillText(this.aiScore, w * 3 / 4, 100);
  }

  handleHands(hands) {
    if (hands.length === 0) return;

    const hand = hands[0];
    const py = hand.indexTip.y * window.innerHeight;
    const h = window.innerHeight;

    const targetY = py - this.playerPaddle.height / 2;
    this.playerPaddle.y += (targetY - this.playerPaddle.y) * 0.3;
    this.playerPaddle.y = Math.max(50, Math.min(h - this.playerPaddle.height, this.playerPaddle.y));
  }

  _updateHUD() {
    const scoreEl = document.getElementById('hud-score');
    const timerEl = document.getElementById('hud-timer');
    const titleEl = document.getElementById('hud-title');

    if (scoreEl) scoreEl.textContent = `Bạn: ${this.playerScore}  |  Máy: ${this.aiScore}`;
    if (timerEl) timerEl.textContent = '';
    if (titleEl) titleEl.textContent = 'Bóng Bàn Không Khí';
  }

  _showResult(won) {
    const overlay = document.getElementById('game-overlay');
    const content = document.getElementById('overlay-content');
    if (!overlay || !content) return;

    content.innerHTML = `
      <h2>${won ? 'Bạn Thắng!' : 'Kết Thúc!'}</h2>
      <div class="big-score">${this.playerScore} - ${this.aiScore}</div>
      <p>${won ? 'Phản xạ tuyệt vời!' : 'Chúc bạn may mắn lần sau!'}</p>
      <div class="overlay-btns">
        <button class="btn-retry" onclick="window.app?.restartGame()">Chơi lại</button>
        <button class="btn-back" onclick="window.app?.backToGames()">Quay lại</button>
      </div>
    `;
    overlay.classList.remove('hidden');

    window.scoreManager?.addScore('airPong', this.getResult());
  }
}

window.gameEngine.register(AirPongGame, HP.GAMES.airPong);
