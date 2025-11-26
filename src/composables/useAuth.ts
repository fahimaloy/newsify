import { ref, computed } from 'vue';

export enum UserType {
  SUBSCRIBER = 'subscriber',
  ADMINISTRATOR = 'administrator',
}

export enum AdminType {
  ADMIN = 'admin',
  WRITER = 'writer',
  MAINTAINER = 'maintainer',
}

export interface User {
  id: number;
  username: string;
  email?: string;
  phone?: string;
  full_name?: string;
  user_type: UserType;
  admin_type?: AdminType;
  role?: string; // Deprecated
  post_review_before_publish?: boolean;
  newsletter_subscribed?: boolean;
  is_blocked?: boolean;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Auth state - persisted in localStorage
const token = ref<string | null>(localStorage.getItem('auth_token'));
const refreshToken = ref<string | null>(localStorage.getItem('refresh_token'));
const user = ref<User | null>(null);

// Token refresh timer
let refreshTimer: number | null = null;

// Computed
const isAuthenticated = computed(() => !!token.value);
const isAdministrator = computed(() => user.value?.user_type === UserType.ADMINISTRATOR);
const isSubscriber = computed(() => user.value?.user_type === UserType.SUBSCRIBER);
const isAdmin = computed(() => user.value?.admin_type === AdminType.ADMIN);
const isMaintainer = computed(() => user.value?.admin_type === AdminType.MAINTAINER);
const isWriter = computed(() => user.value?.admin_type === AdminType.WRITER);

// Load user from token on init
const loadUserFromToken = async () => {
  if (!token.value) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    });
    
    if (response.ok) {
      user.value = await response.json();
      // Start refresh timer
      startRefreshTimer();
    } else {
      // Token is invalid, try to refresh
      if (refreshToken.value) {
        await refreshAccessToken();
      } else {
        await logout();
      }
    }
  } catch (error) {
    console.error('Failed to load user:', error);
    // Try to refresh token
    if (refreshToken.value) {
      await refreshAccessToken();
    } else {
      await logout();
    }
  }
};

// Refresh access token using refresh token
const refreshAccessToken = async () => {
  if (!refreshToken.value) {
    await logout();
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh_token: refreshToken.value })
    });

    if (response.ok) {
      const data: AuthResponse = await response.json();
      token.value = data.access_token;
      refreshToken.value = data.refresh_token;
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      
      // Reload user data
      await loadUserFromToken();
      return true;
    } else {
      // Refresh token is invalid, logout
      await logout();
      return false;
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    await logout();
    return false;
  }
};

// Start automatic token refresh (refresh 1 day before expiry)
const startRefreshTimer = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }

  // Refresh token every 19 days (1 day before 20-day expiry)
  const refreshInterval = 19 * 24 * 60 * 60 * 1000; // 19 days in milliseconds
  
  refreshTimer = window.setInterval(async () => {
    await refreshAccessToken();
  }, refreshInterval);
};

// Login
const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
  try {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    const response = await fetch(`${API_BASE_URL}/api/v1/users/token`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.detail || 'Login failed' };
    }
    
    const data: AuthResponse = await response.json();
    token.value = data.access_token;
    refreshToken.value = data.refresh_token;
    localStorage.setItem('auth_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    
    // Load user data
    await loadUserFromToken();
    
    // Sync bookmarks after successful login
    try {
      const { useBookmarks } = await import('./useBookmarks');
      const { syncPendingToServer } = useBookmarks();
      await syncPendingToServer();
    } catch (err) {
      console.error('Failed to sync bookmarks on login:', err);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
};

// Logout
const logout = async () => {
  // Stop refresh timer
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }

  // Clear bookmarks on logout
  try {
    const { useBookmarks } = await import('./useBookmarks');
    const { clearLocalBookmarks } = useBookmarks();
    clearLocalBookmarks();
  } catch (err) {
    console.error('Failed to clear bookmarks on logout:', err);
  }
  
  token.value = null;
  refreshToken.value = null;
  user.value = null;
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
};

// Get auth header
const getAuthHeader = () => {
  return token.value ? { 'Authorization': `Bearer ${token.value}` } : {};
};

// Initialize on module load
loadUserFromToken();

export function useAuth() {
  return {
    user,
    token,
    refreshToken,
    isAuthenticated,
    isAdministrator,
    isSubscriber,
    isAdmin,
    isMaintainer,
    isWriter,
    login,
    logout,
    getAuthHeader,
    loadUserFromToken,
    refreshAccessToken
  };
}
