<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NConfigProvider,
  NGlobalStyle,
  darkTheme,
  useOsTheme,
} from 'naive-ui'
import SessionTabs from '@/components/layout/SessionTabs.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import UserViewPanel from '@/components/session/UserViewPanel.vue'
import AgentLogsPanel from '@/components/agent/AgentLogsPanel.vue'
import IssueComposer from '@/components/agent/IssueComposer.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { languageOptions } from '@/langs/index.js'

const { t, locale } = useI18n()

const osTheme = useOsTheme()
const themePreference = ref('dark')
const selectedLanguage = ref(languageOptions[0]?.value ?? 'en-us')
const targetUrl = ref('https://app.example.com/Login')
const sessionStatus = ref('idle')
const captureStatus = ref('Ready')
const promptValue = ref('')
const logs = ref([])
const isSyncing = ref(false)
const lastSync = ref('--:--')
const serverTime = ref('--:--:-- UTC')
const tabs = ref([
  { id: 'login', title: 'Login Bug' },
  { id: 'new-user', title: 'New User Flow' },
  { id: 'session-3', title: 'Session 3' },
])
const activeTabId = ref('session-3')
let syncTimer = null
let clockTimer = null

const resolvedTheme = computed(() => {
  if (themePreference.value === 'auto') {
    return osTheme.value === 'dark' ? 'dark' : 'light'
  }
  return themePreference.value
})

const naiveTheme = computed(() => (resolvedTheme.value === 'dark' ? darkTheme : null))

const themeOptions = computed(() => [
  { label: t('ui.nav.themeOptions.dark'), value: 'dark' },
  { label: t('ui.nav.themeOptions.light'), value: 'light' },
  { label: t('ui.nav.themeOptions.auto'), value: 'auto' },
])

const languageSelectOptions = computed(() =>
  languageOptions.map((option) => ({ label: option.label, value: option.value })),
)

const naiveUILocale = computed(() => {
  const match = languageOptions.find((option) => option.value === selectedLanguage.value)
  return match?.naiveLocale
})

const naiveUIDateLocale = computed(() => {
  const match = languageOptions.find((option) => option.value === selectedLanguage.value)
  return match?.naiveDateLocale
})

const agentStatusLabel = computed(() =>
  sessionStatus.value === 'idle' ? t('ui.nav.statusIdle') : t('ui.nav.statusRunning'),
)

watch(selectedLanguage, (value) => {
  locale.value = value
})

const updateTargetUrl = (value) => {
  targetUrl.value = value
}

const updateTheme = (value) => {
  themePreference.value = value
}

const updateLanguage = (value) => {
  selectedLanguage.value = value
}

const handleTabSelect = (tabId) => {
  activeTabId.value = tabId
}

const handleAddTab = () => {
  const index = tabs.value.length + 1
  const id = `session-${index}`
  tabs.value.push({ id, title: `Session ${index}` })
  activeTabId.value = id
}

const updateServerTime = () => {
  const now = new Date()
  serverTime.value = `${now.toUTCString().slice(17, 25)} UTC`
}

const addLog = (payload) => {
  logs.value.push({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    timestamp: new Date().toLocaleTimeString(),
    status: payload.status ?? 'info',
    title: payload.title,
    detail: payload.detail,
  })
  lastSync.value = new Date().toLocaleTimeString()
}

const handleStartSession = () => {
  sessionStatus.value = 'running'
  addLog({
    title: t('ui.events.sessionRequested'),
    detail: targetUrl.value || t('ui.view.waitingDescription'),
    status: 'success',
  })
  addLog({
    title: t('ui.events.sessionReady'),
    detail: t('ui.events.awaitingInput'),
    status: 'warning',
  })
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    sessionStatus.value = 'idle'
  }, 4000)
}

const handlePromptSend = () => {
  if (!promptValue.value.trim()) return
  addLog({
    title: promptValue.value.slice(0, 32),
    detail: promptValue.value,
    status: 'info',
  })
  promptValue.value = ''
}

const refreshLogs = () => {
  if (isSyncing.value) return
  isSyncing.value = true
  setTimeout(() => {
    isSyncing.value = false
    lastSync.value = new Date().toLocaleTimeString()
  }, 1000)
}

onMounted(() => {
  updateServerTime()
  clockTimer = setInterval(updateServerTime, 1000)
})

onBeforeUnmount(() => {
  if (syncTimer) clearTimeout(syncTimer)
  if (clockTimer) clearInterval(clockTimer)
})
</script>

<template>
  <n-config-provider
    :theme="naiveTheme"
    :locale="naiveUILocale"
    :date-locale="naiveUIDateLocale"
  >
    <n-global-style />
    <div class="app-shell" :data-theme="resolvedTheme">
      <session-tabs
        :tabs="tabs"
        :active="activeTabId"
        @select="handleTabSelect"
        @add="handleAddTab"
      />
      <app-header
        :url="targetUrl"
        :status="sessionStatus"
        :theme="themePreference"
        :language="selectedLanguage"
        :theme-options="themeOptions"
        :language-options="languageSelectOptions"
        @update:url="updateTargetUrl"
        @update:theme="updateTheme"
        @update:language="updateLanguage"
        @start="handleStartSession"
      />
      <div class="app-body">
        <user-view-panel :stream-ready="true" :has-input="!!promptValue" />
        <aside class="sidebar">
          <agent-logs-panel
            :logs="logs"
            :is-syncing="isSyncing"
            :last-sync="lastSync"
            @refresh="refreshLogs"
          />
          <issue-composer
            v-model="promptValue"
            :placeholder="t('ui.prompts.placeholder')"
            :disclaimer="t('ui.prompts.disclaimer')"
            @send="handlePromptSend"
          />
        </aside>
      </div>
      <app-footer
        :agent-status="agentStatusLabel"
        version="v2.4.0-beta"
        :capture-status="captureStatus"
        :server-time="serverTime"
      />
    </div>
  </n-config-provider>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #03070f;
  color: #f5f8ff;
}

.app-shell[data-theme='light'] {
  background: #f8f9fc;
  color: #0f172a;
}

.app-body {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 1.25rem;
  padding: 1.25rem 1.5rem 1.5rem;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (max-width: 1200px) {
  .app-body {
    grid-template-columns: 1fr;
  }
}
</style>
