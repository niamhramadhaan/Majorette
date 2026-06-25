import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Plus, Calendar, ExternalLink, Music, Image as ImageIcon, Film, Clock, SkipBack, SkipForward, CheckCircle, RotateCcw, X, CheckCircle2, History, Keyboard, Monitor, Check, ChevronsUpDown, ChevronLeft, ChevronRight, ChevronDown, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { createPortal } from 'react-dom';
import { STORAGE_KEYS, getActivities, getThumbnailUrl, getActiveSchedule, getUpcomingSchedule, getScheduleStartTime, emitSkipSignal, emitResumeSignal, emitDoneSignal, getPlayerState, getScheduleElapsed, getCurrentItemIndex, generateId, getTimestamp, getScheduleTotalDuration, resolveFilePath, getAllScreens, getScreenPlayerState, getActiveScheduleForScreen, assignScheduleToScreen, emitSkipSignalForScreen, emitPauseSignalForScreen, emitResumeSignalForScreen, emitDoneSignalForScreen, getUpcomingScheduleForScreen, addActivity, syncToApi, getScheduleConflicts, type ScheduleConflict } from '../lib/storage';
import type { LocalContent, Schedule, ActivityLog, ScheduleItem, ScreenConfig } from '../types';

function toDatetimeLocal(isoString: string): string {
  try {
    const d = new Date(isoString);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return ''; }
}

