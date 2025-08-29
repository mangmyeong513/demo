
/**
 * Lightweight JSON file storage for Ovra
 * FILE_STORAGE=1 환경변수로 활성화.
 */
import fs from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';
import {
  type User, type UpsertUser, type RegisterUser, type UpdateUser,
  type Post, type PostWithAuthor, type InsertPost,
  type Comment, type InsertComment,
} from "@shared/schema";

type Row = Record<string, any> & { id: string, createdAt?: string, updatedAt?: string };

const DATA_DIR = path.resolve('./data');

async function ensure() { await fs.mkdir(DATA_DIR, { recursive: true }); }

async function readTable<T extends Row>(name: string): Promise<T[]> {
  await ensure();
  const f = path.join(DATA_DIR, name + '.json');
  try {
    const s = await fs.readFile(f, 'utf8');
    return JSON.parse(s) as T[];
  } catch (e: any) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

async function writeTable<T extends Row>(name: string, rows: T[]) {
  const f = path.join(DATA_DIR, name + '.json');
  const tmp = f + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(rows, null, 2), 'utf8');
  await fs.rename(tmp, f);
}

function nowISO() { return new Date().toISOString(); }

export class FileStorage {
  // --- Users ---
  async getUser(id: string): Promise<User|undefined> {
    const users = await readTable<User>('users');
    return users.find(u => u.id === id);
  }
  async getUserByUsername(username: string): Promise<User|undefined> {
    const users = await readTable<User>('users');
    return users.find(u => u.username === username);
  }
  async getUserByEmail(email: string): Promise<User|undefined> {
    const users = await readTable<User>('users');
    return users.find(u => u.email === email);
  }
  async searchUsers(query: string, currentUserId?: string): Promise<User[]> {
    const users = await readTable<User>('users');
    const q = query.toLowerCase();
    return users.filter(u => (u.username?.toLowerCase().includes(q) || u.displayName?.toLowerCase().includes(q)) && u.id !== currentUserId).slice(0, 20);
  }
  async upsertUser(user: UpsertUser): Promise<User> {
    const users = await readTable<User>('users');
    let found = users.find(u => u.id === user.id || (user.username && u.username === user.username));
    if (found) {
      Object.assign(found, user, { updatedAt: nowISO() });
    } else {
      found = { id: user.id || nanoid(), createdAt: nowISO(), ...user } as any;
      users.push(found);
    }
    await writeTable('users', users);
    return found as User;
  }
  async createUser(userData: RegisterUser): Promise<User> {
    const users = await readTable<User>('users');
    const user: any = {
      id: nanoid(),
      createdAt: nowISO(),
      username: userData.username,
      password: userData.password, // NOTE: plaintext; for demo only
      displayName: userData.username,
      email: '',
      bio: '',
      avatarUrl: '',
      role: 'user',
    };
    users.push(user);
    await writeTable('users', users);
    return user as User;
  }
  async updateUser(id: string, updates: UpdateUser): Promise<User> {
    const users = await readTable<User>('users');
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('user_not_found');
    users[idx] = { ...(users[idx] as any), ...updates, id, updatedAt: nowISO() };
    await writeTable('users', users);
    return users[idx] as User;
  }

