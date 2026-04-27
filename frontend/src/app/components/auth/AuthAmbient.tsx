import { motion, useReducedMotion } from "motion/react";

/** 인증 화면 배경: 느린 메시 그라데이션·오브 (제품 액센트 톤) */
export function AuthAmbient({ isNight }: { isNight: boolean }) {
  const reduce = useReducedMotion();

  return (
    <>
      <motion.div
        aria-hidden
        className={`pointer-events-none absolute inset-0 z-0 ${
          isNight ? "opacity-[0.35]" : "opacity-[0.55]"
        }`}
        style={{
          background: isNight
            ? "conic-gradient(from 200deg at 70% 20%, rgba(0,201,167,0.14), transparent 40%, rgba(255,92,58,0.1), transparent 70%)"
            : "conic-gradient(from 230deg at 25% 35%, rgba(0,201,167,0.18), transparent 45%, rgba(255,92,58,0.12), transparent 72%)",
        }}
        animate={reduce ? undefined : { rotate: [0, 360] }}
        transition={{ duration: 140, repeat: Infinity, ease: "linear" }}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,var(--brand-landing-glow-mint),transparent)] ${
          isNight ? "opacity-30" : "opacity-50"
        }`}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_100%,var(--brand-landing-glow-coral),transparent)] ${
          isNight ? "opacity-25" : "opacity-40"
        }`}
      />
    </>
  );
}
