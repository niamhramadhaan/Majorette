import type { LocalContent, Schedule, Venue, ScreenConfig, AppSettings, ActivityLog, ScheduleStatus } from '../types';
import { APP_CONFIG } from '../config/app';

export const STORAGE_KEYS = {
  USER_NAME: 'jemima_user_name',
  CONTENT: 'jemima_content',
  SCHEDULES: 'jemima_schedules',
  VENUES: 'jemima_venues',
  SETTINGS: 'jemima_settings',
  ACTIVITY: 'jemima_activity',
  SKIP_SIGNAL: 'jemima_skip_signal',
  PAUSE_SIGNAL: 'jemima_pause_signal',
  RESUME_SIGNAL: 'jemima_resume_signal',
  DONE_SIGNAL: 'jemima_done_signal',
  PLAYER_STATE: 'jemima_player_state',
} as const;

const OLD_KEY_MAP: Record<string, string> = {
  majorette_user_name: STORAGE_KEYS.USER_NAME,
  majorette_content: STORAGE_KEYS.CONTENT,
  majorette_schedules: STORAGE_KEYS.SCHEDULES,
  majorette_venues: STORAGE_KEYS.VENUES,
  majorette_settings: STORAGE_KEYS.SETTINGS,
  majorette_activity: STORAGE_KEYS.ACTIVITY,
  majorette_skip_signal: STORAGE_KEYS.SKIP_SIGNAL,
  majorette_pause_signal: STORAGE_KEYS.PAUSE_SIGNAL,
  majorette_resume_signal: STORAGE_KEYS.RESUME_SIGNAL,
  majorette_done_signal: STORAGE_KEYS.DONE_SIGNAL,
  majorette_player_state: STORAGE_KEYS.PLAYER_STATE,
};

export function migrateOldKeys(): void {
  for (const [oldKey, newKey] of Object.entries(OLD_KEY_MAP)) {
    const value = localStorage.getItem(oldKey);
    if (value !== null && localStorage.getItem(newKey) === null) {
      localStorage.setItem(newKey, value);
    }
    localStorage.removeItem(oldKey);
  }
  migrateVenueScreens();
}

function migrateVenueScreens(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.VENUES);
    if (!stored) return;
    const venues = JSON.parse(stored);
    let changed = false;
    const migrated = venues.map((v: any) => {
      if (typeof v.screens === 'number') {
        changed = true;
        const screens: ScreenConfig[] = [];
        for (let i = 1; i <= v.screens; i++) {
          screens.push({
            id: `${v.id}-screen-${i}`,
            name: `Screen ${i}`,
            playerUrl: `/player?screen=${v.id}-screen-${i}`,
            venueId: v.id,
            createdAt: v.createdAt || new Date().toISOString(),
          });
        }
        return { ...v, screens };
      }
      return v;
    });
    if (changed) localStorage.setItem(STORAGE_KEYS.VENUES, JSON.stringify(migrated));
  } catch { /* ignore */ }
}

export const DEFAULT_SETTINGS: AppSettings = {
  setupComplete: false,
  venueName: '',
  timezone: 'UTC',
  contentRoot: APP_CONFIG.contentRoot,
  playerMuteConfig: {
    videoNoOverlay: false,
    audioNoOverlay: false,
    videoWithOverlay: true,
    image: true,
  },
  accentTheme: 'emerald',
};

export const DEFAULT_VENUE: Venue = {
  id: 'venue-default',
  name: 'My Venue',
  screens: [{ id: 'screen-default', name: 'Screen 1', playerUrl: '/player?screen=screen-default', venueId: 'venue-default', createdAt: new Date().toISOString() }],
  createdAt: new Date().toISOString(),
};

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function getTimestamp(): string {
  return new Date().toISOString();
}

export function getUserName(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.USER_NAME) || '';
  } catch {
    return '';
  }
}

export function saveUserName(name: string): void {
  localStorage.setItem(STORAGE_KEYS.USER_NAME, name);
}

export function clearUserName(): void {
  localStorage.removeItem(STORAGE_KEYS.USER_NAME);
}

export function getContentRoot(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (stored) {
      const settings: AppSettings = JSON.parse(stored);
      if (settings.contentRoot) return settings.contentRoot;
    }
  } catch {
    // ignore
  }
  return APP_CONFIG.contentRoot;
}

export function resolveFilePath(relativePath: string): string {
  return APP_CONFIG.serverUrl + '/content/' + encodeURIComponent(relativePath);
}

