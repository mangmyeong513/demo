import { cn } from "@/lib/utils";

interface LoadingPageProps {
  message?: string;
  className?: string;
  showLogo?: boolean;
  variant?: "default" | "minimal" | "fullscreen";
}

export default function LoadingPage({
  message = "로딩 중...",
  className,
  showLogo = true,
  variant = "default"
}: LoadingPageProps) {
  const isFullscreen = variant === "fullscreen";
  const isMinimal = variant === "minimal";

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        isFullscreen && "min-h-screen fixed inset-0 z-50 bg-background/95 backdrop-blur-sm",
        !isFullscreen && "min-h-[400px]",
        className
      )}
      data-testid="loading-page"
    >
      <div className="text-center space-y-6">
        {/* 로딩 애니메이션 */}
        <div className="relative">
          {!isMinimal && (
            <>
              {/* 외부 링 */}
              <div className="w-24 h-24 mx-auto relative">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" style={{ animationDuration: '0.8s' }}></div>
                <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-accent animate-spin animation-delay-200" style={{ animationDirection: 'reverse', animationDuration: '1.2s' }}></div>
              </div>
              
              {/* 중앙 로고/아이콘 */}
              {showLogo && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse" style={{ animationDuration: '1s' }}>
                    <span className="text-white text-sm font-bold">O</span>
                  </div>
                </div>
              )}
            </>
          )}
          
          {isMinimal && (
            <div className="flex items-center justify-center space-x-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDuration: '0.6s' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce animation-delay-100" style={{ animationDuration: '0.6s' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce animation-delay-200" style={{ animationDuration: '0.6s' }}></div>
            </div>
          )}
        </div>

        {/* 로딩 메시지 */}
        <div className="space-y-2">
          <p className="text-lg font-medium text-text-primary animate-pulse" style={{ animationDuration: '1s' }}>
            {message}
          </p>
          {!isMinimal && (
            <p className="text-sm text-text-muted">
              잠시만 기다려주세요...
            </p>
          )}
        </div>

        {/* 프로그레스 바 (옵션) */}
        {!isMinimal && (
          <div className="w-48 mx-auto">
            <div className="h-1 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full animate-pulse" style={{ animationDuration: '1s' }}></div>
            </div>
          </div>
        )}

        {/* 장식적 요소 */}
        {!isMinimal && variant === "fullscreen" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/30 rounded-full animate-float"></div>
            <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-accent/40 rounded-full animate-float animation-delay-500"></div>
            <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-primary/20 rounded-full animate-float animation-delay-1000"></div>
            <div className="absolute bottom-1/3 right-1/4 w-1 h-1 bg-accent/30 rounded-full animate-float animation-delay-700"></div>
          </div>
        )}
      </div>
    </div>
  );
}

// 로딩 스켈레톤 컴포넌트들
export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-muted rounded w-2/3"></div>
    </div>
  );
}

export function PostLoadingSkeleton() {
  return (
    <div className="glass-card p-6 space-y-4 animate-pulse">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-muted rounded-full"></div>
        <div className="space-y-1 flex-1">
          <div className="h-4 bg-muted rounded w-24"></div>
          <div className="h-3 bg-muted rounded w-16"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-full"></div>
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
      </div>
      <div className="flex items-center space-x-4 pt-2">
        <div className="h-8 bg-muted rounded w-16"></div>
        <div className="h-8 bg-muted rounded w-16"></div>
        <div className="h-8 bg-muted rounded w-16"></div>
      </div>
    </div>
  );
}

export function UserLoadingSkeleton() {
  return (
    <div className="flex items-center space-x-3 p-4 animate-pulse">
      <div className="w-12 h-12 bg-muted rounded-full"></div>
      <div className="space-y-1 flex-1">
        <div className="h-4 bg-muted rounded w-32"></div>
        <div className="h-3 bg-muted rounded w-24"></div>
      </div>
      <div className="h-8 bg-muted rounded w-20"></div>
    </div>
  );
}