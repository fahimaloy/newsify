import { ref, computed } from 'vue';
import { useAuth } from './useAuth';

const LOCAL_STORAGE_KEY = 'bookmarked_posts';
const PENDING_SYNC_KEY = 'pending_bookmark_sync';

// Global state
const bookmarkedPosts = ref<Set<number>>(new Set());
const initialized = ref(false);
const pendingSync = ref<{add: number[], remove: number[]}>({add: [], remove: []});

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

        // Load pending sync operations
        const pendingStored = localStorage.getItem(PENDING_SYNC_KEY);
        if (pendingStored) {
            try {
                pendingSync.value = JSON.parse(pendingStored);
            } catch (e) {
                console.error('Failed to parse pending sync', e);
            }
        }

        // If authenticated, fetch from server and sync
        if (isAuthenticated.value) {
            await fetchAndSyncServerBookmarks();
        }

        initialized.value = true;
    };

    // Fetch bookmarks from server and sync with local
    const fetchAndSyncServerBookmarks = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/bookmarks/`, {
                headers: getAuthHeader() as HeadersInit
            });

            if (response.ok) {
                const serverBookmarks = await response.json();
                const serverIds = serverBookmarks.map((b: any) => b.post.id as number);
                
                // Replace local bookmarks with server bookmarks (server is source of truth when authenticated)
                bookmarkedPosts.value = new Set<number>(serverIds);
                
                // Save to local storage
                saveToLocalStorage();
                
                // Clear pending sync since we just got fresh data from server
                pendingSync.value = {add: [], remove: []};
                savePendingSync();
            }
        } catch (e) {
            console.error('Failed to fetch server bookmarks', e);
        }
    };

    // Sync pending operations to server (called after login or when online)
    const syncPendingToServer = async () => {
        if (!isAuthenticated.value || !navigator.onLine) return;

        const { add, remove } = pendingSync.value;
        
        try {
            // Process additions
            for (const postId of add) {
                try {
                    await fetch(`${API_BASE_URL}/api/v1/bookmarks/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...getAuthHeader()
                        } as HeadersInit,
                        body: JSON.stringify({ post_id: postId })
                    });
                } catch (e) {
                    console.error(`Failed to sync bookmark add for post ${postId}`, e);
                }
            }

            // Process removals
            for (const postId of remove) {
                try {
                    await fetch(`${API_BASE_URL}/api/v1/bookmarks/${postId}`, {
                        method: 'DELETE',
                        headers: getAuthHeader() as HeadersInit
                    });
                } catch (e) {
                    console.error(`Failed to sync bookmark remove for post ${postId}`, e);
                }
            }

            // Clear pending sync after successful sync
            pendingSync.value = {add: [], remove: []};
            savePendingSync();
            
            // Fetch fresh data from server
            await fetchAndSyncServerBookmarks();
        } catch (e) {
            console.error('Failed to sync pending bookmarks', e);
        }
    };

    // Save to local storage
    const saveToLocalStorage = () => {
        const ids = Array.from(bookmarkedPosts.value);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(ids));
    };

    // Save pending sync operations
    const savePendingSync = () => {
        localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pendingSync.value));
    };

    // Check if post is bookmarked
    const isBookmarked = (postId: number) => {
        return computed(() => bookmarkedPosts.value.has(postId));
    };

    // Add bookmark
    const addBookmark = async (postId: number) => {
        bookmarkedPosts.value.add(postId);
        saveToLocalStorage();

        // If authenticated and online, save to server immediately
        if (isAuthenticated.value && navigator.onLine) {
            try {
                await fetch(`${API_BASE_URL}/api/v1/bookmarks/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...getAuthHeader()
                    } as HeadersInit,
                    body: JSON.stringify({ post_id: postId })
                });
            } catch (e) {
                console.error('Failed to save bookmark to server, will sync later', e);
                // Add to pending sync
                if (!pendingSync.value.add.includes(postId)) {
                    pendingSync.value.add.push(postId);
                }
                // Remove from pending remove if it was there
                pendingSync.value.remove = pendingSync.value.remove.filter(id => id !== postId);
                savePendingSync();
            }
        } else if (isAuthenticated.value && !navigator.onLine) {
            // Offline but authenticated - add to pending sync
            if (!pendingSync.value.add.includes(postId)) {
                pendingSync.value.add.push(postId);
            }
            pendingSync.value.remove = pendingSync.value.remove.filter(id => id !== postId);
            savePendingSync();
        } else {
            // Not authenticated - add to pending sync for when user logs in
            if (!pendingSync.value.add.includes(postId)) {
                pendingSync.value.add.push(postId);
            }
            pendingSync.value.remove = pendingSync.value.remove.filter(id => id !== postId);
            savePendingSync();
        }
    };

    // Remove bookmark
    const removeBookmark = async (postId: number) => {
        bookmarkedPosts.value.delete(postId);
        saveToLocalStorage();

        // If authenticated and online, remove from server immediately
        if (isAuthenticated.value && navigator.onLine) {
            try {
                await fetch(`${API_BASE_URL}/api/v1/bookmarks/${postId}`, {
                    method: 'DELETE',
                    headers: getAuthHeader() as HeadersInit
                });
            } catch (e) {
                console.error('Failed to remove bookmark from server, will sync later', e);
                // Add to pending sync
                if (!pendingSync.value.remove.includes(postId)) {
                    pendingSync.value.remove.push(postId);
                }
                // Remove from pending add if it was there
                pendingSync.value.add = pendingSync.value.add.filter(id => id !== postId);
                savePendingSync();
            }
        } else if (isAuthenticated.value && !navigator.onLine) {
            // Offline but authenticated - add to pending sync
            if (!pendingSync.value.remove.includes(postId)) {
                pendingSync.value.remove.push(postId);
            }
            pendingSync.value.add = pendingSync.value.add.filter(id => id !== postId);
            savePendingSync();
        } else {
            // Not authenticated - add to pending sync for when user logs in
            if (!pendingSync.value.remove.includes(postId)) {
                pendingSync.value.remove.push(postId);
            }
            pendingSync.value.add = pendingSync.value.add.filter(id => id !== postId);
            savePendingSync();
        }
    };

    // Toggle bookmark
    const toggleBookmark = async (postId: number) => {
        console.log('[useBookmarks] Toggling bookmark for post:', postId);
        console.log('[useBookmarks] Current bookmarks:', Array.from(bookmarkedPosts.value));
        
        if (bookmarkedPosts.value.has(postId)) {
            console.log('[useBookmarks] Removing bookmark');
            await removeBookmark(postId);
        } else {
            console.log('[useBookmarks] Adding bookmark');
            await addBookmark(postId);
        }
        
        console.log('[useBookmarks] After toggle, bookmarks:', Array.from(bookmarkedPosts.value));
    };

    // Clear local bookmarks (called on logout)
    const clearLocalBookmarks = () => {
        bookmarkedPosts.value.clear();
        pendingSync.value = {add: [], remove: []};
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        localStorage.removeItem(PENDING_SYNC_KEY);
        console.log('[useBookmarks] Cleared local bookmarks on logout');
    };

    // Refresh bookmarks from server (for pull-to-refresh)
    const refreshFromServer = async () => {
        if (!isAuthenticated.value) return;
        await fetchAndSyncServerBookmarks();
    };

    // Get all bookmarked post IDs
    const getBookmarkedIds = computed(() => Array.from(bookmarkedPosts.value));

    return {
        init,
        isBookmarked,
        addBookmark,
        removeBookmark,
        toggleBookmark,
        syncPendingToServer,
        clearLocalBookmarks,
        refreshFromServer,
        getBookmarkedIds
    };
}
