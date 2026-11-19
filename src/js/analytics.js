/* ========================================
   HANDPLAY — Analytics Screen
   Gameplay history charts and statistics
   Developed by Erick de S.C. Araujo + IA
   ======================================== */

class AnalyticsManager {
  constructor() {
    this.history = [];
    this.stats = {
      totalGames: 0,
      totalScore: 0,
      totalPlayTime: 0,
      gamesByDay: {},
      scoreByGame: {},
      bestByGame: {},
      avgByGame: {},
      recentGames: [],
      streakDays: 0,
      favoriteGame: '',
      totalCombo: 0,
      totalAccuracy: 0,
      accuracyCount: 0,
    };
    this.animFrame = null;
  }

  init() {
    this._loadHistory();
    this._computeStats();
  }

  _loadHistory() {
    const saved = localStorage.getItem('handplay_history');
    if (saved) {
      try { this.history = JSON.parse(saved); } catch(e) { this.history = []; }
    }
  }

  _saveHistory() {
    // Keep last 200 entries max
    if (this.history.length > 200) {
      this.history = this.history.slice(-200);
    }
    localStorage.setItem('handplay_history', JSON.stringify(this.history));
  }

  recordGame(gameId, result) {
    const entry = {
      game: gameId,
      score: result.score || 0,
      accuracy: result.accuracy || 0,
      time: result.time || 0,
      level: result.level || 1,
      maxCombo: result.maxCombo || 0,
      date: new Date().toISOString(),
      day: new Date().toISOString().split('T')[0],
    };
    this.history.push(entry);
    this._saveHistory();
    this._computeStats();
  }

