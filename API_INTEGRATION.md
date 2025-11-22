# News API Integration

This document describes how the frontend integrates with the backend news API.

## Overview

The frontend now fetches news posts from the backend API instead of using static JSON data. The integration includes:

- **API Service** (`src/services/api.ts`): Handles all HTTP requests to the backend
- **Composable** (`src/composables/useNews.ts`): Manages news data state and transformations
- **Updated Components**: `Home.vue` now uses real API data

## Configuration

### Environment Variables

Create a `.env` file in the frontend root directory:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## API Service

The API service (`src/services/api.ts`) provides:

### Methods

- `getPosts(params?)` - Fetch all posts with optional filtering
- `getPost(id)` - Fetch a single post by ID
- `getCategories(skip?, limit?)` - Fetch all categories
- `getCategory(id)` - Fetch a single category by ID
- `getImageURL(imagePath?)` - Convert image path to full URL

### Query Parameters

```typescript
interface PostsQueryParams {
  skip?: number;        // Pagination offset
  limit?: number;       // Number of posts to fetch
  category_id?: number; // Filter by category
  topic_ids?: number[]; // Filter by topics
}
```

### Example Usage

```typescript
import { newsAPI } from '@/services/api';

// Fetch all published posts
const posts = await newsAPI.getPosts();

// Fetch posts with filtering
const filteredPosts = await newsAPI.getPosts({
  category_id: 1,
  limit: 10,
  skip: 0
});

// Get image URL
const imageUrl = newsAPI.getImageURL(post.image);
```

## Composable

The `useNews` composable provides reactive state management:

```typescript
import { useNews } from '@/composables/useNews';

const { 
  posts,           // All posts
  loading,         // Loading state
  error,           // Error message
  fetchPosts,      // Function to fetch posts
  sliderArticles,  // Posts for slider (first 6)
  mainArticles     // Posts for main content
} = useNews();

// Fetch posts
await fetchPosts({ limit: 100 });
```

## Data Transformation

The backend `Post` model is transformed to match the existing article format:

### Backend Post Model
```typescript
interface Post {
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
```

### Frontend Article Format
```typescript
interface Article {
  id: number;
  title: string;
  category: string;      // From category.bn_name or category.name
  date: string;          // Formatted from created_at
  snippet: string;       // From description
  image: string;         // Full URL from image path
  showInSlide: boolean;  // Based on position
}
```

## Image Handling

Images are handled in three ways:

1. **Backend uploaded images**: `static/images/uuid.jpg` → `http://localhost:8000/static/images/uuid.jpg`
2. **External URLs**: Passed through as-is
3. **Missing images**: Placeholder image is used

## Running the Application

### Start Backend
```bash
cd backend
uv run uvicorn src.cj36.main:app --reload
```

### Start Frontend
```bash
cd frontend
npm run dev
# or
bun dev
```

The frontend will be available at `http://localhost:5173` (or the port Vite assigns).

## CORS Configuration

The backend must allow CORS requests from the frontend. This is typically configured in `main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Error Handling

The integration includes comprehensive error handling:

- **Loading State**: Shows spinner while fetching data
- **Error State**: Displays error message if fetch fails
- **Empty State**: Gracefully handles no data scenarios

## Future Enhancements

Potential improvements:

1. **Caching**: Implement client-side caching to reduce API calls
2. **Pagination**: Add infinite scroll or pagination controls
3. **Real-time Updates**: Use WebSockets for live news updates
4. **Offline Support**: Cache data for offline viewing
5. **Search**: Add search functionality
6. **Filters**: Add UI controls for category/topic filtering