export function getContentTypeFromExtension(filename: string): 'video' | 'audio' | 'image' {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (APP_CONFIG.contentTypes.video.extensions.includes(ext)) return 'video';
  if (APP_CONFIG.contentTypes.audio.extensions.includes(ext)) return 'audio';
  return 'image';
}

export function getMimeTypeFromExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const mimeMap: Record<string, string> = {
    mp4: 'video/mp4', webm: 'video/webm', mkv: 'video/x-matroska', avi: 'video/x-msvideo', mov: 'video/quicktime',
    mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', flac: 'audio/flac', aac: 'audio/aac',
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml',
  };
  return mimeMap[ext] || 'application/octet-stream';
}

export function detectDuration(url: string, type: 'video' | 'audio'): Promise<number> {
  return new Promise((resolve, reject) => {
    const el = document.createElement(type === 'video' ? 'video' : 'audio') as HTMLVideoElement | HTMLAudioElement;
    el.preload = 'metadata';
    let settled = false;

    const cleanup = () => {
      clearTimeout(timer);
      el.onerror = null;
      el.onloadedmetadata = null;
      el.remove();
    };

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        cleanup();
        reject(new Error('Timeout loading media metadata'));
      }
    }, 15000);

    el.onloadedmetadata = () => {
      if (!settled) {
        settled = true;
        const duration = el.duration;
        cleanup();
        if (isFinite(duration) && duration > 0) {
          resolve(Math.ceil(duration));
        } else {
          reject(new Error('Invalid duration'));
        }
      }
    };

    el.onerror = () => {
      if (!settled) {
        settled = true;
        cleanup();
        reject(new Error('Failed to load media'));
      }
    };

    el.src = url;
  });
}

export function generateVideoThumbnail(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';
    video.muted = true;
    let settled = false;

    const cleanup = () => {
      clearTimeout(timer);
      video.onloadedmetadata = null;
      video.onseeked = null;
      video.onerror = null;
      video.remove();
    };

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        cleanup();
        reject(new Error('Timeout generating thumbnail'));
      }
    }, 15000);

    const captureFrame = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 180;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          cleanup();
          resolve(dataUrl);
        } else {
          cleanup();
          reject(new Error('Canvas context not available'));
        }
      } catch {
        cleanup();
        reject(new Error('Failed to capture frame'));
      }
    };

    video.onloadedmetadata = () => {
      const seekTime = Math.min(1, (video.duration || 1) / 4);
      try {
        video.currentTime = seekTime;
      } catch {
        if (!settled) {
          settled = true;
          captureFrame();
        }
      }
    };

    video.onseeked = () => {
      if (!settled) {
        settled = true;
        captureFrame();
      }
    };

    video.onerror = () => {
      if (!settled) {
        settled = true;
        cleanup();
        reject(new Error('Failed to load video for thumbnail'));
      }
    };

    video.src = url;
  });
}

export function getThumbnailUrl(content: LocalContent): string | null {
  if (content.thumbnailPath) return content.thumbnailPath;
  if (content.type === 'image') return resolveFilePath(content.filePath);
  return null;
}

export function addActivity(activity: Omit<ActivityLog, 'id' | 'timestamp'>): ActivityLog {
  const entry: ActivityLog = {
    id: generateId(),
    timestamp: getTimestamp(),
    ...activity,
  };

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
    const activities: ActivityLog[] = stored ? JSON.parse(stored) : [];
    activities.unshift(entry);
    const trimmed = activities.slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(trimmed));
  } catch {
    // ignore storage errors
  }

  return entry;
}

