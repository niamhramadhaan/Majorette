# JEMIMA — Roadmap

## Current Version: v2.0.0

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
| localStorage only — not persistent across devices | Medium | v4.0 |
| No real auth — anyone with URL can access | Low | v4.0 |
| No error boundary around Player | Low | v2.1 |
| No unit/integration tests | Low | v2.1 |
| Sample content references non-existent files | Low | v2.1 |

---

## Readiness

| Use Case | Ready? |
|----------|--------|
| Internal testing / demo | Yes |
| Single-venue, single-browser | Yes |
| Multi-screen, single-browser | Yes (v2.0) |
| Multi-device / multi-venue | Needs v4.0 |
| Production (public-facing) | Needs auth + persistence |

---

## Next Steps

### v2.1 — Polish & Reliability

- [ ] React error boundary around Player
- [ ] React error boundary around Dashboard
- [ ] Unit tests for storage functions
- [ ] Integration tests (schedule create → player play → done)
- [ ] Remove sample content references
- [ ] Edge case fixes: rapid skip, double-play, stale state

### v3.0 — Player as Standalone EXE

**Goal:** Package the Player as a desktop EXE that auto-launches on boot.

- [ ] Electron wrapper loading `http://localhost:3000/player`
- [ ] Auto-launch on system boot (Windows Task Registry / Startup folder)
- [ ] Fullscreen on launch (kiosk mode)
- [ ] Auto-reconnect if server is unavailable (retry with backoff)
- [ ] System tray icon for basic controls (exit, reload, toggle fullscreen)
- [ ] Offline mode — cache schedule + media locally
- [ ] Auto-update mechanism (electron-updater)

### v4.0 — Persistent Backend

**Goal:** Multi-device sync, proper auth, database.

- [ ] SQLite or PostgreSQL database
- [ ] Proper user authentication (email/password, roles)
- [ ] Media upload via CMS (not just filesystem)
- [ ] REST API: player registry, heartbeat, schedule assignment
- [ ] WebSocket: real-time status + commands (skip, pause, reload)
- [ ] Multi-device persistence

### v5.0 — Cloud / SaaS

**Goal:** Hosted option for commercial use.

- [ ] Hosted CMS option
- [ ] Player fleet management
- [ ] Analytics dashboard
- [ ] Billing / tiers
