/* ========================================
   HANDPLAY — Pause Menu Overlay
   Gesture-controlled pause with game stats
   Developed by Erick de S.C. Araujo + IA
   ======================================== */

class PauseMenu {
  constructor() {
    this.visible = false;
    this.overlay = null;
    this.onResume = null;
    this.onQuit = null;
    this.onRestart = null;
    this.stats = {};
    this.hoveredOption = null;
    this.closeTimer = 0;
  }

  show(game, callbacks = {}) {
    if (this.visible) return;
    this.visible = true;

    this.onResume = callbacks.onResume || (() => {});
    this.onQuit = callbacks.onQuit || (() => {});
    this.onRestart = callbacks.onRestart || (() => {});

    this.stats = {
      score: game?.score || 0,
      level: game?.level || 1,
      time: game?.elapsedTime || 0,
      combo: game?.maxCombo || 0,
      moves: game?.moves || 0,
      hits: game?.hits || 0,
    };

    this._createOverlay();
    this._show();
  }

  hide() {
    if (!this.visible) return;
    this.visible = false;
    this._hide();
  }

  _createOverlay() {
    if (this.overlay) this.overlay.remove();

    this.overlay = document.createElement('div');
    this.overlay.id = 'pause-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 70;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(5, 5, 15, 0.8);
      backdrop-filter: blur(8px);
      opacity: 0;
      transition: opacity 0.3s ease;
      font-family: 'Segoe UI', system-ui, sans-serif;
    `;

    const card = document.createElement('div');
    card.style.cssText = `
      background: var(--bg-card, #141432);
      border: 1px solid var(--border-subtle, rgba(99, 102, 241, 0.15));
      border-radius: 20px;
      padding: 40px;
      min-width: 360px;
      max-width: 420px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    `;

    // Pause icon
    const icon = document.createElement('div');
    icon.style.cssText = 'font-size: 48px; margin-bottom: 12px;';
    icon.textContent = '⏸️';

    // Title
    const title = document.createElement('h2');
    title.style.cssText = `
      font-size: 28px;
      font-weight: 700;
      background: linear-gradient(135deg, #ffffff, #a5b4fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 20px;
    `;
    title.textContent = 'TẠM DỪNG';

    // Stats grid
    const statsGrid = document.createElement('div');
    statsGrid.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 24px;
    `;

    const statItems = [
      { label: 'Điểm số', value: this.stats.score.toLocaleString(), color: '#a5b4fc' },
      { label: 'Cấp độ', value: this.stats.level, color: '#22c55e' },
      { label: 'Thời gian', value: `${this.stats.time.toFixed(1)}s`, color: '#eab308' },
      { label: 'Chuỗi tốt nhất', value: `x${this.stats.combo}`, color: '#ec4899' },
    ];

    if (this.stats.moves > 0) {
      statItems.push({ label: 'Số nước đi', value: this.stats.moves, color: '#06b6d4' });
      statItems.push({ label: 'Số lần trúng', value: this.stats.hits, color: '#22c55e' });
    }

    for (const stat of statItems) {
      const item = document.createElement('div');
      item.style.cssText = `
        background: rgba(99, 102, 241, 0.05);
        border-radius: 10px;
        padding: 12px;
      `;
      item.innerHTML = `
        <div style="font-size: 20px; font-weight: 700; font-family: 'Cascadia Code', monospace; color: ${stat.color};">${stat.value}</div>
        <div style="font-size: 11px; color: var(--text-dim, rgba(165, 180, 252, 0.3)); text-transform: uppercase; letter-spacing: 1px; margin-top: 2px;">${stat.label}</div>
      `;
      statsGrid.appendChild(item);
    }

    // Gesture hint
    const gestureHint = document.createElement('div');
    gestureHint.style.cssText = `
      font-size: 12px;
      color: var(--text-dim, rgba(165, 180, 252, 0.3));
      margin-bottom: 20px;
      line-height: 1.6;
    `;
    gestureHint.innerHTML = '✋ Xòe bàn tay để tiếp tục • 🤏 Chụm ngón để chọn';

    // Buttons
    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';

    const buttons = [
      { text: '▶ Tiếp tục', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)', action: 'resume', dataGestureHover: 'true' },
      { text: '🔄 Chơi lại', color: '#eab308', bg: 'rgba(234, 179, 8, 0.08)', action: 'restart', dataGestureHover: 'true' },
      { text: '✕ Thoát ra menu', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)', action: 'quit', dataGestureHover: 'true' },
    ];

    this.optionElements = {};

    for (const btn of buttons) {
      const el = document.createElement('button');
      el.dataset.pauseAction = btn.action;
      el.dataset.gestureHover = btn.dataGestureHover;
      el.style.cssText = `
        background: ${btn.bg};
        border: 1px solid ${btn.color}33;
        border-radius: 10px;
        padding: 12px 20px;
        color: ${btn.color};
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.2s ease;
        width: 100%;
      `;

      el.addEventListener('mouseenter', () => {
        el.style.borderColor = btn.color;
        el.style.background = `${btn.color}22`;
      });

      el.addEventListener('mouseleave', () => {
        el.style.borderColor = `${btn.color}33`;
        el.style.background = btn.bg;
      });

      el.addEventListener('click', () => {
        this._handleAction(btn.action);
      });

      btnContainer.appendChild(el);
      this.optionElements[btn.action] = el;
    }

    card.appendChild(icon);
    card.appendChild(title);
    card.appendChild(statsGrid);
    card.appendChild(gestureHint);
    card.appendChild(btnContainer);
    this.overlay.appendChild(card);
    document.body.appendChild(this.overlay);
  }

  _show() {
    requestAnimationFrame(() => {
      if (this.overlay) this.overlay.style.opacity = '1';
    });
  }

  _hide() {
    if (this.overlay) {
      this.overlay.style.opacity = '0';
      setTimeout(() => {
        if (this.overlay) {
          this.overlay.remove();
          this.overlay = null;
        }
      }, 300);
    }
  }

  _handleAction(action) {
    window.audioManager?.playSelect();
    this.visible = false;

    switch (action) {
      case 'resume':
        this._hide();
        this.onResume();
        break;
      case 'restart':
        this._hide();
        this.onRestart();
        break;
      case 'quit':
        this._hide();
        this.onQuit();
        break;
    }
  }

  handleGesture(event) {
    if (!this.visible) return;

    // Open hand = resume
    if (event.type === HP.GESTURES.OPEN_HAND) {
      this._handleAction('resume');
      return;
    }

    // Pinch to select hovered option
    if (event.type === HP.GESTURES.PINCH_START) {
      const hand = window.handTracking?.getHands()?.[0];
      if (!hand) return;

      const x = hand.indexTip.x * window.innerWidth;
      const y = hand.indexTip.y * window.innerHeight;

      for (const [action, el] of Object.entries(this.optionElements)) {
        const rect = el.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          this._handleAction(action);
          return;
        }
      }
    }
  }

  isVisible() {
    return this.visible;
  }
}

window.pauseMenu = new PauseMenu();