  // --- Posts ---
  async createPost(post: InsertPost, authorId: string): Promise<Post> {
    const posts = await readTable<Post>('posts');
    const id = nanoid();
    const row: any = {
      id, createdAt: nowISO(), updatedAt: nowISO(),
      authorId,
      content: post.content,
      title: (post as any).title || '',
      images: (post as any).images || [],
      tags: (post as any).tags || [],
      quotedPostId: (post as any).quotedPostId || null,
      visibility: (post as any).visibility || 'public'
    };
    posts.push(row);
    await writeTable('posts', posts);
    return row as Post;
  }
  async getPost(id: string): Promise<PostWithAuthor|undefined> {
    const posts = await readTable<Post>('posts');
    const users = await readTable<User>('users');
    const p = posts.find(x => (x as any).id === id);
    if (!p) return undefined;
    const author = users.find(u => u.id === (p as any).authorId)!;
    let quoted: any = null;
    if ((p as any).quotedPostId) {
      const qp = posts.find(x => (x as any).id === (p as any).quotedPostId);
      if (qp) quoted = { ...(qp as any), author: users.find(u => u.id === (qp as any).authorId)! };
    }
    return { ...(p as any), author, quotedPost: quoted } as any;
  }
  async getPosts(userId?: string, limit=20, offset=0): Promise<PostWithAuthor[]> {
    const posts = await readTable<Post>('posts');
    const users = await readTable<User>('users');
    const list = posts
      .filter(p => !userId || (p as any).authorId === userId)
      .sort((a:any,b:any)=> (b.createdAt> a.createdAt?1:-1));
    return list.slice(offset, offset+limit).map(p => ({ ...(p as any), author: users.find(u=>u.id===(p as any).authorId)! })) as any;
  }
  async getPostsByTag(tag: string, limit=20, offset=0): Promise<PostWithAuthor[]> {
    const posts = await readTable<Post>('posts');
    const users = await readTable<User>('users');
    const has = posts.filter(p => ((p as any).tags||[]).includes(tag))
      .sort((a:any,b:any)=> (b.createdAt> a.createdAt?1:-1));
    return has.slice(offset, offset+limit).map(p => ({ ...(p as any), author: users.find(u=>u.id===(p as any).authorId)! })) as any;
  }
  async getPostsByAuthor(authorId: string, limit=20, offset=0): Promise<PostWithAuthor[]> {
    return this.getPosts(authorId, limit, offset);
  }

  // --- Comments ---
  async addComment(comment: InsertComment, authorId: string): Promise<Comment> {
    const comments = await readTable<Comment>('comments');
    const row: any = { id: nanoid(), createdAt: nowISO(), updatedAt: nowISO(), ...comment, authorId };
    comments.push(row);
    await writeTable('comments', comments);
    return row as Comment;
  }
  async getComments(postId: string, limit=50, offset=0): Promise<(Comment & {author: User})[]> {
    const comments = await readTable<any>('comments');
    const users = await readTable<User>('users');
    const list = comments.filter(c=>c.postId===postId)
      .sort((a:any,b:any)=> (a.createdAt> b.createdAt?1:-1));
    return list.slice(offset, offset+limit).map(c => ({...c, author: users.find(u=>u.id===c.authorId)! }));
  }

  // --- Likes & Bookmarks ---
  async likePost(postId: string, userId: string): Promise<void> {
    const likes = await readTable<any>('likes');
    if (!likes.find(l=>l.postId===postId && l.userId===userId)) {
      likes.push({ id: nanoid(), postId, userId, createdAt: nowISO() });
      await writeTable('likes', likes);
    }
  }
  async unlikePost(postId: string, userId: string): Promise<void> {
    const likes = await readTable<any>('likes');
    await writeTable('likes', likes.filter(l=>!(l.postId===postId && l.userId===userId)));
  }
  async isPostLiked(postId: string, userId: string): Promise<boolean> {
    const likes = await readTable<any>('likes');
    return !!likes.find(l=>l.postId===postId && l.userId===userId);
  }
  async getPostLikeCount(postId: string): Promise<number> {
    const likes = await readTable<any>('likes');
    return likes.filter(l=>l.postId===postId).length;
  }

  async bookmarkPost(postId: string, userId: string): Promise<void> {
    const bookmarks = await readTable<any>('bookmarks');
    if (!bookmarks.find(b=>b.postId===postId && b.userId===userId)) {
      bookmarks.push({ id: nanoid(), postId, userId, createdAt: nowISO() });
      await writeTable('bookmarks', bookmarks);
    }
  }
  async unbookmarkPost(postId: string, userId: string): Promise<void> {
    const bookmarks = await readTable<any>('bookmarks');
    await writeTable('bookmarks', bookmarks.filter(b=>!(b.postId===postId && b.userId===userId)));
  }
  async isPostBookmarked(postId: string, userId: string): Promise<boolean> {
    const bookmarks = await readTable<any>('bookmarks');
    return !!bookmarks.find(b=>b.postId===postId && b.userId===userId);
  }

