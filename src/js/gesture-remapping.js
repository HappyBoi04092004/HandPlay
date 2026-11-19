/* ========================================
   HANDPLAY — Gesture Remapping
   Customizable gesture bindings
   Developed by Erick de S.C. Araujo + IA
   ======================================== */

const DEFAULT_GESTURE_MAP = {
  point: {
    label: 'Chỉ Tay',
    icon: '☝️',
    desc: 'Di chuyển con trỏ',
    action: 'cursor',
    sensitivity: 1.0,
  },
  pinch: {
    label: 'Chụm Ngón',
    icon: '🤏',
    desc: 'Chọn / Bấm chuột',
    action: 'select',
    sensitivity: 1.0,
  },
  open: {
    label: 'Xòe Tay',
    icon: '🖐️',
    desc: 'Tương tác / Làm nổ',
    action: 'interact',
    sensitivity: 1.0,
  },
  fist: {
    label: 'Nắm Tay',
    icon: '✊',
    desc: 'Hành động đặc biệt / Cúi',
    action: 'special',
    sensitivity: 1.0,
  },
  swipeLeft: {
    label: 'Vuốt Trái',
    icon: '👈',
    desc: 'Điều hướng sang trái',
    action: 'nav_left',
    sensitivity: 1.0,
  },
  swipeRight: {
    label: 'Vuốt Phải',
    icon: '👉',
    desc: 'Điều hướng sang phải',
    action: 'nav_right',
    sensitivity: 1.0,
  },
  swipeUp: {
    label: 'Vuốt Lên',
    icon: '☝️',
    desc: 'Nhảy / Lên trên',
    action: 'nav_up',
    sensitivity: 1.0,
  },
  swipeDown: {
    label: 'Vuốt Xuống',
    icon: '👇',
    desc: 'Cúi / Xuống dưới',
    action: 'nav_down',
    sensitivity: 1.0,
  },
};

const ACTION_OPTIONS = [
  { value: 'cursor', label: 'Di chuyển con trỏ' },
  { value: 'select', label: 'Chọn / Bấm click' },
  { value: 'interact', label: 'Tương tác / Làm nổ' },
  { value: 'special', label: 'Hành động đặc biệt' },
  { value: 'nav_left', label: 'Điều hướng sang trái' },
  { value: 'nav_right', label: 'Điều hướng sang phải' },
  { value: 'nav_up', label: 'Điều hướng lên' },
  { value: 'nav_down', label: 'Điều hướng xuống' },
  { value: 'pause', label: 'Tạm dừng' },
  { value: 'none', label: 'Tắt cử chỉ' },
];

class GestureRemapping {
  constructor() {
    this.mappings = JSON.parse(JSON.stringify(DEFAULT_GESTURE_MAP));
    this.thresholds = {
      pinch: 0.07,
      pinchRelease: 0.1,
      fist: 0.08,
      swipe: 0.12,
      swipeTimeWindow: 400,
    };
  }

