<div align="center">

# 🖐️ HandPlay

### Gesture-Controlled Computer Vision Mini-Games

**A desktop platform where your hands ARE the controller.**

Built with **MediaPipe**, **Electron**, **WebAssembly** and **Canvas 2D** — powered by real-time hand landmark detection and gesture recognition.

*Developed by* **Erick de S.C. Araújo + IA**

---

![Version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)
![Platform](https://img.shields.io/badge/platform-Windows-lightgrey?style=for-the-badge)
![Electron](https://img.shields.io/badge/Electron-28-47848F?style=for-the-badge&logo=electron&logoColor=white)
![MediaPipe](https://img.shields.io/badge/MediaPipe%20Tasks%20Vision-1.0.1-FF6F00?style=for-the-badge&logo=google&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![WebAssembly](https://img.shields.io/badge/WebAssembly-WASM-654FF0?style=for-the-badge&logo=webassembly&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-CSS3-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Canvas2D](https://img.shields.io/badge/Canvas%202D-Rendering-000000?style=for-the-badge)

</div>

---

## 🌟 Overview

HandPlay is a **desktop application** that transforms your webcam into a game controller. Using **real-time Computer Vision**, **Gesture Recognition**, and **AI-powered hand tracking**, you can play 8 mini-games without touching your keyboard or mouse.

The application runs entirely **offline** — all processing happens on your device. No images, video, or hand data are ever sent to any server.

### Key Features

| Feature | Description |
|---------|-------------|
| 🤚 **Real-Time Hand Tracking** | 21-landmark hand detection at 60 FPS via MediaPipe |
| 🎮 **8 Mini-Games** | Each with unique gesture controls and scoring |
| ✋ **Gesture Recognition** | 6+ gesture types detected from hand landmarks |
| 🖱️ **Virtual Cursor** | Index finger controls a smooth on-screen cursor |
| 📊 **Tracking Lab** | Real-time FPS, latency, and confidence metrics |
| 🎓 **Training Mode** | Practice gestures with visual feedback |
| 🏆 **Leaderboard** | Local high scores with animated rankings |
| 🎨 **7 Themes** | Customizable color schemes |
| ⌨️ **Fallback Controls** | Keyboard/mouse mode when no camera is available |

---

## 🔬 Techniques & Technologies

### 1. Computer Vision Pipeline (Hand Tracking)

The core of HandPlay is a **real-time computer vision pipeline** that processes webcam frames and extracts hand skeletal data.

#### How It Works

```
┌─────────────────────────────────────────────────────────────────────┐
│                    COMPUTER VISION PIPELINE                         │
│                                                                     │
│  ┌──────────┐   ┌──────────────┐   ┌────────────┐   ┌───────────┐ │
│  │  Webcam   │──▶│  MediaPipe   │──▶│  Landmark  │──▶│  Gesture  │ │
│  │  1280×720 │   │  Hand        │   │  21 Points │   │  Engine   │ │
│  │  @ 30 FPS │   │  Landmarker  │   │  × 2 Hands │   │  6 Types  │ │
│  └──────────┘   └──────────────┘   └────────────┘   └───────────┘ │
│       │                │                  │                │        │
│       ▼                ▼                  ▼                ▼        │
│  Raw Pixels     GPU Inference     Normalized Coords    Events     │
│                 (WASM + WebGL)     + Smoothing          + Cursor   │
└─────────────────────────────────────────────────────────────────────┘
```

**Processing stages:**

1. **Frame Acquisition** — Camera captures raw video frames at 1280×720, 30 FPS
2. **Hand Detection** — MediaPipe HandLandmarker runs GPU-accelerated inference via WebAssembly + WebGL 2.0
3. **Landmark Extraction** — 21 3D landmarks per hand (x, y, z normalized coordinates)
4. **Coordinate Normalization** — Landmarks normalized relative to wrist position (translation/scale invariant)
5. **Temporal Smoothing** — Exponential Moving Average filter reduces jitter
6. **Velocity Calculation** — Frame-to-frame displacement for swipe detection
7. **Gesture Classification** — Rule-based classifier on normalized landmark geometry
8. **Event Dispatch** — Gesture events dispatched to active game

---

### 2. Hand Landmark Detection

HandPlay uses **MediaPipe HandLandmarker** from Google's Tasks Vision API to detect hand skeletal structure.

#### The 21-Landmark Hand Model

Each hand is represented by **21 keypoints** based on anatomical finger joints:

```
        8   12  16  20        ← Fingertips (TIP)
        |   |   |   |
        7   11  15  19        ← Distal (DIP)
        |   |   |   |
        6   10  14  18        ← Proximal (PIP)
        |   |   |   |
        5    9  13  17        ← Metacarpal (MCP)
        \   |   |   /
         ---+---+---          ← Palm
             |
             0               ← Wrist
```

| Landmark Index | Name | Role in Gesture Detection |
|:---:|---------|--------------------------|
| 0 | Wrist | Reference point for normalization |
| 4 | Thumb Tip | Pinch detection (distance to Index Tip) |
| 5 | Index MCP | Finger extension calculation |
| 6 | Index PIP | Finger extension calculation |
| 8 | Index Tip | **Primary cursor position** |
| 9 | Middle MCP | Palm center calculation |
| 12 | Middle Tip | Open hand detection |
| 13 | Ring MCP | Fist detection |
| 16 | Ring Tip | Open hand detection |
| 17 | Pinky MCP | Fist detection |
| 20 | Pinky Tip | Open hand detection |

#### Technical Details

- **Model:** MediaPipe Hand Landmarker (TFLite format, 7.8 MB)
- **Inference:** WebGL 2.0 GPU acceleration via WebAssembly
- **Resolution:** Input frames processed at native camera resolution (1280×720)
- **Latency:** ~5-15ms per frame on modern GPUs
- **Fallback:** CPU delegate available for systems without WebGL 2.0

---

### 3. Gesture Recognition Engine

HandPlay implements a **rule-based gesture classifier** that operates on normalized hand landmarks. The engine uses geometric relationships between landmarks to identify 6+ distinct gesture types.

#### Gesture Types & Detection Algorithms

| Gesture | Algorithm | Detection Criteria |
|---------|-----------|-------------------|
| **POINT** 👆 | Finger extension analysis | Index extended, middle/ring/pinky folded |
| **PINCH** 🤏 | Euclidean distance | Thumb-Index distance < 0.07 (normalized) |
| **FIST** ✊ | Wrist-relative distance | 3+ fingertips closer to wrist than MCPs |
| **OPEN HAND** 🖐️ | Wrist-relative distance | 3+ fingertips farther from wrist than MCPs |
| **SWIPE** 👉 | Velocity threshold | Index finger displacement > 0.12 in < 400ms |
| **TWO HANDS** 🤟 | Count detection | ≥ 2 hand landmark sets detected |
| **HAND MOVE** ✋ | Continuous tracking | Any hand detected (emitted every frame) |

#### Pinch Detection (with hysteresis)

The pinch gesture uses **hysteresis** to prevent rapid on/off toggling:

```
Pinch ON:   thumbIndexDistance < 0.07  (PINCH_THRESHOLD)
Pinch OFF:  thumbIndexDistance > 0.10  (PINCH_RELEASE_THRESHOLD)
```

This gap between activation and deactivation thresholds prevents flickering at the boundary.


---

### 4. Signal Processing & Smoothing

Raw hand landmarks exhibit jitter due to detection noise. HandPlay applies **signal processing** techniques to stabilize the data.

#### Exponential Moving Average (EMA) Filter

The **smoothing factor** (α = 0.35) controls the trade-off:
- **Lower α** → smoother but more latency
- **Higher α** → responsive but more jittery

#### Wrist-Relative Normalization

To make gesture detection **invariant to hand position and scale**, landmarks are normalized relative to the wrist:

This normalization ensures gestures are detected the same way regardless of:
- Where the hand is in the frame (translation invariance)
- How close/far the hand is from the camera (scale invariance)

#### Velocity Calculation

Frame-to-frame velocity enables swipe detection and momentum-based interactions:

---

### 5. Virtual Cursor System

The virtual cursor maps hand position to screen coordinates with **interpolation** for smooth movement.

#### Coordinate Mapping

```
Hand Landmark (normalized 0..1) ──▶ Screen Pixel (0..windowWidth)
         │                                    │
    Smoothed                              Cursor Position
    (EMA α=0.15)                          (CSS transform)
```

#### Cursor States

| State | Trigger | Visual |
|-------|---------|--------|
| **IDLE** | No hand / generic hand | Default dot |
| **HOVER** | Point gesture over interactive element | Glowing ring |
| **PRESSED** | Pinch gesture | Compressed ring |
| **DRAGGING** | Pinch + movement | Trailing animation |

#### Trail Rendering

The cursor leaves a **fading trail** on the canvas, providing visual feedback for movement velocity and direction:

---

### 6. WebAssembly Runtime

MediaPipe's hand detection model runs via **WebAssembly (WASM)** with WebGL 2.0 acceleration.

#### WASM Stack

```
┌──────────────────────────────────────┐
│         HandLandmarker Model          │
│         (TFLite, 7.8 MB)             │
├──────────────────────────────────────┤
│      MediaPipe Vision Runtime         │
│      (WASM + WebGL 2.0)              │
├──────────────────────────────────────┤
│    Emscripten Filesystem Layer        │
│    (virtual FS for model loading)     │
├──────────────────────────────────────┤
│         Chromium V8 Engine            │
│         (Electron Renderer)           │
└──────────────────────────────────────┘
```

#### Files

| File | Size | Purpose |
|------|------|---------|
| `vision_bundle.js` | 155 KB | MediaPipe JS API |
| `vision_wasm_internal.wasm` | 11.2 MB | WASM binary (SIMD) |
| `vision_wasm_nosimd_internal.wasm` | 10.5 MB | WASM binary (no SIMD) |
| `hand_landmarker.task` | 7.8 MB | TFLite model weights |

---

### 7. Audio DSP & Procedural Sound

HandPlay uses the **Web Audio API** for sound effects and music, with a **procedural fallback** system.

#### Audio Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  WAV Files   │────▶│  AudioBuffer │────▶│  GainNode    │──▶ Output
│  (preloaded) │     │  (decoded)   │     │  (volume)    │
└──────────────┘     └──────────────┘     └──────────────┘
                                                   │
                                             ┌─────┴─────┐
                                             │ SFX Gain  │
                                             │ Music Gain│
                                             └───────────┘
```

#### Procedural Fallback

When WAV files are unavailable, sounds are generated using **oscillator synthesis**:

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ELECTRON MAIN PROCESS                           │
│   ┌─────────────┐  ┌───────────┐  ┌──────────────────────────┐    │
│   │  Window      │  │  IPC      │  │  File System             │    │
│   │  Management  │  │  Bridge   │  │  (Settings, Records)     │    │
│   └──────┬──────┘  └─────┬─────┘  └──────────────────────────┘    │
│          │ contextBridge  │                                         │
├──────────┴────────────────┴────────────────────────────────────────┤
│                     RENDERER PROCESS (Sandboxed)                    │
│                                                                     │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │  Camera       │  │  Hand Tracking    │  │  Gesture Recognition │  │
│  │  Manager      │─▶│  (MediaPipe)      │─▶│  Engine              │  │
│  │  (getUserMedia│  │  (21 landmarks)   │  │  (6+ gesture types)  │  │
│  │   + Canvas)   │  │  GPU via WASM     │  │  Event-based API     │  │
│  └──────────────┘  └──────────────────┘  └──────────┬───────────┘  │
│                                                      │              │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────┴───────────┐  │
│  │  Renderer     │  │  Game Engine     │◀─│  Virtual Cursor       │  │
│  │  (Canvas 2D)  │  │  (8 games)      │  │  (Smooth + Trail)     │  │
│  │  4-layer      │  │  (State Machine) │  │  DOM + Canvas hybrid  │  │
│  └──────────────┘  └──────────────────┘  └──────────────────────┘  │
│                                                                     │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │  Audio        │  │  Score            │  │  Settings            │  │
│  │  Manager      │  │  Manager          │  │  Manager             │  │
│  │  (Web Audio)  │  │  (localStorage)   │  │  (IPC + File)        │  │
│  └──────────────┘  └──────────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Webcam Frame (1280×720 @ 30 FPS)
        │
        ▼
┌─────────────────────┐
│ MediaPipe detectForVideo() │  ← GPU-accelerated WASM inference
│ Latency: ~5-15ms           │
└────────────┬────────┘
             │
             ▼
┌─────────────────────┐
│ Raw Landmarks        │  ← 21 points × 2 hands × 3 coords (x,y,z)
│ [{x, y, z}, ...]     │
└────────────┬────────┘
             │
        ┌────┴────┐
        ▼         ▼
┌──────────┐ ┌────────────┐
│ Smooth   │ │ Normalize  │
│ (EMA)    │ │ (Wrist-ref)│
└────┬─────┘ └─────┬──────┘
     │              │
     ▼              ▼
┌──────────┐ ┌────────────┐
│ Velocity │ │ Gesture    │
│ Calc     │ │ Classify   │
└────┬─────┘ └─────┬──────┘
     │              │
     └──────┬───────┘
            ▼
┌─────────────────────┐
│  Game Input Events   │  ← pinch_start, point, swipe_up, etc.
│  + Virtual Cursor    │
└─────────────────────┘
```

---

## 🎮 Mini-Games

All 8 games are gesture-controlled. Each game extends a common `Game` base class and receives hand data through the engine's event system.

| # | Game | Controls | Description |
|:-:|------|----------|-------------|
| 🧩 | **Gesture Puzzle** | Pinch + Drag | Complete a sliding puzzle by pinching and dragging pieces |
| 🎯 | **Target Hunter** | Point + Pinch | Move crosshair with index finger, pinch to hit targets |
| 🎈 | **Balloon Pop** | Touch / Open Hand | Touch floating balloons to pop them before they escape |
| 🏓 | **Air Pong** | Hand Position | Control paddle height with your hand position |
| 🃏 | **Memory Hands** | Pinch | Flip and match cards using pinch gestures |
| 🏃 | **Dodge Hand** | Palm Position | Move your palm to dodge obstacles |
| 💨 | **Air Runner** | Swipe + Gestures | Swipe up to jump, fist to duck in an endless runner |
| ✏️ | **Air Draw** | Free Drawing | Draw in the air with your index finger |

### Game Engine

```
┌─────────────────────────────────────────────────────────┐
│                    GAME ENGINE                           │
│                                                          │
│  State Machine:                                          │
│  ┌────────┐  ┌────────┐ ┌──────────┐ ┌────────────┐    │
│  │ LOADING│─▶│ READY  │─▶│ PLAYING  │─▶│ GAME_OVER │    │
│  └────────┘  └────────┘ └──────────┘ └────────────┘    │
│                        │                │                │
│                   ┌────┴────┐     ┌─────┴─────┐        │
│                   │  PAUSED │     │  RESULT   │        │
│                   └─────────┘     └───────────┘        │
│                                                          │
│  Per-Frame:                                              │
│  1. update(dt)    → game logic                          │
│  2. render()      → draw to Canvas 2D                   │
│  3. handleGesture → receive gesture events              │
│  4. handleHands   → receive raw hand positions          │
└─────────────────────────────────────────────────────────┘
```

### Rendering Pipeline (4-Layer Canvas)

```
Layer 4 (z-index: 100)  ─── #cursor-canvas  ─── Virtual cursor + trail
Layer 3 (z-index: 56)   ─── #game-canvas     ─── Game-specific graphics
Layer 2 (z-index: 55)   ─── #hand-canvas     ─── Hand landmarks + connections
Layer 1 (z-index: 1)    ─── #camera-canvas   ─── Webcam feed (0.7 opacity)
```

---

## 📦 Installation & Usage

### Prerequisites

- **Node.js** 18+
- **npm**
- **Webcam** (USB or built-in)

### First Launch

1. Run the application
2. Click **"Enable Camera"** on the permission overlay
3. Grant camera access when prompted by the browser
4. Wait for the `HandTracking: ready!` message (shown in console via F12)
5. Navigate the menu using hand gestures or mouse
6. Click **PLAY** → Select a game → Choose difficulty → Play!

### Gesture Quick Reference

| Gesture | How To | Action |
|---------|--------|--------|
| 👆 **Point** | Extend index finger only | Move cursor |
| 🤏 **Pinch** | Touch thumb to index | Click / Select |
| ✊ **Fist** | Close all fingers | Duck / Special |
| 🖐️ **Open Hand** | Spread all fingers | Pause / Reset |
| 👉 **Swipe** | Quick horizontal/vertical movement | Navigate / Jump |

---

## ⚡ Performance

### Benchmarks

| Metric | Target | Achieved |
|--------|--------|----------|
| Hand Tracking FPS | 30 FPS | 45-60 FPS (GPU) |
| Inference Latency | < 20 ms | 5-15 ms |
| Gesture Detection | < 5 ms | ~1 ms |
| Game Render | 60 FPS | 60 FPS |
| Memory Usage | < 500 MB | ~300 MB |

### Adaptive Quality System

The application monitors FPS and automatically adjusts quality:

### Optimization Techniques

- **Exponential Moving Average** — Smooths jitter without adding latency
- **Object Pooling** — Particle system reuses objects to avoid GC
- **Canvas Layering** — 4 separate canvases avoid full redraws
- **RequestAnimationFrame** — Syncs to display refresh rate
- **Lazy Loading** — Game scripts loaded on demand
- **WASM + WebGL** — GPU-accelerated inference

---

## 🔒 Security & Privacy

### Security Model

| Setting | Value | Purpose |
|---------|-------|---------|
| `contextIsolation` | `true` | Prevents renderer from accessing Node.js APIs |
| `nodeIntegration` | `false` | Blocks require() in renderer process |
| `sandbox` | `false` | Required for MediaPipe WASM runtime |
| `webSecurity` | `false` | Required for local file:// resource loading |
| CSP Policy | `script-src 'self' 'unsafe-inline' 'unsafe-eval' file:` | Allows WASM compilation |
| Navigation | Blocked | `will-navigate` prevented on all contents |
| New Windows | Blocked | `setWindowOpenHandler` returns `action: deny` |

### Privacy Guarantee

> 🔒 **Your camera is processed locally.** No images, video, or hand data are ever sent to any external server. All Computer Vision processing happens on your device. No analytics or telemetry is collected. The application works 100% offline after installation.

---

## 📊 Data Science Techniques Summary

| Technique | Application | Library/Method |
|-----------|-------------|----------------|
| **Convolutional Neural Network** | Hand landmark detection | MediaPipe HandLandmarker (TFLite) |
| **GPU Acceleration** | Real-time inference | WebGL 2.0 via WebAssembly |
| **Exponential Moving Average** | Signal smoothing | Custom implementation |
| **Euclidean Distance** | Pinch detection | `Math.hypot(dx, dy)` |
| **Coordinate Normalization** | Translation/scale invariance | Wrist-relative normalization |
| **Velocity Estimation** | Swipe detection | Frame-to-frame displacement |
| **Sliding Window** | Temporal gesture analysis | 400ms position buffer |
| **Rule-Based Classification** | Gesture identification | Geometric landmark relationships |
| **Procedural Audio Generation** | Sound effect synthesis | Web Audio API OscillatorNode |
| **Adaptive Quality Control** | Performance monitoring | FPS-based quality adjustment |

---

## 📜 License

MIT License — Copyright (c) 2024 Erick de S.C. Araújo + IA

```
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software.
```