  // --- Follows ---
  async followUser(userId: string, targetId: string): Promise<void> {
    const follows = await readTable<any>('follows');
    if (!follows.find(f=>f.followerId===userId && f.followingId===targetId)) {
      follows.push({ id: nanoid(), followerId: userId, followingId: targetId, createdAt: nowISO() });
      await writeTable('follows', follows);
    }
  }
  async unfollowUser(userId: string, targetId: string): Promise<void> {
    const follows = await readTable<any>('follows');
    await writeTable('follows', follows.filter(f=>!(f.followerId===userId && f.followingId===targetId)));
  }
  async isFollowing(userId: string, targetId: string): Promise<boolean> {
    const follows = await readTable<any>('follows');
    return !!follows.find(f=>f.followerId===userId && f.followingId===targetId);
  }
  async getFollowersCount(userId: string): Promise<number> {
    const follows = await readTable<any>('follows');
    return follows.filter(f=>f.followingId===userId).length;
  }
  async getFollowingCount(userId: string): Promise<number> {
    const follows = await readTable<any>('follows');
    return follows.filter(f=>f.followerId===userId).length;
  }
  async getFollowingPosts(userId: string, limit=20, offset=0): Promise<PostWithAuthor[]> {
    const follows = await readTable<any>('follows');
    const ids = follows.filter(f=>f.followerId===userId).map(f=>f.followingId);
    const posts = await this.getPosts(undefined, 10000, 0);
    return posts.filter(p=>ids.includes((p as any).authorId)).slice(offset, offset+limit);
  }

  // --- Notifications (minimal) ---
  async createNotification(userId: string, postId: string, authorId: string, type: string, title: string, message: string): Promise<void> {
    const list = await readTable<any>('notifications');
    list.push({ id: nanoid(), userId, postId, authorId, type, title, message, read: false, createdAt: nowISO() });
    await writeTable('notifications', list);
  }
  async getNotifications(userId: string, limit=30, offset=0): Promise<any[]> {
    const list = await readTable<any>('notifications');
    return list.filter(n=>n.userId===userId).sort((a:any,b:any)=> (b.createdAt>a.createdAt?1:-1)).slice(offset, offset+limit);
  }
  async markNotificationRead(id: string): Promise<void> {
    const list = await readTable<any>('notifications');
    const idx = list.findIndex(n=>n.id===id);
    if (idx!==-1) { list[idx].read = true; await writeTable('notifications', list); }
  }

  // --- Stats & Tags ---
  async getUserStats(userId: string): Promise<{ postsCount: number; followersCount: number; followingCount: number; friendsCount: number }>{ 
    const posts = await readTable<any>('posts');
    const follows = await readTable<any>('follows');
    return {
      postsCount: posts.filter(p=>p.authorId===userId).length,
      followersCount: follows.filter(f=>f.followingId===userId).length,
      followingCount: follows.filter(f=>f.followerId===userId).length,
      friendsCount: 0
    };
  }
  async getTrendingTags(limit=10): Promise<{ tag: string; count: number }[]> {
    const posts = await readTable<any>('posts');
    const counter: Record<string, number> = {};
    for (const p of posts) for (const t of (p.tags||[])) counter[t]=(counter[t]||0)+1;
    return Object.entries(counter).sort((a,b)=>b[1]-a[1]).slice(0,limit).map(([tag,count])=>({tag, count}));
  }

  // --- Stubs for unimplemented interfaces ---
  async getMessages(){ return []; }
  async createMessage(){ return; }
  async getAssessments(){ return []; }
  async createAssessment(a:any){ return a; }
  async getAssessment(){ return undefined; }
  async saveAssessmentResult(r:any){ return r; }
  async getUserAssessmentResults(){ return []; }
  async getAssessmentResults(){ return []; }
}

export const storage = new FileStorage();
