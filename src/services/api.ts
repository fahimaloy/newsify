// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_V1_PREFIX = '/api/v1';

// Types
export interface Category {
    id: number;
    name: string;
    bn_name?: string;
    parent_id?: number;
}

export interface User {
    id: number;
    username: string;
    role: string;
}

export interface Post {
    id: number;
    title: string;
    description: string;
    image?: string;
    status: 'draft' | 'pending' | 'published' | 'rejected';
    created_at: string;
    last_modified: string;
    author: User;
    category?: Category;
    topics: Category[];
}

export interface PostsQueryParams {
    skip?: number;
    limit?: number;
    category_id?: number;
    topic_ids?: number[];
}

// API Service
class NewsAPIService {
    private baseURL: string;

    constructor() {
        this.baseURL = `${API_BASE_URL}${API_V1_PREFIX}`;
    }

    // Helper method to build query string
    private buildQueryString(params: Record<string, any>): string {
        const searchParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                    value.forEach(v => searchParams.append(key, v.toString()));
                } else {
                    searchParams.append(key, value.toString());
                }
            }
        });

        const queryString = searchParams.toString();
        return queryString ? `?${queryString}` : '';
    }

    // Get all posts with optional filtering
    async getPosts(params: PostsQueryParams = {}): Promise<Post[]> {
        const queryString = this.buildQueryString(params);
        const response = await fetch(`${this.baseURL}/posts/${queryString}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch posts: ${response.statusText}`);
        }

        return response.json();
    }

    // Get a single post by ID
    async getPost(id: number): Promise<Post> {
        const response = await fetch(`${this.baseURL}/posts/${id}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch post: ${response.statusText}`);
        }

        return response.json();
    }

    // Get all categories
    async getCategories(skip: number = 0, limit: number = 100): Promise<Category[]> {
        const queryString = this.buildQueryString({ skip, limit });
        const response = await fetch(`${this.baseURL}/categories/${queryString}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch categories: ${response.statusText}`);
        }

        return response.json();
    }

    // Get a single category by ID
    async getCategory(id: number): Promise<Category> {
        const response = await fetch(`${this.baseURL}/categories/${id}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch category: ${response.statusText}`);
        }

        return response.json();
    }

    // Helper method to get image URL
    getImageURL(imagePath?: string): string {
        if (!imagePath) {
            return 'https://via.placeholder.com/400x300?text=No+Image';
        }

        // If it's already a full URL, return as is
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }

        // Otherwise, construct the full URL from the backend
        return `${API_BASE_URL}/${imagePath}`;
    }
}

// Export a singleton instance
export const newsAPI = new NewsAPIService();
