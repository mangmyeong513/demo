import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerUserSchema, loginUserSchema, quickRegisterUserSchema, type RegisterUser, type LoginUser, type QuickRegisterUser } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/useAuth";
import LoadingPage from "@/components/LoadingPage";

export function AuthWall() {
  const { loginMutation, registerMutation } = useAuth();

  const loginForm = useForm<LoginUser>({
    resolver: zodResolver(loginUserSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterUser>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      username: "",
      password: "",
      firstName: "",
    },
  });

  const quickRegisterForm = useForm<QuickRegisterUser>({
    resolver: zodResolver(quickRegisterUserSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onLogin = (data: LoginUser) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterUser) => {
    registerMutation.mutate(data);
  };

  const onQuickRegister = (data: QuickRegisterUser) => {
    registerMutation.mutate(data);
  };

  // 로딩 상태 체크
  if (loginMutation.isPending || registerMutation.isPending) {
    return (
      <LoadingPage
        message={loginMutation.isPending ? "로그인 중..." : "계정 생성 중..."}
        variant="fullscreen"
        showLogo={true}
      />
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4" 
      style={{ 
        background: "linear-gradient(135deg, var(--gradient-from) 0%, var(--gradient-to) 100%)" 
      }}
      data-testid="auth-wall"
    >
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-[var(--primary)] rounded-full flex items-center justify-center">
            <span className="text-2xl">🌟</span>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-[var(--foreground)]">
              ovra
            </CardTitle>
            <CardDescription className="text-[var(--muted-foreground)]">
              레트로 감성이 가득한 따뜻한 커뮤니티에 오신 것을 환영합니다!
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login">로그인</TabsTrigger>
              <TabsTrigger value="quick-register">빠른가입</TabsTrigger>
              <TabsTrigger value="register">상세가입</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4 mt-6">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>사용자명</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="등록한 사용자명"
                            data-testid="input-username" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>비밀번호</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="password" 
                            placeholder="비밀번호를 입력하세요"
                            data-testid="input-password" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full btn-mango text-lg py-3"
                    disabled={loginMutation.isPending}
                    data-testid="button-login"
                  >
                    {loginMutation.isPending ? (
                      <>
                        <i className="bi bi-arrow-clockwise animate-spin mr-2"></i>
                        로그인 중...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-door-open mr-2"></i>
                        들어가기
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="quick-register" className="space-y-4 mt-6">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">
                  사용자명과 비밀번호만으로 빠르게 시작하세요! ⚡
                </p>
              </div>
              <Form {...quickRegisterForm}>
                <form onSubmit={quickRegisterForm.handleSubmit(onQuickRegister)} className="space-y-4">
                  <FormField
                    control={quickRegisterForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>사용자명</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="다른 사람들이 볼 수 있는 이름"
                            data-testid="input-quick-register-username" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={quickRegisterForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>비밀번호</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="password" 
                            placeholder="4자 이상 입력해주세요"
                            data-testid="input-quick-register-password" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full btn-mango text-lg py-3"
                    disabled={registerMutation.isPending}
                    data-testid="button-quick-register"
                  >
                    {registerMutation.isPending ? (
                      <>
                        <i className="bi bi-arrow-clockwise animate-spin mr-2"></i>
                        가입 중...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-lightning mr-2"></i>
                        빠른 가입
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4 mt-6">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">
                  간단한 정보만으로 바로 시작하세요! ✨
                </p>
              </div>
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>사용자명</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="다른 사람들이 볼 수 있는 이름"
                            data-testid="input-register-username" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>비밀번호</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="password" 
                            placeholder="4자 이상 입력해주세요"
                            data-testid="input-register-password" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>닉네임 (선택사항)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            value={field.value || ""} 
                            placeholder="어떻게 불러드릴까요?"
                            data-testid="input-register-nickname" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full btn-mango text-lg py-3"
                    disabled={registerMutation.isPending}
                    data-testid="button-register"
                  >
                    {registerMutation.isPending ? (
                      <>
                        <i className="bi bi-arrow-clockwise animate-spin mr-2"></i>
                        가입 중...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-heart-fill mr-2"></i>
                        Ovra 시작하기
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
          
          <div className="text-center space-y-3 pt-4 border-t">
            <h3 className="font-semibold text-[var(--foreground)] text-sm">
              🌟 Ovra에서 만나보세요
            </h3>
            <div className="flex justify-center gap-4 text-xs text-[var(--muted-foreground)]">
              <span>📝 레트로 포스팅</span>
              <span>💬 따뜻한 대화</span>
              <span>🎵 빈티지 문화</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}