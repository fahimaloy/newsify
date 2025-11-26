<template>
  <v-container class="create-post-container pb-16">
    <v-row justify="center">
      <v-col cols="12" lg="10" xl="8">
        <div class="d-flex align-center mb-6">
          <v-btn icon="mdi-arrow-left" variant="text" class="mr-2" @click="router.back()" v-if="isEditing"></v-btn>
          <v-icon size="40" color="primary" class="mr-3">{{ isEditing ? 'mdi-pencil-box-outline' : 'mdi-post-outline' }}</v-icon>
          <h1 class="text-h4 font-weight-bold">{{ isEditing ? 'Edit Post' : 'Create New Post' }}</h1>
        </div>

        <v-form @submit.prevent="handleSubmit" ref="formRef">
          <v-card elevation="3" class="rounded-xl overflow-hidden">
            <v-card-text class="pa-4 pa-md-8">
              <v-row>
                <!-- Title -->
                <v-col cols="12">
                  <v-text-field
                    v-model="form.title"
                    label="Post Title"
                    variant="outlined"
                    color="primary"
                    :rules="[rules.required]"
                    :disabled="loading"
                    density="comfortable"
                    prepend-inner-icon="mdi-format-title"
                    placeholder="Enter an engaging title..."
                    class="mb-2"
                  ></v-text-field>
                </v-col>

                <!-- Description -->
                <v-col cols="12">
                  <div class="mb-4">
                    <label class="text-subtitle-1 font-weight-medium text-grey-darken-3 mb-3 d-block">
                      <v-icon size="20" class="mr-1">mdi-text</v-icon>
                      Description *
                    </label>
                    <SimpleRichEditor
                      v-model="form.description"
                      :disabled="loading"
                    />
                  </div>
                </v-col>

                <!-- Category & Status Row -->
                <v-col cols="12" md="6">
                  <v-select
                    v-model="form.category_id"
                    :items="parentCategories"
                    item-title="name"
                    item-value="id"
                    label="Category"
                    variant="outlined"
                    color="primary"
                    :rules="[rules.required]"
                    :disabled="loading || categoriesLoading"
                    :loading="categoriesLoading"
                    density="comfortable"
                    prepend-inner-icon="mdi-shape"
                  >
                    <template v-slot:item="{ props, item }">
                      <v-list-item
                        v-bind="props"
                        :title="item.raw.bn_name || item.raw.name"
                      ></v-list-item>
                    </template>
                    <template v-slot:selection="{ item }">
                      {{ item.raw.bn_name || item.raw.name }}
                    </template>
                  </v-select>
                </v-col>

                <v-col cols="12" md="6">
                  <!-- Status Selection -->
                  <v-select
                    v-model="form.status"
                    :items="statusOptions"
                    item-title="title"
                    item-value="value"
                    label="Status"
                    variant="outlined"
                    color="primary"
                    density="comfortable"
                    prepend-inner-icon="mdi-list-status"
                    class="mb-4"
                  >
                    <template v-slot:item="{ props, item }">
                      <v-list-item v-bind="props">
                        <template v-slot:prepend>
                          <v-icon :color="getStatusColor(item.value)">{{ getStatusIcon(item.value) }}</v-icon>
                        </template>
                        <v-list-item-title>{{ item.title }}</v-list-item-title>
                      </v-list-item>
                    </template>
                    <template v-slot:selection="{ item }">
                      <div class="d-flex align-center">
                        <v-icon :color="getStatusColor(item.value)" size="small" class="mr-2">{{ getStatusIcon(item.value) }}</v-icon>
                        {{ item.title }}
                      </div>
                    </template>
                  </v-select>

                  <!-- Scheduling Toggle -->
                  <v-switch
                    v-model="isScheduled"
                    label="Schedule Publication"
                    color="primary"
                    inset
                    hide-details
                    class="mb-2"
                  ></v-switch>

                  <!-- Date Time Picker (Visible only when scheduled) -->
                  <v-expand-transition>
                    <div v-if="isScheduled">
                      <v-text-field
                        v-model="form.scheduled_at"
                        label="Select Date & Time"
                        type="datetime-local"
                        variant="outlined"
                        color="primary"
                        density="comfortable"
                        prepend-inner-icon="mdi-calendar-clock"
                        :rules="[rules.required]"
                        hint="Post will be published automatically at this time"
                        persistent-hint
                        class="mb-4"
                      ></v-text-field>
                    </div>
                  </v-expand-transition>
                </v-col>

                <!-- Topics -->
                <v-col cols="12">
                  <v-select
                    v-model="form.topic_ids"
                    :items="topicOptions"
                    item-title="name"
                    item-value="id"
                    item-props="props"
                    label="Topics (Optional)"
                    variant="outlined"
                    color="primary"
                    :disabled="loading || categoriesLoading"
                    :loading="categoriesLoading"
                    multiple
                    chips
                    density="comfortable"
                    prepend-inner-icon="mdi-tag-multiple"
                  >
                    <template v-slot:chip="{ item, index }">
                      <v-chip
                        closable
                        color="primary"
                        variant="tonal"
                        size="small"
                        @click:close="removeTopicChip(index)"
                      >
                        {{ item.raw.bn_name || item.raw.name }}
                      </v-chip>
                    </template>
                    <template v-slot:item="{ props, item }">
                      <v-list-item
                        v-bind="props"
                        :title="item.raw.bn_name || item.raw.name"
                        :disabled="!item.raw.parent_id"
                      ></v-list-item>
                    </template>
                  </v-select>
                </v-col>

                <!-- Media Section (Image/Video) -->
                <v-col cols="12">
                  <v-card variant="outlined" class="rounded-lg">
                    <v-tabs v-model="mediaInputMethod" color="primary" density="comfortable" bg-color="grey-lighten-4">
                      <v-tab value="upload">
                        <v-icon start>mdi-upload</v-icon>
                        Upload Image
                      </v-tab>
                      <v-tab value="url">
                        <v-icon start>mdi-link</v-icon>
                        Image URL
                      </v-tab>
                      <v-tab value="video">
                        <v-icon start>mdi-youtube</v-icon>
                        Video URL
                      </v-tab>
                    </v-tabs>

                    <v-window v-model="mediaInputMethod" class="pa-4">
                      <v-window-item value="upload">
                        <v-file-input
                          v-model="form.imageFile"
                          label="Upload Image"
                          variant="outlined"
                          color="primary"
                          prepend-icon="mdi-camera"
                          accept="image/*"
                          :disabled="loading"
                          show-size
                          density="comfortable"
                          @update:model-value="handleImageFileChange"
                        ></v-file-input>
                      </v-window-item>

                      <v-window-item value="url">
                        <v-text-field
                          v-model="form.imageUrl"
                          label="Image URL"
                          variant="outlined"
                          color="primary"
                          prepend-inner-icon="mdi-link-variant"
                          :disabled="loading"
                          density="comfortable"
                          placeholder="https://example.com/image.jpg"
                          @update:model-value="handleImageUrlChange"
                        ></v-text-field>
                      </v-window-item>

                      <v-window-item value="video">
                        <v-text-field
                          v-model="form.videoUrl"
                          label="YouTube Video URL"
                          variant="outlined"
                          color="primary"
                          prepend-inner-icon="mdi-youtube"
                          :disabled="loading"
                          density="comfortable"
                          placeholder="https://www.youtube.com/watch?v=..."
                          hint="Enter a valid YouTube video URL"
                          persistent-hint
                        ></v-text-field>
                      </v-window-item>
                    </v-window>
                  </v-card>
                </v-col>

                <!-- Media Preview -->
                <v-col cols="12" v-if="mediaPreview">
                  <v-card variant="outlined" class="rounded-lg overflow-hidden">
                    <v-card-title class="text-subtitle-1 pa-3 bg-grey-lighten-4">
                      <v-icon start size="small">{{ isVideoPreview ? 'mdi-youtube' : 'mdi-image' }}</v-icon>
                      {{ isVideoPreview ? 'Video Preview' : 'Image Preview' }}
                    </v-card-title>
                    <v-divider></v-divider>
                    <v-card-text class="pa-0">
                      <!-- Video Preview -->
                      <div v-if="isVideoPreview" class="video-container">
                        <iframe
                          :src="getEmbedUrl(form.videoUrl)"
                          title="YouTube video player"
                          frameborder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowfullscreen
                        ></iframe>
                      </div>
                      
                      <!-- Image Preview -->
                      <v-img
                        v-else
                        :src="mediaPreview"
                        max-height="400"
                        contain
                        class="bg-grey-lighten-5"
                      >
                        <template v-slot:placeholder>
                          <div class="d-flex align-center justify-center fill-height">
                            <v-progress-circular indeterminate color="primary"></v-progress-circular>
                          </div>
                        </template>
                      </v-img>
                    </v-card-text>
                  </v-card>
                </v-col>

                <!-- Alerts -->
                <v-col cols="12" v-if="error || success">
                  <v-alert
                    v-if="error"
                    type="error"
                    variant="tonal"
                    closable
                    @click:close="error = ''"
                    class="mb-0"
                  >
                    {{ error }}
                  </v-alert>

                  <v-alert
                    v-if="success"
                    type="success"
                    variant="tonal"
                    closable
                    @click:close="success = ''"
                    class="mb-0"
                  >
                    {{ success }}
                  </v-alert>
                </v-col>
              </v-row>
            </v-card-text>

            <v-divider></v-divider>

            <!-- Action Buttons -->
            <v-card-actions class="pa-6 d-flex flex-column flex-sm-row gap-4">
              <v-btn
                variant="outlined"
                size="large"
                :disabled="loading"
                @click="resetForm"
                prepend-icon="mdi-refresh"
                class="w-100 w-sm-auto mb-3 mb-sm-0"
              >
                Reset
              </v-btn>
              <v-spacer class="d-none d-sm-block"></v-spacer>
              <v-btn
                type="submit"
                color="primary"
                size="large"
                :loading="loading"
                :disabled="loading"
                :prepend-icon="isEditing ? 'mdi-content-save' : 'mdi-send'"
                variant="elevated"
                class="w-100 w-sm-auto px-8"
              >
                {{ isEditing ? 'Update Post' : 'Create Post' }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-form>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuth } from "../composables/useAuth";
