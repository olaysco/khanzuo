import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const DEFAULT_TARGET_URL = 'https://openprovider.eu'

const createSession = (id, title) => ({
  id,
  title,
  targetUrl: DEFAULT_TARGET_URL,
  status: 'idle',
  isStarting: false,
  frameSrc: '',
  captureStatus: 'Ready',
  promptValue: '',
  logs: [],
  isSyncing: false,
  lastSync: '--:--',
})

export const useSessionStore = defineStore('session', () => {
  const tabs = ref([
    createSession('session-3', 'Session 3'),
  ])
  const activeTabId = ref('session-3')

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
    const session = createSession(`session-${index}`, title ?? `Session ${index}`)
    tabs.value.push(session)
    activeTabId.value = session.id
    return session
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
    if (!session || session.isStarting || session.status === 'running') return
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
    //start session
  }

  const stopSession = (logPayloads = []) => {
    const session = activeSession.value
    if (!session) return
    session.status = 'idle'
    session.isStarting = false
    session.frameSrc = ''
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
  }

  return {
    tabs,
    activeTabId,
    activeSession,
    activePromptValue,
    setActiveTab,
    addTab,
    renameTab,
    updateTargetUrl,
    startSession,
    stopSession,
    submitPromptLog,
    refreshActiveLogs,
    clearSessionData,
    setFrameSource,
    DEFAULT_TARGET_URL,
  }
})
