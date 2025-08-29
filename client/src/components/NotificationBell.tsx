import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  post?: {
    id: string;
    content: string;
  };
  author?: {
    id: string;
    username: string;
    firstName?: string;
  };
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Get unread notification count
  const { data: unreadCountData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  const unreadCount = unreadCountData?.count || 0;

  // Get notifications when dropdown is opened
  const { data: notifications = [], refetch } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: isOpen,
    retry: false,
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest("PUT", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", "/api/notifications/mark-all-read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      toast({
        title: "알림 확인 완료",
        description: "모든 알림을 읽음 처리했습니다.",
      });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    setIsOpen(false);
  };

  const formatTimeAgo = (dateString: string) => {
    if (typeof window !== 'undefined' && (window as any).dayjs) {
      return (window as any).dayjs(dateString).fromNow();
    }
    return new Date(dateString).toLocaleString();
  };

  const handleDropdownOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      refetch();
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleDropdownOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="notification-bell relative bg-white/30 hover:bg-white/50 backdrop-blur-md rounded-xl transition-all duration-300 feedback-click"
          data-testid="notification-bell"
        >
          <span className="text-xl">🔔</span>
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white bg-gradient-to-br from-red-500 to-pink-600"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-80 max-h-96 overflow-y-auto"
        data-testid="notification-dropdown"
      >
        <div className="px-3 py-2 border-b flex items-center justify-between">
          <h3 className="font-semibold">알림</h3>
          {notifications.some(n => !n.isRead) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              data-testid="mark-all-read-button"
            >
              모두 읽음
            </Button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <i className="bi bi-bell text-3xl mb-2 block"></i>
              <p>알림이 없습니다.</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex-col items-start p-3 cursor-pointer ${
                  !notification.isRead ? 'bg-muted/50' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
                data-testid={`notification-${notification.id}`}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        !notification.isRead ? 'bg-blue-500' : 'bg-transparent'
                      }`}></div>
                      <span className="font-medium text-sm">{notification.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                      {notification.author && (
                        <span className="text-xs text-muted-foreground">
                          {notification.author.username || notification.author.firstName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}