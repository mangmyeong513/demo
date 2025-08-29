import React, { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PostWithAuthor } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { SentimentIndicator } from "./SentimentIndicator";
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

// 옴표 카드 하단에 붙는 '포스트잇' 스타일 스트립
function StickyStrip({ color = 'violet' }: { color?: 'violet'|'indigo'|'pink'|'amber'|'emerald'|'sky' }) {
  const map: Record<string, string> = {
    violet: 'bg-violet-300/70 border-violet-400/60',
    indigo: 'bg-indigo-300/70 border-indigo-400/60',
    pink: 'bg-pink-300/70 border-pink-400/60',
    amber: 'bg-amber-300/70 border-amber-400/60',
    emerald: 'bg-emerald-300/70 border-emerald-400/60',
    sky: 'bg-sky-300/70 border-sky-400/60',
  }
  const cls = map[color] ?? map.violet
  return (
    <div className="relative">
      <div className={["mx-3 -mt-1 h-3 rounded-b-2xl border shadow-[inset_0_-2px_6px_rgba(0,0,0,.15)]", cls].join(' ')} />
      {/* 양쪽 테이프 느낌 */}
      <div className="pointer-events-none absolute -top-1 left-2 h-2 w-8 -rotate-3 bg-white/50 shadow-sm mix-blend-overlay" />
      <div className="pointer-events-none absolute -top-1 right-2 h-2 w-8 rotate-3 bg-white/50 shadow-sm mix-blend-overlay" />
    </div>
  )
}

interface PostCardProps {
  post: PostWithAuthor;
  onUserClick?: (userId: string) => void;
  onPostClick?: (post: PostWithAuthor) => void;
  onQuotePost?: (post: PostWithAuthor) => void;
  quoteStripColor?: 'violet'|'indigo'|'pink'|'amber'|'emerald'|'sky';
}

