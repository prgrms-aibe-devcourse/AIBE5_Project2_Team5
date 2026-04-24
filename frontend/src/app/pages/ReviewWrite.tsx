import Navigation from "../components/Navigation";
import { CheckCircle, Star, Send, ThumbsUp, MessageSquare, Sparkles } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { createProfileReviewApi } from "../api/profileApi";
import { matchingCategories } from "../utils/matchingCategories";

const LEFT_CONVERSATIONS_STORAGE_KEY = "pickxel:left-message-conversations";

const rememberHiddenConversation = (conversationId: number) => {
  if (typeof window === "undefined" || !conversationId) return;

  try {
    const rawValue = window.localStorage.getItem(LEFT_CONVERSATIONS_STORAGE_KEY);
    const currentIds = rawValue ? (JSON.parse(rawValue) as number[]) : [];
    const nextIds = Array.from(new Set([...currentIds, conversationId]));
    window.localStorage.setItem(
      LEFT_CONVERSATIONS_STORAGE_KEY,
      JSON.stringify(nextIds),
    );
  } catch {
    // Hiding the conversation locally is best-effort only.
  }
};

export default function ReviewWrite() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const navigationState = (location.state as {
    profileKey?: string;
    conversationId?: number;
    revieweeId?: number;
    clientName?: string;
    projectName?: string;
  } | null) ?? null;
  const profileKey =
    searchParams.get("profileKey") ||
    navigationState?.profileKey ||
    searchParams.get("revieweeId") ||
    "";
  const conversationId = Number(
    searchParams.get("conversationId") || navigationState?.conversationId || 0
  );
  const revieweeId = Number(
    searchParams.get("revieweeId") || navigationState?.revieweeId || 0
  );
  const clientName = searchParams.get("client") || navigationState?.clientName || "client";
  const projectName =
    searchParams.get("project") || navigationState?.projectName || "프로젝트";

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState("");
  const [selectedWorkCategories, setSelectedWorkCategories] = useState<string[]>([]);
  const [selectedCompliments, setSelectedCompliments] = useState<string[]>([]);
  const [selectedImprovements, setSelectedImprovements] = useState<string[]>([]);
  const [isThankYouOpen, setIsThankYouOpen] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const ratingOptions = [
    {
      value: 1,
      label: "조금 아쉬웠어요",
      description: "다음엔 더 맞춰봐요",
      selectedClassName: "border-[#FF9A84] bg-[#FFF1ED] text-[#B13A21]",
    },
    {
      value: 2,
      label: "무난했어요",
      description: "큰 문제는 없었어요",
      selectedClassName: "border-[#FFD36B] bg-[#FFF8E5] text-[#8A5A00]",
    },
    {
      value: 3,
      label: "괜찮았어요",
      description: "기본은 탄탄했어요",
      selectedClassName: "border-[#A8F0E4] bg-[#EFFFFC] text-[#007E68]",
    },
    {
      value: 4,
      label: "만족했어요",
      description: "다시 맡겨도 좋아요",
      selectedClassName: "border-[#00C9A7] bg-[#DDF8EC] text-[#007E68]",
    },
    {
      value: 5,
      label: "완전 추천해요",
      description: "협업 감각이 좋았어요",
      selectedClassName: "border-[#0F0F0F] bg-[#0F0F0F] text-white",
    },
  ];

  const complimentOptions = [
    { label: "답장이 빨라요", description: "기다리는 시간이 짧았어요" },
    { label: "디테일 장인", description: "작은 부분까지 잘 챙겼어요" },
    { label: "센스가 좋아요", description: "말하지 않아도 톤을 잘 잡았어요" },
    { label: "수정이 깔끔해요", description: "피드백 반영이 명확했어요" },
    { label: "일정이 믿음직해요", description: "약속한 흐름이 안정적이었어요" },
    { label: "설명이 쉬워요", description: "진행 상황을 이해하기 편했어요" },
    { label: "결과물이 예뻐요", description: "완성물을 보고 바로 만족했어요" },
    { label: "다음에도 함께", description: "다시 협업하고 싶은 느낌이에요" },
  ];

  const improvementOptions = [
    { label: "답장이 조금 느렸어요", description: "기다리는 시간이 길게 느껴졌어요" },
    { label: "방향 정리가 더 필요해요", description: "초반 기준이 조금 흔들렸어요" },
    { label: "수정 과정이 아쉬웠어요", description: "피드백 반영이 더 명확하면 좋아요" },
    { label: "일정 공유가 부족했어요", description: "진행 상황을 더 알고 싶었어요" },
    { label: "디테일 보완이 필요해요", description: "마감 전 한 번 더 다듬으면 좋아요" },
    { label: "결과물이 기대와 달랐어요", description: "처음 기대한 톤과 차이가 있었어요" },
  ];

  const hasSelectedCompliments = selectedCompliments.length > 0;
  const shouldShowImprovements = rating > 0 && rating <= 3;
  const hasSelectedImprovements = selectedImprovements.length > 0;
  const hasRequiredTagSelection = shouldShowImprovements
    ? hasSelectedImprovements
    : hasSelectedCompliments;
  const hasSelectedWorkCategory = selectedWorkCategories.length > 0;
  const isReviewReady =
    hasSelectedWorkCategory && rating > 0 && hasRequiredTagSelection && review.length >= 50;
  const submitButtonLabel =
    !hasSelectedWorkCategory
      ? "작업 분야를 골라주세요"
      : rating === 0
      ? "만족도부터 골라주세요"
      : shouldShowImprovements && !hasSelectedImprovements
        ? "아쉬운 점을 골라주세요"
        : !shouldShowImprovements && !hasSelectedCompliments
        ? "좋았던 포인트를 골라주세요"
        : review.length < 50
          ? "한마디를 조금 더 적어주세요"
          : "후기 등록하기";

  const handleRatingChange = (value: number) => {
    setRating(value);
    if (value > 3) {
      setSelectedImprovements([]);
    }
  };

  const toggleCompliment = (label: string) => {
    setSelectedCompliments((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const toggleImprovement = (label: string) => {
    setSelectedImprovements((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const toggleWorkCategory = (category: string) => {
    setSelectedWorkCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category]
    );
  };

  const handleGoToProfileReviews = () => {
    if (!profileKey) {
      navigate("/messages");
      return;
    }
    navigate(`/profile/${encodeURIComponent(profileKey)}?tab=reviews`);
  };

  const handleSubmit = async () => {
    if (!isReviewReady || hasSubmitted) return;

    if (!conversationId || !revieweeId) {
      setSubmitError("후기 대상을 확인하지 못했습니다. 메시지 화면에서 다시 시도해주세요.");
      return;
    }

    try {
      setSubmitError("");
      setHasSubmitted(true);
      await createProfileReviewApi({
        conversationId,
        revieweeId,
        projectTitle: projectName,
        rating,
        content: review.trim(),
        workCategories: selectedWorkCategories,
        complimentTags: shouldShowImprovements ? selectedImprovements : selectedCompliments,
      });
      rememberHiddenConversation(conversationId);
      setIsThankYouOpen(true);
      return;
    } catch (error) {
      setHasSubmitted(false);
      setSubmitError(
        error instanceof Error ? error.message : "후기를 저장하지 못했습니다."
      );
      return;
    }

    // 실제로는 여기서 API 호출하여 후기 저장
    const reviewData = {
      clientName,
      projectName,
      workCategories: selectedWorkCategories,
      rating,
      complimentTags: selectedCompliments,
      improvementTags: [],
      review,
      date: new Date().toISOString(),
    };

    // localStorage에 임시 저장 (실제로는 백엔드 API로 전송)
    const existingReviews = JSON.parse(localStorage.getItem("reviews") || "[]");
    existingReviews.push(reviewData);
    localStorage.setItem("reviews", JSON.stringify(existingReviews));

    setHasSubmitted(true);
    setIsThankYouOpen(true);
  };

  const RatingStars = ({
    value,
    onChange,
    hovered,
    onHover
  }: {
    value: number;
    onChange: (v: number) => void;
    hovered?: number;
    onHover?: (v: number) => void;
  }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => onHover?.(star)}
          onMouseLeave={() => onHover?.(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`size-8 ${
              star <= (hovered || value)
                ? "fill-[#FF5C3A] text-[#FF5C3A]"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      <Navigation />

      <div className="max-w-[900px] mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center size-20 bg-gradient-to-br from-[#00C9A7] to-[#00A88C] rounded-full mb-4 shadow-lg">
            <ThumbsUp className="size-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-3">작업 어땠나요?</h1>
          <p className="text-gray-600">
            몇 번만 눌러서 협업 느낌을 남겨주세요. 자세한 말은 마지막에 한 줄이면 충분해요.
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
          {/* Project Info */}
          <div className="bg-gradient-to-br from-[#A8F0E4]/20 to-white border border-[#00C9A7]/30 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-full bg-gradient-to-br from-[#00C9A7] to-[#00A88C] shadow-lg"></div>
              <div>
                <h3 className="font-bold text-lg mb-1">{clientName}</h3>
                <p className="text-sm text-gray-600">{projectName}</p>
              </div>
            </div>
          </div>

          {/* Work Category */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <label className="block font-bold text-lg mb-2">
              어떤 작업이었나요? <span className="text-[#FF5C3A]">*</span>
            </label>
            <p className="text-sm text-gray-600 mb-5">
              매칭에서 쓰는 분야를 그대로 골라주세요. 여러 분야가 섞였으면 복수 선택도 좋아요.
            </p>
            <div className="flex flex-wrap gap-2">
              {matchingCategories.map((category) => {
                const isSelected = selectedWorkCategories.includes(category);

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleWorkCategory(category)}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${
                      isSelected
                        ? "border-[#00C9A7] bg-[#EFFFFC] text-[#007E68] shadow-sm"
                        : "border-gray-200 bg-[#F7F7F5] text-gray-700 hover:-translate-y-0.5 hover:border-[#00C9A7] hover:bg-white"
                    }`}
                    aria-pressed={isSelected}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {isSelected && <CheckCircle className="size-4 text-[#00C9A7]" />}
                      {category}
                    </span>
                  </button>
                );
              })}
            </div>
            {hasSelectedWorkCategory && (
              <div className="mt-4 rounded-lg border border-[#00C9A7]/30 bg-[#F2FFFC] p-3 text-sm font-semibold text-[#007E68]">
                <Sparkles className="mr-2 inline size-4 text-[#00C9A7]" />
                {selectedWorkCategories.join(", ")} 작업으로 후기에 남길게요.
              </div>
            )}
          </div>

          {/* Overall Rating */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <label className="block font-bold text-lg mb-4">
              전체 만족도 <span className="text-[#FF5C3A]">*</span>
            </label>
            <div className="flex items-center gap-4">
              <RatingStars
                value={rating}
                onChange={handleRatingChange}
                hovered={hoveredRating}
                onHover={setHoveredRating}
              />
              <span className="text-2xl font-bold text-[#00A88C]">
                {rating > 0 ? `${rating}.0` : "-"}
              </span>
            </div>
          </div>

          {/* Compliment Tags */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <h3 className="font-bold text-lg mb-2">
              {shouldShowImprovements ? "괜찮았던 포인트" : "좋았던 포인트"}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {shouldShowImprovements
                ? "그래도 괜찮았던 부분이 있다면 골라주세요. 선택하지 않아도 괜찮아요."
                : "딱 맞는 항목을 여러 개 골라주세요. 선택한 포인트가 프로필 후기에도 그대로 남아요."}
            </p>
            {rating === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-[#F7F7F5] p-5 text-sm font-medium text-gray-500">
                먼저 전체 만족도를 눌러주세요. 그 다음에 선택 항목이 열립니다.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="animate-in fade-in slide-in-from-bottom-2 grid gap-2 duration-300 sm:grid-cols-2">
                  {complimentOptions.map((option) => {
                    const isSelected = selectedCompliments.includes(option.label);

                    return (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => toggleCompliment(option.label)}
                        className={`min-h-[74px] rounded-lg border px-4 py-3 text-left transition-all ${
                          isSelected
                            ? "border-[#FFB6A6] bg-[#FFF3EF] text-[#D84325] shadow-sm"
                            : "border-gray-200 bg-[#F7F7F5] text-gray-700 hover:-translate-y-0.5 hover:border-[#FFB6A6] hover:bg-white hover:shadow-sm"
                        }`}
                        aria-pressed={isSelected}
                      >
                        <span className="mb-1 flex items-center gap-2 text-sm font-bold">
                          {isSelected && <CheckCircle className="size-4 shrink-0 text-[#FF5C3A]" />}
                          {option.label}
                        </span>
                        <span className="block text-xs font-medium text-gray-500">
                          {option.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {shouldShowImprovements && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 rounded-xl border border-[#FFB9AA]/70 bg-[#FFF7F4] p-4 duration-300">
                    <div className="mb-3">
                      <h4 className="font-bold text-[#B13A21]">아쉬운 점도 알려주세요</h4>
                      <p className="text-sm text-gray-600">
                        평균 이하 만족도에서는 개선 포인트를 하나 이상 골라주세요.
                      </p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {improvementOptions.map((option) => {
                        const isSelected = selectedImprovements.includes(option.label);

                        return (
                          <button
                            key={option.label}
                            type="button"
                            onClick={() => toggleImprovement(option.label)}
                            className={`min-h-[74px] rounded-lg border px-4 py-3 text-left transition-all ${
                              isSelected
                                ? "border-[#FF5C3A] bg-[#FFF1ED] text-[#B13A21] shadow-sm"
                                : "border-[#FFD6CC] bg-white text-gray-700 hover:-translate-y-0.5 hover:border-[#FF5C3A] hover:bg-[#FFF9F7] hover:shadow-sm"
                            }`}
                            aria-pressed={isSelected}
                          >
                            <span className="mb-1 flex items-center gap-2 text-sm font-bold">
                              {isSelected && <CheckCircle className="size-4 shrink-0 text-[#FF5C3A]" />}
                              {option.label}
                            </span>
                            <span className="block text-xs font-medium text-gray-500">
                              {option.description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {hasSelectedCompliments && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 rounded-lg border border-[#00C9A7]/30 bg-[#EFFFFC] p-4 text-sm font-semibold text-[#007E68] duration-300">
                    <Sparkles className="mr-2 inline size-4" />
                    {selectedCompliments.length}개 골랐어요. 이제 마지막으로 짧은 한마디만 남기면 끝이에요.
                  </div>
                )}
                {shouldShowImprovements && hasSelectedImprovements && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 rounded-lg border border-[#FFB9AA] bg-[#FFF1ED] p-4 text-sm font-semibold text-[#B13A21] duration-300">
                    <Sparkles className="mr-2 inline size-4" />
                    아쉬운 점 {selectedImprovements.length}개를 기록했어요. 마지막으로 한마디만 남기면 끝이에요.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Written Review */}
          {hasRequiredTagSelection && (
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <label className="block font-bold text-lg mb-4">
              한마디 후기 <span className="text-[#FF5C3A]">*</span>
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="예: 피드백을 빠르게 반영해줘서 편했고, 결과물 톤도 처음 방향과 잘 맞았어요. 다음에도 같이 작업하고 싶습니다."
              className="w-full h-48 px-4 py-3 bg-[#F7F7F5] border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#00C9A7] resize-none text-sm leading-relaxed"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm text-gray-500">최소 50자 이상 작성해주세요</p>
              <p className="text-sm text-gray-500">{review.length}자</p>
            </div>
          </div>
          )}

          {/* Tips */}
          <div className="bg-gradient-to-br from-[#A8F0E4]/10 to-white border border-[#00C9A7]/20 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <MessageSquare className="size-5 text-[#00A88C] flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-sm mb-2">이렇게 쓰면 좋아요</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 좋았던 순간 하나만 떠올려도 충분해요</li>
                  <li>• 답장, 수정, 결과물 중 기억나는 부분을 적어주세요</li>
                  <li>• 다음에 또 같이 하고 싶은 이유가 있으면 더 좋아요</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/messages")}
              className="flex-1 border-2 border-gray-300 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 hover:border-[#A8F0E4] transition-all"
            >
              취소
            </button>
            <button
              onClick={() => void handleSubmit()}
              disabled={!isReviewReady || hasSubmitted}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                !isReviewReady || hasSubmitted
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#00C9A7] to-[#00A88C] text-[#0F0F0F] hover:shadow-lg hover:scale-105 border border-white/30"
              }`}
            >
              <Send className="size-4" />
              {hasSubmitted ? "후기 등록 중..." : submitButtonLabel}
            </button>
          </div>
          {submitError && (
            <p className="mt-3 text-sm font-medium text-[#D64928]">{submitError}</p>
          )}
        </div>
      </div>

      {isThankYouOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 px-5 backdrop-blur-sm animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-thanks-title"
        >
          <div className="w-full max-w-[420px] rounded-2xl border border-[#BDEFD8] bg-white p-7 text-center shadow-2xl animate-in zoom-in-95 fade-in duration-200">
            <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-[#DDF8EC] text-[#00A88C] shadow-[0_12px_30px_rgba(0,201,167,0.18)]">
              <CheckCircle className="size-9" />
            </div>
            <p className="mb-2 text-xs font-bold text-[#00A88C]">
              후기 등록 완료
            </p>
            <h2 id="review-thanks-title" className="mb-3 text-2xl font-black text-[#12382D]">
              소중한 후기 감사합니다!
            </h2>
            <p className="mx-auto mb-6 max-w-[300px] text-sm leading-relaxed text-gray-600">
              선택한 작업 분야와 좋았던 포인트가 프로필 후기에도 바로 반영돼요.
            </p>
            <button
              type="button"
              onClick={handleGoToProfileReviews}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#16A673] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(22,166,115,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#0E8F61]"
            >
              <Sparkles className="size-4" />
              리뷰로 이동하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
