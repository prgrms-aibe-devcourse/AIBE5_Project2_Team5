import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import { Heart, MessageCircle, Bookmark, Calendar, MapPin, Star, ImagePlus, Upload, X, Figma, Sparkles, ExternalLink, CheckCircle, Pencil, Trash2, FolderPlus, FolderOpen } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { getCurrentUser, getCurrentUserRole, setCurrentUser } from "../utils/auth";
import { matchingCategories } from "../utils/matchingCategories";
import {
  getMyProfileApi,
  getMyProfileFeedsApi,
  getProfileApi,
  getProfileFeedsApi,
  updateMyDesignerProfileApi,
  updateMyProfileApi,
  type ProfileFeedResponse,
  type ProfileResponse,
} from "../api/profileApi";
import { createFeedApi, deleteFeedApi, updateFeedApi } from "../api/feedApi";
import { uploadFeedImagesApi, uploadProfileImageApi } from "../api/uploadApi";
import { followUserApi, unfollowUserApi } from "../api/followApi";
import {
  createCollectionFolderApi,
  deleteCollectionFolderApi,
  getCollectionFolderApi,
  getMyCollectionsApi,
  getProfileCollectionsApi,
  removeFeedFromCollectionApi,
  renameCollectionFolderApi,
  saveFeedToCollectionApi,
  type CollectionFolderDetailResponse,
  type CollectionFolderResponse,
} from "../api/collectionApi";

type FeedProjectAuthor = {
  name: string;
  role: string;
  avatar: string;
  username: string;
  roleType: string;
};

type FeedProject = {
  id: number;
  title: string;
  description: string;
  likes: number;
  comments: number;
  tags: string[];
  category?: string;
  author?: FeedProjectAuthor;
  imageUrl?: string;
  images?: string[];
  integrations?: FeedIntegration[];
  createdAt?: string;
  persisted?: boolean;
};

type FeedIntegration = {
  provider: "figma" | "adobe";
  label: string;
  url: string;
};

type ProfileTab = "feed" | "collection" | "reviews";

const getProfileTabFromParam = (tab: string | null): ProfileTab => {
  if (tab === "collection" || tab === "reviews") return tab;
  return "feed";
};

const formatProfileCount = (count?: number | null) => {
  const safeCount = count ?? 0;
  if (safeCount >= 1000) {
    const value = safeCount / 1000;
    return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}k`;
  }
  return String(safeCount);
};

const getProfileLookupKey = (username: string) => {
  const normalizedUsername = username.trim();
  if (!normalizedUsername || normalizedUsername.toLowerCase() === "me" || normalizedUsername === "jieun") {
    return "me";
  }
  return normalizedUsername;
};

const buildProfileBadges = (profile: ProfileResponse, fallbackBadges: string[]) => {
  const badges = [
    profile.job,
    profile.workType,
    profile.workStatus,
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => (value.startsWith("#") ? value : `#${value}`));

  return badges.length > 0 ? badges : fallbackBadges;
};

const mapProfileFeedToProject = (
  feed: ProfileFeedResponse,
  profile: ProfileResponse,
): FeedProject => ({
  id: feed.postId,
  title: feed.title,
  description: feed.description ?? "",
  likes: feed.pickCount ?? 0,
  comments: feed.commentCount,
  tags: feed.tags ?? [],
  category: feed.category ?? undefined,
  author: {
    name: profile.nickname,
    role: profile.job ?? profile.role,
    avatar: profile.profileImage ?? "",
    username: String(profile.userId),
    roleType: profile.role.toLowerCase(),
  },
  imageUrl: feed.imageUrls.length <= 1 ? feed.thumbnailImageUrl ?? undefined : undefined,
  images: feed.imageUrls.length > 1 ? feed.imageUrls : undefined,
  integrations: feed.portfolioUrl
    ? [
        {
          provider: "figma",
          label: "Portfolio",
          url: feed.portfolioUrl,
        },
      ]
    : undefined,
  createdAt: feed.createdAt ?? undefined,
  persisted: true,
});

const profileData = {
  name: "이지은 (Ji-eun Lee)",
  roleType: "designer",
  rating: 4.8,
  title: "UI/UX Designer & Brand Strategist",
  followers: "1.2k",
  following: "842",
  badges: ["#UI/UX", "#branding", "#illustration", "#3D Motion"],
  location: "서울, 대한민국",
  recentProject: "최근 브랜드 리뉴얼 프로젝트 진행",
  responseTime: "평균 응답 2시간 이내",
  avatar:
    "https://images.unsplash.com/photo-1768471125958-78556538fadc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBkZXNpZ25lciUyMHBvcnRyYWl0fGVufDF8fHx8MTc3NTU0MzkxNXww&ixlib=rb-4.1.0&q=80&w=1080",
};

const projects: FeedProject[] = [
  {
    id: 1,
    title: "Sustainable Fashion Brand Identity",
    description:
      "새로운 친환경 패션 브랜드를 위한 아이덴티티 작업을 진행하였습니다. 지속 가능 패션에 대한 가치를 그래픽으로 담아내고 있습니다.",
    likes: 259,
    comments: 18,
    tags: ["#branding", "#UI/UX"],
    category: "그래픽 디자인",
    imageUrl:
      "https://images.unsplash.com/photo-1772272935464-2e90d8218987?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1aSUyMHV4JTIwZGVzaWduJTIwaW50ZXJmYWNlfGVufDF8fHx8MTc3NTU0MTE1MXww&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 2,
    title: "Summer Motion Series",
    description:
      "여름의 생동감을 그래픽 모션으로 풀어낸 사이드 프로젝트입니다. 티저 영상과 소셜 콘텐츠에 활용할 수 있는 시퀀스 4종으로 구성했습니다.",
    likes: 182,
    comments: 32,
    category: "그래픽 디자인",
    tags: ["#motion", "#그래픽"],
    images: [
      "https://images.unsplash.com/photo-1740174459691-5b93c2fa0592?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3Rpb24lMjBncmFwaGljcyUyMGFuaW1hdGlvbnxlbnwxfHx8fDE3NzU1OTI4Mzh8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1768471125958-78556538fadc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBkZXNpZ25lciUyMHBvcnRyYWl0fGVufDF8fHx8MTc3NTU0MzkxNXww&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1657584942205-c34fec47404d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwYXJ0JTIwaWxsdXN0cmF0aW9ufGVufDF8fHx8MTc3NTU1ODM1OHww&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1772272935464-2e90d8218987?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1aSUyMHV4JTIwZGVzaWduJTIwaW50ZXJmYWNlfGVufDF8fHx8MTc3NTU0MTE1MXww&ixlib=rb-4.1.0&q=80&w=1080",
    ],
  },
];

const reviews = [
  {
    id: 1,
    company: "TechFlow Solutions",
    author: "김태현 대표",
    rating: 5,
    text: "디자인 품질이 정말 훌륭했습니다. 프로젝트를 한 단계 더 높은 수준으로 끌어올려주었고, 커뮤니케이션도 명확해서 매우 만족스러운 협업이었습니다.",
    tags: ["#webDesign", "#branding"],
    avatar: "https://i.pravatar.cc/160?img=11",
    displayCompany: "브랜드 리뉴얼 프로젝트",
    displayAuthor: "김서현 클라이언트",
    displayText: "브랜드 방향을 빠르게 이해하고 시안별 장단점을 깔끔하게 정리해줬어요. 피드백 반영도 정확해서 마지막까지 안심하고 진행했습니다.",
    workCategories: ["그래픽 디자인", "UI/UX"],
    complimentTags: ["말이 잘 통했어요", "디테일 장인", "수정이 깔끔해요", "다음에도 함께"],
    displayTags: [],
  },
  {
    id: 2,
    company: "CreativeLoft",
    author: "이수진 팀장",
    rating: 5,
    text: "콘셉트 이해도가 뛰어나고 시각적 완성도가 높았습니다. 레퍼런스를 빠르게 해석해 브랜드에 맞는 결과물로 잘 정리해주었습니다.",
    tags: ["#app-mobile-app"],
    avatar: "https://i.pravatar.cc/160?img=32",
    displayCompany: "제품 상세 페이지 촬영",
    displayAuthor: "이수진 클라이언트",
    displayRating: 4,
    displayText: "제품의 질감이 잘 보이도록 촬영 톤을 잡아줬고, 상세 페이지에 들어갈 컷 구성도 실용적이었어요. 일정 공유가 빨라서 협업이 편했습니다.",
    workCategories: ["포토그래피", "제품 디자인"],
    complimentTags: ["답장이 빨라요", "센스가 좋아요", "일정이 믿음직해요"],
    displayTags: [],
  },
  {
    id: 3,
    company: "캐릭터 일러스트 의뢰",
    author: "박민호 클라이언트",
    rating: 5,
    text: "러프 단계부터 캐릭터 성격이 잘 살아났고, 컬러 수정도 요청 의도를 정확히 반영해줬어요. 납품 파일 정리까지 깔끔했습니다.",
    workCategories: ["일러스트레이션"],
    complimentTags: ["설명이 쉬워요", "결과물이 예뻐요", "피드백 정리가 좋아요"],
    tags: [],
    avatar: "https://i.pravatar.cc/160?img=45",
  },
];

