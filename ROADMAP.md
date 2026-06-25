# JEMIMA — Roadmap

## Current Version: v2.2.0

---

## v2.0 — Multi-Screen Platform

**Status:** Complete

### Features Added (12)
1. Accent color theme system — 8 presets (Emerald, Forest, Ocean, Royal, Crimson, Sunset, Rose, Slate), Settings picker, CSS variable injection, persists across sessions
2. Multi-screen player — `/player/screen/:screenId` route, per-screen schedule assignment, per-screen signals (skip/pause/resume/done)
3. Screen-schedule assignment — dropdown pickers in ShowBuilder, Schedule Play Again, Dashboard Play Again
4. Now Playing carousel — per-screen prev/next, screen-scoped controls, position indicator
5. Open Player dropdown — lists all screens + default player, single-screen direct open
6. Per-screen Last Play — completed schedule history (name, duration, end time, screen, mode), limit 5
7. Navigation guards — discard-changes modal when leaving Settings with unsaved changes, beforeunload handler
8. Player controls lock — L key hides UI permanently during screenings, prevents mouse-move show
9. Keyboard shortcuts widget — ? key on Player, sidebar widget on Dashboard
10. Pause/resume bug fix — removed double-counted pause duration in manualOffsetRef, added pausedAtRef for accurate resume
11. Default screen fallback — schedules auto-assign to `screen-default` when none selected
12. Screen active indicators — pulsing dot on Locations cards, active/paused/offline status

### UI Polish (8)
1. Last Play widget — visual upgrade (p-6, History icon, status chips, accent colors)
2. Dashboard layout — Up Next above Last Play, Screens widget removed (info in carousel)
3. Now Playing badge + dots — follow accent color theme
4. Lock icon — subtle when activated (text-white/30, no background/glow)
5. Custom scrollbar styling — accent-colored thumb, thin width
6. Schedule table — Screen column with multi-screen support
7. Play Again modals — multiselect screen picker, overflow fix
8. Locations — active dot on screen cards (green pulse = playing, yellow = paused)

### Bug Fixes (4)
1. Cross-screen schedule bleeding — `getActiveScheduleForScreen` now filters assigned schedules from unassigned fallback
2. Screen assignment refresh — `setScreens(getAllScreens())` after `assignScheduleToScreen`
3. Player pause stuck — `elapsedSec` went negative after long pause, video restarted from beginning
4. Logout data reset — selective localStorage clear preserves settings and venues

### Infrastructure (3)
1. Removed `useBlocker` (incompatible with BrowserRouter) — replaced with callback-based navigation guard in Layout
2. Selective localStorage clear on logout — preserves `jemima_settings` and `jemima_venues`
3. Screen-scoped storage functions — 11 new functions alongside existing (zero changes to Player.tsx)

### Files Changed
Layout.tsx, Sidebar.tsx, Topbar.tsx, Dashboard.tsx, Schedule.tsx, ShowBuilder.tsx, Settings.tsx, ScreenDetail.tsx, Locations.tsx, Player.tsx, ScreenPlayer.tsx (new), themes.ts (new), lib/theme.ts (new), types/index.ts, storage.ts, index.css, App.tsx, main.tsx

---

## v1.1 — UX Polish & Screen Management

**Status:** Complete

### Features Added (12)
1. Player mute config — 4-scenario matrix in Settings (video, audio, video+overlay, image)
2. Auto-mute system — first item per schedule uses config, then user control
3. Background audio decoupled — bgAudioRef always unmuted regardless of mute state
4. Settings edit mode — locked by default, Edit/Save/Cancel flow with draft state
5. Screen management — add/delete screens, ScreenDetail page, restore default screen
6. Topbar global search — live dropdown with media + schedule results, keyboard navigation
7. Dashboard Last Play widget — active schedule running time or last completed schedule
8. Dashboard Top Played Media — derived from schedule usage frequency
9. Dashboard time icon — animated SVG (sunrise/sun/sunset/moon) based on time of day
10. Dashboard clock HH:MM:SS — with pulsing seconds on countdown < 20s
11. Upcoming schedule preview — thumbnail + countdown + Open Player CTA when < 10 min
12. Media bulk delete — checklist mode with select all + confirmation modal

