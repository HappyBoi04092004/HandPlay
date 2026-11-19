/* ========================================
   HANDPLAY — Settings Manager
   Developed by Erick de S.C. Araujo + IA
   ======================================== */

class SettingsManager {
  constructor() {
    this.settings = JSON.parse(JSON.stringify(HP.DEFAULT_SETTINGS));
    this.listeners = [];
  }

  async init() {
    const saved = await window.electronAPI?.loadSettings();
    if (saved) {
      this.settings = this._deepMerge(this.settings, saved);
    }
  }

  _deepMerge(target, source) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this._deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  get(path) {
    const parts = path.split('.');
    let value = this.settings;
    for (const part of parts) {
      if (value === undefined || value === null) return undefined;
      value = value[part];
    }
    return value;
  }

  set(path, value) {
    const parts = path.split('.');
    let obj = this.settings;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!obj[parts[i]]) obj[parts[i]] = {};
      obj = obj[parts[i]];
    }
    obj[parts[parts.length - 1]] = value;
    this._save();
    this._notify(path, value);
  }

  getAll() {
    return JSON.parse(JSON.stringify(this.settings));
  }

  onChange(callback) {
    this.listeners.push(callback);
  }

  _notify(path, value) {
    for (const cb of this.listeners) {
      cb(path, value);
    }
  }

  async _save() {
    await window.electronAPI?.saveSettings(this.settings);
  }
}

window.settingsManager = new SettingsManager();
