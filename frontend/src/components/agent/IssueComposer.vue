<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NCard, NButton, NText, NInput, NSpace, NIcon } from 'naive-ui'
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
const { t } = useI18n()

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
  background: #0c1422;
  border: 1px solid rgba(255, 255, 255, 0.05);
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
  --n-border: 1px solid rgba(255, 255, 255, 0.6) !important;
  --n-border-hover: 1px solid rgba(148, 163, 184, 0.8);
  --n-border-focus: 1px solid rgba(148, 163, 184, 0.9);
  --n-color: #040914;
  --n-color-hover: #040914;
  --n-color-focus: #040914;
  --n-color-disabled: #040914;
  --n-text-color: rgba(255, 255, 255, 0.9);
  --n-placeholder-color: rgba(148, 163, 184, 0.8);
  overflow: hidden;
  background-color: #040914;
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
  opacity: 0.55;
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
