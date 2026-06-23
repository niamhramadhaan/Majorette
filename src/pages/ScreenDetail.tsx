import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { ArrowLeft, Monitor, ExternalLink, Copy, Edit2, Save, X, Trash2, Volume2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { STORAGE_KEYS, saveVenues, addActivity } from '../lib/storage';
import type { Venue, ScreenConfig } from '../types';

export default function ScreenDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [screen, setScreen] = useState<ScreenConfig | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.VENUES);
      if (stored) {
        const venues: Venue[] = JSON.parse(stored);
        for (const v of venues) {
          const found = v.screens.find(s => s.id === id);
          if (found) {
            setScreen(found);
            setVenue(v);
            setEditName(found.name);
            break;
          }
        }
      }
    } catch { /* ignore */ }
    setIsLoading(false);
  }, [id]);

  const handleSave = () => {
    if (!screen || !venue || !editName.trim()) return;
    const updated = { ...screen, name: editName.trim() };
    const updatedScreens = venue.screens.map(s => s.id === screen.id ? updated : s);
    const updatedVenue = { ...venue, screens: updatedScreens };

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.VENUES);
      if (stored) {
        const venues: Venue[] = JSON.parse(stored);
        const updatedVenues = venues.map(v => v.id === venue.id ? updatedVenue : v);
        saveVenues(updatedVenues);
        setScreen(updated);
        setVenue(updatedVenue);
        setIsEditing(false);
        setToastMessage('Screen updated');
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch { /* ignore */ }
  };

  const handleDelete = () => {
    if (!screen || !venue) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.VENUES);
      if (stored) {
        const venues: Venue[] = JSON.parse(stored);
        const updatedVenue = { ...venue, screens: venue.screens.filter(s => s.id !== screen.id) };
        const updatedVenues = venues.map(v => v.id === venue.id ? updatedVenue : v);
        saveVenues(updatedVenues);
        addActivity({ message: `Deleted screen: ${screen.name}`, type: 'info' });
        navigate('/locations');
      }
    } catch { /* ignore */ }
  };

  const handleCopyUrl = () => {
    if (!screen) return;
    navigator.clipboard.writeText(window.location.origin + screen.playerUrl);
    setToastMessage('Player URL copied to clipboard');
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!screen) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
          <Monitor className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Screen not found</h2>
        <button onClick={() => navigate('/locations')} className="text-primary font-medium hover:underline">Return to Locations</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/locations')} className="p-2 bg-white border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="px-3 py-1 border border-gray-200 rounded-lg text-lg font-heading font-bold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()} autoFocus />
                <button onClick={handleSave} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"><Save className="w-4 h-4" /></button>
                <button onClick={() => { setIsEditing(false); setEditName(screen.name); }} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="font-heading font-bold text-2xl text-gray-900 tracking-tight">{screen.name}</h1>
                <button onClick={() => setIsEditing(true)} className="p-1 text-gray-400 hover:text-gray-600"><Edit2 className="w-4 h-4" /></button>
              </div>
            )}
            <p className="text-sm text-gray-500 mt-1">Screen ID: {screen.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.open(screen.playerUrl, '_blank')}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <ExternalLink className="w-4 h-4" /> Open Player
          </button>
          <button onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-2 bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-heading font-semibold text-gray-900">Screen Info</h3>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <p className="text-xs text-gray-500 font-medium mb-2">Player URL</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-700">
                {window.location.origin}{screen.playerUrl}
              </code>
              <button onClick={handleCopyUrl}
                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 transition-colors flex items-center gap-1.5">
                <Copy className="w-4 h-4" /> Copy
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Venue</p>
              <p className="text-sm font-medium text-gray-900">{venue?.name || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Created</p>
              <p className="text-sm font-medium text-gray-900">{new Date(screen.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Mute Config</p>
            <p className="text-sm text-gray-600">
              {screen.muteConfigOverride
                ? 'Custom (per-screen override active)'
                : 'Using global settings'}
            </p>
          </div>
        </div>
      </div>

      <div className="card p-4 bg-blue-50 border border-blue-100">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Open <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">{screen.playerUrl}</code> in a browser on the display screen. The player will automatically play your active schedule.
        </p>
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-xl text-sm font-medium z-[200] animate-in fade-in slide-in-from-bottom-4">
          {toastMessage}
        </div>
      )}

      {confirmDelete && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 text-center p-6">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 border border-red-100"><Trash2 className="w-6 h-6 text-red-500" /></div>
            <h3 className="font-heading font-semibold text-lg text-gray-900 mb-2">Delete Screen</h3>
            <p className="text-gray-500 text-sm mb-6">Are you sure you want to delete <span className="font-semibold text-gray-700">"{screen.name}"</span>?</p>
            <div className="flex items-center gap-3 w-full">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-lg text-sm font-medium transition-colors cursor-pointer">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer shadow-sm">Delete</button>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
}
