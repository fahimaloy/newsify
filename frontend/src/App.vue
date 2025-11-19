<template>
  <v-app>
    <v-app-bar app color="#C62828" elevation="0">
      <v-app-bar-nav-icon @click="drawer = !drawer" class="text-white"></v-app-bar-nav-icon>
      
      <v-spacer></v-spacer>

      <div class="d-flex align-center">
        <img src="/logo.svg" style="height: 40px; margin-right: 12px;" alt="Logo" />
        <span class="text-white text-h6">Channel July 36</span>
      </div>
      
      <v-spacer></v-spacer>
    </v-app-bar>

    <NewsTicker :activeTitle="activeSliderTitle" />


    <v-navigation-drawer app v-model="drawer" temporary>
      <v-list density="compact" nav>
        <!-- Home item -->
        <v-list-item to="/" color="#C62828">
          <v-list-item-title>প্রচ্ছদ</v-list-item-title>
        </v-list-item>

        <!-- Categories and Subcategories -->
        <template v-for="(category, index) in categories" :key="index">
          <v-list-group v-if="category.children && category.children.length > 0" :value="category.slug">
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

    <v-bottom-navigation app grow>
      <v-btn to="/">
        <v-icon>mdi-home</v-icon>
        <span>Home</span>
      </v-btn>
      <v-btn to="/categories">
        <v-icon>mdi-format-list-bulleted</v-icon>
        <span>Categories</span>
      </v-btn>
      <v-btn to="/bookmarks">
        <v-icon>mdi-bookmark</v-icon>
        <span>Bookmarks</span>
      </v-btn>
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
import { ref, onMounted, provide } from 'vue';
import categoriesData from './data/categories.json';
import NewsTicker from './components/NewsTicker.vue'; // Import NewsTicker

const drawer = ref(false);
const isLoading = ref(true);
const activeSliderTitle = ref(''); // State for NewsTicker

// Filter out the "home" category as it's handled separately
const categories = ref(categoriesData.filter(cat => cat.slug !== 'home'));

// Provide a function to update the active slider title
const updateActiveSliderTitle = (title: string) => {
  activeSliderTitle.value = title;
};
provide('updateActiveSliderTitle', updateActiveSliderTitle);

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
  background-color: #C62828;
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
  font-family: 'Noto Sans Bengali', sans-serif;
  font-size: 1.5rem; /* Larger font size */
  animation: popUp 0.8s ease-out 0.5s;
  animation-fill-mode: forwards;
  opacity: 0;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
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

