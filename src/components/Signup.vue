<template>
  <v-app>
    <!-- Header with back button -->
    <v-app-bar color="#C62828" elevation="0" app>
      <v-btn icon @click="goBack" class="text-white">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-toolbar-title class="text-white">Sign Up</v-toolbar-title>
    </v-app-bar>

    <v-main class="signup-main">
      <v-container fluid class="fill-height pa-0">
        <v-row class="fill-height ma-0" align="center" justify="center">
          <v-col cols="12" sm="8" md="6" lg="4" class="pa-6">
            <!-- Logo and Welcome -->
            <div class="text-center mb-8">
              <img src="/logo.svg" alt="Logo" class="signup-logo mb-4" />
              <h1 class="text-h4 font-weight-bold mb-2" style="color: #c62828">
                {{ step === 1 ? "Create Account" : "Verify Email" }}
              </h1>
              <p class="text-body-1 text-grey">
                {{
                  step === 1
                    ? "Join Channel July 36 today"
                    : "Enter the code sent to your email"
                }}
              </p>
            </div>

            <!-- Signup Form -->
            <v-card elevation="8" rounded="lg" class="pa-6">
              <!-- Step 1: Signup Form -->
              <v-form
                v-if="step === 1"
                @submit.prevent="handleSignup"
                ref="formRef"
              >
                <v-text-field
                  v-model="username"
                  label="Username"
                  prepend-inner-icon="mdi-account"
                  variant="outlined"
                  color="#C62828"
                  :rules="[rules.required, rules.min3]"
                  :disabled="loading"
                  class="mb-2"
                ></v-text-field>

                <v-text-field
                  v-model="email"
                  label="Email"
                  prepend-inner-icon="mdi-email"
                  variant="outlined"
                  color="#C62828"
                  :rules="[rules.required, rules.email]"
                  :disabled="loading"
                  class="mb-2"
                ></v-text-field>

                <v-text-field
                  v-model="password"
                  label="Password"
                  prepend-inner-icon="mdi-lock"
                  :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                  @click:append-inner="showPassword = !showPassword"
                  :type="showPassword ? 'text' : 'password'"
                  variant="outlined"
                  color="#C62828"
                  :rules="[rules.required, rules.min6]"
                  :disabled="loading"
                  class="mb-2"
                ></v-text-field>

                <v-text-field
                  v-model="confirmPassword"
                  label="Confirm Password"
                  prepend-inner-icon="mdi-lock-check"
                  :type="showPassword ? 'text' : 'password'"
                  variant="outlined"
                  color="#C62828"
                  :rules="[rules.required, rules.matchPassword]"
                  :disabled="loading"
                  class="mb-2"
                ></v-text-field>

                <v-text-field
                  v-model="phone"
                  label="Phone Number (Optional)"
                  prepend-inner-icon="mdi-phone"
                  variant="outlined"
                  color="#C62828"
                  :disabled="loading"
                  class="mb-2"
                ></v-text-field>

                <v-checkbox
                  v-model="newsletter"
                  label="Subscribe to email newsletter"
                  color="#C62828"
                  hide-details
                  :disabled="loading"
                  class="mb-4"
                ></v-checkbox>

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
                  <v-icon left class="mr-2">mdi-account-plus</v-icon>
                  Sign Up
                </v-btn>

                <v-divider class="my-4"></v-divider>

                <div class="text-center">
                  <p class="text-body-2 text-grey-darken-1">
                    Already have an account?
                    <router-link
                      to="/login"
                      class="text-red-darken-3 text-decoration-none font-weight-bold"
                    >
                      Login
                    </router-link>
                  </p>
                </div>
              </v-form>

              <!-- Step 2: Verification Form -->
              <v-form
                v-else
                @submit.prevent="handleVerification"
                ref="verifyFormRef"
              >
                <v-otp-input
                  v-model="verificationCode"
                  length="6"
                  variant="outlined"
                  color="#C62828"
                  class="mb-6"
                ></v-otp-input>

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

                <v-btn
                  type="submit"
                  block
                  color="#C62828"
                  size="large"
                  :loading="loading"
                  :disabled="verificationCode.length !== 6 || loading"
                  class="mb-4"
                  elevation="2"
                >
                  Verify
                </v-btn>

                <v-btn
                  variant="text"
                  block
                  color="grey-darken-1"
                  @click="resendCode"
                  :disabled="resendDisabled || loading"
                >
                  {{ resendDisabled ? `Resend in ${resendTimer}s` : "Resend Code" }}
                </v-btn>
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
const { loadUserFromToken } = useAuth();

const step = ref(1);
const formRef = ref<any>(null);
const verifyFormRef = ref<any>(null);

const username = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const phone = ref("");
const newsletter = ref(false);
const showPassword = ref(false);
const loading = ref(false);
const error = ref("");

const verificationCode = ref("");
const resendTimer = ref(60);
const resendDisabled = ref(false);

const rules = {
  required: (v: string) => !!v || "Required.",
  min3: (v: string) => v.length >= 3 || "Min 3 characters",
  min6: (v: string) => v.length >= 6 || "Min 6 characters",
  email: (v: string) => /.+@.+\..+/.test(v) || "E-mail must be valid",
  matchPassword: (v: string) => v === password.value || "Passwords must match",
};

const goBack = () => {
  router.push("/");
};

const startResendTimer = () => {
  resendDisabled.value = true;
  resendTimer.value = 60;
  const interval = setInterval(() => {
    resendTimer.value--;
    if (resendTimer.value <= 0) {
      clearInterval(interval);
      resendDisabled.value = false;
    }
  }, 1000);
};

const handleSignup = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  loading.value = true;
  error.value = "";

  try {
    const API_BASE_URL =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    const response = await fetch(`${API_BASE_URL}/api/v1/users/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username.value,
        email: email.value,
        password: password.value,
        phone: phone.value || undefined,
        newsletter_subscribed: newsletter.value,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.detail || "Signup failed");
    }

    // Move to verification step
    step.value = 2;
    startResendTimer();
  } catch (err: any) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const handleVerification = async () => {
  loading.value = true;
  error.value = "";

  try {
    const API_BASE_URL =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    const response = await fetch(`${API_BASE_URL}/api/v1/users/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.value,
        code: verificationCode.value,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.detail || "Verification failed");
    }

    const data = await response.json();

    // Auto login
    localStorage.setItem("auth_token", data.access_token);
    // Reload user data in composable (need to import loadUserFromToken or reload page)
    // We can import useAuth and call loadUserFromToken
    await loadUserFromToken();

    // Redirect to home
    router.push("/");
  } catch (err: any) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const resendCode = async () => {
  loading.value = true;
  try {
    const API_BASE_URL =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    const response = await fetch(
      `${API_BASE_URL}/api/v1/users/resend-verification`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.value,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to resend code");
    }

    startResendTimer();
  } catch (err: any) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.signup-main {
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
  min-height: 100vh;
}

.signup-logo {
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
