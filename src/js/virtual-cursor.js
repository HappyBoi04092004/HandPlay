/* ========================================
   HANDPLAY — Virtual Cursor
   Developed by Erick de S.C. Araujo + IA
   ======================================== */

class VirtualCursor {
  constructor() {
    this.x = 0.5;
    this.y = 0.5;
    this.targetX = 0.5;
    this.targetY = 0.5;
    this.smoothX = 0.5;
    this.smoothY = 0.5;

    this.state = HP.CURSOR_STATES.IDLE;
    this.visible = false;
    this.active = false;

    this.cursorEl = null;
    this.canvasEl = null;
    this.ctx = null;

    this.smoothing = HP.SMOOTHING.CURSOR;
    this.interpolation = 0.15;

    this.hoverTarget = null;
    this.dragStartPos = null;

    this.trailPoints = [];
    this.maxTrailPoints = 20;
  }

  init() {
    this.cursorEl = document.getElementById('virtual-cursor');
    this.canvasEl = document.getElementById('cursor-canvas');

    if (this.canvasEl) {
      this.ctx = this.canvasEl.getContext('2d');
      this._resizeCanvas();
      window.addEventListener('resize', () => this._resizeCanvas());
    }
  }

  _resizeCanvas() {
    if (this.canvasEl) {
      this.canvasEl.width = window.innerWidth;
      this.canvasEl.height = window.innerHeight;
    }
  }

  activate() {
    this.active = true;
    this.visible = true;
    if (this.cursorEl) {
      this.cursorEl.classList.remove('hidden');
      this.cursorEl.classList.add('visible');
    }
  }

  deactivate() {
    this.active = false;
    this.visible = false;
    if (this.cursorEl) {
      this.cursorEl.classList.add('hidden');
      this.cursorEl.classList.remove('visible');
    }
  }

  update(landmarks, gesture) {
    if (!this.active || !landmarks) return;

    const indexTip = landmarks[HP.LANDMARKS.INDEX_TIP];
    if (!indexTip) return;

    this.targetX = indexTip.x;
    this.targetY = indexTip.y;

    this.smoothX += (this.targetX - this.smoothX) * this.interpolation;
    this.smoothY += (this.targetY - this.smoothY) * this.interpolation;

    const screenX = this.smoothX * window.innerWidth;
    const screenY = this.smoothY * window.innerHeight;

    if (this.cursorEl) {
      this.cursorEl.style.left = screenX + 'px';
      this.cursorEl.style.top = screenY + 'px';
    }

    this.x = this.smoothX;
    this.y = this.smoothY;

    if (gesture === HP.GESTURES.PINCH || gesture === HP.GESTURES.PINCH_START) {
      this._setState(HP.CURSOR_STATES.PRESSED);
    } else if (gesture === HP.GESTURES.POINT) {
      const hoverEl = this._getElementAt(screenX, screenY);
      if (hoverEl) {
        this._setState(HP.CURSOR_STATES.HOVER);
      } else {
        this._setState(HP.CURSOR_STATES.IDLE);
      }
    } else {
      this._setState(HP.CURSOR_STATES.IDLE);
    }

    this._updateTrail(screenX, screenY);
  }

  _setState(newState) {
    if (this.state !== newState) {
      this.state = newState;
      if (this.cursorEl) {
        this.cursorEl.classList.remove('hovering', 'pressed');
        if (newState === HP.CURSOR_STATES.HOVER) {
          this.cursorEl.classList.add('hovering');
        } else if (newState === HP.CURSOR_STATES.PRESSED || newState === HP.CURSOR_STATES.DRAGGING) {
          this.cursorEl.classList.add('pressed');
        }
      }
    }
  }

  _getElementAt(x, y) {
    const elements = document.elementsFromPoint(x, y);
    for (const el of elements) {
      if (el.closest && el.closest('[data-gesture-hover]')) {
        return el.closest('[data-gesture-hover]');
      }
    }
    return null;
  }

  _updateTrail(x, y) {
    this.trailPoints.push({ x, y, alpha: 1 });
    if (this.trailPoints.length > this.maxTrailPoints) {
      this.trailPoints.shift();
    }
  }

  renderTrail() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height);

    if (this.trailPoints.length < 2) return;

    for (let i = 1; i < this.trailPoints.length; i++) {
      const p = this.trailPoints[i];
      const prev = this.trailPoints[i - 1];
      const alpha = i / this.trailPoints.length;

      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = `rgba(99, 102, 241, ${alpha * 0.4})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  getPosition() {
    return { x: this.x, y: this.y };
  }

  getState() {
    return this.state;
  }

  isPressed() {
    return this.state === HP.CURSOR_STATES.PRESSED;
  }

  isHovering() {
    return this.state === HP.CURSOR_STATES.HOVER;
  }

  click() {
    const pos = this.getPosition();
    const screenX = pos.x * window.innerWidth;
    const screenY = pos.y * window.innerHeight;
    const target = this._getElementAt(screenX, screenY);
    if (target) {
      target.click();
      window.audioManager?.playClick();
    }
  }
}

window.virtualCursor = new VirtualCursor();
