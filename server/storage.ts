import {
  users,
  posts,
  comments,
  likes,
  bookmarks,
  follows,
  friendRequests,
  messages,
  assessments,
  assessmentResults,
  notifications,
  type User,
  type UpsertUser,
  type Post,
  type PostWithAuthor,
  type Comment,
  type CommentWithAuthor,
  type Message,
  type MessageWithUsers,
  type FriendRequest,
  type FriendRequestWithUsers,
  type Assessment,
  type AssessmentResult,
  type AssessmentResultWithUser,
  type InsertPost,
  type UpdatePost,
  type InsertComment,
  type InsertMessage,
  type InsertFriendRequest,
  type InsertAssessment,
  type InsertAssessmentResult,
  type UpdateUser,
  type RegisterUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, ilike, or, count, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  searchUsers(query: string, currentUserId?: string): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(userData: RegisterUser): Promise<User>;
  updateUser(id: string, updates: UpdateUser): Promise<User>;
  
  // Post operations
  createPost(post: InsertPost, authorId: string): Promise<Post>;
  getPost(id: string): Promise<PostWithAuthor | undefined>;
  getPosts(userId?: string, limit?: number, offset?: number): Promise<PostWithAuthor[]>;
  getPostsByTag(tag: string, limit?: number, offset?: number): Promise<PostWithAuthor[]>;
  getPostsByAuthor(authorId: string, limit?: number, offset?: number): Promise<PostWithAuthor[]>;
  getPostsByAuthors(authorIds: string[], limit?: number, offset?: number): Promise<PostWithAuthor[]>;
  searchPosts(query: string, limit?: number, offset?: number): Promise<PostWithAuthor[]>;
  updatePost(id: string, updates: UpdatePost, authorId: string): Promise<Post>;
  deletePost(id: string, authorId: string): Promise<boolean>;
  
  // Comment operations
  createComment(comment: InsertComment, authorId: string): Promise<Comment>;
  getCommentsByPost(postId: string): Promise<CommentWithAuthor[]>;
  deleteComment(id: string, authorId: string): Promise<boolean>;
  
  // Like operations
  toggleLike(postId: string, userId: string): Promise<boolean>;
  isPostLiked(postId: string, userId: string): Promise<boolean>;
  
  // Bookmark operations
  toggleBookmark(postId: string, userId: string): Promise<boolean>;
  isPostBookmarked(postId: string, userId: string): Promise<boolean>;
  getBookmarkedPosts(userId: string, limit?: number, offset?: number): Promise<PostWithAuthor[]>;
  
  // Follow operations
  toggleFollow(followerId: string, followingId: string): Promise<boolean>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getFollowers(userId: string): Promise<User[]>;
  getFollowing(userId: string): Promise<User[]>;
  
  // Friend request operations
  sendFriendRequest(requesterId: string, targetId: string): Promise<FriendRequest>;
  respondToFriendRequest(requestId: string, status: 'accepted' | 'rejected'): Promise<FriendRequest>;
  getFriendRequests(userId: string, type: 'received' | 'sent'): Promise<FriendRequestWithUsers[]>;
  getFriends(userId: string): Promise<User[]>;
  getFriendshipStatus(userId: string, otherId: string): Promise<'none' | 'pending_sent' | 'pending_received' | 'friends'>;
  
  // Message operations
  sendMessage(message: InsertMessage, senderId: string): Promise<Message>;
  getMessages(user1Id: string, user2Id: string, limit?: number, offset?: number): Promise<MessageWithUsers[]>;
  getConversations(userId: string): Promise<{ user: User; lastMessage: MessageWithUsers; unreadCount: number }[]>;
  markMessagesAsRead(senderId: string, receiverId: string): Promise<void>;
  
  // Assessment operations
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  getAssessments(): Promise<Assessment[]>;
  getAssessment(id: string): Promise<Assessment | undefined>;
  saveAssessmentResult(result: InsertAssessmentResult, userId: string): Promise<AssessmentResult>;
  getUserAssessmentResults(userId: string): Promise<AssessmentResultWithUser[]>;
  getAssessmentResults(assessmentId: string): Promise<AssessmentResultWithUser[]>;
  
  // Analytics
  getUserStats(userId: string): Promise<{ postsCount: number; followersCount: number; followingCount: number; friendsCount: number }>;
  getTrendingTags(limit?: number): Promise<{ tag: string; count: number }[]>;

  // Notification operations
  createNotification(userId: string, postId: string, authorId: string, type: string, title: string, message: string): Promise<void>;
  getNotifications(userId: string, limit?: number, offset?: number): Promise<any[]>;
  markNotificationAsRead(notificationId: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;

  // Admin operations
  getAllUsers(): Promise<User[]>;
  getAllPosts(): Promise<PostWithAuthor[]>;
  updateUserRole(userId: string, role: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async searchUsers(query: string, currentUserId?: string): Promise<User[]> {
    const searchTerm = `%${query}%`;
    let whereCondition = or(
      ilike(users.username, searchTerm),
      ilike(users.firstName, searchTerm),
      ilike(users.lastName, searchTerm)
    );
    
    // Exclude current user from search results
    if (currentUserId) {
      whereCondition = and(whereCondition, sql`${users.id} != ${currentUserId}`);
    }
    
    const searchResults = await db
      .select()
      .from(users)
      .where(whereCondition)
      .limit(20);
    
    return searchResults;
  }

  async createUser(userData: RegisterUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: UpdateUser): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createPost(post: InsertPost, authorId: string): Promise<Post> {
    const [newPost] = await db
      .insert(posts)
      .values({ ...post, authorId })
      .returning();
    return newPost;
  }

  async getPost(id: string): Promise<PostWithAuthor | undefined> {
    const result = await db
      .select({
        post: posts,
        author: users,
        likesCount: sql<number>`count(distinct ${likes.id})`.as('likes_count'),
        commentsCount: sql<number>`count(distinct ${comments.id})`.as('comments_count'),
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .leftJoin(likes, eq(posts.id, likes.postId))
      .leftJoin(comments, eq(posts.id, comments.postId))
      .where(eq(posts.id, id))
      .groupBy(posts.id, users.id);

    if (!result[0]) return undefined;

    const { post, author, likesCount, commentsCount } = result[0];
    return {
      ...post,
      imageUrls: post.imageUrls ?? null,
      author: author!,
      likesCount: Number(likesCount) || 0,
      commentsCount: Number(commentsCount) || 0,
      isLiked: false,
      isBookmarked: false,
    };
  }

  async getPosts(userId?: string, limit = 20, offset = 0): Promise<PostWithAuthor[]> {
    const query = db
      .select({
        post: posts,
        author: users,
        likesCount: sql<number>`count(distinct ${likes.id})`.as('likes_count'),
        commentsCount: sql<number>`count(distinct ${comments.id})`.as('comments_count'),
        isLiked: userId ? sql<boolean>`count(case when ${likes.userId} = ${userId} then 1 end) > 0`.as('is_liked') : sql<boolean>`false`.as('is_liked'),
        isBookmarked: userId ? sql<boolean>`count(case when ${bookmarks.userId} = ${userId} then 1 end) > 0`.as('is_bookmarked') : sql<boolean>`false`.as('is_bookmarked'),
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .leftJoin(likes, eq(posts.id, likes.postId))
      .leftJoin(comments, eq(posts.id, comments.postId))
      .leftJoin(bookmarks, eq(posts.id, bookmarks.postId))
      .groupBy(posts.id, users.id)
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    const result = await query;
    
    // Get quoted posts for posts that have quotedPostId
    const postsWithQuotes = await Promise.all(
      result.map(async ({ post, author, likesCount, commentsCount, isLiked, isBookmarked }) => {
        let quotedPost = null;
        
        if (post.quotedPostId) {
          const quotedPostData = await this.getPost(post.quotedPostId);
          quotedPost = quotedPostData || null;
        }
        
        return {
          ...post,
          imageUrls: post.imageUrls ?? null,
          author: author!,
          quotedPost,
          likesCount: Number(likesCount) || 0,
          commentsCount: Number(commentsCount) || 0,
          isLiked: Boolean(isLiked),
          isBookmarked: Boolean(isBookmarked),
        };
      })
    );
    
    return postsWithQuotes;
  }

  async getPostsByTag(tag: string, limit = 20, offset = 0): Promise<PostWithAuthor[]> {
    const query = db
      .select({
        post: posts,
        author: users,
        likesCount: sql<number>`count(distinct ${likes.id})`.as('likes_count'),
        commentsCount: sql<number>`count(distinct ${comments.id})`.as('comments_count'),
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .leftJoin(likes, eq(posts.id, likes.postId))
      .leftJoin(comments, eq(posts.id, comments.postId))
      .where(sql`${tag} = ANY(${posts.tags})`)
      .groupBy(posts.id, users.id)
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    const result = await query;
    
    return result.map(({ post, author, likesCount, commentsCount }) => ({
      ...post,
      imageUrls: post.imageUrls ?? null,
      author: author!,
      likesCount: Number(likesCount) || 0,
      commentsCount: Number(commentsCount) || 0,
      isLiked: false,
      isBookmarked: false,
    }));
  }

  async searchPosts(query: string, limit = 20, offset = 0): Promise<PostWithAuthor[]> {
    const searchQuery = `%${query}%`;
    
    const result = await db
      .select({
        post: posts,
        author: users,
        likesCount: sql<number>`count(distinct ${likes.id})`.as('likes_count'),
        commentsCount: sql<number>`count(distinct ${comments.id})`.as('comments_count'),
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .leftJoin(likes, eq(posts.id, likes.postId))
      .leftJoin(comments, eq(posts.id, comments.postId))
      .where(
        or(
          ilike(posts.content, searchQuery),
          sql`exists(select 1 from unnest(${posts.tags}) as tag where tag ilike ${searchQuery})`
        )
      )
      .groupBy(posts.id, users.id)
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    return result.map(({ post, author, likesCount, commentsCount }) => ({
      ...post,
      imageUrls: post.imageUrls ?? null,
      author: author!,
      likesCount: Number(likesCount) || 0,
      commentsCount: Number(commentsCount) || 0,
      isLiked: false,
      isBookmarked: false,
    }));
  }

  async getPostsByAuthor(authorId: string, limit = 20, offset = 0): Promise<PostWithAuthor[]> {
    const result = await db
      .select({
        post: posts,
        author: users,
        likesCount: sql<number>`count(distinct ${likes.id})`.as('likes_count'),
        commentsCount: sql<number>`count(distinct ${comments.id})`.as('comments_count'),
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .leftJoin(likes, eq(posts.id, likes.postId))
      .leftJoin(comments, eq(posts.id, comments.postId))
      .where(eq(posts.authorId, authorId))
      .groupBy(posts.id, users.id)
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    return result.map(({ post, author, likesCount, commentsCount }) => ({
      ...post,
      imageUrls: post.imageUrls ?? null,
      author: author!,
      likesCount: Number(likesCount) || 0,
      commentsCount: Number(commentsCount) || 0,
      isLiked: false,
      isBookmarked: false,
    }));
  }

  async getPostsByAuthors(authorIds: string[], limit = 20, offset = 0): Promise<PostWithAuthor[]> {
    if (authorIds.length === 0) return [];
    
    const result = await db
      .select({
        post: posts,
        author: users,
        likesCount: sql<number>`count(distinct ${likes.id})`.as('likes_count'),
        commentsCount: sql<number>`count(distinct ${comments.id})`.as('comments_count'),
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .leftJoin(likes, eq(posts.id, likes.postId))
      .leftJoin(comments, eq(posts.id, comments.postId))
      .where(inArray(posts.authorId, authorIds))
      .groupBy(posts.id, users.id)
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    return result.map(({ post, author, likesCount, commentsCount }) => ({
      ...post,
      imageUrls: post.imageUrls ?? null,
      author: author!,
      likesCount: Number(likesCount) || 0,
      commentsCount: Number(commentsCount) || 0,
      isLiked: false,
      isBookmarked: false,
    }));
  }

  async updatePost(id: string, updates: UpdatePost, authorId: string): Promise<Post> {
    const [post] = await db
      .update(posts)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(posts.id, id), eq(posts.authorId, authorId)))
      .returning();
    return post;
  }

  async deletePost(id: string, authorId: string): Promise<boolean> {
    const result = await db
      .delete(posts)
      .where(and(eq(posts.id, id), eq(posts.authorId, authorId)));
    return (result.rowCount ?? 0) > 0;
  }

  async createComment(comment: InsertComment, authorId: string): Promise<Comment> {
    const [newComment] = await db
      .insert(comments)
      .values({ ...comment, authorId })
      .returning();
    return newComment;
  }

  async getCommentsByPost(postId: string): Promise<CommentWithAuthor[]> {
    const result = await db
      .select({
        comment: comments,
        author: users,
      })
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt));

    return result.map(({ comment, author }) => ({
      ...comment,
      author: author!,
    }));
  }

  async deleteComment(id: string, authorId: string): Promise<boolean> {
    const result = await db
      .delete(comments)
      .where(and(eq(comments.id, id), eq(comments.authorId, authorId)));
    return (result.rowCount ?? 0) > 0;
  }

  async toggleLike(postId: string, userId: string): Promise<boolean> {
    const existing = await db
      .select()
      .from(likes)
      .where(and(eq(likes.postId, postId), eq(likes.userId, userId)));

    if (existing.length > 0) {
      await db
        .delete(likes)
        .where(and(eq(likes.postId, postId), eq(likes.userId, userId)));
      return false;
    } else {
      await db.insert(likes).values({ postId, userId });
      return true;
    }
  }

  async isPostLiked(postId: string, userId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(likes)
      .where(and(eq(likes.postId, postId), eq(likes.userId, userId)));
    return result.length > 0;
  }

  async toggleBookmark(postId: string, userId: string): Promise<boolean> {
    const existing = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.postId, postId), eq(bookmarks.userId, userId)));

    if (existing.length > 0) {
      await db
        .delete(bookmarks)
        .where(and(eq(bookmarks.postId, postId), eq(bookmarks.userId, userId)));
      return false;
    } else {
      await db.insert(bookmarks).values({ postId, userId });
      return true;
    }
  }

  async isPostBookmarked(postId: string, userId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.postId, postId), eq(bookmarks.userId, userId)));
    return result.length > 0;
  }

  async getBookmarkedPosts(userId: string, limit = 20, offset = 0): Promise<PostWithAuthor[]> {
    const result = await db
      .select({
        post: posts,
        author: users,
        likesCount: sql<number>`count(distinct ${likes.id})`.as('likes_count'),
        commentsCount: sql<number>`count(distinct ${comments.id})`.as('comments_count'),
      })
      .from(bookmarks)
      .leftJoin(posts, eq(bookmarks.postId, posts.id))
      .leftJoin(users, eq(posts.authorId, users.id))
      .leftJoin(likes, eq(posts.id, likes.postId))
      .leftJoin(comments, eq(posts.id, comments.postId))
      .where(eq(bookmarks.userId, userId))
      .groupBy(posts.id, users.id, bookmarks.createdAt)
      .orderBy(desc(bookmarks.createdAt))
      .limit(limit)
      .offset(offset);

    return result.map(({ post, author, likesCount, commentsCount }) => ({
      ...post!,
      imageUrls: post!.imageUrls ?? null,
      author: author!,
      likesCount: Number(likesCount) || 0,
      commentsCount: Number(commentsCount) || 0,
      isLiked: false,
      isBookmarked: true,
    }));
  }

  async getLikedPosts(userId: string, limit = 20, offset = 0): Promise<PostWithAuthor[]> {
    const result = await db
      .select({
        post: posts,
        author: users,
        likesCount: sql<number>`count(distinct ${likes.id})`.as('likes_count'),
        commentsCount: sql<number>`count(distinct ${comments.id})`.as('comments_count'),
      })
      .from(likes)
      .leftJoin(posts, eq(likes.postId, posts.id))
      .leftJoin(users, eq(posts.authorId, users.id))
      .leftJoin(comments, eq(posts.id, comments.postId))
      .where(eq(likes.userId, userId))
      .groupBy(posts.id, users.id, likes.createdAt)
      .orderBy(desc(likes.createdAt))
      .limit(limit)
      .offset(offset);

    return result.map(({ post, author, likesCount, commentsCount }) => ({
      ...post!,
      imageUrls: post!.imageUrls ?? null,
      author: author!,
      likesCount: Number(likesCount) || 0,
      commentsCount: Number(commentsCount) || 0,
      isLiked: true,
      isBookmarked: false,
    }));
  }

  async toggleFollow(followerId: string, followingId: string): Promise<boolean> {
    if (followerId === followingId) return false;

    const existing = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));

    if (existing.length > 0) {
      await db
        .delete(follows)
        .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
      return false;
    } else {
      await db.insert(follows).values({ followerId, followingId });
      return true;
    }
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    return result.length > 0;
  }

  async getFollowers(userId: string): Promise<User[]> {
    const result = await db
      .select({ user: users })
      .from(follows)
      .leftJoin(users, eq(follows.followerId, users.id))
      .where(eq(follows.followingId, userId));
    
    return result.map(({ user }) => user!);
  }

  async getFollowing(userId: string): Promise<User[]> {
    const result = await db
      .select({ user: users })
      .from(follows)
      .leftJoin(users, eq(follows.followingId, users.id))
      .where(eq(follows.followerId, userId));
    
    return result.map(({ user }) => user!);
  }


  async getTrendingTags(limit = 10): Promise<{ tag: string; count: number }[]> {
    const result = await db
      .select({
        tag: sql<string>`unnest(${posts.tags})`.as('tag'),
        count: sql<number>`count(*)`.as('count'),
      })
      .from(posts)
      .where(sql`array_length(${posts.tags}, 1) > 0`)
      .groupBy(sql`unnest(${posts.tags})`)
      .orderBy(desc(sql`count(*)`))
      .limit(limit);

    return result.map(({ tag, count }) => ({ tag, count: Number(count) }));
  }

  async sendMessage(message: InsertMessage, senderId: string): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values({ ...message, senderId })
      .returning();
    return newMessage;
  }

  async getMessages(user1Id: string, user2Id: string, limit = 50, offset = 0): Promise<MessageWithUsers[]> {
    const result = await db
      .select({
        message: messages,
        sender: users,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(
        or(
          and(eq(messages.senderId, user1Id), eq(messages.receiverId, user2Id)),
          and(eq(messages.senderId, user2Id), eq(messages.receiverId, user1Id))
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    // Get receiver info separately to avoid join issues
    const messagesWithSender = result.map(({ message, sender }) => ({
      ...message,
      sender: sender!,
    }));

    // Attach receiver info
    const messagesWithUsers = await Promise.all(
      messagesWithSender.map(async (msg) => {
        const [receiver] = await db.select().from(users).where(eq(users.id, msg.receiverId));
        return {
          ...msg,
          receiver: receiver!,
        };
      })
    );

    return messagesWithUsers;
  }

  async getConversations(userId: string): Promise<{ user: User; lastMessage: MessageWithUsers; unreadCount: number }[]> {
    // Get unique conversation partners
    const conversations = await db
      .select({
        userId: sql<string>`CASE 
          WHEN ${messages.senderId} = ${userId} THEN ${messages.receiverId}
          ELSE ${messages.senderId}
        END`.as('userId'),
        lastMessageId: sql<string>`MAX(${messages.id})`.as('lastMessageId'),
      })
      .from(messages)
      .where(
        or(
          eq(messages.senderId, userId),
          eq(messages.receiverId, userId)
        )
      )
      .groupBy(sql`CASE WHEN ${messages.senderId} = ${userId} THEN ${messages.receiverId} ELSE ${messages.senderId} END`)
      .orderBy(desc(sql`MAX(${messages.createdAt})`));

    const result = [];
    for (const conversation of conversations) {
      // Get the other user
      const [user] = await db.select().from(users).where(eq(users.id, conversation.userId));
      
      // Get the last message with full details
      const [lastMessageData] = await db
        .select({
          message: messages,
          sender: users,
        })
        .from(messages)
        .leftJoin(users, eq(messages.senderId, users.id))
        .where(eq(messages.id, conversation.lastMessageId))
        .limit(1);

      // Count unread messages
      const [unreadData] = await db
        .select({ count: count() })
        .from(messages)
        .where(
          and(
            eq(messages.senderId, conversation.userId),
            eq(messages.receiverId, userId),
            sql`${messages.readAt} IS NULL`
          )
        );

      if (user && lastMessageData) {
        // Get receiver info for the last message
        const [receiver] = await db.select().from(users).where(eq(users.id, lastMessageData.message.receiverId));
        
        result.push({
          user,
          lastMessage: {
            ...lastMessageData.message,
            sender: lastMessageData.sender!,
            receiver: receiver!,
          },
          unreadCount: unreadData.count,
        });
      }
    }

    return result;
  }

  async markMessagesAsRead(senderId: string, receiverId: string): Promise<void> {
    await db
      .update(messages)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(messages.senderId, senderId),
          eq(messages.receiverId, receiverId),
          sql`${messages.readAt} IS NULL`
        )
      );
  }

  // Assessment operations
  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const [newAssessment] = await db
      .insert(assessments)
      .values(assessment)
      .returning();
    return newAssessment;
  }

  async getAssessments(): Promise<Assessment[]> {
    return await db
      .select()
      .from(assessments)
      .where(eq(assessments.isActive, true))
      .orderBy(desc(assessments.createdAt));
  }

  async getAssessment(id: string): Promise<Assessment | undefined> {
    const [assessment] = await db
      .select()
      .from(assessments)
      .where(and(eq(assessments.id, id), eq(assessments.isActive, true)));
    return assessment;
  }

  async saveAssessmentResult(result: InsertAssessmentResult, userId: string): Promise<AssessmentResult> {
    const [newResult] = await db
      .insert(assessmentResults)
      .values({ ...result, userId })
      .returning();
    return newResult;
  }

  async getUserAssessmentResults(userId: string): Promise<AssessmentResultWithUser[]> {
    const results = await db
      .select({
        result: assessmentResults,
        user: users,
      })
      .from(assessmentResults)
      .leftJoin(users, eq(assessmentResults.userId, users.id))
      .where(eq(assessmentResults.userId, userId))
      .orderBy(desc(assessmentResults.createdAt));

    return results.map(({ result, user }) => ({
      ...result,
      user: user!,
    }));
  }

  async getAssessmentResults(assessmentId: string): Promise<AssessmentResultWithUser[]> {
    const results = await db
      .select({
        result: assessmentResults,
        user: users,
      })
      .from(assessmentResults)
      .leftJoin(users, eq(assessmentResults.userId, users.id))
      .where(eq(assessmentResults.assessmentId, assessmentId))
      .orderBy(desc(assessmentResults.createdAt));

    return results.map(({ result, user }) => ({
      ...result,
      user: user!,
    }));
  }

  // Friend request operations
  async sendFriendRequest(requesterId: string, targetId: string): Promise<FriendRequest> {
    if (requesterId === targetId) {
      throw new Error("자기 자신에게 친구 요청을 보낼 수 없습니다");
    }

    // Check if request already exists
    const existing = await db
      .select()
      .from(friendRequests)
      .where(
        or(
          and(eq(friendRequests.requesterId, requesterId), eq(friendRequests.targetId, targetId)),
          and(eq(friendRequests.requesterId, targetId), eq(friendRequests.targetId, requesterId))
        )
      );

    if (existing.length > 0) {
      throw new Error("이미 친구 요청이 존재합니다");
    }

    const [request] = await db
      .insert(friendRequests)
      .values({ requesterId, targetId, status: 'pending' })
      .returning();
    
    return request;
  }

  async respondToFriendRequest(requestId: string, status: 'accepted' | 'rejected'): Promise<FriendRequest> {
    const [updated] = await db
      .update(friendRequests)
      .set({ status, updatedAt: new Date() })
      .where(eq(friendRequests.id, requestId))
      .returning();

    if (!updated) {
      throw new Error("친구 요청을 찾을 수 없습니다");
    }

    return updated;
  }

  async getFriendRequests(userId: string, type: 'received' | 'sent'): Promise<FriendRequestWithUsers[]> {
    const requests = await db
      .select({
        request: friendRequests,
        requester: users,
        target: { id: users.id, username: users.username, profileImageUrl: users.profileImageUrl, bio: users.bio },
      })
      .from(friendRequests)
      .leftJoin(users, 
        type === 'received' 
          ? eq(friendRequests.requesterId, users.id)
          : eq(friendRequests.targetId, users.id)
      )
      .where(
        and(
          type === 'received' 
            ? eq(friendRequests.targetId, userId)
            : eq(friendRequests.requesterId, userId),
          eq(friendRequests.status, 'pending')
        )
      )
      .orderBy(desc(friendRequests.createdAt));

    return requests.map(({ request, requester, target }) => ({
      ...request,
      requester: type === 'received' ? requester! : target as User,
      target: type === 'received' ? target as User : requester!,
    }));
  }

  async getFriends(userId: string): Promise<User[]> {
    const friends = await db
      .select({
        user: users,
      })
      .from(friendRequests)
      .leftJoin(users, 
        or(
          and(eq(friendRequests.requesterId, userId), eq(users.id, friendRequests.targetId)),
          and(eq(friendRequests.targetId, userId), eq(users.id, friendRequests.requesterId))
        )
      )
      .where(
        and(
          eq(friendRequests.status, 'accepted'),
          or(
            eq(friendRequests.requesterId, userId),
            eq(friendRequests.targetId, userId)
          )
        )
      )
      .orderBy(desc(friendRequests.updatedAt));

    return friends.map(({ user }) => user!);
  }

  async getFriendshipStatus(userId: string, otherId: string): Promise<'none' | 'pending_sent' | 'pending_received' | 'friends'> {
    const [request] = await db
      .select()
      .from(friendRequests)
      .where(
        or(
          and(eq(friendRequests.requesterId, userId), eq(friendRequests.targetId, otherId)),
          and(eq(friendRequests.requesterId, otherId), eq(friendRequests.targetId, userId))
        )
      );

    if (!request) return 'none';
    
    if (request.status === 'accepted') return 'friends';
    
    if (request.status === 'pending') {
      return request.requesterId === userId ? 'pending_sent' : 'pending_received';
    }

    return 'none';
  }

  async getUserStats(userId: string): Promise<{ postsCount: number; followersCount: number; followingCount: number; friendsCount: number }> {
    const [postsCountResult] = await db
      .select({ count: sql<number>`count(*)`.as('count') })
      .from(posts)
      .where(eq(posts.authorId, userId));

    const [followersCountResult] = await db
      .select({ count: sql<number>`count(*)`.as('count') })
      .from(follows)
      .where(eq(follows.followingId, userId));

    const [followingCountResult] = await db
      .select({ count: sql<number>`count(*)`.as('count') })
      .from(follows)
      .where(eq(follows.followerId, userId));

    // Count accepted friend requests (both directions)
    const [friendsCountResult] = await db
      .select({ count: sql<number>`count(*)`.as('count') })
      .from(friendRequests)
      .where(and(
        eq(friendRequests.status, 'accepted'),
        or(
          eq(friendRequests.requesterId, userId),
          eq(friendRequests.targetId, userId)
        )
      ));

    return {
      postsCount: Number(postsCountResult.count) || 0,
      followersCount: Number(followersCountResult.count) || 0,
      followingCount: Number(followingCountResult.count) || 0,
      friendsCount: Number(friendsCountResult.count) || 0,
    };
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAllPosts(): Promise<PostWithAuthor[]> {
    return await db
      .select({
        id: posts.id,
        content: posts.content,
        imageUrl: posts.imageUrl,
        imageUrls: posts.imageUrls,
        tags: posts.tags,
        authorId: posts.authorId,
        sentimentScore: posts.sentimentScore,
        sentimentConfidence: posts.sentimentConfidence,
        sentimentAnalyzedAt: posts.sentimentAnalyzedAt,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        author: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          profileImageUrl: users.profileImageUrl,
          bio: users.bio,
          location: users.location,
          website: users.website,
          role: users.role,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        likesCount: sql<number>`COALESCE(l.count, 0)`.as('likesCount'),
        commentsCount: sql<number>`COALESCE(c.count, 0)`.as('commentsCount'),
        isLiked: sql<boolean>`FALSE`.as('isLiked'),
        isBookmarked: sql<boolean>`FALSE`.as('isBookmarked'),
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .leftJoin(
        db.select({
          postId: likes.postId,
          count: sql<number>`count(*)`.as('count'),
        }).from(likes).groupBy(likes.postId).as('l'),
        eq(posts.id, sql`l.post_id`)
      )
      .leftJoin(
        db.select({
          postId: comments.postId,
          count: sql<number>`count(*)`.as('count'),
        }).from(comments).groupBy(comments.postId).as('c'),
        eq(posts.id, sql`c.post_id`)
      )
      .orderBy(desc(posts.createdAt));
  }

  async updateUserRole(userId: string, role: string): Promise<void> {
    await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  // Notification operations
  async createNotification(userId: string, postId: string, authorId: string, type: string, title: string, message: string): Promise<void> {
    await db.insert(notifications).values({
      userId,
      postId,
      authorId,
      type,
      title,
      message,
      isRead: false,
    });
  }

  async getNotifications(userId: string, limit: number = 20, offset: number = 0): Promise<any[]> {
    const results = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        title: notifications.title,
        message: notifications.message,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
        post: {
          id: posts.id,
          content: posts.content,
        },
        author: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
        },
      })
      .from(notifications)
      .leftJoin(posts, eq(notifications.postId, posts.id))
      .leftJoin(users, eq(notifications.authorId, users.id))
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    return results;
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result?.count || 0;
  }
}

export const storage = new DatabaseStorage();
