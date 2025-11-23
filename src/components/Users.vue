<template>
  <v-container class="users-container pb-16">
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-4">
          <h1 class="text-h4 font-weight-bold text-primary">Users</h1>
          <v-btn
            v-if="isAdmin"
            color="primary"
            prepend-icon="mdi-plus"
            @click="openCreateUserDialog"
          >
            Add User
          </v-btn>
        </div>
        
        <!-- Search and Filters -->
        <v-card class="mb-4 pa-4 rounded-lg" elevation="1">
          <v-row dense>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="search"
                label="Search users..."
                prepend-inner-icon="mdi-magnify"
                density="compact"
                variant="outlined"
                hide-details
                @update:model-value="debouncedSearch"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4">
              <v-select
                v-model="filterUserType"
                :items="['subscriber', 'administrator']"
                label="User Type"
                density="compact"
                variant="outlined"
                hide-details
                clearable
                @update:model-value="refreshUsers"
              ></v-select>
            </v-col>
            <v-col cols="12" md="4">
              <v-select
                v-model="filterAdminType"
                :items="['admin', 'maintainer', 'writer']"
                label="Admin Role"
                density="compact"
                variant="outlined"
                hide-details
                clearable
                @update:model-value="refreshUsers"
              ></v-select>
            </v-col>
          </v-row>
        </v-card>

        <v-card elevation="2" class="rounded-lg">
          <v-data-table-server
            v-model:items-per-page="itemsPerPage"
            :headers="headers"
            :items="users"
            :items-length="totalUsers"
            :loading="loading"
            item-value="id"
            @update:options="loadUsers"
            class="elevation-0"
          >
            <!-- User Type Column -->
            <template v-slot:item.user_type="{ item }">
              <v-chip
                :color="getUserTypeColor(item.user_type)"
                size="small"
                variant="flat"
                class="font-weight-bold"
              >
                {{ getUserTypeLabel(item.user_type) }}
              </v-chip>
            </template>

            <!-- Admin Type Column -->
            <template v-slot:item.admin_type="{ item }">
              <v-chip
                v-if="item.admin_type"
                :color="getAdminTypeColor(item.admin_type)"
                size="small"
                variant="flat"
                class="font-weight-bold"
              >
                {{ getAdminTypeLabel(item.admin_type) }}
              </v-chip>
              <span v-else class="text-grey text-caption">N/A</span>
            </template>

            <!-- Status Column -->
            <template v-slot:item.status="{ item }">
              <v-chip
                :color="item.is_blocked ? 'error' : 'success'"
                size="small"
                variant="flat"
              >
                {{ item.is_blocked ? 'Blocked' : 'Active' }}
              </v-chip>
            </template>

            <!-- Actions Column -->
            <template v-slot:item.actions="{ item }">
              <div class="d-flex align-center">
                <!-- View Details (Maintainer only) -->
                <v-btn
                  v-if="isMaintainer"
                  icon="mdi-eye"
                  variant="text"
                  size="small"
                  color="info"
                  :to="`/users/${item.id}`"
                  class="mr-1"
                ></v-btn>

                <!-- Edit (Admin only) -->
                <v-btn
                  v-if="isAdmin"
                  icon="mdi-pencil"
                  variant="text"
                  size="small"
                  color="primary"
                  @click="editUser(item)"
                  class="mr-1"
                ></v-btn>

                <!-- Block/Unblock (Admin OR Maintainer for Subscribers) -->
                <v-btn
                  v-if="canBlock(item)"
                  :icon="item.is_blocked ? 'mdi-account-check' : 'mdi-account-cancel'"
                  variant="text"
                  size="small"
                  :color="item.is_blocked ? 'success' : 'warning'"
                  @click="toggleBlockUser(item)"
                  class="mr-1"
                  :title="item.is_blocked ? 'Unblock User' : 'Block User'"
                ></v-btn>

                <!-- Delete (Admin only) -->
                <v-btn
                  v-if="isAdmin"
                  icon="mdi-delete"
                  variant="text"
                  size="small"
                  color="error"
                  @click="confirmDelete(item)"
                ></v-btn>
              </div>
            </template>
          </v-data-table-server>
        </v-card>
      </v-col>
    </v-row>

    <!-- Create User Dialog -->
    <v-dialog v-model="createUserDialog" max-width="600px" scrim="rgba(0, 0, 0, 0.5)">
      <v-card class="rounded-lg">
        <v-card-title class="pa-6 bg-primary">
          <div class="d-flex align-center">
            <v-icon class="mr-3" color="white">mdi-account-plus</v-icon>
            <span class="text-h5 text-white">Add New User</span>
          </div>
        </v-card-title>

        <v-card-text class="pa-6">
          <v-form ref="createUserForm">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newUser.username"
                  label="Username *"
                  variant="outlined"
                  color="primary"
                  density="comfortable"
                  prepend-inner-icon="mdi-account"
                  :rules="[v => !!v || 'Username is required']"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newUser.full_name"
                  label="Full Name"
                  variant="outlined"
                  color="primary"
                  density="comfortable"
                  prepend-inner-icon="mdi-account-details"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newUser.email"
                  label="Email *"
                  type="email"
                  variant="outlined"
                  color="primary"
                  density="comfortable"
                  prepend-inner-icon="mdi-email"
                  :rules="[v => !!v || 'Email is required', v => /.+@.+\..+/.test(v) || 'Email must be valid']"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newUser.phone"
                  label="Phone"
                  variant="outlined"
                  color="primary"
                  density="comfortable"
                  prepend-inner-icon="mdi-phone"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12">
                <v-text-field
                  v-model="newUser.password"
                  label="Password *"
                  type="password"
                  variant="outlined"
                  color="primary"
                  density="comfortable"
                  prepend-inner-icon="mdi-lock"
                  :rules="[v => !!v || 'Password is required', v => v.length >= 6 || 'Password must be at least 6 characters']"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="newUser.user_type"
                  :items="userTypeOptions"
                  label="User Type *"
                  variant="outlined"
                  color="primary"
                  density="comfortable"
                  prepend-inner-icon="mdi-account-group"
                ></v-select>
              </v-col>
              
              <v-col cols="12" md="6" v-if="newUser.user_type === 'administrator'">
                <v-select
                  v-model="newUser.admin_type"
                  :items="adminTypeOptions"
                  label="Admin Role *"
                  variant="outlined"
                  color="primary"
                  density="comfortable"
                  prepend-inner-icon="mdi-shield-account"
                ></v-select>
              </v-col>
              
              <v-col cols="12" v-if="newUser.user_type === 'administrator' && newUser.admin_type === 'writer'">
                <v-switch
                  v-model="newUser.post_review_before_publish"
                  label="Require post review before publish"
                  color="primary"
                  density="comfortable"
                  hide-details
                ></v-switch>
              </v-col>
              
              <v-col cols="12" v-if="newUser.user_type === 'subscriber'">
                <v-switch
                  v-model="newUser.newsletter_subscribed"
                  label="Subscribe to newsletter"
                  color="primary"
                  density="comfortable"
                  hide-details
                ></v-switch>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="closeCreateUserDialog"
            :disabled="createUserLoading"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            @click="saveNewUser"
            :loading="createUserLoading"
            prepend-icon="mdi-check"
          >
            Create User
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit User Dialog -->
    <v-dialog v-model="editDialog" max-width="600px" scrim="rgba(0, 0, 0, 0.5)">
      <v-card class="rounded-lg">
        <v-card-title class="pa-6 bg-primary">
          <div class="d-flex align-center">
            <v-icon class="mr-3" color="white">mdi-pencil</v-icon>
            <span class="text-h5 text-white">Edit User</span>
          </div>
        </v-card-title>

        <v-card-text class="pa-6">
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.username"
                  label="Username"
                  variant="outlined"
                  color="primary"
                  density="comfortable"
                  disabled
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.email"
                  label="Email"
                  variant="outlined"
                  color="primary"
                  density="comfortable"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.phone"
                  label="Phone"
                  variant="outlined"
                  color="primary"
                  density="comfortable"
                ></v-text-field>
              </v-col>
              <!-- Only Admin can change types -->
              <v-col cols="12" v-if="isAdmin">
                <v-select
                  v-model="editedItem.user_type"
                  :items="['subscriber', 'administrator']"
                  label="User Type"
                  variant="outlined"
                  color="primary"
                  density="comfortable"
                ></v-select>
              </v-col>
              <v-col cols="12" v-if="isAdmin && editedItem.user_type === 'administrator'">
                <v-select
                  v-model="editedItem.admin_type"
                  :items="['admin', 'maintainer', 'writer']"
                  label="Admin Role"
                  variant="outlined"
                  color="primary"
                  density="comfortable"
                ></v-select>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeEdit">
            Cancel
          </v-btn>
          <v-btn color="primary" variant="elevated" @click="saveEdit" prepend-icon="mdi-check">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500px" scrim="rgba(0, 0, 0, 0.5)">
      <v-card class="rounded-lg">
        <v-card-title class="pa-6 bg-error">
          <div class="d-flex align-center">
            <v-icon class="mr-3" color="white">mdi-alert</v-icon>
            <span class="text-h5 text-white">Confirm Delete</span>
          </div>
        </v-card-title>
        <v-card-text class="pa-6">
          Are you sure you want to delete user "<strong>{{ editedItem.username }}</strong>"? This action cannot be undone.
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeDelete">Cancel</v-btn>
          <v-btn color="error" variant="elevated" @click="deleteItemConfirm" prepend-icon="mdi-delete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuth, UserType, AdminType, type User } from '../composables/useAuth';

