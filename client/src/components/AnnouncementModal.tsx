import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'info' | 'update' | 'warning';
}

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AnnouncementModal({ isOpen, onClose }: AnnouncementModalProps) {
  const [announcements] = useState<Announcement[]>([
    {
      id: '1',
      title: '새로운 글라스모피즘 테마 추가!',
      content: '더욱 아름다운 UI를 위해 9가지 글라스모피즘 테마를 추가했습니다. 설정에서 원하는 테마를 선택해보세요.',
      date: '2025.01.25',
      type: 'update'
    },
    {
      id: '2',
      title: '커뮤니티 가이드라인 업데이트',
      content: '더 나은 커뮤니티 환경을 위해 가이드라인을 개정했습니다. 서로를 존중하며 즐거운 소통을 해주세요.',
      date: '2025.01.20',
      type: 'info'
    },
    {
      id: '3',
      title: '도토 AI 어시스턴트 개선',
      content: '도토가 더욱 똑똑해졌습니다! 이제 더 자연스러운 대화와 다양한 도움을 받을 수 있어요.',
      date: '2025.01.15',
      type: 'update'
    },
    {
      id: '4',
      title: '모바일 UI 최적화 완료',
      content: '모바일에서 더욱 편리하게 이용할 수 있도록 인터페이스를 개선했습니다.',
      date: '2025.01.10',
      type: 'update'
    }
  ]);

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'update':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'warning':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-green-50 border-green-200 text-green-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'update':
        return '🔄';
      case 'warning':
        return '⚠️';
      default:
        return '📢';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-modal max-w-2xl max-h-[80vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-2 sm:pb-4">
          <DialogTitle className="text-heading bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
            <i className="bi bi-megaphone text-purple-600"></i>
            공지사항
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className={`p-4 rounded-xl border-2 ${getTypeStyle(announcement.type)} transition-all hover:shadow-md`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">{getTypeIcon(announcement.type)}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-title font-semibold">{announcement.title}</h3>
                    <span className="text-caption text-gray-500">{announcement.date}</span>
                  </div>
                  <p className="text-body-sm leading-relaxed">{announcement.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full btn-ghost text-body-sm"
            data-testid="button-close-announcements"
          >
            닫기
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}