import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Menu, Search, LogOut, ChevronDown, User as UserIcon, X, CheckCircle2, Film, Music, Image as ImageIcon, Calendar } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { getUserName, saveUserName, clearUserName, STORAGE_KEYS, getThumbnailUrl } from '../lib/storage';
import type { LocalContent, Schedule } from '../types';

interface SearchResult {
  id: string;
  title: string;
  category: 'media' | 'schedule';
  subtitle: string;
  icon: React.ReactNode;
  thumbnail?: string;
}

export default function Topbar({ setSidebarOpen }: { setSidebarOpen: (o: boolean) => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userName, setUserName] = useState(getUserName());
  const [editName, setEditName] = useState(userName);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchValue.trim()) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      const query = searchValue.toLowerCase().trim();
      const results: SearchResult[] = [];

      try {
        const storedContent = localStorage.getItem(STORAGE_KEYS.CONTENT);
        if (storedContent) {
          const content: LocalContent[] = JSON.parse(storedContent);
          const mediaMatches = content
            .filter(item => item.title.toLowerCase().includes(query) || item.fileName.toLowerCase().includes(query))
            .slice(0, 5)
            .map(item => ({
              id: item.id,
              title: item.title,
              category: 'media' as const,
              subtitle: item.type === 'video' ? 'Video' : item.type === 'audio' ? 'Audio' : 'Image',
              icon: item.type === 'video' ? <Film className="w-4 h-4 text-purple-500" /> : item.type === 'audio' ? <Music className="w-4 h-4 text-blue-500" /> : <ImageIcon className="w-4 h-4 text-green-500" />,
              thumbnail: getThumbnailUrl(item) || undefined,
            }));
          results.push(...mediaMatches);
        }
      } catch { /* ignore */ }

      try {
        const storedSchedules = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
        if (storedSchedules) {
          const schedules: Schedule[] = JSON.parse(storedSchedules);
          const scheduleMatches = schedules
            .filter(s => s.name.toLowerCase().includes(query))
            .slice(0, 3)
            .map(s => ({
              id: s.id,
              title: s.name,
              category: 'schedule' as const,
              subtitle: s.status === 'done' ? 'Done' : s.mode === 'loop' ? 'Looping' : 'Once',
              icon: <Calendar className="w-4 h-4 text-[#0E7B35]" />,
            }));
          results.push(...scheduleMatches);
        }
      } catch { /* ignore */ }

      setSearchResults(results);
      setIsSearchOpen(results.length > 0);
      setHighlightIndex(-1);
    }, 200);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchValue]);

  const handleSearchSelect = (result: SearchResult) => {
    if (result.category === 'media') {
      navigate('/films/' + result.id);
    } else {
      navigate('/schedule');
    }
    setSearchValue("");
    setIsSearchOpen(false);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsSearchOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(prev => Math.min(prev + 1, searchResults.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(prev => Math.max(prev - 1, -1));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < searchResults.length) {
        handleSearchSelect(searchResults[highlightIndex]);
      } else if (searchValue.trim()) {
        navigate(`/films?search=${encodeURIComponent(searchValue.trim())}`);
        setSearchValue("");
        setIsSearchOpen(false);
      }
    }
  };

  useEffect(() => {
    setEditName(userName);
  }, [userName]);
  
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Overview';
    if (path.startsWith('/films')) return 'Media Library';
    if (path.startsWith('/schedule')) return 'Schedules';
    if (path.startsWith('/locations')) return 'Locations';
    if (path.startsWith('/settings')) return 'Settings';
    return '';
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    clearUserName();
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  const handleSaveAccount = () => {
    const trimmed = editName.trim();
    if (trimmed.length >= 2) {
      saveUserName(trimmed);
      setUserName(trimmed);
      setIsAccountModalOpen(false);
      setToastMessage('Profile updated');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-20 px-6 lg:px-10 bg-white/70 backdrop-blur-md border-b border-[#0E7B35]/5 relative">
      {toastMessage && (
        <div className="fixed top-24 right-10 bg-indigo-50 text-indigo-700 px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 z-50">
          <CheckCircle2 className="w-5 h-5 text-indigo-500" />
          <span className="text-sm font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-indigo-400 hover:text-indigo-600">
             <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none z-0 overflow-hidden">
         <div className="absolute inset-0 bg-wave-animation opacity-100"></div>
         <div className="absolute inset-0 bg-wave-animation-2 mix-blend-multiply opacity-100"></div>
         <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/50 to-transparent"></div>
      </div>

      <div className="flex items-center gap-4 relative z-10">
        <button 
          onClick={() => setSidebarOpen(true)}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="font-heading font-semibold text-xl text-gray-800 tracking-tight">
          {getPageTitle()}
        </h2>
      </div>

      <div className="flex items-center gap-4 lg:gap-6">
        <div className="relative hidden md:block" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            id="global-search"
            type="text" 
            placeholder="Search media & schedules..." 
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => { if (searchResults.length > 0) setIsSearchOpen(true); }}
            className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#0E7B35] focus:ring-1 focus:ring-[#0E7B35] w-64 transition-all"
          />
          {isSearchOpen && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 max-h-80 overflow-y-auto z-50">
              {(() => {
                const mediaResults = searchResults.filter(r => r.category === 'media');
                const scheduleResults = searchResults.filter(r => r.category === 'schedule');
                return (
                  <>
                    {mediaResults.length > 0 && (
                      <>
                        <p className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Media</p>
                        {mediaResults.map((result, i) => {
                          const globalIndex = searchResults.indexOf(result);
                          return (
                            <button key={result.id}
                              onClick={() => handleSearchSelect(result)}
                              className={cn("w-full flex items-center gap-3 px-4 py-2 text-left transition-colors cursor-pointer",
                                highlightIndex === globalIndex ? "bg-[#0E7B35]/5" : "hover:bg-gray-50")}>
                              {result.thumbnail ? (
                                <img src={result.thumbnail} alt="" className="w-8 h-6 rounded object-cover flex-shrink-0" />
                              ) : (
                                <div className="w-8 h-6 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">{result.icon}</div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{result.title}</p>
                              </div>
                              <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase flex-shrink-0",
                                result.subtitle === 'Video' ? "bg-purple-50 text-purple-600" : result.subtitle === 'Audio' ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600")}>
                                {result.subtitle}
                              </span>
                            </button>
                          );
                        })}
                      </>
                    )}
                    {scheduleResults.length > 0 && (
                      <>
                        <p className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-t border-gray-100 mt-1 pt-2">Schedules</p>
                        {scheduleResults.map((result) => {
                          const globalIndex = searchResults.indexOf(result);
                          return (
                            <button key={result.id}
                              onClick={() => handleSearchSelect(result)}
                              className={cn("w-full flex items-center gap-3 px-4 py-2 text-left transition-colors cursor-pointer",
                                highlightIndex === globalIndex ? "bg-[#0E7B35]/5" : "hover:bg-gray-50")}>
                              <div className="w-8 h-6 bg-[#0E7B35]/10 rounded flex items-center justify-center flex-shrink-0">{result.icon}</div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{result.title}</p>
                              </div>
                              <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase flex-shrink-0",
                                result.subtitle === 'Done' ? "bg-gray-100 text-gray-500" : result.subtitle === 'Looping' ? "bg-blue-50 text-blue-600" : "bg-yellow-50 text-yellow-600")}>
                                {result.subtitle}
                              </span>
                            </button>
                          );
                        })}
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
        
        <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
        
        <div className="relative z-20" ref={profileRef}>
          <button 
            type="button"
            className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-gray-100"
            onClick={(e) => { e.preventDefault(); setIsProfileOpen(!isProfileOpen); }}
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-700">{userName || 'User'}</p>
            </div>
            <img 
              src="/logo.png" 
              alt="JEMIMA" 
              className="w-10 h-10 rounded-full bg-[#B9EA38]/20 border border-[#B9EA38]/50 object-cover"
            />
            <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 origin-top-right animate-in fade-in zoom-in-95 duration-100">
               <div className="px-4 py-2 border-b border-gray-100 sm:hidden">
                 <p className="text-sm font-medium text-gray-700">{userName || 'User'}</p>
               </div>
               <button 
                 className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors cursor-pointer"
                 onClick={() => { setIsAccountModalOpen(true); setIsProfileOpen(false); }}
               >
                 <UserIcon className="w-4 h-4 text-gray-400" />
                 My Account
               </button>
               <div className="border-t border-gray-100 my-1"></div>
               <button 
                 onClick={handleLogout}
                 disabled={isLoggingOut}
                 className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
               >
                 {isLoggingOut ? (
                   <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                 ) : (
                   <LogOut className="w-4 h-4" />
                 )}
                 {isLoggingOut ? 'Logging out...' : 'Log Out'}
               </button>
            </div>
          )}
        </div>
      </div>
      
      {isAccountModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in slide-in-from-bottom-4">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
               <div>
                 <h3 className="font-heading font-semibold text-lg text-gray-900 tracking-tight">My Account</h3>
                 <p className="text-xs text-gray-500 mt-1">Manage your profile.</p>
               </div>
               <button onClick={() => setIsAccountModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200/50 transition-colors cursor-pointer">
                 <X className="w-5 h-5" />
               </button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
               <div className="flex items-center gap-4">
                 <div className="relative">
                   <img src="/logo.png" alt="JEMIMA" className="w-16 h-16 rounded-full bg-[#B9EA38]/20 border border-[#B9EA38]/50 object-cover" />
                 </div>
                 <div>
                   <h4 className="font-medium text-gray-900">{userName || 'User'}</h4>
                   <p className="text-sm text-gray-500">JEMIMA Dashboard</p>
                 </div>
               </div>
               <div className="space-y-4 pt-4 border-t border-gray-100">
                 <div>
                   <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Display Name</label>
                   <input 
                     type="text" 
                     value={editName}
                     onChange={(e) => setEditName(e.target.value)}
                     placeholder="What should we call you?" 
                     className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#0E7B35]" 
                   />
                 </div>
               </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end">
               <button 
                 onClick={handleSaveAccount}
                 disabled={editName.trim().length < 2}
                 className="px-4 py-2 bg-[#0E7B35] hover:bg-[#0A5E28] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors cursor-pointer shadow-sm"
               >
                 Save Changes
               </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
