const { ipcMain, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

function registerSettingsIPC(mainWindow) {
  ipcMain.handle('settings:get', () => {
    return mainWindow.webContents.send('settings:data');
  });
}

module.exports = { registerSettingsIPC };
