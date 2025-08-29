import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";
import type { User } from "@shared/schema";

export default function FriendsListPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'connections' | 'followers' | 'following'>('connections');

  const { data: connections = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    retry: false,
    enabled: activeTab === 'connections',
  });

  const { data: followers = [] } = useQuery<User[]>({
    queryKey: ["/api/users", user?.id, "followers"],
    retry: false,
    enabled: activeTab === 'followers' && !!user,
  });

  const { data: following = [] } = useQuery<User[]>({
    queryKey: ["/api/users", user?.id, "following"],
    retry: false,
    enabled: activeTab === 'following' && !!user,
  });

  const followMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("POST", `/api/users/${userId}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "followers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "following"] });
      toast({
        title: "성공",
        description: "팔로우 상태가 변경되었습니다.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "인증 오류",
          description: "로그인이 필요합니다.",
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

  const getCurrentList = () => {
    switch (activeTab) {
      case 'followers':
        return followers;
      case 'following':
        return following;
      default:
        return connections;
    }
  };

  const filteredUsers = getCurrentList().filter(person =>
    person.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (person.firstName && person.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (person.lastName && person.lastName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>친구 관리</CardTitle>
          <div className="flex gap-2 mt-4">
            <Button
              variant={activeTab === 'connections' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('connections')}
              data-testid="tab-connections"
            >
              내 연결
            </Button>
            <Button
              variant={activeTab === 'followers' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('followers')}
              data-testid="tab-followers"
            >
              팔로워
            </Button>
            <Button
              variant={activeTab === 'following' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('following')}
              data-testid="tab-following"
            >
              팔로잉
            </Button>
          </div>
          
          <div className="mt-4">
            <Input
              placeholder="사용자 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="search-input"
            />
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {filteredUsers.map((person) => (
              <div key={person.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50">
                <Link href={`/profile/${person.id}`}>
                  <div className="flex items-center gap-3 cursor-pointer">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#f4e4bc] to-[#e8d5a3] flex items-center justify-center font-bold text-[#8b4513]">
                      {person.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{person.username}</div>
                      {person.firstName && person.lastName && (
                        <div className="text-sm text-muted-foreground">
                          {person.firstName} {person.lastName}
                        </div>
                      )}
                      {person.bio && (
                        <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                          {person.bio}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => followMutation.mutate(person.id)}
                    disabled={followMutation.isPending || person.id === user?.id}
                    data-testid={`follow-${person.id}`}
                  >
                    {followMutation.isPending ? "처리 중..." : "팔로우"}
                  </Button>
                  
                  <Link href={`/dm/${person.id}`}>
                    <Button variant="ghost" size="sm" data-testid={`dm-${person.id}`}>
                      💬
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? '검색 결과가 없습니다.' : 
                 activeTab === 'followers' ? '아직 팔로워가 없습니다.' :
                 activeTab === 'following' ? '아직 팔로잉하는 사용자가 없습니다.' :
                 '아직 연결된 사용자가 없습니다.'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}