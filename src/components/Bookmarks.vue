<template>
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
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useBookmarks } from '../composables/useBookmarks';
import { useAuth } from '../composables/useAuth';
import { newsAPI, type Post } from '../services/api';

const { getBookmarkedIds, removeBookmark, init: initBookmarks } = useBookmarks();
const { isAuthenticated, getAuthHeader } = useAuth();

const bookmarkedPosts = ref<Post[]>([]);
const loading = ref(true);

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8000';

const fetchBookmarkedPosts = async () => {
  loading.value = true;
  try {
    const bookmarkIds = getBookmarkedIds.value;
    
    if (bookmarkIds.length === 0) {
      bookmarkedPosts.value = [];
      loading.value = false;
      return;
    }

    // If authenticated, fetch from server
    if (isAuthenticated.value) {
      const response = await fetch(`${API_BASE_URL}/api/v1/bookmarks/`, {
        headers: getAuthHeader() as HeadersInit
      });

      if (response.ok) {
        const serverBookmarks = await response.json();
        bookmarkedPosts.value = serverBookmarks.map((b: any) => b.post).filter((p: any) => p != null);
      } else {
        console.error('Failed to fetch bookmarks from server');
        // Fallback to fetching individual posts
        await fetchPostsByIds(bookmarkIds);
      }
    } else {
      // For unauthenticated users, fetch posts by IDs
      await fetchPostsByIds(bookmarkIds);
    }
  } catch (e) {
    console.error('Failed to fetch bookmarked posts', e);
    bookmarkedPosts.value = [];
  } finally {
    loading.value = false;
  }
};

const fetchPostsByIds = async (ids: number[]) => {
  try {
    const promises = ids.map(id =>
      fetch(`${API_BASE_URL}/api/v1/posts/${id}`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null)
    );
    const results = await Promise.all(promises);
    bookmarkedPosts.value = results.filter(p => p != null);
  } catch (e) {
    console.error('Failed to fetch posts by IDs', e);
    bookmarkedPosts.value = [];
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
