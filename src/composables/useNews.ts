import { ref, computed } from 'vue';
import { newsAPI, type Post, type PostsQueryParams } from '../services/api';
import { savePosts, getPosts, getLatestPostId, prunePosts } from '../services/db';

// Global state to persist across component mounts
const posts = ref<Post[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const initialized = ref(false);

export function useNews() {
    
    const init = async () => {
        if (initialized.value) return;
        
        loading.value = true;
        try {
            // Load from local DB first
            const cachedPosts = await getPosts();
            if (cachedPosts && cachedPosts.length > 0) {
                posts.value = cachedPosts;
            }
            initialized.value = true;
            
            // Sync if online
            if (navigator.onLine) {
                await sync();
            }
        } catch (err: any) {
            console.error('Init error:', err);
            error.value = err instanceof Error ? err.message : 'Failed to initialize news';
        } finally {
            loading.value = false;
        }
    };

    const sync = async () => {
        try {
            const lastId = await getLatestPostId();
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
            
            const token = localStorage.getItem('auth_token');
            const headers: HeadersInit = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/api/v1/posts/sync?last_id=${lastId}`, {
                headers
            });
            
            if (!response.ok) throw new Error('Sync failed');
            
            const data = await response.json();
            
            if (data.posts.length > 0) {
                await savePosts(data.posts);
                await prunePosts(200);
                // Reload from DB to get sorted list
                posts.value = await getPosts();
            }
            
        } catch (e: any) {
            console.error('Sync error:', e);
            // Don't block UI, just log
        }
    };

    // Fetch posts from API (now uses sync or direct fetch if needed)
    // We keep this signature for compatibility, but it primarily triggers sync
    const fetchPosts = async (params: PostsQueryParams = {}) => {
        loading.value = true;
        error.value = null;

        try {
            // If specific params are passed (like category), we might need to filter local
            // or fetch if not found. For now, we rely on sync to get latest.
            await sync();
            
            // If category_id is present, we might want to filter the global posts
            // But 'posts' ref is global. 
            // If the UI expects 'posts' to be filtered, we should probably return a filtered computed
            // or update a local ref. 
            // However, the existing code updated the global 'posts'.
            // If we update global 'posts' to only show category X, then go back to home, we lose others?
            // The previous implementation fetched from API and replaced 'posts'.
            // To support "offline first" with category navigation:
            // We should keep 'allPosts' in DB/memory, and 'posts' ref could be the view?
            // Or better: 'posts' is ALL posts, and we use computed for filtering in components.
            // But existing components might expect 'posts' to be the list to show.
            
            // Let's stick to: 'posts' contains what we want to show.
            // If params has category, we filter from DB.
            if (params.category_id) {
                const allPosts = await getPosts();
                posts.value = allPosts.filter((p: Post) => 
                    p.category?.id === params.category_id || 
                    p.topics?.some(t => t.id === params.category_id)
                );
            } else {
                // No params = home = all posts
                posts.value = await getPosts();
            }
            
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to fetch posts';
            console.error('Error fetching posts:', err);
        } finally {
            loading.value = false;
        }
    };

    // Set fallback data (for when API is unavailable)
    const setFallbackData = (fallbackPosts: any[]) => {
        error.value = null;
        loading.value = false;

        // Transform fallback data to Post format
        posts.value = fallbackPosts.map((article, index) => ({
            id: article.id || index,
            title: article.title,
            description: article.snippet || article.description,
            image: article.image,
            status: 'published' as const,
            created_at: new Date(article.date || Date.now()).toISOString(),
            last_modified: new Date(article.date || Date.now()).toISOString(),
            author: {
                id: 1,
                username: 'system',
                role: 'admin'
            },
            category: article.category ? {
                id: index + 1,
                name: article.category,
                bn_name: article.category
            } : undefined,
            topics: []
        }));
    };

    // Get posts for slider (first 6 published posts)
    const sliderPosts = computed(() => {
        return posts.value.slice(0, 6);
    });

    // Get main posts (remaining published posts)
    const mainPosts = computed(() => {
        return posts.value.slice(6);
    });

    // Transform Post to article format for compatibility with existing components
    const transformPostToArticle = (post: Post) => {
        return {
            id: post.id,
            title: post.title,
            category: post.category?.bn_name || post.category?.name || 'অবিভাগ',
            date: new Date(post.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            snippet: post.description,
            image: newsAPI.getImageURL(post.image),
            showInSlide: false // Will be set based on position
        };
    };

    // Get articles for slider
    const sliderArticles = computed(() => {
        return sliderPosts.value.map(post => ({
            ...transformPostToArticle(post),
            showInSlide: true
        }));
    });

    // Get articles for main content
    const mainArticles = computed(() => {
        return mainPosts.value.map(post => transformPostToArticle(post));
    });

    return {
        posts,
        loading,
        error,
        init,
        sync,
        fetchPosts,
        setFallbackData,
        sliderPosts,
        mainPosts,
        sliderArticles,
        mainArticles,
        transformPostToArticle
    };
}
