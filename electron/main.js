const { app, BrowserWindow, ipcMain, session, dialog } = require('electron');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const SessionManager = require('./sessionManager');
const { planActions } = require('./llmProvider');

const REMOTE_DEBUG_PORT = Number(process.env.KHANZUO_REMOTE_DEBUG_PORT || 9333);
app.commandLine.appendSwitch('remote-debugging-port', String(REMOTE_DEBUG_PORT));
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
app.commandLine.appendSwitch('ignore-certificate-errors');
app.commandLine.appendSwitch('allow-insecure-localhost');

let mainWindow;
const sessionManager = new SessionManager();
const patchedSessions = new WeakSet();

// Store LLM config (will be set from renderer)
let llmConfig = {
  provider: 'openai',
  apiKey: '',
  model: 'gpt-4o-mini',
  endpoint: '',
};

function summarizeFolder(folderPath) {
  try {
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    const previewDirs = [];
    const previewFiles = [];
    let totalDirs = 0;
    let totalFiles = 0;
    entries.forEach((entry) => {
      if (entry.name.startsWith('.')) return;
      if (entry.isDirectory()) {
        totalDirs += 1;
        if (previewDirs.length < 5) previewDirs.push(entry.name);
      } else if (entry.isFile()) {
        totalFiles += 1;
        if (previewFiles.length < 5) previewFiles.push(entry.name);
      }
    });
    return {
      path: folderPath,
      name: path.basename(folderPath),
      preview: {
        directories: previewDirs,
        files: previewFiles,
      },
      stats: {
        directories: totalDirs,
        files: totalFiles,
      },
      summary: `dirs: ${totalDirs}, files: ${totalFiles}`,
    };
  } catch (error) {
    console.warn('[context] failed to summarize folder', folderPath, error?.message ?? error);
    return {
      path: folderPath,
      name: path.basename(folderPath),
      preview: { directories: [], files: [] },
      stats: { directories: 0, files: 0 },
      summary: 'Unable to read folder contents',
      error: error?.message ?? String(error ?? 'Unknown error'),
    };
  }
}

function resolveChildPath(root, relativePath) {
  const normalizedRoot = path.resolve(root);
  const target = path.resolve(normalizedRoot, relativePath);
  if (!target.startsWith(normalizedRoot)) {
    throw new Error('Path escapes selected folder');
  }
  return target;
}


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
ipcMain.handle('agent:startSession', (_event, payload) => sessionManager.startSession(payload));
ipcMain.handle('agent:stopSession', (_event, payload) => sessionManager.stopSession(payload));

ipcMain.handle('agent:selectContextFolders', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select folders for Khanzuo context',
    properties: ['openDirectory', 'multiSelections'],
  });
  if (result.canceled || !Array.isArray(result.filePaths)) {
    return [];
  }
  return result.filePaths.map((folderPath) => summarizeFolder(folderPath));
});

ipcMain.handle('agent:readContextFile', async (_event, payload = {}) => {
  const { folderPath, relativePath, maxBytes = 200000 } = payload;
  if (!folderPath || !relativePath) {
    throw new Error('folderPath and relativePath are required');
  }
  const targetPath = resolveChildPath(folderPath, relativePath);
  const data = await fsp.readFile(targetPath, 'utf-8');
  const truncated = data.length > maxBytes;
  return {
    path: targetPath,
    content: truncated ? data.slice(0, maxBytes) : data,
    truncated,
  };
});

// LLM Configuration
ipcMain.handle('agent:setLLMConfig', (_event, config = {}) => {
  llmConfig = { ...llmConfig, ...config };
  return llmConfig;
});

// Action Planning via LLM
ipcMain.handle('agent:planActions', async (_event, payload) => {
  try {
    // Merge stored config with any passed config
    const config = { ...llmConfig, ...(payload.llmConfig || {}) };
    return await planActions({ ...payload, llmConfig: config });
  } catch (error) {
    console.error('[llm] Action planning failed:', error);
    throw error;
  }
});

// Proxy session events to renderer
function emitToRenderer(event, payload) {
  if (!mainWindow) return;
  mainWindow.webContents.send(event, payload);
}

sessionManager.on('frame', (payload) => emitToRenderer('frame:update', payload));
sessionManager.on('status', (payload) => emitToRenderer('session:status', payload));
sessionManager.on('log', (payload) => emitToRenderer('agent:log', payload));
