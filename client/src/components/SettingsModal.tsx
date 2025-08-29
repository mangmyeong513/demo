import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreatePost?: () => void;
}

type Theme = "glass" | "retro" | "dark" | "light" | "vintage" | "neon" | "minimal" | "gradient" | "cyberpunk" | "ocean" | "forest" | "sunset" | "lavender" | "rosegold" | "mint" | "cherry" | "golden";

interface Settings {
  showDotPet: boolean;
  theme: Theme;
  notifications: boolean;
  autoSave: boolean;
}

const themes: Array<{ id: Theme; name: string; description: string; colors: string[]; preview: string }> = [
  {
    id: "glass",
    name: "🪟 글래스모피즘",
    description: "현재 적용된 반투명 글래스 효과",
    colors: ["rgba(255,255,255,0.1)", "#8B5CF6", "#06B6D4"],
    preview: "backdrop-blur-md border border-white/20"
  },
  {
    id: "retro",
    name: "🧈 레트로 크림",
    description: "따뜻한 크림 색상의 빈티지 스타일",
    colors: ["#F5F1EB", "#E8DCC6", "#D4B996"],
    preview: "bg-amber-50 border border-amber-200"
  },
  {
    id: "dark",
    name: "🌙 다크 모드",
    description: "어두운 배경의 야간 테마",
    colors: ["#0F0F0F", "#1A1A1A", "#333333"],
    preview: "bg-gray-900 border border-gray-700"
  },
  {
    id: "light",
    name: "☀️ 라이트 모드",
    description: "밝고 깔끔한 화이트 테마",
    colors: ["#FFFFFF", "#F8F9FA", "#E9ECEF"],
    preview: "bg-white border border-gray-200"
  },
  {
    id: "minimal",
    name: "⚪ 미니멀",
    description: "단순하고 깔끔한 현대적 디자인",
    colors: ["#FAFAFA", "#F5F5F5", "#E0E0E0"],
    preview: "bg-gray-50 border border-gray-300"
  },
  {
    id: "gradient",
    name: "🌈 그라데이션",
    description: "화려한 컬러 그라데이션 스타일",
    colors: ["#FF6B6B", "#4ECDC4", "#45B7D1"],
    preview: "bg-gradient-to-r from-pink-500 to-blue-500 border-0"
  },
  {
    id: "cyberpunk",
    name: "🟢 사이버펑크",
    description: "네온 그린과 퓨처리스틱 디자인",
    colors: ["#0D1117", "#00FF41", "#FF0080"],
    preview: "bg-black border border-green-400"
  },
  {
    id: "vintage",
    name: "📸 빈티지 세피아",
    description: "옛날 사진 같은 세피아 톤",
    colors: ["#F4F1E8", "#E6D7C3", "#D2B48C"],
    preview: "bg-amber-100 border border-amber-300"
  },
  {
    id: "neon",
    name: "🎆 네온 레트로",
    description: "80년대 네온사인 스타일",
    colors: ["#0F0F23", "#FF006E", "#8338EC"],
    preview: "bg-purple-900 border border-pink-500"
  },
  {
    id: "ocean",
    name: "🌊 오션 블루",
    description: "깊고 시원한 바다 느낌의 파란색",
    colors: ["#003366", "#0066CC", "#66B2FF"],
    preview: "bg-blue-900 border border-blue-400"
  },
  {
    id: "forest",
    name: "🌲 포레스트 그린",
    description: "싱그러운 숲속 같은 자연의 녹색",
    colors: ["#1B4332", "#2D5A3D", "#52B788"],
    preview: "bg-green-800 border border-green-400"
  },
  {
    id: "sunset",
    name: "🌅 선셋 오렌지",
    description: "따뜻한 노을 빛깔의 오렌지 테마",
    colors: ["#FF6B35", "#F7931E", "#FFD23F"],
    preview: "bg-orange-500 border border-yellow-400"
  },
  {
    id: "lavender",
    name: "💜 라벤더 퍼플",
    description: "우아하고 부드러운 라벤더 색상",
    colors: ["#E6E6FA", "#DDA0DD", "#9370DB"],
    preview: "bg-purple-200 border border-purple-400"
  },
  {
    id: "rosegold",
    name: "🌹 로즈골드",
    description: "고급스러운 로즈골드 럭셔리 테마",
    colors: ["#E8B4B8", "#D4A574", "#B08D5A"],
    preview: "bg-rose-300 border border-amber-400"
  },
  {
    id: "mint",
    name: "🍃 민트 프레시",
    description: "상쾌하고 시원한 민트 그린",
    colors: ["#F0FFF0", "#98FB98", "#00FA9A"],
    preview: "bg-green-100 border border-green-300"
  },
  {
    id: "cherry",
    name: "🌸 체리 블라썸",
    description: "부드러운 벚꽃 핑크 테마",
    colors: ["#FFB7C5", "#FF91A4", "#FFB6C1"],
    preview: "bg-pink-200 border border-pink-400"
  },
  {
    id: "golden",
    name: "✨ 골든 아워",
    description: "황금빛이 물든 매직 아워",
    colors: ["#FFD700", "#FFA500", "#FF8C00"],
    preview: "bg-yellow-400 border border-orange-400"
  }
];

