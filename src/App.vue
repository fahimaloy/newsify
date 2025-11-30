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
        <img src="/logo.png" style="height: 50px" alt="Logo" />
        <span class="text-white text-h6">Channel July 36</span>
      </div>

      <v-spacer></v-spacer>

      <template v-slot:extension>
        <!-- News Ticker (Always visible) -->
        <v-card class="news-ticker" flat tile color="#f0f0f0">
          <v-card-text
            class="d-flex align-center justify-center py-1 px-4 news-ticker-text"
          >
            <transition name="slide" mode="out-in">
              <span
                :key="currentTickerTitle"
                class="news-title text-no-wrap overflow-hidden text-truncate"
              >
                {{ currentTickerTitle }}
              </span>
            </transition>
          </v-card-text>
        </v-card>
      </template>
    </v-app-bar>

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
                :to="`/category/${category.slug}`"
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

        <v-divider class="my-2"></v-divider>

        <!-- Settings item -->
        <v-list-item to="/settings" color="#C62828">
          <template v-slot:prepend>
            <v-icon>mdi-cog</v-icon>
          </template>
          <v-list-item-title>Settings</v-list-item-title>
        </v-list-item>

        <!-- Logout button (authenticated users only) -->
        <v-list-item 
          v-if="isAuthenticated"
          @click="handleLogout"
          color="error"
        >
          <template v-slot:prepend>
            <v-icon>mdi-logout</v-icon>
          </template>
          <v-list-item-title>Logout</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <router-view></router-view>
    </v-main>

    <!-- Modern Bottom Navigation - Hidden on login page -->
    <div v-if="!hideNavigation" class="modern-bottom-nav">
      <div class="nav-container">
        <router-link to="/" class="nav-item" :class="{ active: isNewsActive }">
          <div class="nav-icon-wrapper">
            <v-icon>mdi-newspaper</v-icon>
          </div>
          <span class="nav-label">News</span>
        </router-link>

        <!-- Categories button for administrators (except writers) -->
        <router-link
          v-if="isAdministrator && !isWriter"
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

        <!-- Users button for administrators (except writers) -->
        <router-link
          v-if="isAdministrator && !isWriter"
          to="/users"
          class="nav-item"
          :class="{ active: route.path === '/users' }"
        >
          <div class="nav-icon-wrapper">
            <v-icon>mdi-account-group</v-icon>
          </div>
          <span class="nav-label">Users</span>
        </router-link>

        <!-- Search button for subscribers (non-admins) -->
        <div
          v-if="!isAdministrator"
          class="nav-item"
          :class="{ active: showSearch }"
          @click="showSearch = true"
          style="cursor: pointer"
        >
          <div class="nav-icon-wrapper">
            <v-icon>mdi-magnify</v-icon>
          </div>
          <span class="nav-label">Search</span>
        </div>

        <router-link
          to="/profile"
          class="nav-item"
          :class="{ active: route.path === '/profile' }"
        >
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

    <!-- Search Overlay -->
    <SearchOverlay v-model="showSearch" />

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
import { ref, onMounted, computed, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import categoriesData from "./data/categories.json";
import SearchOverlay from "./components/SearchOverlay.vue";
import { useAuth } from "./composables/useAuth";
import { useNews } from "./composables/useNews";

const route = useRoute();
const router = useRouter();
const { isAuthenticated, user, isAdministrator, isWriter, logout } = useAuth();
const { init: initNews, sliderArticles, sync } = useNews();

const drawer = ref(false);
const isLoading = ref(true);
const showSearch = ref(false);
const currentTickerIndex = ref(0);

// Filter out the "home" category as it's handled separately
const categories = ref(categoriesData.filter((cat) => cat.slug !== "home"));

// Check if navigation should be hidden (e.g., on login page)
const hideNavigation = computed(() => route.meta.hideNavigation === true);

// Check if we're on the home page


// Check if News tab should be active (Home, Category, or Post pages)
const isNewsActive = computed(() => {
  const path = route.path;
  return (
    path === "/" || path.startsWith("/category/") || path.startsWith("/post/")
  );
});

// Current ticker title
const currentTickerTitle = computed(() => {
  if (sliderArticles.value.length === 0) return "Loading news...";
  return (
    sliderArticles.value[currentTickerIndex.value]?.title || "Channel July 36"
  );
});

// Auto-cycle ticker
let tickerInterval: number | undefined;

const startTickerCycle = () => {
  if (tickerInterval) clearInterval(tickerInterval);

  tickerInterval = window.setInterval(() => {
    if (sliderArticles.value.length > 0) {
      currentTickerIndex.value =
        (currentTickerIndex.value + 1) % sliderArticles.value.length;
    }
  }, 5000); // Change every 5 seconds
};

// Get user initials
const getUserInitials = (username?: string) => {
  if (!username) return "?";
  const parts = username.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return username.substring(0, 2).toUpperCase();
};

// Handle logout
const handleLogout = async () => {
  await logout();
  drawer.value = false; // Close drawer
  router.push("/"); // Redirect to home
};

onMounted(() => {
  initNews();
  startTickerCycle(); // Start ticker cycling

  // Listen for slider changes from Home.vue
  window.addEventListener("slider-change", (event: Event) => {
    const customEvent = event as CustomEvent;
    currentTickerIndex.value = customEvent.detail;
    // Restart ticker cycle when manually changed
    startTickerCycle();
  });

  setTimeout(() => {
    isLoading.value = false;
  }, 2500); // 2.5 second delay
  
  // Periodic sync for notifications (every 60 seconds)
  setInterval(() => {
    sync();
  }, 60000);
});

onUnmounted(() => {
  if (tickerInterval) clearInterval(tickerInterval);
  // Remove event listener
  window.removeEventListener("slider-change", () => {});
});
</script>

<style scoped>
/* News Ticker Styles */
.news-ticker {
  width: 100%;
  min-height: 40px;
  padding-top: 8px;
  border-top: 1px solid #b71c1c;
  border-bottom: 1px solid #a00003;
}

.news-ticker-text {
  display: flex;
  align-items: center;
  color: #c62828 !important;
}

.news-title {
  font-size: 0.9rem;
  font-weight: bold;
  max-width: 100%;
}

/* Slide transition styles */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.4s ease-in-out, opacity 0.4s ease-in-out;
}

