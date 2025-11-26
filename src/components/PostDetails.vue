<template>
  <v-container class="post-details-container pb-16">
    <!-- Back Button -->
    <div class="mb-4">
      <v-btn
        icon="mdi-arrow-left"
        variant="text"
        @click="$router.back()"
        size="small"
      ></v-btn>
    </div>

    <div v-if="loading" class="d-flex justify-center align-center py-12">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>

    <v-alert v-else-if="error" type="error" variant="tonal" class="mb-6">
      {{ error }}
      <template v-slot:append>
        <v-btn variant="text" @click="fetchPost">Retry</v-btn>
      </template>
    </v-alert>

    <div v-else-if="post" class="post-content">
      <!-- Media Section -->
      <div class="media-section mb-6 rounded-xl overflow-hidden elevation-2">
        <!-- Video -->
        <div v-if="post.video_url" class="video-wrapper">
          <iframe
            :src="getEmbedUrl(post.video_url)"
            title="YouTube video player"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            class="video-iframe"
          ></iframe>
        </div>
        <!-- Image (if no video) -->
        <v-img
          v-else-if="post.image"
          :src="getImageUrl(post.image)"
          cover
          class="post-image"
          max-height="500"
        ></v-img>
      </div>

      <!-- Header -->
      <div class="post-header mb-6">
        <div class="d-flex flex-wrap gap-2 mb-3">
          <v-chip
            v-if="post.category"
            color="primary"
            size="small"
            variant="flat"
            :to="`/category/${getCategorySlugByName(post.category.bn_name || post.category.name)}`"
          >
            {{ post.category.bn_name || post.category.name }}
          </v-chip>
          <v-chip
            v-for="topic in post.topics"
            :key="topic.id"
            size="small"
            variant="tonal"
            color="secondary"
          >
            {{ topic.bn_name || topic.name }}
          </v-chip>
        </div>

        <h1 class="text-h4 text-md-h3 font-weight-bold mb-4 text-grey-darken-4">
          {{ post.title }}
        </h1>

        <div class="d-flex align-center text-caption text-grey-darken-1">
          <v-icon size="16" class="mr-1">mdi-calendar</v-icon>
          <span>{{ formatDate(post.created_at) }}</span>
        </div>
      </div>

      <div class="d-flex justify-space-between align-center mb-6">
        <v-divider class="flex-grow-1"></v-divider>
        <div class="d-flex align-center px-4">
          <v-btn
            icon="mdi-format-font-size-decrease"
            variant="text"
            size="small"
            color="grey-darken-1"
            @click="decreaseFontSize"
            :disabled="fontSize <= 14"
          ></v-btn>
          <span class="text-caption mx-2 text-grey">Aa</span>
          <v-btn
            icon="mdi-format-font-size-increase"
            variant="text"
            size="small"
            color="grey-darken-1"
            @click="increaseFontSize"
            :disabled="fontSize >= 24"
          ></v-btn>
        </div>
        <v-divider class="flex-grow-1"></v-divider>
      </div>

      <!-- Content -->
      <div 
        class="post-body text-grey-darken-3" 
        :style="{ fontSize: fontSize + 'px', lineHeight: (fontSize * 1.6) + 'px' }"
        v-html="sanitizeHtml(post.description)"
      ></div>
      
      <!-- Share/Actions -->
      <div class="d-flex justify-space-between align-center mt-8 mb-8">
        <v-btn
          :icon="isPostBookmarked ? 'mdi-bookmark' : 'mdi-bookmark-outline'"
          :color="isPostBookmarked ? 'primary' : 'grey'"
          variant="text"
          @click="togglePostBookmark"
          size="large"
        >
          <v-icon>{{ isPostBookmarked ? 'mdi-bookmark' : 'mdi-bookmark-outline' }}</v-icon>
        </v-btn>
        <v-btn
          variant="text"
          color="primary"
          prepend-icon="mdi-share-variant"
          @click="sharePost"
        >
          Share
        </v-btn>
      </div>

      <!-- Related Posts Section -->
      <div class="related-posts-section mt-12">
        <v-divider class="mb-6"></v-divider>
        <h2 class="text-h5 font-weight-bold mb-6">Related Posts</h2>
        
        <div v-if="relatedPosts.length > 0">
          <v-row>
            <v-col
              v-for="relatedPost in relatedPosts"
              :key="relatedPost.id"
              cols="12"
              sm="6"
              md="4"
            >
              <v-card
                :to="`/post/${relatedPost.id}`"
                class="related-post-card"
                hover
              >
                <v-img
                  :src="getImageUrl(relatedPost.image)"
                  height="150"
                  cover
                ></v-img>
                <v-card-title class="text-subtitle-1 font-weight-bold text-wrap">
                  {{ relatedPost.title }}
                </v-card-title>
                <v-card-text class="text-caption text-grey">
                  {{ formatDate(relatedPost.created_at) }}
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </div>
        
        <div v-else class="empty-state">
          <v-icon size="80" color="grey-lighten-2">mdi-post-outline</v-icon>
          <h3 class="text-h6 mt-4 text-grey">No Related Posts Found</h3>
          <p class="text-grey-lighten-1">Check back later for similar content</p>
        </div>
      </div>

      <!-- Comments Section -->
      <div class="comments-section mt-12">
        <v-divider class="mb-6"></v-divider>
        <h2 class="text-h5 font-weight-bold mb-6">
          Comments ({{ comments.length }})
        </h2>

        <!-- Comment Form -->
        <v-card v-if="isAuthenticated" class="mb-6" variant="outlined">
          <v-card-text>
            <div class="d-flex align-center mb-3">
              <v-avatar size="40" color="primary" class="mr-3">
                <span class="text-white font-weight-bold">
                  {{ user?.username?.substring(0, 2).toUpperCase() }}
                </span>
              </v-avatar>
              <span class="font-weight-medium">{{ user?.username }}</span>
            </div>
            <v-textarea
              v-model="newComment"
              label="Write a comment..."
              variant="outlined"
              rows="3"
              :disabled="submitLoading"
              hide-details
            ></v-textarea>
          </v-card-text>
          <v-card-actions class="px-4 pb-4">
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              :loading="submitLoading"
              :disabled="!newComment.trim() || submitLoading"
              @click="submitComment"
            >
              Post Comment
            </v-btn>
          </v-card-actions>
        </v-card>

        <!-- Login Prompt -->
        <v-card v-else class="mb-6" variant="outlined">
          <v-card-text class="text-center py-8">
            <v-icon size="64" color="grey-lighten-1" class="mb-4">
              mdi-comment-outline
            </v-icon>
            <h3 class="text-h6 mb-2">Join the conversation</h3>
            <p class="text-grey mb-4">You need to be logged in to comment</p>
            <v-btn color="primary" @click="goToLogin" prepend-icon="mdi-login">
              Login to Comment
            </v-btn>
          </v-card-text>
        </v-card>

        <!-- Comments List -->
        <div v-if="commentsLoading" class="text-center py-8">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>

        <div v-else-if="comments.length > 0" class="comments-list">
          <v-card
            v-for="comment in comments"
            :key="comment.id"
            class="mb-4"
            variant="outlined"
          >
            <v-card-text>
              <div class="d-flex align-center mb-3">
                <v-avatar size="36" color="grey-lighten-2" class="mr-3">
                  <span class="text-caption font-weight-bold">
                    {{ comment.author?.username?.substring(0, 2).toUpperCase() }}
                  </span>
                </v-avatar>
                <div>
                  <div class="font-weight-medium">
                    {{ comment.author?.username }}
                  </div>
                  <div class="text-caption text-grey">
                    {{ formatCommentDate(comment.created_at) }}
                  </div>
                </div>
              </div>
              <div class="comment-content">
                {{ comment.content }}
              </div>
            </v-card-text>
          </v-card>
        </div>

        <div v-else class="empty-state">
          <v-icon size="80" color="grey-lighten-2">mdi-comment-outline</v-icon>
          <h3 class="text-h6 mt-4 text-grey">No Comments Yet</h3>
          <p class="text-grey-lighten-1">Be the first to comment!</p>
        </div>
      </div>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { newsAPI, type Post } from '../services/api';
