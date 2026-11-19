/* ========================================
   HANDPLAY — First-Launch Tutorial
   Interactive gesture tutorial for new users
   Developed by Erick de S.C. Araujo + IA
   ======================================== */

class TutorialManager {
  constructor() {
    this.shown = false;
    this.currentStep = 0;
    this.steps = [
      {
        title: 'Chào mừng bạn đến với HandPlay!',
        subtitle: 'Trò chơi Điều khiển bằng Cử chỉ Tay',
        desc: 'Sử dụng đôi bàn tay của bạn để chơi game qua webcam. Không cần bàn phím hay chuột.',
        gesture: null,
        icon: '👋',
      },
      {
        title: 'Chỉ Ngón Tay (Point)',
        subtitle: 'Điều khiển con trỏ',
        desc: 'Giơ ngón tay trỏ thẳng để di chuyển con trỏ mượt mà trên màn hình.',
        gesture: 'point',
        icon: '☝️',
      },
      {
        title: 'Chụm Ngón Tay (Pinch)',
        subtitle: 'Chọn & Bấm chuột',
        desc: 'Chạm đầu ngón cái và ngón trỏ vào nhau để bấm chọn, gắp đồ vật hoặc bắn.',
        gesture: 'pinch',
        icon: '🤏',
      },
      {
        title: 'Xòe Bàn Tay (Open Hand)',
        subtitle: 'Tương tác & Làm nổ',
        desc: 'Xòe rộng cả bàn tay để tương tác hoặc làm nổ các vật phẩm như bóng bay.',
        gesture: 'open',
        icon: '🖐️',
      },
      {
        title: 'Vuốt Tay (Swipe)',
        subtitle: 'Điều hướng & Nhảy',
        desc: 'Vuốt nhanh bàn tay sang trái, phải, lên hoặc xuống để nhảy và né tránh.',
        gesture: 'swipe',
        icon: '👋',
      },
      {
        title: 'Bạn Đã Sẵn Sàng!',
        subtitle: 'Bắt đầu trải nghiệm',
        desc: 'Bạn có thể vào mục Luyện Tập để thử lại cử chỉ bất kỳ lúc nào. Chúc bạn chơi vui vẻ!',
        gesture: null,
        icon: '🎮',
      },
    ];
    this.overlay = null;
    this.stepContent = null;
    this.indicators = [];
    this.onComplete = null;
    this.demoDetectionTimer = null;
    this.demoDetected = false;
  }

  init() {
    this.shown = localStorage.getItem('handplay_tutorial_done') === 'true';
  }

  async showIfFirstLaunch(callback) {
    this.init();
    this.onComplete = callback;

    if (!this.shown) {
      this.show();
      return true;
    }
    return false;
  }

  show() {
    this.currentStep = 0;
    this._createOverlay();
    this._updateStep();
    this.overlay.classList.add('visible');
  }

