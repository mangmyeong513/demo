import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique().notNull(),
  email: varchar("email").unique(),
  password: varchar("password").notNull(),
  role: varchar("role").notNull().default("user"), // user, admin
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  bio: text("bio"),
  location: varchar("location"),
  website: varchar("website"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Posts table
export const posts: any = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  imageUrl: varchar("image_url"),
  imageUrls: text("image_urls").array(), // New: multiple images for v3
  tags: text("tags").array().default([]),
  // Quote functionality - references another post
  quotedPostId: varchar("quoted_post_id").references(() => posts.id, { onDelete: "set null" }),
  // AI Sentiment Analysis fields
  sentimentScore: integer("sentiment_score"), // 1-5 scale (1=very negative, 5=very positive)
  sentimentConfidence: integer("sentiment_confidence"), // 0-100 confidence percentage
  sentimentAnalyzedAt: timestamp("sentiment_analyzed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_posts_author").on(table.authorId),
  index("idx_posts_created_at").on(table.createdAt),
  index("idx_posts_sentiment").on(table.sentimentScore),
  index("idx_posts_quoted").on(table.quotedPostId),
]);

// Comments table
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Likes table
export const likes = pgTable("likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_likes_post_user").on(table.postId, table.userId),
]);

// Bookmarks table
export const bookmarks = pgTable("bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_bookmarks_post_user").on(table.postId, table.userId),
]);

// Friend Requests table (upgraded from follows)
export const friendRequests = pgTable("friend_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requesterId: varchar("requester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetId: varchar("target_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status").notNull().default("pending"), // pending, accepted, rejected
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_friend_requests_requester_target").on(table.requesterId, table.targetId),
  index("idx_friend_requests_status").on(table.status),
]);

// Keep follows table for backwards compatibility but rename it
export const follows = pgTable("follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  followingId: varchar("following_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_follows_follower_following").on(table.followerId, table.followingId),
]);

// Assessment tables for personality tests
export const assessments = pgTable("assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  questions: jsonb("questions").notNull(), // Array of question objects
  results: jsonb("results").notNull(), // Array of possible result types
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const assessmentResults = pgTable("assessment_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  assessmentId: varchar("assessment_id").notNull().references(() => assessments.id, { onDelete: "cascade" }),
  answers: jsonb("answers").notNull(), // User's answers
  resultType: varchar("result_type").notNull(), // Which result type they got
  score: integer("score"), // Optional numerical score
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_assessment_results_user").on(table.userId),
  index("idx_assessment_results_assessment").on(table.assessmentId),
]);

// Direct Messages table - Enhanced for v4
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverId: varchar("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  messageType: varchar("message_type").default("text"), // text, image, etc.
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_messages_sender_receiver").on(table.senderId, table.receiverId),
  index("idx_messages_created_at").on(table.createdAt),
]);

// Notifications table for new post alerts
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: varchar("post_id").references(() => posts.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type").notNull().default("new_post"), // new_post, like, comment, follow
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_notifications_user").on(table.userId),
  index("idx_notifications_read").on(table.isRead),
  index("idx_notifications_created").on(table.createdAt),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  likes: many(likes),
  bookmarks: many(bookmarks),
  followers: many(follows, { relationName: "follower" }),
  following: many(follows, { relationName: "following" }),
  sentFriendRequests: many(friendRequests, { relationName: "requester" }),
  receivedFriendRequests: many(friendRequests, { relationName: "target" }),
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "receiver" }),
  assessmentResults: many(assessmentResults),
  notifications: many(notifications, { relationName: "notificationUser" }),
  authoredNotifications: many(notifications, { relationName: "notificationAuthor" }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  quotedPost: one(posts, {
    fields: [posts.quotedPostId],
    references: [posts.id],
    relationName: "quotedPost",
  }),
  quotes: many(posts, {
    relationName: "quotedPost",
  }),
  comments: many(comments),
  likes: many(likes),
  bookmarks: many(bookmarks),
})) as any;

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  post: one(posts, {
    fields: [likes.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
}));

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  post: one(posts, {
    fields: [bookmarks.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
    relationName: "follower",
  }),
  following: one(users, {
    fields: [follows.followingId],
    references: [users.id],
    relationName: "following",
  }),
}));

