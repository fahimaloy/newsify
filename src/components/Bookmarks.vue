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

    <v-container class="bookmarks-container pb-16">
      <h1 class="text-h4 font-weight-bold mb-6">Saved Posts</h1>

      <div v-if="loading" class="text-center py-12">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      </div>

      <div v-else-if="bookmarkedPosts.length > 0">
        <v-row>
          <v-col
            v-for="post in bookmarkedPosts"
            :key="post.id"
            cols="12"
            sm="6"
            md="4"
          >
            <v-card class="bookmark-card position-relative" hover>
              <v-btn
                icon="mdi-bookmark"
                color="primary"
                class="remove-bookmark-btn"
                size="small"
                @click="handleRemoveBookmark(post.id)"
              ></v-btn>

              <router-link :to="`/post/${post.id}`" class="card-link">
                <v-img
                  :src="getImageUrl(post.image)"
                  height="200"
                  cover
                ></v-img>
                <v-card-title class="text-subtitle-1 font-weight-bold text-wrap">
                  {{ post.title }}
                </v-card-title>
                <v-card-text class="text-caption text-grey">
                  {{ formatDate(post.created_at) }}
                </v-card-text>
              </router-link>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <div v-else class="empty-state">
        <v-icon size="120" color="grey-lighten-2">mdi-bookmark-outline</v-icon>
        <h2 class="text-h5 mt-6 text-grey">No Saved Posts</h2>
        <p class="text-grey-lighten-1 mt-2">Posts you bookmark will appear here</p>
        <v-btn color="primary" to="/" class="mt-4">Browse Posts</v-btn>
      </div>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useBookmarks } from '../composables/useBookmarks';
import { useAuth } from '../composables/useAuth';
import { newsAPI, type Post } from '../services/api';

const { getBookmarkedIds, removeBookmark, init: initBookmarks, refreshFromServer } = useBookmarks();
const { isAuthenticated } = useAuth();

const bookmarkedPosts = ref<Post[]>([]);
const loading = ref(true);

// Pull to refresh state
const touchStart = ref(0);
const pullDistance = ref(0);
const isPulling = ref(false);

const fetchBookmarkedPosts = async () => {
  loading.value = true;
  try {
    const bookmarkIds = getBookmarkedIds.value;
    
    if (bookmarkIds.length === 0) {
      bookmarkedPosts.value = [];
      loading.value = false;
      return;
    }

    // Load posts from local cache (IndexedDB)
    const { getPost } = await import('../services/db');
    const promises = bookmarkIds.map(async (id) => {
      try {
        const cachedPost = await getPost(id);
        return cachedPost;
      } catch (err) {
        console.error(`Failed to load post ${id} from cache:`, err);
        return null;
      }
    });
    
    const results = await Promise.all(promises);
    bookmarkedPosts.value = results.filter(p => p != null) as Post[];
    
    console.log(`Loaded ${bookmarkedPosts.value.length} bookmarked posts from local cache`);
  } catch (e) {
    console.error('Failed to fetch bookmarked posts from cache', e);
    bookmarkedPosts.value = [];
  } finally {
    loading.value = false;
  }
};

const handleRemoveBookmark = async (postId: number) => {
  await removeBookmark(postId);
  await fetchBookmarkedPosts();
};

const getImageUrl = (path?: string) => {
  return newsAPI.getImageURL(path);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Pull to refresh handlers
const handleTouchStart = (e: TouchEvent) => {
  const container = e.currentTarget as HTMLElement;
  if (container.scrollTop === 0) {
    touchStart.value = e.touches[0].clientY;
    isPulling.value = true;
  }
};

const handleTouchMove = (e: TouchEvent) => {
  if (isPulling.value) {
    const container = e.currentTarget as HTMLElement;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStart.value;
    if (diff > 0 && container.scrollTop === 0) {
      pullDistance.value = Math.min(diff, 150); // Cap at 150px
    }
  }
};

const handleTouchEnd = async () => {
  if (isPulling.value && pullDistance.value > 100) {
    // Trigger refresh from server
    console.log('Pull-to-refresh: Syncing bookmarks from server...');
    
    if (isAuthenticated.value) {
      try {
        // Refresh bookmarks from server
        await refreshFromServer();
        
        // Reload posts from local cache (which now has fresh data)
        await fetchBookmarkedPosts();
        
        console.log('Bookmarks synced from server successfully');
      } catch (err) {
        console.error('Failed to sync bookmarks from server:', err);
      }
    } else {
      // Just reload from cache if not authenticated
      await fetchBookmarkedPosts();
    }
  }
  isPulling.value = false;
  pullDistance.value = 0;
};

onMounted(async () => {
  await initBookmarks();
  await fetchBookmarkedPosts();
});
</script>

<style scoped>
.bookmarks-container {
  max-width: 1200px;
  margin: 0 auto;
}

.bookmark-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.bookmark-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.remove-bookmark-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  background-color: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(4px);
}

.card-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.empty-state {
  text-align: center;
  padding: 80px 24px;
}
</style>
