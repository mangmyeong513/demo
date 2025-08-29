import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import PostCard from "@/components/PostCard";
import type { User, PostWithAuthor } from "@shared/schema";

interface UserWithStats extends User {
  postsCount: number;
  followersCount: number;
  followingCount: number;
  friendsCount: number;
}

interface ProfileViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  onUserClick: (userId: string) => void;
  onEditProfile?: () => void;
}

export default function ProfileViewModal({ isOpen, onClose, userId, onUserClick, onEditProfile }: ProfileViewModalProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'posts' | 'bookmarks' | 'liked' | 'followers' | 'following'>('posts');
  const [postFilter, setPostFilter] = useState<'all' | 'quotes' | 'original'>('all');

  // Calculate isOwnProfile early to use in queries
  const isOwnProfile = currentUser?.id === userId;

  const { data: user, isLoading: userLoading } = useQuery<UserWithStats>({
    queryKey: ["/api/users", userId],
    retry: false,
    enabled: !!userId && isOpen,
  });

  const { data: followStatus } = useQuery<{ isFollowing: boolean }>({
    queryKey: ["/api/users", userId, "follow"],
    retry: false,
    enabled: !!userId && !!currentUser && userId !== currentUser.id && isOpen,
  });

  const { data: followers = [] } = useQuery<User[]>({
    queryKey: ["/api/users", userId, "followers"],
    retry: false,
    enabled: !!userId && activeTab === 'followers' && isOpen,
  });

  const { data: following = [] } = useQuery<User[]>({
    queryKey: ["/api/users", userId, "following"],
    retry: false,
    enabled: !!userId && activeTab === 'following' && isOpen,
  });

  const { data: userPosts = [], isLoading: postsLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/users", userId, "posts"],
    retry: false,
    enabled: !!userId && activeTab === 'posts' && isOpen,
  });

  const { data: likedPosts = [], isLoading: likedLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/users", userId, "liked"],
    retry: false,
    enabled: !!userId && activeTab === 'liked' && isOpen && isOwnProfile,
  });

  const { data: bookmarkedPosts = [], isLoading: bookmarksLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/bookmarks"],
    retry: false,
    enabled: !!userId && activeTab === 'bookmarks' && isOpen && isOwnProfile,
  });

  const followMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      return await apiRequest("POST", `/api/users/${targetUserId}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "follow"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId] });
      toast({
        title: "성공",
        description: "팔로우 상태가 변경되었습니다.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "인증 오류",
          description: "로그인이 필요합니다.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "오류",
        description: "팔로우 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  if (!userId || !isOpen) return null;

  if (userLoading || !user) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>사용자 프로필 로딩 중</DialogTitle>
            <DialogDescription>
              사용자의 프로필 정보를 가져오고 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-muted-foreground">로딩 중...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const canFollow = currentUser && !isOwnProfile;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-modal max-w-4xl max-h-[75vh] sm:max-h-[90vh] overflow-y-auto border-2 border-white/20 p-3 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-heading bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-base sm:text-xl transform rotate-12">
              👤
            </div>
            멤버 프로필
          </DialogTitle>
          <DialogDescription className="sr-only">
            사용자의 프로필 정보와 활동 내역을 확인할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <div className="glass-card p-8">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#f4e4bc] to-[#e8d5a3] flex items-center justify-center text-2xl font-bold text-[#8b4513]">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <h1 className="text-2xl font-bold">{user.username}</h1>
                  <div className="flex gap-2">
                    {canFollow && (
                      <Button
                        onClick={() => followMutation.mutate(userId!)}
                        disabled={followMutation.isPending}
                        variant={followStatus?.isFollowing ? "outline" : "default"}
                        size="sm"
                      >
                        {followMutation.isPending ? "처리 중..." : 
                         followStatus?.isFollowing ? "언팔로우" : "팔로우"}
                      </Button>
                    )}
                    {isOwnProfile && onEditProfile && (
                      <Button
                        onClick={onEditProfile}
                        variant="outline"
                        size="sm"
                        data-testid="button-edit-profile"
                      >
                        <i className="bi bi-pencil me-2"></i>프로필 편집
                      </Button>
                    )}
                  </div>
                </div>
                
                {user.bio && (
                  <p className="text-muted-foreground">{user.bio}</p>
                )}
                
                <div className="flex gap-4 text-sm">
                  {user.location && (
                    <span className="text-muted-foreground">📍 {user.location}</span>
                  )}
                  {user.website && (
                    <a 
                      href={user.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      🔗 웹사이트
                    </a>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-6 text-center mt-4">
              <div>
                <div className="font-bold text-lg">{user.postsCount}</div>
                <div className="text-sm text-muted-foreground">작품</div>
              </div>
              <div>
                <div className="font-bold text-lg">{user.followersCount}</div>
                <div className="text-sm text-muted-foreground">창작 원력</div>
              </div>
              <div>
                <div className="font-bold text-lg">{user.followingCount}</div>
                <div className="text-sm text-muted-foreground">팔로잉</div>
              </div>
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
            <TabsList className={`grid w-full ${isOwnProfile ? 'grid-cols-5' : 'grid-cols-3'}`}>
              <TabsTrigger value="posts">
                게시물 ({user.postsCount})
              </TabsTrigger>
              {isOwnProfile && (
                <>
                  <TabsTrigger value="bookmarks">
                    북마크
                  </TabsTrigger>
                  <TabsTrigger value="liked">
                    좋아요
                  </TabsTrigger>
                </>
              )}
              <TabsTrigger value="followers">
                팔로워 ({user.followersCount})
              </TabsTrigger>
              <TabsTrigger value="following">
                팔로잉 ({user.followingCount})
              </TabsTrigger>
            </TabsList>

            {/* Posts Tab */}
            <TabsContent value="posts" className="space-y-4">
              {postsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="border rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-muted rounded-full skeleton"></div>
                        <div className="space-y-2">
                          <div className="w-24 h-4 bg-muted skeleton"></div>
                          <div className="w-16 h-3 bg-muted skeleton"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="w-full h-4 bg-muted skeleton"></div>
                        <div className="w-3/4 h-4 bg-muted skeleton"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : userPosts.length > 0 ? (
                <div className="space-y-4">
                  {userPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="bi bi-postcard text-4xl text-muted mb-4"></i>
                  <p className="text-muted-foreground">
                    {isOwnProfile ? "아직 작성한 게시글이 없습니다." : "이 사용자가 작성한 게시글이 없습니다."}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Bookmarks Tab */}
            {isOwnProfile && (
              <TabsContent value="bookmarks" className="space-y-4">
                {bookmarksLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="border rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-muted rounded-full skeleton"></div>
                          <div className="space-y-2">
                            <div className="w-24 h-4 bg-muted skeleton"></div>
                            <div className="w-16 h-3 bg-muted skeleton"></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="w-full h-4 bg-muted skeleton"></div>
                          <div className="w-3/4 h-4 bg-muted skeleton"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : bookmarkedPosts.length > 0 ? (
                  <div className="space-y-4">
                    {bookmarkedPosts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="bi bi-bookmark text-4xl text-muted mb-4"></i>
                    <p className="text-muted-foreground">
                      아직 북마크한 게시글이 없습니다.
                    </p>
                  </div>
                )}
              </TabsContent>
            )}

            {/* Liked Posts Tab */}
            {isOwnProfile && (
              <TabsContent value="liked" className="space-y-4">
                {likedLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="border rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-muted rounded-full skeleton"></div>
                          <div className="space-y-2">
                            <div className="w-24 h-4 bg-muted skeleton"></div>
                            <div className="w-16 h-3 bg-muted skeleton"></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="w-full h-4 bg-muted skeleton"></div>
                          <div className="w-3/4 h-4 bg-muted skeleton"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : likedPosts.length > 0 ? (
                  <div className="space-y-4">
                    {likedPosts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="bi bi-heart text-4xl text-muted mb-4"></i>
                    <p className="text-muted-foreground">
                      아직 좋아요한 게시글이 없습니다.
                    </p>
                  </div>
                )}
              </TabsContent>
            )}

            {/* Followers Tab */}
            <TabsContent value="followers">
              <div className="space-y-3">
                {followers.map((person) => (
                  <div key={person.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div 
                      className="flex items-center gap-3 hover:bg-muted/50 rounded-lg p-2 -m-2 cursor-pointer"
                      onClick={() => onUserClick(person.id)}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f4e4bc] to-[#e8d5a3] flex items-center justify-center font-bold text-[#8b4513]">
                        {person.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{person.username}</div>
                        {person.bio && (
                          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {person.bio}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {currentUser && person.id !== currentUser.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => followMutation.mutate(person.id)}
                        disabled={followMutation.isPending}
                      >
                        팔로우
                      </Button>
                    )}
                  </div>
                ))}
                
                {followers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {isOwnProfile ? "아직 팔로워가 없습니다." : "이 사용자의 팔로워가 없습니다."}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Following Tab */}
            <TabsContent value="following">
              <div className="space-y-3">
                {following.map((person) => (
                  <div key={person.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div 
                      className="flex items-center gap-3 hover:bg-muted/50 rounded-lg p-2 -m-2 cursor-pointer"
                      onClick={() => onUserClick(person.id)}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f4e4bc] to-[#e8d5a3] flex items-center justify-center font-bold text-[#8b4513]">
                        {person.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{person.username}</div>
                        {person.bio && (
                          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {person.bio}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {currentUser && person.id !== currentUser.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => followMutation.mutate(person.id)}
                        disabled={followMutation.isPending}
                      >
                        팔로우
                      </Button>
                    )}
                  </div>
                ))}
                
                {following.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {isOwnProfile ? "아직 팔로잉하는 사용자가 없습니다." : "이 사용자가 팔로잉하는 사용자가 없습니다."}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}