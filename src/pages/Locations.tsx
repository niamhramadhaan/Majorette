import React, { useState, useEffect } from 'react';
import { MapPin, Edit2, Save, X, Monitor, Plus, ExternalLink, Copy, Trash2, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { cn } from '../lib/utils';
import { STORAGE_KEYS, saveVenues, addActivity, generateId, DEFAULT_VENUE, getTimestamp, getScreenPlayerState } from '../lib/storage';
import type { Venue, ScreenConfig } from '../types';

export default function Locations() {
  const navigate = useNavigate();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [newScreenName, setNewScreenName] = useState('');
  const [showAddScreen, setShowAddScreen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [screenToDelete, setScreenToDelete] = useState<ScreenConfig | null>(null);

  useEffect(() => { loadVenues(); }, []);

  const loadVenues = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.VENUES);
      if (stored) setVenues(JSON.parse(stored));
    } catch { /* ignore */ }
  };

  const handleSaveVenue = () => {
    if (!editingVenue) return;
    const updatedVenues = venues.map(v => v.id === editingVenue.id ? editingVenue : v);
    saveVenues(updatedVenues);
    setVenues(updatedVenues);
    setEditingVenue(null);
    setToastMessage('Venue updated successfully');
    setTimeout(() => setToastMessage(null), 3000);
    addActivity({ message: `Updated venue: ${editingVenue.name}`, type: 'success' });
  };

  const handleAddScreen = () => {
    if (!venue || !newScreenName.trim()) return;
    const newScreen: ScreenConfig = {
      id: generateId(),
      name: newScreenName.trim(),
      playerUrl: `/player?screen=${generateId()}`,
      venueId: venue.id,
      createdAt: new Date().toISOString(),
    };
    const updatedVenue = { ...venue, screens: [...venue.screens, newScreen] };
    const updatedVenues = venues.map(v => v.id === venue.id ? updatedVenue : v);
    saveVenues(updatedVenues);
    setVenues(updatedVenues);
    setNewScreenName('');
    setShowAddScreen(false);
    setToastMessage(`Screen "${newScreen.name}" added`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeleteScreen = () => {
    if (!venue || !screenToDelete) return;
    const updatedVenue = { ...venue, screens: venue.screens.filter(s => s.id !== screenToDelete.id) };
    const updatedVenues = venues.map(v => v.id === venue.id ? updatedVenue : v);
    saveVenues(updatedVenues);
    setVenues(updatedVenues);
    setToastMessage(`Screen "${screenToDelete.name}" removed`);
    setTimeout(() => setToastMessage(null), 3000);
    setScreenToDelete(null);
  };

  const handleRestoreDefault = () => {
    if (!venue) return;
    const defaultScreen: ScreenConfig = {
      id: 'screen-default',
      name: 'Screen 1',
      playerUrl: '/player?screen=screen-default',
      venueId: venue.id,
      createdAt: new Date().toISOString(),
    };
    const updatedVenue = { ...venue, screens: [defaultScreen] };
    const updatedVenues = venues.map(v => v.id === venue.id ? updatedVenue : v);
    saveVenues(updatedVenues);
    setVenues(updatedVenues);
    setToastMessage('Default screen restored');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(window.location.origin + url);
    setToastMessage('Player URL copied');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreateVenue = () => {
    const newVenue: Venue = { ...DEFAULT_VENUE, id: generateId(), createdAt: getTimestamp() };
    saveVenues([newVenue]);
    setVenues([newVenue]);
    setToastMessage('Venue created');
    setTimeout(() => setToastMessage(null), 3000);
    addActivity({ message: 'Venue created: ' + newVenue.name, type: 'success' });
  };

  const venue = venues[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-heading font-semibold text-gray-900 tracking-tight">Your Venue</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your display location and screens</p>
      </div>

      {toastMessage && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg border border-green-200 flex items-center gap-2 animate-in fade-in">
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {venue ? (
        <>
          <div className="card p-6">
            {editingVenue ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Venue Name</label>
                  <input type="text" value={editingVenue.name}
                    onChange={(e) => setEditingVenue({ ...editingVenue, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>
                <div className="flex gap-3">
                  <button onClick={handleSaveVenue}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors">
                    <Save className="w-4 h-4" /> Save Changes
                  </button>
                  <button onClick={() => setEditingVenue(null)}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{venue.name}</h3>
                      <p className="text-sm text-gray-500">
                        {venue.screens.length} screen{venue.screens.length !== 1 ? 's' : ''} &middot; Created {new Date(venue.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setEditingVenue(venue)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors">
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 font-medium mb-1">Venue ID</p>
                  <p className="text-sm font-mono text-gray-700">{venue.id}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-lg font-heading font-semibold text-gray-900">Screens</h3>
            <button onClick={() => setShowAddScreen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> Add Screen
            </button>
          </div>

          {showAddScreen && (
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <input type="text" value={newScreenName} onChange={(e) => setNewScreenName(e.target.value)}
                  placeholder="Screen name (e.g. Lobby Display)"
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddScreen()} />
                <button onClick={handleAddScreen} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors">Add</button>
                <button onClick={() => { setShowAddScreen(false); setNewScreenName(''); }} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors">Cancel</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {venue.screens.map((screen) => (
              <div key={screen.id}
                className="card p-4 hover:border-secondary/50 transition-colors cursor-pointer group"
                onClick={() => navigate('/locations/screen/' + screen.id)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Monitor className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-heading font-semibold text-gray-900 group-hover:text-primary transition-colors">{screen.name}</h4>
                        {(() => {
                          const state = getScreenPlayerState(screen.id);
                          const isOnline = state && (Date.now() - (state as any).timestamp) < 30000;
                          if (isOnline && state?.isPlaying !== false) return <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />;
                          if (isOnline && state?.isPlaying === false) return <div className="w-2 h-2 rounded-full bg-yellow-500" />;
                          return null;
                        })()}
                      </div>
                      <p className="text-[11px] text-gray-400 font-mono">{screen.id.slice(0, 12)}</p>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setScreenToDelete(screen); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-500" title="Delete screen">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); handleCopyUrl(screen.playerUrl); }}
                    className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-[11px] text-gray-600 font-mono transition-colors">
                    <Copy className="w-3 h-3" /> {screen.playerUrl}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); window.open(screen.playerUrl, '_blank'); }}
                    className="p-1 text-gray-400 hover:text-primary transition-colors" title="Open Player">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {venue.screens.length === 0 && !showAddScreen && (
            <div className="card p-8 text-center">
              <Monitor className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">No screens configured</p>
              <p className="text-xs text-gray-400 mb-4">Add a screen to generate a player URL for your display.</p>
              <button onClick={handleRestoreDefault}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors">
                <RotateCcw className="w-4 h-4" /> Restore Default Screen
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="card p-12 text-center">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-heading font-semibold text-gray-900 mb-2">No Venue Configured</h3>
          <p className="text-gray-500 mb-4">Create a venue to manage your display locations and screens.</p>
          <button onClick={handleCreateVenue}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Create Venue
          </button>
        </div>
      )}

      {screenToDelete && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 text-center p-6">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 border border-red-100"><Trash2 className="w-6 h-6 text-red-500" /></div>
            <h3 className="font-heading font-semibold text-lg text-gray-900 mb-2">Delete Screen</h3>
            <p className="text-gray-500 text-sm mb-6">Are you sure you want to delete <span className="font-semibold text-gray-700">"{screenToDelete.name}"</span>? The player URL will no longer work.</p>
            <div className="flex items-center gap-3 w-full">
              <button onClick={() => setScreenToDelete(null)} className="flex-1 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-lg text-sm font-medium transition-colors cursor-pointer">Cancel</button>
              <button onClick={handleDeleteScreen} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer shadow-sm">Delete</button>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
}
