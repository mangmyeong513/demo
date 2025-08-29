import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface FriendsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onStartDM: (user: User) => void;
}

export default function FriendsPanel({ isOpen, onClose, onStartDM }: FriendsPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: friends = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    retry: false,
    enabled: isOpen,
  });

  const followMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("POST", `/api/users/${userId}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "성공",
        description: "팔로우 상태가 변경되었습니다.",
      });
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
        description: "팔로우 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" data-testid="friends-panel">
      <div className="absolute inset-0 bg-black/20" onClick={onClose}></div>
      
      <div className="absolute right-0 top-0 bottom-0 w-80 bg-card border-l border-stroke flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stroke">
          <h3 className="text-lg font-bold">친구</h3>
          <button 
            onClick={onClose}
            className="action-btn"
            data-testid="button-close-friends"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* Friends List */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3 text-muted">친구 목록</h4>
            <div className="space-y-3" data-testid="friends-list">
              {friends.length > 0 ? (
                friends.slice(0, 5).map((friend) => (
                  <div key={friend.id} className="flex items-center gap-3">
                    <div className="avatar">
                      {friend.profileImageUrl ? (
                        <img 
                          src={friend.profileImageUrl} 
                          alt={friend.firstName || 'User'} 
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-muted to-butter rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">
                        {friend.firstName || friend.email || '익명 사용자'}
                      </div>
                      <div className="mini truncate">{friend.bio || '자기소개가 없습니다'}</div>
                    </div>
                    <button
                      onClick={() => onStartDM(friend)}
                      className="action-btn"
                      data-testid={`button-dm-${friend.id}`}
                    >
                      <i className="bi bi-chat"></i>
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <i className="bi bi-people text-3xl text-muted mb-2"></i>
                  <p className="mini">아직 친구가 없어요</p>
                </div>
              )}
            </div>
          </div>

          {/* All Users */}
          <div>
            <h4 className="font-semibold mb-3 text-muted">모든 사용자</h4>
            <div className="space-y-3" data-testid="all-users">
              {friends.map((user) => (
                <div key={user.id} className="flex items-center gap-3">
                  <div className="avatar">
                    {user.profileImageUrl ? (
                      <img 
                        src={user.profileImageUrl} 
                        alt={user.firstName || 'User'} 
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-muted to-butter rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">
                      {user.firstName || user.email || '익명 사용자'}
                    </div>
                    <div className="mini truncate">{user.bio || '자기소개가 없습니다'}</div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onStartDM(user)}
                      className="action-btn"
                      data-testid={`button-dm-user-${user.id}`}
                    >
                      <i className="bi bi-chat"></i>
                    </button>
                    <button
                      onClick={() => followMutation.mutate(user.id)}
                      disabled={followMutation.isPending}
                      className="action-btn"
                      data-testid={`button-follow-${user.id}`}
                    >
                      <i className="bi bi-person-plus"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}