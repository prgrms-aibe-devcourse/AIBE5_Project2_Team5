import {
  Bookmark,
  Heart,
  MessageCircle,
  Send,
  Share2,
  X,
  ChevronLeft,
  ChevronRight,
  Figma,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import type { BaseFeedItem, FeedCardItem, FeedComment } from "../../types/feed";

type FeedDetailModalProps = {
  selectedFeed: FeedCardItem;
  activeModalImage: string;
  selectedFeedImages: string[];
  modalImageIndex: number;
  savedItemIds: Set<number>;
  selectedFeedComments: FeedComment[];
  isFeedDetailLoading: boolean;
  feedDetailError: string | null;
  commentSubmitError: string | null;
  commentLoadError: string | null;
  isCommentsLoading: boolean;
  editingCommentId: string | null;
  editingCommentText: string;
  isUpdatingComment: boolean;
  isDeletingCommentId: string | null;
  commentText: string;
  isSubmittingComment: boolean;
  currentUserAvatar: string;
  currentUserName: string;
  commentInputRef: React.RefObject<HTMLInputElement | null>;
  isNight?: boolean;
  formatFeedDateTime: (value?: string) => string | null;
  isFeedLiked: (item: BaseFeedItem) => boolean;
  getLikeCount: (item: BaseFeedItem) => number;
  getCommentCount: (item: BaseFeedItem) => number;
  onClose: () => void;
  onMoveModalCarousel: (direction: -1 | 1, e?: React.MouseEvent) => void;
  onSetModalImageIndex: (index: number, e: React.MouseEvent) => void;
  onToggleLike: (item: BaseFeedItem, e?: React.MouseEvent) => void;
  onOpenCollectionModal: (item: FeedCardItem, e?: React.MouseEvent) => void;
  onShare: (item: BaseFeedItem, e?: React.MouseEvent) => void;
  onProposalClick: (item: FeedCardItem, e?: React.MouseEvent) => void;
  onStartEditingComment: (comment: FeedComment) => void;
  onEditingCommentTextChange: (value: string) => void;
  onUpdateComment: () => void;
  onCancelEditingComment: () => void;
  onDeleteComment: (commentId: string) => void;
  onCommentTextChange: (value: string) => void;
  onCommentKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onSubmitComment: () => void;
};

export function FeedDetailModal({
  selectedFeed,
  activeModalImage,
  selectedFeedImages,
  modalImageIndex,
  savedItemIds,
  selectedFeedComments,
  isFeedDetailLoading,
  feedDetailError,
  commentSubmitError,
  commentLoadError,
  isCommentsLoading,
  editingCommentId,
  editingCommentText,
  isUpdatingComment,
  isDeletingCommentId,
  commentText,
  isSubmittingComment,
  currentUserAvatar,
  currentUserName,
  commentInputRef,
  isNight = false,
  formatFeedDateTime,
  isFeedLiked,
  getLikeCount,
  getCommentCount,
  onClose,
  onMoveModalCarousel,
  onSetModalImageIndex,
  onToggleLike,
  onOpenCollectionModal,
  onShare,
  onProposalClick,
  onStartEditingComment,
  onEditingCommentTextChange,
  onUpdateComment,
  onCancelEditingComment,
  onDeleteComment,
  onCommentTextChange,
  onCommentKeyDown,
  onSubmitComment,
}: FeedDetailModalProps) {
  const d = isNight;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${
        d ? "bg-black/80" : "bg-black/70"
      }`}
      onClick={onClose}
    >
      <div
        className={`max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-2xl shadow-2xl transition-colors duration-500 ${
          d ? "bg-[#1a1f2e]" : "bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-[90vh]">
          {/* Image panel */}
          <div className="relative flex flex-1 items-center justify-center bg-[#0F0F0F]">
            <ImageWithFallback
              src={activeModalImage}
              alt={selectedFeed.title}
              className="max-h-full max-w-full object-contain"
            />

            {selectedFeedImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => onMoveModalCarousel(-1, e)}
                  className="absolute left-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-lg border border-white/20 bg-black/50 text-white transition-all hover:bg-black/70"
                  aria-label="이전 이미지"
                >
                  <ChevronLeft className="size-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => onMoveModalCarousel(1, e)}
                  className="absolute right-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-lg border border-white/20 bg-black/50 text-white transition-all hover:bg-black/70"
                  aria-label="다음 이미지"
                >
                  <ChevronRight className="size-6" />
                </button>
                <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-white/15 bg-black/45 px-3 py-2 backdrop-blur-md">
                  {selectedFeedImages.map((image, index) => (
                    <button
                      key={`modal-${selectedFeed.feedKey}-${image}`}
                      type="button"
                      onClick={(e) => onSetModalImageIndex(index, e)}
                      className={`h-2 rounded-full transition-all ${
                        modalImageIndex === index ? "w-6 bg-white" : "w-2 bg-white/50"
                      }`}
                      aria-label={`${index + 1}번 이미지 보기`}
                    />
                  ))}
                </div>
                <div className="absolute right-4 top-4 rounded-lg border border-white/15 bg-black/50 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-md">
                  {modalImageIndex + 1}/{selectedFeedImages.length}
                </div>
              </>
            )}

            <button
              onClick={onClose}
              className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/50 p-2 text-white transition-all hover:bg-black/70"
              aria-label="닫기"
            >
              <X className="size-6" />
            </button>
          </div>

          {/* Detail panel */}
          <div
            className={`flex w-[400px] flex-col transition-colors duration-500 ${
              d ? "bg-[#1a1f2e]" : "bg-white"
            }`}
          >
            {/* Author + meta */}
            <div
              className={`border-b p-5 ${
                d ? "border-white/[0.06]" : "border-gray-200"
              }`}
            >
              <div className="mb-4 flex items-center gap-3">
                <Link
                  to={`/profile/${encodeURIComponent(selectedFeed.author.profileKey ?? selectedFeed.author.name)}`}
                  className="flex min-w-0 flex-1 items-center gap-3 transition-opacity hover:opacity-80"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                >
                  <ImageWithFallback
                    src={selectedFeed.author.avatar}
                    alt={selectedFeed.author.name}
                    className="size-12 shrink-0 rounded-full ring-2 ring-[#00C9A7]"
                  />
                  <div className="min-w-0">
                    <h4
                      className={`truncate text-sm font-bold ${
                        d ? "text-white" : ""
                      }`}
                    >
                      {selectedFeed.author.name}
                    </h4>
                    <p
                      className={`truncate text-xs ${
                        d ? "text-white/40" : "text-gray-500"
                      }`}
                    >
                      {selectedFeed.author.role}
                    </p>
                    {formatFeedDateTime(selectedFeed.createdAt) && (
                      <p
                        className={`mt-1 text-[11px] ${
                          d ? "text-white/25" : "text-gray-400"
                        }`}
                      >
                        {formatFeedDateTime(selectedFeed.createdAt)}
                      </p>
                    )}
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={(event) => onProposalClick(selectedFeed, event)}
                  className="shrink-0 inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#FFB6A6] bg-[#FF5C3A] px-3.5 font-bold text-white shadow-[0_8px_18px_rgba(255,92,58,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#E94F2F] hover:shadow-[0_10px_22px_rgba(255,92,58,0.28)] focus:outline-none focus:ring-2 focus:ring-[#FFB6A6] focus:ring-offset-2"
                >
                  <Send className="size-3.5" />
                  <span className="text-xs">프로젝트 제안</span>
                </button>
              </div>

              <h2
                className={`mb-2 text-xl font-bold ${d ? "text-white" : ""}`}
              >
                {selectedFeed.title}
              </h2>
              <p
                className={`mb-3 text-sm ${
                  d ? "text-white/50" : "text-gray-600"
                }`}
              >
                {selectedFeed.description || "등록된 상세 설명이 없습니다."}
              </p>

              {selectedFeed.category && (
                <div className="mb-3">
                  <span
                    className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
                      d
                        ? "border-[#FF5C3A]/20 bg-[#FF5C3A]/10 text-[#FF8A70]"
                        : "border-[#FFB9AA] bg-[#FFF7F4] text-[#B13A21]"
                    }`}
                  >
                    {selectedFeed.category}
                  </span>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {selectedFeed.tags.map((tag, index) => (
                  <span
                    key={index}
                    className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                      d
                        ? "border-[#00C9A7]/15 bg-[#00C9A7]/10 text-[#00C9A7]/80 hover:bg-[#00C9A7]/25"
                        : "border-[#00C9A7]/20 bg-[#A8F0E4]/30 text-[#00A88C] hover:bg-[#00C9A7]/90 hover:text-white"
                    }`}
                  >
                    {tag.startsWith("#") ? tag : `#${tag}`}
                  </span>
                ))}
              </div>

              {selectedFeed.integrations && selectedFeed.integrations.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedFeed.integrations.map((integration) => (
                    <a
                      key={`${selectedFeed.feedKey}-${integration.provider}`}
                      href={integration.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                        integration.provider === "figma"
                          ? d
                            ? "border-[#00C9A7]/20 bg-[#00C9A7]/10 text-[#00C9A7]"
                            : "border-[#BDEFD8] bg-[#F5FFFB] text-[#007E68]"
                          : d
                            ? "border-[#FF5C3A]/20 bg-[#FF5C3A]/10 text-[#FF8A70]"
                            : "border-[#FFB9AA] bg-[#FFF7F4] text-[#B13A21]"
                      }`}
                    >
                      {integration.provider === "figma" ? (
                        <Figma className="size-4" />
                      ) : (
                        <Sparkles className="size-4" />
                      )}
                      {integration.label} 연결
                      <ExternalLink className="size-3.5" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Actions bar */}
            <div
              className={`border-b p-4 ${
                d ? "border-white/[0.06]" : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={(e) => onToggleLike(selectedFeed, e)}
                    className={`flex items-center gap-2 transition-colors ${
                      isFeedLiked(selectedFeed)
                        ? "text-[#FF5C3A]"
                        : d
                          ? "text-white/40 hover:text-[#FF5C3A]"
                          : "text-gray-600 hover:text-[#FF5C3A]"
                    }`}
                    aria-pressed={isFeedLiked(selectedFeed)}
                  >
                    <Heart className={`size-6 ${isFeedLiked(selectedFeed) ? "fill-[#FF5C3A]" : ""}`} />
                    <span className="font-semibold">{getLikeCount(selectedFeed)}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => commentInputRef.current?.focus()}
                    className={`flex items-center gap-2 transition-colors ${
                      d
                        ? "text-white/40 hover:text-[#00C9A7]"
                        : "text-gray-600 hover:text-[#00C9A7]"
                    }`}
                  >
                    <MessageCircle className="size-6" />
                    <span className="font-semibold">{getCommentCount(selectedFeed)}</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => onOpenCollectionModal(selectedFeed, e)}
                    className={`rounded-lg p-2 transition-all ${
                      savedItemIds.has(selectedFeed.id)
                        ? "border border-white/30 bg-[#00C9A7]/90 text-white"
                        : d
                          ? "text-white/40 hover:bg-white/5 hover:text-[#00C9A7]"
                          : "text-gray-600 hover:bg-[#A8F0E4]/20 hover:text-[#00A88C]"
                    }`}
                    aria-label="컬렉션에 저장"
                    title="컬렉션에 저장"
                  >
                    <Bookmark className={`size-5 ${savedItemIds.has(selectedFeed.id) ? "fill-white" : ""}`} />
                  </button>
                  <button
                    onClick={(e) => onShare(selectedFeed, e)}
                    className={`rounded-lg p-2 transition-colors ${
                      d
                        ? "text-white/40 hover:bg-white/5 hover:text-[#00C9A7]"
                        : "text-gray-600 hover:bg-[#A8F0E4]/20 hover:text-[#00A88C]"
                    }`}
                    aria-label="공유"
                  >
                    <Share2 className="size-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {isFeedDetailLoading && (
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    d ? "bg-white/5 text-white/40" : "bg-[#F7F7F5] text-gray-500"
                  }`}
                >
                  피드 상세를 불러오는 중입니다.
                </div>
              )}
              {feedDetailError && (
                <div
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    d
                      ? "border-[#FF5C3A]/20 bg-[#FF5C3A]/10 text-[#FF8A70]"
                      : "border-[#FFB9AA] bg-[#FFF7F4] text-[#B13A21]"
                  }`}
                >
                  {feedDetailError}
                </div>
              )}
              {commentSubmitError && (
                <div
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    d
                      ? "border-[#FF5C3A]/20 bg-[#FF5C3A]/10 text-[#FF8A70]"
                      : "border-[#FFB9AA] bg-[#FFF7F4] text-[#B13A21]"
                  }`}
                >
                  {commentSubmitError}
                </div>
              )}
              {commentLoadError && (
                <div
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    d
                      ? "border-[#FF5C3A]/20 bg-[#FF5C3A]/10 text-[#FF8A70]"
                      : "border-[#FFB9AA] bg-[#FFF7F4] text-[#B13A21]"
                  }`}
                >
                  {commentLoadError}
                </div>
              )}
              {isCommentsLoading && selectedFeedComments.length === 0 && (
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    d ? "bg-white/5 text-white/40" : "bg-[#F7F7F5] text-gray-500"
                  }`}
                >
                  댓글 목록을 불러오는 중입니다.
                </div>
              )}
              {!isCommentsLoading && !commentLoadError && selectedFeedComments.length === 0 && (
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    d ? "bg-white/5 text-white/40" : "bg-[#F7F7F5] text-gray-500"
                  }`}
                >
                  첫 댓글을 남겨보세요.
                </div>
              )}

              {selectedFeedComments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Link
                    to={`/profile/${encodeURIComponent(comment.author.profileKey ?? comment.author.name)}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onClose();
                    }}
                    className="flex-shrink-0 transition-opacity hover:opacity-80"
                  >
                    <ImageWithFallback
                      src={comment.author.avatar}
                      alt={comment.author.name}
                      className={`size-10 rounded-full ring-2 ${
                        d ? "ring-[#00C9A7]/20" : "ring-[#A8F0E4]/30"
                      }`}
                    />
                  </Link>
                  <div className="flex-1">
                    <div
                      className={`rounded-lg p-3 ${
                        d ? "bg-white/5" : "bg-[#F7F7F5]"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <Link
                          to={`/profile/${encodeURIComponent(comment.author.profileKey ?? comment.author.name)}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            onClose();
                          }}
                          className={`text-sm font-semibold transition-colors hover:text-[#00A88C] ${
                            d ? "text-white/90" : ""
                          }`}
                        >
                          {comment.author.name}
                        </Link>
                      </div>
                      <p
                        className={`mb-2 text-xs ${
                          d ? "text-white/30" : "text-gray-500"
                        }`}
                      >
                        {comment.author.role}
                      </p>
                      {editingCommentId === comment.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editingCommentText}
                            onChange={(e) => onEditingCommentTextChange(e.target.value)}
                            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C9A7] ${
                              d
                                ? "border-white/10 bg-[#0C1222] text-white"
                                : "border-[#BDEFD8] bg-white"
                            }`}
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={onUpdateComment}
                              disabled={!editingCommentText.trim() || isUpdatingComment}
                              className="rounded-md bg-[#00C9A7] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              onClick={onCancelEditingComment}
                              className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
                                d
                                  ? "border-white/10 text-white/50"
                                  : "border-gray-200 text-gray-600"
                              }`}
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p
                          className={`text-sm ${
                            d ? "text-white/70" : "text-gray-800"
                          }`}
                        >
                          {comment.content}
                        </p>
                      )}
                    </div>
                    <div className="ml-3 mt-1 flex items-center gap-3">
                      {comment.isMine && editingCommentId !== comment.id && (
                        <>
                          <button
                            type="button"
                            onClick={() => onStartEditingComment(comment)}
                            className={`text-xs transition-colors ${
                              d
                                ? "text-white/30 hover:text-[#00C9A7]"
                                : "text-gray-500 hover:text-[#00A88C]"
                            }`}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteComment(comment.id)}
                            disabled={isDeletingCommentId === comment.id}
                            className={`text-xs transition-colors disabled:opacity-50 ${
                              d
                                ? "text-white/30 hover:text-[#FF5C3A]"
                                : "text-gray-500 hover:text-[#FF5C3A]"
                            }`}
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Comment input */}
            <div
              className={`border-t p-4 ${
                d ? "border-white/[0.06]" : "border-gray-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <ImageWithFallback
                  src={currentUserAvatar}
                  alt={currentUserName}
                  className="size-10 rounded-full ring-2 ring-[#00C9A7]"
                />
                <div className="relative flex-1">
                  <input
                    ref={commentInputRef}
                    type="text"
                    value={commentText}
                    onChange={(e) => onCommentTextChange(e.target.value)}
                    onKeyDown={onCommentKeyDown}
                    placeholder="댓글을 입력해주세요..."
                    className={`w-full rounded-full px-4 py-3 pr-12 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#00C9A7] ${
                      d
                        ? "bg-white/5 text-white placeholder-white/25"
                        : "bg-[#F7F7F5]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={onSubmitComment}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-gradient-to-r from-[#00C9A7]/90 to-[#00A88C]/90 p-2 text-white transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!commentText.trim() || isSubmittingComment}
                    aria-label="댓글 등록"
                  >
                    <Send className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
