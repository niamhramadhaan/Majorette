import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Menu, Search, LogOut, ChevronDown, User as UserIcon, X, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getUserName, saveUserName, clearUserName } from '../lib/storage';

export default function Topbar({ setSidebarOpen }: { setSidebarOpen: (o: boolean) => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [avatarSeed, setAvatarSeed] = useState("JEMIMAAdmin");
  const [searchValue, setSearchValue] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userName, setUserName] = useState(getUserName());
  const [editName, setEditName] = useState(userName);
  const profileRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      navigate(`/films?search=${encodeURIComponent(searchValue.trim())}`);
      setSearchValue("");
    }
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    clearUserName();
    navigate('/login', { replace: true });
  };

  const handleSaveAccount = () => {
    const trimmed = editName.trim();
    if (trimmed.length >= 2) {
      saveUserName(trimmed);
      setUserName(trimmed);
      setAvatarSeed(trimmed);
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
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            id="global-search"
            type="text" 
            placeholder="Search media... (Ctrl+K)" 
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearch}
            className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#0E7B35] focus:ring-1 focus:ring-[#0E7B35] w-64 transition-all"
          />
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
              src={`https://api.dicebear.com/7.x/notionists/svg?seed=${avatarSeed}`} 
              alt="User avatar" 
              className="w-10 h-10 rounded-full bg-[#B9EA38]/20 border border-[#B9EA38]/50"
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
                 <div className="relative group cursor-pointer" onClick={() => setAvatarSeed(Math.random().toString(36).substring(7))}>
                   <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${avatarSeed}`} alt="Avatar" className="w-16 h-16 rounded-full bg-[#B9EA38]/20 border border-[#B9EA38]/50 group-hover:opacity-75 transition-opacity" />
                   <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <RefreshCw className="w-5 h-5 text-gray-700 bg-white/80 rounded-full p-1 shadow-sm" />
                   </div>
                 </div>
                 <div>
                   <h4 className="font-medium text-gray-900">{userName || 'User'}</h4>
                   <p className="text-sm text-gray-500">Click avatar to randomize</p>
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
