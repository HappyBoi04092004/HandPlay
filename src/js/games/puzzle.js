/* ========================================
   HANDPLAY — Gesture Puzzle
   Developed by Erick de S.C. Araujo + IA
   ======================================== */

class PuzzleGame extends Game {
  constructor(config) {
    super(config);
    this.pieces = [];
    this.gridSize = 3;
    this.piecesPerRow = 3;
    this.pieceSize = 0;
    this.gridOffset = { x: 0, y: 0 };
    this.draggingPiece = null;
    this.lastPinchPos = null;
    this.timer = 60;
    this.completed = false;
    this.moves = 0;
    this.imageData = null;
  }

  start(canvas) {
    super.start(canvas);
    this.timer = 60;
    this.completed = false;
    this.moves = 0;
    this.score = 0;
    this._initPuzzle();
    this._updateHUD();
  }

  _initPuzzle() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const padding = 100;
    const availW = w - padding * 2;
    const availH = h - padding * 2 - 50;

    this.pieceSize = Math.min(availW / this.piecesPerRow, availH / this.piecesPerRow);
    const totalW = this.pieceSize * this.piecesPerRow;
    const totalH = this.pieceSize * this.piecesPerRow;

    this.gridOffset = {
      x: (w - totalW) / 2,
      y: (h - totalH) / 2 + 25,
    };

    this.pieces = [];

    const colors = [
      '#6366f1', '#818cf8', '#a5b4fc',
      '#4f46e5', '#6366f1', '#818cf8',
      '#4338ca', '#4f46e5', '#6366f1',
    ];

    for (let row = 0; row < this.piecesPerRow; row++) {
      for (let col = 0; col < this.piecesPerRow; col++) {
        const correctIndex = row * this.piecesPerRow + col;

        this.pieces.push({
          id: correctIndex,
          correctX: this.gridOffset.x + col * this.pieceSize,
          correctY: this.gridOffset.y + row * this.pieceSize,
          x: 0,
          y: 0,
          color: colors[correctIndex % colors.length],
          placed: false,
          label: `${row * this.piecesPerRow + col + 1}`,
        });
      }
    }

