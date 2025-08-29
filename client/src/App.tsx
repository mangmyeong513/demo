// URL 단순화 - Modal 기반 SPA로 라우팅 최소화
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { AuthWall } from "@/components/AuthWall";
import Home from "@/pages/Home";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // 모든 경로를 단일 "/"로 통합 - Modal 기반 SPA
  if (isLoading || !isAuthenticated) {
    return <AuthWall />;
  }

  return <Home />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
