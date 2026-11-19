/* ========================================
   HANDPLAY — Theme System
   Multiple color schemes for personalization
   Developed by Erick de S.C. Araujo + IA
   ======================================== */

const HP_THEMES = {
  indigo: {
    name: 'Đêm Tím Indigo',
    icon: '💜',
    vars: {
      '--bg-primary': '#0a0a1a',
      '--bg-secondary': '#0f0f2a',
      '--bg-card': '#141432',
      '--bg-card-hover': '#1a1a40',
      '--bg-overlay': 'rgba(5, 5, 15, 0.85)',
      '--accent-primary': '#6366f1',
      '--accent-secondary': '#818cf8',
      '--accent-tertiary': '#a5b4fc',
      '--accent-glow': 'rgba(99, 102, 241, 0.3)',
      '--text-primary': '#ffffff',
      '--text-secondary': '#a5b4fc',
      '--text-muted': 'rgba(165, 180, 252, 0.5)',
      '--text-dim': 'rgba(165, 180, 252, 0.3)',
      '--border-subtle': 'rgba(99, 102, 241, 0.15)',
      '--border-active': 'rgba(99, 102, 241, 0.4)',
    },
  },

  cyber: {
    name: 'Xanh Ma Trận Cyber',
    icon: '💚',
    vars: {
      '--bg-primary': '#0a1a0f',
      '--bg-secondary': '#0f2a15',
      '--bg-card': '#142e1a',
      '--bg-card-hover': '#1a3e22',
      '--bg-overlay': 'rgba(5, 15, 8, 0.85)',
      '--accent-primary': '#22c55e',
      '--accent-secondary': '#4ade80',
      '--accent-tertiary': '#86efac',
      '--accent-glow': 'rgba(34, 197, 94, 0.3)',
      '--text-primary': '#ffffff',
      '--text-secondary': '#86efac',
      '--text-muted': 'rgba(134, 239, 172, 0.5)',
      '--text-dim': 'rgba(134, 239, 172, 0.3)',
      '--border-subtle': 'rgba(34, 197, 94, 0.15)',
      '--border-active': 'rgba(34, 197, 94, 0.4)',
    },
  },

  crimson: {
    name: 'Lửa Đỏ Rực',
    icon: '❤️',
    vars: {
      '--bg-primary': '#1a0a0a',
      '--bg-secondary': '#2a0f0f',
      '--bg-card': '#321414',
      '--bg-card-hover': '#401a1a',
      '--bg-overlay': 'rgba(15, 5, 5, 0.85)',
      '--accent-primary': '#ef4444',
      '--accent-secondary': '#f87171',
      '--accent-tertiary': '#fca5a5',
      '--accent-glow': 'rgba(239, 68, 68, 0.3)',
      '--text-primary': '#ffffff',
      '--text-secondary': '#fca5a5',
      '--text-muted': 'rgba(252, 165, 165, 0.5)',
      '--text-dim': 'rgba(252, 165, 165, 0.3)',
      '--border-subtle': 'rgba(239, 68, 68, 0.15)',
      '--border-active': 'rgba(239, 68, 68, 0.4)',
    },
  },

  ocean: {
    name: 'Đại Dương Xanh',
    icon: '💙',
    vars: {
      '--bg-primary': '#0a1520',
      '--bg-secondary': '#0f1e30',
      '--bg-card': '#142840',
      '--bg-card-hover': '#1a3450',
      '--bg-overlay': 'rgba(5, 10, 20, 0.85)',
      '--accent-primary': '#06b6d4',
      '--accent-secondary': '#22d3ee',
      '--accent-tertiary': '#67e8f9',
      '--accent-glow': 'rgba(6, 182, 212, 0.3)',
      '--text-primary': '#ffffff',
      '--text-secondary': '#67e8f9',
      '--text-muted': 'rgba(103, 232, 249, 0.5)',
      '--text-dim': 'rgba(103, 232, 249, 0.3)',
      '--border-subtle': 'rgba(6, 182, 212, 0.15)',
      '--border-active': 'rgba(6, 182, 212, 0.4)',
    },
  },

  amber: {
    name: 'Hoàng Kim Hổ Phách',
    icon: '💛',
    vars: {
      '--bg-primary': '#1a1508',
      '--bg-secondary': '#2a1f0c',
      '--bg-card': '#322a10',
      '--bg-card-hover': '#403514',
      '--bg-overlay': 'rgba(15, 12, 5, 0.85)',
      '--accent-primary': '#eab308',
      '--accent-secondary': '#facc15',
      '--accent-tertiary': '#fde047',
      '--accent-glow': 'rgba(234, 179, 8, 0.3)',
      '--text-primary': '#ffffff',
      '--text-secondary': '#fde047',
      '--text-muted': 'rgba(253, 224, 71, 0.5)',
      '--text-dim': 'rgba(253, 224, 71, 0.3)',
      '--border-subtle': 'rgba(234, 179, 8, 0.15)',
      '--border-active': 'rgba(234, 179, 8, 0.4)',
    },
  },

  rose: {
    name: 'Hồng Hoa Hồng',
    icon: '💗',
    vars: {
      '--bg-primary': '#1a0a15',
      '--bg-secondary': '#2a0f20',
      '--bg-card': '#321428',
      '--bg-card-hover': '#401a34',
      '--bg-overlay': 'rgba(15, 5, 12, 0.85)',
      '--accent-primary': '#ec4899',
      '--accent-secondary': '#f472b6',
      '--accent-tertiary': '#f9a8d4',
      '--accent-glow': 'rgba(236, 72, 153, 0.3)',
      '--text-primary': '#ffffff',
      '--text-secondary': '#f9a8d4',
      '--text-muted': 'rgba(249, 168, 212, 0.5)',
      '--text-dim': 'rgba(249, 168, 212, 0.3)',
      '--border-subtle': 'rgba(236, 72, 153, 0.15)',
      '--border-active': 'rgba(236, 72, 153, 0.4)',
    },
  },

  monochrome: {
    name: 'Đơn Sắc Hiện Đại',
    icon: '🤍',
    vars: {
      '--bg-primary': '#111111',
      '--bg-secondary': '#1a1a1a',
      '--bg-card': '#222222',
      '--bg-card-hover': '#2a2a2a',
      '--bg-overlay': 'rgba(10, 10, 10, 0.85)',
      '--accent-primary': '#888888',
      '--accent-secondary': '#aaaaaa',
      '--accent-tertiary': '#cccccc',
      '--accent-glow': 'rgba(136, 136, 136, 0.3)',
      '--text-primary': '#ffffff',
      '--text-secondary': '#cccccc',
      '--text-muted': 'rgba(204, 204, 204, 0.5)',
      '--text-dim': 'rgba(204, 204, 204, 0.3)',
      '--border-subtle': 'rgba(136, 136, 136, 0.15)',
      '--border-active': 'rgba(136, 136, 136, 0.4)',
    },
  },
};

class ThemeManager {
  constructor() {
    this.currentTheme = 'indigo';
    this.themes = HP_THEMES;
  }

  init() {
    const saved = localStorage.getItem('handplay_theme');
    if (saved && this.themes[saved]) {
      this.currentTheme = saved;
    }
    this.apply(this.currentTheme);
  }

  apply(themeId) {
    const theme = this.themes[themeId];
    if (!theme) return;

    this.currentTheme = themeId;

    const root = document.documentElement;
    for (const [varName, value] of Object.entries(theme.vars)) {
      root.style.setProperty(varName, value);
    }

    localStorage.setItem('handplay_theme', themeId);
  }

  getThemeId() {
    return this.currentTheme;
  }

  getTheme() {
    return this.themes[this.currentTheme];
  }

  getThemeList() {
    return Object.entries(this.themes).map(([id, theme]) => ({
      id,
      name: theme.name,
      icon: theme.icon,
      active: id === this.currentTheme,
    }));
  }

  getAccentColor() {
    return this.themes[this.currentTheme]?.vars['--accent-primary'] || '#6366f1';
  }
}

window.themeManager = new ThemeManager();
window.HP_THEMES = HP_THEMES;
