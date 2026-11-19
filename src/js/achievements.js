/* ========================================
   HANDPLAY — Achievement System
   Milestones, badges, and unlock tracking
   Developed by Erick de S.C. Araújo + IA
   ======================================== */

const ACHIEVEMENT_DEFS = [
  // First steps
  { id: 'first_game', name: 'Bước Đầu Tiên', icon: '👣', desc: 'Chơi ván game đầu tiên', category: 'general', check: (s) => s.totalGames >= 1 },
  { id: 'first_win', name: 'Chiến Thắng', icon: '🏅', desc: 'Hoàn thành một màn xếp hình', category: 'general', check: (s) => s.gamesCompleted >= 1 },
  { id: 'tutorial_done', name: 'Học Nhanh', icon: '📚', desc: 'Hoàn thành phần hướng dẫn cử chỉ', category: 'general', check: () => localStorage.getItem('handplay_tutorial_done') === 'true' },

  // Score milestones
  { id: 'score_1k', name: 'Người Thu Thập', icon: '⭐', desc: 'Đạt tổng cộng 1.000 điểm', category: 'score', check: (s) => s.totalScore >= 1000 },
  { id: 'score_10k', name: 'Thợ Săn Điểm Số', icon: '🌟', desc: 'Đạt tổng cộng 10.000 điểm', category: 'score', check: (s) => s.totalScore >= 10000 },
  { id: 'score_50k', name: 'Bậc Thầy Điểm Số', icon: '💫', desc: 'Đạt tổng cộng 50.000 điểm', category: 'score', check: (s) => s.totalScore >= 50000 },
  { id: 'score_100k', name: 'Huyền Thoại Điểm Số', icon: '👑', desc: 'Đạt tổng cộng 100.000 điểm', category: 'score', check: (s) => s.totalScore >= 100000 },

  // Game counts
  { id: 'games_10', name: 'Người Chơi Chăm Chỉ', icon: '🎮', desc: 'Chơi 10 ván game', category: 'dedication', check: (s) => s.totalGames >= 10 },
  { id: 'games_50', name: 'Game Thủ Tận Tụy', icon: '🎯', desc: 'Chơi 50 ván game', category: 'dedication', check: (s) => s.totalGames >= 50 },
  { id: 'games_100', name: 'Kỳ Cựu HandPlay', icon: '🏆', desc: 'Chơi 100 ván game', category: 'dedication', check: (s) => s.totalGames >= 100 },

  // Time played
  { id: 'time_10m', name: 'Bắt Đầu Cuốn', icon: '⏰', desc: 'Chơi tổng cộng 10 phút', category: 'dedication', check: (s) => s.totalPlayTime >= 600 },
  { id: 'time_1h', name: 'Thời Gian Vút Bay', icon: '🕐', desc: 'Chơi tổng cộng 1 giờ', category: 'dedication', check: (s) => s.totalPlayTime >= 3600 },
  { id: 'time_5h', name: 'Đam Mê Bất Tận', icon: '🌙', desc: 'Chơi tổng cộng 5 giờ', category: 'dedication', check: (s) => s.totalPlayTime >= 18000 },

  // Combos
  { id: 'combo_5', name: 'Khởi Động Combo', icon: '🔥', desc: 'Đạt chuỗi combo x5', category: 'skill', check: (s) => s.bestCombo >= 5 },
  { id: 'combo_10', name: 'Vua Combo', icon: '💥', desc: 'Đạt chuỗi combo x10', category: 'skill', check: (s) => s.bestCombo >= 10 },
  { id: 'combo_20', name: 'Không Thể Cản Phá', icon: '⚡', desc: 'Đạt chuỗi combo x20', category: 'skill', check: (s) => s.bestCombo >= 20 },

  // Accuracy
  { id: 'accuracy_90', name: 'Xạ Thủ Thiện Xạ', icon: '🎯', desc: 'Đạt độ chính xác 90%+ trong một ván', category: 'skill', check: (s) => s.bestAccuracy >= 90 },
  { id: 'accuracy_100', name: 'Cú Bắn Hoàn Hảo', icon: '💎', desc: 'Đạt độ chính xác 100%', category: 'skill', check: (s) => s.bestAccuracy >= 100 },

  // Streaks
  { id: 'streak_3', name: 'Giữ Vững Phong Độ', icon: '📅', desc: 'Chơi 3 ngày liên tiếp', category: 'dedication', check: (s) => s.streakDays >= 3 },
  { id: 'streak_7', name: 'Chiến Binh Tuần', icon: '🗓️', desc: 'Chơi 7 ngày liên tiếp', category: 'dedication', check: (s) => s.streakDays >= 7 },

  // Game-specific
  { id: 'puzzle_master', name: 'Bậc Thầy Xếp Hình', icon: '🧩', desc: 'Hoàn thành xếp hình 25 mảnh ghép', category: 'game', check: (s) => s.puzzleMaster },
  { id: 'all_games', name: 'Toàn Diện', icon: '🃏', desc: 'Chơi thử tất cả các trò chơi ít nhất một lần', category: 'game', check: (s) => s.allGamesPlayed },

  // Special
  { id: 'night_owl', name: 'Cú Đêm', icon: '🦉', desc: 'Chơi game sau nửa đêm', category: 'special', check: () => new Date().getHours() < 5 },
  { id: 'early_bird', name: 'Dậy Sớm', icon: '🐦', desc: 'Chơi game trước 7 giờ sáng', category: 'special', check: () => { const h = new Date().getHours(); return h >= 5 && h < 7; } },
];

