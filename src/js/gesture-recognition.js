/* ========================================
   HANDPLAY — Gesture Recognition
   Developed by Erick de S.C. Araujo + IA
   ======================================== */

class GestureRecognition {
  constructor() {
    this.currentGesture = HP.GESTURES.NONE;
    this.prevGesture = HP.GESTURES.NONE;
    this.gestureStartTime = 0;
    this.gestureCallbacks = [];

    this.swipeTracker = {
      positions: [],
      timestamps: [],
    };

    this.pinchActive = false;
    this.handLostTimeout = null;

    this.sensitivity = 0.5;
    this.swipeThreshold = HP.SWIPE_THRESHOLD;
  }

  init() {
    if (window.settingsManager) {
      this.sensitivity = window.settingsManager.get('gestures.sensitivity') ?? 0.5;
      this.swipeThreshold = window.settingsManager.get('gestures.swipeThreshold') ?? HP.SWIPE_THRESHOLD;
    }
  }

  processHands(hands) {
    this.prevGesture = this.currentGesture;

    if (hands.length === 0) {
      if (this.currentGesture !== HP.GESTURES.NONE) {
        this._emitGesture(HP.GESTURES.HAND_LOST);
        this.currentGesture = HP.GESTURES.NONE;
      }
      this._clearSwipeTracker();
      return;
    }

    const hand = hands[0];

    if (hands.length >= 2) {
      this._emitGesture(HP.GESTURES.TWO_HANDS);
    }

    const gesture = this._detectGesture(hand);

    if (gesture !== this.currentGesture) {
      this.currentGesture = gesture;
      this.gestureStartTime = performance.now();

      if (gesture === HP.GESTURES.PINCH) {
        this._emitGesture(HP.GESTURES.PINCH_START);
      }

      this._emitGesture(gesture);
    }

    this._trackSwipe(hand);

    this._emitGesture(HP.GESTURES.HAND_MOVE, {
      x: hand.indexTip.x,
      y: hand.indexTip.y,
      palm: hand.palmCenter,
      velocity: hand.velocity,
    });
  }

  _getGestureLandmarks(hand) {
    if (hand.normalizedLandmarks && hand.normalizedLandmarks.length >= 21) {
      return hand.normalizedLandmarks;
    }
    // Fallback: normalize on the fly if hand-tracking not yet patched
    if (hand.landmarks && hand.landmarks.length >= 21) {
      return this._normalizeForGesture(hand.landmarks);
    }
    return null;
  }

  _normalizeForGesture(landmarks) {
    const wrist = landmarks[HP.LANDMARKS.WRIST];
    const middleMcp = landmarks[HP.LANDMARKS.MIDDLE_MCP];
    const palmSize = Math.hypot(middleMcp.x - wrist.x, middleMcp.y - wrist.y) || 0.1;
    return landmarks.map(lm => ({
      x: (lm.x - wrist.x) / palmSize,
      y: (lm.y - wrist.y) / palmSize,
      z: lm.z / palmSize,
    }));
  }

  _detectGesture(hand) {
    const landmarks = this._getGestureLandmarks(hand);
    if (!landmarks || landmarks.length < 21) return HP.GESTURES.NONE;

    if (this._isPinch(landmarks)) {
      if (!this.pinchActive) {
        this.pinchActive = true;
      }
      return HP.GESTURES.PINCH;
    }

    if (this.pinchActive) {
      this.pinchActive = false;
      this._emitGesture(HP.GESTURES.PINCH_END);
    }

    if (this._isFist(landmarks)) {
      return HP.GESTURES.FIST;
    }

    if (this._isOpenHand(landmarks)) {
      return HP.GESTURES.OPEN_HAND;
    }

    if (this._isPointing(landmarks)) {
      return HP.GESTURES.POINT;
    }

    return HP.GESTURES.HAND_DETECTED;
  }

  _isPinch(landmarks) {
    const thumbTip = landmarks[HP.LANDMARKS.THUMB_TIP];
    const indexTip = landmarks[HP.LANDMARKS.INDEX_TIP];

    const distance = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
    const threshold = this.pinchActive ? HP.PINCH_RELEASE_THRESHOLD : HP.PINCH_THRESHOLD;

    return distance < threshold;
  }

  _isFist(landmarks) {
    const fingerTips = [
      HP.LANDMARKS.INDEX_TIP,
      HP.LANDMARKS.MIDDLE_TIP,
      HP.LANDMARKS.RING_TIP,
      HP.LANDMARKS.PINKY_TIP,
    ];

    const fingerMcps = [
      HP.LANDMARKS.INDEX_MCP,
      HP.LANDMARKS.MIDDLE_MCP,
      HP.LANDMARKS.RING_MCP,
      HP.LANDMARKS.PINKY_MCP,
    ];

    let closedCount = 0;
    for (let i = 0; i < fingerTips.length; i++) {
      const tip = landmarks[fingerTips[i]];
      const mcp = landmarks[fingerMcps[i]];
      const wrist = landmarks[HP.LANDMARKS.WRIST];

      const tipDist = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
      const mcpDist = Math.hypot(mcp.x - wrist.x, mcp.y - wrist.y);

      if (tipDist < mcpDist + HP.FIST_THRESHOLD) {
        closedCount++;
      }
    }

    return closedCount >= 3;
  }