export const friendRequestsRelations = relations(friendRequests, ({ one }) => ({
  requester: one(users, {
    fields: [friendRequests.requesterId],
    references: [users.id],
    relationName: "requester",
  }),
  target: one(users, {
    fields: [friendRequests.targetId],
    references: [users.id],
    relationName: "target",
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receiver",
  }),
}));

export const assessmentsRelations = relations(assessments, ({ many }) => ({
  results: many(assessmentResults),
}));

export const assessmentResultsRelations = relations(assessmentResults, ({ one }) => ({
  user: one(users, {
    fields: [assessmentResults.userId],
    references: [users.id],
  }),
  assessment: one(assessments, {
    fields: [assessmentResults.assessmentId],
    references: [assessments.id],
  }),
}));

// Schemas for validation
export const createPostSchema = createInsertSchema(posts).omit({
  id: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
});

export const updatePostSchema = createPostSchema.partial();

export const createCommentSchema = createInsertSchema(comments).omit({
  id: true,
  authorId: true,
  createdAt: true,
});

export const createMessageSchema = createInsertSchema(messages).omit({
  id: true,
  senderId: true,
  readAt: true,
  createdAt: true,
});

export const updateUserSchema = createInsertSchema(users).omit({
  id: true,
  password: true,
  createdAt: true,
  updatedAt: true,
}).partial();

// Simplified registration - only require username and password
export const registerUserSchema = z.object({
  username: z.string().min(2, "사용자명은 2자 이상이어야 합니다"),
  email: z.string().email("올바른 이메일을 입력해주세요").optional().nullable(),
  password: z.string().min(4, "비밀번호는 4자 이상이어야 합니다"),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
});

// Quick signup - only username and password
export const quickRegisterUserSchema = z.object({
  username: z.string().min(2, "사용자명은 2자 이상이어야 합니다"),
  password: z.string().min(4, "비밀번호는 4자 이상이어야 합니다"),
});

export const loginUserSchema = z.object({
  username: z.string().min(1, "사용자명을 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type PostWithAuthor = Post & { 
  author: User;
  quotedPost?: PostWithAuthor | null;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
};
export type Comment = typeof comments.$inferSelect;
export type CommentWithAuthor = Comment & { author: User };
export type Message = typeof messages.$inferSelect;
export type MessageWithUsers = Message & { sender: User; receiver: User };
export type Assessment = typeof assessments.$inferSelect;
export type AssessmentResult = typeof assessmentResults.$inferSelect;
export type AssessmentResultWithUser = AssessmentResult & { user: User };
export type InsertPost = z.infer<typeof createPostSchema>;
export type UpdatePost = z.infer<typeof updatePostSchema>;
export type InsertComment = z.infer<typeof createCommentSchema>;
export const createAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const createAssessmentResultSchema = createInsertSchema(assessmentResults).omit({
  id: true,
  createdAt: true,
});

export type InsertMessage = z.infer<typeof createMessageSchema>;
export type InsertAssessment = z.infer<typeof createAssessmentSchema>;
export type InsertAssessmentResult = z.infer<typeof createAssessmentResultSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type QuickRegisterUser = z.infer<typeof quickRegisterUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

// Friend request types
export type FriendRequest = typeof friendRequests.$inferSelect;
export type FriendRequestWithUsers = FriendRequest & { 
  requester: User; 
  target: User; 
};

export const createFriendRequestSchema = createInsertSchema(friendRequests).omit({
  id: true,
  requesterId: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertFriendRequest = z.infer<typeof createFriendRequestSchema>;
