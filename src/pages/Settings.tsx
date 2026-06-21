import React, { useState, useEffect } from 'react';
import { Save, Server, CheckCircle2, FolderOpen, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { cn } from '../lib/utils';
import { getSettings, saveSettings, addActivity, checkServerHealth, type ServerHealth } from '../lib/storage';
import type { AppSettings } from '../types';

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [serverHealth, setServerHealth] = useState<ServerHealth | null>(null);

  useEffect(() => { checkHealth(); }, []);

  const checkHealth = async () => {
    const health = await checkServerHealth();
    setServerHealth(health);
  };

  const handleSave = () => {
    setIsSaving(true);
    saveSettings(settings);
    addActivity({ message: 'Settings saved', type: 'success' });
    setIsSaving(false);
    setToastMessage('Settings saved successfully');
    setTimeout(() => setToastMessage(null), 3000);
    checkHealth();
  };

  const handleValidatePath = async () => {
    await checkHealth();
  };

  return (
    <div className="space-y-6 flex flex-col min-h-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-semibold text-gray-900 tracking-tight">Settings</h2>
          <p className="text-sm text-gray-500">Manage your display configuration.</p>
        </div>
        <button onClick={handleSave} disabled={isSaving}
          className="px-4 py-2 bg-[#0E7B35] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-green-100 hover:bg-[#0A5E28] hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
          {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {serverHealth && (
        <div className={cn("p-4 rounded-xl border flex items-center gap-3",
          serverHealth.connected && serverHealth.exists ? "bg-green-50 border-green-200" :
          serverHealth.connected ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200"
        )}>
          {serverHealth.connected ? (
            serverHealth.exists ? (
              <><Wifi className="w-5 h-5 text-green-600" /><div>
                <p className="text-sm font-medium text-green-800">Server Connected</p>
                <p className="text-xs text-green-700">{serverHealth.fileCount} files in {serverHealth.contentRoot}</p>
              </div></>
            ) : (
              <><AlertCircle className="w-5 h-5 text-yellow-600" /><div>
                <p className="text-sm font-medium text-yellow-800">Folder Not Found</p>
                <p className="text-xs text-yellow-700">Server is running but folder does not exist: {serverHealth.contentRoot}</p>
              </div></>
            )
          ) : (
            <><WifiOff className="w-5 h-5 text-red-600" /><div>
              <p className="text-sm font-medium text-red-800">Server Disconnected</p>
              <p className="text-xs text-red-700">Run <code className="bg-red-100 px-1.5 py-0.5 rounded">npm run server</code> to start the content server.</p>
            </div></>
          )}
        </div>
      )}

      <div className="card p-6 bg-white">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-[#0E7B35]" /> Venue Settings
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name</label>
                  <input type="text" value={settings.venueName} onChange={(e) => setSettings({ ...settings, venueName: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0E7B35] focus:border-[#0E7B35]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <select value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0E7B35] focus:border-[#0E7B35]">
                    <option value="UTC">UTC</option>
                    <option value="UTC+7">UTC+7 (WIB)</option>
                    <option value="UTC+8">UTC+8 (WITA)</option>
                    <option value="UTC+9">UTC+9 (WIT)</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">GMT</option>
                    <option value="Europe/Berlin">CET</option>
                    <option value="Asia/Tokyo">JST</option>
                    <option value="Asia/Shanghai">CST</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100 my-6"></div>

          <div>
            <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-[#0E7B35]" /> Content Library
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content Folder Path</label>
                <div className="flex gap-2">
                  <input type="text" value={settings.contentRoot} onChange={(e) => setSettings({ ...settings, contentRoot: e.target.value })}
                    placeholder="D:\JEMIMA" className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0E7B35] focus:border-[#0E7B35] font-mono" />
                  <button type="button" onClick={handleValidatePath}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                    <Wifi className="w-4 h-4" /> Validate
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Path where your media files are stored. Changes apply immediately.
                </p>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100 my-6"></div>

          <div>
            <h3 className="text-lg font-heading font-semibold text-gray-900 mb-4">Player</h3>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600">
                Open the player on your display screen by navigating to <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs font-mono">/player</code> in a browser. The player will automatically play your active schedule.
              </p>
            </div>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-[#B9EA38]" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
