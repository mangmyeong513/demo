import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { User } from "@shared/schema";
import FriendsPanel from "./FriendsPanel";
import DMModal from "./DMModal";
import LogoutModal from "./LogoutModal";
import NotificationBell from "./NotificationBell";

interface NavigationProps {
  onCreatePost: () => void;
  onExploreClick: () => void;
  onFriendsClick: () => void;
  onProfileClick: () => void;
  onSettingsClick: () => void;
}

export default function Navigation({ onCreatePost, onExploreClick, onFriendsClick, onProfileClick, onSettingsClick }: NavigationProps) {
  const { user, isAuthenticated } = useAuth();
  const [showFriendsPanel, setShowFriendsPanel] = useState(false);
  const [dmUser, setDmUser] = useState<User | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const handleStartDM = (user: User) => {
    setDmUser(user);
    setShowFriendsPanel(false);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 nav-enhanced">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-5 logo-container paint-swirl-advanced">
              <div className="relative transform -rotate-3 brush-stroke-rotating">
                <div className="w-14 h-14 rounded-xl logo-icon flex items-center justify-center shadow-2xl paint-card-asymmetric">
                  <span className="text-white font-bold text-2xl filter drop-shadow-xl">🎨</span>
                </div>
                <div className="floating-orb absolute -top-2 -right-2 paint-drop-advanced"></div>
                <div className="floating-orb absolute -bottom-1 -left-1" style={{animationDelay: '1.5s'}}></div>
              </div>
              <div className="text-3xl font-black gradient-text-primary special-effect transform rotate-1">
                ovra
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-2">
              {isAuthenticated && (
                <button 
                  className="asymmetric-btn-create feedback-click transform -rotate-1 hover:rotate-0"
                  data-testid="nav-create-post"
                  onClick={onCreatePost}
                >
                  <span className="me-2 text-lg">🖌️</span>창작하기
                </button>
              )}
              <button 
                className="asymmetric-nav-btn transform rotate-1 hover:-rotate-1"
                data-testid="nav-explore"
                onClick={onExploreClick}
              >
                <span className="me-2 text-lg">🔍</span>찾아보기
              </button>
              <button 
                className="asymmetric-nav-btn transform -rotate-1 hover:rotate-1"
                data-testid="nav-profile"
                onClick={onProfileClick}
              >
                <span className="me-2 text-lg">🎨</span>내 작품
              </button>
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <NotificationBell />
                  <div className="hidden lg:flex items-center gap-3 mr-4">
                    <div className="avatar" style={{ width: '32px', height: '32px' }}>
                      {user?.profileImageUrl ? (
                        <img 
                          src={user.profileImageUrl} 
                          alt={user.firstName || 'User'} 
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-muted to-butter rounded-full"></div>
                      )}
                    </div>
                    <button
                      onClick={onProfileClick}
                      className="text-body-sm font-medium hover:text-mango cursor-pointer"
                      data-testid="text-nav-username"
                    >
                      {user?.firstName || user?.email || '사용자'}
                    </button>
                  </div>
                  <button 
                    className="btn-ghost-modern interactive-button ripple hidden lg:block"
                    onClick={onFriendsClick}
                    data-testid="button-friends"
                  >
                    <i className="bi bi-people"></i>
                  </button>
                  <button 
                    className="btn-modern interactive-button ripple hidden lg:block pulse-glow"
                    onClick={onSettingsClick}
                    data-testid="button-settings"
                  >
                    <i className="bi bi-gear"></i>
                  </button>
                  <button 
                    className="btn-ghost interactive-button ripple"
                    onClick={handleLogout}
                    data-testid="button-logout"
                  >
                    <i className="bi bi-box-arrow-right"></i>
                  </button>
                </>
              ) : (
                <button 
                  className="btn-mango interactive-button ripple pulse-glow"
                  onClick={() => window.location.href = "/api/login"}
                  data-testid="button-login"
                >
                  <i className="bi bi-person mr-2"></i>로그인
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Friends Panel */}
      <FriendsPanel 
        isOpen={showFriendsPanel}
        onClose={() => setShowFriendsPanel(false)}
        onStartDM={handleStartDM}
      />

      {/* DM Modal */}
      <DMModal 
        isOpen={!!dmUser}
        onClose={() => setDmUser(null)}
        otherUser={dmUser}
      />

      {/* Logout Modal */}
      <LogoutModal 
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
      />
    </>
  );
}
