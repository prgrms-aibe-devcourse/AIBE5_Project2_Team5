import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  forwardRef,
} from "react";
import { X, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "./utils";

export interface Project {
  id: string;
  image: string;
  title: string;
}

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200";

export const PICKXEL_FOLDER_GRADIENTS = [
  "linear-gradient(135deg, #e73827, #f85032)",
  "linear-gradient(to right, #f7b733, #fc4a1a)",
  "linear-gradient(135deg, #00c6ff, #0072ff)",
  "linear-gradient(to right, #414345, #232526)",
  "linear-gradient(135deg, #8e2de2, #4a00e0)",
  "linear-gradient(135deg, #f80759, #bc4e9c)",
  "linear-gradient(135deg, #00C9A7, #00A88C)",
] as const;

export function getFolderGradient(index: number): string {
  return PICKXEL_FOLDER_GRADIENTS[index % PICKXEL_FOLDER_GRADIENTS.length];
}

/** 슬롯이 아닌 컬렉션 ID 기준(순서 바꿔도 각 폴더 색이 따라감) */
export function getFolderGradientByFolderId(folderId: number): string {
  const len = PICKXEL_FOLDER_GRADIENTS.length;
  const n = ((Math.trunc(folderId) % len) + len) % len;
  return PICKXEL_FOLDER_GRADIENTS[n];
}

interface ProjectCardProps {
  image: string;
  title: string;
  delay: number;
  isVisible: boolean;
  index: number;
  totalCount: number;
  onClick: () => void;
  isSelected: boolean;
}

const ProjectCard = forwardRef<HTMLDivElement, ProjectCardProps>(
  (
    { image, title, delay, isVisible, index, totalCount, onClick, isSelected },
    ref
  ) => {
    const middleIndex = (totalCount - 1) / 2;
    const factor = totalCount > 1 ? (index - middleIndex) / middleIndex : 0;
    const rotation = factor * 25;
    const translationX = factor * 85;
    const translationY = Math.abs(factor) * 12;

    return (
      <div
        ref={ref}
        className={cn("group/card absolute h-28 w-20 cursor-pointer", isSelected && "opacity-0")}
        style={{
          transform: isVisible
            ? `translateY(calc(-100px + ${translationY}px)) translateX(${translationX}px) rotate(${rotation}deg) scale(1)`
            : "translateY(0px) translateX(0px) rotate(0deg) scale(0.4)",
          opacity: isSelected ? 0 : isVisible ? 1 : 0,
          transition: `all 700ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
          zIndex: 10 + index,
          left: "-40px",
          top: "-56px",
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <div
          className={cn(
            "relative h-full w-full overflow-hidden rounded-lg border border-white/5 bg-card shadow-xl",
            "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
            "group-hover/card:scale-125 group-hover/card:-translate-y-6 group-hover/card:shadow-2xl group-hover/card:shadow-accent/40 group-hover/card:ring-2 group-hover/card:ring-accent"
          )}
        >
          <img
            src={image || PLACEHOLDER_IMAGE}
            alt={title}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          <p className="absolute bottom-1.5 left-1.5 right-1.5 truncate text-[9px] font-black uppercase tracking-tighter text-white drop-shadow-md">
            {title}
          </p>
        </div>
      </div>
    );
  }
);
ProjectCard.displayName = "ProjectCard";

interface ImageLightboxProps {
  projects: Project[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  sourceRect: DOMRect | null;
  onCloseComplete?: () => void;
  onNavigate: (index: number) => void;
  onViewProject?: () => void;
  viewProjectLabel: string;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({
  projects,
  currentIndex,
  isOpen,
  onClose,
  sourceRect,
  onCloseComplete,
  onNavigate,
  onViewProject,
  viewProjectLabel,
}) => {
  const [animationPhase, setAnimationPhase] = useState<"initial" | "animating" | "complete">("initial");
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [internalIndex, setInternalIndex] = useState(currentIndex);
  const [isSliding, setIsSliding] = useState(false);

  const totalProjects = projects.length;
  const hasNext = internalIndex < totalProjects - 1;
  const hasPrev = internalIndex > 0;
  const currentProject = projects[internalIndex];

  useEffect(() => {
    if (isOpen && currentIndex !== internalIndex && !isSliding) {
      setIsSliding(true);
      const timer = window.setTimeout(() => {
        setInternalIndex(currentIndex);
        setIsSliding(false);
      }, 400);
      return () => window.clearTimeout(timer);
    }
  }, [currentIndex, isOpen, internalIndex, isSliding]);

  useEffect(() => {
    if (isOpen) {
      setInternalIndex(currentIndex);
      setIsSliding(false);
    }
  }, [isOpen, currentIndex]);

  const navigateNext = useCallback(() => {
    if (internalIndex >= totalProjects - 1 || isSliding) return;
    onNavigate(internalIndex + 1);
  }, [internalIndex, totalProjects, isSliding, onNavigate]);

  const navigatePrev = useCallback(() => {
    if (internalIndex <= 0 || isSliding) return;
    onNavigate(internalIndex - 1);
  }, [internalIndex, isSliding, onNavigate]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    onClose();
    window.setTimeout(() => {
      setIsClosing(false);
      setShouldRender(false);
      setAnimationPhase("initial");
      onCloseComplete?.();
    }, 500);
  }, [onClose, onCloseComplete]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowRight") navigateNext();
      if (e.key === "ArrowLeft") navigatePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    if (isOpen) document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleClose, navigateNext, navigatePrev]);

  useLayoutEffect(() => {
    if (isOpen && sourceRect) {
      setShouldRender(true);
      setAnimationPhase("initial");
      setIsClosing(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimationPhase("animating");
        });
      });
      const timer = window.setTimeout(() => {
        setAnimationPhase("complete");
      }, 700);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen, sourceRect]);

  const handleDotClick = (idx: number) => {
    if (isSliding || idx === internalIndex) return;
    onNavigate(idx);
  };

  if (!shouldRender || !currentProject) return null;

  const getInitialStyles = (): React.CSSProperties => {
    if (!sourceRect) return {};
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const targetWidth = Math.min(800, viewportWidth - 64);
    const targetHeight = Math.min(viewportHeight * 0.85, 600);
    const targetX = (viewportWidth - targetWidth) / 2;
    const targetY = (viewportHeight - targetHeight) / 2;
    const scaleX = sourceRect.width / targetWidth;
    const scaleY = sourceRect.height / targetHeight;
    const scale = Math.max(scaleX, scaleY);
    const translateX =
      sourceRect.left + sourceRect.width / 2 - (targetX + targetWidth / 2) + window.scrollX;
    const translateY =
      sourceRect.top + sourceRect.height / 2 - (targetY + targetHeight / 2) + window.scrollY;
    return {
      transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
      opacity: 0.5,
      borderRadius: "12px",
    };
  };

  const getFinalStyles = (): React.CSSProperties => ({
    transform: "translate(0, 0) scale(1)",
    opacity: 1,
    borderRadius: "24px",
  });

  const currentStyles =
    animationPhase === "initial" && !isClosing ? getInitialStyles() : getFinalStyles();

  return (
    <div
      className={cn("fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8")}
      onClick={handleClose}
      style={{
        opacity: isClosing ? 0 : 1,
        transition: "opacity 500ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div
        className="bg-background/90 absolute inset-0 backdrop-blur-2xl"
        style={{
          opacity: animationPhase === "initial" && !isClosing ? 0 : 1,
          transition: "opacity 600ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        className={cn(
          "text-foreground bg-muted/30 border-white/10 absolute right-6 top-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border shadow-2xl backdrop-blur-xl transition-all duration-300 hover:bg-muted"
        )}
        style={{
          opacity: animationPhase === "complete" && !isClosing ? 1 : 0,
          transform: animationPhase === "complete" && !isClosing ? "translateY(0)" : "translateY(-30px)",
          transition:
            "opacity 400ms ease-out 400ms, transform 500ms cubic-bezier(0.16, 1, 0.3, 1) 400ms",
        }}
        type="button"
        aria-label="닫기"
      >
        <X className="h-5 w-5" strokeWidth={2.5} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigatePrev();
        }}
        disabled={!hasPrev || isSliding}
        className={cn(
          "text-foreground bg-muted/30 border-white/10 absolute left-4 z-50 flex h-14 w-14 items-center justify-center rounded-full border shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-110 active:scale-95 disabled:pointer-events-none disabled:opacity-0 md:left-10"
        )}
        type="button"
        style={{
          opacity: animationPhase === "complete" && !isClosing && hasPrev ? 1 : 0,
          transform: animationPhase === "complete" && !isClosing ? "translateX(0)" : "translateX(-40px)",
          transition:
            "opacity 400ms ease-out 600ms, transform 500ms cubic-bezier(0.16, 1, 0.3, 1) 600ms",
        }}
        aria-label="이전"
      >
        <ChevronLeft className="h-6 w-6" strokeWidth={3} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigateNext();
        }}
        disabled={!hasNext || isSliding}
        className={cn(
          "text-foreground bg-muted/30 border-white/10 absolute right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full border shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-110 active:scale-95 disabled:pointer-events-none disabled:opacity-0 md:right-10"
        )}
        type="button"
        style={{
          opacity: animationPhase === "complete" && !isClosing && hasNext ? 1 : 0,
          transform: animationPhase === "complete" && !isClosing ? "translateX(0)" : "translateX(40px)",
          transition:
            "opacity 400ms ease-out 600ms, transform 500ms cubic-bezier(0.16, 1, 0.3, 1) 600ms",
        }}
        aria-label="다음"
      >
        <ChevronRight className="h-6 w-6" strokeWidth={3} />
      </button>
      <div
        className="relative z-10 w-full max-w-4xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          ...currentStyles,
          transform: isClosing ? "translate(0, 0) scale(0.92)" : currentStyles.transform,
          transition:
            animationPhase === "initial" && !isClosing
              ? "none"
              : "transform 700ms cubic-bezier(0.16, 1, 0.3, 1), opacity 600ms ease-out, border-radius 700ms ease",
          transformOrigin: "center center",
        }}
      >
        <div
          className={cn(
            "bg-card border-white/10 relative overflow-hidden rounded-[inherit] border shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)]"
          )}
        >
          <div className="relative aspect-[4/3] overflow-hidden md:aspect-[16/10]">
            <div
              className="flex h-full w-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                transform: `translateX(-${internalIndex * 100}%)`,
                transition: isSliding ? "transform 500ms cubic-bezier(0.16, 1, 0.3, 1)" : "none",
              }}
            >
              {projects.map((project) => (
                <div key={project.id} className="relative h-full min-w-full">
                  <img
                    src={project.image || PLACEHOLDER_IMAGE}
                    alt={project.title}
                    className="h-full w-full select-none object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                    }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
                </div>
              ))}
            </div>
          </div>
          <div
            className={cn("bg-card border-white/5 border-t px-8 py-7")}
            style={{
              opacity: animationPhase === "complete" && !isClosing ? 1 : 0,
              transform: animationPhase === "complete" && !isClosing ? "translateY(0)" : "translateY(40px)",
              transition: "opacity 500ms ease-out 500ms, transform 600ms cubic-bezier(0.16, 1, 0.3, 1) 500ms",
            }}
          >
            <div className="flex items-center justify-between gap-6">
              <div className="min-w-0 flex-1">
                <h3 className="text-foreground truncate text-2xl font-bold tracking-tight">{currentProject?.title}</h3>
                <div className="mt-2 flex items-center gap-4">
                  <div className="bg-muted border-white/5 flex items-center gap-1.5 rounded-full border px-2.5 py-1">
                    {projects.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleDotClick(idx)}
                        className={cn(
                          "h-1.5 w-1.5 rounded-full transition-all duration-500",
                          idx === internalIndex
                            ? "bg-foreground scale-150"
                            : "bg-muted-foreground/30 hover:bg-muted-foreground/60"
                        )}
                        aria-label={`${idx + 1}번째`}
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground/60 text-xs font-bold uppercase tracking-widest">
                    {internalIndex + 1} / {totalProjects}
                  </p>
                </div>
              </div>
              {onViewProject ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewProject();
                  }}
                  className={cn(
                    "text-primary-foreground bg-primary hover:brightness-110 flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold uppercase tracking-widest shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-105 active:scale-95"
                  )}
                >
                  <span>{viewProjectLabel}</span>
                  <ExternalLink className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export type AnimatedFolderProps = {
  title: string;
  projects: Project[];
  className?: string;
  /** 선형 그라데이션 등. 없으면 브랜드/테마 CSS 변수 */
  gradient?: string;
  /** API의 itemCount(미리보기 개수와 다를 수 있음) */
  itemCount?: number;
  /** 보조 메타(예: 업데이트 시각) */
  metaLine?: string;
  /** 미리보기 0일 때 문구 */
  emptyHint?: string;
  /** 하단 '호버' 힌트 */
  showHoverHint?: boolean;
  /** 라이트박스에서 '컬렉션 열기' 등 */
  onViewProject?: () => void;
  viewProjectLabel?: string;
  countLabel?: string;
  /** NightMode 등 커스텀 다크 배경—텍스트 대비(foreground 토큰이 어두울 때) */
  isNight?: boolean;
};

const AnimatedFolder: React.FC<AnimatedFolderProps> = ({
  title,
  projects,
  className,
  gradient,
  itemCount: itemCountProp,
  metaLine,
  emptyHint = "아직 저장된 피드가 없어요. Feed에서 북마크해보세요.",
  showHoverHint = true,
  onViewProject,
  viewProjectLabel = "컬렉션 열기",
  countLabel = "피드",
  isNight = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [sourceRect, setSourceRect] = useState<DOMRect | null>(null);
  const [hiddenCardId, setHiddenCardId] = useState<string | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const displayCount = itemCountProp ?? projects.length;
  const previewProjects = projects.slice(0, 5);

  const handleProjectClick = (project: Project, index: number) => {
    const cardEl = cardRefs.current[index];
    if (cardEl) setSourceRect(cardEl.getBoundingClientRect());
    setSelectedIndex(index);
    setHiddenCardId(project.id);
  };

  const handleCloseLightbox = () => {
    setSelectedIndex(null);
    setSourceRect(null);
  };
  const handleCloseComplete = () => {
    setHiddenCardId(null);
  };
  const handleNavigate = (newIndex: number) => {
    setSelectedIndex(newIndex);
    setHiddenCardId(projects[newIndex]?.id || null);
  };

  const backBg = gradient || "linear-gradient(135deg, var(--folder-back) 0%, var(--folder-tab) 100%)";
  const tabBg = gradient || "var(--folder-tab)";
  const frontBg = gradient || "linear-gradient(135deg, var(--folder-front) 0%, var(--folder-back) 100%)";

  const tTitle = isNight ? "text-white" : "text-foreground";
  const tSub = isNight ? "text-white/80" : "text-muted-foreground";
  const tMeta = isNight ? "text-white/70" : "text-muted-foreground/80";
  const tHover = isNight ? "text-white/50" : "text-muted-foreground/50";

  return (
    <>
      <div
        className={cn(
          "group border-border relative flex min-h-[248px] min-w-[min(100%,15rem)] flex-col items-center justify-center cursor-pointer rounded-2xl border px-3 py-4 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] sm:min-w-[15rem] sm:px-4 sm:py-5 md:px-4 md:py-4 hover:border-accent/40 hover:shadow-2xl hover:shadow-accent/20",
          "bg-card",
          className
        )}
        style={{
          perspective: "1200px",
          transform: isHovered ? "scale(1.04) rotate(-1.5deg)" : "scale(1) rotate(0deg)",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className="absolute inset-0 rounded-2xl transition-opacity duration-700"
          style={{
            background: gradient
              ? `radial-gradient(circle at 50% 70%, ${
                  gradient.match(/#[a-fA-F0-9]{3,8}/)?.[0] || "var(--accent)"
                } 0%, transparent 70%)`
              : "radial-gradient(circle at 50% 70%, var(--accent) 0%, transparent 70%)",
            opacity: isHovered ? 0.12 : 0,
          }}
        />
        <div
          className="relative mb-1 flex w-full max-w-[11.25rem] items-center justify-center sm:mb-1.5 sm:max-w-[12rem]"
          style={{ height: 120 }}
        >
          <div
            className="relative flex items-center justify-center will-change-transform"
            style={{
              width: 200,
              height: 160,
              transform: "scale(0.76)",
              transformOrigin: "50% 55%",
            }}
          >
          <div
            className="border-white/10 absolute h-24 w-32 rounded-lg border shadow-md"
            style={{
              background: backBg,
              filter: gradient ? "brightness(0.9)" : "none",
              transformOrigin: "bottom center",
              transform: isHovered ? "rotateX(-20deg) scaleY(1.05)" : "rotateX(0deg) scaleY(1)",
              transition: "transform 700ms cubic-bezier(0.16, 1, 0.3, 1)",
              zIndex: 10,
            }}
          />
          <div
            className="border-white/10 absolute h-4 w-12 rounded-t-md border-x border-t"
            style={{
              background: tabBg,
              filter: gradient ? "brightness(0.85)" : "none",
              top: "calc(50% - 48px - 12px)",
              left: "calc(50% - 64px + 16px)",
              transformOrigin: "bottom center",
              transform: isHovered
                ? "rotateX(-30deg) translateY(-3px)"
                : "rotateX(0deg) translateY(0)",
              transition: "transform 700ms cubic-bezier(0.16, 1, 0.3, 1)",
              zIndex: 10,
            }}
          />
          <div
            className="absolute"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 20,
            }}
          >
            {previewProjects.map((project, index) => (
              <ProjectCard
                key={project.id}
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                image={project.image}
                title={project.title}
                delay={index * 50}
                isVisible={isHovered}
                index={index}
                totalCount={previewProjects.length}
                onClick={() => handleProjectClick(project, index)}
                isSelected={hiddenCardId === project.id}
              />
            ))}
          </div>
          <div
            className="border-white/20 absolute h-24 w-32 rounded-lg border shadow-lg"
            style={{
              background: frontBg,
              top: "calc(50% - 48px + 4px)",
              transformOrigin: "bottom center",
              transform: isHovered
                ? "rotateX(35deg) translateY(12px)"
                : "rotateX(0deg) translateY(0)",
              transition: "transform 700ms cubic-bezier(0.16, 1, 0.3, 1)",
              zIndex: 30,
            }}
          />
          <div
            className="pointer-events-none absolute h-24 w-32 overflow-hidden rounded-lg"
            style={{
              top: "calc(50% - 48px + 4px)",
              background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 60%)",
              transformOrigin: "bottom center",
              transform: isHovered
                ? "rotateX(35deg) translateY(12px)"
                : "rotateX(0deg) translateY(0)",
              transition: "transform 700ms cubic-bezier(0.16, 1, 0.3, 1)",
              zIndex: 31,
            }}
          />
          </div>
        </div>
        <div className="w-full min-w-0 text-center">
          <h3
            className={cn("mt-1.5 text-base font-bold transition-all duration-500 sm:mt-2 sm:text-[1.05rem]", tTitle)}
            style={{
              transform: isHovered ? "translateY(2px)" : "translateY(0)",
              letterSpacing: isHovered ? "-0.01em" : "0",
            }}
          >
            {title}
          </h3>
          <p
            className={cn("mt-0.5 text-[13px] font-medium leading-snug transition-all duration-500 sm:text-sm", tSub)}
            style={{ opacity: isHovered && !isNight ? 0.8 : isHovered && isNight ? 0.88 : 1 }}
          >
            {displayCount === 0
              ? emptyHint
              : `${countLabel} ${displayCount}개${displayCount === 1 ? "" : ""}`}
          </p>
          {metaLine && displayCount > 0 ? (
            <p className={cn("mt-0.5 text-[11px] font-medium sm:text-xs", tMeta)}>{metaLine}</p>
          ) : null}
          {showHoverHint && displayCount > 0 ? (
            <p
              className={cn("mt-1.5 min-h-[1.125rem] text-[10px] font-semibold uppercase tracking-widest transition-all duration-500 sm:mt-2", tHover)}
              style={{
                opacity: isHovered ? 0 : 1,
                transform: isHovered ? "translateY(3px)" : "translateY(0)",
              }}
            >
              호버
            </p>
          ) : null}
        </div>
      </div>
      <ImageLightbox
        projects={projects}
        currentIndex={selectedIndex ?? 0}
        isOpen={selectedIndex !== null}
        onClose={handleCloseLightbox}
        sourceRect={sourceRect}
        onCloseComplete={handleCloseComplete}
        onNavigate={handleNavigate}
        onViewProject={onViewProject}
        viewProjectLabel={viewProjectLabel}
      />
    </>
  );
};

export { AnimatedFolder };
