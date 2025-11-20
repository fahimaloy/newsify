<template>
  <div>
    <PostSlider :slides="sliderArticles" @current-slide-title="updateActiveSliderTitle($event)" v-model:currentSlideIndex="currentSlideIndex" />

    <v-container>
      <v-row>
        <v-col cols="12" class="py-1" v-for="article in mainArticles" :key="article.id">
          <v-card class="custom-card-border mb-2">
            <v-img :src="article.image" height="200px" cover></v-img>

            <div class="post-details-container">
              <div class="post-details">
                <div class="category">{{ article.category }}</div>
                <div class="date">{{ article.date }}</div>
              </div>
            </div>

            <v-card-title class="single-post-title text-wrap font-weight-bold">{{ article.title }}</v-card-title>
            
            <v-card-text class="description-text">{{ article.snippet }}</v-card-text>

          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue';
import articlesData from '../data/articles.json';
import PostSlider from './PostSlider.vue';

const allArticles = ref(articlesData);
const currentSlideIndex = ref(0); // For v-model with PostSlider

const sliderArticles = computed(() => {
  return allArticles.value.filter(article => article.showInSlide);
});

const mainArticles = computed(() => {
  return allArticles.value.filter(article => !article.showInSlide);
});

// Inject the updater function from App.vue
const updateActiveSliderTitle = inject<(title: string) => void>('updateActiveSliderTitle', () => {});
</script>

<style scoped>
.post-details-container {
  padding: 0 16px; /* Horizontal padding like v-card-text */
}
.post-details {
  clear: both;
  margin-top: 12px;
}
.post-details::after {
  content: "";
  clear: both;
  display: table;
}

.category {
  float: left;
  font-size: 12px;
  font-weight: bold;
  background: #ED1C24;
  padding: 14px 15px 13px 14px;
  color: #FFF;
}

.date {
  float: left;
  font-size: 12px;
  color: #7C7C7C;
  border: 1px solid #E9E9E9;
  border-left: none;
  padding: 13px 14px 12px 13px;
  height: 44px; /* Match height of category */
  display: flex;
  align-items: center;
}

/* Custom border for v-card */
.custom-card-border {
  border: 1px solid #D0D0D0 !important;
  box-shadow: none !important;
}

/* New CSS for description text */
.description-text {
  /* This color is a medium-dark gray, making it look lighter/grayer than the default black text */
  color: #616161 !important;
  /* You can make it slightly smaller/lighter if needed, but color change is enough for requested look */
}
</style>
