import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Film, GripVertical, Plus, Trash2, Save, PlayCircle, Search, Filter, Music, Image as ImageIcon, Play, Pause, Monitor, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { Reorder } from 'motion/react';
import { STORAGE_KEYS, generateId, getTimestamp, addActivity, getThumbnailUrl, resolveFilePath, getAllScreens, assignScheduleToScreen } from '../lib/storage';
import type { LocalContent, Schedule, ScheduleItem, ScreenConfig } from '../types';

interface SequenceItem {
  id: string;
  contentId: string;
  title: string;
  type: 'video' | 'image' | 'audio';
  duration: number;
  order: number;
  audioOverlay: boolean;
  thumbnailPath?: string;
}

function formatStartTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  } catch { return ''; }
}

function toDatetimeLocal(isoString: string): string {
  try {
    const d = new Date(isoString);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return ''; }
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function ShowBuilder() {
  const navigate = useNavigate();
  const [content, setContent] = useState<LocalContent[]>([]);
  const [sequence, setSequence] = useState<SequenceItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [scheduleName, setScheduleName] = useState('New Schedule');
  const [scheduleMode, setScheduleMode] = useState<'loop' | 'once'>('loop');
  const [startTime, setStartTime] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 5, 0, 0);
    return d.toISOString();
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [previewPlayingId, setPreviewPlayingId] = useState<string | null>(null);
  const [screens, setScreens] = useState<ScreenConfig[]>([]);
  const [selectedScreenIds, setSelectedScreenIds] = useState<string[]>(['screen-default']);
  const [showScreenDropdown, setShowScreenDropdown] = useState(false);
  const screenDropdownRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (screenDropdownRef.current && !screenDropdownRef.current.contains(e.target as Node)) {
        setShowScreenDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => { previewRef.current?.pause(); };
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const storedContent = localStorage.getItem(STORAGE_KEYS.CONTENT);
      const parsedContent: LocalContent[] = storedContent ? JSON.parse(storedContent) : [];
      setContent(parsedContent);

      const editingId = localStorage.getItem('editing_schedule_id');
      if (editingId) {
        const storedSchedules = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
        if (storedSchedules) {
          const schedules: Schedule[] = JSON.parse(storedSchedules);
          const schedule = schedules.find(s => s.id === editingId);
          if (schedule) {
            setScheduleName(schedule.name);
            setScheduleMode(schedule.mode);
            setStartTime(schedule.startTime);
            setEditingScheduleId(editingId);

            const items: SequenceItem[] = schedule.items.map((item, index) => {
              const contentItem = parsedContent.find(c => c.id === item.contentId);
              return {
                id: generateId(),
                contentId: item.contentId,
                title: contentItem?.title || 'Unknown',
                type: contentItem?.type || 'image',
                duration: item.duration || contentItem?.duration || 10,
                order: index,
                audioOverlay: item.audioOverlay || false,
                thumbnailPath: contentItem?.thumbnailPath,
              };
            });
            setSequence(items);

            const allScreens = getAllScreens();
            setScreens(allScreens);
            const preSelected = allScreens.filter(sc => sc.scheduleId === editingId).map(sc => sc.id);
            setSelectedScreenIds(preSelected);
          }
        }
        localStorage.removeItem('editing_schedule_id');
      } else {
        setScreens(getAllScreens());
      }
    } catch {
      // ignore
    }
  };

  const filteredContent = useMemo(() => {
    return content.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'All' || item.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [content, searchQuery, filterType]);

  const totalDuration = sequence.reduce((acc, curr) => {
    if (curr.audioOverlay) return acc;
    return acc + curr.duration;
  }, 0);

  const addToSequence = (item: LocalContent) => {
    const newItem: SequenceItem = {
      id: generateId(),
      contentId: item.id,
      title: item.title,
      type: item.type,
      duration: item.duration,
      order: sequence.length,
      audioOverlay: false,
      thumbnailPath: item.thumbnailPath,
    };
    setSequence([...sequence, newItem]);
  };

  const removeFromSequence = (id: string) => {
    setSequence(sequence.filter(s => s.id !== id));
  };

  const getOverlayTarget = (seq: SequenceItem[], index: number): string | null => {
    for (let i = index + 1; i < seq.length; i++) {
      if (!seq[i].audioOverlay && seq[i].type !== 'audio') return seq[i].title;
    }
    for (let i = index - 1; i >= 0; i--) {
      if (!seq[i].audioOverlay && seq[i].type !== 'audio') return seq[i].title;
    }
    return null;
  };

  const toggleOverlay = (id: string) => {
    const idx = sequence.findIndex(s => s.id === id);
    if (idx === -1) return;
    const item = sequence[idx];
    const newOverlay = !item.audioOverlay;

    if (newOverlay) {
      const withoutItem = sequence.filter(s => s.id !== id);
      const updatedItem = { ...item, audioOverlay: true };
      let insertIdx = -1;
      for (let i = 0; i < withoutItem.length; i++) {
        if (!withoutItem[i].audioOverlay && withoutItem[i].type !== 'audio') {
          insertIdx = i;
          break;
        }
      }
      if (insertIdx === -1) {
        for (let i = withoutItem.length - 1; i >= 0; i--) {
          if (!withoutItem[i].audioOverlay && withoutItem[i].type !== 'audio') {
            insertIdx = i + 1;
            break;
          }
        }
      }
      if (insertIdx === -1) insertIdx = withoutItem.length;
      const newSeq = [...withoutItem.slice(0, insertIdx), updatedItem, ...withoutItem.slice(insertIdx)];
      setSequence(newSeq);
    } else {
      setSequence(sequence.map(s => s.id === id ? { ...s, audioOverlay: false } : s));
    }
  };

  const updateItemDuration = (id: string, duration: number) => {
    setSequence(sequence.map(s => s.id === id ? { ...s, duration: Math.max(1, duration) } : s));
  };

  const handleStartTimeChange = (value: string) => {
    try { setStartTime(new Date(value).toISOString()); } catch { /* ignore */ }
  };

  const togglePreview = (item: SequenceItem) => {
    if (previewPlayingId === item.id) {
      previewRef.current?.pause();
      setPreviewPlayingId(null);
    } else {
      const contentItem = content.find(c => c.id === item.contentId);
      if (contentItem) {
        if (!previewRef.current) previewRef.current = new Audio();
        previewRef.current.src = resolveFilePath(contentItem.filePath);
        previewRef.current.play().catch(() => {});
        previewRef.current.onended = () => setPreviewPlayingId(null);
        setPreviewPlayingId(item.id);
      }
    }
  };

  const handleSave = () => {
    if (sequence.length === 0) {
      setToastMessage('Please add at least one item to the schedule.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (new Date(startTime).getTime() < Date.now()) {
      setToastMessage('Start time must be now or in the future');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    try {
      const storedSchedules = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
      const schedules: Schedule[] = storedSchedules ? JSON.parse(storedSchedules) : [];

      const scheduleItems: ScheduleItem[] = sequence.map((item, index) => ({
        contentId: item.contentId,
        order: index,
        duration: item.duration,
        audioOverlay: item.audioOverlay,
      }));

      if (editingScheduleId) {
        const updatedSchedules = schedules.map(s => {
          if (s.id === editingScheduleId) {
            return {
              ...s,
              name: scheduleName,
              items: scheduleItems,
              mode: scheduleMode,
              startTime,
              updatedAt: getTimestamp(),
            };
          }
          return s;
        });
        localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(updatedSchedules));
        const screenIdsToAssign = selectedScreenIds.length > 0 ? selectedScreenIds : ['screen-default'];
        for (const screenId of screenIdsToAssign) {
          assignScheduleToScreen(screenId, editingScheduleId);
          const screenName = screens.find(s => s.id === screenId)?.name || screenId;
          addActivity({ message: `Assigned "${scheduleName}" to ${screenName}`, type: 'success' });
        }
        addActivity({ message: `Updated schedule: ${scheduleName}`, type: 'success' });
      } else {
        const venueId = localStorage.getItem(STORAGE_KEYS.VENUES)
          ? JSON.parse(localStorage.getItem(STORAGE_KEYS.VENUES)!)[0]?.id
          : 'venue-default';

        const newSchedule: Schedule = {
          id: generateId(),
          name: scheduleName,
          items: scheduleItems,
          mode: scheduleMode,
          startTime,
          locationId: venueId,
          createdAt: getTimestamp(),
          updatedAt: getTimestamp(),
        };

        const updatedSchedules = [...schedules, newSchedule];
        localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(updatedSchedules));
        const screenIdsToAssign = selectedScreenIds.length > 0 ? selectedScreenIds : ['screen-default'];
        for (const screenId of screenIdsToAssign) {
          assignScheduleToScreen(screenId, newSchedule.id);
          const screenName = screens.find(s => s.id === screenId)?.name || screenId;
          addActivity({ message: `Assigned "${scheduleName}" to ${screenName}`, type: 'success' });
        }
        addActivity({ message: `Created schedule: ${scheduleName}`, type: 'success' });
      }

      setToastMessage('Schedule saved successfully!');
      setTimeout(() => {
        setToastMessage(null);
        navigate('/schedule');
      }, 1000);
    } catch {
      setToastMessage('Failed to save schedule.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/schedule')}
            className="p-2 bg-white border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="font-heading font-semibold text-xl text-gray-800 tracking-tight">
              {editingScheduleId ? 'Edit Schedule' : 'Show Builder'}
            </h2>
            <p className="text-sm text-gray-500">Drag content to build your schedule</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="text"
            value={scheduleName}
            onChange={(e) => setScheduleName(e.target.value)}
            placeholder="Schedule name"
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <select
            value={scheduleMode}
            onChange={(e) => setScheduleMode(e.target.value as 'loop' | 'once')}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value="loop">Loop</option>
            <option value="once">Play Once</option>
          </select>
          <button onClick={handleSave} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer">
            <Save className="w-4 h-4" />
            Save Schedule
          </button>
        </div>
      </div>
      
      {toastMessage && (
        <div className="bg-secondary/20 text-primary-dark px-4 py-3 rounded-lg border border-secondary/50 flex items-center gap-2 font-medium animate-in fade-in slide-in-from-top-2 text-sm">
          <PlayCircle className="w-4 h-4" />
          {toastMessage}
        </div>
      )}

      <div className="card p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <label className="text-sm font-medium text-gray-700">Start Time</label>
        </div>
        <input
          type="datetime-local"
          min={toDatetimeLocal(new Date().toISOString())}
          value={toDatetimeLocal(startTime)}
          onChange={(e) => handleStartTimeChange(e.target.value)}
          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        {screens.length > 0 && (
          <div className="relative ml-auto" ref={screenDropdownRef}>
            <button onClick={() => setShowScreenDropdown(!showScreenDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <Monitor className="w-3.5 h-3.5 text-gray-400" />
              Screens
              {selectedScreenIds.length > 0 && (
                <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold rounded-full">{selectedScreenIds.length}</span>
              )}
              <ChevronsUpDown className="w-3 h-3 text-gray-400" />
            </button>
            {showScreenDropdown && (
              <div className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 py-2 w-56 z-50 max-h-60 overflow-y-auto">
                <p className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Assign to Screens</p>
                {screens.map(s => {
                  const isSelected = selectedScreenIds.includes(s.id);
                  return (
                    <button key={s.id}
                      onClick={() => setSelectedScreenIds(prev => isSelected ? prev.filter(id => id !== s.id) : [...prev, s.id])}
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
                {selectedScreenIds.length > 0 && (
                  <button onClick={() => setSelectedScreenIds([])}
                    className="w-full px-3 py-2 text-xs text-gray-400 hover:text-gray-600 border-t border-gray-100 mt-1 pt-2">
                    Clear selection
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="card flex flex-col overflow-hidden border-t-4 border-t-gray-200">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col gap-3">
            <div>
              <h3 className="font-heading font-semibold text-gray-800">Content Library</h3>
              <p className="text-xs text-gray-500 mt-1">Click items to add to schedule</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search titles..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 w-full bg-white border border-gray-200 rounded text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="pl-8 pr-3 py-1.5 w-full bg-white border border-gray-200 rounded text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none"
                >
                  <option value="All">All Types</option>
                  <option value="image">Images</option>
                  <option value="audio">Audio</option>
                  <option value="video">Video</option>
                </select>
              </div>
            </div>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-3">
            {filteredContent.length === 0 ? (
              <div className="text-center py-8">
                <Film className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No content available</p>
                <button
                  onClick={() => navigate('/films/ingest')}
                  className="mt-2 text-xs text-primary hover:text-primary-dark font-medium"
                >
                  Add content first
                </button>
              </div>
            ) : (
              filteredContent.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => addToSequence(item)}
                  className="p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-primary hover:shadow-sm transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-md flex justify-center items-center flex-shrink-0 text-gray-400 overflow-hidden">
                      {getThumbnailUrl(item) ? (
                        <img src={getThumbnailUrl(item)!} alt="" className="w-full h-full object-cover" />
                      ) : item.type === 'image' ? <ImageIcon className="w-4 h-4" /> : item.type === 'video' ? <Film className="w-4 h-4" /> : <Music className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{item.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-semibold tracking-wide uppercase text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          {item.type}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.duration}s
                        </span>
                      </div>
                    </div>
                    <div className="text-gray-300">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2 card flex flex-col overflow-hidden border-t-4 border-t-primary">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-4 items-center justify-between">
            <div>
              <h3 className="font-heading font-semibold text-gray-800">Schedule Sequence</h3>
              <div className="flex items-center gap-4 mt-1 text-sm font-medium">
                <span className="text-primary">Total Duration: {formatElapsed(totalDuration)}</span>
                <span className="text-gray-500 text-xs">{sequence.filter(s => !s.audioOverlay).length} visual items</span>
                {sequence.some(s => s.audioOverlay) && (
                  <span className="text-gray-400 text-xs">+ {sequence.filter(s => s.audioOverlay).length} background audio</span>
                )}
              </div>
            </div>
          </div>
          
          <div className={cn(
            "p-6 flex-1 overflow-y-auto bg-gray-50/30 transition-colors",
            sequence.length === 0 ? "flex items-center justify-center border-2 border-dashed border-gray-200 m-4 rounded-xl" : ""
          )}>
            {sequence.length === 0 ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-6 h-6 text-gray-400" />
                </div>
                <h4 className="text-gray-600 font-medium">Click content to add here</h4>
                <p className="text-xs text-gray-400 mt-1">Build your schedule by clicking items from the library</p>
              </div>
            ) : (
              <Reorder.Group axis="y" values={sequence} onReorder={(newSequence) => setSequence(newSequence as SequenceItem[])} className="space-y-3">
                {sequence.map((item, index) => {
                  let cumOffset = 0;
                  for (let i = 0; i < index; i++) {
                    if (!sequence[i].audioOverlay) cumOffset += sequence[i].duration;
                  }
                  const isBg = item.audioOverlay;
                  const overlayTarget = isBg ? getOverlayTarget(sequence, index) : null;
                  return (
                    <Reorder.Item 
                      key={item.id} 
                      value={item}
                      className={cn("p-4 border rounded-xl flex items-center gap-4 shadow-sm cursor-grab active:cursor-grabbing group",
                        isBg ? "bg-primary/[0.03] border-primary/20" : "bg-white border-gray-200"
                      )}
                    >
                      <div className="text-gray-300">
                        <GripVertical className="w-5 h-5" />
                      </div>
                      <div className="flex-shrink-0 w-12 text-center">
                        <div className="text-xs font-bold text-gray-400">{index + 1}</div>
                        {isBg ? (
                          <div className="text-[10px] text-primary font-semibold">BG</div>
                        ) : (
                          <div className="text-[10px] text-primary font-mono">{formatElapsed(cumOffset)}</div>
                        )}
                      </div>
                      <div className="w-10 h-10 bg-gray-50 rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {getThumbnailUrl({ ...item, filePath: '', fileName: '', mimeType: '', createdAt: '', thumbnailPath: item.thumbnailPath } as LocalContent) ? (
                          <img src={getThumbnailUrl({ ...item, filePath: '', fileName: '', mimeType: '', createdAt: '', thumbnailPath: item.thumbnailPath } as LocalContent)!} alt="" className="w-full h-full object-cover" />
                        ) : item.type === 'image' ? <ImageIcon className="w-4 h-4 text-gray-400" /> : item.type === 'video' ? <Film className="w-4 h-4 text-gray-400" /> : <Music className="w-4 h-4 text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">{item.title}</h4>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={cn(
                            "text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded",
                            item.type === 'image' ? "bg-blue-50 text-blue-600" : item.type === 'video' ? "bg-purple-50 text-purple-600" : "bg-orange-50 text-orange-600"
                          )}>
                            {item.type}
                          </span>
                          {item.type === 'image' ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={item.duration}
                                onChange={(e) => updateItemDuration(item.id, parseInt(e.target.value) || 1)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-14 px-1.5 py-0.5 bg-gray-50 border border-gray-200 rounded text-xs text-center focus:outline-none focus:border-primary"
                                min="1"
                              />
                              <span className="text-xs text-gray-500">s</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">{item.duration}s</span>
                          )}
                          {item.type === 'audio' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleOverlay(item.id); }}
                              className={cn(
                                "flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors",
                                item.audioOverlay
                                  ? "bg-primary/10 text-primary border-primary/30"
                                  : "bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300"
                              )}
                              title={item.audioOverlay ? "Plays as background while images/videos show" : "Plays as its own item in the sequence"}
                            >
                              <Music className="w-3 h-3" />
                              {item.audioOverlay ? 'Background' : 'Standalone'}
                            </button>
                          )}
                          {isBg && overlayTarget && (
                            <span className="text-[10px] text-primary font-medium">
                              {'\u2192'} {overlayTarget}
                            </span>
                          )}
                        </div>
                        {item.type === 'audio' && !item.audioOverlay && (
                          <p className="text-[10px] text-gray-400 mt-1">Toggle to "Background" to play behind images</p>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePreview(item); }}
                        className="p-1.5 text-gray-400 hover:text-primary rounded-md hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-all"
                        title="Preview"
                      >
                        {previewPlayingId === item.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                      <button 
                        onClick={() => removeFromSequence(item.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </Reorder.Item>
                  );
                })}
              </Reorder.Group>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
