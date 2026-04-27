import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { PickxelLogo } from "../PickxelLogo";
import { cn } from "./utils";

function initialPointerClient() {
  if (typeof window === "undefined") {
    return { x: 0, y: 0 };
  }
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

export type AnimatedCharactersLoginHeroProps = {
  isNight: boolean;
  emailFieldFocused: boolean;
  password: string;
  showPassword: boolean;
  /** true면 전환만 짧게(몸·얼굴·눈 모두 포인터 추적은 동일하게 유지). */
  reduceMotion?: boolean;
};

interface PupilProps {
  size?: number;
  maxDistance?: number;
  pupilColor?: string;
  forceLookX?: number;
  forceLookY?: number;
  reduceMotion?: boolean;
}

function Pupil({
  size = 12,
  maxDistance = 5,
  pupilColor = "black",
  forceLookX,
  forceLookY,
  reduceMotion = false,
}: PupilProps) {
  const init = initialPointerClient();
  const [mouseX, setMouseX] = useState(init.x);
  const [mouseY, setMouseY] = useState(init.y);
  /** 고정된 눈 중심(흰자 없음) — EyeBall과 같이 transform은 자식만 적용 */
  const socketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, []);

  const calculatePupilPosition = () => {
    if (!socketRef.current) return { x: 0, y: 0 };
    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }
    const socket = socketRef.current.getBoundingClientRect();
    const centerX = socket.left + socket.width / 2;
    const centerY = socket.top + socket.height / 2;
    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);
    const angle = Math.atan2(deltaY, deltaX);
    return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
  };

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={socketRef}
      className="flex items-center justify-center"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <div
        className="rounded-full"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: pupilColor,
          transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
          transition: reduceMotion ? "none" : "transform 0.08s ease-out",
        }}
      />
    </div>
  );
}

interface EyeBallProps {
  size?: number;
  pupilSize?: number;
  maxDistance?: number;
  eyeColor?: string;
  pupilColor?: string;
  isBlinking?: boolean;
  forceLookX?: number;
  forceLookY?: number;
  reduceMotion?: boolean;
}

function EyeBall({
  size = 48,
  pupilSize = 16,
  maxDistance = 10,
  eyeColor = "white",
  pupilColor = "black",
  isBlinking = false,
  forceLookX,
  forceLookY,
  reduceMotion = false,
}: EyeBallProps) {
  const init = initialPointerClient();
  const [mouseX, setMouseX] = useState(init.x);
  const [mouseY, setMouseY] = useState(init.y);
  const eyeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, []);

  const calculatePupilPosition = () => {
    if (!eyeRef.current) return { x: 0, y: 0 };
    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }
    const eye = eyeRef.current.getBoundingClientRect();
    const eyeCenterX = eye.left + eye.width / 2;
    const eyeCenterY = eye.top + eye.height / 2;
    const deltaX = mouseX - eyeCenterX;
    const deltaY = mouseY - eyeCenterY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);
    const angle = Math.atan2(deltaY, deltaX);
    return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
  };

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={eyeRef}
      className="flex items-center justify-center rounded-full transition-all duration-150"
      style={{
        width: `${size}px`,
        height: isBlinking ? "2px" : `${size}px`,
        backgroundColor: eyeColor,
        overflow: "hidden",
      }}
    >
      {!isBlinking && (
        <div
          className="rounded-full"
          style={{
            width: `${pupilSize}px`,
            height: `${pupilSize}px`,
            backgroundColor: pupilColor,
            transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
            transition: reduceMotion ? "none" : "transform 0.08s ease-out",
          }}
        />
      )}
    </div>
  );
}

