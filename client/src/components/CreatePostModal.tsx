import React, { useState, useRef, useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { handleAuthError } from "@/lib/authUtils";
import { PostWithAuthor } from "@shared/schema";
import { SmartTagSuggestions } from "./SmartTagSuggestions";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
  quotedPost?: PostWithAuthor | null;
}

export default function CreatePostModal({ isOpen, onClose, onOpenSettings, quotedPost }: CreatePostModalProps) {
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [quoteText, setQuoteText] = useState<string>("");
  const [quoteAuthor, setQuoteAuthor] = useState<string>("");
  const [showQuoteForm, setShowQuoteForm] = useState<boolean>(false);
  const [showPostQuote, setShowPostQuote] = useState<boolean>(!!quotedPost);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const predefinedTags = useMemo(() => ["레트로", "음악", "사진", "일상", "질문", "추억", "빈티지"], []);

  // 키보드 단축키 처리
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter' && isOpen) {
      e.preventDefault();
      const formElement = document.querySelector('form') as HTMLFormElement;
      if (formElement) {
        formElement.requestSubmit();
      }
    }
    if (e.ctrlKey && e.key === 'q' && isOpen) {
      e.preventDefault();
      setShowQuoteForm(!showQuoteForm);
    }
  }, [isOpen, showQuoteForm]);

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  const createPostMutation = useMutation({
    mutationFn: async (postData: { content: string; tags: string[]; imageUrls?: string[] }) => {
      return await apiRequest("POST", "/api/posts", postData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "게시글 작성 완료",
        description: "새 게시글이 성공적으로 작성되었습니다.",
      });
      handleClose();
    },
    onError: (error) => {
      const handled = handleAuthError(error, toast, handleClose);
      if (!handled) {
        toast({
          title: "게시글 작성 실패",
          description: "게시글 작성 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    },
  });

  const handleClose = useCallback(() => {
    // 메모리 정리
    imagePreviews.forEach(preview => {
      if (preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    });
    
    setContent("");
    setSelectedTags([]);
    setSelectedFiles([]);
    setImagePreviews([]);
    setQuoteText("");
    setQuoteAuthor("");
    setShowQuoteForm(false);
    setShowPostQuote(false);
    setIsDragOver(false);
    setUploadProgress(0);
    setIsUploading(false);
    onClose();
  }, [imagePreviews, onClose]);

  // 이미지 압축 함수
  const compressImage = async (file: File, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // 최대 크기 설정 (긴 변 기준 1920px)
        const maxSize = 1920;
        let { width, height } = img;
        
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        if (ctx) {
          // 이미지 품질 향상을 위한 설정
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            file.type,
            quality
          );
        } else {
          resolve(file);
        }
      };
      
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  };

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const maxFiles = 5;
    const maxSize = 8 * 1024 * 1024; // 8MB로 증가 (압축 전 크기)
    const currentCount = selectedFiles.length;
    const remainingSlots = maxFiles - currentCount;

    if (fileArray.length > remainingSlots) {
      toast({
        title: "파일 개수 초과",
        description: `최대 ${maxFiles}개까지만 업로드할 수 있습니다. (현재: ${currentCount}개)`,
        variant: "destructive",
      });
      return;
    }

    const validFiles = [];
    const newPreviews = [...imagePreviews];
    
    // 처리 시작 알림
    if (fileArray.length > 1) {
      toast({
        title: "이미지 처리 중",
        description: `${fileArray.length}개 파일을 압축 및 최적화하고 있습니다...`,
      });
    }
    
    for (const file of fileArray.slice(0, remainingSlots)) {
      // 파일 유효성 검사
      if (!file.type.startsWith('image/')) {
        toast({
          title: "파일 형식 오류",
          description: `${file.name}은(는) 이미지 파일이 아닙니다.`,
          variant: "destructive",
        });
        continue;
      }
      
      if (file.size > maxSize) {
        toast({
          title: "파일 크기 초과",
          description: `${file.name}의 크기가 8MB를 초과합니다.`,
          variant: "destructive",
        });
        continue;
      }
      
      try {
        // 이미지 압축 적용
        const originalSize = file.size;
        const compressedFile = await compressImage(file, 0.85);
        const compressionRatio = ((originalSize - compressedFile.size) / originalSize * 100).toFixed(1);
        
        validFiles.push(compressedFile);
        newPreviews.push(URL.createObjectURL(compressedFile));
        
        // 압축률이 5% 이상일 때만 알림
        if (parseFloat(compressionRatio) > 5) {
          toast({
            title: "이미지 최적화 완료",
            description: `${file.name} - ${compressionRatio}% 압축됨`,
          });
        }
      } catch (error) {
        // 압축 실패 시 원본 파일 사용
        validFiles.push(file);
        newPreviews.push(URL.createObjectURL(file));
        toast({
          title: "이미지 압축 실패",
          description: `${file.name} - 원본 파일이 사용됩니다.`,
          variant: "destructive",
        });
      }
    }

    if (validFiles.length > 0) {
      const newFiles = [...selectedFiles, ...validFiles];
      setSelectedFiles(newFiles);
      setImagePreviews(newPreviews);
      
      toast({
        title: "파일 추가 완료",
        description: `${validFiles.length}개 파일이 추가되었습니다.`,
      });
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      await processFiles(event.target.files);
      // Reset input value for re-selection
      event.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    // Revoke the URL to free memory
    URL.revokeObjectURL(imagePreviews[index]);
    
    setSelectedFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // 파일 검증
      if (!file || file.size === 0) {
        reject(new Error(`빈 파일입니다: ${file?.name || '알 수 없음'}`));
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        reject(new Error(`이미지 파일이 아닙니다: ${file.name}`));
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB 제한
        reject(new Error(`파일이 너무 큽니다 (10MB 초과): ${file.name}`));
        return;
      }
      
      const reader = new FileReader();
      
      // 10초 타임아웃
      const timeoutId = setTimeout(() => {
        reader.abort();
        reject(new Error(`파일 읽기 시간 초과: ${file.name}`));
      }, 10000);
      
      reader.onload = () => {
        clearTimeout(timeoutId);
        const result = reader.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error(`파일 읽기 실패 - 잘못된 결과: ${file.name}`));
        }
      };
      
      reader.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error(`파일 읽기 오류: ${file.name}`));
      };
      
      reader.onabort = () => {
        clearTimeout(timeoutId);
        reject(new Error(`파일 읽기 취소됨: ${file.name}`));
      };
      
      try {
        reader.readAsDataURL(file);
      } catch (err) {
        clearTimeout(timeoutId);
        reject(new Error(`FileReader 시작 실패: ${file.name} - ${err}`));
      }
    });
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    if (!files || files.length === 0) {
      return [];
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    const results: string[] = [];
    const validFiles = Array.from(files).filter(file => 
      file && file.size > 0 && file.type.startsWith('image/')
    );
    
    if (validFiles.length === 0) {
      setIsUploading(false);
      throw new Error('유효한 이미지 파일이 없습니다.');
    }
    
    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        
        try {
          const dataUrl = await readFileAsDataURL(file);
          results.push(dataUrl);
          
          // 진행률 업데이트
          const progress = ((i + 1) / validFiles.length) * 100;
          setUploadProgress(progress);
        } catch (error) {
          setIsUploading(false);
          throw new Error(`${file.name} 파일 읽기 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        }
      }
      
      setIsUploading(false);
      return results;
    } catch (error) {
      setIsUploading(false);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && !quoteText.trim()) {
      toast({
        title: "내용을 입력해주세요",
        description: "게시글 내용 또는 옴표구를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      let imageUrls: string[] = [];
      
      // 이미지가 있을 때만 업로드 처리
      if (selectedFiles.length > 0) {
        try {
          imageUrls = await uploadImages(selectedFiles);
        } catch (error) {
          toast({
            title: "이미지 업로드 실패",
            description: error instanceof Error ? error.message : "이미지 업로드 중 오류가 발생했습니다.",
            variant: "destructive",
          });
          return; // 이미지 업로드 실패 시 게시글 작성 중단
        }
      }

      let finalContent = content.trim();
      
      // Add quote to content if present (separate from post quote)
      if (quoteText.trim()) {
        const quoteLine = `"${quoteText.trim()}"`;
        const authorLine = quoteAuthor.trim() ? ` - ${quoteAuthor.trim()}` : "";
        const quote = `\n\n💭 ${quoteLine}${authorLine}`;
        finalContent = finalContent + quote;
      }

      const postData: any = {
        content: finalContent,
        tags: selectedTags,
      };
      
      if (imageUrls.length > 0) {
        postData.imageUrls = imageUrls;
      }
      
      if (showPostQuote && quotedPost) {
        postData.quotedPostId = quotedPost.id;
      }
      
      createPostMutation.mutate(postData);
    } catch (error) {
      toast({
        title: "오류",
        description: "게시글 작성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-modal max-w-2xl max-h-[75vh] sm:max-h-[90vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader className="paint-swirl-advanced">
          <DialogTitle className="text-2xl font-bold mb-4 flex items-center gap-3 enhanced-heading paint-drop-advanced">
            <span className="text-3xl">🎨</span>
            새 작품 만들기
          </DialogTitle>
          <DialogDescription className="sr-only">
            새로운 게시글을 작성하고 사진을 업로드할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-4">
          {/* User Info */}
          <div className="flex items-start gap-3">
            <div className="avatar flex-shrink-0"></div>
            <div className="flex-1">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="무슨 일이 있었나요? 여러분의 이야기를 들려주세요..."
                className="glass-input min-h-[100px] sm:min-h-[120px] resize-none text-body focus:ring-0"
                data-testid="textarea-post-content"
              />
            </div>
          </div>

          {/* Enhanced Media Upload Area */}
          <div 
            className={`glass-card border-2 border-dashed p-4 sm:p-8 text-center transition-all duration-300 cursor-pointer ${
              isDragOver 
                ? 'border-violet-500/70 bg-violet-500/10 scale-[1.02]' 
                : 'border-white/30 hover:border-violet-400/50'
            } ${selectedFiles.length === 0 ? 'min-h-[120px] flex flex-col justify-center' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.jpg,.jpeg,.png,.gif,.webp"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              data-testid="input-file-upload"
            />
            
            {selectedFiles.length === 0 ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center">
                  <i className="bi bi-cloud-upload text-2xl text-violet-600"></i>
                </div>
                <p className="text-lg font-semibold text-foreground mb-2">이미지 업로드</p>
                <p className="text-body-sm text-muted mb-4">클릭하거나 파일을 드래그하여 업로드</p>
                <p className="text-xs text-muted">최대 5장, 5MB/장 (자동 압축) • JPG, PNG, GIF, WebP</p>
                {isDragOver && (
                  <div className="mt-4 text-violet-600 font-medium">
                    📁 파일을 여기에 놓으세요
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center gap-2 py-2">
                <i className="bi bi-plus-circle text-violet-600"></i>
                <span className="text-sm text-violet-600 font-medium">추가 이미지 업로드 ({selectedFiles.length}/5)</span>
              </div>
            )}
          </div>
          
          {/* Upload Progress */}
          {isUploading && (
            <div className="glass-card p-4">
              <div className="flex items-center gap-3 mb-2">
                <i className="bi bi-arrow-clockwise animate-spin text-violet-600"></i>
                <span className="text-sm font-medium">이미지 업로드 중...</span>
                <span className="text-xs text-muted ml-auto">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-violet-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Enhanced Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <i className="bi bi-images text-violet-600"></i>
                  선택된 이미지 ({imagePreviews.length}/5)
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
                    setSelectedFiles([]);
                    setImagePreviews([]);
                  }}
                  className="text-xs text-muted hover:text-red-500 transition-colors"
                  data-testid="button-clear-all-images"
                >
                  <i className="bi bi-trash"></i> 모두 제거
                </button>
              </div>
              
              <div className={`grid gap-3 ${
                imagePreviews.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' :
                imagePreviews.length === 2 ? 'grid-cols-2' :
                'grid-cols-2 sm:grid-cols-3'
              }`} data-testid="image-previews">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden border-2 border-white/20 group-hover:border-violet-400/50 transition-all">
                      <img 
                        src={preview} 
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    
                    {/* Image overlay with file info */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="text-xs font-medium mb-1">
                          {selectedFiles[index]?.name.slice(0, 15)}...
                        </div>
                        <div className="text-xs opacity-75">
                          {(selectedFiles[index]?.size / 1024).toFixed(0)}KB
                        </div>
                      </div>
                    </div>
                    
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(index);
                      }}
                      className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm transition-all shadow-lg hover:scale-110"
                      data-testid={`button-remove-image-${index}`}
                    >
                      <i className="bi bi-x"></i>
                    </button>
                    
                    {/* Image number badge */}
                    <div className="absolute top-2 left-2 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Post Quote Section */}
          {showPostQuote && quotedPost && (
            <div className="border border-stroke rounded-lg p-4 space-y-3 bg-gradient-to-r from-violet/10 to-purple/5">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold flex items-center gap-2">
                  <i className="bi bi-chat-quote text-violet-600"></i>
                  게시글 옴표
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setShowPostQuote(false);
                  }}
                  className="text-muted hover:text-foreground"
                  data-testid="button-close-post-quote"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              
              <div className="p-3 bg-background rounded border-l-4 border-violet-600">
                <p className="text-sm text-foreground mb-1">{quotedPost.content}</p>
                <p className="text-xs text-muted">— {quotedPost.author.firstName || quotedPost.author.email || '익명 사용자'}</p>
              </div>
            </div>
          )}

          {/* Live Preview Section - 실시간 미리보기 */}
          {(content.trim() || quotedPost) && (
            <div className="glass-card p-4 rounded-xl bg-gradient-to-br from-green-50/80 to-emerald-50/80 border border-green-200/50">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <i className="bi bi-eye text-white text-xs"></i>
                </div>
                <h4 className="text-sm font-bold text-green-800">게시글 미리보기</h4>
                <div className="flex-1"></div>
                <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  실시간 미리보기
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-green-200/70 shadow-sm">
                {/* Mock post content */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-primary">
                    <div className="w-full h-full bg-gradient-to-br from-violet-400 to-purple-500"></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-sm font-semibold text-gray-800">내 계정</div>
                      <div className="text-xs text-gray-500">@me</div>
                      <div className="text-xs text-gray-400">방금 전</div>
                    </div>
                    
                    {content.trim() && (
                      <div className="text-gray-800 leading-relaxed mb-3">
                        {content}
                      </div>
                    )}
                    
                    {/* Preview quoted post */}
                    {quotedPost && (
                      <div className="mt-3">
                        <div className="overflow-hidden rounded-xl">
                          <div className="bg-gradient-to-r from-blue-50/90 to-cyan-50/80 border border-blue-200 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-500">
                                {quotedPost.author.profileImageUrl ? (
                                  <img 
                                    src={quotedPost.author.profileImageUrl} 
                                    alt={quotedPost.author.firstName || 'User'} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500"></div>
                                )}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-800">
                                  {quotedPost.author.firstName || quotedPost.author.email || '익명 사용자'}
                                </div>
                                <div className="text-xs text-blue-600">
                                  @{quotedPost.author.firstName?.toLowerCase() || 'anonymous'}
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{quotedPost.content}</p>
                          </div>
                          {/* Sticky strip preview */}
                          <div className="relative">
                            <div className="mx-3 -mt-1 h-3 rounded-b-2xl border shadow-[inset_0_-2px_6px_rgba(0,0,0,.15)] bg-violet-300/70 border-violet-400/60" />
                            <div className="pointer-events-none absolute -top-1 left-2 h-2 w-8 -rotate-3 bg-white/50 shadow-sm mix-blend-overlay" />
                            <div className="pointer-events-none absolute -top-1 right-2 h-2 w-8 rotate-3 bg-white/50 shadow-sm mix-blend-overlay" />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Mock interaction buttons */}
                    <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <i className="bi bi-heart"></i>
                        <span>0</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <i className="bi bi-chat"></i>
                        <span>0</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <i className="bi bi-bookmark"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 개선된 옴표구 기능 */}
          {showQuoteForm && (
            <div className="glass-card p-5 rounded-xl space-y-4 bg-gradient-to-br from-amber-50/80 via-yellow-50/60 to-orange-50/80 border border-amber-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold text-sm">
                    "
                  </div>
                  <h4 className="text-lg font-bold text-amber-800">옴표구 추가</h4>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setShowQuoteForm(false);
                    setQuoteText("");
                    setQuoteAuthor("");
                  }}
                  className="text-amber-600 hover:text-amber-800 hover:bg-amber-100/50"
                  data-testid="button-close-quote"
                >
                  <i className="bi bi-x-lg"></i>
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-amber-800 mb-2">옴표 내용</label>
                  <Textarea
                    value={quoteText}
                    onChange={(e) => setQuoteText(e.target.value)}
                    placeholder="좋아하는 명언, 가사, 영화 대사, 책 구절 등... 자유롭게 옴표해보세요! ✨"
                    rows={4}
                    className="resize-none bg-white/70 border-amber-200 focus:border-amber-400 focus:ring-amber-200"
                    data-testid="textarea-quote-text"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-amber-800 mb-2">출처 (선택사항)</label>
                  <input
                    type="text"
                    value={quoteAuthor}
                    onChange={(e) => setQuoteAuthor(e.target.value)}
                    placeholder="작가명, 책/영화 제목, 가수명, 드라마 등..."
                    className="w-full px-4 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 bg-white/70"
                    data-testid="input-quote-author"
                  />
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const inspiringQuotes = [
                        "삶이 있는 한 희망은 있다 - 키케로",
                        "꿈을 포기하지 마라, 꿈이 죽으면 인생은 날개 꺾인 새가 된다 - 랭스턴 휴즈",
                        "오늘이 가장 젊은 날이다",
                        "행복은 습관이다. 그것을 몸에 지니라 - 허버드",
                        "좋은 친구, 좋은 책, 그리고 평온한 양심: 이것이 이상적인 생활이다 - 마크 트웨인",
                        "시간은 우리가 가진 가장 소중한 것이다 - 테오프라스토스",
                        "모든 순간이 새로운 시작이다",
                        "당신이 할 수 있다고 믿든 할 수 없다고 믿든, 당신이 옳다 - 헨리 포드"
                      ];
                      const selectedQuote = inspiringQuotes[Math.floor(Math.random() * inspiringQuotes.length)];
                      const parts = selectedQuote.split(' - ');
                      setQuoteText(parts[0]);
                      if (parts[1]) setQuoteAuthor(parts[1]);
                    }}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-200 text-blue-700"
                  >
                    💡 영감받기
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setQuoteText("");
                      setQuoteAuthor("");
                    }}
                    className="hover:bg-red-50 border-red-200 text-red-600"
                  >
                    🗑️ 지우기
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const randomLength = Math.floor(Math.random() * 3) + 1;
                      setQuoteText("✨".repeat(randomLength) + " 여기에 당신만의 특별한 옴표구를 적어보세요 " + "✨".repeat(randomLength));
                    }}
                    className="bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-purple-200 text-purple-700"
                  >
                    ✨ 템플릿
                  </Button>
                </div>
              </div>
              
              {quoteText.trim() && (
                <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 rounded-xl border-l-4 border-amber-400 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-amber-600 text-2xl font-bold mt-0.5 opacity-60">"</span>
                    <div className="flex-1 space-y-2">
                      <p className="text-base italic text-gray-800 leading-relaxed font-medium">
                        {quoteText.trim()}
                      </p>
                      {quoteAuthor.trim() && (
                        <p className="text-sm text-amber-700 font-semibold">
                          — {quoteAuthor.trim()}
                        </p>
                      )}
                    </div>
                    <span className="text-amber-600 text-2xl font-bold opacity-60">"</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tag Selection */}
          {/* AI 스마트 태그 제안 */}
          <SmartTagSuggestions 
            content={content} 
            onTagSelect={toggleTag} 
            selectedTags={selectedTags} 
          />

          <div>
            <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-sm">
                #
              </div>
              태그 선택
            </h4>
            <div className="flex flex-wrap gap-2">
              {predefinedTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`glass-card px-4 py-2 font-semibold transition-all transform hover:scale-105 ${
                    selectedTags.includes(tag) 
                      ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg' 
                      : 'hover:bg-white/20'
                  }`}
                  onClick={() => toggleTag(tag)}
                  data-testid={`tag-${tag}`}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  #{tag}
                </button>
              ))}
              <button 
                type="button" 
                className="glass-card px-4 py-2 hover:bg-white/20 transition-all transform hover:scale-105" 
                data-testid="button-add-custom-tag"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <i className="bi bi-plus-circle text-violet-600"></i> 추가
              </button>
            </div>
          </div>

          {/* Post Options */}
          <div className="flex items-center gap-4 text-sm text-muted">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="form-check-input" defaultChecked data-testid="checkbox-allow-comments" />
              댓글 허용
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="form-check-input" data-testid="checkbox-include-location" />
              위치 정보 포함
            </label>
          </div>

          {/* Quote Type Selection - 옴표 타입 선택 */}
          <div className="glass-card p-4 rounded-xl bg-gradient-to-br from-indigo-50/80 to-purple-50/80 border border-indigo-200/50">
            <h4 className="text-sm font-bold text-indigo-800 mb-3 flex items-center gap-2">
              <i className="bi bi-chat-quote text-indigo-600"></i>
              옴표 추가
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowQuoteForm(!showQuoteForm)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  showQuoteForm 
                    ? 'border-amber-400 bg-amber-50 text-amber-800' 
                    : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50 text-gray-700'
                }`}
                data-testid="button-add-text-quote"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs">
                    "
                  </div>
                  <span className="font-semibold text-sm">텍스트 옴표</span>
                </div>
                <p className="text-xs opacity-80">명언, 가사, 책 구절 등을 옴표</p>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  // 게시글 옴표은 이미 quotedPost로 처리됨
                  if (!quotedPost) {
                    toast({
                      title: "게시글 옴표",
                      description: "다른 게시글의 옴표 버튼을 눌러서 옴표하세요.",
                    });
                  }
                }}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  quotedPost 
                    ? 'border-blue-400 bg-blue-50 text-blue-800' 
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!quotedPost}
                data-testid="button-post-quote-info"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs">
                    <i className="bi bi-chat-square"></i>
                  </div>
                  <span className="font-semibold text-sm">게시글 옴표</span>
                </div>
                <p className="text-xs opacity-80">
                  {quotedPost ? '다른 사용자의 게시글 옴표 중' : '게시글에서 옴표 버튼을 눌러보세요'}
                </p>
              </button>
            </div>
          </div>

          {/* Action Buttons - 간소화된 버튼들 */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-500">
                키보드 단축키: <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+Enter</kbd> 게시, <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+Q</kbd> 옴표
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="ghost"
                className="interactive-button ripple"
                onClick={handleClose}
                data-testid="button-cancel"
              >
                취소
              </Button>
              <Button
                type="submit"
                className="glass-button interactive-button ripple"
                disabled={(!content.trim() && !quoteText.trim()) || createPostMutation.isPending || isUploading}
                data-testid="button-submit-post"
              >
                {createPostMutation.isPending ? (
                  <>
                    <i className="bi bi-arrow-clockwise me-2 animate-spin"></i>
                    게시 중...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send me-2"></i>
                    게시하기
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
