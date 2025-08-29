import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, MessageWithUsers } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface DMModalProps {
  isOpen: boolean;
  onClose: () => void;
  otherUser: User | null;
}

export default function DMModal({ isOpen, onClose, otherUser }: DMModalProps) {
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery<MessageWithUsers[]>({
    queryKey: ["/api/messages", otherUser?.id],
    enabled: isOpen && !!otherUser,
    retry: false,
    refetchInterval: 3000, // Poll for new messages every 3 seconds
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", "/api/messages", {
        receiverId: otherUser?.id,
        content,
      });
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages", otherUser?.id] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "오류",
        description: "메시지 전송 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !otherUser) return;
    sendMessageMutation.mutate(messageText);
  };

  const formatTimeAgo = (date: string | Date) => {
    if (typeof window !== 'undefined' && (window as any).dayjs) {
      return (window as any).dayjs(date).format('HH:mm');
    }
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!isOpen || !otherUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" data-testid="dm-modal">
      <div className="absolute inset-0 bg-black/20" onClick={onClose}></div>
      
      <div className="glass-modal relative w-full max-w-md max-h-[70vh] sm:max-h-[80vh] flex flex-col border-2 border-white/20 m-2 sm:m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="avatar" style={{ width: '32px', height: '32px' }}>
              {otherUser.profileImageUrl ? (
                <img 
                  src={otherUser.profileImageUrl} 
                  alt={otherUser.firstName || 'User'} 
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-muted to-butter rounded-full"></div>
              )}
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent" data-testid="dm-title">
              {otherUser.firstName || otherUser.email || '네트워크 멤버'}와 대화
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="action-btn"
            data-testid="button-close-dm"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-4 space-y-3" style={{ maxHeight: '50vh' }} data-testid="dm-messages">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <i className="bi bi-chat text-3xl text-muted mb-2"></i>
              <p className="mini text-gray-600">새로운 아이디어를 나누어보세요!</p>
            </div>
          ) : (
            messages.reverse().map((message) => {
              const isFromMe = message.sender.id !== otherUser.id;
              return (
                <div 
                  key={message.id} 
                  className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[70%] p-3 rounded-2xl ${
                      isFromMe 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white ml-auto rounded-br-md' 
                        : 'bg-card border border-stroke rounded-bl-md'
                    }`}
                    data-testid={`message-${message.id}`}
                  >
                    <div className="text-sm">{message.content}</div>
                    <div className={`text-xs mt-1 ${isFromMe ? 'text-cocoa' : 'text-muted'}`}>
                      {formatTimeAgo(message.createdAt!)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-stroke">
          <div className="flex gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="메시지를 입력하세요..."
              className="glass-input flex-1"
              disabled={sendMessageMutation.isPending}
              data-testid="input-dm-message"
            />
            <button
              type="submit"
              disabled={!messageText.trim() || sendMessageMutation.isPending}
              className="glass-button"
              data-testid="button-send-dm"
            >
              {sendMessageMutation.isPending ? (
                <i className="bi bi-arrow-clockwise animate-spin"></i>
              ) : (
                <i className="bi bi-send"></i>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}