import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Maximize, Minimize, Volume2, VolumeX, Film, AlertCircle, Clock, Music, CheckCircle, Lock, LockOpen, Keyboard } from 'lucide-react';
import { cn } from '../lib/utils';
import { STORAGE_KEYS, resolveFilePath, getActiveSchedule, getUpcomingSchedule, getCurrentItemIndex, getScheduleElapsed, getScheduleStartTime, getThumbnailUrl, writePlayerState, getSettings } from '../lib/storage';
import type { LocalContent, Schedule, ScheduleItem } from '../types';

const SKIP_DELAY = 5;
const CONTROLS_HIDE_DELAY = 3000;

function formatCountdown(totalSec: number): string {
  if (totalSec <= 0) return '0s';
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.floor(totalSec % 60);
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(' ');
}

function isOverlay(item: ScheduleItem | undefined, allContent: LocalContent[], index: number, items: ScheduleItem[]): boolean {
  if (!item) return false;
  if (item.audioOverlay) return true;
  const ci = allContent.find(c => c.id === item.contentId);
  if (!ci || ci.type !== 'audio') return false;
  for (let i = index + 1; i < items.length; i++) {
    const next = allContent.find(c => c.id === items[i].contentId);
    if (next && next.type !== 'audio') return true;
  }
  for (let i = index - 1; i >= 0; i--) {
    const prev = allContent.find(c => c.id === items[i].contentId);
    if (prev && prev.type !== 'audio') return true;
  }
  return false;
}

