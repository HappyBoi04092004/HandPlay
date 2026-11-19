/* ========================================
   HANDPLAY — Constants
   Developed by Erick de S.C. Araujo + IA
   ======================================== */

const HP = {
  VERSION: '1.0.0',

  COLORS: {
    ACCENT: '#6366f1',
    ACCENT_LIGHT: '#818cf8',
    ACCENT_LIGHTER: '#a5b4fc',
    BG_PRIMARY: '#0a0a1a',
    SUCCESS: '#22c55e',
    WARNING: '#eab308',
    ERROR: '#ef4444',
    WHITE: '#ffffff',
    TEXT_SECONDARY: '#a5b4fc',
    TEXT_MUTED: 'rgba(165, 180, 252, 0.5)',
  },

  GESTURES: {
    NONE: 'none',
    HAND_DETECTED: 'hand_detected',
    HAND_LOST: 'hand_lost',
    POINT: 'point',
    PINCH_START: 'pinch_start',
    PINCH: 'pinch',
    PINCH_END: 'pinch_end',
    OPEN_HAND: 'open_hand',
    FIST: 'fist',
    SWIPE_LEFT: 'swipe_left',
    SWIPE_RIGHT: 'swipe_right',
    SWIPE_UP: 'swipe_up',
    SWIPE_DOWN: 'swipe_down',
    HAND_MOVE: 'hand_move',
    TWO_HANDS: 'two_hands',
  },

  CURSOR_STATES: {
    IDLE: 'idle',
    HOVER: 'hover',
    PRESSED: 'pressed',
    DRAGGING: 'dragging',
  },

  GAME_STATES: {
    LOADING: 'loading',
    READY: 'ready',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    RESULT: 'result',
  },

  PERFORMANCE_LEVELS: {
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
  },

  CAMERA_DEFAULTS: {
    WIDTH: 1280,
    HEIGHT: 720,
    FPS: 30,
  },

  SMOOTHING: {
    POSITION: 0.35,
    VELOCITY: 0.4,
    CURSOR: 0.25,
  },

  SWIPE_THRESHOLD: 0.12,
  SWIPE_TIME_WINDOW: 400,

  PINCH_THRESHOLD: 0.07,
  PINCH_RELEASE_THRESHOLD: 0.1,
  FIST_THRESHOLD: 0.08,

  LANDMARKS: {
    WRIST: 0,
    THUMB_CMC: 1,
    THUMB_MCP: 2,
    THUMB_IP: 3,
    THUMB_TIP: 4,
    INDEX_MCP: 5,
    INDEX_PIP: 6,
    INDEX_DIP: 7,
    INDEX_TIP: 8,
    MIDDLE_MCP: 9,
    MIDDLE_PIP: 10,
    MIDDLE_DIP: 11,
    MIDDLE_TIP: 12,
    RING_MCP: 13,
    RING_PIP: 14,
    RING_DIP: 15,
    RING_TIP: 16,
    PINKY_MCP: 17,
    PINKY_PIP: 18,
    PINKY_DIP: 19,
    PINKY_TIP: 20,
  },

  HAND_CONNECTIONS: [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [0, 9], [9, 10], [10, 11], [11, 12],
    [0, 13], [13, 14], [14, 15], [15, 16],
    [0, 17], [17, 18], [18, 19], [19, 20],
    [5, 9], [9, 13], [13, 17],
  ],

  GAMES: {
    puzzle: {
      id: 'puzzle',
      name: 'Xếp Hình Cử Chỉ',
      icon: '🧩',
      desc: 'Ghép tranh bằng cử chỉ chụm và kéo thả',
    },
    targetHunter: {
      id: 'targetHunter',
      name: 'Thợ Săn Mục Tiêu',
      icon: '🎯',
      desc: 'Nhắm bắn mục tiêu chuẩn xác bằng ngón tay',
    },
    balloonPop: {
      id: 'balloonPop',
      name: 'Bắn Bóng Bay',
      icon: '🎈',
      desc: 'Chạm và làm nổ bóng bay trước khi bay mất',
    },
    airPong: {
      id: 'airPong',
      name: 'Bóng Bàn Không Khí',
      icon: '🏓',
      desc: 'Bóng bàn đối kháng điều khiển bằng bàn tay',
    },
    memoryHands: {
      id: 'memoryHands',
      name: 'Trí Nhớ Siêu Phàm',
      icon: '🧠',
      desc: 'Lật và ghép các cặp thẻ bài bằng cử chỉ',
    },
    dodgeHand: {
      id: 'dodgeHand',
      name: 'Né Tránh Chướng Ngại',
      icon: '🏃',
      desc: 'Di chuyển lòng bàn tay để né tránh vật cản',
    },
    airRunner: {
      id: 'airRunner',
      name: 'Đường Chạy Không Gian',
      icon: '💨',
      desc: 'Chạy vô tận, nhảy và cúi né bằng cử chỉ tay',
    },
    airDraw: {
      id: 'airDraw',
      name: 'Vẽ Tranh Trên Không',
      icon: '🎨',
      desc: 'Tự do vẽ tranh giữa không trung bằng ngón tay',
    },
  },

  DEFAULT_SETTINGS: {
    camera: {
      deviceId: 'default',
      width: 1280,
      height: 720,
      fps: 30,
      mirrored: true,
    },
    graphics: {
      quality: 'high',
      particles: true,
      showLandmarks: false,
    },
    audio: {
      masterVolume: 0.7,
      sfxVolume: 0.8,
      musicVolume: 0.5,
      enabled: true,
    },
    gestures: {
      sensitivity: 0.5,
      smoothing: 0.35,
      swipeThreshold: 0.12,
    },
    performance: {
      targetFps: 60,
      adaptiveQuality: true,
    },
  },
};

if (typeof module !== 'undefined') {
  module.exports = HP;
}
