<template>
  <v-container class="user-details-container pb-16">
    <v-btn
      variant="text"
      prepend-icon="mdi-arrow-left"
      to="/users"
      class="mb-4"
    >
      Back to Users
    </v-btn>

    <v-card v-if="user" elevation="2" class="rounded-lg pa-6">
      <div class="d-flex align-center mb-6">
        <v-avatar color="primary" size="64" class="mr-4">
          <span class="text-h5 text-white">{{ getUserInitials(user.username) }}</span>
        </v-avatar>
        <div>
          <h1 class="text-h4 font-weight-bold">{{ user.full_name || user.username }}</h1>
          <div class="d-flex align-center mt-1">
            <v-chip
              :color="getUserTypeColor(user.user_type)"
              size="small"
              class="mr-2 text-uppercase font-weight-bold"
            >
              {{ user.user_type }}
            </v-chip>
            <v-chip
              v-if="user.admin_type"
              :color="getAdminTypeColor(user.admin_type)"
              size="small"
              variant="outlined"
              class="text-uppercase"
            >
              {{ user.admin_type }}
            </v-chip>
          </div>
        </div>
      </div>

      <v-divider class="mb-6"></v-divider>

      <v-row>
        <v-col cols="12" md="6">
          <div class="text-subtitle-2 text-grey mb-1">Username</div>
          <div class="text-body-1 mb-4">{{ user.username }}</div>

          <div class="text-subtitle-2 text-grey mb-1">Email</div>
          <div class="text-body-1 mb-4">{{ user.email }}</div>

          <div class="text-subtitle-2 text-grey mb-1">Phone</div>
          <div class="text-body-1 mb-4">{{ user.phone || 'N/A' }}</div>
        </v-col>

        <v-col cols="12" md="6">
          <div class="text-subtitle-2 text-grey mb-1">Status</div>
          <div class="mb-4">
            <v-chip
              :color="user.is_blocked ? 'error' : 'success'"
              size="small"
            >
              {{ user.is_blocked ? 'Blocked' : 'Active' }}
            </v-chip>
          </div>

          <div class="text-subtitle-2 text-grey mb-1">Verification</div>
          <div class="mb-4">
            <v-icon
              :color="user.is_verified ? 'success' : 'warning'"
              class="mr-1"
            >
              {{ user.is_verified ? 'mdi-check-circle' : 'mdi-alert-circle' }}
            </v-icon>
            {{ user.is_verified ? 'Verified' : 'Unverified' }}
          </div>

          <div class="text-subtitle-2 text-grey mb-1">Newsletter</div>
          <div class="mb-4">
            {{ user.newsletter_subscribed ? 'Subscribed' : 'Not Subscribed' }}
          </div>
        </v-col>
      </v-row>
      
      <!-- Maintainer Actions -->
      <v-divider class="my-6"></v-divider>
      <div class="d-flex justify-end">
         <v-btn
            v-if="canBlock(user)"
            :color="user.is_blocked ? 'success' : 'warning'"
            variant="flat"
            @click="toggleBlockUser"
            :loading="loading"
          >
            {{ user.is_blocked ? 'Unblock User' : 'Block User' }}
          </v-btn>
      </div>
    </v-card>

    <div v-else-if="loading" class="text-center py-12">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <v-alert v-else type="error" class="mt-4">
      User not found
    </v-alert>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuth, UserType, AdminType } from '../composables/useAuth';

const route = useRoute();
const { getAuthHeader, isMaintainer, isAdmin } = useAuth();
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const user = ref<any>(null);
const loading = ref(false);

const loadUser = async () => {
  loading.value = true;
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/${route.params.id}`, {
      headers: getAuthHeader() as HeadersInit
    });
    
    if (response.ok) {
      user.value = await response.json();
    }
  } catch (error) {
    console.error('Error loading user:', error);
  } finally {
    loading.value = false;
  }
};

const getUserInitials = (username: string) => {
  if (!username) return "?";
  return username.substring(0, 2).toUpperCase();
};

const getUserTypeColor = (type: UserType) => {
  return type === UserType.ADMINISTRATOR ? 'purple' : 'teal';
};

const getAdminTypeColor = (type: string) => {
  switch (type) {
    case AdminType.ADMIN: return 'red';
    case AdminType.MAINTAINER: return 'orange';
    case AdminType.WRITER: return 'green';
    default: return 'grey';
  }
};

const canBlock = (item: any) => {
  if (isAdmin.value) return true;
  if (isMaintainer.value) {
    return item.user_type === UserType.SUBSCRIBER;
  }
  return false;
};

const toggleBlockUser = async () => {
  if (!user.value) return;
  
  loading.value = true;
  try {
    const newStatus = !user.value.is_blocked;
    const response = await fetch(`${API_BASE_URL}/api/v1/users/${user.value.id}`, {
      method: 'PATCH',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      } as HeadersInit,
      body: JSON.stringify({
        is_blocked: newStatus
      })
    });

    if (response.ok) {
      user.value.is_blocked = newStatus;
    } else {
      const error = await response.json();
      alert(`Failed to update user status: ${error.detail}`);
    }
  } catch (error) {
    console.error('Error updating user status:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadUser();
});
</script>

<style scoped>
.user-details-container {
  max-width: 800px;
  margin: 0 auto;
}
</style>
