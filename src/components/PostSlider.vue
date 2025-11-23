<template>
  <v-progress-linear
    :model-value="progressBarValue"
    color="#C62828"
    background-color="#f0f0f0"
    height="5"
    striped
  ></v-progress-linear>

  <v-carousel
    :show-arrows="true"
    :cycle="false"
    :interval="intervalDuration"
    height="300"
    hide-delimiters
    :model-value="currentSlideIndex"
    @update:model-value="emits('update:currentSlideIndex', $event)"
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
import { defineProps, ref, watch, onMounted, onUnmounted, defineEmits } from 'vue';

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
  currentSlideIndex: number;
}>();

const emits = defineEmits(['update:currentSlideIndex', 'current-slide-title']);

// Remove local currentSlideIndex ref, it's now from props
const progressBarValue = ref(0);
const intervalDuration = 5000; // Time each slide is displayed

let progressAnimation: number | undefined;
let startTime: DOMHighResTimeStamp | undefined;

const animateProgress = (timestamp: DOMHighResTimeStamp) => {
  if (!startTime) startTime = timestamp;
  const elapsed = timestamp - startTime;
  const progress = (elapsed / intervalDuration) * 100;

  if (progress < 100) {
    progressBarValue.value = progress;
    progressAnimation = requestAnimationFrame(animateProgress);
  } else {
    progressBarValue.value = 100; // Ensure it reaches 100%
    cancelAnimationFrame(progressAnimation as number); // Stop current animation
    
    // Advance to next slide and restart animation for the new slide
    emits('update:currentSlideIndex', (props.currentSlideIndex + 1) % props.slides.length);
    // The watch on currentSlideIndex in parent will now reset and restart the animation
  }
};

// Start animation on mount or when slide changes
watch(() => props.currentSlideIndex, (newIndex) => { // Watch prop directly
  cancelAnimationFrame(progressAnimation as number); // Cancel any ongoing animation
  progressBarValue.value = 0; // Reset progress
  startTime = undefined; // Reset start time for next animation
  progressAnimation = requestAnimationFrame(animateProgress); // Start new animation
  
  // Emit the title of the newly active slide
  emits('current-slide-title', props.slides[newIndex].title);
});

onMounted(() => {
  progressAnimation = requestAnimationFrame(animateProgress);
  // Emit initial title when component mounts
  emits('current-slide-title', props.slides[props.currentSlideIndex].title);
});

onUnmounted(() => {
  cancelAnimationFrame(progressAnimation as number);
});
</script>

<style scoped>
.slide-overlay {
  background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 50%);
}

.text-shadow {
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.6);
}

.carousel-arrow-btn {
  background-color: rgba(255, 255, 255, 0.2) !important; /* Transparent white background */
  border: 1px solid rgba(255, 255, 255, 0.5) !important; /* Transparent white border */
  border-radius: 4px !important; /* Squarish with a little border radius */
}



</style>
