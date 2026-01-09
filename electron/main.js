const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const GoBridge = require('./goBridge');
const SessionManager = require('./sessionManager');

const REMOTE_DEBUG_PORT = Number(process.env.KHANZUO_REMOTE_DEBUG_PORT || 9333);
app.commandLine.appendSwitch('remote-debugging-port', String(REMOTE_DEBUG_PORT));
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');

let mainWindow;
const sessionViews = new Map();
const goBridge = new GoBridge();
const sessionManager = new SessionManager();

function getRendererURL() {
  if (!app.isPackaged) {
    return process.env.KHANZUO_DEV_SERVER_URL || 'http://localhost:5173';
  }
  return path.join(__dirname, '../frontend/dist/index.html');
}

function loadRenderer(win) {
  const target = getRendererURL();
  if (target.startsWith('http')) {
    win.loadURL(target);
  } else {
    win.loadFile(target);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 840,
    minWidth: 1024,
    minHeight: 768,
    title: 'Khanzuo',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
    },
  });

  loadRenderer(mainWindow);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers
ipcMain.handle('agent:createSessionId', () => goBridge.request('create-session-id'));
ipcMain.handle('agent:startSession', (_event, payload) => sessionManager.startSession(payload));
ipcMain.handle('agent:stopSession', (_event, payload) => sessionManager.stopSession(payload));
ipcMain.handle('agent:sendPrompt', (_event, payload) => goBridge.request('send-prompt', payload));
ipcMain.handle('session:viewAttached', (_event, payload) => {
  sessionViews.set(payload.sessionId, payload);
  return { status: 'ok' };
});

// Proxy agent events to renderer
function emitToRenderer(event, payload) {
  if (!mainWindow) return;
  mainWindow.webContents.send(event, payload);
}

goBridge.on('event', (msg) => {
  emitToRenderer(msg.event, msg.payload);
});

sessionManager.on('frame', (payload) => emitToRenderer('frame:update', payload));
sessionManager.on('status', (payload) => emitToRenderer('session:status', payload));
sessionManager.on('log', (payload) => emitToRenderer('agent:log', payload));
