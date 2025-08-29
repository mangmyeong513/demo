import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DMModal from "@/components/DMModal";
import { useAuth } from "@/hooks/useAuth";
import type { User, MessageWithUsers } from "@shared/schema";

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserClick: (userId: string) => void;
}

export default function FriendsModal({ isOpen, onClose, onUserClick }: FriendsModalProps) {
  const [activeTab, setActiveTab] = useState<'friends' | 'conversations'>('friends');
  const [searchQuery, setSearchQuery] = useState("");
  const [isDMModalOpen, setIsDMModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { user: currentUser } = useAuth();

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users", { search: searchQuery }],
    enabled: isOpen && activeTab === 'friends',
    retry: false,
  });

  const { data: conversations = [] } = useQuery<{ user: User; lastMessage: MessageWithUsers; unreadCount: number }[]>({
    queryKey: ["/api/conversations"],
    enabled: isOpen && activeTab === 'conversations',
    retry: false,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const handleMessageClick = (user: User) => {
    setSelectedUser(user);
    setIsDMModalOpen(true);
  };

  const formatTimeAgo = (date: string | Date) => {
    if (typeof window !== 'undefined' && (window as any).dayjs) {
      return (window as any).dayjs(date).fromNow();
    }
    return new Date(date).toLocaleString();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="glass-modal max-w-2xl max-h-[75vh] sm:max-h-[90vh] overflow-y-auto p-3 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-4 flex items-center gap-3 enhanced-heading paint-drip">
              <span className="text-3xl">🌻</span>
              아트 커뮤니티 네트워크
            </DialogTitle>
            <DialogDescription className="sr-only">
              다른 사용자들을 찾고 메시지를 주고받을 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="friends" className="glass-card px-6 py-3 font-semibold">회원 찾기</TabsTrigger>
              <TabsTrigger value="conversations" className="glass-card px-6 py-3 font-semibold">네트워크 채팅</TabsTrigger>
            </TabsList>

            {/* Friends Tab */}
            <TabsContent value="friends" className="space-y-4">
              <div className="flex gap-3">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="네트워크 멤버 검색..."
                  className="glass-input flex-1"
                />
                <Button>
                  <i className="bi bi-search"></i>
                </Button>
              </div>

              <div className="space-y-3">
                {users.length > 0 ? (
                  users
                    .filter(user => user.id !== currentUser?.id)
                    .map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50">
                        <div 
                          className="flex items-center gap-3 cursor-pointer flex-1"
                          onClick={() => onUserClick(user.id)}
                        >
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#f4e4bc] to-[#e8d5a3] flex items-center justify-center font-bold text-[#8b4513]">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{user.username}</div>
                            {user.bio && (
                              <div className="text-sm text-muted-foreground truncate">
                                {user.bio}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMessageClick(user)}
                          className="ml-2"
                        >
                          <i className="bi bi-chat me-2"></i>
                          메시지
                        </Button>
                      </div>
                    ))
                ) : searchQuery ? (
                  <div className="text-center py-8">
                    <i className="bi bi-person text-4xl text-muted mb-4"></i>
                    <p className="text-muted">검색 결과가 없습니다.</p>
                    <p className="text-sm text-muted-foreground">다른 사용자명을 검색해보세요.</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="bi bi-search text-4xl text-muted mb-4"></i>
                    <p className="text-muted">사용자를 검색해보세요.</p>
                    <p className="text-sm text-muted-foreground">검색창에 사용자명을 입력하세요.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Conversations Tab */}
            <TabsContent value="conversations" className="space-y-4">
              <div className="space-y-2">
                {conversations.length > 0 ? (
                  conversations.map((conversation) => (
                    <div 
                      key={conversation.user.id}
                      className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleMessageClick(conversation.user)}
                    >
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#f4e4bc] to-[#e8d5a3] flex items-center justify-center font-bold text-[#8b4513]">
                          {conversation.user.username.charAt(0).toUpperCase()}
                        </div>
                        {conversation.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{conversation.user.username}</div>
                          <div className="text-xs text-muted-foreground">
                            {conversation.lastMessage.createdAt ? formatTimeAgo(conversation.lastMessage.createdAt) : ''}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage.content}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <i className="bi bi-chat text-4xl text-muted mb-4"></i>
                    <p className="text-muted">아직 대화가 없습니다.</p>
                    <p className="text-sm text-muted-foreground">친구를 찾아서 메시지를 보내보세요!</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* DM Modal */}
      <DMModal
        isOpen={isDMModalOpen}
        onClose={() => {
          setIsDMModalOpen(false);
          setSelectedUser(null);
        }}
        otherUser={selectedUser}
      />
    </>
  );
}