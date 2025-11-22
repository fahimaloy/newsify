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
          <!-- Profile Header -->
          <v-card class="mb-4" elevation="2">
            <v-card-text class="pa-6">
              <div class="d-flex align-center">
                <v-avatar size="80" color="#C62828" class="mr-4">
                  <v-icon size="50" color="white">mdi-account</v-icon>
                </v-avatar>
                <div class="flex-grow-1">
                  <h2 class="text-h5 mb-1">{{ user?.username }}</h2>
                  <v-chip
                    :color="getRoleColor(user?.role)"
                    size="small"
                    class="mb-2"
                  >
                    {{ getRoleLabel(user?.role) }}
                  </v-chip>
                  <p class="text-caption text-grey">User ID: {{ user?.id }}</p>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- Profile Actions -->
          <v-card class="mb-4" elevation="2">
            <v-list>
              <v-list-item
                prepend-icon="mdi-account-edit"
                title="Edit Profile"
                subtitle="Update your information"
              ></v-list-item>
              <v-divider></v-divider>
              <v-list-item
                prepend-icon="mdi-cog"
                title="Settings"
                subtitle="Manage your preferences"
              ></v-list-item>
              <v-divider></v-divider>
              <v-list-item
                prepend-icon="mdi-help-circle"
                title="Help & Support"
                subtitle="Get assistance"
              ></v-list-item>
            </v-list>
          </v-card>

          <!-- Logout Button -->
          <v-btn
            block
            color="error"
            variant="outlined"
            prepend-icon="mdi-logout"
            @click="handleLogout"
            size="large"
          >
            Logout
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth";

const router = useRouter();
const { user, isAuthenticated, logout } = useAuth();

const goToLogin = () => {
  router.push("/login");
};

const handleLogout = () => {
  logout();
  router.push("/");
};

const getRoleColor = (role?: string) => {
  switch (role) {
    case "admin":
      return "error";
    case "maintainer":
      return "warning";
    case "writer":
      return "info";
    default:
      return "grey";
  }
};

const getRoleLabel = (role?: string) => {
  switch (role) {
    case "admin":
      return "Administrator";
    case "maintainer":
      return "Maintainer";
    case "writer":
      return "Writer";
    default:
      return "User";
  }
};
</script>
