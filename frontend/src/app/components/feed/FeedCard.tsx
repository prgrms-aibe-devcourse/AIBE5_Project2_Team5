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
} from "lucide-react";
import { Link } from "react-router";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import type { BaseFeedItem, FeedCardItem } from "../../types/feed";

type FeedCardProps = {
  item: FeedCardItem;
  images: string[];
  activeImageIndex: number;
  isSaved: boolean;
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
  return (
    <div
      onClick={() => onOpenDetail(item)}
      className="animate-in slide-in-from-bottom-4 fade-in cursor-pointer overflow-hidden rounded-xl border border-gray-100 bg-white transition-all duration-500 hover:border-[#A8F0E4] hover:shadow-xl"
      style={{ animationDelay: `${(item.id % 3) * 45}ms` }}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#EAF7F4]">
        <ImageWithFallback
          src={images[activeImageIndex]}
          alt={item.title}
          className="h-full w-full object-cover transition-all duration-500 hover:scale-105"
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => onMoveCarousel(item, -1, e)}
              className="absolute left-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg border border-white/20 bg-black/40 text-white transition-all hover:bg-black/60"
              aria-label="이전 이미지"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={(e) => onMoveCarousel(item, 1, e)}
              className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg border border-white/20 bg-black/40 text-white transition-all hover:bg-black/60"
              aria-label="다음 이미지"
            >
              <ChevronRight className="size-5" />
            </button>
            <div className="absolute right-3 top-3 rounded-lg border border-white/15 bg-black/45 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
              {activeImageIndex + 1}/{images.length}
            </div>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
              {images.map((image, index) => (
                <button
                  key={`${item.feedKey}-${image}`}
                  type="button"
                  onClick={(e) => onSelectImage(item.feedKey, index, e)}
                  className={`h-1.5 rounded-full transition-all ${
                    activeImageIndex === index ? "w-5 bg-white" : "w-1.5 bg-white/55"
                  }`}
                  aria-label={`${index + 1}번째 이미지 보기`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="p-5">
        <Link
          to={`/profile/${encodeURIComponent(item.author.profileKey ?? item.author.name)}`}
          className="mb-3 flex w-fit items-center gap-3 transition-opacity hover:opacity-80"
          onClick={(e) => e.stopPropagation()}
        >
          <ImageWithFallback
            src={item.author.avatar}
            alt={item.author.name}
            className="size-10 rounded-full ring-2 ring-[#A8F0E4]/30"
          />
          <div>
            <h4 className="text-sm font-semibold">{item.author.name}</h4>
            <p className="text-xs text-gray-500">{item.author.role}</p>
          </div>
        </Link>

        <h3 className="mb-2 text-lg font-bold">{item.title}</h3>
        <p className="mb-4 text-sm text-gray-600">{item.description}</p>

        {item.category && (
          <div className="mb-3">
            <span className="rounded-lg border border-[#FFB9AA] bg-[#FFF7F4] px-3 py-1.5 text-xs font-bold text-[#B13A21]">
              {item.category}
            </span>
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          {item.tags.map((tag, index) => (
            <span
              key={index}
              className="cursor-pointer rounded-full bg-[#A8F0E4]/20 px-3 py-1 text-xs font-medium text-[#00A88C] transition-all hover:bg-[#00C9A7] hover:text-[#0F0F0F]"
            >
              {tag.startsWith("#") ? tag : `#${tag}`}
            </span>
          ))}
        </div>

        {item.integrations && item.integrations.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {item.integrations.map((integration) => (
              <a
                key={`${item.feedKey}-${integration.provider}`}
                href={integration.url}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  integration.provider === "figma"
                    ? "border-[#BDEFD8] bg-[#F5FFFB] text-[#007E68]"
                    : "border-[#FFB9AA] bg-[#FFF7F4] text-[#B13A21]"
                }`}
              >
                {integration.provider === "figma" ? (
                  <Figma className="size-3.5" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                {integration.label}
                <ExternalLink className="size-3" />
              </a>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={(e) => onToggleLike(item, e)}
              className={`flex items-center gap-2 transition-colors ${
                isFeedLiked(item) ? "text-[#FF5C3A]" : "text-gray-600 hover:text-[#FF5C3A]"
              }`}
              aria-pressed={isFeedLiked(item)}
            >
              <Heart className={`size-5 ${isFeedLiked(item) ? "fill-[#FF5C3A]" : ""}`} />
              <span className="text-sm">{getLikeCount(item)}</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail(item, true);
              }}
              className="flex items-center gap-2 text-gray-600 transition-colors hover:text-[#00C9A7]"
            >
              <MessageCircle className="size-5" />
              <span className="text-sm">{getCommentCount(item)}</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => onOpenCollectionModal(item, e)}
              className={`rounded-lg p-2 transition-all ${
                isSaved
                  ? "border border-white/30 bg-[#00C9A7]/90 text-white"
                  : "text-gray-600 hover:bg-[#A8F0E4]/20 hover:text-[#00A88C]"
              }`}
              aria-label="컬렉션에 저장"
              title="컬렉션에 저장"
            >
              <Bookmark className={`size-5 ${isSaved ? "fill-white" : ""}`} />
            </button>
            <button
              onClick={(e) => onShare(item, e)}
              className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-[#A8F0E4]/20 hover:text-[#00A88C]"
              aria-label="공유"
            >
              <Share2 className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