class AchievementManager {
  constructor() {
    this.unlocked = new Set();
    this.queue = [];
    this.popupEl = null;
    this.animFrame = null;
    this.stats = {};
  }

  init() {
    const saved = localStorage.getItem('handplay_achievements');
    if (saved) {
      try { this.unlocked = new Set(JSON.parse(saved)); } catch(e) {}
    }
    this._loadStats();
    this._createPopup();
  }

  _loadStats() {
    this.stats = {
      totalGames: 0,
      totalScore: 0,
      totalPlayTime: 0,
      bestCombo: 0,
      bestAccuracy: 0,
      streakDays: 0,
      gamesCompleted: 0,
      puzzleMaster: false,
      allGamesPlayed: false,
      gamesPlayed: {},
    };

    const history = JSON.parse(localStorage.getItem('handplay_history') || '[]');
    this.stats.totalGames = history.length;
    this.stats.totalScore = history.reduce((s, h) => s + (h.score || 0), 0);
    this.stats.totalPlayTime = history.reduce((s, h) => s + (h.time || 0), 0);

    for (const h of history) {
      this.stats.bestCombo = Math.max(this.stats.bestCombo, h.maxCombo || 0);
      this.stats.bestAccuracy = Math.max(this.stats.bestAccuracy, h.accuracy || 0);
      this.stats.gamesPlayed[h.game] = true;
    }

    // Streak
    const gamesByDay = {};
    for (const h of history) {
      const day = h.date?.split('T')[0];
      if (day) gamesByDay[day] = true;
    }
    let streak = 0;
    let d = new Date();
    for (let i = 0; i < 30; i++) {
      const ds = d.toISOString().split('T')[0];
      if (gamesByDay[ds]) { streak++; d.setDate(d.getDate() - 1); }
      else if (i === 0) { d.setDate(d.getDate() - 1); continue; }
      else break;
    }
    this.stats.streakDays = streak;

    // All games played
    const allGameIds = ['puzzle', 'targetHunter', 'balloonPop', 'airPong', 'memoryHands', 'dodgeHand', 'airRunner', 'airDraw'];
    this.stats.allGamesPlayed = allGameIds.every(id => this.stats.gamesPlayed[id]);
  }

  _createPopup() {
    this.popupEl = document.createElement('div');
    this.popupEl.id = 'achievement-popup';
    this.popupEl.style.cssText = `
      position: fixed;
      top: -100px;
      right: 20px;
      z-index: 300;
      background: linear-gradient(135deg, #141432, #1a1a40);
      border: 1px solid rgba(234, 179, 8, 0.3);
      border-radius: 14px;
      padding: 14px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5), 0 0 30px rgba(234, 179, 8, 0.1);
      transition: top 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
      font-family: 'Segoe UI', system-ui, sans-serif;
      cursor: pointer;
      max-width: 320px;
    `;
    this.popupEl.innerHTML = `
      <div style="font-size: 32px;" id="ach-popup-icon">🏆</div>
      <div>
        <div style="font-size: 10px; color: #eab308; letter-spacing: 2px; font-weight: 700; text-transform: uppercase;">Mở Khóa Thành Tựu Mới!</div>
        <div style="font-size: 14px; font-weight: 600; color: white; margin-top: 2px;" id="ach-popup-name"></div>
        <div style="font-size: 11px; color: rgba(165, 180, 252, 0.5); margin-top: 1px;" id="ach-popup-desc"></div>
      </div>
    `;
    document.body.appendChild(this.popupEl);

    this.popupEl.addEventListener('click', () => {
      this.popupEl.style.top = '-100px';
    });
  }