### Bug Fixes (7)
1. Schedule status filter — getEffectiveStatus called before declaration (temporal dead zone)
2. File path encoding — encodeURIComponent for special characters in filenames
3. Films checklist delete popup — modal triggered on selection instead of delete button
4. Films checkbox double-toggle — click bubbled to card onClick
5. Play Again modal typing block — real-time validation prevented typing
6. ShowBuilder start time typing block — same fix
7. ScreenDetail modal overlay — modal constrained by parent container

---

## v1.0 — Foundation

**Status:** Complete

### Core Features
- Fullscreen media player with keyboard shortcuts (Space, F, M)
- Time-based item progression with auto-advance
- Schedule builder with drag-and-drop ordering
- Loop/Once modes with auto-complete
- Background audio system (bidirectional detection, continuous playback)
- Dashboard with Now Playing, skip/pause/resume/done controls
- Cross-tab communication (CustomEvent + localStorage)
- Media library (browse, ingest, detail view, search)
- Name-only login + 3-step onboarding
- Content server (Express) with range request streaming
- Brand migration from Majorette to JEMIMA

---

## Known Issues

| Issue | Severity | Target |
|-------|----------|--------|
| localStorage only — not persistent across devices | Medium | v3.5 |
| No real auth — anyone with URL can access | Low | v4.0 |
| No unit/integration tests | Low | v2.1 |

---

## Readiness

| Use Case | Ready? |
|----------|--------|
| Internal testing / demo | Yes |
| Single-venue, single-browser | Yes |
| Multi-screen, single-browser | Yes (v2.0) |
| Single EXE player (kiosk) | Yes (v3.0) |
| Multi-device / multi-venue | Needs v3.5 (LAN) or v4.0 (cloud) |
| Production (public-facing) | Needs auth + persistence |

---

## Next Steps

### v2.1 — Polish & Reliability

**Status:** Complete

- [x] React error boundary around Player
- [x] React error boundary around Dashboard (all CMS pages wrapped)
- [x] Remove sample content references — QuickStart no longer seeds fake content/schedule
- [x] Edge case fixes: rapid skip, double-play, stale state
  - Schedule change forces content reload (prevVisualIndexRef reset)
  - Event listener churn fixed (elapsedSecRef replaces closure dependency)
  - Stale isPlaying fixed (functional updater `prev => !prev`)
  - play()/pause() race fixed (playPromiseRef tracks pending play)
  - pausedAtRef accuracy fixed (waits for play() before pause)
- [ ] Unit tests for storage functions
- [ ] Integration tests (schedule create → player play → done)

### v2.2 — UX Enhancements

**Status:** Complete

#### Features Added (7)
1. Loop indicator in Up Next — when last media is playing in loop mode, shows "Looping back to [first item]" with wrap-around items
2. Schedule Calendar Day View — toggle between list view and day timeline, smart hour range (±2h buffer), scrollable container
3. Screen filter — checklist dropdown in Schedule page, filters by assigned screen
4. Status filter — checklist dropdown in Schedule page, multi-select (Now Playing, Ready, Done)
5. Date picker — native date input in Day View header, green text when viewing today
6. Screen badges in Day View — schedule blocks show assigned screen name(s)
7. Tutorial page — sidebar layout with 6 topics, workflow diagram, step indicators, schedule builder preview, screen connection diagram, keyboard shortcut grid, progress dots

#### Player Improvements (3)
1. Elapsed/total time display — seek bar shows `1:23 ════════ 4:56 3 / 7`
2. Loop mode Up Next — wraps around to show first items when at end of schedule
3. Schedule name badge — shows `↻` suffix in loop mode

#### Profile Modal Improvements (2)
1. Backdrop click-to-close — clicking overlay dismisses modal
2. Escape key handler — Escape key closes modal

#### Server API (new)
- GET/POST endpoints for screens, content, schedules, venues, settings
- JSON file persistence in userData directory
- CMS syncs to API on every save (fire-and-forget)
- Player fetches from API when localStorage is empty

#### Schedule Day View Features
- Smart hour range — only shows hours with schedules ± 2h buffer (default 8am–8pm)
- Screen badge on blocks — shows assigned screen name(s)
- Click-to-edit — clicking a block navigates to schedule builder
- Status color coding — playing (green), done (gray), ready (white)
- Native date picker — inline in Day View header
- Go to Today removed — green date text indicates today

