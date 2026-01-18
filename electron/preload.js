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
  // Session management
  startSession: (payload) => ipcRenderer.invoke('agent:startSession', payload),
  stopSession: (payload) => ipcRenderer.invoke('agent:stopSession', payload),

  // Context folders
  selectContextFolders: () => ipcRenderer.invoke('agent:selectContextFolders'),
  readContextFile: (payload) => ipcRenderer.invoke('agent:readContextFile', payload),

  // LLM configuration and action planning
  setLLMConfig: (config) => ipcRenderer.invoke('agent:setLLMConfig', config),
  planActions: (payload) => ipcRenderer.invoke('agent:planActions', payload),

  // Event listeners
  onStatus: buildEventBridge('session:status'),
  onAgentLog: buildEventBridge('agent:log'),
  onFrameUpdate: buildEventBridge('frame:update'),
});
