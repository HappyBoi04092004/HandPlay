/* ========================================
   HANDPLAY — Score Manager
   Developed by Erick de S.C. Araujo + IA
   ======================================== */

class ScoreManager {
  constructor() {
    this.records = {};
    this.maxPerGame = 10;
  }

  async init() {
    const saved = await window.electronAPI?.loadRecords();
    if (saved) {
      this.records = saved;
    }
  }

  getRecords(gameId) {
    return this.records[gameId] || [];
  }

  getBestScore(gameId) {
    const records = this.getRecords(gameId);
    if (records.length === 0) return 0;
    return records[0].score;
  }

  addScore(gameId, scoreData) {
    if (!this.records[gameId]) {
      this.records[gameId] = [];
    }

    const entry = {
      score: scoreData.score || 0,
      accuracy: scoreData.accuracy || 0,
      time: scoreData.time || 0,
      level: scoreData.level || 1,
      maxCombo: scoreData.maxCombo || 0,
      date: new Date().toISOString(),
    };

    this.records[gameId].push(entry);
    this.records[gameId].sort((a, b) => b.score - a.score);

    // Record to analytics
    window.analyticsManager?.recordGame(gameId, entry);

    // Check achievements
    window.achievementManager?.checkAll();

    if (this.records[gameId].length > this.maxPerGame) {
      this.records[gameId] = this.records[gameId].slice(0, this.maxPerGame);
    }

    this._save();
    return entry;
  }

  isHighScore(gameId, score) {
    const records = this.getRecords(gameId);
    if (records.length < this.maxPerGame) return true;
    return score > records[records.length - 1].score;
  }

  getAllBestScores() {
    const bests = {};
    for (const [gameId, records] of Object.entries(this.records)) {
      if (records.length > 0) {
        bests[gameId] = records[0].score;
      }
    }
    return bests;
  }

  clearRecords(gameId) {
    if (gameId) {
      delete this.records[gameId];
    } else {
      this.records = {};
    }
    this._save();
  }

  async _save() {
    await window.electronAPI?.saveRecords(this.records);
  }
}

window.scoreManager = new ScoreManager();