.slide-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* Splash Screen */
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
/* Modern Bottom Navigation Styles */
.modern-bottom-nav {
  position: fixed;
  bottom: 5px; /* 5px gap from bottom */
  left: 0;
  right: 0;
  padding: 0 16px; /* Removed top/bottom padding as we use bottom: 5px */
  background: transparent; /* Removed full width background */
  backdrop-filter: none; /* Removed full width blur */
  -webkit-backdrop-filter: none;
  z-index: 1000;
  pointer-events: none; /* Allow clicking through the empty areas */
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
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15),
    /* Increased shadow for better separation */ 0 2px 8px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.5);
  pointer-events: auto; /* Re-enable clicks on the nav itself */
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
  color: #c62828;
}

.nav-item.active {
  background: linear-gradient(135deg, #c62828 0%, #d32f2f 100%);
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
  background: linear-gradient(135deg, #c62828 0%, #d32f2f 100%);
  padding: 8px;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(198, 40, 40, 0.3);
}

.nav-item-featured .nav-icon-wrapper {
  color: white;
}

.nav-item-featured.active .nav-icon-wrapper.featured {
  background: white;
  color: #c62828;
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

.nav-item-logout {
  color: #757575;
}

.nav-item-logout:hover {
  color: #d32f2f;
  background: rgba(211, 47, 47, 0.05);
}

.nav-item-logout:hover .nav-icon-wrapper {
  color: #d32f2f;
  transform: scale(1.1);
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
/* Global padding to prevent content from being hidden behind bottom navbar */
.v-main {
  padding-bottom: 120px !important; /* Increased to ensure visibility */
}

/* Glassmorphism effect for all dialog overlays */
.v-overlay__scrim {
  backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
  background-color: rgba(0, 0, 0, 0.4) !important;
}

/* Enhanced dialog appearance */
.v-dialog .v-card {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2) !important;
}
</style>
