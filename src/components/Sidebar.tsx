import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, MapPin, Film, CalendarDays, Settings, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { APP_CONFIG } from '../config/app';

export default function Sidebar({ open, setOpen, requestNavigation }: { open: boolean; setOpen: (o: boolean) => void; requestNavigation: (path: string) => void }) {
  const location = useLocation();

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Media Library', path: '/films', icon: Film },
    { name: 'Schedules', path: '/schedule', icon: CalendarDays },
    { name: 'Locations', path: '/locations', icon: MapPin },
  ];

  const handleNavClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    if (window.innerWidth < 768) setOpen(false);
    requestNavigation(path);
  };

  return (
    <aside 
      className={cn(
        "fixed inset-y-0 left-0 z-30 bg-white border-r border-gray-100 flex flex-col transition-all duration-300 ease-in-out md:static",
        open ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0 md:w-20 lg:w-64"
      )}
    >
      <div className="flex items-center justify-between lg:justify-start h-20 px-6 lg:px-6 md:justify-center md:px-0 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm shadow-primary/20 flex-shrink-0 bg-primary flex items-center justify-center">
            <img src="/logo.png" alt="JEMIMA" className="w-full h-full object-cover" />
          </div>
          <div className="hidden lg:block">
            <h1 className="font-heading font-bold text-lg text-primary leading-tight">{APP_CONFIG.name}</h1>
            <p className="text-[9px] text-muted-teal font-medium tracking-wide uppercase truncate max-w-[140px] leading-tight" title={APP_CONFIG.tagline}>{APP_CONFIG.tagline}</p>
          </div>
        </div>
        <button className="md:hidden text-gray-400 hover:text-gray-600" onClick={() => setOpen(false)}>
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 md:px-2 lg:px-4 space-y-1.5 scrollbar-thin">
        <div className="text-xs font-semibold text-gray-400 tracking-wider uppercase mb-3 px-3 hidden lg:block">Menu</div>
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={(e) => handleNavClick(e, item.path)}
              className={({ isActive }) => cn(
                "flex items-center rounded-lg text-sm font-medium transition-all group",
                "px-3 py-2.5 md:justify-center lg:justify-start",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
              title={item.name}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-colors flex-shrink-0", 
                isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-600"
              )} />
              <span className="truncate hidden lg:block lg:ml-3">{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="p-4 md:p-2 lg:p-4 border-t border-gray-100 flex flex-col gap-1">
        <NavLink
          to="/settings"
          onClick={(e) => handleNavClick(e, '/settings')}
          className={({ isActive }) => cn(
            "flex items-center rounded-lg text-sm font-medium transition-all group",
            "px-3 py-2.5 md:justify-center lg:justify-start",
            isActive 
              ? "bg-primary/10 text-primary border border-primary/20" 
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-transparent"
          )}
          title="Settings"
        >
          {({ isActive }) => (
             <>
               <Settings className={cn(
                 "w-5 h-5 transition-colors flex-shrink-0", 
                 isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-600"
               )} />
               <span className="hidden lg:block lg:ml-3">Settings</span>
             </>
          )}
        </NavLink>
       </div>
     </aside>
   );
 }
