<template>
  <div class="category-tree-item">
    <!-- Drop Zone Before -->
    <div
      class="drop-zone before"
      :class="{ 'active': isDragOver === 'before' }"
      @dragover.prevent.stop="onDragOver($event, 'before')"
      @dragleave.stop="onDragLeave"
      @drop.stop="onDrop($event, 'before')"
    ></div>

    <div
      class="category-content d-flex align-center py-3 px-4 rounded-lg mb-1 elevation-1"
      :class="{ 'dragging': isDragging, 'drag-over-inside': isDragOver === 'inside' }"
      draggable="true"
      @dragstart.stop="onDragStart"
      @dragover.prevent.stop="onDragOver($event, 'inside')"
      @dragleave.stop="onDragLeave"
      @drop.stop="onDrop($event, 'inside')"
      @dragend="onDragEnd"
    >
      <!-- Drag Handle -->
      <v-icon
        class="drag-handle mr-3 cursor-move text-grey-darken-1"
        size="small"
      >mdi-drag</v-icon>

      <!-- Expand/Collapse Toggle -->
      <v-btn
        v-if="hasChildren"
        icon
        variant="text"
        size="x-small"
        density="comfortable"
        class="mr-2"
        @click="toggleExpand"
      >
        <v-icon size="20" color="grey-darken-2">{{ isExpanded ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon>
      </v-btn>
      <div v-else class="spacer-icon mr-2"></div>

      <!-- Category Name -->
      <div class="flex-grow-1 d-flex align-center flex-wrap">
        <span class="text-body-1 font-weight-bold text-grey-darken-3">{{ category.bn_name || category.name }}</span>
        <span v-if="category.bn_name" class="text-caption text-grey ml-2">({{ category.name }})</span>
      </div>

      <!-- Actions -->
      <div class="actions ml-2">
        <v-btn
          icon
          variant="text"
          size="small"
          color="primary"
          @click="$emit('edit', category)"
          class="mr-1"
        >
          <v-icon size="20">mdi-pencil</v-icon>
        </v-btn>
        <v-btn
          icon
          variant="text"
          size="small"
          color="error"
          @click="$emit('delete', category)"
        >
          <v-icon size="20">mdi-delete</v-icon>
        </v-btn>
      </div>
    </div>

    <!-- Drop Zone After (only if no children or collapsed) -->
    <div
      v-if="!hasChildren || !isExpanded"
      class="drop-zone after"
      :class="{ 'active': isDragOver === 'after' }"
      @dragover.prevent.stop="onDragOver($event, 'after')"
      @dragleave.stop="onDragLeave"
      @drop.stop="onDrop($event, 'after')"
    ></div>

    <!-- Children -->
    <div v-if="hasChildren && isExpanded" class="children-container pl-4 ml-4 border-l">
      <CategoryTreeItem
        v-for="child in children"
        :key="child.id"
        :category="child"
        :all-categories="allCategories"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
        @reorder="$emit('reorder', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineProps, defineEmits } from 'vue';
import type { Category } from '../services/api';

// Extend Category type locally to include optional order
interface ExtendedCategory extends Category {
  order?: number;
}

const props = defineProps<{
  category: Category;
  allCategories: Category[];
}>();

const emit = defineEmits<{
  (e: 'edit', category: Category): void;
  (e: 'delete', category: Category): void;
  (e: 'reorder', payload: { draggedId: number; targetId: number; position: 'before' | 'after' | 'inside' }): void;
}>();

const isExpanded = ref(true);
const isDragging = ref(false);
const isDragOver = ref<string | null>(null);



const children = computed(() => {
  return (props.allCategories as ExtendedCategory[])
    .filter(c => c.parent_id === props.category.id)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
});

const hasChildren = computed(() => children.value.length > 0);

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

const onDragStart = (e: DragEvent) => {
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', props.category.id.toString());
    isDragging.value = true;
  }
};

const onDragOver = (_e: DragEvent, position: string) => {
  isDragOver.value = position;
};

const onDragLeave = () => {
  isDragOver.value = null;
};

const onDrop = (e: DragEvent, position: string) => {
  isDragOver.value = null;
  const draggedId = parseInt(e.dataTransfer?.getData('text/plain') || '0');
  
  if (draggedId && draggedId !== props.category.id) {
    emit('reorder', { draggedId, targetId: props.category.id, position: position as 'before' | 'after' | 'inside' });
  }
};

const onDragEnd = () => {
  isDragging.value = false;
  isDragOver.value = null;
};
</script>

<style scoped>
.category-tree-item {
  position: relative;
}

.category-content {
  background-color: white;
  transition: all 0.2s ease;
  border: 1px solid rgba(0,0,0,0.05);
}

.category-content:hover {
  background-color: #fafafa;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.category-content.drag-over-inside {
  background-color: #e3f2fd;
  border: 2px dashed #1976D2;
}

.category-content.dragging {
  opacity: 0.4;
  background-color: #f5f5f5;
}

.drop-zone {
  height: 4px;
  margin: 2px 0;
  border-radius: 2px;
  transition: all 0.2s;
}

.drop-zone.active {
  height: 8px;
  background-color: #1976D2;
  box-shadow: 0 0 4px rgba(25, 118, 210, 0.5);
}

.spacer-icon {
  width: 28px;
  height: 28px;
}

.children-container {
  border-left: 2px solid #f0f0f0;
}

.cursor-move {
  cursor: grab;
}

.cursor-move:active {
  cursor: grabbing;
}

.border-l {
  border-left: 1px solid #e0e0e0;
}
</style>
