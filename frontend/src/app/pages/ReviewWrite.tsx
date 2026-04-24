import Navigation from "../components/Navigation";
import { Star, Send, ThumbsUp, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

export default function ReviewWrite() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientName = searchParams.get("client") || "김민재";
  const projectName = searchParams.get("project") || "브랜드 아이덴티티 프로젝트";

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState("");
  const [communication, setCommunication] = useState(0);
  const [professionalism, setProfessionalism] = useState(0);
  const [payment, setPayment] = useState(0);

  const handleSubmit = () => {
    // 실제로는 여기서 API 호출하여 후기 저장
    const reviewData = {
      clientName,
      projectName,
      rating,
      communication,
      professionalism,
      payment,
      review,
      date: new Date().toISOString(),
    };

    // localStorage에 임시 저장 (실제로는 백엔드 API로 전송)
    const existingReviews = JSON.parse(localStorage.getItem("reviews") || "[]");
    existingReviews.push(reviewData);
    localStorage.setItem("reviews", JSON.stringify(existingReviews));

    // 프로필 페이지로 이동
    navigate("/profile/jieun");
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

  const SmallRatingStars = ({
    value,
    onChange
  }: {
    value: number;
    onChange: (v: number) => void;
  }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`size-5 ${
              star <= value
                ? "fill-[#00C9A7] text-[#00C9A7]"
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
          <h1 className="text-4xl font-bold mb-3">작업 후기 작성</h1>
          <p className="text-gray-600">
            함께 작업한 경험을 공유해주세요. 당신의 소중한 후기가 다른 크리에이터들에게 큰 도움이 됩니다.
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

          {/* Overall Rating */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <label className="block font-bold text-lg mb-4">
              전체 만족도 <span className="text-[#FF5C3A]">*</span>
            </label>
            <div className="flex items-center gap-4">
              <RatingStars
                value={rating}
                onChange={setRating}
                hovered={hoveredRating}
                onHover={setHoveredRating}
              />
              <span className="text-2xl font-bold text-[#00A88C]">
                {rating > 0 ? `${rating}.0` : "-"}
              </span>
            </div>
          </div>

          {/* Detailed Ratings */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <h3 className="font-bold text-lg mb-6">세부 평가</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold mb-1">의사소통</h4>
                  <p className="text-sm text-gray-600">응답 속도와 명확한 커뮤니케이션</p>
                </div>
                <SmallRatingStars value={communication} onChange={setCommunication} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold mb-1">전문성</h4>
                  <p className="text-sm text-gray-600">작업 품질과 전문 지식</p>
                </div>
                <SmallRatingStars value={professionalism} onChange={setProfessionalism} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold mb-1">결제 및 일정</h4>
                  <p className="text-sm text-gray-600">약속 이행과 마감일 준수</p>
                </div>
                <SmallRatingStars value={payment} onChange={setPayment} />
              </div>
            </div>
          </div>

          {/* Written Review */}
          <div className="mb-8">
            <label className="block font-bold text-lg mb-4">
              상세 후기 <span className="text-[#FF5C3A]">*</span>
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="함께 작업하면서 느낀 점, 인상 깊었던 부분, 다른 크리에이터들에게 추천하고 싶은 이유 등을 자유롭게 작성해주세요. (최소 50자 이상)"
              className="w-full h-48 px-4 py-3 bg-[#F7F7F5] border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#00C9A7] resize-none text-sm leading-relaxed"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm text-gray-500">최소 50자 이상 작성해주세요</p>
              <p className="text-sm text-gray-500">{review.length}자</p>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-br from-[#A8F0E4]/10 to-white border border-[#00C9A7]/20 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <MessageSquare className="size-5 text-[#00A88C] flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-sm mb-2">후기 작성 팁</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 구체적인 경험을 공유하면 더욱 도움이 됩니다</li>
                  <li>• 작업 과정에서 좋았던 점을 중심으로 작성해주세요</li>
                  <li>• 다른 크리에이터가 참고할 수 있는 정보를 포함해주세요</li>
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
              onClick={handleSubmit}
              disabled={rating === 0 || review.length < 50}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                rating === 0 || review.length < 50
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#00C9A7] to-[#00A88C] text-[#0F0F0F] hover:shadow-lg hover:scale-105 border border-white/30"
              }`}
            >
              <Send className="size-4" />
              후기 등록하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
