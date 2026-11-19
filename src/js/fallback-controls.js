/* ========================================
   HANDPLAY — Fallback Controls
   Keyboard & Mouse fallback when camera unavailable
   Developed by Erick de S.C. Araujo + IA
   ======================================== */

class FallbackControls {
  constructor() {
    this.active = false;
    this.mouseX = 0.5;
    this.mouseY = 0.5;
    this.keys = {};
    this.mouseDown = false;
    this.cursorVisible = false;
    this.simulatedHand = null;
    this.gestureCallbacks = [];
    this.keyBindings = {
      ' ': HP.GESTURES.PINCH_START,
      'Enter': HP.GESTURES.PINCH_START,
      'ArrowUp': HP.GESTURES.SWIPE_UP,
      'ArrowDown': HP.GESTURES.SWIPE_DOWN,
      'ArrowLeft': HP.GESTURES.SWIPE_LEFT,
      'ArrowRight': HP.GESTURES.SWIPE_RIGHT,
      'w': HP.GESTURES.SWIPE_UP,
      's': HP.GESTURES.SWIPE_DOWN,
      'a': HP.GESTURES.SWIPE_LEFT,
      'd': HP.GESTURES.SWIPE_RIGHT,
    };
    this.simulatedGesture = HP.GESTURES.NONE;
    this.simulatedGestureTimer = null;
  }

  activate() {
    if (this.active) return;
    this.active = true;

    this._onMouseMove = (e) => {
      this.mouseX = e.clientX / window.innerWidth;
      this.mouseY = e.clientY / window.innerHeight;
      this._updateSimulatedHand();
    };

    this._onMouseDown = (e) => {
      if (e.target.closest('.menu-btn, .back-btn, .settings-tab, .pose-btn, .game-card, .hud-btn, button, select, input, label')) return;
      this.mouseDown = true;
      this._emitGesture(HP.GESTURES.PINCH_START);
    };

    this._onMouseUp = (e) => {
      this.mouseDown = false;
      this._emitGesture(HP.GESTURES.PINCH_END);
    };

    this._onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;

      this.keys[e.key] = true;

      const gesture = this.keyBindings[e.key];
      if (gesture) {
        this._emitGesture(gesture);
        e.preventDefault();
      }

      if (e.key === 'Escape') {
        const game = window.gameEngine?.getCurrentGame();
        if (!game) return;

        if (game.state === HP.GAME_STATES.PLAYING) {
          document.getElementById('btn-pause')?.click();
        } else if (game.state === HP.GAME_STATES.PAUSED) {
          window.gameEngine.resumeCurrentGame();
          window.pauseMenu?.hide();
        }
      }

      if (e.key === 'f' || e.key === 'F') {
        window.app?.toggleFullscreen();
      }

      if (e.key === 'm' || e.key === 'M') {
        window.virtualCursor?.activate();
      }
    };

