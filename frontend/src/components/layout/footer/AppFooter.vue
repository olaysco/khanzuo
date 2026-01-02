<script setup>
import { NText, NTooltip } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { SettingsOutline } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'

const props = defineProps({
  agentStatus: {
    type: String,
    default: 'Idle',
  },
  version: {
    type: String,
    default: 'v0.0.1',
  },
  captureStatus: {
    type: String,
    default: 'Ready',
  },
  serverTime: {
    type: String,
    default: '--:--',
  },
})

const emit = defineEmits(['open-settings'])

const { t } = useI18n()

const handleSettingsClick = () => {
  emit('open-settings')
}
</script>

<template>
  <footer class="app-footer">
    <div class="footer-segment">
      <n-text depth="3">{{ t('ui.footer.agentStatus') }}</n-text>
      <span class="dot" />
      <n-text strong>{{ props.agentStatus }}</n-text>
      <span class="divider" />
      <n-text depth="3">{{ props.version }}</n-text>
    </div>
    <div class="footer-segment">
      <n-text depth="3">{{ t('ui.footer.capture') }}</n-text>
      <span class="dot" />
      <n-text strong>{{ props.captureStatus }}</n-text>
    </div>
    <div class="footer-segment">
      <n-tooltip placement="top" trigger="hover">
        <template #trigger>
          <button class="settings-button" type="button" @click="handleSettingsClick">
            <n-icon size="16">
              <SettingsOutline />
            </n-icon>
          </button>
        </template>
        Open settings
      </n-tooltip>
      <span class="divider" />
      <n-text depth="3">{{ t('ui.footer.serverTime') }}</n-text>
      <span class="dot" />
      <n-text strong>{{ props.serverTime }}</n-text>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 1.5rem;
  border-top: 1px solid var(--khz-border-soft);
  background: var(--khz-surface-elevated);
  font-size: 0.8rem;
  color: var(--khz-text-muted);
}

.footer-segment {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.divider {
  width: 1px;
  height: 14px;
  background: var(--khz-divider);
}

.dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--khz-icon-soft);
}

.settings-button {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  border: 1px solid var(--khz-border);
  background: transparent;
  color: var(--khz-icon);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
}

.settings-button:hover {
  border-color: rgba(64, 152, 255, 0.5);
  color: #7db2ff;
  background: rgba(64, 152, 255, 0.12);
}

@media (max-width: 900px) {
  .app-footer {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
