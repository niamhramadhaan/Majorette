const { contextBridge, ipcRenderer } = require('electron');

// Expose minimal API to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  minimize: () => ipcRenderer.invoke('window:minimize'),
  toggleFullscreen: () => ipcRenderer.invoke('window:toggle-fullscreen'),
  isFullscreen: () => ipcRenderer.invoke('window:is-fullscreen'),
  saveConfig: (config) => ipcRenderer.invoke('save-player-config', config),
});
