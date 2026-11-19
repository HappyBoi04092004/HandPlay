/* ========================================
   HANDPLAY — Camera Manager
   Developed by Erick de S.C. Araujo + IA
   ======================================== */

class CameraManager {
  constructor() {
    this.video = null;
    this.stream = null;
    this.devices = [];
    this.currentDevice = null;
    this.active = false;
    this.width = HP.CAMERA_DEFAULTS.WIDTH;
    this.height = HP.CAMERA_DEFAULTS.HEIGHT;
    this.fps = HP.CAMERA_DEFAULTS.FPS;
    this.mirrored = true;
  }

  async init() {
    this.video = document.getElementById('webcam-video');

    if (window.settingsManager) {
      this.width = window.settingsManager.get('camera.width') || HP.CAMERA_DEFAULTS.WIDTH;
      this.height = window.settingsManager.get('camera.height') || HP.CAMERA_DEFAULTS.HEIGHT;
      this.fps = window.settingsManager.get('camera.fps') || HP.CAMERA_DEFAULTS.FPS;
      this.mirrored = window.settingsManager.get('camera.mirrored') !== false;
    }
  }

  async enumerateDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.devices = devices.filter(d => d.kind === 'videoinput');
      return this.devices;
    } catch (e) {
      console.error('Camera enumeration failed:', e);
      this.devices = [];
      return [];
    }
  }

  async requestPermission() {
    try {
      console.log('Camera: requesting permission...');
      const tempStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 },
        audio: false,
      });
      tempStream.getTracks().forEach(t => t.stop());
      console.log('Camera: permission granted');
      await this.enumerateDevices();
      return { granted: true };
    } catch (e) {
      console.error('Camera: permission denied', e);
      return { granted: false, error: e.message, name: e.name };
    }
  }

  async start(deviceId) {
    if (this.stream) {
      this.stop();
    }

    const constraints = {
      video: {
        width: { ideal: this.width },
        height: { ideal: this.height },
        frameRate: { ideal: this.fps },
      },
      audio: false,
    };

    if (deviceId && deviceId !== 'default') {
      constraints.video.deviceId = { exact: deviceId };
    }

    try {
      console.log('Camera: starting with constraints:', JSON.stringify(constraints.video));
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      this.video.srcObject = this.stream;
      this.video.setAttribute('playsinline', 'true');
      this.video.muted = true;

      // Wait for video to be ready
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Video load timeout')), 5000);
        this.video.onloadedmetadata = () => {
          clearTimeout(timeout);
          this.video.play()
            .then(() => {
              console.log('Camera: video playing');
              resolve();
            })
            .catch(err => {
              console.warn('Camera: video play failed, retrying...', err);
              // Retry play after a short delay
              setTimeout(() => {
                this.video.play().then(resolve).catch(reject);
              }, 500);
            });
        };
        this.video.onerror = (e) => {
          clearTimeout(timeout);
          reject(new Error('Video element error'));
        };
      });

      const settings = this.stream.getVideoTracks()[0]?.getSettings();
      this.width = settings.width || this.width;
      this.height = settings.height || this.height;

      this.active = true;
      this.currentDevice = deviceId || 'default';

      console.log('Camera: active, resolution:', this.width, 'x', this.height, 'fps:', settings.frameRate);

      return {
        success: true,
        width: this.width,
        height: this.height,
        fps: settings.frameRate || this.fps,
      };
    } catch (e) {
      console.error('Camera: start failed', e);
      this.active = false;
      return { success: false, error: e.message, name: e.name };
    }
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
    this.active = false;
  }

  getVideoElement() {
    return this.video;
  }

  isActive() {
    return this.active && this.video && !this.video.paused;
  }

  getActualResolution() {
    return { width: this.width, height: this.height };
  }
}

window.cameraManager = new CameraManager();
