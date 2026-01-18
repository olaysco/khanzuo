<script setup>
import { computed, ref, watch } from 'vue'
import {
  NModal,
  NCard,
  NForm,
  NFormItem,
  NSelect,
  NRadioGroup,
  NRadio,
  NButton,
  NIcon,
  NInput,
} from 'naive-ui'
import {
  CloseOutline,
  SunnyOutline,
  MoonOutline,
  LaptopOutline,
  CloudOutline,
  ServerOutline,
  CodeSlashOutline,
  LinkOutline,
  TrashOutline,
} from '@vicons/ionicons5'

const props = defineProps({
  theme: {
    type: String,
    default: 'dark',
  },
  llmConfig: {
    type: Object,
    default: () => ({
      provider: 'openai',
      apiKey: '',
      model: 'gpt-4o-mini',
      endpoint: '',
      ollamaModel: 'llama3.2',
    }),
  },
})

const emit = defineEmits(['close', 'cancel', 'save', 'clear-data'])

const themeOptions = [
  { label: 'Dark', value: 'dark', icon: MoonOutline },
  { label: 'Light', value: 'light', icon: SunnyOutline },
  { label: 'System', value: 'auto', icon: LaptopOutline },
]

const providerOptions = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o, GPT-4o-mini, etc.',
    icon: CloudOutline,
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude 3.5 Sonnet, Claude 3 Opus, etc.',
    icon: CodeSlashOutline,
  },
  {
    id: 'ollama',
    name: 'Ollama',
    description: 'Local models (Llama, Mistral, etc.)',
    icon: ServerOutline,
  },
  {
    id: 'custom',
    name: 'Custom Endpoint',
    description: 'OpenAI-compatible API endpoint',
    icon: LinkOutline,
  },
]

