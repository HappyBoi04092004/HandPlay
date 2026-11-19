/* ========================================
   HANDPLAY — Camera Preview
   Live preview widget for settings
   Developed by Erick de S.C. Araujo + IA
   ======================================== */

class CameraPreview {
  constructor() {
    this.container = null;
    this.videoEl = null;
    this.canvasEl = null;
    this.ctx = null;
    this.active = false;
    this.animFrame = null;
    this.stream = null;
    this.devices = [];
    this.selectedDevice = 'default';
  }

  async init() {
    this.devices = await this._enumerateDevices();
  }

  async _enumerateDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(d => d.kind === 'videoinput');
    } catch (e) {
      return [];
    }
  }

  render(container) {
    this.container = container;
    if (!container) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'camera-preview-wrapper';

    wrapper.innerHTML = `
      <div class="camera-preview-header">
        <h3 class="analytics-card-title">📷 Xem Trước Camera</h3>
        <div class="camera-preview-controls">
          <select id="preview-camera-select" class="camera-preview-select">
            <option value="default">Camera Mặc định</option>
          </select>
          <button id="preview-start-btn" class="camera-preview-btn">Bật Xem Trước</button>
          <button id="preview-stop-btn" class="camera-preview-btn camera-preview-btn-stop" style="display: none;">Dừng</button>
        </div>
      </div>
      <div class="camera-preview-viewport" id="camera-preview-viewport">
        <video id="preview-video" autoplay playsinline style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px; display: none;"></video>
        <canvas id="preview-canvas" style="width: 100%; height: 100%; border-radius: 10px;"></canvas>
        <div class="camera-preview-placeholder" id="preview-placeholder">
          <div style="font-size: 48px; margin-bottom: 12px;">📷</div>
          <div style="font-size: 14px; color: var(--text-muted);">Bấm "Bật Xem Trước" để kiểm tra camera của bạn</div>
          <div style="font-size: 11px; color: var(--text-dim); margin-top: 6px;">Camera được xử lý cục bộ — không gửi đi bất kỳ đâu</div>
        </div>
      </div>
      <div class="camera-preview-info" id="camera-preview-info" style="display: none;">
        <span id="preview-resolution">-</span>
        <span id="preview-fps">-</span>
        <span id="preview-hands">Chưa phát hiện bàn tay</span>
      </div>
    `;

    container.prepend(wrapper);

    this._bindEvents(wrapper);
    this._populateDevices(wrapper);
  }

  _bindEvents(wrapper) {
    wrapper.querySelector('#preview-start-btn')?.addEventListener('click', () => {
      this._startPreview(wrapper);
    });

    wrapper.querySelector('#preview-stop-btn')?.addEventListener('click', () => {
      this._stopPreview();
    });

    wrapper.querySelector('#preview-camera-select')?.addEventListener('change', (e) => {
      this.selectedDevice = e.target.value;
      if (this.active) {
        this._stopPreview();
        this._startPreview(wrapper);
      }
    });
  }

  async _populateDevices(wrapper) {
    const select = wrapper.querySelector('#preview-camera-select');
    if (!select) return;

    const devices = await this._enumerateDevices();
    select.innerHTML = '<option value="default">Camera Mặc định</option>';

    devices.forEach((d, i) => {
      const opt = document.createElement('option');
      opt.value = d.deviceId;
      opt.textContent = d.label || `Camera ${i + 1}`;
      select.appendChild(opt);
    });
  }

  async _startPreview(wrapper) {
    const video = wrapper.querySelector('#preview-video');
    const canvas = wrapper.querySelector('#preview-canvas');
    const placeholder = wrapper.querySelector('#preview-placeholder');
    const startBtn = wrapper.querySelector('#preview-start-btn');
    const stopBtn = wrapper.querySelector('#preview-stop-btn');
    const info = wrapper.querySelector('#camera-preview-info');

    if (!video || !canvas) return;

    const constraints = {
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 30 },
      },
      audio: false,
    };

    if (this.selectedDevice && this.selectedDevice !== 'default') {
      constraints.video.deviceId = { exact: this.selectedDevice };
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = this.stream;
      video.style.display = 'block';
      placeholder.style.display = 'none';
      startBtn.style.display = 'none';
      stopBtn.style.display = 'inline-flex';
      info.style.display = 'flex';
      this.active = true;

      this.videoEl = video;
      this.canvasEl = canvas;
      this.ctx = canvas.getContext('2d');

      const settings = this.stream.getVideoTracks()[0]?.getSettings();
      document.getElementById('preview-resolution').textContent = `${settings.width}×${settings.height}`;
      document.getElementById('preview-fps').textContent = `${Math.round(settings.frameRate || 30)} FPS`;

      await video.play();
      this._renderLoop();
    } catch (e) {
      placeholder.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 12px;">⚠️</div>
        <div style="font-size: 14px; color: var(--error, #ef4444);">Camera access failed</div>
        <div style="font-size: 11px; color: var(--text-dim); margin-top: 6px;">${e.message || 'Check permissions'}</div>
      `;
    }
  }

  _stopPreview() {
    this.active = false;

    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }

    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }

    const wrapper = this.container?.querySelector('.camera-preview-wrapper');
    if (!wrapper) return;

    const video = wrapper.querySelector('#preview-video');
    const placeholder = wrapper.querySelector('#preview-placeholder');
    const startBtn = wrapper.querySelector('#preview-start-btn');
    const stopBtn = wrapper.querySelector('#preview-stop-btn');
    const info = wrapper.querySelector('#camera-preview-info');

    if (video) {
      video.srcObject = null;
      video.style.display = 'none';
    }
    if (placeholder) placeholder.style.display = 'flex';
    if (startBtn) startBtn.style.display = 'inline-flex';
    if (stopBtn) stopBtn.style.display = 'none';
    if (info) info.style.display = 'none';
  }

  _renderLoop() {
    if (!this.active || !this.videoEl || !this.ctx) return;

    const video = this.videoEl;
    const canvas = this.canvasEl;
    const ctx = this.ctx;

    canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1);
    canvas.height = canvas.clientHeight * (window.devicePixelRatio || 1);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (video.readyState >= 2) {
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const cw = canvas.width;
      const ch = canvas.height;

      // Mirror
      ctx.save();
      ctx.translate(cw, 0);
      ctx.scale(-1, 1);

      const scale = Math.max(cw / vw, ch / vh);
      const sw = vw * scale;
      const sh = vh * scale;
      const sx = (cw - sw) / 2;
      const sy = (ch - sh) / 2;

      ctx.globalAlpha = 0.85;
      ctx.drawImage(video, sx, sy, sw, sh);
      ctx.restore();

      // Draw hand overlay if tracking available
      if (window.handTracking?.ready && window.cameraManager?.isActive()) {
        const hands = window.handTracking.getHands();
        document.getElementById('preview-hands').textContent =
          hands.length > 0 ? `Đã phát hiện ${hands.length} bàn tay ✓` : 'Chưa phát hiện bàn tay';
      }
    }

    this.animFrame = requestAnimationFrame(() => this._renderLoop());
  }

  destroy() {
    this._stopPreview();
  }
}

window.cameraPreview = new CameraPreview();
