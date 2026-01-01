<script setup>
import { computed } from 'vue'
import { NButton, NIcon } from 'naive-ui'
import { AddOutline } from '@vicons/ionicons5'

const props = defineProps({
  tabs: {
    type: Array,
    default: () => [],
  },
  active: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['select', 'add'])

const orderedTabs = computed(() => props.tabs)

const handleSelect = (id) => {
  emit('select', id)
}

const handleAdd = () => {
  emit('add')
}
</script>

<template>
  <div class="session-tabs">
    <div class="tab-group">
      <n-button
        v-for="tab in orderedTabs"
        :key="tab.id"
        quaternary
        class="tab-item"
        :class="{ active: tab.id === props.active }"
        size="small"
        @click="handleSelect(tab.id)"
      >
        <span class="tab-title">{{ tab.title }}</span>
      </n-button>
    </div>
    <n-button quaternary circle size="small" class="add-tab" @click="handleAdd">
      <template #icon>
        <n-icon>
          <AddOutline />
        </n-icon>
      </template>
    </n-button>
  </div>
</template>

<style scoped>
.session-tabs {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1.5rem 0rem;
  background: #070c14;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}


.tab-group {
  display: flex;
  gap: 0.35rem;
}

.tab-item {
  position: relative;
  color: rgba(255, 255, 255, 0.7);
  border-radius: 10px 10px 0 0;
  padding: 0;
  height: auto;
  --n-button-border: 1px solid transparent;
}

.tab-item :deep(.n-button__content) {
  padding: 0.45rem 0.9rem;
  font-size: 0.85rem;
  background: transparent;
}

.tab-item.active {
  color: #f6fbff;
  border-color: rgba(255, 255, 255, 0.08);
  background: #0f1624;
  box-shadow: inset 0 -2px 0 #1c64f2;
}

.tab-item.active :deep(.n-button__content) {
  background: transparent;
}

.add-tab {
  color: rgba(255, 255, 255, 0.75);
}
</style>
