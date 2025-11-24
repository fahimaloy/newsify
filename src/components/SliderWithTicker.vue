<template>
  <!-- News Ticker (Always visible) -->
  <v-card class="news-ticker" flat tile color="#f0f0f0">
    <v-card-text class="d-flex align-center justify-center py-1 px-4 news-ticker-text">
      <transition name="slide" mode="out-in">
        <span :key="currentTitle" class="news-title text-no-wrap overflow-hidden text-truncate">
          {{ currentTitle }}
        </span>
      </transition>
    </v-card-text>
  </v-card>

  <!-- Slider (Only on home page) -->
  <v-carousel
    v-if="showSlider && slides.length > 0"
    :show-arrows="true"
    :cycle="false"
    :interval="intervalDuration"
    height="300"
    hide-delimiters
    v-model="localSlideIndex"
  >
    <template #prev="{ props }">
      <v-btn size="x-large" color="transparent" rounded="0" class="carousel-arrow-btn" v-bind="props">
        <v-icon color="white">mdi-chevron-left</v-icon>
      </v-btn>
    </template>
    <template #next="{ props }">
      <v-btn size="x-large" color="transparent" rounded="0" class="carousel-arrow-btn" v-bind="props">
        <v-icon color="white">mdi-chevron-right</v-icon>
      </v-btn>
    </template>

    <v-carousel-item v-for="(slide, i) in slides" :key="i" :to="`/post/${slide.id}`">
      <v-img :src="slide.image" height="100%" cover>
        <div class="d-flex fill-height justify-center align-end text-white pa-4 slide-overlay">
          <div>
            <div class="text-caption text-shadow">{{ slide.category }} - {{ slide.date }}</div>
          </div>
        </div>
      </v-img>
    </v-carousel-item>
  </v-carousel>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue';

interface Article {
  id: number;
  title: string;
  category: string;
  date: string;
  snippet: string;
  image: string;
  showInSlide?: boolean;
}

const props = defineProps<{
  slides: Article[];
  showSlider?: boolean; // If false, only ticker is shown
}>();

const localSlideIndex = ref(0);
const intervalDuration = 5000; // 5 seconds per slide

let slideInterval: number | undefined;

// Current title to display in ticker
const currentTitle = computed(() => {
  if (props.slides.length === 0) return 'Loading news...';
  return props.slides[localSlideIndex.value]?.title || '';
});

// Auto-advance slides
const startAutoAdvance = () => {
  if (slideInterval) clearInterval(slideInterval);
  
  slideInterval = window.setInterval(() => {
    localSlideIndex.value = (localSlideIndex.value + 1) % props.slides.length;
  }, intervalDuration);
};

// Watch for slide changes
watch(localSlideIndex, () => {
  // Restart interval when user manually changes slide
  if (props.showSlider) {
    startAutoAdvance();
  }
});

// Watch slides array changes
watch(() => props.slides, (newSlides) => {
  if (newSlides.length > 0 && localSlideIndex.value >= newSlides.length) {
    localSlideIndex.value = 0;
  }
  if (props.showSlider) {
    startAutoAdvance();
  }
}, { immediate: true });

onMounted(() => {
  if (props.showSlider && props.slides.length > 0) {
    startAutoAdvance();
  } else if (!props.showSlider && props.slides.length > 0) {
    // Even without slider, cycle through titles for ticker
    slideInterval = window.setInterval(() => {
      localSlideIndex.value = (localSlideIndex.value + 1) % props.slides.length;
    }, intervalDuration);
  }
});

onUnmounted(() => {
  if (slideInterval) clearInterval(slideInterval);
});
</script>

<style scoped>
/* News Ticker Styles */
.news-ticker {
  width: 100%;
  min-height: 40px;
  padding-top: 8px;
  border-top: 1px solid #B71C1C;
  border-bottom: 1px solid #A00003;
}

.news-ticker-text {
  display: flex;
  align-items: center;
  color: #C62828 !important;
}

.news-title {
  font-size: 0.9rem;
  font-weight: bold;
  max-width: 100%;
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

/* Slider Styles */
.slide-overlay {
  background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 50%);
}

.text-shadow {
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.6);
}

.carousel-arrow-btn {
  background-color: rgba(255, 255, 255, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.5) !important;
  border-radius: 4px !important;
}
</style>
