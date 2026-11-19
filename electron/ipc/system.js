const { ipcMain, app, shell } = require('electron');
const os = require('os');

function registerSystemIPC() {
  ipcMain.handle('system:get-info', () => ({
    platform: process.platform,
    arch: process.arch,
    cpus: os.cpus().length,
    memory: Math.round(os.totalmem() / (1024 * 1024 * 1024)),
    electronVersion: process.versions.electron,
    chromeVersion: process.versions.chrome,
    nodeVersion: process.versions.node,
  }));

  ipcMain.handle('system:open-external', (_event, url) => {
    shell.openExternal(url);
  });

  ipcMain.handle('system:get-app-path', () => {
    return app.getPath('userData');
  });
}

module.exports = { registerSystemIPC };
