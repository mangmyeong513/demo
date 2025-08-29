import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { Assessment, AssessmentResult } from "@shared/schema";
import { AssessmentCard } from "./AssessmentCard";

export function AssessmentsList() {
  const [selectedAssessment, setSelectedAssessment] = useState<string | null>(null);

  const { data: assessments = [], isLoading: loadingAssessments } = useQuery<Assessment[]>({
    queryKey: ['/api/assessments'],
  });

  const { data: userResults = [] } = useQuery<AssessmentResult[]>({
    queryKey: ['/api/users/me/assessments'],
  });

  if (selectedAssessment) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <Button
            onClick={() => setSelectedAssessment(null)}
            variant="outline"
            size="sm"
            data-testid="button-back-to-list"
          >
            ← 목록으로
          </Button>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">성격 테스트</h2>
        </div>
        
        <AssessmentCard 
          assessmentId={selectedAssessment}
          onClose={() => setSelectedAssessment(null)}
        />
      </div>
    );
  }

  if (loadingAssessments) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-center text-[var(--foreground)]">🧠 성격 테스트</h2>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
        </div>
      </div>
    );
  }

  const hasCompletedAssessment = (assessmentId: string) => {
    return userResults.some(result => result.assessmentId === assessmentId);
  };

  const getUserResult = (assessmentId: string) => {
    return userResults.find(result => result.assessmentId === assessmentId);
  };

  return (
    <div className="space-y-6" data-testid="assessments-list">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[var(--foreground)]">🧠 성격 테스트</h2>
        <p className="text-[var(--muted-foreground)]">
          나만의 레트로 성격을 발견해보세요!
        </p>
      </div>

      <div className="grid gap-4">
        {assessments.map((assessment) => {
          const isCompleted = hasCompletedAssessment(assessment.id);
          const userResult = getUserResult(assessment.id);
          
          return (
            <Card 
              key={assessment.id} 
              className="hover:shadow-md transition-shadow border border-[var(--border)]"
              data-testid={`assessment-${assessment.id}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-lg text-[var(--foreground)]">
                      {assessment.title}
                    </CardTitle>
                    <CardDescription className="text-[var(--muted-foreground)]">
                      {assessment.description}
                    </CardDescription>
                  </div>
                  {isCompleted && (
                    <Badge 
                      variant="secondary" 
                      className="bg-green-100 text-green-800 border-green-200"
                      data-testid="badge-completed"
                    >
                      완료
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                {isCompleted && userResult ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-[var(--accent)] rounded-lg">
                      <p className="text-sm text-[var(--muted-foreground)] mb-1">내 결과:</p>
                      <p className="font-semibold text-[var(--foreground)]">{userResult.resultType}</p>
                    </div>
                    <Button
                      onClick={() => setSelectedAssessment(assessment.id)}
                      variant="outline"
                      className="w-full"
                      data-testid="button-view-result"
                    >
                      결과 다시 보기
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => setSelectedAssessment(assessment.id)}
                    className="w-full"
                    data-testid="button-start-assessment"
                  >
                    테스트 시작하기
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {assessments.length === 0 && (
        <Card>
          <CardContent className="text-center p-8">
            <p className="text-[var(--muted-foreground)]">
              현재 이용 가능한 테스트가 없습니다.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}