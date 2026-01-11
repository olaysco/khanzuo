const { contextBridge, ipcRenderer } = require('electron');

const WEBVIEW_ID = 'khanzuo-session-webview';

async function attachSessionView(elementId, sessionId) {
  const targetId = elementId || WEBVIEW_ID;
  const element = document.getElementById(targetId);
  if (!element) throw new Error('Session view element not found');
  const marker = `khanzuo-session-${sessionId}`;

  const webContentsId = await new Promise((resolve) => {
    const handler = () => {
      element.removeEventListener('dom-ready', handler);
      resolve(element.getWebContentsId());
    };
    element.addEventListener('dom-ready', handler, { once: true });
    element.src = `about:blank#${marker}`;
  });

  await ipcRenderer.invoke('session:viewAttached', {
    sessionId,
    webContentsId,
    marker,
  });
  return true;
}

function buildEventBridge(channel) {
  return (handler) => {
    if (typeof handler !== 'function') return () => {};
    const wrapped = (_event, payload) => handler(payload);
    ipcRenderer.on(channel, wrapped);
    return () => ipcRenderer.removeListener(channel, wrapped);
  };
}

contextBridge.exposeInMainWorld('khanzuo', {
  createSessionId: () => ipcRenderer.invoke('agent:createSessionId'),
  startSession: (payload) => ipcRenderer.invoke('agent:startSession', payload),
  stopSession: (payload) => ipcRenderer.invoke('agent:stopSession', payload),
  sendPrompt: (payload) => ipcRenderer.invoke('agent:sendPrompt', payload),
  selectContextFolders: () => ipcRenderer.invoke('agent:selectContextFolders'),
  readContextFile: (payload) => ipcRenderer.invoke('agent:readContextFile', payload),
  routerDecision: (payload) => ipcRenderer.invoke('agent:routerDecision', payload),
  setAgentBinaries: (paths) => ipcRenderer.invoke('agent:setAgentBinaries', { paths }),
  attachSessionView: (elementId, sessionId) => attachSessionView(elementId, sessionId),
  onStatus: buildEventBridge('session:status'),
  onAgentLog: buildEventBridge('agent:log'),
  onFrameUpdate: buildEventBridge('frame:update'),
});
