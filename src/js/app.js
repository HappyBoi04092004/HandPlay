/* ========================================
   HANDPLAY — Application Controller
   Developed by Erick de S.C. Araujo + IA
   ======================================== */

class HandPlayApp {
  constructor() {
    this.currentScreen = 'menu';
    this.cameraReady = false;
    this.trackingReady = false;
    this.animationFrameId = null;
    this.currentGameId = null;
    this.trainingGesture = 'point';
    this.trainingTarget = 'point';
    this.trainingDetected = false;
    this.trackingLabMode = false;
    this.lastPerformanceCheck = 0;
    this.performanceLevel = HP.PERFORMANCE_LEVELS.HIGH;
  }

  async init() {
    await window.settingsManager.init();
    await window.scoreManager.init();

    window.renderer.init();
    await window.cameraManager.init();
    window.themeManager.init();
    window.virtualCursor.init();
    window.gestureRecognition.init();
    window.transitionManager.init();
    window.tutorialManager.init();
    window.leaderboardManager.init();
    window.analyticsManager.init();
    window.gestureRemapping.init();
    window.achievementManager.init();

    this._bindMenuButtons();
    this._bindSettingsTabs();
    this._bindTrainingPoseButtons();
    this._bindGameButtons();
    this._bindBackButtons();
    this._bindLabToggles();
    this._bindCameraButton();

    window.renderer.setMirrored(window.settingsManager.get('camera.mirrored') !== false);

    await this._initTracking();

    this._startMainLoop();

    // Show camera overlay — user must click Enable Camera
    this._initCamera();

    // Start menu music after user interaction
    document.addEventListener('click', () => {
      window.audioManager?.playMusic('menu');
    }, { once: true });

    // Show first-launch tutorial
    window.tutorialManager.showIfFirstLaunch();

    console.log('HandPlay initialized.');
  }

  _initCamera() {
    // Show the camera permission overlay — user must click to proceed
    const overlay = document.getElementById('camera-overlay');
    if (overlay) {
      overlay.classList.remove('hidden');
    }
  }

  async _requestCameraNow() {
    const overlay = document.getElementById('camera-overlay');
    const errorEl = document.getElementById('camera-error-msg');
    if (errorEl) errorEl.classList.add('hidden');

    const btn = document.getElementById('btn-request-camera');
    if (btn) {
      btn.textContent = 'Đang bật camera...';
      btn.disabled = true;
    }

    // 1. Request camera permission and start camera
    const result = await window.cameraManager.requestPermission();
    if (!result.granted) {
      if (btn) { btn.textContent = 'Bật Camera'; btn.disabled = false; }
      this._showCameraError(result.error || 'Quyền truy cập camera bị từ chối');
      return;
    }

    const startResult = await window.cameraManager.start(
      window.settingsManager.get('camera.deviceId')
    );
    if (!startResult.success) {
      if (btn) { btn.textContent = 'Bật Camera'; btn.disabled = false; }
      this._showCameraError(startResult.error || 'Không thể khởi động camera');
      return;
    }

    this.cameraReady = true;
    console.log('Camera started:', startResult.width, 'x', startResult.height);

    // Verify video is actually playing
    const vid = window.cameraManager.getVideoElement();
    console.log('Video element:', vid?.videoWidth, 'x', vid?.videoHeight, 'readyState:', vid?.readyState, 'paused:', vid?.paused);

    // 2. Now load the hand tracking model
    if (!this.trackingReady) {
      console.log('Loading hand tracking model...');
      this.trackingReady = await window.handTracking.init();
      console.log('Hand tracking ready:', this.trackingReady);
    }

    // 3. All good — hide overlay and start
    if (overlay) overlay.classList.add('hidden');
  }

