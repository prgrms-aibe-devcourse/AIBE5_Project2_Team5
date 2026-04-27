/** 인증·비밀번호·OAuth 화면 공통 표면 클래스 (라이트 / 다크) */

export type AuthSurface = ReturnType<typeof getAuthSurface>;

export function getAuthSurface(isNight: boolean) {
  return {
    pageRoot: isNight
      ? "bg-[#0C1222] text-[var(--brand-landing-night-text)]"
      : "bg-[var(--brand-landing-bg)] text-[var(--brand-landing-text)]",

    gridOverlay: isNight
      ? "absolute inset-0 opacity-50 [background-image:linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:44px_44px]"
      : "absolute inset-0 opacity-60 [background-image:linear-gradient(90deg,rgba(15,15,15,0.03)_1px,transparent_1px),linear-gradient(rgba(15,15,15,0.03)_1px,transparent_1px)] [background-size:44px_44px]",

    blobMint: isNight ? "bg-[#00C9A7]/8" : "bg-[#00C9A7]/12",
    blobCoral: isNight ? "bg-[#FF5C3A]/8" : "bg-[#FF5C3A]/10",

    heading: isNight ? "text-white" : "text-[#0F0F0F]",
    subheading: isNight ? "text-white/70" : "text-[#404040]",
    muted: isNight ? "text-white/55" : "text-[#525252]",
    link: isNight ? "text-[#7EE8D0] hover:text-[#A8F5E4]" : "text-[#007C69] hover:text-[#006B5C]",

    card: isNight
      ? "rounded-[28px] border border-white/[0.12] bg-gradient-to-b from-[#1a2240]/98 to-[#141d30]/98 shadow-[0_28px_90px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-2xl"
      : "rounded-[28px] border border-black/[0.07] bg-white/92 shadow-[0_28px_90px_rgba(15,15,15,0.09),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-xl",

    successBanner: isNight
      ? "rounded-xl border border-[#00C9A7]/35 bg-[#00C9A7]/10 text-[#7EE8D0]"
      : "rounded-xl border border-[#A8F0E4] bg-[#F0FDF9] text-[#006B5C]",

    label: isNight
      ? "mb-2 block text-base font-medium text-white/90"
      : "mb-2 block text-base font-medium text-[#2D2A26]",

    input: (error: boolean) =>
      [
        "h-12 min-h-[3rem] w-full rounded-2xl border px-12 text-base outline-none transition-[box-shadow,border-color] duration-300 focus:border-[#00C9A7] focus:shadow-[0_0_0_4px_rgba(0,201,167,0.14)]",
        isNight
          ? `bg-white/[0.06] text-white placeholder:text-white/35 ${
              error ? "border-[#FF5C3A]" : "border-white/12"
            }`
          : `bg-white/95 ${error ? "border-[#FF5C3A]" : "border-gray-200/90"}`,
      ].join(" "),

    iconInput: isNight ? "text-white/40" : "text-gray-400",

    divider: isNight ? "bg-white/12" : "bg-gray-200",

    modalOverlay:
      "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md supports-[backdrop-filter]:bg-black/45",

    modalCard: isNight
      ? "w-full max-w-md rounded-[28px] border border-white/[0.12] bg-gradient-to-b from-[#1e2744] to-[#141d30] p-6 sm:max-w-lg sm:p-8 shadow-[0_32px_100px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.06)]"
      : "w-full max-w-md rounded-[28px] border border-black/[0.08] bg-white/95 p-6 sm:max-w-lg sm:p-8 shadow-[0_32px_100px_rgba(15,15,15,0.12)] backdrop-blur-xl",

    modalTitle: isNight ? "text-white" : "text-[#0F0F0F]",
    modalBody: isNight ? "text-white/65" : "text-[#404040]",

    closeButton: isNight
      ? "rounded-xl p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
      : "rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900",

    ghostButton: isNight
      ? "h-12 min-h-[3rem] flex-1 rounded-2xl border border-white/15 bg-white/[0.06] text-base font-semibold text-white transition-colors hover:bg-white/11"
      : "h-12 min-h-[3rem] flex-1 rounded-2xl border border-gray-200/90 bg-white/90 text-base font-semibold text-[#2D2A26] transition-colors hover:bg-gray-50/90",

    primaryButton:
      "h-12 min-h-[3rem] rounded-2xl bg-gradient-to-r from-[#00C9A7] to-[#00B89A] text-base font-semibold text-[#0F0F0F] shadow-[0_12px_32px_rgba(0,201,167,0.28)] transition-[transform,filter,opacity] duration-200 hover:brightness-[1.03] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100",

    socialGoogle: isNight
      ? "flex h-12 min-h-[3rem] w-full items-center justify-center gap-3 rounded-2xl border border-white/14 bg-white/[0.07] px-4 text-base font-medium text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-[transform,background-color] duration-200 hover:bg-white/12"
      : "flex h-12 min-h-[3rem] w-full items-center justify-center gap-3 rounded-2xl border border-gray-200/90 bg-white px-4 text-base font-medium text-[#2D2A26] shadow-[0_8px_24px_rgba(15,15,15,0.06)] transition-[transform,box-shadow] duration-200 hover:shadow-[0_12px_28px_rgba(15,15,15,0.1)]",

    hintBox: isNight
      ? "rounded-lg bg-white/5 px-3 py-2 text-sm text-white/60"
      : "rounded-lg bg-[#F7F7F5] px-3 py-2 text-sm text-[#525252]",

    roleCardIdle: isNight
      ? "border-white/12 bg-white/5 hover:border-[#00C9A7]/40"
      : "border-gray-200 bg-white hover:border-[#00C9A7]/50",

    roleCardSelected: isNight
      ? "border-[#00C9A7] bg-[#00C9A7]/15 shadow-lg shadow-[#00C9A7]/10"
      : "border-[#00C9A7] bg-[#A8F0E4]/20 shadow-lg shadow-[#00C9A7]/10",

    roleIconWrap: (selected: boolean) =>
      selected
        ? "bg-[#00C9A7] text-[#0F0F0F]"
        : isNight
          ? "bg-white/10 text-white/60"
          : "bg-gray-100 text-gray-600",

    errorText: isNight
      ? "text-sm font-medium text-[#FF8A6E]"
      : "text-sm font-medium text-[#FF5C3A]",
    errorBanner: isNight
      ? "rounded-xl bg-[#FF5C3A]/15 px-4 py-3 text-sm font-medium text-[#FFAA95]"
      : "rounded-xl bg-[#FFF7F4] px-4 py-3 text-sm font-medium text-[#FF5C3A]",

    showcaseFrame: isNight
      ? "border border-white/10 shadow-[0_28px_64px_rgba(0,0,0,0.5)]"
      : "border border-black/10 shadow-[0_28px_64px_rgba(15,15,15,0.28)]",

    floatingPixelBorder: isNight ? "border-white/10" : "border-white/80",
  };
}
