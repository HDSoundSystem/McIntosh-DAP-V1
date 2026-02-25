# McIntosh DAP Inspired by DS200 — Premium Web Audio Player

A premium web-based audio player inspired by the iconic **McIntosh DS200 Network Player**, faithfully recreating its vacuum fluorescent display, rotary controls, and high-end aesthetic using modern web technologies.

![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-green)
![Version](https://img.shields.io/badge/version-1.5.0-blue)

![550108549-7bc36eb4-3abf-4167-862a-a5e87df7afc9](https://github.com/user-attachments/assets/357fae73-8242-4ad4-ab8f-7c5d6351a1a8)
<img width="1838" height="711" alt="1" src="https://github.com/user-attachments/assets/27ace9a8-dd30-4552-b04d-054ed2e39457" />
---

## Overview

McIntosh DS200 is a fully functional audio player available both as a **web app** (runs entirely in the browser) and as a **native desktop application** built with Electron. It simulates the premium hardware experience of McIntosh Laboratory components — complete with an authentic VFD display, real-time spectrum analysis, tone controls, and a meticulously crafted brushed-metal interface.

No backend. No framework. Open `index.html` in a browser, or run the Electron app for full OS integration including multimedia keyboard shortcuts and Windows taskbar controls.

---

## Features

### File Loading

- **Click to Load** — Click the **INPUT** rotary knob to open a file picker
- **Drag & Drop** — Drag one or more audio files directly onto the interface; a full-screen overlay confirms the action and playback starts automatically
- **Multi-format Support** — MP3, FLAC, WAV, MP4
- **Batch Import** — Load an entire folder of tracks at once into the playlist

### Playback Controls

- **Play / Pause / Stop** — Standard transport buttons with a tactile press animation
- **Previous / Next Track** — Single click to skip; hold for fast seek (3-second intervals)
- **Shuffle** — Randomized track selection, never repeating the current track
- **Repeat Modes** — Cycle through: Off → Repeat One → Repeat All
- **A-B Loop** — Define two precise loop points for focused listening or practice:
  - First press: set point A (`A–`)
  - Second press: set point B (`A-B`, loop activates)
  - Third press: clear the loop
- **Clickable Time Display** — Toggle between elapsed (`00:00`) and remaining (`-00:00`) time

### VFD Display

The **800×300px** vacuum fluorescent display simulation includes:

| Zone | Content |
|------|---------|
| Top left | Track counter (`3/12`), format (`FLAC`), estimated bitrate (`1411 KBPS`) |
| Top center | Volume or tone level overlay (fades after 1.5s) |
| Top right | Playback time with status icon and mode indicators |
| Center | Track title — **dynamically scaled** to always fit the display |
| Sub-line | Artist and album metadata |
| Bottom | 8-band real-time spectrum analyzer |

- **Dynamic Title Sizing** — The track title automatically reduces its font size (from 30px down to 12px) to fit long filenames without truncation
- **Display Power Toggle** — Turn the VFD on/off while maintaining playback; a green LED reflects the state
- **Power-Off State** — All display elements fade out cleanly

### Spectrum Analyzer

- Real-time **8-band frequency analysis** from 20Hz to 15kHz
- Segmented, color-coded VU-style bars:
  - **Cyan** — normal levels
  - **Orange** — elevated levels (>55%)
  - **Red** — peak levels (>75%)
- Rendered at **60fps** via `requestAnimationFrame` on a Canvas element
- Labels: 20 · 60 · 150 · 400 · 1k · 2.5k · 6k · 15kHz

### Audio Processing

All processing is handled via the **Web Audio API** with the following signal chain:

```
Audio Source → Bass Filter (200Hz) → Treble Filter (3000Hz) → Analyzer (FFT 64) → Output
```

- **Bass** — Low-shelf EQ filter, ±10dB in 2dB steps
- **Treble** — High-shelf EQ filter, ±10dB in 2dB steps
- **Tone Reset** — Returns both filters to flat (0dB) in one click
- **Volume** — Hardware-accurate rotary knob with physical rotation feedback; initialized at **5%** on startup
- **Mute** — Instant mute/unmute; LED indicator reflects state; volume display shows `MUTE`

### Playlist Management

- Track counter is **clickable** — opens a full playlist modal
- Each track is selectable directly from the list
- Current track is highlighted in the playlist
- Playlist persists through track changes and repeat/shuffle modes

### Metadata & Album Art

- Reads **ID3 tags** via `jsmediatags` (title, artist, album, embedded artwork)
- Falls back gracefully to filename if tags are absent
- **Album art** is displayed full-screen when the track title is clicked
- **Media Session API** integration — exposes metadata and controls to the OS (lock screen, system media bar)

### Interface & Hardware Design

- **Rotary Volume Knob** — Click left half to decrease, right half to increase; knob visually rotates to match exact volume level, including on startup
- **Silver Side Trims** — Brushed aluminum panels positioned *above* the chassis border, with configurable height and vertical offset via CSS variables
- **Options Popup** — Floating panel for Shuffle, Repeat, A-B, and Tone controls; closes on outside click
- **Standby Button** — Red button triggers a clean application reload

### Desktop App (Electron)

- **Multimedia Keyboard Shortcuts** — Play/Pause, Next, Previous keys work system-wide, even when the app is in the background
- **Windows Taskbar Controls** — Thumbnail toolbar with ⏮ / ▶⏸ / ⏭ buttons directly in the Windows taskbar preview; icon updates live with playback state
- **"Open With" Support** — Associate audio files (MP3, FLAC, WAV, MP4, M4A, AAC, OGG) with the app; double-clicking a file or dragging it onto the app icon loads and plays it immediately
- **Single Instance** — A second launch passes its files to the running instance instead of opening a new window
- **Portable Build** — Packages as a single `.exe` with no installation required (via `electron-builder`)

---

## Getting Started

### Requirements

A modern browser with Web Audio API support:

| Browser | Minimum Version |
|---------|----------------|
| Chrome / Edge | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Opera | 76+ |

For the desktop app: **Node.js 18+** and **npm**.

### Running in the Browser

1. Download or clone this repository
2. Open `index.html` in your browser — no server required

### Running as a Desktop App (Electron)

```bash
npm install
npm start
```

### Building a Portable Windows Executable

```bash
npm run dist
```

The output `.exe` will be in the `dist/` folder — no installation required.

```
McIntosh-DAP-DS200/
├── index.html
├── style.css
├── script.js
├── main.js              # Electron main process
├── package.json
├── manifest.json
├── README.md
├── LICENSE
├── img/
│   ├── logo_ref.png
│   ├── logo_b.png
│   └── favicon.png
├── windows/             # Taskbar button icons
│   ├── play.png
│   ├── pause.png
│   ├── prev.png
│   └── next.png
└── fontawesome7/
```

### Installing as a PWA

1. Open the app in Chrome or Edge
2. Click the install icon in the address bar
3. The app installs as a standalone window with no browser chrome

---

## Usage Guide

### Loading Music

| Method | How |
|--------|-----|
| File picker | Click the **INPUT** knob |
| Drag & Drop | Drag audio files onto the player window |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `←` | Previous track |
| `→` | Next track |
| `Escape` | Close modals |

### Options Menu

Click **OPTIONS** to access:

- **RANDOM** — Shuffle mode (blue glow when active)
- **REPEAT** — Repeat mode (blue glow, label changes: `REPEAT 1` / `REPEAT ALL`)
- **A-B** — Loop points (orange glow when set)
- **BASS − / BASS +** — ±10dB, displayed live on VFD
- **TREBLE − / TREBLE +** — ±10dB, displayed live on VFD
- **RESET** — Flat EQ

---

## Customization

All visual and audio parameters are easily adjustable.

### CSS Variables

```css
:root {
    --mc-green: #0dd90d;         /* Labels and LEDs */
    --mc-blue: #33ccff;          /* VFD text and spectrum */
    --mc-gold: #786b46;          /* Accent lines and labels */
    --vfd-background: #020502;   /* VFD screen background */

    --trim-height: 670px;        /* Side trim total height */
    --trim-top: -10px;           /* Side trim vertical offset */
}
```

### Default Volume

```javascript
audio.volume = 0.05; // 5% — adjust range: 0.0 to 1.0
```

### Seek Speed

```javascript
const SEEK_STEP = 3; // Seconds per fast-seek interval
```

### EQ Filter Frequencies

```javascript
bassFilter.frequency.value = 200;    // Hz — low-shelf center
trebleFilter.frequency.value = 3000; // Hz — high-shelf center
```

### Spectrum Analyzer Resolution

```javascript
analyser.fftSize = 64; // Options: 32, 64, 128, 256, 512
```

---

## Technical Stack

| Technology | Usage |
|-----------|-------|
| HTML5 Audio API | Core playback engine |
| Web Audio API | EQ filters and spectrum analysis |
| Canvas API | Real-time spectrum visualizer |
| MediaSession API | OS-level media controls |
| jsmediatags 3.9.5 | ID3 tag / metadata extraction |
| Electron 26 | Desktop app wrapper, IPC, global shortcuts |
| electron-builder | Portable Windows executable packaging |
| Font Awesome 7 | UI icons |
| Google Fonts — Bitcount Single | VFD digital display |
| Google Fonts — Roboto 300 | UI labels |
| CSS3 | Gradients, animations, brushed-metal effects |

---

## Known Limitations

- Bitrate is estimated from file size ÷ duration (not read from the container)
- Web Audio API requires a user interaction before the first play (browser security policy)
- Fast seek uses fixed 3-second jumps, not continuous scrubbing
- Spectrum analyzer is a frequency analyzer, not a true VU/PPM meter
- Recommended playlist size: ≤ 100 tracks for optimal UI responsiveness

---

## Credits

**Author** — Yohann Zaoui  
**Design Inspiration** — McIntosh Laboratory, Inc.  
**Icon Library** — Font Awesome 7  
**Metadata Parser** — jsmediatags 3.9.5  
**Desktop Framework** — Electron / electron-builder

---

## License

This project is released for educational and personal use. McIntosh is a registered trademark of McIntosh Laboratory, Inc. This project is not affiliated with or endorsed by McIntosh Laboratory.

---

## Changelog

### v1.2
- **Electron desktop app** — full native Windows support
- **Multimedia keyboard shortcuts** — Play/Pause, Next, Previous keys handled via `globalShortcut` (work system-wide)
- **Windows taskbar controls** — thumbnail toolbar with live ▶/⏸ icon update via IPC
- **"Open With" integration** — associate audio files with the app; files passed at launch or from a second instance are routed to the running player
- **Portable build** — single `.exe` output via `electron-builder`
- **IPC bridge** — `main.js` ↔ `script.js` communication for all media controls and file loading

### v1.1
- Drag & Drop file loading with animated overlay
- Dynamic title font scaling — no more truncation on long filenames
- Volume knob initialized with correct physical rotation at startup (5%)
- Side trims repositioned above chassis border with configurable CSS variables (`--trim-height`, `--trim-top`)
- Refined button design — lacquered, beveled style with press animation

### v1.0 — Initial Release
- Full playback engine with playlist support
- Real-time 8-band spectrum analyzer
- VFD display simulation with authentic McIntosh aesthetics
- Options popup (Shuffle, Repeat, A-B Loop, Bass, Treble, Reset)
- Media Session API integration
- Progressive Web App support
- Hoverable volume and tone level overlays
- Clickable time display (elapsed / remaining toggle)
- Album art full-screen viewer

---

*Experience premium audio — browser-native or desktop.*
