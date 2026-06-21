# JEMIMA Dashboard — Build Summary & Roadmap

## Current Build Status (v0.3.0)

### Architecture
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS 4
- **Backend:** Express.js (port 3001) — serves media files only, no auth/database
- **Storage:** Browser localStorage (per-device, no server-side persistence)
- **Routing:** React Router v7 with `BrowserRouter`

---

## What's Working

### CMS / Dashboard
- [x] Now Playing — real-time current item + progress bar synced with Player
- [x] Up Next — shows next items in queue
- [x] Skip prev/next — sends signals to Player (cross-tab via localStorage + same-tab via CustomEvent)
- [x] Pause/Resume — toggle playback from CMS, syncs with Player
- [x] Force Stop (Done) — modal confirmation, persists 'done' status to storage
- [x] Play Again — recreate modal for done schedules (new start time, same content)
- [x] Quick Actions, Stats, Recent Activity widgets
- [x] Last Played widget — shows most recently completed schedule with "View All"

### Schedules
- [x] Create/edit/delete schedules with drag-and-drop ordering
- [x] Mode selector: Loop (indefinite) / Play Once (auto-dones)
- [x] Start time via datetime picker
- [x] Audio overlay items (background audio tracks)
- [x] Schedule status: unplayed / playing / done
- [x] Status column in schedule table with badges
- [x] Play Again from Schedule page (same modal as Dashboard)

### Player
- [x] Full-screen media player with keyboard shortcuts (Space, F, M)
- [x] Time-based item progression (getScheduleElapsed + getCurrentItemIndex)
- [x] Skip prev/next — jumps to adjacent item start
- [x] Pause/Resume — freezes elapsed time, resumes from exact position
- [x] Auto-hide controls in fullscreen on new media
- [x] Audio glow animation for audio-only items
- [x] Error handling — error overlay + auto-skip countdown
- [x] Upcoming schedule countdown screen
- [x] Done screen — shows "Schedule Completed" on auto-complete or manual done
- [x] Auto-complete for 'once' schedules — marks 'done' when playback ends naturally

### Cross-Tab Communication
- [x] Skip signals: CustomEvent (same-tab) + localStorage (cross-tab)
- [x] Pause/Resume signals: same dual approach
- [x] Done signal: same dual approach
- [x] Player state polling: Dashboard reads Player's isPlaying/offset from localStorage

### Other
- [x] Name-only login + 3-step onboarding
- [x] Media library: browse, ingest, detail view, search
- [x] Branding: custom logo, favicon, color system

---

## Known Issues

| Issue | Severity | Status |
|-------|----------|--------|
| Background audio overlay not working correctly | Medium | Deferred |
| localStorage only — not persistent across devices/browsers | Medium | Phase 4 |
| No real auth — anyone with URL can access | Low | Phase 4 |
| No error boundary around Player | Low | Phase 1 |
| No unit/integration tests | Low | Phase 1 |
| Sample content references non-existent files | Low | Fix anytime |

---

## Readiness

| Use Case | Ready? |
|----------|--------|
| Internal testing / demo | ✅ Yes |
| Single-venue deployment (one browser) | ✅ Yes |
| Multi-device / multi-venue | ❌ Needs Phase 4 |
| Production (public-facing) | ❌ Needs auth + persistence |

---

## Next Steps

### Phase 1: Polish & Stability (Current)

- [ ] Fix background audio overlay behavior
- [ ] Add React error boundary around Player
- [ ] Add basic integration tests (schedule create → player play → done)
- [ ] Remove sample content references
- [ ] Test all transitions: skip, pause, resume, done, play again

### Phase 2: Player as Standalone EXE

**Goal:** Package the Player as a desktop EXE that auto-launches on boot.

- [ ] Electron wrapper loading `http://localhost:3000/player`
- [ ] Auto-launch on system boot (Windows Task Registry / Startup folder)
- [ ] Fullscreen on launch (kiosk mode)
- [ ] Auto-reconnect if server is unavailable (retry with backoff)
- [ ] System tray icon for basic controls (exit, reload, toggle fullscreen)
- [ ] Offline mode — cache schedule + media locally
- [ ] Auto-update mechanism (electron-updater)

### Phase 3: Multi-Player Architecture

**Goal:** One CMS controls multiple Player instances.

- [ ] REST API: player registry, heartbeat, schedule assignment
- [ ] WebSocket: real-time status + commands (skip, pause, reload)
- [ ] CMS Players page: list players, assign schedules, send commands
- [ ] Dashboard: player status overview (online/offline counts)
- [ ] Player EXE: register on startup, heartbeat, fetch assigned schedule

### Phase 4: Persistent Backend (Optional)

- [ ] SQLite or PostgreSQL database
- [ ] Proper user authentication (email/password, roles)
- [ ] Media upload via CMS (not just filesystem)
- [ ] Multi-device persistence

---

## File Structure

```
jemima-dashboard/
├── public/
│   ├── logo.png
│   └── favicon.png
├── src/
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   └── Pagination.tsx
│   ├── config/
│   │   └── app.ts
│   ├── lib/
│   │   ├── storage.ts        # localStorage helpers + schedule logic
│   │   └── utils.ts
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Films.tsx
│   │   ├── FilmDetail.tsx
│   │   ├── FilmIngest.tsx
│   │   ├── Locations.tsx
│   │   ├── Login.tsx
│   │   ├── Player.tsx
│   │   ├── QuickStart.tsx
│   │   ├── Schedule.tsx
│   │   ├── Settings.tsx
│   │   └── ShowBuilder.tsx
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── server.cjs
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── ROADMAP.md
```
