# 🎮 RPG Task Board — MVP

> **「一隻會喺你螢幕角落練功嘅任務板。」**

A VPET-style RPG Task Board overlay widget — lives in your screen corner, tracks daily quests, XP, and levels.

---

## ✨ Features

- **Three modes**: Mini (🐱 + EXP bar) / Compact (task list) / Full (complete interface)
- **Daily Quests**: Add, complete, delete tasks with difficulty ratings
- **RPG System**: EXP calculation, Level progression (50 × N^1.5 formula)
- **Persistence**: All data saved to localStorage across sessions
- **Dark Pixel Theme**: Retro 8-bit aesthetic with Press Start 2P font
- **Drag & Drop**: Freely position the overlay anywhere on screen
- **EXPP Floats**: "+EXP" floating animation on task completion
- **Level Up**: Visual celebration when leveling up

---

## 🏗️ Project Structure

```
rpg-taskboard/
├── src/
│   ├── App.tsx                      # Main entry
│   ├── App.css                      # Global styles + animations
│   ├── index.css                    # Tailwind imports
│   ├── types.ts                     # TypeScript types
│   ├── constants.ts                 # Game constants + formulas
│   ├── main.tsx                     # React mount
│   ├── components/
│   │   ├── Overlay.tsx              # Window manager (drag, resize, mode switch)
│   │   ├── MiniWidget.tsx           # Mini mode (🐱 + Level + EXP bar)
│   │   ├── CompactWidget.tsx        # Compact mode (task list)
│   │   ├── FullWidget.tsx           # Full mode (complete interface)
│   │   ├── TaskList.tsx             # Task list with checkboxes
│   │   ├── TaskInput.tsx            # New task form
│   │   ├── XPBar.tsx                # EXP bar component
│   │   └── LevelBadge.tsx           # Level badge component
│   ├── hooks/
│   │   ├── useTasks.ts              # Task CRUD + localStorage persistence
│   │   └── useXP.ts                 # EXP + Level calculation
│   └── utils/
│       └── tauri.ts                 # Tauri API wrapper (graceful fallback)
├── src-tauri/
│   ├── Cargo.toml
│   ├── build.rs
│   ├── tauri.conf.json              # Tauri config (frameless, transparent, AOT)
│   └── src/
│       ├── main.rs                  # Rust entry point
│       └── lib.rs                   # Tauri commands
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── tsconfig.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** or **pnpm**
- **Rust** (only needed for Tauri desktop build)
  - Install via [rustup.rs](https://rustup.rs/)
  - Required: `rustc`, `cargo`

### Development

```bash
# Install dependencies
cd rpg-taskboard
npm install

# Run Vite dev server (browser-only, no Tauri)
npm run dev
# → Opens at http://localhost:1420

# Run with Tauri desktop window
npm run tauri dev
# → Opens native frameless overlay window

# TypeScript check + build
npm run build
```

### Running in Browser (No Tauri)

The app works fully in a regular browser during development. The Tauri window features (frameless, transparent, always-on-top) are only active when running via `npm run tauri dev` or the built binary.

---

## 🎮 RPG System

### EXP by Difficulty

| Difficulty | EXP | Color |
|-----------|-----|-------|
| 🌱 Simple  | 10  | Green |
| ⚡ Medium  | 25  | Orange |
| 🎯 Hard    | 50  | Red |
| 🗡️ Epic   | 100 | Purple |

### Level Formula

```
EXP needed for Level N = 50 × N^1.5
```

| Level | EXP Needed |
|-------|-----------|
| 1→2   | 50 |
| 2→3   | 141 |
| 5→6   | 559 |
| 10→11 | 1,581 |
| 25→26 | 6,250 |

### Modes

| Mode | Size | Shows |
|------|------|-------|
| **Mini** | 200×60px | Cat emoji + Level + EXP bar |
| **Compact** | 250×300px | Level badge + EXP bar + task list |
| **Full** | 320×440px | Complete interface with task input, stats, and history |

Click the mode buttons (─ ▣ ☰) in the top-right corner to switch.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Desktop Framework** | Tauri v2 |
| **Frontend** | React 18 + TypeScript |
| **Build Tool** | Vite 6 |
| **Styling** | Tailwind CSS 3 |
| **Font** | Press Start 2P (Google Fonts) |
| **Persistence** | localStorage |
| **State** | React hooks (useState + useEffect) |

---

## 📝 License

MIT — feel free to use, modify, and share.
