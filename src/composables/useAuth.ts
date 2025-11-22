import { ref, computed } from 'vue';

interface User {
  id: number;
  username: string;
  role: string;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Auth state
const token = ref<string | null>(localStorage.getItem('auth_token'));
const user = ref<User | null>(null);

// Computed
const isAuthenticated = computed(() => !!token.value);

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
    } else {
      // Token is invalid, clear it
      logout();
    }
  } catch (error) {
    console.error('Failed to load user:', error);
    logout();
  }
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
    localStorage.setItem('auth_token', data.access_token);
    
    // Load user data
    await loadUserFromToken();
    
    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
};

// Logout
const logout = () => {
  token.value = null;
  user.value = null;
  localStorage.removeItem('auth_token');
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
    isAuthenticated,
    login,
    logout,
    getAuthHeader,
    loadUserFromToken
  };
}