function TimeIcon({ hour }: { hour: number }) {
  if (hour >= 5 && hour < 8) {
    return (
      <svg className="w-8 h-8 text-orange-400 animate-icon-float" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
        <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.3" />
        <path d="M12 16v4" strokeDasharray="2 2" opacity="0.5" />
      </svg>
    );
  }
  if (hour >= 8 && hour < 17) {
    return (
      <svg className="w-8 h-8 text-yellow-500 animate-icon-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.4" />
        <path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
      </svg>
    );
  }
  if (hour >= 17 && hour < 19) {
    return (
      <svg className="w-8 h-8 text-orange-500 animate-icon-glow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 10V2" /><path d="m4.93 10.93 1.41 1.41" /><path d="M2 18h2" /><path d="M20 18h2" /><path d="m19.07 10.93-1.41 1.41" /><path d="M22 22H2" /><path d="m8 22 4-10 4 10" />
        <circle cx="12" cy="6" r="3" fill="currentColor" opacity="0.3" />
      </svg>
    );
  }
  return (
    <svg className="w-8 h-8 text-indigo-400 animate-icon-glow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" fill="currentColor" opacity="0.2" />
    </svg>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [content, setContent] = useState<LocalContent[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [playerIsPlaying, setPlayerIsPlaying] = useState(true);
  const [doneModalSchedule, setDoneModalSchedule] = useState<Schedule | null>(null);
  const [recreateFromSchedule, setRecreateFromSchedule] = useState<Schedule | null>(null);
  const [recreateMode, setRecreateMode] = useState<'loop' | 'once'>('loop');
  const [recreateStartTime, setRecreateStartTime] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 5, 0, 0);
    return d.toISOString();
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [screens, setScreens] = useState<ScreenConfig[]>([]);
  const [recreateScreenIds, setRecreateScreenIds] = useState<string[]>(['screen-default']);
  const [showRecreateScreenDropdown, setShowRecreateScreenDropdown] = useState(false);
  const [activeScreenWarnings, setActiveScreenWarnings] = useState<{ id: string; name: string; scheduleName: string }[] | null>(null);
  const [conflictWarnings, setConflictWarnings] = useState<ScheduleConflict[] | null>(null);
  const [pendingRecreate, setPendingRecreate] = useState<{ newSchedule: Schedule } | null>(null);
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  const [showOpenPlayerDropdown, setShowOpenPlayerDropdown] = useState(false);
  const openPlayerDropdownRef = useRef<HTMLDivElement>(null);
  const recreateScreenDropdownRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const poll = setInterval(() => {
      const state = getPlayerState();
      if (state) setPlayerIsPlaying(state.isPlaying);
    }, 1000);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (recreateScreenDropdownRef.current && !recreateScreenDropdownRef.current.contains(e.target as Node)) {
        setShowRecreateScreenDropdown(false);
      }
      if (openPlayerDropdownRef.current && !openPlayerDropdownRef.current.contains(e.target as Node)) {
        setShowOpenPlayerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = () => {
    try {
      const storedContent = localStorage.getItem(STORAGE_KEYS.CONTENT);
      const storedSchedules = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
      if (storedContent) setContent(JSON.parse(storedContent));
      if (storedSchedules) setSchedules(JSON.parse(storedSchedules));
      setActivities(getActivities());
      setScreens(getAllScreens());
    } catch { /* ignore */ }
  };

  const activeSchedule = getActiveSchedule(schedules, content);
  const upcomingSchedule = !activeSchedule ? getUpcomingSchedule(schedules, content) : null;
  const scheduleItems = activeSchedule?.items || [];
  const playerState = getPlayerState();
  const pauseElapsed = playerState?.pauseStart ? (Date.now() - playerState.pauseStart) / 1000 : 0;
  const rawElapsed = activeSchedule ? getScheduleElapsed(activeSchedule, content) / 1000 : 0;
  const elapsedSec = playerState ? rawElapsed - pauseElapsed + (playerState.manualOffset || 0) : rawElapsed;
  const currentItemResult = activeSchedule ? getCurrentItemIndex(activeSchedule, content, elapsedSec) : null;
  const currentItem = currentItemResult && scheduleItems[currentItemResult.index]
    ? content.find(c => c.id === scheduleItems[currentItemResult.index].contentId)
    : null;
  const currentItemDuration = currentItem
    ? (scheduleItems[currentItemResult!.index]?.duration || currentItem.duration)
    : 0;
  const currentItemProgress = currentItemDuration > 0
    ? Math.min((currentItemResult!.offset / currentItemDuration) * 100, 100)
    : 0;
  const selectedScreen = screens.length > 0 ? screens[Math.min(currentScreenIndex, screens.length - 1)] : null;
  const selectedScreenSchedule = selectedScreen ? getActiveScheduleForScreen(schedules, content, selectedScreen.id) : activeSchedule;
  const selectedScreenItems = selectedScreenSchedule?.items || [];
  const selectedScreenState = selectedScreen ? getScreenPlayerState(selectedScreen.id) : playerState;
  const selectedScreenPauseElapsed = selectedScreenState?.pauseStart ? (Date.now() - selectedScreenState.pauseStart) / 1000 : 0;
  const selectedScreenRawElapsed = selectedScreenSchedule ? getScheduleElapsed(selectedScreenSchedule, content) / 1000 : 0;
  const selectedScreenElapsed = selectedScreenState ? selectedScreenRawElapsed - selectedScreenPauseElapsed + (selectedScreenState.manualOffset || 0) : selectedScreenRawElapsed;
  const selectedScreenItemResult = selectedScreenSchedule ? getCurrentItemIndex(selectedScreenSchedule, content, selectedScreenElapsed) : null;
  const nextItems = (() => {
    const currentIdx = selectedScreenItemResult?.index ?? 0;
    const after = selectedScreenItems.slice(currentIdx + 1, currentIdx + 4);
    if (selectedScreenSchedule?.mode === 'loop' && after.length < 3) {
      const remaining = 3 - after.length;
      const wrapped = selectedScreenItems.slice(0, remaining);
      return [...after, ...wrapped].map(item => {
        const contentItem = content.find(c => c.id === item.contentId);
        return { ...item, content: contentItem };
      });
    }
    return after.map(item => {
      const contentItem = content.find(c => c.id === item.contentId);
      return { ...item, content: contentItem };
    });
  })();
  const isLooping = selectedScreenSchedule?.mode === 'loop' && selectedScreenItems.length > 1 && (selectedScreenItemResult?.index ?? 0) >= selectedScreenItems.length - 1;

  const getUpcomingStart = (): Date | null => {
    if (!upcomingSchedule) return null;
    return getScheduleStartTime(upcomingSchedule);
  };

  const getUpcomingCountdown = (): number => {
    const start = getUpcomingStart();
    if (!start) return 0;
    return Math.max(0, (start.getTime() - Date.now()) / 1000);
  };

  const formatCountdown = (totalSec: number): { h: string; m: string; s: string; display: string } => {
    if (totalSec <= 0) return { h: '', m: '', s: '0', display: '0s' };
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = Math.floor(totalSec % 60);
    const parts: string[] = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return { h: h > 0 ? `${h}` : '', m: m > 0 ? `${m}` : '', s: `${s}`, display: parts.join(' ') };
  };

  const upcomingCountdownSec = getUpcomingCountdown();
  const isUpcomingSoon = upcomingCountdownSec > 0 && upcomingCountdownSec <= 600;
  const upcomingFirstItem = upcomingSchedule?.items[0]
    ? content.find(c => c.id === upcomingSchedule.items[0].contentId)
    : null;

  const lastPlayedSchedules = schedules
    .filter(s => s.status === 'done')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const topMedia = (() => {
    const playCount = new Map<string, number>();
    schedules.forEach(s => s.items.forEach(item => {
      playCount.set(item.contentId, (playCount.get(item.contentId) || 0) + 1);
    }));
    return content
      .map(c => ({ ...c, playCount: playCount.get(c.id) || 0 }))
      .filter(c => c.playCount > 0)
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 5);
  })();

  const getRelativeTime = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const formatElapsed = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const venueName = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    ? JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)!).venueName
    : 'Your Venue';

  const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const getContentIcon = (type?: string) => {
    switch (type) {
      case 'video': return <Film className="w-6 h-6 text-gray-400" />;
      case 'audio': return <Music className="w-6 h-6 text-gray-400" />;
      default: return <ImageIcon className="w-6 h-6 text-gray-400" />;
    }
  };

  const getContentTitle = (contentId: string) => {
    const item = content.find(c => c.id === contentId);
    return item?.title || 'Unknown';
  };

  const handleRecreate = () => {
    if (!recreateFromSchedule) return;
    if (new Date(recreateStartTime).getTime() < Date.now()) {
      showToast('Start time must be now or in the future');
      return;
    }
    const newSchedule: Schedule = {
      id: generateId(),
      name: recreateFromSchedule.name,
      items: recreateFromSchedule.items,
      mode: recreateMode,
      startTime: recreateStartTime,
      locationId: recreateFromSchedule.locationId,
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
    };

    const screenIdsToAssign = recreateScreenIds.length > 0 ? recreateScreenIds : ['screen-default'];
    const conflicts = getScheduleConflicts(recreateStartTime, recreateFromSchedule.items, recreateMode, screenIdsToAssign, schedules, content);
    if (conflicts.length > 0) {
      setConflictWarnings(conflicts);
      return;
    }

    const warnings: { id: string; name: string; scheduleName: string }[] = [];
    for (const screenId of screenIdsToAssign) {
      const screenState = getScreenPlayerState(screenId);
      const isOnline = screenState && (Date.now() - (screenState as any).timestamp) < 30000;
      const isPlaying = isOnline && screenState?.isPlaying !== false;
      if (isPlaying) {
        const activeSchedule = getActiveScheduleForScreen(schedules, content, screenId);
        if (activeSchedule) {
          const screenName = screens.find(s => s.id === screenId)?.name || screenId;
          warnings.push({ id: screenId, name: screenName, scheduleName: activeSchedule.name });
        }
      }
    }

    if (warnings.length > 0) {
      setActiveScreenWarnings(warnings);
      setPendingRecreate({ newSchedule });
      return;
    }

    performRecreate(newSchedule);
  };

  const performRecreate = (newSchedule: Schedule) => {
    const updated = [...schedules, newSchedule];
    setSchedules(updated);
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(updated));
    syncToApi('/api/schedules', updated);
    const screenIdsToAssign = recreateScreenIds.length > 0 ? recreateScreenIds : ['screen-default'];
    for (const screenId of screenIdsToAssign) {
      assignScheduleToScreen(screenId, newSchedule.id);
      const screenName = screens.find(s => s.id === screenId)?.name || screenId;
      addActivity({ message: `Assigned "${newSchedule.name}" to ${screenName}`, type: 'success' });
    }
    setScreens(getAllScreens());
    setRecreateFromSchedule(null);
    setRecreateScreenIds(['screen-default']);
    setShowRecreateScreenDropdown(false);
    showToast('New schedule created');
  };

  const confirmActiveScreenRecreate = () => {
    if (!pendingRecreate) return;
    const { newSchedule } = pendingRecreate;
    setActiveScreenWarnings(null);
    setPendingRecreate(null);
    performRecreate(newSchedule);
  };

  const openRecreateFromDone = (schedule: Schedule) => {
    setRecreateFromSchedule(schedule);
    setRecreateMode(schedule.mode);
    setRecreateScreenIds(['screen-default']);
    setShowRecreateScreenDropdown(false);
    const d = new Date();
    d.setMinutes(d.getMinutes() + 5, 0, 0);
    setRecreateStartTime(d.toISOString());
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="bg-secondary/20 text-primary-dark px-4 py-3 rounded-lg border border-secondary/50 flex items-center gap-2 font-medium animate-in fade-in slide-in-from-top-2 text-sm">
          <CheckCircle2 className="w-4 h-4" />
          {toastMessage}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <TimeIcon hour={currentTime.getHours()} />
          <div>
            <h1 className="text-2xl font-heading font-bold text-gray-900">{venueName}</h1>
            <p className="text-sm text-gray-500 mt-1">{formatDate(currentTime)} &middot; {formatTime(currentTime)}</p>
          </div>
        </div>
        <div className="relative" ref={openPlayerDropdownRef}>
          <button onClick={() => {
            if (screens.length <= 1) {
              window.open(screens.length === 1 ? `/player/screen/${screens[0].id}` : '/player', '_blank');
            } else {
              setShowOpenPlayerDropdown(!showOpenPlayerDropdown);
            }
          }} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
            <ExternalLink className="w-4 h-4" /> Open Player {screens.length > 1 && <ChevronDown className="w-3 h-3" />}
          </button>
          {showOpenPlayerDropdown && screens.length > 1 && (
            <div className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 py-2 w-48 z-50">
              <button onClick={() => { window.open('/player', '_blank'); setShowOpenPlayerDropdown(false); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <Play className="w-3.5 h-3.5 text-gray-400" /> Default Player
              </button>
              <div className="border-t border-gray-100 my-1" />
              {screens.map(s => (
                <button key={s.id} onClick={() => { window.open(`/player/screen/${s.id}`, '_blank'); setShowOpenPlayerDropdown(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <Monitor className="w-3.5 h-3.5 text-gray-400" /> {s.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            {screens.length > 0 ? (() => {
              const screen = screens[Math.min(currentScreenIndex, screens.length - 1)];
              const screenSchedule = getActiveScheduleForScreen(schedules, content, screen.id);
              const screenUpcoming = !screenSchedule ? getUpcomingScheduleForScreen(schedules, content, screen.id) : null;
              const screenItems = screenSchedule?.items || [];
              const screenState = getScreenPlayerState(screen.id);
              const sPauseElapsed = screenState?.pauseStart ? (Date.now() - screenState.pauseStart) / 1000 : 0;
              const sRawElapsed = screenSchedule ? getScheduleElapsed(screenSchedule, content) / 1000 : 0;
              const sElapsed = screenState ? sRawElapsed - sPauseElapsed + (screenState.manualOffset || 0) : sRawElapsed;
              const sItemResult = screenSchedule ? getCurrentItemIndex(screenSchedule, content, sElapsed) : null;
              const sCurrentItem = sItemResult && screenItems[sItemResult.index] ? content.find(c => c.id === screenItems[sItemResult.index].contentId) : null;
              const sItemDuration = sCurrentItem ? (screenItems[sItemResult!.index]?.duration || sCurrentItem.duration) : 0;
              const sProgress = sItemDuration > 0 ? Math.min((sItemResult!.offset / sItemDuration) * 100, 100) : 0;
              const sIsPlaying = screenState?.isPlaying !== false;
              const sUpcomingStart = screenUpcoming ? getScheduleStartTime(screenUpcoming) : null;
              const sUpcomingCountdown = sUpcomingStart ? Math.max(0, (sUpcomingStart.getTime() - Date.now()) / 1000) : 0;
              const sFirstItem = screenUpcoming?.items[0] ? content.find(c => c.id === screenUpcoming.items[0].contentId) : null;
              const sIsLastItem = sItemResult && sItemResult.index >= screenItems.length - 1;
              const sIsLooping = screenSchedule?.mode === 'loop' && screenItems.length > 1 && sIsLastItem;
              const sFirstLoopItem = sIsLooping ? content.find(c => c.id === screenItems[0].contentId) : null;

              return (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setCurrentScreenIndex(i => i > 0 ? i - 1 : screens.length - 1)}
                        className="p-1 text-gray-400 hover:text-primary transition-colors" title="Previous screen">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <h2 className="font-heading font-semibold text-gray-800 flex items-center gap-2">
                        <Monitor className="w-5 h-5 text-primary" /> {screen.name}
                      </h2>
                      <button onClick={() => setCurrentScreenIndex(i => i < screens.length - 1 ? i + 1 : 0)}
                        className="p-1 text-gray-400 hover:text-primary transition-colors" title="Next screen">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      {screens.length > 1 && <span className="text-xs text-gray-400 ml-1">{currentScreenIndex + 1}/{screens.length}</span>}
                    </div>
                    {screenSchedule && (
                      <span className="px-3 py-1 bg-primary/10 text-primary-dark text-xs font-medium rounded-full border border-primary/20">
                        {screenSchedule.name}{screenSchedule.mode === 'loop' ? ' ↻' : ''}
                      </span>
                    )}
                  </div>
                  {screenSchedule?.status === 'done' ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-primary mx-auto mb-3" />
                      <p className="text-gray-900 font-semibold text-lg mb-1">{screenSchedule.name}</p>
                      <p className="text-gray-400 mb-4">Schedule Completed</p>
                      <button onClick={() => openRecreateFromDone(screenSchedule)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors">
                        <RotateCcw className="w-4 h-4" /> Play Again
                      </button>
                    </div>
                  ) : sCurrentItem ? (
                    <div className="flex items-center gap-6">
                      <div className="w-32 h-20 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-200 overflow-hidden">
                        {getThumbnailUrl(sCurrentItem) ? (
                          <img src={getThumbnailUrl(sCurrentItem)!} alt="" className="w-full h-full object-cover" />
                        ) : (
                          getContentIcon(sCurrentItem.type)
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900">{sCurrentItem.title}</h3>
                        <p className="text-sm text-gray-500 mt-1 capitalize">{sCurrentItem.type} - {sCurrentItem.duration}s - {sCurrentItem.fileName}</p>
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden"><div className={cn("bg-primary h-full rounded-full transition-all duration-500", sIsPlaying && "animate-pulse-bar")} style={{ width: Math.min(sProgress, 100) + '%' }} /></div>
                          <button onClick={() => emitSkipSignalForScreen('prev', screen.id)} className="p-1.5 text-gray-400 hover:text-primary transition-all active:scale-90" title="Previous">
                            <SkipBack className="w-4 h-4" />
                          </button>
                          <button onClick={() => emitSkipSignalForScreen('next', screen.id)} className="p-1.5 text-gray-400 hover:text-primary transition-all active:scale-90" title="Next">
                            <SkipForward className="w-4 h-4" />
                          </button>
                          {sIsPlaying ? (
                            <button onClick={() => emitPauseSignalForScreen(screen.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-all active:scale-90" title="Pause">
                              <Pause className="w-4 h-4" />
                            </button>
                          ) : (
                            <button onClick={() => emitResumeSignalForScreen(screen.id)} className="p-1.5 text-gray-400 hover:text-primary transition-all active:scale-90" title="Resume">
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => { setDoneModalSchedule(screenSchedule); }} className="p-1.5 text-green-500 hover:text-red-500 transition-all active:scale-90" title="Mark Done">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : sIsLooping ? (
                    <div className="py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-14 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 border border-primary/20">
                          <RotateCcw className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-primary font-semibold uppercase tracking-wide mb-0.5">↻ Looping</p>
                          <p className="font-heading font-semibold text-gray-900 truncate">{screenSchedule.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">Back to: {sFirstLoopItem?.title || 'first item'}</p>
                        </div>
                      </div>
                    </div>
                  ) : screenUpcoming ? (
                    sUpcomingCountdown > 0 && sUpcomingCountdown <= 600 ? (
                      <div className="py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200 overflow-hidden">
                            {sFirstItem && getThumbnailUrl(sFirstItem) ? (
                              <img src={getThumbnailUrl(sFirstItem)!} alt="" className="w-full h-full object-cover" />
                            ) : (
                              getContentIcon(sFirstItem?.type)
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-primary font-semibold uppercase tracking-wide mb-0.5">Starting Soon</p>
                            <p className="font-heading font-semibold text-gray-900 truncate">{screenUpcoming.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{sFirstItem?.title || 'Unknown content'}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-lg font-mono font-bold text-primary">{formatCountdown(sUpcomingCountdown).display}</p>
                          </div>
                        </div>
                        <button onClick={() => window.open(`/player/screen/${screen.id}`, '_blank')} className="mt-4 w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
                          <ExternalLink className="w-4 h-4" /> Open Player
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-400 mb-1">No schedule playing right now</p>
                        <p className="text-primary font-medium">{screenUpcoming.name}</p>
                        <p className="text-xs text-gray-500 mt-1">Starts {sUpcomingStart ? formatTime(sUpcomingStart) : 'soon'}</p>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8">
                      <Play className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No content playing</p>
                      <button onClick={() => navigate('/schedule')} className="mt-3 text-sm text-primary hover:text-primary-dark font-medium">Create a Schedule</button>
                    </div>
                  )}
                </>
              );
            })() : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading font-semibold text-gray-800 flex items-center gap-2"><Play className="w-5 h-5 text-primary" /> Now Playing</h2>
                  {activeSchedule && (
                    <span className="px-3 py-1 bg-primary/10 text-primary-dark text-xs font-medium rounded-full border border-primary/20">
                      {activeSchedule.name}{activeSchedule.mode === 'loop' ? ' ↻' : ''}
                    </span>
                  )}
                </div>
                {activeSchedule?.status === 'done' ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-primary mx-auto mb-3" />
                    <p className="text-gray-900 font-semibold text-lg mb-1">{activeSchedule.name}</p>
                    <p className="text-gray-400 mb-4">Schedule Completed</p>
                    <button onClick={() => openRecreateFromDone(activeSchedule)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors">
                      <RotateCcw className="w-4 h-4" /> Play Again
                    </button>
                  </div>
                ) : currentItem ? (
                  <div className="flex items-center gap-6">
                    <div className="w-32 h-20 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-200 overflow-hidden">
                      {getThumbnailUrl(currentItem) ? (
                        <img src={getThumbnailUrl(currentItem)!} alt="" className="w-full h-full object-cover" />
                      ) : (
                        getContentIcon(currentItem.type)
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900">{currentItem.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 capitalize">{currentItem.type} - {currentItem.duration}s - {currentItem.fileName}</p>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden"><div className={cn("bg-primary h-full rounded-full transition-all duration-500", playerIsPlaying && "animate-pulse-bar")} style={{ width: Math.min(currentItemProgress, 100) + '%' }} /></div>
                        <button onClick={() => emitSkipSignal('prev')} className="p-1.5 text-gray-400 hover:text-primary transition-all active:scale-90" title="Previous"><SkipBack className="w-4 h-4" /></button>
                        <button onClick={() => emitSkipSignal('next')} className="p-1.5 text-gray-400 hover:text-primary transition-all active:scale-90" title="Next"><SkipForward className="w-4 h-4" /></button>
                        {playerIsPlaying ? (
                          <button onClick={() => { window.dispatchEvent(new CustomEvent('pause-signal')); localStorage.setItem(STORAGE_KEYS.PAUSE_SIGNAL, JSON.stringify({ timestamp: Date.now() })); }} className="p-1.5 text-gray-400 hover:text-red-500 transition-all active:scale-90" title="Pause"><Pause className="w-4 h-4" /></button>
                        ) : (
                          <button onClick={() => emitResumeSignal()} className="p-1.5 text-gray-400 hover:text-primary transition-all active:scale-90" title="Resume"><Play className="w-4 h-4" /></button>
                        )}
                        <button onClick={() => setDoneModalSchedule(activeSchedule)} className="p-1.5 text-green-500 hover:text-red-500 transition-all active:scale-90" title="Mark Done"><CheckCircle className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Play className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No content playing</p>
                    <button onClick={() => navigate('/schedule')} className="mt-3 text-sm text-primary hover:text-primary-dark font-medium">Create a Schedule</button>
                  </div>
                )}
              </>
            )}
          </div>

          {nextItems.length > 0 && (
            <div className="card p-6">
              <h2 className="font-heading font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" /> Up Next
                {isLooping && <span className="px-2 py-0.5 bg-primary/10 text-primary-dark text-[10px] font-semibold rounded-full">↻ Loop</span>}
              </h2>
              <div className="space-y-3">
                {nextItems.map((item, index) => {
                  const isWrapped = index >= (selectedScreenItems.length - 1 - (selectedScreenItemResult?.index ?? 0));
                  return (
                    <div key={`${item.contentId}-${index}`} className={cn("flex items-center gap-4 p-3 rounded-xl transition-colors", isWrapped ? "bg-primary/5 hover:bg-primary/10" : "bg-gray-50 hover:bg-gray-100")}>
                      <span className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold text-gray-500">{index + 2}</span>
                      <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {item.content && getThumbnailUrl(item.content) ? (
                          <img src={getThumbnailUrl(item.content)!} alt="" className="w-full h-full object-cover" />
                        ) : (
                          getContentIcon(item.content?.type)
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">{item.content?.title || 'Unknown'}</p>
                        <p className="text-xs text-gray-500 capitalize">{item.content?.type} - {item.duration || item.content?.duration}s</p>
                      </div>
                      {isWrapped && <span className="text-[10px] text-primary font-medium">↻ Loop</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {lastPlayedSchedules.length > 0 && (
            <div className="card p-6">
              <h3 className="text-sm font-heading font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <History className="w-4 h-4 text-gray-400" /> Last Play
              </h3>
              <div className="relative">
                <div className="absolute left-[5px] top-2 bottom-2 w-px bg-gray-200" />
                <div className="space-y-4">
                  {lastPlayedSchedules.slice(0, 5).map(schedule => {
                    const assignedScreens = screens.filter(s => s.scheduleId === schedule.id);
                    const screenLabel = assignedScreens.length === 0 ? 'Default' : assignedScreens.length === 1 ? assignedScreens[0].name : `${assignedScreens.length} screens`;
                    return (
                      <div key={schedule.id} className="relative pl-6 group">
                        <div className={cn(
                          "absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full border-2 border-white ring-1 ring-gray-200",
                          schedule.mode === 'loop' ? "bg-primary" : "bg-gray-400"
                        )} />
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900 truncate">{schedule.name}</p>
                          <span className="text-xs text-gray-400 font-mono flex-shrink-0">{formatElapsed(getScheduleTotalDuration(schedule, content))}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="flex items-center gap-1 text-[11px] text-gray-500">
                            <Monitor className="w-3 h-3" /> {screenLabel}
                          </span>
                          <span className="text-gray-300">&middot;</span>
                          <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded",
                            schedule.mode === 'loop' ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500"
                          )}>
                            {schedule.mode === 'loop' ? '↻ Loop' : 'Once'}
                          </span>
                          <span className="text-gray-300">&middot;</span>
                          <span className="text-[11px] text-gray-400">{getRelativeTime(schedule.updatedAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {topMedia.length > 0 && (
            <div className="card p-6">
              <h2 className="font-heading font-semibold text-gray-800 mb-4">Top Played Media</h2>
              <div className="space-y-3">
                {topMedia.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <span className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                      index === 0 ? "bg-yellow-100 text-yellow-700" : index === 1 ? "bg-gray-200 text-gray-600" : index === 2 ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-500")}>
                      {index + 1}
                    </span>
                    <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {getThumbnailUrl(item) ? (
                        <img src={getThumbnailUrl(item)!} alt="" className="w-full h-full object-cover" />
                      ) : (
                        getContentIcon(item.type)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{item.title}</p>
                      <p className="text-xs text-gray-500 capitalize">{item.type}</p>
                    </div>
                    <span className="text-xs font-semibold text-gray-400 flex-shrink-0">{item.playCount}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="font-heading font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button onClick={() => navigate('/films/ingest')} className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center"><Plus className="w-5 h-5 text-primary" /></div>
                <div><p className="text-sm font-medium text-gray-700">Add Content</p><p className="text-xs text-gray-500">Select media files</p></div>
              </button>
              <button onClick={() => navigate('/schedule')} className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center"><Calendar className="w-5 h-5 text-primary" /></div>
                <div><p className="text-sm font-medium text-gray-700">Edit Schedule</p><p className="text-xs text-gray-500">Manage your playlists</p></div>
              </button>
              <button onClick={() => window.open('/player', '_blank')} className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center"><ExternalLink className="w-5 h-5 text-primary" /></div>
                <div><p className="text-sm font-medium text-gray-700">Open Player</p><p className="text-xs text-gray-500">Launch on your screen</p></div>
              </button>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-heading font-semibold text-gray-800 mb-4">Stats</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between"><span className="text-sm text-gray-500">Content Items</span><span className="text-sm font-semibold text-gray-700">{content.length}</span></div>
              <div className="flex items-center justify-between"><span className="text-sm text-gray-500">Schedules</span><span className="text-sm font-semibold text-gray-700">{schedules.length}</span></div>
              {activeSchedule ? (
                <div className="flex items-center justify-between"><span className="text-sm text-gray-500">Now Playing</span><span className="text-sm font-semibold text-primary">{activeSchedule.name}</span></div>
              ) : upcomingSchedule ? (
                <div className="flex items-center justify-between"><span className="text-sm text-gray-500">Next Schedule</span><span className="text-sm font-semibold text-gray-700">{upcomingSchedule.name}</span></div>
              ) : (
                <div className="flex items-center justify-between"><span className="text-sm text-gray-500">Now Playing</span><span className="text-sm font-semibold text-gray-400">None</span></div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-heading font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-gray-400" /> Player Shortcuts
            </h2>
            <div className="space-y-2.5">
              {[
                { key: 'Space', desc: 'Play / Pause' },
                { key: 'F', desc: 'Fullscreen' },
                { key: 'M', desc: 'Mute / Unmute' },
                { key: 'L', desc: 'Lock controls' },
                { key: '?', desc: 'Show shortcuts' },
              ].map(({ key, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{desc}</span>
                  <kbd className="px-2 py-0.5 bg-gray-100 border border-gray-200 rounded text-[11px] text-gray-700 font-mono font-medium min-w-[28px] text-center">{key}</kbd>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-3 pt-3 border-t border-gray-100">These shortcuts work on the <a href="/player" className="text-primary hover:underline">Player</a> page.</p>
          </div>

          {activities.length > 0 && (
            <div className="card p-6">
              <h2 className="font-heading font-semibold text-gray-800 mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={cn("w-2 h-2 rounded-full mt-2 flex-shrink-0", activity.type === 'success' ? "bg-green-500" : activity.type === 'warning' ? "bg-yellow-500" : "bg-blue-500")} />
                    <div><p className="text-sm text-gray-700">{activity.message}</p><p className="text-xs text-gray-400 mt-0.5">{new Date(activity.timestamp).toLocaleTimeString()}</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {doneModalSchedule && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 animate-in fade-in backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in slide-in-from-bottom-4">
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-lg text-gray-900">Mark as Done?</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Mark <span className="font-medium text-gray-700">{doneModalSchedule.name}</span> as completed? This will stop playback.
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setDoneModalSchedule(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 bg-white border border-gray-200 rounded-lg transition-colors">Cancel</button>
              <button onClick={() => { setSchedules(emitDoneSignal(schedules, doneModalSchedule.id)); setDoneModalSchedule(null); showToast('Schedule marked as done'); }} className="px-5 py-2 text-sm font-medium text-white bg-green-600 hover:bg-red-500 rounded-lg transition-colors shadow-sm">
                Mark Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {recreateFromSchedule && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 animate-in fade-in backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col animate-in slide-in-from-bottom-4">
            <div className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg text-gray-900">Play Again</h3>
                    <p className="text-xs text-gray-500">Create a new schedule with the same content</p>
                  </div>
                </div>
                <button onClick={() => setRecreateFromSchedule(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-900 mb-2">{recreateFromSchedule.name}</p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {recreateFromSchedule.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center text-[10px] font-bold text-gray-400">{index + 1}</span>
                      <span className="flex-1 truncate">{getContentTitle(item.contentId)}</span>
                      <span className="text-gray-400 capitalize">{item.duration || '?'}s</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Start Time</label>
                  <input
                    type="datetime-local"
                    min={toDatetimeLocal(new Date().toISOString())}
                    value={toDatetimeLocal(recreateStartTime)}
                    onChange={(e) => {
                      try { setRecreateStartTime(new Date(e.target.value).toISOString()); } catch {}
                    }}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Mode</label>
                  <select
                    value={recreateMode}
                    onChange={(e) => setRecreateMode(e.target.value as 'loop' | 'once')}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="loop">Loop</option>
                    <option value="once">Play Once</option>
                  </select>
                </div>
                {screens.length > 0 && (
                  <div ref={recreateScreenDropdownRef}>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Assign to Screens <span className="text-gray-400 font-normal">(optional)</span></label>
                    <div className="relative">
                      <button type="button" onClick={() => setShowRecreateScreenDropdown(!showRecreateScreenDropdown)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <span className="flex items-center gap-2">
                          <Monitor className="w-3.5 h-3.5 text-gray-400" />
                          {recreateScreenIds.length === 0 ? 'No screens selected' : `${recreateScreenIds.length} screen${recreateScreenIds.length > 1 ? 's' : ''} selected`}
                        </span>
                        <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                      {showRecreateScreenDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 max-h-48 overflow-y-auto">
                          {screens.map(s => {
                            const isSelected = recreateScreenIds.includes(s.id);
                            return (
                              <button key={s.id} type="button"
                                onClick={() => setRecreateScreenIds(prev => isSelected ? prev.filter(id => id !== s.id) : [...prev, s.id])}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 transition-colors">
                                <div className={cn("w-4 h-4 rounded flex items-center justify-center border-2 transition-colors flex-shrink-0",
                                  isSelected ? "bg-primary border-primary" : "border-gray-300")}>
                                  {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <Monitor className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                <span className="text-sm text-gray-700 truncate">{s.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setRecreateFromSchedule(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 bg-white border border-gray-200 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleRecreate} className="px-5 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors shadow-sm">
                Create Schedule
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {activeScreenWarnings && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 text-center p-6">
            <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center mx-auto mb-4 border border-yellow-100"><AlertTriangle className="w-6 h-6 text-yellow-500" /></div>
            <h3 className="font-heading font-semibold text-lg text-gray-900 mb-2">Screens Currently Playing</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-left space-y-2">
              {activeScreenWarnings.map(w => (
                <p key={w.id} className="text-xs font-medium text-yellow-800">
                  <span className="font-semibold">{w.name}</span> is playing "<span className="font-semibold">{w.scheduleName}</span>"
                </p>
              ))}
            </div>
            <p className="text-gray-500 text-sm mb-6">Assigning a new schedule will interrupt playback on these screens. Continue?</p>
            <div className="flex items-center gap-3 w-full">
              <button onClick={() => { setActiveScreenWarnings(null); setPendingRecreate(null); }} className="flex-1 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-lg text-sm font-medium transition-colors cursor-pointer">Cancel</button>
              <button onClick={confirmActiveScreenRecreate} className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors cursor-pointer shadow-sm">Continue</button>
            </div>
          </div>
        </div>, document.body
      )}

      {conflictWarnings && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 text-center p-6">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 border border-red-100"><AlertTriangle className="w-6 h-6 text-red-500" /></div>
            <h3 className="font-heading font-semibold text-lg text-gray-900 mb-2">Schedule Conflict</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-left space-y-3">
              {conflictWarnings.map(w => (
                <div key={w.screenId}>
                  <p className="text-xs font-semibold text-red-800">
                    {w.screenName} — "<span className="font-bold">{w.conflictingScheduleName}</span>"
                  </p>
                  <p className="text-[11px] text-red-600 mt-0.5">
                    {toDatetimeLocal(w.conflictingScheduleStart)}
                    {w.conflictingScheduleEnd ? ` — ${toDatetimeLocal(w.conflictingScheduleEnd)}` : ' — Plays until stopped'}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-gray-500 text-sm mb-6">Remove the conflicting screens or change the start time to continue.</p>
            <button onClick={() => setConflictWarnings(null)} className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors cursor-pointer shadow-sm">Go Back</button>
          </div>
        </div>, document.body
      )}
    </div>
  );
}
