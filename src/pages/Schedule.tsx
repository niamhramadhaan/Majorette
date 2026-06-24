import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  Play,
  Edit,
  Trash2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Clock,
  Film,
  CheckCircle2,
  CheckSquare,
  Calendar,
  List,
  RotateCcw,
  X,
  Monitor,
  Check,
  ChevronsUpDown,
  AlertTriangle,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { Pagination } from "../components/Pagination";
import { STORAGE_KEYS, getActivities, addActivity, getActiveSchedule, getScheduleTotalDuration, generateId, getTimestamp, getAllScreens, assignScheduleToScreen, getActiveScheduleForScreen, getScreenPlayerState } from "../lib/storage";
import type { Schedule, LocalContent, ScheduleStatus, ScreenConfig } from "../types";

function toDatetimeLocal(isoString: string): string {
  try {
    const d = new Date(isoString);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return ''; }
}

function formatScheduleTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  } catch { return ''; }
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function Schedule() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [content, setContent] = useState<LocalContent[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"recent" | "latest" | "next">("latest");
  const [statusFilter, setStatusFilter] = useState<ScheduleStatus[]>([]);
  const [selectedSchedules, setSelectedSchedules] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<string | 'bulk' | null>(null);
  const [showChecklist, setShowChecklist] = useState(false);
  const [recreateFromSchedule, setRecreateFromSchedule] = useState<Schedule | null>(null);
  const [recreateMode, setRecreateMode] = useState<'loop' | 'once'>('loop');
  const [recreateStartTime, setRecreateStartTime] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 5, 0, 0);
    return d.toISOString();
  });
  const [screens, setScreens] = useState<ScreenConfig[]>([]);
  const [recreateScreenIds, setRecreateScreenIds] = useState<string[]>(['screen-default']);
  const [showRecreateScreenDropdown, setShowRecreateScreenDropdown] = useState(false);
  const [activeScreenWarnings, setActiveScreenWarnings] = useState<{ id: string; name: string; scheduleName: string }[] | null>(null);
  const [pendingRecreate, setPendingRecreate] = useState<{ newSchedule: Schedule } | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'day'>('list');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [screenFilter, setScreenFilter] = useState<string[]>([]);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showScreenDropdown, setShowScreenDropdown] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const screenDropdownRef = useRef<HTMLDivElement>(null);
  const recreateScreenDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
    const handleClickOutside = (e: MouseEvent) => {
      if (recreateScreenDropdownRef.current && !recreateScreenDropdownRef.current.contains(e.target as Node)) {
        setShowRecreateScreenDropdown(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setShowStatusDropdown(false);
      }
      if (screenDropdownRef.current && !screenDropdownRef.current.contains(e.target as Node)) {
        setShowScreenDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = () => {
    try {
      const storedSchedules = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
      const storedContent = localStorage.getItem(STORAGE_KEYS.CONTENT);

      if (storedSchedules) setSchedules(JSON.parse(storedSchedules));
      if (storedContent) setContent(JSON.parse(storedContent));
      setScreens(getAllScreens());
    } catch {
      // ignore
    }
  };

  const saveSchedulesToStorage = (newSchedules: Schedule[]) => {
    setSchedules(newSchedules);
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(newSchedules));
  };

  const activeSchedule = getActiveSchedule(schedules, content);

  const getEffectiveStatus = (schedule: Schedule): ScheduleStatus => {
    if (schedule.status === 'done') return 'done';
    if (activeSchedule?.id === schedule.id) return 'playing';
    return schedule.status || 'unplayed';
  };

  const sortedSchedules = [...schedules]
    .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    .filter((s) => {
      if (statusFilter.length === 0) return true;
      return statusFilter.includes(getEffectiveStatus(s));
    })
    .filter((s) => {
      if (screenFilter.length === 0) return true;
      return screenFilter.some(id => screens.some(sc => sc.id === id && sc.scheduleId === s.id));
    })
    .sort((a, b) => {
      if (sortOrder === 'next') {
        const timeA = new Date(a.startTime).getTime();
        const timeB = new Date(b.startTime).getTime();
        const now = Date.now();
        const nextA = timeA > now ? timeA : timeA + 86400000;
        const nextB = timeB > now ? timeB : timeB + 86400000;
        return nextA - nextB;
      }
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "latest" ? dateB - dateA : dateA - dateB;
    });

  const itemsPerPage = 9;
  const totalPages = Math.ceil(sortedSchedules.length / itemsPerPage);

  const handleAction = (action: string) => {
    setToastMessage(action);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleSelectAll = () => {
    if (selectedSchedules.length === sortedSchedules.length) {
      setSelectedSchedules([]);
    } else {
      setSelectedSchedules(sortedSchedules.map(s => s.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedSchedules.includes(id)) {
      setSelectedSchedules(selectedSchedules.filter(i => i !== id));
    } else {
      setSelectedSchedules([...selectedSchedules, id]);
    }
  };

  const confirmDelete = () => {
    if (isDeleteModalOpen === 'bulk') {
      const count = selectedSchedules.length;
      const newSchedules = schedules.filter(s => !selectedSchedules.includes(s.id));
      saveSchedulesToStorage(newSchedules);
      setSelectedSchedules([]);
      handleAction(`Successfully deleted ${count} schedules.`);
      addActivity({ message: `Deleted ${count} schedules`, type: 'info' });
    } else if (typeof isDeleteModalOpen === 'string') {
      const schedule = schedules.find(s => s.id === isDeleteModalOpen);
      const newSchedules = schedules.filter(s => s.id !== isDeleteModalOpen);
      saveSchedulesToStorage(newSchedules);
      handleAction(`Successfully deleted schedule: ${schedule?.name}`);
      addActivity({ message: `Deleted schedule: ${schedule?.name}`, type: 'info' });
    }
    setIsDeleteModalOpen(null);
  };

  const getContentTitle = (contentId: string) => {
    const item = content.find(c => c.id === contentId);
    return item?.title || 'Unknown';
  };

  const getTotalDuration = (schedule: Schedule) => {
    return getScheduleTotalDuration(schedule, content);
  };

  const handleRecreate = () => {
    if (!recreateFromSchedule) return;
    if (new Date(recreateStartTime).getTime() < Date.now()) {
      handleAction('Start time must be now or in the future');
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
    saveSchedulesToStorage(updated);
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
  };

  const confirmActiveScreenRecreate = () => {
    if (!pendingRecreate) return;
    const { newSchedule } = pendingRecreate;
    setActiveScreenWarnings(null);
    setPendingRecreate(null);
    performRecreate(newSchedule);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode('list')}
              className={cn("p-2 rounded-lg transition-colors", viewMode === 'list' ? "text-primary bg-primary/10" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50")}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-gray-200" />
            <button
              onClick={() => setViewMode('day')}
              className={cn("p-2 rounded-lg transition-colors", viewMode === 'day' ? "text-primary bg-primary/10" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50")}
              title="Day view"
            >
              <Calendar className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search schedules..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <select
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "recent" | "latest" | "next")}
          >
            <option value="latest">Newest First</option>
            <option value="recent">Oldest First</option>
            <option value="next">Next Play</option>
          </select>
          <div className="relative" ref={statusDropdownRef}>
            <button onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className={cn("bg-white border rounded-lg px-3 py-2 text-sm flex items-center gap-2 transition-colors", statusFilter.length > 0 ? "border-primary text-primary" : "border-gray-200 text-gray-600")}>
              Status{statusFilter.length > 0 && ` (${statusFilter.length})`}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {showStatusDropdown && (
              <div className="absolute left-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 py-2 w-40 z-50">
                {(['playing', 'unplayed', 'done'] as ScheduleStatus[]).map(status => (
                  <label key={status} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary"
                      checked={statusFilter.includes(status)}
                      onChange={() => setStatusFilter(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status])} />
                    <span className="text-sm text-gray-700 capitalize">{status === 'playing' ? 'Now Playing' : status === 'unplayed' ? 'Ready' : status}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="relative" ref={screenDropdownRef}>
            <button onClick={() => setShowScreenDropdown(!showScreenDropdown)}
              className={cn("bg-white border rounded-lg px-3 py-2 text-sm flex items-center gap-2 transition-colors", screenFilter.length > 0 ? "border-primary text-primary" : "border-gray-200 text-gray-600")}>
              Screens{screenFilter.length > 0 && ` (${screenFilter.length})`}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {showScreenDropdown && (
              <div className="absolute left-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 py-2 w-44 z-50">
                {screens.map(s => (
                  <label key={s.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary"
                      checked={screenFilter.includes(s.id)}
                      onChange={() => setScreenFilter(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])} />
                    <span className="text-sm text-gray-700">{s.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedSchedules.length > 0 && showChecklist && (
            <button 
              onClick={() => setIsDeleteModalOpen('bulk')}
              className="flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedSchedules.length})
            </button>
          )}
          <button
            onClick={() => {
              setShowChecklist(!showChecklist);
              if (showChecklist) setSelectedSchedules([]);
            }}
            className={cn("flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
              showChecklist ? "bg-primary/10 text-primary border border-primary/20" : "bg-white border border-gray-200 hover:bg-gray-50 text-gray-700"
            )}
          >
            <CheckSquare className="w-4 h-4" />
            Checklist
          </button>
          <button
            onClick={() => navigate("/schedule/builder")}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Schedule
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="bg-blue-50 text-blue-700 p-3 rounded-lg border border-blue-200 flex items-center justify-center gap-2 mb-4 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {schedules.length === 0 ? (
        <div className="card p-12 text-center">
          <Play className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-heading font-semibold text-gray-900 mb-2">No Schedules Yet</h3>
          <p className="text-gray-500 mb-6">Create your first schedule to start playing content.</p>
          <button
            onClick={() => navigate("/schedule/builder")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Schedule
          </button>
        </div>
      ) : viewMode === 'day' ? (
        <div className="card p-6">
          {(() => {
            const isToday = selectedDate === new Date().toISOString().split('T')[0];
            return (
              <>
                <div className="flex items-center justify-between mb-2">
                  <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d.toISOString().split('T')[0]); }}
                    className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className={cn("font-heading font-semibold", isToday ? "text-primary" : "text-gray-900")}>
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </h3>
                  <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d.toISOString().split('T')[0]); }}
                    className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center justify-center mb-4">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent border-0 p-0 text-sm text-gray-400 hover:text-primary cursor-pointer focus:outline-none focus:text-primary [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                  />
                </div>
              </>
            );
          })()}
          <div className="max-h-[60vh] overflow-y-auto pr-2">
            {(() => {
              const daySchedulesAll = sortedSchedules.filter(s => {
                const start = new Date(s.startTime);
                return start.toISOString().split('T')[0] === selectedDate;
              });
              let startHour = 8;
              let endHour = 20;
              if (daySchedulesAll.length > 0) {
                const hours = daySchedulesAll.map(s => new Date(s.startTime).getHours());
                startHour = Math.max(0, Math.min(...hours) - 2);
                endHour = Math.min(23, Math.max(...hours) + 3);
              }
              const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
              return hours.map(hour => {
                const daySchedules = daySchedulesAll.filter(s => new Date(s.startTime).getHours() === hour);
                return (
                  <div key={hour} className="flex gap-4 min-h-[48px] group">
                    <div className="w-14 flex-shrink-0 text-right pt-0.5">
                      <span className="text-xs font-mono text-gray-400 group-hover:text-gray-600 transition-colors">{hour.toString().padStart(2, '0')}:00</span>
                    </div>
                    <div className="flex-1 border-t border-gray-100 relative min-h-[48px]">
                      {daySchedules.length === 0 ? (
                        <div className="h-full" />
                      ) : (
                        <div className="space-y-2 py-2">
                          {daySchedules.map(schedule => {
                            const status = getEffectiveStatus(schedule);
                            const assignedScreens = screens.filter(s => s.scheduleId === schedule.id);
                            return (
                              <div key={schedule.id} onClick={() => {
                                if (schedule.status !== 'done') {
                                  localStorage.setItem('editing_schedule_id', schedule.id);
                                  navigate('/schedule/builder');
                                }
                              }}
                                className={cn("p-3 rounded-lg border transition-all cursor-pointer",
                                  status === 'playing' ? "bg-primary/10 border-primary/30 hover:bg-primary/15" :
                                  status === 'done' ? "bg-gray-50 border-gray-200 opacity-60" :
                                  "bg-white border-gray-200 hover:border-primary/30 hover:shadow-sm"
                                )}>
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="font-medium text-sm text-gray-900 truncate">{schedule.name}</span>
                                    {assignedScreens.length === 1 && (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium flex-shrink-0">
                                        <Monitor className="w-2.5 h-2.5" />{assignedScreens[0].name}
                                      </span>
                                    )}
                                    {assignedScreens.length > 1 && (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium flex-shrink-0">
                                        <Monitor className="w-2.5 h-2.5" />{assignedScreens.length} screens
                                      </span>
                                    )}
                                  </div>
                                  <span className={cn("px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase flex-shrink-0",
                                    status === 'playing' ? "bg-secondary/30 text-primary-dark" :
                                    status === 'done' ? "bg-gray-100 text-gray-400" :
                                    "bg-blue-50 text-blue-600"
                                  )}>
                                    {status === 'playing' ? 'Now' : status === 'done' ? 'Done' : 'Ready'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                  <span className="flex items-center gap-1"><Film className="w-3 h-3" />{schedule.items.length} items</span>
                                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatElapsed(getTotalDuration(schedule))}</span>
                                  <span className="capitalize">{schedule.mode}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-500">
                <thead className="text-xs text-gray-400 uppercase bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    {showChecklist && (
                      <th className="px-6 py-4 font-medium tracking-wider w-12 text-center">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                          checked={selectedSchedules.length > 0 && selectedSchedules.length === sortedSchedules.length}
                          onChange={handleToggleSelectAll}
                        />
                      </th>
                    )}
                    <th className="px-6 py-4 font-medium tracking-wider">Schedule Name</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Content</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Start Time</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Mode</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Screen</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Status</th>
                    <th className="px-6 py-4 font-medium tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedSchedules
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      currentPage * itemsPerPage,
                    )
                    .map((schedule) => (
                      <tr
                        key={schedule.id}
                        className={cn("hover:bg-gray-50/50 transition-colors group", activeSchedule?.id === schedule.id && "bg-primary/[0.02]")}
                      >
                        {showChecklist && (
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="checkbox" 
                              className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                              checked={selectedSchedules.includes(schedule.id)}
                              onChange={() => handleToggleSelect(schedule.id)}
                            />
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center",
                              activeSchedule?.id === schedule.id ? "bg-secondary/30 text-primary-dark" : "bg-gray-100 text-gray-400"
                            )}>
                              <Play className="w-4 h-4 ml-0.5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                                  {schedule.name}
                                </span>
                                {activeSchedule?.id === schedule.id && (
                                  <span className="px-1.5 py-0.5 bg-secondary/30 text-primary-dark rounded text-[10px] font-bold uppercase">Now</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Film className="w-3.5 h-3.5" />
                              {schedule.items.length} Items
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                              <Clock className="w-3.5 h-3.5" />
                              {formatElapsed(getTotalDuration(schedule))}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-xs font-medium text-gray-700">
                              {formatScheduleTime(schedule.startTime)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-gray-500 capitalize">{schedule.mode}</span>
                        </td>
                        <td className="px-6 py-4">
                          {(() => {
                            const assignedScreens = screens.filter(s => s.scheduleId === schedule.id);
                            if (assignedScreens.length === 0) {
                              return <span className="text-xs text-gray-400">Default</span>;
                            }
                            if (assignedScreens.length === 1) {
                              return (
                                <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                                  <Monitor className="w-3 h-3 text-gray-400" />
                                  {assignedScreens[0].name}
                                </span>
                              );
                            }
                            return (
                              <div className="flex flex-col gap-0.5">
                                {assignedScreens.map(s => (
                                  <span key={s.id} className="inline-flex items-center gap-1 text-xs text-gray-600">
                                    <Monitor className="w-3 h-3 text-gray-400" />
                                    {s.name}
                                  </span>
                                ))}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4">
                          {(() => {
                            const status = getEffectiveStatus(schedule);
                            return (
                              <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                status === 'playing' ? "bg-secondary/30 text-primary-dark" :
                                status === 'done' ? "bg-gray-100 text-gray-400" :
                                "bg-blue-50 text-blue-600"
                              )}>
                                {status === 'playing' ? 'Now' : status === 'done' ? 'Done' : 'Ready'}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 text-gray-400">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {schedule.status === 'done' && (
                                <button
                                  onClick={() => {
                                    setRecreateFromSchedule(schedule);
                                    setRecreateMode(schedule.mode);
                                    setRecreateScreenIds(['screen-default']);
                                    setShowRecreateScreenDropdown(false);
                                    const d = new Date();
                                    d.setMinutes(d.getMinutes() + 5, 0, 0);
                                    setRecreateStartTime(d.toISOString());
                                  }}
                                  title="Play Again"
                                  className="p-1.5 hover:text-primary rounded-md hover:bg-primary/10 cursor-pointer"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                disabled={schedule.status === 'done'}
                                onClick={() => {
                                  localStorage.setItem('editing_schedule_id', schedule.id);
                                  navigate("/schedule/builder");
                                }}
                                title={schedule.status === 'done' ? "Cannot edit completed schedules" : "Edit Schedule"}
                                className={cn("p-1.5 rounded-md cursor-pointer",
                                  schedule.status === 'done'
                                    ? "text-gray-200 cursor-not-allowed"
                                    : "hover:text-primary hover:bg-primary/10"
                                )}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setIsDeleteModalOpen(schedule.id)}
                                title="Delete Schedule"
                                className="p-1.5 hover:text-red-600 rounded-md hover:bg-red-50 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <button
                              disabled={schedule.status === 'done'}
                              onClick={() => {
                                localStorage.setItem('editing_schedule_id', schedule.id);
                                navigate("/schedule/builder");
                              }}
                              title={schedule.status === 'done' ? "Cannot view completed schedules" : "View Details"}
                              className={cn("p-1.5 rounded-md cursor-pointer transition-transform duration-200",
                                schedule.status === 'done'
                                  ? "text-gray-200 cursor-not-allowed"
                                  : "hover:text-gray-900 hover:bg-gray-100"
                              )}
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {sortedSchedules.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No schedules found.
                </div>
              )}
            </div>
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        </>
      )}

      {isDeleteModalOpen !== null && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 animate-in fade-in backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in slide-in-from-bottom-4">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-lg text-gray-900">Delete Schedule{isDeleteModalOpen === 'bulk' ? 's' : ''}?</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {isDeleteModalOpen === 'bulk' 
                    ? `Are you sure you want to delete ${selectedSchedules.length} selected schedules? This action cannot be undone.`
                    : 'Are you sure you want to delete this schedule? This action cannot be undone.'}
                </p>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setIsDeleteModalOpen(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 bg-white border border-gray-200 rounded-lg transition-colors cursor-pointer">Cancel</button>
              <button onClick={confirmDelete} className="px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer shadow-sm">
                Delete
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
                      <span className="text-gray-400">{item.duration || '?'}s</span>
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
                          {recreateScreenIds.length > 0 && (
                            <button onClick={() => setRecreateScreenIds([])}
                              className="w-full px-3 py-2 text-xs text-gray-400 hover:text-gray-600 border-t border-gray-100 mt-1 pt-2">
                              Clear selection
                            </button>
                          )}
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
    </div>
  );
}
