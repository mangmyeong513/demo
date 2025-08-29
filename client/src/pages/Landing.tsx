import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="vinyl" style={{ width: '48px', height: '48px' }}></div>
            <h1 className="brand text-display">
              ovra
            </h1>
          </div>
          <p className="text-body text-muted max-w-2xl mx-auto">
            레트로 감성을 사랑하는 사람들을 위한 특별한 커뮤니티입니다. 
            추억을 공유하고, 소통하며, 아름다운 순간들을 기록해보세요.
          </p>
        </div>

        {/* Welcome Card */}
        <Card className="soft-card p-8 mb-8 text-center max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="vinyl mx-auto mb-6" style={{ width: '64px', height: '64px' }}></div>
            <h2 className="text-heading mb-4">시작해보세요</h2>
            <p className="text-body-sm text-muted mb-6">
              레트로한 감성으로 일상을 기록하고 다른 사람들과 추억을 나누어보세요.
            </p>
            <Button 
              onClick={handleLogin}
              className="btn-mango w-full text-body py-3"
              data-testid="button-login"
            >
              <i className="bi bi-person-plus me-2"></i>
              로그인하고 시작하기
            </Button>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="soft-card p-6 text-center">
            <CardContent className="pt-6">
              <i className="bi bi-camera-reels text-4xl text-mango mb-4"></i>
              <h3 className="text-title mb-2">추억 공유</h3>
              <p className="text-body-sm">소중한 순간들을 사진과 글로 기록하고 공유하세요.</p>
            </CardContent>
          </Card>
          
          <Card className="soft-card p-6 text-center">
            <CardContent className="pt-6">
              <i className="bi bi-people text-4xl text-mango mb-4"></i>
              <h3 className="text-title mb-2">커뮤니티</h3>
              <p className="text-body-sm">같은 취향을 가진 사람들과 소통하고 친구가 되어보세요.</p>
            </CardContent>
          </Card>
          
          <Card className="soft-card p-6 text-center">
            <CardContent className="pt-6">
              <i className="bi bi-vinyl text-4xl text-mango mb-4"></i>
              <h3 className="text-title mb-2">레트로 감성</h3>
              <p className="text-body-sm">따뜻하고 아늑한 레트로 분위기에서 편안하게 소통하세요.</p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <p className="text-body-sm mb-4">이미 계정이 있으신가요?</p>
          <Button 
            onClick={handleLogin}
            variant="outline"
            className="btn-outline-mango"
            data-testid="button-login-existing"
          >
            로그인
          </Button>
        </div>
      </div>
    </div>
  );
}
