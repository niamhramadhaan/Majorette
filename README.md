# JEMIMA

**Joint Engine Mini Media** — Open-source digital signage and media scheduling platform.

Schedule images, videos, and audio across multiple screens. Play them on dedicated player instances with fullscreen playback, background audio, and real-time dashboard control. Built for mini-theaters, cafes, retail displays, lobbies, churches, and event spaces.

---

## Quick Start

```bash
git clone https://github.com/niamhramadhaan/jemima.git
cd jemima
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000` — enter your name — complete the 3-step setup wizard.

---

## Features

### Multi-Screen Playback

- Assign schedules to specific screens from the dashboard, schedule builder, or Play Again modal
- Each screen runs independently at `/player/screen/:screenId`
- Per-screen controls: skip, pause, resume, mark done
- Dashboard Now Playing carousel with per-screen view and controls
- Default screen fallback — unassigned schedules play on the default screen automatically

### Smart Scheduling

- Drag-and-drop schedule builder with visual/audio/image support
- Loop mode (indefinite repeat) and Play Once mode (auto-marks done)
- Schedule conflict detection — prevents overlapping schedules on the same screen
- Schedule status: Ready / Now Playing / Done with visual indicators
- Play Again: recreate completed schedules with new start time and screen assignment

### Background Audio

- Attach audio tracks to play behind images or videos
- Bidirectional detection — audio before or after a visual item is auto-detected as background
- Independent mute control — background audio plays regardless of mute state

### Accent Color Themes

- 8 preset themes: Emerald, Forest, Ocean, Royal, Crimson, Sunset, Rose, Slate
- Live preview in Settings — click a theme, see it change instantly
- Affects all UI elements: buttons, badges, progress bars, light rays, highlighter strokes

### Player Controls

- Lock button (L key) hides all UI during screenings
- Keyboard shortcuts: Space (play/pause), F (fullscreen), M (mute/unmute), L (lock), ? (help)
- Auto-hide controls after 3 seconds of inactivity
- Error overlay with auto-skip countdown on media load failure

### Dashboard

- Now Playing carousel — cycle through screens with per-screen controls
- Up Next — next items in the current schedule queue (follows selected screen)
- Last Play — timeline view of completed schedules
- Top Played Media — most frequently scheduled content
- Quick Actions, Stats, Recent Activity widgets

### Media Library

- Browse, ingest, and manage video, audio, and image files
- Bulk import from server filesystem
- Detail view with preview and metadata
- Bulk delete with checklist mode

---

## Usage

### Create a Schedule

1. Go to **Schedules** → click **Create Schedule**
2. Drag media items from the library panel into the sequence
3. Set start time, mode (Loop / Play Once), and assign to screen(s)
4. Click **Save Schedule** — it starts playing at the configured time

### Play on a Screen

1. Go to **Locations** → click a screen → copy the player URL
2. Open that URL in a browser on the display device
3. The player auto-plays the assigned schedule in fullscreen

### Keyboard Shortcuts (Player)

| Key | Action |
|-----|--------|
| Space | Play / Pause |
| F | Toggle fullscreen |
| M | Mute / Unmute |
| L | Lock / Unlock controls |
| ? | Toggle shortcuts help |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 · TypeScript · Tailwind CSS v4 |
| Routing | React Router v7 |
| Build | Vite 6 |
| Backend | Express.js (media file streaming, no auth/database) |
| Storage | Browser localStorage (per-device) |
| Desktop | Electron 35 |
| Icons | Lucide React |
| Animation | Motion (Framer Motion) |

---

## Project Structure

```
src/
├── components/          Layout, Sidebar, Topbar, Pagination
│   └── ui/              Highlighter, LightRays (Magic UI)
├── config/              APP_CONFIG constants
├── hooks/               useLocalStorage
├── lib/                 storage, theme, utils
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

## Current Limitations

- **No database** — all data is stored in browser localStorage per device
- **No real authentication** — login is name-only, no passwords or sessions
- **No tests** — test infrastructure is planned for v2.1
- **Single-user** — no multi-user collaboration or role-based access yet

These are documented in the roadmap and are open for contribution.

---

## Roadmap

**Current: v2.2.0** — Multi-screen platform with accent themes, per-screen scheduling, conflict detection, and player controls lock.

| Version | Focus |
|---------|-------|
| v2.1 | Error boundaries, tests, polish |
| v3.0 | Player as standalone EXE (Electron) |
| v4.0 | Persistent backend (database, auth, API) |
| v5.0 | Cloud / SaaS option |

See [ROADMAP.md](./ROADMAP.md) for full details and session logs.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## License

**Business Source License 1.1**

Free for non-production use (development, testing, evaluation). Production use in business environments requires a commercial license. Converts to Apache 2.0 on June 23, 2029.

See [LICENSE](./LICENSE) for full terms.

---

## Links

- [GitHub Repository](https://github.com/niamhramadhaan/jemima)
- [Issues](https://github.com/niamhramadhaan/jemima/issues)
- [Discussions](https://github.com/niamhramadhaan/jemima/discussions)