#### Files Changed
Dashboard.tsx, Schedule.tsx, Topbar.tsx, Tutorial.tsx (new), Player.tsx, App.tsx, storage.ts, server.cjs

### v3.0 — Player as Standalone EXE

**Status:** In Progress

**Goal:** Package the Player as a desktop EXE that auto-launches on boot.

- [x] Electron wrapper (`electron/main.cjs`) — embedded Express server (no spawn), kiosk window
- [x] Preload script (`electron/preload.cjs`) — context bridge with IPC handlers
- [x] Player config screen (`/player/config`) — screen ID input, saves to localStorage + userData JSON
- [x] Static file serving in server.cjs — serves built React app from `dist/` (asar-aware path)
- [x] package.json — Electron deps, scripts, builder config
- [x] Server API for data persistence — GET/POST endpoints for screens, content, schedules, venues, settings
- [x] App icon — converted from `public/logo.png` to `electron/icon.ico`
- [x] Error dialog — shows error message on startup failure instead of silent quit
- [x] Port reuse — detects existing server on :3001 and reuses it
- [ ] Auto-launch on system boot (Windows Task Registry / Startup folder)
- [ ] Auto-reconnect if server is unavailable (retry with backoff)
- [ ] System tray icon for basic controls (exit, reload, toggle fullscreen)
- [ ] Offline mode — cache schedule + media locally
- [ ] Auto-update mechanism (electron-updater)

### v3.5 — LAN Multi-Device Sync

**Goal:** Multiple players on different devices, one CMS, same WiFi network. No database, no auth, no cloud. JSON files on disk served by existing Express server.

**Principle:** Player playback logic (streaming, overlays, timing, controls) stays 100% unchanged. Only the data source switches from `localStorage` to server API.

#### Architecture

```
┌─────────────────────┐         ┌──────────────────────┐
│   CMS (Browser A)   │  POST   │   server.cjs :3001   │
│   Dashboard/Schedule │ ──────► │   data/schedules.json│
│                      │         │   data/content.json  │
│                      │         │   data/venues.json   │
└─────────────────────┘         │   data/signals.json  │
                                └──────────┬───────────┘
                     GET /api/*            │
              ┌────────────────────────────┼────────────────┐
              │                            │                │
     ┌────────▼────────┐      ┌────────────▼──┐   ┌────────▼────────┐
     │ Player (Device B)│      │ Player (Dev C)│   │ Player (Device D)│
     │ screen-lobby     │      │ screen-stage  │   │ screen-bar       │
     └─────────────────┘      └───────────────┘   └─────────────────┘
```

#### Phase 1: Server API Layer (server.cjs)

Add REST endpoints to existing Express server. No database — read/write JSON files in `data/` directory.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/schedules` | GET | Return all schedules |
| `GET /api/content` | GET | Return all content metadata |
| `GET /api/venues` | GET | Return venues + screen configs |
| `GET /api/settings` | GET | Return app settings |
| `POST /api/schedules` | POST | Replace all schedules |
| `POST /api/content` | POST | Replace all content |
| `POST /api/venues` | POST | Replace all venues |
| `POST /api/settings` | POST | Replace settings |
| `GET /api/signals/:screenId` | GET | Return pending signals for a screen |
| `POST /api/signals/:screenId` | POST | Write signal for a screen (skip/pause/resume/done) |
| `GET /api/state/:screenId` | GET | Return latest player state for a screen |
| `POST /api/state/:screenId` | POST | Write player state for a screen |

- File storage: `data/schedules.json`, `data/content.json`, `data/venues.json`, `data/settings.json`, `data/signals.json`, `data/states.json`
- On first run, create `data/` directory and seed from current localStorage if files don't exist
- CORS already enabled on server.cjs
- No auth (LAN only)

#### Phase 2: Storage Adapter (lib/storageAdapter.ts)

Create a thin abstraction layer so existing code doesn't need to change its call patterns.

```ts
interface StorageAdapter {
  getSchedules(): Schedule[]
  saveSchedules(schedules: Schedule[]): void
  getContent(): LocalContent[]
  saveContent(content: LocalContent[]): void
  getVenues(): Venue[]
  saveVenues(venues: Venue[]): void
  emitSignal(screenId: string, signal: Signal): void
  getSignals(screenId: string): Signal[]
  writePlayerState(screenId: string, state: PlayerState): void
  getPlayerState(screenId: string): PlayerState | null
}
```

Two implementations:
- `LocalStorageAdapter` — current behavior (default)
- `ServerAdapter` — fetches from `http://<server-ip>:3001/api/*`