export function AnimatedCharactersLoginHero({
  isNight,
  emailFieldFocused,
  password,
  showPassword,
  reduceMotion = false,
}: AnimatedCharactersLoginHeroProps) {
  const isTyping = emailFieldFocused;
  const pointerInit = initialPointerClient();
  const [mouseX, setMouseX] = useState(pointerInit.x);
  const [mouseY, setMouseY] = useState(pointerInit.y);
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);
  const purpleRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const yellowRef = useRef<HTMLDivElement>(null);
  const orangeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, []);

  useEffect(() => {
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000;
    const scheduleBlink = () =>
      window.setTimeout(() => {
        setIsPurpleBlinking(true);
        window.setTimeout(() => {
          setIsPurpleBlinking(false);
          scheduleBlink();
        }, 150);
      }, getRandomBlinkInterval());
    const timeout = scheduleBlink();
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000;
    const scheduleBlink = () =>
      window.setTimeout(() => {
        setIsBlackBlinking(true);
        window.setTimeout(() => {
          setIsBlackBlinking(false);
          scheduleBlink();
        }, 150);
      }, getRandomBlinkInterval());
    const timeout = scheduleBlink();
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (isTyping) {
      setIsLookingAtEachOther(true);
      const timer = window.setTimeout(() => setIsLookingAtEachOther(false), 800);
      return () => window.clearTimeout(timer);
    }
    setIsLookingAtEachOther(false);
    return undefined;
  }, [isTyping]);

  useEffect(() => {
    if (password.length === 0 || !showPassword) {
      setIsPurplePeeking(false);
      return undefined;
    }
    let cancelled = false;
    let outerId = 0;

    const schedulePeek = () => {
      outerId = window.setTimeout(() => {
        if (cancelled) return;
        setIsPurplePeeking(true);
        window.setTimeout(() => {
          if (cancelled) return;
          setIsPurplePeeking(false);
          schedulePeek();
        }, 800);
      }, Math.random() * 3000 + 2000);
    };

    schedulePeek();
    return () => {
      cancelled = true;
      window.clearTimeout(outerId);
    };
  }, [password, showPassword]);

  const calculatePosition = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 3;
    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;
    const faceX = Math.max(-15, Math.min(15, deltaX / 20));
    const faceY = Math.max(-10, Math.min(10, deltaY / 30));
    const bodySkew = Math.max(-6, Math.min(6, -deltaX / 120));
    return { faceX, faceY, bodySkew };
  };

  const purplePos = calculatePosition(purpleRef);
  const blackPos = calculatePosition(blackRef);
  const yellowPos = calculatePosition(yellowRef);
  const orangePos = calculatePosition(orangeRef);

  const panelGradient = isNight
    ? "from-[#0d1426] via-[#00C9A7]/30 to-[#1a1530] text-white"
    : "from-[#0d3d38] via-[#0f766e] to-[#FF5C3A]/25 text-primary-foreground";

  const footerMuted = isNight ? "text-white/55" : "text-primary-foreground/60";
  const charBodyMotion = reduceMotion ? "transition-all duration-150 ease-out" : "transition-all duration-700 ease-in-out";
  const charFaceMotionShort = reduceMotion ? "transition-all duration-100 ease-out" : "transition-all duration-200 ease-out";

  return (
    <div
      className={cn(
        "relative hidden h-full min-h-0 w-full flex-col justify-between overflow-hidden p-8 sm:p-10 lg:flex lg:min-h-[calc(100dvh-5.5rem)] lg:p-12",
        "bg-gradient-to-br",
        panelGradient,
      )}
    >
      <div className="relative z-20 inline-block max-w-full">
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute -left-4 -top-3 -z-10 h-28 w-[min(100%,18rem)] rounded-[2rem] sm:h-32 sm:w-[20rem]",
            isNight
              ? "bg-[radial-gradient(ellipse_95%_100%_at_15%_15%,rgba(0,0,0,0.42),transparent_68%)]"
              : "bg-[radial-gradient(ellipse_110%_100%_at_0%_0%,rgba(15,23,42,0.26),transparent_68%)]",
          )}
        />
        <PickxelLogo dark={isNight} className="relative min-w-0" />
      </div>

      <div className="relative z-20 flex h-[min(420px,52vh)] items-end justify-center pb-2">
        <div className="relative" style={{ width: "min(100%, 550px)", height: "400px" }}>
          <div
            ref={purpleRef}
            className={cn("absolute bottom-0", charBodyMotion)}
            style={{
              left: "70px",
              width: "180px",
              height: isTyping || (password.length > 0 && !showPassword) ? "440px" : "400px",
              backgroundColor: "#6C3FF5",
              borderRadius: "10px 10px 0 0",
              zIndex: 1,
              transform:
                password.length > 0 && showPassword
                  ? "skewX(0deg)"
                  : isTyping || (password.length > 0 && !showPassword)
                    ? `skewX(${(purplePos.bodySkew || 0) - 12}deg) translateX(40px)`
                    : `skewX(${purplePos.bodySkew || 0}deg)`,
              transformOrigin: "bottom center",
            }}
          >
            <div
              className={cn("absolute flex gap-8", charBodyMotion)}
              style={{
                left:
                  password.length > 0 && showPassword
                    ? 20
                    : isLookingAtEachOther
                      ? 55
                      : 45 + purplePos.faceX,
                top:
                  password.length > 0 && showPassword
                    ? 35
                    : isLookingAtEachOther
                      ? 65
                      : 40 + purplePos.faceY,
              }}
            >
              <EyeBall
                size={18}
                pupilSize={7}
                maxDistance={5}
                eyeColor="white"
                pupilColor="#2D2D2D"
                isBlinking={isPurpleBlinking}
                reduceMotion={reduceMotion}
                forceLookX={
                  password.length > 0 && showPassword
                    ? isPurplePeeking
                      ? 4
                      : -4
                    : isLookingAtEachOther
                      ? 3
                      : undefined
                }
                forceLookY={
                  password.length > 0 && showPassword
                    ? isPurplePeeking
                      ? 5
                      : -4
                    : isLookingAtEachOther
                      ? 4
                      : undefined
                }
              />
              <EyeBall
                size={18}
                pupilSize={7}
                maxDistance={5}
                eyeColor="white"
                pupilColor="#2D2D2D"
                isBlinking={isPurpleBlinking}
                reduceMotion={reduceMotion}
                forceLookX={
                  password.length > 0 && showPassword
                    ? isPurplePeeking
                      ? 4
                      : -4
                    : isLookingAtEachOther
                      ? 3
                      : undefined
                }
                forceLookY={
                  password.length > 0 && showPassword
                    ? isPurplePeeking
                      ? 5
                      : -4
                    : isLookingAtEachOther
                      ? 4
                      : undefined
                }
              />
            </div>
          </div>

          <div
            ref={blackRef}
            className={cn("absolute bottom-0", charBodyMotion)}
            style={{
              left: "240px",
              width: "120px",
              height: "310px",
              backgroundColor: "#2D2D2D",
              borderRadius: "8px 8px 0 0",
              zIndex: 2,
              transform:
                password.length > 0 && showPassword
                  ? "skewX(0deg)"
                  : isLookingAtEachOther
                    ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
                    : isTyping || (password.length > 0 && !showPassword)
                      ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)`
                      : `skewX(${blackPos.bodySkew || 0}deg)`,
              transformOrigin: "bottom center",
            }}
          >
            <div
              className={cn("absolute flex gap-6", charBodyMotion)}
              style={{
                left:
                  password.length > 0 && showPassword ? 10 : isLookingAtEachOther ? 32 : 26 + blackPos.faceX,
                top:
                  password.length > 0 && showPassword ? 28 : isLookingAtEachOther ? 12 : 32 + blackPos.faceY,
              }}
            >
              <EyeBall
                size={16}
                pupilSize={6}
                maxDistance={4}
                eyeColor="white"
                pupilColor="#2D2D2D"
                isBlinking={isBlackBlinking}
                reduceMotion={reduceMotion}
                forceLookX={password.length > 0 && showPassword ? -4 : isLookingAtEachOther ? 0 : undefined}
                forceLookY={password.length > 0 && showPassword ? -4 : isLookingAtEachOther ? -4 : undefined}
              />
              <EyeBall
                size={16}
                pupilSize={6}
                maxDistance={4}
                eyeColor="white"
                pupilColor="#2D2D2D"
                isBlinking={isBlackBlinking}
                reduceMotion={reduceMotion}
                forceLookX={password.length > 0 && showPassword ? -4 : isLookingAtEachOther ? 0 : undefined}
                forceLookY={password.length > 0 && showPassword ? -4 : isLookingAtEachOther ? -4 : undefined}
              />
            </div>
          </div>

          <div
            ref={orangeRef}
            className={cn("absolute bottom-0", charBodyMotion)}
            style={{
              left: "0px",
              width: "240px",
              height: "200px",
              zIndex: 3,
              backgroundColor: "#FF9B6B",
              borderRadius: "120px 120px 0 0",
              transform: password.length > 0 && showPassword ? "skewX(0deg)" : `skewX(${orangePos.bodySkew || 0}deg)`,
              transformOrigin: "bottom center",
            }}
          >
            <div
              className={cn("absolute flex gap-8", charFaceMotionShort)}
              style={{
                left: password.length > 0 && showPassword ? 50 : 82 + (orangePos.faceX || 0),
                top: password.length > 0 && showPassword ? 85 : 90 + (orangePos.faceY || 0),
              }}
            >
              <Pupil
                size={12}
                maxDistance={5}
                pupilColor="#2D2D2D"
                reduceMotion={reduceMotion}
                forceLookX={password.length > 0 && showPassword ? -5 : undefined}
                forceLookY={password.length > 0 && showPassword ? -4 : undefined}
              />
              <Pupil
                size={12}
                maxDistance={5}
                pupilColor="#2D2D2D"
                reduceMotion={reduceMotion}
                forceLookX={password.length > 0 && showPassword ? -5 : undefined}
                forceLookY={password.length > 0 && showPassword ? -4 : undefined}
              />
            </div>
          </div>

          <div
            ref={yellowRef}
            className={cn("absolute bottom-0", charBodyMotion)}
            style={{
              left: "310px",
              width: "140px",
              height: "230px",
              backgroundColor: "#E8D754",
              borderRadius: "70px 70px 0 0",
              zIndex: 4,
              transform: password.length > 0 && showPassword ? "skewX(0deg)" : `skewX(${yellowPos.bodySkew || 0}deg)`,
              transformOrigin: "bottom center",
            }}
          >
            <div
              className={cn("absolute flex gap-6", charFaceMotionShort)}
              style={{
                left: password.length > 0 && showPassword ? 20 : 52 + (yellowPos.faceX || 0),
                top: password.length > 0 && showPassword ? 35 : 40 + (yellowPos.faceY || 0),
              }}
            >
              <Pupil
                size={12}
                maxDistance={5}
                pupilColor="#2D2D2D"
                reduceMotion={reduceMotion}
                forceLookX={password.length > 0 && showPassword ? -5 : undefined}
                forceLookY={password.length > 0 && showPassword ? -4 : undefined}
              />
              <Pupil
                size={12}
                maxDistance={5}
                pupilColor="#2D2D2D"
                reduceMotion={reduceMotion}
                forceLookX={password.length > 0 && showPassword ? -5 : undefined}
                forceLookY={password.length > 0 && showPassword ? -4 : undefined}
              />
            </div>
            <div
              className={cn("absolute h-1 w-20 rounded-full bg-[#2D2D2D]", charFaceMotionShort)}
              style={{
                left: password.length > 0 && showPassword ? 10 : 40 + (yellowPos.faceX || 0),
                top: password.length > 0 && showPassword ? 88 : 88 + (yellowPos.faceY || 0),
              }}
            />
          </div>
        </div>
      </div>

      <div className={cn("relative z-20 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm", footerMuted)}>
        <span className="cursor-default" title="페이지 준비 중입니다">
          개인정보처리방침
        </span>
        <span className="cursor-default" title="페이지 준비 중입니다">
          이용약관
        </span>
        <Link to="/" className={cn("transition-colors", isNight ? "hover:text-white" : "hover:text-primary-foreground")}>
          홈으로
        </Link>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[size:20px_20px] bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] opacity-40" />
      <div className="pointer-events-none absolute right-1/4 top-1/4 size-64 rounded-full bg-primary-foreground/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-1/4 left-1/4 size-96 rounded-full bg-primary-foreground/5 blur-3xl" />
    </div>
  );
}