export function getActivities(): ActivityLog[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function getContent(): LocalContent[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CONTENT);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveContent(content: LocalContent[]): void {
  localStorage.setItem(STORAGE_KEYS.CONTENT, JSON.stringify(content));
}

export function getSchedules(): Schedule[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveSchedules(schedules: Schedule[]): void {
  localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
}

export function getScheduleStartTime(schedule: Schedule): Date {
  return new Date(schedule.startTime);
}

export function getScheduleTotalDuration(schedule: Schedule, content: LocalContent[]): number {
  return schedule.items.reduce((total, item) => {
    const contentItem = content.find(c => c.id === item.contentId);
    return total + (item.duration || contentItem?.duration || 0);
  }, 0);
}

function isOverlayItem(schedule: Schedule, content: LocalContent[], index: number): boolean {
  const item = schedule.items[index];
  if (!item) return false;
  if (item.audioOverlay) return true;
  const contentItem = content.find(c => c.id === item.contentId);
  if (!contentItem || contentItem.type !== 'audio') return false;
  for (let i = index + 1; i < schedule.items.length; i++) {
    const next = content.find(c => c.id === schedule.items[i].contentId);
    if (next && next.type !== 'audio') return true;
  }
  for (let i = index - 1; i >= 0; i--) {
    const prev = content.find(c => c.id === schedule.items[i].contentId);
    if (prev && prev.type !== 'audio') return true;
  }
  return false;
}

export function getVisualTotalDuration(schedule: Schedule, content: LocalContent[]): number {
  return schedule.items.reduce((total, _item, index) => {
    if (isOverlayItem(schedule, content, index)) return total;
    const item = schedule.items[index];
    const contentItem = content.find(c => c.id === item.contentId);
    return total + (item.duration || contentItem?.duration || 0);
  }, 0);
}

export function getActiveSchedule(schedules: Schedule[], content: LocalContent[]): Schedule | null {
  const now = Date.now();
  let best: Schedule | null = null;
  let bestStart = 0;

  for (const schedule of schedules) {
    if (schedule.status === 'done') continue;
    const startDate = getScheduleStartTime(schedule);
    const totalDuration = getScheduleTotalDuration(schedule, content) * 1000;
    if (totalDuration <= 0) continue;
    const start = startDate.getTime();
    const end = schedule.mode === 'loop' ? Infinity : start + totalDuration;
    if (start <= now && now <= end) {
      if (start > bestStart) { best = schedule; bestStart = start; }
    }
  }
  return best;
}

export function getUpcomingSchedule(schedules: Schedule[], content: LocalContent[]): Schedule | null {
  const now = Date.now();
  let best: Schedule | null = null;
  let bestStart = Infinity;

  for (const schedule of schedules) {
    if (schedule.status === 'done') continue;
    const startDate = getScheduleStartTime(schedule);
    const start = startDate.getTime();
    if (start > now && start < bestStart) {
      best = schedule; bestStart = start;
    }
  }
  return best;
}

export function getScheduleElapsed(schedule: Schedule, content: LocalContent[]): number {
  const now = Date.now();
  const startDate = getScheduleStartTime(schedule);
  const totalDuration = getVisualTotalDuration(schedule, content) * 1000;
  if (totalDuration <= 0) return 0;

  let elapsed = now - startDate.getTime();

  if (schedule.mode === 'loop') {
    elapsed = elapsed % totalDuration;
  }
  return Math.max(0, elapsed);
}

export function getCurrentItemIndex(schedule: Schedule, content: LocalContent[], elapsedSec: number): { index: number; offset: number } {
  let cumulative = 0;
  for (let i = 0; i < schedule.items.length; i++) {
    if (isOverlayItem(schedule, content, i)) continue;
    const item = schedule.items[i];
    const contentItem = content.find(c => c.id === item.contentId);
    const itemDuration = item.duration || contentItem?.duration || 0;
    if (elapsedSec < cumulative + itemDuration) {
      return { index: i, offset: elapsedSec - cumulative };
    }
    cumulative += itemDuration;
  }
  return { index: 0, offset: 0 };
}

export function getVisualItemCount(schedule: Schedule, content: LocalContent[]): number {
  return schedule.items.filter((_item, i) => !isOverlayItem(schedule, content, i)).length;
}

export function resolveBackgroundAudio(schedule: Schedule, content: LocalContent[], currentIndex: number): { content: LocalContent; duration: number } | null {
  const item = schedule.items[currentIndex];
  if (!item || !item.audioOverlay) return null;
  const contentItem = content.find(c => c.id === item.contentId);
  if (!contentItem || contentItem.type !== 'audio') return null;
  return { content: contentItem, duration: item.duration || contentItem.duration };
}

export function emitSkipSignal(direction: 'next' | 'prev'): void {
  window.dispatchEvent(new CustomEvent('skip-signal', { detail: { direction, timestamp: Date.now() } }));
  localStorage.setItem(STORAGE_KEYS.SKIP_SIGNAL, JSON.stringify({ direction, timestamp: Date.now() }));
}

export function readSkipSignal(): { direction: 'next' | 'prev'; timestamp: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SKIP_SIGNAL);
    if (!raw) return null;
    localStorage.removeItem(STORAGE_KEYS.SKIP_SIGNAL);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function emitResumeSignal(): void {
  window.dispatchEvent(new CustomEvent('resume-signal'));
  localStorage.setItem(STORAGE_KEYS.RESUME_SIGNAL, JSON.stringify({ timestamp: Date.now() }));
}

export function emitDoneSignal(schedules: Schedule[], scheduleId: string): Schedule[] {
  window.dispatchEvent(new CustomEvent('done-signal'));
  localStorage.setItem(STORAGE_KEYS.DONE_SIGNAL, JSON.stringify({ timestamp: Date.now() }));
  const updated = setScheduleStatus(schedules, scheduleId, 'done');
  localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(updated));
  return updated;
}

export function writePlayerState(state: { isPlaying: boolean; manualOffset: number; pauseStart: number | null }): void {
  localStorage.setItem(STORAGE_KEYS.PLAYER_STATE, JSON.stringify({ ...state, timestamp: Date.now() }));
}

export function getPlayerState(): { isPlaying: boolean; manualOffset: number; pauseStart: number | null } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLAYER_STATE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setScheduleStatus(schedules: Schedule[], scheduleId: string, status: ScheduleStatus): Schedule[] {
  return schedules.map(s => s.id === scheduleId ? { ...s, status, updatedAt: new Date().toISOString() } : s);
}

export function getVenues(): Venue[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.VENUES);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveVenues(venues: Venue[]): void {
  localStorage.setItem(STORAGE_KEYS.VENUES, JSON.stringify(venues));
}

export function getSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

interface ServerFile {
  name: string;
  path: string;
  type: string;
  size: number;
}

export async function fetchFilesFromServer(type?: string): Promise<ServerFile[]> {
  try {
    const url = type
      ? APP_CONFIG.serverUrl + '/files?type=' + type
      : APP_CONFIG.serverUrl + '/files';
    const response = await fetch(url);
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

export interface ServerHealth {
  connected: boolean;
  contentRoot: string;
  exists: boolean;
  fileCount: number;
}

export async function checkServerHealth(): Promise<ServerHealth> {
  try {
    const response = await fetch(APP_CONFIG.serverUrl + '/health');
    if (!response.ok) {
      return { connected: false, contentRoot: '', exists: false, fileCount: 0 };
    }
    const data = await response.json();
    return {
      connected: true,
      contentRoot: data.contentRoot || '',
      exists: data.exists || false,
      fileCount: data.fileCount || 0,
    };
  } catch {
    return { connected: false, contentRoot: '', exists: false, fileCount: 0 };
  }
}

export const SAMPLE_CONTENT: LocalContent[] = [
  {
    id: 'sample-1',
    title: 'Welcome Video',
    type: 'video',
    filePath: 'sample-welcome.mp4',
    fileName: 'sample-welcome.mp4',
    mimeType: 'video/mp4',
    duration: 30,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sample-2',
    title: 'Background Music',
    type: 'audio',
    filePath: 'sample-background.mp3',
    fileName: 'sample-background.mp3',
    mimeType: 'audio/mpeg',
    duration: 180,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sample-3',
    title: 'Logo Display',
    type: 'image',
    filePath: 'sample-logo.png',
    fileName: 'sample-logo.png',
    mimeType: 'image/png',
    duration: 10,
    createdAt: new Date().toISOString(),
  },
];

export const SAMPLE_SCHEDULE: Schedule = {
  id: 'schedule-default',
  name: 'Daily Loop',
  items: [
    { contentId: 'sample-1', order: 0, duration: 30, audioOverlay: false },
    { contentId: 'sample-2', order: 1, duration: 180, audioOverlay: false },
    { contentId: 'sample-3', order: 2, duration: 10, audioOverlay: false },
  ],
  mode: 'loop',
  startTime: new Date(Date.now() + 60000).toISOString(),
  locationId: 'venue-default',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ─── Screen-Scoped Functions (multi-player) ─────────────────────────────────

export function getScreenById(screenId: string): ScreenConfig | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.VENUES);
    if (!stored) return null;
    const venues: Venue[] = JSON.parse(stored);
    for (const v of venues) {
      const found = v.screens.find(s => s.id === screenId);
      if (found) return found;
    }
    return null;
  } catch {
    return null;
  }
}

function getAssignedScheduleIds(): Set<string> {
  const ids = new Set<string>();
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.VENUES);
    if (!stored) return ids;
    const venues: Venue[] = JSON.parse(stored);
    for (const v of venues) {
      for (const s of v.screens) {
        if (s.scheduleId) ids.add(s.scheduleId);
      }
    }
  } catch { /* ignore */ }
  return ids;
}

