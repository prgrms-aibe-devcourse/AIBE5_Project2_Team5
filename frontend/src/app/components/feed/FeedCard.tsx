import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  ChevronLeft,
  ChevronRight,
  Figma,
  Sparkles,
  ExternalLink,
  ArrowUpRight,
} from "lucide-react";
import { Link } from "react-router";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import type { BaseFeedItem, FeedCardItem } from "../../types/feed";

type FeedCardProps = {
  item: FeedCardItem;
  images: string[];
  activeImageIndex: number;
  isSaved: boolean;
  isNight?: boolean;
  onOpenDetail: (item: FeedCardItem, focusComment?: boolean) => void;
  onMoveCarousel: (item: FeedCardItem, direction: -1 | 1, e?: React.MouseEvent) => void;
  onSelectImage: (feedKey: number, index: number, e: React.MouseEvent) => void;
  onToggleLike: (item: BaseFeedItem, e?: React.MouseEvent) => void;
  isFeedLiked: (item: BaseFeedItem) => boolean;
  getLikeCount: (item: BaseFeedItem) => number;
  getCommentCount: (item: BaseFeedItem) => number;
  onOpenCollectionModal: (item: FeedCardItem, e?: React.MouseEvent) => void;
  onShare: (item: BaseFeedItem, e?: React.MouseEvent) => void;
};

