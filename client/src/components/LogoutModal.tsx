import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import LoadingPage from "@/components/LoadingPage";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LogoutModal({ isOpen, onClose }: LogoutModalProps) {
  const { toast } = useToast();
  const { logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        onClose();
        toast({
          title: "로그아웃 완료",
          description: "안전하게 로그아웃되었습니다.",
        });
        
        // 잠시 후 로그인 페이지로 리다이렉트
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1000);
      },
      onError: (error) => {
        console.error("Logout error:", error);
        onClose();
        toast({
          title: "로그아웃 완료",
          description: "로그인 페이지로 이동합니다.",
        });
        
        // 오류 시에도 로그인 페이지로 리다이렉트
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1000);
      }
    });
  };

  // 로그아웃 진행 중일 때 로딩 화면 표시
  if (logoutMutation.isPending) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="paint-modal canvas-texture max-w-md mx-auto">
          <div className="py-8">
            <LoadingPage
              message="로그아웃 처리 중..."
              variant="minimal"
              showLogo={false}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="paint-modal canvas-texture max-w-md mx-auto">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center mb-4 transform rotate-3">
            <span className="text-4xl">🚪</span>
          </div>
          
          <DialogTitle className="text-xl font-bold enhanced-heading paint-drip">
            아트 스튜디오를 떠나시겠습니까?
          </DialogTitle>
          
          <DialogDescription className="text-text-secondary">
            현재 세션이 종료되고 로그인 페이지로 이동합니다.
            <br />
            저장하지 않은 변경사항이 있다면 먼저 저장해주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 mt-8">
          <Button
            variant="outline"
            className="flex-1 glass-button-secondary"
            onClick={onClose}
            data-testid="button-logout-cancel"
          >
            <i className="bi bi-x-circle mr-2"></i>
            취소
          </Button>
          
          <Button
            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            data-testid="button-logout-confirm"
          >
            <i className="bi bi-box-arrow-right mr-2"></i>
            {logoutMutation.isPending ? "처리 중..." : "로그아웃"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}