  checkAll() {
    this._loadStats();
    const newUnlocks = [];

    for (const ach of ACHIEVEMENT_DEFS) {
      if (this.unlocked.has(ach.id)) continue;
      try {
        if (ach.check(this.stats)) {
          this.unlocked.add(ach.id);
          newUnlocks.push(ach);
        }
      } catch(e) {}
    }

    if (newUnlocks.length > 0) {
      this._save();
      for (let i = 0; i < newUnlocks.length; i++) {
        setTimeout(() => this._showPopup(newUnlocks[i]), i * 2500);
      }
    }
  }

  _showPopup(ach) {
    if (!this.popupEl) return;

    document.getElementById('ach-popup-icon').textContent = ach.icon;
    document.getElementById('ach-popup-name').textContent = ach.name;
    document.getElementById('ach-popup-desc').textContent = ach.desc;

    this.popupEl.style.top = '20px';

    window.audioManager?.playLevelUp();

    setTimeout(() => {
      this.popupEl.style.top = '-100px';
    }, 3000);
  }

  _save() {
    localStorage.setItem('handplay_achievements', JSON.stringify([...this.unlocked]));
  }

  getAll() {
    return ACHIEVEMENT_DEFS.map(ach => ({
      ...ach,
      unlocked: this.unlocked.has(ach.id),
    }));
  }

  getUnlocked() {
    return this.getAll().filter(a => a.unlocked);
  }

  getProgress() {
    return {
      unlocked: this.unlocked.size,
      total: ACHIEVEMENT_DEFS.length,
      percentage: Math.round((this.unlocked.size / ACHIEVEMENT_DEFS.length) * 100),
    };
  }

  renderScreen(container) {
    if (!container) return;

    const all = this.getAll();
    const progress = this.getProgress();

    container.innerHTML = '';

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'text-align: center; margin-bottom: 24px;';
    header.innerHTML = `
      <h2 style="font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #ffffff, #eab308); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 4px;">🏅 Thành Tựu</h2>
      <p style="color: var(--text-muted); font-size: 13px; letter-spacing: 1px;">ĐÃ MỞ KHÓA ${progress.unlocked} / ${progress.total} (${progress.percentage}%)</p>
    `;
    container.appendChild(header);

    // Progress bar
    const progressBar = document.createElement('div');
    progressBar.style.cssText = 'max-width: 400px; margin: 0 auto 24px; height: 6px; background: rgba(99, 102, 241, 0.1); border-radius: 3px; overflow: hidden;';
    progressBar.innerHTML = `<div style="width: ${progress.percentage}%; height: 100%; background: linear-gradient(90deg, #eab308, #f59e0b); border-radius: 3px; transition: width 0.8s ease;"></div>`;
    container.appendChild(progressBar);

    // Achievement grid
    const grid = document.createElement('div');
    grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;';

    for (const ach of all) {
      const card = document.createElement('div');
      card.style.cssText = `
        background: ${ach.unlocked ? 'rgba(234, 179, 8, 0.05)' : 'var(--bg-card)'};
        border: 1px solid ${ach.unlocked ? 'rgba(234, 179, 8, 0.2)' : 'var(--border-subtle)'};
        border-radius: 10px;
        padding: 14px;
        text-align: center;
        opacity: ${ach.unlocked ? '1' : '0.4'};
        filter: ${ach.unlocked ? 'none' : 'grayscale(1)'};
        transition: all 0.3s ease;
      `;

      card.innerHTML = `
        <div style="font-size: 32px; margin-bottom: 6px; ${ach.unlocked ? '' : 'filter: grayscale(1); opacity: 0.5;'}">${ach.icon}</div>
        <div style="font-size: 13px; font-weight: 700; color: ${ach.unlocked ? '#eab308' : 'var(--text-dim)'}; margin-bottom: 3px;">${ach.name}</div>
        <div style="font-size: 11px; color: var(--text-dim); line-height: 1.3;">${ach.desc}</div>
        ${ach.unlocked ? '<div style="font-size: 9px; color: #22c55e; margin-top: 6px; letter-spacing: 1px;">✓ ĐÃ ĐẠT</div>' : ''}
      `;

      grid.appendChild(card);
    }

    container.appendChild(grid);
  }
}

window.achievementManager = new AchievementManager();
