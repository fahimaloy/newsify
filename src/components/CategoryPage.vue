<template>
  <v-container class="py-4">
    <!-- Loading State -->
    <div v-if="loading" class="d-flex justify-center align-center" style="min-height: 400px">
      <v-progress-circular indeterminate color="#C62828" size="64"></v-progress-circular>
    </div>

    <template v-else-if="currentCategory">
      <!-- Category Header -->
      <div class="mb-6">
        <h1 class="text-h4 font-weight-bold mb-2" style="color: #C62828">
          {{ currentCategory.name }}
        </h1>
        <v-divider class="mb-4"></v-divider>

        <!-- Subcategories Navigation -->
        <div v-if="hasSubcategories || parentCategory" class="d-flex flex-wrap gap-2 mb-4">
          <!-- 'All' Option -->
          <v-chip
            :color="isMainCategoryPage ? '#C62828' : undefined"
            :variant="isMainCategoryPage ? 'flat' : 'outlined'"
            class="ma-1"
            :to="`/category/${mainCategorySlug}`"
            link
          >
            সব
          </v-chip>

          <!-- Subcategories -->
          <v-chip
            v-for="sub in availableSubcategories"
            :key="sub.slug"
            :color="currentCategory.slug === sub.slug ? '#C62828' : undefined"
            :variant="currentCategory.slug === sub.slug ? 'flat' : 'outlined'"
            class="ma-1"
            :to="`/category/${sub.slug}`"
            link
          >
            {{ sub.name }}
          </v-chip>
        </div>
      </div>

      <!-- Posts Grid -->
      <v-row v-if="filteredPosts.length > 0">
        <v-col
          v-for="post in filteredPosts"
          :key="post.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <v-card class="h-100 d-flex flex-column hover-card" :to="`/post/${post.id}`" elevation="2">
            <v-img
              :src="post.image"
              height="200"
              cover
              class="bg-grey-lighten-2"
            >
              <template v-slot:placeholder>
                <div class="d-flex align-center justify-center fill-height">
                  <v-progress-circular indeterminate color="grey-lighten-4"></v-progress-circular>
                </div>
              </template>
            </v-img>

            <v-card-item class="flex-grow-1">
              <div class="d-flex align-center mb-2">
                <v-chip
                  size="x-small"
                  color="#C62828"
                  variant="flat"
                  class="mr-2"
                >
                  {{ post.category }}
                </v-chip>
                <span class="text-caption text-grey">{{ post.date }}</span>
              </div>
              
              <div class="text-h6 font-weight-bold mb-2 line-clamp-2">
                {{ post.title }}
              </div>
              
              <div class="text-body-2 text-grey-darken-1 line-clamp-3">
                {{ post.snippet }}
              </div>
            </v-card-item>
          </v-card>
        </v-col>
      </v-row>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <v-icon size="64" color="grey-lighten-1">mdi-newspaper-variant-outline</v-icon>
        <h3 class="text-h6 text-grey mt-4">এই বিভাগে কোন সংবাদ পাওয়া যায়নি</h3>
      </div>
    </template>

    <!-- Not Found -->
    <div v-else class="text-center py-12">
      <h3 class="text-h5 text-grey">বিভাগটি পাওয়া যায়নি</h3>
      <v-btn color="#C62828" variant="text" to="/" class="mt-4">
        হোম পেজে ফিরে যান
      </v-btn>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useNews } from '../composables/useNews';
import categoriesData from '../data/categories.json';

const route = useRoute();
const { posts, transformPostToArticle, loading, init } = useNews();

// Helper to find category by slug recursively
const findCategory = (slug: string, categories: any[]): any => {
  for (const cat of categories) {
    if (cat.slug === slug) return cat;
    if (cat.children) {
      const found = findCategory(slug, cat.children);
      if (found) return found;
    }
  }
  return null;
};

// Helper to find parent category
const findParentCategory = (slug: string, categories: any[]): any => {
  for (const cat of categories) {
    if (cat.children && cat.children.some((c: any) => c.slug === slug)) {
      return cat;
    }
    if (cat.children) {
      const found = findParentCategory(slug, cat.children);
      if (found) return found;
    }
  }
  return null;
};

const currentCategory = computed(() => {
  const slug = route.params.slug as string;
  return findCategory(slug, categoriesData);
});

const parentCategory = computed(() => {
  const slug = route.params.slug as string;
  return findParentCategory(slug, categoriesData);
});

const hasSubcategories = computed(() => {
  return currentCategory.value?.children && currentCategory.value.children.length > 0;
});

const isMainCategoryPage = computed(() => {
  return hasSubcategories.value || !parentCategory.value;
});

const mainCategorySlug = computed(() => {
  if (parentCategory.value) return parentCategory.value.slug;
  return currentCategory.value?.slug;
});

const availableSubcategories = computed(() => {
  if (parentCategory.value) {
    return parentCategory.value.children;
  }
  if (hasSubcategories.value) {
    return currentCategory.value.children;
  }
  return [];
});

const filteredPosts = computed(() => {
  if (!currentCategory.value) return [];
  
  const rawPosts = posts.value;
  const currentCat = currentCategory.value;
  
  let filteredRawPosts = [];

  if (hasSubcategories.value) {
    // Parent category view (shows all subcategories)
    const childNames = currentCat.children.map((c: any) => c.name);
    const targetNames = [currentCat.name, ...childNames];
    
    filteredRawPosts = rawPosts.filter(post => {
      const postCatName = post.category?.bn_name || post.category?.name;
      const postTopicNames = post.topics?.map(t => t.bn_name || t.name) || [];
      
      const isCategoryMatch = targetNames.includes(postCatName);
      const isTopicMatch = postTopicNames.some(t => targetNames.includes(t));
      
      return isCategoryMatch || isTopicMatch;
    });
  } else {
    // Specific category view
    const targetName = currentCat.name;
    
    filteredRawPosts = rawPosts.filter(post => {
      const postCatName = post.category?.bn_name || post.category?.name;
      const postTopicNames = post.topics?.map(t => t.bn_name || t.name) || [];
      
      return postCatName === targetName || postTopicNames.includes(targetName);
    });
  }
  
  // Sort by date descending
  filteredRawPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  return filteredRawPosts.map(post => transformPostToArticle(post));
});

onMounted(() => {
  init();
});
</script>

<style scoped>
.hover-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.hover-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.1) !important;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.gap-2 {
  gap: 8px;
}
</style>
