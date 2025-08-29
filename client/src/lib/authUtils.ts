export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

export function handleAuthError(error: Error, toast: any, onClose?: () => void) {
  if (isUnauthorizedError(error)) {
    toast({
      title: "로그인 필요",
      description: "로그인이 필요합니다. 다시 로그인해주세요.",
      variant: "destructive",
    });
    if (onClose) onClose();
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 1500);
    return true;
  }
  return false;
}

export function createAuthErrorHandler(toast: any, onClose?: () => void) {
  return (error: Error) => {
    const handled = handleAuthError(error, toast, onClose);
    if (!handled) {
      toast({
        title: "오류",
        description: "요청 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };
}