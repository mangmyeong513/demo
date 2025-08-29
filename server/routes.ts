import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import { 
  createPostSchema, 
  createCommentSchema, 
  createMessageSchema,
  createAssessmentSchema,
  createAssessmentResultSchema,
  updateUserSchema 
} from "@shared/schema";
import { z } from "zod";
import { analyzeSentiment } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      const stats = await storage.getUserStats(userId);
      res.json({ ...user, ...stats });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User routes
  app.get('/api/users/:userId', async (req, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const stats = await storage.getUserStats(req.params.userId);
      res.json({ ...user, ...stats });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get('/api/users/:userId/followers', async (req, res) => {
    try {
      const followers = await storage.getFollowers(req.params.userId);
      res.json(followers);
    } catch (error) {
      console.error("Error fetching followers:", error);
      res.status(500).json({ message: "Failed to fetch followers" });
    }
  });

  app.get('/api/users/:userId/following', async (req, res) => {
    try {
      const following = await storage.getFollowing(req.params.userId);
      res.json(following);
    } catch (error) {
      console.error("Error fetching following:", error);
      res.status(500).json({ message: "Failed to fetch following" });
    }
  });

  app.get('/api/users/:userId/follow', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.id;
      const targetUserId = req.params.userId;
      const isFollowing = await storage.isFollowing(currentUserId, targetUserId);
      res.json({ isFollowing });
    } catch (error) {
      console.error("Error checking follow status:", error);
      res.status(500).json({ message: "Failed to check follow status" });
    }
  });

  app.put('/api/users/me', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const updates = updateUserSchema.parse(req.body);
      const user = await storage.updateUser(userId, updates);
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Post routes
  app.get('/api/posts', async (req, res) => {
    try {
      const { limit = '20', offset = '0', tag, search, author } = req.query;
      const userId = (req as any).user?.claims?.sub;
      
      let posts;
      if (search) {
        posts = await storage.searchPosts(search as string, parseInt(limit as string), parseInt(offset as string));
      } else if (tag) {
        posts = await storage.getPostsByTag(tag as string, parseInt(limit as string), parseInt(offset as string));
      } else if (author) {
        posts = await storage.getPostsByAuthor(author as string, parseInt(limit as string), parseInt(offset as string));
      } else {
        posts = await storage.getPosts(userId, parseInt(limit as string), parseInt(offset as string));
      }
      
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  // 팔로잉 사용자의 게시글 조회
  app.get('/api/posts/following', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.id;
      const { limit = '20', offset = '0' } = req.query;
      
      const followingUsers = await storage.getFollowing(currentUserId);
      if (followingUsers.length === 0) {
        return res.json([]);
      }
      
      const followingUserIds = followingUsers.map(user => user.id);
      const posts = await storage.getPostsByAuthors(followingUserIds, parseInt(limit as string), parseInt(offset as string));
      
      res.json(posts);
    } catch (error) {
      console.error("Error fetching following posts:", error);
      res.status(500).json({ message: "Failed to fetch following posts" });
    }
  });

  app.get('/api/posts/:id', async (req, res) => {
    try {
      const post = await storage.getPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.post('/api/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const postData = createPostSchema.parse(req.body);
      
      const post = await storage.createPost(postData, userId);
      
      // Create notifications for followers about the new post
      try {
        const followers = await storage.getFollowers(userId);
        const author = await storage.getUser(userId);
        
        if (followers.length > 0 && author) {
          const notifications = followers.map(follower => 
            storage.createNotification(
              follower.id,
              post.id,
              userId,
              'new_post',
              '새로운 게시글',
              `${author.username || author.firstName || '사용자'}님이 새로운 게시글을 올렸습니다.`
            )
          );
          await Promise.all(notifications);
        }
      } catch (notificationError) {
        console.error("Error creating notifications:", notificationError);
        // Don't fail the post creation if notification fails
      }
      
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.delete('/api/posts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const success = await storage.deletePost(req.params.id, userId);
      if (!success) {
        return res.status(404).json({ message: "Post not found or unauthorized" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Comment routes
  app.get('/api/posts/:postId/comments', async (req, res) => {
    try {
      const comments = await storage.getCommentsByPost(req.params.postId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post('/api/posts/:postId/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const commentData = createCommentSchema.parse({
        ...req.body,
        postId: req.params.postId,
      });
      const comment = await storage.createComment(commentData, userId);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Like routes
  app.post('/api/posts/:postId/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const isLiked = await storage.toggleLike(req.params.postId, userId);
      res.json({ isLiked });
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  // Bookmark routes
  app.post('/api/posts/:postId/bookmark', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const isBookmarked = await storage.toggleBookmark(req.params.postId, userId);
      res.json({ isBookmarked });
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      res.status(500).json({ message: "Failed to toggle bookmark" });
    }
  });

  app.get('/api/bookmarks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { limit = '20', offset = '0' } = req.query;
      const posts = await storage.getBookmarkedPosts(userId, parseInt(limit as string), parseInt(offset as string));
      res.json(posts);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });

  app.get('/api/liked', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { limit = '20', offset = '0' } = req.query;
      const posts = await storage.getLikedPosts(userId, parseInt(limit as string), parseInt(offset as string));
      res.json(posts);
    } catch (error) {
      console.error("Error fetching liked posts:", error);
      res.status(500).json({ message: "Failed to fetch liked posts" });
    }
  });

  // Follow routes
  app.post('/api/users/:userId/follow', isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.id;
      const followingId = req.params.userId;
      const isFollowing = await storage.toggleFollow(followerId, followingId);
      res.json({ isFollowing });
    } catch (error) {
      console.error("Error toggling follow:", error);
      res.status(500).json({ message: "Failed to toggle follow" });
    }
  });

  // Friend request routes
  app.post('/api/friend-requests', isAuthenticated, async (req: any, res) => {
    try {
      const requesterId = req.user.id;
      const { targetId } = req.body;
      const request = await storage.sendFriendRequest(requesterId, targetId);
      res.status(201).json(request);
    } catch (error: any) {
      console.error("Error sending friend request:", error);
      res.status(400).json({ message: error.message || "Failed to send friend request" });
    }
  });

  app.put('/api/friend-requests/:requestId', isAuthenticated, async (req: any, res) => {
    try {
      const { requestId } = req.params;
      const { status } = req.body;
      
      if (!['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const request = await storage.respondToFriendRequest(requestId, status);
      res.json(request);
    } catch (error: any) {
      console.error("Error responding to friend request:", error);
      res.status(400).json({ message: error.message || "Failed to respond to friend request" });
    }
  });

  app.get('/api/friend-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { type = 'received' } = req.query;
      
      if (!['received', 'sent'].includes(type)) {
        return res.status(400).json({ message: "Invalid type. Must be 'received' or 'sent'" });
      }

      const requests = await storage.getFriendRequests(userId, type);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      res.status(500).json({ message: "Failed to fetch friend requests" });
    }
  });

  app.get('/api/friends', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const friends = await storage.getFriends(userId);
      res.json(friends);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  app.get('/api/users/:userId/friendship-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { userId: otherId } = req.params;
      const status = await storage.getFriendshipStatus(userId, otherId);
      res.json({ status });
    } catch (error) {
      console.error("Error checking friendship status:", error);
      res.status(500).json({ message: "Failed to check friendship status" });
    }
  });

  // Analytics routes
  app.get('/api/trending/tags', async (req, res) => {
    try {
      const { limit = '10' } = req.query;
      const tags = await storage.getTrendingTags(parseInt(limit as string));
      res.json(tags);
    } catch (error) {
      console.error("Error fetching trending tags:", error);
      res.status(500).json({ message: "Failed to fetch trending tags" });
    }
  });

  // Message routes
  app.get('/api/messages/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get('/api/messages/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.id;
      const otherUserId = req.params.userId;
      const { limit = '50', offset = '0' } = req.query;
      
      const messages = await storage.getMessages(
        currentUserId, 
        otherUserId, 
        parseInt(limit as string), 
        parseInt(offset as string)
      );
      
      // Mark messages as read
      await storage.markMessagesAsRead(otherUserId, currentUserId);
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.user.id;
      const messageData = createMessageSchema.parse(req.body);
      const message = await storage.sendMessage(messageData, senderId);
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { limit = '20', offset = '0' } = req.query;
      const notifications = await storage.getNotifications(userId, parseInt(limit as string), parseInt(offset as string));
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get('/api/notifications/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
      res.status(500).json({ message: "Failed to fetch unread notification count" });
    }
  });

  app.put('/api/notifications/:notificationId/read', isAuthenticated, async (req: any, res) => {
    try {
      const { notificationId } = req.params;
      await storage.markNotificationAsRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.put('/api/notifications/mark-all-read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Get user posts with enhanced filtering
  app.get('/api/users/:id/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const filter = req.query.filter as string; // 'quotes', 'original', 'all'
      
      let posts = await storage.getPostsByAuthor(userId, 50, 0);
      
      // Filter based on query parameter
      if (filter === 'quotes') {
        posts = posts.filter((post: any) => post.quotedPostId);
      } else if (filter === 'original') {
        posts = posts.filter((post: any) => !post.quotedPostId);
      }
      
      res.json(posts);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      res.status(500).json({ error: "Failed to fetch user posts" });
    }
  });

  // Get user liked posts
  app.get('/api/users/:id/liked', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const currentUserId = req.user?.id;
      
      // Only allow users to see their own liked posts
      if (userId !== currentUserId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const likedPosts = await storage.getLikedPosts(userId, 50, 0);
      res.json(likedPosts);
    } catch (error) {
      console.error("Error fetching liked posts:", error);
      res.status(500).json({ error: "Failed to fetch liked posts" });
    }
  });

  // Get all users for friends functionality
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.id;
      const { search } = req.query;
      
      if (search) {
        // Search users by username or name
        const users = await storage.searchUsers(search as string, currentUserId);
        res.json(users);
      } else {
        // Get all users except current user - simplified for demo
        const users = await storage.getFollowing(currentUserId);
        const followers = await storage.getFollowers(currentUserId);
        
        // Combine and deduplicate
        const allConnections = [...users, ...followers];
        const uniqueUsers = allConnections.filter((user, index, self) => 
          index === self.findIndex(u => u.id === user.id)
        );
        
        res.json(uniqueUsers);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Assessment routes - DISABLED
  /*
  app.get('/api/assessments', isAuthenticated, async (req: any, res) => {
    try {
      const assessments = await storage.getAssessments();
      res.json(assessments);
    } catch (error) {
      console.error("Error fetching assessments:", error);
      res.status(500).json({ message: "Failed to fetch assessments" });
    }
  });

  app.get('/api/assessments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const assessment = await storage.getAssessment(req.params.id);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      res.json(assessment);
    } catch (error) {
      console.error("Error fetching assessment:", error);
      res.status(500).json({ message: "Failed to fetch assessment" });
    }
  });

  app.post('/api/assessments', isAuthenticated, async (req: any, res) => {
    try {
      const assessmentData = createAssessmentSchema.parse(req.body);
      const assessment = await storage.createAssessment(assessmentData);
      res.json(assessment);
    } catch (error) {
      console.error("Error creating assessment:", error);
      res.status(500).json({ message: "Failed to create assessment" });
    }
  });

  app.post('/api/assessments/:id/submit', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const assessmentId = req.params.id;
      const resultData = createAssessmentResultSchema.parse({
        ...req.body,
        assessmentId,
      });
      
      const result = await storage.saveAssessmentResult(resultData, userId);
      res.json(result);
    } catch (error) {
      console.error("Error submitting assessment result:", error);
      res.status(500).json({ message: "Failed to submit assessment result" });
    }
  });

  app.get('/api/assessments/:id/results', isAuthenticated, async (req: any, res) => {
    try {
      const assessmentId = req.params.id;
      const results = await storage.getAssessmentResults(assessmentId);
      res.json(results);
    } catch (error) {
      console.error("Error fetching assessment results:", error);
      res.status(500).json({ message: "Failed to fetch assessment results" });
    }
  });

  app.get('/api/users/me/assessments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const results = await storage.getUserAssessmentResults(userId);
      res.json(results);
    } catch (error) {
      console.error("Error fetching user assessment results:", error);
      res.status(500).json({ message: "Failed to fetch user assessment results" });
    }
  });
  */

  // Admin Routes
  app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/posts', isAdmin, async (req, res) => {
    try {
      const posts = await storage.getAllPosts();
      res.json(posts);
    } catch (error) {
      console.error("Error fetching all posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.delete('/api/admin/posts/:postId', isAdmin, async (req, res) => {
    try {
      await storage.deletePost(req.params.postId, req.user?.id!);
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  app.patch('/api/admin/users/:userId/role', isAdmin, async (req, res) => {
    try {
      const { role } = req.body;
      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      await storage.updateUserRole(req.params.userId, role);
      res.json({ message: "User role updated successfully" });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