import { newsAPI, type Category } from "../services/api";
import SimpleRichEditor from "./SimpleRichEditor.vue";

const router = useRouter();
const route = useRoute();
const { isAuthenticated, getAuthHeader } = useAuth();

const formRef = ref();
const loading = ref(false);
const categoriesLoading = ref(false);
const error = ref("");
const success = ref("");
const mediaInputMethod = ref("upload");

const categories = ref<Category[]>([]);

const parentCategories = computed(() => categories.value.filter(c => !c.parent_id));

const topicOptions = computed(() => {
  return categories.value.map(c => ({
    ...c,
    props: {
      disabled: !c.parent_id,
      class: c.parent_id ? 'pl-8' : 'font-weight-bold text-grey-darken-2 bg-grey-lighten-4'
    }
  }));
});

const statusOptions = [
  { title: 'Draft', value: 'draft' },
  { title: 'Pending Review', value: 'pending' },
  { title: 'Published', value: 'published' },
  { title: 'Scheduled', value: 'scheduled' },
];

const form = ref({
  title: "",
  description: "",
  category_id: null as number | null,
  topic_ids: [] as number[],
  imageFile: null as File[] | null,
  imageUrl: "",
  videoUrl: "",
  scheduled_at: "",
  status: "draft",
});

const isScheduled = ref(false);

