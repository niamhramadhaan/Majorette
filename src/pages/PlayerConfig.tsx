import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, ArrowRight, AlertCircle } from 'lucide-react';
import { ensureScreenExists } from '../lib/storage';

export default function PlayerConfig() {
  const navigate = useNavigate();
  const [screenId, setScreenId] = useState(() => {
    try {
      const stored = localStorage.getItem('jemima_player_config');
      if (stored) {
        const config = JSON.parse(stored);
        return config.screenId || '';
      }
    } catch { /* ignore */ }
    return '';
  });
  const [error, setError] = useState('');

  const validate = (value: string): string => {
    if (!value.trim()) return '';
    if (/https?:\/\//i.test(value)) return 'Enter a screen ID, not a URL';
    if (/[\/\\]/.test(value)) return 'Screen ID cannot contain slashes';
    if (/[.@]/.test(value)) return 'Screen ID cannot contain dots or @';
    if (!/^[a-zA-Z0-9_-]+$/.test(value.trim())) return 'Only letters, numbers, hyphens, and underscores allowed';
    return '';
  };

  const handleSave = () => {
    const id = screenId.trim().toLowerCase();
    const validationError = validate(id);
    if (validationError) {
      setError(validationError);
      return;
    }

    const config = { screenId: id };
    localStorage.setItem('jemima_player_config', JSON.stringify(config));

    // Also save to Electron's userData if available
    // (main.cjs reads from there on launch)
    if ((window as any).electronAPI?.isElectron) {
      (window as any).electronAPI.saveConfig(config);
    }

    // Ensure screen exists in localStorage so ScreenPlayer can find it
    ensureScreenExists(id);

    // Persist screen to server API for cross-context access
    fetch('/api/screens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ screenId: id }),
    }).catch(() => { /* ignore — server may not be available */ });

    navigate(`/player/screen/${id}`);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScreenId(e.target.value);
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-6">
        <div className="text-center">
          <img src="/logo.png" alt="JEMIMA" className="w-16 h-16 mx-auto mb-4 rounded-xl" />
          <h1 className="text-xl font-heading font-bold text-white mb-1">JEMIMA Player Setup</h1>
          <p className="text-sm text-gray-500">Configure this display screen</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Screen ID</label>
            <input
              type="text"
              value={screenId}
              onChange={handleChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="e.g. screen-lobby"
              className={`w-full px-3 py-2.5 bg-gray-900 border rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 ${
                error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-700 focus:border-primary focus:ring-primary'
              }`}
              autoFocus
            />
            {error && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}
            {!error && <p className="text-xs text-gray-600 mt-1.5">Find this in CMS → Locations → Screen ID</p>}
          </div>

          <button
            onClick={handleSave}
            disabled={!screenId.trim() || !!validate(screenId.trim())}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          >
            Start Player
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-center text-xs text-gray-700">
          Press <kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-400 text-[10px]">Ctrl+Shift+C</kbd> to return here anytime
        </p>
      </div>
    </div>
  );
}