const reviewRatingOptions = [
  { value: 1, label: "조금 아쉬웠어요", description: "다음엔 더 맞춰봐요" },
  { value: 2, label: "무난했어요", description: "큰 문제는 없었어요" },
  { value: 3, label: "괜찮았어요", description: "기본은 탄탄했어요" },
  { value: 4, label: "만족했어요", description: "다시 맡겨도 좋아요" },
  { value: 5, label: "완전 추천해요", description: "협업 감각이 좋았어요" },
];

const reviewDetailItems = [
  { key: "communication", label: "의사소통" },
  { key: "professionalism", label: "전문성" },
  { key: "payment", label: "결제/일정" },
] as const;

const getReviewRatingOption = (value?: number) =>
  reviewRatingOptions.find((option) => option.value === value);

const categoryTagSuggestions: Record<string, string[]> = {
  "UI/UX": ["#앱디자인", "#와이어프레임", "#프로토타입"],
  "일러스트레이션": ["#캐릭터", "#디지털아트", "#러프"],
  "그래픽 디자인": ["#포스터", "#브랜딩", "#타이포그래피"],
  "포토그래피": ["#촬영", "#리터칭", "#룩북"],
  "제품 디자인": ["#제품렌더", "#패키지", "#상세페이지"],
  "3D Art": ["#모델링", "#렌더링", "#블렌더"],
  "건축": ["#공간기획", "#인테리어", "#투시도"],
  "패션": ["#룩북", "#스타일링", "#텍스타일"],
  "광고": ["#캠페인", "#키비주얼", "#카피"],
  "공예": ["#핸드메이드", "#소재", "#오브제"],
  "미술": ["#전시", "#페인팅", "#아트워크"],
  "게임 디자인": ["#캐릭터", "#UI", "#월드빌딩"],
  "사운드": ["#BGM", "#효과음", "#믹싱"],
};

