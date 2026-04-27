import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import { toast } from "sonner";
import { Heart, MessageCircle, Bookmark, Calendar, MapPin, Star, ImagePlus, Upload, X, Figma, Sparkles, ExternalLink, CheckCircle, Pencil, Trash2, FolderOpen, AlertTriangle, Grid3X3, ChevronRight } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useParams, useNavigate, useSearchParams, Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useLayoutEffect, useRef, type ChangeEvent, type KeyboardEvent, type MouseEvent } from "react";
import { getCurrentUser, getCurrentUserRole, setCurrentUser } from "../utils/auth";
import { getUserAvatar } from "../utils/avatar";
import { designerJobOptions, matchingCategories, normalizeDesignerJobLabel } from "../utils/matchingCategories";
import { checkNicknameAvailabilityApi } from "../api/authApi";
import {
  getMyProfileApi,
  getMyProfileFeedsApi,
  getMyProfileReviewsApi,
  getProfileApi,
  getProfileFeedsApi,
  getProfileReviewsApi,
  updateMyDesignerProfileApi,
  updateMyProfileApi,
  type ProfileFeedResponse,
  type ProfileResponse,
  type ProfileReviewResponse,
} from "../api/profileApi";
import { createFeedApi, deleteFeedApi, toggleFeedPickApi, updateFeedApi } from "../api/feedApi";
import { replaceFeedImagesApi, uploadFeedImagesApi, uploadProfileImageApi } from "../api/uploadApi";
import { followUserApi, unfollowUserApi } from "../api/followApi";
import {
  getCollectionFolderApi,
  getMyCollectionsApi,
  getProfileCollectionsApi,
  type CollectionFolderDetailResponse,
  type CollectionFolderResponse,
} from "../api/collectionApi";
import { createMessageConversationApi, sendConversationMessageApi } from "../api/messageApi";
import {
  getFeedIntegrationLabel,
  parseFeedIntegrations,
  serializeFeedIntegrations,
  type FeedIntegration,
} from "../utils/feedIntegrations";
import { AnimatedFolder, getFolderGradientByFolderId, type Project } from "../components/ui/3d-folder";
import { FeedDetailModal } from "../components/feed/FeedDetailModal";
import { CollectionSaveModal } from "../components/feed/CollectionSaveModal";
import { useFeedComments } from "../hooks/useFeedComments";
import { useFeedCollections } from "../hooks/useFeedCollections";
import { useFeedDetail } from "../hooks/useFeedDetail";
import { useNightMode } from "../contexts/NightModeContext";
import type { BaseFeedItem, FeedCardItem } from "../types/feed";

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
  categories?: string[];
  author?: FeedProjectAuthor;
  imageUrl?: string;
  images?: string[];
  integrations?: FeedIntegration[];
  createdAt?: string;
  persisted?: boolean;
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

const getRelativeCollectionLabel = (updatedAt: string | null) => {
  if (!updatedAt) return "날짜 없음";
  const diff = Date.now() - new Date(updatedAt).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (hours < 1) return "방금 업데이트";
  if (hours < 24) return `${hours}시간 전 업데이트`;
  if (days < 7) return `${days}일 전 업데이트`;
  return "1주 이상 전 업데이트";
};

function collectionToFolderProjects(folder: CollectionFolderResponse): Project[] {
  return folder.previewImageUrls
    .filter((url) => url?.trim())
    .map((url, i) => ({
      id: `${folder.folderId}-p${i}`,
      image: url,
      title: `${folder.folderName} ${i + 1}`,
    }));
}

const isSameProfileKey = (value: string | number | undefined | null, profileKey: string) => {
  if (value === undefined || value === null) {
    return false;
  }

  return String(value).trim().toLowerCase() === profileKey.trim().toLowerCase();
};

const workStatusLabels: Record<string, string> = {
  AVAILABLE: "작업 가능",
  CONSULTATION_AVAILABLE: "상담 가능",
  UNAVAILABLE: "작업 불가",
};

const workTypeLabels: Record<string, string> = {
  FREELANCER: "프리랜서",
  FULL_TIME: "풀타임",
};

const quickWorkStatusOptions = [
  { value: "AVAILABLE", label: "작업 가능" },
  { value: "UNAVAILABLE", label: "작업 불가" },
] as const;

const getWorkStatusLabel = (value?: string | null) => {
  if (!value) return null;
  return workStatusLabels[value] ?? value;
};

const getWorkTypeLabel = (value?: string | null) => {
  if (!value) return null;
  return workTypeLabels[value] ?? value;
};

const buildProfileBadges = (profile: ProfileResponse, fallbackBadges: string[]) => {
  const badges = [
    normalizeDesignerJobLabel(profile.job),
    getWorkTypeLabel(profile.workType),
    getWorkStatusLabel(profile.workStatus),
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
  categories: feed.category ? [feed.category] : [],
  author: {
    name: profile.nickname,
    role: normalizeDesignerJobLabel(profile.job) || profile.role,
    avatar: getUserAvatar(profile.profileImage, profile.userId, profile.nickname),
    username: String(profile.userId),
    roleType: profile.role.toLowerCase(),
  },
  imageUrl: feed.imageUrls.length <= 1 ? feed.thumbnailImageUrl ?? undefined : undefined,
  images: feed.imageUrls.length > 1 ? feed.imageUrls : undefined,
  integrations: parseFeedIntegrations(feed.portfolioUrl).map((integration) => ({
    ...integration,
    label: getFeedIntegrationLabel(integration.provider),
  })),
  createdAt: feed.createdAt ?? undefined,
  persisted: true,
});

const toProfileFeedCommentRole = (role: string) => {
  if (role === "CLIENT") return "프로젝트 클라이언트";
  if (role === "DESIGNER") return "디자이너";
  return role;
};

const mapFeedProjectToFeedCardItem = (
  project: FeedProject,
  profile: ProfileResponse,
  lookupKey: string,
): FeedCardItem => {
  const images =
    project.images && project.images.length > 0
      ? project.images
      : project.imageUrl
        ? [project.imageUrl]
        : [];
  const image = images[0] ?? "";
  const profileKey =
    lookupKey === "me"
      ? String(profile.userId)
      : profile.loginId || profile.nickname || String(profile.userId);

  return {
    id: project.id,
    feedKey: project.id,
    author: {
      userId: profile.userId,
      name: profile.nickname,
      role: normalizeDesignerJobLabel(profile.job) || profile.role,
      avatar: getUserAvatar(profile.profileImage, profile.userId, profile.nickname),
      profileKey,
    },
    title: project.title,
    description: project.description,
    image,
    images: images.length > 0 ? images : undefined,
    likes: project.likes,
    comments: project.comments,
    tags: project.tags?.length ? project.tags : project.category ? [project.category] : [],
    category: project.category,
    integrations: project.integrations,
    createdAt: project.createdAt,
    userId: profile.userId,
    likedByMe: false,
    isMine: profile.owner,
    isApiFeed: true,
  };
};

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

const MAX_FEED_IMAGES = 4;
const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const SUPPORTED_IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp,.gif";

const normalizeExternalUrl = (url: string) => {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return "";
  return /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
};

const SUPPORTED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];
const isSupportedImageFile = (file: File) => {
  if (SUPPORTED_IMAGE_TYPES.includes(file.type)) return true;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return SUPPORTED_IMAGE_EXTENSIONS.includes(ext);
};

