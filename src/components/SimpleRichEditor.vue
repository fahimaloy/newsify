<template>
  <div class="simple-rich-editor" :class="{ 'focused': isFocused }">
    <div class="editor-toolbar">
      <div class="toolbar-group">
        <v-btn
          size="x-small"
          variant="text"
          @click="execCommand('bold')"
          icon="mdi-format-bold"
          title="Bold (Ctrl+B)"
          :color="isActive('bold') ? 'primary' : undefined"
        ></v-btn>
        <v-btn
          size="x-small"
          variant="text"
          @click="execCommand('italic')"
          icon="mdi-format-italic"
          title="Italic (Ctrl+I)"
          :color="isActive('italic') ? 'primary' : undefined"
        ></v-btn>
        <v-btn
          size="x-small"
          variant="text"
          @click="execCommand('underline')"
          icon="mdi-format-underline"
          title="Underline (Ctrl+U)"
          :color="isActive('underline') ? 'primary' : undefined"
        ></v-btn>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <v-btn
          size="x-small"
          variant="text"
          @click="execCommand('formatBlock', '<h1>')"
          title="Heading 1"
          class="font-weight-bold"
        >H1</v-btn>
        <v-btn
          size="x-small"
          variant="text"
          @click="execCommand('formatBlock', '<h2>')"
          title="Heading 2"
          class="font-weight-bold"
        >H2</v-btn>
        <v-btn
          size="x-small"
          variant="text"
          @click="execCommand('formatBlock', '<p>')"
          title="Paragraph"
        >P</v-btn>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <v-btn
          size="x-small"
          variant="text"
          @click="execCommand('insertUnorderedList')"
          icon="mdi-format-list-bulleted"
          title="Bullet List"
        ></v-btn>
        <v-btn
          size="x-small"
          variant="text"
          @click="execCommand('insertOrderedList')"
          icon="mdi-format-list-numbered"
          title="Numbered List"
        ></v-btn>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <v-btn
          size="x-small"
          variant="text"
          @click="execCommand('justifyLeft')"
          icon="mdi-format-align-left"
          title="Align Left"
        ></v-btn>
        <v-btn
          size="x-small"
          variant="text"
          @click="execCommand('justifyCenter')"
          icon="mdi-format-align-center"
          title="Align Center"
        ></v-btn>
        <v-btn
          size="x-small"
          variant="text"
          @click="execCommand('justifyRight')"
          icon="mdi-format-align-right"
          title="Align Right"
        ></v-btn>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <v-btn
          size="x-small"
          variant="text"
          @click="insertLink"
          icon="mdi-link"
          title="Insert Link"
        ></v-btn>
        <v-btn
          size="x-small"
          variant="text"
          @click="execCommand('removeFormat')"
          icon="mdi-format-clear"
          title="Clear Formatting"
        ></v-btn>
      </div>

      <v-spacer></v-spacer>

      <div class="toolbar-group">
        <v-btn
          size="x-small"
          variant="text"
          @click="execCommand('undo')"
          icon="mdi-undo"
          title="Undo"
        ></v-btn>
        <v-btn
          size="x-small"
          variant="text"
          @click="execCommand('redo')"
          icon="mdi-redo"
          title="Redo"
        ></v-btn>
      </div>
    </div>

    <div
      ref="editorRef"
      class="editor-content"
      contenteditable="true"
      @input="onInput"
      @paste="onPaste"
      @focus="isFocused = true"
      @blur="isFocused = false"
      :placeholder="placeholder"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

const props = defineProps<{
  modelValue: string;
  placeholder?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const editorRef = ref<HTMLDivElement | null>(null);
const isFocused = ref(false);

const execCommand = (command: string, value: string | undefined = undefined) => {
  document.execCommand(command, false, value);
  editorRef.value?.focus();
  checkActiveStates();
};

const insertLink = () => {
  const url = prompt('Enter the URL:');
  if (url) {
    execCommand('createLink', url);
  }
};

const onInput = () => {
  if (editorRef.value) {
    emit('update:modelValue', editorRef.value.innerHTML);
  }
};

const onPaste = (e: ClipboardEvent) => {
  e.preventDefault();
  const text = e.clipboardData?.getData('text/plain');
  if (text) {
    document.execCommand('insertText', false, text);
  }
};

// Simple active state checking (not perfect but better than nothing)
const activeStates = ref<Record<string, boolean>>({});

const checkActiveStates = () => {
  activeStates.value = {
    bold: document.queryCommandState('bold'),
    italic: document.queryCommandState('italic'),
    underline: document.queryCommandState('underline'),
  };
};

const isActive = (command: string) => activeStates.value[command];

// Initialize content
onMounted(() => {
  if (editorRef.value && props.modelValue) {
    editorRef.value.innerHTML = props.modelValue;
  }
  
  // Add listener for selection changes to update active states
  document.addEventListener('selectionchange', () => {
    if (isFocused.value) {
      checkActiveStates();
    }
  });
});

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (editorRef.value && editorRef.value.innerHTML !== newValue) {
    editorRef.value.innerHTML = newValue;
  }
});

watch(() => props.disabled, (val) => {
  if (editorRef.value) {
    editorRef.value.contentEditable = val ? 'false' : 'true';
  }
});
</script>

<style scoped>
.simple-rich-editor {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  background-color: white;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.simple-rich-editor.focused {
  border-color: #C62828; /* Primary color */
  box-shadow: 0 0 0 1px #C62828;
}

.editor-toolbar {
  padding: 8px 12px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #f8f9fa;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background-color: #e0e0e0;
  margin: 0 6px;
}

.editor-content {
  min-height: 300px;
  max-height: 600px;
  overflow-y: auto;
  padding: 20px;
  outline: none;
  font-family: 'Merriweather Sans', 'Noto Sans Bengali', sans-serif; /* Use global font */
  font-size: 16px;
  line-height: 1.6;
  color: #333;
}

.editor-content[contenteditable="false"] {
  background-color: #f5f5f5;
  color: #757575;
  cursor: not-allowed;
}

.editor-content:empty:before {
  content: attr(placeholder);
  color: #9e9e9e;
  font-style: italic;
}

/* Typography styles inside editor */
.editor-content :deep(h1) {
  font-size: 2em;
  font-weight: 700;
  margin: 0.67em 0;
  color: #1a1a1a;
}

.editor-content :deep(h2) {
  font-size: 1.5em;
  font-weight: 600;
  margin: 0.75em 0;
  color: #2c2c2c;
}

.editor-content :deep(p) {
  margin: 0.8em 0;
}

.editor-content :deep(ul),
.editor-content :deep(ol) {
  padding-left: 1.5em;
  margin: 0.8em 0;
}

.editor-content :deep(a) {
  color: #C62828;
  text-decoration: underline;
}

.editor-content :deep(blockquote) {
  border-left: 4px solid #C62828;
  padding-left: 16px;
  margin: 1em 0;
  color: #555;
  font-style: italic;
}
</style>
