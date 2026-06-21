# JEMIMA Dashboard — Build Summary & Roadmap

## Current Build Status (v1.0.0)

### Architecture
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS 4
- **Backend:** Express.js (port 3001) — serves media files only, no auth/database
- **Storage:** Browser localStorage (per-device, no server-side persistence)
- **Routing:** React Router v7 with `BrowserRouter`
- **Repo:** https://github.com/niamhramadhaan/Majorette

---

## What's Working

### CMS / Dashboard
- [x] Now Playing — real-time current item + progress bar synced with Player
- [x] Up Next — shows next items in queue
- [x] Skip prev/next — cross-tab (localStorage) + same-tab (CustomEvent)
- [x] Pause/Resume — toggle playback, freezes elapsed time, syncs with Player
- [x] Force Stop (Done) — modal confirmation, persists 'done' status
- [x] Play Again — recreate modal (new start time, same content)
- [x] Quick Actions, Stats, Recent Activity, Last Played widgets
- [x] Toast messages on done/create
- [x] Click animation on control buttons (active:scale-90)
- [x] Progress bar pulse during playback

### Schedules
- [x] Create/edit/delete with drag-and-drop ordering
- [x] Mode: Loop (indefinite) / Play Once (auto-dones)
- [x] Start time via datetime picker
- [x] Schedule status: unplayed / playing / done
- [x] Status badges with distinct colors (blue=ready, green=now, gray=done)
- [x] Sort: Newest, Oldest, Next Play
- [x] Filter by status (All, Now Playing, Ready, Done)
- [x] Default sort: Newest First
- [x] Disable Edit/View on done schedules
- [x] Play Again from Schedule page (same modal as Dashboard)

### Player
- [x] Full-screen media player with keyboard shortcuts (Space, F, M)
- [x] Time-based item progression
- [x] Skip prev/next — jumps to adjacent item start
- [x] Pause/Resume — freezes elapsed time, resumes from exact position
- [x] Auto-hide controls in fullscreen (3s timeout)
- [x] Auto-show controls on new media
- [x] Audio glow animation for audio-only items
- [x] Error handling — error overlay + auto-skip countdown
- [x] Upcoming schedule countdown screen
- [x] Done screen on auto-complete or manual done
- [x] Default muted — tooltip + pulse on mute button when bg audio present
- [x] Auto-show controls (5s) when bg audio starts and is muted

### Background Audio
- [x] Bidirectional detection (audio before or after visual item)
- [x] Continuous playback — audio plays until natural end, across multiple visual items
- [x] Auto-reorder — toggling to Background moves audio next to nearest visual
- [x] Visual indicator — green tint + "→ [target title]" tag
- [x] Preview button on audio items in Show Builder
- [x] Rename: Overlay/Main → Background/Standalone
- [x] Helper text for standalone audio items

### Cross-Tab Communication
- [x] Skip signals: CustomEvent (same-tab) + localStorage (cross-tab)
- [x] Pause/Resume signals: same dual approach
- [x] Done signal: same dual approach
- [x] Player state polling: Dashboard reads Player state from localStorage

### Branding
- [x] Rebranded to JEMIMA (Joint Engine Mini Media)
- [x] All localStorage keys migrated from majorette_* to jemima_*
- [x] Silent migration function runs on app load
- [x] Updated: app.ts, index.html, Sidebar, Login, QuickStart, Settings, Topbar, mockData, package.json

### Other
- [x] Name-only login + 3-step onboarding
- [x] Media library: browse, ingest, detail view, search

---

## Known Issues

| Issue | Severity | Status |
|-------|----------|--------|
| localStorage only — not persistent across devices/browsers | Medium | Phase 4 |
| No real auth — anyone with URL can access | Low | Phase 4 |
| No error boundary around Player | Low | Phase 2 |
| No unit/integration tests | Low | Phase 2 |
| Sample content references non-existent files | Low | Fix anytime |

---

## Readiness

| Use Case | Ready? |
|----------|--------|
| Internal testing / demo | ✅ Yes |
| Single-venue deployment (one browser) | ✅ Yes (v1.0) |
| Multi-device / multi-venue | ❌ Needs Phase 4 |
| Production (public-facing) | ❌ Needs auth + persistence |