  init() {
    const saved = localStorage.getItem('handplay_gesture_map');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.mappings = { ...this.mappings, ...parsed };
      } catch(e) {}
    }

    const savedThresholds = localStorage.getItem('handplay_gesture_thresholds');
    if (savedThresholds) {
      try {
        this.thresholds = { ...this.thresholds, ...JSON.parse(savedThresholds) };
      } catch(e) {}
    }

    this._applyThresholds();
  }

  _applyThresholds() {
    HP.PINCH_THRESHOLD = this.thresholds.pinch;
    HP.PINCH_RELEASE_THRESHOLD = this.thresholds.pinchRelease;
    HP.FIST_THRESHOLD = this.thresholds.fist;
    HP.SWIPE_THRESHOLD = this.thresholds.swipe;
    HP.SWIPE_TIME_WINDOW = this.thresholds.swipeTimeWindow;
  }

  save() {
    localStorage.setItem('handplay_gesture_map', JSON.stringify(this.mappings));
    localStorage.setItem('handplay_gesture_thresholds', JSON.stringify(this.thresholds));
  }

  reset() {
    this.mappings = JSON.parse(JSON.stringify(DEFAULT_GESTURE_MAP));
    this.thresholds = {
      pinch: 0.07,
      pinchRelease: 0.1,
      fist: 0.08,
      swipe: 0.12,
      swipeTimeWindow: 400,
    };
    this._applyThresholds();
    this.save();
  }

  getMapping(gesture) {
    return this.mappings[gesture];
  }

  getAction(gesture) {
    return this.mappings[gesture]?.action || 'none';
  }

  setMapping(gesture, action) {
    if (this.mappings[gesture]) {
      this.mappings[gesture].action = action;
      this.save();
    }
  }

  setSensitivity(gesture, value) {
    if (this.mappings[gesture]) {
      this.mappings[gesture].sensitivity = Math.max(0.1, Math.min(2.0, value));
      this.save();
    }
  }

  setThreshold(name, value) {
    if (this.thresholds.hasOwnProperty(name)) {
      this.thresholds[name] = value;
      this._applyThresholds();
      this.save();
    }
  }

  renderSettings(container) {
    if (!container) return;

    let html = `
      <div class="settings-group">
        <div class="settings-group-title">Gán Phím Cử Chỉ</div>
        <p style="font-size: 12px; color: var(--text-dim); margin-bottom: 12px;">
          Gán hành động cho từng cử chỉ. Thay đổi có hiệu lực ngay lập tức.
        </p>
    `;

    for (const [gestureId, gesture] of Object.entries(this.mappings)) {
      const actionOptions = ACTION_OPTIONS.map(opt =>
        `<option value="${opt.value}" ${opt.value === gesture.action ? 'selected' : ''}>${opt.label}</option>`
      ).join('');

      html += `
        <div class="settings-row" style="flex-wrap: wrap; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 150px;">
            <span style="font-size: 22px; width: 32px; text-align: center;">${gesture.icon}</span>
            <div>
              <div style="font-size: 13px; font-weight: 600; color: var(--text-primary);">${gesture.label}</div>
              <div style="font-size: 10px; color: var(--text-dim);">${gesture.desc}</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <select data-gesture="${gestureId}" class="gesture-action-select" style="
              background: var(--bg-secondary);
              border: 1px solid var(--border-subtle);
              color: var(--text-primary);
              padding: 6px 10px;
              border-radius: var(--radius-sm);
              font-size: 12px;
              font-family: var(--font-main);
              min-width: 140px;
            ">${actionOptions}</select>
          </div>
        </div>
      `;
    }

    html += '</div>';

    // Thresholds section
    html += `
      <div class="settings-group" style="margin-top: 20px;">
        <div class="settings-group-title">Độ Nhạy Nhận Diện Cử Chỉ</div>
        <p style="font-size: 12px; color: var(--text-dim); margin-bottom: 12px;">
          Tinh chỉnh các ngưỡng nhận diện. Giá trị càng nhỏ = càng dễ kích hoạt cử chỉ.
        </p>

        <div class="settings-row">
          <span class="settings-row-label">Khoảng cách Chụm ngón</span>
          <input type="range" class="threshold-slider" data-threshold="pinch"
            min="2" max="15" value="${Math.round(this.thresholds.pinch * 100)}"
            style="min-width: 140px;">
          <span class="threshold-value" style="width: 30px; text-align: right; font-size: 12px; color: var(--text-dim); font-family: var(--font-mono);">${this.thresholds.pinch}</span>
        </div>

        <div class="settings-row">
          <span class="settings-row-label">Ngưỡng Nắm tay</span>
          <input type="range" class="threshold-slider" data-threshold="fist"
            min="2" max="15" value="${Math.round(this.thresholds.fist * 100)}"
            style="min-width: 140px;">
          <span class="threshold-value" style="width: 30px; text-align: right; font-size: 12px; color: var(--text-dim); font-family: var(--font-mono);">${this.thresholds.fist}</span>
        </div>

        <div class="settings-row">
          <span class="settings-row-label">Độ nhạy Vuốt</span>
          <input type="range" class="threshold-slider" data-threshold="swipe"
            min="4" max="25" value="${Math.round(this.thresholds.swipe * 100)}"
            style="min-width: 140px;">
          <span class="threshold-value" style="width: 30px; text-align: right; font-size: 12px; color: var(--text-dim); font-family: var(--font-mono);">${this.thresholds.swipe}</span>
        </div>

        <div class="settings-row">
          <span class="settings-row-label">Thời gian nhận diện Vuốt</span>
          <input type="range" class="threshold-slider" data-threshold="swipeTimeWindow"
            min="100" max="800" value="${this.thresholds.swipeTimeWindow}"
            style="min-width: 140px;">
          <span class="threshold-value" style="width: 40px; text-align: right; font-size: 12px; color: var(--text-dim); font-family: var(--font-mono);">${this.thresholds.swipeTimeWindow}ms</span>
        </div>
      </div>

      <div class="settings-group" style="margin-top: 20px;">
        <button id="btn-reset-gestures" style="
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: var(--radius-sm);
          color: #ef4444;
          padding: 10px 20px;
          font-size: 13px;
          font-family: var(--font-main);
          cursor: pointer;
          transition: all 0.2s;
        ">Khôi Phục Mặc Định</button>
      </div>
    `;

    container.innerHTML = html;
    this._bindSettings(container);
  }

  _bindSettings(container) {
    // Action selects
    container.querySelectorAll('.gesture-action-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const gesture = e.target.dataset.gesture;
        const action = e.target.value;
        this.setMapping(gesture, action);
        window.audioManager?.playClick();
      });
    });

    // Threshold sliders
    container.querySelectorAll('.threshold-slider').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const name = e.target.dataset.threshold;
        let value = parseInt(e.target.value);

        // Convert display units
        if (name === 'swipeTimeWindow') {
          this.setThreshold(name, value);
        } else {
          value = value / 100;
          this.setThreshold(name, value);
        }

        // Update displayed value
        const valueEl = e.target.parentElement.querySelector('.threshold-value');
        if (valueEl) {
          if (name === 'swipeTimeWindow') {
            valueEl.textContent = `${value}ms`;
          } else {
            valueEl.textContent = value.toFixed(2);
          }
        }
      });
    });

    // Reset button
    container.querySelector('#btn-reset-gestures')?.addEventListener('click', () => {
      this.reset();
      this.renderSettings(container);
      window.audioManager?.playSelect();
    });
  }
}

window.gestureRemapping = new GestureRemapping();
