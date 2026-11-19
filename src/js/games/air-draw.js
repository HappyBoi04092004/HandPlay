/* ========================================
   HANDPLAY — Air Draw
   Developed by Erick de S.C. Araujo + IA
   ======================================== */

class AirDrawGame extends Game {
  constructor(config) {
    super(config);
    this.strokes = [];
    this.currentStroke = null;
    this.isDrawing = false;
    this.lastPos = null;
    this.brushSize = 4;
    this.brushColor = '#6366f1';
    this.tool = 'pen';
    this.undoStack = [];
    this.score = 0;
    this.gameTimer = 0;

    this.colorPalette = [
      '#6366f1', '#ef4444', '#22c55e', '#eab308',
      '#ec4899', '#06b6d4', '#f97316', '#ffffff',
    ];

    this.tools = ['pen', 'eraser', 'clear', 'undo', 'save'];
  }

  start(canvas) {
    super.start(canvas);
    this.strokes = [];
    this.undoStack = [];
    this.currentStroke = null;
    this.isDrawing = false;
    this.gameTimer = 0;
    this.tool = 'pen';
    this.brushColor = '#6366f1';
    this.brushSize = 4;
    this._updateHUD();
    this._createToolbar();
  }

  _createToolbar() {
    const existing = document.getElementById('airdraw-toolbar');
    if (existing) existing.remove();

    const toolbar = document.createElement('div');
    toolbar.id = 'airdraw-toolbar';
    toolbar.className = 'airdraw-tools';

    const toolIcons = {
      pen: '✏️',
      eraser: '🧹',
      clear: '🗑️',
      undo: '↩️',
      save: '💾',
    };

    const toolTitles = {
      pen: 'Bút vẽ',
      eraser: 'Tẩy',
      clear: 'Xóa sạch',
      undo: 'Hoàn tác',
      save: 'Lưu ảnh',
    };

    for (const tool of this.tools) {
      const btn = document.createElement('button');
      btn.className = 'airdraw-tool-btn' + (tool === 'pen' ? ' active' : '');
      btn.dataset.tool = tool;
      btn.textContent = toolIcons[tool];
      btn.title = toolTitles[tool] || tool;
      btn.addEventListener('click', () => this._selectTool(tool));
      toolbar.appendChild(btn);
    }

    document.getElementById('screen-game')?.appendChild(toolbar);
  }

  _selectTool(tool) {
    if (tool === 'clear') {
      this.strokes = [];
      this.undoStack = [];
      window.audioManager?.playClick();
      return;
    }

    if (tool === 'undo') {
      if (this.strokes.length > 0) {
        this.undoStack.push(this.strokes.pop());
        window.audioManager?.playClick();
      }
      return;
    }

    if (tool === 'save') {
      this._saveDrawing();
      return;
    }

    this.tool = tool;
    const btns = document.querySelectorAll('#airdraw-toolbar .airdraw-tool-btn');
    btns.forEach(btn => btn.classList.toggle('active', btn.dataset.tool === tool));
    window.audioManager?.playClick();
  }

