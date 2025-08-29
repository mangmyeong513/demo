import { useState, useEffect } from "react";

interface SmartTagSuggestionsProps {
  content: string;
  onTagSelect: (tag: string) => void;
  selectedTags: string[];
}

export function SmartTagSuggestions({ content, onTagSelect, selectedTags }: SmartTagSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // AI 기능을 태그 제안으로 재활용
  useEffect(() => {
    if (content.length > 10) {
      // 간단한 키워드 분석으로 태그 제안
      const keywords = extractKeywords(content);
      setSuggestions(keywords.filter(tag => !selectedTags.includes(tag)));
    } else {
      setSuggestions([]);
    }
  }, [content, selectedTags]);

  const extractKeywords = (text: string): string[] => {
    const commonTags = [
      "일상", "음식", "여행", "사진", "음악", "영화", "책", "운동", 
      "패션", "뷰티", "취미", "공부", "직장", "친구", "가족", "펜트",
      "카페", "맛집", "풍경", "셀카", "ootd", "홈카페", "독서", "요리"
    ];

    const suggestedTags: string[] = [];
    
    // 텍스트에서 키워드 감지
    if (text.includes("음식") || text.includes("맛있") || text.includes("요리")) {
      suggestedTags.push("음식", "맛집");
    }
    if (text.includes("여행") || text.includes("휴가") || text.includes("여행길")) {
      suggestedTags.push("여행", "풍경");
    }
    if (text.includes("카페") || text.includes("커피")) {
      suggestedTags.push("카페", "홈카페");
    }
    if (text.includes("책") || text.includes("독서")) {
      suggestedTags.push("책", "독서");
    }
    if (text.includes("운동") || text.includes("헬스")) {
      suggestedTags.push("운동", "건강");
    }
    
    // 일반적인 태그 무작위 추가
    if (suggestedTags.length < 3) {
      const remaining = commonTags.filter(tag => !suggestedTags.includes(tag));
      const randomTags = remaining.sort(() => 0.5 - Math.random()).slice(0, 3 - suggestedTags.length);
      suggestedTags.push(...randomTags);
    }

    return suggestedTags.slice(0, 4);
  };

  if (suggestions.length === 0) return null;

  return (
    <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
      <div className="flex items-center gap-2 mb-2">
        <i className="bi bi-lightbulb text-blue-600"></i>
        <span className="text-sm font-medium text-blue-700">스마트 태그 제안</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((tag) => (
          <button
            key={tag}
            onClick={() => onTagSelect(tag)}
            className="px-3 py-1 bg-white border border-blue-300 rounded-lg text-sm text-blue-700 hover:bg-blue-100 transition-all duration-200 transform hover:scale-105"
            style={{ transformStyle: 'preserve-3d' }}
          >
            #{tag}
          </button>
        ))}
      </div>
    </div>
  );
}