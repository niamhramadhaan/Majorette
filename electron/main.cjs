const { app, BrowserWindow, globalShortcut, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

const PORT = 3001;
const SERVER_URL = `http://localhost:${PORT}`;
const CONFIG_SHORTCUT = 'CommandOrControl+Shift+C';

let mainWindow = null;
let serverInstance = null;

function checkExistingServer() {
  return new Promise((resolve) => {
    http.get(SERVER_URL + '/health', (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
}

function startEmbeddedServer() {
  return new Promise(async (resolve, reject) => {
    try {
      // Check if server is already running (e.g. dev mode)
      const alreadyRunning = await checkExistingServer();
      if (alreadyRunning) {
        resolve();
        return;
      }

      // Set CONTENT_ROOT to a writable location for the packaged app
      if (app.isPackaged && !process.env.CONTENT_ROOT) {
        process.env.CONTENT_ROOT = path.join(app.getPath('userData'), 'content');
      }

      // Set data paths for API persistence (all stored in userData)
      const userData = app.getPath('userData');
      const dataPaths = {
        SCREENS_DATA_PATH: 'screens.json',
        CONTENT_DATA_PATH: 'content.json',
        SCHEDULES_DATA_PATH: 'schedules.json',
        VENUES_DATA_PATH: 'venues.json',
        SETTINGS_DATA_PATH: 'settings.json',
      };
      for (const [key, file] of Object.entries(dataPaths)) {
        if (!process.env[key]) {
          process.env[key] = path.join(userData, file);
        }
      }

      // Load express app from server.cjs
      const serverPath = path.join(app.getAppPath(), 'server.cjs');
      const expressApp = require(serverPath);

      if (expressApp && expressApp.listen) {
        const checkServer = () => {
          http.get(SERVER_URL + '/health', (res) => {
            if (res.statusCode === 200) {
              resolve();
            } else {
              setTimeout(checkServer, 200);
            }
          }).on('error', () => {
            setTimeout(checkServer, 200);
          });
        };

        setTimeout(checkServer, 300);

        setTimeout(() => {
          reject(new Error('Embedded server did not start in time'));
        }, 10000);
      } else {
        reject(new Error('server.cjs did not return an Express app'));
      }
    } catch (err) {
      reject(err);
    }
  });
}

function getPlayerUrl() {
  const configPath = path.join(app.getPath('userData'), 'player-config.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.screenId) {
        return `${SERVER_URL}/player/screen/${config.screenId}`;
      }
    } catch { /* ignore */ }
  }
  return `${SERVER_URL}/player/config`;
}

function createWindow() {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'logo.png')
    : path.join(__dirname, '..', 'public', 'logo.png');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    fullscreen: true,
    kiosk: true,
    frame: false,
    autoHideMenuBar: true,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const url = getPlayerUrl();
  mainWindow.loadURL(url);

  // Open DevTools with Ctrl+Shift+I (only in dev)
  if (!app.isPackaged) {
    globalShortcut.register('CommandOrControl+Shift+I', () => {
      if (mainWindow) mainWindow.webContents.toggleDevTools();
    });
  }

  // Config shortcut - always available
  globalShortcut.register(CONFIG_SHORTCUT, () => {
    if (mainWindow) {
      mainWindow.loadURL(`${SERVER_URL}/player/config`);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  // IPC handler to persist player config (screenId) to userData
  ipcMain.handle('save-player-config', (event, config) => {
    const configPath = path.join(app.getPath('userData'), 'player-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  });

  // IPC handlers for window controls
  ipcMain.handle('window:minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.handle('window:toggle-fullscreen', () => {
    if (mainWindow) {
      if (mainWindow.isFullScreen()) {
        mainWindow.setFullScreen(false);
        mainWindow.setKiosk(false);
      } else {
        mainWindow.setFullScreen(true);
        mainWindow.setKiosk(true);
      }
    }
  });

  ipcMain.handle('window:is-fullscreen', () => {
    return mainWindow ? mainWindow.isFullScreen() : true;
  });

  try {
    await startEmbeddedServer();
    createWindow();
  } catch (err) {
    console.error('Failed to start:', err);
    dialog.showErrorBox(
      'JEMIMA Player Error',
      `Failed to start the application:\n\n${err.message}`
    );
    app.quit();
  }
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
