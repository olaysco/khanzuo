<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  status: {
    type: String,
    default: 'idle',
  },
  tabs: {
    type: Array,
    default: () => [],
  },
  activeTabId: {
    type: String,
    default: '',
  },
  isStarting: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['stop', 'select-tab', 'add-tab', 'open-settings'])
const { t } = useI18n()

const isRunning = computed(() => props.status !== 'idle')
const statusLabel = computed(() =>
  isRunning.value ? t('ui.nav.statusRunning') : t('ui.nav.statusIdle'),
)

const sessionTabs = computed(() => props.tabs ?? [])
const activeTabId = computed(() => props.activeTabId ?? '')
const isStopDisabled = computed(() => !isRunning.value || props.isStarting)

const handleTabSelect = (tabId) => {
  emit('select-tab', tabId)
}

const handleAddTab = () => {
  emit('add-tab')
}

const handleStopSession = () => {
  if (isStopDisabled.value) return
  emit('stop')
}

const openSettings = () => {
  emit('open-settings')
}
</script>

<template>
  <header class="flex-none flex items-center justify-between whitespace-nowrap border-b border-[#233348] px-6 py-3 bg-[#111822]">
      <div class="flex items-center gap-8">
        <div class="flex items-center gap-3 text-white">
          <div class="size-8 flex items-center justify-center bg-primary/20 rounded-lg text-primary">
            <span class="material-symbols-outlined">bug_report</span>
          </div>
          <div>
            <h2 class="text-white text-lg font-bold leading-tight tracking-tight">{{ t('ui.brand') }}</h2>
            <p class="text-xs text-white/60">{{ t('ui.brandSubtitle') }}</p>
          </div>
        </div>
        <nav class="flex items-center gap-1 bg-[#1a2636] p-1 rounded-lg">
          <button
            v-for="tab in sessionTabs"
            :key="tab.id"
            class="text-sm font-medium leading-normal px-3 py-1.5 rounded-md transition-colors"
            :class="tab.id === activeTabId ? 'bg-[#233348] text-white shadow-sm flex items-center gap-2' : 'text-[#92a9c9] hover:text-white'"
            @click="handleTabSelect(tab.id)"
          >
            <span v-if="tab.id === activeTabId" class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            {{ tab.title }}
          </button>
          <button class="text-[#92a9c9] hover:text-white text-sm font-medium px-3 py-1.5" @click="handleAddTab">
            New Session (+)
          </button>
        </nav>
      </div>
      <div class="flex items-center gap-4">
        <div class="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full" :class="{ 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400': !isRunning }">
          <span class="material-symbols-outlined text-green-500 text-[16px] filled" :class="{ 'text-yellow-400': !isRunning }">bolt</span>
          <span class="text-green-500 text-xs font-bold uppercase tracking-wider" :class="{ 'text-yellow-400': !isRunning }">{{ statusLabel }}</span>
        </div>
        <div class="flex gap-3">
          <button
            class="flex items-center justify-center gap-2 px-4 h-9 bg-red-600 text-white text-sm font-bold rounded-lg transition-colors"
            :class="{ 'hover:bg-red-700': !isStopDisabled, 'opacity-50 cursor-not-allowed': isStopDisabled }"
            :disabled="isStopDisabled"
            @click="handleStopSession"
          >
            <span class="material-symbols-outlined text-[18px]">stop_circle</span>
            <span>Stop Session</span>
          </button>
          <button class="flex items-center justify-center h-9 w-9 bg-[#233348] hover:bg-[#324867] text-white rounded-lg" @click="openSettings">
            <span class="material-symbols-outlined text-[20px]">settings</span>
          </button>
        </div>
      </div>
    </header>
</template>
