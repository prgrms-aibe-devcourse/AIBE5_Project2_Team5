import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * 탐색(Explore) 페이지와 동일한 Lenis 설정을 앱 전역에 적용합니다.
 * Home 랜딩의 ScrollTrigger는 lenis.scroll 이벤트에서 update 됩니다.
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
      /** `overflow`가 있는 내부 영역(메시지·모달·사이드 패널 등)에서 휠 스크롤이 동작하도록 */
      allowNestedScroll: true,
    });

    const unsubScroll = lenis.on("scroll", ScrollTrigger.update);

    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    let rafId = requestAnimationFrame(raf);

    const onResize = () => {
      lenis.resize();
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      unsubScroll();
      window.removeEventListener("resize", onResize);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
