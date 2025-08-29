import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PostCard from "@/components/PostCard";
import { useToast } from "@/hooks/use-toast";
import { PostLoadingSkeleton, UserLoadingSkeleton } from "@/components/LoadingPage";
import type { PostWithAuthor, User } from "@shared/schema";

interface ExploreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserClick: (userId: string) => void;
}

export default function ExploreModal({ isOpen, onClose, onUserClick }: ExploreModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchType, setSearchType] = useState<"posts" | "users" | "tags">("posts");
  const { toast } = useToast();

  // Search posts
  const { data: searchResults, isLoading: searchLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/posts", { search: searchQuery }],
    enabled: searchQuery.length > 0 && searchType === "posts",
    retry: false,
  });

  // Search users
  const { data: userResults, isLoading: userLoading } = useQuery<User[]>({
    queryKey: ["/api/users", { search: searchQuery }],
    enabled: searchQuery.length > 0 && searchType === "users",
    retry: false,
  });

  // Get trending tags
  const { data: trendingTags } = useQuery<{ tag: string; count: number }[]>({
    queryKey: ["/api/trending/tags"],
    retry: false,
  });

  // Category posts
  const { data: categoryPosts, isLoading: categoryLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/posts", { tag: activeCategory }],
    enabled: !!activeCategory && !searchQuery,
    retry: false,
  });

  const categories = [
    { icon: "bi-music-note-beamed", name: "음악", tag: "music" },
    { icon: "bi-camera-reels", name: "사진", tag: "photo" },
    { icon: "bi-palette", name: "아트", tag: "art" },
    { icon: "bi-chat-heart", name: "일상", tag: "daily" },
    { icon: "bi-film", name: "영화", tag: "movie" },
    { icon: "bi-book", name: "독서", tag: "book" },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast({
        title: "검색어를 입력하세요",
        description: "최소 1글자 이상 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
  };

  const handleCategoryClick = (categoryTag: string) => {
    setActiveCategory(activeCategory === categoryTag ? null : categoryTag);
    setSearchQuery("");
  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(`#${tag}`);
    setSearchType("posts");
    setActiveCategory(null);
  };

  const renderResults = () => {
    if (searchQuery && searchType === "posts") {
      if (searchLoading) {
        return (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <PostLoadingSkeleton key={i} />
            ))}
          </div>
        );
      }

      if (searchResults?.length) {
        return (
          <div className="space-y-4">
            {searchResults.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        );
      }

      return (
        <div className="text-center py-8">
          <i className="bi bi-search text-4xl text-muted mb-4"></i>
          <p className="text-muted">검색 결과가 없습니다.</p>
        </div>
      );
    }

    if (searchQuery && searchType === "users") {
      if (userLoading) {
        return (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <UserLoadingSkeleton key={i} />
            ))}
          </div>
        );
      }

      if (userResults?.length) {
        return (
          <div className="space-y-3">
            {userResults.map((resultUser) => (
              <div 
                key={resultUser.id}
                className="soft-card p-4 flex items-center gap-3 hover:border-mango transition-colors cursor-pointer"
                onClick={() => {
                  onUserClick(resultUser.id);
                  onClose();
                }}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#f4e4bc] to-[#e8d5a3] flex items-center justify-center font-bold text-[#8b4513]">
                  {resultUser.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{resultUser.username}</div>
                  {resultUser.bio && (
                    <div className="text-sm text-muted-foreground truncate">
                      {resultUser.bio}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      }

      return (
        <div className="text-center py-8">
          <i className="bi bi-person text-4xl text-muted mb-4"></i>
          <p className="text-muted">사용자를 찾을 수 없습니다.</p>
        </div>
      );
    }

    if (activeCategory && !searchQuery) {
      if (categoryLoading) {
        return (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <PostLoadingSkeleton key={i} />
            ))}
          </div>
        );
      }

      if (categoryPosts?.length) {
        return (
          <div className="space-y-4">
            {categoryPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        );
      }

      return (
        <div className="text-center py-8">
          <i className="bi bi-folder text-4xl text-muted mb-4"></i>
          <p className="text-muted">이 카테고리에는 아직 게시글이 없습니다.</p>
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-modal max-w-4xl max-h-[75vh] sm:max-h-[90vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader className="paint-swirl-advanced">
          <DialogTitle className="text-2xl font-bold mb-4 flex items-center gap-3 enhanced-heading paint-drop-advanced">
            <span className="text-3xl">🔎</span>
            작품 갤러리 탐색
          </DialogTitle>
          <DialogDescription className="sr-only">
            새로운 사용자들과 인기 게시글을 탐색할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search Section */}
          <div className="space-y-4">
            <Tabs value={searchType} onValueChange={(value) => setSearchType(value as typeof searchType)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="posts">게시글</TabsTrigger>
                <TabsTrigger value="users">사용자</TabsTrigger>
                <TabsTrigger value="tags">태그</TabsTrigger>
              </TabsList>
            </Tabs>

            <form onSubmit={handleSearch} className="flex gap-3">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  searchType === "posts" ? "게시글, 태그 검색..." :
                  searchType === "users" ? "사용자명 검색..." :
                  "태그 검색..."
                }
                className="glass-input flex-1"
              />
              <Button type="submit">
                <i className="bi bi-search"></i>
              </Button>
            </form>
          </div>

          {/* Trending Tags */}
          {!searchQuery && !activeCategory && (
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-sm">
                  🔥
                </div>
                트렌딩 태그
              </h3>
              <div className="flex flex-wrap gap-2">
                {trendingTags?.length ? (
                  trendingTags.map((tag) => (
                    <Badge
                      key={tag.tag}
                      variant="secondary"
                      className="cursor-pointer hover:bg-mango hover:text-white transition-colors"
                      onClick={() => handleTagClick(tag.tag)}
                    >
                      #{tag.tag} ({tag.count})
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">아직 트렌딩 태그가 없습니다.</p>
                )}
              </div>
            </div>
          )}

          {/* Categories */}
          {!searchQuery && (
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm">
                  🗺️
                </div>
                카테고리별 탐색
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => handleCategoryClick(category.tag)}
                    className={`glass-card p-6 text-center transition-all duration-300 ${
                      activeCategory === category.tag
                        ? "border-violet-400 bg-gradient-to-br from-violet-100 to-purple-100"
                        : "hover:border-violet-300 hover:bg-white/20"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xl mb-3 mx-auto transform rotate-12">
                      <i className={category.icon}></i>
                    </div>
                    <div className="font-semibold">{category.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {(searchQuery || activeCategory) && (
            <div>
              <h3 className="font-semibold mb-3">
                {searchQuery ? (
                  <>
                    "{searchQuery}" 검색 결과
                    {searchType === "posts" && " - 게시글"}
                    {searchType === "users" && " - 사용자"}
                    {searchType === "tags" && " - 태그"}
                  </>
                ) : (
                  `${categories.find(c => c.tag === activeCategory)?.name} 카테고리`
                )}
              </h3>
              {renderResults()}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}