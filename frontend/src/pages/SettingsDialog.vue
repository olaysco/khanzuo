<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  useThemeVars,
  NModal,
  NCard,
  NForm,
  NFormItem,
  NSelect,
  NRadioGroup,
  NRadio,
  NTag,
  NButton,
  NIcon,
  NInput,
} from 'naive-ui'
import {
  CloseOutline,
  SunnyOutline,
  MoonOutline,
  LaptopOutline,
  CodeSlashOutline,
  SparklesOutline,
  GitMergeOutline,
  TrashOutline,
} from '@vicons/ionicons5'

const props = defineProps({
  language: {
    type: String,
    default: 'en-us',
  },
  theme: {
    type: String,
    default: 'dark',
  },
  agent: {
    type: String,
    default: 'codex',
  },
  agentPaths: {
    type: Object,
    default: () => ({}),
  },
  languageOptions: {
    type: Array,
    default: () => [],
  },
  themeOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['close', 'cancel', 'save', 'clear-data'])

const { t } = useI18n()
const themeVars = useThemeVars()

const fallbackLanguageOptions = [
  { label: 'English (United States)', value: 'en-us' },
]

const fallbackThemeOptions = [
  { label: 'Dark', value: 'dark' },
  { label: 'Light', value: 'light' },
  { label: 'System', value: 'auto' },
]

const agentIds = ['codex', 'gemini', 'claude']
const baseAgentPaths = agentIds.reduce((acc, id) => {
  acc[id] = ''
  return acc
}, {})
const initializeAgentPaths = (paths) => ({
  ...baseAgentPaths,
  ...(paths ?? {}),
})

const themeIconMap = {
  light: SunnyOutline,
  dark: MoonOutline,
  auto: LaptopOutline,
}

const agentIconMap = {
  codex: CodeSlashOutline,
  gemini: SparklesOutline,
  claude: GitMergeOutline,
}

const resolvedLanguageOptions = computed(() =>
  props.languageOptions?.length ? props.languageOptions : fallbackLanguageOptions,
)

const resolvedThemeOptions = computed(() =>
  props.themeOptions?.length ? props.themeOptions : fallbackThemeOptions,
)

const formState = ref({
  language: props.language,
  theme: props.theme,
  agent: props.agent,
  agentPaths: initializeAgentPaths(props.agentPaths),
})

watch(
  () => [props.language, props.theme, props.agent, props.agentPaths],
  ([language, theme, agent, agentPaths]) => {
    formState.value = {
      language,
      theme,
      agent,
      agentPaths: initializeAgentPaths(agentPaths),
    }
  },
  { deep: true },
)

const translateOptional = (key) => {
  const value = t(key)
  return value === key ? '' : value
}

const themeControls = computed(() =>
  resolvedThemeOptions.value.map((option) => ({
    ...option,
    icon: themeIconMap[option.value] ?? SunnyOutline,
  })),
)

const agentOptions = computed(() =>
  agentIds.map((id) => ({
    id,
    name: t(`ui.settings.agents.${id}.name`),
    description: t(`ui.settings.agents.${id}.description`),
    badge: translateOptional(`ui.settings.agents.${id}.badge`),
    icon: agentIconMap[id] ?? CodeSlashOutline,
  })),
)

const readDocumentTheme = () => {
  if (typeof window === 'undefined') return 'light'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

const paletteByTheme = (mode) => {
  if (mode === 'dark') {
    return {
      surface: '#111822',
      panel: '#192433',
      panelActive: '#1d2939',
      border: '#233348',
      muted: '#92a9c9',
      strong: '#f8fbff',
      accent: '#2b7cee',
      accentSoft: 'rgba(43, 124, 238, 0.12)',
      dangerBorder: '#5f1933',
    }
  }
  return {
    surface: '#f6f7f8',
    panel: '#ffffff',
    panelActive: '#e8eef7',
    border: '#d7dee8',
    muted: '#475569',
    strong: '#0f172a',
    accent: '#2563eb',
    accentSoft: 'rgba(37, 99, 235, 0.12)',
    dangerBorder: '#fca5a5',
  }
}

const modalThemeVars = computed(() => {
  const mode = readDocumentTheme()
  const palette = paletteByTheme(mode)
  return {
    '--settings-surface': palette.surface,
    '--settings-panel': palette.panel,
    '--settings-panel-active': palette.panelActive,
    '--settings-border': palette.border,
    '--settings-muted': palette.muted,
    '--settings-strong': palette.strong,
    '--settings-accent': palette.accent,
    '--settings-accent-soft': palette.accentSoft,
    '--settings-danger-border': palette.dangerBorder,
  }
})

const handleCancel = () => {
  emit('cancel')
}

const handleClose = () => {
  emit('close')
}

const handleClearData = () => {
  emit('clear-data')
}

const handleSave = () => {
  emit('save', {
    ...formState.value,
    agentPaths: { ...(formState.value.agentPaths ?? {}) },
  })
}
</script>

<template>
  <n-modal :show="true" class="settings-modal" :mask-closable="false">
    <n-card class="settings-card" :bordered="false" :style="modalThemeVars">
      <div class="dialog-header">
        <div>
          <p class="dialog-title">{{ t('ui.settings.title') }}</p>
        </div>
        <n-button
          quaternary
          circle
          class="close-button"
          :aria-label="t('ui.settings.close')"
          @click="handleClose"
        >
          <template #icon>
            <n-icon>
              <CloseOutline />
            </n-icon>
          </template>
        </n-button>
      </div>

      <div class="settings-body">
        <section class="settings-section">
          <p class="section-heading">{{ t('ui.settings.general') }}</p>
          <n-form :model="formState" label-placement="top" class="settings-form">
            <n-form-item :label="t('ui.settings.interfaceLanguage')">
              <n-select v-model:value="formState.language" :options="resolvedLanguageOptions" size="large" />
            </n-form-item>
          </n-form>
        </section>

        <section class="settings-section">
          <p class="section-heading">{{ t('ui.settings.appearance') }}</p>
          <div class="field">
            <div class="field-label">
              <span>{{ t('ui.settings.themePreference') }}</span>
            </div>
            <n-radio-group v-model:value="formState.theme" class="theme-group">
              <n-radio v-for="option in themeControls" :key="option.value" :value="option.value">
                <div class="theme-chip" :class="{ active: formState.theme === option.value }">
                  <div class="chip-title">
                    <n-icon size="18">
                      <component :is="option.icon" />
                    </n-icon>
                    <span class="chip-label">{{ option.label }}</span>
                  </div>
                </div>
              </n-radio>
            </n-radio-group>
          </div>
        </section>

        <section class="settings-section">
          <p class="section-heading">{{ t('ui.settings.agentSelection') }}</p>
          <p class="section-description">{{ t('ui.settings.agentSelectionDescription') }}</p>
          <n-radio-group v-model:value="formState.agent" class="agent-grid">
            <n-radio v-for="agent in agentOptions" :key="agent.id" :value="agent.id">
              <div class="agent-card" :class="{ active: formState.agent === agent.id }" :data-agent="agent.id">
                <div class="agent-icon" aria-hidden="true" :data-agent="agent.id">
                  <n-icon size="22">
                    <component :is="agent.icon" />
                  </n-icon>
                </div>
                <div class="agent-content">
                  <div class="agent-title-row">
                    <p class="agent-name">{{ agent.name }}</p>
                    <n-tag v-if="agent.badge" size="small" type="info" class="agent-badge" round>
                      {{ agent.badge }}
                    </n-tag>
                  </div>
                  <p class="agent-description">{{ agent.description }}</p>
                  <div class="agent-path-group" @click.stop>
                    <label class="agent-path-label" :for="`agent-path-${agent.id}`">
                      {{ t('ui.settings.agentInstallPath') }}
                    </label>
                    <div class="agent-path-input">
                      <n-input
                        :id="`agent-path-${agent.id}`"
                        v-model:value="formState.agentPaths[agent.id]"
                        :placeholder="t('ui.settings.agentInstallPlaceholder')"
                        :disabled="formState.agent !== agent.id"
                        size="small"
                      />
                    </div>
                    <p class="agent-path-hint">{{ t('ui.settings.agentInstallHint') }}</p>
                  </div>
                </div>
                <span class="radio-indicator" aria-hidden="true">
                  <span />
                </span>
              </div>
            </n-radio>
          </n-radio-group>
        </section>

        <section class="settings-section">
          <p class="section-heading">{{ t('ui.settings.dataManagement') }}</p>
          <div class="data-card">
            <div>
              <p class="data-title">{{ t('ui.settings.clearDataTitle') }}</p>
              <p class="data-description">{{ t('ui.settings.clearDataDescription') }}</p>
            </div>
            <n-button strong secondary type="error" class="danger-button" @click="handleClearData">
              <template #icon>
                <n-icon>
                  <TrashOutline />
                </n-icon>
              </template>
              {{ t('ui.settings.clearDataCta') }}
            </n-button>
          </div>
        </section>
      </div>

      <div class="dialog-footer">
        <n-button quaternary @click="handleCancel">{{ t('ui.settings.cancel') }}</n-button>
        <n-button type="primary" strong @click="handleSave">{{ t('ui.settings.save') }}</n-button>
      </div>
    </n-card>
  </n-modal>
</template>

<style scoped>
.settings-modal :deep(.n-card) {
  width: min(720px, calc(100vw - 2rem));
  border-radius: 26px;
  box-shadow: 0 35px 80px rgba(0, 0, 0, 0.5);
}

.settings-modal :deep(.n-modal-mask) {
  background-color: color-mix(in srgb, #01030a 30%, var(--settings-surface, #03070f) 70%);
  opacity: 0.94;
  backdrop-filter: blur(4px);
}

.settings-modal :deep(.n-modal-body-wrapper) {
  position: relative;
}

.settings-card {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background: var(--settings-surface);
  border: 1px solid var(--settings-border);
  border-radius: 26px;
  width: 600px;
  color: var(--settings-strong);
}

.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.25rem;
}

.dialog-title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 600;
  color: var(--settings-strong);
}

.dialog-meta {
  margin: 0.25rem 0 0;
  color: var(--settings-muted);
}

.close-button {
  color: var(--settings-muted);
}

.settings-body {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-height: min(70vh, 520px);
  padding-right: 0.25rem;
  overflow-y: auto;
}

.settings-section {
  padding: 0 0 1.25rem;
}

.settings-section:first-of-type {
  margin-top: 0.5rem;
}

.settings-section:last-of-type {
  border-bottom: none;
  padding-bottom: 0;
}

.settings-form :deep(.n-form-item) {
  margin-bottom: 0;
}

.settings-form :deep(.n-base-selection) {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--settings-border);
  border-radius: 12px;
  min-height: 44px;
  transition: border 0.2s ease, background 0.2s ease;
}

