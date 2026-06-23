import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { applyTheme } from '../lib/theme';
import { getSettings } from '../lib/storage';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const [isDirty, setIsDirty] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const requestNavigation = (path: string, action?: () => void) => {
    if (isDirty) {
      setPendingPath(path);
      setPendingAction(() => action || null);
    } else {
      if (action) action();
      navigate(path);
    }
  };

  const handleDiscard = () => {
    const savedTheme = getSettings().accentTheme;
    applyTheme(savedTheme);
    setIsDirty(false);
    const action = pendingAction;
    const path = pendingPath;
    setPendingPath(null);
    setPendingAction(null);
    if (action) action();
    if (path) navigate(path);
  };

  const handleKeepEditing = () => {
    setPendingPath(null);
    setPendingAction(null);
  };

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

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

      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} requestNavigation={requestNavigation} />
      
      <div className="relative flex flex-col flex-1 overflow-hidden h-screen z-0 min-w-0">
        <Topbar setSidebarOpen={setSidebarOpen} requestNavigation={requestNavigation} setDirty={setIsDirty} />
        <main className="w-full grow overflow-y-auto p-4 sm:p-6 md:p-10 max-w-7xl mx-auto relative z-0">
          <Outlet context={{ setDirty: setIsDirty }} />
        </main>
      </div>

      {pendingPath && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in slide-in-from-bottom-4">
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-lg text-gray-900">Discard Changes?</h3>
                <p className="text-sm text-gray-500 mt-1">
                  You have unsaved settings. Leaving this page will revert your changes.
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={handleKeepEditing} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 bg-white border border-gray-200 rounded-lg transition-colors cursor-pointer">
                Keep Editing
              </button>
              <button onClick={handleDiscard} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm cursor-pointer">
                Discard
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
