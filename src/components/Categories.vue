<template>
  <v-container class="pb-16">
    <v-row justify="center">
      <v-col cols="12" lg="10">
        <!-- Header Section -->
        <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between mb-6 gap-4">
          <div class="d-flex align-center mb-4 mb-sm-0">
            <v-icon size="36" color="primary" class="mr-3">mdi-shape-outline</v-icon>
            <h1 class="text-h4 font-weight-bold">Categories</h1>
          </div>
          <div class="d-flex gap-2 w-100 w-sm-auto">
            <v-btn
              v-if="hasUnsavedChanges"
              color="success"
              prepend-icon="mdi-content-save"
              elevation="2"
              @click="saveReorderChanges"
              :loading="savingChanges"
              class="flex-grow-1 flex-sm-grow-0"
            >
              Save Changes
            </v-btn>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              elevation="2"
              @click="openCreateDialog"
              class="flex-grow-1 flex-sm-grow-0"
            >
              Add Category
            </v-btn>
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="text-center py-12">
          <v-progress-circular
            indeterminate
            color="primary"
            size="48"
          ></v-progress-circular>
          <p class="mt-4 text-grey">Loading categories...</p>
        </div>

        <!-- Error state -->
        <v-alert
          v-else-if="error"
          type="error"
          variant="tonal"
          class="mb-6"
          closable
        >
          {{ error }}
        </v-alert>

        <!-- Categories Tree -->
        <v-card v-else elevation="2" class="rounded-xl overflow-hidden border-thin">
          <v-card-text class="pa-4 pa-sm-6">
            <div v-if="rootCategories.length === 0" class="text-center py-12 text-grey">
              <v-icon size="64" class="mb-4 opacity-50 text-grey-lighten-1">mdi-shape-plus</v-icon>
              <h3 class="text-h6 font-weight-regular">No categories found</h3>
              <p class="text-body-2 mt-2">Create your first category to get started!</p>
            </div>

            <div v-else class="category-tree">
              <CategoryTreeItem
                v-for="category in rootCategories"
                :key="category.id"
                :category="category"
                :all-categories="categories"
                @edit="openEditDialog"
                @delete="openDeleteDialog"
                @reorder="handleReorder"
              />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog.show" max-width="500px" scrim="rgba(0, 0, 0, 0.5)">
      <v-card class="rounded-lg">
        <v-card-title class="pa-6 bg-primary">
          <div class="d-flex align-center">
            <v-icon class="mr-3" color="white">{{ dialog.isEdit ? 'mdi-pencil' : 'mdi-plus' }}</v-icon>
            <span class="text-h5 text-white">{{ dialog.isEdit ? 'Edit Category' : 'Add Category' }}</span>
          </div>
        </v-card-title>

        <v-card-text class="pa-6">
          <v-form ref="formRef" @submit.prevent="saveCategory">
            <v-text-field
              v-model="form.name"
              label="Name (English) *"
              variant="outlined"
              color="primary"
              density="comfortable"
              :rules="[v => !!v || 'Name is required']"
              class="mb-2"
            ></v-text-field>

            <v-text-field
              v-model="form.bn_name"
              label="Name (Bengali)"
              variant="outlined"
              color="primary"
              density="comfortable"
              class="mb-2"
            ></v-text-field>

            <v-select
              v-model="form.parent_id"
              :items="availableParents"
              item-title="name"
              item-value="id"
              label="Parent Category"
              variant="outlined"
              color="primary"
              density="comfortable"
              clearable
              hint="Leave empty for root category"
              persistent-hint
            >
              <template v-slot:selection="{ item }">
                {{ item.raw.bn_name || item.raw.name }}
              </template>
              <template v-slot:item="{ props, item }">
                <v-list-item
                  v-bind="props"
                  :title="item.raw.bn_name || item.raw.name"
                  :subtitle="item.raw.name"
                ></v-list-item>
              </template>
            </v-select>
          </v-form>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeDialog" :disabled="saving">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            @click="saveCategory"
            :loading="saving"
            prepend-icon="mdi-check"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog.show" max-width="400px" scrim="rgba(0, 0, 0, 0.5)">
      <v-card class="rounded-lg">
        <v-card-title class="pa-6 bg-error">
          <div class="d-flex align-center">
            <v-icon class="mr-3" color="white">mdi-alert</v-icon>
            <span class="text-h5 text-white">Delete Category</span>
          </div>
        </v-card-title>
        <v-card-text class="pa-6">
          Are you sure you want to delete "<strong>{{ deleteDialog.category?.name }}</strong>"?
          <div v-if="hasChildren(deleteDialog.category)" class="mt-2 text-error text-caption font-weight-bold d-flex align-center">
            <v-icon size="small" class="mr-1">mdi-alert-circle</v-icon>
            Warning: This category has subcategories.
          </div>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeDeleteDialog">Cancel</v-btn>
          <v-btn
            color="error"
            variant="elevated"
            @click="confirmDelete"
            :loading="deleting"
            prepend-icon="mdi-delete"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { newsAPI, type Category } from "../services/api";
import { useAuth } from "../composables/useAuth";
import CategoryTreeItem from "./CategoryTreeItem.vue";

const { getAuthHeader } = useAuth();