export default function SettingsModal({ isOpen, onClose, onOpenCreatePost }: SettingsModalProps) {
  const [settings, setSettings] = useState<Settings>({
    showDotPet: true,
    theme: "glass",
    notifications: true,
    autoSave: true,
  });
  const { toast } = useToast();

  // 설정 로드
  useEffect(() => {
    const savedSettings = localStorage.getItem("ovra-settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...settings, ...parsed });
        // 저장된 테마 적용
        if (parsed.theme) {
          applyTheme(parsed.theme);
        }
      } catch (error) {
        console.error("설정 로드 오류:", error);
      }
    } else {
      // 기본 테마 적용
      applyTheme("glass");
    }
  }, []);

  // 테마 적용 함수
  const applyTheme = (themeName: Theme) => {
    const body = document.body;
    const html = document.documentElement;
    
    // 기존 테마 클래스 제거
    themes.forEach(theme => {
      body.classList.remove(`theme-${theme.id}`);
      html.classList.remove(`theme-${theme.id}`);
    });
    
    // 새 테마 클래스 추가
    body.classList.add(`theme-${themeName}`);
    html.classList.add(`theme-${themeName}`);
    
    // 테마별 특수 처리
    switch(themeName) {
      case 'dark':
      case 'cyberpunk':
      case 'neon':
      case 'ocean':
      case 'forest':
        html.classList.add('dark');
        break;
      default:
        html.classList.remove('dark');
    }
  };

  // 설정 저장
  const saveSettings = (newSettings: Partial<Settings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem("ovra-settings", JSON.stringify(updatedSettings));
    
    // 테마 변경 시 document에 클래스 적용
    if (newSettings.theme) {
      // 기존 테마 클래스 제거
      themes.forEach(theme => {
        document.body.classList.remove(`theme-${theme.id}`);
        document.documentElement.classList.remove(`theme-${theme.id}`);
      });
      
      // 새 테마 클래스 추가
      document.body.classList.add(`theme-${newSettings.theme}`);
      document.documentElement.classList.add(`theme-${newSettings.theme}`);
      
      // 테마별 특수 처리
      switch(newSettings.theme) {
        case 'dark':
        case 'cyberpunk':
        case 'neon':
        case 'ocean':
        case 'forest':
          document.documentElement.classList.add('dark');
          break;
        default:
          document.documentElement.classList.remove('dark');
      }
    }
    
    // DotPet 표시/숨김 이벤트 발생
    if (typeof newSettings.showDotPet === "boolean") {
      window.dispatchEvent(new CustomEvent("dotpet-visibility", { 
        detail: { visible: newSettings.showDotPet } 
      }));
    }
    
    toast({
      title: "설정 저장됨",
      description: "변경사항이 저장되었습니다.",
    });
  };

  // 설정 초기화
  const resetSettings = () => {
    const defaultSettings: Settings = {
      showDotPet: true,
      theme: "glass",
      notifications: true,
      autoSave: true,
    };
    setSettings(defaultSettings);
    localStorage.setItem("ovra-settings", JSON.stringify(defaultSettings));
    
    // 기본 테마 적용
    themes.forEach(theme => {
      document.body.classList.remove(`theme-${theme.id}`);
      document.documentElement.classList.remove(`theme-${theme.id}`);
    });
    document.body.classList.add("theme-glass");
    document.documentElement.classList.add("theme-glass");
    document.documentElement.classList.remove('dark');
    
    window.dispatchEvent(new CustomEvent("dotpet-visibility", { 
      detail: { visible: true } 
    }));
    
    toast({
      title: "설정 초기화됨",
      description: "모든 설정이 기본값으로 복원되었습니다.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-modal max-w-2xl max-h-[75vh] sm:max-h-[90vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader className="paint-swirl-advanced">
          <DialogTitle className="text-2xl font-bold mb-4 flex items-center gap-3 enhanced-heading paint-drop-advanced">
            <span className="text-3xl">🎭</span>
            아트 스튜디오 설정
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* 테마 설정 */}
          <div className="space-y-6">
            
            <div className="glass-card p-6 border border-gradient bg-gradient-to-r from-blue-50 to-purple-50">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white shadow-lg">
                  🎨
                </div>
                <div>
                  <div>UI 테마 선택</div>
                  <div className="text-sm text-gray-600 font-normal">나만의 스타일로 꾸며보세요</div>
                </div>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  className={`glass-card p-3 sm:p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                    settings.theme === theme.id
                      ? "ring-2 ring-violet-500 bg-gradient-to-br from-violet-100 to-purple-100"
                      : "hover:bg-white/20"
                  }`}
                  onClick={() => saveSettings({ theme: theme.id })}
                  data-testid={`theme-${theme.id}`}
                >
                  <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
                    {/* 테마 미리보기 */}
                    <div className={`w-16 h-12 rounded-lg ${theme.preview} flex items-center justify-center transition-all`}>
                      <div className="w-8 h-2 bg-current opacity-50 rounded-full"></div>
                    </div>
                    
                    {/* 테마 이름 */}
                    <h4 className="text-title font-medium">{theme.name}</h4>
                    
                    {/* 색상 팔레트 */}
                    <div className="flex gap-1 justify-center">
                      {theme.colors.map((color, index) => (
                        <div
                          key={index}
                          className="w-4 h-4 rounded-full border border-white/30 shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    
                    {/* 설명 */}
                    <p className="text-body-sm text-gray-600 leading-relaxed">{theme.description}</p>
                    
                    {/* 선택된 테마 표시 */}
                    {settings.theme === theme.id && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white flex items-center justify-center text-sm">
                        ✓
                      </div>
                    )}
                  </div>
                </div>
              ))}
              </div>
              
              {/* 추가 옵션 */}
              <div className="glass-card p-4 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">고급 설정</div>
                    <div className="text-sm text-gray-600">테마 자동 변경 및 추가 옵션</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="glass-button"
                    onClick={resetSettings}
                    data-testid="button-reset-settings"
                  >
                    기본값 복원
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* 펫 설정 */}
          <div className="space-y-6">
            <div className="glass-card p-6 border border-gradient bg-gradient-to-r from-green-50 to-emerald-50">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white shadow-lg">
                  🐾
                </div>
                <div>
                  <div>디지털 펫 (도토)</div>
                  <div className="text-sm text-gray-600 font-normal">나만의 가상 친구와 함께하세요</div>
                </div>
              </h3>
              
              <div className="space-y-4">
                <div className="glass-card flex items-center justify-between p-6 bg-white/50 border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                      👁️
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">펫 표시</div>
                      <div className="text-sm text-gray-600">화면에 귀여운 도토를 표시합니다</div>
                    </div>
                  </div>
                  <Switch
                    checked={settings.showDotPet}
                    onCheckedChange={(checked) => saveSettings({ showDotPet: checked })}
                    data-testid="switch-dotpet"
                  />
                </div>
                
                <div className="glass-card p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">
                      ✨
                    </div>
                    <span className="font-medium text-green-800">도토 팁</span>
                  </div>
                  <p className="text-sm text-green-700">
                    도토를 클릭하면 다양한 상호작용을 할 수 있어요! 밥주기, 놀아주기, 색깔 바꾸기 등 재미있는 기능들이 가득해요 🎮
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 알림 설정 */}
          <div className="space-y-6">
            <div className="glass-card p-6 border border-gradient bg-gradient-to-r from-yellow-50 to-orange-50">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white shadow-lg">
                  🔔
                </div>
                <div>
                  <div>알림 & 편의 설정</div>
                  <div className="text-sm text-gray-600 font-normal">더 편안한 사용 환경을 만들어보세요</div>
                </div>
              </h3>
              <div className="space-y-3">
                <div className="glass-card flex items-center justify-between p-6">
                <div>
                  <div className="font-medium">알림 받기</div>
                  <div className="text-sm text-muted">새 댓글, 좋아요 등의 알림을 받습니다</div>
                </div>
                <Switch
                  checked={settings.notifications}
                  onCheckedChange={(checked) => saveSettings({ notifications: checked })}
                  data-testid="switch-notifications"
                />
                </div>
                
                <div className="glass-card flex items-center justify-between p-6">
                <div>
                  <div className="font-medium">자동 저장</div>
                  <div className="text-sm text-muted">글 작성 중 자동으로 임시 저장합니다</div>
                </div>
                <Switch
                  checked={settings.autoSave}
                  onCheckedChange={(checked) => saveSettings({ autoSave: checked })}
                  data-testid="switch-autosave"
                />
                </div>
              </div>
            </div>
          </div>

          {/* 기타 설정 */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-400 to-slate-500 flex items-center justify-center text-white text-sm">
                ⚙️
              </div>
              기타 정보
            </h3>
            <div className="space-y-3">
              <div className="glass-card p-6">
                <div className="font-medium mb-2">앱 정보</div>
                <div className="text-sm text-muted space-y-1">
                  <div>버전: 1.0.0</div>
                  <div>레트로 크림 테마 커뮤니티</div>
                  <div>© 2025 Ovra Community</div>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                onClick={resetSettings}
                className="w-full"
                data-testid="button-reset-settings"
              >
                <i className="bi bi-arrow-clockwise mr-2"></i>
                설정 초기화
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-stroke">
          <Button onClick={onClose} data-testid="button-close-settings">
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}