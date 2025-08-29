import { useState, useEffect } from "react";
import Navigation from "./Navigation";
import PostCard from "./PostCard";
import CreatePostModal from "./CreatePostModal";
import ProfileEditModal from "./ProfileEditModal";
import ExploreModal from "./ExploreModal";
import ProfileViewModal from "./ProfileViewModal";
import FriendsModal from "./FriendsModal";
import SettingsModal from "./SettingsModal";
import AnnouncementModal from "./AnnouncementModal";
import PostDetailModal from "./PostDetailModal";
import { DotPet } from "./DotPet";
import { useQuery } from "@tanstack/react-query";
import { PostWithAuthor } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMemo } from "react";

export default function Layout() {
  const [activeScreen, setActiveScreen] = useState("home");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [isExploreModalOpen, setIsExploreModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [isMobileAnnouncementVisible, setIsMobileAnnouncementVisible] = useState(true);
  const [isPostDetailModalOpen, setIsPostDetailModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<PostWithAuthor | null>(null);
  const [quotedPost, setQuotedPost] = useState<PostWithAuthor | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'following' | 'quotes'>('all');
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: allPosts = [], isLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/posts"],
    retry: false,
    meta: {
      onError: (error: Error) => {
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
      },
    },
  });

  const { data: followingPosts = [], isLoading: isLoadingFollowing } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/posts/following"],
    retry: false,
    enabled: activeFilter === 'following',
    meta: {
      onError: (error: Error) => {
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
      },
    },
  });

  // 실제 필터링된 포스트 계산
  const posts = useMemo(() => {
    switch (activeFilter) {
      case 'following':
        return followingPosts;
      case 'quotes':
        return allPosts.filter(post => post.quotedPostId);
      default:
        return allPosts;
    }
  }, [activeFilter, allPosts, followingPosts]);

  const isPostsLoading = activeFilter === 'following' ? isLoadingFollowing : isLoading;

  const { data: trendingTags } = useQuery<{ tag: string; count: number }[]>({
    queryKey: ["/api/trending/tags"],
    retry: false,
  });

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setIsProfileModalOpen(true);
    setIsFriendsModalOpen(false);
    setIsExploreModalOpen(false);
  };

  const handlePostClick = (post: PostWithAuthor) => {
    setSelectedPost(post);
    setIsPostDetailModalOpen(true);
  };

  const openExplore = () => {
    setIsExploreModalOpen(true);
    setActiveScreen("home");
  };

  const openFriends = () => {
    setIsFriendsModalOpen(true);
    setActiveScreen("home");
  };

  const openProfile = () => {
    if (user?.id) {
      handleUserClick(user.id);
    }
  };

  const openSettings = () => {
    setIsSettingsModalOpen(true);
  };

  const handleQuotePost = (post: PostWithAuthor) => {
    setQuotedPost(post);
    setIsCreateModalOpen(true);
  };

  // Initialize theme on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("ovra-settings");
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.theme) {
          document.documentElement.className = `theme-${settings.theme}`;
        }
      } catch (error) {
        console.error("테마 로드 오류:", error);
      }
    } else {
      document.documentElement.className = "theme-retro";
    }
  }, []);

  const screens = {
    home: (
      <div className="space-y-4">
        {/* Enhanced Filter Bar */}
        <div className="enhanced-filter-bar bg-gradient-to-r from-white/90 to-gray-50/90 backdrop-blur-lg border border-gray-200/50 rounded-2xl p-4 mb-6 shadow-lg">
          <div className="flex gap-3 items-center justify-center">
            <button 
              className={`filter-button enhanced-3d-button px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 ${
                activeFilter === 'all' 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg border-0 pulse-glow' 
                  : 'bg-white/70 hover:bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:shadow-md'
              }`}
              onClick={() => setActiveFilter('all')}
              data-testid="filter-all" 
              style={{ transformStyle: 'preserve-3d' }}
            >
              <span className="me-2 text-lg">🎨</span>전체
              <span className="ml-2 text-xs opacity-75">({allPosts.length})</span>
            </button>
            <button 
              className={`filter-button enhanced-3d-button px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 ${
                activeFilter === 'following' 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg border-0 pulse-glow' 
                  : 'bg-white/70 hover:bg-white text-gray-700 border border-gray-200 hover:border-green-300 hover:shadow-md'
              }`}
              onClick={() => setActiveFilter('following')}
              data-testid="filter-following" 
              style={{ transformStyle: 'preserve-3d' }}
            >
              <span className="me-2 text-lg">👥</span>팔로잉
              <span className="ml-2 text-xs opacity-75">({followingPosts.length})</span>
            </button>
            <button 
              className={`filter-button enhanced-3d-button px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 ${
                activeFilter === 'quotes' 
                  ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg border-0 pulse-glow' 
                  : 'bg-white/70 hover:bg-white text-gray-700 border border-gray-200 hover:border-purple-300 hover:shadow-md'
              }`}
              onClick={() => setActiveFilter('quotes')}
              data-testid="filter-quotes" 
              style={{ transformStyle: 'preserve-3d' }}
            >
              <span className="me-2 text-lg">💬</span>옴표
              <span className="ml-2 text-xs opacity-75">({allPosts.filter(p => p.quotedPostId).length})</span>
            </button>
          </div>
          
          {/* Active filter indicator */}
          <div className="mt-3 text-center">
            <span className="text-xs text-gray-500">
              {activeFilter === 'all' && '모든 게시글을 보고 있습니다'}
              {activeFilter === 'following' && '팔로우한 사용자의 게시글만 표시됩니다'}
              {activeFilter === 'quotes' && '옴표가 포함된 게시글만 표시됩니다'}
            </span>
          </div>
        </div>

        {/* Posts Feed */}
        {isPostsLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="soft-card p-6">
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
        ) : posts?.length ? (
          <div className="space-y-4" data-testid="posts-feed">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onUserClick={handleUserClick} onPostClick={handlePostClick} onQuotePost={handleQuotePost} />
            ))}
          </div>
        ) : (
          <div className="modern-card canvas-texture dot-pattern-accent hover-dots p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4 dot-pulse">
              <span className="text-3xl">🖼️</span>
            </div>
            <h3 className="text-heading text-gray-800 mb-2">첫 번째 글을 작성해보세요!</h3>
            <p className="text-body text-gray-600 mb-6">아직 게시글이 없어요. 여러분의 이야기로 Ovra를 더 풍성하게 만들어주세요.</p>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-modern"
              data-testid="button-create-first-post"
            >
              <span className="me-2 text-lg">🎨</span>
              첫 글 작성하기
            </button>
          </div>
        )}
      </div>
    ),
    
    explore: (
      <div className="space-y-4">
        {/* Search */}
        <div className="soft-card p-4">
          <div className="flex items-center gap-3">
            <i className="bi bi-search text-muted"></i>
            <input 
              type="text" 
              className="form-control flex-1 bg-transparent border-0 outline-none"
              placeholder="게시글, 사용자, 태그 검색..."
              data-testid="input-search"
            />
            <button className="btn-mango btn-sm" data-testid="button-search">검색</button>
          </div>
        </div>

        {/* Trending Tags */}
        <div className="soft-card p-4">
          <h3 className="text-title mb-3">트렌딩 태그</h3>
          <div className="flex flex-wrap gap-2">
            {trendingTags?.map((tag) => (
              <button key={tag.tag} className="pill" data-testid={`tag-${tag.tag}`}>
                #{tag.tag} <span className="mini">({tag.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="soft-card p-4">
          <h3 className="text-title mb-3">카테고리별 탐색</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: "bi-music-note-beamed", name: "음악", count: "1.2k" },
              { icon: "bi-camera-reels", name: "사진", count: "2.8k" },
              { icon: "bi-palette", name: "아트", count: "856" },
              { icon: "bi-chat-heart", name: "일상", count: "3.4k" },
            ].map((category) => (
              <button 
                key={category.name}
                className="soft-card p-4 text-center hover:border-mango transition-colors"
                data-testid={`category-${category.name}`}
              >
                <i className={`${category.icon} text-2xl text-mango mb-2`}></i>
                <div className="text-body-sm font-medium">{category.name}</div>
                <div className="text-caption">{category.count} 게시글</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    ),
    bookmarks: (
      <div className="space-y-4">
        <div className="soft-card p-4">
          <h3 className="font-semibold mb-3">내 북마크</h3>
          <div className="flex gap-2">
            <button className="pill active" data-testid="bookmark-filter-all">전체</button>
            <button className="pill" data-testid="bookmark-filter-photos">사진</button>
            <button className="pill" data-testid="bookmark-filter-music">음악</button>
            <button className="pill" data-testid="bookmark-filter-text">글</button>
          </div>
        </div>
        
        <div className="soft-card p-8 text-center" data-testid="empty-bookmarks">
          <i className="bi bi-bookmark text-4xl text-muted mb-4"></i>
          <p className="text-muted">아직 북마크한 게시글이 없어요.</p>
          <p className="mini">마음에 드는 게시글을 북마크해보세요!</p>
        </div>
      </div>
    ),
    profile: (
      <div className="space-y-4">
        {/* Profile Header */}
        <div className="soft-card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="avatar-lg">
              {user?.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt={user.firstName || 'User'} 
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-muted to-butter rounded-full"></div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold" data-testid="text-username">
                {user?.firstName || user?.email || '익명 사용자'}
              </h3>
              <p className="mini" data-testid="text-bio">
                {user?.bio || '레트로 감성을 사랑하는 추억 수집가 📸✨'}
              </p>
              <div className="flex gap-4 mt-2">
                <span className="mini"><strong>0</strong> 게시글</span>
                <span className="mini"><strong>0</strong> 팔로워</span>
                <span className="mini"><strong>0</strong> 팔로잉</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              className="btn-outline-mango flex-1" 
              onClick={() => setIsProfileEditOpen(true)}
              data-testid="button-edit-profile"
            >
              <i className="bi bi-pencil me-2"></i>프로필 편집
            </button>
            <button className="btn-outline-mango" data-testid="button-share-profile">
              <i className="bi bi-share"></i>
            </button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="soft-card p-8 text-center" data-testid="empty-profile-posts">
          <i className="bi bi-postcard text-4xl text-muted mb-4"></i>
          <p className="text-muted">첫 번째 게시글을 작성해보세요!</p>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-mango mt-4"
            data-testid="button-create-post-profile"
          >
            <i className="bi bi-pencil-square me-2"></i>글쓰기
          </button>
        </div>
      </div>
    ),
  };

  return (
    <div className="min-h-screen bg-cream">
      <Navigation 
        onCreatePost={() => setIsCreateModalOpen(true)} 
        onExploreClick={openExplore}
        onFriendsClick={openFriends}
        onProfileClick={openProfile}
        onSettingsClick={openSettings}
      />
      
      <main className="container mx-auto pt-20 pb-20 lg:pb-8 px-4">
        <div className="shell">
          {/* Left Sidebar - Desktop */}
          <aside className="left-rail hidden lg:block">
            <div className="space-y-4">
              {/* Quick Actions */}
              <div className="soft-card p-4">
                <h4 className="font-semibold mb-3">빠른 작업</h4>
                <div className="space-y-2">
                  <button 
                    className="btn-outline-mango w-full justify-start gap-2"
                    onClick={openExplore}
                    data-testid="sidebar-explore"
                  >
                    <i className="bi bi-search"></i>
                    탐색하기
                  </button>
                  <button 
                    className="btn-outline-mango w-full justify-start gap-2"
                    onClick={openSettings}
                    data-testid="sidebar-settings"
                  >
                    <i className="bi bi-gear"></i>
                    설정
                  </button>
                </div>
              </div>

              {/* Navigation */}
              <div className="soft-card p-4">
                <h4 className="font-semibold mb-3">메뉴</h4>
                <div className="space-y-1">
                  <button 
                    className={`nav-item w-full ${activeScreen === 'home' ? 'active' : ''}`}
                    onClick={() => setActiveScreen("home")}
                    data-testid="sidebar-home"
                  >
                    <i className="bi bi-house-fill"></i>
                    홈
                  </button>
                  <button 
                    className={`nav-item w-full ${activeScreen === 'bookmarks' ? 'active' : ''}`}
                    onClick={() => setActiveScreen("bookmarks")}
                    data-testid="sidebar-bookmarks"
                  >
                    <i className="bi bi-bookmark-fill"></i>
                    북마크
                  </button>
                  <button 
                    className={`nav-item w-full ${activeScreen === 'profile' ? 'active' : ''}`}
                    onClick={openProfile}
                    data-testid="sidebar-profile"
                  >
                    <i className="bi bi-person-fill"></i>
                    프로필
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <section className="min-w-0">
            {screens[activeScreen as keyof typeof screens]}
          </section>

          {/* Right Sidebar - Desktop */}
          <aside className="right-rail hidden lg:block">
            <div className="space-y-4">
              {/* Announcements */}
              <div className="soft-card p-4">
                <h4 className="text-title mb-3">📢 공지사항</h4>
                <div className="space-y-3">
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                    <div className="text-body-sm font-medium text-blue-800">새로운 글라스모피즘 테마 추가!</div>
                    <div className="text-caption text-blue-600 mt-1">2025.01.25</div>
                  </div>
                  <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded">
                    <div className="text-body-sm font-medium text-green-800">커뮤니티 가이드라인 업데이트</div>
                    <div className="text-caption text-green-600 mt-1">2025.01.20</div>
                  </div>
                  <div className="bg-purple-50 border-l-4 border-purple-400 p-3 rounded">
                    <div className="text-body-sm font-medium text-purple-800">도토 AI 어시스턴트 개선</div>
                    <div className="text-caption text-purple-600 mt-1">2025.01.15</div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAnnouncementModalOpen(true)}
                  className="mt-3 w-full text-body-sm text-blue-600 hover:text-blue-800 transition-colors" 
                  data-testid="button-view-all-announcements"
                >
                  모든 공지사항 보기
                </button>
              </div>

              {/* Suggested Users */}
              <div className="soft-card p-4">
                <h4 className="font-semibold mb-3">추천 사용자</h4>
                <div className="space-y-3">
                  {[
                    { name: "jessica_vintage", bio: "빈티지 패션 큐레이터" },
                    { name: "retrocat_music", bio: "음악 수집가" },
                    { name: "film_diary", bio: "필름 사진작가" },
                  ].map((user) => (
                    <div key={user.name} className="flex items-center gap-2">
                      <div className="avatar"></div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{user.name}</div>
                        <div className="mini truncate">{user.bio}</div>
                      </div>
                      <button className="btn-outline-mango text-xs px-2 py-1" data-testid={`button-follow-${user.name}`}>
                        팔로우
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile Announcement Banner */}
      {isMobileAnnouncementVisible && (
        <div className="lg:hidden fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 z-50 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className="bi bi-megaphone text-sm"></i>
              <span className="text-sm font-medium">새로운 옴표 기능과 향상된 UI를 확인해보세요!</span>
            </div>
            <button 
              onClick={() => setIsMobileAnnouncementVisible(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <i className="bi bi-x text-lg"></i>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className={`tabbar lg:hidden ${isMobileAnnouncementVisible ? 'pb-safe' : ''}`}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-5 text-center">
            {([
              { id: "home", icon: "bi-house-fill", label: "홈" },
              { id: "explore", icon: "bi-search", label: "탐색", action: openExplore },
              { id: "compose", icon: "bi-plus-circle-fill", label: "작성", special: true },
              { id: "profile", icon: "bi-person-fill", label: "프로필", action: openProfile },
              { id: "settings", icon: "bi-gear", label: "설정", action: openSettings },
            ] as Array<{ id: string; icon: string; label: string; action?: () => void; special?: boolean }>).map((tab) => (
              <button
                key={tab.id}
                className={`tab transition-all duration-200 transform hover:scale-105 ${activeScreen === tab.id ? "active" : ""} ${tab.special ? "special-tab" : ""}`}
                style={{ transformStyle: 'preserve-3d' }}
                onClick={() => {
                  if (tab.id === "compose") {
                    setIsCreateModalOpen(true);
                  } else if (tab.action) {
                    tab.action();
                  } else {
                    setActiveScreen(tab.id);
                  }
                }}
                data-testid={`tab-${tab.id}`}
              >
                <i className={tab.icon}></i>
                <div className="mini">{tab.label}</div>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* FAB 제거됨 - 네비게이션 바에만 있음 */}

      {/* Create Post Modal */}
      <CreatePostModal 
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setQuotedPost(null);
        }}
        onOpenSettings={() => {
          setIsCreateModalOpen(false);
          setIsSettingsModalOpen(true);
        }}
        quotedPost={quotedPost}
      />

      {/* Profile Edit Modal */}
      <ProfileEditModal 
        isOpen={isProfileEditOpen}
        onClose={() => setIsProfileEditOpen(false)}
      />

      {/* Explore Modal */}
      <ExploreModal
        isOpen={isExploreModalOpen}
        onClose={() => setIsExploreModalOpen(false)}
        onUserClick={handleUserClick}
      />

      {/* Profile View Modal */}
      <ProfileViewModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userId={selectedUserId}
        onUserClick={handleUserClick}
        onEditProfile={() => {
          setIsProfileModalOpen(false);
          setIsProfileEditOpen(true);
        }}
      />

      {/* Friends Modal */}
      <FriendsModal
        isOpen={isFriendsModalOpen}
        onClose={() => setIsFriendsModalOpen(false)}
        onUserClick={handleUserClick}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onOpenCreatePost={() => {
          setIsSettingsModalOpen(false);
          setIsCreateModalOpen(true);
        }}
      />

      {/* Announcement Modal */}
      <AnnouncementModal 
        isOpen={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
      />

      {/* Post Detail Modal */}
      <PostDetailModal
        post={selectedPost}
        isOpen={isPostDetailModalOpen}
        onClose={() => {
          setIsPostDetailModalOpen(false);
          setSelectedPost(null);
        }}
        onUserClick={handleUserClick}
      />

      {/* Dot Pet */}
      <DotPet />
    </div>
  );
}
