# JEMIMA

**Joint Engine Mini Media — Single-screen media scheduling and playback dashboard.**

JEMIMA is an open-source dashboard for scheduling and playing media content on a single screen. Designed for mini-theaters, cafés, retail displays, lobbies, and event spaces. Schedule images, videos, and audio — play them on a dedicated player screen with fullscreen playback and background audio support.

## Features

- **Media Library** — Browse, ingest, and manage video, audio, and image files
- **Schedule Builder** — Drag-and-drop sequence editor with loop/once modes
- **Background Audio** — Attach audio tracks to play behind images/videos
- **Fullscreen Player** — Dedicated `/player` route with keyboard shortcuts and auto-hide controls
- **Dashboard** — Now Playing, Up Next, skip/prev, pause/resume, mark done, Play Again
- **Schedule Status** — Track schedules as Ready, Now Playing, or Done
- **Cross-tab Control** — Dashboard controls Player even when open in a separate tab
- **Content Server** — Express API for streaming local media files with range request support
- **Auto-complete** — "Play Once" schedules automatically mark as done when finished

## Getting Started

```bash
git clone https://github.com/your-username/jemima
cd jemima
npm install
cp .env.example .env.local
npm run dev
```

This starts both the Vite dev server (port 3000) and the Express content server (port 3001) concurrently.

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
  pages/
    Dashboard.tsx    # Overview: Now Playing, Up Next, controls, Last Played
    Films.tsx        # Media library with filters and search
    FilmDetail.tsx   # Single media metadata and preview
    FilmIngest.tsx   # Bulk import media files
    Schedule.tsx     # Schedule list with status, sort, and filter
    ShowBuilder.tsx  # Drag-and-drop sequence editor
    Player.tsx       # Fullscreen playback runtime
    QuickStart.tsx   # Onboarding wizard
    Settings.tsx     # App configuration
    Login.tsx        # Name-only login
    Locations.tsx    # Venue management
  components/
    Layout.tsx       # App shell with sidebar + topbar
    Sidebar.tsx      # Navigation sidebar
    Topbar.tsx       # Top bar with search and user menu
    Pagination.tsx   # Reusable pagination
  config/
    app.ts           # APP_CONFIG (name, tagline, server URL)
  lib/
    storage.ts       # localStorage helpers, schedule logic, migration
    utils.ts         # cn() utility
    mockData.ts      # Sample data for onboarding
  types/
    index.ts         # TypeScript interfaces
  index.css          # Global styles, animations, design tokens
  App.tsx            # Routes and route guards
  main.tsx           # Entry point with migration
server.cjs           # Express content server
```

## Content Server

The Express server (`server.cjs`) serves local media files:

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Server status and content root info |
| `GET /files?type=video` | List media files (filter by `video`, `audio`, `image`) |
| `GET /content/:path` | Stream a file with range request support |

Configure the content root via `--content-root` CLI flag or `CONTENT_ROOT` env var.

## Player

Open `/player` in a browser to launch the fullscreen player. It auto-plays the active schedule.

**Keyboard shortcuts:**
- `Space` — Play/Pause
- `F` — Toggle fullscreen
- `M` — Mute/Unmute

**Background audio:** Mark audio items as "Background" in the Show Builder. They play behind the nearest image/video. The player starts muted — click the mute button to unmute when background audio is present.

**Controls:** Auto-hide after 3 seconds of inactivity. Move mouse to show. Auto-show briefly on new media or when background audio starts (if muted).

## Schedule Modes

- **Loop** — Content repeats indefinitely from the start time
- **Play Once** — Content plays through once, then auto-marks as "Done"

## White-Labeling

To rebrand, edit `.env.local`:

```env
VITE_APP_NAME=Your Brand Name
VITE_APP_TAGLINE=Your tagline here
```

To change the logo, replace `public/logo.png` and `public/favicon.png`.

## Design System

Defined in `src/index.css` under `@theme`:
- **Primary:** Forest Green (`#0E7B35`)
- **Secondary:** Lime (`#B9EA38`)
- **Typography:** Poppins (body), Montserrat (headings)

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for detailed build status and next phases.

## Stack

Vite · React 19 · TypeScript · Tailwind CSS v4 · React Router v7 · Express
