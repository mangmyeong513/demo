import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PostWithAuthor } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PostDetailModalProps {
  post: PostWithAuthor | null;
  isOpen: boolean;
  onClose: () => void;
  onUserClick?: (userId: string) => void;
}

export default function PostDetailModal({ post, isOpen, onClose, onUserClick }: PostDetailModalProps) {
  const [commentText, setCommentText] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  
  // 모든 훅을 먼저 호출 - 조건부 렌더링 전에
  const { data: comments = [] } = useQuery({
    queryKey: ["/api/posts", post?.id, "comments"],
    enabled: isOpen && !!post?.id,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!post?.id) throw new Error("Post ID is required");
      return await apiRequest("POST", `/api/posts/${post.id}/like`);
    },
    onMutate: async () => {
      if (!post?.id) return;
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/posts"] });
      
      // Snapshot the previous value
      const previousPosts = queryClient.getQueryData(["/api/posts"]);
      
      // Optimistically update to the new value
      queryClient.setQueryData(["/api/posts"], (old: any) => {
        if (!old) return old;
        return old.map((p: any) => 
          p.id === post.id 
            ? { 
                ...p, 
                isLiked: !p.isLiked, 
                likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1 
              }
            : p
        );
      });
      
      // Return a context object with the snapshotted value
      return { previousPosts };
    },
    onError: (error, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousPosts) {
        queryClient.setQueryData(["/api/posts"], context.previousPosts);
      }
      
      // Handle specific errors
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "오류",
        description: "좋아요 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (!post?.id) throw new Error("Post ID is required");
      return await apiRequest("POST", `/api/posts/${post.id}/bookmark`);
    },
    onMutate: async () => {
      if (!post?.id) return;
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/posts"] });
      
      // Snapshot the previous value
      const previousPosts = queryClient.getQueryData(["/api/posts"]);
      
      // Optimistically update to the new value
      queryClient.setQueryData(["/api/posts"], (old: any) => {
        if (!old) return old;
        return old.map((p: any) => 
          p.id === post.id 
            ? { ...p, isBookmarked: !p.isBookmarked }
            : p
        );
      });
      
      // Return a context object with the snapshotted value
      return { previousPosts };
    },
    onError: (error, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousPosts) {
        queryClient.setQueryData(["/api/posts"], context.previousPosts);
      }
      
      // Handle specific errors
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "오류",
        description: "북마크 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!post?.id) throw new Error("Post ID is required");
      return await apiRequest("POST", `/api/posts/${post.id}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", post?.id, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setCommentText("");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "오류",
        description: "댓글 작성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!post?.id) throw new Error("Post ID is required");
      return await apiRequest("DELETE", `/api/posts/${post.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "성공",
        description: "게시글이 삭제되었습니다.",
      });
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "오류",
        description: "게시글 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 조건부 렌더링은 모든 훅 호출 후에
  if (!post) return null;
  
  const isOwner = currentUser?.id === post.authorId;

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return '방금 전';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}분 전`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}시간 전`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}일 전`;
    } else {
      return postDate.toLocaleDateString('ko-KR');
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    commentMutation.mutate(commentText);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-modal max-w-5xl max-h-[95vh] overflow-hidden flex flex-col p-0 animate-in fade-in-0 zoom-in-95 duration-300">
        <DialogHeader className="sr-only">
          <DialogTitle>게시글 자세히 보기</DialogTitle>
          <DialogDescription>
            게시글의 전체 내용과 댓글을 볼 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <article className="p-6 sm:p-8 fade-in bounce-in" data-testid={`post-detail-${post.id}`}>
            {/* Post Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-white/20 hover:ring-white/40 transition-all duration-300 hover:scale-110 cursor-pointer interactive-card">
                  {post.author.profileImageUrl ? (
                    <img 
                      src={post.author.profileImageUrl} 
                      alt={post.author.firstName || 'User'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div 
                    className="text-xl font-semibold text-heading cursor-pointer hover:text-primary transition-all duration-300 hover:scale-105 interactive-button" 
                    data-testid={`text-author-${post.id}`}
                    onClick={() => onUserClick?.(post.author.id)}
                  >
                    {post.author.firstName || post.author.email || '익명 사용자'}
                  </div>
                  <div className="text-gray-500 flex items-center gap-3">
                    <span data-testid={`text-time-${post.id}`}>{formatTimeAgo(post.createdAt!)}</span>
                    {post.sentimentScore && (
                      <>
                        <span>•</span>
                        <span className="text-purple-600 font-medium">옴표</span>
                      </>
                    )}
                    {post.tags && post.tags.length > 0 && (
                      <>
                        <span>•</span>
                        <div className="flex gap-2 flex-wrap">
                          {post.tags.map((tag: string, index: number) => (
                            <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full font-medium" data-testid={`tag-${tag}-${post.id}`}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-3 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" data-testid={`button-menu-${post.id}`}>
                      <i className="bi bi-three-dots text-lg"></i>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <button className="w-full text-left flex items-center gap-2" data-testid={`button-edit-${post.id}`}>
                        <i className="bi bi-pencil text-sm"></i>
                        수정
                      </button>
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem 
                          onSelect={(e) => e.preventDefault()}
                          className="text-destructive focus:text-destructive"
                        >
                          <button className="w-full text-left flex items-center gap-2" data-testid={`button-delete-${post.id}`}>
                            <i className="bi bi-trash text-sm"></i>
                            삭제
                          </button>
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>게시글을 삭제하시겠습니까?</AlertDialogTitle>
                          <AlertDialogDescription>
                            이 작업은 되돌릴 수 없습니다. 게시글과 모든 댓글이 영구적으로 삭제됩니다.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>취소</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate()}
                            disabled={deleteMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {deleteMutation.isPending ? "삭제 중..." : "삭제"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Post Content */}
            <div className="mb-8 glass-card p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
              <p className="text-lg text-body leading-relaxed whitespace-pre-wrap font-medium" data-testid={`text-content-${post.id}`}>
                {post.content}
              </p>
              
              {/* Post Images */}
              {(post.imageUrls && post.imageUrls.length > 0) ? (
                <div 
                  className={`grid gap-4 mt-6 ${
                    post.imageUrls.length === 1 ? 'grid-cols-1' :
                    post.imageUrls.length === 2 ? 'grid-cols-2' :
                    'grid-cols-2 md:grid-cols-3'
                  }`}
                  data-testid={`attachments-${post.id}`}
                >
                  {post.imageUrls.map((imageUrl: string, index: number) => (
                    <div key={index} className="relative group">
                      <img 
                        src={imageUrl} 
                        alt={`Attachment ${index + 1}`}
                        className="w-full aspect-square object-cover rounded-xl border border-gray-200 shadow-sm transition-all duration-200 hover:scale-105 cursor-zoom-in"
                        data-testid={`img-attachment-${post.id}-${index}`}
                        onClick={() => window.open(imageUrl, '_blank')}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 transform scale-75 group-hover:scale-100 transition-transform duration-200">
                          <i className="bi bi-zoom-in text-gray-700"></i>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : post.imageUrl && (
                <div className="relative group mt-6">
                  <img 
                    src={post.imageUrl} 
                    alt="Post image" 
                    className="w-full rounded-xl max-h-96 object-cover border border-gray-200 shadow-sm transition-all duration-200 hover:scale-105 cursor-zoom-in"
                    data-testid={`img-post-${post.id}`}
                    onClick={() => window.open(post.imageUrl, '_blank')}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 transform scale-75 group-hover:scale-100 transition-transform duration-200">
                      <i className="bi bi-zoom-in text-gray-700 text-lg"></i>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-white/20 mb-8 bg-white/3 p-4 rounded-2xl">
              <div className="flex items-center gap-4">
                <button 
                  className={`interactive-button ripple flex items-center gap-3 px-6 py-4 rounded-2xl text-base font-medium shadow-lg backdrop-blur-sm transition-all duration-200 transform hover:scale-105 ${
                    post.isLiked 
                      ? 'text-red-600 bg-red-50/80 hover:bg-red-100/80 pulse-glow border border-red-200' 
                      : 'text-muted hover:text-red-600 bg-white/10 hover:bg-white/20 border border-white/20'
                  } ${likeMutation.isPending ? 'animate-pulse cursor-not-allowed' : 'hover:shadow-xl active:scale-95'}`}
                  onClick={() => likeMutation.mutate()}
                  disabled={likeMutation.isPending}
                  data-testid={`button-like-${post.id}`}
                >
                  <i className={`bi ${post.isLiked ? 'bi-heart-fill animate-bounce' : 'bi-heart'} text-xl transition-all duration-200`}></i>
                  <span className="font-semibold" data-testid={`text-likes-${post.id}`}>{post.likesCount}</span>
                </button>

                <div className="flex items-center gap-3 px-6 py-4 text-muted bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm">
                  <i className="bi bi-chat text-xl"></i>
                  <span className="font-semibold" data-testid={`text-comments-${post.id}`}>{post.commentsCount}</span>
                </div>
              </div>
              
              <button 
                className={`interactive-button ripple p-4 rounded-2xl shadow-lg backdrop-blur-sm transition-all duration-200 transform hover:scale-105 ${
                  post.isBookmarked 
                    ? 'text-primary bg-primary/10 hover:bg-primary/20 pulse-glow border border-primary/30' 
                    : 'text-muted hover:text-primary bg-white/10 hover:bg-white/20 border border-white/20'
                } ${bookmarkMutation.isPending ? 'animate-pulse cursor-not-allowed' : 'hover:shadow-xl active:scale-95'}`}
                onClick={() => bookmarkMutation.mutate()}
                disabled={bookmarkMutation.isPending}
                data-testid={`button-bookmark-${post.id}`}
              >
                <i className={`bi ${post.isBookmarked ? 'bi-bookmark-fill animate-pulse' : 'bi-bookmark'} text-xl transition-all duration-200`}></i>
              </button>
            </div>

            {/* Comments Section */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900">댓글 {Array.isArray(comments) ? comments.length : 0}개</h3>
              
              {/* Comments List */}
              <div className="space-y-4">
                {Array.isArray(comments) && comments.length > 0 ? (
                  (comments as any[]).map((comment: any) => (
                    <div key={comment.id} className="flex gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                        {comment.author?.profileImageUrl ? (
                          <img 
                            src={comment.author.profileImageUrl} 
                            alt={comment.author.firstName || 'User'} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-muted to-butter"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-gray-900">
                            {comment.author?.firstName || comment.author?.email || '익명 사용자'}
                          </span>
                          <span className="text-sm text-gray-500">{formatTimeAgo(comment.createdAt)}</span>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <i className="bi bi-chat text-4xl text-gray-300 mb-3 block"></i>
                    <p className="text-gray-500">첫 번째 댓글을 남겨보세요!</p>
                  </div>
                )}
              </div>

              {/* Add Comment */}
              <form onSubmit={handleCommentSubmit} className="flex gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="댓글을 입력하세요..."
                  className="glass-input flex-1 text-base py-4 bg-white/10 border-white/20"
                  disabled={commentMutation.isPending}
                  data-testid={`input-comment-${post.id}`}
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || commentMutation.isPending}
                  className="btn-mango interactive-button ripple px-8 py-4 text-lg shadow-lg pulse-glow"
                  data-testid={`button-submit-comment-${post.id}`}
                >
                  {commentMutation.isPending ? (
                    <i className="bi bi-arrow-clockwise animate-spin text-xl"></i>
                  ) : (
                    <i className="bi bi-send text-xl"></i>
                  )}
                </button>
              </form>
            </div>
          </article>
        </div>
      </DialogContent>
    </Dialog>
  );
}