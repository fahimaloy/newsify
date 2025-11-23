<template>
  <div class="rich-editor">
    <div v-if="editor" class="editor-toolbar">
      <v-btn-group density="compact" variant="outlined">
        <v-btn
          size="small"
          :class="{ 'is-active': editor.isActive('bold') }"
          @click="editor.chain().focus().toggleBold().run()"
          icon="mdi-format-bold"
          title="Bold"
        ></v-btn>
        <v-btn
          size="small"
          :class="{ 'is-active': editor.isActive('italic') }"
          @click="editor.chain().focus().toggleItalic().run()"
          icon="mdi-format-italic"
          title="Italic"
        ></v-btn>
        <v-btn
          size="small"
          :class="{ 'is-active': editor.isActive('underline') }"
          @click="editor.chain().focus().toggleUnderline().run()"
          icon="mdi-format-underline"
          title="Underline"
        ></v-btn>
      </v-btn-group>

      <v-btn-group density="compact" variant="outlined" class="ml-2">
        <v-btn
          size="small"
          :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
          @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
          title="Heading 1"
        >H1</v-btn>
        <v-btn
          size="small"
          :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
          title="Heading 2"
        >H2</v-btn>
        <v-btn
          size="small"
          :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
          @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
          title="Heading 3"
        >H3</v-btn>
      </v-btn-group>

      <v-btn-group density="compact" variant="outlined" class="ml-2">
        <v-btn
          size="small"
          :class="{ 'is-active': editor.isActive('bulletList') }"
          @click="editor.chain().focus().toggleBulletList().run()"
          icon="mdi-format-list-bulleted"
          title="Bullet List"
        ></v-btn>
        <v-btn
          size="small"
          :class="{ 'is-active': editor.isActive('orderedList') }"
          @click="editor.chain().focus().toggleOrderedList().run()"
          icon="mdi-format-list-numbered"
          title="Numbered List"
        ></v-btn>
      </v-btn-group>

      <v-btn-group density="compact" variant="outlined" class="ml-2">
        <v-btn
          size="small"
          :class="{ 'is-active': editor.isActive({ textAlign: 'left' }) }"
          @click="editor.chain().focus().setTextAlign('left').run()"
          icon="mdi-format-align-left"
          title="Align Left"
        ></v-btn>
        <v-btn
          size="small"
          :class="{ 'is-active': editor.isActive({ textAlign: 'center' }) }"
          @click="editor.chain().focus().setTextAlign('center').run()"
          icon="mdi-format-align-center"
          title="Align Center"
        ></v-btn>
        <v-btn
          size="small"
          :class="{ 'is-active': editor.isActive({ textAlign: 'right' }) }"
          @click="editor.chain().focus().setTextAlign('right').run()"
          icon="mdi-format-align-right"
          title="Align Right"
        ></v-btn>
      </v-btn-group>

      <v-btn-group density="compact" variant="outlined" class="ml-2">
        <v-btn
          size="small"
          :class="{ 'is-active': editor.isActive('blockquote') }"
          @click="editor.chain().focus().toggleBlockquote().run()"
          icon="mdi-format-quote-close"
          title="Quote"
        ></v-btn>
        <v-btn
          size="small"
          @click="editor.chain().focus().setHorizontalRule().run()"
          icon="mdi-minus"
          title="Horizontal Rule"
        ></v-btn>
      </v-btn-group>

      <v-btn-group density="compact" variant="outlined" class="ml-2">
        <v-btn
          size="small"
          @click="editor.chain().focus().undo().run()"
          :disabled="!editor.can().undo()"
          icon="mdi-undo"
          title="Undo"
        ></v-btn>
        <v-btn
          size="small"
          @click="editor.chain().focus().redo().run()"
          :disabled="!editor.can().redo()"
          icon="mdi-redo"
          title="Redo"
        ></v-btn>
      </v-btn-group>
    </div>

    <editor-content :editor="editor" class="editor-content" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue';
import { Editor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const editor = ref<Editor | null>(null);

// Initialize editor
editor.value = new Editor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Underline,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML());
  },
  editorProps: {
    attributes: {
      class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none',
    },
  },
});

// Watch for external changes
watch(() => props.modelValue, (value) => {
  const isSame = editor.value?.getHTML() === value;
  if (!isSame && editor.value) {
    editor.value.commands.setContent(value, false);
  }
});

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<style scoped>
.rich-editor {
  border: 1px solid rgba(0, 0, 0, 0.23);
  border-radius: 4px;
  overflow: hidden;
}

.editor-toolbar {
  padding: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  background-color: #f5f5f5;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.editor-toolbar .is-active {
  background-color: #C62828 !important;
  color: white !important;
}

.editor-content {
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
  padding: 16px;
}

.editor-content :deep(.ProseMirror) {
  outline: none;
  min-height: 200px;
}

.editor-content :deep(.ProseMirror p) {
  margin: 0.5em 0;
}

.editor-content :deep(.ProseMirror h1) {
  font-size: 2em;
  font-weight: bold;
  margin: 0.67em 0;
}

.editor-content :deep(.ProseMirror h2) {
  font-size: 1.5em;
  font-weight: bold;
  margin: 0.75em 0;
}

.editor-content :deep(.ProseMirror h3) {
  font-size: 1.17em;
  font-weight: bold;
  margin: 0.83em 0;
}

.editor-content :deep(.ProseMirror ul),
.editor-content :deep(.ProseMirror ol) {
  padding-left: 1.5em;
  margin: 0.5em 0;
}

.editor-content :deep(.ProseMirror blockquote) {
  border-left: 3px solid #C62828;
  padding-left: 1em;
  margin: 1em 0;
  font-style: italic;
  color: #666;
}

.editor-content :deep(.ProseMirror hr) {
  border: none;
  border-top: 2px solid #ddd;
  margin: 1em 0;
}

.editor-content :deep(.ProseMirror strong) {
  font-weight: bold;
}

.editor-content :deep(.ProseMirror em) {
  font-style: italic;
}

.editor-content :deep(.ProseMirror u) {
  text-decoration: underline;
}
</style>
