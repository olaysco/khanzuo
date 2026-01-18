import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const DEFAULT_TARGET_URL = 'https://example.com'

const createRouterState = () => ({
  intent: 'idle',
  summary: '',
  plan: [],
  decidedAt: null,
})

const createSession = (id) => ({
  id,
  targetUrl: DEFAULT_TARGET_URL,
  liveUrl: DEFAULT_TARGET_URL,
  status: 'idle',
  isStarting: false,
  frameSrc: '',
  captureStatus: 'Ready',
  promptValue: '',
  logs: [],
  isSyncing: false,
  lastSync: '--:--',
  manualControl: false,
  contextFolders: [],
  routerState: createRouterState(),
})

const getBridge = () => (typeof window !== 'undefined' ? window.khanzuo ?? null : null)
const createSessionId = () => (crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}-${Math.random()}`)
const isSessionActive = (status) => Boolean(status) && status !== 'idle'
const createFolderRecord = (payload) => ({
  id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
  path: payload?.path ?? '',
  name: payload?.name ?? payload?.path ?? 'unknown',
  preview: payload?.preview ?? { directories: [], files: [] },
  stats: payload?.stats ?? { directories: 0, files: 0 },
  summary: payload?.summary ?? 'Attached folder',
  error: payload?.error,
  addedAt: new Date().toISOString(),
})
const resetRouterState = (session) => {
  if (!session) return
  session.routerState = createRouterState()
}
const createPlanStep = (payload = {}) => ({
  id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
  title: payload.title ?? 'Step',
  detail: payload.detail ?? '',
  status: payload.status ?? 'pending',
})
const applyRouterDecision = (session, decision = {}) => {
  if (!session) return
  const steps = Array.isArray(decision.plan)
    ? decision.plan.slice(0, 8).map((step) => createPlanStep(step))
    : []
  session.routerState = {
    intent: decision.intent ?? 'idle',
    summary: decision.summary ?? '',
    plan: steps,
    decidedAt: decision.decidedAt ?? new Date().toISOString(),
    status: decision.status ?? 'planned',
  }
}

// LLM Provider configuration
const createDefaultLLMConfig = () => ({
  provider: 'openai', // 'openai', 'anthropic', 'ollama', 'custom'
  apiKey: '',
  model: 'gpt-4o-mini',
  endpoint: '', // For custom provider
  ollamaModel: 'llama3.2',
})


export const useSessionStore = defineStore('session', () => {
  // Single session instead of tabs
  const session = ref(createSession(createSessionId()))
  const llmConfig = ref(createDefaultLLMConfig())
  const bridge = getBridge()
  let frameListenerOff = null
  let statusListenerOff = null
  let agentLogListenerOff = null

  // Keep activeSession as computed for compatibility with existing code
  const activeSession = computed(() => session.value)

  const activePromptValue = computed({
    get: () => session.value?.promptValue ?? '',
    set: (value) => {
      if (!session.value) return
      session.value.promptValue = value
    },
  })

const updateTargetUrl = (value) => {
  if (!session.value) return
  session.value.targetUrl = value
  if (!session.value.manualControl) {
    session.value.liveUrl = value
  }
}

  const addLogToSession = (targetSession, payload) => {
    if (!targetSession) return
    targetSession.logs.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString(),
      status: payload.status ?? 'info',
      title: payload.title,
      detail: payload.detail,
    })
    targetSession.lastSync = new Date().toLocaleTimeString()
  }

  const addLog = (payload) => {
    addLogToSession(session.value, payload)
  }

  const attachContextFolders = (targetSession, folders = []) => {
    if (!targetSession || !Array.isArray(folders) || folders.length === 0) return 0
    const existingPaths = new Set((targetSession.contextFolders ?? []).map((folder) => folder.path))
    let added = 0
    folders.forEach((folder) => {
      if (!folder?.path || existingPaths.has(folder.path)) return
      const record = createFolderRecord(folder)
      if (!targetSession.contextFolders) targetSession.contextFolders = []
      targetSession.contextFolders.push(record)
      existingPaths.add(record.path)
      added += 1
    })
    return added
  }

  const setLLMConfig = (config = {}) => {
    llmConfig.value = {
      ...llmConfig.value,
      ...config,
    }
    // Sync to electron main process
    if (bridge && typeof bridge.setLLMConfig === 'function') {
      bridge.setLLMConfig(JSON.parse(JSON.stringify(llmConfig.value))).catch((error) => {
        console.error('[settings] Failed to sync LLM config', error)
      })
    }
  }

  const selectContextFolders = async () => {
    if (!session.value) return 0
    if (!bridge || typeof bridge.selectContextFolders !== 'function') {
      addLog({
        status: 'error',
        title: 'Folder picker unavailable',
        detail: 'Desktop bridge missing selectContextFolders.',
      })
      return 0
    }
    try {
      const folders = await bridge.selectContextFolders()
      const added = attachContextFolders(session.value, folders)
      if (added > 0) {
        addLog({
          status: 'success',
          title: 'Added context folders',
          detail: `${added} folder${added > 1 ? 's' : ''} attached for analysis.`,
        })
      } else if (folders?.length) {
        addLog({
          status: 'info',
          title: 'No new folders added',
          detail: 'Selected folders were already attached.',
        })
      }
      return added
    } catch (error) {
      addLog({
        status: 'error',
        title: 'Failed to add context folder',
        detail: error?.message ?? String(error ?? 'Unknown error'),
      })
      return 0
    }
  }

  const removeContextFolder = (folderId) => {
    if (!session.value || !folderId || !Array.isArray(session.value.contextFolders)) return
    const index = session.value.contextFolders.findIndex((folder) => folder.id === folderId)
    if (index === -1) return
    const [removed] = session.value.contextFolders.splice(index, 1)
    addLog({
      status: 'warning',
      title: 'Removed context folder',
      detail: removed?.name ?? folderId,
    })
  }

  const startSession = async () => {
    if (!session.value || session.value.isStarting || isSessionActive(session.value.status)) return
    session.value.status = 'starting'
    session.value.isStarting = true
    session.value.frameSrc = ''
    const targetUrl = session.value.targetUrl?.trim()
    if (!targetUrl) {
      addLog({
        status: 'error',
        title: 'Missing target URL',
        detail: 'Please provide a URL before starting a session.',
      })
      session.value.status = 'idle'
      session.value.isStarting = false
      return
    }
    if (!bridge || typeof bridge.startSession !== 'function') {
      addLog({
        status: 'error',
        title: 'Bridge unavailable',
        detail: 'Unable to reach the desktop agent. Is Electron running?',
      })
      session.value.status = 'idle'
      session.value.isStarting = false
      return
    }

    try {
      await bridge.startSession({ sessionId: session.value.id, targetUrl })
      session.value.status = 'running'
      session.value.captureStatus = 'Capturing'
      session.value.liveUrl = targetUrl
      addLog({
        status: 'success',
        title: 'Session started',
        detail: `Navigating to ${targetUrl}`,
      })
    } catch (error) {
      addLog({
        status: 'error',
        title: 'Failed to start session',
        detail: error?.message ?? String(error ?? 'Unknown error'),
      })
      session.value.status = 'idle'
    } finally {
      session.value.isStarting = false
    }
  }

  const stopSession = async (logPayloads = []) => {
    if (!session.value) return
    const previousStatus = session.value.status
    session.value.status = 'idle'
    session.value.isStarting = false
    session.value.frameSrc = ''
    session.value.captureStatus = 'Ready'
    session.value.manualControl = false
    session.value.liveUrl = session.value.targetUrl

    if (bridge && typeof bridge.stopSession === 'function' && isSessionActive(previousStatus)) {
      try {
        await bridge.stopSession({ sessionId: session.value.id })
      } catch (error) {
        addLog({
          status: 'warning',
          title: 'Stop session failed',
          detail: error?.message ?? String(error ?? 'Unknown error'),
        })
      }
    }

    logPayloads.forEach((payload) => addLog(payload))
  }

  const processPrompt = async () => {
    if (!session.value) return false
    const text = session.value.promptValue.trim()
    if (!text) return false
    addLog({
      title: text.slice(0, 48),
      detail: text,
      status: 'info',
    })
    session.value.promptValue = ''
    session.value.routerState = {
      ...session.value.routerState,
      status: 'routing',
    }
    if (!bridge || typeof bridge.planActions !== 'function') {
      addLog({
        status: 'error',
        title: 'Action planner unavailable',
        detail: 'Desktop bridge missing planActions API.',
      })
      session.value.routerState.status = 'error'
      return false
    }
    try {
      const contextFolders = Array.isArray(session.value.contextFolders)
        ? JSON.parse(JSON.stringify(session.value.contextFolders))
        : []
      const decision = await bridge.planActions({
        prompt: text,
        contextFolders,
        llmConfig: JSON.parse(JSON.stringify(llmConfig.value)),
      })
      applyRouterDecision(session.value, decision)
      addLog({
        status: 'success',
        title: 'Action plan ready',
        detail: decision.summary,
      })
      return decision
    } catch (error) {
      session.value.routerState.status = 'error'
      addLog({
        status: 'error',
        title: 'Action planning failed',
        detail: error?.message ?? String(error ?? 'Unknown error'),
      })
      return false
    }
  }

  const refreshActiveLogs = () => {
    if (!session.value || session.value.isSyncing) return
    session.value.isSyncing = true
    setTimeout(() => {
      session.value.isSyncing = false
      session.value.lastSync = new Date().toLocaleTimeString()
    }, 1000)
  }

  const clearSessionData = () => {
    session.value.logs = []
    session.value.promptValue = ''
    session.value.captureStatus = 'Ready'
    session.value.lastSync = '--:--'
    session.value.isSyncing = false
    session.value.status = 'idle'
    session.value.isStarting = false
    session.value.frameSrc = ''
    session.value.manualControl = false
    session.value.targetUrl = DEFAULT_TARGET_URL
    session.value.liveUrl = DEFAULT_TARGET_URL
    session.value.contextFolders = []
    resetRouterState(session.value)
  }

  const resetSession = () => {
    session.value = createSession(createSessionId())
  }

  const setFrameSource = (payload) => {
    // Handle legacy string payloads
    if (typeof payload === 'string') {
      if (!session.value) return
      session.value.frameSrc = payload
      return
    }

    const { sessionId, frameDataUri } = payload ?? {}
    // Accept frame if sessionId matches or not provided
    if (sessionId && sessionId !== session.value?.id) return
    if (!session.value) return
    session.value.frameSrc = typeof frameDataUri === 'string' ? frameDataUri : ''
    if (session.value.frameSrc) {
      session.value.captureStatus = 'Capturing'
    }
  }

  const toggleManualControl = async () => {
    if (!session.value) return
    session.value.manualControl = !session.value.manualControl
  }

  const updateManualUrl = (url) => {
    if (!session.value) return
    if (typeof url === 'string' && url.trim()) {
      session.value.liveUrl = url.trim()
    }
  }

  const handleStatusUpdate = (payload) => {
    const { sessionId, status, captureStatus, log } = payload ?? {}
    // Accept if sessionId matches or not provided
    if (sessionId && sessionId !== session.value?.id) return
    if (!session.value) return
    if (status) session.value.status = typeof status === 'string' ? status.trim().toLowerCase() : status
    if (captureStatus) session.value.captureStatus = captureStatus
    if (log) addLog(log)
  }

  const handleAgentLog = (payload) => {
    const { sessionId, ...logPayload } = payload ?? {}
    // Accept if sessionId matches or not provided
    if (sessionId && sessionId !== session.value?.id) return
    addLog(logPayload)
  }

  const registerBridgeListeners = () => {
    if (!bridge) return
    if (typeof bridge.onFrameUpdate === 'function' && !frameListenerOff) {
      frameListenerOff = bridge.onFrameUpdate((payload) => setFrameSource(payload))
    }
    if (typeof bridge.onStatus === 'function' && !statusListenerOff) {
      statusListenerOff = bridge.onStatus((payload) => handleStatusUpdate(payload))
    }
    if (typeof bridge.onAgentLog === 'function' && !agentLogListenerOff) {
      agentLogListenerOff = bridge.onAgentLog((payload) => handleAgentLog(payload))
    }
  }

  registerBridgeListeners()

  return {
    session,
    activeSession,
    activePromptValue,
    llmConfig,
    updateTargetUrl,
    startSession,
    stopSession,
    processPrompt,
    refreshActiveLogs,
    clearSessionData,
    resetSession,
    setFrameSource,
    toggleManualControl,
    updateManualUrl,
    selectContextFolders,
    removeContextFolder,
    setLLMConfig,
    addLog,
    DEFAULT_TARGET_URL,
  }
})
