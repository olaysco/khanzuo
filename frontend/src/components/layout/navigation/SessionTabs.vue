<script setup>
import { computed, ref } from 'vue'
import { NButton, NIcon, NInput } from 'naive-ui'
import { AddOutline, CreateOutline, CloseOutline } from '@vicons/ionicons5'

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

const emit = defineEmits(['select', 'add', 'rename', 'close'])

const orderedTabs = computed(() => props.tabs)
const editingTabId = ref(null)
const editingTitle = ref('')

const handleSelect = (id) => {
  emit('select', id)
}

const handleAdd = () => {
  emit('add')
}

const startEditing = (tab) => {
  editingTabId.value = tab.id
  editingTitle.value = tab.title
}

const cancelEditing = () => {
  editingTabId.value = null
  editingTitle.value = ''
}

const submitEditing = () => {
  if (!editingTabId.value) return
  const title = editingTitle.value?.trim()
  if (!title) {
    cancelEditing()
    return
  }
  emit('rename', { id: editingTabId.value, title })
  cancelEditing()
}

const handleClose = (id) => {
  emit('close', id)
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
        <div v-if="editingTabId !== tab.id" class="tab-content">
          <span class="tab-title">{{ tab.title }}</span>
          <button
            type="button"
            class="tab-edit"
            aria-label="Rename session"
            @click.stop="startEditing(tab)"
          >
            <n-icon size="14">
              <CreateOutline />
            </n-icon>
          </button>
          <button
            type="button"
            class="tab-close"
            aria-label="Close session"
            @click.stop="handleClose(tab.id)"
          >
            <n-icon size="14">
              <CloseOutline />
            </n-icon>
          </button>
        </div>
        <div v-else class="tab-editing" @click.stop>
          <n-input
            v-model:value="editingTitle"
            size="tiny"
            class="tab-input"
            autofocus
            @keyup.enter.stop.prevent="submitEditing"
            @keyup.esc.stop.prevent="cancelEditing"
            @blur="submitEditing"
          />
        </div>
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
  background: var(--khz-surface-elevated);
  border-bottom: 1px solid var(--khz-border-soft);
}


.tab-group {
  display: flex;
  gap: 0.35rem;
}

.tab-item {
  position: relative;
  color: var(--khz-text-muted);
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

.tab-content {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.tab-edit,
.tab-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--khz-icon-soft);
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease;
}

.tab-item.active .tab-edit,
.tab-item.active .tab-close {
  color: var(--khz-icon);
}

.tab-edit:hover,
.tab-close:hover {
  color: var(--khz-text);
  background: rgba(255, 255, 255, 0.1);
}

.tab-editing {
  width: 150px;
}

.tab-input :deep(.n-input__input-el) {
  font-size: 0.8rem;
  padding: 0.1rem 0.3rem;
}

.tab-item.active {
  color: var(--khz-text);
  border-color: var(--khz-border);
  background: var(--khz-card);
  box-shadow: inset 0 -2px 0 #1c64f2;
}

.tab-item.active :deep(.n-button__content) {
  background: transparent;
}

.add-tab {
  color: var(--khz-icon);
}
</style>
