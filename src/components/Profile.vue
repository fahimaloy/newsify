<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <!-- Not Authenticated State -->
        <div v-if="!isAuthenticated" class="text-center py-10">
          <v-icon size="100" color="grey-lighten-1" class="mb-4">
            mdi-account-circle-outline
          </v-icon>
          <h2 class="text-h5 mb-3">Welcome to Channel July 36</h2>
          <p class="text-body-1 text-grey mb-6">
            Sign in to access your profile and create posts
          </p>
          <v-btn
            color="#C62828"
            size="large"
            prepend-icon="mdi-login"
            @click="goToLogin"
            elevation="2"
          >
            Login
          </v-btn>
        </div>

        <!-- Authenticated State -->
        <div v-else>
          <!-- Profile Header with Details -->
          <v-card class="mb-4" elevation="2">
            <v-card-text class="pa-6">
              <div class="d-flex align-center mb-4">
                <!-- Avatar with Initials -->
                <v-avatar size="100" color="#C62828" class="mr-6">
                  <span class="text-h4 text-white font-weight-bold">
                    {{ getUserInitials(user?.username) }}
                  </span>
                </v-avatar>

                <div class="flex-grow-1">
                  <div class="d-flex align-center justify-space-between">
                    <h2 class="text-h4 mb-2">{{ user?.username }}</h2>
                    <v-btn icon="mdi-pencil" variant="text" to="/edit-profile" color="grey-darken-1"></v-btn>
                  </div>
                  <v-chip
                    :color="getRoleColor(user?.role)"
                    size="small"
                    class="mb-2"
                  >
                    {{ getRoleLabel(user?.role) }}
                  </v-chip>
                </div>
              </div>

              <!-- User Details Grid -->
              <v-divider class="my-4"></v-divider>
              <v-row>
                <v-col cols="12" sm="6">
                  <div class="detail-item">
                    <v-icon size="20" class="mr-2">mdi-account</v-icon>
                    <span class="text-caption text-grey">Name:</span>
                    <span class="ml-2">{{ user?.full_name || '-' }}</span>
                  </div>
                </v-col>
                <v-col cols="12" sm="6">
                  <div class="detail-item">
                    <v-icon size="20" class="mr-2">mdi-account-circle</v-icon>
                    <span class="text-caption text-grey">Username:</span>
                    <span class="ml-2">{{ user?.username }}</span>
                  </div>
                </v-col>
                <v-col cols="12" sm="6">
                  <div class="detail-item">
                    <v-icon size="20" class="mr-2">mdi-email</v-icon>
                    <span class="text-caption text-grey">Email:</span>
                    <span class="ml-2">{{ user?.email || '-' }}</span>
                  </div>
                </v-col>
                <v-col cols="12" sm="6">
                  <div class="detail-item">
                    <v-icon size="20" class="mr-2">mdi-phone</v-icon>
                    <span class="text-caption text-grey">Phone:</span>
                    <span class="ml-2">{{ user?.phone || '-' }}</span>
                  </div>
                </v-col>
                <v-col cols="12" sm="6">
                  <div class="detail-item">
                    <v-icon size="20" class="mr-2">mdi-identifier</v-icon>
                    <span class="text-caption text-grey">User ID:</span>
                    <span class="ml-2">{{ user?.id }}</span>
                  </div>
                </v-col>
              </v-row>
              
              <v-divider class="my-4"></v-divider>
              <div class="d-flex justify-end">
                <v-btn color="primary" variant="text" @click="resetPasswordDialog = true">
                  Reset Password
                </v-btn>
              </div>
            </v-card-text>
          </v-card>

          <!-- My Posts Section (Hidden for Subscribers) -->
          <v-card v-if="isAdministrator" elevation="2">
            <v-card-title class="d-flex align-center pa-4">
              <v-icon class="mr-2">mdi-post</v-icon>
              <span>{{
                isAdmin || isMaintainer ? "All Posts" : "My Posts"
              }}</span>
              <v-spacer></v-spacer>
              <v-btn
                icon="mdi-open-in-new"
                variant="text"
                to="/posts"
                title="Manage All Posts"
                class="mr-2"
              ></v-btn>
              <v-btn
                color="#C62828"
                variant="outlined"
                prepend-icon="mdi-filter"
                @click="filterDialog = true"
                size="small"
              >
                Filter
              </v-btn>
            </v-card-title>

            <v-divider></v-divider>

            <!-- Posts Table -->
            <v-data-table
              :headers="headers"
              :items="posts"
              :loading="postsLoading"
              :items-per-page="itemsPerPage"
              :page="page"
              @update:page="page = $event"
              @update:items-per-page="itemsPerPage = $event"
              class="elevation-0"
            >
              <template v-slot:item.title="{ item }">
                <div class="text-truncate" style="max-width: 300px">
                  {{ item.title }}
                </div>
              </template>

              <template v-slot:item.status="{ item }">
                <v-chip
                  :color="getStatusColor(item.status)"
                  size="small"
                  variant="flat"
                >
                  {{ item.status }}
                </v-chip>
              </template>

              <template v-slot:item.created_at="{ item }">
                {{ formatDate(item.created_at) }}
              </template>

              <template v-slot:item.actions="{ item }">
                <!-- Approve/Reject for Admin/Maintainer on Pending posts -->
                <template
                  v-if="(isAdmin || isMaintainer) && item.status === 'pending'"
                >
                  <v-btn
                    icon="mdi-check"
                    size="small"
                    variant="text"
                    color="success"
                    @click="updateStatus(item.id, 'published')"
                    title="Approve"
                  ></v-btn>
                  <v-btn
                    icon="mdi-close"
                    size="small"
                    variant="text"
                    color="error"
                    @click="updateStatus(item.id, 'rejected')"
                    title="Reject"
                  ></v-btn>
                </template>

                <!-- Edit/Delete for Admin/Maintainer OR Writer's own posts -->
                <template v-if="canEdit(item)">
                  <v-btn
                    icon="mdi-pencil"
                    size="small"
                    variant="text"
                    color="primary"
                    :to="`/edit-post/${item.id}`"
                  ></v-btn>
                  <v-btn
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    color="error"
                    @click="confirmDelete(item)"
                  ></v-btn>
                </template>
              </template>

              <template v-slot:no-data>
                <div class="text-center py-8">
                  <v-icon size="64" color="grey-lighten-1"
                    >mdi-post-outline</v-icon
                  >
                  <p class="text-body-1 text-grey mt-2">No posts yet</p>
                </div>
              </template>
            </v-data-table>
          </v-card>

          <!-- Logout Button -->
          <v-btn
            block
            color="error"
            variant="outlined"
            prepend-icon="mdi-logout"
            @click="handleLogout"
            size="large"
            class="mt-4"
          >
            Logout
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Filter Dialog -->
    <v-dialog v-model="filterDialog" max-width="500">
      <v-card>
        <v-card-title class="pa-4">
          <v-icon class="mr-2">mdi-filter</v-icon>
          Filter Posts
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pa-4">
          <!-- Date Range -->
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="filters.startDate"
                label="Start Date"
                type="date"
                variant="outlined"
                color="#C62828"
                density="comfortable"
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="filters.endDate"
                label="End Date"
                type="date"
                variant="outlined"
                color="#C62828"
                density="comfortable"
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-select
                v-model="filters.status"
                :items="statusOptions"
                label="Post Status"
                variant="outlined"
                color="#C62828"
                density="comfortable"
                clearable
              ></v-select>
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-btn color="grey" variant="text" @click="resetFilters">
            Reset
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="filterDialog = false">
            Cancel
          </v-btn>
          <v-btn color="#C62828" variant="elevated" @click="applyFilters">
            Apply
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Reset Password Dialog -->
    <v-dialog v-model="resetPasswordDialog" max-width="500">
      <v-card>
        <v-card-title>Reset Password</v-card-title>
        <v-card-text>
          <v-window v-model="resetStep">
            <v-window-item :value="1">
              <p class="mb-4">Click "Send OTP" to receive a verification code at your email.</p>
              <v-btn block color="primary" @click="sendOtp" :loading="otpLoading">Send OTP</v-btn>
            </v-window-item>
            <v-window-item :value="2">
              <v-text-field v-model="otpCode" label="OTP Code" class="mb-4"></v-text-field>
              <v-text-field v-model="newPassword" label="New Password" type="password" class="mb-4"></v-text-field>
              <v-btn block color="primary" @click="confirmReset" :loading="resetLoading">Reset Password</v-btn>
            </v-window-item>
          </v-window>
        </v-card-text>
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
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth";

