import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const DEFAULT_TARGET_URL = 'https://openprovider.eu'

const createSession = (id, title) => ({
  id,
  title,
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
})

const getBridge = () => (typeof window !== 'undefined' ? window.khanzuo ?? null : null)
const createSessionId = () => (crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}-${Math.random()}`)
const isSessionActive = (status) => Boolean(status) && status !== 'idle'


export const useSessionStore = defineStore('session', () => {
  const tabs = ref([
    createSession(createSessionId(), 'Session 1'),
  ])
  const activeTabId = ref(tabs.value[0].id)
  const bridge = getBridge()
  let frameListenerOff = null
  let statusListenerOff = null
  let agentLogListenerOff = null

  const activeSession = computed(() =>
    tabs.value.find((tab) => tab.id === activeTabId.value) ?? tabs.value[0],
  )

  const activePromptValue = computed({
    get: () => activeSession.value?.promptValue ?? '',
    set: (value) => {
      if (!activeSession.value) return
      activeSession.value.promptValue = value
    },
  })

  const setActiveTab = (tabId) => {
    activeTabId.value = tabId
  }

  const addTab = (title) => {
    const index = tabs.value.length + 1
    const session = createSession(createSessionId(), title ?? `Session ${index}`)
    tabs.value.push(session)
    activeTabId.value = session.id
    return session
  }

  const removeTab = async (tabId) => {
    if (!tabId || tabs.value.length === 0) return
    const index = tabs.value.findIndex((tab) => tab.id === tabId)
    if (index === -1) return
    const session = tabs.value[index]

    if (bridge && typeof bridge.stopSession === 'function' && isSessionActive(session.status)) {
      try {
        await bridge.stopSession({ sessionId: session.id })
      } catch (error) {
        addLogToSession(session, {
          status: 'warning',
          title: 'Session stop failed',
          detail: error?.message ?? String(error ?? 'Unknown error'),
        })
      }
    }

    if (tabs.value.length === 1) {
      tabs.value[0] = createSession(createSessionId(), 'Session 1')
      activeTabId.value = tabs.value[0].id
      return
    }

    tabs.value.splice(index, 1)
    if (activeTabId.value === tabId) {
      const fallback = tabs.value[index] ?? tabs.value[index - 1] ?? tabs.value[0]
      activeTabId.value = fallback?.id ?? ''
    }
  }

  const renameTab = (tabId, title) => {
    const trimmed = title?.trim()
    if (!trimmed) return
    const session = tabs.value.find((tab) => tab.id === tabId)
    if (session) session.title = trimmed
  }

const updateTargetUrl = (value) => {
  if (!activeSession.value) return
  activeSession.value.targetUrl = value
  if (!activeSession.value.manualControl) {
    activeSession.value.liveUrl = value
  }
}

  const addLogToSession = (session, payload) => {
    if (!session) return
    session.logs.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString(),
      status: payload.status ?? 'info',
      title: payload.title,
      detail: payload.detail,
    })
    session.lastSync = new Date().toLocaleTimeString()
  }

  const startSession = async () => {
    const session = activeSession.value
    if (!session || session.isStarting || isSessionActive(session.status)) return
    session.status = 'starting'
    session.isStarting = true
    session.frameSrc = ''
    // session.id = await CreateSessionID();
    const targetUrl = session.targetUrl?.trim()
    if (!targetUrl) {
      addLogToSession(session, {
        status: 'error',
        title: 'Missing target URL',
        detail: 'Please provide a URL before starting a session.',
      })
      session.status = 'idle'
      session.isStarting = false
      return
    }
    if (!bridge || typeof bridge.startSession !== 'function') {
      addLogToSession(session, {
        status: 'error',
        title: 'Bridge unavailable',
        detail: 'Unable to reach the desktop agent. Is Electron running?',
      })
      session.status = 'idle'
      session.isStarting = false
      return
    }

    try {
      await bridge.startSession({ sessionId: session.id, targetUrl })
      session.status = 'running'
      session.captureStatus = 'Capturing'
      session.liveUrl = targetUrl
      addLogToSession(session, {
        status: 'success',
        title: 'Session started',
        detail: `Navigating to ${targetUrl}`,
      })
    } catch (error) {
      addLogToSession(session, {
        status: 'error',
        title: 'Failed to start session',
        detail: error?.message ?? String(error ?? 'Unknown error'),
      })
      session.status = 'idle'
    } finally {
      session.isStarting = false
    }
  }

  const stopSession = async (logPayloads = []) => {
    const session = activeSession.value
    if (!session) return
    const previousStatus = session.status
    session.status = 'idle'
    session.isStarting = false
    session.frameSrc = ''
    session.captureStatus = 'Ready'
    session.manualControl = false
    session.liveUrl = session.targetUrl

    if (bridge && typeof bridge.stopSession === 'function' && isSessionActive(previousStatus)) {
      try {
        await bridge.stopSession({ sessionId: session.id })
      } catch (error) {
        addLogToSession(session, {
          status: 'warning',
          title: 'Stop session failed',
          detail: error?.message ?? String(error ?? 'Unknown error'),
        })
      }
    }

    logPayloads.forEach((payload) => addLogToSession(session, payload))
  }

  const submitPromptLog = () => {
    const session = activeSession.value
    if (!session) return false
    const text = session.promptValue.trim()
    if (!text) return false
    addLogToSession(session, {
      title: text.slice(0, 32),
      detail: text,
      status: 'info',
    })
    session.promptValue = ''
    return true
  }

  const refreshActiveLogs = () => {
    const session = activeSession.value
    if (!session || session.isSyncing) return
    session.isSyncing = true
    setTimeout(() => {
      session.isSyncing = false
      session.lastSync = new Date().toLocaleTimeString()
    }, 1000)
  }

  const clearSessionData = () => {
    tabs.value.forEach((session) => {
      session.logs = []
      session.promptValue = ''
      session.captureStatus = 'Ready'
      session.lastSync = '--:--'
      session.isSyncing = false
      session.status = 'idle'
      session.isStarting = false
      session.frameSrc = ''
      session.manualControl = false
      session.targetUrl = DEFAULT_TARGET_URL
      session.liveUrl = DEFAULT_TARGET_URL
    })
  }

  const setFrameSource = (payload) => {
    // Handle legacy string payloads so we don't break dev sessions
    if (typeof payload === 'string') {
      const session = activeSession.value
      if (!session) return
      session.frameSrc = payload
      return
    }

    const { sessionId, frameDataUri } = payload ?? {}
    if (!sessionId) return
    const session = tabs.value.find((tab) => tab.id === sessionId)
    if (!session) return
    session.frameSrc = typeof frameDataUri === 'string' ? frameDataUri : ''
    if (session.frameSrc) {
      session.captureStatus = 'Capturing'
    }
  }

const findSession = (sessionId) => {
  if (!sessionId) return activeSession.value
  return tabs.value.find((tab) => tab.id === sessionId)
}

const toggleManualControl = async (sessionId) => {
  const session = findSession(sessionId)
  if (!session) return
  session.manualControl = !session.manualControl
}

const updateManualUrl = (sessionId, url) => {
  const target = findSession(sessionId)
  if (!target) return
  if (typeof url === 'string' && url.trim()) {
    target.liveUrl = url.trim()
  }
}

  const handleStatusUpdate = (payload) => {
    const { sessionId, status, captureStatus, log } = payload ?? {}
    if (!sessionId) return
    const session = tabs.value.find((tab) => tab.id === sessionId)
    if (!session) return
    if (status) session.status = typeof status === 'string' ? status.trim().toLowerCase() : status
    if (captureStatus) session.captureStatus = captureStatus
    if (log) addLogToSession(session, log)
  }

  const handleAgentLog = (payload) => {
    const { sessionId, ...logPayload } = payload ?? {}
    if (!sessionId) return
    const session = tabs.value.find((tab) => tab.id === sessionId)
    if (!session) return
    addLogToSession(session, logPayload)
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
    tabs,
    activeTabId,
    activeSession,
    activePromptValue,
    setActiveTab,
    addTab,
    renameTab,
    removeTab,
    updateTargetUrl,
    startSession,
    stopSession,
    submitPromptLog,
    refreshActiveLogs,
    clearSessionData,
    setFrameSource,
    toggleManualControl,
    updateManualUrl,
    DEFAULT_TARGET_URL,
  }
})