// Watch for scheduling toggle
watch(isScheduled, (newVal) => {
  if (newVal) {
    form.value.status = 'published';
  } else {
    form.value.scheduled_at = "";
  }
});

// Watch for status changes - if user changes status away from published while scheduled, turn off schedule?
// Or force status to published? User requirement: "if enabled scheduling, post status must needs to be published"
watch(() => form.value.status, (newVal) => {
  if (isScheduled.value && newVal !== 'published') {
    // If user tries to change status while scheduled, turn off scheduling or revert status
    // Let's turn off scheduling to avoid confusion, or we could force status back.
    // Given the requirement, it implies scheduling REQUIRES published.
    // So if they change status, they are implicitly disabling scheduling.
    isScheduled.value = false;
  }
});

const isEditing = computed(() => !!route.params.id);

const rules = {
  required: (value: any) => !!value || "This field is required",
};

// Media preview logic
const isVideoPreview = computed(() => {
  return !!form.value.videoUrl && mediaInputMethod.value === 'video';
});

const mediaPreview = computed(() => {
  if (mediaInputMethod.value === 'video' && form.value.videoUrl) {
    return form.value.videoUrl; 
  }
  if (form.value.imageFile && form.value.imageFile.length > 0) {
    return URL.createObjectURL(form.value.imageFile[0]);
  }
  if (form.value.imageUrl) {
    return form.value.imageUrl;
  }
  return null;
});

const handleImageFileChange = () => {
  if (form.value.imageFile && form.value.imageFile.length > 0) {
    form.value.imageUrl = "";
  }
};

const handleImageUrlChange = () => {
  if (form.value.imageUrl) {
    form.value.imageFile = null;
  }
};

const getEmbedUrl = (url: string) => {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11)
    ? `https://www.youtube.com/embed/${match[2]}`
    : '';
};

