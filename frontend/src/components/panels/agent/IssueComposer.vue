<script setup>
import { computed } from 'vue'
import { NCard, NButton, NText, NInput, NIcon } from 'naive-ui'
import { SendOutline } from '@vicons/ionicons5'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  disclaimer: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'send'])

const hasText = computed(() => props.modelValue.trim().length > 0)

const handleUpdate = (value) => emit('update:modelValue', value)

const handleSend = () => {
  if (!hasText.value) return
  emit('send')
}
</script>

<template>
  <n-card class="composer" embedded>
    <div class="composer-input">
      <div class="input-wrapper">
        <n-input
          type="textarea"
          :value="props.modelValue"
          :placeholder="props.placeholder"
          :autosize="{ minRows: 4, maxRows: 12 }"
          @update:value="handleUpdate"
        />
        <n-button
          circle
          type="primary"
          size="large"
          class="send-button"
          :disabled="!hasText"
          @click="handleSend"
        >
          <template #icon>
            <n-icon>
              <SendOutline />
            </n-icon>
          </template>
        </n-button>
      </div>
    </div>
    <n-text depth="3" class="composer-disclaimer">{{ props.disclaimer }}</n-text>
  </n-card>
</template>

<style scoped>
.composer {
  border-radius: 18px;
  background: var(--khz-panel);
  border: 1px solid var(--khz-border);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.composer-input {
  display: block;
}

.input-wrapper {
  position: relative;
}

.composer-input :deep(.n-input) {
  flex: 1;
  border-radius: 18px;
  --n-border: 1px solid var(--khz-input-border) !important;
  --n-border-hover: 1px solid var(--khz-input-border);
  --n-border-focus: 1px solid var(--khz-input-border);
  --n-color: var(--khz-input-bg);
  --n-color-hover: var(--khz-input-bg);
  --n-color-focus: var(--khz-input-bg);
  --n-color-disabled: var(--khz-input-bg);
  --n-text-color: var(--khz-text);
  --n-placeholder-color: var(--khz-text-muted);
  overflow: hidden;
  background-color: var(--khz-input-bg);
}

.composer-input :deep(.n-input__textarea-el) {
  background-color: transparent;
  min-height: 130px;
  line-height: 1.5;
  font-size: 0.9rem;
  padding-right: 3.5rem;
  padding-bottom: 3.5rem;
}

.composer-disclaimer {
  font-size: 0.75rem;
  padding-left: 0.25rem;
  color: var(--khz-text-muted);
}

.send-button {
  position: absolute;
  right: 1rem;
  bottom: 1rem;
}

.composer :deep(.n-button) {
  box-shadow: 0 10px 18px rgba(70, 125, 255, 0.35);
}
</style>
