<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { NCard } from 'naive-ui'
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
  targetUrl: {
    type: String,
    default: '',
  },
  manualUrl: {
    type: String,
    default: '',
  },
  manualControl: {
    type: Boolean,
    default: false,
  },
  sessionId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['toggle-control', 'update:manual-url'])
const liveSrc = computed(() => props.manualUrl?.trim() || props.targetUrl?.trim() || 'about:blank')
const partitionId = computed(() => (props.sessionId ? `persist:khanzuo-session-${props.sessionId}` : undefined))
const manualWebview = ref(null)
const webviewCleanupFns = []

const emitManualUrl = (url) => {
  if (!url || typeof url !== 'string') return
  emit('update:manual-url', url)
}

const cleanupWebviewListeners = () => {
  while (webviewCleanupFns.length) {
    const disposer = webviewCleanupFns.pop()
    if (typeof disposer === 'function') disposer()
  }
}

const syncManualUrl = () => {
  const webview = manualWebview.value
  if (!webview) return
  const currentUrl = typeof webview.getURL === 'function' ? webview.getURL() : webview.src
  if (currentUrl) emitManualUrl(currentUrl)
}

const attachWebviewListeners = () => {
  cleanupWebviewListeners()
  const webview = manualWebview.value
  if (!webview) return
  const handler = () => syncManualUrl()
  webview.addEventListener('did-navigate', handler)
  webviewCleanupFns.push(() => webview.removeEventListener('did-navigate', handler))
  webview.addEventListener('did-navigate-in-page', handler)
  webviewCleanupFns.push(() => webview.removeEventListener('did-navigate-in-page', handler))
  syncManualUrl()
}

watch(
  () => props.manualControl,
  (enabled) => {
    if (enabled) {
      nextTick(() => {
        attachWebviewListeners()
      })
    } else {
      cleanupWebviewListeners()
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  cleanupWebviewListeners()
})

const handleToggleControl = () => emit('toggle-control')
</script>

<template>
  <section class="user-view">
    <n-card class="view-card" embedded>
      <div class="view-toolbar">
        <button type="button" class="control-toggle" @click="handleToggleControl">
          {{ props.manualControl ? 'Return to agent' : 'Take control' }}
        </button>
      </div>
      <div v-if="props.manualControl" class="live-wrapper">
        <webview
          ref="manualWebview"
          :src="liveSrc"
          :partition="partitionId"
          class="live-view"
          allowpopups
          disablewebsecurity
        />
      </div>
      <div v-else>
        <div v-if="props.frameSrc" class="frame-wrapper">
          <img
            :src="props.frameSrc"
            alt="Live user view"
            class="frame-image"
            draggable="false"
          />
        </div>
        <div v-else class="empty-slate-wrapper">
          <empty-session-slate :stream-ready="props.streamReady" :has-input="props.hasInput" />
        </div>
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

.view-card {
  flex: 1;
  border-radius: 0;
  background: transparent;
  border: none;
  box-shadow: none;
  min-height: 540px;
  overflow: auto;
}

.view-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.5rem;
}

.control-toggle {
  border: 1px solid var(--khz-border, rgba(255, 255, 255, 0.2));
  background: rgba(4, 9, 20, 0.7);
  color: var(--khz-text, #f5f8ff);
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.85rem;
}

.frame-wrapper {
  width: 100%;
  min-height: 100%;
  display: block;
  background: var(--khz-panel);
  border-radius: 18px;
  overflow: auto;
}

.frame-image {
  width: 100%;
  height: auto;
  display: block;
  background: var(--khz-panel);
}

.live-wrapper {
  position: relative;
  width: 100%;
  height: calc(100% - 1rem);
  min-height: 540px;
  border-radius: 18px;
  overflow: hidden;
  background: var(--khz-panel);
}

.live-view {
  width: 100%;
  height: 100%;
  border: none;
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
