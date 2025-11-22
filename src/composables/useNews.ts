import { ref, computed } from 'vue';
import { newsAPI, type Post, type PostsQueryParams } from '../services/api';

export function useNews() {
    const posts = ref<Post[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Fetch posts from API
    const fetchPosts = async (params: PostsQueryParams = {}) => {
        loading.value = true;
        error.value = null;

        try {
            const fetchedPosts = await newsAPI.getPosts(params);
            posts.value = fetchedPosts;
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
        fetchPosts,
        setFallbackData,
        sliderPosts,
        mainPosts,
        sliderArticles,
        mainArticles,
        transformPostToArticle
    };
}
