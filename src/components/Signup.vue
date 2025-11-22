<template>
  <v-container fluid class="fill-height pa-0">
    <v-row no-gutters class="fill-height">
      <!-- Left Side - Image/Branding -->
      <v-col
        cols="12"
        md="6"
        class="bg-red-darken-4 d-none d-md-flex align-center justify-center position-relative"
      >
        <div class="text-center text-white pa-10" style="z-index: 2">
          <img
            src="/logo.svg"
            alt="Channel July 36"
            style="height: 120px"
            class="mb-6 animate-logo"
          />
          <h1 class="text-h3 font-weight-bold mb-2">Join Our Community</h1>
          <p class="text-h6 opacity-80">Stay updated with the latest news</p>
        </div>

        <!-- Decorative Elements -->
        <div class="circle-decoration circle-1"></div>
        <div class="circle-decoration circle-2"></div>
      </v-col>

      <!-- Right Side - Signup Form -->
      <v-col
        cols="12"
        md="6"
        class="d-flex align-center justify-center bg-grey-lighten-5"
      >
        <v-card
          width="100%"
          max-width="500"
          class="pa-8 ma-4 rounded-xl"
          elevation="4"
        >
          <div class="text-center mb-8">
            <h2 class="text-h4 font-weight-bold text-red-darken-3 mb-2">
              {{ step === 1 ? "Create Account" : "Verify Email" }}
            </h2>
            <p class="text-body-1 text-grey-darken-1">
              {{
                step === 1
                  ? "Sign up to get started"
                  : "Enter the code sent to your email"
              }}
            </p>
          </div>

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
              color="red-darken-3"
              :rules="[rules.required, rules.min3]"
              class="mb-2"
            ></v-text-field>

            <v-text-field
              v-model="email"
              label="Email"
              prepend-inner-icon="mdi-email"
              variant="outlined"
              color="red-darken-3"
              :rules="[rules.required, rules.email]"
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
              color="red-darken-3"
              :rules="[rules.required, rules.min6]"
              class="mb-2"
            ></v-text-field>

            <v-text-field
              v-model="confirmPassword"
              label="Confirm Password"
              prepend-inner-icon="mdi-lock-check"
              :type="showPassword ? 'text' : 'password'"
              variant="outlined"
              color="red-darken-3"
              :rules="[rules.required, rules.matchPassword]"
              class="mb-2"
            ></v-text-field>

            <v-text-field
              v-model="phone"
              label="Phone Number (Optional)"
              prepend-inner-icon="mdi-phone"
              variant="outlined"
              color="red-darken-3"
              class="mb-2"
            ></v-text-field>

            <v-checkbox
              v-model="newsletter"
              label="Subscribe to email newsletter"
              color="red-darken-3"
              hide-details
              class="mb-6"
            ></v-checkbox>

            <v-alert
              v-if="error"
              type="error"
              variant="tonal"
              class="mb-4"
              closable
            >
              {{ error }}
            </v-alert>

            <v-btn
              type="submit"
              block
              color="red-darken-3"
              size="large"
              :loading="loading"
              class="text-none text-subtitle-1 font-weight-bold rounded-lg"
              elevation="2"
            >
              Sign Up
            </v-btn>

            <div class="text-center mt-6">
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
              color="red-darken-3"
              class="mb-6"
            ></v-otp-input>

            <v-alert
              v-if="error"
              type="error"
              variant="tonal"
              class="mb-4"
              closable
            >
              {{ error }}
            </v-alert>

            <v-btn
              type="submit"
              block
              color="red-darken-3"
              size="large"
              :loading="loading"
              class="text-none text-subtitle-1 font-weight-bold rounded-lg mb-4"
              elevation="2"
              :disabled="verificationCode.length !== 6"
            >
              Verify
            </v-btn>

            <v-btn
              variant="text"
              block
              color="grey-darken-1"
              @click="resendCode"
              :disabled="resendDisabled"
            >
              {{ resendDisabled ? `Resend in ${resendTimer}s` : "Resend Code" }}
            </v-btn>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
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
.circle-decoration {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.circle-1 {
  width: 300px;
  height: 300px;
  top: -50px;
  left: -50px;
}

.circle-2 {
  width: 200px;
  height: 200px;
  bottom: 50px;
  right: 50px;
}

.animate-logo {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
}
</style>
