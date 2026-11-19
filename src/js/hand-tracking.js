/* ========================================
   HANDPLAY — Hand Tracking
   Developed by Erick de S.C. Araujo + IA
   ======================================== */

class HandTracking {
  constructor() {
    this.handLandmarker = null;
    this.active = false;
    this.ready = false;

    this.hands = [];
    this.smoothedHands = [];
    this.prevHands = [];
    this.velocityHistory = [];

    this.smoothingFactor = 0.35;
    this.maxSmoothedHands = 2;

    this.performanceLevel = HP.PERFORMANCE_LEVELS.HIGH;
    this.lastInferenceTime = 0;
    this.frameCount = 0;
    this.fpsHistory = [];

    this._onResultsCallback = null;
    this._resourcesPath = null;
  }

  _toFileUrl(fsPath) {
    const normalized = fsPath.replace(/\\/g, '/');
    if (normalized.startsWith('file:///')) return normalized;
    if (normalized.startsWith('file://')) return 'file:///' + normalized.substring(7);
    return 'file:///' + normalized;
  }

  async init() {
    try {
      this._resourcesPath = await this._getResourcesPath();
      console.log('HandTracking: resources path:', this._resourcesPath);

      if (!window.Vision) {
        await this._loadMediaPipeScripts();
      }

      if (!window.Vision) {
        throw new Error('MediaPipe vision_bundle.js failed to load — window.Vision is undefined');
      }

      const mediapipeDir = this._toFileUrl(this._resourcesPath + '/mediapipe/');
      const modelFile = this._toFileUrl(this._resourcesPath + '/models/hand-landmarker/hand_landmarker.task');

      console.log('FilesetResolver path:', mediapipeDir);
      console.log('Model path:', modelFile);

      // Step 1: Load FilesetResolver
      console.log('Step 1: Loading FilesetResolver...');
      let vision;
      try {
        vision = await window.Vision.FilesetResolver.forVisionTasks(mediapipeDir);
      } catch (e) {
        console.error('FilesetResolver FAILED:', e.message || e);
        if (e.stack) console.error('Stack:', e.stack);
        throw new Error('FilesetResolver failed: ' + (e.message || e));
      }
      if (!vision) throw new Error('FilesetResolver returned null/undefined');
      console.log('Step 1 OK: FilesetResolver loaded');

      // Step 2: Try creating HandLandmarker
      // First try with modelAssetBuffer, then with modelAssetPath
      console.log('Step 2: Creating HandLandmarker...');

      // Attempt 1: modelAssetBuffer + GPU
      try {
        console.log('Attempt 1a: modelAssetBuffer + GPU delegate');
        const modelBuffer = await this._fetchFileAsBuffer(modelFile);
        console.log('Model buffer loaded, size:', modelBuffer.byteLength);
        const modelUint8 = new Uint8Array(modelBuffer);

        this.handLandmarker = await window.Vision.HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetBuffer: modelUint8,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        console.log('SUCCESS: HandLandmarker created (GPU + buffer)');
        this.ready = true;
        return true;
      } catch (e1) {
        console.warn('Attempt 1a failed:', e1.message || e1);

        // Attempt 1b: modelAssetBuffer + CPU
        try {
          console.log('Attempt 1b: modelAssetBuffer + CPU delegate');
          const modelBuffer = await this._fetchFileAsBuffer(modelFile);
          const modelUint8 = new Uint8Array(modelBuffer);

          this.handLandmarker = await window.Vision.HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetBuffer: modelUint8,
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numHands: 2,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
          console.log('SUCCESS: HandLandmarker created (CPU + buffer)');
          this.ready = true;
          return true;
        } catch (e1b) {
          console.warn('Attempt 1b failed:', e1b.message || e1b);
        }

        // Attempt 2: modelAssetPath (let MediaPipe handle file loading)
        try {
          console.log('Attempt 2: modelAssetPath + GPU delegate');
          this.handLandmarker = await window.Vision.HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: modelFile,
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numHands: 2,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
          console.log('SUCCESS: HandLandmarker created (GPU + path)');
          this.ready = true;
          return true;
        } catch (e2) {
          console.warn('Attempt 2 failed:', e2.message || e2);

          // Attempt 3: modelAssetPath + CPU
          try {
            console.log('Attempt 3: modelAssetPath + CPU delegate');
            this.handLandmarker = await window.Vision.HandLandmarker.createFromOptions(vision, {
              baseOptions: {
                modelAssetPath: modelFile,
                delegate: 'CPU',
              },
              runningMode: 'VIDEO',
              numHands: 2,
              minHandDetectionConfidence: 0.5,
              minHandPresenceConfidence: 0.5,
              minTrackingConfidence: 0.5,
            });
            console.log('SUCCESS: HandLandmarker created (CPU + path)');
            this.ready = true;
            return true;
          } catch (e3) {
            console.error('Attempt 3 failed:', e3.message || e3);
            if (e3.stack) console.error('Stack:', e3.stack);
            throw new Error('All HandLandmarker creation attempts failed');
          }
        }
      }
    } catch (e) {
      console.error('HandTracking init failed:', e.message || e.toString());
      if (e.stack) console.error('Full error stack:', e.stack);
      this.ready = false;
      return false;
    }
  }

