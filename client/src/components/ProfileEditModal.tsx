import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileEditModal({ isOpen, onClose }: ProfileEditModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    bio: user?.bio || "",
    profileImageUrl: user?.profileImageUrl || "",
    location: user?.location || "",
    website: user?.website || "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      let profileImageUrl = data.profileImageUrl;
      
      // Upload image if file is selected
      if (selectedFile) {
        const reader = new FileReader();
        profileImageUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(selectedFile);
        });
      }
      
      return await apiRequest("PUT", "/api/users/me", {
        ...data,
        profileImageUrl
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "프로필 업데이트 완료",
        description: "프로필이 성공적으로 업데이트되었습니다.",
      });
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "로그인 필요",
          description: "로그인이 필요합니다. 다시 로그인해주세요.",
          variant: "destructive",
        });
        onClose();
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1000);
        return;
      }
      toast({
        title: "오류",
        description: "프로필 업데이트 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: "파일 크기 오류",
          description: "이미지 크기는 2MB 이하여야 합니다.",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "파일 형식 오류",
          description: "이미지 파일만 업로드할 수 있습니다.",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
    }
  };

  const removeSelectedImage = () => {
    setSelectedFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-modal max-w-lg max-h-[75vh] sm:max-h-[90vh] overflow-y-auto border-2 border-white/20 p-3 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-heading bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-base sm:text-xl transform rotate-12">
              ✏️
            </div>
            프로필 에디터
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            나만의 디지털 아이덴티티를 만들어보세요
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* 프로필 사진 섹션 */}
          <div className="space-y-4">
            <Label className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm">
                📷
              </div>
              프로필 이미지
            </Label>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-stroke">
                  {imagePreview || formData.profileImageUrl ? (
                    <img 
                      src={imagePreview || formData.profileImageUrl} 
                      alt="프로필" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-muted to-butter flex items-center justify-center">
                      <i className="bi bi-person text-2xl text-muted-foreground"></i>
                    </div>
                  )}
                </div>
                {(imagePreview || formData.profileImageUrl) && (
                  <button
                    type="button"
                    onClick={removeSelectedImage}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                    data-testid="button-remove-profile-image"
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
              
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-upload-profile-image"
                >
                  <i className="bi bi-upload mr-2"></i>
                  사진 업로드
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG 파일 (최대 2MB)
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="profileImageUrl">또는 이미지 URL 입력</Label>
              <Input
                id="profileImageUrl"
                name="profileImageUrl"
                type="url"
                value={formData.profileImageUrl}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                data-testid="input-edit-avatar"
              />
            </div>
          </div>

          {/* 기본 정보 */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">기본 정보</Label>
            
            <div className="space-y-2">
              <Label htmlFor="firstName">닉네임 *</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="닉네임을 입력하세요"
                required
                data-testid="input-edit-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">자기소개</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="자신을 소개해보세요. 취미, 관심사, 좋아하는 것들을 알려주세요!"
                rows={4}
                className="resize-none"
                data-testid="textarea-edit-bio"
              />
              <p className="text-xs text-muted-foreground">
                {formData.bio.length}/160자
              </p>
            </div>
          </div>

          {/* 추가 정보 */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">추가 정보</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">
                  <i className="bi bi-geo-alt mr-1"></i>
                  위치
                </Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="서울, 대한민국"
                  data-testid="input-edit-location"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website">
                  <i className="bi bi-link-45deg mr-1"></i>
                  웹사이트
                </Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  data-testid="input-edit-website"
                />
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex justify-end gap-3 pt-4 border-t border-stroke">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              data-testid="button-cancel-edit"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="btn-mango"
              data-testid="button-save-profile"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <i className="bi bi-arrow-clockwise animate-spin mr-2"></i>
                  저장 중...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg mr-2"></i>
                  저장하기
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}