import { useAuth } from '../composables/useAuth';
import { useBookmarks } from '../composables/useBookmarks';
import { getCategorySlugByName } from '../utils/categoryHelpers';
import { sanitizeHtml } from '../utils/sanitizer';

const route = useRoute();
const router = useRouter();
const { isAuthenticated, user, getAuthHeader } = useAuth();
const { init: initBookmarks, isBookmarked, toggleBookmark } = useBookmarks();

const post = ref<Post | null>(null);
const relatedPosts = ref<Post[]>([]);
const comments = ref<any[]>([]);
const newComment = ref('');
const loading = ref(true);
const error = ref<string | null>(null);
const commentsLoading = ref(false);
const submitLoading = ref(false);
const fontSize = ref(18); // Default font size

const increaseFontSize = () => {
  if (fontSize.value < 24) fontSize.value += 2;
};

const decreaseFontSize = () => {
  if (fontSize.value > 14) fontSize.value -= 2;
};

const isPostBookmarked = computed(() => {
  if (!post.value) return false;
  return isBookmarked(post.value.id).value;
});

const togglePostBookmark = async () => {
  if (!post.value) return;
  await toggleBookmark(post.value.id);
};

const fetchPost = async () => {
  const id = Number(route.params.id);
  if (!id) {
    error.value = "Invalid post ID";
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    // Try to fetch from API directly for fresh data
    const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:8000";
    const response = await fetch(`${API_BASE_URL}/api/v1/posts/${id}`);
    
    if (response.ok) {
      // Successfully fetched from server
      post.value = await response.json();
      
      // Save to cache for offline access
      const { savePost } = await import('../services/db');
      await savePost(post.value);
    } else if (response.status === 404) {
      // Post not found on server, try to load from cache
      console.log('Post not found on server, loading from cache...');
      const { getPost } = await import('../services/db');
      const cachedPost = await getPost(id);
      
      if (cachedPost) {
        post.value = cachedPost;
        console.log('Loaded post from cache');
      } else {
        throw new Error('Post not found');
      }
    } else {
      throw new Error('Failed to load post');
    }
    
    // Fetch related posts and comments
    await Promise.all([fetchRelatedPosts(), fetchComments()]);
  } catch (err) {
    console.error(err);
    
    // Last resort: try to load from cache
    try {
      const { getPost } = await import('../services/db');
      const cachedPost = await getPost(id);
      
      if (cachedPost) {
        post.value = cachedPost;
        error.value = null; // Clear error since we found cached data
        console.log('Loaded post from cache (error fallback)');
        
        // Still try to fetch related posts and comments
        await Promise.all([fetchRelatedPosts(), fetchComments()]);
      } else {
        error.value = "Failed to load post. Please try again.";
      }
    } catch (cacheErr) {
      console.error('Cache error:', cacheErr);
      error.value = "Failed to load post. Please try again.";
    }
  } finally {
    loading.value = false;
  }
};

