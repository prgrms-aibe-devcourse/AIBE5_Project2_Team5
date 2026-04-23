export const matchingCategories = [
  "그래픽 디자인",
  "포토그래피",
  "일러스트레이션",
  "3D Art",
  "UI/UX",
  "건축",
  "패션",
  "광고",
  "공예",
  "미술",
  "제품 디자인",
  "게임 디자인",
  "사운드",
];

export const designerJobOptions = [
  "브랜드 디자이너",
  "그래픽 디자이너",
  "UI 디자이너",
  "UX 디자이너",
  "UI/UX 디자이너",
  "웹 디자이너",
  "제품 디자이너",
  "패키지 디자이너",
  "패션 디자이너",
  "게임 디자이너",
  "사운드 디자이너",
  "모션 그래픽 디자이너",
  "3D 아티스트",
  "일러스트레이터",
  "포토그래퍼",
  "공예가",
  "건축가",
  "공간 디자이너",
  "광고 디자이너",
  "미술가",
];

const designerJobLabelByCategory: Record<string, string> = {
  "그래픽 디자인": "그래픽 디자이너",
  "포토그래피": "포토그래퍼",
  "일러스트레이션": "일러스트레이터",
  "3D Art": "3D 아티스트",
  "UI/UX": "UI/UX 디자이너",
  "건축": "건축가",
  "패션": "패션 디자이너",
  "광고": "광고 디자이너",
  "공예": "공예가",
  "미술": "미술가",
  "제품 디자인": "제품 디자이너",
  "게임 디자인": "게임 디자이너",
  "사운드": "사운드 디자이너",
};

export const normalizeDesignerJobLabel = (value?: string | null) => {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return "";
  }

  return designerJobLabelByCategory[trimmedValue] ?? trimmedValue;
};
