import { ref, computed } from 'vue';
import { useAuth } from './useAuth';

const LOCAL_STORAGE_KEY = 'bookmarked_posts';

// Global state
const bookmarkedPosts = ref<Set<number>>(new Set());
const initialized = ref(false);

export function useBookmarks() {
    const { isAuthenticated, getAuthHeader } = useAuth();
    const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8000';

    // Initialize bookmarks from local storage or server
    const init = async () => {
        if (initialized.value) return;

        // Load from local storage first
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
            try {
                const ids = JSON.parse(stored);
                bookmarkedPosts.value = new Set(ids);
            } catch (e) {
                console.error('Failed to parse bookmarks from local storage', e);
            }
        }

        // If authenticated, fetch from server and merge
        if (isAuthenticated.value) {
            await fetchServerBookmarks();
        }

        initialized.value = true;
    };

    // Fetch bookmarks from server
    const fetchServerBookmarks = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/bookmarks/`, {
                headers: getAuthHeader() as HeadersInit
            });

            if (response.ok) {
                const serverBookmarks = await response.json();
                const serverIds = serverBookmarks.map((b: any) => b.post.id);
                
                // Merge with local bookmarks
                serverIds.forEach((id: number) => bookmarkedPosts.value.add(id));
                
                // Save merged list to local storage
                saveToLocalStorage();
            }
        } catch (e) {
            console.error('Failed to fetch server bookmarks', e);
        }
    };

    // Save to local storage
    const saveToLocalStorage = () => {
        const ids = Array.from(bookmarkedPosts.value);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(ids));
    };

    // Check if post is bookmarked
    const isBookmarked = (postId: number) => {
        return computed(() => bookmarkedPosts.value.has(postId));
    };

    // Add bookmark
    const addBookmark = async (postId: number) => {
        bookmarkedPosts.value.add(postId);
        saveToLocalStorage();

        // If authenticated, save to server
        if (isAuthenticated.value) {
            try {
                await fetch(`${API_BASE_URL}/api/v1/bookmarks/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...getAuthHeader()
                    },
                    body: JSON.stringify({ post_id: postId })
                });
            } catch (e) {
                console.error('Failed to save bookmark to server', e);
            }
        }
    };

    // Remove bookmark
    const removeBookmark = async (postId: number) => {
        bookmarkedPosts.value.delete(postId);
        saveToLocalStorage();

        // If authenticated, remove from server
        if (isAuthenticated.value) {
            try {
                await fetch(`${API_BASE_URL}/api/v1/bookmarks/${postId}`, {
                    method: 'DELETE',
                    headers: getAuthHeader() as HeadersInit
                });
            } catch (e) {
                console.error('Failed to remove bookmark from server', e);
            }
        }
    };

    // Toggle bookmark
    const toggleBookmark = async (postId: number) => {
        if (bookmarkedPosts.value.has(postId)) {
            await removeBookmark(postId);
        } else {
            await addBookmark(postId);
        }
    };

    // Sync local bookmarks to server (call after login)
    const syncToServer = async () => {
        if (!isAuthenticated.value) return;

        const localIds = Array.from(bookmarkedPosts.value);
        if (localIds.length === 0) return;

        try {
            await fetch(`${API_BASE_URL}/api/v1/bookmarks/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                },
                body: JSON.stringify(localIds)
            });

            // Fetch updated bookmarks from server
            await fetchServerBookmarks();
        } catch (e) {
            console.error('Failed to sync bookmarks to server', e);
        }
    };

    // Get all bookmarked post IDs
    const getBookmarkedIds = computed(() => Array.from(bookmarkedPosts.value));

    return {
        init,
        isBookmarked,
        addBookmark,
        removeBookmark,
        toggleBookmark,
        syncToServer,
        getBookmarkedIds
    };
}
