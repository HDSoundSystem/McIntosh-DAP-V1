# McIntosh DAP Inspired by DS200 — Premium Web Audio Player

A premium web-based audio player inspired by the iconic **McIntosh DS200 Network Player**, faithfully recreating its vacuum fluorescent display, rotary controls, and high-end aesthetic using modern web technologies.

[![McIntosh_Logo](https://github.com/user-attachments/assets/546956b6-126e-48e9-b088-475e840d1fee)](https://private-user-images.githubusercontent.com/251354389/550108549-7bc36eb4-3abf-4167-862a-a5e87df7afc9.jpg?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NzE4MzI2NDcsIm5iZiI6MTc3MTgzMjM0NywicGF0aCI6Ii8yNTEzNTQzODkvNTUwMTA4NTQ5LTdiYzM2ZWI0LTNhYmYtNDE2Ny04NjJhLWE1ZTg3ZGY3YWZjOS5qcGc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjYwMjIzJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI2MDIyM1QwNzM5MDdaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT00MGU0Njk3YTUzOTU4N2M3OWE2MTYzODdhOTk0N2JlNWVjYTQ2M2Q0ZmQ5MTcyM2FkNjZlMTgwODU4NDRmMDMzJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.5Foa0Yu-eO3kymH0DxqTDuViOlvTiXzU3RXshyan6Ok)

<img width="1873" height="736" alt="McIntosh DS200 Web Player" src="https://github.com/user-attachments/assets/b70487b7-394e-453c-8476-df538f7c4c79" />

---

## Overview

McIntosh DS200 is a fully functional, zero-dependency web audio player that runs entirely in the browser. It simulates the premium hardware experience of McIntosh Laboratory components — complete with an authentic VFD display, real-time spectrum analysis, tone controls, and a meticulously crafted brushed-metal interface.

No installation required. No backend. No framework. Open `index.html` and play.

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

### Running the Application

1. Download or clone this repository
2. Open `index.html` in your browser — no server required

```
McIntosh-DAP-DS200/
├── index.html
├── style.css
├── script.js
├── manifest.json
├── README.md
├── LICENSE
├── img/
│   ├── logo_ref.png
│   ├── logo_b.png
│   └── favicon.png
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

---

## License

This project is released for educational and personal use. McIntosh is a registered trademark of McIntosh Laboratory, Inc. This project is not affiliated with or endorsed by McIntosh Laboratory.

---

## Changelog

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

*Experience premium audio, browser-native.*
