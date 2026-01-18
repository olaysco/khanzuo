<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useOsTheme, NConfigProvider, darkTheme, lightTheme } from 'naive-ui'
import { storeToRefs } from 'pinia'
import AppHeader from '@/components/layout/header/AppHeader.vue'
import UserViewPanel from '@/components/panels/session/UserViewPanel.vue'
import SettingsDialog from '@/pages/SettingsDialog.vue'
import { useSessionStore, DEFAULT_TARGET_URL } from '@/stores/sessionStore.js'

const osTheme = useOsTheme()
const sessionStore = useSessionStore()
const { session, activeSession, activePromptValue, llmConfig } = storeToRefs(sessionStore)

const themePreference = ref('dark')
const showSettings = ref(false)
const serverTime = ref('--:--:-- UTC')
let clockTimer = null

const resolvedTheme = computed(() => {
  if (themePreference.value === 'auto') {
    return osTheme.value === 'dark' ? 'dark' : 'light'
  }
  return themePreference.value
})

const naiveTheme = computed(() => resolvedTheme.value === 'dark' ? darkTheme : lightTheme)

const displayUrl = computed(() => activeSession.value?.targetUrl?.trim() || DEFAULT_TARGET_URL)
const currentSessionStatus = computed(() => activeSession.value?.status ?? 'idle')
const isSessionActive = computed(() => currentSessionStatus.value !== 'idle')
const formattedLogs = computed(() => activeSession.value?.logs ?? [])
const isStopDisabled = computed(() => !isSessionActive.value)
const contextFolders = computed(() => activeSession.value?.contextFolders ?? [])
const routerState = computed(() => activeSession.value?.routerState ?? {})
const routerPlan = computed(() => routerState.value?.plan ?? [])
const routerIntentLabel = computed(() => routerState.value?.status ?? 'idle')

watch(
  resolvedTheme,
  (value) => {
    if (typeof document !== 'undefined') {
      document.body.dataset.theme = value
      document.documentElement.classList.toggle('dark', value === 'dark')
    }
  },
  { immediate: true },
)

const updateServerTime = () => {
  serverTime.value = `${new Date().toUTCString().slice(17, 25)} UTC`
}

const handleStartSession = () => {
  sessionStore.startSession()
}

const handleStopSession = () => {
  if (isStopDisabled.value) return
  sessionStore.stopSession([
    {
      title: 'Session Stopped',
      detail: 'Browser session has been terminated.',
      status: 'error',
    },
  ])
}

const handlePromptSend = async () => {
  await sessionStore.processPrompt()
}

const handleManualToggle = () => {
  sessionStore.toggleManualControl()
}

const handleManualUrlChange = (url) => {
  sessionStore.updateManualUrl(url)
}

const handleAddContextFolders = () => {
  sessionStore.selectContextFolders()
}

const handleRemoveContextFolder = (folderId) => {
  sessionStore.removeContextFolder(folderId)
}

const openSettings = () => (showSettings.value = true)
const closeSettings = () => (showSettings.value = false)
const handleSettingsSave = (settings) => {
  themePreference.value = settings.theme
  sessionStore.setLLMConfig(settings.llmConfig)
  closeSettings()
}

const updateTargetUrl = (value) => {
  const nextValue = typeof value === 'string' ? value : value?.target?.value || ''
  sessionStore.updateTargetUrl(nextValue)
}

onMounted(() => {
  updateServerTime()
  clockTimer = setInterval(updateServerTime, 1000)
})

onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer)
})
</script>

