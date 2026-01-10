const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const GoBridge = require('./goBridge');
const SessionManager = require('./sessionManager');

const REMOTE_DEBUG_PORT = Number(process.env.KHANZUO_REMOTE_DEBUG_PORT || 9333);
app.commandLine.appendSwitch('remote-debugging-port', String(REMOTE_DEBUG_PORT));
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
app.commandLine.appendSwitch('ignore-certificate-errors');
app.commandLine.appendSwitch('allow-insecure-localhost');

let mainWindow;
const sessionViews = new Map();
const goBridge = new GoBridge();
const sessionManager = new SessionManager();
const patchedSessions = new WeakSet();

function allowCertificatesForSession(targetSession) {
  if (!targetSession || patchedSessions.has(targetSession)) return;
  try {
    targetSession.setCertificateVerifyProc((_request, callback) => callback(0));
    patchedSessions.add(targetSession);
  } catch (error) {
    console.warn('[certificates] failed to set verify proc', error?.message ?? error);
  }
}

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
  allowCertificatesForSession(session.defaultSession);
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

app.on('certificate-error', (event, _webContents, _url, _error, _certificate, callback) => {
  event.preventDefault();
  callback(true);
});

app.on('web-contents-created', (_event, contents) => {
  allowCertificatesForSession(contents.session);
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
