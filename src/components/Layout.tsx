import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
         e.preventDefault();
         const saveBtn = document.querySelector('button[data-shortcut="ctrl-s"]') as HTMLButtonElement | null;
         if (saveBtn && !saveBtn.disabled) {
            saveBtn.click();
         } else {
           const buttons = Array.from(document.querySelectorAll('button'));
           const genericSaveBtn = buttons.find(b => b.textContent?.trim().toLowerCase().includes('save') && !b.disabled);
           if (genericSaveBtn) {
              genericSaveBtn.click();
           }
         }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg-light)] isolate">
      <div 
        className="fixed inset-0 z-20 bg-black/50 transition-opacity md:hidden"
        style={{ opacity: sidebarOpen ? 1 : 0, pointerEvents: sidebarOpen ? 'auto' : 'none' }}
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="relative flex flex-col flex-1 overflow-hidden h-screen z-0 min-w-0">
        <Topbar setSidebarOpen={setSidebarOpen} />
        <main className="w-full grow overflow-y-auto p-4 sm:p-6 md:p-10 max-w-7xl mx-auto relative z-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