  async _saveDrawing() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = window.innerWidth;
    tempCanvas.height = window.innerHeight;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.fillStyle = '#0a0a1a';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    for (const stroke of this.strokes) {
      if (stroke.points.length < 2) continue;
      tempCtx.beginPath();
      tempCtx.strokeStyle = stroke.color;
      tempCtx.lineWidth = stroke.size;
      tempCtx.lineCap = 'round';
      tempCtx.lineJoin = 'round';
      tempCtx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        const p0 = stroke.points[i - 1];
        const p1 = stroke.points[i];
        const mx = (p0.x + p1.x) / 2;
        const my = (p0.y + p1.y) / 2;
        tempCtx.quadraticCurveTo(p0.x, p0.y, mx, my);
      }
      tempCtx.stroke();
    }

    const dataUrl = tempCanvas.toDataURL('image/png');
    if (window.electronAPI?.saveImage) {
      await window.electronAPI.saveImage(dataUrl, 'handplay-drawing.png');
    } else {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'handplay-drawing.png';
      a.click();
    }
  }

  update(dt) {
    this.gameTimer += dt;
    this.score = this.strokes.reduce((sum, s) => sum + s.points.length, 0);
    this._updateHUD();
  }

  render() {
    const ctx = this.ctx;
    if (!ctx) return;

    this._drawBackground(ctx);

    for (const stroke of this.strokes) {
      this._drawStroke(ctx, stroke);
    }

    if (this.currentStroke) {
      this._drawStroke(ctx, this.currentStroke);
    }

    const hand = window.handTracking?.getHands()?.[0];
    if (hand) {
      const x = hand.indexTip.x * window.innerWidth;
      const y = hand.indexTip.y * window.innerHeight;

      const circleSize = this.tool === 'eraser' ? 20 : this.brushSize;
      ctx.beginPath();
      ctx.arc(x, y, circleSize, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(165, 180, 252, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (this.tool !== 'eraser') {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = this.brushColor;
        ctx.fill();
      }
    }
  }

  _drawStroke(ctx, stroke) {
    if (stroke.points.length < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    }

    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    for (let i = 1; i < stroke.points.length; i++) {
      const p0 = stroke.points[i - 1];
      const p1 = stroke.points[i];
      const mx = (p0.x + p1.x) / 2;
      const my = (p0.y + p1.y) / 2;
      ctx.quadraticCurveTo(p0.x, p0.y, mx, my);
    }
    ctx.stroke();

    ctx.globalCompositeOperation = 'source-over';
  }

  handleHands(hands) {
    if (hands.length === 0) {
      if (this.isDrawing) {
        this.isDrawing = false;
        this.currentStroke = null;
      }
      return;
    }

    const hand = hands[0];
    const x = hand.indexTip.x * window.innerWidth;
    const y = hand.indexTip.y * window.innerHeight;

    if (this.tool === 'pen' || this.tool === 'eraser') {
      if (!this.isDrawing) {
        this.isDrawing = true;
        this.currentStroke = {
          tool: this.tool,
          color: this.tool === 'eraser' ? '#000' : this.brushColor,
          size: this.tool === 'eraser' ? 30 : this.brushSize,
          points: [],
        };
      }

      if (this.currentStroke) {
        this.currentStroke.points.push({ x, y });
      }
    }
  }

  handleGesture(event) {
    if (event.type === HP.GESTURES.PINCH_START) {
      if (this.tool === 'pen' || this.tool === 'eraser') {
        if (!this.isDrawing) {
          this.isDrawing = true;
          this.currentStroke = {
            tool: this.tool,
            color: this.tool === 'eraser' ? '#000' : this.brushColor,
            size: this.tool === 'eraser' ? 30 : this.brushSize,
            points: [],
          };
        }
      }
    }

    if (event.type === HP.GESTURES.PINCH_END) {
      if (this.isDrawing && this.currentStroke && this.currentStroke.points.length > 1) {
        this.strokes.push(this.currentStroke);
      }
      this.isDrawing = false;
      this.currentStroke = null;
      this.undoStack = [];
    }
  }

  _updateHUD() {
    const scoreEl = document.getElementById('hud-score');
    const timerEl = document.getElementById('hud-timer');
    const titleEl = document.getElementById('hud-title');

    const toolNames = {
      pen: 'BÚT VẼ',
      eraser: 'TẨY',
      clear: 'XÓA SẠCH',
      undo: 'HOÀN TÁC',
      save: 'LƯU ẢNH',
    };

    if (scoreEl) scoreEl.textContent = `Nét vẽ: ${this.strokes.length}  |  Công cụ: ${toolNames[this.tool] || this.tool.toUpperCase()}`;
    if (timerEl) timerEl.textContent = '';
    if (titleEl) titleEl.textContent = 'Vẽ Tranh Trên Không';
  }

  stop() {
    super.stop();
    const toolbar = document.getElementById('airdraw-toolbar');
    if (toolbar) toolbar.remove();
  }
}

window.gameEngine.register(AirDrawGame, HP.GAMES.airDraw);