const fetchRelatedPosts = async () => {
  if (!post.value) {
    relatedPosts.value = [];
    return;
  }

  try {
    const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:8000";
    
    // Build query params for topics and category
    const queryParts: string[] = [];
    
    if (post.value.topics && post.value.topics.length > 0) {
      const topicIds = post.value.topics.map(t => `topic_ids=${t.id}`);
      queryParts.push(...topicIds);
    }
    
    if (post.value.category) {
      queryParts.push(`category_id=${post.value.category.id}`);
    }
    
    if (queryParts.length === 0) {
      relatedPosts.value = [];
      return;
    }
    
    const queryString = queryParts.join('&');
    const response = await fetch(`${API_BASE_URL}/api/v1/posts/?${queryString}&limit=50`);
    
    if (response.ok) {
      const posts: Post[] = await response.json();
      // Filter out current post and limit to 5-8 related posts
      relatedPosts.value = posts
        .filter(p => p.id !== post.value?.id && p.status === 'published')
        .slice(0, 8);
    }
  } catch (err) {
    console.error('Failed to fetch related posts:', err);
    relatedPosts.value = [];
  }
};

const fetchComments = async () => {
  if (!post.value) return;
  
  commentsLoading.value = true;
  try {
    const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:8000";
    const response = await fetch(`${API_BASE_URL}/api/v1/posts/${post.value.id}/comments`);
    
    if (response.ok) {
      comments.value = await response.json();
    }
  } catch (err) {
    console.error('Failed to fetch comments:', err);
    comments.value = [];
  } finally {
    commentsLoading.value = false;
  }
};

const submitComment = async () => {
  if (!newComment.value.trim() || !post.value) return;
  
  submitLoading.value = true;
  try {
    const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:8000";
    const response = await fetch(`${API_BASE_URL}/api/v1/posts/${post.value.id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      } as HeadersInit,
      body: JSON.stringify({ content: newComment.value })
    });
    
    if (response.ok) {
      newComment.value = '';
      await fetchComments();
    } else {
      alert('Failed to submit comment');
    }
  } catch (err) {
    console.error('Failed to submit comment:', err);
    alert('Failed to submit comment');
  } finally {
    submitLoading.value = false;
  }
};

const goToLogin = () => {
  router.push('/login');
};

const getImageUrl = (path?: string) => {
  return newsAPI.getImageURL(path);
};

const getEmbedUrl = (url: string) => {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11)
    ? `https://www.youtube.com/embed/${match[2]}`
    : '';
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatCommentDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return formatDate(dateString);
};

const sharePost = () => {
  if (navigator.share) {
    navigator.share({
      title: post.value?.title,
      text: 'Check out this post!',
      url: window.location.href,
    });
  } else {
    // Fallback or copy to clipboard
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  }
};

onMounted(() => {
  initBookmarks();
  fetchPost();
});

watch(() => route.params.id, () => {
  fetchPost();
});
</script>

<style scoped>
.post-details-container {
  max-width: 900px;
  margin: 0 auto;
}

.video-wrapper {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 */
  height: 0;
  background-color: #000;
}

.video-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.post-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 16px 0;
}

.post-body :deep(p) {
  margin-bottom: 16px;
  line-height: 1.8;
  font-size: 1.1rem;
}

.post-body :deep(h1), 
.post-body :deep(h2), 
.post-body :deep(h3) {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: bold;
  color: #333;
}

.post-body :deep(a) {
  color: #C62828;
  text-decoration: underline;
}

.post-body :deep(ul), 
.post-body :deep(ol) {
  margin-bottom: 16px;
  padding-left: 24px;
}

.gap-2 {
  gap: 8px;
}

.related-post-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.related-post-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.comment-content {
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.comments-list {
  max-width: 100%;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
  background-color: #fafafa;
  border-radius: 12px;
}
</style>

