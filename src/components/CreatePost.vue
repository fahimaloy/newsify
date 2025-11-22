<template>
  <v-container class="create-post-container">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-6">Create New Post</h1>

        <v-form @submit.prevent="handleSubmit" ref="formRef">
          <v-card elevation="2" class="pa-6">
            <!-- Title -->
            <v-text-field
              v-model="form.title"
              label="Post Title *"
              variant="outlined"
              color="#C62828"
              :rules="[rules.required]"
              :disabled="loading"
              class="mb-4"
            ></v-text-field>

            <!-- Description -->
            <v-textarea
              v-model="form.description"
              label="Description *"
              variant="outlined"
              color="#C62828"
              :rules="[rules.required]"
              :disabled="loading"
              rows="6"
              class="mb-4"
            ></v-textarea>

            <!-- Category -->
            <v-select
              v-model="form.category_id"
              :items="categories"
              item-title="name"
              item-value="id"
              label="Category *"
              variant="outlined"
              color="#C62828"
              :rules="[rules.required]"
              :disabled="loading || categoriesLoading"
              :loading="categoriesLoading"
              class="mb-4"
            >
              <template v-slot:item="{ props, item }">
                <v-list-item
                  v-bind="props"
                  :title="item.raw.bn_name || item.raw.name"
                  :class="{ 'pl-8': item.raw.parent_id }"
                ></v-list-item>
              </template>
              <template v-slot:selection="{ item }">
                {{ item.raw.bn_name || item.raw.name }}
              </template>
            </v-select>

            <!-- Topics (Multi-select) -->
            <v-select
              v-model="form.topic_ids"
              :items="categories"
              item-title="name"
              item-value="id"
              label="Topics"
              variant="outlined"
              color="#C62828"
              :disabled="loading || categoriesLoading"
              :loading="categoriesLoading"
              multiple
              chips
              closable-chips
              class="mb-4"
            >
              <template v-slot:chip="{ item }">
                <v-chip closable>
                  {{ item.raw.bn_name || item.raw.name }}
                </v-chip>
              </template>
              <template v-slot:item="{ props, item }">
                <v-list-item
                  v-bind="props"
                  :title="item.raw.bn_name || item.raw.name"
                  :class="{ 'pl-8': item.raw.parent_id }"
                ></v-list-item>
              </template>
            </v-select>

            <!-- Image Upload -->
            <v-file-input
              v-model="form.image"
              label="Upload Image"
              variant="outlined"
              color="#C62828"
              prepend-icon="mdi-camera"
              accept="image/*"
              :disabled="loading"
              show-size
              class="mb-4"
            ></v-file-input>

            <!-- Image Preview -->
            <div v-if="imagePreview" class="mb-4">
              <p class="text-caption text-grey mb-2">Image Preview:</p>
              <v-img
                :src="imagePreview"
                max-height="300"
                contain
                class="rounded"
              ></v-img>
            </div>

            <!-- Error Alert -->
            <v-alert
              v-if="error"
              type="error"
              variant="tonal"
              closable
              @click:close="error = ''"
              class="mb-4"
            >
              {{ error }}
            </v-alert>

            <!-- Success Alert -->
            <v-alert
              v-if="success"
              type="success"
              variant="tonal"
              closable
              @click:close="success = ''"
              class="mb-4"
            >
              {{ success }}
            </v-alert>

            <!-- Action Buttons -->
            <div class="d-flex gap-3">
              <v-btn
                type="submit"
                color="#C62828"
                size="large"
                :loading="loading"
                :disabled="loading"
                prepend-icon="mdi-send"
                class="flex-grow-1"
              >
                Create Post
              </v-btn>
              <v-btn
                color="grey"
                variant="outlined"
                size="large"
                :disabled="loading"
                @click="resetForm"
                prepend-icon="mdi-refresh"
              >
                Reset
              </v-btn>
            </div>
          </v-card>
        </v-form>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth";
import { newsAPI, type Category } from "../services/api";

const router = useRouter();
const { isAuthenticated, getAuthHeader } = useAuth();

const formRef = ref();
const loading = ref(false);
const categoriesLoading = ref(false);
const error = ref("");
const success = ref("");

const categories = ref<Category[]>([]);

const form = ref({
  title: "",
  description: "",
  category_id: null as number | null,
  topic_ids: [] as number[],
  image: null as File[] | null,
});

const rules = {
  required: (value: any) => !!value || "This field is required",
};

// Image preview
const imagePreview = computed(() => {
  if (form.value.image && form.value.image.length > 0) {
    return URL.createObjectURL(form.value.image[0]);
  }
  return null;
});

// Fetch categories
const fetchCategories = async () => {
  categoriesLoading.value = true;
  try {
    categories.value = await newsAPI.getCategories();
  } catch (err) {
    console.error("Failed to load categories:", err);
    error.value = "Failed to load categories";
  } finally {
    categoriesLoading.value = false;
  }
};

// Submit form
const handleSubmit = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  loading.value = true;
  error.value = "";
  success.value = "";

  try {
    const formData = new FormData();
    formData.append("title", form.value.title);
    formData.append("description", form.value.description);

    if (form.value.category_id) {
      formData.append("category_id", form.value.category_id.toString());
    }

    form.value.topic_ids.forEach((id) => {
      formData.append("topic_ids", id.toString());
    });

    if (form.value.image && form.value.image.length > 0) {
      formData.append("image", form.value.image[0]);
    }

    const API_BASE_URL =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    const response = await fetch(`${API_BASE_URL}/api/v1/posts/`, {
      method: "POST",
      headers: getAuthHeader(),
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to create post");
    }

    success.value = "Post created successfully!";
    resetForm();

    // Redirect to home after 2 seconds
    setTimeout(() => {
      router.push("/");
    }, 2000);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to create post";
    console.error("Create post error:", err);
  } finally {
    loading.value = false;
  }
};

// Reset form
const resetForm = () => {
  form.value = {
    title: "",
    description: "",
    category_id: null,
    topic_ids: [],
    image: null,
  };
  formRef.value?.reset();
  error.value = "";
  success.value = "";
};

// Check authentication
watch(isAuthenticated, (newVal) => {
  if (!newVal) {
    router.push("/login");
  }
});

onMounted(() => {
  if (!isAuthenticated.value) {
    router.push("/login");
    return;
  }
  fetchCategories();
});
</script>

<style scoped>
.create-post-container {
  max-width: 800px;
  margin: 0 auto;
}

.gap-3 {
  gap: 12px;
}
</style>
