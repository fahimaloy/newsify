<template>
  <div
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <!-- Pull indicator -->
    <div 
      v-if="pullDistance > 0" 
      class="d-flex align-center justify-center" 
      :style="{ 
        height: pullDistance + 'px', 
        overflow: 'hidden', 
        transition: isPulling ? 'none' : 'height 0.3s',
        opacity: Math.min(pullDistance / 100, 1)
      }"
    >
      <v-icon 
        color="primary" 
        :style="{ transform: `rotate(${pullDistance * 3.6}deg)` }"
      >
        mdi-refresh
      </v-icon>
      <span class="text-caption text-grey ml-2">
        {{ pullDistance > 100 ? 'Release to refresh' : 'Pull to refresh' }}
      </span>
    </div>

    <!-- Loading state -->
    <v-container v-if="loading" class="text-center py-10">
      <v-progress-circular
        indeterminate
        color="primary"
        size="64"
      ></v-progress-circular>
      <p class="mt-4 text-grey">Loading news...</p>
    </v-container>

    <!-- Error state with fallback option -->
    <v-container v-else-if="error" class="text-center py-10">
      <v-icon size="100" color="warning" class="mb-4">
        mdi-alert-circle-outline
      </v-icon>
      <h2 class="text-h5 text-grey-darken-2 mb-3">Unable to Load News</h2>
      <p class="text-body-1 text-grey mb-4">
        {{ error }}
      </p>
      <v-btn
        color="primary"
        variant="elevated"
        prepend-icon="mdi-refresh"
        @click="retryFetch"
        class="mb-3"
      >
        Retry
      </v-btn>
      <br />
      <v-btn
        color="secondary"
        variant="outlined"
        prepend-icon="mdi-file-document-outline"
        @click="useFallbackData"
        size="small"
      >
        Load Sample Data
      </v-btn>
      <p class="text-caption text-grey-lighten-1 mt-4">
        Make sure the backend server is running at {{ apiBaseUrl }}
      </p>
    </v-container>

    <!-- Empty state -->
    <v-container
      v-else-if="sliderArticles.length === 0 && mainArticles.length === 0"
      class="text-center py-16"
    >
      <v-icon size="120" color="grey-lighten-1" class="mb-4">
        mdi-newspaper-variant-outline
      </v-icon>
      <h2 class="text-h4 text-grey-darken-1 mb-2">No News Available</h2>
      <p class="text-body-1 text-grey">
        There are currently no published news articles to display.
      </p>
      <p class="text-body-2 text-grey-lighten-1 mt-2">
        Check back later for updates!
      </p>
    </v-container>

    <!-- Content -->
    <div v-else>
      <PostSlider
        v-if="sliderArticles.length > 0"
        :slides="sliderArticles"
        @current-slide-title="updateActiveSliderTitle($event)"
        v-model:currentSlideIndex="currentSlideIndex"
      />

      <v-container>
        <v-row>
          <v-col
            cols="12"
            class="py-1"
            v-for="article in mainArticles"
            :key="article.id"
          >
            <v-card class="custom-card-border mb-2 position-relative">
              <v-btn
                :icon="isBookmarked(article.id).value ? 'mdi-bookmark' : 'mdi-bookmark-outline'"
                :color="isBookmarked(article.id).value ? 'primary' : 'white'"
                class="bookmark-btn"
                size="small"
                @click.prevent="toggleBookmark(article.id)"
              ></v-btn>
              
              <router-link :to="`/post/${article.id}`" class="card-link">
                <v-img :src="article.image" height="200px" cover></v-img>

                <div class="post-details-container">
                  <div class="post-details">
                    <div class="category">{{ article.category }}</div>
                    <div class="date">{{ article.date }}</div>
                  </div>
                </div>

                <v-card-title
                  class="single-post-title text-wrap font-weight-bold"
                  >{{ article.title }}</v-card-title
                >

                <v-card-text class="description-text">{{
                  article.snippet
                }}</v-card-text>
              </router-link>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, onMounted, computed } from "vue";
import PostSlider from "./PostSlider.vue";
import { useNews } from "../composables/useNews";
import { useBookmarks } from "../composables/useBookmarks";
import articlesData from "../data/articles.json";

const {
  sliderArticles,
  mainArticles,
  fetchPosts,
  setFallbackData,
  loading,
  error,
} = useNews();

const { init: initBookmarks, isBookmarked, toggleBookmark } = useBookmarks();

const currentSlideIndex = ref(0);
const usingFallback = ref(false);

// Inject the updater function from App.vue
const updateActiveSliderTitle = inject<(title: string) => void>(
  "updateActiveSliderTitle",
  () => {}
);

// API base URL for display
const apiBaseUrl = computed(
  () => import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
);

// Retry fetching from API
const retryFetch = async () => {
  usingFallback.value = false;
  await fetchPosts({ limit: 100 });
};

// Use fallback static data
const useFallbackData = () => {
  usingFallback.value = true;
  setFallbackData(articlesData);
};

// Fetch posts when component mounts
onMounted(async () => {
  initBookmarks();
  // We rely on App.vue to initialize the store (offline-first)
  // But if we want to ensure we have data or trigger a refresh on mount if stale:
  // await fetchPosts(); 
  // For now, let's just let the store state drive the UI.
});

// Pull to refresh logic
const touchStart = ref(0);
const pullDistance = ref(0);
const isPulling = ref(false);

const handleTouchStart = (e: TouchEvent) => {
  if (window.scrollY === 0) {
    touchStart.value = e.touches[0].clientY;
    isPulling.value = true;
  }
};

const handleTouchMove = (e: TouchEvent) => {
  if (isPulling.value) {
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStart.value;
    if (diff > 0 && window.scrollY === 0) {
      pullDistance.value = Math.min(diff, 150); // Cap at 150px
    }
  }
};

const handleTouchEnd = async () => {
  if (isPulling.value && pullDistance.value > 100) {
    await fetchPosts();
  }
  isPulling.value = false;
  pullDistance.value = 0;
};
</script>

<style scoped>
.post-details-container {
  padding: 0 16px; /* Horizontal padding like v-card-text */
}
.post-details {
  clear: both;
  margin-top: 12px;
}
.post-details::after {
  content: "";
  clear: both;
  display: table;
}

.category {
  float: left;
  font-size: 12px;
  font-weight: bold;
  background: #ed1c24;
  padding: 14px 15px 13px 14px;
  color: #fff;
}

.date {
  float: left;
  font-size: 12px;
  color: #7c7c7c;
  border: 1px solid #e9e9e9;
  border-left: none;
  padding: 13px 14px 12px 13px;
  height: 44px; /* Match height of category */
  display: flex;
  align-items: center;
}

/* Custom border for v-card */
.custom-card-border {
  border: 1px solid #d0d0d0 !important;
  box-shadow: none !important;
}

/* New CSS for description text */
.description-text {
  /* This color is a medium-dark gray, making it look lighter/grayer than the default black text */
  color: #616161 !important;
  /* You can make it slightly smaller/lighter if needed, but color change is enough for requested look */
}

.bookmark-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  background-color: rgba(0, 0, 0, 0.5) !important;
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
}

.bookmark-btn:hover {
  transform: scale(1.1);
  background-color: rgba(0, 0, 0, 0.7) !important;
}

.card-link {
  text-decoration: none;
  color: inherit;
  display: block;
}
</style>
