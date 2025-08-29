import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

interface PetState {
  hungry: number;
  clean: number;
  energy: number;
  fun: number;
  last: number;
  sleeping: boolean;
  name: string;
  color: string;
  accessory: string;
  personality: string;
}

const defaultState: PetState = {
  hungry: 35,
  clean: 70,
  energy: 80,
  fun: 60,
  last: Date.now(),
  sleeping: false,
  name: "도토",
  color: "#96e29b",
  accessory: "none",
  personality: "친근함"
};

const colorCycle = [
  '#96e29b', '#bfa3ef', '#7fc5ff', '#fff29a', 
  '#c3a1ff', '#ffc0c0', '#b6f7ff', '#ffc67a', '#c9ef9a'
];

const accessories = [
  { id: 'none', name: '없음', emoji: '' },
  { id: 'hat', name: '모자', emoji: '🎩' },
  { id: 'bow', name: '리본', emoji: '🎀' },
  { id: 'glasses', name: '안경', emoji: '👓' },
  { id: 'crown', name: '왕관', emoji: '👑' },
  { id: 'flower', name: '꽃', emoji: '🌸' },
];

const personalities = [
  '친근함', '수줍음', '장난꾸러기', '현명함', '활발함', '조용함', '호기심', '느긋함'
];

// 도토의 도우미 메시지들
const helpMessages = [
  "안녕하세요! 도토예요. 궁금한 게 있으시면 언제든 말씀해주세요! 🌟",
  "Ovra 사용법이 궁금하시다면 제가 도와드릴게요! 포스트 작성이나 친구 찾기 등 뭐든 물어보세요.",
  "옴표 기능으로 다른 사람의 글을 인용해보세요! 트위터처럼 멋진 카드가 만들어져요 ✨",
  "레트로 감성 포스팅 팁: 따뜻한 색감의 사진과 빈티지한 문구로 감성을 살려보세요! 📸", 
  "신고나 공유 기능도 있어요! 게시글 옆 점 3개 메뉴를 확인해보세요 🔗",
  "건강한 SNS 생활을 위해 적당한 휴식도 필요해요. 가끔은 휴대폰을 내려놓고 쉬어보세요 💤",
  "친구들과 따뜻한 댓글로 소통해보세요. 진솔한 마음이 가장 아름답답니다 💌",
  "오늘도 Ovra에서 즐거운 하루 되세요! 저는 항상 여러분 곁에 있을게요 🎈"
];

const quickHelps = [
  { text: "포스트 작성법", response: "포스트를 작성하려면 + 버튼을 누르거나 상단의 '새 포스트' 버튼을 클릭해보세요! 사진과 함께 따뜻한 글을 써보세요 ✍️" },
  { text: "옴표 기능", response: "다른 사람의 글 옆에 '옴표' 버튼을 누르면 트위터처럼 예쁜 인용 카드가 만들어져요! 원본 글이 파란색 카드로 연결됩니다 🔗" },
  { text: "신고/공유", response: "게시글 우상단의 점 3개(⋯) 버튼을 누르면 신고하기, 공유하기, 링크복사 메뉴가 나와요! 📋" },
  { text: "친구 찾기", response: "다른 사용자들의 포스트에 좋아요나 댓글을 남기면서 자연스럽게 친구가 될 수 있어요! 따뜻한 소통이 시작이에요 👫" },
  { text: "게시글 자세히", response: "게시글을 클릭하면 큰 화면으로 볼 수 있고, 댓글도 더 자세히 볼 수 있어요! 💬" }
];