Selection: if `jemima_settings.serverUrl` is set → use ServerAdapter, else LocalStorageAdapter.

#### Phase 3: Player Config Screen

Add a minimal config screen to the player (accessible via `/player/config` route):

- **Server URL** input (e.g., `http://192.168.1.5:3001`)
- **Screen ID** input (e.g., `screen-lobby`) — already exists via URL param, just make it configurable
- Save to localStorage
- On player load: if server URL set, fetch data from server; else use localStorage
- Fallback: if server unreachable, fall back to localStorage + show reconnect button

No changes to Player.tsx / ScreenPlayer.tsx playback logic — only the `loadData` function switches adapter.

#### Phase 4: CMS Dashboard Integration

- Settings page: add "Server URL" field (same as player)
- When server URL set: CMS reads/writes via ServerAdapter
- When server URL empty: CMS uses LocalStorageAdapter (current behavior)
- Content ingest: also upload file metadata to server API after localStorage save

#### Phase 5: Signal Relay (Optional, for CMS → Player controls)

Current signals (skip/pause/resume/done) use `localStorage` + `CustomEvent` — same-tab/cross-tab only.

For cross-device:
- CMS writes signal to `POST /api/signals/:screenId`
- Player polls `GET /api/signals/:screenId` every 2s (or piggyback on existing 5s data poll)
- Player processes signal, then clears it
- Existing `CustomEvent` + `localStorage` signals still work for same-device fallback

#### Files Changed

| File | Change |
|------|--------|
| `server.cjs` | Add `/api/*` REST endpoints (~150 lines) |
| `src/lib/storageAdapter.ts` | **New** — adapter interface + two implementations (~100 lines) |
| `src/lib/storage.ts` | Route calls through adapter when server URL set (minimal changes) |
| `src/pages/Settings.tsx` | Add Server URL field |
| `src/pages/Player.tsx` | Use adapter in `loadData` (~5 line change) |
| `src/pages/ScreenPlayer.tsx` | Use adapter in `loadData` (~5 line change) |
| `src/pages/PlayerConfig.tsx` | **New** — minimal config screen for EXE player (~80 lines) |
| `src/App.tsx` | Add `/player/config` route |

#### What Does NOT Change

- Video/audio/image playback logic
- Overlay detection and handling
- Schedule timing and elapsed calculation
- Player controls (play/pause/mute/seek/skip)
- Media file streaming (server.cjs `/content/*` stays as-is)
- Screen player URL structure (`/player/screen/:screenId`)

#### Estimated Effort

| Phase | Effort | Notes |
|-------|--------|-------|
| Phase 1 — Server API | 1-2 days | Mostly CRUD, file I/O |
| Phase 2 — Storage Adapter | 1 day | Thin abstraction, no logic changes |
| Phase 3 — Player Config | 0.5 day | Simple form + localStorage |
| Phase 4 — CMS Integration | 0.5 day | Settings field + adapter swap |
| Phase 5 — Signal Relay | 1 day | Optional, nice-to-have |
| **Total** | **4-5 days** | |

#### Migration Path

- Zero breaking changes — existing single-browser setups keep working (no server URL = localStorage mode)
- Multi-device opt-in: just set server URL in Settings
- Can mix: CMS on server mode, some players on localStorage, some on server

### v4.0 — Persistent Backend (Future)

**Goal:** Production-grade. Database, auth, media upload.

- [ ] SQLite or PostgreSQL database (replace JSON files)
- [ ] Proper user authentication (email/password, roles)
- [ ] Media upload via CMS (not just filesystem)
- [ ] WebSocket: real-time status + commands (replace polling)
- [ ] Player fleet management dashboard
- [ ] Multi-venue support

### v5.0 — Cloud / SaaS

**Goal:** Hosted option for commercial use.

- [ ] Hosted CMS option
- [ ] Player fleet management
- [ ] Analytics dashboard
- [ ] Billing / tiers
