<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Categories</h1>

        <!-- Loading state -->
        <div v-if="loading" class="text-center py-4">
          <v-progress-circular
            indeterminate
            color="primary"
            size="32"
          ></v-progress-circular>
        </div>

        <!-- Error state -->
        <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
          {{ error }}
        </v-alert>

        <!-- Categories list -->
        <v-list v-else density="compact">
          <template v-for="category in parentCategories" :key="category.id">
            <v-list-group
              v-if="getCategoryChildren(category.id).length > 0"
              :value="category.id"
            >
              <template v-slot:activator="{ props }">
                <v-list-item
                  v-bind="props"
                  :title="category.bn_name || category.name"
                  :to="`/category/${category.id}`"
                  color="#C62828"
                ></v-list-item>
              </template>
              <v-list-item
                v-for="child in getCategoryChildren(category.id)"
                :key="child.id"
                :title="child.bn_name || child.name"
                :to="`/category/${child.id}`"
                color="#C62828"
                class="pl-8"
              ></v-list-item>
            </v-list-group>
            <v-list-item
              v-else
              :title="category.bn_name || category.name"
              :to="`/category/${category.id}`"
              color="#C62828"
            ></v-list-item>
          </template>
        </v-list>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { newsAPI, type Category } from "../services/api";

const categories = ref<Category[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

// Get parent categories (those without parent_id)
const parentCategories = computed(() => {
  return categories.value.filter((cat) => !cat.parent_id);
});

// Get children of a specific category
const getCategoryChildren = (parentId: number) => {
  return categories.value.filter((cat) => cat.parent_id === parentId);
};

// Fetch categories from API
const fetchCategories = async () => {
  loading.value = true;
  error.value = null;

  try {
    categories.value = await newsAPI.getCategories();
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : "Failed to load categories";
    console.error("Error fetching categories:", err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchCategories();
});
</script>
