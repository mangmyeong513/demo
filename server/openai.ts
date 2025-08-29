import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface SentimentAnalysis {
  rating: number; // 1-5 scale (1=very negative, 5=very positive)
  confidence: number; // 0-100 confidence percentage
}

export async function analyzeSentiment(text: string): Promise<SentimentAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a sentiment analysis expert. Analyze the sentiment of Korean text and provide a rating from 1 to 5 and a confidence score between 0 and 100.

Rating scale:
1 = Very negative (매우 부정적)
2 = Negative (부정적) 
3 = Neutral (중립적)
4 = Positive (긍정적)
5 = Very positive (매우 긍정적)

Respond with JSON in this exact format: { "rating": number, "confidence": number }

Consider Korean cultural context and language nuances when analyzing sentiment.`
        },
        {
          role: "user",
          content: text,
        },
      ],
      response_format: { type: "json_object" },
      // Removed temperature parameter as gpt-5 only supports default value
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      rating: Math.max(1, Math.min(5, Math.round(result.rating || 3))),
      confidence: Math.max(0, Math.min(100, Math.round(result.confidence || 50))),
    };
  } catch (error) {
    console.error("Sentiment analysis failed:", error);
    // Return neutral sentiment as fallback
    return {
      rating: 3,
      confidence: 0,
    };
  }
}

export function getSentimentEmoji(rating: number): string {
  switch (rating) {
    case 1: return "😔"; // Very negative
    case 2: return "😕"; // Negative
    case 3: return "😐"; // Neutral
    case 4: return "😊"; // Positive
    case 5: return "😍"; // Very positive
    default: return "😐";
  }
}

export function getSentimentColor(rating: number): string {
  switch (rating) {
    case 1: return "#ef4444"; // red-500
    case 2: return "#f97316"; // orange-500
    case 3: return "#6b7280"; // gray-500
    case 4: return "#22c55e"; // green-500
    case 5: return "#8b5cf6"; // purple-500
    default: return "#6b7280";
  }
}

export function getSentimentLabel(rating: number): string {
  switch (rating) {
    case 1: return "매우 부정적";
    case 2: return "부정적";
    case 3: return "중립적";
    case 4: return "긍정적";
    case 5: return "매우 긍정적";
    default: return "분석 안됨";
  }
}