.settings-form :deep(.n-base-selection:hover) {
  border-color: var(--settings-accent);
}

.settings-form :deep(.n-base-selection-label) {
  font-weight: 600;
  color: var(--settings-strong);
}

.settings-form :deep(.n-base-selection-placeholder) {
  color: var(--settings-muted);
}

.section-heading {
  margin: 0 0 0.85rem;
  font-size: 0.95rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--settings-muted);
}

.section-description {
  margin: -0.25rem 0 1rem;
  color: var(--settings-muted);
  font-size: 0.92rem;
}

.field-label {
  font-size: 0.9rem;
  color: var(--settings-strong);
  margin-bottom: 0.5rem;
}

.theme-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.5rem;
  padding: 0.4rem;
  border-radius: 14px;
  border: 1px solid var(--settings-border);
  background: var(--settings-panel);
}

.theme-group :deep(.n-radio) {
  width: 100%;
}

.theme-group :deep(.n-radio .n-radio__dot-wrapper),
.agent-grid :deep(.n-radio .n-radio__dot-wrapper) {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.theme-group :deep(.n-radio__dot) {
  display: none;
}

.theme-group :deep(.n-radio__label) {
  width: 100%;
}

.theme-chip {
  border: 1px solid transparent;
  background: var(--settings-panel);
  border-radius: 12px;
  padding: 0.6rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  transition: border 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.theme-chip:hover {
  border-color: var(--settings-accent);
}

.theme-chip.active {
  border-color: var(--settings-accent);
  background: var(--settings-accent);
  color: #fff;
  box-shadow: 0 0 0 1px rgba(64, 152, 255, 0.3);
}

.chip-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--settings-strong);
  justify-content: center;
}