    this._shufflePieces();
  }

  _shufflePieces() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    for (const piece of this.pieces) {
      let x, y;
      let attempts = 0;
      do {
        x = Math.random() * (w - this.pieceSize * 1.5) + this.pieceSize * 0.25;
        y = Math.random() * (h - this.pieceSize * 1.5) + this.pieceSize * 0.25;
        attempts++;
      } while (attempts < 50 && this._overlapsAny(x, y, piece.id));

      piece.x = x;
      piece.y = y;
      piece.placed = false;
    }
  }

  _overlapsAny(x, y, excludeId) {
    for (const piece of this.pieces) {
      if (piece.id === excludeId || piece.placed) continue;
      if (Math.abs(x - piece.x) < this.pieceSize * 0.8 &&
          Math.abs(y - piece.y) < this.pieceSize * 0.8) {
        return true;
      }
    }
    return false;
  }

  update(dt) {
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = 0;
      this.gameOver();
      return;
    }

    if (!this.completed) {
      const allPlaced = this.pieces.every(p => p.placed);
      if (allPlaced) {
        this.completed = true;
        this.score = Math.round(10000 * (this.timer / 60) * (1 + this.moves * 0.01));
        window.audioManager?.playSuccess();
        setTimeout(() => this._showResult(), 500);
      }
    }

    this._updateHUD();
  }

  render() {
    const ctx = this.ctx;
    if (!ctx) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    this._drawBackground(ctx);

    ctx.globalAlpha = 0.15;
    for (let row = 0; row < this.piecesPerRow; row++) {
      for (let col = 0; col < this.piecesPerRow; col++) {
        ctx.strokeStyle = HP.COLORS.ACCENT;
        ctx.lineWidth = 1;
        ctx.strokeRect(
          this.gridOffset.x + col * this.pieceSize,
          this.gridOffset.y + row * this.pieceSize,
          this.pieceSize,
          this.pieceSize
        );
      }
    }
    ctx.globalAlpha = 1;

    for (const piece of this.pieces) {
      this._drawPiece(ctx, piece);
    }
  }

  _drawPiece(ctx, piece) {
    const padding = 3;
    const x = piece.x + padding;
    const y = piece.y + padding;
    const size = this.pieceSize - padding * 2;

    ctx.fillStyle = piece.placed ? 'rgba(34, 197, 94, 0.3)' : piece.color;
    ctx.beginPath();
    this._roundRect(ctx, x, y, size, size, 8);
    ctx.fill();

    ctx.strokeStyle = piece.placed ? HP.COLORS.SUCCESS : 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    this._roundRect(ctx, x, y, size, size, 8);
    ctx.stroke();

    ctx.font = `600 ${Math.round(this.pieceSize * 0.25)}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText(piece.label, x + size / 2, y + size / 2);

    if (piece === this.draggingPiece) {
      ctx.strokeStyle = HP.COLORS.ACCENT_LIGHT;
      ctx.lineWidth = 3;
      ctx.shadowColor = HP.COLORS.ACCENT;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      this._roundRect(ctx, x - 2, y - 2, size + 4, size + 4, 10);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
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
    if (event.type === HP.GESTURES.PINCH_START) {
      const hand = window.handTracking?.getHands()?.[0];
      if (hand) {
        const idx = hand.indexTip;
        const sx = idx.x * window.innerWidth;
        const sy = idx.y * window.innerHeight;
        this._grabPiece(sx, sy);
      }
    }

    if (event.type === HP.GESTURES.PINCH_END) {
      this._releasePiece();
    }

    if (event.type === HP.GESTURES.HAND_MOVE && this.draggingPiece) {
      if (event.x !== undefined) {
        const sx = event.x * window.innerWidth;
        const sy = event.y * window.innerHeight;
        this.draggingPiece.x = sx - this.pieceSize / 2;
        this.draggingPiece.y = sy - this.pieceSize / 2;
      }
    }
  }

  handleHands(hands) {
    if (hands.length === 0 || !this.draggingPiece) return;

    const hand = hands[0];
    const idx = hand.indexTip;
    const sx = idx.x * window.innerWidth;
    const sy = idx.y * window.innerHeight;

    this.draggingPiece.x = sx - this.pieceSize / 2;
    this.draggingPiece.y = sy - this.pieceSize / 2;
  }

  _grabPiece(x, y) {
    for (const piece of this.pieces) {
      if (piece.placed) continue;
      if (x >= piece.x && x <= piece.x + this.pieceSize &&
          y >= piece.y && y <= piece.y + this.pieceSize) {
        this.draggingPiece = piece;
        window.audioManager?.playClick();
        return;
      }
    }
  }

  _releasePiece() {
    if (!this.draggingPiece) return;

    const piece = this.draggingPiece;
    const snapDistance = this.pieceSize * 0.35;

    const dx = Math.abs(piece.x - piece.correctX);
    const dy = Math.abs(piece.y - piece.correctY);

    if (dx < snapDistance && dy < snapDistance) {
      piece.x = piece.correctX;
      piece.y = piece.correctY;
      piece.placed = true;
      this.moves++;
      window.audioManager?.playPuzzleSnap();
    } else {
      this.moves++;
    }

    this.draggingPiece = null;
  }

  _updateHUD() {
    const scoreEl = document.getElementById('hud-score');
    const timerEl = document.getElementById('hud-timer');
    const titleEl = document.getElementById('hud-title');

    if (scoreEl) scoreEl.textContent = `Điểm: ${this.score}`;
    if (timerEl) timerEl.textContent = `⏱ ${Math.ceil(this.timer)}s`;
    if (titleEl) titleEl.textContent = 'Xếp Hình Cử Chỉ';
  }

  _showResult() {
    const overlay = document.getElementById('game-overlay');
    const content = document.getElementById('overlay-content');
    if (!overlay || !content) return;

    content.innerHTML = `
      <h2>Xếp Hình Hoàn Tất!</h2>
      <div class="big-score">${this.score.toLocaleString()}</div>
      <p>Thời gian: ${Math.round(this.elapsedTime)}s</p>
      <p>Số lượt di chuyển: ${this.moves}</p>
      <p>Thời gian còn lại: ${Math.ceil(this.timer)}s</p>
      <div class="overlay-btns">
        <button class="btn-retry" onclick="window.app?.restartGame()">Chơi lại</button>
        <button class="btn-back" onclick="window.app?.backToGames()">Quay lại</button>
      </div>
    `;
    overlay.classList.remove('hidden');

    window.scoreManager?.addScore('puzzle', this.getResult());
  }
}

window.gameEngine.register(PuzzleGame, HP.GAMES.puzzle);