export default function Profile() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<ProfileTab>(() =>
    getProfileTabFromParam(searchParams.get("tab"))
  );
  const [allReviews, setAllReviews] = useState(reviews);
  const username = params.username ? decodeURIComponent(params.username) : profileData.name;
  const profileLookupKey = getProfileLookupKey(username);
  const currentUser = getCurrentUser();
  const currentUserRole = getCurrentUserRole("designer");
  const profileFeedStorageKey = `pickxel:profile-feed:${username}`;
  const [apiProfile, setApiProfile] = useState<ProfileResponse | null>(null);
  const [apiFeedProjects, setApiFeedProjects] = useState<FeedProject[]>([]);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [hasLoadedProfileFeeds, setHasLoadedProfileFeeds] = useState(false);
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isFollowSaving, setIsFollowSaving] = useState(false);
  const [profileEditError, setProfileEditError] = useState("");
  const [editName, setEditName] = useState("");
  const [editNickname, setEditNickname] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editJob, setEditJob] = useState("");
  const [editIntroduction, setEditIntroduction] = useState("");
  const [editWorkStatus, setEditWorkStatus] = useState("");
  const [editWorkType, setEditWorkType] = useState("");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");
  const [collectionFolders, setCollectionFolders] = useState<CollectionFolderResponse[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<CollectionFolderDetailResponse | null>(null);
  const [isCollectionsLoading, setIsCollectionsLoading] = useState(false);
  const [collectionError, setCollectionError] = useState("");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [editingCollectionId, setEditingCollectionId] = useState<number | null>(null);
  const [editingCollectionName, setEditingCollectionName] = useState("");
  const [savingProjectIdToCollection, setSavingProjectIdToCollection] = useState<number | null>(null);
  const [uploadedProjects, setUploadedProjects] = useState<FeedProject[]>([]);
  const [isWorkComposerOpen, setIsWorkComposerOpen] = useState(false);
  const [workTitle, setWorkTitle] = useState("");
  const [workDescription, setWorkDescription] = useState("");
  const [workTags, setWorkTags] = useState("");
  const [workCategory, setWorkCategory] = useState("");
  const [workImages, setWorkImages] = useState<string[]>([]);
  const [workImageFiles, setWorkImageFiles] = useState<File[]>([]);
  const [coverImageIndex, setCoverImageIndex] = useState(0);
  const [figmaUrl, setFigmaUrl] = useState("");
  const [adobeUrl, setAdobeUrl] = useState("");
  const [editingFeed, setEditingFeed] = useState<FeedProject | null>(null);
  const [editFeedTitle, setEditFeedTitle] = useState("");
  const [editFeedDescription, setEditFeedDescription] = useState("");
  const [editFeedCategory, setEditFeedCategory] = useState("");
  const [editFeedPortfolioUrl, setEditFeedPortfolioUrl] = useState("");
  const [isSavingFeedEdit, setIsSavingFeedEdit] = useState(false);
  const [feedEditError, setFeedEditError] = useState("");
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const workImageInputRef = useRef<HTMLInputElement>(null);
  const isKimMinjae = username.includes("김민재");
  const isLeeSoyeon = username.includes("이소연");
  const isMetaverseTeam = username.includes("메타버스");
  const defaultProfile =
    currentUserRole === "client"
      ? {
          ...profileData,
          name: currentUser?.nickname || currentUser?.name || profileData.name,
          realName: currentUser?.name,
          roleType: "client",
          title: "클라이언트 · 프로젝트 의뢰자",
          badges: ["#클라이언트", "#프로젝트의뢰", "#브랜드협업", "#크리에이티브"],
          recentProject: "디자이너 매칭을 준비 중",
          responseTime: "평균 응답 2시간 이내",
        }
      : {
          ...profileData,
          name: currentUser?.nickname || currentUser?.name || profileData.name,
          realName: currentUser?.name,
          roleType: "designer",
        };
  const fallbackProfile = isKimMinjae
    ? {
        ...profileData,
        name: "김민재",
        roleType: "designer",
        rating: 4.9,
        title: "UX 전략 디렉터 @ StudioX",
        followers: "2.4k",
        following: "318",
        badges: ["#UX전략", "#브랜딩", "#디자인시스템", "#가이드라인"],
        location: "서울, 대한민국",
        recentProject: "브랜드 아이덴티티 프로젝트 진행 중",
        responseTime: "평균 응답 1시간 이내",
        avatar: "https://i.pravatar.cc/300?img=12",
      }
    : isLeeSoyeon
      ? {
          ...profileData,
          name: "이소연",
          roleType: "designer",
          rating: 4.8,
          title: "일러스트레이터 · 캐릭터 아트",
          followers: "1.7k",
          following: "426",
          badges: ["#일러스트", "#캐릭터", "#브랜드아트", "#에디토리얼"],
          location: "서울, 대한민국",
          recentProject: "캐릭터 일러스트 의뢰 상담 중",
          responseTime: "평균 응답 3시간 이내",
          avatar: "https://i.pravatar.cc/300?img=47",
        }
      : isMetaverseTeam
        ? {
            ...profileData,
            name: "메타버스 프로젝트 팀",
            roleType: "designer",
            rating: 4.7,
            title: "XR 콘텐츠 제작 팀",
            followers: "3.8k",
            following: "152",
            badges: ["#메타버스", "#XR", "#3D공간", "#인터랙션"],
            location: "서울, 대한민국",
            recentProject: "메타버스 월드 콘셉트 제작 중",
            responseTime: "평균 응답 1일 이내",
            avatar:
              "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=300",
          }
    : defaultProfile;
  const displayProfile = apiProfile
    ? {
        ...fallbackProfile,
        name: apiProfile.nickname,
        realName: apiProfile.name ?? undefined,
        roleType: apiProfile.role.toLowerCase(),
        rating: apiProfile.rating ?? fallbackProfile.rating,
        title: apiProfile.job || apiProfile.introduction || fallbackProfile.title,
        followers: formatProfileCount(apiProfile.followerCount ?? apiProfile.followCount),
        following: formatProfileCount(apiProfile.followingCount),
        badges: buildProfileBadges(apiProfile, fallbackProfile.badges),
        recentProject: apiProfile.introduction || fallbackProfile.recentProject,
        avatar: apiProfile.profileImage || currentUser?.profileImage || fallbackProfile.avatar,
        location: apiProfile.url || fallbackProfile.location,
      }
    : fallbackProfile;
  const isClientProfile = displayProfile.roleType === "client";
  const profileRoleLabel = isClientProfile ? "클라이언트" : "디자이너";
  const profileRoleBadgeClass = isClientProfile
    ? "border-[#FFB9AA] bg-[#FFF1ED] text-[#B13A21]"
    : "border-[#BDEFD8] bg-[#DDF8EC] text-[#007E68]";
  const canEditProfile = Boolean(apiProfile?.owner || profileLookupKey === "me");

  const handleProfileTabChange = (tab: ProfileTab) => {
    setActiveTab(tab);
    setSearchParams(tab === "feed" ? {} : { tab });
  };

  useEffect(() => {
    let ignore = false;
    setIsProfileLoading(true);
    setProfileError("");

    const request = profileLookupKey === "me" ? getMyProfileApi() : getProfileApi(profileLookupKey);

    request
      .then((profile) => {
        if (ignore) return;
        setApiProfile(profile);
      })
      .catch((error) => {
        if (ignore) return;
        setApiProfile(null);
        setProfileError(error instanceof Error ? error.message : "Failed to load profile.");
      })
      .finally(() => {
        if (!ignore) {
          setIsProfileLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [profileLookupKey]);

  useEffect(() => {
    if (!apiProfile) {
      setApiFeedProjects([]);
      setHasLoadedProfileFeeds(false);
      return;
    }

    let ignore = false;
    setHasLoadedProfileFeeds(false);
    const request =
      profileLookupKey === "me" ? getMyProfileFeedsApi() : getProfileFeedsApi(profileLookupKey);

    request
      .then((feeds) => {
        if (ignore) return;
        setApiFeedProjects(feeds.map((feed) => mapProfileFeedToProject(feed, apiProfile)));
        setHasLoadedProfileFeeds(true);
      })
      .catch(() => {
        if (ignore) return;
        setApiFeedProjects([]);
        setHasLoadedProfileFeeds(false);
      });

    return () => {
      ignore = true;
    };
  }, [apiProfile, profileLookupKey]);

  useEffect(() => {
    if (!apiProfile || activeTab !== "collection") return;

    let ignore = false;
    setIsCollectionsLoading(true);
    setCollectionError("");

    const request =
      profileLookupKey === "me" ? getMyCollectionsApi() : getProfileCollectionsApi(profileLookupKey);

    request
      .then((folders) => {
        if (ignore) return;
        setCollectionFolders(folders);
        setSelectedCollection(null);
      })
      .catch((error) => {
        if (ignore) return;
        setCollectionFolders([]);
        setSelectedCollection(null);
        setCollectionError(error instanceof Error ? error.message : "컬렉션을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!ignore) {
          setIsCollectionsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [activeTab, apiProfile, profileLookupKey]);

  useEffect(() => {
    if (!apiProfile) return;

    setEditName(apiProfile.name ?? "");
    setEditNickname(apiProfile.nickname);
    setEditUrl(apiProfile.url ?? "");
    setEditJob(apiProfile.job ?? "");
    setEditIntroduction(apiProfile.introduction ?? "");
    setEditWorkStatus(apiProfile.workStatus ?? "");
    setEditWorkType(apiProfile.workType ?? "");
  }, [apiProfile]);

  const handleOpenProfileEditor = () => {
    setProfileEditError("");
    setProfileImageFile(null);
    setProfileImagePreview("");
    setEditName(apiProfile?.name ?? currentUser?.name ?? "");
    setEditNickname(apiProfile?.nickname ?? currentUser?.nickname ?? "");
    setEditUrl(apiProfile?.url ?? "");
    setEditJob(apiProfile?.job ?? "");
    setEditIntroduction(apiProfile?.introduction ?? "");
    setEditWorkStatus(apiProfile?.workStatus ?? "");
    setEditWorkType(apiProfile?.workType ?? "");
    setIsProfileEditorOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setProfileEditError("이름을 입력해주세요.");
      return;
    }
    if (!editNickname.trim()) {
      setProfileEditError("닉네임을 입력해주세요.");
      return;
    }

    setIsSavingProfile(true);
    setProfileEditError("");

    try {
      let updatedProfile = await updateMyProfileApi({
        name: editName.trim(),
        nickname: editNickname.trim(),
        url: editUrl.trim(),
      });

      if (updatedProfile.role === "DESIGNER") {
        updatedProfile = await updateMyDesignerProfileApi({
          job: editJob.trim(),
          introduction: editIntroduction.trim(),
          workStatus: editWorkStatus,
          workType: editWorkType,
        });
      }

      if (profileImageFile) {
        const uploadedImage = await uploadProfileImageApi(profileImageFile);
        updatedProfile = {
          ...updatedProfile,
          profileImage: uploadedImage.imageUrl,
        };
      }

      setApiProfile(updatedProfile);
      setCurrentUser({
        userId: updatedProfile.userId,
        name: updatedProfile.name ?? editName.trim(),
        nickname: updatedProfile.nickname,
        email: updatedProfile.loginId,
        role: updatedProfile.role.toLowerCase() as "designer" | "client",
        profileImage: updatedProfile.profileImage,
      });
      setProfileImageFile(null);
      setProfileImagePreview("");
      setIsProfileEditorOpen(false);
    } catch (error) {
      setProfileEditError(error instanceof Error ? error.message : "프로필 수정에 실패했습니다.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!apiProfile || apiProfile.owner || isFollowSaving) return;

    setIsFollowSaving(true);
    setProfileError("");

    try {
      const response = apiProfile.following
        ? await unfollowUserApi(apiProfile.userId)
        : await followUserApi(apiProfile.userId);

      setApiProfile((current) =>
        current
          ? {
              ...current,
              following: response.following,
              followerCount: response.followerCount,
            }
          : current
      );
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "팔로우 상태를 변경하지 못했습니다.");
    } finally {
      setIsFollowSaving(false);
    }
  };

  const refreshCollections = async () => {
    if (!apiProfile) return;
    const folders =
      profileLookupKey === "me" ? await getMyCollectionsApi() : await getProfileCollectionsApi(profileLookupKey);
    setCollectionFolders(folders);
  };

  const handleCreateCollection = async () => {
    const folderName = newCollectionName.trim();
    if (!folderName) return;

    try {
      const folder = await createCollectionFolderApi(folderName);
      setCollectionFolders((current) => [folder, ...current]);
      setNewCollectionName("");
      setCollectionError("");
    } catch (error) {
      setCollectionError(error instanceof Error ? error.message : "컬렉션을 만들지 못했습니다.");
    }
  };

  const handleOpenCollection = async (folderId: number) => {
    setCollectionError("");
    try {
      const detail = await getCollectionFolderApi(folderId);
      setSelectedCollection(detail);
    } catch (error) {
      setCollectionError(error instanceof Error ? error.message : "컬렉션을 불러오지 못했습니다.");
    }
  };

  const handleRenameCollection = async (folderId: number) => {
    const folderName = editingCollectionName.trim();
    if (!folderName) return;

    try {
      const folder = await renameCollectionFolderApi(folderId, folderName);
      setCollectionFolders((current) =>
        current.map((item) => (item.folderId === folderId ? folder : item))
      );
      setSelectedCollection((current) =>
        current && current.folderId === folderId
          ? { ...current, folderName: folder.folderName }
          : current
      );
      setEditingCollectionId(null);
      setEditingCollectionName("");
      setCollectionError("");
    } catch (error) {
      setCollectionError(error instanceof Error ? error.message : "컬렉션 이름을 바꾸지 못했습니다.");
    }
  };

  const handleDeleteCollection = async (folderId: number) => {
    if (!window.confirm("이 컬렉션 폴더를 삭제할까요?")) return;

    try {
      await deleteCollectionFolderApi(folderId);
      setCollectionFolders((current) => current.filter((item) => item.folderId !== folderId));
      setSelectedCollection((current) => (current?.folderId === folderId ? null : current));
      setCollectionError("");
    } catch (error) {
      setCollectionError(error instanceof Error ? error.message : "컬렉션을 삭제하지 못했습니다.");
    }
  };

  const handleSaveProjectToCollection = async (project: FeedProject, folderId: number) => {
    setSavingProjectIdToCollection(project.id);
    setCollectionError("");

    try {
      const detail = await saveFeedToCollectionApi(folderId, project.id);
      await refreshCollections();
      setSelectedCollection((current) => (current?.folderId === folderId ? detail : current));
    } catch (error) {
      setCollectionError(error instanceof Error ? error.message : "피드를 컬렉션에 저장하지 못했습니다.");
    } finally {
      setSavingProjectIdToCollection(null);
    }
  };

  const handleRemoveProjectFromCollection = async (folderId: number, postId: number) => {
    try {
      const detail = await removeFeedFromCollectionApi(folderId, postId);
      await refreshCollections();
      setSelectedCollection(detail);
      setCollectionError("");
    } catch (error) {
      setCollectionError(error instanceof Error ? error.message : "컬렉션에서 피드를 제거하지 못했습니다.");
    }
  };

  useEffect(() => {
    // localStorage에서 새로운 후기 가져오기
    const savedReviews = localStorage.getItem("reviews");
    if (savedReviews) {
      const parsedReviews = JSON.parse(savedReviews);
      const formattedReviews = parsedReviews.map((r: any, idx: number) => ({
        id: reviews.length + idx + 1,
        company: r.projectName,
        author: r.clientName,
        rating: r.rating,
        text: r.review,
        tags: [],
        communication: r.communication,
        professionalism: r.professionalism,
        payment: r.payment,
        communicationLabel: r.communicationLabel,
        professionalismLabel: r.professionalismLabel,
        paymentLabel: r.paymentLabel,
        complimentTags: Array.isArray(r.complimentTags) ? r.complimentTags : [],
        workCategories: Array.isArray(r.workCategories) ? r.workCategories : [],
        date: r.date,
        avatar: `https://i.pravatar.cc/160?img=${20 + idx}`,
      }));
      setAllReviews([...formattedReviews, ...reviews]);
    }
  }, []);

  useEffect(() => {
    setActiveTab(getProfileTabFromParam(searchParams.get("tab")));
  }, [searchParams]);

  useEffect(() => {
    const savedProjects = localStorage.getItem(profileFeedStorageKey);
    if (!savedProjects) {
      setUploadedProjects([]);
      return;
    }

    try {
      const parsedProjects = JSON.parse(savedProjects);
      setUploadedProjects(Array.isArray(parsedProjects) ? parsedProjects : []);
    } catch {
      setUploadedProjects([]);
    }
  }, [profileFeedStorageKey]);

  const normalizeExternalUrl = (url: string) => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return "";
    return /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
  };

  const resetWorkComposer = () => {
    setWorkTitle("");
    setWorkDescription("");
    setWorkTags("");
    setWorkCategory("");
    setWorkImages([]);
    setWorkImageFiles([]);
    setCoverImageIndex(0);
    setFigmaUrl("");
    setAdobeUrl("");
  };

  const getWorkTagList = (value: string) =>
    Array.from(
      new Set(
        value
          .split(/[\s,]+/)
          .map((tag) => tag.trim())
          .filter(Boolean)
          .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
      )
    );

  const addSuggestedWorkTag = (tag: string) => {
    setWorkTags((prev) => {
      const currentTags = getWorkTagList(prev);
      if (currentTags.includes(tag)) return prev;
      return [...currentTags, tag].join(" ");
    });
  };

  const closeWorkComposer = () => {
    setIsWorkComposerOpen(false);
  };

  const readImageFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }
        reject(new Error("Failed to preview image."));
      };
      reader.onerror = () => reject(new Error("Failed to preview image."));
      reader.readAsDataURL(file);
    });

  const handleProfileImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      event.target.value = "";
      return;
    }

    event.target.value = "";

    try {
      const preview = await readImageFileAsDataUrl(file);
      setProfileImageFile(file);
      setProfileImagePreview(preview);
    } catch (error) {
      setProfileEditError(error instanceof Error ? error.message : "Failed to preview image.");
    }
  };

  const handleWorkImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith("image/")
    ).slice(0, Math.max(0, 4 - workImageFiles.length));

    if (files.length === 0) {
      event.target.value = "";
      return;
    }

    event.target.value = "";

    try {
      const previews = await Promise.all(files.map(readImageFileAsDataUrl));
      setWorkImageFiles((prev) => [...prev, ...files].slice(0, 4));
      setWorkImages((prev) => [...prev, ...previews].slice(0, 4));
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Failed to preview image.");
    }
  };

  const handleRemoveWorkImage = (imageIndex: number) => {
    const nextImages = workImages.filter((_, index) => index !== imageIndex);
    const nextFiles = workImageFiles.filter((_, index) => index !== imageIndex);
    setWorkImages(nextImages);
    setWorkImageFiles(nextFiles);
    setCoverImageIndex((prev) => {
      if (nextImages.length === 0) return 0;
      if (imageIndex === prev) return Math.min(prev, nextImages.length - 1);
      if (imageIndex < prev) return Math.max(0, prev - 1);
      return Math.min(prev, nextImages.length - 1);
    });
  };

  const getProjectPortfolioUrl = (project: FeedProject) =>
    project.integrations?.find((integration) => integration.url)?.url ?? "";

  const openFeedEditor = (project: FeedProject) => {
    setFeedEditError("");
    setEditingFeed(project);
    setEditFeedTitle(project.title);
    setEditFeedDescription(project.description);
    setEditFeedCategory(project.category ?? "");
    setEditFeedPortfolioUrl(getProjectPortfolioUrl(project));
  };

  const closeFeedEditor = () => {
    if (isSavingFeedEdit) return;
    setEditingFeed(null);
    setFeedEditError("");
  };

  const applyUpdatedFeedProject = (project: FeedProject) => {
    setApiFeedProjects((current) =>
      current.map((item) => (item.id === project.id ? project : item))
    );
    setUploadedProjects((current) =>
      current.map((item) => (item.id === project.id ? project : item))
    );
  };

  const removeDeletedFeedProject = (postId: number) => {
    setApiFeedProjects((current) => current.filter((item) => item.id !== postId));
    setUploadedProjects((current) => current.filter((item) => item.id !== postId));
  };

  const handleUpdateFeed = async () => {
    if (!editingFeed) return;
    if (!editFeedTitle.trim() || !editFeedDescription.trim() || !editFeedCategory) {
      setFeedEditError("제목, 설명, 카테고리를 입력해주세요.");
      return;
    }

    setIsSavingFeedEdit(true);
    setFeedEditError("");

    try {
      const updatedFeed = await updateFeedApi(editingFeed.id, {
        title: editFeedTitle.trim(),
        description: editFeedDescription.trim(),
        category: editFeedCategory,
        portfolioUrl: editFeedPortfolioUrl.trim(),
      });
      const integrations = updatedFeed.portfolioUrl
        ? [
            {
              provider: "figma" as const,
              label: "Portfolio",
              url: updatedFeed.portfolioUrl,
            },
          ]
        : undefined;
      const updatedProject: FeedProject = {
        ...editingFeed,
        title: updatedFeed.title,
        description: updatedFeed.description,
        likes: updatedFeed.pickCount ?? editingFeed.likes,
        comments: updatedFeed.commentCount ?? editingFeed.comments,
        category: updatedFeed.category,
        tags: [`#${updatedFeed.category}`],
        integrations,
        createdAt: updatedFeed.createdAt ?? editingFeed.createdAt,
        persisted: true,
      };

      applyUpdatedFeedProject(updatedProject);
      setEditingFeed(null);
    } catch (error) {
      setFeedEditError(error instanceof Error ? error.message : "피드 수정에 실패했습니다.");
    } finally {
      setIsSavingFeedEdit(false);
    }
  };

  const handleDeleteFeed = async (project: FeedProject) => {
    if (!window.confirm("이 작업물을 삭제할까요?")) return;

    try {
      await deleteFeedApi(project.id);
      removeDeletedFeedProject(project.id);
      setProfileError("");
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "피드 삭제에 실패했습니다.");
    }
  };

  const handleUploadWork = async () => {
    const trimmedTitle = workTitle.trim();
    const trimmedDescription = workDescription.trim();
    if (!trimmedTitle || !trimmedDescription || !workCategory) return;

    const tags = getWorkTagList(workTags);
    const integrations = [
      {
        provider: "figma" as const,
        label: "Figma",
        url: normalizeExternalUrl(figmaUrl),
      },
      {
        provider: "adobe" as const,
        label: "Adobe",
        url: normalizeExternalUrl(adobeUrl),
      },
    ].filter((integration) => integration.url);
    const portfolioUrl = integrations[0]?.url ?? "";

    try {
      const createdFeed = await createFeedApi({
        title: trimmedTitle,
        description: trimmedDescription,
        category: workCategory,
        portfolioUrl,
      });
      const orderedImageFiles = [...workImageFiles];
      if (coverImageIndex > 0 && coverImageIndex < orderedImageFiles.length) {
        const [coverImageFile] = orderedImageFiles.splice(coverImageIndex, 1);
        orderedImageFiles.unshift(coverImageFile);
      }
      const uploadedImages =
        orderedImageFiles.length > 0
          ? await uploadFeedImagesApi(createdFeed.postId, orderedImageFiles)
          : null;
      const uploadedImageUrls = uploadedImages?.imageUrls ?? [];

      const newProject: FeedProject = {
        id: createdFeed.postId,
        title: createdFeed.title,
        description: createdFeed.description ?? trimmedDescription,
        likes: createdFeed.pickCount ?? 0,
        comments: createdFeed.commentCount ?? 0,
        tags,
        category: createdFeed.category ?? workCategory,
        author: {
          name: displayProfile.name,
          role: displayProfile.title,
          avatar: displayProfile.avatar,
          username,
          roleType: displayProfile.roleType,
        },
        imageUrl: uploadedImageUrls.length === 1 ? uploadedImageUrls[0] : undefined,
        images: uploadedImageUrls.length > 1 ? uploadedImageUrls : undefined,
        integrations,
        createdAt: createdFeed.createdAt ?? new Date().toISOString(),
        persisted: true,
      };

      setUploadedProjects((current) => [newProject, ...current]);
      resetWorkComposer();
      setIsWorkComposerOpen(false);
      setProfileError("");
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Failed to create feed.");
    }
  };

  const feedProjects = [
    ...uploadedProjects,
    ...(hasLoadedProfileFeeds ? apiFeedProjects : projects),
  ];
  const canUploadWork =
    workTitle.trim().length > 0 &&
    workDescription.trim().length > 0 &&
    workCategory.length > 0;
  const workTagList = getWorkTagList(workTags);
  const previewCoverImage = workImages[Math.min(coverImageIndex, workImages.length - 1)] ?? "";
  const suggestedWorkTags = workCategory ? categoryTagSuggestions[workCategory] ?? [] : [];
  const uploadChecklist = [
    {
      label: workImages.length > 0 ? `이미지 ${workImages.length}장 추가됨` : "이미지를 추가해주세요",
      done: true,
    },
    {
      label: workCategory ? "카테고리 선택됨" : "카테고리를 선택해주세요",
      done: workCategory.length > 0,
    },
    {
      label: workTagList.length > 0 ? `태그 ${workTagList.length}개` : "태그 추천을 눌러 추가해보세요",
      done: workTagList.length > 0,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <div className="max-w-[1200px] mx-auto px-6 py-12">
        {isProfileLoading && (
          <div className="mb-6 rounded-lg border border-[#BDEFD8] bg-[#F5FFFB] px-4 py-3 text-sm font-semibold text-[#007E68]">
            Loading profile...
          </div>
        )}

        {profileError && (
          <div className="mb-6 rounded-lg border border-[#FFB9AA] bg-[#FFF7F4] px-4 py-3 text-sm font-semibold text-[#B13A21]">
            {profileError}
          </div>
        )}

        {/* Profile Header */}
        <div className="flex gap-8 mb-12">
          <div className="size-32 flex-shrink-0 overflow-hidden rounded-full bg-gray-100 shadow-sm">
            <ImageWithFallback
              src={displayProfile.avatar}
              alt={displayProfile.name}
              className="w-full h-full object-cover rounded-full"
            />
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold">{displayProfile.name}</h1>
                  <span
                    className={`rounded-lg border px-3 py-1 text-xs font-semibold ${profileRoleBadgeClass}`}
                  >
                    {profileRoleLabel}
                  </span>
                </div>
                {"realName" in displayProfile &&
                  displayProfile.realName &&
                  displayProfile.realName !== displayProfile.name && (
                    <p className="mb-2 text-sm font-medium text-gray-500">{displayProfile.realName}</p>
                  )}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-yellow-500">★ {displayProfile.rating}</span>
                </div>
                <p className="text-gray-600 mb-4">{displayProfile.title}</p>
              </div>
              <div className="flex gap-2">
                {canEditProfile && (
                  <button
                    type="button"
                    onClick={handleOpenProfileEditor}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 transition-all hover:-translate-y-0.5 hover:border-[#00C9A7] hover:text-[#007E68] focus:outline-none focus:ring-2 focus:ring-[#9EE7D0] focus:ring-offset-2"
                  >
                    프로필 수정
                  </button>
                )}
                {apiProfile && !apiProfile.owner && (
                  <button
                    type="button"
                    onClick={handleToggleFollow}
                    disabled={isFollowSaving}
                    className={`inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[#9EE7D0] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                      apiProfile.following
                        ? "border-[#9EE7D0] bg-white text-[#007E68] hover:border-[#00C9A7]"
                        : "border-[#00C9A7] bg-[#00C9A7] text-white shadow-[0_8px_18px_rgba(0,201,167,0.22)] hover:-translate-y-0.5 hover:bg-[#00A88C]"
                    }`}
                  >
                    {isFollowSaving ? "저장 중..." : apiProfile.following ? "팔로잉" : "팔로우"}
                  </button>
                )}
                <button
                  onClick={() => navigate('/messages')}
                  className="hidden"
                >
                  채팅하기
                </button>
                <button
                  onClick={() => navigate('/messages')}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#9EE7D0] bg-[#16A673] px-5 py-2.5 text-[0px] font-bold text-white shadow-[0_8px_18px_rgba(22,166,115,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#0E8F61] hover:shadow-[0_10px_22px_rgba(22,166,115,0.28)] focus:outline-none focus:ring-2 focus:ring-[#9EE7D0] focus:ring-offset-2 [&>span]:text-sm"
                >
                  <MessageCircle className="size-4" />
                  <span>메시지 보내기</span>
                  메시지 보내기
                </button>
              </div>
            </div>

            <div className="flex gap-8 mb-4">
              <div>
                <div className="text-2xl font-bold">{displayProfile.followers}</div>
                <div className="text-sm text-gray-600">팔로워</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{displayProfile.following}</div>
                <div className="text-sm text-gray-600">팔로잉</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {displayProfile.badges.map((badge, index) => (
                <span
                  key={index}
                  className="bg-[#4DD4AC] text-black px-3 py-1 rounded-full text-xs font-medium"
                >
                  {badge}
                </span>
              ))}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="size-4" />
                <span>{displayProfile.location}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="size-4" />
                <span>{displayProfile.recentProject}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <span>{displayProfile.responseTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <div className="flex gap-8">
            <button
              className={`px-4 py-3 border-b-2 ${
                activeTab === "feed" ? "border-black font-medium" : "text-gray-600 hover:text-black"
              }`}
              onClick={() => handleProfileTabChange("feed")}
            >
              피드 (Feed)
            </button>
            <button
              className={`px-4 py-3 ${
                activeTab === "collection" ? "border-b-2 border-black font-medium" : "text-gray-600 hover:text-black"
              }`}
              onClick={() => handleProfileTabChange("collection")}
            >
              컬렉션 (Collection)
            </button>
            <button
              className={`px-4 py-3 ${
                activeTab === "reviews" ? "border-b-2 border-black font-medium" : "text-gray-600 hover:text-black"
              }`}
              onClick={() => handleProfileTabChange("reviews")}
            >
              프로젝트 후기
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "feed" && (
          <div className="space-y-8 mb-12">
            {canEditProfile && (
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <button
                type="button"
                onClick={() => setIsWorkComposerOpen(true)}
                className="flex w-full items-center gap-3 text-left"
              >
                <ImageWithFallback
                  src={displayProfile.avatar}
                  alt={displayProfile.name}
                  className="size-11 rounded-full object-cover ring-2 ring-white shadow-sm"
                />
                <div className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-[#F7F7F5] px-4 py-3 text-sm text-gray-500 transition-colors hover:border-[#00C9A7] hover:bg-white">
                  새 작업물을 공유해보세요.
                </div>
                <span className="inline-flex items-center gap-2 rounded-lg bg-[#FF5C3A] px-4 py-3 text-sm font-semibold text-white">
                  <ImagePlus className="size-4" />
                  만들기
                </span>
              </button>
            </div>
            )}

            {feedProjects.map((project) => (
              <div key={project.id} className="bg-white rounded-2xl overflow-hidden border border-gray-200">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <ImageWithFallback
                      src={displayProfile.avatar}
                      alt={displayProfile.name}
                      className="size-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{displayProfile.name}</span>
                        <span
                          className={`rounded-lg border px-2 py-0.5 text-[10px] font-semibold ${profileRoleBadgeClass}`}
                        >
                          {profileRoleLabel}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {displayProfile.title}
                        {project.createdAt && (
                          <span>
                            {" · "}
                            {new Date(project.createdAt).toLocaleDateString("ko-KR", {
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      {canEditProfile && project.persisted && (
                        <>
                          <button
                            type="button"
                            onClick={() => openFeedEditor(project)}
                            className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:border-[#00C9A7] hover:text-[#007E68]"
                            aria-label="피드 수정"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFeed(project)}
                            className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:border-[#FFB9AA] hover:text-[#B13A21]"
                            aria-label="피드 삭제"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </>
                      )}
                      <button>
                        <MessageCircle className="size-5 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  {project.imageUrl && (
                    <div className="mb-4 rounded-xl overflow-hidden">
                      <ImageWithFallback
                        src={project.imageUrl}
                        alt={project.title}
                        className="w-full aspect-video object-cover"
                      />
                    </div>
                  )}

                  {project.images && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {project.images.map((img, idx) => (
                        <div key={idx} className="rounded-xl overflow-hidden aspect-square">
                          <ImageWithFallback
                            src={img}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {project.integrations && project.integrations.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {project.integrations.map((integration) => (
                        <a
                          key={`${project.id}-${integration.provider}`}
                          href={integration.url}
                          target="_blank"
                          rel="noreferrer"
                          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                            integration.provider === "figma"
                              ? "border-[#BDEFD8] bg-[#F5FFFB] text-[#007E68] hover:bg-[#E8FFF7]"
                              : "border-[#FFB9AA] bg-[#FFF7F4] text-[#B13A21] hover:bg-[#FFF1ED]"
                          }`}
                        >
                          {integration.provider === "figma" ? (
                            <Figma className="size-4" />
                          ) : (
                            <Sparkles className="size-4" />
                          )}
                          {integration.label} 연동
                          <ExternalLink className="size-3.5" />
                        </a>
                      ))}
                    </div>
                  )}

                  {project.category && (
                    <div className="mb-3">
                      <span className="inline-flex rounded-lg border border-[#FFB9AA] bg-[#FFF7F4] px-3 py-1.5 text-xs font-bold text-[#B13A21]">
                        {project.category}
                      </span>
                    </div>
                  )}

                  {project.tags && (
                    <div className="flex gap-2 mb-3">
                      {project.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="bg-[#4DD4AC] text-black px-3 py-1 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{project.description}</p>

                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <button className="flex items-center gap-2 hover:text-red-500">
                      <Heart className="size-4" />
                      <span>{project.likes}</span>
                    </button>
                    <button className="flex items-center gap-2 hover:text-blue-500">
                      <MessageCircle className="size-4" />
                      <span>{project.comments}</span>
                    </button>
                    <button className="ml-auto hover:text-black">
                      <Bookmark className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "collection" && (
          <div className="space-y-8 mb-12">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">컬렉션</h2>
                <p className="mt-1 text-sm text-gray-500">저장한 작업을 폴더별로 모아볼 수 있어요.</p>
              </div>
              {canEditProfile && (
                <div className="flex min-w-[280px] max-w-md flex-1 gap-2">
                  <input
                    value={newCollectionName}
                    onChange={(event) => setNewCollectionName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleCreateCollection();
                      }
                    }}
                    placeholder="새 컬렉션 이름"
                    className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-[#00C9A7] focus:ring-2 focus:ring-[#9EE7D0]"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCollection}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#00C9A7] px-4 py-2 text-sm font-bold text-white hover:bg-[#00A88C]"
                  >
                    <FolderPlus className="size-4" />
                    추가
                  </button>
                </div>
              )}
            </div>

            {collectionError && (
              <div className="rounded-lg border border-[#FFB9AA] bg-[#FFF7F4] px-4 py-3 text-sm font-semibold text-[#B13A21]">
                {collectionError}
              </div>
            )}

            {isCollectionsLoading ? (
              <div className="rounded-lg border border-[#BDEFD8] bg-[#F5FFFB] px-4 py-3 text-sm font-semibold text-[#007E68]">
                컬렉션을 불러오는 중...
              </div>
            ) : collectionFolders.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white py-16 text-center">
                <div className="mb-4 text-5xl">[]</div>
                <h3 className="mb-2 text-2xl font-bold">컬렉션이 비어있어요</h3>
                <p className="text-gray-600">마음에 드는 작업을 저장할 폴더를 만들어보세요.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {collectionFolders.map((folder) => (
                  <div
                    key={folder.folderId}
                    className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenCollection(folder.folderId)}
                      className="mb-4 grid h-36 w-full grid-cols-2 gap-1 overflow-hidden rounded-lg bg-[#F7F7F5]"
                    >
                      {folder.previewImageUrls.length > 0 ? (
                        folder.previewImageUrls.slice(0, 4).map((url, index) => (
                          <ImageWithFallback
                            key={`${folder.folderId}-${url}-${index}`}
                            src={url}
                            alt={folder.folderName}
                            className="h-full w-full object-cover"
                          />
                        ))
                      ) : (
                        <div className="col-span-2 flex items-center justify-center text-gray-400">
                          <FolderOpen className="size-10" />
                        </div>
                      )}
                    </button>

                    {editingCollectionId === folder.folderId ? (
                      <div className="flex gap-2">
                        <input
                          value={editingCollectionName}
                          onChange={(event) => setEditingCollectionName(event.target.value)}
                          className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#00C9A7]"
                        />
                        <button
                          type="button"
                          onClick={() => handleRenameCollection(folder.folderId)}
                          className="rounded-lg bg-[#00C9A7] px-3 py-2 text-xs font-bold text-white"
                        >
                          저장
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold">{folder.folderName}</h3>
                          <p className="mt-1 text-sm text-gray-500">{folder.itemCount}개 피드</p>
                        </div>
                        {canEditProfile && (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCollectionId(folder.folderId);
                                setEditingCollectionName(folder.folderName);
                              }}
                              className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:border-[#00C9A7] hover:text-[#007E68]"
                              aria-label="컬렉션 이름 수정"
                            >
                              <Pencil className="size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCollection(folder.folderId)}
                              className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:border-[#FFB9AA] hover:text-[#B13A21]"
                              aria-label="컬렉션 삭제"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {selectedCollection && (
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold">{selectedCollection.folderName}</h3>
                    <p className="text-sm text-gray-500">{selectedCollection.feeds.length}개 피드</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCollection(null)}
                    className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:text-black"
                    aria-label="닫기"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                {selectedCollection.feeds.length === 0 ? (
                  <div className="rounded-lg bg-[#F7F7F5] py-10 text-center text-sm text-gray-500">
                    아직 저장된 피드가 없어요.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {selectedCollection.feeds.map((feed) => (
                      <div key={feed.postId} className="rounded-lg border border-gray-200 p-4">
                        {feed.thumbnailImageUrl && (
                          <ImageWithFallback
                            src={feed.thumbnailImageUrl}
                            alt={feed.title}
                            className="mb-3 aspect-video w-full rounded-lg object-cover"
                          />
                        )}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-bold">{feed.title}</h4>
                            <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                              {feed.description}
                            </p>
                          </div>
                          {canEditProfile && (
                            <button
                              type="button"
                              onClick={() => handleRemoveProjectFromCollection(selectedCollection.folderId, feed.postId)}
                              className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:border-[#FFB9AA] hover:text-[#B13A21]"
                              aria-label="저장 피드 제거"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {canEditProfile && collectionFolders.length > 0 && feedProjects.length > 0 && (
              <div className="rounded-lg border border-[#BDEFD8] bg-[#F5FFFB] p-5">
                <h3 className="mb-3 text-lg font-bold text-[#007E68]">내 피드 저장하기</h3>
                <div className="space-y-3">
                  {feedProjects
                    .filter((project) => project.persisted)
                    .map((project) => (
                      <div
                        key={`save-${project.id}`}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-3"
                      >
                        <div>
                          <p className="font-semibold">{project.title}</p>
                          <p className="text-xs text-gray-500">저장할 컬렉션을 선택하세요.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {collectionFolders.map((folder) => (
                            <button
                              key={`${project.id}-${folder.folderId}`}
                              type="button"
                              onClick={() => handleSaveProjectToCollection(project, folder.folderId)}
                              disabled={savingProjectIdToCollection === project.id}
                              className="rounded-lg border border-[#9EE7D0] px-3 py-1.5 text-xs font-bold text-[#007E68] hover:bg-[#E8FFF7] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {savingProjectIdToCollection === project.id ? "저장 중" : folder.folderName}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">프로젝트 후기</h2>
              <div className="text-sm text-gray-600">총 {allReviews.length}개의 후기</div>
            </div>
            <div className="space-y-4">
              {allReviews.map((review) => (
                <div key={review.id} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4 mb-4">
                    <ImageWithFallback
                      src={review.avatar}
                      alt={(review as any).displayAuthor || review.author}
                      className="size-14 flex-shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-bold text-lg">
                            {(review as any).displayCompany || review.company}
                          </div>
                          <div className="text-sm text-gray-600">
                            {(review as any).displayAuthor || review.author}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`size-5 ${
                                i < ((review as any).displayRating || review.rating)
                                  ? "fill-[#FF5C3A] text-[#FF5C3A]"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {(review as any).workCategories?.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                          <div className="hidden">
                            작업 분야
                          </div>
                          <div className="contents">
                            {(review as any).workCategories.map((category: string) => (
                              <span
                                key={category}
                                className="inline-flex items-center rounded-lg border border-[#00C9A7]/30 bg-[#F2FFFC] px-3 py-1.5 text-xs font-bold text-[#007E68] shadow-sm"
                              >
                                {category}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Button-style detailed ratings if available */}
                      {(review as any).communication && (
                        <div className="grid gap-2 mb-4 rounded-lg bg-[#F7F7F5] p-3 sm:grid-cols-3">
                          {reviewDetailItems.map((item) => {
                            const option = getReviewRatingOption((review as any)[item.key]);
                            const savedLabel = (review as any)[`${item.key}Label`];
                            const displayLabel = savedLabel || option?.label;

                            if (!displayLabel) return null;

                            return (
                              <div
                                key={item.key}
                                className="rounded-lg border border-[#00C9A7]/30 bg-white px-3 py-2 shadow-sm"
                              >
                                <div className="mb-1 text-xs font-semibold text-gray-500">
                                  {item.label}
                                </div>
                                <div className="flex items-center gap-1.5 text-sm font-bold text-[#007E68]">
                                  <CheckCircle className="size-4 text-[#00C9A7]" />
                                  {displayLabel}
                                </div>
                                {option?.description && (
                                  <div className="mt-0.5 text-[11px] font-medium text-gray-500">
                                    {option.description}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {(review as any).complimentTags?.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {(review as any).complimentTags.map((tag: string) => (
                            <span
                              key={tag}
                              className="inline-flex items-center rounded-lg border border-[#FFB6A6] bg-[#FFF3EF] px-3 py-1.5 text-xs font-bold text-[#D84325] shadow-sm"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-3">
                    {(review as any).displayText || review.text}
                  </p>
                  {(((review as any).displayTags ?? review.tags)?.length ?? 0) > 0 && (
                    <div className="flex gap-2">
                      {((review as any).displayTags ?? review.tags).map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="bg-[#A8F0E4]/20 text-[#00A88C] px-3 py-1 rounded-full text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {(review as any).date && (
                    <div className="text-xs text-gray-500 mt-3">
                      {new Date((review as any).date).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isWorkComposerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={closeWorkComposer}
        >
          <div
            className="grid max-h-[90vh] w-full max-w-7xl overflow-y-auto rounded-lg bg-white shadow-2xl lg:grid-cols-[0.9fr_0.95fr_0.8fr] lg:overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex min-h-[420px] flex-col bg-[#0F0F0F]">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white">
                <span className="text-sm font-semibold">새 게시물</span>
                <button
                  type="button"
                  onClick={() => workImageInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold transition-colors hover:bg-white/15"
                >
                  <ImagePlus className="size-4" />
                  이미지 추가
                </button>
              </div>

              <input
                ref={workImageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleWorkImageChange}
                className="hidden"
              />

              <div className="flex flex-1 items-center justify-center p-4">
                {workImages.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => workImageInputRef.current?.click()}
                    className="flex h-full min-h-[360px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-white/30 bg-white/5 text-white transition-colors hover:bg-white/10"
                  >
                    <ImagePlus className="mb-4 size-12" />
                    <span className="text-lg font-semibold">사진과 시안을 선택하세요</span>
                    <span className="mt-2 text-sm text-white/65">
                      최대 4장까지 한 게시물에 올릴 수 있습니다.
                    </span>
                  </button>
                ) : workImages.length === 1 ? (
                  <div className="relative max-h-[68vh] w-full overflow-hidden rounded-lg bg-black">
                    <ImageWithFallback
                      src={workImages[0]}
                      alt="작업물 미리보기"
                      className="max-h-[68vh] w-full object-contain"
                    />
                    <span className="absolute left-3 top-3 rounded-lg bg-[#FF5C3A] px-2.5 py-1 text-xs font-bold text-white">
                      대표
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveWorkImage(0)}
                      className="absolute right-3 top-3 rounded-lg bg-black/60 p-2 text-white transition-colors hover:bg-black/80"
                      aria-label="이미지 제거"
                    >
                      <X className="size-5" />
                    </button>
                  </div>
                ) : (
                  <div className="grid w-full grid-cols-2 gap-2">
                    {workImages.map((image, index) => (
                      <div
                        key={`${image}-${index}`}
                        className="relative aspect-square overflow-hidden rounded-lg bg-black"
                      >
                        <ImageWithFallback
                          src={image}
                          alt={`작업물 미리보기 ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                        {coverImageIndex === index ? (
                          <span className="absolute left-2 top-2 rounded-lg bg-[#FF5C3A] px-2 py-1 text-[11px] font-bold text-white shadow-sm">
                            대표
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setCoverImageIndex(index)}
                            className="absolute left-2 top-2 rounded-lg bg-black/60 px-2 py-1 text-[11px] font-bold text-white transition-colors hover:bg-[#FF5C3A]"
                          >
                            대표로
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveWorkImage(index)}
                          className="absolute right-2 top-2 rounded-lg bg-black/60 p-1.5 text-white transition-colors hover:bg-black/80"
                          aria-label="이미지 제거"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex max-h-[90vh] flex-col">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <div className="flex items-center gap-3">
                  <ImageWithFallback
                    src={displayProfile.avatar}
                    alt={displayProfile.name}
                    className="size-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{displayProfile.name}</span>
                      <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-semibold ${profileRoleBadgeClass}`}>
                        {profileRoleLabel}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">작업 피드에 공유</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeWorkComposer}
                  className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                  aria-label="게시물 작성 닫기"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">
                    작업물 제목
                  </span>
                  <input
                    type="text"
                    value={workTitle}
                    onChange={(event) => setWorkTitle(event.target.value)}
                    placeholder="예: 브랜드 리뉴얼 시안"
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-[#00C9A7]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">
                    캡션
                  </span>
                  <textarea
                    value={workDescription}
                    onChange={(event) => setWorkDescription(event.target.value)}
                    placeholder="작업 의도, 사용 툴, 협업 포인트를 적어주세요."
                    rows={7}
                    className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-[#00C9A7]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">
                    태그
                  </span>
                  <input
                    type="text"
                    value={workTags}
                    onChange={(event) => setWorkTags(event.target.value)}
                    placeholder="branding UI illustration"
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-[#00C9A7]"
                  />
                  <span className="mt-1 block text-xs text-gray-500">
                    띄어쓰기나 쉼표로 구분하면 게시물에 태그로 붙습니다.
                  </span>
                  {workTagList.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {workTagList.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-lg bg-[#EFFFFC] px-3 py-1.5 text-xs font-bold text-[#007E68]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </label>

                <div className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">
                    탐색 카테고리
                  </span>
                  <p className="mb-3 text-xs text-gray-500">
                    탐색 페이지에서 분류될 작업 분야를 골라주세요.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {matchingCategories.map((category) => {
                      const isSelected = workCategory === category;

                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => setWorkCategory(category)}
                          className={`rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                            isSelected
                              ? "border-[#FF5C3A] bg-[#FFF1ED] text-[#B13A21] shadow-sm"
                              : "border-gray-200 bg-[#F7F7F5] text-gray-600 hover:border-[#FF5C3A] hover:bg-white"
                          }`}
                          aria-pressed={isSelected}
                        >
                          {category}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-4 rounded-lg border border-[#BDEFD8] bg-[#F5FFFB] p-3">
                    <p className="mb-2 text-xs font-bold text-[#007E68]">
                      {workCategory ? `${workCategory} 추천 태그` : "카테고리를 선택하면 추천 태그가 나와요"}
                    </p>
                    {suggestedWorkTags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {suggestedWorkTags.map((tag) => {
                          const isAdded = workTagList.includes(tag);

                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => addSuggestedWorkTag(tag)}
                              disabled={isAdded}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                                isAdded
                                  ? "cursor-default border-[#00C9A7]/30 bg-[#EFFFFC] text-[#007E68]"
                                  : "border-white bg-white text-gray-700 shadow-sm hover:-translate-y-0.5 hover:border-[#00C9A7] hover:text-[#007E68]"
                              }`}
                            >
                              {isAdded ? `${tag} 추가됨` : tag}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs font-medium text-gray-500">
                        분야를 먼저 고르면 바로 넣을 수 있는 태그를 추천해드릴게요.
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-[#FAFBF8] p-4">
                  <div className="mb-3">
                    <h3 className="text-sm font-bold text-[#12382D]">작업 파일 연동</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Figma 또는 Adobe 작업 링크를 함께 공유할 수 있습니다.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 rounded-lg bg-white px-3 py-2">
                      <Figma className="size-5 shrink-0 text-[#00A88C]" />
                      <input
                        type="url"
                        value={figmaUrl}
                        onChange={(event) => setFigmaUrl(event.target.value)}
                        placeholder="Figma 링크"
                        className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                      />
                    </label>
                    <label className="flex items-center gap-3 rounded-lg bg-white px-3 py-2">
                      <Sparkles className="size-5 shrink-0 text-[#FF5C3A]" />
                      <input
                        type="url"
                        value={adobeUrl}
                        onChange={(event) => setAdobeUrl(event.target.value)}
                        placeholder="Adobe 링크"
                        className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 p-5">
                <div className="mb-4 rounded-lg border border-gray-200 bg-[#FAFBF8] p-3">
                  <p className="mb-2 text-xs font-bold text-[#12382D]">
                    업로드 전 체크리스트
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {uploadChecklist.map((item) => (
                      <span
                        key={item.label}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold ${
                          item.done
                            ? "border-[#00C9A7]/30 bg-[#F2FFFC] text-[#007E68]"
                            : "border-gray-200 bg-white text-gray-500"
                        }`}
                      >
                        <CheckCircle
                          className={`size-3.5 ${
                            item.done ? "text-[#00C9A7]" : "text-gray-300"
                          }`}
                        />
                        {item.label}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleUploadWork}
                  disabled={!canUploadWork}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF5C3A] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-[#E94F2F] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Upload className="size-4" />
                  공유하기
                </button>
              </div>
            </div>

            <aside className="flex max-h-[90vh] flex-col border-l border-gray-200 bg-[#F7F7F5]">
              <div className="border-b border-gray-200 px-5 py-4">
                <p className="text-sm font-bold text-[#12382D]">게시물 미리보기</p>
                <p className="mt-1 text-xs text-gray-500">
                  실제 피드에 올라갈 모습을 확인해보세요.
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <article className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                  <div className="flex items-center gap-3 border-b border-gray-100 p-4">
                    <ImageWithFallback
                      src={displayProfile.avatar}
                      alt={displayProfile.name}
                      className="size-10 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-bold text-[#12382D]">
                          {displayProfile.name}
                        </p>
                        <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-semibold ${profileRoleBadgeClass}`}>
                          {profileRoleLabel}
                        </span>
                      </div>
                      <p className="truncate text-xs text-gray-500">{displayProfile.title}</p>
                    </div>
                  </div>

                  {previewCoverImage ? (
                    <div className="relative aspect-square bg-black">
                      <ImageWithFallback
                        src={previewCoverImage}
                        alt="게시물 대표 이미지 미리보기"
                        className="h-full w-full object-cover"
                      />
                      {workImages.length > 1 && (
                        <span className="absolute right-3 top-3 rounded-lg bg-black/65 px-2 py-1 text-xs font-bold text-white">
                          1/{workImages.length}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex aspect-square flex-col items-center justify-center bg-[#F1F1EE] text-gray-500">
                      <ImagePlus className="mb-3 size-10" />
                      <p className="text-sm font-semibold">이미지를 추가하면 미리보기가 보여요</p>
                    </div>
                  )}

                  <div className="space-y-3 p-4">
                    <div className="flex items-center gap-4 text-gray-700">
                      <Heart className="size-5" />
                      <MessageCircle className="size-5" />
                      <Bookmark className="ml-auto size-5" />
                    </div>

                    {workCategory && (
                      <span className="inline-flex rounded-lg bg-[#FFF1ED] px-2.5 py-1 text-xs font-bold text-[#D84325]">
                        {workCategory}
                      </span>
                    )}

                    <div>
                      <h3 className="line-clamp-2 text-sm font-bold text-[#12382D]">
                        {workTitle.trim() || "게시물 제목이 여기에 보여요"}
                      </h3>
                      <p className="mt-1 line-clamp-4 text-sm leading-relaxed text-gray-600">
                        {workDescription.trim() || "캡션을 작성하면 피드 카드에서 보이는 문장 흐름을 바로 확인할 수 있어요."}
                      </p>
                    </div>

                    {workTagList.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {workTagList.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-lg bg-[#F2FFFC] px-2.5 py-1 text-xs font-bold text-[#007E68]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {(figmaUrl.trim() || adobeUrl.trim()) && (
                      <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                        {figmaUrl.trim() && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-[#E8FBF7] px-2.5 py-1 text-xs font-bold text-[#007E68]">
                            <Figma className="size-3.5" />
                            Figma
                          </span>
                        )}
                        {adobeUrl.trim() && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-[#FFF1ED] px-2.5 py-1 text-xs font-bold text-[#D84325]">
                            <Sparkles className="size-3.5" />
                            Adobe
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              </div>
            </aside>
          </div>
        </div>
      )}

      {isProfileEditorOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          onClick={() => setIsProfileEditorOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[#00A88C]">내 프로필</p>
                <h2 className="mt-1 text-2xl font-bold text-[#0F0F0F]">프로필 수정</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileEditorOpen(false)}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-black"
              >
                <X className="size-5" />
              </button>
            </div>

            {profileEditError && (
              <div className="mb-4 rounded-lg border border-[#FFB9AA] bg-[#FFF7F4] px-4 py-3 text-sm font-semibold text-[#B13A21]">
                {profileEditError}
              </div>
            )}

            <div className="grid gap-4">
              <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-[#F7F7F5] p-4">
                <ImageWithFallback
                  src={profileImagePreview || apiProfile?.profileImage || displayProfile.avatar}
                  alt="프로필 이미지 미리보기"
                  className="size-20 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-700">프로필 이미지</p>
                  <p className="mt-1 text-xs text-gray-500">JPG, PNG, WebP, GIF 파일을 업로드할 수 있습니다.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => profileImageInputRef.current?.click()}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <ImagePlus className="size-4" />
                      이미지 선택
                    </button>
                    {profileImageFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileImageFile(null);
                          setProfileImagePreview("");
                        }}
                        className="h-9 rounded-lg border border-[#FFB9AA] bg-white px-3 text-xs font-bold text-[#B13A21] transition-colors hover:bg-[#FFF7F4]"
                      >
                        선택 취소
                      </button>
                    )}
                  </div>
                  <input
                    ref={profileImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                    className="hidden"
                  />
                </div>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-gray-700">이름</span>
                <input
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  maxLength={30}
                  className="h-11 rounded-lg border border-gray-200 px-3 text-sm outline-none transition-colors focus:border-[#00C9A7] focus:ring-2 focus:ring-[#BDEFD8]"
                  placeholder="실명을 입력해주세요"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-gray-700">닉네임</span>
                <input
                  value={editNickname}
                  onChange={(event) => setEditNickname(event.target.value)}
                  maxLength={10}
                  className="h-11 rounded-lg border border-gray-200 px-3 text-sm outline-none transition-colors focus:border-[#00C9A7] focus:ring-2 focus:ring-[#BDEFD8]"
                  placeholder="프로필에 보일 닉네임"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-gray-700">URL</span>
                <input
                  value={editUrl}
                  onChange={(event) => setEditUrl(event.target.value)}
                  maxLength={255}
                  className="h-11 rounded-lg border border-gray-200 px-3 text-sm outline-none transition-colors focus:border-[#00C9A7] focus:ring-2 focus:ring-[#BDEFD8]"
                  placeholder="https://portfolio.example.com"
                />
              </label>

              {!isClientProfile && (
                <div className="mt-2 grid gap-4 rounded-lg border border-gray-200 bg-[#F7F7F5] p-4">
                  <div>
                    <p className="text-sm font-bold text-[#0F0F0F]">디자이너 정보</p>
                    <p className="mt-1 text-xs text-gray-500">프로필 상단에 보일 직무와 소개를 저장해요.</p>
                  </div>

                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-gray-700">직무</span>
                    <input
                      value={editJob}
                      onChange={(event) => setEditJob(event.target.value)}
                      maxLength={50}
                      className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition-colors focus:border-[#00C9A7] focus:ring-2 focus:ring-[#BDEFD8]"
                      placeholder="UI/UX Designer"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-gray-700">소개</span>
                    <textarea
                      value={editIntroduction}
                      onChange={(event) => setEditIntroduction(event.target.value)}
                      rows={4}
                      className="resize-none rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm outline-none transition-colors focus:border-[#00C9A7] focus:ring-2 focus:ring-[#BDEFD8]"
                      placeholder="작업 스타일이나 가능한 프로젝트를 적어주세요"
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-gray-700">작업 상태</span>
                      <select
                        value={editWorkStatus}
                        onChange={(event) => setEditWorkStatus(event.target.value)}
                        className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition-colors focus:border-[#00C9A7] focus:ring-2 focus:ring-[#BDEFD8]"
                      >
                        <option value="">선택 안 함</option>
                        <option value="AVAILABLE">작업 가능</option>
                        <option value="CONSULTATION_AVAILABLE">상담 가능</option>
                        <option value="UNAVAILABLE">작업 불가</option>
                      </select>
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-gray-700">작업 형태</span>
                      <select
                        value={editWorkType}
                        onChange={(event) => setEditWorkType(event.target.value)}
                        className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition-colors focus:border-[#00C9A7] focus:ring-2 focus:ring-[#BDEFD8]"
                      >
                        <option value="">선택 안 함</option>
                        <option value="FREELANCER">프리랜서</option>
                        <option value="FULL_TIME">풀타임</option>
                      </select>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsProfileEditorOpen(false)}
                className="h-11 rounded-lg border border-gray-200 px-5 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="h-11 rounded-lg bg-[#00C9A7] px-5 text-sm font-bold text-[#0F0F0F] transition-colors hover:bg-[#00A88C] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingProfile ? "저장 중..." : "저장하기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingFeed && (
        <div
          className="fixed inset-0 z-[125] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          onClick={closeFeedEditor}
        >
          <div
            className="w-full max-w-xl rounded-lg bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[#00A88C]">작업물</p>
                <h2 className="mt-1 text-2xl font-bold text-[#0F0F0F]">피드 수정</h2>
              </div>
              <button
                type="button"
                onClick={closeFeedEditor}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-black"
              >
                <X className="size-5" />
              </button>
            </div>

            {feedEditError && (
              <div className="mb-4 rounded-lg border border-[#FFB9AA] bg-[#FFF7F4] px-4 py-3 text-sm font-semibold text-[#B13A21]">
                {feedEditError}
              </div>
            )}

            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-gray-700">제목</span>
                <input
                  value={editFeedTitle}
                  onChange={(event) => setEditFeedTitle(event.target.value)}
                  maxLength={100}
                  className="h-11 rounded-lg border border-gray-200 px-3 text-sm outline-none transition-colors focus:border-[#00C9A7] focus:ring-2 focus:ring-[#BDEFD8]"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-gray-700">설명</span>
                <textarea
                  value={editFeedDescription}
                  onChange={(event) => setEditFeedDescription(event.target.value)}
                  rows={4}
                  className="resize-none rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none transition-colors focus:border-[#00C9A7] focus:ring-2 focus:ring-[#BDEFD8]"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-gray-700">카테고리</span>
                <select
                  value={editFeedCategory}
                  onChange={(event) => setEditFeedCategory(event.target.value)}
                  className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition-colors focus:border-[#00C9A7] focus:ring-2 focus:ring-[#BDEFD8]"
                >
                  <option value="">카테고리 선택</option>
                  {matchingCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-gray-700">포트폴리오 URL</span>
                <input
                  value={editFeedPortfolioUrl}
                  onChange={(event) => setEditFeedPortfolioUrl(event.target.value)}
                  maxLength={200}
                  className="h-11 rounded-lg border border-gray-200 px-3 text-sm outline-none transition-colors focus:border-[#00C9A7] focus:ring-2 focus:ring-[#BDEFD8]"
                  placeholder="https://portfolio.example.com/work"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeFeedEditor}
                className="h-11 rounded-lg border border-gray-200 px-5 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleUpdateFeed}
                disabled={isSavingFeedEdit}
                className="h-11 rounded-lg bg-[#00C9A7] px-5 text-sm font-bold text-[#0F0F0F] transition-colors hover:bg-[#00A88C] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingFeedEdit ? "저장 중..." : "저장하기"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
