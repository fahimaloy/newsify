<template>
  <v-app>
    <!-- Header with back button -->
    <v-app-bar color="#C62828" elevation="0" app>
      <v-btn icon @click="goBack" class="text-white">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-toolbar-title class="text-white">Login</v-toolbar-title>
    </v-app-bar>

    <v-main class="login-main">
      <v-container fluid class="fill-height pa-0">
        <v-row class="fill-height ma-0" align="center" justify="center">
          <v-col cols="12" sm="8" md="6" lg="4" class="pa-6">
            <!-- Logo and Welcome -->
            <div class="text-center mb-8">
              <img src="/logo.svg" alt="Logo" class="login-logo mb-4" />
              <h1 class="text-h4 font-weight-bold mb-2" style="color: #c62828">
                Welcome Back
              </h1>
              <p class="text-body-1 text-grey">
                Sign in to continue to Channel July 36
              </p>
            </div>

            <!-- Login Form -->
            <v-card elevation="8" rounded="lg" class="pa-6">
              <v-form @submit.prevent="handleLogin" ref="formRef">
                <!-- Username Field -->
                <v-text-field
                  v-model="username"
                  label="Username"
                  prepend-inner-icon="mdi-account"
                  variant="outlined"
                  color="#C62828"
                  :rules="[rules.required]"
                  :disabled="loading"
                  class="mb-2"
                ></v-text-field>

                <!-- Password Field -->
                <v-text-field
                  v-model="password"
                  label="Password"
                  prepend-inner-icon="mdi-lock"
                  :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                  :type="showPassword ? 'text' : 'password'"
                  @click:append-inner="showPassword = !showPassword"
                  variant="outlined"
                  color="#C62828"
                  :rules="[rules.required]"
                  :disabled="loading"
                  class="mb-4"
                ></v-text-field>

                <!-- Error Alert -->
                <v-alert
                  v-if="error"
                  type="error"
                  variant="tonal"
                  closable
                  @click:close="error = ''"
                  class="mb-4"
                >
                  {{ error }}
                </v-alert>

                <!-- Login Button -->
                <v-btn
                  type="submit"
                  block
                  size="large"
                  color="#C62828"
                  :loading="loading"
                  :disabled="loading"
                  class="mb-3"
                  elevation="2"
                >
                  <v-icon left class="mr-2">mdi-login</v-icon>
                  Sign In
                </v-btn>

                <!-- Divider -->
                <v-divider class="my-4"></v-divider>

                <!-- Additional Info -->
                <div class="text-center">
                  <p class="text-caption text-grey">
                    Don't have an account? Contact your administrator.
                  </p>
                </div>
              </v-form>
            </v-card>

            <!-- Footer -->
            <div class="text-center mt-6">
              <p class="text-caption text-grey">
                © 2025 Channel July 36. All rights reserved.
              </p>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth";

const router = useRouter();
const { login } = useAuth();

const username = ref("");
const password = ref("");
const showPassword = ref(false);
const loading = ref(false);
const error = ref("");
const formRef = ref();

const rules = {
  required: (value: string) => !!value || "This field is required",
};

const goBack = () => {
  router.push("/");
};

const handleLogin = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  loading.value = true;
  error.value = "";

  const result = await login({
    username: username.value,
    password: password.value,
  });

  loading.value = false;

  if (result.success) {
    // Redirect to home or profile
    router.push("/profile");
  } else {
    error.value = result.error || "Login failed. Please try again.";
  }
};
</script>

<style scoped>
.login-main {
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
  min-height: 100vh;
}

.login-logo {
  height: 80px;
  max-width: 200px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.fill-height {
  height: 100%;
}

/* Card hover effect */
.v-card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
}

/* Button animation */
.v-btn {
  transition: all 0.3s ease;
}

.v-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(198, 40, 40, 0.3);
}
</style>
