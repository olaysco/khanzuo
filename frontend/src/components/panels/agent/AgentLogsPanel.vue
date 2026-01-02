<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NCard, NButton, NText, NIcon, NEmpty, NScrollbar } from 'naive-ui'
import { RefreshOutline, SparklesOutline } from '@vicons/ionicons5'

const props = defineProps({
  logs: {
    type: Array,
    default: () => [],
  },
  isSyncing: {
    type: Boolean,
    default: false,
  },
  lastSync: {
    type: String,
    default: '--:--',
  },
})

const emit = defineEmits(['refresh'])
const { t } = useI18n()

const orderedLogs = computed(() => [...props.logs].reverse())

const handleRefresh = () => {
  emit('refresh')
}
</script>

<template>
  <section class="agent-logs">
    <div class="panel-header">
      <n-text depth="2">{{ t('ui.logs.title') }}</n-text>
      <div class="panel-actions">
        <n-button quaternary circle size="medium" @click="handleRefresh">
          <template #icon>
            <n-icon :class="{ spinning: props.isSyncing }">
              <RefreshOutline />
            </n-icon>
          </template>
        </n-button>
      </div>
    </div>
    <n-card class="logs-card" embedded>
      <n-scrollbar class="logs-scroll">
        <div v-if="orderedLogs.length" class="logs-list">
          <div v-for="log in orderedLogs" :key="log.id" class="log-item">
            <div class="log-meta">
              <span class="log-indicator" :class="log.status" />
              <n-text depth="3">{{ log.timestamp }}</n-text>
            </div>
            <div class="log-content">
              <n-text strong>{{ log.title }}</n-text>
              <n-text depth="3" class="log-detail">{{ log.detail }}</n-text>
            </div>
          </div>
        </div>
        <div v-else class="logs-empty">
          <n-empty :description="t('ui.logs.empty')">
            <template #icon>
              <n-icon size="48">
                <SparklesOutline />
              </n-icon>
            </template>
          </n-empty>
        </div>
      </n-scrollbar>
    </n-card>
  </section>
</template>

<style scoped>
.agent-logs {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-height: 0;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.3rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  color: var(--khz-text-muted);
}

.logs-card {
  border-radius: 18px;
  background: var(--khz-panel);
  border: 1px solid var(--khz-border);
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.logs-scroll {
  flex: 1;
  min-height: 0;
  height: 100%;
}

.logs-scroll :deep(.n-scrollbar-container) {
  height: 100%;
}

.logs-scroll :deep(.n-scrollbar-content) {
  display: flex;
  flex-direction: column;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 0.5rem 0.35rem 0.75rem;
}

.log-item {
  display: flex;
  gap: 0.75rem;
}

.log-meta {
  width: 90px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.log-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3b82f6;
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.6);
}

.log-indicator.success {
  background: #34d399;
  box-shadow: 0 0 12px rgba(52, 211, 153, 0.6);
}

.log-indicator.warning {
  background: #f97316;
  box-shadow: 0 0 12px rgba(249, 115, 22, 0.6);
}

.log-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.log-detail {
  line-height: 1.4;
}

.logs-empty {
  flex: 1;
  padding: 3rem 0;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
