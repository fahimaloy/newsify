<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card elevation="2" class="mt-4">
          <v-card-title class="d-flex align-center pa-4">
            <v-icon class="mr-2" color="#C62828">mdi-cog</v-icon>
            <span class="text-h5">Settings</span>
          </v-card-title>

          <v-divider></v-divider>

          <v-card-text class="pa-4">
            <v-list lines="two">
              <!-- Push Notifications -->
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="#C62828">mdi-bell</v-icon>
                </template>
                <v-list-item-title>Push Notifications</v-list-item-title>
                <v-list-item-subtitle>
                  Receive notifications when new news is created
                </v-list-item-subtitle>
                <template v-slot:append>
                  <v-switch
                    v-model="pushNotifications"
                    color="#C62828"
                    hide-details
                    @update:model-value="togglePushNotifications"
                    :loading="pushLoading"
                  ></v-switch>
                </template>
              </v-list-item>

              <v-divider class="my-2"></v-divider>

              <!-- Email Newsletter (Authenticated Only) -->
              <v-list-item v-if="isAuthenticated">
                <template v-slot:prepend>
                  <v-icon color="#C62828">mdi-email-newsletter</v-icon>
                </template>
                <v-list-item-title>Email Newsletter</v-list-item-title>
                <v-list-item-subtitle>
                  Subscribe to our daily newsletter
                </v-list-item-subtitle>
                <template v-slot:append>
                  <v-switch
                    v-model="emailNewsletter"
                    color="#C62828"
                    hide-details
                    @update:model-value="toggleNewsletter"
                    :loading="newsletterLoading"
                  ></v-switch>
                </template>
              </v-list-item>

              <v-list-item v-else>
                <template v-slot:prepend>
                  <v-icon color="grey">mdi-email-off</v-icon>
                </template>
                <v-list-item-title class="text-grey"
                  >Email Newsletter</v-list-item-title
                >
                <v-list-item-subtitle>
                  Please
                  <router-link to="/login" class="text-decoration-none text-red"
                    >login</router-link
                  >
                  to manage newsletter subscription
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Snackbar for feedback -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useAuth } from "../composables/useAuth";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

const { isAuthenticated, user, getAuthHeader } = useAuth();

const pushNotifications = ref(false);
const emailNewsletter = ref(false);
const pushLoading = ref(false);
const newsletterLoading = ref(false);

const snackbar = ref({
  show: false,
  text: "",
  color: "success",
});

const showMessage = (text: string, color: string = "success") => {
  snackbar.value = { show: true, text, color };
};

// Initialize Settings
onMounted(async () => {
  // Load Push Notification Preference
  const storedPush = localStorage.getItem("push_notifications");
  if (storedPush === "true") {
    // Verify if permission is still granted
    try {
      const granted = await isPermissionGranted();
      pushNotifications.value = granted;
      if (!granted) {
        // If stored as true but permission revoked, update storage
        localStorage.setItem("push_notifications", "false");
      }
    } catch (e) {
      console.error("Notification plugin not available:", e);
      // Fallback for web mode
      pushNotifications.value = storedPush === "true";
    }
  } else {
    pushNotifications.value = false;
  }

  // Load Newsletter Preference
  if (isAuthenticated.value && user.value) {
    emailNewsletter.value = user.value.newsletter_subscribed || false;
  }
});

// Watch for user changes (e.g. login) to update newsletter state
watch(user, (newUser) => {
  if (newUser) {
    emailNewsletter.value = newUser.newsletter_subscribed || false;
  }
});

const togglePushNotifications = async (val: boolean | null) => {
  if (val === null) return;
  pushLoading.value = true;
  try {
    if (val) {
      let permission = await isPermissionGranted();
      if (!permission) {
        const permissionResult = await requestPermission();
        permission = permissionResult === 'granted';
      }
      
      if (permission) {
        pushNotifications.value = true;
        localStorage.setItem('push_notifications', 'true');
        showMessage('Push notifications enabled');
        
        // Test notification
        sendNotification({
          title: 'Notifications Enabled',
          body: 'You will now receive updates when news is created.'
        });
      } else {
        pushNotifications.value = false;
        localStorage.setItem('push_notifications', 'false');
        showMessage('Permission denied for notifications', 'error');
      }
    } else {
      pushNotifications.value = false;
      localStorage.setItem('push_notifications', 'false');
      showMessage('Push notifications disabled');
    }
  } catch (e) {
    console.error("Error toggling notifications:", e);
    showMessage('Notification feature not supported in this environment', 'warning');
    // Allow toggle in web mode for simulation
    pushNotifications.value = val;
    localStorage.setItem('push_notifications', String(val));
  } finally {
    pushLoading.value = false;
  }
};

const toggleNewsletter = async (val: boolean | null) => {
  if (val === null) return;
  if (!isAuthenticated.value) return;
  
  newsletterLoading.value = true;
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
      method: 'PATCH',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      } as HeadersInit,
      body: JSON.stringify({ newsletter_subscribed: val })
    });

    if (response.ok) {
      // Update local user state if needed, but useAuth might not reactively update deep properties unless we manually do it
      // Assuming useAuth exposes a way to update user or we just rely on the local state for now
      if (user.value) {
        user.value.newsletter_subscribed = val;
      }
      showMessage(val ? 'Subscribed to newsletter' : 'Unsubscribed from newsletter');
    } else {
      throw new Error('Failed to update preference');
    }
  } catch (error) {
    console.error(error);
    emailNewsletter.value = !val; // Revert
    showMessage('Failed to update newsletter preference', 'error');
  } finally {
    newsletterLoading.value = false;
  }
};
</script>