---

## Next Steps

### Phase 2: Polish & Testing

- [ ] Add React error boundary around Player
- [ ] Add basic integration tests (schedule create → player play → done)
- [ ] Remove sample content references
- [ ] Test all transitions: skip, pause, resume, done, play again

### Phase 3: Player as Standalone EXE

**Goal:** Package the Player as a desktop EXE that auto-launches on boot.

- [ ] Electron wrapper loading `http://localhost:3000/player`
- [ ] Auto-launch on system boot (Windows Task Registry / Startup folder)
- [ ] Fullscreen on launch (kiosk mode)
- [ ] Auto-reconnect if server is unavailable (retry with backoff)
- [ ] System tray icon for basic controls (exit, reload, toggle fullscreen)
- [ ] Offline mode — cache schedule + media locally
- [ ] Auto-update mechanism (electron-updater)

### Phase 4: Multi-Player Architecture

**Goal:** One CMS controls multiple Player instances.

- [ ] REST API: player registry, heartbeat, schedule assignment
- [ ] WebSocket: real-time status + commands (skip, pause, reload)
- [ ] CMS Players page: list players, assign schedules, send commands
- [ ] Dashboard: player status overview (online/offline counts)
- [ ] Player EXE: register on startup, heartbeat, fetch assigned schedule

### Phase 5: Persistent Backend (Optional)

- [ ] SQLite or PostgreSQL database
- [ ] Proper user authentication (email/password, roles)
- [ ] Media upload via CMS (not just filesystem)
- [ ] Multi-device persistence

---

## Session Log

### Session 1 — v1.0.0 (2026-06-21)

**Objective:** Build a single-screen media scheduling and playback platform.

**Critical Bug Fixes (6):**
1. Skip signal cross-tab — `emitSkipSignal` now uses CustomEvent + localStorage for both same-tab and cross-tab
2. Next/prev offset math — Fixed skip handler to correctly jump to adjacent items
3. Pause/resume time freeze — Added `pauseStartRef` to freeze elapsed time while paused
4. Infinite render loop — Removed `visualOffset`/`visualItemDuration` from image progress effect deps
5. Background audio detection — Removed `bgAudioIdRef.current` guard that blocked initial overlay detection
6. Auto-hide controls — Removed `setShowControls(true)` from new-media effect

**Features Added (8):**
1. Schedule status system — `unplayed`/`playing`/`done`, auto-complete for `once` schedules
2. Done flow — Modal confirmation, persists status, Play Again modal (new start time, same content)
3. Last Played widget — Dashboard widget showing recently completed schedules
4. Background audio UX — Background/Standalone rename, visual indicator, auto-reorder, preview button, bidirectional detection, continuous playback
5. Audio mute default — Player starts muted, tooltip + pulse on mute button when bg audio present
6. Schedule sort/filter — Default newest, sort by Next Play, filter by status
7. Rebrand to JEMIMA — All references, localStorage keys with migration
8. Cross-tab control — Dashboard controls Player via CustomEvent + localStorage

**UX Polish (5):**
1. Click animation on control buttons (active:scale-90)
2. Status badge distinct colors (blue=ready, green=now, gray=done)
3. Toast messages on done/create
4. Disable Edit/View on done schedules
5. Progress bar pulse during playback

**Infrastructure (3):**
1. localStorage migration function (`migrateOldKeys`) — silent, runs on app load
2. README.md rewritten for JEMIMA
3. GitHub repo created and pushed to https://github.com/niamhramadhaan/Majorette

**Files changed:** Dashboard.tsx, Player.tsx, Schedule.tsx, ShowBuilder.tsx, storage.ts, types/index.ts, index.css, app.ts, Sidebar.tsx, Login.tsx, QuickStart.tsx, Settings.tsx, Topbar.tsx, mockData.ts, main.tsx, package.json, index.html, README.md, ROADMAP.md

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
│   │   ├── storage.ts        # localStorage helpers + schedule logic + migration
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
├── README.md
└── ROADMAP.md
```
