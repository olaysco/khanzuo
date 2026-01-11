const { app, BrowserWindow, ipcMain, session, dialog } = require('electron');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { execFile } = require('child_process');
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
const agentBinaryPaths = {
  codex: process.env.CODEX_BIN || '/usr/local/bin/codex',
  gemini: '',
  claude: '',
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

function buildRouterPrompt(payload = {}) {
  const prompt = payload.prompt?.trim() ?? '';
  const folders = Array.isArray(payload.contextFolders) ? payload.contextFolders : [];
  const folderSummaries = folders
    .map((folder, index) => {
      const lines = [
        `Folder ${index + 1}: ${folder.name ?? 'unknown'}`,
        `Path: ${folder.path ?? 'n/a'}`,
        `Summary: ${folder.summary ?? 'n/a'}`,
      ];
      if (folder.preview) {
        const dirs = folder.preview.directories?.length ? folder.preview.directories.join(', ') : 'none';
        const files = folder.preview.files?.length ? folder.preview.files.join(', ') : 'none';
        lines.push(`Preview directories: ${dirs}`);
        lines.push(`Preview files: ${files}`);
      }
      return lines.join('\n');
    })
    .join('\n\n');

  return `You are the Khanzuo routing planner. Analyze the user's instructions and attached folders.
Decide which intent best fits: "ui_repro" (automated UI reproduction), "code_analysis" (inspect code only), or "hybrid" (UI first, then code).
Return JSON only in the format:
{
  "intent": "ui_repro" | "code_analysis" | "hybrid",
  "summary": "short description",
  "plan": [
    { "title": "Step title", "detail": "action details" }
  ]
}
Limit the plan to 3-6 steps. Do not include any commentary outside the JSON.

User Prompt:\n${prompt}

Context Folders:\n${folderSummaries || 'none provided'}
`;
}

function parseRouterResponse(output = '') {
  const firstBrace = output.indexOf('{');
  const lastBrace = output.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('Router response missing JSON payload');
  }
  const jsonText = output.slice(firstBrace, lastBrace + 1);
  return JSON.parse(jsonText);
}

async function runCodexRouter(payload = {}) {
  const prompt = buildRouterPrompt(payload);
  const agent = typeof payload.agent === 'string' ? payload.agent : 'codex';
  const customCommand = typeof payload?.binaryPath === 'string' ? payload.binaryPath.trim() : '';
  const fallbackCommand = agentBinaryPaths[agent] || process.env.CODEX_BIN;
  const command = customCommand || fallbackCommand || '/usr/local/bin/codex';
  if (!command) {
    throw new Error('No executable configured for selected agent. Update Settings.');
  }
  if (!fs.existsSync(command)) {
    throw new Error(`Agent binary not found at ${command}. Update the path in Settings.`);
  }
  const defaultArgs = process.env.CODEX_ARGS ? process.env.CODEX_ARGS.split(' ').filter(Boolean) : [];
  const args = [...defaultArgs, prompt];
  return new Promise((resolve, reject) => {
    execFile(
      command,
      args,
      { env: { ...process.env }, maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          const details = stderr?.trim() || stdout?.trim() || error.message;
          reject(new Error(`Codex router failed: ${details}`));
          return;
        }
        try {
          const parsed = parseRouterResponse(stdout?.toString() ?? '');
          if (!parsed.decidedAt) parsed.decidedAt = new Date().toISOString();
          resolve(parsed);
        } catch (parseError) {
          reject(new Error(`Router output invalid JSON: ${parseError.message}`));
        }
      },
    );
  });
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
ipcMain.handle('agent:createSessionId', () => goBridge.request('create-session-id'));
ipcMain.handle('agent:startSession', (_event, payload) => sessionManager.startSession(payload));
ipcMain.handle('agent:stopSession', (_event, payload) => sessionManager.stopSession(payload));
ipcMain.handle('agent:sendPrompt', (_event, payload) => goBridge.request('send-prompt', payload));
ipcMain.handle('session:viewAttached', (_event, payload) => {
  sessionViews.set(payload.sessionId, payload);
  return { status: 'ok' };
});
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
ipcMain.handle('agent:routerDecision', async (_event, payload) => {
  try {
    return await runCodexRouter(payload);
  } catch (error) {
    console.error('[router] failed to run Codex router', error);
    throw error;
  }
});
ipcMain.handle('agent:setAgentBinaries', (_event, payload = {}) => {
  const paths = (payload.paths ?? payload) || {};
  Object.keys(paths).forEach((key) => {
    if (typeof paths[key] === 'string') {
      agentBinaryPaths[key] = paths[key].trim()
    }
  });
  return agentBinaryPaths;
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
