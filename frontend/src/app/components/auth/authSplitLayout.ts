/** 스플릿 인증 페이지(로그인·회원가입) 공통 폼 패널 — 라이트는 shadcn 토큰, 나이트는 피드 카드 톤에 맞춤 */
export function getAuthSplitFormPanelClass(isNight: boolean): string {
  return isNight
    ? "rounded-xl border border-white/10 bg-[#1a1f2e]/95 p-6 shadow-sm backdrop-blur-md"
    : "rounded-xl border border-border bg-card/80 p-6 shadow-sm backdrop-blur-md";
}