  _showCameraError(error) {
    // Show error inside the camera overlay
    const errorEl = document.getElementById('camera-error-msg');
    if (errorEl) {
      errorEl.classList.remove('hidden');
      if (error?.includes('NotAllowedError') || error?.includes('Permission') || error?.includes('denied')) {
        errorEl.textContent = 'Quyền truy cập camera bị từ chối. Vui lòng cấp quyền camera rồi thử lại, hoặc dùng chế độ bàn phím/chuột.';
      } else if (error?.includes('NotFoundError') || error?.includes('Devices')) {
        errorEl.textContent = 'Không tìm thấy camera. Vui lòng kết nối webcam, hoặc dùng chế độ bàn phím/chuột.';
      } else {
        errorEl.textContent = `Lỗi camera: ${error || 'Lỗi không xác định'}. Thử lại hoặc dùng chế độ bàn phím/chuột.`;
      }
    }

    // Show fallback option below the camera overlay
    const fallbackHelp = document.getElementById('fallback-help');
    if (fallbackHelp) {
      fallbackHelp.classList.remove('hidden');

      document.getElementById('btn-fallback-continue')?.addEventListener('click', () => {
        fallbackHelp.classList.add('hidden');
        document.getElementById('camera-overlay')?.classList.add('hidden');
        window.fallbackControls.activate();
        window.virtualCursor.activate();
      });

      document.getElementById('btn-fallback-retry')?.addEventListener('click', () => {
        fallbackHelp.classList.add('hidden');
        this._requestCameraNow();
      });
    }
  }

  async _initTracking() {
    try {
      this.trackingReady = await window.handTracking.init();
      if (!this.trackingReady) {
        console.warn('Hand tracking could not be initialized');
      }
    } catch (e) {
      console.error('Tracking init failed:', e);
      this.trackingReady = false;
    }
  }

  _initFallback() {
    const cameraWorks = this.cameraReady && this.trackingReady;

    if (!cameraWorks) {
      // Camera or tracking not available - activate fallback
      window.fallbackControls.activate();

      window.fallbackControls.onGesture((event) => {
        window.gestureRecognition._emitGesture(event.type, {
          x: event.x,
          y: event.y,
          palm: event.palm,
        });
      });

      console.log('Fallback controls activated (keyboard/mouse).');
    }
  }

