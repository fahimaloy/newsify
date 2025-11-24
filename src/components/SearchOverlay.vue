<template>
  <v-overlay
    v-model="isActive"
    class="search-overlay"
    content-class="search-content"
    transition="dialog-bottom-transition"
    scroll-strategy="block"
  >
    <div class="search-container">
      <!-- Header with Search Input -->
      <div class="search-header pt-12 px-4 pb-4">
        <div class="d-flex align-center mb-4">
          <v-text-field
            v-model="searchQuery"
            placeholder="Search news..."
            variant="solo"
            bg-color="white"
            prepend-inner-icon="mdi-magnify"
            clearable
            autofocus
            rounded="xl"
            hide-details
            class="search-input elevation-4"
            @update:model-value="handleSearch"
          ></v-text-field>
          <v-btn
            icon="mdi-close"
            variant="text"
            color="white"
            class="ml-2"
            @click="close"
          ></v-btn>
        </div>
      </div>

      <!-- Results Area -->
      <div class="search-results px-4 pb-16">
        <!-- Loading -->
        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate color="white"></v-progress-circular>
        </div>

        <!-- Suggestions / Results -->
        <template v-else>
          <div class="text-subtitle-1 font-weight-bold text-white mb-3">
            {{ searchQuery ? 'Search Results' : 'Trending News' }}
          </div>

          <div v-if="displayPosts.length > 0" class="results-grid">
            <v-card
              v-for="post in displayPosts"
              :key="post.id"
              class="search-card mb-3"
              :to="`/post/${post.id}`"
              @click="close"
            >
              <div class="d-flex">
                <v-avatar rounded="0" size="80" class="ma-0">
                  <v-img :src="post.image" cover></v-img>
                </v-avatar>
                <div class="pa-3 overflow-hidden">
                  <div class="text-subtitle-2 font-weight-bold text-truncate mb-1">
                    {{ post.title }}
                  </div>
                  <div class="text-caption text-grey text-truncate">
                    {{ post.category }} • {{ post.date }}
                  </div>
                </div>
              </div>
            </v-card>
          </div>

          <div v-else class="text-center py-8">
            <v-icon size="48" color="white" class="opacity-50 mb-2">mdi-text-search</v-icon>
            <div class="text-white opacity-70">No results found</div>
          </div>
        </template>
      </div>
    </div>
  </v-overlay>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useNews } from '../composables/useNews';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const { mainArticles } = useNews();
const searchQuery = ref('');
const loading = ref(false);

const isActive = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// Computed property for filtering posts
const displayPosts = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  const posts = mainArticles.value;

  if (!query) {
    // Return first 5 posts as suggestions/trending
    return posts.slice(0, 5);
  }

  return posts.filter((post: any) => 
    post.title.toLowerCase().includes(query) || 
    post.snippet.toLowerCase().includes(query) ||
    post.category.toLowerCase().includes(query)
  ).slice(0, 20); // Limit results
});

const handleSearch = () => {
  // Simulating network delay for "premium" feel if we were fetching
  // For local filtering, it's instant, but we can add a tiny debounce if needed
};

const close = () => {
  emit('update:modelValue', false);
  searchQuery.value = '';
};

// Watch for opening to reset
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    searchQuery.value = '';
  }
});
</script>

<style scoped>
.search-overlay {
  align-items: flex-start;
  justify-content: center;
}

:deep(.search-content) {
  width: 100%;
  height: 100%;
  max-width: 600px; /* Limit width on desktop */
  margin: 0 auto;
  background: rgba(20, 20, 20, 0.85) !important;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  overflow-y: auto;
}

.search-container {
  min-height: 100%;
  width: 100%;
}

.search-input :deep(.v-field) {
  border-radius: 24px;
}

.search-card {
  background: rgba(255, 255, 255, 0.95) !important;
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s;
}

.search-card:active {
  transform: scale(0.98);
}
</style>
