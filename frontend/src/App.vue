<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NConfigProvider,
  NGlobalStyle,
  darkTheme,
  useOsTheme,
} from 'naive-ui'
import SessionTabs from '@/components/layout/navigation/SessionTabs.vue'
import AppHeader from '@/components/layout/header/AppHeader.vue'
import UserViewPanel from '@/components/panels/session/UserViewPanel.vue'
import AgentLogsPanel from '@/components/panels/agent/AgentLogsPanel.vue'
import IssueComposer from '@/components/panels/agent/IssueComposer.vue'
import AppFooter from '@/components/layout/footer/AppFooter.vue'
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

watch(
  resolvedTheme,
  (value) => {
    if (typeof document !== 'undefined') {
      document.body.dataset.theme = value
    }
  },
  { immediate: true },
)

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
  --khz-surface: #03070f;
  --khz-surface-elevated: #070c14;
  --khz-panel: #0c1422;
  --khz-card: #0b1220;
  --khz-border: rgba(255, 255, 255, 0.05);
  --khz-border-soft: rgba(255, 255, 255, 0.04);
  --khz-text: #f5f8ff;
  --khz-text-muted: rgba(255, 255, 255, 0.72);
  --khz-chip-bg: rgba(7, 11, 19, 0.95);
  --khz-chip-border: rgba(255, 255, 255, 0.08);
  --khz-pill-bg: rgba(255, 255, 255, 0.08);
  --khz-divider: rgba(255, 255, 255, 0.12);
  --khz-icon: rgba(255, 255, 255, 0.78);
  --khz-icon-soft: rgba(255, 255, 255, 0.45);
  --khz-input-bg: #040914;
  --khz-input-border: rgba(255, 255, 255, 0.55);

  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--khz-surface);
  color: var(--khz-text);
}

.app-shell[data-theme='light'] {
  --khz-surface: #f8f9fc;
  --khz-surface-elevated: #ffffff;
  --khz-panel: #ffffff;
  --khz-card: #ffffff;
  --khz-border: rgba(15, 23, 42, 0.12);
  --khz-border-soft: rgba(15, 23, 42, 0.05);
  --khz-text: #0f172a;
  --khz-text-muted: rgba(15, 23, 42, 0.65);
  --khz-chip-bg: rgba(248, 250, 255, 0.95);
  --khz-chip-border: rgba(15, 23, 42, 0.08);
  --khz-pill-bg: rgba(15, 23, 42, 0.08);
  --khz-divider: rgba(15, 23, 42, 0.12);
  --khz-icon: rgba(51, 65, 85, 0.9);
  --khz-icon-soft: rgba(99, 115, 139, 0.85);
  --khz-input-bg: #eef2ff;
  --khz-input-border: rgba(99, 102, 241, 0.35);
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