  _isOpenHand(landmarks) {
    const fingerTips = [
      HP.LANDMARKS.INDEX_TIP,
      HP.LANDMARKS.MIDDLE_TIP,
      HP.LANDMARKS.RING_TIP,
      HP.LANDMARKS.PINKY_TIP,
    ];

    const fingerMcps = [
      HP.LANDMARKS.INDEX_MCP,
      HP.LANDMARKS.MIDDLE_MCP,
      HP.LANDMARKS.RING_MCP,
      HP.LANDMARKS.PINKY_MCP,
    ];

    let openCount = 0;
    for (let i = 0; i < fingerTips.length; i++) {
      const tip = landmarks[fingerTips[i]];
      const mcp = landmarks[fingerMcps[i]];
      const wrist = landmarks[HP.LANDMARKS.WRIST];

      const tipDist = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
      const mcpDist = Math.hypot(mcp.x - wrist.x, mcp.y - wrist.y);

      if (tipDist > mcpDist + 0.05) {
        openCount++;
      }
    }

    return openCount >= 3;
  }

  _isPointing(landmarks) {
    const indexTip = landmarks[HP.LANDMARKS.INDEX_TIP];
    const indexPip = landmarks[HP.LANDMARKS.INDEX_PIP];
    const middleTip = landmarks[HP.LANDMARKS.MIDDLE_TIP];
    const middlePip = landmarks[HP.LANDMARKS.MIDDLE_PIP];
    const ringTip = landmarks[HP.LANDMARKS.RING_TIP];
    const ringPip = landmarks[HP.LANDMARKS.RING_PIP];
    const pinkyTip = landmarks[HP.LANDMARKS.PINKY_TIP];
    const pinkyPip = landmarks[HP.LANDMARKS.PINKY_PIP];
    const wrist = landmarks[HP.LANDMARKS.WRIST];

    const indexExtended = this._isFingerExtended(indexTip, indexPip, wrist);
    const middleFolded = !this._isFingerExtended(middleTip, middlePip, wrist);
    const ringFolded = !this._isFingerExtended(ringTip, ringPip, wrist);
    const pinkyFolded = !this._isFingerExtended(pinkyTip, pinkyPip, wrist);

    return indexExtended && middleFolded && ringFolded && pinkyFolded;
  }

  _isFingerExtended(tip, pip, wrist) {
    const tipDist = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
    const pipDist = Math.hypot(pip.x - wrist.x, pip.y - wrist.y);
    return tipDist > pipDist + 0.02;
  }

  _trackSwipe(hand) {
    const now = performance.now();
    const pos = hand.indexTip;

    this.swipeTracker.positions.push({ x: pos.x, y: pos.y });
    this.swipeTracker.timestamps.push(now);

    while (this.swipeTracker.timestamps.length > 0 &&
           now - this.swipeTracker.timestamps[0] > HP.SWIPE_TIME_WINDOW) {
      this.swipeTracker.positions.shift();
      this.swipeTracker.timestamps.shift();
    }

    if (this.swipeTracker.positions.length < 5) return;

    const first = this.swipeTracker.positions[0];
    const last = this.swipeTracker.positions[this.swipeTracker.positions.length - 1];
    const dx = last.x - first.x;
    const dy = last.y - first.y;

    if (Math.abs(dx) > this.swipeThreshold && Math.abs(dx) > Math.abs(dy)) {
      const gesture = dx > 0 ? HP.GESTURES.SWIPE_RIGHT : HP.GESTURES.SWIPE_LEFT;
      if (gesture !== this.currentGesture) {
        this._emitGesture(gesture);
        this.currentGesture = gesture;
      }
      this._clearSwipeTracker();
    } else if (Math.abs(dy) > this.swipeThreshold && Math.abs(dy) > Math.abs(dx)) {
      const gesture = dy > 0 ? HP.GESTURES.SWIPE_DOWN : HP.GESTURES.SWIPE_UP;
      if (gesture !== this.currentGesture) {
        this._emitGesture(gesture);
        this.currentGesture = gesture;
      }
      this._clearSwipeTracker();
    }
  }

  _clearSwipeTracker() {
    this.swipeTracker.positions = [];
    this.swipeTracker.timestamps = [];
  }

  _emitGesture(gesture, data = {}) {
    const event = {
      type: gesture,
      timestamp: performance.now(),
      ...data,
    };

    for (const cb of this.gestureCallbacks) {
      cb(event);
    }
  }

  onGesture(callback) {
    this.gestureCallbacks.push(callback);
  }

  removeGestureListener(callback) {
    this.gestureCallbacks = this.gestureCallbacks.filter(cb => cb !== callback);
  }

  getCurrentGesture() {
    return this.currentGesture;
  }

  isPinching() {
    return this.currentGesture === HP.GESTURES.PINCH;
  }

  isPointing() {
    return this.currentGesture === HP.GESTURES.POINT;
  }

  setSensitivity(value) {
    this.sensitivity = Math.max(0.1, Math.min(1.0, value));
    this.swipeThreshold = 0.06 + (1.0 - this.sensitivity) * 0.12;
  }

  reset() {
    this.currentGesture = HP.GESTURES.NONE;
    this.prevGesture = HP.GESTURES.NONE;
    this.pinchActive = false;
    this._clearSwipeTracker();
  }
}

window.gestureRecognition = new GestureRecognition();