<template>
  <n-config-provider :theme="naiveTheme" :class="'h-full'">
  <div class="flex flex-col h-full text-slate-900 dark:text-white" :class="resolvedTheme === 'dark' ? 'bg-[#0d1219]' : 'bg-gray-100'">
    <AppHeader
      :status="currentSessionStatus"
      :is-starting="activeSession?.isStarting ?? false"
      :theme="resolvedTheme"
      @stop="handleStopSession"
      @open-settings="openSettings"
    />

    <div class="flex-none border-b px-6 py-2 flex items-center gap-4" :class="resolvedTheme === 'dark' ? 'bg-[#161e2a] border-[#233348]' : 'bg-white border-gray-200'">
      <div class="flex gap-2" :class="resolvedTheme === 'dark' ? 'text-[#92a9c9]' : 'text-gray-500'">
        <button class="p-1 hover:text-current transition-colors"><span class="material-symbols-outlined text-[20px]">arrow_back</span></button>
        <button class="p-1 hover:text-current transition-colors"><span class="material-symbols-outlined text-[20px]">arrow_forward</span></button>
      </div>
      <div class="flex-1 max-w-3xl flex items-center gap-2">
        <div class="flex w-full items-center rounded-md border h-9 px-3 gap-2" :class="resolvedTheme === 'dark' ? 'bg-[#0d1219] border-[#233348]' : 'bg-gray-50 border-gray-300'">
          <span class="material-symbols-outlined text-[16px]" :class="resolvedTheme === 'dark' ? 'text-[#92a9c9]' : 'text-gray-400'">lock</span>
          <input
            class="w-full bg-transparent border-none p-0 text-sm focus:ring-0 font-mono"
            :class="resolvedTheme === 'dark' ? 'text-white placeholder-[#586c85]' : 'text-gray-900 placeholder-gray-400'"
            :value="displayUrl"
            @input="updateTargetUrl"
            placeholder="Enter URL to debug..."
          />
          <div class="flex gap-2" :class="resolvedTheme === 'dark' ? 'text-[#92a9c9]' : 'text-gray-500'">
            <button class="hover:text-current"><span class="material-symbols-outlined text-[18px]">star_border</span></button>
            <button class="hover:text-current"><span class="material-symbols-outlined text-[18px]">ios_share</span></button>
          </div>
        </div>
        <button class="flex items-center justify-center h-9 w-9 rounded-md border transition-colors" :class="resolvedTheme === 'dark' ? 'border-[#233348] bg-[#0d1219] text-[#92a9c9] hover:text-white hover:bg-[#233348]' : 'border-gray-300 bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-100'" @click="handleStartSession">
          <span class="material-symbols-outlined text-[20px]">keyboard_return</span>
        </button>
      </div>
      <div class="ml-auto text-xs font-mono" :class="resolvedTheme === 'dark' ? 'text-[#586c85]' : 'text-gray-400'">Session: <span :class="resolvedTheme === 'dark' ? 'text-[#92a9c9]' : 'text-gray-600'">{{ activeSession?.id?.slice(0, 8) }}</span></div>
    </div>

    <main class="flex-1 flex overflow-hidden">
      <section class="flex-1 flex flex-col relative min-w-0 p-6 overflow-hidden" :class="resolvedTheme === 'dark' ? 'bg-[#0d1219]' : 'bg-gray-100'">
        <div class="absolute top-8 left-8 z-10">
          <div class="backdrop-blur text-xs font-bold px-3 py-1.5 rounded-full shadow-xl flex items-center gap-2" :class="resolvedTheme === 'dark' ? 'bg-black/80 text-white border border-white/10' : 'bg-white/90 text-gray-800 border border-gray-200'">
            <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            User View (Live)
          </div>
        </div>
        <div class="flex-1 rounded-xl shadow-2xl overflow-hidden flex flex-col relative" :class="resolvedTheme === 'dark' ? 'bg-white border border-[#334155]' : 'bg-white border border-gray-300'">
          <user-view-panel
            class="flex-1"
            :stream-ready="Boolean(session?.targetUrl?.trim())"
            :frame-src="session?.frameSrc"
            :has-input="Boolean(session?.promptValue)"
            :target-url="session?.targetUrl?.trim() || DEFAULT_TARGET_URL"
            :manual-url="session?.liveUrl?.trim() || session?.targetUrl?.trim() || DEFAULT_TARGET_URL"
            :session-id="session?.id"
            :manual-control="session?.manualControl ?? false"
            @toggle-control="handleManualToggle"
            @update:manual-url="handleManualUrlChange"
          />
        </div>
      </section>
      <aside class="w-[400px] flex-none border-l flex flex-col" :class="resolvedTheme === 'dark' ? 'border-[#233348] bg-[#111822]' : 'border-gray-200 bg-white'">
        <div class="border-b p-4 space-y-3" :class="resolvedTheme === 'dark' ? 'border-[#233348] bg-[#161e2a]' : 'border-gray-200 bg-gray-50'">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold flex items-center gap-2" :class="resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'">
              <span class="material-symbols-outlined text-primary text-[20px]">task</span>
              Execution Plan
            </h3>
            <span class="text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-full border" :class="resolvedTheme === 'dark' ? 'border-[#233348] text-[#92a9c9]' : 'border-gray-300 text-gray-500'">
              {{ routerIntentLabel }}
            </span>
          </div>
          <p v-if="routerState?.summary" class="text-[11px]" :class="resolvedTheme === 'dark' ? 'text-[#92a9c9]' : 'text-gray-500'">
            {{ routerState.summary }}
          </p>
          <div v-if="!routerPlan.length" class="text-sm" :class="resolvedTheme === 'dark' ? 'text-[#92a9c9]' : 'text-gray-500'">
            No plan yet. Describe the task and Khanzuo will draft reproducible steps.
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="(step, index) in routerPlan"
              :key="step.id"
              class="flex items-start gap-3"
            >
              <div
                class="w-6 h-6 rounded-full flex items-center justify-center border"
                :class="step.status === 'completed' ? 'border-primary bg-primary text-white' : (resolvedTheme === 'dark' ? 'border-[#334155] text-[#92a9c9]' : 'border-gray-300 text-gray-400')"
              >
                <span class="material-symbols-outlined text-[16px]">
                  {{ step.status === 'completed' ? 'check' : 'radio_button_unchecked' }}
                </span>
              </div>
              <div class="flex-1">
                <p class="text-sm font-semibold" :class="resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'">
                  {{ index + 1 }}. {{ step.title }}
                </p>
                <p class="text-xs mt-1" :class="resolvedTheme === 'dark' ? 'text-[#92a9c9]' : 'text-gray-500'">{{ step.detail }}</p>
              </div>
            </div>
          </div>
          <button
            class="w-full mt-2 text-xs font-semibold uppercase tracking-wide rounded-md border py-1.5 opacity-50 cursor-not-allowed"
            :class="resolvedTheme === 'dark' ? 'border-[#233348] text-[#92a9c9]' : 'border-gray-300 text-gray-400'"
            disabled
          >
            Confirm plan
          </button>
        </div>
        <div class="border-b p-4 space-y-3" :class="resolvedTheme === 'dark' ? 'border-[#233348]' : 'border-gray-200'">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold flex items-center gap-2" :class="resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'">
              <span class="material-symbols-outlined text-primary text-[20px]">folder_copy</span>
              Attached Context
            </h3>
            <button
              class="flex items-center gap-1 text-xs border rounded px-2 py-1"
              :class="resolvedTheme === 'dark' ? 'text-[#92a9c9] border-[#233348] hover:text-white hover:border-white' : 'text-gray-500 border-gray-300 hover:text-gray-900 hover:border-gray-500'"
              @click="handleAddContextFolders"
            >
              <span class="material-symbols-outlined text-[16px]">add</span>
              Add
            </button>
          </div>
          <div v-if="!contextFolders.length" class="text-sm" :class="resolvedTheme === 'dark' ? 'text-[#92a9c9]' : 'text-gray-500'">
            No folders attached. Add your app's source folder so Khanzuo can reason over it.
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="folder in contextFolders"
              :key="folder.id"
              class="border rounded-lg p-3 flex items-start gap-3"
              :class="resolvedTheme === 'dark' ? 'border-[#233348]' : 'border-gray-200'"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold truncate" :class="resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'">{{ folder.name }}</p>
                <p class="text-xs mt-1 break-all" :class="resolvedTheme === 'dark' ? 'text-[#92a9c9]' : 'text-gray-500'">{{ folder.path }}</p>
                <p class="text-[11px] mt-1" :class="resolvedTheme === 'dark' ? 'text-[#586c85]' : 'text-gray-400'">
                  {{ folder.summary }}
                </p>
                <p class="text-[#3b82f6] text-[10px] mt-1">
                  dirs: {{ folder.stats?.directories ?? 0 }}, files: {{ folder.stats?.files ?? 0 }}
                </p>
              </div>
              <button
                class="hover:text-red-400"
                :class="resolvedTheme === 'dark' ? 'text-[#92a9c9]' : 'text-gray-400'"
                @click="handleRemoveContextFolder(folder.id)"
              >
                <span class="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>
        </div>
        <div class="h-12 border-b flex items-center px-4 justify-between" :class="resolvedTheme === 'dark' ? 'border-[#233348] bg-[#161e2a]' : 'border-gray-200 bg-gray-50'">
          <h3 class="text-sm font-bold flex items-center gap-2" :class="resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'">
            <span class="material-symbols-outlined text-primary text-[20px]">smart_toy</span>
            AI Investigation Log
          </h3>
          <div class="flex gap-2" :class="resolvedTheme === 'dark' ? 'text-[#92a9c9]' : 'text-gray-500'">
            <button class="p-1 rounded" :class="resolvedTheme === 'dark' ? 'hover:text-white hover:bg-[#233348]' : 'hover:text-gray-900 hover:bg-gray-200'"><span class="material-symbols-outlined text-[18px]">download</span></button>
            <button class="p-1 rounded" :class="resolvedTheme === 'dark' ? 'hover:text-white hover:bg-[#233348]' : 'hover:text-gray-900 hover:bg-gray-200'"><span class="material-symbols-outlined text-[18px]">keyboard_double_arrow_right</span></button>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          <div v-if="!formattedLogs.length" class="text-sm text-center py-8" :class="resolvedTheme === 'dark' ? 'text-[#92a9c9]' : 'text-gray-500'">
            Agent actions and observations will appear here.
          </div>
          <div v-for="log in formattedLogs" :key="log.id" class="flex gap-3">
            <div class="flex flex-col items-center pt-1 text-primary">
              <span class="material-symbols-outlined text-[16px]">radio_button_checked</span>
              <div class="w-px flex-1" :class="resolvedTheme === 'dark' ? 'bg-[#233348]' : 'bg-gray-200'" />
            </div>
            <div class="flex-1 pb-4 border-b" :class="resolvedTheme === 'dark' ? 'border-[#233348]' : 'border-gray-200'">
              <p class="text-sm font-semibold" :class="resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'">{{ log.title }}</p>
              <p class="text-xs mt-1" :class="resolvedTheme === 'dark' ? 'text-[#92a9c9]' : 'text-gray-500'">{{ log.detail }}</p>
              <span class="text-[10px] font-mono" :class="resolvedTheme === 'dark' ? 'text-[#586c85]' : 'text-gray-400'">{{ log.timestamp }}</span>
            </div>
          </div>
        </div>
        <div class="p-4 border-t" :class="resolvedTheme === 'dark' ? 'bg-[#161e2a] border-[#233348]' : 'bg-gray-50 border-gray-200'">
          <div class="relative">
            <textarea
              class="w-full border rounded-lg p-3 pr-12 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none h-24"
              :class="resolvedTheme === 'dark' ? 'bg-[#0d1219] border-[#233348] text-white placeholder-[#586c85]' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'"
              :value="activePromptValue"
              @input="activePromptValue = $event.target.value"
              placeholder="Instruct the AI agent to reproduce a bug..."
            />
            <div class="absolute bottom-2 right-2 flex gap-1">
              <button class="p-1.5 rounded" :class="resolvedTheme === 'dark' ? 'hover:bg-[#233348] text-[#92a9c9]' : 'hover:bg-gray-200 text-gray-500'"><span class="material-symbols-outlined text-[18px]">add_a_photo</span></button>
              <button class="flex items-center justify-center bg-primary hover:bg-blue-600 text-white p-1.5 rounded-md shadow-lg" @click="handlePromptSend">
                <span class="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>
          </div>
          <div class="flex gap-2 mt-2 overflow-x-auto pb-1 text-[11px]" :class="resolvedTheme === 'dark' ? 'text-[#92a9c9]' : 'text-gray-500'">
            <button class="px-2 py-1 rounded" :class="resolvedTheme === 'dark' ? 'bg-[#233348] hover:bg-[#324867]' : 'bg-gray-200 hover:bg-gray-300'">Check Console Errors</button>
            <button class="px-2 py-1 rounded" :class="resolvedTheme === 'dark' ? 'bg-[#233348] hover:bg-[#324867]' : 'bg-gray-200 hover:bg-gray-300'">Verify Login</button>
            <button class="px-2 py-1 rounded" :class="resolvedTheme === 'dark' ? 'bg-[#233348] hover:bg-[#324867]' : 'bg-gray-200 hover:bg-gray-300'">Take Screenshot</button>
          </div>
        </div>
      </aside>
    </main>
    <footer class="flex-none h-8 border-t flex items-center px-4 justify-between text-xs font-mono" :class="resolvedTheme === 'dark' ? 'bg-[#0d1219] border-[#233348] text-[#586c85]' : 'bg-white border-gray-200 text-gray-400'">
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-2" :class="resolvedTheme === 'dark' ? 'text-white' : 'text-gray-700'">
          <span class="w-2 h-2 rounded-full bg-green-500"></span>
          <span>Agent Status: {{ activeSession?.status ?? 'idle' }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-[14px]">timer</span>
          <span>00:02:45</span>
        </div>
        <div class="hidden md:flex items-center gap-2">
          <span class="material-symbols-outlined text-[14px]">network_check</span>
          <span>45ms latency</span>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <span>v0.0.1-beta</span>
        <span :class="resolvedTheme === 'dark' ? 'text-[#92a9c9]' : 'text-gray-500'">Last update: {{ serverTime }}</span>
      </div>
    </footer>
    <settings-dialog
      v-if="showSettings"
      :theme="themePreference"
      :llm-config="llmConfig"
      @close="closeSettings"
      @cancel="closeSettings"
      @save="handleSettingsSave"
      @clear-data="sessionStore.clearSessionData"
    />
  </div>
  </n-config-provider>
</template>

<style scoped>
textarea {
  font-family: 'Inter', sans-serif;
}
</style>
