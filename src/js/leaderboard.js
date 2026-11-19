/* ========================================
   HANDPLAY — Leaderboard Screen
   Animated rankings and statistics
   Developed by Erick de S.C. Araujo + IA
   ======================================== */

class LeaderboardManager {
  constructor() {
    this.container = null;
    this.animFrame = null;
    this.selectedGame = null;
    this.stats = {
      totalGames: 0,
      totalScore: 0,
      totalPlayTime: 0,
      bestStreak: 0,
      gamesPlayed: {},
    };
  }

  init() {
    this._loadStats();
  }

  _loadStats() {
    const saved = localStorage.getItem('handplay_stats');
    if (saved) {
      try {
        this.stats = JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
  }

  _saveStats() {
    localStorage.setItem('handplay_stats', JSON.stringify(this.stats));
  }

  recordGame(gameId, result) {
    this.stats.totalGames++;
    this.stats.totalScore += result.score;
    this.stats.totalPlayTime += result.time;

    if (!this.stats.gamesPlayed[gameId]) {
      this.stats.gamesPlayed[gameId] = { count: 0, totalScore: 0, bestScore: 0 };
    }

    const gp = this.stats.gamesPlayed[gameId];
    gp.count++;
    gp.totalScore += result.score;
    gp.bestScore = Math.max(gp.bestScore, result.score);

    this._saveStats();
  }

  render(container) {
    this.container = container;
    if (!container) return;

    container.innerHTML = '';

    // Header section
    const header = document.createElement('div');
    header.className = 'leaderboard-header';
    header.innerHTML = `
      <div class="leaderboard-title-row">
        <h2 style="font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #ffffff, #a5b4fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 4px;">🏆 Bảng Xếp Hạng</h2>
        <p style="color: var(--text-muted); font-size: 13px; letter-spacing: 1px;">KỶ LỤC XUẤT SẮC CỦA BẠN</p>
      </div>
    `;
    container.appendChild(header);

    // Stats summary
    const statsRow = document.createElement('div');
    statsRow.className = 'leaderboard-stats-row';
    statsRow.innerHTML = `
      <div class="leaderboard-stat-card">
        <div class="leaderboard-stat-value" id="lb-total-games">${this.stats.totalGames}</div>
        <div class="leaderboard-stat-label">Tổng Số Ván</div>
      </div>
      <div class="leaderboard-stat-card">
        <div class="leaderboard-stat-value" id="lb-total-score">${this.stats.totalScore.toLocaleString()}</div>
        <div class="leaderboard-stat-label">Tổng Điểm</div>
      </div>
      <div class="leaderboard-stat-card">
        <div class="leaderboard-stat-value" id="lb-avg-score">${this.stats.totalGames > 0 ? Math.round(this.stats.totalScore / this.stats.totalGames).toLocaleString() : 0}</div>
        <div class="leaderboard-stat-label">Điểm Trung Bình</div>
      </div>
      <div class="leaderboard-stat-card">
        <div class="leaderboard-stat-value" id="lb-play-time">${this._formatTime(this.stats.totalPlayTime)}</div>
        <div class="leaderboard-stat-label">Tổng Thời Gian</div>
      </div>
    `;
    container.appendChild(statsRow);

    // Game filter tabs
    const filterRow = document.createElement('div');
    filterRow.className = 'leaderboard-filters';
    filterRow.innerHTML = `
      <button class="leaderboard-filter active" data-game="all">Tất Cả Trò Chơi</button>
    `;

    const games = window.gameEngine?.getGames() || [];
    for (const game of games) {
      filterRow.innerHTML += `
        <button class="leaderboard-filter" data-game="${game.id}">${game.icon} ${game.name}</button>
      `;
    }
    container.appendChild(filterRow);

    // Rankings list
    const list = document.createElement('div');
    list.className = 'leaderboard-list';
    list.id = 'leaderboard-list';
    container.appendChild(list);

    this._renderRankings('all');
    this._bindFilters(container);
    this._animateEntrance();
  }

  _renderRankings(gameFilter) {
    const list = document.getElementById('leaderboard-list');
    if (!list) return;

    list.innerHTML = '';

    const games = window.gameEngine?.getGames() || [];
    const records = window.scoreManager?.records || {};

    const gameToShow = gameFilter === 'all' ? games : games.filter(g => g.id === gameFilter);

    let totalRank = 0;

    for (const game of gameToShow) {
      const gameRecords = records[game.id] || [];
      if (gameRecords.length === 0 && gameFilter !== 'all') {
        const empty = document.createElement('div');
        empty.className = 'leaderboard-empty';
        empty.textContent = 'Chưa có kỷ lục nào — hãy chơi trò này ngay!';
        list.appendChild(empty);
        continue;
      }

      // Game section
      const section = document.createElement('div');
      section.className = 'leaderboard-game-section';

      const sectionHeader = document.createElement('div');
      sectionHeader.className = 'leaderboard-section-header';
      sectionHeader.innerHTML = `
        <span style="font-size: 24px;">${game.icon}</span>
        <span style="font-size: 16px; font-weight: 600; color: var(--text-primary);">${game.name}</span>
        ${gameRecords.length > 0 ? `<span style="font-size: 12px; color: var(--text-dim); margin-left: auto;">${gameRecords.length} lượt chơi</span>` : ''}
      `;
      section.appendChild(sectionHeader);

      if (gameRecords.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'leaderboard-empty';
        empty.textContent = 'Chưa có kỷ lục nào';
        section.appendChild(empty);
      } else {
        for (let i = 0; i < Math.min(5, gameRecords.length); i++) {
          totalRank++;
          const record = gameRecords[i];
          const entry = this._createRecordEntry(totalRank, record, i);
          section.appendChild(entry);
        }
      }

      list.appendChild(section);
    }
  }

  _createRecordEntry(rank, record, index) {
    const entry = document.createElement('div');
    entry.className = 'leaderboard-entry';
    entry.style.animationDelay = `${index * 0.05}s`;

    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
    const rankDisplay = medal || `#${rank}`;
    const date = record.date ? new Date(record.date).toLocaleDateString('vi-VN') : '-';
    const accuracy = record.accuracy ? `${record.accuracy}%` : '-';

    entry.innerHTML = `
      <div class="entry-rank">${rankDisplay}</div>
      <div class="entry-details">
        <div class="entry-score">${record.score.toLocaleString()}</div>
        <div class="entry-meta">
          <span>⏱ ${record.time ? record.time.toFixed(1) + 's' : '-'}</span>
          <span>🎯 ${accuracy}</span>
          <span>📅 ${date}</span>
        </div>
      </div>
      ${rank === 1 ? '<div class="entry-best">KỶ LỤC</div>' : ''}
    `;

    return entry;
  }

  _formatTime(seconds) {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  }

  _bindFilters(container) {
    container.querySelectorAll('.leaderboard-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.leaderboard-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._renderRankings(btn.dataset.game);
        window.audioManager?.playClick();
      });
    });
  }

  _animateEntrance() {
    const entries = this.container?.querySelectorAll('.leaderboard-entry, .leaderboard-stat-card, .leaderboard-game-section');
    if (!entries) return;

    entries.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      setTimeout(() => {
        el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, i * 60);
    });
  }

  destroy() {
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
    }
  }
}

window.leaderboardManager = new LeaderboardManager();