const openaiModels = [
  { label: 'GPT-4o Mini (Recommended)', value: 'gpt-4o-mini' },
  { label: 'GPT-4o', value: 'gpt-4o' },
  { label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
]

const anthropicModels = [
  { label: 'Claude 3.5 Sonnet (Recommended)', value: 'claude-3-5-sonnet-20241022' },
  { label: 'Claude 3 Opus', value: 'claude-3-opus-20240229' },
  { label: 'Claude 3 Haiku', value: 'claude-3-haiku-20240307' },
]

const ollamaModels = [
  { label: 'Llama 3.2 (Recommended)', value: 'llama3.2' },
  { label: 'Llama 3.1', value: 'llama3.1' },
  { label: 'Mistral', value: 'mistral' },
  { label: 'CodeLlama', value: 'codellama' },
]

const formState = ref({
  theme: props.theme,
  llmConfig: { ...props.llmConfig },
})

watch(
  () => [props.theme, props.llmConfig],
  ([theme, llmConfig]) => {
    formState.value = {
      theme,
      llmConfig: { ...llmConfig },
    }
  },
  { deep: true },
)

const currentModelOptions = computed(() => {
  switch (formState.value.llmConfig.provider) {
    case 'openai':
      return openaiModels
    case 'anthropic':
      return anthropicModels
    case 'ollama':
      return ollamaModels
    default:
      return openaiModels
  }
})

const showApiKeyField = computed(() =>
  ['openai', 'anthropic', 'custom'].includes(formState.value.llmConfig.provider)
)

const showEndpointField = computed(() =>
  formState.value.llmConfig.provider === 'custom'
)

const showModelSelect = computed(() =>
  formState.value.llmConfig.provider !== 'custom'
)

const apiKeyPlaceholder = computed(() => {
  switch (formState.value.llmConfig.provider) {
    case 'openai':
      return 'sk-...'
    case 'anthropic':
      return 'sk-ant-...'
    default:
      return 'Enter API key...'
  }
})

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

const handleCancel = () => emit('cancel')
const handleClose = () => emit('close')
const handleClearData = () => emit('clear-data')

const handleSave = () => {
  emit('save', {
    theme: formState.value.theme,
    llmConfig: { ...formState.value.llmConfig },
  })
}

const handleProviderChange = (provider) => {
  formState.value.llmConfig.provider = provider
  // Set default model for the provider
  if (provider === 'openai') {
    formState.value.llmConfig.model = 'gpt-4o-mini'
  } else if (provider === 'anthropic') {
    formState.value.llmConfig.model = 'claude-3-5-sonnet-20241022'
  } else if (provider === 'ollama') {
    formState.value.llmConfig.model = 'llama3.2'
  }
}
</script>

<template>
  <n-modal :show="true" class="settings-modal" :mask-closable="false">
    <n-card class="settings-card" :bordered="false" :style="modalThemeVars">
      <div class="dialog-header">
        <div>
          <p class="dialog-title">Settings</p>
        </div>
        <n-button
          quaternary
          circle
          class="close-button"
          aria-label="Close"
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
        <!-- Theme Section -->
        <section class="settings-section">
          <p class="section-heading">Appearance</p>
          <div class="field">
            <div class="field-label">
              <span>Theme Preference</span>
            </div>
            <n-radio-group v-model:value="formState.theme" class="theme-group">
              <n-radio v-for="option in themeOptions" :key="option.value" :value="option.value">
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

        <!-- LLM Provider Section -->
        <section class="settings-section">
          <p class="section-heading">LLM Provider</p>
          <p class="section-description">Select which AI model to use for action planning</p>
          <n-radio-group :value="formState.llmConfig.provider" class="provider-grid" @update:value="handleProviderChange">
            <n-radio v-for="provider in providerOptions" :key="provider.id" :value="provider.id">
              <div class="provider-card" :class="{ active: formState.llmConfig.provider === provider.id }">
                <div class="provider-icon" :data-provider="provider.id">
                  <n-icon size="22">
                    <component :is="provider.icon" />
                  </n-icon>
                </div>
                <div class="provider-content">
                  <p class="provider-name">{{ provider.name }}</p>
                  <p class="provider-description">{{ provider.description }}</p>
                </div>
                <span class="radio-indicator">
                  <span />
                </span>
              </div>
            </n-radio>
          </n-radio-group>
        </section>

        <!-- API Configuration Section -->
        <section class="settings-section">
          <p class="section-heading">API Configuration</p>
          <n-form :model="formState.llmConfig" label-placement="top" class="settings-form">
            <n-form-item v-if="showApiKeyField" label="API Key">
              <n-input
                v-model:value="formState.llmConfig.apiKey"
                type="password"
                show-password-on="click"
                :placeholder="apiKeyPlaceholder"
                size="large"
              />
            </n-form-item>

            <n-form-item v-if="showEndpointField" label="Custom Endpoint">
              <n-input
                v-model:value="formState.llmConfig.endpoint"
                placeholder="https://api.example.com/v1"
                size="large"
              />
            </n-form-item>

            <n-form-item v-if="showModelSelect" label="Model">
              <n-select
                v-model:value="formState.llmConfig.model"
                :options="currentModelOptions"
                size="large"
              />
            </n-form-item>
          </n-form>

          <div v-if="formState.llmConfig.provider === 'ollama'" class="info-box">
            <p class="info-text">
              Make sure Ollama is running locally on port 11434.
              <a href="https://ollama.ai" target="_blank" class="info-link">Get Ollama</a>
            </p>
          </div>
        </section>

        <!-- Data Management Section -->
        <section class="settings-section">
          <p class="section-heading">Data Management</p>
          <div class="data-card">
            <div>
              <p class="data-title">Clear Session Data</p>
              <p class="data-description">Reset logs, screenshots, and session state</p>
            </div>
            <n-button strong secondary type="error" class="danger-button" @click="handleClearData">
              <template #icon>
                <n-icon>
                  <TrashOutline />
                </n-icon>
              </template>
              Clear Data
            </n-button>
          </div>
        </section>
      </div>

      <div class="dialog-footer">
        <n-button quaternary @click="handleCancel">Cancel</n-button>
        <n-button type="primary" strong @click="handleSave">Save</n-button>
      </div>
    </n-card>
  </n-modal>
</template>

<style scoped>
.settings-modal :deep(.n-card) {
  width: min(640px, calc(100vw - 2rem));
  border-radius: 26px;
  box-shadow: 0 35px 80px rgba(0, 0, 0, 0.5);
}

.settings-modal :deep(.n-modal-mask) {
  background-color: color-mix(in srgb, #01030a 30%, var(--settings-surface, #03070f) 70%);
  opacity: 0.94;
  backdrop-filter: blur(4px);
}

.settings-card {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background: var(--settings-surface);
  border: 1px solid var(--settings-border);
  border-radius: 26px;
  color: var(--settings-strong);
}

.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.25rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--settings-border);
}