    this._onKeyUp = (e) => {
      this.keys[e.key] = false;

      const gesture = this.keyBindings[e.key];
      if (gesture === HP.GESTURES.PINCH_START) {
        this._emitGesture(HP.GESTURES.PINCH_END);
      }
    };

    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('mousedown', this._onMouseDown);
    document.addEventListener('mouseup', this._onMouseUp);
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);

    this._activateCursor();
  }

  deactivate() {
    if (!this.active) return;
    this.active = false;

    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mousedown', this._onMouseDown);
    document.removeEventListener('mouseup', this._onMouseUp);
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup', this._onKeyUp);

    this._deactivateCursor();
  }

  _activateCursor() {
    this.cursorVisible = true;
    const cursor = document.getElementById('virtual-cursor');
    if (cursor) {
      cursor.classList.remove('hidden');
      cursor.classList.add('visible');
    }
  }

  _deactivateCursor() {
    this.cursorVisible = false;
    const cursor = document.getElementById('virtual-cursor');
    if (cursor) {
      cursor.classList.add('hidden');
      cursor.classList.remove('visible');
    }
  }

  _updateSimulatedHand() {
    this.simulatedHand = [{
      landmarks: this._createSimulatedLandmarks(this.mouseX, this.mouseY),
      palmCenter: { x: this.mouseX, y: this.mouseY },
      indexTip: { x: this.mouseX, y: this.mouseY },
      thumbTip: { x: this.mouseX + 0.02, y: this.mouseY + 0.02 },
      velocity: { x: 0, y: 0, speed: 0 },
      confidence: 1,
      handedness: 'Right',
      pointingDirection: { dx: 0, dy: -0.1, angle: -Math.PI / 2 },
    }];
  }

  _createSimulatedLandmarks(cx, cy) {
    const landmarks = [];
    const spread = 0.04;

    // 21 landmarks matching MediaPipe hand model
    const positions = [
      { x: cx, y: cy + 0.06 },           // 0: wrist
      { x: cx - 0.015, y: cy + 0.04 },   // 1: thumb CMC
      { x: cx - 0.025, y: cy + 0.02 },   // 2: thumb MCP
      { x: cx - 0.03, y: cy },            // 3: thumb IP
      { x: cx - 0.035, y: cy - 0.02 },   // 4: thumb tip
      { x: cx - 0.01, y: cy - 0.01 },    // 5: index MCP
      { x: cx - 0.01, y: cy - 0.03 },    // 6: index PIP
      { x: cx - 0.01, y: cy - 0.04 },    // 7: index DIP
      { x: cx, y: cy - 0.05 },           // 8: index tip
      { x: cx + 0.01, y: cy - 0.01 },    // 9: middle MCP
      { x: cx + 0.01, y: cy - 0.03 },    // 10: middle PIP
      { x: cx + 0.01, y: cy - 0.035 },   // 11: middle DIP
      { x: cx + 0.01, y: cy - 0.04 },    // 12: middle tip
      { x: cx + 0.025, y: cy - 0.005 },  // 13: ring MCP
      { x: cx + 0.025, y: cy - 0.02 },   // 14: ring PIP
      { x: cx + 0.025, y: cy - 0.025 },  // 15: ring DIP
      { x: cx + 0.025, y: cy - 0.03 },   // 16: ring tip
      { x: cx + 0.035, y: cy + 0.005 },  // 17: pinky MCP
      { x: cx + 0.035, y: cy - 0.01 },   // 18: pinky PIP
      { x: cx + 0.035, y: cy - 0.015 },  // 19: pinky DIP
      { x: cx + 0.035, y: cy - 0.02 },   // 20: pinky tip
    ];

    for (const pos of positions) {
      landmarks.push({
        x: pos.x + (Math.random() - 0.5) * 0.002,
        y: pos.y + (Math.random() - 0.5) * 0.002,
        z: 0,
      });
    }

    return landmarks;
  }

  _emitGesture(gesture) {
    const event = {
      type: gesture,
      timestamp: performance.now(),
      x: this.mouseX,
      y: this.mouseY,
      palm: { x: this.mouseX, y: this.mouseY },
    };

    for (const cb of this.gestureCallbacks) {
      cb(event);
    }
  }

  getSimulatedHands() {
    if (!this.active || !this.mouseDown) {
      if (this.simulatedHand) {
        return this.simulatedHand;
      }
    }

    if (!this.active) return [];

    this._updateSimulatedHand();
    return this.simulatedHand;
  }

  isActive() {
    return this.active;
  }

  onGesture(callback) {
    this.gestureCallbacks.push(callback);
  }

  removeGestureListener(callback) {
    this.gestureCallbacks = this.gestureCallbacks.filter(cb => cb !== callback);
  }

  getMousePosition() {
    return { x: this.mouseX, y: this.mouseY };
  }

  isKeyPressed(key) {
    return !!this.keys[key];
  }
}

window.fallbackControls = new FallbackControls();