  async _fetchFileAsBuffer(fileUrl) {
    try {
      const response = await fetch(fileUrl);
      if (response.ok) {
        return await response.arrayBuffer();
      }
      console.warn('fetch returned status:', response.status, 'for', fileUrl);
    } catch (e) {
      console.warn('fetch failed:', e.message, 'URL:', fileUrl);
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', fileUrl, true);
      xhr.responseType = 'arraybuffer';
      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 0) {
          resolve(xhr.response);
        } else {
          reject(new Error('XHR failed: ' + xhr.status));
        }
      };
      xhr.onerror = () => reject(new Error('XHR network error'));
      xhr.send();
    });
  }

  async _getResourcesPath() {
    if (window.electronAPI) {
      return await window.electronAPI.getResourcesPath();
    }
    return './resources';
  }

  async _loadMediaPipeScripts() {
    const src = this._toFileUrl(this._resourcesPath + '/mediapipe/vision_bundle.js');

    console.log('HandTracking: loading script from:', src);

    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => {
        console.log('HandTracking: script loaded, Vision available:', !!window.Vision);
        resolve();
      };
      script.onerror = (e) => {
        console.error('Script load error event:', e);
        reject(new Error('Failed to load: ' + src));
      };
      document.head.appendChild(script);
    });
  }

  processFrame(video) {
    if (!this.ready || !this.handLandmarker || !video || video.readyState < 2) {
      return;
    }

    if (!this._loggedProcessing) {
      console.log('HandTracking: processing frames, video:', video.videoWidth, 'x', video.videoHeight, 'readyState:', video.readyState);
      this._loggedProcessing = true;
    }

    const startTime = performance.now();

    try {
      const results = this.handLandmarker.detectForVideo(video, performance.now());

      this.prevHands = this.hands.map(h => ({ landmarks: h.landmarks.map(l => ({ ...l })) }));
      const prevSmoothedHands = this.smoothedHands.slice();

      this.hands = [];
      this.smoothedHands = [];

      if (results.landmarks && results.landmarks.length > 0) {
        for (let i = 0; i < Math.min(results.landmarks.length, this.maxSmoothedHands); i++) {
          const rawLandmarks = results.landmarks[i];
          const handedness = results.handednesses?.[i]?.[0]?.categoryName || 'Right';
          const confidence = results.handednesses?.[i]?.[0]?.score || 0;

          // Smooth in ABSOLUTE image coords (0..1) — preserves screen position for cursor/games/renderer
          const smoothedAbsolute = this._smoothLandmarks(rawLandmarks, i, prevSmoothedHands);
          // Normalized copy only for gesture classification (translation/scale invariant)
          const normalized = this._normalizeLandmarks(smoothedAbsolute);
          const velocity = this._calculateVelocity(smoothedAbsolute, i);

          const handData = {
            landmarks: smoothedAbsolute,
            rawLandmarks: rawLandmarks,
            normalizedLandmarks: normalized,
            handedness,
            confidence,
            velocity,
            indexTip: smoothedAbsolute[HP.LANDMARKS.INDEX_TIP],
            thumbTip: smoothedAbsolute[HP.LANDMARKS.THUMB_TIP],
            palmCenter: this._getPalmCenter(smoothedAbsolute),
            pointingDirection: this._getPointingDirection(smoothedAbsolute),
          };

          this.hands.push(handData);
          this.smoothedHands.push(handData);
        }
      }

      this.lastInferenceTime = performance.now() - startTime;
      this._updateFPS();

      if (this._onResultsCallback) {
        this._onResultsCallback(this.hands);
      }
    } catch (e) {
      console.warn('HandTracking processFrame error:', e);
    }
  }

  _normalizeLandmarks(landmarks) {
    const wrist = landmarks[HP.LANDMARKS.WRIST];
    const middleMcp = landmarks[HP.LANDMARKS.MIDDLE_MCP];

    const palmSize = Math.hypot(
      middleMcp.x - wrist.x,
      middleMcp.y - wrist.y
    ) || 0.1;

    return landmarks.map(lm => ({
      x: (lm.x - wrist.x) / palmSize,
      y: (lm.y - wrist.y) / palmSize,
      z: lm.z / palmSize,
    }));
  }

  _smoothLandmarks(landmarks, handIndex, prevSmoothedHands) {
    const prevHands = prevSmoothedHands || this.smoothedHands;
    if (!prevHands[handIndex]) {
      return landmarks.map(l => ({ ...l }));
    }

    const prev = prevHands[handIndex].landmarks;
    const factor = this.smoothingFactor;

    return landmarks.map((lm, i) => {
      if (!prev[i]) return { ...lm };
      return {
        x: prev[i].x + (lm.x - prev[i].x) * factor,
        y: prev[i].y + (lm.y - prev[i].y) * factor,
        z: prev[i].z + (lm.z - prev[i].z) * factor,
      };
    });
  }

  _calculateVelocity(landmarks, handIndex) {
    if (!this.prevHands[handIndex]) {
      return { x: 0, y: 0, speed: 0 };
    }

    const prevIndex = this.prevHands[handIndex].landmarks[HP.LANDMARKS.INDEX_TIP];
    const currIndex = landmarks[HP.LANDMARKS.INDEX_TIP];

    const vx = currIndex.x - prevIndex.x;
    const vy = currIndex.y - prevIndex.y;
    const speed = Math.hypot(vx, vy);

    return { x: vx, y: vy, speed };
  }

  _getPalmCenter(landmarks) {
    const wrist = landmarks[HP.LANDMARKS.WRIST];
    const middleMcp = landmarks[HP.LANDMARKS.MIDDLE_MCP];

    return {
      x: (wrist.x + middleMcp.x) / 2,
      y: (wrist.y + middleMcp.y) / 2,
    };
  }

  _getPointingDirection(landmarks) {
    const indexMcp = landmarks[HP.LANDMARKS.INDEX_MCP];
    const indexTip = landmarks[HP.LANDMARKS.INDEX_TIP];

    const dx = indexTip.x - indexMcp.x;
    const dy = indexTip.y - indexMcp.y;
    const angle = Math.atan2(dy, dx);

    return { dx, dy, angle };
  }

  _updateFPS() {
    this.frameCount++;
    if (this.fpsHistory.length >= 30) {
      this.fpsHistory.shift();
    }
    this.fpsHistory.push(performance.now());
  }

  getFPS() {
    if (this.fpsHistory.length < 2) return 0;
    const elapsed = this.fpsHistory[this.fpsHistory.length - 1] - this.fpsHistory[0];
    return Math.round((this.fpsHistory.length - 1) / (elapsed / 1000));
  }

  getHands() {
    return this.hands;
  }

  getHandCount() {
    return this.hands.length;
  }

  getConfidence() {
    if (this.hands.length === 0) return 0;
    return Math.round(this.hands.reduce((sum, h) => sum + h.confidence, 0) / this.hands.length * 100);
  }

  getInferenceTime() {
    return Math.round(this.lastInferenceTime * 100) / 100;
  }

  setSmoothing(value) {
    this.smoothingFactor = Math.max(0.1, Math.min(0.9, value));
  }

  setPerformanceLevel(level) {
    this.performanceLevel = level;
    if (this.handLandmarker) {
      try {
        if (level === HP.PERFORMANCE_LEVELS.LOW) {
          this.maxSmoothedHands = 1;
        } else {
          this.maxSmoothedHands = 2;
        }
      } catch (e) {}
    }
  }

  onResults(callback) {
    this._onResultsCallback = callback;
  }

  destroy() {
    this.ready = false;
    this.active = false;
    this.hands = [];
    if (this.handLandmarker) {
      this.handLandmarker.close();
      this.handLandmarker = null;
    }
  }
}

window.handTracking = new HandTracking();