  _createOverlay() {
    if (this.overlay) {
      this.overlay.remove();
    }

    this.overlay = document.createElement('div');
    this.overlay.id = 'tutorial-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(5, 5, 15, 0.92);
      backdrop-filter: blur(12px);
      opacity: 0;
      transition: opacity 0.4s ease;
      font-family: 'Segoe UI', system-ui, sans-serif;
    `;

    const card = document.createElement('div');
    card.style.cssText = `
      background: #141432;
      border: 1px solid rgba(99, 102, 241, 0.2);
      border-radius: 20px;
      padding: 48px;
      max-width: 480px;
      width: 90%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 80px rgba(99, 102, 241, 0.1);
      position: relative;
    `;

    // Skip button
    const skipBtn = document.createElement('button');
    skipBtn.textContent = 'Bỏ qua';
    skipBtn.style.cssText = `
      position: absolute;
      top: 16px;
      right: 20px;
      background: transparent;
      border: none;
      color: rgba(165, 180, 252, 0.5);
      font-size: 13px;
      cursor: pointer;
      font-family: inherit;
      padding: 4px 8px;
      transition: color 0.2s;
    `;
    skipBtn.addEventListener('mouseenter', () => skipBtn.style.color = '#a5b4fc');
    skipBtn.addEventListener('mouseleave', () => skipBtn.style.color = 'rgba(165, 180, 252, 0.5)');
    skipBtn.addEventListener('click', () => this._finish());

    // Step icon
    const iconEl = document.createElement('div');
    iconEl.id = 'tutorial-icon';
    iconEl.style.cssText = `
      font-size: 72px;
      margin-bottom: 16px;
      min-height: 90px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s ease;
    `;

    // Demo detection indicator
    const demoArea = document.createElement('div');
    demoArea.id = 'tutorial-demo';
    demoArea.style.cssText = `
      width: 80px;
      height: 80px;
      margin: 16px auto;
      border-radius: 50%;
      border: 3px solid rgba(99, 102, 241, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    `;
    demoArea.innerHTML = '<span id="tutorial-demo-text" style="font-size: 12px; color: rgba(165, 180, 252, 0.4); max-width: 60px; text-align: center; line-height: 1.3;">Thử ngay</span>';

    // Title
    const titleEl = document.createElement('h2');
    titleEl.id = 'tutorial-title';
    titleEl.style.cssText = `
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 4px;
      letter-spacing: 1px;
    `;

    // Subtitle
    const subtitleEl = document.createElement('p');
    subtitleEl.id = 'tutorial-subtitle';
    subtitleEl.style.cssText = `
      font-size: 14px;
      color: #a5b4fc;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 16px;
    `;

    // Description
    const descEl = document.createElement('p');
    descEl.id = 'tutorial-desc';
    descEl.style.cssText = `
      font-size: 14px;
      color: rgba(165, 180, 252, 0.6);
      line-height: 1.6;
      margin-bottom: 24px;
    `;

    // Step indicators
    const indicators = document.createElement('div');
    indicators.id = 'tutorial-indicators';
    indicators.style.cssText = `
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-bottom: 28px;
    `;
    this.indicators = [];

    for (let i = 0; i < this.steps.length; i++) {
      const dot = document.createElement('div');
      dot.style.cssText = `
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: ${i === 0 ? '#6366f1' : 'rgba(99, 102, 241, 0.2)'};
        transition: all 0.3s ease;
      `;
      indicators.appendChild(dot);
      this.indicators.push(dot);
    }

    // Buttons
    const btns = document.createElement('div');
    btns.style.cssText = 'display: flex; gap: 12px; justify-content: center;';

    const prevBtn = document.createElement('button');
    prevBtn.id = 'tutorial-prev';
    prevBtn.textContent = '← Quay lại';
    prevBtn.style.cssText = `
      background: transparent;
      border: 1px solid rgba(99, 102, 241, 0.2);
      color: #a5b4fc;
      padding: 10px 24px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s;
    `;
    prevBtn.addEventListener('click', () => this._prevStep());

    const nextBtn = document.createElement('button');
    nextBtn.id = 'tutorial-next';
    nextBtn.textContent = 'Tiếp theo →';
    nextBtn.style.cssText = `
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      border: none;
      color: white;
      padding: 10px 28px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s;
    `;
    nextBtn.addEventListener('click', () => this._nextStep());

    btns.appendChild(prevBtn);
    btns.appendChild(nextBtn);

    card.appendChild(skipBtn);
    card.appendChild(iconEl);
    card.appendChild(demoArea);
    card.appendChild(titleEl);
    card.appendChild(subtitleEl);
    card.appendChild(descEl);
    card.appendChild(indicators);
    card.appendChild(btns);
    this.stepContent = card;

    this.overlay.appendChild(card);
    document.body.appendChild(this.overlay);

    // Show overlay
    requestAnimationFrame(() => {
      this.overlay.style.opacity = '1';
    });
  }

  _updateStep() {
    const step = this.steps[this.currentStep];
    if (!step) return;

    const iconEl = document.getElementById('tutorial-icon');
    const titleEl = document.getElementById('tutorial-title');
    const subtitleEl = document.getElementById('tutorial-subtitle');
    const descEl = document.getElementById('tutorial-desc');
    const prevBtn = document.getElementById('tutorial-prev');
    const nextBtn = document.getElementById('tutorial-next');
    const demoArea = document.getElementById('tutorial-demo');

    if (iconEl) iconEl.textContent = step.icon;
    if (titleEl) titleEl.textContent = step.title;
    if (subtitleEl) subtitleEl.textContent = step.subtitle;
    if (descEl) descEl.textContent = step.desc;

    // Update indicators
    this.indicators.forEach((dot, i) => {
      dot.style.background = i === this.currentStep ? '#6366f1' : 'rgba(99, 102, 241, 0.2)';
      dot.style.transform = i === this.currentStep ? 'scale(1.3)' : 'scale(1)';
    });

    // Navigation buttons
    if (prevBtn) {
      prevBtn.style.visibility = this.currentStep === 0 ? 'hidden' : 'visible';
    }
    if (nextBtn) {
      nextBtn.textContent = this.currentStep === this.steps.length - 1 ? 'Bắt Đầu Chơi! →' : 'Tiếp theo →';
    }

    // Demo area
    if (demoArea) {
      const hasGesture = !!step.gesture;
      demoArea.style.borderColor = hasGesture ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.15)';
      demoArea.style.display = hasGesture ? 'flex' : 'none';
    }

    // Start listening for gesture demo on steps that have it
    this._startDemoDetection(step.gesture);
  }

  _startDemoDetection(gestureType) {
    if (this.demoDetectionTimer) {
      clearInterval(this.demoDetectionTimer);
      this.demoDetectionTimer = null;
    }
    this.demoDetected = false;

    if (!gestureType) return;

    const demoText = document.getElementById('tutorial-demo-text');
    const demoArea = document.getElementById('tutorial-demo');

    this.demoDetectionTimer = setInterval(() => {
      const currentGesture = window.gestureRecognition?.getCurrentGesture();

      if (!currentGesture || currentGesture === HP.GESTURES.NONE) {
        if (demoText) demoText.textContent = 'Làm cử chỉ...';
        return;
      }

      const gestureMatch = this._gestureMatches(currentGesture, gestureType);

      if (gestureMatch && !this.demoDetected) {
        this.demoDetected = true;
        if (demoArea) {
          demoArea.style.borderColor = '#22c55e';
          demoArea.style.boxShadow = '0 0 20px rgba(34, 197, 94, 0.3)';
        }
        if (demoText) {
          demoText.textContent = '✓ Đã nhận!';
          demoText.style.color = '#22c55e';
        }
        window.audioManager?.playSuccess();
      } else if (!gestureMatch) {
        this.demoDetected = false;
        if (demoArea) {
          demoArea.style.borderColor = 'rgba(99, 102, 241, 0.4)';
          demoArea.style.boxShadow = 'none';
        }
        if (demoText) {
          demoText.textContent = 'Làm cử chỉ...';
          demoText.style.color = 'rgba(165, 180, 252, 0.4)';
        }
      }
    }, 100);
  }

  _gestureMatches(current, target) {
    switch (target) {
      case 'point':
        return current === HP.GESTURES.POINT || current === HP.GESTURES.HAND_DETECTED;
      case 'pinch':
        return current === HP.GESTURES.PINCH || current === HP.GESTURES.PINCH_START;
      case 'open':
        return current === HP.GESTURES.OPEN_HAND;
      case 'swipe':
        return [HP.GESTURES.SWIPE_LEFT, HP.GESTURES.SWIPE_RIGHT,
                HP.GESTURES.SWIPE_UP, HP.GESTURES.SWIPE_DOWN].includes(current);
      default:
        return false;
    }
  }

  _nextStep() {
    window.audioManager?.playSelect();
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this._updateStep();
    } else {
      this._finish();
    }
  }

  _prevStep() {
    window.audioManager?.playClick();
    if (this.currentStep > 0) {
      this.currentStep--;
      this._updateStep();
    }
  }

  _finish() {
    if (this.demoDetectionTimer) {
      clearInterval(this.demoDetectionTimer);
    }
    this.shown = true;
    localStorage.setItem('handplay_tutorial_done', 'true');

    this.overlay.style.opacity = '0';
    setTimeout(() => {
      if (this.overlay) {
        this.overlay.remove();
        this.overlay = null;
      }
    }, 400);

    if (this.onComplete) this.onComplete();
  }

  reset() {
    localStorage.removeItem('handplay_tutorial_done');
    this.shown = false;
  }
}

window.tutorialManager = new TutorialManager();