.theme-chip.active .chip-title {
  color: #fff;
}

.chip-title :deep(.n-icon) {
  color: currentColor;
}

.chip-label {
  font-weight: 600;
  color: var(--settings-strong);
}

.theme-chip.active .chip-label {
  color: #fff;
}

.chip-sub {
  color: var(--settings-muted);
  font-size: 0.82rem;
}

.theme-chip.active .chip-sub {
  color: rgba(255, 255, 255, 0.85);
}

.agent-grid {
  display: grid;
  gap: 0.75rem;
}

.agent-grid :deep(.n-radio) {
  width: 100%;
}

.agent-grid :deep(.n-radio__dot) {
  display: none;
}

.agent-grid :deep(.n-radio__label) {
  width: 100%;
}

.agent-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  border-radius: 16px;
  border: 1px solid var(--settings-border);
  background: rgba(255, 255, 255, 0.02);
  transition: border 0.2s ease, background 0.2s ease;
}

.agent-card:hover {
  border-color: var(--settings-accent);
  background: var(--settings-panel-active);
}

.agent-card.active {
  border-color: var(--settings-accent);
  background: rgba(64, 152, 255, 0.12);
  box-shadow: 0 0 0 1px rgba(64, 152, 255, 0.25);
}

.agent-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 1.5rem;
}

