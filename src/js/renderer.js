/* ========================================
   HANDPLAY — Renderer
   Developed by Erick de S.C. Araujo + IA
   ======================================== */

class Renderer {
  constructor() {
    this.cameraCanvas = null;
    this.cameraCtx = null;
    this.handCanvas = null;
    this.handCtx = null;
    this.gameCanvas = null;
    this.gameCtx = null;

    this.showCamera = true;
    this.showLandmarks = true;
    this.showConnections = true;
    this.showBbox = false;
    this.showTrajectory = false;
    this.showGestureLabel = true;
    this.showDebug = false;

    this.mirrored = true;
    this.running = false;
  }

  init() {
    this.cameraCanvas = document.getElementById('camera-canvas');
    this.handCanvas = document.getElementById('hand-canvas');
    this.gameCanvas = document.getElementById('game-canvas');

    this.cameraCtx = this.cameraCanvas?.getContext('2d');
    this.handCtx = this.handCanvas?.getContext('2d');
    this.gameCtx = this.gameCanvas?.getContext('2d');

    this._resizeAll();
    window.addEventListener('resize', () => this._resizeAll());
  }

  _resizeAll() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    for (const canvas of [this.cameraCanvas, this.handCanvas, this.gameCanvas]) {
      if (!canvas) continue;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';

      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  renderCamera(video) {
    if (!this.cameraCtx || !video || !this.showCamera) return;

    // Must have valid video dimensions
    if (!video.videoWidth || !video.videoHeight || video.readyState < 2) return;

    const ctx = this.cameraCtx;
    const w = window.innerWidth;
    const h = window.innerHeight;

    ctx.clearRect(0, 0, w, h);

    ctx.save();

    if (this.mirrored) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }

    const videoAspect = video.videoWidth / video.videoHeight;
    const canvasAspect = w / h;

    let drawW, drawH, drawX, drawY;

    if (videoAspect > canvasAspect) {
      drawH = h;
      drawW = h * videoAspect;
      drawX = (w - drawW) / 2;
      drawY = 0;
    } else {
      drawW = w;
      drawH = w / videoAspect;
      drawX = 0;
      drawY = (h - drawH) / 2;
    }

    ctx.globalAlpha = 0.7;
    ctx.drawImage(video, drawX, drawY, drawW, drawH);
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  renderHands(hands, currentGesture) {
    if (!this.handCtx) return;

    const ctx = this.handCtx;
    const w = window.innerWidth;
    const h = window.innerHeight;

    ctx.clearRect(0, 0, w, h);

    for (const hand of hands) {
      if (this.showConnections) {
        this._drawConnections(ctx, hand.landmarks, w, h);
      }

      if (this.showLandmarks) {
        this._drawLandmarks(ctx, hand.landmarks, w, h);
      }

      if (this.showBbox) {
        this._drawBoundingBox(ctx, hand.landmarks, w, h);
      }

      if (this.showGestureLabel && hand.indexTip) {
        this._drawGestureLabel(ctx, hand, w, h, currentGesture);
      }
    }

    if (this.showDebug && hands.length > 0) {
      this._drawDebugInfo(ctx, hands);
    }
  }

  _drawConnections(ctx, landmarks, w, h) {
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
    ctx.lineWidth = 2;

    for (const [start, end] of HP.HAND_CONNECTIONS) {
      const p1 = landmarks[start];
      const p2 = landmarks[end];
      if (!p1 || !p2) continue;

      const x1 = p1.x * w;
      const y1 = p1.y * h;
      const x2 = p2.x * w;
      const y2 = p2.y * h;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  _drawLandmarks(ctx, landmarks, w, h) {
    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      const x = lm.x * w;
      const y = lm.y * h;

      const isTip = [4, 8, 12, 16, 20].includes(i);
      const radius = isTip ? 5 : 3;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);

      if (isTip) {
        ctx.fillStyle = '#a5b4fc';
        ctx.shadowColor = '#6366f1';
        ctx.shadowBlur = 8;
      } else {
        ctx.fillStyle = 'rgba(129, 140, 248, 0.6)';
        ctx.shadowBlur = 0;
      }

      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  _drawBoundingBox(ctx, landmarks, w, h) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const lm of landmarks) {
      const x = lm.x * w;
      const y = lm.y * h;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }

    const padding = 15;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
    ctx.setLineDash([]);
  }

  _drawGestureLabel(ctx, hand, w, h, gesture) {
    if (!hand.palmCenter) return;

    const x = hand.palmCenter.x * w;
    const y = hand.palmCenter.y * h - 30;

    ctx.font = '600 12px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(165, 180, 252, 0.8)';

    const label = gesture.replace('_', ' ').toUpperCase();
    ctx.fillText(label, x, y);
  }

  _drawDebugInfo(ctx, hands) {
    const hand = hands[0];
    if (!hand) return;

    ctx.font = '11px "Cascadia Code", monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(165, 180, 252, 0.6)';

    const x = 20;
    const startY = 80;
    const lines = [
      `Confidence: ${(hand.confidence * 100).toFixed(1)}%`,
      `Velocity: ${(hand.velocity.speed * 1000).toFixed(2)}`,
      `Index: (${hand.indexTip.x.toFixed(3)}, ${hand.indexTip.y.toFixed(3)})`,
      `Palm: (${hand.palmCenter.x.toFixed(3)}, ${hand.palmCenter.y.toFixed(3)})`,
      `Handedness: ${hand.handedness}`,
    ];

    lines.forEach((line, i) => {
      ctx.fillText(line, x, startY + i * 16);
    });
  }

  getGameContext() {
    return this.gameCtx;
  }

  clearGame() {
    if (this.gameCtx) {
      this.gameCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }

  clearAll() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.handCtx?.clearRect(0, 0, w, h);
    this.gameCtx?.clearRect(0, 0, w, h);
  }

  setShowCamera(value) { this.showCamera = value; }
  setShowLandmarks(value) { this.showLandmarks = value; }
  setShowConnections(value) { this.showConnections = value; }
  setShowBbox(value) { this.showBbox = value; }
  setShowTrajectory(value) { this.showTrajectory = value; }
  setShowGestureLabel(value) { this.showGestureLabel = value; }
  setShowDebug(value) { this.showDebug = value; }
  setMirrored(value) { this.mirrored = value; }
}

window.renderer = new Renderer();
