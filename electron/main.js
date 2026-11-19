const { app, BrowserWindow, ipcMain, dialog, screen, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = !app.isPackaged;

let mainWindow = null;
let splashWindow = null;

const APP_CONFIG = {
  width: 1280,
  height: 720,
  minWidth: 960,
  minHeight: 540,
  backgroundColor: '#0a0a1a',
};

function getResourcesPath() {
  if (isDev) {
    return path.join(__dirname, '..', 'resources');
  }
  return path.join(process.resourcesPath, 'resources');
}

function getUserDataPath() {
  return app.getPath('userData');
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 480,
    height: 320,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  splashWindow.loadFile(path.join(__dirname, '..', 'src', 'splash.html'));
  splashWindow.center();
}

function createMainWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    minWidth: APP_CONFIG.minWidth,
    minHeight: APP_CONFIG.minHeight,
    backgroundColor: APP_CONFIG.backgroundColor,
    show: false,
    fullscreen: true,
    autoHideMenuBar: true,
    menuBarVisible: false,
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    title: 'HandPlay',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'src', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media' || permission === 'mediaKeySystem') {
      callback(true);
      return;
    }
    if (permission === 'notifications') {
      callback(true);
      return;
    }
    callback(false);
  });

  mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    if (permission === 'media' || permission === 'notifications') {
      return true;
    }
    return false;
  });
}

function registerIPC() {
  ipcMain.handle('get-resources-path', () => getResourcesPath());
  ipcMain.handle('get-user-data-path', () => getUserDataPath());

  ipcMain.handle('load-settings', async () => {
    const settingsPath = path.join(getUserDataPath(), 'settings.json');
    try {
      if (fs.existsSync(settingsPath)) {
        const data = fs.readFileSync(settingsPath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    return null;
  });

  ipcMain.handle('save-settings', async (_event, settings) => {
    const settingsPath = path.join(getUserDataPath(), 'settings.json');
    try {
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
      return true;
    } catch (e) {
      console.error('Failed to save settings:', e);
      return false;
    }
  });

  ipcMain.handle('load-records', async () => {
    const recordsPath = path.join(getUserDataPath(), 'records.json');
    try {
      if (fs.existsSync(recordsPath)) {
        const data = fs.readFileSync(recordsPath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to load records:', e);
    }
    return {};
  });

  ipcMain.handle('save-records', async (_event, records) => {
    const recordsPath = path.join(getUserDataPath(), 'records.json');
    try {
      fs.writeFileSync(recordsPath, JSON.stringify(records, null, 2), 'utf-8');
      return true;
    } catch (e) {
      console.error('Failed to save records:', e);
      return false;
    }
  });

  ipcMain.handle('get-app-version', () => app.getVersion());

  ipcMain.handle('get-media-path', async (_event, category, filename) => {
    const resourcePath = getResourcesPath();
    const filePath = path.join(resourcePath, category, filename);
    return filePath;
  });

  ipcMain.handle('save-image', async (_event, dataUrl, defaultName) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultName || 'handplay-drawing.png',
      filters: [
        { name: 'Hình ảnh PNG', extensions: ['png'] },
      ],
    });
    if (!result.canceled && result.filePath) {
      const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
      fs.writeFileSync(result.filePath, base64, 'base64');
      return true;
    }
    return false;
  });

  ipcMain.handle('toggle-fullscreen', () => {
    if (mainWindow) {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });

  ipcMain.handle('minimize-window', () => {
    if (mainWindow) {
      mainWindow.minimize();
    }
  });

  ipcMain.handle('quit-app', () => {
    app.quit();
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

app.whenReady().then(() => {
  createSplashWindow();

  registerIPC();

  setTimeout(() => {
    createMainWindow();
  }, 1500);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('web-contents-created', (_event, contents) => {
  contents.on('will-navigate', (event) => {
    event.preventDefault();
  });
});