const removeTopicChip = (index: number) => {
  form.value.topic_ids.splice(index, 1);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft': return 'grey';
    case 'pending': return 'warning';
    case 'published': return 'success';
    case 'scheduled': return 'info';
    default: return 'grey';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'draft': return 'mdi-file-document-outline';
    case 'pending': return 'mdi-clock-outline';
    case 'published': return 'mdi-check-circle';
    case 'scheduled': return 'mdi-calendar-clock';
    default: return 'mdi-file';
  }
};

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

// Fetch post data for editing
const fetchPostData = async () => {
  loading.value = true;
  try {
    const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:8000";
    const response = await fetch(`${API_BASE_URL}/api/v1/posts/${route.params.id}`, {
      headers: getAuthHeader() as HeadersInit,
    });
    
    if (!response.ok) throw new Error("Failed to fetch post");
    
    const post = await response.json();
    
    form.value.title = post.title;
    form.value.description = post.description;
    form.value.status = post.status;
    form.value.category_id = post.category?.id || null;
    form.value.topic_ids = post.topics?.map((t: any) => t.id) || [];
    form.value.videoUrl = post.video_url || "";
    
    if (post.scheduled_at) {
      // Format for datetime-local input: YYYY-MM-DDTHH:mm
      const date = new Date(post.scheduled_at);
      // Adjust for timezone offset to show local time in input
      const offset = date.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
      form.value.scheduled_at = localISOTime;
      isScheduled.value = true;
    }

    if (post.image) {
      // Assuming newsAPI.getImageURL or similar logic
      form.value.imageUrl = newsAPI.getImageURL(post.image);
      mediaInputMethod.value = "url";
    }
    
    if (post.video_url) {
      mediaInputMethod.value = "video";
    }
    
  } catch (err) {
    console.error(err);
    error.value = "Failed to load post data";
  } finally {
    loading.value = false;
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
    formData.append("status", form.value.status);

    if (form.value.category_id) {
      formData.append("category_id", form.value.category_id.toString());
    }

    form.value.topic_ids.forEach((id) => {
      formData.append("topic_ids", id.toString());
    });
    
    if (form.value.scheduled_at) {
        // Ensure ISO format or whatever backend expects. 
        // datetime-local input gives 'YYYY-MM-DDTHH:mm'. 
        // Backend expects datetime object, FastAPI handles ISO strings well.
        formData.append('scheduled_at', new Date(form.value.scheduled_at).toISOString());
    }
    
    if (form.value.videoUrl) {
      formData.append("video_url", form.value.videoUrl);
    }

    // Handle image
    if (form.value.imageFile && form.value.imageFile.length > 0) {
      formData.append("image", form.value.imageFile[0]);
    } else if (form.value.imageUrl) {
      // If editing and using existing URL, we might not need to send it if backend ignores it
      // But if we switched from file to URL, we might want to update it.
      // My backend expects 'image' as UploadFile or 'image_url' string?
      // The backend create endpoint handles 'image' (UploadFile) or 'image_url' (str).
      // The update endpoint might be different.
      // Let's assume standard behavior: send what changed.
      // If it's the same URL as before, sending it again is fine.
      formData.append("image_url", form.value.imageUrl);
    }

    const API_BASE_URL =
      (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:8000";
      
    const url = isEditing.value 
      ? `${API_BASE_URL}/api/v1/posts/${route.params.id}`
      : `${API_BASE_URL}/api/v1/posts/`;
      
    const method = isEditing.value ? "PUT" : "POST";

    const response = await fetch(url, {
      method: method,
      headers: getAuthHeader() as HeadersInit,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Failed to ${isEditing.value ? 'update' : 'create'} post`);
    }

    success.value = `Post ${isEditing.value ? 'updated' : 'created'} successfully!`;
    
    if (!isEditing.value) {
      resetForm();
    }

    // Redirect
    setTimeout(() => {
      router.push(isEditing.value ? "/posts" : "/"); // Go to posts list if editing
    }, 2000);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Operation failed";
    console.error("Post submit error:", err);
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
    imageFile: null,
    imageUrl: "",
    videoUrl: "",
    scheduled_at: "",
    status: "draft",
  };
  isScheduled.value = false;
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
  if (isEditing.value) {
    fetchPostData();
  }
});
</script>

<style scoped>
.create-post-container {
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 140px !important;
}

.video-container {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  height: 0;
  overflow: hidden;
  background-color: #000;
}

.video-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.gap-4 {
  gap: 16px;
}
</style>