export default function Profile() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<ProfileTab>(() =>
    getProfileTabFromParam(searchParams.get("tab"))
  );
  const [profileReviews, setProfileReviews] = useState<ProfileReviewResponse[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState("");
  const username = params.username ? decodeURIComponent(params.username) : profileData.name;
  const profileLookupKey = getProfileLookupKey(username);
  const currentUser = getCurrentUser();
  const isOwnProfileLookup =
    profileLookupKey === "me" ||
    isSameProfileKey(currentUser?.userId, profileLookupKey) ||
    isSameProfileKey(currentUser?.nickname, profileLookupKey) ||
    isSameProfileKey(currentUser?.email, profileLookupKey);
  const currentUserRole = getCurrentUserRole("designer");
  const profileFeedStorageKey = `pickxel:profile-feed:${username}`;
  const [apiProfile, setApiProfile] = useState<ProfileResponse | null>(null);
  const [apiFeedProjects, setApiFeedProjects] = useState<FeedProject[]>([]);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [hasLoadedProfileFeeds, setHasLoadedProfileFeeds] = useState(false);
  const [isProfileOnboardingOpen, setIsProfileOnboardingOpen] = useState(false);
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingWorkStatus, setIsSavingWorkStatus] = useState(false);
  const [isCheckingProfileNickname, setIsCheckingProfileNickname] = useState(false);
  const [isFollowSaving, setIsFollowSaving] = useState(false);
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const [profileEditError, setProfileEditError] = useState("");
  const [profileNicknameCheckMessage, setProfileNicknameCheckMessage] = useState("");
  const [checkedProfileNickname, setCheckedProfileNickname] = useState("");
  const [editName, setEditName] = useState("");
  const [editNickname, setEditNickname] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editJob, setEditJob] = useState("");
  const [editIntroduction, setEditIntroduction] = useState("");
  const [editWorkStatus, setEditWorkStatus] = useState("");
  const [editWorkType, setEditWorkType] = useState("");
  const [editFigmaUrl, setEditFigmaUrl] = useState("");
  const [editPhotoshopUrl, setEditPhotoshopUrl] = useState("");
  const [editAdobeUrl, setEditAdobeUrl] = useState("");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");
  const [collectionFolders, setCollectionFolders] = useState<CollectionFolderResponse[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<CollectionFolderDetailResponse | null>(null);
  const [isCollectionsLoading, setIsCollectionsLoading] = useState(false);
  const [collectionError, setCollectionError] = useState("");
  const [uploadedProjects, setUploadedProjects] = useState<FeedProject[]>([]);
  const [isWorkComposerOpen, setIsWorkComposerOpen] = useState(false);
  const [isFeedSuccessOpen, setIsFeedSuccessOpen] = useState(false);
  const [createdFeedTitle, setCreatedFeedTitle] = useState("");
  const [workTitle, setWorkTitle] = useState("");
  const [workDescription, setWorkDescription] = useState("");
  const [workTags, setWorkTags] = useState("");
  const [workTagInput, setWorkTagInput] = useState("");
  const [workCategory, setWorkCategory] = useState("");
  const [workCategories, setWorkCategories] = useState<string[]>([]);
  const [workImages, setWorkImages] = useState<string[]>([]);
  const [workImageFiles, setWorkImageFiles] = useState<File[]>([]);
  const [coverImageIndex, setCoverImageIndex] = useState(0);
  const [figmaUrl, setFigmaUrl] = useState("");
  const [adobeUrl, setAdobeUrl] = useState("");
  const [editingFeed, setEditingFeed] = useState<FeedProject | null>(null);
  const [editFeedTitle, setEditFeedTitle] = useState("");
  const [editFeedDescription, setEditFeedDescription] = useState("");
  const [editFeedCategory, setEditFeedCategory] = useState("");
  const [editFeedFigmaUrl, setEditFeedFigmaUrl] = useState("");
  const [editFeedAdobeUrl, setEditFeedAdobeUrl] = useState("");
  const [editFeedExistingImages, setEditFeedExistingImages] = useState<string[]>([]);
  const [editFeedNewImageFiles, setEditFeedNewImageFiles] = useState<File[]>([]);
  const [editFeedNewImagePreviews, setEditFeedNewImagePreviews] = useState<string[]>([]);
  const [editFeedImagesTouched, setEditFeedImagesTouched] = useState(false);
  const [isCreatingFeed, setIsCreatingFeed] = useState(false);
  const [workComposerError, setWorkComposerError] = useState("");
  const [isSavingFeedEdit, setIsSavingFeedEdit] = useState(false);
  const [feedEditError, setFeedEditError] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<FeedProject | null>(null);
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const workImageInputRef = useRef<HTMLInputElement>(null);
  const editFeedImageInputRef = useRef<HTMLInputElement>(null);
  const { isNight } = useNightMode();
  const profileFeedCommentInputRef = useRef<HTMLInputElement>(null);
  const [selectedProfileFeed, setSelectedProfileFeed] = useState<FeedCardItem | null>(null);
  const [profileFeedCardItems, setProfileFeedCardItems] = useState<FeedCardItem[]>([]);
  const [profileFeedModalImageIndex, setProfileFeedModalImageIndex] = useState(0);

  const {
    collections,
    collectionPostIdsByFolder,
    collectionModalFeed,
    newCollectionName,
    collectionSavedNotice,
    isCollectionSaving,
    savedItemIds: savedProfileFeedIds,
    setNewCollectionName,
    openCollectionModal,
    closeCollectionModal,
    saveToCollection,
    createCollectionAndSave,
  } = useFeedCollections<FeedCardItem>();

  const {
    commentText,
    setCommentText: setProfileFeedCommentText,
    commentSubmitError,
    isSubmittingComment,
    isCommentsLoading,
    commentLoadError,
    editingCommentId,
    editingCommentText,
    setEditingCommentText,
    isUpdatingComment,
    isDeletingCommentId,
    selectedFeedComments,
    handleSubmitComment,
    handleCommentKeyDown,
    startEditingComment,
    cancelEditingComment,
    handleUpdateComment,
    handleDeleteComment,
  } = useFeedComments<FeedCardItem, FeedCardItem>({
    selectedFeed: selectedProfileFeed,
    currentUser,
    currentUserId: currentUser?.userId ?? null,
    apiFeedItems: profileFeedCardItems,
    setApiFeedItems: setProfileFeedCardItems,
    setSelectedFeed: setSelectedProfileFeed,
    toFeedCommentRole: toProfileFeedCommentRole,
  });

  const {
    isLoading: isProfileFeedDetailLoading,
    error: profileFeedDetailError,
  } = useFeedDetail<FeedCardItem, FeedCardItem>({
    selectedFeed: selectedProfileFeed,
    setApiFeedItems: setProfileFeedCardItems,
    setSelectedFeed: setSelectedProfileFeed,
  });

  const fallbackProfile =
    currentUserRole === "client"
      ? {
          ...profileData,
          name: currentUser?.nickname || currentUser?.name || profileData.name,
          realName: currentUser?.name,
          roleType: "client",
          title: "클라이언트 · 프로젝트 의뢰자",
          badges: ["#클라이언트", "#프로젝트의뢰", "#브랜드협업", "#크리에이티브"],
          responseTime: "평균 응답 2시간 이내",
        }
      : {
          ...profileData,
          name: currentUser?.nickname || currentUser?.name || profileData.name,
          realName: currentUser?.name,
          roleType: "designer",
        };
  const displayProfile = apiProfile
    ? {
        ...fallbackProfile,
        name: apiProfile.nickname,
        realName: apiProfile.name ?? undefined,
        roleType: apiProfile.role.toLowerCase(),
        rating: apiProfile.rating ?? fallbackProfile.rating,
        title: normalizeDesignerJobLabel(apiProfile.job) || apiProfile.introduction || fallbackProfile.title,
        followers: formatProfileCount(apiProfile.followerCount ?? apiProfile.followCount),
        following: formatProfileCount(apiProfile.followingCount),
        badges: buildProfileBadges(apiProfile, fallbackProfile.badges),
        recentProject: apiProfile.introduction || fallbackProfile.recentProject,
        avatar: getUserAvatar(apiProfile.profileImage, apiProfile.userId, apiProfile.nickname),
        location: apiProfile.location || fallbackProfile.location,
      }
    : fallbackProfile;
  const isClientProfile = displayProfile.roleType === "client";
  const profileOnboardingStorageKey = apiProfile
    ? `pickxel:profile-onboarding-dismissed:${apiProfile.userId}`
    : "";
  const profileRoleLabel = isClientProfile ? "클라이언트" : "디자이너";
  const profileRoleBadgeClass = isNight
    ? isClientProfile
      ? "border-[#FF8A70]/40 bg-[#3d2520]/90 text-[#FFB9AA]"
      : "border-[#00C9A7]/30 bg-[#00C9A7]/12 text-[#7EE8D4]"
    : isClientProfile
      ? "border-[#FFB9AA] bg-[#FFF7F4] text-[#B13A21]"
      : "border-[#BDEFD8] bg-[#DDF8EC] text-[#007E68]";
  /** 서버의 owner 플래그만 신뢰 (타인 프로필에서 편집·업로드 CTA 노출 방지) */
  const canEditProfile = apiProfile?.owner === true;
  const canQuickEditWorkStatus = canEditProfile && apiProfile?.role === "DESIGNER";
  const profileWorkStatus = apiProfile?.workStatus ?? "";
  const showWorkStatusIndicator = apiProfile?.role === "DESIGNER" && Boolean(profileWorkStatus);
  const isProfileWorkUnavailable = profileWorkStatus === "UNAVAILABLE";
  const workStatusIndicatorClass = !profileWorkStatus
    ? "bg-gray-300"
    : isProfileWorkUnavailable
      ? "bg-[#FF5C3A]"
      : "bg-[#00C9A7]";
  const workStatusIndicatorLabel =
    getWorkStatusLabel(profileWorkStatus) ?? (profileWorkStatus ? "작업 가능" : "작업 상태 미설정");
  const nextQuickWorkStatus =
    !profileWorkStatus || isProfileWorkUnavailable ? "AVAILABLE" : "UNAVAILABLE";
  const profileToolLinks = [
    { label: "링크", url: apiProfile?.url, icon: ExternalLink },
    { label: "Figma", url: apiProfile?.figmaUrl, icon: Figma },
    { label: "Photoshop", url: apiProfile?.photoshopUrl, icon: Sparkles },
    { label: "Adobe", url: apiProfile?.adobeUrl, icon: ExternalLink },
  ].filter((link): link is { label: string; url: string; icon: typeof Figma } => Boolean(link.url));
  const canCreateFeed = canEditProfile && apiProfile?.role === "DESIGNER";
  const profileFeedAuthorKey = apiProfile
    ? [
        apiProfile.userId,
        apiProfile.nickname,
        normalizeDesignerJobLabel(apiProfile.job),
        apiProfile.role,
        apiProfile.profileImage ?? "",
      ].join("|")
    : "";

  const profileSetupChecklist = apiProfile?.role === "DESIGNER"
    ? [
        { label: "직업", done: Boolean(apiProfile.job) },
        { label: "소개", done: Boolean(apiProfile.introduction) },
        { label: "작업 상태", done: Boolean(apiProfile.workStatus) },
        { label: "작업 형태", done: Boolean(apiProfile.workType) },
      ]
    : [
        { label: "이름", done: Boolean(apiProfile?.name) },
        { label: "닉네임", done: Boolean(apiProfile?.nickname) },
        { label: "URL", done: Boolean(apiProfile?.url) },
      ];
  const isProfileSetupComplete = profileSetupChecklist.every((item) => item.done);
  const hasEditName = editName.trim().length > 0;
  const hasEditNickname = editNickname.trim().length > 0;
  const normalizedEditNickname = editNickname.trim();
  const isProfileNicknameChanged = Boolean(apiProfile && normalizedEditNickname !== apiProfile.nickname);
  const isProfileNicknameChecked = !isProfileNicknameChanged || checkedProfileNickname === normalizedEditNickname;
  const hasEditJob = editJob.trim().length > 0;
  const designerJobSelectOptions =
    hasEditJob && !designerJobOptions.includes(editJob) ? [editJob, ...designerJobOptions] : designerJobOptions;
  const showProfileNicknameStep = hasEditName;
  const showProfileOptionalStep = hasEditName && hasEditNickname;
  const showDesignerDetailStep = showProfileOptionalStep && !isClientProfile;
  const showDesignerFollowUpStep = showDesignerDetailStep && hasEditJob;
  const canSaveProfileEdit = hasEditName && hasEditNickname && isProfileNicknameChecked;
  const profileEditorSteps = isClientProfile
    ? [
        { label: hasEditName ? "이름 입력됨" : "이름을 입력해주세요", done: hasEditName },
        { label: hasEditNickname ? "닉네임 입력됨" : "닉네임을 입력해주세요", done: hasEditNickname },
        { label: editUrl.trim() ? "URL 입력됨" : "URL은 선택 입력입니다", done: true },
        { label: editLocation.trim() ? "지역 입력됨" : "지역은 선택 입력입니다", done: true },
      ]
    : [
        { label: hasEditName ? "이름 입력됨" : "이름을 입력해주세요", done: hasEditName },
        { label: hasEditNickname ? "닉네임 입력됨" : "닉네임을 입력해주세요", done: hasEditNickname },
        { label: hasEditJob ? "직업 선택됨" : "직업을 선택해주세요", done: hasEditJob },
        {
          label: editIntroduction.trim() ? "소개 입력됨" : "소개는 선택 입력입니다",
          done: true,
        },
      ];

  const handleProfileTabChange = (tab: ProfileTab) => {
    setActiveTab(tab);
    setSearchParams(tab === "feed" ? {} : { tab });
  };

  useEffect(() => {
    let ignore = false;
    setIsProfileLoading(true);
    setProfileError("");

    const request = isOwnProfileLookup ? getMyProfileApi() : getProfileApi(profileLookupKey);

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
  }, [isOwnProfileLookup, profileLookupKey]);

  useEffect(() => {
    if (!apiProfile || !isOwnProfileLookup) {
      return;
    }

    setCurrentUser({
      userId: apiProfile.userId,
      name: apiProfile.name ?? apiProfile.nickname,
      nickname: apiProfile.nickname,
      email: apiProfile.loginId,
      role: apiProfile.role.toLowerCase() as "designer" | "client",
      profileImage: apiProfile.profileImage,
    });
  }, [
    apiProfile?.userId,
    apiProfile?.name,
    apiProfile?.nickname,
    apiProfile?.loginId,
    apiProfile?.role,
    apiProfile?.profileImage,
    isOwnProfileLookup,
  ]);

  useEffect(() => {
    if (!apiProfile) {
      setApiFeedProjects([]);
      setHasLoadedProfileFeeds(false);
      return;
    }

    let ignore = false;
    setHasLoadedProfileFeeds(false);
    const request =
      isOwnProfileLookup ? getMyProfileFeedsApi() : getProfileFeedsApi(profileLookupKey);

    request
      .then((feeds) => {
        if (ignore) return;
        setApiFeedProjects(
          feeds.map((feed) => mapProfileFeedToProject(feed, apiProfile))
        );
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
  }, [apiProfile?.userId, isOwnProfileLookup, profileFeedAuthorKey, profileLookupKey]);

  useLayoutEffect(() => {
    if (!apiProfile || !hasLoadedProfileFeeds) {
      setProfileFeedCardItems([]);
      return;
    }
    setProfileFeedCardItems(
      apiFeedProjects.map((project) => mapFeedProjectToFeedCardItem(project, apiProfile, profileLookupKey)),
    );
  }, [apiFeedProjects, apiProfile, profileLookupKey, hasLoadedProfileFeeds]);

  useEffect(() => {
    if (!apiProfile || activeTab !== "collection") return;

    let ignore = false;
    setIsCollectionsLoading(true);
    setCollectionError("");

    const request =
      isOwnProfileLookup ? getMyCollectionsApi() : getProfileCollectionsApi(profileLookupKey);

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
  }, [activeTab, apiProfile?.userId, isOwnProfileLookup, profileLookupKey]);

  useEffect(() => {
    if (!apiProfile) return;

    setEditName(apiProfile.name ?? "");
    setEditNickname(apiProfile.nickname);
    setEditUrl(apiProfile.url ?? "");
    setEditLocation(apiProfile.location ?? "");
    setEditJob(normalizeDesignerJobLabel(apiProfile.job));
    setEditIntroduction(apiProfile.introduction ?? "");
    setEditWorkStatus(apiProfile.workStatus ?? "");
    setEditWorkType(apiProfile.workType ?? "");
    setEditFigmaUrl(apiProfile.figmaUrl ?? "");
    setEditPhotoshopUrl(apiProfile.photoshopUrl ?? "");
    setEditAdobeUrl(apiProfile.adobeUrl ?? "");
  }, [apiProfile]);

  useEffect(() => {
    if (!apiProfile?.owner || isProfileSetupComplete || !profileOnboardingStorageKey) {
      return;
    }

    if (localStorage.getItem(profileOnboardingStorageKey) === "done") {
      return;
    }

    setIsProfileOnboardingOpen(true);
  }, [apiProfile, isProfileSetupComplete, profileOnboardingStorageKey]);

  const dismissProfileOnboarding = () => {
    if (profileOnboardingStorageKey) {
      localStorage.setItem(profileOnboardingStorageKey, "done");
    }
    setIsProfileOnboardingOpen(false);
  };

  const handleStartProfileSetup = () => {
    dismissProfileOnboarding();
    handleOpenProfileEditor();
  };

  const handleStartFirstWorkUpload = () => {
    dismissProfileOnboarding();
    setIsWorkComposerOpen(true);
  };

  const handleOpenProfileEditor = () => {
    setProfileEditError("");
    setProfileNicknameCheckMessage("");
    setCheckedProfileNickname(apiProfile?.nickname ?? currentUser?.nickname ?? "");
    setProfileImageFile(null);
    setProfileImagePreview("");
    setEditName(apiProfile?.name ?? currentUser?.name ?? "");
    setEditNickname(apiProfile?.nickname ?? currentUser?.nickname ?? "");
    setEditUrl(apiProfile?.url ?? "");
    setEditLocation(apiProfile?.location ?? "");
    setEditJob(normalizeDesignerJobLabel(apiProfile?.job));
    setEditIntroduction(apiProfile?.introduction ?? "");
    setEditWorkStatus(apiProfile?.workStatus ?? "");
    setEditWorkType(apiProfile?.workType ?? "");
    setEditFigmaUrl(apiProfile?.figmaUrl ?? "");
    setEditPhotoshopUrl(apiProfile?.photoshopUrl ?? "");
    setEditAdobeUrl(apiProfile?.adobeUrl ?? "");
    setIsProfileEditorOpen(true);
  };

  const handleEditNicknameChange = (value: string) => {
    setEditNickname(value);
    setProfileEditError("");
    setProfileNicknameCheckMessage("");
    setCheckedProfileNickname("");
  };

  const handleCheckProfileNickname = async () => {
    const nickname = normalizedEditNickname;
    setProfileEditError("");
    setProfileNicknameCheckMessage("");
    setCheckedProfileNickname("");

    if (!nickname) {
      setProfileEditError("닉네임을 입력해주세요.");
      return;
    }
    if (nickname.length > 10) {
      setProfileEditError("닉네임은 10자 이하로 입력해주세요.");
      return;
    }
    if (nickname === apiProfile?.nickname) {
      setCheckedProfileNickname(nickname);
      setProfileNicknameCheckMessage("현재 사용 중인 닉네임입니다.");
      return;
    }

    try {
      setIsCheckingProfileNickname(true);
      const result = await checkNicknameAvailabilityApi(nickname);
      if (!result.available) {
        setProfileEditError("이미 사용 중인 닉네임입니다.");
        return;
      }

      setCheckedProfileNickname(result.nickname);
      setProfileNicknameCheckMessage("사용 가능한 닉네임입니다.");
    } catch (error) {
      setProfileEditError(error instanceof Error ? error.message : "닉네임 중복 확인에 실패했습니다.");
    } finally {
      setIsCheckingProfileNickname(false);
    }
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
    if (!isProfileNicknameChecked) {
      setProfileEditError("닉네임 중복 확인을 먼저 해주세요.");
      return;
    }

    setIsSavingProfile(true);
    setProfileEditError("");

    try {
      let updatedProfile = await updateMyProfileApi({
        name: editName.trim(),
        nickname: editNickname.trim(),
        url: normalizeExternalUrl(editUrl),
        location: editLocation.trim(),
      });

      if (updatedProfile.role === "DESIGNER") {
        updatedProfile = await updateMyDesignerProfileApi({
          job: normalizeDesignerJobLabel(editJob),
          introduction: editIntroduction.trim(),
          workStatus: editWorkStatus,
          workType: editWorkType,
          figmaUrl: normalizeExternalUrl(editFigmaUrl),
          photoshopUrl: normalizeExternalUrl(editPhotoshopUrl),
          adobeUrl: normalizeExternalUrl(editAdobeUrl),
        });
      }

      let imageUploadError = "";

      if (profileImageFile) {
        try {
          const uploadedImage = await uploadProfileImageApi(profileImageFile);
          updatedProfile = {
            ...updatedProfile,
            profileImage: uploadedImage.imageUrl,
          };
        } catch (error) {
          imageUploadError = error instanceof Error ? error.message : "프로필 이미지 업로드에 실패했습니다.";
        }
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
      if (imageUploadError) {
        setProfileEditError(`기본 정보는 저장됐지만 이미지 업로드에 실패했습니다. ${imageUploadError}`);
        return;
      }
      setProfileImageFile(null);
      setProfileImagePreview("");
      setIsProfileEditorOpen(false);
    } catch (error) {
      setProfileEditError(error instanceof Error ? error.message : "프로필 수정에 실패했습니다.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleQuickWorkStatusChange = async (workStatus: "AVAILABLE" | "UNAVAILABLE") => {
    if (!apiProfile || apiProfile.role !== "DESIGNER" || isSavingWorkStatus) {
      return;
    }
    if (apiProfile.workStatus === workStatus) {
      return;
    }

    const previousProfile = apiProfile;
    const previousWorkStatus = apiProfile.workStatus ?? "";

    setApiProfile({
      ...apiProfile,
      workStatus,
    });
    setEditWorkStatus(workStatus);
    setIsSavingWorkStatus(true);
    setProfileError("");

    try {
      const updatedProfile = await updateMyDesignerProfileApi({
        job: normalizeDesignerJobLabel(previousProfile.job) || undefined,
        introduction: previousProfile.introduction ?? undefined,
        workStatus,
        workType: previousProfile.workType ?? undefined,
        figmaUrl: previousProfile.figmaUrl ?? undefined,
        photoshopUrl: previousProfile.photoshopUrl ?? undefined,
        adobeUrl: previousProfile.adobeUrl ?? undefined,
      });
      setApiProfile(updatedProfile);
      setEditWorkStatus(updatedProfile.workStatus ?? "");
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "작업 상태를 변경하지 못했습니다.");
    } finally {
      setIsSavingWorkStatus(false);
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

  const handleStartConversation = async () => {
    if (!apiProfile || apiProfile.owner || isStartingConversation) return;

    setProfileError("");
    setIsStartingConversation(true);
    try {
      const conversation = await createMessageConversationApi(apiProfile.userId);
      navigate(`/messages?conversationId=${conversation.id}`);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "대화를 시작하지 못했습니다.");
    } finally {
      setIsStartingConversation(false);
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

  useEffect(() => {
    if (activeTab !== "collection") {
      setSelectedCollection(null);
    }
  }, [activeTab]);

  useEffect(() => {
    // localStorage에서 새로운 후기 가져오기
    if (!apiProfile || activeTab !== "reviews") return;

    let ignore = false;
    setIsReviewsLoading(true);
    setReviewsError("");
    setProfileReviews([]);

    const request = isOwnProfileLookup
      ? getMyProfileReviewsApi()
      : getProfileReviewsApi(profileLookupKey);

    request
      .then((reviews) => {
        if (ignore) return;
        setProfileReviews(reviews);
      })
      .catch((error) => {
        if (ignore) return;
        setProfileReviews([]);
        setReviewsError(error instanceof Error ? error.message : "프로젝트 후기를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (ignore) return;
        setIsReviewsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [activeTab, apiProfile?.userId, isOwnProfileLookup, profileLookupKey]);

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

  const handleToggleWorkCategory = (category: string) => {
    const nextCategories = workCategories.includes(category)
      ? workCategories.filter((selectedCategory) => selectedCategory !== category)
      : [...workCategories, category];

    setWorkCategories(nextCategories);
    setWorkCategory(nextCategories[0] ?? "");
  };

  const resetWorkComposer = () => {
    setWorkTitle("");
    setWorkDescription("");
    setWorkTags("");
    setWorkTagInput("");
    setWorkCategory("");
    setWorkCategories([]);
    setWorkImages([]);
    setWorkImageFiles([]);
    setCoverImageIndex(0);
    setFigmaUrl("");
    setAdobeUrl("");
    setWorkComposerError("");
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

  const addWorkTags = (rawTags: string | string[]) => {
    const rawTagList = Array.isArray(rawTags) ? rawTags : rawTags.split(/[\s,]+/);
    const nextTags = rawTagList
      .map((tag) => tag.trim())
      .filter(Boolean)
      .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));

    if (nextTags.length === 0) return;

    setWorkTags((prev) => Array.from(new Set([...getWorkTagList(prev), ...nextTags])).join(" "));
  };

  const splitWorkTagInput = (value: string) => {
    const hasTrailingSeparator = /[\s,]$/.test(value);
    const parts = value.split(/[\s,]+/).filter(Boolean);

    if (hasTrailingSeparator) {
      return { completeTags: parts, draftTag: "" };
    }

    return {
      completeTags: parts.slice(0, -1),
      draftTag: parts.at(-1) ?? "",
    };
  };

  const commitWorkTagInput = () => {
    if (!workTagInput.trim()) return;
    addWorkTags(workTagInput);
    setWorkTagInput("");
  };

  const handleWorkTagInputChange = (value: string) => {
    const { completeTags, draftTag } = splitWorkTagInput(value);
    if (completeTags.length > 0) {
      addWorkTags(completeTags);
    }
    setWorkTagInput(draftTag);
  };

  const handleWorkTagInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === " " || event.key === ",") {
      event.preventDefault();
      commitWorkTagInput();
      return;
    }

    if (event.key === "Backspace" && !workTagInput) {
      const currentTags = getWorkTagList(workTags);
      if (currentTags.length > 0) {
        setWorkTags(currentTags.slice(0, -1).join(" "));
      }
    }
  };

  const removeWorkTag = (tag: string) => {
    setWorkTags((prev) => getWorkTagList(prev).filter((currentTag) => currentTag !== tag).join(" "));
  };

  const addSuggestedWorkTag = (tag: string) => {
    addWorkTags(tag);
  };

  const closeWorkComposer = () => {
    if (isCreatingFeed) return;
    setIsWorkComposerOpen(false);
    setWorkComposerError("");
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
    if (!file) {
      event.target.value = "";
      return;
    }
    if (!isSupportedImageFile(file)) {
      setProfileEditError("프로필 이미지는 JPG, PNG, WebP, GIF 형식만 업로드할 수 있습니다.");
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
    const selectedFiles = Array.from(event.target.files ?? []);
    const invalidFileExists = selectedFiles.some((file) => !isSupportedImageFile(file));
    const files = selectedFiles
      .filter((file) => isSupportedImageFile(file))
      .slice(0, Math.max(0, MAX_FEED_IMAGES - workImageFiles.length));

    if (files.length === 0) {
      if (invalidFileExists) {
        setWorkComposerError("피드 이미지는 JPG, PNG, WebP, GIF 형식만 업로드할 수 있습니다.");
      }
      event.target.value = "";
      return;
    }

    event.target.value = "";

    try {
      if (invalidFileExists) {
        setWorkComposerError("일부 파일은 지원되지 않아 제외되었습니다. JPG, PNG, WebP, GIF만 업로드할 수 있습니다.");
      } else {
        setWorkComposerError("");
      }
      const previews = await Promise.all(files.map(readImageFileAsDataUrl));
      setWorkImageFiles((prev) => [...prev, ...files].slice(0, MAX_FEED_IMAGES));
      setWorkImages((prev) => [...prev, ...previews].slice(0, MAX_FEED_IMAGES));
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

  const getProjectImageUrls = (project: FeedProject) => {
    if (project.images && project.images.length > 0) {
      return project.images;
    }

    return project.imageUrl ? [project.imageUrl] : [];
  };

  const handleEditFeedImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const currentImageCount = editFeedExistingImages.length + editFeedNewImageFiles.length;
    const selectedFiles = Array.from(event.target.files ?? []);
    const invalidFileExists = selectedFiles.some((file) => !isSupportedImageFile(file));
    const files = selectedFiles
      .filter((file) => isSupportedImageFile(file))
      .slice(0, Math.max(0, MAX_FEED_IMAGES - currentImageCount));

    event.target.value = "";
    if (files.length === 0) {
      if (invalidFileExists) {
        setFeedEditError("피드 이미지는 JPG, PNG, WebP, GIF 형식만 업로드할 수 있습니다.");
      }
      return;
    }

    try {
      if (invalidFileExists) {
        setFeedEditError("일부 파일은 지원되지 않아 제외되었습니다. JPG, PNG, WebP, GIF만 업로드할 수 있습니다.");
      } else {
        setFeedEditError("");
      }
      const previews = await Promise.all(files.map(readImageFileAsDataUrl));
      setEditFeedNewImageFiles((prev) => [...prev, ...files].slice(0, MAX_FEED_IMAGES));
      setEditFeedNewImagePreviews((prev) => [...prev, ...previews].slice(0, MAX_FEED_IMAGES));
      setEditFeedImagesTouched(true);
    } catch (error) {
      setFeedEditError(error instanceof Error ? error.message : "이미지 미리보기에 실패했습니다.");
    }
  };

  const handleRemoveEditFeedExistingImage = (imageIndex: number) => {
    setEditFeedExistingImages((prev) => prev.filter((_, index) => index !== imageIndex));
    setEditFeedImagesTouched(true);
  };

  const handleRemoveEditFeedNewImage = (imageIndex: number) => {
    setEditFeedNewImageFiles((prev) => prev.filter((_, index) => index !== imageIndex));
    setEditFeedNewImagePreviews((prev) => prev.filter((_, index) => index !== imageIndex));
    setEditFeedImagesTouched(true);
  };

  const getProjectIntegrationUrl = (
    project: FeedProject,
    provider: FeedIntegration["provider"],
  ) => project.integrations?.find((integration) => integration.provider === provider)?.url ?? "";

  const openFeedEditor = (project: FeedProject) => {
    const sourceProject =
      project.persisted
        ? apiFeedProjects.find((item) => item.id === project.id) ?? project
        : project;

    setFeedEditError("");
    setEditingFeed(sourceProject);
    setEditFeedTitle(sourceProject.title);
    setEditFeedDescription(sourceProject.description);
    setEditFeedCategory(sourceProject.category ?? "");
    setEditFeedFigmaUrl(getProjectIntegrationUrl(sourceProject, "figma"));
    setEditFeedAdobeUrl(getProjectIntegrationUrl(sourceProject, "adobe"));
    setEditFeedExistingImages(getProjectImageUrls(sourceProject));
    setEditFeedNewImageFiles([]);
    setEditFeedNewImagePreviews([]);
    setEditFeedImagesTouched(false);
  };

  const closeFeedEditor = () => {
    if (isSavingFeedEdit) return;
    setEditingFeed(null);
    setFeedEditError("");
    setEditFeedFigmaUrl("");
    setEditFeedAdobeUrl("");
    setEditFeedExistingImages([]);
    setEditFeedNewImageFiles([]);
    setEditFeedNewImagePreviews([]);
    setEditFeedImagesTouched(false);
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

    const editFeedPortfolioUrl = serializeFeedIntegrations([
      { provider: "figma", url: normalizeExternalUrl(editFeedFigmaUrl) },
      { provider: "adobe", url: normalizeExternalUrl(editFeedAdobeUrl) },
    ]);
    if (editFeedPortfolioUrl.length > 200) {
      setFeedEditError("Figma/Adobe 링크 길이가 너무 길어요. 링크를 줄이거나 하나만 넣어주세요.");
      return;
    }

    setIsSavingFeedEdit(true);
    setFeedEditError("");

    try {
      const updatedFeed = await updateFeedApi(editingFeed.id, {
        title: editFeedTitle.trim(),
        description: editFeedDescription.trim(),
        category: editFeedCategory,
        portfolioUrl: editFeedPortfolioUrl,
      });
      const imageUpdate = editFeedImagesTouched
        ? await replaceFeedImagesApi(editingFeed.id, editFeedExistingImages, editFeedNewImageFiles)
        : null;
      const imageUrls = imageUpdate?.imageUrls ?? getProjectImageUrls(editingFeed);
      const integrations = parseFeedIntegrations(updatedFeed.portfolioUrl).map((integration) => ({
        ...integration,
        label: getFeedIntegrationLabel(integration.provider),
      }));
      const updatedProject: FeedProject = {
        ...editingFeed,
        title: updatedFeed.title,
        description: updatedFeed.description,
        likes: updatedFeed.pickCount ?? editingFeed.likes,
        comments: updatedFeed.commentCount ?? editingFeed.comments,
        category: updatedFeed.category,
        tags: [`#${updatedFeed.category}`],
        integrations: integrations.length > 0 ? integrations : undefined,
        imageUrl: imageUrls.length === 1 ? imageUrls[0] : undefined,
        images: imageUrls.length > 1 ? imageUrls : undefined,
        createdAt: updatedFeed.createdAt ?? editingFeed.createdAt,
        persisted: true,
      };

      applyUpdatedFeedProject(updatedProject);
      setEditingFeed(null);
      setEditFeedFigmaUrl("");
      setEditFeedAdobeUrl("");
      setEditFeedExistingImages([]);
      setEditFeedNewImageFiles([]);
      setEditFeedNewImagePreviews([]);
      setEditFeedImagesTouched(false);
    } catch (error) {
      setFeedEditError(error instanceof Error ? error.message : "피드 수정에 실패했습니다.");
    } finally {
      setIsSavingFeedEdit(false);
    }
  };

  const handleDeleteFeed = (project: FeedProject) => {
    setProjectToDelete(project);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteFeed = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!projectToDelete) return;

    try {
      await deleteFeedApi(projectToDelete.id);
      removeDeletedFeedProject(projectToDelete.id);
      setProfileError("");
      setIsDeleteModalOpen(false);
      setProjectToDelete(null);
      toast.success("삭제가 완료되었습니다.");
    } catch (error) {
      console.error("삭제 실패:", error);
      const errorMessage = error instanceof Error ? error.message : "피드 삭제에 실패했습니다.";
      setProfileError(errorMessage);
      toast.error(`삭제 실패: ${errorMessage}`);
    }
  };

  const handleUploadWork = async () => {
    let createdFeedId: number | null = null;
    let shouldRollbackCreatedFeed = false;

    const trimmedTitle = workTitle.trim();
    const trimmedDescription = workDescription.trim();
    const selectedWorkCategories = workCategories.length > 0 ? workCategories : workCategory ? [workCategory] : [];
    const primaryWorkCategory = selectedWorkCategories[0] ?? "";
    if (!trimmedTitle || !trimmedDescription || selectedWorkCategories.length === 0) {
      setWorkComposerError("제목, 캡션, 카테고리를 입력해주세요.");
      return;
    }
    if (apiProfile?.role !== "DESIGNER") {
      setWorkComposerError("디자이너만 작업 피드를 추가할 수 있습니다.");
      return;
    }

    const tags = getWorkTagList(`${workTags} ${workTagInput}`);
    const rawIntegrations = [
      {
        provider: "figma" as const,
        url: normalizeExternalUrl(figmaUrl),
      },
      {
        provider: "adobe" as const,
        url: normalizeExternalUrl(adobeUrl),
      },
    ].filter((integration) => integration.url);
    const portfolioUrl = serializeFeedIntegrations(rawIntegrations);
    const integrations = rawIntegrations.map((integration) => ({
      ...integration,
      label: getFeedIntegrationLabel(integration.provider),
    }));
    if (portfolioUrl.length > 200) {
      setWorkComposerError("Figma/Adobe 링크 길이가 너무 길어요. 링크를 줄이거나 하나만 넣어주세요.");
      return;
    }

    try {
      setIsCreatingFeed(true);
      setWorkComposerError("");
      const createdFeed = await createFeedApi({
        title: trimmedTitle,
        description: trimmedDescription,
        category: primaryWorkCategory,
        portfolioUrl,
        tags,
      });
      createdFeedId = createdFeed.postId;
      const orderedImageFiles = [...workImageFiles];
      if (coverImageIndex > 0 && coverImageIndex < orderedImageFiles.length) {
        const [coverImageFile] = orderedImageFiles.splice(coverImageIndex, 1);
        orderedImageFiles.unshift(coverImageFile);
      }
      shouldRollbackCreatedFeed = orderedImageFiles.length > 0;
      const uploadedImages =
        orderedImageFiles.length > 0
          ? await uploadFeedImagesApi(createdFeed.postId, orderedImageFiles)
          : null;
      shouldRollbackCreatedFeed = false;
      const uploadedImageUrls = uploadedImages?.imageUrls ?? [];

      const newProject: FeedProject = {
        id: createdFeed.postId,
        title: createdFeed.title,
        description: createdFeed.description ?? trimmedDescription,
        likes: createdFeed.pickCount ?? 0,
        comments: createdFeed.commentCount ?? 0,
        tags: tags.length ? tags : [`#${createdFeed.category ?? primaryWorkCategory}`],
        category: createdFeed.category ?? primaryWorkCategory,
        categories: selectedWorkCategories,
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

      setApiFeedProjects((current) => [newProject, ...current]);
      setHasLoadedProfileFeeds(true);
      setCreatedFeedTitle(createdFeed.title);
      resetWorkComposer();
      setIsWorkComposerOpen(false);
      setIsFeedSuccessOpen(true);
      setProfileError("");
    } catch (error) {
      if (shouldRollbackCreatedFeed && createdFeedId !== null) {
        try {
          await deleteFeedApi(createdFeedId);
        } catch {
          // Preserve the original upload error for the UI.
        }
      }
      setWorkComposerError(error instanceof Error ? error.message : "피드 업로드에 실패했습니다.");
    } finally {
      setIsCreatingFeed(false);
    }
  };

  const feedProjects = hasLoadedProfileFeeds ? apiFeedProjects : [];
  const canUploadWork =
    workTitle.trim().length > 0 &&
    workDescription.trim().length > 0 &&
    workCategories.length > 0 &&
    !isCreatingFeed;
  const workTagList = getWorkTagList(workTags);
  const previewCoverImage = workImages[Math.min(coverImageIndex, workImages.length - 1)] ?? "";
  const suggestedWorkTags = Array.from(
    new Set(workCategories.flatMap((category) => categoryTagSuggestions[category] ?? [])),
  );
  const uploadChecklist = [
    {
      label: workImages.length > 0 ? `이미지 ${workImages.length}장 추가됨` : "이미지를 추가해주세요",
      done: true,
    },
    {
      label: workCategory ? "카테고리 선택됨" : "카테고리를 선택해주세요",
      done: workCategories.length > 0,
    },
    {
      label: workTagList.length > 0 ? `태그 ${workTagList.length}개` : "태그 추천을 눌러 추가해보세요",
      done: workTagList.length > 0,
    },
  ];
  const editFeedPreviewImages = [
    ...editFeedExistingImages.map((src, index) => ({
      key: `existing-${src}-${index}`,
      src,
      index,
      source: "existing" as const,
    })),
    ...editFeedNewImagePreviews.map((src, index) => ({
      key: `new-${src}-${index}`,
      src,
      index,
      source: "new" as const,
    })),
  ];
  const canAddWorkImages = workImages.length < MAX_FEED_IMAGES;
  const canAddEditFeedImages = editFeedPreviewImages.length < MAX_FEED_IMAGES;
  const tabSpring = { type: "spring" as const, stiffness: 400, damping: 36 };
  const modalSpring = { type: "spring" as const, stiffness: 420, damping: 34 };

  const profileFeedUserAvatar = getUserAvatar(
    currentUser?.profileImage,
    currentUser?.userId,
    currentUser?.nickname,
  );
  const profileFeedUserName = currentUser?.nickname || currentUser?.name || "내 프로필";

  const openProfileFeedDetail = (item: FeedCardItem) => {
    setSelectedProfileFeed(item);
    setProfileFeedModalImageIndex(0);
  };

  const toggleProfileFeedLike = async (item: BaseFeedItem, e?: MouseEvent) => {
    e?.stopPropagation();
    try {
      const response = await toggleFeedPickApi(item.id);
      setProfileFeedCardItems((prev) =>
        prev.map((feed) =>
          feed.id === item.id ? { ...feed, likes: response.pickCount, likedByMe: response.picked } : feed,
        ),
      );
      setSelectedProfileFeed((prev) =>
        prev && prev.id === item.id
          ? { ...prev, likes: response.pickCount, likedByMe: response.picked }
          : prev,
      );
    } catch {
      toast.error("좋아요 처리에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const moveProfileFeedModalCarousel = (dir: -1 | 1, e?: MouseEvent) => {
    e?.stopPropagation();
    if (!selectedProfileFeed) return;
    const images = selectedProfileFeed.images ?? [selectedProfileFeed.image];
    if (images.length <= 1) return;
    setProfileFeedModalImageIndex((prev) => (prev + dir + images.length) % images.length);
  };

  const handleProfileFeedShare = (item: FeedCardItem, e?: MouseEvent) => {
    e?.stopPropagation();
    const url = window.location.href;
    const copyToClipboard = () => {
      navigator.clipboard
        .writeText(url)
        .then(() => toast.success("공유 링크가 클립보드에 복사되었습니다."))
        .catch(() => toast.error("링크 복사에 실패했습니다."));
    };
    if (navigator.share) {
      navigator
        .share({ title: item.title, text: item.description || "", url })
        .catch(() => copyToClipboard());
    } else {
      copyToClipboard();
    }
  };

  const handleProfileFeedProposal = async (item: FeedCardItem, e?: MouseEvent) => {
    e?.stopPropagation();
    if (!item.author?.userId) {
      toast.error("상대방 정보를 찾을 수 없습니다.");
      return;
    }
    if (currentUser?.userId === item.author.userId) {
      toast.error("내 피드에는 제안을 보낼 수 없습니다.");
      return;
    }
    const now = Date.now();
    const proposalMessage = `안녕하세요. "${item.title}" 작업을 보고 프로젝트 제안을 드리고 싶어 연락드립니다. 작업 가능 여부와 일정, 견적 등을 이야기해보고 싶습니다.`;
    try {
      const conversation = await createMessageConversationApi(item.author.userId);
      await sendConversationMessageApi(conversation.id, {
        clientId: `profile-proposal-${item.id}-${now}`,
        message: proposalMessage,
        attachments: item.image
          ? [
              {
                id: `profile-feed-${item.id}`,
                type: "image",
                src: item.image,
                name: item.title,
                uploadStatus: "ready",
              },
            ]
          : [],
      });
      navigate(`/messages?conversationId=${conversation.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "대화를 시작하지 못했습니다.");
    }
  };

  const formatProfileFeedDateTime = (value?: string) => {
    if (!value) return null;
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return null;
    return parsedDate.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className={`flex min-h-screen flex-col transition-colors duration-300 ${
        isNight ? "bg-[#0a0f18]" : "bg-[#F4F3EF]"
      }`}
    >
      <Navigation />

      <main className="pickxel-animate-page-in relative z-10 mx-auto w-full max-w-[1200px] flex-1 px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
        {isProfileLoading && (
          <div
            className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm ${
              isNight
                ? "border-[#00C9A7]/25 bg-[#00C9A7]/10 text-[#7EE8D4]"
                : "border-[#BDEFD8]/80 bg-[#F5FFFB] text-[#007E68]"
            }`}
          >
            Loading profile...
          </div>
        )}

        {profileError && (
          <div
            className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm ${
              isNight
                ? "border-[#FF8A70]/35 bg-[#3d2520]/90 text-[#FFB9AA]"
                : "border-[#FFB9AA] bg-[#FFF7F4] text-[#B13A21]"
            }`}
          >
            {profileError}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className={`mb-8 rounded-[2rem] border p-6 backdrop-blur-md sm:mb-10 sm:p-10 ${
            isNight
              ? "border-white/10 bg-[#141d30]/95 shadow-[0_28px_90px_rgba(0,0,0,0.45)]"
              : "border-white/70 bg-white/95 shadow-[0_28px_90px_rgba(15,23,42,0.08)]"
          }`}
        >
          <div className="flex flex-col gap-8 md:flex-row md:gap-10">
            <div className="flex flex-shrink-0 flex-col items-center gap-3 md:items-start">
              <div
                className={`size-28 overflow-hidden rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.12)] ring-4 sm:size-32 ${
                  isNight ? "bg-[#1a2436] ring-[#1a2436]" : "bg-gray-100 ring-white"
                }`}
              >
                <ImageWithFallback
                  src={displayProfile.avatar}
                  alt={displayProfile.name}
                  className="h-full w-full rounded-full object-cover"
                />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2 sm:gap-3">
                    <h1
                      className={`text-2xl font-bold tracking-tight sm:text-3xl ${
                        isNight ? "text-white" : "text-[#0F0F0F]"
                      }`}
                    >
                      {displayProfile.name}
                    </h1>
                    <span className={`rounded-xl border px-3 py-1 text-xs font-semibold ${profileRoleBadgeClass}`}>
                      {profileRoleLabel}
                    </span>
                    {canQuickEditWorkStatus ? (
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isSavingWorkStatus}
                          onClick={() => handleQuickWorkStatusChange(nextQuickWorkStatus)}
                          className={`inline-flex h-8 items-center rounded-xl border px-3 text-xs font-bold shadow-sm transition-colors hover:border-[#00C9A7] hover:text-[#007E68] disabled:cursor-not-allowed disabled:opacity-60 ${
                            isNight
                              ? "border-white/10 bg-white/5 text-white/80"
                              : "border-gray-200/90 bg-white text-gray-700"
                          }`}
                        >
                          {isSavingWorkStatus
                            ? "저장 중..."
                            : profileWorkStatus
                              ? workStatusIndicatorLabel
                              : "작업 가능 설정"}
                        </button>
                        <span
                          aria-label={workStatusIndicatorLabel}
                          title={workStatusIndicatorLabel}
                          className={`size-3.5 rounded-full shadow-sm ring-2 ${isNight ? "ring-[#141d30]" : "ring-white"} ${workStatusIndicatorClass}`}
                        />
                      </div>
                    ) : (
                      showWorkStatusIndicator && (
                        <div
                          className={`inline-flex items-center gap-2 rounded-xl px-2.5 py-1 text-xs font-bold ring-1 ${
                            isNight
                              ? "bg-white/5 text-white/60 ring-white/10"
                              : "bg-[#FAFAF8] text-gray-600 ring-black/[0.06]"
                          }`}
                        >
                          <span className={`size-3 rounded-full ${workStatusIndicatorClass}`} />
                          <span>{workStatusIndicatorLabel}</span>
                        </div>
                      )
                    )}
                  </div>
                  {(displayProfile as any).realName &&
                    (displayProfile as any).realName !== displayProfile.name && (
                      <p
                        className={`mb-2 text-sm font-medium ${isNight ? "text-white/45" : "text-gray-500"}`}
                      >
                        {(displayProfile as any).realName}
                      </p>
                    )}
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-amber-500">★ {displayProfile.rating}</span>
                  </div>
                  <p className={`mb-1 font-semibold ${isNight ? "text-white/90" : "text-gray-800"}`}>
                    {displayProfile.title}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {canEditProfile && (
                    <button
                      type="button"
                      onClick={handleOpenProfileEditor}
                      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#00C9A7] hover:text-[#007E68] focus:outline-none focus:ring-2 focus:ring-[#BDEFD8] focus:ring-offset-2 ${
                        isNight
                          ? "border-white/10 bg-white/5 text-white/90 focus:ring-offset-[#0a0f18]"
                          : "border-gray-200/90 bg-white text-gray-800 focus:ring-offset-white"
                      }`}
                    >
                      프로필 수정
                    </button>
                  )}
                  {apiProfile && !apiProfile.owner && (
                    <button
                      type="button"
                      onClick={handleToggleFollow}
                      disabled={isFollowSaving}
                      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[#BDEFD8] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                        apiProfile.following
                          ? isNight
                            ? "border-[#00C9A7]/35 bg-[#00C9A7]/15 text-[#7EE8D4] hover:border-[#00C9A7]/50"
                            : "border-[#BDEFD8] bg-white text-[#007E68] hover:border-[#00C9A7]"
                          : "border-[#00C9A7] bg-[#00C9A7] text-[#0F0F0F] shadow-[0_8px_18px_rgba(0,201,167,0.22)] hover:-translate-y-0.5 hover:bg-[#00A88C]"
                      }`}
                    >
                      {isFollowSaving ? "저장 중..." : apiProfile.following ? "팔로잉" : "팔로우"}
                    </button>
                  )}
                  {apiProfile && !apiProfile.owner && (
                    <button
                      type="button"
                      onClick={handleStartConversation}
                      disabled={isStartingConversation}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#00C9A7]/40 bg-[#00C9A7] px-4 py-2.5 text-sm font-bold text-[#0F0F0F] shadow-[0_8px_18px_rgba(0,201,167,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#00A88C] focus:outline-none focus:ring-2 focus:ring-[#BDEFD8] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <MessageCircle className="size-4" />
                      <span>{isStartingConversation ? "연결 중..." : "메시지 보내기"}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-4 flex gap-8">
                <div>
                  <div
                    className={`text-2xl font-bold tabular-nums ${isNight ? "text-white" : "text-[#0F0F0F]"}`}
                  >
                    {displayProfile.followers}
                  </div>
                  <div className={`text-sm ${isNight ? "text-white/45" : "text-gray-500"}`}>팔로워</div>
                </div>
                <div>
                  <div
                    className={`text-2xl font-bold tabular-nums ${isNight ? "text-white" : "text-[#0F0F0F]"}`}
                  >
                    {displayProfile.following}
                  </div>
                  <div className={`text-sm ${isNight ? "text-white/45" : "text-gray-500"}`}>팔로잉</div>
                </div>
              </div>

              <div className="mb-5 flex flex-wrap gap-2">
                {displayProfile.badges.map((badge, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-gradient-to-r from-[#00C9A7] to-[#3dd4b8] px-3 py-1 text-xs font-semibold text-[#0F0F0F] shadow-sm"
                  >
                    {badge}
                  </span>
                ))}
              </div>

              <div className={`space-y-2 text-sm ${isNight ? "text-white/55" : "text-gray-600"}`}>
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 shrink-0 text-[#00A88C]" />
                  <span>{displayProfile.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 shrink-0 text-[#FF5C3A]/80" />
                  <span>{displayProfile.recentProject}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>{displayProfile.responseTime}</span>
                </div>
              </div>
              {profileToolLinks.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {profileToolLinks.map((link) => {
                    const Icon = link.icon;

                    return (
                      <a
                        key={link.label}
                        href={normalizeExternalUrl(link.url)}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-bold shadow-sm transition-colors hover:border-[#00C9A7] hover:text-[#007E68] ${
                          isNight
                            ? "border-white/10 bg-white/5 text-white/75"
                            : "border-gray-200/90 bg-white text-gray-700"
                        }`}
                      >
                        <Icon className="size-4" />
                        {link.label}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 38, delay: 0.06 }}
          className="mb-10 w-full"
        >
          <div
            className={`inline-flex flex-wrap gap-1 rounded-2xl border p-1.5 shadow-sm backdrop-blur-sm ${
              isNight
                ? "border-white/10 bg-[#141d30]/80"
                : "border-black/[0.06] bg-white/70"
            }`}
          >
            {(
              [
                { id: "feed" as const, label: "피드", hint: "Feed" },
                { id: "collection" as const, label: "컬렉션", hint: "Collection" },
                { id: "reviews" as const, label: "후기", hint: "Reviews" },
              ] as const
            ).map((tab) => {
              const active = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleProfileTabChange(tab.id)}
                  className={`relative rounded-xl px-4 py-2.5 text-sm font-bold transition-colors sm:px-5 ${
                    active
                      ? isNight
                        ? "text-white"
                        : "text-[#0F0F0F]"
                      : isNight
                        ? "text-white/45 hover:text-white/80"
                        : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="profileTabIndicator"
                      className={`absolute inset-0 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ${
                        isNight
                          ? "bg-[#1a2436] ring-white/10"
                          : "bg-white ring-black/[0.05]"
                      }`}
                      transition={tabSpring}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {tab.label}
                    <span
                      className={`hidden text-[11px] font-semibold uppercase tracking-wide sm:inline ${
                        isNight ? "text-white/35" : "text-gray-400"
                      }`}
                    >
                      {tab.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
        {activeTab === "feed" && (
          <motion.div
            key="profile-tab-feed"
            role="tabpanel"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={tabSpring}
            className="mb-12 w-full"
          >
            <div className="flex w-full flex-col gap-6">
              {canCreateFeed && (
                <button
                  type="button"
                  onClick={() => setIsWorkComposerOpen(true)}
                  className={`group flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left shadow-[0_10px_40px_rgba(0,126,104,0.07)] ring-1 transition-all hover:border-[#00C9A7]/45 hover:shadow-[0_14px_44px_rgba(0,126,104,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00C9A7] focus-visible:ring-offset-2 sm:gap-5 sm:px-5 sm:py-4 ${
                    isNight
                      ? "border-[#00C9A7]/25 bg-gradient-to-br from-[#0d2822] via-[#141d30] to-[#0f1828] ring-[#00C9A7]/20 focus-visible:ring-offset-[#0a0f18]"
                      : "border-[#B6E6DA]/70 bg-gradient-to-br from-[#F8FFFC] via-white to-[#F4FBF8] ring-[#00C9A7]/10 focus-visible:ring-offset-[#F4F3EF]"
                  }`}
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#00C9A7] text-[#0F0F0F] shadow-[0_6px_20px_rgba(0,201,167,0.35)] transition-transform duration-200 group-hover:scale-[1.03] sm:size-14">
                    <ImagePlus className="size-6 sm:size-7" strokeWidth={2.25} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-base font-bold tracking-tight sm:text-[1.05rem] ${
                        isNight ? "text-white" : "text-[#0F0F0F]"
                      }`}
                    >
                      새 작업 올리기
                    </p>
                    <p
                      className={`mt-0.5 text-sm leading-snug ${isNight ? "text-white/50" : "text-[#5F5E5A]"}`}
                    >
                      이미지와 설명을 추가하면 아래 그리드에 바로 표시됩니다.
                    </p>
                  </div>
                  <ChevronRight
                    className={`size-5 shrink-0 opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100 sm:size-6 ${
                      isNight ? "text-[#7EE8D4]" : "text-[#00A88C]"
                    }`}
                    aria-hidden
                  />
                </button>
              )}

              {!hasLoadedProfileFeeds && apiProfile && (
                <p
                  className={`py-10 text-center text-sm font-medium ${isNight ? "text-white/45" : "text-gray-500"}`}
                >
                  피드를 불러오는 중...
                </p>
              )}

              {hasLoadedProfileFeeds && feedProjects.length === 0 && (
                <div
                  className={`rounded-2xl border border-dashed py-16 text-center ${
                    isNight
                      ? "border-white/10 bg-[#141d30]/60"
                      : "border-gray-200/90 bg-white/60"
                  }`}
                >
                  <Grid3X3
                    className={`mx-auto mb-3 size-10 ${isNight ? "text-white/20" : "text-gray-300"}`}
                    aria-hidden
                  />
                  <p className={`text-sm font-semibold ${isNight ? "text-white/70" : "text-gray-600"}`}>
                    아직 올린 작업이 없습니다
                  </p>
                  {canCreateFeed && (
                    <p className={`mt-1 text-xs ${isNight ? "text-white/40" : "text-gray-500"}`}>
                      위의 새 작업 올리기를 눌러 첫 게시물을 추가해 보세요.
                    </p>
                  )}
                </div>
              )}

              {hasLoadedProfileFeeds && feedProjects.length > 0 && (
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 sm:gap-1.5 lg:grid-cols-4">
                  {feedProjects.map((project, index) => {
                    const card = profileFeedCardItems[index];
                    if (!card) return null;
                    const cover =
                      card.image || project.imageUrl || (project.images && project.images[0]) || "";
                    const multiCount = card.images?.length ?? (project.images?.length || 0);

                    return (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: "-24px" }}
                        transition={{ ...tabSpring, delay: Math.min(index * 0.04, 0.28) }}
                        className={`group relative aspect-square overflow-hidden rounded-md ring-1 ${
                          isNight
                            ? "bg-[#1a2436] ring-white/[0.06]"
                            : "bg-[#EEECE8] ring-black/[0.04]"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => openProfileFeedDetail(card)}
                          className={`absolute inset-0 block h-full w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00C9A7] focus-visible:ring-offset-2 ${
                            isNight ? "focus-visible:ring-offset-[#0a0f18]" : ""
                          }`}
                          aria-label={`${project.title} 상세 보기`}
                        >
                          {cover ? (
                            <ImageWithFallback
                              src={cover}
                              alt=""
                              className="h-full w-full object-cover transition duration-300 ease-out group-hover:scale-[1.03]"
                            />
                          ) : (
                            <div
                              className={`flex h-full w-full items-center justify-center ${
                                isNight ? "bg-[#0e1524] text-white/25" : "bg-[#F1EFE8] text-gray-400"
                              }`}
                            >
                              <ImagePlus className="size-8 opacity-40" aria-hidden />
                            </div>
                          )}
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-5 bg-black/0 opacity-0 transition duration-200 group-hover:bg-black/50 group-hover:opacity-100">
                            <span className="flex items-center gap-1.5 text-sm font-bold tabular-nums text-white drop-shadow">
                              <Heart className="size-5 shrink-0 fill-white/90 text-white/90" aria-hidden />
                              {card.likes}
                            </span>
                            <span className="flex items-center gap-1.5 text-sm font-bold tabular-nums text-white drop-shadow">
                              <MessageCircle className="size-5 shrink-0 text-white" aria-hidden />
                              {card.comments}
                            </span>
                          </div>
                        </button>
                        {multiCount > 1 && (
                          <div
                            className="pointer-events-none absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded bg-black/55 text-white shadow-sm"
                            aria-hidden
                          >
                            <Grid3X3 className="size-3.5" />
                          </div>
                        )}
                        {canEditProfile && project.persisted && (
                          <div className="absolute left-1 top-1 z-10 flex gap-0.5 opacity-0 transition group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openFeedEditor(project);
                              }}
                              className="rounded-md border border-white/80 bg-white/95 p-1.5 text-gray-600 shadow-sm transition-colors hover:border-[#00C9A7] hover:text-[#007E68]"
                              aria-label="피드 수정"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteFeed(project);
                              }}
                              className="rounded-md border border-white/80 bg-white/95 p-1.5 text-gray-600 shadow-sm transition-colors hover:border-[#FFB9AA] hover:text-[#B13A21]"
                              aria-label="피드 삭제"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "collection" && (
          <motion.div
            key="profile-tab-collection"
            role="tabpanel"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={tabSpring}
            className="mb-12 space-y-6"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className={`text-2xl font-bold tracking-tight ${isNight ? "text-white" : "text-[#0F0F0F]"}`}>
                  컬렉션
                </h2>
                <p className={`mt-1 max-w-xl text-sm ${isNight ? "text-white/50" : "text-[#5F5E5A]"}`}>
                  저장한 피드를 폴더별로 모아 볼 수 있어요. 새로 만들거나 이름 변경·삭제는 컬렉션 페이지에서 할 수 있습니다.
                </p>
              </div>
              {canEditProfile && (
                <Link
                  to="/collections"
                  className={`inline-flex shrink-0 items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-bold shadow-sm transition-colors ${
                    isNight
                      ? "border-[#00C9A7]/30 bg-[#00C9A7]/12 text-[#7EE8D4] hover:border-[#00C9A7]/50 hover:bg-[#00C9A7]/18"
                      : "border-[#B6E6DA] bg-[#F3FCF8] text-[#007E68] hover:border-[#00C9A7] hover:bg-white"
                  }`}
                >
                  컬렉션에서 만들기·편집
                </Link>
              )}
            </div>

            {collectionError && (
              <div
                className={`rounded-lg border px-4 py-3 text-sm font-semibold ${
                  isNight
                    ? "border-[#FF8A70]/35 bg-[#3d2520]/90 text-[#FFB9AA]"
                    : "border-[#FFB9AA] bg-[#FFF7F4] text-[#B13A21]"
                }`}
              >
                {collectionError}
              </div>
            )}

            {isCollectionsLoading ? (
              <div
                className={`rounded-lg border px-4 py-3 text-sm font-semibold ${
                  isNight
                    ? "border-[#00C9A7]/25 bg-[#00C9A7]/10 text-[#7EE8D4]"
                    : "border-[#BDEFD8] bg-[#F5FFFB] text-[#007E68]"
                }`}
              >
                컬렉션을 불러오는 중...
              </div>
            ) : collectionFolders.length === 0 ? (
              <div
                className={`rounded-2xl border py-16 text-center shadow-sm ${
                  isNight
                    ? "border-white/10 bg-[#141d30]/90"
                    : "border-gray-200/90 bg-white"
                }`}
              >
                <FolderOpen
                  className={`mx-auto mb-4 size-12 ${isNight ? "text-white/20" : "text-gray-300"}`}
                />
                <h3 className={`mb-2 text-xl font-bold ${isNight ? "text-white" : "text-[#0F0F0F]"}`}>
                  아직 컬렉션이 없어요
                </h3>
                <p className={`text-sm ${isNight ? "text-white/50" : "text-[#5F5E5A]"}`}>
                  마음에 드는 피드를 저장해 나만의 컬렉션을 만들어보세요.
                </p>
                {canEditProfile && (
                  <Link
                    to="/collections"
                    className="mt-6 inline-flex items-center rounded-xl bg-[#00C9A7] px-5 py-2.5 text-sm font-bold text-[#0F0F0F] transition-colors hover:bg-[#00A88C]"
                  >
                    컬렉션 페이지로 이동
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {collectionFolders.map((folder, folderIndex) => {
                  return (
                    <motion.div
                      key={folder.folderId}
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ ...tabSpring, delay: Math.min(folderIndex * 0.05, 0.25) }}
                      whileHover={{ y: -4, transition: { duration: 0.25 } }}
                      onClick={() => handleOpenCollection(folder.folderId)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          void handleOpenCollection(folder.folderId);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className={`group cursor-pointer overflow-visible rounded-2xl border shadow-sm transition-shadow hover:shadow-lg ${
                        isNight
                          ? "border-white/10 bg-[#141d30] shadow-black/30"
                          : "border-gray-200/80 bg-white"
                      }`}
                    >
                      <AnimatedFolder
                        isNight={isNight}
                        title={folder.folderName}
                        projects={collectionToFolderProjects(folder)}
                        itemCount={folder.itemCount}
                        metaLine={folder.itemCount > 0 ? getRelativeCollectionLabel(folder.createdAt) : undefined}
                        gradient={getFolderGradientByFolderId(folder.folderId)}
                        className="w-full !border-0 !bg-transparent !shadow-none hover:!border-transparent hover:!shadow-none"
                        onViewProject={() => handleOpenCollection(folder.folderId)}
                        showHoverHint={folder.itemCount > 0}
                        emptyHint="아직 저장된 피드가 없습니다. Feed에서 마음에 드는 작업을 저장해보세요."
                        viewProjectLabel="컬렉션 열기"
                        countLabel="피드"
                      />
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "reviews" && (
          <motion.div
            key="profile-tab-reviews"
            role="tabpanel"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={tabSpring}
            className="mb-12"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className={`text-2xl font-bold tracking-tight ${isNight ? "text-white" : "text-[#0F0F0F]"}`}>
                프로젝트 후기
              </h2>
              <div className={`text-sm ${isNight ? "text-white/45" : "text-gray-500"}`}>
                총 {profileReviews.length}개의 후기
              </div>
            </div>
            {isReviewsLoading ? (
              <div
                className={`rounded-lg border py-12 text-center text-sm font-semibold ${
                  isNight
                    ? "border-white/10 bg-[#141d30] text-white/50"
                    : "border-gray-200 bg-white text-gray-500"
                }`}
              >
                프로젝트 후기를 불러오는 중입니다.
              </div>
            ) : reviewsError ? (
              <div
                className={`rounded-lg border px-4 py-3 text-sm font-semibold ${
                  isNight
                    ? "border-[#FF8A70]/35 bg-[#3d2520]/90 text-[#FFB9AA]"
                    : "border-[#FFB9AA] bg-[#FFF7F4] text-[#B13A21]"
                }`}
              >
                {reviewsError}
              </div>
            ) : profileReviews.length === 0 ? (
              <div
                className={`rounded-lg border border-dashed px-6 py-12 text-center ${
                  isNight
                    ? "border-white/10 bg-[#141d30]/80"
                    : "border-gray-300 bg-white"
                }`}
              >
                <Star className={`mx-auto mb-3 size-10 ${isNight ? "text-white/20" : "text-gray-300"}`} />
                <h3 className={`text-lg font-bold ${isNight ? "text-[#7EE8D4]" : "text-[#12382D]"}`}>
                  아직 프로젝트 후기가 없어요
                </h3>
                <p className={`mt-2 text-sm ${isNight ? "text-white/45" : "text-gray-500"}`}>
                  프로젝트를 완료하면 클라이언트가 남긴 후기가 이곳에 표시됩니다.
                </p>
              </div>
            ) : (
            <div className="space-y-4">
              {profileReviews.map((review, reviewIndex) => (
                <motion.div
                  key={review.reviewId ?? `${review.projectId}-${review.reviewerId}-${review.createdAt}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ ...tabSpring, delay: Math.min(reviewIndex * 0.06, 0.3) }}
                  className={`rounded-[1.25rem] border p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] transition-shadow ${
                    isNight
                      ? "border-white/10 bg-[#141d30]/95 hover:shadow-[0_18px_56px_rgba(0,0,0,0.35)]"
                      : "border-black/[0.06] bg-white/95 hover:shadow-[0_18px_56px_rgba(15,23,42,0.1)]"
                  }`}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <ImageWithFallback
                      src={getUserAvatar(review.reviewerProfileImage)}
                      alt={review.reviewerNickname || review.reviewerName || "reviewer"}
                      className={`size-14 flex-shrink-0 rounded-full object-cover ring-2 shadow-sm ${
                        isNight ? "ring-[#1a2436]" : "ring-white"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className={`font-bold text-lg ${isNight ? "text-white" : "text-[#0F0F0F]"}`}>
                            {review.projectTitle}
                          </div>
                          <div className={`text-sm ${isNight ? "text-white/50" : "text-gray-600"}`}>
                            {review.reviewerNickname || review.reviewerName || "익명 클라이언트"}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`size-5 ${
                                i < review.rating
                                  ? "fill-[#FF5C3A] text-[#FF5C3A]"
                                  : isNight
                                    ? "text-white/15"
                                    : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {review.workCategories?.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {review.workCategories.map((category) => (
                            <span
                              key={category}
                              className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-bold shadow-sm ${
                                isNight
                                  ? "border-[#00C9A7]/35 bg-[#00C9A7]/12 text-[#7EE8D4]"
                                  : "border-[#00C9A7]/30 bg-[#F2FFFC] text-[#007E68]"
                              }`}
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      )}

                      {review.complimentTags?.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {review.complimentTags.map((tag) => (
                            <span
                              key={tag}
                              className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-bold shadow-sm ${
                                isNight
                                  ? "border-[#FF8A70]/35 bg-[#3d2520]/80 text-[#FFB9AA]"
                                  : "border-[#FFB9AA] bg-[#FFF7F4] text-[#B13A21]"
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className={`mb-3 leading-relaxed ${isNight ? "text-white/75" : "text-gray-700"}`}>
                    {review.content}
                  </p>
                  {review.createdAt && (
                    <div className={`mt-3 text-xs ${isNight ? "text-white/35" : "text-gray-500"}`}>
                      {new Date(review.createdAt).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
            )}
          </motion.div>
        )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
      {isWorkComposerOpen && (
        <motion.div
          key="work-composer-overlay"
          role="presentation"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={closeWorkComposer}
        >
          <motion.div
            className={`grid max-h-[90vh] w-full max-w-7xl overflow-y-auto rounded-2xl shadow-2xl ring-1 lg:grid-cols-[0.9fr_0.95fr_0.8fr] lg:overflow-hidden ${
              isNight ? "bg-[#141d30] ring-white/10" : "bg-white ring-black/[0.06]"
            }`}
            initial={{ opacity: 0, scale: 0.96, y: 22 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={modalSpring}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex min-h-[420px] flex-col bg-[#0F0F0F]">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white">
                <span className="text-sm font-semibold">새 게시물</span>
                <button
                  type="button"
                  onClick={() => workImageInputRef.current?.click()}
                  disabled={!canAddWorkImages}
                  className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ImagePlus className="size-4" />
                  이미지 추가
                </button>
              </div>

              <input
                ref={workImageInputRef}
                type="file"
                accept={SUPPORTED_IMAGE_ACCEPT}
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
                      최대 {MAX_FEED_IMAGES}장까지 한 게시물에 올릴 수 있습니다.
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

            <div className={`flex max-h-[90vh] flex-col ${isNight ? "bg-[#141d30]" : "bg-white"}`}>
              <div
                className={`flex items-center justify-between border-b px-5 py-4 ${
                  isNight ? "border-white/10" : "border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <ImageWithFallback
                    src={displayProfile.avatar}
                    alt={displayProfile.name}
                    className="size-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${isNight ? "text-white" : "text-[#0F0F0F]"}`}>
                        {displayProfile.name}
                      </span>
                      <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-semibold ${profileRoleBadgeClass}`}>
                        {profileRoleLabel}
                      </span>
                    </div>
                    <p className={`text-xs ${isNight ? "text-white/45" : "text-gray-500"}`}>작업 피드에 공유</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeWorkComposer}
                  className={`rounded-lg p-2 transition-colors ${
                    isNight
                      ? "text-white/45 hover:bg-white/10 hover:text-white/80"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                  }`}
                  aria-label="게시물 작성 닫기"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-5">
                {workComposerError && (
                  <div
                    className={`rounded-lg border px-4 py-3 text-sm font-semibold ${
                      isNight
                        ? "border-[#FF8A70]/35 bg-[#3d2520]/90 text-[#FFB9AA]"
                        : "border-[#FFB9AA] bg-[#FFF7F4] text-[#B13A21]"
                    }`}
                  >
                    {workComposerError}
                  </div>
                )}

                <label className="block">
                  <span
                    className={`mb-2 block text-sm font-semibold ${isNight ? "text-white/80" : "text-gray-700"}`}
                  >
                    작업물 제목
                  </span>
                  <input
                    type="text"
                    value={workTitle}
                    onChange={(event) => setWorkTitle(event.target.value)}
                    placeholder="예: 브랜드 리뉴얼 시안"
                    className={`w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors focus:border-[#00C9A7] ${
                      isNight
                        ? "border-white/10 bg-[#0e1524] text-white placeholder:text-white/35"
                        : "border-gray-200 bg-white text-[#0F0F0F]"
                    }`}
                  />
                </label>

                <label className="block">
                  <span
                    className={`mb-2 block text-sm font-semibold ${isNight ? "text-white/80" : "text-gray-700"}`}
                  >
                    캡션
                  </span>
                  <textarea
                    value={workDescription}
                    onChange={(event) => setWorkDescription(event.target.value)}
                    placeholder="작업 의도, 사용 툴, 협업 포인트를 적어주세요."
                    rows={7}
                    className={`w-full resize-none rounded-lg border px-4 py-3 text-sm outline-none transition-colors focus:border-[#00C9A7] ${
                      isNight
                        ? "border-white/10 bg-[#0e1524] text-white placeholder:text-white/35"
                        : "border-gray-200 bg-white text-[#0F0F0F]"
                    }`}
                  />
                </label>

                <label className="block">
                  <span
                    className={`mb-2 block text-sm font-semibold ${isNight ? "text-white/80" : "text-gray-700"}`}
                  >
                    태그
                  </span>
                  <div
                    className={`rounded-lg border px-3 py-2 transition-colors focus-within:border-[#00C9A7] ${
                      isNight ? "border-white/10 bg-[#0e1524]" : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex min-h-8 flex-wrap items-center gap-2">
                      {workTagList.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => removeWorkTag(tag)}
                          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors hover:bg-[#DDF8EC] ${
                            isNight
                              ? "bg-[#00C9A7]/15 text-[#7EE8D4] hover:bg-[#00C9A7]/25"
                              : "bg-[#F5FFFB] text-[#007E68]"
                          }`}
                          aria-label={`${tag} 태그 제거`}
                        >
                          {tag}
                          <X className="size-3" />
                        </button>
                      ))}
                      <input
                        type="text"
                        value={workTagInput}
                        onChange={(event) => handleWorkTagInputChange(event.target.value)}
                        onKeyDown={handleWorkTagInputKeyDown}
                        onBlur={commitWorkTagInput}
                        placeholder={workTagList.length > 0 ? "태그 추가" : "branding 입력 후 Enter"}
                        className={`min-w-32 flex-1 border-0 bg-transparent px-1 py-1 text-sm outline-none ${
                          isNight ? "text-white placeholder:text-white/35" : "text-[#0F0F0F]"
                        }`}
                      />
                    </div>
                  </div>
                  <span className={`mt-1 block text-xs ${isNight ? "text-white/40" : "text-gray-500"}`}>
                    띄어쓰기, Enter, 쉼표를 누르면 태그가 바로 생성됩니다. Backspace로 마지막 태그를 지울 수 있어요.
                  </span>
                </label>

                <div className="block">
                  <span
                    className={`mb-2 block text-sm font-semibold ${isNight ? "text-white/80" : "text-gray-700"}`}
                  >
                    탐색 카테고리
                  </span>
                  <p className={`mb-3 text-xs ${isNight ? "text-white/45" : "text-gray-500"}`}>
                    탐색 페이지에서 분류될 작업 분야를 골라주세요.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {matchingCategories.map((category) => {
                      const isSelected = workCategories.includes(category);

                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => handleToggleWorkCategory(category)}
                          className={`rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                            isSelected
                              ? isNight
                                ? "border-[#FF8A70]/50 bg-[#3d2520]/90 text-[#FFB9AA] shadow-sm"
                                : "border-[#FF5C3A] bg-[#FFF7F4] text-[#B13A21] shadow-sm"
                              : isNight
                                ? "border-white/10 bg-[#0e1524] text-white/60 hover:border-[#FF5C3A]/50 hover:bg-[#1a2436]"
                                : "border-gray-200 bg-[#F7F7F5] text-gray-600 hover:border-[#FF5C3A] hover:bg-white"
                          }`}
                          aria-pressed={isSelected}
                        >
                          {category}
                        </button>
                      );
                    })}
                  </div>
                  <div
                    className={`mt-4 rounded-lg border p-3 ${
                      isNight
                        ? "border-[#00C9A7]/25 bg-[#00C9A7]/10"
                        : "border-[#BDEFD8] bg-[#F5FFFB]"
                    }`}
                  >
                    <p className={`mb-2 text-xs font-bold ${isNight ? "text-[#7EE8D4]" : "text-[#007E68]"}`}>
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
                                  ? isNight
                                    ? "cursor-default border-[#00C9A7]/30 bg-[#00C9A7]/15 text-[#7EE8D4]"
                                    : "cursor-default border-[#00C9A7]/30 bg-[#F5FFFB] text-[#007E68]"
                                  : isNight
                                    ? "border-white/10 bg-[#141d30] text-white/70 shadow-sm hover:-translate-y-0.5 hover:border-[#00C9A7]/40 hover:text-[#7EE8D4]"
                                    : "border-white bg-white text-gray-700 shadow-sm hover:-translate-y-0.5 hover:border-[#00C9A7] hover:text-[#007E68]"
                              }`}
                            >
                              {isAdded ? `${tag} 추가됨` : tag}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className={`text-xs font-medium ${isNight ? "text-white/45" : "text-gray-500"}`}>
                        분야를 먼저 고르면 바로 넣을 수 있는 태그를 추천해드릴게요.
                      </p>
                    )}
                  </div>
                </div>

                <div
                  className={`rounded-lg border p-4 ${
                    isNight ? "border-white/10 bg-[#0e1524]" : "border-gray-200 bg-[#FAFBF8]"
                  }`}
                >
                  <div className="mb-3">
                    <h3 className={`text-sm font-bold ${isNight ? "text-[#7EE8D4]" : "text-[#12382D]"}`}>
                      작업 파일 연동
                    </h3>
                    <p className={`mt-1 text-xs ${isNight ? "text-white/45" : "text-gray-500"}`}>
                      Figma 또는 Adobe 작업 링크를 함께 공유할 수 있습니다.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <label
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                        isNight ? "bg-[#141d30]" : "bg-white"
                      }`}
                    >
                      <Figma className="size-5 shrink-0 text-[#00A88C]" />
                      <input
                        type="url"
                        value={figmaUrl}
                        onChange={(event) => setFigmaUrl(event.target.value)}
                        placeholder="Figma 링크"
                        className={`min-w-0 flex-1 bg-transparent text-sm outline-none ${
                          isNight ? "text-white placeholder:text-white/35" : "text-[#0F0F0F]"
                        }`}
                      />
                    </label>
                    <label
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                        isNight ? "bg-[#141d30]" : "bg-white"
                      }`}
                    >
                      <Sparkles className="size-5 shrink-0 text-[#FF5C3A]" />
                      <input
                        type="url"
                        value={adobeUrl}
                        onChange={(event) => setAdobeUrl(event.target.value)}
                        placeholder="Adobe 링크"
                        className={`min-w-0 flex-1 bg-transparent text-sm outline-none ${
                          isNight ? "text-white placeholder:text-white/35" : "text-[#0F0F0F]"
                        }`}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div
                className={`border-t p-5 ${isNight ? "border-white/10" : "border-gray-200"}`}
              >
                <div
                  className={`mb-4 rounded-lg border p-3 ${
                    isNight ? "border-white/10 bg-[#0e1524]" : "border-gray-200 bg-[#FAFBF8]"
                  }`}
                >
                  <p className={`mb-2 text-xs font-bold ${isNight ? "text-[#7EE8D4]" : "text-[#12382D]"}`}>
                    업로드 전 체크리스트
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {uploadChecklist.map((item) => (
                      <span
                        key={item.label}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold ${
                          item.done
                            ? isNight
                              ? "border-[#00C9A7]/35 bg-[#00C9A7]/12 text-[#7EE8D4]"
                              : "border-[#00C9A7]/30 bg-[#F2FFFC] text-[#007E68]"
                            : isNight
                              ? "border-white/10 bg-[#141d30] text-white/45"
                              : "border-gray-200 bg-white text-gray-500"
                        }`}
                      >
                        <CheckCircle
                          className={`size-3.5 ${
                            item.done ? "text-[#00C9A7]" : isNight ? "text-white/25" : "text-gray-300"
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
                  {isCreatingFeed ? "공유 중..." : "공유하기"}
                </button>
              </div>
            </div>

            <aside
              className={`flex max-h-[90vh] flex-col border-l ${
                isNight ? "border-white/10 bg-[#0e1524]" : "border-gray-200 bg-[#F7F7F5]"
              }`}
            >
              <div
                className={`border-b px-5 py-4 ${isNight ? "border-white/10" : "border-gray-200"}`}
              >
                <p className={`text-sm font-bold ${isNight ? "text-[#7EE8D4]" : "text-[#12382D]"}`}>
                  게시물 미리보기
                </p>
                <p className={`mt-1 text-xs ${isNight ? "text-white/45" : "text-gray-500"}`}>
                  실제 피드에 올라갈 모습을 확인해보세요.
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <article
                  className={`overflow-hidden rounded-lg border shadow-sm ${
                    isNight ? "border-white/10 bg-[#141d30]" : "border-gray-200 bg-white"
                  }`}
                >
                  <div
                    className={`flex items-center gap-3 border-b p-4 ${
                      isNight ? "border-white/10" : "border-gray-100"
                    }`}
                  >
                    <ImageWithFallback
                      src={displayProfile.avatar}
                      alt={displayProfile.name}
                      className="size-10 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={`truncate text-sm font-bold ${isNight ? "text-white" : "text-[#12382D]"}`}
                        >
                          {displayProfile.name}
                        </p>
                        <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-semibold ${profileRoleBadgeClass}`}>
                          {profileRoleLabel}
                        </span>
                      </div>
                      <p className={`truncate text-xs ${isNight ? "text-white/45" : "text-gray-500"}`}>
                        {displayProfile.title}
                      </p>
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
                    <div
                      className={`flex aspect-square flex-col items-center justify-center ${
                        isNight ? "bg-[#1a2436] text-white/45" : "bg-[#F1F1EE] text-gray-500"
                      }`}
                    >
                      <ImagePlus className="mb-3 size-10" />
                      <p className="text-sm font-semibold">이미지를 추가하면 미리보기가 보여요</p>
                    </div>
                  )}

                  <div className="space-y-3 p-4">
                    <div className={`flex items-center gap-4 ${isNight ? "text-white/70" : "text-gray-700"}`}>
                      <Heart className="size-5" />
                      <MessageCircle className="size-5" />
                      <Bookmark className="ml-auto size-5" />
                    </div>

                    {workCategories.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {workCategories.map((category) => (
                          <span
                            key={category}
                            className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${
                              isNight
                                ? "bg-[#3d2520]/80 text-[#FFB9AA]"
                                : "bg-[#FFF7F4] text-[#B13A21]"
                            }`}
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    )}

                    <div>
                      <h3
                        className={`line-clamp-2 text-sm font-bold ${isNight ? "text-white" : "text-[#12382D]"}`}
                      >
                        {workTitle.trim() || "게시물 제목이 여기에 보여요"}
                      </h3>
                      <p
                        className={`mt-1 line-clamp-4 text-sm leading-relaxed ${
                          isNight ? "text-white/55" : "text-gray-600"
                        }`}
                      >
                        {workDescription.trim() || "캡션을 작성하면 피드 카드에서 보이는 문장 흐름을 바로 확인할 수 있어요."}
                      </p>
                    </div>

                    {workTagList.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {workTagList.map((tag) => (
                          <span
                            key={tag}
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                              isNight
                                ? "bg-[#00C9A7]/15 text-[#7EE8D4]"
                                : "bg-[#F2FFFC] text-[#007E68]"
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {(figmaUrl.trim() || adobeUrl.trim()) && (
                      <div
                        className={`flex flex-wrap gap-2 border-t pt-3 ${
                          isNight ? "border-white/10" : "border-gray-100"
                        }`}
                      >
                        {figmaUrl.trim() && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${
                              isNight
                                ? "bg-[#00C9A7]/12 text-[#7EE8D4]"
                                : "bg-[#F5FFFB] text-[#007E68]"
                            }`}
                          >
                            <Figma className="size-3.5" />
                            Figma
                          </span>
                        )}
                        {adobeUrl.trim() && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${
                              isNight
                                ? "bg-[#3d2520]/80 text-[#FFB9AA]"
                                : "bg-[#FFF7F4] text-[#B13A21]"
                            }`}
                          >
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
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      <AnimatePresence>
      {isProfileOnboardingOpen && apiProfile?.owner && !isProfileEditorOpen && !isWorkComposerOpen && (
        <motion.div
          key="profile-onboarding-overlay"
          role="presentation"
          className="fixed inset-0 z-[115] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={dismissProfileOnboarding}
        >
          <motion.div
            className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-6 shadow-2xl ring-1 ${
              isNight ? "bg-[#141d30] ring-white/10" : "bg-white ring-black/[0.06]"
            }`}
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={modalSpring}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p
                  className={`mb-2 inline-flex items-center gap-2 rounded-lg px-3 py-1 text-xs font-bold ${
                    isNight ? "bg-[#00C9A7]/15 text-[#7EE8D4]" : "bg-[#DDF8EC] text-[#007E68]"
                  }`}
                >
                  <Sparkles className="size-4" />
                  프로필 시작하기
                </p>
                <h2 className={`text-2xl font-bold ${isNight ? "text-white" : "text-[#0F0F0F]"}`}>
                  프로필을 채워볼까요?
                </h2>
                <p className={`mt-2 text-sm leading-relaxed ${isNight ? "text-white/55" : "text-gray-600"}`}>
                  처음 방문한 사람도 바로 이해할 수 있게 필요한 정보만 먼저 고르면 됩니다.
                </p>
              </div>
              <button
                type="button"
                onClick={dismissProfileOnboarding}
                className={`rounded-lg p-2 transition-colors ${
                  isNight
                    ? "text-white/45 hover:bg-white/10 hover:text-white/80"
                    : "text-gray-500 hover:bg-gray-100 hover:text-black"
                }`}
                aria-label="프로필 시작 안내 닫기"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mb-5 grid gap-2">
              {profileSetupChecklist.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                    isNight
                      ? "border-white/10 bg-[#0e1524]"
                      : "border-gray-200 bg-[#F7F7F5]"
                  }`}
                >
                  <span className={`text-sm font-semibold ${isNight ? "text-white/85" : "text-gray-700"}`}>
                    {item.label}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${
                      item.done
                        ? isNight
                          ? "bg-[#00C9A7]/15 text-[#7EE8D4]"
                          : "bg-[#DDF8EC] text-[#007E68]"
                        : isNight
                          ? "bg-[#1a2436] text-white/45"
                          : "bg-white text-gray-500"
                    }`}
                  >
                    <CheckCircle className="size-3.5" />
                    {item.done ? "완료" : "필요"}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleStartProfileSetup}
                className={`rounded-lg border p-4 text-left transition-all hover:shadow-md ${
                  isNight
                    ? "border-[#00C9A7]/30 bg-[#00C9A7]/10 hover:border-[#00C9A7]/50"
                    : "border-[#BDEFD8] bg-[#F5FFFB] hover:border-[#00C9A7]"
                }`}
              >
                <div className="mb-3 inline-flex rounded-lg bg-[#00C9A7] p-2 text-[#0F0F0F]">
                  <Pencil className="size-5" />
                </div>
                <div className={`font-semibold ${isNight ? "text-white" : "text-[#0F0F0F]"}`}>
                  프로필 정보 채우기
                </div>
                <p className={`mt-1 text-sm ${isNight ? "text-white/50" : "text-gray-600"}`}>
                  이름, 닉네임, URL과 디자이너 정보를 정리합니다.
                </p>
              </button>

              {apiProfile.role === "DESIGNER" && (
                <button
                  type="button"
                  onClick={handleStartFirstWorkUpload}
                  className={`rounded-lg border p-4 text-left transition-all hover:shadow-md ${
                    isNight
                      ? "border-[#FF8A70]/35 bg-[#3d2520]/80 hover:border-[#FF5C3A]/50"
                      : "border-[#FFB9AA] bg-[#FFF7F4] hover:border-[#FF5C3A]"
                  }`}
                >
                  <div className="mb-3 inline-flex rounded-lg bg-[#FF5C3A] p-2 text-white">
                    <Upload className="size-5" />
                  </div>
                  <div className={`font-semibold ${isNight ? "text-white" : "text-[#0F0F0F]"}`}>
                    첫 작업물 올리기
                  </div>
                  <p className={`mt-1 text-sm ${isNight ? "text-white/50" : "text-gray-600"}`}>
                    대표 작업물을 하나 올려 프로필을 바로 보여줍니다.
                  </p>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={dismissProfileOnboarding}
              className={`mt-4 h-10 w-full rounded-lg border text-sm font-bold transition-colors ${
                isNight
                  ? "border-white/10 text-white/60 hover:bg-white/5"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              나중에 할게요
            </button>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      <AnimatePresence>
      {isProfileEditorOpen && (
        <motion.div
          key="profile-editor-overlay"
          role="presentation"
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0F0F0F]/65 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={() => setIsProfileEditorOpen(false)}
        >
          <motion.div
            className={`max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl shadow-2xl ring-1 ${
              isNight ? "bg-[#141d30] ring-white/10" : "bg-white ring-black/[0.06]"
            }`}
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={modalSpring}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="h-1.5 bg-[linear-gradient(90deg,#00C9A7,#FF5C3A)]" />

            <div
              className={`mb-0 flex items-start justify-between gap-4 border-b px-6 py-5 ${
                isNight ? "border-white/10 bg-[#1a2436]" : "border-gray-100 bg-[#F7F7F5]"
              }`}
            >
              <div>
                <p className="text-sm font-bold text-[#00A88C]">내 프로필 설정</p>
                <h2 className={`mt-1 text-2xl font-bold ${isNight ? "text-white" : "text-[#0F0F0F]"}`}>
                  프로필 수정
                </h2>
                <p className={`mt-2 text-sm ${isNight ? "text-white/55" : "text-gray-600"}`}>
                  방문자가 바로 이해할 수 있게 핵심 정보만 정리합니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileEditorOpen(false)}
                className={`rounded-lg p-2 shadow-sm transition-colors ${
                  isNight
                    ? "bg-white/5 text-white/45 hover:bg-white/10 hover:text-white/80"
                    : "bg-white text-gray-500 hover:bg-gray-100 hover:text-black"
                }`}
              >
                <X className="size-5" />
              </button>
            </div>

            {profileEditError && (
              <div
                className={`mx-6 mt-5 rounded-lg border px-4 py-3 text-sm font-semibold ${
                  isNight
                    ? "border-[#FF8A70]/35 bg-[#3d2520]/90 text-[#FFB9AA]"
                    : "border-[#FFB9AA] bg-[#FFF7F4] text-[#B13A21]"
                }`}
              >
                {profileEditError}
              </div>
            )}

            <div className={`grid gap-5 p-6 ${isNight ? "bg-[#0f1828]" : "bg-white"}`}>
              <div
                className={`flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center ${
                  isNight ? "border-white/10 bg-[#1a2436]" : "border-gray-200 bg-[#F7F7F5]"
                }`}
              >
                <ImageWithFallback
                  src={profileImagePreview || apiProfile?.profileImage || displayProfile.avatar}
                  alt="프로필 이미지 미리보기"
                  className="size-24 rounded-full border-4 border-white object-cover shadow-sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold text-[#0F0F0F]">프로필 이미지</p>
                  <p className="mt-1 text-xs text-gray-500">JPG, PNG, WebP, GIF 파일을 업로드할 수 있습니다.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => profileImageInputRef.current?.click()}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#BDEFD8] bg-white px-3 text-xs font-bold text-[#007E68] transition-colors hover:bg-[#F5FFFB]"
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
                    accept={SUPPORTED_IMAGE_ACCEPT}
                    onChange={handleProfileImageChange}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="grid gap-2 rounded-lg border border-[#BDEFD8] bg-[#F5FFFB] p-4">
                {profileEditorSteps.map((step, index) => (
                  <div key={step.label} className="flex items-center gap-3">
                    <span
                      className={`grid size-7 place-items-center rounded-lg text-xs font-bold ${
                        step.done
                          ? "bg-[#00C9A7] text-[#0F0F0F]"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className={`text-sm font-semibold ${step.done ? "text-gray-800" : "text-gray-400"}`}>
                      {step.label}
                    </span>
                  </div>
                ))}
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

              {showProfileNicknameStep && (
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-gray-700">닉네임</span>
                  <div className="flex gap-2">
                    <input
                      value={editNickname}
                      onChange={(event) => handleEditNicknameChange(event.target.value)}
                      maxLength={10}
                      className="h-11 min-w-0 flex-1 rounded-lg border border-gray-200 px-3 text-sm outline-none transition-colors focus:border-[#00C9A7] focus:ring-2 focus:ring-[#BDEFD8]"
                      placeholder="프로필에 보일 닉네임"
                    />
                    <button
                      type="button"
                      onClick={handleCheckProfileNickname}
                      disabled={isCheckingProfileNickname || !hasEditNickname}
                      className="h-11 rounded-lg border border-[#BDEFD8] bg-white px-4 text-sm font-bold text-[#007E68] transition-colors hover:bg-[#F5FFFB] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isCheckingProfileNickname ? "확인 중" : "중복확인"}
                    </button>
                  </div>
                  {profileNicknameCheckMessage && (
                    <p className="text-xs font-semibold text-[#007E68]">{profileNicknameCheckMessage}</p>
                  )}
                  {isProfileNicknameChanged && !isProfileNicknameChecked && (
                    <p className="text-xs font-semibold text-[#B13A21]">
                      닉네임을 변경하려면 중복확인이 필요합니다.
                    </p>
                  )}
                </label>
              )}

              {showProfileOptionalStep && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-gray-700">지역</span>
                    <input
                      value={editLocation}
                      onChange={(event) => setEditLocation(event.target.value)}
                      maxLength={100}
                      className="h-11 rounded-lg border border-gray-200 px-3 text-sm outline-none transition-colors focus:border-[#00C9A7] focus:ring-2 focus:ring-[#BDEFD8]"
                      placeholder="서울, 대한민국"
                    />
                    <p className="text-xs text-gray-500">프로필 상단 지역에 표시됩니다.</p>
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
                    <p className="text-xs text-gray-500">포트폴리오나 SNS 링크가 있으면 입력해주세요.</p>
                  </label>
                </div>
              )}

              {showDesignerDetailStep && (
                <div className="mt-1 grid gap-4 rounded-lg border border-[#BDEFD8] bg-[#F5FFFB] p-4">
                  <div>
                    <p className="text-sm font-bold text-[#0F0F0F]">디자이너 정보</p>
                    <p className="mt-1 text-xs text-gray-500">프로필 상단에 보일 직업과 소개를 저장해요.</p>
                  </div>

                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-gray-700">직업</span>
                    <select
                      value={editJob}
                      onChange={(event) => setEditJob(event.target.value)}
                      className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold outline-none transition-colors focus:border-[#00C9A7] focus:ring-2 focus:ring-[#BDEFD8]"
                    >
                      <option value="">직업을 선택해주세요</option>
                      {designerJobSelectOptions.map((job) => (
                        <option key={job} value={job}>
                          {job}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500">프로필에 보일 직업명 기준으로 선택합니다.</p>
                  </label>

                  {!showDesignerFollowUpStep && (
                    <p className="rounded-lg border border-dashed border-[#BDEFD8] bg-white px-4 py-3 text-sm font-semibold text-[#007E68]">
                      직업을 선택하면 소개와 작업 가능 상태를 이어서 입력할 수 있어요.
                    </p>
                  )}

                  {showDesignerFollowUpStep && (
                    <>
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
                      <div className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4">
                        <div>
                          <p className="text-sm font-bold text-[#0F0F0F]">작업 도구 링크</p>
                          <p className="mt-1 text-xs text-gray-500">
                            Figma, Photoshop, Adobe 작업물이나 프로필 링크가 있으면 추가해보세요.
                          </p>
                        </div>
                        <label className="grid gap-2">
                          <span className="text-sm font-bold text-gray-700">Figma 링크</span>
                          <input
                            value={editFigmaUrl}
                            onChange={(event) => setEditFigmaUrl(event.target.value)}
                            maxLength={255}
                            className="h-11 rounded-lg border border-gray-200 px-3 text-sm outline-none transition-colors focus:border-[#00C9A7] focus:ring-2 focus:ring-[#BDEFD8]"
                            placeholder="https://figma.com/@username"
                          />
                        </label>
                        <label className="grid gap-2">
                          <span className="text-sm font-bold text-gray-700">Photoshop 링크</span>
                          <input
                            value={editPhotoshopUrl}
                            onChange={(event) => setEditPhotoshopUrl(event.target.value)}
                            maxLength={255}
                            className="h-11 rounded-lg border border-gray-200 px-3 text-sm outline-none transition-colors focus:border-[#00C9A7] focus:ring-2 focus:ring-[#BDEFD8]"
                            placeholder="https://behance.net/username"
                          />
                        </label>
                        <label className="grid gap-2">
                          <span className="text-sm font-bold text-gray-700">Adobe 링크</span>
                          <input
                            value={editAdobeUrl}
                            onChange={(event) => setEditAdobeUrl(event.target.value)}
                            maxLength={255}
                            className="h-11 rounded-lg border border-gray-200 px-3 text-sm outline-none transition-colors focus:border-[#00C9A7] focus:ring-2 focus:ring-[#BDEFD8]"
                            placeholder="https://adobe.com/..."
                          />
                        </label>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 mt-0 flex justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
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
                disabled={isSavingProfile || !canSaveProfileEdit}
                className="h-11 rounded-lg bg-[#00C9A7] px-5 text-sm font-bold text-[#0F0F0F] transition-colors hover:bg-[#00A88C] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingProfile ? "저장 중..." : "저장하기"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      <AnimatePresence>
      {editingFeed && (
        <motion.div
          key="feed-editor-overlay"
          role="presentation"
          className="fixed inset-0 z-[125] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={closeFeedEditor}
        >
          <motion.div
            className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-6 shadow-2xl ${
              isNight
                ? "bg-[#141d30] ring-1 ring-white/10"
                : "bg-white ring-1 ring-black/[0.06]"
            }`}
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={modalSpring}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className={`text-sm font-bold ${isNight ? "text-[#7EE8D4]" : "text-[#00A88C]"}`}>작업물</p>
                <h2 className={`mt-1 text-2xl font-bold ${isNight ? "text-white" : "text-[#0F0F0F]"}`}>피드 수정</h2>
              </div>
              <button
                type="button"
                onClick={closeFeedEditor}
                className={`rounded-lg p-2 transition-colors ${
                  isNight
                    ? "text-white/45 hover:bg-white/10 hover:text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-black"
                }`}
              >
                <X className="size-5" />
              </button>
            </div>

            {feedEditError && (
              <div
                className={`mb-4 rounded-lg border px-4 py-3 text-sm font-semibold ${
                  isNight
                    ? "border-[#FF5C3A]/30 bg-[#FF5C3A]/10 text-[#FFB199]"
                    : "border-[#FFB9AA] bg-[#FFF7F4] text-[#B13A21]"
                }`}
              >
                {feedEditError}
              </div>
            )}

            <div className="grid gap-4">
              <div
                className={`rounded-lg border p-4 ${
                  isNight ? "border-white/10 bg-[#0e1524]" : "border-gray-200 bg-[#FAFBF8]"
                }`}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className={`text-sm font-bold ${isNight ? "text-white" : "text-gray-800"}`}>사진 수정</p>
                    <p className={`mt-1 text-xs ${isNight ? "text-white/45" : "text-gray-500"}`}>
                      기존 사진은 유지하거나 삭제할 수 있고, 사진은 최대 {MAX_FEED_IMAGES}장까지 추가할 수 있습니다.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => editFeedImageInputRef.current?.click()}
                    disabled={!canAddEditFeedImages}
                    className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      isNight
                        ? "border-white/15 bg-[#1a1f2e] text-white/80 hover:border-[#00C9A7]/50 hover:text-[#7EE8D4]"
                        : "border-gray-200 bg-white text-gray-700 hover:border-[#00C9A7] hover:text-[#007E68]"
                    }`}
                  >
                    <ImagePlus className="size-4" />
                    사진 추가
                  </button>
                </div>

                <input
                  ref={editFeedImageInputRef}
                  type="file"
                  accept={SUPPORTED_IMAGE_ACCEPT}
                  multiple
                  onChange={handleEditFeedImageChange}
                  className="hidden"
                />

                {editFeedPreviewImages.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {editFeedPreviewImages.map((image, imageIndex) => (
                      <div
                        key={image.key}
                        className={`group relative aspect-square overflow-hidden rounded-lg ${
                          isNight ? "bg-[#1a2035]" : "bg-gray-100"
                        }`}
                      >
                        <ImageWithFallback
                          src={image.src}
                          alt={`피드 이미지 ${imageIndex + 1}`}
                          className="h-full w-full object-cover"
                        />
                        {imageIndex === 0 && (
                          <span className="absolute left-2 top-2 rounded-lg bg-[#FF5C3A] px-2 py-1 text-[11px] font-bold text-white shadow-sm">
                            대표
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            image.source === "existing"
                              ? handleRemoveEditFeedExistingImage(image.index)
                              : handleRemoveEditFeedNewImage(image.index)
                          }
                          className="absolute right-2 top-2 rounded-lg bg-black/60 p-1.5 text-white opacity-100 transition-colors hover:bg-black/80 sm:opacity-0 sm:group-hover:opacity-100"
                          aria-label="피드 이미지 삭제"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => editFeedImageInputRef.current?.click()}
                    className={`flex min-h-32 w-full flex-col items-center justify-center rounded-lg border border-dashed text-sm font-semibold transition-colors ${
                      isNight
                        ? "border-white/15 bg-[#1a1f2e] text-white/45 hover:border-[#00C9A7]/45 hover:text-[#7EE8D4]"
                        : "border-gray-300 bg-white text-gray-500 hover:border-[#00C9A7] hover:text-[#007E68]"
                    }`}
                  >
                    <ImagePlus className="mb-2 size-8" />
                    사진을 추가해주세요
                  </button>
                )}
              </div>

              <label className="grid gap-2">
                <span className={`text-sm font-bold ${isNight ? "text-white/85" : "text-gray-700"}`}>제목</span>
                <input
                  value={editFeedTitle}
                  onChange={(event) => setEditFeedTitle(event.target.value)}
                  maxLength={100}
                  className={`h-11 rounded-lg border px-3 text-sm outline-none transition-colors focus:border-[#00C9A7] focus:ring-2 ${
                    isNight
                      ? "border-white/15 bg-[#0e1524] text-white placeholder:text-white/35 focus:ring-[#00C9A7]/25"
                      : "border-gray-200 focus:ring-[#BDEFD8]"
                  }`}
                />
              </label>

              <label className="grid gap-2">
                <span className={`text-sm font-bold ${isNight ? "text-white/85" : "text-gray-700"}`}>설명</span>
                <textarea
                  value={editFeedDescription}
                  onChange={(event) => setEditFeedDescription(event.target.value)}
                  rows={4}
                  className={`resize-none rounded-lg border px-3 py-3 text-sm outline-none transition-colors focus:border-[#00C9A7] focus:ring-2 ${
                    isNight
                      ? "border-white/15 bg-[#0e1524] text-white placeholder:text-white/35 focus:ring-[#00C9A7]/25"
                      : "border-gray-200 focus:ring-[#BDEFD8]"
                  }`}
                />
              </label>

              <label className="grid gap-2">
                <span className={`text-sm font-bold ${isNight ? "text-white/85" : "text-gray-700"}`}>카테고리</span>
                <select
                  value={editFeedCategory}
                  onChange={(event) => setEditFeedCategory(event.target.value)}
                  style={isNight ? { colorScheme: "dark" } : undefined}
                  className={`h-11 rounded-lg border px-3 text-sm outline-none transition-colors focus:border-[#00C9A7] focus:ring-2 ${
                    isNight
                      ? "border-white/15 bg-[#0e1524] text-white focus:ring-[#00C9A7]/25"
                      : "border-gray-200 bg-white focus:ring-[#BDEFD8]"
                  }`}
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
                <span className={`text-sm font-bold ${isNight ? "text-white/85" : "text-gray-700"}`}>포트폴리오 URL</span>
                <div className="grid gap-3">
                  <input
                    value={editFeedFigmaUrl}
                    onChange={(event) => setEditFeedFigmaUrl(event.target.value)}
                    maxLength={200}
                    className={`h-11 rounded-lg border px-3 text-sm outline-none transition-colors focus:border-[#00C9A7] focus:ring-2 ${
                      isNight
                        ? "border-white/15 bg-[#0e1524] text-white placeholder:text-white/35 focus:ring-[#00C9A7]/25"
                        : "border-gray-200 focus:ring-[#BDEFD8]"
                    }`}
                    placeholder="Figma 링크 https://www.figma.com/..."
                  />
                  <input
                    value={editFeedAdobeUrl}
                    onChange={(event) => setEditFeedAdobeUrl(event.target.value)}
                    maxLength={200}
                    className={`h-11 rounded-lg border px-3 text-sm outline-none transition-colors focus:border-[#00C9A7] focus:ring-2 ${
                      isNight
                        ? "border-white/15 bg-[#0e1524] text-white placeholder:text-white/35 focus:ring-[#00C9A7]/25"
                        : "border-gray-200 focus:ring-[#BDEFD8]"
                    }`}
                    placeholder="Photoshop/Adobe 링크 https://portfolio.example.com/adobe"
                  />
                </div>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeFeedEditor}
                className={`h-11 rounded-lg border px-5 text-sm font-bold transition-colors ${
                  isNight
                    ? "border-white/15 text-white/70 hover:bg-white/10"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
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
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      <AnimatePresence>
      {isFeedSuccessOpen && (
        <motion.div
          key="feed-success-overlay"
          role="presentation"
          className="fixed inset-0 z-[130] flex items-center justify-center bg-[#0F0F0F]/65 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={() => setIsFeedSuccessOpen(false)}
        >
          <motion.div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/[0.06]"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={modalSpring}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="h-1.5 bg-[linear-gradient(90deg,#00C9A7,#FF5C3A)]" />
            <div className="p-7 text-center">
              <div className="mx-auto mb-5 grid size-16 place-items-center rounded-lg bg-[#DDF8EC] text-[#007E68]">
                <CheckCircle className="size-9" />
              </div>
              <p className="text-sm font-bold text-[#00A88C]">피드 등록 완료</p>
              <h2 className="mt-2 text-2xl font-bold text-[#0F0F0F]">
                아름다운 작품이 등록됐어요.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                {createdFeedTitle ? `「${createdFeedTitle}」 작업이 피드에 올라갔습니다.` : "작업이 피드에 올라갔습니다."}
                {" "}방금 만든 작품을 프로필 피드에서 바로 확인할 수 있어요.
              </p>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setIsFeedSuccessOpen(false)}
                  className="h-11 rounded-lg border border-gray-200 px-4 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50"
                >
                  닫기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsFeedSuccessOpen(false);
                    handleProfileTabChange("feed");
                  }}
                  className="h-11 rounded-lg bg-[#00C9A7] px-4 text-sm font-bold text-[#0F0F0F] transition-colors hover:bg-[#00A88C]"
                >
                  피드 보기
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      <AnimatePresence>
      {isDeleteModalOpen && (
        <motion.div
          key="feed-delete-overlay"
          role="presentation"
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={() => setIsDeleteModalOpen(false)}
        >
          <motion.div
            className={`w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl ${
              isNight ? "bg-[#141d30] ring-1 ring-white/10" : "bg-white ring-1 ring-black/[0.06]"
            }`}
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={modalSpring}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <div
                className={`mx-auto mb-4 flex size-14 items-center justify-center rounded-full ${
                  isNight ? "bg-[#FF5C3A]/15 text-[#FFB199]" : "bg-[#FFF1ED] text-[#FF5C3A]"
                }`}
              >
                <AlertTriangle className="size-8" />
              </div>
              <h3 className={`text-xl font-bold ${isNight ? "text-white" : "text-gray-900"}`}>정말 삭제하시겠습니까?</h3>
              <p className={`mt-2 text-sm ${isNight ? "text-white/55" : "text-gray-500"}`}>
                삭제된 작업물은 복구할 수 없습니다.<br />
                신중하게 결정해 주세요.
              </p>
              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className={`flex-1 rounded-xl border py-3 text-sm font-bold transition-all ${
                    isNight
                      ? "border-white/15 bg-transparent text-white/75 hover:bg-white/10"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={(e) => confirmDeleteFeed(e)}
                  className="flex-1 rounded-xl bg-[#FF5C3A] py-3 text-sm font-bold text-white transition-all hover:bg-[#E54D2E] shadow-[0_8px_20px_rgba(255,92,58,0.25)]"
                >
                  삭제하기
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {selectedProfileFeed && (
        <FeedDetailModal
          isNight={isNight}
          selectedFeed={selectedProfileFeed}
          activeModalImage={
            (selectedProfileFeed.images ?? [selectedProfileFeed.image])[profileFeedModalImageIndex] ??
            selectedProfileFeed.image
          }
          selectedFeedImages={selectedProfileFeed.images ?? [selectedProfileFeed.image]}
          modalImageIndex={profileFeedModalImageIndex}
          savedItemIds={savedProfileFeedIds}
          selectedFeedComments={selectedFeedComments}
          isFeedDetailLoading={isProfileFeedDetailLoading}
          feedDetailError={profileFeedDetailError}
          commentSubmitError={commentSubmitError}
          commentLoadError={commentLoadError}
          isCommentsLoading={isCommentsLoading}
          editingCommentId={editingCommentId}
          editingCommentText={editingCommentText}
          isUpdatingComment={isUpdatingComment}
          isDeletingCommentId={isDeletingCommentId}
          commentText={commentText}
          isSubmittingComment={isSubmittingComment}
          currentUserAvatar={profileFeedUserAvatar}
          currentUserName={profileFeedUserName}
          commentInputRef={profileFeedCommentInputRef}
          formatFeedDateTime={formatProfileFeedDateTime}
          isFeedLiked={(item) => Boolean(item.likedByMe)}
          getLikeCount={(item) => item.likes}
          getCommentCount={(item) => item.comments}
          onClose={() => {
            setSelectedProfileFeed(null);
            setProfileFeedModalImageIndex(0);
          }}
          onMoveModalCarousel={moveProfileFeedModalCarousel}
          onSetModalImageIndex={(index, e) => {
            e.stopPropagation();
            setProfileFeedModalImageIndex(index);
          }}
          onToggleLike={toggleProfileFeedLike}
          onOpenCollectionModal={(_, e) => openCollectionModal(selectedProfileFeed, e)}
          onShare={(_, e) => handleProfileFeedShare(selectedProfileFeed, e)}
          onProposalClick={(_, e) => handleProfileFeedProposal(selectedProfileFeed, e)}
          onStartEditingComment={startEditingComment}
          onEditingCommentTextChange={setEditingCommentText}
          onUpdateComment={handleUpdateComment}
          onCancelEditingComment={cancelEditingComment}
          onDeleteComment={handleDeleteComment}
          onCommentTextChange={setProfileFeedCommentText}
          onCommentKeyDown={handleCommentKeyDown}
          onSubmitComment={handleSubmitComment}
        />
      )}

      {collectionModalFeed && (
        <CollectionSaveModal
          feed={collectionModalFeed}
          collections={collections}
          collectionPostIdsByFolder={collectionPostIdsByFolder}
          isCollectionSaving={isCollectionSaving}
          newCollectionName={newCollectionName}
          collectionSavedNotice={collectionSavedNotice}
          onClose={closeCollectionModal}
          onNewCollectionNameChange={setNewCollectionName}
          onSaveToCollection={saveToCollection}
          onCreateCollectionAndSave={createCollectionAndSave}
        />
      )}

      <AnimatePresence>
        {selectedCollection && (
          <motion.div
            key="profile-collection-detail"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-collection-detail-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
            onClick={() => setSelectedCollection(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={`flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl shadow-2xl ${
                isNight ? "bg-[#0f1828]" : "bg-white"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`flex shrink-0 flex-wrap items-start justify-between gap-3 border-b px-5 py-4 sm:px-6 sm:py-5 ${
                  isNight ? "border-white/10" : "border-gray-100"
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#00A88C]">컬렉션 상세</p>
                  <h2
                    id="profile-collection-detail-title"
                    className={`mt-1 truncate text-xl font-bold sm:text-2xl ${
                      isNight ? "text-white" : "text-[#0F0F0F]"
                    }`}
                  >
                    {selectedCollection.folderName}
                  </h2>
                  <p className={`mt-2 text-sm ${isNight ? "text-white/45" : "text-gray-500"}`}>
                    저장된 피드 {selectedCollection.feeds.length}개
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {canEditProfile && (
                    <Link
                      to="/collections"
                      className={`inline-flex items-center rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                        isNight
                          ? "border-white/10 text-[#00C9A7] hover:bg-white/5"
                          : "border-gray-200 text-[#007E68] hover:border-[#00C9A7] hover:bg-[#F3FCF8]"
                      }`}
                      onClick={() => setSelectedCollection(null)}
                    >
                      컬렉션에서 편집
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedCollection(null)}
                    className={`rounded-full border p-2 transition-colors ${
                      isNight
                        ? "border-white/10 text-white/40 hover:bg-white/10 hover:text-white/70"
                        : "border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-700"
                    }`}
                    aria-label="닫기"
                  >
                    <X className="size-5" />
                  </button>
                </div>
              </div>

              <div
                className={`min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6 ${
                  isNight ? "bg-[#0C1222]" : "bg-[#FAFAF8]/50"
                }`}
              >
                {selectedCollection.feeds.length === 0 ? (
                  <div
                    className={`rounded-2xl border-2 border-dashed px-6 py-16 text-center ${
                      isNight ? "border-white/10 bg-[#0C1222]" : "border-[#D8D6CF] bg-[#F7F7F5]"
                    }`}
                  >
                    <Grid3X3
                      className={`mx-auto mb-3 size-10 ${isNight ? "text-white/15" : "text-[#8B8A84]"}`}
                      aria-hidden
                    />
                    <p className={`text-sm font-medium ${isNight ? "text-white/55" : "text-[#5F5E5A]"}`}>
                      아직 저장된 피드가 없어요.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {selectedCollection.feeds.map((feed) => (
                      <article
                        key={feed.postId}
                        className={`overflow-hidden rounded-2xl border ${
                          isNight ? "border-white/10 bg-[#141d30]" : "border-gray-200/90 bg-white"
                        }`}
                      >
                        {feed.thumbnailImageUrl ? (
                          <ImageWithFallback
                            src={feed.thumbnailImageUrl}
                            alt={feed.title}
                            className="h-48 w-full object-cover sm:h-56"
                          />
                        ) : (
                          <div
                            className={`flex h-48 items-center justify-center sm:h-56 ${
                              isNight ? "bg-white/5" : "bg-[#EEECE8]"
                            }`}
                          >
                            <ImagePlus className={`size-10 ${isNight ? "text-white/20" : "text-gray-300"}`} aria-hidden />
                          </div>
                        )}
                        <div className="p-4">
                          <p className="text-xs font-semibold text-[#00A88C]">{feed.category || "미분류"}</p>
                          <h3
                            className={`mt-2 line-clamp-2 text-base font-bold leading-snug ${
                              isNight ? "text-white" : "text-[#0F0F0F]"
                            }`}
                          >
                            {feed.title}
                          </h3>
                          {feed.description ? (
                            <p
                              className={`mt-2 line-clamp-2 text-sm leading-relaxed ${
                                isNight ? "text-white/50" : "text-[#5F5E5A]"
                              }`}
                            >
                              {feed.description}
                            </p>
                          ) : null}
                          <div className={`mt-3 flex items-center gap-3 ${isNight ? "text-white/35" : "text-gray-500"}`}>
                            <span className="text-xs">좋아요 {feed.pickCount ?? 0}</span>
                            <span className="text-xs">댓글 {feed.commentCount}</span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