.dialog-title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 600;
  color: var(--settings-strong);
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

.settings-section:last-of-type {
  border-bottom: none;
  padding-bottom: 0;
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
  grid-template-columns: repeat(3, 1fr);
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
.provider-grid :deep(.n-radio .n-radio__dot-wrapper) {
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
  transition: border 0.2s ease, background 0.2s ease;
}

.theme-chip:hover {
  border-color: var(--settings-accent);
}

.theme-chip.active {
  border-color: var(--settings-accent);
  background: var(--settings-accent);
  color: #fff;
}

.chip-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--settings-strong);
  justify-content: center;
}

.theme-chip.active .chip-title,
.theme-chip.active .chip-label {
  color: #fff;
}

.chip-label {
  font-weight: 600;
  color: var(--settings-strong);
}

.provider-grid {
  display: grid;
  gap: 0.75rem;
}

.provider-grid :deep(.n-radio) {
  width: 100%;
}

.provider-grid :deep(.n-radio__dot) {
  display: none;
}

.provider-grid :deep(.n-radio__label) {
  width: 100%;
}

.provider-card {
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

.provider-card:hover {
  border-color: var(--settings-accent);
  background: var(--settings-panel-active);
}

.provider-card.active {
  border-color: var(--settings-accent);
  background: rgba(64, 152, 255, 0.12);
  box-shadow: 0 0 0 1px rgba(64, 152, 255, 0.25);
}

.provider-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: #fff;
}

.provider-icon[data-provider='openai'] {
  background: linear-gradient(135deg, #10a37f, #0da37f);
}

.provider-icon[data-provider='anthropic'] {
  background: linear-gradient(135deg, #cc785c, #d4a574);
}

.provider-icon[data-provider='ollama'] {
  background: linear-gradient(135deg, #374151, #6b7280);
}

.provider-icon[data-provider='custom'] {
  background: linear-gradient(135deg, #7c3aed, #a855f7);
}

.provider-name {
  margin: 0;
  font-weight: 600;
  color: var(--settings-strong);
}

.provider-description {
  margin: 0.2rem 0 0;
  color: var(--settings-muted);
  font-size: 0.85rem;
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

.provider-card.active .radio-indicator {
  border-color: var(--settings-accent);
}

.radio-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: transparent;
}

.provider-card.active .radio-indicator span {
  background: var(--settings-accent);
}

.settings-form :deep(.n-form-item) {
  margin-bottom: 1rem;
}

.settings-form :deep(.n-form-item:last-child) {
  margin-bottom: 0;
}

.settings-form :deep(.n-input),
.settings-form :deep(.n-base-selection) {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--settings-border);
  border-radius: 12px;
  min-height: 44px;
}

.settings-form :deep(.n-input:hover),
.settings-form :deep(.n-base-selection:hover) {
  border-color: var(--settings-accent);
}

.info-box {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(43, 124, 238, 0.1);
  border: 1px solid rgba(43, 124, 238, 0.2);
  border-radius: 12px;
}

.info-text {
  margin: 0;
  font-size: 0.85rem;
  color: var(--settings-muted);
}

.info-link {
  color: var(--settings-accent);
  text-decoration: none;
}

.info-link:hover {
  text-decoration: underline;
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1rem;
  margin-top: 0.5rem;
  border-top: 1px solid var(--settings-border);
}
</style>
