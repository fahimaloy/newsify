<template>
  <v-app>
    <!-- App Bar - Hidden on login page -->
    <v-app-bar v-if="!hideNavigation" app color="#C62828" elevation="0">
      <v-app-bar-nav-icon
        @click="drawer = !drawer"
        class="text-white"
      ></v-app-bar-nav-icon>

      <v-spacer></v-spacer>

      <div class="d-flex align-center">
        <img
          src="/logo.svg"
          style="height: 40px; margin-right: 12px"
          alt="Logo"
        />
        <span class="text-white text-h6">Channel July 36</span>
      </div>

      <v-spacer></v-spacer>
    </v-app-bar>

    <!-- News Ticker - Hidden on login page -->
    <NewsTicker v-if="!hideNavigation" :activeTitle="activeSliderTitle" />

    <!-- Navigation Drawer - Hidden on login page -->
    <v-navigation-drawer v-if="!hideNavigation" app v-model="drawer" temporary>
      <v-list density="compact" nav>
        <!-- Home item -->
        <v-list-item to="/" color="#C62828">
          <v-list-item-title>প্রচ্ছদ</v-list-item-title>
        </v-list-item>

        <!-- Categories and Subcategories -->
        <template v-for="(category, index) in categories" :key="index">
          <v-list-group
            v-if="category.children && category.children.length > 0"
            :value="category.slug"
          >
            <template v-slot:activator="{ props }">
              <v-list-item
                v-bind="props"
                :title="category.name"
                color="#C62828"
              ></v-list-item>
            </template>
            <v-list-item
              v-for="(child, i) in category.children"
              :key="i"
              :title="child.name"
              :to="`/category/${child.slug}`"
              color="#C62828"
            ></v-list-item>
          </v-list-group>
          <v-list-item
            v-else
            :title="category.name"
            :to="`/category/${category.slug}`"
            color="#C62828"
          ></v-list-item>
        </template>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <router-view></router-view>
    </v-main>

    <!-- Modern Bottom Navigation - Hidden on login page -->
    <div v-if="!hideNavigation" class="modern-bottom-nav">
      <div class="nav-container">
        <router-link to="/" class="nav-item" :class="{ active: route.path === '/' }">
          <div class="nav-icon-wrapper">
            <v-icon>mdi-home-variant</v-icon>
          </div>
          <span class="nav-label">Home</span>
        </router-link>

        <!-- Categories button only for administrators -->
        <router-link 
          v-if="isAdministrator" 
          to="/categories" 
          class="nav-item" 
          :class="{ active: route.path === '/categories' }"
        >
          <div class="nav-icon-wrapper">
            <v-icon>mdi-view-grid</v-icon>
          </div>
          <span class="nav-label">Categories</span>
        </router-link>

        <!-- Bookmarks for non-administrators -->
        <router-link 
          v-if="!isAdministrator" 
          to="/bookmarks" 
          class="nav-item" 
          :class="{ active: route.path === '/bookmarks' }"
        >
          <div class="nav-icon-wrapper">
            <v-icon>mdi-bookmark</v-icon>
          </div>
          <span class="nav-label">Saved</span>
        </router-link>

        <!-- Create Post button for administrators - Featured style -->
        <router-link 
          v-if="isAdministrator" 
          to="/create-post" 
          class="nav-item nav-item-featured" 
          :class="{ active: route.path === '/create-post' }"
        >
          <div class="nav-icon-wrapper featured">
            <v-icon size="28">mdi-plus-circle</v-icon>
          </div>
          <span class="nav-label">Create</span>
        </router-link>

        <router-link to="/profile" class="nav-item" :class="{ active: route.path === '/profile' }">
          <div class="nav-icon-wrapper">
            <v-avatar v-if="isAuthenticated && user" size="24" color="#C62828">
              <span class="text-caption text-white font-weight-bold">
                {{ getUserInitials(user.username) }}
              </span>
            </v-avatar>
            <v-icon v-else>mdi-account-circle</v-icon>
          </div>
          <span class="nav-label">Profile</span>
        </router-link>
      </div>
    </div>

    <!-- Splash Screen -->
    <div v-if="isLoading" class="splash-overlay">
      <div class="text-center">
        <img src="/logo.svg" class="splash-logo" alt="Logo" />
        <h2 class="splash-tagline text-white mt-4">তারুণ্যের কথা বলে</h2>
      </div>
    </div>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted, provide, computed } from "vue";
