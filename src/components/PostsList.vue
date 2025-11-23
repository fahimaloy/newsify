<template>
  <v-container class="posts-list-container pb-16">
    <div class="d-flex align-center justify-space-between mb-6">
      <div class="d-flex align-center">
        <v-icon size="36" color="primary" class="mr-3">mdi-post</v-icon>
        <h1 class="text-h4 font-weight-bold">All Posts</h1>
      </div>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        to="/create-post"
        elevation="2"
      >
        Create Post
      </v-btn>
    </div>

    <v-card elevation="2" class="rounded-lg">
      <v-card-title class="d-flex align-center pa-4">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Search posts"
          single-line
          hide-details
          variant="outlined"
          density="compact"
          class="mr-4"
          style="max-width: 300px"
        ></v-text-field>
        <v-spacer></v-spacer>
        <v-btn
          variant="outlined"
          color="grey-darken-2"
          prepend-icon="mdi-filter-variant"
          @click="filterDialog = true"
        >
          Filters
        </v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <v-data-table
        :headers="headers"
        :items="posts"
        :loading="loading"
        :search="search"
        :items-per-page="itemsPerPage"
        class="elevation-0"
        hover
      >
        <!-- Title Column -->
        <template v-slot:item.title="{ item }">
          <div class="d-flex align-center py-2">
            <v-avatar size="40" rounded="sm" class="mr-3 bg-grey-lighten-3">
              <v-img v-if="item.image" :src="getImageUrl(item.image)" cover></v-img>
              <v-icon v-else color="grey">mdi-image-off</v-icon>
            </v-avatar>
            <div>
              <div class="font-weight-medium text-truncate" style="max-width: 300px">
                {{ item.title }}
              </div>
              <div class="text-caption text-grey">
                {{ item.category?.bn_name || item.category?.name || 'Uncategorized' }}
              </div>
            </div>
          </div>
        </template>

        <!-- Author Column -->
        <template v-slot:item.author="{ item }">
          <div class="d-flex align-center">
            <v-avatar size="24" color="grey-lighten-2" class="mr-2">
              <span class="text-caption font-weight-bold">{{ getUserInitials(item.author?.username) }}</span>
            </v-avatar>
            {{ item.author?.username }}
          </div>
        </template>

        <!-- Status Column -->
        <template v-slot:item.status="{ item }">
          <v-chip
            :color="getStatusColor(item.status)"
            size="small"
            variant="flat"
            class="text-capitalize"
          >
            {{ item.status }}
          </v-chip>
        </template>

        <!-- Date Column -->
        <template v-slot:item.created_at="{ item }">
          {{ formatDate(item.created_at) }}
        </template>

        <!-- Actions Column -->
        <template v-slot:item.actions="{ item }">
          <div class="d-flex">
            <v-btn
              icon="mdi-eye"
              size="small"
              variant="text"
              color="grey-darken-1"
              :to="`/post/${item.id}`"
              title="View"
            ></v-btn>
            
            <template v-if="canEdit(item)">
              <v-btn
                icon="mdi-pencil"
                size="small"
                variant="text"
                color="primary"
                :to="`/edit-post/${item.id}`"
                title="Edit"
              ></v-btn>
              <v-btn
                icon="mdi-delete"
                size="small"
                variant="text"
                color="error"
                @click="confirmDelete(item)"
                title="Delete"
              ></v-btn>
            </template>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Filter Dialog -->
    <v-dialog v-model="filterDialog" max-width="500">
      <v-card>
        <v-card-title class="pa-4">Filter Posts</v-card-title>
        <v-card-text>
          <v-select
            v-model="statusFilter"
            :items="['draft', 'pending', 'published', 'rejected']"
            label="Status"
            variant="outlined"
            clearable
          ></v-select>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="filterDialog = false">Close</v-btn>
          <v-btn color="primary" @click="applyFilters">Apply</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h5 pa-4">Delete Post?</v-card-title>
        <v-card-text class="pa-4">
          Are you sure you want to delete this post? This action cannot be undone.
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" :loading="deleteLoading" @click="deletePost">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuth } from '../composables/useAuth';
import { newsAPI } from '../services/api';

const { user, isAuthenticated, getAuthHeader, isAdmin, isMaintainer, isWriter } = useAuth();

const posts = ref<any[]>([]);
const loading = ref(false);
const search = ref('');
const itemsPerPage = ref(10);
const filterDialog = ref(false);
const statusFilter = ref<string | null>(null);

// Delete state
const deleteDialog = ref(false);
const postToDelete = ref<any>(null);
const deleteLoading = ref(false);

const headers = [
  { title: 'Post', key: 'title', sortable: true },
  { title: 'Author', key: 'author', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Date', key: 'created_at', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
];

const fetchPosts = async () => {
  loading.value = true;
  try {
    const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:8000";
    const response = await fetch(`${API_BASE_URL}/api/v1/posts/`, {
      headers: getAuthHeader() as HeadersInit,
    });
    
    if (response.ok) {
      let allPosts = await response.json();
      
      // Client-side filtering for Writers if backend returns more than allowed (though backend should handle it)
      // Backend returns:
      // - Writers: Own posts + Published posts (of others)
      // But for "All Posts" management table, a Writer usually only wants to manage THEIR posts.
      // If they see other's published posts here, they can't edit them anyway.
      // The requirement: "Wrtiter type admin can view only his posts"
      // If backend returns published posts of others, we should filter them out from this table?
      // "view only his posts" -> implies they shouldn't even see others' posts in this management view.
      
      if (isWriter.value) {
        allPosts = allPosts.filter((p: any) => p.author.id === user.value?.id);
      }
      
      if (statusFilter.value) {
        allPosts = allPosts.filter((p: any) => p.status === statusFilter.value);
      }
      
      posts.value = allPosts;
    }
  } catch (err) {
    console.error("Failed to fetch posts:", err);
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  filterDialog.value = false;
  fetchPosts();
};

const canEdit = (post: any) => {
  if (isAdmin.value || isMaintainer.value) return true;
  if (isWriter.value && post.author.id === user.value?.id) return true;
  return false;
};

const confirmDelete = (post: any) => {
  postToDelete.value = post;
  deleteDialog.value = true;
};

const deletePost = async () => {
  if (!postToDelete.value) return;
  
  deleteLoading.value = true;
  try {
    const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:8000";
    const response = await fetch(`${API_BASE_URL}/api/v1/posts/${postToDelete.value.id}`, {
      method: 'DELETE',
      headers: getAuthHeader() as HeadersInit,
    });
    
    if (response.ok) {
      posts.value = posts.value.filter(p => p.id !== postToDelete.value.id);
      deleteDialog.value = false;
    } else {
      alert("Failed to delete post");
    }
  } catch (err) {
    console.error("Delete error:", err);
    alert("Error deleting post");
  } finally {
    deleteLoading.value = false;
    postToDelete.value = null;
  }
};

const getImageUrl = (path: string) => newsAPI.getImageURL(path);

const getUserInitials = (username?: string) => {
  if (!username) return "?";
  return username.substring(0, 2).toUpperCase();
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'published': return 'success';
    case 'pending': return 'warning';
    case 'draft': return 'grey';
    case 'rejected': return 'error';
    default: return 'grey';
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

onMounted(() => {
  if (isAuthenticated.value) {
    fetchPosts();
  }
});
</script>

<style scoped>
.posts-list-container {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
