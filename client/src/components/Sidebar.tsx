import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

interface SidebarProps {
  onCreatePost: () => void;
}

export default function Sidebar({ onCreatePost }: SidebarProps) {
  const { user } = useAuth();

  const { data: trendingTags } = useQuery<{ tag: string; count: number }[]>({
    queryKey: ["/api/trending/tags"],
    retry: false,
  });

  return (
    <div className="space-y-4">
      {/* User Profile Card */}
      <div className="soft-card p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="avatar relative">
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div className="flex-1">
            <div className="font-bold" data-testid="text-sidebar-username">
              {user?.firstName || user?.email || '익명 사용자'}
            </div>
            <div className="mini">오늘 뭐 써볼까?</div>
          </div>
        </div>
        <button 
          onClick={onCreatePost}
          className="btn-mango w-full"
          data-testid="button-create-post-sidebar"
        >
          <i className="bi bi-pencil-square me-2"></i>새 글 작성
        </button>
      </div>

      {/* Quick Stats */}
      <div className="soft-card p-4">
        <h4 className="font-semibold mb-3">내 활동</h4>
        <div className="space-y-2">
          <div className="flex justify-between mini">
            <span>게시글</span>
            <span data-testid="text-posts-count">0</span>
          </div>
          <div className="flex justify-between mini">
            <span>팔로워</span>
            <span data-testid="text-followers-count">0</span>
          </div>
          <div className="flex justify-between mini">
            <span>팔로잉</span>
            <span data-testid="text-following-count">0</span>
          </div>
        </div>
      </div>

      {/* Popular Tags */}
      <div className="soft-card p-4">
        <h4 className="font-semibold mb-3">인기 태그</h4>
        <div className="flex flex-wrap gap-2">
          {trendingTags?.slice(0, 6).map((tag) => (
            <button key={tag.tag} className="pill text-sm" data-testid={`sidebar-tag-${tag.tag}`}>
              #{tag.tag}
            </button>
          )) || (
            <>
              <span className="pill text-sm">#레트로</span>
              <span className="pill text-sm">#음악</span>
              <span className="pill text-sm">#사진</span>
              <span className="pill text-sm">#질문</span>
              <span className="pill text-sm">#추억</span>
              <span className="pill text-sm">#빈티지</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
