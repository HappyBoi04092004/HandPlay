/* ========================================
   HANDPLAY — Difficulty Selector
   Pre-game difficulty selection screen
   Developed by Erick de S.C. Araujo + IA
   ======================================== */

const DIFFICULTY_PRESETS = {
  easy: {
    label: 'Dễ',
    icon: '🌱',
    color: '#22c55e',
    desc: 'Nhịp độ thư giãn, dễ chơi',
    modifiers: {
      speedMultiplier: 0.6,
      scoreMultiplier: 0.5,
      timeBonus: 1.5,
      targetSize: 1.3,
      spawnRate: 0.7,
      lives: 5,
    },
  },
  normal: {
    label: 'Bình Thường',
    icon: '⚡',
    color: '#6366f1',
    desc: 'Trải nghiệm tiêu chuẩn cân bằng',
    modifiers: {
      speedMultiplier: 1.0,
      scoreMultiplier: 1.0,
      timeBonus: 1.0,
      targetSize: 1.0,
      spawnRate: 1.0,
      lives: 3,
    },
  },
  hard: {
    label: 'Khó',
    icon: '🔥',
    color: '#eab308',
    desc: 'Nhanh hơn, nhiều thử thách kịch tính',
    modifiers: {
      speedMultiplier: 1.4,
      scoreMultiplier: 1.5,
      timeBonus: 0.8,
      targetSize: 0.8,
      spawnRate: 1.4,
      lives: 2,
    },
  },
  extreme: {
    label: 'Cực Hạn',
    icon: '💀',
    color: '#ef4444',
    desc: 'Dành riêng cho cao thủ — không khoan nhượng',
    modifiers: {
      speedMultiplier: 2.0,
      scoreMultiplier: 2.5,
      timeBonus: 0.6,
      targetSize: 0.6,
      spawnRate: 2.0,
      lives: 1,
    },
  },
};

class DifficultySelector {
  constructor() {
    this.selectedDifficulty = 'normal';
    this.overlay = null;
    this.onSelect = null;
    this.onCancel = null;
  }

  show(gameConfig, callbacks = {}) {
    this.onSelect = callbacks.onSelect || (() => {});
    this.onCancel = callbacks.onCancel || (() => {});
    this._createOverlay(gameConfig);
  }

  hide() {
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

  _createOverlay(gameConfig) {
    if (this.overlay) this.overlay.remove();

    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 80;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(5, 5, 15, 0.88);
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
      max-width: 520px;
      width: 90%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    `;

    // Game info
    const gameIcon = document.createElement('div');
    gameIcon.style.cssText = 'font-size: 56px; margin-bottom: 8px;';
    gameIcon.textContent = gameConfig?.icon || '🎮';

    const gameName = document.createElement('h2');
    gameName.style.cssText = `
      font-size: 24px;
      font-weight: 700;
      background: linear-gradient(135deg, #ffffff, #a5b4fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 4px;
    `;
    gameName.textContent = gameConfig?.name || 'Game';

    const subtitle = document.createElement('p');
    subtitle.style.cssText = 'font-size: 12px; color: var(--text-muted); margin-bottom: 24px; letter-spacing: 1px;';
    subtitle.textContent = 'CHỌN ĐỘ KHÓ';

    // Difficulty buttons
    const grid = document.createElement('div');
    grid.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 24px;';

    for (const [id, diff] of Object.entries(DIFFICULTY_PRESETS)) {
      const btn = document.createElement('button');
      btn.dataset.difficulty = id;
      btn.style.cssText = `
        background: ${id === 'normal' ? `${diff.color}15` : 'rgba(99, 102, 241, 0.03)'};
        border: 2px solid ${id === 'normal' ? diff.color : 'var(--border-subtle, rgba(99, 102, 241, 0.15))'};
        border-radius: 12px;
        padding: 16px 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: center;
      `;

      btn.innerHTML = `
        <div style="font-size: 28px; margin-bottom: 6px;">${diff.icon}</div>
        <div style="font-size: 15px; font-weight: 700; color: ${diff.color}; margin-bottom: 4px;">${diff.label}</div>
        <div style="font-size: 11px; color: var(--text-dim, rgba(165, 180, 252, 0.3)); line-height: 1.3;">${diff.desc}</div>
        <div style="font-size: 10px; color: var(--text-dim); margin-top: 6px; font-family: 'Cascadia Code', monospace;">
          x${diff.modifiers.scoreMultiplier} điểm • x${diff.modifiers.speedMultiplier} tốc độ
        </div>
      `;

      btn.addEventListener('mouseenter', () => {
        if (id !== this.selectedDifficulty) {
          btn.style.borderColor = `${diff.color}88`;
          btn.style.background = `${diff.color}08`;
        }
      });

      btn.addEventListener('mouseleave', () => {
        if (id !== this.selectedDifficulty) {
          btn.style.borderColor = 'var(--border-subtle, rgba(99, 102, 241, 0.15))';
          btn.style.background = 'rgba(99, 102, 241, 0.03)';
        }
      });

      btn.addEventListener('click', () => {
        this.selectedDifficulty = id;
        this._updateSelection(grid);
        window.audioManager?.playSelect();
      });

      grid.appendChild(btn);
    }

    card.appendChild(gameIcon);
    card.appendChild(gameName);
    card.appendChild(subtitle);
    card.appendChild(grid);

    // Action buttons
    const btns = document.createElement('div');
    btns.style.cssText = 'display: flex; gap: 12px; justify-content: center;';

    const backBtn = document.createElement('button');
    backBtn.textContent = '← Quay lại';
    backBtn.style.cssText = `
      background: transparent;
      border: 1px solid var(--border-subtle, rgba(99, 102, 241, 0.15));
      color: var(--text-secondary, #a5b4fc);
      padding: 12px 24px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s;
    `;
    backBtn.addEventListener('click', () => {
      window.audioManager?.playClick();
      this.hide();
      this.onCancel();
    });

    const playBtn = document.createElement('button');
    playBtn.textContent = '▶ Bắt đầu chơi';
    playBtn.style.cssText = `
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      border: none;
      color: white;
      padding: 12px 36px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s;
    `;
    playBtn.addEventListener('click', () => {
      window.audioManager?.playSuccess();
      this.hide();
      this.onSelect(this.selectedDifficulty, DIFFICULTY_PRESETS[this.selectedDifficulty]);
    });

    btns.appendChild(backBtn);
    btns.appendChild(playBtn);
    card.appendChild(btns);
    this.overlay.appendChild(card);
    document.body.appendChild(this.overlay);

    requestAnimationFrame(() => {
      this.overlay.style.opacity = '1';
    });

    this.grid = grid;
  }

  _updateSelection(grid) {
    if (!grid) return;

    grid.querySelectorAll('button').forEach(btn => {
      const id = btn.dataset.difficulty;
      const diff = DIFFICULTY_PRESETS[id];
      const isSelected = id === this.selectedDifficulty;

      btn.style.borderColor = isSelected ? diff.color : 'var(--border-subtle, rgba(99, 102, 241, 0.15))';
      btn.style.background = isSelected ? `${diff.color}15` : 'rgba(99, 102, 241, 0.03)';
      btn.style.boxShadow = isSelected ? `0 0 20px ${diff.color}30` : 'none';
    });
  }

  getModifiers() {
    return DIFFICULTY_PRESETS[this.selectedDifficulty]?.modifiers || DIFFICULTY_PRESETS.normal.modifiers;
  }
}

window.DifficultySelector = DifficultySelector;
window.DIFFICULTY_PRESETS = DIFFICULTY_PRESETS;
window.difficultySelector = new DifficultySelector();
