# JEMIMA

**Joint Engine Mini Media** ─ Open-source digital signage & media scheduling platform.

> Got screens? Got content? JEMIMA ties them together. Schedule images, videos, and audio across multiple screens from one dashboard. No cloud, no subscriptions, no nonsense ─ just your media, your way.

---

## ◈ Quick Start

```
git clone https://github.com/niamhramadhaan/jemima.git
cd jemima
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`, enter your name, and the setup wizard walks you through the rest. Takes about 2 minutes. ヽ(・∀・)ﾉ

> **Where do I put media files?** A `media` folder is created automatically in the project root when you first run the server. The server prints the full path on startup. You can also see it in **Settings**.

---

## ◈ Features

### ▸ Multi-Screen Playback

One dashboard, many screens. Each screen plays its own schedule independently ─ perfect for a café with different zones, a retail store with window vs. interior displays, or a church with lobby + sanctuary screens.

<img width="2227" height="1292" alt="image" src="https://github.com/user-attachments/assets/5ccdee8f-b4ed-4f7a-aa14-b0de30185148" />


- Assign any schedule to any screen (or let them share)
- Per-screen controls: skip, pause, resume, mark done ─ all from the dashboard
- Screens run on their own URLs ─ open them on any device with a browser

### ▸ Smart Scheduling

Drag, drop, set a time, done. Build sequences of videos, images, and audio with a visual editor. Loop them forever or play once and auto-complete.

