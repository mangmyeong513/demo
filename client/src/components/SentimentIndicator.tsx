interface SentimentIndicatorProps {
  sentimentScore?: number;
  sentimentConfidence?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showConfidence?: boolean;
}

export function SentimentIndicator({ 
  sentimentScore, 
  sentimentConfidence, 
  size = 'sm',
  showLabel = false,
  showConfidence = false 
}: SentimentIndicatorProps) {
  if (!sentimentScore) return null;

  const getSentimentEmoji = (rating: number): string => {
    switch (rating) {
      case 1: return "😔"; // Very negative
      case 2: return "😕"; // Negative
      case 3: return "😐"; // Neutral
      case 4: return "😊"; // Positive
      case 5: return "😍"; // Very positive
      default: return "😐";
    }
  };

  const getSentimentColor = (rating: number): string => {
    switch (rating) {
      case 1: return "#ef4444"; // red-500
      case 2: return "#f97316"; // orange-500
      case 3: return "#6b7280"; // gray-500
      case 4: return "#22c55e"; // green-500
      case 5: return "#8b5cf6"; // purple-500
      default: return "#6b7280";
    }
  };

  const getSentimentLabel = (rating: number): string => {
    switch (rating) {
      case 1: return "매우 부정적";
      case 2: return "부정적";
      case 3: return "중립적";
      case 4: return "긍정적";
      case 5: return "매우 긍정적";
      default: return "분석 안됨";
    }
  };

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  const emoji = getSentimentEmoji(sentimentScore);
  const color = getSentimentColor(sentimentScore);
  const label = getSentimentLabel(sentimentScore);

  return (
    <div 
      className={`inline-flex items-center gap-1 ${sizeClasses[size]}`}
      style={{ color }}
      data-testid={`sentiment-indicator-${sentimentScore}`}
    >
      <span 
        className="select-none"
        title={`감정 점수: ${sentimentScore}/5${sentimentConfidence ? ` (신뢰도: ${sentimentConfidence}%)` : ''}`}
        data-testid={`sentiment-emoji-${sentimentScore}`}
      >
        {emoji}
      </span>
      
      {showLabel && (
        <span 
          className="text-xs font-medium"
          data-testid={`sentiment-label-${sentimentScore}`}
        >
          {label}
        </span>
      )}
      
      {showConfidence && sentimentConfidence && (
        <span 
          className="text-xs opacity-70"
          data-testid={`sentiment-confidence-${sentimentConfidence}`}
        >
          ({sentimentConfidence}%)
        </span>
      )}
    </div>
  );
}