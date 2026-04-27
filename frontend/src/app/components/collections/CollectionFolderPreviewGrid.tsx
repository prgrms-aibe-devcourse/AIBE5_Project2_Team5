import { ImageWithFallback } from "../figma/ImageWithFallback";

export type CollectionFolderPreviewVariant = "light" | "dark";

type CollectionFolderPreviewGridProps = {
  previewImageUrls: string[];
  itemCount: number;
  folderName: string;
  variant?: CollectionFolderPreviewVariant;
  className?: string;
};

/**
 * 컬렉션 폴더 카드용 미리보기: 1장은 풀블리드, 2장은 반반, 3장 이상은 균등 2×2 그리드.
 * 남은 피드 개수는 우측 하단 셀에 오버레이로 표시 (얇은 +N 바 없음).
 */
export function CollectionFolderPreviewGrid({
  previewImageUrls,
  itemCount,
  folderName,
  variant = "light",
  className = "",
}: CollectionFolderPreviewGridProps) {
  const isDark = variant === "dark";
  const urls = previewImageUrls.filter(Boolean);
  const thumbs = urls.slice(0, 4);
  const moreCount = Math.max(0, itemCount - thumbs.length);

  const gap = "gap-0.5";
  const roundedCell = "rounded-lg";
  const mutedCell = isDark ? "bg-[#1a2436]" : "bg-[#E5E3DE]";

  if (itemCount <= 0) {
    return null;
  }

  const altAt = (i: number) => `${folderName} 미리보기 ${i + 1}`;

  // 1개: 단일 커버
  if (itemCount === 1) {
    if (!thumbs[0]) {
      return (
        <div
          className={`flex h-full min-h-[14rem] w-full items-center justify-center ${roundedCell} ${mutedCell} ${className}`}
        />
      );
    }
    return (
      <div className={`relative h-full min-h-[14rem] w-full overflow-hidden ${roundedCell} ${className}`}>
        <ImageWithFallback
          src={thumbs[0]}
          alt={altAt(0)}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
    );
  }

  // 2개: 1×2 균등
  if (itemCount === 2) {
    const secondExtra = Math.max(0, itemCount - thumbs.length);
    return (
      <div className={`grid h-full min-h-[14rem] grid-cols-2 grid-rows-1 ${gap} ${className}`}>
        {[0, 1].map((i) => (
          <div key={i} className={`relative min-h-0 overflow-hidden ${roundedCell}`}>
            {thumbs[i] ? (
              <ImageWithFallback
                src={thumbs[i]}
                alt={altAt(i)}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            ) : (
              <div
                className={`flex h-full min-h-[6.5rem] flex-col items-center justify-center ${mutedCell} ${
                  i === 1 && secondExtra > 0 ? "relative" : ""
                }`}
              >
                {i === 1 && secondExtra > 0 ? (
                  <span
                    className={`text-lg font-bold tabular-nums ${isDark ? "text-white/80" : "text-gray-700"}`}
                  >
                    +{secondExtra}
                  </span>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // 3개 이상: 2×2 균등, +N은 우측 하단(인덱스 3)에만
  const cells: (string | null)[] = [0, 1, 2, 3].map((i) => thumbs[i] ?? null);
  const overlayIndex = 3;
  const showMore = moreCount > 0;

  return (
    <div className={`grid h-full min-h-[14rem] grid-cols-2 grid-rows-2 ${gap} ${className}`}>
      {cells.map((src, idx) => {
        const isMoreCell = idx === overlayIndex && showMore;

        if (src) {
          return (
            <div key={idx} className={`relative min-h-0 overflow-hidden ${roundedCell}`}>
              <ImageWithFallback
                src={src}
                alt={altAt(idx)}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              {isMoreCell ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <span className="text-xl font-bold tabular-nums text-white drop-shadow-md sm:text-2xl">
                    +{moreCount}
                  </span>
                </div>
              ) : null}
            </div>
          );
        }

        return (
          <div
            key={idx}
            className={`relative flex min-h-0 items-center justify-center overflow-hidden ${roundedCell} ${mutedCell}`}
          >
            {isMoreCell ? (
              <span
                className={`text-xl font-bold tabular-nums sm:text-2xl ${
                  isDark ? "text-white/85" : "text-gray-700"
                }`}
              >
                +{moreCount}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
