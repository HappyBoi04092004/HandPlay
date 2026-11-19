const { contextBridge, ipcRenderer } = require('electron');

const electronAPI = {
  getResourcesPath: () => ipcRenderer.invoke('get-resources-path'),
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

  loadRecords: () => ipcRenderer.invoke('load-records'),
  saveRecords: (records) => ipcRenderer.invoke('save-records', records),

  getMediaPath: (category, filename) => ipcRenderer.invoke('get-media-path', category, filename),
  saveImage: (dataUrl, defaultName) => ipcRenderer.invoke('save-image', dataUrl, defaultName),

  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  quitApp: () => ipcRenderer.invoke('quit-app'),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