const { isAdmin, isMaintainer, getAuthHeader } = useAuth();
const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8000';

const users = ref<User[]>([]);
const loading = ref(false);
const totalUsers = ref(0);
const itemsPerPage = ref(10);
const editDialog = ref(false);
const deleteDialog = ref(false);
const createUserDialog = ref(false);
const createUserLoading = ref(false);

// Search and Filter state
const search = ref('');
const filterUserType = ref(null);
const filterAdminType = ref(null);
let searchTimeout: any = null;

const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadUsers({ page: 1, itemsPerPage: itemsPerPage.value });
  }, 500);
};

const refreshUsers = () => {
  loadUsers({ page: 1, itemsPerPage: itemsPerPage.value });
};

const editedItem = ref<any>({
  id: -1,
  username: '',
  email: '',
  phone: '',
  user_type: '',
  admin_type: '',
  is_blocked: false
});

const defaultItem = {
  id: -1,
  username: '',
  email: '',
  phone: '',
  user_type: 'subscriber',
  admin_type: '',
  is_blocked: false
};

const newUser = ref({
  username: '',
  full_name: '',
  email: '',
  password: '',
  phone: '',
  user_type: 'subscriber',
  admin_type: '',
  post_review_before_publish: false,
  newsletter_subscribed: false
});

