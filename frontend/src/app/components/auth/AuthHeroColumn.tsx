import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { AUTH_HERO_SHOWCASE_ITEMS } from "../../utils/collectionState";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { PickxelLogo } from "../PickxelLogo";

type Variant = "login" | "signup";

const copy: Record<
  Variant,
  { eyebrow: string; title: string; subtitle: string }
> = {
  login: {
    eyebrow: "Pick · Sell 크리에이티브 네트워크",
    title: "작품을 고르고,\n협업을 이어가세요",
    subtitle: "피드, 메시지, 프로젝트까지 한 흐름으로 연결됩니다.",
  },
  signup: {
    eyebrow: "pickxel에 오신 것을 환영합니다",
    title: "프로필 한 번으로\n시작할 수 있어요",
    subtitle: "역할만 정하면 디자이너와 클라이언트가 같은 공간에서 만납니다.",
  },
};

const SHOWCASE_INTERVAL_MS = 5200;

const blurTransition = {
  duration: 0.72,
  ease: [0.22, 1, 0.36, 1] as const,
};

function HeroShowcaseStrip({ isNight, reduce }: { isNight: boolean; reduce: boolean }) {
  const items = AUTH_HERO_SHOWCASE_ITEMS;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, SHOWCASE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [items.length]);

  const active = items[index]!;
  const frameBorder = isNight ? "border-white/12 shadow-[0_16px_40px_rgba(0,0,0,0.35)]" : "border-black/[0.08] shadow-[0_14px_36px_rgba(15,15,15,0.1)]";
  const overlayBg = isNight ? "bg-gradient-to-t from-[#0a0f1c]/95 via-[#0a0f1c]/35 to-transparent" : "bg-gradient-to-t from-[#0F0F0F]/88 via-[#0F0F0F]/25 to-transparent";
  const chipClass = isNight ? "bg-white/12 text-[#B8F5E8]" : "bg-white/90 text-[#007C69]";

  const imageTransition = reduce ? { duration: 0.22 } : blurTransition;
  const imageInitial = reduce
    ? { opacity: 0.88 }
    : { opacity: 0.9, filter: "blur(12px)", scale: 1.04 };
  const imageAnimate = reduce
    ? { opacity: 1 }
    : { opacity: 1, filter: "blur(0px)", scale: 1 };
  const imageExit = reduce
    ? { opacity: 0.88 }
    : { opacity: 0.85, filter: "blur(11px)", scale: 1.03 };

  return (
    <div className="flex w-full max-w-[220px] flex-col items-center gap-2.5">
      <div
        className={`relative aspect-[4/3] w-full overflow-hidden rounded-xl border ${frameBorder}`}
        aria-roledescription="carousel"
        aria-label="픽셀 피드 예시 작품"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active.id}
            className="absolute inset-0 overflow-hidden"
            initial={imageInitial}
            animate={imageAnimate}
            exit={imageExit}
            transition={imageTransition}
          >
            <ImageWithFallback
              src={active.image}
              alt=""
              className="size-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </motion.div>
        </AnimatePresence>
        <div className={`pointer-events-none absolute inset-0 ${overlayBg}`} />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active.id}
            className="pointer-events-none absolute inset-x-0 bottom-0 px-3 pb-3 pt-10 text-left"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 3 }}
            transition={
              reduce
                ? { duration: 0.16 }
                : { duration: 0.42, delay: 0.14, ease: [0.22, 1, 0.36, 1] }
            }
          >
            <p className={`mb-1 inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${chipClass}`}>
              {active.category}
            </p>
            <p className="font-display text-[13px] font-bold leading-snug text-white line-clamp-2">
              {active.title}
            </p>
          </motion.div>
        </AnimatePresence>
        <span className="sr-only" aria-live="polite">
          {active.title}
        </span>
      </div>
      <div className="flex items-center justify-center gap-1.5" aria-hidden>
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setIndex(i)}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === index
                ? isNight
                  ? "w-5 bg-[#7EE8D0]"
                  : "w-5 bg-[#00C9A7]"
                : isNight
                  ? "w-1.5 bg-white/25 hover:bg-white/40"
                  : "w-1.5 bg-[#0F0F0F]/20 hover:bg-[#0F0F0F]/35"
            }`}
            aria-label={`예시 작품 ${i + 1}번 보기`}
          />
        ))}
      </div>
    </div>
  );
}

export function AuthHeroColumn({ variant, isNight }: { variant: Variant; isNight: boolean }) {
  const reduce = useReducedMotion();
  const c = copy[variant];

  const panel = isNight
    ? "border-white/10 bg-gradient-to-b from-[#151c32]/95 to-[#0c1228]/95 shadow-[0_32px_100px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.06)]"
    : "border-black/[0.07] bg-gradient-to-br from-white via-[#f8fdfb] to-[#fff8f5] shadow-[0_32px_100px_rgba(15,15,15,0.07),inset_0_1px_0_rgba(255,255,255,0.9)]";

  const titleClass = isNight ? "text-white" : "text-[#0F0F0F]";
  const subClass = isNight ? "text-white/65" : "text-[var(--brand-landing-text-sub)]";
  const eyebrowClass = isNight ? "text-[#7EE8D0]" : "text-[#007C69]";

  return (
    <div
      className={`relative hidden min-h-[min(640px,calc(100vh-8rem))] flex-col overflow-hidden rounded-[28px] border p-10 lg:flex ${panel}`}
    >
      <motion.div
        aria-hidden
        className={`absolute -right-16 top-1/4 h-64 w-64 rounded-full blur-3xl ${
          isNight ? "bg-[#00C9A7]/25" : "bg-[#00C9A7]/30"
        }`}
        animate={reduce ? undefined : { scale: [1, 1.08, 1], opacity: [0.5, 0.75, 0.5] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className={`absolute -left-10 bottom-1/4 h-56 w-56 rounded-full blur-3xl ${
          isNight ? "bg-[#FF5C3A]/20" : "bg-[#FF5C3A]/25"
        }`}
        animate={reduce ? undefined : { scale: [1.05, 1, 1.05] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {!reduce && (
        <motion.div
          aria-hidden
          className={`absolute left-1/2 top-1/2 size-[min(420px,85%)] -translate-x-1/2 -translate-y-1/2 rounded-full border ${
            isNight ? "border-[#00C9A7]/15" : "border-[#00C9A7]/20"
          }`}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
        />
      )}

      <div className="relative z-10 shrink-0">
        <PickxelLogo dark={isNight} />
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center py-5">
        <HeroShowcaseStrip isNight={isNight} reduce={reduce} />
      </div>

      <div className="relative z-10 shrink-0 pt-4">
        <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${eyebrowClass}`}>{c.eyebrow}</p>
        <h2
          className={`font-display mt-5 whitespace-pre-line text-4xl font-black leading-[1.08] tracking-tight lg:text-[2.75rem] ${titleClass}`}
        >
          {c.title}
        </h2>
        <p className={`mt-5 max-w-md text-base leading-relaxed ${subClass}`}>{c.subtitle}</p>
      </div>
    </div>
  );
}
