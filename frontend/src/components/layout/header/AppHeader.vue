<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NInput, NDropdown, NText, NIcon } from 'naive-ui'
import {
  LinkOutline,
  SunnyOutline,
  GlobeOutline,
  PlayOutline,
  StopCircleOutline,
} from '@vicons/ionicons5'

const props = defineProps({
  url: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    default: 'idle',
  },
  theme: {
    type: String,
    default: 'dark',
  },
  language: {
    type: String,
    default: 'en-us',
  },
  themeOptions: {
    type: Array,
    default: () => [],
  },
  languageOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:url', 'start', 'stop', 'update:theme', 'update:language'])
const { t } = useI18n()

const statusLabel = computed(() =>
  props.status === 'idle' ? t('ui.nav.statusIdle') : t('ui.nav.statusRunning'),
)

const isRunning = computed(() => props.status !== 'idle')
const primaryButtonLabel = computed(() =>
  isRunning.value ? t('ui.nav.stop') : t('ui.nav.start'),
)
const primaryButtonType = computed(() => (isRunning.value ? 'error' : 'primary'))
const primaryButtonIcon = computed(() => (isRunning.value ? StopCircleOutline : PlayOutline))

const themeDropdown = computed(() =>
  props.themeOptions.map((option) => ({ label: option.label, key: option.value })),
)

const languageDropdown = computed(() =>
  props.languageOptions.map((option) => ({ label: option.label, key: option.value })),
)

const handleThemeChange = (value) => {
  emit('update:theme', value)
}

const handleLanguageChange = (value) => {
  emit('update:language', value)
}

const handleUrlUpdate = (value) => {
  emit('update:url', value)
}

const handlePrimaryAction = () => {
  emit(isRunning.value ? 'stop' : 'start')
}
</script>

<template>
  <header class="app-header">
    <div class="brand">
      <div class="brand-icon" />
      <div>
        <n-text strong>{{ t('ui.brand') }}</n-text>
        <n-text depth="3" class="brand-sub">{{ t('ui.brandSubtitle') }}</n-text>
      </div>
    </div>
    <div class="header-input">
      <n-input
        size="large"
        round
        :value="props.url"
        :placeholder="t('ui.nav.urlPlaceholder')"
        @update:value="handleUrlUpdate"
      >
        <template #prefix>
          <n-icon size="18" class="prefix-icon">
            <LinkOutline />
          </n-icon>
        </template>
      </n-input>
    </div>
    <div class="header-controls">
      <div class="actions">
        <n-dropdown :options="themeDropdown" trigger="click" @select="handleThemeChange">
          <n-button quaternary circle class="ghost-control">
            <template #icon>
              <n-icon>
                <SunnyOutline />
              </n-icon>
            </template>
          </n-button>
        </n-dropdown>
        <n-dropdown :options="languageDropdown" trigger="click" @select="handleLanguageChange">
          <n-button quaternary circle class="ghost-control">
            <template #icon>
              <n-icon>
                <GlobeOutline />
              </n-icon>
            </template>
          </n-button>
        </n-dropdown>
        <div class="status-pill">
          <span class="status-dot" :class="props.status" />
          <n-text depth="3">{{ statusLabel }}</n-text>
        </div>
        <n-button
          :type="primaryButtonType"
          size="large"
          strong
          class="start-button"
          @click="handlePrimaryAction"
        >
          <template #icon>
            <n-icon>
              <component :is="primaryButtonIcon" />
            </n-icon>
          </template>
          {{ primaryButtonLabel }}
        </n-button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1.5rem;
  padding: 1.1rem 1.5rem 1rem;
  background: var(--khz-surface-elevated);
  border-bottom: 1px solid var(--khz-border-soft);
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.brand-sub {
  display: block;
  font-size: 0.75rem;
}

.brand-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(140deg, #0f6cfc, #4098ff);
  box-shadow: 0 8px 24px rgba(16, 108, 252, 0.35);
}

.header-input {
  width: 100%;
}

.header-controls {
  display: flex;
  align-items: center;
}

.actions {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.ghost-control {
  color: var(--khz-icon);
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.85rem;
  background: var(--khz-pill-bg);
  border-radius: 999px;
  font-size: 0.85rem;
  color: var(--khz-text-muted);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
}

.status-dot.idle {
  background: #556078;
}

.status-dot.running {
  background: #3b82f6;
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.7);
}

.start-button {
  min-width: 160px;
}

.prefix-icon {
  color: var(--khz-icon-soft);
}

@media (max-width: 1100px) {
  .app-header {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .header-controls {
    justify-content: flex-end;
  }
}
</style>
