import { openDB, DBSchema } from 'idb';

interface NewsDB extends DBSchema {
  posts: {
    key: number;
    value: any; // Post object
    indexes: { 'created_at': string, 'category_id': number };
  };
}

const DB_NAME = 'news-db';
const DB_VERSION = 1;

export const dbPromise = openDB<NewsDB>(DB_NAME, DB_VERSION, {
  upgrade(db) {
    const postStore = db.createObjectStore('posts', { keyPath: 'id' });
    postStore.createIndex('created_at', 'created_at');
    postStore.createIndex('category_id', 'category_id');
  },
});

export async function savePosts(posts: any[]) {
  const db = await dbPromise;
  const tx = db.transaction('posts', 'readwrite');
  await Promise.all([
    ...posts.map(post => tx.store.put(post)),
    tx.done
  ]);
}

export async function getPosts() {
  const db = await dbPromise;
  // Return sorted by created_at desc (newest first)
  // IDB getAll returns in key order (id), which is usually chronological for auto-inc IDs,
  // but let's rely on JS sort for simplicity or use index if needed.
  // Using index 'created_at' with 'prev' direction would be better but getAll doesn't support direction easily without cursor.
  // For 200 items, sorting in JS is fast enough.
  const posts = await db.getAll('posts');
  return posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getLatestPostId() {
  const db = await dbPromise;
  // Assuming ID is auto-increment and higher ID = newer
  const cursor = await db.transaction('posts').store.openCursor(null, 'prev');
  return cursor ? cursor.value.id : 0;
}

export async function prunePosts(limit: number = 200) {
  const db = await dbPromise;
  const count = await db.count('posts');
  if (count > limit) {
    const deleteCount = count - limit;
    // Delete oldest
    // We need to iterate by created_at (oldest first) and delete
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
