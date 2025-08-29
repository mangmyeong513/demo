import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Assessment, AssessmentResult } from "@shared/schema";

interface AssessmentCardProps {
  assessmentId: string;
  onClose?: () => void;
}

interface Question {
  id: number;
  question: string;
  type: string;
  options: {
    id: string;
    text: string;
    score: Record<string, number>;
  }[];
}

interface ResultType {
  type: string;
  title: string;
  description: string;
  traits: string[];
  compatibility: string[];
  color: string;
}

export function AssessmentCard({ assessmentId, onClose }: AssessmentCardProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<ResultType | null>(null);
  
  const queryClient = useQueryClient();

  const { data: assessment, isLoading } = useQuery<Assessment>({
    queryKey: ['/api/assessments', assessmentId],
  });

  const submitMutation = useMutation({
    mutationFn: async (assessmentAnswers: Record<number, string>) => {
      // Calculate scores
      const questions = assessment?.questions as Question[];
      const scores: Record<string, number> = {};
      
      Object.entries(assessmentAnswers).forEach(([questionId, answerId]) => {
        const question = questions.find(q => q.id === parseInt(questionId));
        const option = question?.options.find(opt => opt.id === answerId);
        
        if (option?.score) {
          Object.entries(option.score).forEach(([trait, value]) => {
            scores[trait] = (scores[trait] || 0) + value;
          });
        }
      });

      // Find the result type with highest score
      const results = assessment?.results as ResultType[];
      let maxScore = 0;
      let selectedResult = results[0];
      
      results.forEach(resultType => {
        const typeScore = Object.keys(scores).reduce((sum, trait) => {
          return sum + (scores[trait] || 0);
        }, 0);
        
        if (typeScore > maxScore) {
          maxScore = typeScore;
          selectedResult = resultType;
        }
      });

      const response = await apiRequest(`/api/assessments/${assessmentId}/submit`, 'POST', {
        answers: assessmentAnswers,
        resultType: selectedResult.type,
        score: maxScore,
      });

      return { result: selectedResult, submission: response };
    },
    onSuccess: ({ result }) => {
      setResult(result);
      setShowResult(true);
      queryClient.invalidateQueries({ queryKey: ['/api/users/me/assessments'] });
    },
  });

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
        </CardContent>
      </Card>
    );
  }

  if (!assessment) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <p className="text-[var(--muted-foreground)]">테스트를 찾을 수 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  const questions = assessment.questions as Question[];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  if (showResult && result) {
    return (
      <Card className="w-full max-w-2xl mx-auto" data-testid="assessment-result">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl" style={{ color: result.color }}>
            {result.title}
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            {result.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold mb-3 text-[var(--foreground)]">특징</h4>
            <div className="flex flex-wrap gap-2">
              {result.traits.map((trait, index) => (
                <Badge 
                  key={index} 
                  variant="secondary"
                  style={{ backgroundColor: `${result.color}20`, color: result.color }}
                >
                  {trait}
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3 text-[var(--foreground)]">잘 맞는 유형</h4>
            <div className="flex flex-wrap gap-2">
              {result.compatibility.map((comp, index) => (
                <Badge 
                  key={index} 
                  variant="outline"
                  className="border-2"
                  style={{ borderColor: result.color, color: result.color }}
                >
                  {comp}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button 
              onClick={onClose}
              variant="outline"
              className="flex-1"
              data-testid="button-close-result"
            >
              닫기
            </Button>
            <Button 
              onClick={() => {
                setShowResult(false);
                setCurrentQuestionIndex(0);
                setAnswers({});
                setResult(null);
              }}
              className="flex-1"
              data-testid="button-retake-assessment"
            >
              다시 하기
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleAnswerSelect = (answerId: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answerId
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Submit assessment
      submitMutation.mutate(answers);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const isAnswered = answers[currentQuestion.id] !== undefined;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <Card className="w-full max-w-2xl mx-auto" data-testid="assessment-card">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-xl">{assessment.title}</CardTitle>
          <span className="text-sm text-[var(--muted-foreground)]">
            {currentQuestionIndex + 1} / {questions.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-[var(--foreground)]">
            {currentQuestion.question}
          </h3>
          
          <RadioGroup
            value={answers[currentQuestion.id] || ""}
            onValueChange={handleAnswerSelect}
            data-testid="question-options"
          >
            {currentQuestion.options.map((option) => (
              <div key={option.id} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-[var(--accent)] transition-colors">
                <RadioGroupItem 
                  value={option.id} 
                  id={option.id}
                  data-testid={`option-${option.id}`}
                />
                <Label 
                  htmlFor={option.id} 
                  className="flex-1 cursor-pointer text-[var(--foreground)]"
                >
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            variant="outline"
            data-testid="button-previous"
          >
            이전
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!isAnswered || submitMutation.isPending}
            className="flex-1"
            data-testid="button-next"
          >
            {submitMutation.isPending 
              ? "결과 계산 중..." 
              : isLastQuestion 
                ? "결과 보기" 
                : "다음"
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}