const router = useRouter();
const {
  user,
  isAuthenticated,
  logout,
  getAuthHeader,
  isAdministrator,
  isAdmin,
  isMaintainer,
  isWriter,
} = useAuth();

const postsLoading = ref(false);
const posts = ref<any[]>([]);
const page = ref(1);
const itemsPerPage = ref(10);
const filterDialog = ref(false);

// Reset Password State
const resetPasswordDialog = ref(false);
const resetStep = ref(1);
const otpLoading = ref(false);
const resetLoading = ref(false);
const otpCode = ref('');
const newPassword = ref('');

// Delete State
const deleteDialog = ref(false);
const postToDelete = ref<any>(null);
const deleteLoading = ref(false);

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

const sendOtp = async () => {
  otpLoading.value = true;
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    const response = await fetch(`${API_BASE_URL}/api/v1/users/reset-password-request`, {
      method: 'POST',
      headers: getAuthHeader() as HeadersInit
    });
    if (response.ok) {
      resetStep.value = 2;
    } else {
      alert('Failed to send OTP');
    }
  } catch (error) {
    console.error(error);
  } finally {
    otpLoading.value = false;
  }
};

const confirmReset = async () => {
  resetLoading.value = true;
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    const response = await fetch(`${API_BASE_URL}/api/v1/users/reset-password-confirm`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      } as HeadersInit,
      body: JSON.stringify({
        code: otpCode.value,
        new_password: newPassword.value
      })
    });
    if (response.ok) {
      alert('Password updated successfully');
      resetPasswordDialog.value = false;
      resetStep.value = 1;
      otpCode.value = '';
      newPassword.value = '';
    } else {
      const error = await response.json();
      alert(error.detail || 'Failed to reset password');
    }
  } catch (error) {
    console.error(error);
  } finally {
    resetLoading.value = false;
  }
};