  _computeStats() {
    const s = this.stats;
    s.totalGames = this.history.length;
    s.totalScore = this.history.reduce((sum, h) => sum + h.score, 0);
    s.totalPlayTime = this.history.reduce((sum, h) => sum + h.time, 0);
    s.totalCombo = this.history.reduce((sum, h) => sum + (h.maxCombo || 0), 0);

    const accEntries = this.history.filter(h => h.accuracy > 0);
    s.totalAccuracy = accEntries.reduce((sum, h) => sum + h.accuracy, 0);
    s.accuracyCount = accEntries.length;

    // Games by day
    s.gamesByDay = {};
    for (const h of this.history) {
      s.gamesByDay[h.day] = (s.gamesByDay[h.day] || 0) + 1;
    }

    // Score by game
    s.scoreByGame = {};
    s.bestByGame = {};
    s.avgByGame = {};
    const gameCounts = {};

    for (const h of this.history) {
      s.scoreByGame[h.game] = (s.scoreByGame[h.game] || 0) + h.score;
      s.bestByGame[h.game] = Math.max(s.bestByGame[h.game] || 0, h.score);
      gameCounts[h.game] = (gameCounts[h.game] || 0) + 1;
    }

    for (const [g, total] of Object.entries(s.scoreByGame)) {
      s.avgByGame[g] = Math.round(total / (gameCounts[g] || 1));
    }

    // Favorite game
    let maxPlays = 0;
    for (const [g, count] of Object.entries(gameCounts)) {
      if (count > maxPlays) {
        maxPlays = count;
        s.favoriteGame = g;
      }
    }

    // Recent 10
    s.recentGames = this.history.slice(-10).reverse();

    // Streak days
    const days = Object.keys(s.gamesByDay).sort().reverse();
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let checkDate = new Date();

    for (let i = 0; i < 30; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (s.gamesByDay[dateStr]) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0) {
        // Today might not have games yet, check yesterday
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      } else {
        break;
      }
    }
    s.streakDays = streak;
  }

  render(container) {
    if (!container) return;
    this._computeStats();

    container.innerHTML = '';

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'text-align: center; margin-bottom: 24px;';
    header.innerHTML = `
      <h2 style="font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #ffffff, #a5b4fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 4px;">📊 Thống Kê</h2>
      <p style="color: var(--text-muted); font-size: 13px; letter-spacing: 1px;">DỮ LIỆU CHƠI CỦA BẠN</p>
    `;
    container.appendChild(header);

    // Overview cards
    this._renderOverviewCards(container);

    // Charts section
    const chartsRow = document.createElement('div');
    chartsRow.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;';

    // Activity heatmap
    const activityCard = document.createElement('div');
    activityCard.className = 'analytics-card';
    activityCard.innerHTML = `
      <h3 class="analytics-card-title">📅 Hoạt Động (30 Ngày Qua)</h3>
      <div class="analytics-heatmap" id="analytics-heatmap"></div>
    `;
    chartsRow.appendChild(activityCard);

    // Game breakdown
    const breakdownCard = document.createElement('div');
    breakdownCard.className = 'analytics-card';
    breakdownCard.innerHTML = `
      <h3 class="analytics-card-title">🎮 Điểm Số Theo Trò Chơi</h3>
      <div class="analytics-bars" id="analytics-bars"></div>
    `;
    chartsRow.appendChild(breakdownCard);

    container.appendChild(chartsRow);

    // Recent games table
    this._renderRecentGames(container);

    // Per-game stats
    this._renderGameStats(container);

    // Draw charts
    setTimeout(() => {
      this._drawHeatmap();
      this._drawBars();
    }, 100);

    this._animateEntrance(container);
  }

  _renderOverviewCards(container) {
    const s = this.stats;
    const game = window.gameEngine?.getGames()?.find(g => g.id === s.favoriteGame);

    const row = document.createElement('div');
    row.style.cssText = 'display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 24px;';

    const cards = [
      { value: s.totalGames, label: 'Số ván', color: '#6366f1' },
      { value: s.totalScore.toLocaleString(), label: 'Tổng điểm', color: '#a5b4fc' },
      { value: this._formatTime(s.totalPlayTime), label: 'Thời gian chơi', color: '#22c55e' },
      { value: `${s.streakDays} ngày`, label: 'Chuỗi ngày', color: '#eab308' },
      { value: `${s.accuracyCount > 0 ? Math.round(s.totalAccuracy / s.accuracyCount) : 0}%`, label: 'Chính xác TB', color: '#ec4899' },
    ];

    for (const c of cards) {
      const el = document.createElement('div');
      el.className = 'analytics-stat';
      el.innerHTML = `
        <div class="analytics-stat-value" style="color: ${c.color};">${c.value}</div>
        <div class="analytics-stat-label">${c.label}</div>
      `;
      row.appendChild(el);
    }

    container.appendChild(row);
  }

  _renderRecentGames(container) {
    if (this.stats.recentGames.length === 0) return;

    const card = document.createElement('div');
    card.className = 'analytics-card';
    card.innerHTML = `<h3 class="analytics-card-title">🕐 Ván Đấu Gần Đây</h3>`;

    const table = document.createElement('div');
    table.className = 'analytics-table';

    // Header
    table.innerHTML = `
      <div class="analytics-row analytics-row-header">
        <span style="flex: 0 0 30px;">#</span>
        <span style="flex: 1;">Trò chơi</span>
        <span style="flex: 0 0 80px; text-align: right;">Điểm</span>
        <span style="flex: 0 0 60px; text-align: right;">Thời gian</span>
        <span style="flex: 0 0 50px; text-align: right;">Chính xác</span>
        <span style="flex: 0 0 90px; text-align: right;">Thời điểm</span>
      </div>
    `;

    for (let i = 0; i < this.stats.recentGames.length; i++) {
      const g = this.stats.recentGames[i];
      const gameConfig = window.gameEngine?.getGameConfig(g.game);
      const date = new Date(g.date);
      const timeAgo = this._timeAgo(date);

      const row = document.createElement('div');
      row.className = 'analytics-row';
      row.innerHTML = `
        <span style="flex: 0 0 30px; color: var(--text-dim);">${i + 1}</span>
        <span style="flex: 1;">${gameConfig?.icon || '🎮'} ${gameConfig?.name || g.game}</span>
        <span style="flex: 0 0 80px; text-align: right; color: var(--accent-tertiary); font-family: var(--font-mono);">${g.score.toLocaleString()}</span>
        <span style="flex: 0 0 60px; text-align: right; color: var(--text-dim);">${g.time.toFixed(1)}s</span>
        <span style="flex: 0 0 50px; text-align: right; color: ${g.accuracy >= 80 ? '#22c55e' : g.accuracy >= 50 ? '#eab308' : '#ef4444'};">${g.accuracy}%</span>
        <span style="flex: 0 0 90px; text-align: right; color: var(--text-dim); font-size: 11px;">${timeAgo}</span>
      `;
      table.appendChild(row);
    }

    card.appendChild(table);
    container.appendChild(card);
  }

  _renderGameStats(container) {
    const games = window.gameEngine?.getGames() || [];
    const scored = games.filter(g => this.stats.bestByGame[g.id]);

    if (scored.length === 0) return;

    const card = document.createElement('div');
    card.className = 'analytics-card';
    card.innerHTML = `<h3 class="analytics-card-title">🏆 Thống Kê Từng Trò Chơi</h3>`;

    const grid = document.createElement('div');
    grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;';

    for (const game of scored) {
      const plays = this.stats.recentGames.filter(g => g.game === game.id).length +
                    this.history.filter(h => h.game === game.id).length;
      const el = document.createElement('div');
      el.style.cssText = `
        background: rgba(99, 102, 241, 0.05);
        border-radius: 10px;
        padding: 14px;
        border: 1px solid var(--border-subtle);
      `;
      el.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span style="font-size: 20px;">${game.icon}</span>
          <span style="font-size: 13px; font-weight: 600; color: var(--text-primary);">${game.name}</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px;">
          <div><span style="color: var(--text-dim);">Kỷ lục:</span> <span style="color: var(--accent-tertiary); font-family: var(--font-mono);">${(this.stats.bestByGame[game.id] || 0).toLocaleString()}</span></div>
          <div><span style="color: var(--text-dim);">TB:</span> <span style="color: var(--text-secondary); font-family: var(--font-mono);">${(this.stats.avgByGame[game.id] || 0).toLocaleString()}</span></div>
          <div><span style="color: var(--text-dim);">Số ván:</span> <span style="color: var(--text-secondary);">${this.history.filter(h => h.game === game.id).length}</span></div>
          <div><span style="color: var(--text-dim);">Tổng:</span> <span style="color: var(--text-secondary); font-family: var(--font-mono);">${(this.stats.scoreByGame[game.id] || 0).toLocaleString()}</span></div>
        </div>
      `;
      grid.appendChild(el);
    }

    card.appendChild(grid);
    container.appendChild(card);
  }

  _drawHeatmap() {
    const container = document.getElementById('analytics-heatmap');
    if (!container) return;

    container.innerHTML = '';
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayStr = date.toISOString().split('T')[0];
      const count = this.stats.gamesByDay[dayStr] || 0;
      const intensity = Math.min(count / 5, 1);

      const cell = document.createElement('div');
      cell.className = 'heatmap-cell';
      cell.title = `${dayStr}: ${count} games`;

      if (count === 0) {
        cell.style.background = 'rgba(99, 102, 241, 0.05)';
      } else {
        cell.style.background = `rgba(99, 102, 241, ${0.2 + intensity * 0.6})`;
        cell.style.boxShadow = `0 0 ${4 + intensity * 8}px rgba(99, 102, 241, ${intensity * 0.3})`;
      }

      container.appendChild(cell);
    }
  }

  _drawBars() {
    const container = document.getElementById('analytics-bars');
    if (!container) return;

    container.innerHTML = '';

    const games = window.gameEngine?.getGames() || [];
    const maxScore = Math.max(1, ...Object.values(this.stats.scoreByGame));

    for (const game of games) {
      const score = this.stats.scoreByGame[game.id] || 0;
      const pct = (score / maxScore) * 100;

      const row = document.createElement('div');
      row.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 6px;';
      row.innerHTML = `
        <span style="width: 20px; font-size: 14px;">${game.icon}</span>
        <span style="width: 80px; font-size: 11px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${game.name}</span>
        <div style="flex: 1; height: 8px; background: rgba(99, 102, 241, 0.1); border-radius: 4px; overflow: hidden;">
          <div style="width: ${pct}%; height: 100%; background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary)); border-radius: 4px; transition: width 0.8s ease;"></div>
        </div>
        <span style="width: 50px; text-align: right; font-size: 10px; color: var(--text-dim); font-family: var(--font-mono);">${score > 0 ? score.toLocaleString() : '-'}</span>
      `;
      container.appendChild(row);
    }
  }

  _formatTime(seconds) {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  }

  _timeAgo(date) {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  }

  _animateEntrance(container) {
    const items = container.querySelectorAll('.analytics-card, .analytics-stat');
    items.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(15px)';
      setTimeout(() => {
        el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, i * 60);
    });
  }
}

window.analyticsManager = new AnalyticsManager();