  _startMainLoop() {
    let loopCount = 0;
    const loop = () => {
      const now = performance.now();

      const cameraActive = this.cameraReady && window.cameraManager.isActive();
      const usingFallback = window.fallbackControls.isActive();

      // Log first few frames to diagnose
      if (loopCount < 5) {
        console.log(`MainLoop #${loopCount}: cameraReady=${this.cameraReady}, cameraActive=${cameraActive}, trackingReady=${this.trackingReady}, usingFallback=${usingFallback}, screen=${this.currentScreen}`);
      }
      loopCount++;

      if (cameraActive) {
        window.renderer.renderCamera(window.cameraManager.getVideoElement());
      }

      if (cameraActive && this.trackingReady) {
        window.handTracking.processFrame(window.cameraManager.getVideoElement());
        const hands = window.handTracking.getHands();
        window.gestureRecognition.processHands(hands);
      } else if (usingFallback) {
        const fallbackHands = window.fallbackControls.getSimulatedHands();
        window.gestureRecognition.processHands(fallbackHands);
      }

      const gesture = window.gestureRecognition.getCurrentGesture();
      const hands = cameraActive && this.trackingReady
        ? window.handTracking.getHands()
        : (usingFallback ? window.fallbackControls.getSimulatedHands() : []);
      const mainHand = hands[0];

      if (mainHand) {
        window.virtualCursor.update(mainHand.landmarks, gesture);
      }

      if (this.currentScreen === 'tracking-lab') {
        this._updateTrackingLabStats();
      }

      if (this.currentScreen === 'training') {
        this._renderTrainingCamera();
        this._updateTraining(gesture);
      }

      if (this.currentScreen === 'menu') {
        window.virtualCursor.renderTrail();
      }

      if (this.currentScreen === 'game' && this.gameEngine?.getCurrentGame()) {
        // Game loop is handled by the game itself
      }

      this._adaptivePerformance(now);

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  _adaptivePerformance(now) {
    if (now - this.lastPerformanceCheck < 3000) return;
    this.lastPerformanceCheck = now;

    const fps = window.handTracking.getFPS();
    const prevLevel = this.performanceLevel;

    if (fps < 20) {
      this.performanceLevel = HP.PERFORMANCE_LEVELS.LOW;
    } else if (fps < 40) {
      this.performanceLevel = HP.PERFORMANCE_LEVELS.MEDIUM;
    } else {
      this.performanceLevel = HP.PERFORMANCE_LEVELS.HIGH;
    }

    if (this.performanceLevel !== prevLevel) {
      window.handTracking.setPerformanceLevel(this.performanceLevel);
      console.log(`Performance level: ${this.performanceLevel} (FPS: ${fps})`);
    }
  }

  _navigateTo(screenId, options = {}) {
    const doNavigate = () => {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      const target = document.getElementById(`screen-${screenId}`);
      if (target) {
        target.classList.add('active');
      }

      // Music switching
      if (screenId === 'menu' || screenId === 'games') {
        window.audioManager?.playMusic('menu');
      } else if (screenId === 'game') {
        window.audioManager?.playMusic('game');
      }

      this._configureCanvasLayers(screenId);

      this.currentScreen = screenId;

      if (screenId === 'games') this._populateGameGrid();
      if (screenId === 'records') this._populateRecords();
      if (screenId === 'analytics') this._populateAnalytics();
      if (screenId === 'achievements') this._populateAchievements();
      if (screenId === 'settings') this._populateSettings('themes');

      window.virtualCursor.deactivate();
      if (screenId === 'menu' || screenId === 'games' || screenId === 'settings') {
        if (this.cameraReady || window.fallbackControls.isActive()) {
          window.virtualCursor.activate();
        }
      }
    };

    // Use transition
    if (window.transitionManager && !this._firstNavDone) {
      this._firstNavDone = true;
      doNavigate();
    } else if (window.transitionManager && !window.transitionManager.active) {
      const transitionType = screenId === 'game' ? 'sweep' : 'fade';
      window.transitionManager.setPendingNavigate(doNavigate);
      window.transitionManager.screenTransition(screenId, {
        type: transitionType,
        duration: 400,
        showLogo: screenId === 'menu',
      });
    } else {
      doNavigate();
    }
  }

  _configureCanvasLayers(screenId) {
    const canvas = document.getElementById('game-canvas');
    const handCanvas = document.getElementById('hand-canvas');
    const cameraCanvas = document.getElementById('camera-canvas');

    if (screenId === 'game') {
      if (canvas) canvas.style.zIndex = '3';
      if (handCanvas) handCanvas.style.zIndex = '2';
      if (cameraCanvas) cameraCanvas.style.zIndex = '1';
    } else if (screenId === 'tracking-lab') {
      if (canvas) canvas.style.zIndex = '0';
      if (handCanvas) handCanvas.style.zIndex = '2';
      if (cameraCanvas) cameraCanvas.style.zIndex = '1';
    } else {
      if (canvas) canvas.style.zIndex = '0';
      if (handCanvas) handCanvas.style.zIndex = '2';
      if (cameraCanvas) cameraCanvas.style.zIndex = '1';
    }

    this.currentScreen = screenId;

    if (screenId === 'games') {
      this._populateGameGrid();
    }

    if (screenId === 'records') {
      this._populateRecords();
    }

    if (screenId === 'settings') {
      this._populateSettings('themes');
    }

    window.virtualCursor.deactivate();
    if (screenId === 'menu' || screenId === 'games' || screenId === 'settings') {
      if (this.cameraReady || window.fallbackControls.isActive()) {
        window.virtualCursor.activate();
      }
    }
  }

  _populateGameGrid() {
    const grid = document.getElementById('games-grid');
    if (!grid) return;

    grid.innerHTML = '';
    const games = window.gameEngine.getGames();

    for (const game of games) {
      const card = document.createElement('div');
      card.className = 'game-card';
      card.dataset.gestureHover = 'true';
      card.dataset.gameId = game.id;

      const best = window.scoreManager.getBestScore(game.id);

      card.innerHTML = `
        <div class="game-card-icon">${game.icon}</div>
        <div class="game-card-name">${game.name}</div>
        <div class="game-card-desc">${game.desc}</div>
        ${best > 0 ? `<div class="game-card-best">Kỷ lục: ${best.toLocaleString()}</div>` : ''}
      `;

      card.addEventListener('click', () => {
        this._launchGame(game.id);
      });

      grid.appendChild(card);
    }
  }

  async _launchGame(gameId) {
    const gameConfig = window.gameEngine.getGameConfig(gameId);

    window.difficultySelector.show(gameConfig, {
      onSelect: (difficulty, preset) => {
        this.currentGameId = gameId;
        this.currentDifficulty = preset;
        this._navigateTo('game');
        document.getElementById('game-overlay')?.classList.add('hidden');

        window.gameEngine.launchGame(gameId).then(success => {
          if (!success) console.error('Failed to launch game:', gameId);
        });
      },
      onCancel: () => {
        // Stay on game selection
      },
    });
  }

  restartGame() {
    if (this.currentGameId) {
      document.getElementById('game-overlay')?.classList.add('hidden');
      window.gameEngine.stopCurrentGame();
      window.gameEngine.launchGame(this.currentGameId);
    }
  }

  backToGames() {
    window.gameEngine.stopCurrentGame();
    document.getElementById('game-overlay')?.classList.add('hidden');
    this._navigateTo('games');
    window.virtualCursor.activate();
  }

  _populateRecords() {
    const container = document.getElementById('records-container');
    if (!container) return;

    window.leaderboardManager.render(container);
  }

  _populateAnalytics() {
    const container = document.getElementById('analytics-container');
    if (!container) return;

    window.analyticsManager.render(container);
  }

  _populateAchievements() {
    const container = document.getElementById('achievements-container');
    if (!container) return;

    window.achievementManager.renderScreen(container);
  }

  _populateSettings(tab) {
    const panel = document.getElementById('settings-panel');
    if (!panel) return;

    const settings = window.settingsManager.getAll();

    switch (tab) {
      case 'themes':
        panel.innerHTML = this._settingsThemesHTML();
        this._bindThemesSettings(panel);
        break;
      case 'camera':
        panel.innerHTML = this._settingsCameraHTML(settings);
        this._bindCameraSettings(panel);
        // Render camera preview
        window.cameraPreview.render(panel);
        break;
      case 'graphics':
        panel.innerHTML = this._settingsGraphicsHTML(settings);
        this._bindGraphicsSettings(panel);
        break;
      case 'audio':
        panel.innerHTML = this._settingsAudioHTML(settings);
        this._bindAudioSettings(panel);
        break;
      case 'gestures':
        window.gestureRemapping.renderSettings(panel);
        break;
      case 'performance':
        panel.innerHTML = this._settingsPerformanceHTML(settings);
        break;
      case 'backup':
        window.backupManager.renderSettings(panel);
        break;
      case 'about':
        panel.innerHTML = this._settingsAboutHTML();
        break;
    }
  }

  _settingsThemesHTML() {
    const themes = window.themeManager.getThemeList();
    let html = '<div class="settings-group"><div class="settings-group-title">Màu Giao Diện</div>';

    for (const theme of themes) {
      html += `
        <div class="settings-row theme-row" data-theme-id="${theme.id}" style="cursor: pointer; ${theme.active ? 'border-color: var(--accent-primary); background: rgba(99, 102, 241, 0.1);' : ''}">
          <span style="font-size: 20px;">${theme.icon}</span>
          <span style="flex: 1; margin-left: 12px; color: var(--text-primary); font-size: 14px;">${theme.name}</span>
          ${theme.active ? '<span style="color: var(--accent-primary); font-size: 14px;">✓ Đang dùng</span>' : ''}
        </div>
      `;
    }

    html += '</div>';
    return html;
  }

  _bindThemesSettings(panel) {
    panel.querySelectorAll('.theme-row').forEach(row => {
      row.addEventListener('click', () => {
        const themeId = row.dataset.themeId;
        window.themeManager.apply(themeId);
        this._populateSettings('themes');
        window.audioManager?.playSelect();
      });
    });
  }

  _settingsCameraHTML(s) {
    return `
      <div class="settings-group">
        <div class="settings-group-title">Thiết Bị Camera</div>
        <div class="settings-row">
          <span class="settings-row-label">Thiết bị</span>
          <select id="setting-camera-device"><option value="default">Camera Mặc định</option></select>
        </div>
        <div class="settings-row">
          <span class="settings-row-label">Độ phân giải</span>
          <select id="setting-camera-res">
            <option value="640x480">640 × 480</option>
            <option value="1280x720" ${s.camera.width === 1280 ? 'selected' : ''}>1280 × 720</option>
            <option value="1920x1080" ${s.camera.width === 1920 ? 'selected' : ''}>1920 × 1080</option>
          </select>
        </div>
        <div class="settings-row">
          <span class="settings-row-label">Tốc độ khung hình (FPS)</span>
          <select id="setting-camera-fps">
            <option value="15">15</option>
            <option value="24">24</option>
            <option value="30" ${s.camera.fps === 30 ? 'selected' : ''}>30</option>
            <option value="60" ${s.camera.fps === 60 ? 'selected' : ''}>60</option>
          </select>
        </div>
        <div class="settings-row">
          <span class="settings-row-label">Chế độ gương (Lật ảnh)</span>
          <label class="toggle-switch">
            <input type="checkbox" id="setting-camera-mirror" ${s.camera.mirrored !== false ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    `;
  }

  _settingsGraphicsHTML(s) {
    return `
      <div class="settings-group">
        <div class="settings-group-title">Đồ Họa</div>
        <div class="settings-row">
          <span class="settings-row-label">Chất lượng</span>
          <select id="setting-gfx-quality">
            <option value="low" ${s.graphics.quality === 'low' ? 'selected' : ''}>Thấp</option>
            <option value="medium" ${s.graphics.quality === 'medium' ? 'selected' : ''}>Trung bình</option>
            <option value="high" ${s.graphics.quality === 'high' ? 'selected' : ''}>Cao</option>
          </select>
        </div>
        <div class="settings-row">
          <span class="settings-row-label">Toàn màn hình</span>
          <button id="btn-settings-fullscreen" style="
            background: rgba(99, 102, 241, 0.1);
            border: 1px solid rgba(99, 102, 241, 0.3);
            color: var(--text-secondary);
            padding: 6px 16px;
            border-radius: var(--radius-sm);
            font-size: 12px;
            font-family: var(--font-main);
            cursor: pointer;
          ">Bật/Tắt Toàn Màn Hình</button>
        </div>
        <div class="settings-row">
          <span class="settings-row-label">Hiệu ứng hạt</span>
          <label class="toggle-switch">
            <input type="checkbox" id="setting-gfx-particles" ${s.graphics.particles !== false ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="settings-row">
          <span class="settings-row-label">Hiện điểm mốc ngón tay</span>
          <label class="toggle-switch">
            <input type="checkbox" id="setting-gfx-landmarks" ${s.graphics.showLandmarks ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    `;
  }

  _settingsAudioHTML(s) {
    return `
      <div class="settings-group">
        <div class="settings-group-title">Âm Thanh</div>
        <div class="settings-row">
          <span class="settings-row-label">Bật âm thanh</span>
          <label class="toggle-switch">
            <input type="checkbox" id="setting-audio-enabled" ${s.audio.enabled !== false ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="settings-row">
          <span class="settings-row-label">Âm lượng tổng</span>
          <input type="range" id="setting-audio-master" min="0" max="100" value="${Math.round((s.audio.masterVolume || 0.7) * 100)}">
        </div>
        <div class="settings-row">
          <span class="settings-row-label">Âm lượng hiệu ứng</span>
          <input type="range" id="setting-audio-sfx" min="0" max="100" value="${Math.round((s.audio.sfxVolume || 0.8) * 100)}">
        </div>
      </div>
    `;
  }

  _settingsGesturesHTML(s) {
    return `
      <div class="settings-group">
        <div class="settings-group-title">Cử Chỉ Tay</div>
        <div class="settings-row">
          <span class="settings-row-label">Độ nhạy</span>
          <input type="range" id="setting-gesture-sensitivity" min="10" max="100" value="${Math.round((s.gestures.sensitivity || 0.5) * 100)}">
        </div>
        <div class="settings-row">
          <span class="settings-row-label">Độ mượt</span>
          <input type="range" id="setting-gesture-smoothing" min="10" max="90" value="${Math.round((s.gestures.smoothing || 0.35) * 100)}">
        </div>
      </div>
    `;
  }

  _settingsPerformanceHTML(s) {
    return `
      <div class="settings-group">
        <div class="settings-group-title">Hiệu Năng</div>
        <div class="settings-row">
          <span class="settings-row-label">Mục tiêu FPS</span>
          <select>
            <option value="30">30</option>
            <option value="60" selected>60</option>
          </select>
        </div>
        <div class="settings-row">
          <span class="settings-row-label">Tự điều chỉnh chất lượng</span>
          <label class="toggle-switch">
            <input type="checkbox" checked>
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="settings-row">
          <span class="settings-row-label">Mức hiệu năng</span>
          <span class="stat-value" id="perf-level">${this.performanceLevel}</span>
        </div>
        <div class="settings-row">
          <span class="settings-row-label">FPS hiện tại</span>
          <span class="stat-value" id="perf-fps">0</span>
        </div>
      </div>
    `;
  }

  _settingsAboutHTML() {
    return `
      <div class="settings-group">
        <div class="settings-group-title">Thông Tin HandPlay</div>
        <div class="settings-row">
          <span class="settings-row-label">Phiên bản</span>
          <span class="stat-value">${HP.VERSION}</span>
        </div>
        <div class="settings-row">
          <span class="settings-row-label">Nhà phát triển</span>
          <span class="stat-value">Erick de S.C. Araujo + IA</span>
        </div>
        <div class="settings-row">
          <span class="settings-row-label">Công nghệ</span>
          <span class="stat-value">Electron + MediaPipe</span>
        </div>
        <div class="settings-row">
          <span class="settings-row-label">Dựng hình</span>
          <span class="stat-value">Canvas 2D</span>
        </div>
      </div>
      <div class="settings-group" style="margin-top: 20px;">
        <div class="settings-group-title">Quyền Riêng Tư</div>
        <div class="settings-row" style="flex-direction: column; align-items: flex-start; gap: 8px;">
          <span style="color: var(--text-secondary); font-size: 13px; line-height: 1.6;">
            🔒 Camera của bạn được xử lý hoàn toàn cục bộ bằng MediaPipe.<br>
            Không có hình ảnh, video hay dữ liệu bàn tay nào gửi tới bất kỳ máy chủ nào.<br>
            Mọi quá trình xử lý diễn ra trực tiếp trên thiết bị của bạn.<br>
            Không có dữ liệu theo dõi hoặc đo lường từ xa.
          </span>
        </div>
      </div>
    `;
  }

  _bindCameraSettings(panel) {
    panel.querySelector('#setting-camera-res')?.addEventListener('change', (e) => {
      const [w, h] = e.target.value.split('x').map(Number);
      window.settingsManager.set('camera.width', w);
      window.settingsManager.set('camera.height', h);
    });

    panel.querySelector('#setting-camera-fps')?.addEventListener('change', (e) => {
      window.settingsManager.set('camera.fps', parseInt(e.target.value));
    });

    panel.querySelector('#setting-camera-mirror')?.addEventListener('change', (e) => {
      window.settingsManager.set('camera.mirrored', e.target.checked);
      window.renderer.setMirrored(e.target.checked);
    });

    window.cameraManager.enumerateDevices().then(devices => {
      const select = panel.querySelector('#setting-camera-device');
      if (!select) return;
      select.innerHTML = '<option value="default">Camera Mặc định</option>';
      devices.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.deviceId;
        opt.textContent = d.label || `Camera ${devices.indexOf(d) + 1}`;
        select.appendChild(opt);
      });
    });
  }

