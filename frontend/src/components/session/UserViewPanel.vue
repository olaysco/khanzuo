<script setup>
import { NCard, NTag } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import EmptySessionSlate from './EmptySessionSlate.vue'

const props = defineProps({
  streamReady: {
    type: Boolean,
    default: true,
  },
  hasInput: {
    type: Boolean,
    default: false,
  },
})

const { t } = useI18n()
</script>

<template>
  <section class="user-view">
    <n-tag size="small" round class="view-label">{{ t('ui.view.title') }}</n-tag>
    <n-card class="view-card" embedded>
      <div class="empty-slate-wrapper">
        <empty-session-slate :stream-ready="props.streamReady" :has-input="props.hasInput" />
      </div>
    </n-card>
  </section>
</template>

<style scoped>
.user-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.view-label {
  width: fit-content;
  background: rgba(7, 11, 19, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.75);
}

.view-card {
  flex: 1;
  border-radius: 26px;
  background: #0b1220;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02);
  min-height: 540px;
}

.empty-slate-wrapper {
  width: 100%;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
}
</style>
