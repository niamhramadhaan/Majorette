# JEMIMA

**Joint Engine Mini Media** — Open-source digital signage and media scheduling platform.

Schedule images, videos, and audio across multiple screens. Play them on dedicated player instances with fullscreen playback, background audio, and real-time dashboard control. Built for mini-theaters, cafes, retail displays, lobbies, churches, and event spaces.

---

## ◈ Features

### ◆ Multi-Screen Playback

- Assign schedules to specific screens from the dashboard, schedule builder, or Play Again modal
- Each screen runs independently at `/player/screen/:screenId`
- Per-screen controls: skip, pause, resume, mark done — all scoped via screen-specific signals
- Dashboard Now Playing carousel with per-screen view and controls
- Open Player dropdown lists all screens for quick access
- Default screen fallback — unassigned schedules play on the default screen automatically

### ◆ Smart Scheduling

- Drag-and-drop schedule builder with visual/audio/image support
- Loop mode (indefinite repeat) and Play Once mode (auto-marks done)
- Start time picker with past-time prevention
- Schedule status tracking: Ready / Now Playing / Done
- Play Again: recreate completed schedules with new start time and screen assignment
- Schedule table shows assigned screen(s) per schedule
- Sort by newest, oldest, or next play. Filter by status.

### ◆ Background Audio

- Attach audio tracks to play behind images or videos
- Bidirectional detection — audio before or after a visual item is auto-detected as background
- Continuous playback across multiple visual items until natural end
- Independent mute control — background audio plays regardless of mute state

### ◆ Accent Color Themes

- 8 preset themes: Emerald, Forest, Ocean, Royal, Crimson, Sunset, Rose, Slate
- Live preview in Settings — click a theme, see it change instantly
- Persists across sessions via localStorage
- Affects all UI elements: buttons, badges, progress bars, dots, focus rings

### ◆ Player Controls

- Lock button (L key) hides all UI during screenings — prevents accidental display on mouse move
- Keyboard shortcuts: Space (play/pause), F (fullscreen), M (mute/unmute), L (lock), ? (help)
- Auto-hide controls after 3 seconds of inactivity
- Auto-show on new media item or background audio start
- Error overlay with auto-skip countdown on media load failure

### ◆ Dashboard

- Now Playing carousel — cycle through screens, each shows active schedule with controls
- Up Next — next items in the current schedule queue
- Last Play — history of completed schedules with duration, end time, and screen
- Top Played Media — most frequently scheduled content
- Quick Actions, Stats, Recent Activity widgets
- Keyboard shortcuts reference widget

### ◆ Media Library

- Browse, ingest, and manage video, audio, and image files
- Bulk import from server filesystem
- Detail view with preview and metadata
- Bulk delete with checklist mode and confirmation
- Search and filter by type

### ◆ Settings & Onboarding

- 3-step onboarding wizard for new users
- Venue name, timezone, content folder path configuration
- Player mute config — 4-scenario matrix (video, audio, video+overlay, image)
- Accent color theme picker
- Edit mode with draft state — unsaved changes trigger discard confirmation on navigation
- Selective logout — preserves settings and venue data

---

## ▸ Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install

```
git clone https://github.com/niamhramadhaan/Majorette.git
cd Majorette
npm install
```

### Configure

```
cp .env.example .env.local
```

Edit `.env.local`:

```
VITE_APP_NAME=JEMIMA
VITE_CONTENT_ROOT=D:\JEMIMA
VITE_SERVER_URL=http://localhost:3001
```

### Run

```
npm run dev
```

This starts the Vite dev server (port 3000) and Express content server (port 3001) concurrently.

Open `http://localhost:3000` — enter your name — complete the 3-step setup wizard.

---

## ▸ Usage

### Create a Schedule

1. Go to **Schedules** → click **Create Schedule**
2. Drag media items from the library panel into the sequence
3. Set start time, mode (Loop / Play Once), and assign to screen(s)
4. Click **Save Schedule** — it starts playing at the configured time

### Play on a Screen

1. Go to **Locations** → click a screen → copy the player URL
2. Open that URL in a browser on the display device
3. The player auto-plays the assigned schedule in fullscreen

### Control from Dashboard

- **Now Playing carousel** — use ◀ ▶ arrows to switch between screens
- **Skip** — prev/next buttons jump between items
- **Pause / Resume** — toggle playback per screen
- **Mark Done** — stop and complete the current schedule
- **Play Again** — recreate a completed schedule with new start time and screen assignment

### Keyboard Shortcuts (Player)

| Key | Action |
|-----|--------|
| Space | Play / Pause |
| F | Toggle fullscreen |
| M | Mute / Unmute |
| L | Lock / Unlock controls |
| ? | Toggle shortcuts help |

---

## ◈ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 · TypeScript · Tailwind CSS v4 |
| Routing | React Router v7 (BrowserRouter) |
| Build | Vite 6 |
| Backend | Express.js (media file streaming, no auth/database) |
| Storage | Browser localStorage (per-device) |
| Icons | Lucide React |
| Animation | Framer Motion |

---

## ◈ Project Structure

```
src/
├── components/          Layout, Sidebar, Topbar, Pagination
├── config/              APP_CONFIG constants
├── hooks/               useLocalStorage
├── lib/                 storage, theme, utils, mockData
├── pages/
│   ├── Dashboard        Overview with Now Playing carousel
│   ├── Player           Global fullscreen player
│   ├── ScreenPlayer     Per-screen player (multi-screen)
│   ├── Schedule         Schedule list with status/sort/filter
│   ├── ShowBuilder      Drag-and-drop sequence editor
│   ├── Films            Media library
│   ├── FilmDetail       Single media detail + preview
│   ├── FilmIngest       Bulk import from filesystem
│   ├── Locations        Venue + screen management
│   ├── ScreenDetail     Per-screen settings + status
│   ├── Settings         App configuration + theme picker
│   ├── Login            Name-only login
│   └── QuickStart       3-step onboarding
├── themes.ts            8 accent color presets
├── types/               TypeScript interfaces
├── App.tsx              Routes + guards
├── main.tsx             Entry point
└── index.css            Design tokens, animations
```

---

## ◈ Roadmap

**Current: v2.0** — Multi-screen platform with accent themes, per-screen scheduling, and player controls lock.

| Version | Focus |
|---------|-------|
| v2.1 | Error boundaries, tests, polish |
| v3.0 | Player as standalone EXE (Electron) |
| v4.0 | Persistent backend (database, auth, API) |
| v5.0 | Cloud / SaaS option |

See [ROADMAP.md](./ROADMAP.md) for full details and session logs.

---

## ◈ License

**Business Source License 1.1**

Free for non-production use (development, testing, evaluation). Production use in business environments requires a commercial license. Converts to Apache 2.0 on June 23, 2029.

See [LICENSE](./LICENSE) for full terms.

---

## ▸ Links

- [GitHub Repository](https://github.com/niamhramadhaan/Majorette)
- [Issues](https://github.com/niamhramadhaan/Majorette/issues)
- [Discussions](https://github.com/niamhramadhaan/Majorette/discussions)
