<script setup>
import { computed, ref, watch } from 'vue'

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

const fallbackLanguageOptions = [
  { label: 'English (United States)', value: 'en-us' },
]

const fallbackThemeOptions = [
  { label: 'Dark', value: 'dark' },
  { label: 'Light', value: 'light' },
  { label: 'System', value: 'auto' },
]

const agentOptions = [
  {
    id: 'codex',
    name: 'OpenAI Codex',
    description: 'Best for Python & Javascript codebases',
    badge: 'Default',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Optimized for large context windows',
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    description: 'Superior reasoning for complex bugs',
  },
]

const resolvedLanguageOptions = computed(() =>
  props.languageOptions.length ? props.languageOptions : fallbackLanguageOptions,
)

const resolvedThemeOptions = computed(() =>
  props.themeOptions.length ? props.themeOptions : fallbackThemeOptions,
)

const formState = ref({
  language: props.language,
  theme: props.theme,
  agent: props.agent,
})

watch(
  () => [props.language, props.theme, props.agent],
  ([language, theme, agent]) => {
    formState.value = { language, theme, agent }
  },
)

const interfaceLanguageLabel = computed(() =>
  resolvedLanguageOptions.value.find((option) => option.value === formState.value.language)?.label ?? '',
)

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
  emit('save', { ...formState.value })
}
</script>

<template>
  <div class="settings-page">
    <div class="settings-overlay" />
    <div class="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <header class="dialog-header">
        <div>
          <p id="settings-title" class="dialog-title">Settings</p>
          <p class="dialog-meta">Manage how Khanzuo behaves during investigations</p>
        </div>
        <button class="ghost-icon" type="button" aria-label="Close" @click="handleClose">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M7 7l10 10m0-10-10 10"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </header>

      <div class="settings-body">
        <section class="settings-section">
          <div class="section-heading">General</div>
          <label class="field">
            <span class="field-label">Interface Language</span>
            <div class="select-wrapper">
              <select v-model="formState.language">
                <option
                  v-for="option in resolvedLanguageOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
              <span class="select-label">{{ interfaceLanguageLabel }}</span>
              <svg viewBox="0 0 14 8" aria-hidden="true">
                <path d="M1 1l6 6 6-6" stroke-width="1.5" stroke-linecap="round" stroke="currentColor" />
              </svg>
            </div>
          </label>
        </section>

        <section class="settings-section">
          <div class="section-heading">Appearance</div>
          <div class="field">
            <span class="field-label">Theme Preference</span>
            <div class="theme-toggle" role="group" aria-label="Theme preference">
              <button
                v-for="option in resolvedThemeOptions"
                :key="option.value"
                type="button"
                :class="['theme-chip', { active: formState.theme === option.value }]"
                @click="formState.theme = option.value"
              >
                <span class="chip-label">{{ option.label }}</span>
                <span class="chip-sub">
                  <template v-if="formState.theme === option.value">Selected</template>
                  <template v-else>Switch to {{ option.label }}</template>
                </span>
              </button>
            </div>
          </div>
        </section>

        <section class="settings-section">
          <div class="section-heading">Coding Agent Selection</div>
          <p class="section-description">
            Choose the AI model used for automated bug reproduction and analysis.
          </p>
          <div class="agent-grid">
            <article
              v-for="agent in agentOptions"
              :key="agent.id"
              :class="['agent-card', { active: formState.agent === agent.id }]"
              @click="formState.agent = agent.id"
            >
              <div class="agent-icon" aria-hidden="true">🤖</div>
              <div class="agent-content">
                <div class="agent-title-row">
                  <p class="agent-name">{{ agent.name }}</p>
                  <span v-if="agent.badge" class="agent-badge">{{ agent.badge }}</span>
                </div>
                <p class="agent-description">{{ agent.description }}</p>
              </div>
              <span class="radio-indicator" aria-hidden="true">
                <span />
              </span>
              <span class="sr-only">{{ formState.agent === agent.id ? 'Selected' : 'Not selected' }}</span>
            </article>
          </div>
        </section>

        <section class="settings-section">
          <div class="section-heading">Data Management</div>
          <div class="data-card">
            <div>
              <p class="data-title">Clear Local Data</p>
              <p class="data-description">Remove cached investigation sessions and temporary files.</p>
            </div>
            <button class="danger-button" type="button" @click.stop="handleClearData">Clear Data</button>
          </div>
        </section>
      </div>

      <footer class="dialog-footer">
        <button class="ghost" type="button" @click="handleCancel">Cancel</button>
        <button class="primary" type="button" @click="handleSave">Save Changes</button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  position: fixed;
  inset: 0;
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top, rgba(22, 74, 163, 0.4), transparent 45%), #02060d;
  color: #f8fbff;
  z-index: 30;
}