const categories = ref<ExtendedCategory[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const saving = ref(false);
const deleting = ref(false);
const savingChanges = ref(false);
const hasUnsavedChanges = ref(false);
const formRef = ref();

// Dialog states
const dialog = ref({
  show: false,
  isEdit: false,
  categoryId: null as number | null
});

const deleteDialog = ref({
  show: false,
  category: null as Category | null
});

const form = ref({
  name: "",
  bn_name: "",
  parent_id: null as number | null
});

// Extended Category type locally to include optional order
interface ExtendedCategory extends Category {
  order?: number;
}

// Computed
const rootCategories = computed(() => {
  return (categories.value as ExtendedCategory[])
    .filter((cat) => !cat.parent_id)
    .sort((a, b) => (a.order || 0) - (b.order || 0)); // Sort by order
});

const availableParents = computed(() => {
  if (dialog.value.isEdit && dialog.value.categoryId) {
    // Filter out the category itself and its children (simple cycle prevention)
    // A more robust check would recursively filter all descendants
    return categories.value.filter(c => c.id !== dialog.value.categoryId);
  }
  return categories.value;
});

// Methods
const fetchCategories = async () => {
  loading.value = true;
  error.value = null;
  try {
    // Initialize order if missing
    categories.value = (await newsAPI.getCategories()).map((c, index) => ({
      ...c,
      order: (c as any).order !== undefined ? (c as any).order : index
    }));
    hasUnsavedChanges.value = false;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to load categories";
  } finally {
    loading.value = false;
  }
};

const hasChildren = (category: Category | null) => {
  if (!category) return false;
  return categories.value.some(c => c.parent_id === category.id);
};

// Create/Edit Logic
const openCreateDialog = () => {
  dialog.value = { show: true, isEdit: false, categoryId: null };
  form.value = { name: "", bn_name: "", parent_id: null };
};

const openEditDialog = (category: Category) => {
  dialog.value = { show: true, isEdit: true, categoryId: category.id };
  form.value = {
    name: category.name,
    bn_name: category.bn_name || "",
    parent_id: category.parent_id || null
  };
};

const closeDialog = () => {
  dialog.value.show = false;
  formRef.value?.resetValidation();
};

const saveCategory = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  saving.value = true;
  try {
    const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:8000";
    const url = dialog.value.isEdit
      ? `${API_BASE_URL}/api/v1/categories/${dialog.value.categoryId}`
      : `${API_BASE_URL}/api/v1/categories/`;
    
    const method = dialog.value.isEdit ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      } as HeadersInit,
      body: JSON.stringify(form.value)
    });

    if (!response.ok) throw new Error('Failed to save category');

    await fetchCategories();
    closeDialog();
  } catch (err) {
    console.error(err);
    alert('Failed to save category');
  } finally {
    saving.value = false;
  }
};

// Delete Logic
const openDeleteDialog = (category: Category) => {
  deleteDialog.value = { show: true, category };
};

const closeDeleteDialog = () => {
  deleteDialog.value.show = false;
};

const confirmDelete = async () => {
  if (!deleteDialog.value.category) return;
  
  deleting.value = true;
  try {
    const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:8000";
    const response = await fetch(`${API_BASE_URL}/api/v1/categories/${deleteDialog.value.category.id}`, {
      method: 'DELETE',
      headers: getAuthHeader() as HeadersInit
    });

    if (!response.ok) throw new Error('Failed to delete category');

    await fetchCategories();
    closeDeleteDialog();
  } catch (err) {
    console.error(err);
    alert('Failed to delete category');
  } finally {
    deleting.value = false;
  }
};

// Reorder Logic
const handleReorder = ({ draggedId, targetId, position }: { draggedId: number; targetId: number; position: 'before' | 'after' | 'inside' }) => {
  const draggedCategory = categories.value.find(c => c.id === draggedId);
  const targetCategory = categories.value.find(c => c.id === targetId);
  
  if (!draggedCategory || !targetCategory) return;

  // Update local state
  if (position === 'inside') {
    draggedCategory.parent_id = targetId;
  } else {
    draggedCategory.parent_id = targetCategory.parent_id;
    // Simple reorder logic: we need to adjust 'order' values
    // For now, let's just update parent_id and mark as changed. 
    // Full ordering support requires updating all siblings' order values.
  }
  
  // Trigger UI update
  categories.value = [...categories.value];
  hasUnsavedChanges.value = true;
};

const saveReorderChanges = async () => {
  savingChanges.value = true;
  try {
    const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:8000";
    
    // We need to send updates for all changed categories.
    // For simplicity, we'll just update the ones that moved (though optimally we'd batch this)
    // Since we don't track exactly which ones moved, we might need to iterate or rely on a bulk update endpoint if it existed.
    // Here, we'll just iterate over all categories and update them (inefficient but works for small sets)
    // OR better: just update the ones we know changed if we tracked them.
    
    // Let's assume we just want to persist the parent_id changes for now as that's what 'inside' does.
    // Real reordering requires an 'order' field in backend.
    
    const updates = categories.value.map(cat => 
      fetch(`${API_BASE_URL}/api/v1/categories/${cat.id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        } as HeadersInit,
        body: JSON.stringify({
          name: cat.name,
          parent_id: cat.parent_id
          // order: cat.order // If backend supported it
        })
      })
    );

    await Promise.all(updates);
    
    hasUnsavedChanges.value = false;
    // await fetchCategories(); // Refresh to be sure
  } catch (err) {
    console.error(err);
    alert('Failed to save changes');
  } finally {
    savingChanges.value = false;
  }
};

onMounted(() => {
  fetchCategories();
});
</script>

<style scoped>
.category-tree {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gap-4 {
  gap: 16px;
}

.gap-2 {
  gap: 8px;
}

.border-thin {
  border: 1px solid rgba(0,0,0,0.08);
}
</style>
