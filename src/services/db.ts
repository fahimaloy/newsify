import { openDB, DBSchema } from 'idb';
import type { Post } from './api';

interface CachedPost extends Post {
  cached_at: string; // ISO timestamp when post was cached
}

interface NewsDB extends DBSchema {
  posts: {
    key: number;
    value: CachedPost;
    indexes: { 'created_at': string, 'category_id': number, 'cached_at': string };
  };
}

const DB_NAME = 'news-db';
const DB_VERSION = 2; // Increment version for schema change

// Cache duration in milliseconds (10 hours)
const CACHE_DURATION_MS = 10 * 60 * 60 * 1000;

export const dbPromise = openDB<NewsDB>(DB_NAME, DB_VERSION, {
  upgrade(db, oldVersion, newVersion, transaction) {
    console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);
    
    // Create object store if it doesn't exist (fresh install)
    if (!db.objectStoreNames.contains('posts')) {
      const postStore = db.createObjectStore('posts', { keyPath: 'id' });
      postStore.createIndex('created_at', 'created_at');
      postStore.createIndex('category_id', 'category_id');
      postStore.createIndex('cached_at', 'cached_at');
      console.log('Created posts object store with all indexes');
    } else if (oldVersion === 1 && newVersion === 2) {
      // Upgrade from v1 to v2 - add cached_at index
      const postStore = transaction.objectStore('posts');
      if (!postStore.indexNames.contains('cached_at')) {
        postStore.createIndex('cached_at', 'cached_at');
        console.log('Added cached_at index to existing posts store');
      }
    }
  },
});

export async function savePosts(posts: any[]) {
  try {
    const db = await dbPromise;
    const tx = db.transaction('posts', 'readwrite');
    const now = new Date().toISOString();
    
    await Promise.all([
      ...posts.map(post => {
        try {
          // Add cached_at timestamp to each post
          const cachedPost: CachedPost = {
            ...post,
            cached_at: now
          };
          return tx.store.put(cachedPost);
        } catch (err) {
          console.error('Error saving individual post:', err, post);
          return Promise.resolve(); // Continue with other posts
        }
      }),
      tx.done
    ]);
  } catch (err) {
    console.error('Error in savePosts:', err);
    throw err;
  }
}

export async function savePost(post: any) {
  const db = await dbPromise;
  const now = new Date().toISOString();
  const cachedPost: CachedPost = {
    ...post,
    cached_at: now
  };
  await db.put('posts', cachedPost);
}

export async function getPost(id: number) {
  const db = await dbPromise;
  return await db.get('posts', id);
}

export async function getPosts() {
  const db = await dbPromise;
  await pruneExpiredPosts(); // Remove expired posts before returning
  
  const posts = await db.getAll('posts');
  return posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getLatestPostId() {
  const db = await dbPromise;
  // Assuming ID is auto-increment and higher ID = newer
  const cursor = await db.transaction('posts').store.openCursor(null, 'prev');
  return cursor ? cursor.value.id : 0;
}

export async function pruneExpiredPosts() {
  const db = await dbPromise;
  const now = new Date().getTime();
  const expirationTime = now - CACHE_DURATION_MS;
  
  const tx = db.transaction('posts', 'readwrite');
  let cursor = await tx.store.openCursor();
  
  while (cursor) {
    const post = cursor.value;
    if (post.cached_at) {
      const cachedTime = new Date(post.cached_at).getTime();
      if (cachedTime < expirationTime) {
        await cursor.delete();
      }
    }
    cursor = await cursor.continue();
  }
  await tx.done;
}

export async function prunePosts(limit: number = 200) {
  const db = await dbPromise;
  
  // First remove expired posts
  await pruneExpiredPosts();
  
  const count = await db.count('posts');
  if (count > limit) {
    const deleteCount = count - limit;
    // Delete oldest by created_at
    let deleted = 0;
    const tx = db.transaction('posts', 'readwrite');
    let cursor = await tx.store.index('created_at').openCursor();
    
    while (cursor && deleted < deleteCount) {
      await cursor.delete();
      deleted++;
      cursor = await cursor.continue();
    }
    await tx.done;
  }
}