.settings-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(1, 9, 20, 0.65), rgba(1, 9, 20, 0.85));
  pointer-events: none;
}

.settings-dialog {
  position: relative;
  width: min(640px, 100%);
  max-height: min(90vh, 760px);
  background: #0b1320;
  border-radius: 28px;
  padding: 1.8rem 2rem 2rem;
  box-shadow: 0 35px 80px rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  z-index: 1;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 2rem;
}

.dialog-title {
  font-size: 1.35rem;
  font-weight: 600;
  margin: 0 0 0.25rem;
}

.dialog-meta {
  margin: 0;
  font-size: 0.9rem;
  color: rgba(248, 251, 255, 0.65);
}

.ghost-icon {
  border: none;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.75);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.ghost-icon:hover {
  background: rgba(255, 255, 255, 0.16);
}

.settings-body {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.settings-section {
  padding: 1.25rem 0;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.settings-section:first-of-type {
  padding-top: 0;
  border-top: none;
}

.section-heading {
  font-size: 0.95rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.85rem;
  color: rgba(248, 251, 255, 0.72);
}

.section-description {
  margin: 0 0 1rem;
  color: rgba(248, 251, 255, 0.68);
  font-size: 0.92rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.field-label {
  font-size: 0.92rem;
  color: rgba(248, 251, 255, 0.85);
}

.select-wrapper {
  position: relative;
  background: rgba(12, 20, 35, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  cursor: pointer;
}

.select-wrapper select {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.select-wrapper svg {
  width: 14px;
  height: 8px;
  color: rgba(248, 251, 255, 0.55);
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
}

.select-label {
  pointer-events: none;
  font-size: 1rem;
}

.theme-toggle {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
}

.theme-chip {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(8, 12, 23, 0.8);
  color: rgba(248, 251, 255, 0.75);
  border-radius: 14px;
  text-align: left;
  padding: 0.85rem 1rem;
  cursor: pointer;
  transition: border 0.2s ease, background 0.2s ease;
}

.theme-chip.active {
  border-color: rgba(64, 152, 255, 0.9);
  background: rgba(35, 70, 125, 0.68);
  color: #f8fbff;
  box-shadow: 0 0 0 1px rgba(64, 152, 255, 0.2);
}

.chip-label {
  font-weight: 600;
  display: block;
}

.chip-sub {
  font-size: 0.82rem;
  color: rgba(248, 251, 255, 0.6);
}

.agent-grid {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.agent-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1rem;
  padding: 1rem;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(7, 14, 24, 0.8);
  cursor: pointer;
  transition: border 0.2s ease, box-shadow 0.2s ease;
}

.agent-card.active {
  border-color: rgba(64, 152, 255, 0.9);
  box-shadow: 0 0 0 1px rgba(64, 152, 255, 0.25);
}

.agent-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: rgba(53, 129, 255, 0.08);
  font-size: 1.4rem;
}

.agent-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.agent-name {
  margin: 0;
  font-weight: 600;
  font-size: 1rem;
}

.agent-badge {
  font-size: 0.75rem;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  background: rgba(77, 153, 255, 0.18);
  color: rgba(210, 227, 255, 0.95);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.agent-description {
  margin: 0.2rem 0 0;
  color: rgba(248, 251, 255, 0.65);
  font-size: 0.9rem;
}

.radio-indicator {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid rgba(248, 251, 255, 0.35);
  display: grid;
  place-items: center;
}

.agent-card.active .radio-indicator {
  border-color: rgba(64, 152, 255, 0.9);
}

.radio-indicator span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: transparent;
}

.agent-card.active .radio-indicator span {
  background: #4098ff;
}

.data-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  border-radius: 16px;
  background: rgba(20, 14, 17, 0.6);
  border: 1px solid rgba(248, 82, 82, 0.25);
}

.data-title {
  margin: 0;
  font-weight: 600;
}

.data-description {
  margin: 0.25rem 0 0;
  color: rgba(248, 251, 255, 0.6);
  font-size: 0.9rem;
}

.danger-button {
  border: none;
  padding: 0.6rem 1.25rem;
  border-radius: 12px;
  background: #ef4444;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.8rem;
}

.dialog-footer button {
  padding: 0.85rem 1.8rem;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
}

.dialog-footer .ghost {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(248, 251, 255, 0.85);
}

.dialog-footer .primary {
  background: linear-gradient(90deg, #266cff, #4d8dff);
  color: #fff;
  box-shadow: 0 12px 20px rgba(64, 152, 255, 0.35);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 640px) {
  .settings-dialog {
    padding: 1.5rem;
  }

  .agent-card {
    grid-template-columns: auto 1fr;
  }

  .radio-indicator {
    margin-top: 0.5rem;
  }

  .data-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .dialog-footer {
    flex-direction: column;
  }

  .dialog-footer button {
    width: 100%;
  }
}
</style>
