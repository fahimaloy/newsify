<template>
  <v-container class="edit-profile-container pb-16">
    <v-btn variant="text" prepend-icon="mdi-arrow-left" to="/profile" class="mb-4">
      Back to Profile
    </v-btn>
    
    <v-card elevation="2" class="rounded-lg pa-6">
      <h1 class="text-h5 font-weight-bold mb-6">Edit Profile</h1>
      
      <v-form @submit.prevent="saveProfile">
        <v-text-field
          v-model="form.username"
          label="Username"
          disabled
          hint="Username cannot be changed"
          persistent-hint
          class="mb-4"
        ></v-text-field>
        
        <v-text-field
          v-model="form.email"
          label="Email"
          disabled
          hint="Email cannot be changed"
          persistent-hint
          class="mb-4"
        ></v-text-field>
        
        <v-text-field
          v-model="form.full_name"
          label="Full Name"
          class="mb-4"
        ></v-text-field>
        
        <v-text-field
          v-model="form.phone"
          label="Phone"
          class="mb-4"
        ></v-text-field>
        
        <v-btn color="primary" type="submit" :loading="loading" block>
          Save Changes
        </v-btn>
      </v-form>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';

const router = useRouter();
const { user, getAuthHeader } = useAuth();
const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8000';

const loading = ref(false);
const form = ref({
  username: '',
  email: '',
  full_name: '',
  phone: ''
});

onMounted(() => {
  if (user.value) {
    form.value.username = user.value.username;
    form.value.email = user.value.email || '';
    form.value.full_name = user.value.full_name || '';
    form.value.phone = user.value.phone || '';
  }
});

const saveProfile = async () => {
  loading.value = true;
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
      method: 'PATCH',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      } as HeadersInit,
      body: JSON.stringify({
        full_name: form.value.full_name,
        phone: form.value.phone
      })
    });
    
    if (response.ok) {
      router.push('/profile');
    } else {
      alert('Failed to update profile');
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.edit-profile-container {
  max-width: 600px;
  margin: 0 auto;
}
</style>
