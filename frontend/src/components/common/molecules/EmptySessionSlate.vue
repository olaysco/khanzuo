<script setup>
import { computed } from 'vue'
import { NText, NIcon } from 'naive-ui'
import { LaptopOutline } from '@vicons/ionicons5'

const props = defineProps({
  streamReady: {
    type: Boolean,
    default: false,
  },
  hasInput: {
    type: Boolean,
    default: false,
  },
})

const statusClasses = computed(() => ['status-dot', props.streamReady ? 'ok' : 'pending'])
</script>

<template>
  <div class="empty-slate">
    <div class="icon-wrapper">
      <n-icon size="64" depth="2">
        <LaptopOutline />
      </n-icon>
    </div>
    <n-text class="view-title">Waiting for Session</n-text>
    <n-text depth="3" class="view-description">
      Enter a URL and start a session to begin debugging
    </n-text>
    <div class="status-line">
      <span :class="statusClasses" />
      <n-text depth="3">{{ props.streamReady ? 'Ready' : 'Waiting' }}</n-text>
      <span class="divider" />
      <n-text depth="3">
        {{ props.hasInput ? '-' : 'No input yet' }}
      </n-text>
    </div>
  </div>
</template>

<style scoped>
.empty-slate {
  text-align: center;
  max-width: 480px;
  width: 100%;
}

.icon-wrapper {
  width: 96px;
  height: 96px;
  margin: 0 auto 1.5rem auto;
  border-radius: 50%;
  border: 1px dashed var(--khz-border);
  background: var(--khz-panel);
  display: flex;
  align-items: center;
  justify-content: center;
}

.view-title {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 1.4rem;
  font-weight: 700;
}

.view-description {
  display: block;
  line-height: 1.5;
}

.status-line {
  margin-top: 2.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.status-dot.ok {
  background: #27c27d;
  box-shadow: 0 0 6px rgba(39, 194, 125, 0.9);
}

.status-dot.pending {
  background: #de8234;
}

.divider {
  width: 1px;
  height: 12px;
  background: var(--khz-divider);
}
</style>
