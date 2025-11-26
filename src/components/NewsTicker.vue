<template>
  <v-card class="news-ticker" flat tile color="#f0f0f0">
    <v-card-text class="d-flex align-center justify-center py-1 px-4 news-ticker-text">
      <transition name="slide" mode="out-in">
        <span :key="activeTitle" class="news-title text-no-wrap overflow-hidden text-truncate">
          {{ activeTitle }}
        </span>
      </transition>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

defineProps<{
  activeTitle: string;
}>();
</script>

<style scoped>
.news-ticker {
  width: 100%;
  min-height: 40px;
  padding-top: 8px;
  border-top: 1px solid #B71C1C; /* Darker red */
  border-bottom: 1px solid #A00003; /* Even darker red */
}

.news-ticker-text {
  display: flex;
  align-items: center;
  color: #C62828 !important; /* Text color of navbar bg */
}

.news-title {
  font-size: 0.9rem;
  font-weight: bold; /* Make the text bold */
  max-width: 100%; /* Adjust based on icon width */
}

/* Slide transition styles */
.slide-enter-active, .slide-leave-active {
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
</style>