export function getActiveScheduleForScreen(schedules: Schedule[], content: LocalContent[], screenId: string): Schedule | null {
  const screen = getScreenById(screenId);
  if (screen?.scheduleId) {
    const assigned = schedules.find(s => s.id === screen.scheduleId && s.status !== 'done');
    if (assigned) {
      const startDate = getScheduleStartTime(assigned);
      const totalDuration = getScheduleTotalDuration(assigned, content) * 1000;
      if (totalDuration <= 0) return null;
      const start = startDate.getTime();
      const end = assigned.mode === 'loop' ? Infinity : start + totalDuration;
      if (start <= Date.now() && Date.now() <= end) return assigned;
    }
  }
  const assignedIds = getAssignedScheduleIds();
  const unassigned = schedules.filter(s => !assignedIds.has(s.id));
  return getActiveSchedule(unassigned, content);
}

export function getUpcomingScheduleForScreen(schedules: Schedule[], content: LocalContent[], screenId: string): Schedule | null {
  const screen = getScreenById(screenId);
  if (screen?.scheduleId) {
    const assigned = schedules.find(s => s.id === screen.scheduleId && s.status !== 'done');
    if (assigned) {
      const startDate = getScheduleStartTime(assigned);
      if (startDate.getTime() > Date.now()) return assigned;
    }
  }
  const assignedIds = getAssignedScheduleIds();
  const unassigned = schedules.filter(s => !assignedIds.has(s.id));
  return getUpcomingSchedule(unassigned, content);
}