- Conflict detection catches overlapping schedules before they cause problems
- Status indicators: Ready → Now Playing → Done (you always know what's happening)
- Play Again: recreate any finished schedule with one click ─ great for daily loops

### ▸ Background Audio

Want music behind your slideshow? Add an audio track, toggle "Background" ─ it plays continuously behind your images and videos without interrupting the visual flow. Background audio has its own volume control and works regardless of the mute setting.

### ▸ Accent Themes

<img width="2201" height="467" alt="image" src="https://github.com/user-attachments/assets/12bb50c2-1cf3-4f4d-923a-23480f81f5be" />

Eight color themes to match your brand or mood: Emerald, Forest, Ocean, Royal, Crimson, Sunset, Rose, Slate. Change it in Settings and watch the entire UI update instantly ─ buttons, badges, progress bars, even the login page light rays.

### ▸ Player Controls

Running a screening? Lock the controls (L key) to hide all UI ─ no accidental pauses from a mouse bump. Keyboard shortcuts for everything:

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `→` `←` | Skip next / previous |
| `F` | Toggle fullscreen |
| `M` | Mute / Unmute |
| `L` | Lock / Unlock controls |
| `?` | Show shortcuts |

### ▸ Dashboard

Your command center. See what's playing, what's next, and what's been played ─ all at a glance.

- **Now Playing** ─ cycle through screens, each shows its active schedule with controls
- **Up Next** ─ the next items in the queue (follows the selected screen, skips background audio)
- **Last Play** ─ timeline of completed schedules with duration and screen info
- **Top Played Media** ─ your most frequently scheduled content

### ▸ Media Library

JEMIMA reads files directly from a folder on your system ─ no uploading. Drop your media in the content folder, hit Ingest, and it appears in the library. Supports video (MP4, WebM, MKV), audio (MP3, WAV, OGG), and images (JPG, PNG, WebP, GIF, SVG).

---

## ◈ How To

### ▸ Set Up Your First Screen

```
  Locations ──> Add Screen ──> Copy Player URL ──> Open on display device
```

1. Go to **Locations** in the sidebar
2. Your default screen is already there ─ click it to see the player URL
3. Copy that URL and open it on your display device (TV, monitor, tablet, etc.)
4. The screen shows "No content playing" ─ that's normal, we haven't scheduled anything yet

> **Tip:** Add more screens for different zones. Each screen gets its own URL and can play different content.

### ▸ Add Media

```
  Films ──> Ingest ──> Select files ──> Import
```

1. Place your media files in the content folder (shown in **Settings** ─ default is `./media`, created automatically in the project root when you first run the server)
2. Go to **Films** → click **Ingest**
3. Select the files you want ─ JEMIMA reads them from disk, no upload needed
4. Click Import ─ they're now in your library, ready to schedule

> **Supported:** MP4, WebM, MKV, AVI, MOV / MP3, WAV, OGG, FLAC, AAC / JPG, PNG, WebP, GIF, SVG

### ▸ Create a Schedule

```
  Schedules ──> Create Schedule ──> Drag media ──> Set time ──> Assign screens ──> Save
```

1. Go to **Schedules** → click **Create Schedule**
2. Give it a name (e.g., "Morning Playlist", "Lobby Loop")
3. Drag media from the library panel on the right into the sequence on the left
4. Reorder by dragging items up/down in the sequence
5. Set the **start time** ─ when should it begin playing?
6. Choose the **mode**:
   - **Loop** ─ plays forever until you stop it (great for ambient displays)
   - **Play Once** ─ plays through once, then marks as Done (great for one-time events)
7. Assign to **screen(s)** ─ pick which screens should play this schedule
8. Hit **Save**

> **Note:** If you assign a schedule to a screen that already has one running, JEMIMA will warn you about the conflict before saving.

### ▸ Play Different Content on Different Screens

 Say you have a café with two zones:

```
  Screen: "Window Display"  ──> Schedule: "Lunch Special Slideshow" (loop)
  Screen: "Interior TV"     ──> Schedule: "Ambient Music Videos" (loop)
```

1. Create two screens in **Locations** (e.g., "Window Display" and "Interior TV")
2. Create two schedules in **Schedules**
3. Assign each schedule to its screen
4. Open each screen's player URL on the corresponding device
5. Both screens play independently ─ control them both from the dashboard

### ▸ Add Background Audio to a Schedule

```
  Schedule Builder ──> Add audio item ──> Toggle "Background" ──> Save
```

1. In the schedule builder, add an audio file to your sequence
2. Click the **Background** toggle on that audio item
3. The audio now plays behind all visual content in the schedule ─ images and videos play on top while the music continues underneath
4. Background audio loops automatically until the schedule ends

> **Use case:** A photo slideshow with ambient music. The audio plays continuously while images cycle through.

### ▸ Control Playback from the Dashboard

```
  Dashboard ──> Now Playing ──> ◀ ▶ screens ──> Skip / Pause / Done
```

- Use the **◀ ▶** arrows to switch between screens in the Now Playing carousel
- **Skip** ─ jump to the next or previous item in the schedule
- **Pause / Resume** ─ freeze playback, then pick up where you left off
- **Mark Done** ─ stop the schedule and mark it as completed
- **Play Again** ─ recreate a completed schedule with a new start time

### ▸ Run the Player in Kiosk Mode (Electron)

For dedicated display machines, build the Electron app:

```
npm run electron:build
```

This creates a standalone `.exe` (Windows) that runs fullscreen with no browser chrome. The Express server is embedded ─ no separate server process needed. Just launch the app and it plays.

> **Shortcut:** `Ctrl+Shift+C` toggles between player view and config screen.

### ▸ Change the Accent Theme

```
  Settings ──> Accent Theme ──> Pick a color ──> Save
```

The entire UI updates instantly ─ buttons, badges, progress bars, the login page light rays, even the sidebar highlighter stroke. Eight themes to choose from. Try them all.

---

## ◈ Tech Stack

| Layer | What |
|-------|------|
| Frontend | React 19 + TypeScript + Tailwind CSS v4 |
| Routing | React Router v7 |
| Build | Vite 6 |
| Backend | Express.js (media file streaming ─ no auth, no database) |
| Storage | Browser localStorage (per-device) |
| Desktop | Electron 35 |
| Icons | Lucide React |
| Animation | Motion (Framer Motion) |
| Magic UI | Highlighter, Light Rays |

---

## ◈ Project Structure

```
src/
├── components/          Layout, Sidebar, Topbar, Pagination
│   └── ui/              Highlighter, Light Rays (Magic UI)
├── config/              APP_CONFIG constants
├── hooks/               useLocalStorage
├── lib/                 storage, theme, utils
├── pages/
│   ├── Dashboard        Command center with Now Playing carousel
│   ├── Player           Global fullscreen player
│   ├── ScreenPlayer     Per-screen player (multi-screen)
│   ├── Schedule         Schedule list with status / sort / filter
│   ├── ShowBuilder      Drag-and-drop sequence editor
│   ├── Films            Media library
│   ├── FilmDetail       Single media detail + preview
│   ├── FilmIngest       Bulk import from filesystem
│   ├── Locations        Venue + screen management
│   ├── ScreenDetail     Per-screen settings + status
│   ├── Settings         App config + theme picker
│   ├── Login            Name-only login with light rays
│   └── QuickStart       3-step onboarding
├── themes.ts            8 accent color presets
├── types/               TypeScript interfaces
├── App.tsx              Routes + guards
├── main.tsx             Entry point
└── index.css            Design tokens, animations
```

---

## ◈ Current Limitations

Being transparent here ─ these are known gaps, and they're all on the roadmap:

- **No database** ─ data lives in browser localStorage. Clear your browser, lose your data (settings & venues survive logout though).
- **No real authentication** ─ login is just a name. No passwords, no sessions, no multi-user.
- **No tests** ─ we know. It's on the list. Contributions welcome.
- **Single device** ─ data doesn't sync across devices (yet).

---

## ◈ Roadmap

**Current: v2.2.0** ─ Multi-screen platform with accent themes, conflict detection, and player lock.

| Version | Focus |
|---------|-------|
| v2.1 | Error boundaries, tests, polish |
| v3.0 | Player as standalone EXE (Electron) |
| v4.0 | Persistent backend (database, auth, API) |
| v5.0 | Cloud / SaaS option |

See [ROADMAP.md](./ROADMAP.md) for full details and session logs.

---

## ◈ Contributing

We'd love your help. (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to get started ─ fork, branch, PR, the usual. If you find a bug or have an idea, open an issue.

---

## ◈ License

**Business Source License 1.1**

Free for non-production use (dev, testing, evaluation). Production use in business environments requires a commercial license. Converts to Apache 2.0 on June 23, 2029.

See [LICENSE](./LICENSE) for full terms.

---

## ◈ Links

- [GitHub](https://github.com/niamhramadhaan/jemima)
- [Issues](https://github.com/niamhramadhaan/jemima/issues)
- [Discussions](https://github.com/niamhramadhaan/jemima/discussions)