export function FeedCard({
  item,
  images,
  activeImageIndex,
  isSaved,
  isNight = false,
  onOpenDetail,
  onMoveCarousel,
  onSelectImage,
  onToggleLike,
  isFeedLiked,
  getLikeCount,
  getCommentCount,
  onOpenCollectionModal,
  onShare,
}: FeedCardProps) {
  const n = isNight;
  const liked = isFeedLiked(item);

  return (
    <div
      onClick={() => onOpenDetail(item)}
      className={`animate-in slide-in-from-bottom-4 fade-in group/card cursor-pointer overflow-hidden rounded-3xl transition-all duration-500 hover:-translate-y-1.5 ${
        n
          ? "bg-[#141925] shadow-[0_2px_12px_rgba(0,0,0,0.3)] hover:shadow-[0_24px_64px_rgba(0,201,167,0.08)]"
          : "bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_24px_64px_rgba(0,0,0,0.1)]"
      }`}
      style={{ animationDelay: `${(item.id % 3) * 45}ms` }}
    >
      {/* ── Image ── */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <ImageWithFallback
          src={images[activeImageIndex]}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover/card:scale-[1.04]"
        />

        {/* Top gradient for readability */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/30 to-transparent" />
        {/* Bottom gradient */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />

        {/* Author overlay (on image) */}
        <Link
          to={`/profile/${encodeURIComponent(item.author.profileKey ?? item.author.name)}`}
          className="absolute bottom-3 left-3.5 z-10 flex items-center gap-2.5 transition-opacity hover:opacity-90"
          onClick={(e) => e.stopPropagation()}
        >
          <ImageWithFallback
            src={item.author.avatar}
            alt={item.author.name}
            className="size-8 rounded-full border-2 border-white/30 object-cover shadow-lg"
          />
          <div className="flex flex-col">
            <span className="text-[13px] font-semibold leading-tight text-white drop-shadow-md">
              {item.author.name}
            </span>
            <span className="text-[10px] leading-tight text-white/70 drop-shadow-md">
              {item.author.role}
            </span>
          </div>
        </Link>

        {/* Quick actions overlay (top-right) */}
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100">
          <button
            type="button"
            onClick={(e) => onOpenCollectionModal(item, e)}
            className={`flex size-8 items-center justify-center rounded-full border backdrop-blur-md transition-all ${
              isSaved
                ? "border-[#00C9A7]/50 bg-[#00C9A7]/80 text-white"
                : "border-white/20 bg-black/40 text-white hover:bg-black/60"
            }`}
            aria-label="컬렉션에 저장"
            title="컬렉션에 저장"
          >
            <Bookmark className={`size-3.5 ${isSaved ? "fill-white" : ""}`} />
          </button>
          <button
            onClick={(e) => onShare(item, e)}
            className="flex size-8 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition-all hover:bg-black/60"
            aria-label="공유"
          >
            <Share2 className="size-3.5" />
          </button>
        </div>

        {/* Carousel controls */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => onMoveCarousel(item, -1, e)}
              className="absolute left-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white backdrop-blur-sm transition-all hover:bg-black/50"
              aria-label="이전 이미지"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={(e) => onMoveCarousel(item, 1, e)}
              className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white backdrop-blur-sm transition-all hover:bg-black/50"
              aria-label="다음 이미지"
            >
              <ChevronRight className="size-4" />
            </button>
            <div className="absolute bottom-3 right-3.5 z-10 flex items-center gap-1.5">
              {images.map((image, index) => (
                <button
                  key={`${item.feedKey}-${image}`}
                  type="button"
                  onClick={(e) => onSelectImage(item.feedKey, index, e)}
                  className={`rounded-full transition-all ${
                    activeImageIndex === index
                      ? "h-1.5 w-5 bg-white"
                      : "h-1.5 w-1.5 bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={`${index + 1}번 이미지 보기`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Content ── */}
      <div className="px-5 pb-5 pt-4">
        {/* Title */}
        <h3
          className={`mb-1.5 line-clamp-1 text-[15px] font-bold leading-snug tracking-tight transition-colors duration-500 ${
            n ? "text-white" : "text-[#1a1a1a]"
          }`}
        >
          {item.title}
        </h3>

        {/* Description */}
        <p
          className={`mb-3.5 line-clamp-2 text-[13px] leading-relaxed transition-colors duration-500 ${
            n ? "text-white/40" : "text-[#8a8a8a]"
          }`}
        >
          {item.description}
        </p>

        {/* Tags + Category row */}
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          {item.category && (
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors duration-500 ${
                n
                  ? "bg-[#FF5C3A]/10 text-[#FF8A70]"
                  : "bg-[#FF5C3A]/8 text-[#D4402A]"
              }`}
            >
              {item.category}
            </span>
          )}
          {item.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className={`cursor-pointer rounded-md px-2 py-0.5 text-[10px] font-medium transition-all ${
                n
                  ? "bg-white/5 text-white/35 hover:bg-[#00C9A7]/15 hover:text-[#00C9A7]"
                  : "bg-[#f0f0ee] text-[#777] hover:bg-[#00C9A7]/10 hover:text-[#00A88C]"
              }`}
            >
              {tag.startsWith("#") ? tag : `#${tag}`}
            </span>
          ))}
          {item.tags.length > 3 && (
            <span
              className={`text-[10px] font-medium ${
                n ? "text-white/25" : "text-[#aaa]"
              }`}
            >
              +{item.tags.length - 3}
            </span>
          )}
        </div>

        {/* Integrations */}
        {item.integrations && item.integrations.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {item.integrations.map((integration) => (
              <a
                key={`${item.feedKey}-${integration.provider}`}
                href={integration.url}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
                className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold transition-colors ${
                  integration.provider === "figma"
                    ? n
                      ? "border-[#00C9A7]/15 text-[#00C9A7]/70 hover:bg-[#00C9A7]/10"
                      : "border-[#00C9A7]/15 text-[#00A88C] hover:bg-[#00C9A7]/5"
                    : n
                      ? "border-[#FF5C3A]/15 text-[#FF8A70]/70 hover:bg-[#FF5C3A]/10"
                      : "border-[#FF5C3A]/15 text-[#D4402A] hover:bg-[#FF5C3A]/5"
                }`}
              >
                {integration.provider === "figma" ? (
                  <Figma className="size-3" />
                ) : (
                  <Sparkles className="size-3" />
                )}
                {integration.label}
                <ExternalLink className="size-2.5" />
              </a>
            ))}
          </div>
        )}

        {/* Bottom action bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => onToggleLike(item, e)}
              className="group/like flex items-center gap-1.5 transition-colors"
              aria-pressed={liked}
            >
              <span
                className={`flex size-8 items-center justify-center rounded-full transition-all ${
                  liked
                    ? "bg-[#FF5C3A]/10 text-[#FF5C3A]"
                    : n
                      ? "text-white/30 hover:bg-white/5 hover:text-[#FF5C3A] group-hover/like:text-[#FF5C3A]"
                      : "text-[#bbb] hover:bg-[#FF5C3A]/5 hover:text-[#FF5C3A] group-hover/like:text-[#FF5C3A]"
                }`}
              >
                <Heart className={`size-[18px] ${liked ? "fill-[#FF5C3A]" : ""}`} />
              </span>
              <span
                className={`text-xs font-semibold tabular-nums ${
                  liked ? "text-[#FF5C3A]" : n ? "text-white/30" : "text-[#bbb]"
                }`}
              >
                {getLikeCount(item)}
              </span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail(item, true);
              }}
              className="group/cmt flex items-center gap-1.5 transition-colors"
            >
              <span
                className={`flex size-8 items-center justify-center rounded-full transition-all ${
                  n
                    ? "text-white/30 hover:bg-white/5 hover:text-[#00C9A7] group-hover/cmt:text-[#00C9A7]"
                    : "text-[#bbb] hover:bg-[#00C9A7]/5 hover:text-[#00C9A7] group-hover/cmt:text-[#00C9A7]"
                }`}
              >
                <MessageCircle className="size-[18px]" />
              </span>
              <span
                className={`text-xs font-semibold tabular-nums ${
                  n ? "text-white/30" : "text-[#bbb]"
                }`}
              >
                {getCommentCount(item)}
              </span>
            </button>
          </div>

          {/* View detail arrow */}
          <span
            className={`flex size-8 items-center justify-center rounded-full transition-all ${
              n
                ? "text-white/15 group-hover/card:bg-[#00C9A7]/10 group-hover/card:text-[#00C9A7]"
                : "text-[#ccc] group-hover/card:bg-[#00C9A7]/8 group-hover/card:text-[#00A88C]"
            }`}
          >
            <ArrowUpRight className="size-4" />
          </span>
        </div>
      </div>
    </div>
  );
}
