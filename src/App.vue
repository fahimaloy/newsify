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

    <!-- Bottom Navigation - Hidden on login page, dynamic based on auth -->
    <v-bottom-navigation v-if="!hideNavigation" app grow>
      <v-btn to="/">
        <v-icon>mdi-home</v-icon>
        <span>Home</span>
      </v-btn>

      <!-- Show Create Post button for authenticated users -->
      <v-btn v-if="isAuthenticated" to="/create-post" color="#C62828">
        <v-icon size="32">mdi-plus-circle</v-icon>
        <span>Create</span>
      </v-btn>

      <!-- Show Categories and Bookmarks for non-authenticated users -->
      <template v-else>
        <v-btn to="/categories">
          <v-icon>mdi-format-list-bulleted</v-icon>
          <span>Categories</span>
        </v-btn>
        <v-btn to="/bookmarks">
          <v-icon>mdi-bookmark</v-icon>
          <span>Bookmarks</span>
        </v-btn>
      </template>

      <v-btn to="/profile">
        <v-icon>mdi-account</v-icon>
        <span>Profile</span>
      </v-btn>
    </v-bottom-navigation>

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

const route = useRoute();
const { isAuthenticated } = useAuth();

const drawer = ref(false);
const isLoading = ref(true);
const activeSliderTitle = ref("");

// Filter out the "home" category as it's handled separately
const categories = ref(categoriesData.filter((cat) => cat.slug !== "home"));

// Check if navigation should be hidden (e.g., on login page)
const hideNavigation = computed(() => route.meta.hideNavigation === true);

// Provide a function to update the active slider title
const updateActiveSliderTitle = (title: string) => {
  activeSliderTitle.value = title;
};
provide("updateActiveSliderTitle", updateActiveSliderTitle);

onMounted(() => {
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
</style>

<style>
/* Global override for v-main padding to account for fixed NewsTicker */
.v-main__wrap {
  padding-top: 106px !important;
}
</style>
