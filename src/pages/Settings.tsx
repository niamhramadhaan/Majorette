import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Save, Server, CheckCircle2, FolderOpen, AlertCircle, Wifi, WifiOff, Volume2, VolumeX, Film, Music, Image as ImageIcon, Pencil, X, Palette } from 'lucide-react';
import { cn } from '../lib/utils';
import { getSettings, saveSettings, addActivity, checkServerHealth, type ServerHealth } from '../lib/storage';
import { THEME_PRESETS } from '../themes';
import { applyTheme } from '../lib/theme';
import type { AppSettings } from '../types';

export default function Settings() {
  const { setDirty } = useOutletContext<{ setDirty: (v: boolean) => void }>();
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [isEditMode, setIsEditMode] = useState(false);
  const [draftSettings, setDraftSettings] = useState<AppSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [serverHealth, setServerHealth] = useState<ServerHealth | null>(null);

  useEffect(() => { checkHealth(); }, []);

  const checkHealth = async () => {
    const health = await checkServerHealth();
    setServerHealth(health);
  };

  const handleEnterEdit = () => {
    setDraftSettings(settings);
    setIsEditMode(true);
    setDirty(true);
  };

  const handleCancelEdit = () => {
    setDraftSettings(settings);
    applyTheme(settings.accentTheme);
    setIsEditMode(false);
    setDirty(false);
  };

  const handleSave = () => {
    setIsSaving(true);
    saveSettings(draftSettings);
    setSettings(draftSettings);
    applyTheme(draftSettings.accentTheme);
    addActivity({ message: 'Settings saved', type: 'success' });
    setIsSaving(false);
    setIsEditMode(false);
    setDirty(false);
    setToastMessage('Settings saved successfully');
    setTimeout(() => setToastMessage(null), 3000);
    checkHealth();
  };

  const handleValidatePath = async () => {
    await checkHealth();
  };

  useEffect(() => {
    if (!isEditMode) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isEditMode]);

  const current = isEditMode ? draftSettings : settings;

  return (
    <div className="space-y-6 flex flex-col min-h-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-semibold text-gray-900 tracking-tight">Settings</h2>
          <p className="text-sm text-gray-500">
            {isEditMode ? 'Editing — make your changes then save.' : 'View your display configuration.'}
          </p>
        </div>
        {isEditMode ? (
          <div className="flex items-center gap-2">
            <button onClick={handleCancelEdit}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-all hover:bg-gray-50 flex items-center justify-center gap-2 cursor-pointer">
              <X className="w-4 h-4" /> Cancel
            </button>
            <button onClick={handleSave} disabled={isSaving}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-green-100 hover:bg-primary-dark hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer">
              {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        ) : (
          <button onClick={handleEnterEdit}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-all hover:bg-gray-50 hover:shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
            <Pencil className="w-4 h-4" /> Edit
          </button>
        )}
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
              <Server className="w-5 h-5 text-primary" /> Venue Settings
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name</label>
                  <input type="text" value={current.venueName}
                    readOnly={!isEditMode}
                    onChange={(e) => setDraftSettings({ ...draftSettings, venueName: e.target.value })}
                    className={cn("w-full rounded-lg px-3 py-2 text-sm transition-colors",
                      isEditMode
                        ? "bg-white border border-gray-200 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        : "bg-gray-100 border border-gray-200 text-gray-600 cursor-not-allowed")} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <select value={current.timezone}
                    disabled={!isEditMode}
                    onChange={(e) => setDraftSettings({ ...draftSettings, timezone: e.target.value })}
                    className={cn("w-full rounded-lg px-3 py-2 text-sm transition-colors",
                      isEditMode
                        ? "bg-white border border-gray-200 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        : "bg-gray-100 border border-gray-200 text-gray-600 cursor-not-allowed")}>
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
              <FolderOpen className="w-5 h-5 text-primary" /> Content Library
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content Folder Path</label>
                <div className="flex gap-2">
                  <input type="text" value={current.contentRoot}
                    readOnly={!isEditMode}
                    onChange={(e) => setDraftSettings({ ...draftSettings, contentRoot: e.target.value })}
                    placeholder="D:\JEMIMA"
                    className={cn("flex-1 rounded-lg px-3 py-2 text-sm font-mono transition-colors",
                      isEditMode
                        ? "bg-white border border-gray-200 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        : "bg-gray-100 border border-gray-200 text-gray-600 cursor-not-allowed")} />
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
            <h3 className="text-lg font-heading font-semibold text-gray-900 mb-1">Player</h3>
            <p className="text-xs text-gray-500 mb-4">Configure first-play audio behavior. After the first item, you control mute manually.</p>

            <div className="p-4 bg-gray-50 rounded-xl mb-4">
              <p className="text-sm text-gray-600">
                Open the player on your display screen by navigating to <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs font-mono">/player</code> in a browser. The player will automatically play your active schedule.
              </p>
            </div>

            <div className="space-y-3">
              {([
                { key: 'videoNoOverlay' as const, icon: Film, label: 'Video', desc: 'No background audio' },
                { key: 'audioNoOverlay' as const, icon: Music, label: 'Audio', desc: 'No background audio' },
                { key: 'videoWithOverlay' as const, icon: Film, label: 'Video + Overlay', desc: 'With background audio' },
                { key: 'image' as const, icon: ImageIcon, label: 'Image', desc: 'With or without background audio' },
              ]).map(({ key, icon: Icon, label, desc }) => {
                const isMuted = current.playerMuteConfig[key];
                return (
                  <div key={key} className={cn("flex items-center justify-between p-3 rounded-lg border transition-colors",
                    isEditMode ? "bg-white border-gray-200" : "bg-gray-100 border-gray-200")}>
                    <div className="flex items-center gap-3">
                      <Icon className={cn("w-4 h-4", isEditMode ? "text-gray-400" : "text-gray-300")} />
                      <div>
                        <p className={cn("text-sm font-medium", isEditMode ? "text-gray-700" : "text-gray-500")}>{label}</p>
                        <p className={cn("text-[11px]", isEditMode ? "text-gray-400" : "text-gray-300")}>{desc}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!isEditMode}
                      onClick={() => setDraftSettings({
                        ...draftSettings,
                        playerMuteConfig: { ...draftSettings.playerMuteConfig, [key]: !isMuted }
                      })}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                        !isEditMode && "cursor-not-allowed opacity-50",
                        isMuted
                          ? "bg-red-50 text-red-600 border-red-200 " + (isEditMode ? "hover:bg-red-100" : "")
                          : "bg-green-50 text-green-600 border-green-200 " + (isEditMode ? "hover:bg-green-100" : "")
                      )}
                    >
                      {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      {isMuted ? 'Muted' : 'Unmuted'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-gray-100 my-6"></div>

          <div>
            <h3 className="text-lg font-heading font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" /> Appearance
            </h3>
            <p className="text-xs text-gray-500 mb-4">Choose an accent color for the dashboard.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {THEME_PRESETS.map((preset) => {
                const isSelected = current.accentTheme === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    disabled={!isEditMode}
                    onClick={() => {
                      setDraftSettings({ ...draftSettings, accentTheme: preset.id });
                      applyTheme(preset.id);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                      !isEditMode && "cursor-not-allowed opacity-50",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full" style={{ backgroundColor: preset.colors.primary }} />
                      <div className="w-5 h-5 rounded-full" style={{ backgroundColor: preset.colors.secondary }} />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{preset.name}</span>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-secondary" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
