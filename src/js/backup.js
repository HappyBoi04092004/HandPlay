/* ========================================
   HANDPLAY — Backup & Restore
   Export/import settings, records, and progress
   Developed by Erick de S.C. Araujo + IA
   ======================================== */

class BackupManager {
  constructor() {}

  exportAll() {
    const data = {
      version: HP.VERSION,
      exportDate: new Date().toISOString(),
      settings: window.settingsManager?.getAll() || {},
      records: window.scoreManager?.records || {},
      history: JSON.parse(localStorage.getItem('handplay_history') || '[]'),
      achievements: JSON.parse(localStorage.getItem('handplay_achievements') || '[]'),
      theme: window.themeManager?.getThemeId() || 'indigo',
      gestureMap: JSON.parse(localStorage.getItem('handplay_gesture_map') || '{}'),
      gestureThresholds: JSON.parse(localStorage.getItem('handplay_gesture_thresholds') || '{}'),
      tutorialDone: localStorage.getItem('handplay_tutorial_done') === 'true',
      stats: JSON.parse(localStorage.getItem('handplay_stats') || '{}'),
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `handplay-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return true;
  }

  async importFromJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);

      if (!data.version) {
        throw new Error('Invalid backup file format');
      }

      let itemsImported = 0;

      // Settings
      if (data.settings && window.settingsManager) {
        window.settingsManager.settings = data.settings;
        await window.settingsManager._save();
        window.settingsManager._notify('*', data.settings);
        itemsImported++;
      }

      // Records
      if (data.records && window.scoreManager) {
        window.scoreManager.records = data.records;
        await window.scoreManager._save();
        itemsImported++;
      }

      // History
      if (data.history) {
        localStorage.setItem('handplay_history', JSON.stringify(data.history));
        window.analyticsManager?._loadHistory();
        window.analyticsManager?._computeStats();
        itemsImported++;
      }

      // Achievements
      if (data.achievements) {
        localStorage.setItem('handplay_achievements', JSON.stringify(data.achievements));
        window.achievementManager?.init();
        itemsImported++;
      }

      // Theme
      if (data.theme) {
        window.themeManager?.apply(data.theme);
        itemsImported++;
      }

      // Gesture map
      if (data.gestureMap) {
        localStorage.setItem('handplay_gesture_map', JSON.stringify(data.gestureMap));
        window.gestureRemapping?.init();
        itemsImported++;
      }

      // Gesture thresholds
      if (data.gestureThresholds) {
        localStorage.setItem('handplay_gesture_thresholds', JSON.stringify(data.gestureThresholds));
        window.gestureRemapping?.init();
        itemsImported++;
      }

      // Tutorial
      if (data.tutorialDone !== undefined) {
        localStorage.setItem('handplay_tutorial_done', data.tutorialDone ? 'true' : 'false');
        window.tutorialManager?.init();
        itemsImported++;
      }

      // Stats
      if (data.stats) {
        localStorage.setItem('handplay_stats', JSON.stringify(data.stats));
        window.leaderboardManager?._loadStats();
        itemsImported++;
      }

      return { success: true, itemsImported };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async importFromFile(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = await this.importFromJSON(e.target.result);
        resolve(result);
      };
      reader.onerror = () => resolve({ success: false, error: 'Failed to read file' });
      reader.readAsText(file);
    });
  }

  renderSettings(container) {
    if (!container) return;

    const html = `
      <div class="settings-group">
        <div class="settings-group-title">Sao Lưu & Khôi Phục</div>
        <p style="font-size: 12px; color: var(--text-dim); margin-bottom: 16px; line-height: 1.6;">
          Xuất toàn bộ cài đặt, kỷ lục điểm số, thành tựu và tiến trình ra tệp tin JSON.
          Nhập tệp sao lưu để khôi phục mọi thứ bất kỳ lúc nào.
        </p>

        <div class="settings-row" style="flex-wrap: wrap; gap: 10px;">
          <div style="flex: 1; min-width: 200px;">
            <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 6px;">Xuất Bản Sao Lưu</div>
            <div style="font-size: 11px; color: var(--text-dim); margin-bottom: 8px;">Tải xuống cài đặt, kỷ lục và thành tựu</div>
            <button id="btn-export-settings" style="
              background: linear-gradient(135deg, #6366f1, #4f46e5);
              border: none;
              color: white;
              padding: 10px 20px;
              border-radius: 8px;
              font-size: 13px;
              font-weight: 600;
              cursor: pointer;
              font-family: var(--font-main);
              transition: all 0.2s;
            ">📥 Tải Tệp Sao Lưu</button>
          </div>

          <div style="flex: 1; min-width: 200px;">
            <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 6px;">Nhập Bản Sao Lưu</div>
            <div style="font-size: 11px; color: var(--text-dim); margin-bottom: 8px;">Khôi phục từ tệp tin JSON đã sao lưu trước đó</div>
            <button id="btn-import-settings" style="
              background: rgba(34, 197, 94, 0.1);
              border: 1px solid rgba(34, 197, 94, 0.3);
              color: #22c55e;
              padding: 10px 20px;
              border-radius: 8px;
              font-size: 13px;
              font-weight: 600;
              cursor: pointer;
              font-family: var(--font-main);
              transition: all 0.2s;
            ">📤 Chọn Tệp Khôi Phục</button>
            <input type="file" id="import-file-input" accept=".json" style="display: none;">
          </div>
        </div>

        <div id="backup-status" style="margin-top: 12px; font-size: 12px; min-height: 20px;"></div>
      </div>

      <div class="settings-group" style="margin-top: 20px;">
        <div class="settings-group-title">Đặt Lại Toàn Bộ Dữ Liệu</div>
        <p style="font-size: 12px; color: var(--text-dim); margin-bottom: 12px;">
          ⚠️ Thao tác này sẽ xóa vĩnh viễn tất cả cài đặt, điểm số và tiến trình chơi. Hãy sao lưu trước khi thực hiện.
        </p>
        <button id="btn-reset-all" style="
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 13px;
          font-family: var(--font-main);
          cursor: pointer;
          transition: all 0.2s;
        ">🗑️ Xóa Toàn Bộ Dữ Liệu</button>
      </div>
    `;

    container.innerHTML = html;
    this._bindEvents(container);
  }

  _bindEvents(container) {
    container.querySelector('#btn-export-settings')?.addEventListener('click', () => {
      this.exportAll();
      const status = container.querySelector('#backup-status');
      if (status) {
        status.innerHTML = '<span style="color: #22c55e;">✓ Đã xuất tệp sao lưu thành công!</span>';
        setTimeout(() => { status.innerHTML = ''; }, 3000);
      }
      window.audioManager?.playSuccess();
    });

    container.querySelector('#btn-import-settings')?.addEventListener('click', () => {
      container.querySelector('#import-file-input')?.click();
    });

    container.querySelector('#import-file-input')?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const status = container.querySelector('#backup-status');
      const result = await this.importFromFile(file);

      if (result.success) {
        if (status) {
          status.innerHTML = `<span style="color: #22c55e;">✓ Đã khôi phục ${result.itemsImported} mục thành công!</span>`;
          setTimeout(() => { status.innerHTML = ''; }, 3000);
        }
        window.audioManager?.playSuccess();
      } else {
        if (status) {
          status.innerHTML = `<span style="color: #ef4444;">✗ Khôi phục thất bại: ${result.error}</span>`;
        }
        window.audioManager?.playMiss();
      }

      e.target.value = '';
    });

    container.querySelector('#btn-reset-all')?.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn xóa TOÀN BỘ dữ liệu không? Thao tác này không thể hoàn tác!')) {
        localStorage.removeItem('handplay_settings');
        localStorage.removeItem('handplay_records');
        localStorage.removeItem('handplay_history');
        localStorage.removeItem('handplay_achievements');
        localStorage.removeItem('handplay_theme');
        localStorage.removeItem('handplay_gesture_map');
        localStorage.removeItem('handplay_gesture_thresholds');
        localStorage.removeItem('handplay_tutorial_done');
        localStorage.removeItem('handplay_stats');

        window.settingsManager.settings = JSON.parse(JSON.stringify(HP.DEFAULT_SETTINGS));
        window.scoreManager.records = {};
        window.themeManager.apply('indigo');
        window.gestureRemapping.reset();

        const status = container.querySelector('#backup-status');
        if (status) {
          status.innerHTML = '<span style="color: #eab308;">⚠ Toàn bộ dữ liệu đã được đặt lại. Vui lòng khởi động lại ứng dụng.</span>';
        }
        window.audioManager?.playGameOver();
      }
    });
  }
}

window.backupManager = new BackupManager();