export default function Player() {
  const [content, setContent] = useState<LocalContent[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [skipCountdown, setSkipCountdown] = useState(SKIP_DELAY);
  const [tick, setTick] = useState(0);
  const [bgAudioLabel, setBgAudioLabel] = useState<string | null>(null);
  const [scheduleDone, setScheduleDone] = useState(false);
  const [controlsLocked, setControlsLocked] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const mainVideoRef = useRef<HTMLVideoElement | null>(null);
  const mainAudioRef = useRef<HTMLAudioElement | null>(null);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  const skipTimerRef = useRef<number | null>(null);
  const prevVisualIndexRef = useRef<number>(-1);
  const bgAudioIdRef = useRef<string | null>(null);
  const bgAudioStartRef = useRef<number>(0);
  const bgAudioDurationRef = useRef<number>(0);
  const scheduleIdRef = useRef<string | null>(null);
  const manualOffsetRef = useRef<number>(0);
  const skipVersionRef = useRef(0);
  const pauseStartRef = useRef<number | null>(null);
  const pausedAtRef = useRef<number>(0);
  const controlsLockedRef = useRef(false);

  useEffect(() => {
    const loadData = () => {
      try {
        const storedContent = localStorage.getItem(STORAGE_KEYS.CONTENT);
        const storedSchedules = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
        if (storedContent) setContent(JSON.parse(storedContent));
        if (storedSchedules) setSchedules(JSON.parse(storedSchedules));
      } catch { /* ignore */ }
    };
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeSchedule = getActiveSchedule(schedules, content);
  const upcomingSchedule = !activeSchedule ? getUpcomingSchedule(schedules, content) : null;
  const pauseElapsed = pauseStartRef.current ? (Date.now() - pauseStartRef.current) / 1000 : 0;
  let elapsedSec = activeSchedule ? getScheduleElapsed(activeSchedule, content) / 1000 - pauseElapsed + manualOffsetRef.current : 0;
  if (pauseStartRef.current && pausedAtRef.current > 0) {
    elapsedSec = pausedAtRef.current;
  }
  const rawResult = activeSchedule ? getCurrentItemIndex(activeSchedule, content, elapsedSec) : { index: 0, offset: 0 };
  const scheduleItems = activeSchedule?.items || [];

  const getUpcomingCountdown = (): number => {
    if (!upcomingSchedule) return 0;
    const startDate = getScheduleStartTime(upcomingSchedule);
    return Math.max(0, (startDate.getTime() - Date.now()) / 1000);
  };

  const getUpcomingThumbnail = (): string | null => {
    if (!upcomingSchedule || upcomingSchedule.items.length === 0) return null;
    const firstItem = content.find(c => c.id === upcomingSchedule.items[0].contentId);
    if (!firstItem) return null;
    return getThumbnailUrl(firstItem) || (firstItem.type === 'video' ? resolveFilePath(firstItem.filePath) : null);
  };

  useEffect(() => {
    if (activeSchedule && scheduleIdRef.current !== activeSchedule.id) {
      scheduleIdRef.current = activeSchedule.id;
      manualOffsetRef.current = 0;
      if (!controlsLockedRef.current) {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = window.setTimeout(() => { if (isPlaying && !mediaError) setShowControls(false); }, CONTROLS_HIDE_DELAY);
      }
    }
  }, [activeSchedule?.id]);

  useEffect(() => {
    if (!activeSchedule && scheduleIdRef.current) {
      const stored = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
      if (stored) {
        const parsed = JSON.parse(stored);
        const schedule = parsed.find((s: Schedule) => s.id === scheduleIdRef.current);
        if (schedule?.mode === 'once' && schedule.status !== 'done') {
          const updated = parsed.map((s: Schedule) => s.id === scheduleIdRef.current ? { ...s, status: 'done' as const, updatedAt: new Date().toISOString() } : s);
          localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(updated));
          setScheduleDone(true);
        }
      }
      scheduleIdRef.current = null;
    }
  }, [activeSchedule]);

  useEffect(() => {
    const handleSkipSignal = (direction: 'next' | 'prev') => {
      if (!activeSchedule || scheduleItems.length === 0) return;

      const bounds: { cum: number; dur: number }[] = [];
      let cum = 0;
      for (let i = 0; i < scheduleItems.length; i++) {
        if (isOverlay(scheduleItems[i], content, i, scheduleItems)) continue;
        const ci = content.find(c => c.id === scheduleItems[i].contentId);
        const dur = scheduleItems[i].duration || ci?.duration || 0;
        bounds.push({ cum, dur });
        cum += dur;
      }
      if (bounds.length === 0) return;

      let cur = 0;
      for (let i = 0; i < bounds.length; i++) {
        if (elapsedSec < bounds[i].cum + bounds[i].dur) { cur = i; break; }
        cur = i;
      }

      if (direction === 'next') {
        const next = cur + 1;
        if (next < bounds.length) {
          manualOffsetRef.current = bounds[next].cum - elapsedSec;
        }
      } else {
        const prev = cur - 1;
        if (prev >= 0) {
          manualOffsetRef.current = bounds[prev].cum - elapsedSec;
        } else {
          manualOffsetRef.current = bounds[0].cum - elapsedSec;
        }
      }
      prevVisualIndexRef.current = -1;
      skipVersionRef.current += 1;
      pauseStartRef.current = null;
      pausedAtRef.current = 0;
      setTick(t => t + 1);
      writePlayerState({ isPlaying, manualOffset: manualOffsetRef.current, pauseStart: pauseStartRef.current });
    };

    const onSkip = (e: Event) => {
      const { direction } = (e as CustomEvent).detail;
      if (direction) handleSkipSignal(direction);
    };

    window.addEventListener('skip-signal', onSkip);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.SKIP_SIGNAL && e.newValue) {
        try { const signal = JSON.parse(e.newValue); if (signal?.direction) handleSkipSignal(signal.direction); } catch {}
      }
      if (e.key === STORAGE_KEYS.PAUSE_SIGNAL) setIsPlaying(false);
      if (e.key === STORAGE_KEYS.RESUME_SIGNAL) setIsPlaying(true);
      if (e.key === STORAGE_KEYS.DONE_SIGNAL) { setIsPlaying(false); setScheduleDone(true); }
    };
    window.addEventListener('storage', onStorage);
    const onPause = () => setIsPlaying(false);
    window.addEventListener('pause-signal', onPause);
    const onResume = () => setIsPlaying(true);
    window.addEventListener('resume-signal', onResume);
    const onDone = () => { setIsPlaying(false); setScheduleDone(true); };
    window.addEventListener('done-signal', onDone);
    return () => {
      window.removeEventListener('skip-signal', onSkip);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('pause-signal', onPause);
      window.removeEventListener('resume-signal', onResume);
      window.removeEventListener('done-signal', onDone);
    };
  }, [activeSchedule, scheduleItems, content, elapsedSec]);

  let visualIndex = rawResult.index;
  let visualOffset = rawResult.offset;
  let overlayAtPosition: { content: LocalContent; scheduleItem: ScheduleItem } | null = null;

  if (scheduleItems.length > 0 && isOverlay(scheduleItems[visualIndex], content, visualIndex, scheduleItems)) {
    const si = scheduleItems[visualIndex];
    const ci = content.find(c => c.id === si.contentId);
    if (ci) overlayAtPosition = { content: ci, scheduleItem: si };

    let found = false;
    for (let i = visualIndex + 1; i < scheduleItems.length; i++) {
      if (!isOverlay(scheduleItems[i], content, i, scheduleItems)) {
        visualIndex = i;
        visualOffset = 0;
        found = true;
        break;
      }
    }
    if (!found) {
      for (let i = 0; i < scheduleItems.length; i++) {
        if (!isOverlay(scheduleItems[i], content, i, scheduleItems)) {
          visualIndex = i;
          visualOffset = 0;
          break;
        }
      }
    }
  }

  if (!overlayAtPosition) {
    for (let i = rawResult.index + 1; i < scheduleItems.length; i++) {
      if (isOverlay(scheduleItems[i], content, i, scheduleItems)) {
        const si = scheduleItems[i];
        const ci = content.find(c => c.id === si.contentId);
        if (ci) { overlayAtPosition = { content: ci, scheduleItem: si }; break; }
      }
    }
    if (!overlayAtPosition) {
      for (let i = rawResult.index - 1; i >= 0; i--) {
        if (isOverlay(scheduleItems[i], content, i, scheduleItems)) {
          const si = scheduleItems[i];
          const ci = content.find(c => c.id === si.contentId);
          if (ci) {
            overlayAtPosition = { content: ci, scheduleItem: si };
          }
          break;
        }
      }
    }
  }

  const visualItem = scheduleItems[visualIndex]
    ? content.find(c => c.id === scheduleItems[visualIndex].contentId)
    : null;
  const visualItemDuration = visualItem
    ? (scheduleItems[visualIndex]?.duration || visualItem.duration)
    : 0;

  const muteInitializedRef = useRef(false);

  useEffect(() => {
    muteInitializedRef.current = false;
  }, [activeSchedule?.id]);

  useEffect(() => {
    if (!visualItem || !activeSchedule || muteInitializedRef.current) return;
    muteInitializedRef.current = true;
    const config = getSettings().playerMuteConfig;
    if (visualItem.type === 'image') {
      setIsMuted(config.image);
    } else if (overlayAtPosition) {
      setIsMuted(visualItem.type === 'video' ? config.videoWithOverlay : config.audioNoOverlay);
    } else {
      setIsMuted(visualItem.type === 'video' ? config.videoNoOverlay : config.audioNoOverlay);
    }
  }, [visualIndex, activeSchedule?.id]);

  useEffect(() => {
    if (!activeSchedule || !isPlaying) return;
    if (overlayAtPosition) {
      const newId = overlayAtPosition.content.id;
      if (bgAudioIdRef.current !== newId) {
        bgAudioIdRef.current = newId;
        bgAudioStartRef.current = Date.now();
        bgAudioDurationRef.current = overlayAtPosition.scheduleItem.duration || overlayAtPosition.content.duration;
        setBgAudioLabel(overlayAtPosition.content.title);
        if (bgAudioRef.current) {
          bgAudioRef.current.src = resolveFilePath(overlayAtPosition.content.filePath);
          bgAudioRef.current.currentTime = 0;
          bgAudioRef.current.play().catch(() => {});
        }
      }
    }
  }, [overlayAtPosition?.content.id, isPlaying, activeSchedule]);

  useEffect(() => {
    if (bgAudioLabel && isMuted && !controlsLockedRef.current) {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = window.setTimeout(() => {
        if (isPlaying && !mediaError) setShowControls(false);
      }, 5000);
    }
  }, [bgAudioLabel]);

  useEffect(() => {
    if (!activeSchedule && bgAudioIdRef.current) {
      if (bgAudioRef.current) bgAudioRef.current.pause();
      bgAudioIdRef.current = null;
      setBgAudioLabel(null);
    }
  }, [activeSchedule]);

  const prevSkipVersionRef = useRef(0);

  useEffect(() => {
    if (!activeSchedule || !visualItem || !isPlaying) return;
    if (mediaError) return;
    const indexChanged = visualIndex !== prevVisualIndexRef.current;
    const skipOccurred = skipVersionRef.current !== prevSkipVersionRef.current;
    if (!indexChanged && !skipOccurred) return;
    prevVisualIndexRef.current = visualIndex;
    prevSkipVersionRef.current = skipVersionRef.current;

    if (visualItem.type === 'video' && mainVideoRef.current) {
      mainVideoRef.current.src = resolveFilePath(visualItem.filePath);
      mainVideoRef.current.currentTime = visualOffset;
      mainVideoRef.current.play().catch(() => {});
    } else if (visualItem.type === 'audio' && mainAudioRef.current) {
      mainAudioRef.current.src = resolveFilePath(visualItem.filePath);
      mainAudioRef.current.currentTime = visualOffset;
      mainAudioRef.current.play().catch(() => {});
    }
    setProgress(0);
  }, [visualIndex, isPlaying, visualItem, mediaError, activeSchedule, skipVersionRef.current]);

  useEffect(() => {
    if (!isPlaying) {
      if (!pauseStartRef.current) pauseStartRef.current = Date.now();
      if (mainVideoRef.current) pausedAtRef.current = mainVideoRef.current.currentTime;
      else if (mainAudioRef.current) pausedAtRef.current = mainAudioRef.current.currentTime;
      if (mainVideoRef.current) mainVideoRef.current.pause();
      if (mainAudioRef.current) mainAudioRef.current.pause();
      if (bgAudioRef.current) bgAudioRef.current.pause();
    } else {
      pauseStartRef.current = null;
      pausedAtRef.current = 0;
      if (mainVideoRef.current && visualItem?.type === 'video') mainVideoRef.current.play().catch(() => {});
      if (mainAudioRef.current && visualItem?.type === 'audio') mainAudioRef.current.play().catch(() => {});
      if (bgAudioRef.current && bgAudioIdRef.current) bgAudioRef.current.play().catch(() => {});
    }
    writePlayerState({ isPlaying, manualOffset: manualOffsetRef.current, pauseStart: pauseStartRef.current });
  }, [isPlaying, visualItem]);

  useEffect(() => {
    if (!isPlaying || !visualItem || visualItem.type !== 'image') return;
    const pct = (visualOffset / visualItemDuration) * 100;
    setProgress(Math.min(pct, 100));
  }, [tick, isPlaying, visualItem]);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ': e.preventDefault(); setIsPlaying(prev => !prev); break;
        case 'f': case 'F': toggleFullscreen(); break;
        case 'm': case 'M': setIsMuted(prev => !prev); break;
        case 'l': case 'L': handleLockToggle(); break;
        case '?': setShowShortcuts(prev => !prev); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  const handleLockToggle = () => {
    setControlsLocked(prev => {
      const next = !prev;
      controlsLockedRef.current = next;
      if (next) setShowControls(false);
      return next;
    });
  };

  const handleMouseMove = () => {
    if (controlsLockedRef.current) return;
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = window.setTimeout(() => { if (isPlaying && !mediaError) setShowControls(false); }, CONTROLS_HIDE_DELAY);
  };

  const handleMediaTimeUpdate = () => {
    if (!visualItem) return;
    if (visualItem.type === 'video' && mainVideoRef.current) {
      setProgress(Math.min((mainVideoRef.current.currentTime / visualItemDuration) * 100, 100));
    } else if (visualItem.type === 'audio' && mainAudioRef.current) {
      setProgress(Math.min((mainAudioRef.current.currentTime / visualItemDuration) * 100, 100));
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!visualItem || visualItemDuration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const seekTime = pct * visualItemDuration;
    if (visualItem.type === 'video' && mainVideoRef.current) {
      mainVideoRef.current.currentTime = seekTime;
    } else if (visualItem.type === 'audio' && mainAudioRef.current) {
      mainAudioRef.current.currentTime = seekTime;
    }
    setProgress(pct * 100);
  };

  const handleMediaError = useCallback((fileName: string) => {
    setMediaError('Failed to load: ' + fileName);
    setSkipCountdown(SKIP_DELAY);
    if (skipTimerRef.current) clearInterval(skipTimerRef.current);
    skipTimerRef.current = window.setInterval(() => {
      setSkipCountdown(prev => {
        if (prev <= 1) {
          if (skipTimerRef.current) { clearInterval(skipTimerRef.current); skipTimerRef.current = null; }
          setMediaError(null);
          return SKIP_DELAY;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => { if (skipTimerRef.current) clearInterval(skipTimerRef.current); }, []);

  // All hooks above. Conditional returns below.

  if (scheduleDone) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
          <p className="text-white text-2xl font-heading font-bold mb-2">Schedule Completed</p>
          <p className="text-gray-400">{activeSchedule?.name || 'Schedule'}</p>
          <p className="text-gray-600 text-sm mt-4">Use the dashboard to schedule a new playback.</p>
        </div>
      </div>
    );
  }

  if (!activeSchedule || scheduleItems.length === 0) {
    if (upcomingSchedule) {
      const thumbnail = getUpcomingThumbnail();
      const countdown = getUpcomingCountdown();
      return (
        <div className="min-h-screen bg-black relative overflow-hidden">
          {thumbnail && (
            <>
              <img src={thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
              <div className="absolute inset-0 bg-black/60" />
            </>
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center z-10">
              <Clock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-secondary text-2xl font-heading font-bold mb-2">{upcomingSchedule.name}</p>
              <p className="text-gray-400 text-lg">Starts in {formatCountdown(countdown)}</p>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Play className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">No schedules found</p>
          <a href="/schedule" className="text-secondary hover:underline">Create a Schedule</a>
        </div>
      </div>
    );
  }

  if (!visualItem) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">Schedule content not found</p>
          <p className="text-gray-600 text-sm mb-4">The schedule may reference deleted or missing media.</p>
          <a href="/schedule" className="text-secondary hover:underline">Manage Schedules</a>
        </div>
      </div>
    );
  }

  const visualItemCount = scheduleItems.filter((item, i) => !isOverlay(item, content, i, scheduleItems)).length;

  return (
    <div ref={containerRef} className={cn("min-h-screen bg-black relative overflow-hidden", controlsLocked ? "cursor-none" : "cursor-none")} onMouseMove={handleMouseMove} onMouseLeave={() => !controlsLockedRef.current && isPlaying && !mediaError && setShowControls(false)}>
      <div className="absolute inset-0 flex items-center justify-center">
        {visualItem.type === 'video' && (
          <video ref={mainVideoRef} className="w-full h-full object-contain" muted={isMuted} playsInline
            onTimeUpdate={handleMediaTimeUpdate}
            onError={() => handleMediaError(visualItem.fileName)}
              onEnded={() => { prevVisualIndexRef.current = -1; }} />
        )}
        {visualItem.type === 'image' && !mediaError && (
          <img src={resolveFilePath(visualItem.filePath)} alt={visualItem.title} className="w-full h-full object-contain"
            onError={() => handleMediaError(visualItem.fileName)} />
        )}
        {visualItem.type === 'audio' && (
          <div className="text-center">
            <div className={cn("w-64 h-64 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-8", isPlaying && !mediaError && "animate-pulse-glow")}>
              <Volume2 className="w-24 h-24 text-primary" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-white mb-2">{visualItem.title}</h2>
            <p className="text-gray-400">Now Playing</p>
            <audio ref={mainAudioRef} muted={isMuted} playsInline
              onTimeUpdate={handleMediaTimeUpdate}
              onError={() => handleMediaError(visualItem.fileName)}
            onEnded={() => { prevVisualIndexRef.current = -1; }} />
          </div>
        )}

        <audio ref={bgAudioRef} playsInline
          onEnded={() => { bgAudioIdRef.current = null; setBgAudioLabel(null); }} />

        {bgAudioLabel && (
          <div className="absolute top-4 right-14 opacity-30">
            <Music className="w-6 h-6 text-white" />
          </div>
        )}

        {mediaError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-400 mb-2">{mediaError}</p>
              <p className="text-gray-500 text-sm">Continuing in {skipCountdown}s...</p>
            </div>
          </div>
        )}
      </div>

      <div className={cn("absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 transition-opacity duration-300", showControls ? "opacity-100" : "opacity-0")}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 bg-gray-700 rounded-full h-1.5 overflow-hidden cursor-pointer" onClick={handleSeek}>
              <div className="bg-primary h-full rounded-full transition-all duration-100 pointer-events-none" style={{ width: Math.min(progress, 100) + '%' }} />
            </div>
            <span className="text-xs text-gray-400 font-mono w-16 text-right">{visualIndex + 1} / {visualItemCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-white font-medium truncate">{visualItem.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {visualItem.type === 'video' && <Film className="w-3 h-3 text-gray-400" />}
                {visualItem.type === 'audio' && <Volume2 className="w-3 h-3 text-gray-400" />}
                <p className="text-xs text-gray-400">{activeSchedule.name}</p>
                {bgAudioLabel && <span className="text-[10px] text-gray-500">+ {bgAudioLabel}</span>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setIsPlaying(!isPlaying)} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>
              <button onClick={() => setIsMuted(!isMuted)} className={cn("p-2 text-white hover:text-secondary transition-colors relative", bgAudioLabel && isMuted && "animate-pulse text-secondary")}>
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                {bgAudioLabel && isMuted && (
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 text-white text-[10px] px-2 py-1 rounded animate-pulse">
                    Click to unmute
                  </span>
                )}
              </button>
              <button onClick={toggleFullscreen} className="p-2 text-white hover:text-secondary transition-colors">
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showControls && activeSchedule && (
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <span className="px-3 py-1 bg-black/50 rounded-full text-xs text-white font-medium">{activeSchedule.mode === 'loop' ? 'Looping' : 'Once'}</span>
        </div>
      )}

      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        <button
          onClick={() => setShowShortcuts(prev => !prev)}
          className={cn(
            "p-2 rounded-full transition-all",
            showShortcuts
              ? "bg-white/20 text-white"
              : "text-gray-500 hover:text-white hover:bg-white/10 opacity-40 hover:opacity-100"
          )}
          title="Keyboard shortcuts (?)"
        >
          <Keyboard className="w-4 h-4" />
        </button>
        <button
          onClick={handleLockToggle}
          className={cn(
            "p-2 rounded-full transition-all",
            controlsLocked
              ? "text-white/30 hover:text-white/60"
              : "text-gray-500 hover:text-white hover:bg-white/10 opacity-40 hover:opacity-100"
          )}
          title={controlsLocked ? "Unlock controls (L)" : "Lock controls (L)"}
        >
          {controlsLocked ? <Lock className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />}
        </button>
      </div>

      {showShortcuts && (
        <div className="absolute bottom-16 right-4 bg-black/90 backdrop-blur-sm rounded-xl border border-white/10 p-4 min-w-[200px] animate-in fade-in slide-in-from-bottom-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Keyboard Shortcuts</p>
          <div className="space-y-2">
            {[
              { key: 'Space', desc: 'Play / Pause' },
              { key: 'F', desc: 'Toggle fullscreen' },
              { key: 'M', desc: 'Mute / Unmute' },
              { key: 'L', desc: 'Lock / Unlock controls' },
              { key: '?', desc: 'Toggle this help' },
            ].map(({ key, desc }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <span className="text-xs text-gray-400">{desc}</span>
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-white font-mono min-w-[24px] text-center">{key}</kbd>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
