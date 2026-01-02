import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const DEFAULT_TARGET_URL = 'https://app.example.com/Login'

const createSession = (id, title) => ({
  id,
  title,
  targetUrl: DEFAULT_TARGET_URL,
  status: 'idle',
  captureStatus: 'Ready',
  promptValue: '',
  logs: [],
  isSyncing: false,
  lastSync: '--:--',
})

export const useSessionStore = defineStore('session', () => {
  const tabs = ref([
    createSession('login', 'Login Bug'),
    createSession('new-user', 'New User Flow'),
    createSession('session-3', 'Session 3'),
  ])
  const activeTabId = ref('session-3')
  const sessionStatusTimers = new Map()

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

  const clearSessionTimer = (session) => {
    if (!session) return
    const timer = sessionStatusTimers.get(session.id)
    if (timer) {
      clearTimeout(timer)
      sessionStatusTimers.delete(session.id)
    }
  }

  const startSession = (logPayloads = []) => {
    const session = activeSession.value
    if (!session) return
    session.status = 'running'
    logPayloads.forEach((payload) => addLogToSession(session, payload))
    clearSessionTimer(session)
    const timer = setTimeout(() => {
      session.status = 'idle'
      sessionStatusTimers.delete(session.id)
    }, 4000)
    sessionStatusTimers.set(session.id, timer)
  }

  const stopSession = (logPayloads = []) => {
    const session = activeSession.value
    if (!session) return
    session.status = 'idle'
    clearSessionTimer(session)
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
      clearSessionTimer(session)
    })
  }

  const resetAllTimers = () => {
    sessionStatusTimers.forEach((timer) => clearTimeout(timer))
    sessionStatusTimers.clear()
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
    resetAllTimers,
    DEFAULT_TARGET_URL,
  }
})