const openCreateUserDialog = () => {
  newUser.value = {
    username: '',
    full_name: '',
    email: '',
    password: '',
    phone: '',
    user_type: 'subscriber',
    admin_type: '',
    post_review_before_publish: false,
    newsletter_subscribed: false
  };
  createUserDialog.value = true;
};

const closeCreateUserDialog = () => {
  createUserDialog.value = false;
};

const saveNewUser = async () => {
  createUserLoading.value = true;
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      } as HeadersInit,
      body: JSON.stringify(newUser.value)
    });

    if (response.ok) {
      closeCreateUserDialog();
      loadUsers({ page: 1, itemsPerPage: itemsPerPage.value });
    } else {
      const error = await response.json();
      alert(error.detail || 'Failed to create user');
    }
  } catch (error) {
    console.error('Error creating user:', error);
    alert('Failed to create user');
  } finally {
    createUserLoading.value = false;
  }
};

// Dropdown options with proper labels
const userTypeOptions = [
  { title: 'Subscriber', value: 'subscriber' },
  { title: 'Administrator', value: 'administrator' }
];

const adminTypeOptions = [
  { title: 'Admin', value: 'admin' },
  { title: 'Maintainer', value: 'maintainer' },
  { title: 'Writer', value: 'writer' }
];

const headers: any[] = [
  { title: 'ID', key: 'id', align: 'start' },
  { title: 'Username', key: 'username' },
  { title: 'Email', key: 'email' },
  { title: 'Type', key: 'user_type' },
  { title: 'Role', key: 'admin_type' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions', sortable: false },
];

const loadUsers = async ({ page, itemsPerPage }: any) => {
  loading.value = true;
  try {
    const skip = (page - 1) * itemsPerPage;
    
    let url = `${API_BASE_URL}/api/v1/users/?skip=${skip}&limit=${itemsPerPage}`;
    
    if (search.value) {
      url += `&search=${encodeURIComponent(search.value)}`;
    }
    if (filterUserType.value) {
      url += `&user_type=${filterUserType.value}`;
    }
    if (filterAdminType.value) {
      url += `&admin_type=${filterAdminType.value}`;
    }
    
    const response = await fetch(url, {
      headers: {
        ...getAuthHeader()
      } as HeadersInit
    });
    
    if (response.ok) {
      const data = await response.json();
      users.value = data;
      // Since API doesn't return total, we might have issues with pagination controls.
      // A quick fix is to set totalUsers to a high number or fetch all IDs to get count.
      // Or better, just set it to current length + something if we got a full page.
      if (data.length === itemsPerPage) {
         totalUsers.value = (page * itemsPerPage) + 10; // Assume more
      } else {
         totalUsers.value = (page - 1) * itemsPerPage + data.length;
      }
    } else {
      console.error('Failed to load users:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error loading users:', error);
  } finally {
    loading.value = false;
  }
};

const getUserTypeColor = (type: string) => {
  return type === UserType.ADMINISTRATOR ? 'primary' : 'teal';
};

const getUserTypeLabel = (type: string) => {
  return type === UserType.ADMINISTRATOR ? 'Administrator' : 'Subscriber';
};

const getAdminTypeColor = (type: string) => {
  switch (type) {
    case AdminType.ADMIN: return 'error';
    case AdminType.MAINTAINER: return 'orange';
    case AdminType.WRITER: return 'purple';
    default: return 'grey';
  }
};

const getAdminTypeLabel = (type: string) => {
  switch (type) {
    case AdminType.ADMIN: return 'Admin';
    case AdminType.MAINTAINER: return 'Maintainer';
    case AdminType.WRITER: return 'Writer';
    default: return '';
  }
};

const canBlock = (item: any) => {
  if (isAdmin.value) return true;
  if (isMaintainer.value) {
    return item.user_type === UserType.SUBSCRIBER;
  }
  return false;
};

const editUser = (item: any) => {
  editedItem.value = Object.assign({}, item);
  editDialog.value = true;
};

const closeEdit = () => {
  editDialog.value = false;
  setTimeout(() => {
    editedItem.value = Object.assign({}, defaultItem);
  }, 300);
};

const saveEdit = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/${editedItem.value.id}`, {
      method: 'PATCH',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      } as HeadersInit,
      body: JSON.stringify({
        email: editedItem.value.email,
        phone: editedItem.value.phone,
        user_type: editedItem.value.user_type,
        admin_type: editedItem.value.admin_type
      })
    });

    if (response.ok) {
      closeEdit();
      // Refresh list
      loadUsers({ page: 1, itemsPerPage: itemsPerPage.value });
    } else {
      console.error('Failed to update user');
    }
  } catch (error) {
    console.error('Error updating user:', error);
  }
};

const toggleBlockUser = async (item: any) => {
  try {
    const newStatus = !item.is_blocked;
    const response = await fetch(`${API_BASE_URL}/api/v1/users/${item.id}`, {
      method: 'PATCH',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      } as HeadersInit,
      body: JSON.stringify({
        is_blocked: newStatus
      })
    });

    if (response.ok) {
      // Update local state
      const index = users.value.findIndex((u: any) => u.id === item.id);
      if (index !== -1) {
        users.value[index].is_blocked = newStatus;
      }
    } else {
      const error = await response.json();
      alert(`Failed to update user status: ${error.detail}`);
    }
  } catch (error) {
    console.error('Error updating user status:', error);
  }
};

const confirmDelete = (item: any) => {
  editedItem.value = Object.assign({}, item);
  deleteDialog.value = true;
};

const closeDelete = () => {
  deleteDialog.value = false;
  setTimeout(() => {
    editedItem.value = Object.assign({}, defaultItem);
  }, 300);
};

const deleteItemConfirm = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/${editedItem.value.id}`, {
      method: 'DELETE',
      headers: getAuthHeader() as HeadersInit
    });

    if (response.ok) {
      closeDelete();
      loadUsers({ page: 1, itemsPerPage: itemsPerPage.value });
    } else {
      console.error('Failed to delete user');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
  }
};
</script>

<style scoped>
.users-container {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