  _bindGraphicsSettings(panel) {
    panel.querySelector('#setting-gfx-quality')?.addEventListener('change', (e) => {
      window.settingsManager.set('graphics.quality', e.target.value);
    });
    panel.querySelector('#btn-settings-fullscreen')?.addEventListener('click', () => {
      this._toggleFullscreen();
    });
    panel.querySelector('#setting-gfx-particles')?.addEventListener('change', (e) => {
      window.settingsManager.set('graphics.particles', e.target.checked);
    });
    panel.querySelector('#setting-gfx-landmarks')?.addEventListener('change', (e) => {
      window.settingsManager.set('graphics.showLandmarks', e.target.checked);
      window.renderer.setShowLandmarks(e.target.checked);
    });
  }

  _bindAudioSettings(panel) {
    panel.querySelector('#setting-audio-enabled')?.addEventListener('change', (e) => {
      window.settingsManager.set('audio.enabled', e.target.checked);
    });
    panel.querySelector('#setting-audio-master')?.addEventListener('input', (e) => {
      window.settingsManager.set('audio.masterVolume', parseInt(e.target.value) / 100);
      window.audioManager._applySettings();
    });
    panel.querySelector('#setting-audio-sfx')?.addEventListener('input', (e) => {
      window.settingsManager.set('audio.sfxVolume', parseInt(e.target.value) / 100);
      window.audioManager._applySettings();
    });
  }