function screenSignalKey(base: string, screenId: string): string {
  return `${base}_${screenId}`;
}

export function emitSkipSignalForScreen(direction: 'next' | 'prev', screenId: string): void {
  const key = screenSignalKey('jemima_skip_signal', screenId);
  window.dispatchEvent(new CustomEvent(`skip-signal-${screenId}`, { detail: { direction, timestamp: Date.now() } }));
  localStorage.setItem(key, JSON.stringify({ direction, timestamp: Date.now() }));
}

export function emitResumeSignalForScreen(screenId: string): void {
  const key = screenSignalKey('jemima_resume_signal', screenId);
  window.dispatchEvent(new CustomEvent(`resume-signal-${screenId}`));
  localStorage.setItem(key, JSON.stringify({ timestamp: Date.now() }));
}

export function emitPauseSignalForScreen(screenId: string): void {
  const key = screenSignalKey('jemima_pause_signal', screenId);
  window.dispatchEvent(new CustomEvent(`pause-signal-${screenId}`));
  localStorage.setItem(key, JSON.stringify({ timestamp: Date.now() }));
}

export function emitDoneSignalForScreen(schedules: Schedule[], scheduleId: string, screenId: string): Schedule[] {
  const key = screenSignalKey('jemima_done_signal', screenId);
  window.dispatchEvent(new CustomEvent(`done-signal-${screenId}`));
  localStorage.setItem(key, JSON.stringify({ timestamp: Date.now() }));
  const updated = setScheduleStatus(schedules, scheduleId, 'done');
  localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(updated));
  return updated;
}

export function writeScreenPlayerState(screenId: string, state: { isPlaying: boolean; manualOffset: number; pauseStart: number | null }): void {
  const key = screenSignalKey('jemima_screen_player_state', screenId);
  localStorage.setItem(key, JSON.stringify({ ...state, timestamp: Date.now() }));
}

export function getScreenPlayerState(screenId: string): { isPlaying: boolean; manualOffset: number; pauseStart: number | null } | null {
  try {
    const key = screenSignalKey('jemima_screen_player_state', screenId);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function assignScheduleToScreen(screenId: string, scheduleId: string): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.VENUES);
    if (!stored) return;
    const venues: Venue[] = JSON.parse(stored);
    const updated = venues.map(v => ({
      ...v,
      screens: v.screens.map(s => s.id === screenId ? { ...s, scheduleId } : s),
    }));
    localStorage.setItem(STORAGE_KEYS.VENUES, JSON.stringify(updated));
  } catch { /* ignore */ }
}

export function unassignScheduleFromScreen(screenId: string): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.VENUES);
    if (!stored) return;
    const venues: Venue[] = JSON.parse(stored);
    const updated = venues.map(v => ({
      ...v,
      screens: v.screens.map(s => {
        if (s.id !== screenId) return s;
        const { scheduleId, ...rest } = s;
        return rest;
      }),
    }));
    localStorage.setItem(STORAGE_KEYS.VENUES, JSON.stringify(updated));
  } catch { /* ignore */ }
}

export function getAllScreens(): ScreenConfig[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.VENUES);
    if (!stored) return [];
    const venues: Venue[] = JSON.parse(stored);
    return venues.flatMap(v => v.screens);
  } catch {
    return [];
  }
}
