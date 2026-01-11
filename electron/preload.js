const { contextBridge, ipcRenderer } = require('electron');

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
  onStatus: buildEventBridge('session:status'),
  onAgentLog: buildEventBridge('agent:log'),
  onFrameUpdate: buildEventBridge('frame:update'),
});
