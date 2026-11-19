/* ========================================
   HANDPLAY — Memory Hands
   Developed by Erick de S.C. Araujo + IA
   ======================================== */

class MemoryHandsGame extends Game {
  constructor(config) {
    super(config);
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.totalPairs = 0;
    this.attempts = 0;
    this.gameTimer = 0;
    this.lockInput = false;
    this.level = 1;
    this.cols = 4;
    this.rows = 3;
    this.cardSize = 0;
    this.gridOffsetX = 0;
    this.gridOffsetY = 0;
    this.flipAnimations = {};
  }

  start(canvas) {
    super.start(canvas);
    this.level = 1;
    this._setupLevel();
    this._updateHUD();
  }

  _setupLevel() {
    const pairs = Math.min(10, 2 + this.level);
    this.totalPairs = pairs;
    this.matchedPairs = 0;
    this.attempts = 0;
    this.flippedCards = [];
    this.lockInput = false;
    this.flipAnimations = {};

    if (pairs <= 3) { this.cols = 4; this.rows = 3; }
    else if (pairs <= 6) { this.cols = 4; this.rows = 4; }
    else { this.cols = 6; this.rows = 4; }

    const symbols = [
      '🍎', '🍊', '🍋', '🍇', '🍓', '🫐', '🍒', '🥝', '🍌', '🍉',
      '🌟', '💫', '⚡', '🔥', '❄️',
    ];

    const selectedSymbols = symbols.slice(0, pairs);
    const deck = [...selectedSymbols, ...selectedSymbols];

    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    const w = window.innerWidth;
    const h = window.innerHeight;
    const areaW = w - 100;
    const areaH = h - 140;

    this.cardSize = Math.min(
      areaW / this.cols - 10,
      areaH / this.rows - 10,
      100
    );

    const totalW = this.cols * (this.cardSize + 10) - 10;
    const totalH = this.rows * (this.cardSize + 10) - 10;

    this.gridOffsetX = (w - totalW) / 2;
    this.gridOffsetY = (h - totalH) / 2 + 30;

    this.cards = deck.map((symbol, i) => ({
      id: i,
      symbol,
      row: Math.floor(i / this.cols),
      col: i % this.cols,
      x: this.gridOffsetX + (i % this.cols) * (this.cardSize + 10),
      y: this.gridOffsetY + Math.floor(i / this.cols) * (this.cardSize + 10),
      flipped: false,
      matched: false,
      flipProgress: 0,
    }));
  }

  update(dt) {
    this.gameTimer += dt;

    for (const card of this.cards) {
      const target = card.flipped || card.matched ? 1 : 0;
      const speed = 8;
      if (Math.abs(card.flipProgress - target) > 0.01) {
        card.flipProgress += Math.sign(target - card.flipProgress) * dt * speed;
        card.flipProgress = Math.max(0, Math.min(1, card.flipProgress));
      }
    }

    this._updateHUD();
  }

  render() {
    const ctx = this.ctx;
    if (!ctx) return;

    this._drawBackground(ctx);

    for (const card of this.cards) {
      this._drawCard(ctx, card);
    }
  }

  _drawCard(ctx, card) {
    const size = this.cardSize;
    const x = card.x;
    const y = card.y;
    const progress = card.flipProgress;
    const scaleX = Math.abs(Math.cos(progress * Math.PI));

    ctx.save();

    if (scaleX < 0.02) {
      ctx.restore();
      return;
    }

    ctx.translate(x + size / 2, y + size / 2);
    ctx.scale(scaleX, 1);
    ctx.translate(-(x + size / 2), -(y + size / 2));

    const radius = 10;

    if (card.matched) {
      ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
    } else if (progress > 0.5) {
      ctx.fillStyle = '#1a1a3e';
      ctx.strokeStyle = HP.COLORS.ACCENT;
    } else {
      ctx.fillStyle = HP.COLORS.ACCENT;
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
    }

    ctx.beginPath();
    this._roundRect(ctx, x, y, size, size, radius);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.stroke();

    if (progress > 0.5) {
      ctx.font = `${Math.round(size * 0.45)}px "Segoe UI Emoji", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';
      ctx.fillText(card.symbol, x + size / 2, y + size / 2);
    } else {
      ctx.font = `${Math.round(size * 0.3)}px "Segoe UI", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillText('?', x + size / 2, y + size / 2);
    }

    ctx.restore();
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  handleGesture(event) {
    if (event.type !== HP.GESTURES.PINCH_START) return;
    if (this.lockInput) return;

    const hand = window.handTracking?.getHands()?.[0];
    if (!hand) return;

    const px = hand.indexTip.x * window.innerWidth;
    const py = hand.indexTip.y * window.innerHeight;

    for (const card of this.cards) {
      if (card.flipped || card.matched) continue;

      if (px >= card.x && px <= card.x + this.cardSize &&
          py >= card.y && py <= card.y + this.cardSize) {
        this._flipCard(card);
        break;
      }
    }
  }

  _flipCard(card) {
    card.flipped = true;
    this.flippedCards.push(card);
    window.audioManager?.playClick();

    if (this.flippedCards.length === 2) {
      this.lockInput = true;
      this.attempts++;

      const [a, b] = this.flippedCards;

      if (a.symbol === b.symbol) {
        a.matched = true;
        b.matched = true;
        this.matchedPairs++;
        this.score += 100 * (1 + this.matchedPairs * 0.1);
        window.audioManager?.playScore();

        if (this.matchedPairs === this.totalPairs) {
          setTimeout(() => this._levelComplete(), 600);
        }
      } else {
        window.audioManager?.playMiss();
      }

      setTimeout(() => {
        if (!a.matched) a.flipped = false;
        if (!b.matched) b.flipped = false;
        this.flippedCards = [];
        this.lockInput = false;
      }, 800);
    }
  }

  _levelComplete() {
    if (this.level >= 5) {
      this.score += Math.round((120 - this.gameTimer) * 10);
      this.gameOver();
      this._showResult();
    } else {
      this.level++;
      this._setupLevel();
      window.audioManager?.playLevelUp();
    }
  }

  _updateHUD() {
    const scoreEl = document.getElementById('hud-score');
    const timerEl = document.getElementById('hud-timer');
    const titleEl = document.getElementById('hud-title');

    if (scoreEl) scoreEl.textContent = `Điểm: ${this.score}  |  Cấp độ: ${this.level}`;
    if (timerEl) timerEl.textContent = `⏱ ${Math.round(this.gameTimer)}s`;
    if (titleEl) titleEl.textContent = 'Trí Nhớ Siêu Phàm';
  }

  _showResult() {
    const overlay = document.getElementById('game-overlay');
    const content = document.getElementById('overlay-content');
    if (!overlay || !content) return;

    content.innerHTML = `
      <h2>Hoàn Thành Tất Cả Cấp Độ!</h2>
      <div class="big-score">${this.score.toLocaleString()}</div>
      <p>Thời gian: ${Math.round(this.gameTimer)}s</p>
      <p>Số lần thử: ${this.attempts}</p>
      <div class="overlay-btns">
        <button class="btn-retry" onclick="window.app?.restartGame()">Chơi lại</button>
        <button class="btn-back" onclick="window.app?.backToGames()">Quay lại</button>
      </div>
    `;
    overlay.classList.remove('hidden');

    window.scoreManager?.addScore('memoryHands', this.getResult());
  }
}

window.gameEngine.register(MemoryHandsGame, HP.GAMES.memoryHands);