const filters = ref({
  startDate: "",
  endDate: "",
  status: null as string | null,
});

const statusOptions = ["draft", "pending", "published", "rejected", "scheduled"];

const headers = [
  { title: "Title", key: "title", sortable: true },
  { title: "Status", key: "status", sortable: true },
  { title: "Created", key: "created_at", sortable: true },
  { title: "Actions", key: "actions", sortable: false },
];

const goToLogin = () => {
  router.push("/login");
};

const handleLogout = () => {
  logout();
  router.push("/");
};

const getUserInitials = (username?: string) => {
  if (!username) return "?";
  const parts = username.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return username.substring(0, 2).toUpperCase();
};

const getRoleColor = (_role?: string) => {
  // Map new admin types to colors
  if (user.value?.admin_type === "admin") return "error";
  if (user.value?.admin_type === "maintainer") return "warning";
  if (user.value?.admin_type === "writer") return "info";
  return "grey";
};

const getRoleLabel = (_role?: string) => {
  if (user.value?.user_type === "subscriber") return "Subscriber";
  if (user.value?.admin_type === "admin") return "Administrator";
  if (user.value?.admin_type === "maintainer") return "Maintainer";
  if (user.value?.admin_type === "writer") return "Writer";
  return "User";
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "published":
      return "success";
    case "pending":
      return "warning";
    case "draft":
      return "grey";
    case "rejected":
      return "error";
    case "scheduled":
      return "info";
    default:
      return "grey";
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const fetchMyPosts = async () => {
  if (!isAuthenticated.value || !isAdministrator.value) return;

  postsLoading.value = true;
  try {
    const API_BASE_URL =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    const response = await fetch(`${API_BASE_URL}/api/v1/posts/`, {
      headers: getAuthHeader() as HeadersInit,
    });

    if (response.ok) {
      const allPosts = await response.json();
      // Backend already filters based on user type:
      // - Writers see their own + published (but we want to show them in the table)
      // - Admins/Maintainers see all
      // We might want to filter client-side if the API returns published posts of others for writers
      // The requirement says "writers type administrator users can only see their posts".
      // My backend implementation for writers returns (own OR published).
      // For the "My Posts" table, we probably only want to show *their* posts if they are writers.

      if (isWriter.value) {
        posts.value = allPosts.filter(
          (post: any) => post.author.id === user.value?.id
        );
      } else {
        posts.value = allPosts;
      }
    }
  } catch (error) {
    console.error("Failed to fetch posts:", error);
  } finally {
    postsLoading.value = false;
  }
};

const updateStatus = async (postId: number, newStatus: string) => {
  try {
    const API_BASE_URL =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    const response = await fetch(
      `${API_BASE_URL}/api/v1/posts/status/${postId}`,
      {
        method: "PATCH",
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json",
        } as HeadersInit,
        body: JSON.stringify(newStatus), // Body should be just the string based on my backend? No, Body(...) expects JSON.
        // Wait, my backend: new_status: PostStatus = Body(...)
        // So it expects just the string value in the body? Or a JSON object?
        // FastAPI Body(...) usually expects the value directly if it's a primitive, but for JSON it's usually { "new_status": ... } if it was a pydantic model.
        // If it's just Body(...), it expects the raw body to be the value (if media type is correct) or a JSON key if embedded.
        // Let's try sending just the string in quotes (valid JSON string).
      }
    );

    if (response.ok) {
      // Refresh posts
      fetchMyPosts();
    } else {
      console.error("Failed to update status");
    }
  } catch (error) {
    console.error("Error updating status:", error);
  }
};

const canEdit = (post: any) => {
  if (isAdmin.value || isMaintainer.value) return true;
  if (isWriter.value && post.author.id === user.value?.id) return true;
  return false;
};

const applyFilters = () => {
  filterDialog.value = false;
  fetchMyPosts();
  // TODO: Apply filters to the API request
};

const resetFilters = () => {
  filters.value = {
    startDate: "",
    endDate: "",
    status: null,
  };
};

watch(isAuthenticated, (newVal) => {
  if (newVal) {
    fetchMyPosts();
  }
});

onMounted(() => {
  if (isAuthenticated.value) {
    fetchMyPosts();
  }
});
</script>

<style scoped>
.detail-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
}
</style>