const PostCard = React.memo(function PostCard({ post, onUserClick, onPostClick, onQuotePost, quoteStripColor = 'violet' }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  
  const isOwner = currentUser?.id === post.authorId;

  const likeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/posts/${post.id}/like`);
    },
    onMutate: async () => {
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
    onSuccess: () => {
      // Invalidate and refetch to ensure server state is correct
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/posts/${post.id}/bookmark`);
    },
    onMutate: async () => {
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
    onSuccess: () => {
      // Invalidate and refetch to ensure server state is correct
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/posts/${post.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "게시글 삭제 완료",
        description: "게시글이 성공적으로 삭제되었습니다.",
      });
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

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", `/api/posts/${post.id}/comments`, { content });
    },
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "댓글 작성 완료",
        description: "댓글이 성공적으로 작성되었습니다.",
      });
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

  // 공유하기 기능
  const handleShare = (post: PostWithAuthor) => {
    if (navigator.share) {
      navigator.share({
        title: `${post.author.firstName}님의 게시글`,
        text: post.content.slice(0, 100) + (post.content.length > 100 ? '...' : ''),
        url: window.location.origin
      }).catch(() => {
        // 공유 실패 시 클립보드 복사로 대체
        navigator.clipboard.writeText(`${post.content}\n\n${window.location.origin}`);
        toast({
          title: "링크 복사됨",
          description: "게시글이 클립보드에 복사되었습니다!",
        });
      });
    } else {
      navigator.clipboard.writeText(`${post.content}\n\n${window.location.origin}`);
      toast({
        title: "링크 복사됨",
        description: "게시글이 클립보드에 복사되었습니다!",
      });
    }
  };

  // 신고하기 기능
  const handleReport = (post: PostWithAuthor) => {
    toast({
      title: "신고 접수됨",
      description: "신고가 접수되었습니다. 검토 후 조치하겠습니다.",
    });
  };

  // 빠른 옴표 기능
  const handleQuickQuote = useCallback(async (quickMessage: string) => {
    try {
      const postData = {
        content: quickMessage,
        tags: [] as string[],
        quotedPostId: post.id
      };
      
      const result = await apiRequest("POST", "/api/posts", postData);
      
      toast({
        title: "옴표 게시글 작성 완료",
        description: "빠른 옴표이 성공적으로 게시되었습니다.",
      });
      
      // Refresh posts to show the new quote
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    } catch (error: any) {
      toast({
        title: "옴표 실패",
        description: "옴표 게시글 작성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  }, [post.id, queryClient, toast]);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    commentMutation.mutate(commentText);
  };

  const handlePostClick = useCallback((e: React.MouseEvent) => {
    // 버튼, 링크, 입력 요소를 클릭한 경우 게시글 확대 방지
    const target = e.target as HTMLElement;
    const isInteractiveElement = target.closest('button, a, input, textarea, select, [data-radix-dropdown-menu-trigger]');
    
    if (!isInteractiveElement && onPostClick) {
      onPostClick(post);
    }
  }, [onPostClick, post]);

  return (
    <article 
      className="post-card-enhanced asymmetric-section modern-card paint-splash-trigger canvas-texture p-6 mb-6 cursor-pointer feedback-click" 
      data-testid={`post-${post.id}`}
      onClick={handlePostClick}
    >
      {/* Post Header */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-paint-saddle-brown/20 transform -rotate-2 hover:rotate-0 transition-all duration-300">
          {post.author.profileImageUrl ? (
            <img 
              src={post.author.profileImageUrl} 
              alt={post.author.firstName || 'User'} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-paint-chocolate to-paint-sandy-brown"></div>
          )}
        </div>
        <div className="flex-1">
          <div 
            className="font-bold text-primary cursor-pointer hover:text-accent transition-all duration-300 enhanced-heading paint-drip" 
            data-testid={`text-author-${post.id}`}
            onClick={() => onUserClick?.(post.author.id)}
          >
            {post.author.firstName || post.author.email || '익명 사용자'}
          </div>
          <div className="text-sm text-gray-500 flex items-center gap-3">
            <span data-testid={`text-time-${post.id}`}>{formatTimeAgo(post.createdAt!)}</span>
            {post.tags && post.tags.length > 0 && (
              <>
                <span>•</span>
                <div className="flex gap-2">
                  {post.tags.slice(0, 2).map((tag: string, index: number) => (
                    <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium" data-testid={`tag-${tag}-${post.id}`}>
                      #{tag}
                    </span>
                  ))}
                  {post.tags.length > 2 && (
                    <span className="text-xs text-gray-400">+{post.tags.length - 2}</span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" data-testid={`button-menu-${post.id}`}>
                <i className="bi bi-three-dots"></i>
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
      <div className="mb-6">
        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-base" data-testid={`text-content-${post.id}`}>
          {post.content}
        </p>
        
        {/* Image Attachments */}
        {(post.imageUrls && post.imageUrls.length > 0) ? (
          <div 
            className={`grid gap-3 mt-4 ${
              post.imageUrls!.length === 1 ? 'grid-cols-1' :
              post.imageUrls!.length === 2 ? 'grid-cols-2' :
              'grid-cols-3'
            }`}
            data-testid={`attachments-${post.id}`}
          >
            {post.imageUrls!.map((imageUrl: string, index: number) => (
              <img 
                key={index}
                src={imageUrl} 
                alt={`Attachment ${index + 1}`}
                className="w-full aspect-square object-cover rounded-xl border border-gray-200 shadow-sm"
                data-testid={`img-attachment-${post.id}-${index}`}
              />
            ))}
          </div>
        ) : post.imageUrl && (
          <img 
            src={post.imageUrl} 
            alt="Post image" 
            className="w-full rounded-xl max-h-96 object-cover border border-gray-200 shadow-sm mt-4"
            data-testid={`img-post-${post.id}`}
          />
        )}
      </div>

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4">
          <button 
            className={`interactive-button ripple flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 border ${
              post.isLiked 
                ? 'text-red-600 bg-red-50 hover:bg-red-100 border-red-200 shadow-sm pulse-glow' 
                : 'text-gray-600 hover:text-red-600 hover:bg-red-50 border-gray-200 hover:border-red-200'
            } ${likeMutation.isPending ? 'animate-pulse cursor-not-allowed' : 'hover:shadow-lg active:scale-95'}`}
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending}
            data-testid={`button-like-${post.id}`}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <i className={`bi ${post.isLiked ? 'bi-heart-fill animate-bounce' : 'bi-heart'} text-lg transition-all duration-200`}></i>
            <span data-testid={`text-likes-${post.id}`} className="font-semibold">{post.likesCount}</span>
            {likeMutation.isPending && <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>}
          </button>
          
          <button 
            className="interactive-button ripple flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 border border-gray-200 text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 hover:shadow-lg active:scale-95"
            onClick={() => setShowComments(!showComments)}
            data-testid={`button-comments-${post.id}`}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <i className="bi bi-chat text-lg"></i>
            <span data-testid={`text-comments-${post.id}`} className="font-semibold">{post.commentsCount}</span>
          </button>
          
          <button 
            className={`interactive-button ripple flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 border ${
              post.isBookmarked 
                ? 'text-purple-600 bg-purple-50 hover:bg-purple-100 border-purple-200 shadow-sm pulse-glow' 
                : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50 border-gray-200 hover:border-purple-200'
            } ${bookmarkMutation.isPending ? 'animate-pulse cursor-not-allowed' : 'hover:shadow-lg active:scale-95'}`}
            onClick={() => bookmarkMutation.mutate()}
            disabled={bookmarkMutation.isPending}
            data-testid={`button-bookmark-${post.id}`}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <i className={`bi ${post.isBookmarked ? 'bi-bookmark-fill animate-pulse' : 'bi-bookmark'} text-lg transition-all duration-200`}></i>
            <span className="sr-only">북마크</span>
            {bookmarkMutation.isPending && <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>}
          </button>
          
          <button 
            className="interactive-button ripple flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-110 border bg-gradient-to-r from-violet-50 to-purple-50 text-violet-700 hover:from-violet-100 hover:to-purple-100 border-violet-200 hover:border-violet-300 hover:shadow-lg active:scale-95"
            onClick={() => onQuotePost?.(post)}
            data-testid={`button-quote-${post.id}`}
            title="옴표하기"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <i className="bi bi-chat-quote text-lg"></i>
            <span className="font-semibold">옴표</span>
            <div className="w-1 h-1 bg-violet-400 rounded-full animate-pulse"></div>
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all" 
            data-testid={`button-share-${post.id}`}
            onClick={() => handleShare(post)}
            title="공유하기"
          >
            <i className="bi bi-share"></i>
          </button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all"
                data-testid={`button-more-${post.id}`}
              >
                <i className="bi bi-three-dots"></i>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => handleReport(post)}
                className="text-red-600 hover:text-red-700"
              >
                <i className="bi bi-flag mr-2"></i>
                신고하기
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare(post)}>
                <i className="bi bi-share mr-2"></i>
                공유하기
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(window.location.origin)}>
                <i className="bi bi-link mr-2"></i>
                링크 복사
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quoted Post Section - 향상된 옴표 스타일 */}
      {post.quotedPost && (
        <div className="mt-6 relative">
          {/* 옴표 카드 - 미리보기와 동일한 디자인 */}
          <div className="quote-visual-enhancement relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-purple-50/50 to-indigo-50/50 border border-purple-200/60 shadow-lg backdrop-blur-sm">
            <div className="relative p-5">
              {/* 장식적 옴표 배경 */}
              <div className="absolute top-3 right-3 text-5xl text-purple-300/40 font-serif leading-none pointer-events-none">
                ❝
              </div>
              <div className="absolute bottom-3 left-3 text-5xl text-purple-300/40 font-serif leading-none pointer-events-none transform rotate-180">
                ❞
              </div>
              
              {/* 옴표 헤더 */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-sm">
                  <i className="bi bi-chat-quote text-white text-sm"></i>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-purple-800 text-sm">
                      {post.quotedPost.author.firstName || '익명 사용자'}
                    </span>
                    <span className="text-xs text-purple-600/70">
                      {formatTimeAgo(post.quotedPost.createdAt!)}
                    </span>
                  </div>
                  <div className="text-xs text-purple-600/60 flex items-center gap-1">
                    <i className="bi bi-arrow-return-right text-xs"></i>
                    <span>원본 게시글</span>
                  </div>
                </div>
              </div>
              
              {/* 옴표된 게시글 내용 */}
              <div className="relative z-10 bg-white/80 rounded-xl p-4 border border-purple-100 shadow-sm">
                <p className="text-gray-800 text-sm leading-relaxed font-medium">
                  {post.quotedPost.content}
                </p>
                {post.quotedPost.imageUrl && (
                  <div className="mt-3">
                    <img 
                      src={post.quotedPost.imageUrl} 
                      alt="인용된 게시글 이미지" 
                      className="w-full rounded-lg max-h-40 object-cover border border-purple-100 shadow-sm"
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* 하단 장식 스트립 */}
            <div className="h-1 bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-400"></div>
          </div>
          
          {/* 연결 표시 */}
          <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-6 h-px bg-purple-400 shadow-sm"></div>
          <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full bg-purple-400 shadow-sm"></div>
        </div>
      )}

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-stroke" data-testid={`comments-section-${post.id}`}>
          <CommentsSection postId={post.id} />
        </div>
      )}
    </article>
  );
});

// Comments Section Component
const CommentsSection = React.memo(function CommentsSection({ postId }: { postId: string }) {
  const [commentText, setCommentText] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: comments = [] } = useQuery<any[]>({
    queryKey: ["/api/posts", postId, "comments"],
    retry: false,
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", `/api/posts/${postId}/comments`, { content });
    },
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "댓글 작성 완료",
        description: "댓글이 성공적으로 작성되었습니다.",
      });
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

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    commentMutation.mutate(commentText);
  };

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

  return (
    <div className="space-y-4">
      {/* Comments List */}
      <div className="space-y-3">
        {comments.length > 0 ? (
          comments.map((comment: any) => (
            <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-card border border-stroke">
              <div className="avatar" style={{ width: '32px', height: '32px' }}>
                {comment.author?.profileImageUrl ? (
                  <img 
                    src={comment.author.profileImageUrl} 
                    alt={comment.author.firstName || 'User'} 
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-muted to-butter rounded-full"></div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">
                    {comment.author?.firstName || comment.author?.email || '익명 사용자'}
                  </span>
                  <span className="mini">{formatTimeAgo(comment.createdAt)}</span>
                </div>
                <p className="text-sm">{comment.content}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <i className="bi bi-chat text-2xl text-muted mb-2"></i>
            <p className="mini text-muted">첫 번째 댓글을 남겨보세요!</p>
          </div>
        )}
      </div>

      {/* Add Comment */}
      <form onSubmit={handleCommentSubmit} className="flex gap-2">
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="댓글을 입력하세요..."
          className="form-control flex-1"
          disabled={commentMutation.isPending}
          data-testid={`input-comment-${postId}`}
        />
        <button
          type="submit"
          disabled={!commentText.trim() || commentMutation.isPending}
          className="btn-mango"
          data-testid={`button-submit-comment-${postId}`}
        >
          {commentMutation.isPending ? (
            <i className="bi bi-arrow-clockwise animate-spin"></i>
          ) : (
            <i className="bi bi-send"></i>
          )}
        </button>
      </form>
    </div>
  );
});

export default PostCard;