.agent-icon[data-agent='codex'] {
  background: linear-gradient(135deg, #2563eb, #60a5fa);
}

.agent-icon[data-agent='gemini'] {
  background: linear-gradient(135deg, #7c3aed, #c084fc);
}

.agent-icon[data-agent='claude'] {
  background: linear-gradient(135deg, #f97316, #facc15);
}

.agent-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.2rem;
}

.agent-name {
  margin: 0;
  font-weight: 600;
  color: var(--settings-strong);
}

.agent-description {
  margin: 0;
  color: var(--settings-muted);
  font-size: 0.92rem;
}

.agent-path-group {
  margin-top: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.agent-path-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--settings-muted);
}

.agent-path-input {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.agent-path-input :deep(.n-input) {
  flex: 1;
  --n-border-radius: 10px;
}

.agent-path-hint {
  margin: 0;
  font-size: 0.75rem;
  color: var(--settings-muted);
}

.agent-badge {
  text-transform: uppercase;
}

.radio-indicator {
  width: 18px;
  height: 18px;
  border: 2px solid var(--settings-border);
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.agent-card.active .radio-indicator {
  border-color: var(--settings-accent);
}

.radio-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: transparent;
}

.agent-card.active .radio-indicator span {
  background: var(--settings-accent);
}

.data-card {
  border: 1px solid var(--settings-border);
  border-radius: 16px;
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: var(--settings-panel);
}

.data-title {
  margin: 0;
  font-weight: 600;
  color: var(--settings-strong);
}

.data-description {
  margin: 0.25rem 0 0;
  color: var(--settings-muted);
  font-size: 0.9rem;
}

.danger-button {
  border-radius: 12px;
  border: 1px solid var(--settings-danger-border);
  background: rgba(244, 63, 94, 0.15);
  color: #fecdd3;
}

.dialog-header:nth-child(1) {
  padding: 0.5rem 0px;
  border-bottom: 1px solid var(--settings-border);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1rem;
  margin-top: 0.5rem;
  border-top: 1px solid var(--settings-border);
}

.danger-button :deep(.n-button__content) {
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}
</style>
