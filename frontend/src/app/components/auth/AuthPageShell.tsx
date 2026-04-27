import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { DayNightSwitch } from "../DayNightSwitch";
import { useAuthSurface } from "./useAuthSurface";
import { AuthAmbient } from "./AuthAmbient";

type AuthPageShellProps = {
  children: ReactNode;
  /** 좌우 스플릿 레이아웃(로그인 등): Ambient·블롭·전역 그리드 생략 */
  variant?: "default" | "split";
};

export function AuthPageShell({ children, variant = "default" }: AuthPageShellProps) {
  const s = useAuthSurface();
  const reduce = useReducedMotion();
  const isSplit = variant === "split";

  return (
    <div
      className={`relative min-h-screen overflow-hidden transition-colors duration-700 ${s.pageRoot}`}
    >
      {!isSplit && (
        <>
          <AuthAmbient isNight={s.isNight} />
          <div
            aria-hidden
            className={`pointer-events-none absolute -left-32 top-[12%] h-[min(30rem,60vh)] w-[min(30rem,60vw)] rounded-full blur-3xl ${s.blobMint}`}
          />
          <div
            aria-hidden
            className={`pointer-events-none absolute -right-28 bottom-[8%] h-[min(26rem,50vh)] w-[min(26rem,50vw)] rounded-full blur-3xl ${s.blobCoral}`}
          />
          <div className={s.gridOverlay} />
        </>
      )}
      <motion.div
        aria-hidden
        className="absolute inset-x-0 top-0 z-[1] h-[3px] bg-[linear-gradient(90deg,#00C9A7,#FF5C3A,#00C9A7)]"
        initial={false}
        animate={reduce ? undefined : { opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10">
        {!isSplit && (
          <div className="mx-auto flex max-w-[1440px] items-center justify-end px-4 pt-5 sm:px-8">
            <DayNightSwitch isNight={s.isNight} onToggle={s.toggle} />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
