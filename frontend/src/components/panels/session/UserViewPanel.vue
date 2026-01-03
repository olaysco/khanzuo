<script setup>
import { NCard, NTag } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import EmptySessionSlate from '@/components/common/molecules/EmptySessionSlate.vue'

const props = defineProps({
  streamReady: {
    type: Boolean,
    default: true,
  },
  hasInput: {
    type: Boolean,
    default: false,
  },
  frameSrc: {
    type: String,
    default: '',
  },
})

const { t } = useI18n()
</script>

<template>
  <section class="user-view">
    <n-tag size="small" round class="view-label">{{ t('ui.view.title') }}</n-tag>
    <n-card class="view-card" embedded>
      <div v-if="props.frameSrc" class="frame-wrapper">
        <img :src="props.frameSrc" alt="Live user view" class="frame-image" />
      </div>
      <div v-else class="empty-slate-wrapper">
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
  min-height: 0;
  overflow-y: auto;
}

.view-label {
  width: fit-content;
  background: var(--khz-chip-bg);
  border: 1px solid var(--khz-chip-border);
  color: var(--khz-text-muted);
}

.view-card {
  flex: 1;
  border-radius: 26px;
  background: var(--khz-card);
  border: 1px solid var(--khz-border);
  box-shadow: inset 0 0 0 1px var(--khz-border-soft);
  min-height: 540px;
  overflow: auto;
}

.frame-wrapper {
  width: 100%;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--khz-panel);
  border-radius: 18px;
  overflow: hidden;
}

.frame-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: var(--khz-panel);
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