import { useRoute } from "vue-router";
import categoriesData from "./data/categories.json";
import NewsTicker from "./components/NewsTicker.vue";
import { useAuth } from "./composables/useAuth";

import { useNews } from "./composables/useNews";

const route = useRoute();
const { isAuthenticated, user, isAdministrator } = useAuth();
const { init: initNews } = useNews();

const drawer = ref(false);
const isLoading = ref(true);
const activeSliderTitle = ref("");

// Filter out the "home" category as it's handled separately
const categories = ref(categoriesData.filter((cat) => cat.slug !== "home"));

// Check if navigation should be hidden (e.g., on login page)
const hideNavigation = computed(() => route.meta.hideNavigation === true);

// Get user initials
const getUserInitials = (username?: string) => {
  if (!username) return "?";
  const parts = username.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return username.substring(0, 2).toUpperCase();
};

// Provide a function to update the active slider title
const updateActiveSliderTitle = (title: string) => {
  activeSliderTitle.value = title;
};
provide("updateActiveSliderTitle", updateActiveSliderTitle);

onMounted(() => {
  initNews();
  setTimeout(() => {
    isLoading.value = false;
  }, 2500); // 2.5 second delay
});
</script>

<style scoped>
.splash-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #c62828;
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
}

.splash-logo {
  height: 120px;
  max-width: 250px;
  animation: fadeIn 1s ease-in-out;
}

.splash-tagline {
  font-family: "Noto Sans Bengali", sans-serif;
  font-size: 1.5rem; /* Larger font size */
  animation: popUp 0.8s ease-out 0.5s;
  animation-fill-mode: forwards;
  opacity: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes popUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Modern Bottom Navigation Styles */
.modern-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px 20px;
  background: linear-gradient(to top, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0) 100%);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  z-index: 1000;
}

.nav-container {
  max-width: 500px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 30px;
  padding: 8px 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1),
              0 2px 8px rgba(0, 0, 0, 0.05),
              inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 20px;
  text-decoration: none;
  color: #666;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  min-width: 60px;
}

.nav-item:hover {
  transform: translateY(-2px);
  color: #C62828;
}

.nav-item.active {
  background: linear-gradient(135deg, #C62828 0%, #D32F2F 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(198, 40, 40, 0.3),
              0 2px 4px rgba(198, 40, 40, 0.2);
}

.nav-item.active .nav-icon-wrapper {
  transform: scale(1.1);
}

.nav-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-icon-wrapper.featured {
  background: linear-gradient(135deg, #C62828 0%, #D32F2F 100%);
  padding: 8px;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(198, 40, 40, 0.3);
}

.nav-item-featured {
  transform: translateY(-8px);
}

.nav-item-featured .nav-icon-wrapper {
  color: white;
}

.nav-item-featured.active .nav-icon-wrapper.featured {
  background: white;
  color: #C62828;
  box-shadow: 0 6px 16px rgba(198, 40, 40, 0.4);
}

.nav-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.3px;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.nav-item.active .nav-label {
  font-weight: 600;
}

/* Smooth entry animation */
.modern-bottom-nav {
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Responsive adjustments */
@media (max-width: 400px) {
  .nav-container {
    padding: 6px 8px;
  }
  
  .nav-item {
    padding: 6px 8px;
    min-width: 50px;
  }
  
  .nav-label {
    font-size: 10px;
  }
}
</style>

<style>
/* Global override for v-main padding to account for fixed NewsTicker */
.v-main__wrap {
  padding-top: 106px !important;
}
</style>