  _bindGesturesSettings(panel) {
    panel.querySelector('#setting-gesture-sensitivity')?.addEventListener('input', (e) => {
      window.settingsManager.set('gestures.sensitivity', parseInt(e.target.value) / 100);
      window.gestureRecognition.setSensitivity(parseInt(e.target.value) / 100);
    });
    panel.querySelector('#setting-gesture-smoothing')?.addEventListener('input', (e) => {
      window.settingsManager.set('gestures.smoothing', parseInt(e.target.value) / 100);
      window.handTracking.setSmoothing(parseInt(e.target.value) / 100);
    });
  }

  _bindMenuButtons() {
    document.querySelectorAll('.menu-btn[data-screen]').forEach(btn => {
      btn.addEventListener('click', () => {
        window.audioManager?.playSelect();
        this._navigateTo(btn.dataset.screen);
      });
    });

    document.querySelectorAll('.menu-btn[data-action="exit"]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.electronAPI?.quitApp) {
          window.electronAPI.quitApp();
        } else {
          window.close();
        }
      });
    });
  }

  _bindBackButtons() {
    document.querySelectorAll('.back-btn[data-screen]').forEach(btn => {
      btn.addEventListener('click', () => {
        window.audioManager?.playClick();
        this._navigateTo(btn.dataset.screen);
      });
    });
  }

  _bindGameButtons() {
    document.getElementById('btn-pause')?.addEventListener('click', () => {
      const game = window.gameEngine.getCurrentGame();
      if (!game) return;

      if (game.state === HP.GAME_STATES.PLAYING) {
        window.gameEngine.pauseCurrentGame();
        window.pauseMenu.show(game, {
          onResume: () => {
            window.gameEngine.resumeCurrentGame();
          },
          onRestart: () => {
            this.restartGame();
          },
          onQuit: () => {
            this.backToGames();
          },
        });
      } else if (game.state === HP.GAME_STATES.PAUSED) {
        window.gameEngine.resumeCurrentGame();
        window.pauseMenu.hide();
      }
    });

    document.getElementById('btn-back-game')?.addEventListener('click', () => {
      this.backToGames();
    });

    document.getElementById('btn-fullscreen')?.addEventListener('click', () => {
      this._toggleFullscreen();
    });

    document.getElementById('btn-menu-fullscreen')?.addEventListener('click', () => {
      this._toggleFullscreen();
    });
  }

  _toggleFullscreen() {
    if (window.electronAPI?.toggleFullscreen) {
      window.electronAPI.toggleFullscreen();
    } else {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    }
    window.audioManager?.playClick();
  }

  _bindSettingsTabs() {
    document.querySelectorAll('.settings-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this._populateSettings(tab.dataset.tab);
        window.audioManager?.playClick();
      });
    });
  }

  _bindTrainingPoseButtons() {
    document.querySelectorAll('.pose-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.pose-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.trainingTarget = btn.dataset.gesture;
        this.trainingDetected = false;
        this._updateTrainingUI();
        window.audioManager?.playClick();
      });
    });
  }

  _bindCameraButton() {
    document.getElementById('btn-request-camera')?.addEventListener('click', () => {
      this._requestCameraNow();
    });
  }

  _bindLabToggles() {
    document.getElementById('show-landmarks')?.addEventListener('change', (e) => {
      window.renderer.setShowLandmarks(e.target.checked);
    });
    document.getElementById('show-connections')?.addEventListener('change', (e) => {
      window.renderer.setShowConnections(e.target.checked);
    });
    document.getElementById('show-bbox')?.addEventListener('change', (e) => {
      window.renderer.setShowBbox(e.target.checked);
    });
    document.getElementById('show-trajectory')?.addEventListener('change', (e) => {
      window.renderer.setShowTrajectory(e.target.checked);
    });
    document.getElementById('show-gesture-label')?.addEventListener('change', (e) => {
      window.renderer.setShowGestureLabel(e.target.checked);
    });
    document.getElementById('show-debug')?.addEventListener('change', (e) => {
      window.renderer.setShowDebug(e.target.checked);
    });
  }

  _updateTrackingLabStats() {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setVal('stat-fps', window.handTracking.getFPS());
    setVal('stat-latency', `${window.handTracking.getInferenceTime()}ms`);
    setVal('stat-hands', window.handTracking.getHandCount());
    setVal('stat-confidence', `${window.handTracking.getConfidence()}%`);
    setVal('stat-camera-res', `${window.cameraManager.width}x${window.cameraManager.height}`);

    const gestureEl = document.getElementById('detected-gesture-text');
    if (gestureEl && this.currentScreen === 'tracking-lab') {
      const gesture = window.gestureRecognition.getCurrentGesture();
      // Already handled by hand canvas rendering
    }
  }

  _renderTrainingCamera() {
    // Draw camera feed on hand-canvas for training screen
    const video = window.cameraManager?.getVideoElement();
    if (!video || !window.cameraManager?.isActive() || !video.videoWidth) return;

    const canvas = document.getElementById('hand-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    if (window.renderer?.mirrored) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    const videoAspect = video.videoWidth / video.videoHeight;
    const canvasAspect = w / h;
    let drawW, drawH, drawX, drawY;
    if (videoAspect > canvasAspect) {
      drawH = h; drawW = h * videoAspect; drawX = (w - drawW) / 2; drawY = 0;
    } else {
      drawW = w; drawH = w / videoAspect; drawX = 0; drawY = (h - drawH) / 2;
    }
    ctx.globalAlpha = 0.7;
    ctx.drawImage(video, drawX, drawY, drawW, drawH);
    ctx.globalAlpha = 1;
    ctx.restore();

    // Draw hand landmarks on top
    const hands = window.handTracking?.getHands();
    if (hands && hands.length > 0) {
      window.renderer.renderHands(hands, window.gestureRecognition?.getCurrentGesture());
    }
  }

  _updateTraining(gesture) {
    const checkEl = document.getElementById('gesture-check');
    const statusEl = document.getElementById('detected-gesture-text');
    const detectedBtns = document.querySelectorAll('.pose-btn');

    const gestureMap = {
      'point': [HP.GESTURES.POINT, HP.GESTURES.HAND_DETECTED],
      'pinch': [HP.GESTURES.PINCH, HP.GESTURES.PINCH_START],
      'fist': [HP.GESTURES.FIST],
      'open': [HP.GESTURES.OPEN_HAND],
      'swipe-left': [HP.GESTURES.SWIPE_LEFT],
      'swipe-right': [HP.GESTURES.SWIPE_RIGHT],
    };

    const targets = gestureMap[this.trainingTarget] || [];
    const detected = targets.includes(gesture);

    if (detected && !this.trainingDetected) {
      this.trainingDetected = true;
      if (checkEl) checkEl.classList.remove('hidden');
      if (statusEl) statusEl.textContent = 'ĐÃ NHẬN DIỆN CỬ CHỈ ✓';
      window.audioManager?.playSuccess();

      const activeBtn = document.querySelector(`.pose-btn[data-gesture="${this.trainingTarget}"]`);
      if (activeBtn) activeBtn.classList.add('detected');
    }

    if (!detected) {
      this.trainingDetected = false;
      if (checkEl) checkEl.classList.add('hidden');
      if (statusEl) statusEl.textContent = 'Hãy làm cử chỉ mẫu...';
      document.querySelectorAll('.pose-btn').forEach(b => b.classList.remove('detected'));
    }
  }

  _updateTrainingUI() {
    const gestureInfo = {
      'point': { icon: '☝️', name: 'CHỈ TAY' },
      'pinch': { icon: '🤏', name: 'CHỤM NGÓN' },
      'fist': { icon: '✊', name: 'NẮM TAY' },
      'open': { icon: '🖐️', name: 'XÒE TAY' },
      'swipe-left': { icon: '👈', name: 'VUỐT TRÁI' },
      'swipe-right': { icon: '👉', name: 'VUỐT PHẢI' },
    };

    const info = gestureInfo[this.trainingTarget] || gestureInfo['point'];
    const iconEl = document.getElementById('gesture-demo-icon');
    const nameEl = document.getElementById('gesture-demo-name');
    if (iconEl) iconEl.textContent = info.icon;
    if (nameEl) nameEl.textContent = info.name;

    this.trainingDetected = false;
    const checkEl = document.getElementById('gesture-check');
    const statusEl = document.getElementById('detected-gesture-text');
    if (checkEl) checkEl.classList.add('hidden');
    if (statusEl) statusEl.textContent = 'Hãy làm cử chỉ mẫu...';
  }

  get gameEngine() {
    return window.gameEngine;
  }
}

const app = new HandPlayApp();
window.app = app;

document.addEventListener('DOMContentLoaded', () => {
  app.init().catch(err => {
    console.error('HandPlay init error:', err);
  });
});