export function DotPet() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [petState, setPetState] = useState<PetState>(defaultState);
  const [colorIndex, setColorIndex] = useState(0);
  const [emotion, setEmotion] = useState('♡');
  const [showEmotion, setShowEmotion] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [tempName, setTempName] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout>();
  const emotionIntervalRef = useRef<NodeJS.Timeout>();

  const userId = user?.id || 'guest';
  const storageKey = `retro-dotpet:${userId}`;

  // Load state from localStorage
  const loadState = (): PetState => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? { ...defaultState, ...JSON.parse(saved) } : defaultState;
    } catch {
      return defaultState;
    }
  };

  // Save state to localStorage
  const saveState = (state: PetState) => {
    localStorage.setItem(storageKey, JSON.stringify(state));
  };

  const clamp = (value: number) => Math.max(0, Math.min(100, value));

  // Calculate mood based on stats
  const getMood = (state: PetState): string => {
    if (state.sleeping) return 'zzz… 낮잠 중';
    
    const bad = Number(state.hungry > 70) + Number(state.clean < 30) + 
                Number(state.energy < 30) + Number(state.fun < 30);
    
    if (bad >= 3) return '삐졌어요…';
    if (state.hungry > 70) return '배고파요';
    if (state.clean < 30) return '씻고 싶어요';
    if (state.energy < 30) return '졸려요';
    if (state.fun < 30) return '심심해요';
    return '기분 좋아요';
  };

  // Decay stats over time
  const decayStats = (state: PetState): PetState => {
    const now = Date.now();
    const dtMin = (now - state.last) / 60000; // minutes
    
    if (dtMin <= 0) return state;
    
    const mul = state.sleeping ? 0.25 : 1;
    
    return {
      ...state,
      hungry: clamp(state.hungry + 2 * mul * dtMin),
      clean: clamp(state.clean - 1.2 * dtMin),
      energy: clamp(state.energy + (state.sleeping ? 2.5 : -1.6) * dtMin),
      fun: clamp(state.fun - 1.0 * dtMin),
      last: now
    };
  };

  // Show emotion animation
  const showEmotionAnimation = (emotionChar: string = '♡') => {
    setEmotion(emotionChar);
    setShowEmotion(true);
    setTimeout(() => setShowEmotion(false), 2000);
  };

  // Pet actions
  const doAction = (action: string) => {
    setPetState(prev => {
      const decayed = decayStats(prev);
      let newState = { ...decayed };

      switch (action) {
        case 'feed':
          newState.hungry = clamp(newState.hungry - 35);
          showEmotionAnimation('♡');
          break;
        case 'wash':
          newState.clean = clamp(newState.clean + 35);
          showEmotionAnimation('♡');
          break;
        case 'play':
          newState.fun = clamp(newState.fun + 30);
          newState.energy = clamp(newState.energy - 8);
          showEmotionAnimation('♡');
          break;
        case 'nap':
          newState.sleeping = !newState.sleeping;
          showEmotionAnimation('💤');
          break;
        case 'randomColor':
          newState.color = colorCycle[Math.floor(Math.random() * colorCycle.length)];
          showEmotionAnimation('✨');
          break;
        case 'randomPersonality':
          newState.personality = personalities[Math.floor(Math.random() * personalities.length)];
          showEmotionAnimation('🌟');
          break;
      }

      newState.last = Date.now();
      saveState(newState);
      return newState;
    });
  };

  // Save pet name
  const savePetName = () => {
    if (tempName.trim()) {
      setPetState(prev => {
        const newState = { ...prev, name: tempName.trim() };
        saveState(newState);
        return newState;
      });
      setTempName('');
      setIsCustomizing(false);
      showEmotionAnimation('😊');
    }
  };

  // Change accessory
  const changeAccessory = (accessoryId: string) => {
    setPetState(prev => {
      const newState = { ...prev, accessory: accessoryId };
      saveState(newState);
      return newState;
    });
    showEmotionAnimation('💫');
  };

  // Chat helper functions
  const showHelp = () => {
    const randomMessage = helpMessages[Math.floor(Math.random() * helpMessages.length)];
    setChatMessage(randomMessage);
    setShowChat(true);
    showEmotionAnimation('💬');
    setTimeout(() => setShowChat(false), 5000);
  };

  const showQuickHelp = (help: typeof quickHelps[0]) => {
    setChatMessage(help.response);
    setShowChat(true);
    showEmotionAnimation('💡');
    setTimeout(() => setShowChat(false), 6000);
  };

  // Optimized initialization with useMemo and useCallback
  const memoizedInitialState = useMemo(() => {
    return decayStats(loadState());
  }, [userId]);

  const handleVisibilityChange = useCallback((event: CustomEvent) => {
    setIsVisible(event.detail.visible);
  }, []);

  // Initialize and set up intervals
  useEffect(() => {
    setPetState(memoizedInitialState);
    saveState(memoizedInitialState);

    // Load visibility from settings (optimized)
    try {
      const savedSettings = localStorage.getItem("ovra-settings");
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setIsVisible(settings.showDotPet !== false);
      }
    } catch (error) {
      console.error("설정 로드 오류:", error);
    }

    window.addEventListener('dotpet-visibility', handleVisibilityChange as EventListener);

    // Optimized intervals with proper cleanup
    intervalRef.current = setInterval(() => {
      setPetState(prev => {
        const newState = decayStats(prev);
        saveState(newState);
        return newState;
      });
    }, 60000);

    // Reduced frequency for better performance
    emotionIntervalRef.current = setInterval(() => {
      if (!isOpen && isVisible) {
        showEmotionAnimation('☆');
      }
    }, 8000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      if (emotionIntervalRef.current) {
        clearInterval(emotionIntervalRef.current);
        emotionIntervalRef.current = undefined;
      }
      window.removeEventListener('dotpet-visibility', handleVisibilityChange as EventListener);
    };
  }, [memoizedInitialState, handleVisibilityChange, isOpen, isVisible]);

  // Cycle pet color
  useEffect(() => {
    const colorTimer = setInterval(() => {
      setColorIndex(prev => (prev + 1) % colorCycle.length);
    }, 3000);

    return () => clearInterval(colorTimer);
  }, []);

  // Apply color to CSS custom property
  useEffect(() => {
    document.documentElement.style.setProperty('--pet-body', petState.color || colorCycle[colorIndex]);
    document.documentElement.style.setProperty('--pet-light', '#ffffff');
  }, [colorIndex, petState.color]);

  // Get current accessory emoji
  const getCurrentAccessory = () => {
    const accessory = accessories.find(acc => acc.id === petState.accessory);
    return accessory?.emoji || '';
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <style>{`
        /* DotPet styles */
        :root {
          --pet-body: ${colorCycle[colorIndex]};
          --pet-light: #ffffff;
        }
        .tamapet {
          position: fixed;
          z-index: 1060;
          right: 18px;
          bottom: 18px;
          font-family: inherit;
        }
        @media (max-width: 992px) {
          .tamapet {
            left: 14px;
            right: auto;
            bottom: 96px;
          }
        }
        .tamapet-bubble {
          width: 64px;
          height: 64px;
          border-radius: 18px;
          background: linear-gradient(180deg, #fffdf4, #fff4e2);
          border: 1px solid var(--border);
          display: grid;
          place-items: center;
          cursor: pointer;
          box-shadow: 0 10px 18px rgba(0,0,0,.12);
          animation: tp-bounce 3.2s ease-in-out infinite;
          position: relative;
        }
        .tamapet-bubble:focus {
          outline: 4px solid rgba(244,182,97,.25);
        }
        .tamapet-sprite {
          width: 38px;
          image-rendering: pixelated;
        }
        .tamapet-emo {
          position: absolute;
          top: -10px;
          right: -6px;
          font-weight: 800;
          color: #e45858;
          opacity: 0;
          transform: translateY(-4px);
        }
        .tamapet-panel {
          margin-top: 8px;
          padding: 12px;
          min-width: 220px;
          border-radius: 16px;
          border: 1px solid var(--border);
          background: linear-gradient(180deg, #fffdf4, #fff4e2);
          box-shadow: 0 14px 28px rgba(0,0,0,.14);
          display: ${isOpen ? 'block' : 'none'};
        }
        .tp-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .tp-bars label {
          display: block;
          margin-top: 6px;
          font-size: 12px;
          color: var(--muted-foreground);
        }
        .bar {
          height: 10px;
          border-radius: 999px;
          background: #efe6d6;
          overflow: hidden;
        }
        .bar > span {
          display: block;
          height: 100%;
          background: linear-gradient(90deg, #F7D58C, #F4B661);
          transition: width 0.3s ease;
        }
        .tp-actions {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
          margin-top: 10px;
        }
        .tp-btn {
          padding: 8px 10px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: #fff;
          cursor: pointer;
          font-weight: 700;
          font-size: 12px;
        }
        .tp-btn:active {
          transform: translateY(1px);
        }
        .tp-mood {
          font-size: 11px;
          color: var(--muted-foreground);
        }
        .tp-customize {
          border-top: 1px solid var(--border);
          margin-top: 10px;
          padding-top: 10px;
        }
        .tp-name-edit {
          display: flex;
          gap: 4px;
          margin-bottom: 8px;
        }
        .tp-name-input {
          flex: 1;
          padding: 4px 6px;
          border: 1px solid var(--border);
          border-radius: 6px;
          font-size: 12px;
        }
        .tp-save-btn {
          padding: 4px 8px;
          border: 1px solid var(--border);
          background: var(--primary);
          color: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 11px;
        }
        .tp-accessories {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          margin-top: 6px;
        }
        .tp-accessory {
          padding: 4px 6px;
          border: 1px solid var(--border);
          background: #fff;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s;
        }
        .tp-accessory.active {
          background: var(--primary);
          color: white;
        }
        .tp-accessory:hover {
          transform: scale(1.1);
        }
        .pet-accessory {
          position: absolute;
          top: -8px;
          right: -8px;
          font-size: 16px;
          transform: rotate(15deg);
        }
        .tp-chat {
          border-top: 1px solid var(--border);
          margin-top: 8px;
          padding-top: 8px;
        }
        .tp-chat-bubble {
          background: #f0f9ff;
          border: 1px solid #bfdbfe;
          border-radius: 12px;
          padding: 8px 12px;
          margin-bottom: 8px;
          font-size: 12px;
          line-height: 1.4;
          position: relative;
        }
        .tp-chat-bubble:before {
          content: '';
          position: absolute;
          top: -5px;
          left: 12px;
          border: 5px solid transparent;
          border-bottom-color: #bfdbfe;
        }
        .tp-help-buttons {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 4px;
          margin-top: 6px;
        }
        .tp-help-btn {
          padding: 6px 8px;
          border: 1px solid var(--border);
          background: #fff;
          border-radius: 8px;
          cursor: pointer;
          font-size: 10px;
          text-align: center;
        }
        .tp-help-btn:hover {
          background: #f8fafc;
        }
        @keyframes tp-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .tamapet.heart .tamapet-emo {
          animation: tp-pop 0.9s ease both;
        }
        @keyframes tp-pop {
          0% { opacity: 0; transform: translateY(4px) scale(0.8); }
          30% { opacity: 1; transform: translateY(-2px) scale(1.05); }
          100% { opacity: 0; transform: translateY(-12px) scale(0.9); }
        }
      `}</style>

      <div className={`tamapet ${showEmotion ? 'heart' : ''}`} data-testid="dot-pet">
        <div 
          className="tamapet-bubble" 
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsOpen(!isOpen);
            }
          }}
          tabIndex={0}
          role="button"
          title="펫 열기/닫기"
          data-testid="pet-bubble"
        >
          <svg viewBox="0 0 16 16" className="tamapet-sprite" aria-hidden="true">
            <rect x="2" y="3" width="12" height="10" fill="#111"/>
            <rect x="3" y="4" width="10" height="8" fill="var(--pet-body)"/>
            <rect x="6" y="8" width="1" height="1" fill="#111"/>
            <rect x="9" y="8" width="1" height="1" fill="#111"/>
            <rect x="5" y="9" width="2" height="1" fill="#f2b4b4"/>
            <rect x="9" y="9" width="2" height="1" fill="#f2b4b4"/>
            <rect x="8" y="2" width="1" height="2" fill="#111"/>
            <rect x="9" y="2" width="2" height="1" fill="#111"/>
            <rect x="7" y="1" width="2" height="1" fill="var(--pet-light)"/>
          </svg>
          <div className="tamapet-emo" aria-hidden="true">{emotion}</div>
          {getCurrentAccessory() && (
            <div className="pet-accessory">{getCurrentAccessory()}</div>
          )}
        </div>

        <div className="tamapet-panel">
          <div className="tp-head">
            <strong>{petState.name}</strong>
            <span className="tp-mood">{getMood(petState)}</span>
          </div>
          
          {/* Chat helper section */}
          {showChat && (
            <div className="tp-chat">
              <div className="tp-chat-bubble">
                {chatMessage}
              </div>
            </div>
          )}

          <div className="tp-chat">
            <button 
              className="tp-btn" 
              onClick={showHelp}
              data-testid="pet-help"
              style={{ width: '100%', marginBottom: '8px' }}
            >
              💬 도토에게 도움 요청하기
            </button>
            <div className="tp-help-buttons">
              {quickHelps.map((help, idx) => (
                <button
                  key={idx}
                  className="tp-help-btn"
                  onClick={() => showQuickHelp(help)}
                  data-testid={`quick-help-${idx}`}
                >
                  {help.text}
                </button>
              ))}
            </div>
          </div>
          <div className="tp-bars">
            <label>배고픔</label>
            <div className="bar">
              <span style={{ width: `${100 - petState.hungry}%` }}></span>
            </div>
            <label>청결</label>
            <div className="bar">
              <span style={{ width: `${petState.clean}%` }}></span>
            </div>
            <label>에너지</label>
            <div className="bar">
              <span style={{ width: `${petState.energy}%` }}></span>
            </div>
            <label>즐거움</label>
            <div className="bar">
              <span style={{ width: `${petState.fun}%` }}></span>
            </div>
          </div>
          <div className="tp-actions">
            <button 
              className="tp-btn" 
              onClick={() => doAction('feed')}
              data-testid="pet-feed"
            >
              🍪 밥주기
            </button>
            <button 
              className="tp-btn" 
              onClick={() => doAction('wash')}
              data-testid="pet-wash"
            >
              🫧 씻기기
            </button>
            <button 
              className="tp-btn" 
              onClick={() => doAction('play')}
              data-testid="pet-play"
            >
              🎮 놀아주기
            </button>
            <button 
              className="tp-btn" 
              onClick={() => doAction('nap')}
              data-testid="pet-nap"
            >
              💤 낮잠
            </button>
          </div>

          {/* Customization section */}
          {isCustomizing ? (
            <div className="tp-customize">
              <div className="tp-name-edit">
                <input
                  className="tp-name-input"
                  placeholder="새 이름 입력"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') savePetName();
                    if (e.key === 'Escape') setIsCustomizing(false);
                  }}
                  data-testid="pet-name-input"
                />
                <button 
                  className="tp-save-btn" 
                  onClick={savePetName}
                  data-testid="pet-save-name"
                >
                  저장
                </button>
              </div>
              <div className="tp-accessories">
                {accessories.map(acc => (
                  <button
                    key={acc.id}
                    className={`tp-accessory ${petState.accessory === acc.id ? 'active' : ''}`}
                    onClick={() => changeAccessory(acc.id)}
                    title={acc.name}
                    data-testid={`accessory-${acc.id}`}
                  >
                    {acc.emoji || '×'}
                  </button>
                ))}
              </div>
              <div className="tp-actions" style={{ marginTop: '8px' }}>
                <button 
                  className="tp-btn" 
                  onClick={() => doAction('randomColor')}
                  data-testid="pet-random-color"
                >
                  🎨 색상 변경
                </button>
                <button 
                  className="tp-btn" 
                  onClick={() => doAction('randomPersonality')}
                  data-testid="pet-random-personality"
                >
                  🌟 성격 변경
                </button>
              </div>
              <button 
                className="tp-btn" 
                onClick={() => setIsCustomizing(false)}
                style={{ width: '100%', marginTop: '6px' }}
                data-testid="pet-close-customize"
              >
                닫기
              </button>
            </div>
          ) : (
            <div className="tp-customize">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>성격: {petState.personality}</span>
                <button 
                  className="tp-btn" 
                  onClick={() => {
                    setTempName(petState.name);
                    setIsCustomizing(true);
                  }}
                  data-testid="pet-customize"
                  style={{ padding: '4px 8px', fontSize: '10px' }}
                >
                  ⚙️ 꾸미기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}