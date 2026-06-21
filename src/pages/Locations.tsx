import React, { useState, useEffect } from 'react';
import { MapPin, Edit2, Save, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { STORAGE_KEYS, saveVenues, addActivity } from '../lib/storage';
import type { Venue } from '../types';

export default function Locations() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.VENUES);
      if (stored) setVenues(JSON.parse(stored));
    } catch {
      // ignore
    }
  };

  const handleSave = () => {
    if (!editingVenue) return;
    
    const updatedVenues = venues.map(v => 
      v.id === editingVenue.id ? editingVenue : v
    );
    
    saveVenues(updatedVenues);
    setVenues(updatedVenues);
    setEditingVenue(null);
    setToastMessage('Venue updated successfully');
    setTimeout(() => setToastMessage(null), 3000);
    addActivity({ message: `Updated venue: ${editingVenue.name}`, type: 'success' });
  };

  const venue = venues[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-heading font-semibold text-gray-900 tracking-tight">Your Venue</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your display location</p>
      </div>

      {toastMessage && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg border border-green-200 flex items-center gap-2 animate-in fade-in">
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {venue ? (
        <div className="card p-6">
          {editingVenue ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Venue Name</label>
                <input
                  type="text"
                  value={editingVenue.name}
                  onChange={(e) => setEditingVenue({ ...editingVenue, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0E7B35] focus:ring-1 focus:ring-[#0E7B35]"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Number of Screens</label>
                <input
                  type="number"
                  value={editingVenue.screens}
                  onChange={(e) => setEditingVenue({ ...editingVenue, screens: parseInt(e.target.value) || 1 })}
                  min="1"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0E7B35] focus:ring-1 focus:ring-[#0E7B35]"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0E7B35] hover:bg-[#0A5E28] text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingVenue(null)}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#0E7B35]/10 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-[#0E7B35]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{venue.name}</h3>
                    <p className="text-sm text-gray-500">
                      {venue.screens} screen{venue.screens !== 1 ? 's' : ''} • Created {new Date(venue.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingVenue(venue)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 font-medium mb-1">Venue ID</p>
                  <p className="text-sm font-mono text-gray-700">{venue.id}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 font-medium mb-1">Screens</p>
                  <p className="text-sm text-gray-700">{venue.screens}</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> Open the Player on each screen by navigating to <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">/player</code> in a browser.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-heading font-semibold text-gray-900 mb-2">No Venue Configured</h3>
          <p className="text-gray-500">Complete the setup wizard to create your venue.</p>
        </div>
      )}
    </div>
  );
}
