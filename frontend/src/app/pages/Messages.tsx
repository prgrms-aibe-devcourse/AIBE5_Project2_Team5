import Navigation from "../components/Navigation";
import { toast } from "sonner";
import { Edit, Search, Info, Send, Image, Smile, AtSign, Sparkles, Calendar, FileText, CheckCircle, Circle, ChevronDown, ChevronUp, ThumbsUp, XCircle, Paperclip, Figma, ExternalLink, Plus, Clock, Check, CheckCheck, Trash2, GripVertical, Eye, ArrowLeft, Bookmark, RefreshCw, AlertTriangle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useNavigate, useSearchParams } from "react-router";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import {
  getUnreadMessageConversationIds,
  markConversationRead,
} from "../utils/notificationState";
import {
  deleteMessageConversationApi,
  getConversationAssistantSuggestionsApi,
  getConversationProcessesApi,
  getConversationPresenceApi,
  getConversationMessagesApi,
  getMessageConversationsApi,
  markConversationReadApi,
  saveConversationProcessesApi,
  sendConversationMessageApi,
  toggleMessageReactionApi,
  updateConversationTypingApi,
  type ChatMessageResponse as ApiChatMessageResponse,
  type MessageAssistantGoal,
  type MessageConversationResponse as ApiMessageConversationResponse,
  type MessageProcessResponse as ApiMessageProcessResponse,
} from "../api/messageApi";
import {
  uploadMessageAttachmentsApi,
} from "../api/uploadApi";
import {
  createMessageSocket,
  type IncomingMessageSocketEvent,
  type MessagePresenceState,
} from "../api/messageSocket";
import { getCurrentUser } from "../utils/auth";
import { DEFAULT_AVATAR } from "../utils/avatar";
import { useNightMode } from "../contexts/NightModeContext";

type AttachmentUploadStatus = "uploading" | "ready" | "failed";
type IntegrationProvider = "figma" | "adobe" | "photoshop" | "pinterest";

type MessageAttachmentBase = {
  id: string;
  name: string;
  uploadStatus?: AttachmentUploadStatus;
  uploadedUrl?: string;
};

type MessageAttachment =
  | (MessageAttachmentBase & {
      type: "image";
      src: string;
      size?: number;
      mimeType?: string;
    })
  | (MessageAttachmentBase & {
      type: "icon";
      value: string;
    })
  | (MessageAttachmentBase & {
      type: "file";
      size: number;
      mimeType: string;
      url?: string;
    })
  | (MessageAttachmentBase & {
      type: "integration";
      provider: IntegrationProvider;
      url: string;
      previewTitle?: string;
      previewDescription?: string;
      host?: string;
    });

type ImageAttachment = Extract<MessageAttachment, { type: "image" }>;
type FileAttachment = Extract<MessageAttachment, { type: "file" }>;
type IntegrationAttachment = Extract<MessageAttachment, { type: "integration" }>;

type MessageDeliveryStatus = "sending" | "sent" | "read" | "failed";

type MessageReaction = {
  emoji: string;
  count: number;
  reactedByMe?: boolean;
};

type ChatMessage = {
  id: string;
  clientId: string;
  serverId?: string;
  conversationId: number;
  senderId: string;
  sender: string;
  message: string;
  time: string;
  createdAt: string;
  isSelf: boolean;
  status: MessageDeliveryStatus;
  highlighted?: boolean;
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
};

type ProcessStatus = "completed" | "in-progress" | "pending";

type ProcessTask = {
  id: number;
  text: string;
  completed: boolean;
};

type ProcessConfirmations = {
  designer: boolean;
  client: boolean;
};

type ProjectProcess = {
  id: number;
  title: string;
  status: ProcessStatus;
  tasks: ProcessTask[];
  confirmations: ProcessConfirmations;
};

type ProcessToast = {
  id: number;
  message: string;
};

type AssistantActionItem = {
  goal: MessageAssistantGoal;
  label: string;
};

const CURRENT_USER_ID = "me";
const PROCESS_STORAGE_KEY = "pickxel:message-processes:v2";
const PROCESS_CREATED_STORAGE_KEY = "pickxel:message-processes-created:v2";
const MESSAGE_DRAFTS_STORAGE_KEY = "pickxel:message-drafts";
const LEFT_CONVERSATIONS_STORAGE_KEY = "pickxel:left-message-conversations";
const CONNECTED_CONVERSATION_POLL_INTERVAL = 5000;
const CONNECTED_PRESENCE_POLL_INTERVAL = 5000;
const CONNECTED_PROCESS_POLL_INTERVAL = 3000;
const RECOVERY_POLL_GRACE_PERIOD = 8000;
const RECOVERY_MESSAGE_POLL_INTERVAL = 1000;
const RECOVERY_STATE_POLL_INTERVAL = 2000;
const TYPING_IDLE_DELAY = 1200;
const TYPING_SYNC_INTERVAL = 800;
const MAX_CHAT_MESSAGE_LENGTH = 4000;
const MAX_ASSISTANT_SUGGESTION_LENGTH = 320;
const DEBUG_MESSAGE_TYPING = import.meta.env.DEV;
const assistantActionItems: AssistantActionItem[] = [
  { goal: "reply", label: "답장 추천" },
  { goal: "next_step", label: "다음 단계 안내" },
  { goal: "schedule_meeting", label: "미팅 일정 잡기" },
  { goal: "share_document", label: "문서 전달 안내" },
];
const assistantLoadingPreviewItems = [
  { primaryWidth: "88%", secondaryWidth: "54%" },
  { primaryWidth: "80%", secondaryWidth: "62%" },
  { primaryWidth: "92%", secondaryWidth: "48%" },
];

const debugMessageTyping = (...args: unknown[]) => {
  if (DEBUG_MESSAGE_TYPING) {
    console.debug("[MessagesTyping]", ...args);
  }
};

const createClientId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const wait = (delayMs: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, delayMs);
  });

const normalizeAssistantSuggestionText = (suggestion: string) => {
  const normalized = suggestion
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^"(.*)"$/, "$1")
    .trim();

  return normalized.length > MAX_ASSISTANT_SUGGESTION_LENGTH
    ? normalized.slice(0, MAX_ASSISTANT_SUGGESTION_LENGTH).trim()
    : normalized;
};

const formatFileSize = (size: number) => {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))}KB`;
  return `${(size / 1024 / 1024).toFixed(1)}MB`;
};

const isImageAttachment = (
  attachment: MessageAttachment
): attachment is ImageAttachment => attachment.type === "image";

const isFileAttachment = (
  attachment: MessageAttachment
): attachment is FileAttachment => attachment.type === "file";

const isIntegrationAttachment = (
  attachment: MessageAttachment
): attachment is IntegrationAttachment => attachment.type === "integration";

const getFileExtension = (fileName: string) => {
  const extension = fileName.split(".").pop()?.trim().toUpperCase();
  return extension && extension !== fileName.toUpperCase() ? extension : "FILE";
};

const getFileAttachmentMeta = (attachment: FileAttachment, dark = false) => {
  const extension = getFileExtension(attachment.name);

  if (attachment.mimeType.includes("pdf") || extension === "PDF") {
    return { label: "PDF", className: dark ? "bg-[#3a1a14] text-[#FF8A6E]" : "bg-[#FFF1ED] text-[#D84325]" };
  }

  if (["DOC", "DOCX", "HWP"].includes(extension)) {
    return { label: "DOC", className: dark ? "bg-[#162040] text-[#6B9AFF]" : "bg-[#EAF2FF] text-[#2453A6]" };
  }

  if (["XLS", "XLSX", "CSV"].includes(extension)) {
    return { label: "XLS", className: dark ? "bg-[#0e2e1c] text-[#4CD89D]" : "bg-[#E8F8EF] text-[#127A4B]" };
  }

  if (["PPT", "PPTX", "KEY"].includes(extension)) {
    return { label: "PPT", className: dark ? "bg-[#2e1e0e] text-[#FFB36B]" : "bg-[#FFF4E8] text-[#B65318]" };
  }

  if (["ZIP", "RAR", "7Z"].includes(extension)) {
    return { label: "ZIP", className: dark ? "bg-[#1e1638] text-[#A08EF0]" : "bg-[#F1EEFF] text-[#5B42B5]" };
  }

  if (["PNG", "JPG", "JPEG", "GIF", "WEBP", "SVG"].includes(extension)) {
    return { label: "IMG", className: dark ? "bg-[#0e2e28] text-[#00C9A7]" : "bg-[#E8FBF7] text-[#007E68]" };
  }

  return { label: extension.slice(0, 4), className: dark ? "bg-white/10 text-white/60" : "bg-gray-100 text-gray-600" };
};

const normalizeExternalUrl = (url: string) =>
  /^https?:\/\//i.test(url) ? url : `https://${url}`;

const getUrlHost = (url: string) => {
  try {
    return new URL(normalizeExternalUrl(url)).host.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//i, "").split("/")[0];
  }
};

const formatMessageTime = (createdAt?: string) => {
  const date = createdAt ? new Date(createdAt) : new Date();
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(Number.isNaN(date.getTime()) ? new Date() : date);
};

type IntegrationProviderMetaItem = {
  label: string;
  shortLabel: string;
  title: string;
  description: string;
  placeholder: string;
  previewTitle: string;
  previewDescription: string;
  borderClassName: string;
  iconClassName: string;
  chipClassName: string;
  darkBorderClassName: string;
  darkIconClassName: string;
  darkChipClassName: string;
};

const integrationProviderMeta: Record<IntegrationProvider, IntegrationProviderMetaItem> = {
  figma: {
    label: "Figma",
    shortLabel: "Figma",
    title: "Figma 디자인 파일",
    description: "프레임, 코멘트, 프로토타입 링크를 채팅 카드로 공유해요.",
    placeholder: "https://www.figma.com/file/...",
    previewTitle: "Figma 디자인 파일",
    previewDescription: "프레임, 코멘트, 프로토타입을 바로 확인할 수 있어요.",
    borderClassName: "border-[#BDEFD8]",
    iconClassName: "bg-[#E8FBF7] text-[#00A88C]",
    chipClassName: "bg-[#E8FBF7] text-[#007E68]",
    darkBorderClassName: "border-[#00C9A7]/30",
    darkIconClassName: "bg-[#00C9A7]/15 text-[#00C9A7]",
    darkChipClassName: "bg-[#00C9A7]/15 text-[#00C9A7]",
  },
  adobe: {
    label: "Adobe",
    shortLabel: "Adobe",
    title: "Adobe 프로젝트 링크",
    description: "Creative Cloud 공유 파일과 프로젝트 링크를 정리해서 보내요.",
    placeholder: "https://assets.adobe.com/...",
    previewTitle: "Adobe 프로젝트 링크",
    previewDescription: "Creative Cloud 작업물과 공유 파일을 프로젝트 카드로 열어보세요.",
    borderClassName: "border-[#FFD1C8]",
    iconClassName: "bg-[#FFF1ED] text-[#FF5C3A]",
    chipClassName: "bg-[#FFF1ED] text-[#D84325]",
    darkBorderClassName: "border-[#FF5C3A]/30",
    darkIconClassName: "bg-[#FF5C3A]/15 text-[#FF8A6E]",
    darkChipClassName: "bg-[#FF5C3A]/15 text-[#FF8A6E]",
  },
  photoshop: {
    label: "Photoshop",
    shortLabel: "PSD",
    title: "Photoshop 작업 링크",
    description: "시안 PSD, 보정본, 레이어 작업물을 링크 카드로 공유해요.",
    placeholder: "https://assets.adobe.com/.../photoshop",
    previewTitle: "Photoshop 작업 링크",
    previewDescription: "PSD 시안, 보정본, 레이어 작업물을 바로 확인할 수 있어요.",
    borderClassName: "border-[#BFD7FF]",
    iconClassName: "bg-[#EAF2FF] text-[#2453A6]",
    chipClassName: "bg-[#EAF2FF] text-[#2453A6]",
    darkBorderClassName: "border-[#6B9AFF]/30",
    darkIconClassName: "bg-[#2453A6]/20 text-[#6B9AFF]",
    darkChipClassName: "bg-[#2453A6]/20 text-[#6B9AFF]",
  },
  pinterest: {
    label: "Pinterest",
    shortLabel: "Pin",
    title: "Pinterest 레퍼런스 보드",
    description: "무드보드, 이미지 레퍼런스, 스타일 보드를 채팅 카드로 공유해요.",
    placeholder: "https://www.pinterest.com/pin/...",
    previewTitle: "Pinterest 레퍼런스 보드",
    previewDescription: "이미지 레퍼런스와 무드보드를 바로 확인할 수 있어요.",
    borderClassName: "border-[#F5B7C8]",
    iconClassName: "bg-[#FFF0F3] text-[#D3224B]",
    chipClassName: "bg-[#FFF0F3] text-[#B7133A]",
    darkBorderClassName: "border-[#D3224B]/30",
    darkIconClassName: "bg-[#D3224B]/15 text-[#FF6B8A]",
    darkChipClassName: "bg-[#D3224B]/15 text-[#FF6B8A]",
  },
};

const getIntegrationMeta = (provider: IntegrationProvider, dark: boolean) => {
  const meta = integrationProviderMeta[provider];
  return {
    ...meta,
    borderClassName: dark ? meta.darkBorderClassName : meta.borderClassName,
    iconClassName: dark ? meta.darkIconClassName : meta.iconClassName,
    chipClassName: dark ? meta.darkChipClassName : meta.chipClassName,
  };
};

const integrationProviderOrder: IntegrationProvider[] = [
  "figma",
  "adobe",
  "photoshop",
  "pinterest",
];

const isValidExternalUrl = (url: string) => {
  try {
    const parsedUrl = new URL(normalizeExternalUrl(url));
    return Boolean(parsedUrl.host) && parsedUrl.host.includes(".");
  } catch {
    return false;
  }
};

const getIntegrationPreview = (provider: IntegrationProvider, url: string) => {
  const host = getUrlHost(url);
  const meta = integrationProviderMeta[provider];

  return {
    previewTitle: meta.previewTitle,
    previewDescription: meta.previewDescription,
    host,
  };

  if (provider === "figma") {
    return {
      previewTitle: "Figma 디자인 파일",
      previewDescription: "프레임, 코멘트, 프로토타입을 바로 확인할 수 있어요.",
      host,
    };
  }

  return {
    previewTitle: "Adobe 프로젝트 링크",
    previewDescription: "Creative Cloud 작업물과 공유 파일을 프로젝트 카드로 열어보세요.",
    host,
  };
};

const getAttachmentStatusLabel = (status?: AttachmentUploadStatus) => {
  switch (status) {
    case "uploading":
      return "첨부 중";
    case "failed":
      return "첨부 실패";
    case "ready":
      return "첨부 완료";
    default:
      return "첨부 완료";
  }
};

const readJsonFromStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;

  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? (JSON.parse(rawValue) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJsonToStorage = (key: string, value: unknown) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Temporary local saves should never break the chat UI.
  }
};

const readStoredProcesses = () =>
  readJsonFromStorage<ProjectProcess[] | null>(PROCESS_STORAGE_KEY, null);

const readStoredProcessCreated = () =>
  readJsonFromStorage<boolean>(PROCESS_CREATED_STORAGE_KEY, false);

const readStoredMessageDrafts = () =>
  readJsonFromStorage<Record<string, string>>(MESSAGE_DRAFTS_STORAGE_KEY, {});

const readLeftConversationIds = () =>
  readJsonFromStorage<number[]>(LEFT_CONVERSATIONS_STORAGE_KEY, []);

type Conversation = {
  id: number;
  partnerId: string;
  partnerRole: ApiMessageConversationResponse["partnerRole"];
  username: string;
  name: string;
  profileName: string;
  title: string;
  role: string;
  message: string;
  time: string;
  unread: boolean;
  unreadCount: number;
  online: boolean;
  statusText: string;
  avatar: string;
  bio: string;
  sharedMedia: Array<{
    id: number;
    title: string;
    src: string;
  }>;
};

const conversations: Conversation[] = [];

const getRoleLabel = (role: ApiMessageConversationResponse["partnerRole"]) =>
  role === "DESIGNER" ? "디자이너" : "클라이언트";

const formatConversationTime = (createdAt?: string | null) => {
  if (!createdAt) return "";

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

const mapConversationResponse = (
  conversation: ApiMessageConversationResponse
): Conversation => {
  const partnerDisplayName =
    conversation.partnerNickname || conversation.partnerName || "사용자";
  const title = conversation.partnerJob || getRoleLabel(conversation.partnerRole);

  return {
    id: conversation.id,
    partnerId: String(conversation.partnerUserId),
    partnerRole: conversation.partnerRole,
    username: conversation.partnerLoginId || partnerDisplayName,
    name: partnerDisplayName,
    profileName: partnerDisplayName,
    title,
    role: title,
    message: conversation.lastMessage ?? "새 대화를 시작해보세요.",
    time: formatConversationTime(conversation.lastMessageAt),
    unread: conversation.unreadCount > 0,
    unreadCount: conversation.unreadCount,
    online: conversation.partnerAvailable,
    statusText: conversation.partnerAvailable ? "메시지 가능" : "자리비움",
    avatar: conversation.partnerProfileImage || DEFAULT_AVATAR,
    bio: conversation.partnerIntroduction || "프로젝트 대화를 진행 중입니다.",
    sharedMedia: [],
  };
};

const normalizeIncomingAttachments = (attachments: unknown): MessageAttachment[] => {
  if (!Array.isArray(attachments)) {
    return [];
  }

  return attachments.flatMap((attachment, index) => {
    if (!attachment || typeof attachment !== "object") {
      return [];
    }

    const item = attachment as Record<string, unknown>;
    const id =
      typeof item.id === "string" && item.id.trim()
        ? item.id
        : `attachment-${Date.now()}-${index}`;
    const name =
      typeof item.name === "string" && item.name.trim() ? item.name : "attachment";
    const uploadStatus =
      item.uploadStatus === "uploading" ||
      item.uploadStatus === "ready" ||
      item.uploadStatus === "failed"
        ? item.uploadStatus
        : undefined;
    const uploadedUrl =
      typeof item.uploadedUrl === "string" && item.uploadedUrl.trim()
        ? item.uploadedUrl
        : undefined;

    switch (item.type) {
      case "image": {
        const srcCandidate =
          typeof item.src === "string" && item.src.trim()
            ? item.src
            : typeof item.url === "string" && item.url.trim()
              ? item.url
              : uploadedUrl;
        if (!srcCandidate) {
          return [];
        }

        return [
          {
            id,
            type: "image" as const,
            name,
            src: srcCandidate,
            uploadedUrl: uploadedUrl ?? srcCandidate,
            uploadStatus,
            mimeType: typeof item.mimeType === "string" ? item.mimeType : undefined,
            size: typeof item.size === "number" ? item.size : undefined,
          },
        ];
      }
      case "file": {
        const url =
          typeof item.url === "string" && item.url.trim()
            ? item.url
            : uploadedUrl;
        return [
          {
            id,
            type: "file" as const,
            name,
            size: typeof item.size === "number" ? item.size : 0,
            mimeType:
              typeof item.mimeType === "string" && item.mimeType.trim()
                ? item.mimeType
                : "application/octet-stream",
            url,
            uploadedUrl: uploadedUrl ?? url,
            uploadStatus,
          },
        ];
      }
      case "integration": {
        if (typeof item.url !== "string" || !item.url.trim()) {
          return [];
        }

        const provider = item.provider;
        if (
          provider !== "figma" &&
          provider !== "adobe" &&
          provider !== "photoshop" &&
          provider !== "pinterest"
        ) {
          return [];
        }

        return [
          {
            id,
            type: "integration" as const,
            provider,
            url: item.url,
            name,
            uploadStatus,
            previewTitle:
              typeof item.previewTitle === "string" ? item.previewTitle : undefined,
            previewDescription:
              typeof item.previewDescription === "string"
                ? item.previewDescription
                : undefined,
            host: typeof item.host === "string" ? item.host : undefined,
          },
        ];
      }
      case "icon": {
        if (typeof item.value !== "string" || !item.value.trim()) {
          return [];
        }

        return [
          {
            id,
            type: "icon" as const,
            value: normalizeMessageIconValue(item.value),
            name,
            uploadStatus,
          },
        ];
      }
      default:
        return [];
    }
  });
};

const buildOutgoingAttachmentsPayload = (attachments: MessageAttachment[]) =>
  attachments.flatMap((attachment) => {
    switch (attachment.type) {
      case "image": {
        const src = attachment.uploadedUrl ?? attachment.src;
        if (!src) {
          return [];
        }

        return [
          {
            id: attachment.id,
            type: "image" as const,
            name: attachment.name,
            src,
            mimeType: attachment.mimeType,
            size: attachment.size,
          },
        ];
      }
      case "file": {
        const url = attachment.uploadedUrl ?? attachment.url;
        if (!url) {
          return [];
        }

        return [
          {
            id: attachment.id,
            type: "file" as const,
            name: attachment.name,
            size: attachment.size,
            mimeType: attachment.mimeType,
            url,
          },
        ];
      }
      case "integration":
        return [
          {
            id: attachment.id,
            type: "integration" as const,
            provider: attachment.provider,
            url: attachment.url,
            name: attachment.name,
            previewTitle: attachment.previewTitle,
            previewDescription: attachment.previewDescription,
            host: attachment.host,
          },
        ];
      case "icon":
        return [
          {
            id: attachment.id,
            type: "icon" as const,
            value: toMessageIconStorageValue(attachment.value),
            name: attachment.name,
          },
        ];
      default:
        return [];
    }
  });

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("File preview could not be created."));
    };
    reader.onerror = () => reject(new Error("File preview could not be created."));
    reader.readAsDataURL(file);
  });

const reactionEmojiAliases: Record<string, string> = {
  thumbs_up: "👍",
  thumbsup: "👍",
  "thumbs-up": "👍",
  heart: "❤️",
  fire: "🔥",
  clap: "👏",
  joy: "😂",
  wow: "😮",
  palette: "🎨",
  check: "✅",
  eyes: "👀",
  rocket: "🚀",
};

const messageIconDisplayByKey: Record<string, string> = {
  thumbs_up: "👍",
  clap: "👏",
  raising_hands: "🙌",
  ok_hand: "👌",
  pray: "🙏",
  smile: "😊",
  slight_smile: "🙂",
  grin: "😄",
  thinking: "🤔",
  eyes: "👀",
  sparkles: "✨",
  fire: "🔥",
  palette: "🎨",
  framed_picture: "🖼️",
  idea: "💡",
  pin: "📌",
  check: "✅",
  memo: "📝",
  rocket: "🚀",
  speech_balloon: "💬",
  heart: "❤️",
  star: "⭐",
  coffee: "☕",
  target: "🎯",
};

const messageIconKeyByAlias = Object.entries(messageIconDisplayByKey).reduce(
  (accumulator, [key, emoji]) => {
    const normalizedKey = key.trim().replace(/\uFE0F/g, "").toLowerCase();
    const normalizedEmoji = emoji.trim().replace(/\uFE0F/g, "").toLowerCase();
    accumulator[normalizedKey] = key;
    accumulator[`:${normalizedKey}:`] = key;
    accumulator[normalizedEmoji] = key;
    return accumulator;
  },
  {
    thumbsup: "thumbs_up",
    "thumbs-up": "thumbs_up",
    "thumbs up": "thumbs_up",
    raise_hands: "raising_hands",
    raised_hands: "raising_hands",
    ok: "ok_hand",
    bulb: "idea",
    light_bulb: "idea",
    pushpin: "pin",
    comment: "speech_balloon",
    speech: "speech_balloon",
    dart: "target",
    picture: "framed_picture",
    frame: "framed_picture",
    art: "palette",
    tick: "check",
    check_mark: "check",
    note: "memo",
  } as Record<string, string>
);

const normalizeReactionEmoji = (emoji: string) => {
  const normalizedKey = emoji.trim().replace(/\uFE0F/g, "").replace(/-/g, "_").toLowerCase();
  return reactionEmojiAliases[normalizedKey] ?? emoji;
};

const normalizeMessageIconValue = (value: string) => {
  const normalizedValue = value.trim().replace(/\uFE0F/g, "").toLowerCase();
  const iconKey = messageIconKeyByAlias[normalizedValue];
  return iconKey ? (messageIconDisplayByKey[iconKey] ?? value) : value;
};

const toMessageIconStorageValue = (value: string) => {
  const normalizedValue = value.trim().replace(/\uFE0F/g, "").toLowerCase();
  const iconKey = messageIconKeyByAlias[normalizedValue];
  return iconKey ? `:${iconKey}:` : value;
};

const normalizeMessageReactions = (reactions: MessageReaction[] = []) =>
  reactions.map((reaction) => ({
    ...reaction,
    emoji: normalizeReactionEmoji(reaction.emoji),
  }));

const toNumericUserId = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  return null;
};

const isCurrentUsersMessage = (
  senderUserId: unknown,
  options: {
    currentUserId?: number;
    partnerUserId?: string | number | null;
  }
) => {
  const normalizedSenderUserId = toNumericUserId(senderUserId);
  const normalizedCurrentUserId = toNumericUserId(options.currentUserId);

  if (normalizedSenderUserId !== null && normalizedCurrentUserId !== null) {
    return normalizedSenderUserId === normalizedCurrentUserId;
  }

  const normalizedPartnerUserId = toNumericUserId(options.partnerUserId);
  if (normalizedSenderUserId !== null && normalizedPartnerUserId !== null) {
    return normalizedSenderUserId !== normalizedPartnerUserId;
  }

  return false;
};

const mapChatMessageResponse = (
  message: ApiChatMessageResponse,
  options: {
    currentUserId?: number;
    partnerUserId?: string | number | null;
  }
): ChatMessage => {
  const isSelf = isCurrentUsersMessage(message.senderUserId, options);
  const messageId = String(message.id);

  return {
    id: messageId,
    clientId: message.clientId || messageId,
    serverId: messageId,
    conversationId: message.conversationId,
    senderId: isSelf ? CURRENT_USER_ID : String(message.senderUserId),
    sender: isSelf ? "나" : message.senderName,
    message: message.message,
    time: formatMessageTime(message.createdAt),
    createdAt: message.createdAt,
    isSelf,
    status: isSelf && message.readByPartner ? "read" : "sent",
    attachments: normalizeIncomingAttachments(message.attachments ?? []),
    reactions: normalizeMessageReactions(message.reactions ?? []),
  };
};

const isSameChatMessage = (
  left: Pick<ChatMessage, "id" | "clientId" | "serverId" | "conversationId">,
  right: Pick<ChatMessage, "id" | "clientId" | "serverId" | "conversationId">
) => {
  if (left.conversationId !== right.conversationId) {
    return false;
  }

  const leftIdentifiers = new Set(
    [left.id, left.clientId, left.serverId].filter(
      (value): value is string => typeof value === "string" && value.trim().length > 0
    )
  );

  return [right.id, right.clientId, right.serverId].some(
    (value) => typeof value === "string" && leftIdentifiers.has(value)
  );
};

const parseNumericMessageId = (value: string | number | null | undefined) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return null;
  }

  const parsedValue = Number(trimmedValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const mapProcessResponse = (
  process: ApiMessageProcessResponse
): ProjectProcess => ({
  id: process.id,
  title: process.title,
  status: process.status,
  confirmations: {
    designer: process.confirmations?.designer ?? false,
    client: process.confirmations?.client ?? false,
  },
  tasks: (process.tasks ?? []).map((task) => ({
    id: task.id,
    text: task.text,
    completed: task.completed,
  })),
});

const messages: ChatMessage[] = [];

const attachableIcons = [
  "👍",
  "👏",
  "🙌",
  "👌",
  "🙏",
  "😊",
  "🙂",
  "😄",
  "🤔",
  "👀",
  "✨",
  "🔥",
  "🎨",
  "🖼️",
  "💡",
  "📌",
  "✅",
  "📝",
  "🚀",
  "💬",
  "❤️",
  "⭐",
  "☕",
  "🎯",
];

const reactionIcons = ["👍", "❤️", "🔥", "👏", "😂", "😮", "🎨", "✅", "👀", "🚀"];

const createEmptyProcessConfirmations = (): ProcessConfirmations => ({
  designer: false,
  client: false,
});

const hasBothConfirmations = (confirmations: ProcessConfirmations) =>
  confirmations.designer && confirmations.client;

const createDefaultProcessDraft = (): ProjectProcess[] =>
  [1, 2, 3].map((index) => ({
    id: index,
    title: `프로세스 ${index}`,
    status: "pending",
    confirmations: createEmptyProcessConfirmations(),
    tasks: [
      {
        id: index,
        text: "세부 프로세스 1",
        completed: false,
      },
    ],
  }));

const reorderItems = <T,>(items: T[], fromIndex: number, toIndex: number) => {
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return items;

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
};

const getProcessDraftValidation = (items: ProjectProcess[]) => {
  if (items.length === 0) return "프로세스를 하나 이상 추가해주세요.";

  const emptyTitleIndex = items.findIndex((process) => !process.title.trim());
  if (emptyTitleIndex >= 0) {
    return `${emptyTitleIndex + 1}번 프로세스 이름을 입력해주세요.`;
  }

  const noTaskIndex = items.findIndex((process) => process.tasks.length === 0);
  if (noTaskIndex >= 0) {
    return `${noTaskIndex + 1}번 프로세스에 세부 프로세스를 하나 이상 추가해주세요.`;
  }

  for (const [processIndex, process] of items.entries()) {
    const emptyTaskIndex = process.tasks.findIndex((task) => !task.text.trim());
    if (emptyTaskIndex >= 0) {
      return `${processIndex + 1}번 프로세스의 ${
        emptyTaskIndex + 1
      }번 세부 프로세스를 입력해주세요.`;
    }
  }

  return "";
};

const cloneProcesses = (items: ProjectProcess[]) =>
  items.map((process) => ({
    ...process,
    confirmations: { ...process.confirmations },
    tasks: process.tasks.map((task) => ({ ...task })),
  }));

const getNextProcessId = (items: ProjectProcess[]) =>
  Math.max(0, ...items.map((process) => process.id)) + 1;

const getNextTaskId = (items: ProjectProcess[]) =>
  Math.max(0, ...items.flatMap((process) => process.tasks.map((task) => task.id))) + 1;

const getProcessStatusFromState = (
  tasks: ProcessTask[],
  confirmations: ProcessConfirmations
): ProcessStatus => {
  if (tasks.length === 0) return "pending";
  const completedCount = tasks.filter((task) => task.completed).length;
  if (completedCount === tasks.length && hasBothConfirmations(confirmations)) {
    return "completed";
  }
  if (completedCount > 0 || confirmations.designer || confirmations.client) return "in-progress";
  return "pending";
};

const initialProcesses: ProjectProcess[] = [];

export default function Messages() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isNight } = useNightMode();
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.userId;
  const requestedConversationId = Number(searchParams.get("conversationId") ?? 0);
  const storedMessageDraftsRef = useRef<Record<string, string>>(readStoredMessageDrafts());
  const [serverConversations, setServerConversations] = useState<Conversation[]>([]);
  const [isConversationsLoading, setIsConversationsLoading] = useState(true);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const [conversationReloadKey, setConversationReloadKey] = useState(0);
  const initialLoadDoneRef = useRef(false);
  const lastHandledReloadKeyRef = useRef(-1);
  const [leftConversationIds, setLeftConversationIds] = useState<number[]>(
    readLeftConversationIds
  );
  const [onlineByConversationId, setOnlineByConversationId] = useState<Record<number, boolean>>(
    {}
  );
  const [typingConversationId, setTypingConversationId] = useState<number | null>(null);
  const rawConversations = [...serverConversations, ...conversations].map((conversation) => {
    const isOnline = onlineByConversationId[conversation.id] ?? conversation.online;
    const statusText = isOnline ? "메시지 가능" : "자리비움";

    return {
      ...conversation,
      online: isOnline,
      statusText,
    };
  });
  const allConversations = rawConversations.filter(
    (conversation) => !leftConversationIds.includes(conversation.id)
  );
  const messageSocketConversationIds = allConversations
    .map((conversation) => conversation.id)
    .join("|");
  const [activeTab, setActiveTab] = useState<"profile" | "process">("profile");
  const [activeConversationId, setActiveConversationId] = useState(requestedConversationId);
  const [mobileView, setMobileView] = useState<"list" | "chat" | "detail">("list");
  const [conversationSearch, setConversationSearch] = useState("");
  const [processes, setProcesses] = useState<ProjectProcess[]>(initialProcesses);
  const [expandedProcess, setExpandedProcess] = useState<number | null>(2);
  const [processCreated, setProcessCreated] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isEndProcessModalOpen, setIsEndProcessModalOpen] = useState(false);
  const [endProcessModalStep, setEndProcessModalStep] = useState<"info" | "confirm">("info");
  const [isEndingProcess, setIsEndingProcess] = useState(false);
  const [draftProcesses, setDraftProcesses] = useState<ProjectProcess[]>(createDefaultProcessDraft);
  const [processDraftSnapshot, setProcessDraftSnapshot] =
    useState<ProjectProcess[]>(createDefaultProcessDraft);
  const [draggingDraftProcessId, setDraggingDraftProcessId] = useState<number | null>(null);
  const [draggingDraftTask, setDraggingDraftTask] = useState<{
    processId: number;
    taskId: number;
  } | null>(null);
  const [saved, setSaved] = useState(false);
  const [unreadConversationIds, setUnreadConversationIds] = useState(
    getUnreadMessageConversationIds
  );
  const [clearingUnreadConversationId, setClearingUnreadConversationId] =
    useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => [...messages]);
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>(
    () => storedMessageDraftsRef.current
  );
  const [messageText, setMessageText] = useState(
    () => storedMessageDraftsRef.current[String(allConversations[0]?.id ?? 0)] ?? ""
  );
  const [pendingAttachments, setPendingAttachments] = useState<MessageAttachment[]>([]);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [integrationModalProvider, setIntegrationModalProvider] =
    useState<IntegrationProvider | null>(null);
  const [integrationUrl, setIntegrationUrl] = useState("");
  const [integrationUrlTouched, setIntegrationUrlTouched] = useState(false);
  const [reactionPickerMessageId, setReactionPickerMessageId] = useState<string | null>(null);
  const [reactionAnimation, setReactionAnimation] = useState<{
    messageClientId: string;
    emoji: string;
    key: number;
    shouldBounceCount: boolean;
  } | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isRecoveryPollingActive, setIsRecoveryPollingActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ src: string; name: string } | null>(null);
  const [processToast, setProcessToast] = useState<ProcessToast | null>(null);
  const [assistantGoal, setAssistantGoal] = useState<MessageAssistantGoal>("reply");
  const [assistantSuggestions, setAssistantSuggestions] = useState<string[]>([]);
  const [assistantUsedAi, setAssistantUsedAi] = useState(false);
  const [assistantError, setAssistantError] = useState<string | null>(null);
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  const [isAssistantExpanded, setIsAssistantExpanded] = useState(false);
  const [hasAssistantRequested, setHasAssistantRequested] = useState(false);
  const assistantRequestIdRef = useRef(0);
  const assistantLastLoadedContextRef = useRef<string | null>(null);
  const assistantInitialConversationLoadRef = useRef<number | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageSocketRef = useRef<ReturnType<typeof createMessageSocket> | null>(null);
  const activeConversationIdRef = useRef(activeConversationId);
  const expandedProcessRef = useRef<number | null>(expandedProcess);
  const allConversationsRef = useRef<Conversation[]>([]);
  const onlineByConversationIdRef = useRef<Record<number, boolean>>({});
  const latestServerMessageIdByConversationRef = useRef<Record<number, number>>({});
  const recoveryPollingTimeoutRef = useRef<number | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const typingConversationRef = useRef<number | null>(null);
  const isMessageComposingRef = useRef(false);
  const partnerTypingConversationIdRef = useRef<number | null>(null);
  const lastTypingSyncAtRef = useRef<Record<number, number>>({});
  const partnerTypingTimeoutRef = useRef<number | null>(null);
  const isProcessModalOpenRef = useRef(false);
  /*
   * URL·딥링크로 들어온 conversationId 가 '나간 대화(left)' 때문에 목록(allConversations)에서만
   * 제외된 경우가 있다. 피드 제안 직후 /messages?conversationId= 같은 흐름에서 메시지가
   * 안 보이는 원인이 됨 → 서버 목록 원본(raw)에서 먼저 조회한다. 사이드바는 계속 숨김 유지 가능.
   */
  const activeConversation =
    rawConversations.find((conversation) => conversation.id === activeConversationId) ??
    allConversations[0] ??
    null;
  const activeMessages = activeConversation
    ? chatMessages.filter((message) => message.conversationId === activeConversation.id)
    : [];
  const latestActiveMessage =
    activeMessages.length > 0 ? activeMessages[activeMessages.length - 1] : null;
  const assistantMessageSignature = activeMessages
    .slice(-6)
    .map((message) => {
      const attachmentCount = message.attachments?.length ?? 0;
      return [
        message.serverId ?? message.id,
        message.createdAt,
        message.message,
        attachmentCount,
      ].join(":");
    })
    .join("|");
  const assistantProcessSignature = processes
    .map((process) =>
      [
        process.id,
        process.title,
        process.status,
        process.confirmations.designer ? "1" : "0",
        process.confirmations.client ? "1" : "0",
        process.tasks.map((task) => `${task.id}-${task.text}-${task.completed ? "1" : "0"}`).join(","),
      ].join(":"),
    )
    .join("|");
  useEffect(() => {
    setAssistantGoal("reply");
    setAssistantSuggestions([]);
    setAssistantUsedAi(false);
    setAssistantError(null);
    setIsAssistantLoading(false);
    setIsAssistantExpanded(false);
    setHasAssistantRequested(false);
    assistantLastLoadedContextRef.current = null;
  }, [activeConversationId]);

  useEffect(() => {
    if (recoveryPollingTimeoutRef.current !== null) {
      window.clearTimeout(recoveryPollingTimeoutRef.current);
      recoveryPollingTimeoutRef.current = null;
    }

    if (isSocketConnected) {
      setIsRecoveryPollingActive(false);
      return;
    }

    setIsRecoveryPollingActive(false);
    recoveryPollingTimeoutRef.current = window.setTimeout(() => {
      if (!messageSocketRef.current?.isOpen()) {
        setIsRecoveryPollingActive(true);
      }
      recoveryPollingTimeoutRef.current = null;
    }, RECOVERY_POLL_GRACE_PERIOD);

    return () => {
      if (recoveryPollingTimeoutRef.current !== null) {
        window.clearTimeout(recoveryPollingTimeoutRef.current);
        recoveryPollingTimeoutRef.current = null;
      }
    };
  }, [isSocketConnected]);

  const updateLatestServerMessageId = (
    conversationId: number,
    messageId: string | number | null | undefined
  ) => {
    const parsedMessageId = parseNumericMessageId(messageId);
    if (parsedMessageId === null) {
      return;
    }

    const previousMessageId = latestServerMessageIdByConversationRef.current[conversationId];
    latestServerMessageIdByConversationRef.current[conversationId] =
      typeof previousMessageId === "number"
        ? Math.max(previousMessageId, parsedMessageId)
        : parsedMessageId;
  };

  const syncLatestServerMessageIdFromResponses = (
    conversationId: number,
    messageResponses: ApiChatMessageResponse[]
  ) => {
    if (messageResponses.length === 0) {
      delete latestServerMessageIdByConversationRef.current[conversationId];
      return;
    }

    messageResponses.forEach((message) => {
      updateLatestServerMessageId(conversationId, message.id);
    });
  };

  const mergeConversationMessages = (
    prev: ChatMessage[],
    conversationId: number,
    nextMessages: ChatMessage[],
    mode: "replace" | "append"
  ) => {
    const currentConversationMessages = prev.filter(
      (message) => message.conversationId === conversationId
    );
    const otherMessages = prev.filter(
      (message) => message.conversationId !== conversationId
    );

    if (mode === "replace") {
      const optimisticMessagesNotInHistory = currentConversationMessages.filter(
        (currentMessage) =>
          currentMessage.isSelf &&
          !nextMessages.some((message) => isSameChatMessage(message, currentMessage))
      );

      return [...otherMessages, ...nextMessages, ...optimisticMessagesNotInHistory];
    }

    const mergedMessages = [...currentConversationMessages];

    nextMessages.forEach((nextMessage) => {
      const existingMessageIndex = mergedMessages.findIndex((message) =>
        isSameChatMessage(message, nextMessage)
      );

      if (existingMessageIndex < 0) {
        mergedMessages.push(nextMessage);
        return;
      }

      mergedMessages[existingMessageIndex] = {
        ...mergedMessages[existingMessageIndex],
        ...nextMessage,
      };
    });

    return [...otherMessages, ...mergedMessages];
  };

  const catchUpConversationMessages = async (conversationId: number, partnerUserId: string) => {
    const lastKnownMessageId = latestServerMessageIdByConversationRef.current[conversationId];
    const shouldFetchMissedOnly =
      typeof lastKnownMessageId === "number" && Number.isFinite(lastKnownMessageId);
    const messageResponses = await getConversationMessagesApi(
      conversationId,
      shouldFetchMissedOnly ? { afterMessageId: lastKnownMessageId } : undefined
    );

    if (activeConversationIdRef.current !== conversationId) {
      return;
    }

    if (messageResponses.length === 0) {
      return;
    }

    syncLatestServerMessageIdFromResponses(conversationId, messageResponses);

    const nextMessages = messageResponses.map((message) =>
      mapChatMessageResponse(message, {
        currentUserId,
        partnerUserId,
      })
    );

    setChatMessages((prev) =>
      mergeConversationMessages(
        prev,
        conversationId,
        nextMessages,
        shouldFetchMissedOnly ? "append" : "replace"
      )
    );
  };

  function applyPresenceStates(states: MessagePresenceState[]) {
    const partnerUserIdByConversationId = new Map(
      allConversations.map((conversation) => [
        conversation.id,
        toNumericUserId(conversation.partnerId),
      ])
    );

    setOnlineByConversationId((prev) => {
      const next = { ...prev };
      states.forEach((state) => {
        const partnerUserId = partnerUserIdByConversationId.get(state.conversationId);
        if (partnerUserId === state.userId) {
          next[state.conversationId] = state.isOnline;
          return;
        }

        if (
          (partnerUserId === null || partnerUserId === undefined) &&
          state.userId !== currentUserId
        ) {
          next[state.conversationId] = state.isOnline;
        }
      });
      onlineByConversationIdRef.current = next;
      return next;
    });
    setServerConversations((prev) =>
      prev.map((conversation) => {
        const nextState = states.find((state) => {
          const partnerUserId = partnerUserIdByConversationId.get(state.conversationId);
          return (
            state.conversationId === conversation.id &&
            (partnerUserId === state.userId ||
              ((partnerUserId === null || partnerUserId === undefined) &&
                state.userId !== currentUserId))
          );
        });

        if (!nextState) {
          return conversation;
        }

        return {
          ...conversation,
          online: nextState.isOnline,
          statusText: nextState.isOnline ? "메시지 가능" : "자리비움",
        };
      })
    );
  }

  function clearOwnTypingTimeout() {
    if (typingTimeoutRef.current !== null) {
      window.clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }

  function startOwnTyping(conversationId: number) {
    if (typingConversationRef.current !== conversationId) {
      if (typingConversationRef.current !== null) {
        stopOwnTyping(typingConversationRef.current);
      }

      notifyTypingState(conversationId, true);
      typingConversationRef.current = conversationId;
    } else {
      notifyTypingState(conversationId, true);
    }

    clearOwnTypingTimeout();
    typingTimeoutRef.current = window.setTimeout(() => {
      stopOwnTyping(conversationId);
    }, TYPING_IDLE_DELAY);
  }

  function applyConversationPresence(
    conversationId: number,
    presence: {
      partnerAvailable: boolean;
      partnerTyping: boolean;
    }
  ) {
    debugMessageTyping("applyConversationPresence", {
      conversationId,
      presence,
    });
    setOnlineByConversationId((prev) => {
      const next = {
        ...prev,
        [conversationId]: presence.partnerAvailable,
      };
      onlineByConversationIdRef.current = next;
      return next;
    });
    setServerConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              online: presence.partnerAvailable,
              statusText: presence.partnerAvailable ? "메시지 가능" : "자리비움",
            }
          : conversation
      )
    );
    setTypingConversationId((current) => {
      const nextTypingConversationId = presence.partnerTyping
        ? conversationId
        : current === conversationId
          ? null
          : current;
      partnerTypingConversationIdRef.current = nextTypingConversationId;
      return nextTypingConversationId;
    });
  }

  function notifyTypingState(conversationId: number, isTyping: boolean) {
    debugMessageTyping("notifyTypingState", {
      conversationId,
      isTyping,
      currentUserId,
    });
    const now = Date.now();
    if (isTyping) {
      const lastSyncedAt = lastTypingSyncAtRef.current[conversationId] ?? 0;
      if (now - lastSyncedAt < TYPING_SYNC_INTERVAL) {
        return;
      }
      lastTypingSyncAtRef.current[conversationId] = now;
    } else {
      delete lastTypingSyncAtRef.current[conversationId];
    }

    const socket = messageSocketRef.current;
    if (socket?.isOpen()) {
      try {
        socket.sendTyping(conversationId, isTyping);
      } catch {
        // REST fallback below still updates typing state.
      }
    }

    void updateConversationTypingApi(conversationId, isTyping).catch(() => {
      // Presence polling will retry shortly; ignore transient typing sync failures.
    });
  }

  function stopOwnTyping(conversationId = typingConversationRef.current) {
    clearOwnTypingTimeout();

    if (!conversationId) {
      typingConversationRef.current = null;
      return;
    }

    notifyTypingState(conversationId, false);

    if (typingConversationRef.current === conversationId) {
      typingConversationRef.current = null;
    }
  }

  function syncProcessState(nextProcesses: ProjectProcess[], preferredExpandedId?: number | null) {
    setProcesses(nextProcesses);
    setProcessCreated(nextProcesses.length > 0);
    setExpandedProcess((current) => {
      if (nextProcesses.length === 0) {
        return null;
      }

      if (preferredExpandedId === null) {
        return null;
      }

      const candidate = preferredExpandedId ?? current;

      return candidate && nextProcesses.some((process) => process.id === candidate)
        ? candidate
        : nextProcesses[0].id;
    });
  }

  function normalizeProcessesForSave(source: ProjectProcess[]) {
    return source.map((process) => {
      const confirmations = process.confirmations ?? createEmptyProcessConfirmations();
      const tasks = process.tasks.map((task) => ({
        ...task,
        text: task.text.trim(),
      }));

      return {
        ...process,
        title: process.title.trim(),
        confirmations,
        status: getProcessStatusFromState(tasks, confirmations),
        tasks,
      };
    });
  }

  async function persistProcesses(
    nextProcesses: ProjectProcess[],
    options?: {
      successMessage?: string;
      optimistic?: boolean;
      preferredExpandedId?: number | null;
    }
  ) {
    if (!activeConversation) return null;

    const conversationId = activeConversation.id;
    const normalizedProcesses = normalizeProcessesForSave(nextProcesses);
    const previousProcesses = cloneProcesses(processes);
    const previousExpandedId = expandedProcess;
    const preferredExpandedId = options?.preferredExpandedId ?? expandedProcess;

    if (options?.optimistic) {
      syncProcessState(normalizedProcesses, preferredExpandedId);
    }

    try {
      const savedResponses = await saveConversationProcessesApi(
        conversationId,
        normalizedProcesses.map((process) => ({
          id: process.id,
          title: process.title,
          confirmations: process.confirmations,
          tasks: process.tasks.map((task) => ({
            id: task.id,
            text: task.text,
            completed: task.completed,
          })),
        }))
      );

      const savedProcesses = savedResponses.map(mapProcessResponse);
      if (activeConversationIdRef.current === conversationId) {
        syncProcessState(savedProcesses, preferredExpandedId);
        if (options?.successMessage) {
          showProcessToast(options.successMessage);
        }
      }

      return savedProcesses;
    } catch (error) {
      if (options?.optimistic && activeConversationIdRef.current === conversationId) {
        syncProcessState(previousProcesses, previousExpandedId);
      }

      setConversationError(
        error instanceof Error ? error.message : "작업 프로세스를 저장하지 못했습니다."
      );
      return null;
    }
  }

  useEffect(() => {
    let mounted = true;

    async function loadConversations(silent = false) {
      try {
        if (!silent) {
          setIsConversationsLoading(true);
          setConversationError(null);
        }
        const conversationResponses = await getMessageConversationsApi();

        if (!mounted) return;

        const nextConversations = conversationResponses.map(mapConversationResponse).map((conversation) => {
          const isOnline =
            onlineByConversationIdRef.current[conversation.id] ?? conversation.online;
          return {
            ...conversation,
            online: isOnline,
            statusText: isOnline ? "메시지 가능" : "자리비움",
          };
        });
        setServerConversations(nextConversations);
        initialLoadDoneRef.current = true;
        const socket = messageSocketRef.current;
        if (socket?.isOpen() && nextConversations.length > 0) {
          try {
            socket.subscribe(nextConversations.map((conversation) => conversation.id));
          } catch {
            // Ignore transient subscribe refresh failures.
          }
        }

        const requestedId = Number.isFinite(requestedConversationId)
          ? requestedConversationId
          : 0;
        const requestedConversation = nextConversations.find(
          (conversation) => conversation.id === requestedId
        );

        setActiveConversationId((currentId) => {
          if (requestedConversation && currentId !== requestedConversation.id) {
            return requestedConversation.id;
          }
          if (nextConversations.some((conversation) => conversation.id === currentId)) {
            return currentId;
          }
          return requestedConversation?.id ?? nextConversations[0]?.id ?? 0;
        });
      } catch (error) {
        if (!mounted || silent) return;
        setConversationError(
          error instanceof Error ? error.message : "대화 목록을 불러오지 못했습니다."
        );
      } finally {
        if (mounted && !silent) {
          setIsConversationsLoading(false);
        }
      }
    }

    const isExplicitReload = lastHandledReloadKeyRef.current !== conversationReloadKey;
    if (isExplicitReload) lastHandledReloadKeyRef.current = conversationReloadKey;
    // 이미 한 번 로드된 상태에서 소켓 연결 변경으로 인한 재실행은 silent로 처리
    const shouldBeSilent = initialLoadDoneRef.current && !isExplicitReload;
    void loadConversations(shouldBeSilent);
    const pollInterval = window.setInterval(() => {
      void loadConversations(true);
    }, isRecoveryPollingActive
      ? RECOVERY_STATE_POLL_INTERVAL
      : CONNECTED_CONVERSATION_POLL_INTERVAL);

    return () => {
      mounted = false;
      window.clearInterval(pollInterval);
    };
  }, [requestedConversationId, conversationReloadKey, isRecoveryPollingActive]);

  useEffect(() => {
    if (!activeConversation) return;

    let mounted = true;
    const conversationId = activeConversation.id;
    const partnerUserId = activeConversation.partnerId;

    async function loadConversationMessages() {
      try {
        const messageResponses = await getConversationMessagesApi(conversationId);

        if (!mounted || activeConversationIdRef.current !== conversationId) return;

        syncLatestServerMessageIdFromResponses(conversationId, messageResponses);

        const nextMessages = messageResponses.map((message) =>
          mapChatMessageResponse(message, {
            currentUserId,
            partnerUserId,
          })
        );

        setChatMessages((prev) =>
          mergeConversationMessages(prev, conversationId, nextMessages, "replace")
        );
      } catch (error) {
        if (!mounted) return;
        setConversationError(
          error instanceof Error ? error.message : "메시지 내역을 불러오지 못했습니다."
        );
      }
    }

    void loadConversationMessages();

    return () => {
      mounted = false;
    };
  }, [activeConversation?.id, currentUserId]);

  useEffect(() => {
    if (!activeConversation || !isRecoveryPollingActive) {
      return;
    }

    let mounted = true;
    const conversationId = activeConversation.id;
    const partnerUserId = activeConversation.partnerId;

    async function recoverConversationMessages(silent = false) {
      if (messageSocketRef.current?.isOpen()) {
        return;
      }

      try {
        await catchUpConversationMessages(conversationId, partnerUserId);
      } catch (error) {
        if (!mounted || silent) return;
        setConversationError(
          error instanceof Error ? error.message : "누락된 메시지를 복구하지 못했습니다."
        );
      }
    }

    void recoverConversationMessages();
    const pollInterval = window.setInterval(() => {
      void recoverConversationMessages(true);
    }, RECOVERY_MESSAGE_POLL_INTERVAL);

    return () => {
      mounted = false;
      window.clearInterval(pollInterval);
    };
  }, [activeConversation?.id, currentUserId, isRecoveryPollingActive]);

  useEffect(() => {
    if (!activeConversation) return;

    let mounted = true;
    const conversationId = activeConversation.id;

    async function loadConversationPresence(silent = false) {
      try {
        const presence = await getConversationPresenceApi(conversationId);
        if (!mounted || activeConversationIdRef.current !== conversationId) return;

        debugMessageTyping("presence api", {
          conversationId,
          silent,
          presence,
        });
        applyConversationPresence(conversationId, presence);
      } catch (error) {
        if (!mounted || silent) return;
        setConversationError(
          error instanceof Error ? error.message : "대화 상태를 불러오지 못했습니다."
        );
      }
    }

    void loadConversationPresence();
    const pollInterval = window.setInterval(() => {
      void loadConversationPresence(true);
    }, isRecoveryPollingActive
      ? RECOVERY_STATE_POLL_INTERVAL
      : CONNECTED_PRESENCE_POLL_INTERVAL);

    return () => {
      mounted = false;
      window.clearInterval(pollInterval);
    };
  }, [activeConversation?.id, isRecoveryPollingActive]);

  useEffect(() => {
    if (!activeConversation) {
      setProcesses([]);
      setProcessCreated(false);
      return;
    }

    let mounted = true;
    const conversationId = activeConversation.id;

    async function loadProcesses(silent = false) {
      try {
        const processResponses = await getConversationProcessesApi(conversationId);
        if (!mounted || activeConversationIdRef.current !== conversationId) return;

        const nextProcesses = processResponses.map(mapProcessResponse);
        setProcesses(nextProcesses);
        setProcessCreated(nextProcesses.length > 0);
        if (nextProcesses.length > 0) {
          setExpandedProcess((current) =>
            current && nextProcesses.some((process) => process.id === current)
              ? current
              : nextProcesses[0].id
          );
        } else {
          setExpandedProcess(null);
        }
      } catch (error) {
        if (!mounted || silent) return;
        setConversationError(
          error instanceof Error ? error.message : "작업 프로세스를 불러오지 못했습니다."
        );
      }
    }

    void loadProcesses();
    // 소켓이 연결된 정상 모드에서는 주기적 GET이 저장/완료 확인 직후 낙관적 상태를 덮어
    // "즉시 풀리는" 현상을 낳을 수 있다. process.update 웹소켓 + 저장 응답으로 동기화한다.
    const pollProcesses = !isSocketConnected || isRecoveryPollingActive;
    const pollInterval = pollProcesses
      ? window.setInterval(() => {
          void loadProcesses(true);
        }, isRecoveryPollingActive
          ? RECOVERY_STATE_POLL_INTERVAL
          : CONNECTED_PROCESS_POLL_INTERVAL)
      : null;

    return () => {
      mounted = false;
      if (pollInterval !== null) {
        window.clearInterval(pollInterval);
      }
    };
  }, [activeConversation?.id, isRecoveryPollingActive, isSocketConnected]);

  useEffect(() => {
    if (!activeConversation) return;

    const conversationId = activeConversation.id;
    const socket = messageSocketRef.current;

    if (socket?.isOpen()) {
      try {
        socket.markConversationRead(conversationId);
        return;
      } catch {
        // Fall through to REST when the socket is temporarily unavailable.
      }
    }

    void markConversationReadApi(conversationId).catch(() => {
      // Best-effort read acknowledgement fallback.
    });
  }, [activeConversation?.id, activeMessages.length, isSocketConnected]);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    allConversationsRef.current = allConversations;
  }, [allConversations]);

  useEffect(() => {
    onlineByConversationIdRef.current = onlineByConversationId;
  }, [onlineByConversationId]);

  useEffect(() => {
    partnerTypingConversationIdRef.current = typingConversationId;
  }, [typingConversationId]);

  useEffect(() => {
    expandedProcessRef.current = expandedProcess;
  }, [expandedProcess]);

  useEffect(() => {
    isProcessModalOpenRef.current = isProcessModalOpen;
  }, [isProcessModalOpen]);

  useEffect(() => {
    return () => {
      stopOwnTyping();
    };
  }, [activeConversation?.id]);

  useEffect(() => {
    const conversationIds = messageSocketConversationIds
      .split("|")
      .map((conversationId) => Number(conversationId))
      .filter((conversationId) => Number.isFinite(conversationId));

    const socket = createMessageSocket({
      onOpen: ({ reconnected }) => {
        setIsSocketConnected(true);
        setConversationReloadKey((key) => key + 1);
        if (conversationIds.length > 0) {
          socket.subscribe(conversationIds);
        }

        if (!reconnected) {
          return;
        }

        const activeConversationId = activeConversationIdRef.current;
        const currentConversation = allConversationsRef.current.find(
          (conversation) => conversation.id === activeConversationId
        );
        if (!currentConversation) {
          return;
        }

        void catchUpConversationMessages(
          currentConversation.id,
          currentConversation.partnerId
        ).catch(() => {
          setConversationReloadKey((key) => key + 1);
        });
      },
      onEvent: (event: IncomingMessageSocketEvent) => {
        if (event.type === "typing") {
          debugMessageTyping("socket typing event", {
            event,
            currentUserId,
            activeConversationId: activeConversationIdRef.current,
          });
          if (event.senderUserId !== currentUserId) {
            if (partnerTypingTimeoutRef.current !== null) {
              window.clearTimeout(partnerTypingTimeoutRef.current);
              partnerTypingTimeoutRef.current = null;
            }

            const currentConversation = allConversationsRef.current.find(
              (conversation) => conversation.id === event.conversationId
            );

            if (event.isTyping) {
              applyConversationPresence(event.conversationId, {
                partnerAvailable: currentConversation?.online ?? true,
                partnerTyping: true,
              });
              partnerTypingTimeoutRef.current = window.setTimeout(() => {
                applyConversationPresence(event.conversationId, {
                  partnerAvailable: currentConversation?.online ?? true,
                  partnerTyping: false,
                });
                partnerTypingTimeoutRef.current = null;
              }, TYPING_IDLE_DELAY + 800);
            } else {
              applyConversationPresence(event.conversationId, {
                partnerAvailable: currentConversation?.online ?? true,
                partnerTyping: false,
              });
            }
          }
          return;
        }

        if (event.type === "conversation.read") {
          if (event.readerUserId !== currentUserId) {
            setChatMessages((prev) =>
              prev.map((message) =>
                message.conversationId === event.conversationId && message.isSelf
                  ? {
                      ...message,
                      status:
                        typeof event.lastReadMessageId === "number" &&
                        Number(message.serverId ?? message.id) <= event.lastReadMessageId
                          ? "read"
                          : message.status,
                    }
                  : message
              )
            );
            setConversationReloadKey((key) => key + 1);
          }
          return;
        }

        if (event.type === "reaction.update") {
          setChatMessages((prev) =>
            prev.map((message) =>
              message.conversationId === event.conversationId &&
              Number(message.serverId ?? message.id) === event.messageId
                ? {
                    ...message,
                    reactions: normalizeMessageReactions(event.reactions),
                  }
                : message
            )
          );
          return;
        }

        if (event.type === "process.update") {
          if (event.conversationId !== activeConversationIdRef.current) {
            return;
          }

          const nextProcesses = event.processes.map(mapProcessResponse);
          syncProcessState(nextProcesses, expandedProcessRef.current);
          if (!isProcessModalOpenRef.current) {
            setDraftProcesses(cloneProcesses(nextProcesses));
            setProcessDraftSnapshot(cloneProcesses(nextProcesses));
          }
          return;
        }

        if (event.type === "presence.snapshot") {
          applyPresenceStates(event.states);
          return;
        }

        if (event.type === "presence.update") {
          applyPresenceStates([
            {
              conversationId: event.conversationId,
              userId: event.userId,
              isOnline: event.isOnline,
            },
          ]);
          return;
        }

        const incomingMessage = event;
        updateLatestServerMessageId(
          incomingMessage.conversationId,
          incomingMessage.serverId
        );
        const partnerUserId = allConversationsRef.current.find(
          (conversation) => conversation.id === incomingMessage.conversationId
        )?.partnerId;
        const isSelfMessage = isCurrentUsersMessage(incomingMessage.senderUserId, {
          currentUserId,
          partnerUserId,
        });
        const nextMessage: ChatMessage = {
          id: incomingMessage.serverId,
          clientId: incomingMessage.clientId || incomingMessage.serverId,
          serverId: incomingMessage.serverId,
          conversationId: incomingMessage.conversationId,
          senderId: isSelfMessage ? CURRENT_USER_ID : String(incomingMessage.senderUserId),
          sender: isSelfMessage ? "나" : incomingMessage.senderName || "상대",
          message: incomingMessage.message,
          time: formatMessageTime(incomingMessage.createdAt),
          createdAt: incomingMessage.createdAt,
          isSelf: isSelfMessage,
          status: isSelfMessage && incomingMessage.readByPartner ? "read" : "sent",
          attachments: normalizeIncomingAttachments(incomingMessage.attachments ?? []),
          reactions: normalizeMessageReactions(incomingMessage.reactions ?? []),
        };

        setChatMessages((prev) => {
          const existingMessageIndex = prev.findIndex(
            (message) => message.clientId === nextMessage.clientId
          );

          if (existingMessageIndex < 0) {
            return [...prev, nextMessage];
          }

          return prev.map((message, index) =>
            index === existingMessageIndex
              ? {
                  ...message,
                  id: nextMessage.id,
                  serverId: nextMessage.serverId,
                  senderId: nextMessage.senderId,
                  sender: nextMessage.sender,
                  message: nextMessage.message,
                  status: nextMessage.status,
                  createdAt: nextMessage.createdAt,
                  time: nextMessage.time,
                  attachments: nextMessage.attachments,
                  reactions: nextMessage.reactions,
                }
              : message
          );
        });

        if (!conversationIds.includes(incomingMessage.conversationId)) {
          setConversationReloadKey((key) => key + 1);
        }

        if (!isSelfMessage && incomingMessage.conversationId !== activeConversationIdRef.current) {
          setUnreadConversationIds((prev) =>
            prev.includes(incomingMessage.conversationId)
              ? prev
              : [...prev, incomingMessage.conversationId]
          );
        }
      },
      onClose: () => {
        setIsSocketConnected(false);
        setTypingConversationId(null);
        partnerTypingConversationIdRef.current = null;
        if (partnerTypingTimeoutRef.current !== null) {
          window.clearTimeout(partnerTypingTimeoutRef.current);
          partnerTypingTimeoutRef.current = null;
        }
        clearOwnTypingTimeout();
        typingConversationRef.current = null;
      },
    });

    messageSocketRef.current = socket;
    socket.connect();

    return () => {
      if (messageSocketRef.current === socket) {
        messageSocketRef.current = null;
      }
      socket.close();
    };
  }, [currentUserId, messageSocketConversationIds]);

  const isPartnerTyping = Boolean(activeConversation && typingConversationId === activeConversation.id);
  const draftValidationMessage = getProcessDraftValidation(draftProcesses);
  const isProcessDraftDirty =
    JSON.stringify(draftProcesses) !== JSON.stringify(processDraftSnapshot);
  const hasUploadingAttachments = pendingAttachments.some(
    (attachment) => attachment.uploadStatus === "uploading"
  );
  const hasFailedAttachments = pendingAttachments.some(
    (attachment) => attachment.uploadStatus === "failed"
  );
  const integrationModalMeta = integrationModalProvider
    ? integrationProviderMeta[integrationModalProvider]
    : null;
  const trimmedIntegrationUrl = integrationUrl.trim();
  const canSubmitIntegrationLink =
    Boolean(trimmedIntegrationUrl) && isValidExternalUrl(trimmedIntegrationUrl);
  const integrationUrlHost = trimmedIntegrationUrl ? getUrlHost(trimmedIntegrationUrl) : "";

  const renderIntegrationProviderIcon = (
    provider: IntegrationProvider,
    className = "size-5"
  ) => {
    if (provider === "figma") return <Figma className={className} />;
    if (provider === "photoshop") return <Image className={className} />;
    if (provider === "pinterest") return <Bookmark className={className} />;
    return <Sparkles className={className} />;
  };

  const getAttachmentConversationPreview = (attachments: MessageAttachment[]) => {
    const imageCount = attachments.filter(isImageAttachment).length;
    const fileCount = attachments.filter(isFileAttachment).length;
    const integration = attachments.find(isIntegrationAttachment);
    const iconCount = attachments.filter((attachment) => attachment.type === "icon").length;

    if (imageCount > 0) {
      return imageCount > 1
        ? `이미지 ${imageCount}장을 보냈습니다`
        : "이미지를 보냈습니다";
    }

    if (fileCount > 0) {
      return fileCount > 1
        ? `파일 ${fileCount}개를 보냈습니다`
        : "파일을 보냈습니다";
    }

    if (integration) {
      return `${integrationProviderMeta[integration.provider].label} 링크를 보냈습니다`;
      return integration.provider === "figma"
        ? "Figma 링크를 보냈습니다"
        : "Adobe 링크를 보냈습니다";
    }

    if (iconCount > 0) {
      return "아이콘을 보냈습니다";
    }

    return "첨부를 보냈습니다";
  };

  const getConversationLastMessagePreview = (conversationId: number) => {
    const lastMessage = [...chatMessages]
      .reverse()
      .find((message) => message.conversationId === conversationId);
    const fallbackConversation = allConversations.find(
      (conversation) => conversation.id === conversationId
    );

    if (!lastMessage) return fallbackConversation?.message ?? "";

    const messageText = typeof lastMessage.message === "string" ? lastMessage.message : "";
    const hasText = Boolean(messageText.trim());
    const hasAttachments = Boolean(lastMessage.attachments?.length);

    if (!hasText && hasAttachments && lastMessage.attachments) {
      return getAttachmentConversationPreview(lastMessage.attachments);
    }

    return messageText || fallbackConversation?.message || "";
  };

  const getConversationUnreadCount = (conversation: Conversation) =>
    unreadConversationIds.includes(conversation.id) ? conversation.unreadCount || 1 : 0;

  const totalUnreadMessageCount = allConversations.reduce(
    (total, conversation) => total + getConversationUnreadCount(conversation),
    0
  );

  const normalizedConversationSearch = conversationSearch.trim().toLowerCase();
  const filteredConversations = allConversations.filter((conversation) => {
    if (!normalizedConversationSearch) return true;

    const preview = getConversationLastMessagePreview(conversation.id);
    return [
      conversation.name,
      conversation.username,
      conversation.profileName,
      conversation.title,
      conversation.role,
      conversation.message,
      preview,
    ].some((value) => value.toLowerCase().includes(normalizedConversationSearch));
  });

  useEffect(() => {
    if (!activeConversation) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.id, activeMessages.length, isPartnerTyping]);

  useEffect(() => {
    if (!activeConversation) return;
    if (clearingUnreadConversationId === activeConversation.id) return;
    const isDesktopLayout =
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 1024px)").matches;

    if (!isDesktopLayout && mobileView === "list") return;
    setUnreadConversationIds(markConversationRead(activeConversation.id));
  }, [activeConversation?.id, clearingUnreadConversationId, mobileView]);

  useEffect(() => {
    writeJsonToStorage(MESSAGE_DRAFTS_STORAGE_KEY, messageDrafts);
  }, [messageDrafts]);

  useEffect(() => {
    writeJsonToStorage(LEFT_CONVERSATIONS_STORAGE_KEY, leftConversationIds);
  }, [leftConversationIds]);

  useEffect(() => {
    if (!activeConversation) {
      setMessageText("");
      return;
    }
    setMessageText(messageDrafts[String(activeConversation.id)] ?? "");
  }, [activeConversation?.id]);

  const toggleTask = (processId: number, taskId: number) => {
    const nextProcesses = processes.map((process) => {
      if (process.id !== processId) return process;

      const tasks = process.tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );

      return {
        ...process,
        status: getProcessStatusFromState(tasks, process.confirmations),
        tasks,
      };
    });

    void persistProcesses(nextProcesses, {
      optimistic: true,
      preferredExpandedId: processId,
    });
  };

  const toggleProcessConfirmation = (
    processId: number,
    role: keyof ProcessConfirmations
  ) => {
    const targetProcess = processes.find((process) => process.id === processId);
    const isConfirming = targetProcess ? !targetProcess.confirmations[role] : false;

    const nextProcesses = processes.map((process) => {
      if (process.id !== processId) return process;

      const confirmations = {
        ...process.confirmations,
        [role]: !process.confirmations[role],
      };

      return {
        ...process,
        confirmations,
        status: getProcessStatusFromState(process.tasks, confirmations),
      };
    });

    const roleLabel = getProcessParticipantButtonTitle(role);
    void persistProcesses(nextProcesses, {
      optimistic: true,
      preferredExpandedId: processId,
      successMessage: isConfirming ? `${roleLabel} 확인이 기록되었습니다.` : undefined,
    });
  };

  const handleCreateProcess = () => {
    const nextDraftProcesses = processCreated
      ? cloneProcesses(processes)
      : createDefaultProcessDraft();
    setDraftProcesses(nextDraftProcesses);
    setProcessDraftSnapshot(cloneProcesses(nextDraftProcesses));
    setActiveTab("process");
    setIsProcessModalOpen(true);
  };

  const requestCloseProcessModal = () => {
    if (
      isProcessDraftDirty &&
      !window.confirm("저장하지 않고 닫을까요? 수정한 프로세스 내용은 반영되지 않습니다.")
    ) {
      return;
    }

    setIsProcessModalOpen(false);
  };

  const updateDraftProcessTitle = (processId: number, title: string) => {
    setDraftProcesses((prev) =>
      prev.map((process) =>
        process.id === processId ? { ...process, title } : process
      )
    );
  };

  const updateDraftTaskText = (processId: number, taskId: number, text: string) => {
    setDraftProcesses((prev) =>
      prev.map((process) =>
        process.id === processId
          ? {
              ...process,
              tasks: process.tasks.map((task) =>
                task.id === taskId ? { ...task, text } : task
              ),
            }
          : process
      )
    );
  };

  const addDraftProcess = () => {
    setDraftProcesses((prev) => {
      const nextProcessId = getNextProcessId(prev);
      const nextTaskId = getNextTaskId(prev);
      return [
        ...prev,
        {
          id: nextProcessId,
          title: `프로세스 ${prev.length + 1}`,
          status: "pending",
          confirmations: createEmptyProcessConfirmations(),
          tasks: [
            {
              id: nextTaskId,
              text: "세부 프로세스 1",
              completed: false,
            },
          ],
        },
      ];
    });
  };

  const removeDraftProcess = (processId: number) => {
    setDraftProcesses((prev) => prev.filter((process) => process.id !== processId));
  };

  const addDraftTask = (processId: number) => {
    setDraftProcesses((prev) => {
      const nextTaskId = getNextTaskId(prev);
      return prev.map((process) =>
        process.id === processId
          ? {
              ...process,
              tasks: [
                ...process.tasks,
                {
                  id: nextTaskId,
                  text: `세부 프로세스 ${process.tasks.length + 1}`,
                  completed: false,
                },
              ],
            }
          : process
      );
    });
  };

  const removeDraftTask = (processId: number, taskId: number) => {
    setDraftProcesses((prev) =>
      prev.map((process) =>
        process.id === processId
          ? {
              ...process,
              tasks: process.tasks.filter((task) => task.id !== taskId),
            }
          : process
      )
    );
  };

  const handleDraftProcessDrop = (targetProcessId: number) => {
    setDraftProcesses((prev) => {
      if (draggingDraftProcessId === null) return prev;

      const fromIndex = prev.findIndex((process) => process.id === draggingDraftProcessId);
      const toIndex = prev.findIndex((process) => process.id === targetProcessId);
      return reorderItems(prev, fromIndex, toIndex);
    });
    setDraggingDraftProcessId(null);
  };

  const handleDraftTaskDrop = (processId: number, targetTaskId: number) => {
    setDraftProcesses((prev) =>
      prev.map((process) => {
        if (
          process.id !== processId ||
          !draggingDraftTask ||
          draggingDraftTask.processId !== processId
        ) {
          return process;
        }

        const fromIndex = process.tasks.findIndex(
          (task) => task.id === draggingDraftTask.taskId
        );
        const toIndex = process.tasks.findIndex((task) => task.id === targetTaskId);

        return {
          ...process,
          tasks: reorderItems(process.tasks, fromIndex, toIndex),
        };
      })
    );
    setDraggingDraftTask(null);
  };

  const applyProcessDraft = async () => {
    if (draftValidationMessage) return;

    const normalizedProcesses = normalizeProcessesForSave(draftProcesses);
    const savedProcesses = await persistProcesses(normalizedProcesses, {
      preferredExpandedId: normalizedProcesses[0]?.id ?? null,
    });

    if (!savedProcesses) return;

    setDraftProcesses(cloneProcesses(savedProcesses));
    setProcessDraftSnapshot(cloneProcesses(savedProcesses));
    setActiveTab("process");
    setIsProcessModalOpen(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    return;

    const legacyNormalizedProcesses = draftProcesses.map((process) => {
      const tasks = process.tasks.map((task) => ({
        ...task,
        text: task.text.trim(),
      }));

      return {
        ...process,
        title: process.title.trim(),
        confirmations: process.confirmations ?? createEmptyProcessConfirmations(),
        status: getProcessStatusFromState(
          tasks,
          process.confirmations ?? createEmptyProcessConfirmations()
        ),
        tasks,
      };
    });

    setProcesses(legacyNormalizedProcesses);
    setProcessCreated(true);
    setActiveTab("process");
    setExpandedProcess(legacyNormalizedProcesses[0]?.id ?? null);
    setProcessDraftSnapshot(cloneProcesses(legacyNormalizedProcesses));
    setIsProcessModalOpen(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const getProgressPercentage = (tasks: ProcessTask[]) => {
    if (tasks.length === 0) return 0;
    const completedCount = tasks.filter(t => t.completed).length;
    return Math.round((completedCount / tasks.length) * 100);
  };

  const getTotalProgress = () => {
    if (processes.length === 0) return 0;
    return Math.round(
      (processes.reduce((acc, p) => acc + getProgressPercentage(p.tasks), 0) /
        processes.length)
    );
  };

  const getCurrentParticipantRoleLabel = () =>
    currentUser?.role === "client" ? "클라이언트" : "디자이너";

  const getPartnerParticipantRoleLabel = () =>
    activeConversation?.partnerRole === "CLIENT" ? "클라이언트" : "디자이너";

  const getCurrentParticipantName = () =>
    currentUser?.nickname?.trim() || currentUser?.name?.trim() || "나";

  const getPartnerParticipantName = () =>
    activeConversation?.profileName?.trim() || activeConversation?.name?.trim() || "상대방";

  const getShortParticipantName = (name: string, maxLength = 8) =>
    name.length > maxLength ? `${name.slice(0, maxLength)}…` : name;

  const normalizedCurrentParticipantUserId = toNumericUserId(currentUserId);
  const normalizedPartnerParticipantUserId = toNumericUserId(activeConversation?.partnerId);
  const currentProcessConfirmationRole: keyof ProcessConfirmations =
    currentUser?.role === "client" && activeConversation?.partnerRole !== "CLIENT"
      ? "client"
      : currentUser?.role === "designer" && activeConversation?.partnerRole !== "DESIGNER"
        ? "designer"
        : normalizedCurrentParticipantUserId !== null && normalizedPartnerParticipantUserId !== null
          ? normalizedCurrentParticipantUserId <= normalizedPartnerParticipantUserId
            ? "designer"
            : "client"
          : "designer";
  const partnerProcessConfirmationRole: keyof ProcessConfirmations =
    currentProcessConfirmationRole === "designer" ? "client" : "designer";

  const getProcessParticipantRoleLabel = (
    role: keyof ProcessConfirmations
  ) =>
    role === currentProcessConfirmationRole
      ? getCurrentParticipantRoleLabel()
      : getPartnerParticipantRoleLabel();

  const getProcessParticipantDisplayLabel = (
    role: keyof ProcessConfirmations
  ) =>
    role === currentProcessConfirmationRole
      ? `${getCurrentParticipantName()} (${getCurrentParticipantRoleLabel()})`
      : `${getPartnerParticipantName()} (${getPartnerParticipantRoleLabel()})`;

  const getProcessParticipantButtonTitle = (role: keyof ProcessConfirmations) =>
    `${getProcessParticipantRoleLabel(role)} 확인`;

  const getProcessParticipantButtonSubtitle = (role: keyof ProcessConfirmations) =>
    role === currentProcessConfirmationRole
      ? getShortParticipantName(getCurrentParticipantName())
      : getShortParticipantName(getPartnerParticipantName());

  const isProcessConfirmationEditable = (role: keyof ProcessConfirmations) =>
    role === currentProcessConfirmationRole;

  const getConfirmationLabel = (
    role: keyof ProcessConfirmations,
    confirmations: ProcessConfirmations
  ) => {
    const roleLabel = getProcessParticipantDisplayLabel(role);
    return confirmations[role] ? `${roleLabel} 확인 완료` : `${roleLabel} 대기`;
  };

  const getProcessApprovalSummary = (process: ProjectProcess, progress: number) =>
    `작업 ${progress}% · ${
      process.confirmations.designer ? "디자이너 완료" : "디자이너 대기"
    } · ${
      process.confirmations.client ? "클라이언트 완료" : "클라이언트 대기"
    }`;

  const getProcessApprovalBadge = (process: ProjectProcess, progress: number) => {
    if (progress === 100 && hasBothConfirmations(process.confirmations)) {
      return {
        label: "승인 완료",
        className: isNight ? "bg-[#00C9A7]/15 text-[#00C9A7] border-[#00C9A7]/30" : "bg-[#DDF8EC] text-[#007E68] border-[#00C9A7]/40",
      };
    }

    if (progress === 100) {
      return {
        label: "완료 대기중",
        className: isNight ? "bg-[#FFB36B]/15 text-[#FFB36B] border-[#FFB36B]/30" : "bg-[#FFF4E8] text-[#B65318] border-[#FFB36B]/50",
      };
    }

    if (progress > 0) {
      return {
        label: "작업 진행 중",
        className: isNight ? "bg-[#FF5C3A]/15 text-[#FF8A6E] border-[#FF5C3A]/30" : "bg-[#FFF1ED] text-[#D64928] border-[#FF5C3A]/30",
      };
    }

    return {
      label: "시작 전",
      className: isNight ? "bg-white/10 text-white/50 border-white/10" : "bg-gray-100 text-gray-600 border-gray-200",
    };
  };

  const showProcessToast = (message: string) => {
    const toastId = Date.now();
    setProcessToast({ id: toastId, message });
    window.setTimeout(() => {
      setProcessToast((currentToast) =>
        currentToast?.id === toastId ? null : currentToast
      );
    }, 2200);
  };

  const areAllProcessesCompleted = () =>
    processes.length > 0 &&
    processes.every((process) => process.status === "completed");

  const handleCompleteWork = () => {
    if (!activeConversation) return;
    const revieweeId = Number(activeConversation.partnerId);
    const profileKey = activeConversation.username || activeConversation.partnerId;
    navigate(
      `/review/write?client=${encodeURIComponent(activeConversation.name)}&project=${encodeURIComponent(activeConversation.role)}&conversationId=${activeConversation.id}&revieweeId=${encodeURIComponent(String(revieweeId))}&profileKey=${encodeURIComponent(profileKey)}`,
      {
        state: {
          conversationId: activeConversation.id,
          revieweeId,
          profileKey,
          clientName: activeConversation.name,
          projectName: activeConversation.role,
        },
      }
    );
  };

  const handleOpenProfile = () => {
    if (!activeConversation) return;
    navigate(`/profile/${encodeURIComponent(activeConversation.username)}`);
  };

  const handleSelectConversation = (conversationId: number) => {
    stopOwnTyping();

    if (unreadConversationIds.includes(conversationId)) {
      setClearingUnreadConversationId(conversationId);
      window.setTimeout(() => {
        setUnreadConversationIds(markConversationRead(conversationId));
        setClearingUnreadConversationId((currentId) =>
          currentId === conversationId ? null : currentId
        );
      }, 180);
    } else {
      setUnreadConversationIds(markConversationRead(conversationId));
    }
    setActiveConversationId(conversationId);
    setSearchParams({ conversationId: String(conversationId) }, { replace: true });
    setActiveTab("profile");
    setMobileView("chat");
    setIsAttachMenuOpen(false);
    setIsIconPickerOpen(false);
    setReactionPickerMessageId(null);
    setTypingConversationId(null);
  };

  const handleLeaveConversation = async () => {
    if (!activeConversation) return;
    stopOwnTyping(activeConversation.id);
    const conversationId = activeConversation.id;
    const shouldLeave = window.confirm(
      `${activeConversation.name} 대화방에서 나갈까요? 메시지 목록에서 이 대화가 사라집니다.`
    );

    if (!shouldLeave) return;

    const nextLeftConversationIds = Array.from(
      new Set([...leftConversationIds, conversationId])
    );
    const nextConversations = rawConversations.filter(
      (conversation) => !nextLeftConversationIds.includes(conversation.id)
    );
    const nextConversation = nextConversations[0];

    setLeftConversationIds(nextLeftConversationIds);
    setUnreadConversationIds(markConversationRead(conversationId));
    setMessageDrafts((prev) => {
      const nextDrafts = { ...prev };
      delete nextDrafts[String(conversationId)];
      return nextDrafts;
    });
    setPendingAttachments([]);
    setIsAttachMenuOpen(false);
    setIsIconPickerOpen(false);
    setReactionPickerMessageId(null);
    setTypingConversationId(null);
    setActiveTab("profile");

    if (nextConversation) {
      setActiveConversationId(nextConversation.id);
      setMobileView("chat");
    } else {
      setMobileView("list");
    }
  };

  const processCompletionGuideText = "작업이 끝나면 양쪽 모두 확인해 주세요.";

  const handleDeleteConversation = async () => {
    if (!activeConversation) return;
    stopOwnTyping(activeConversation.id);

    const conversationId = activeConversation.id;
    const shouldDelete = window.confirm(
      "정말 채팅창을 삭제하시겠어요? 모든 데이터가 사라질 수 있습니다."
    );

    if (!shouldDelete) return;

    try {
      await deleteMessageConversationApi(conversationId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "채팅창을 삭제하지 못했습니다.");
      return;
    }

    const nextLeftConversationIds = Array.from(
      new Set([...leftConversationIds, conversationId])
    );
    const nextConversations = rawConversations.filter(
      (conversation) => !nextLeftConversationIds.includes(conversation.id)
    );
    const nextConversation = nextConversations[0];

    setLeftConversationIds(nextLeftConversationIds);
    setUnreadConversationIds(markConversationRead(conversationId));
    setMessageDrafts((prev) => {
      const nextDrafts = { ...prev };
      delete nextDrafts[String(conversationId)];
      return nextDrafts;
    });
    setPendingAttachments([]);
    setIsAttachMenuOpen(false);
    setIsIconPickerOpen(false);
    setReactionPickerMessageId(null);
    setTypingConversationId(null);
    setActiveTab("profile");
    setConversationReloadKey((current) => current + 1);

    if (nextConversation) {
      setActiveConversationId(nextConversation.id);
      setMobileView("chat");
    } else {
      setMobileView("list");
    }
  };

  const updateMessageText = (value: string) => {
    if (!activeConversation) return;
    debugMessageTyping("updateMessageText", {
      conversationId: activeConversation.id,
      valueLength: value.length,
      hasTrimmedValue: Boolean(value.trim()),
    });
    setMessageText(value);
    setMessageDrafts((prev) => ({
      ...prev,
      [String(activeConversation.id)]: value,
    }));

    const conversationId = activeConversation.id;
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      if (isMessageComposingRef.current) {
        startOwnTyping(conversationId);
        return;
      }

      if (typingConversationRef.current === conversationId) {
        stopOwnTyping(conversationId);
      } else {
        clearOwnTypingTimeout();
      }
      return;
    }

    startOwnTyping(conversationId);
  };

  const loadAssistantSuggestions = async (
    goal: MessageAssistantGoal,
    options?: {
      silent?: boolean;
      force?: boolean;
    },
  ) => {
    if (!activeConversation) return;

    const contextKey = [
      activeConversation.id,
      goal,
      messageText,
      assistantMessageSignature,
      assistantProcessSignature,
    ].join("::");

    if (options?.silent && !options.force && assistantLastLoadedContextRef.current === contextKey) {
      return;
    }

    assistantLastLoadedContextRef.current = contextKey;

    const requestId = assistantRequestIdRef.current + 1;
    assistantRequestIdRef.current = requestId;

    if (!options?.silent) {
      setAssistantGoal(goal);
      setAssistantError(null);
      setIsAssistantLoading(true);
    }

    try {
      const response = await getConversationAssistantSuggestionsApi(activeConversation.id, {
        goal,
        draft: messageText,
      });
      if (assistantRequestIdRef.current !== requestId) {
        return;
      }
      if (!response.usedAi) {
        setAssistantSuggestions([]);
        setAssistantUsedAi(false);
        setAssistantError("AI 응답을 받지 못했어요. Gemini API 상태를 확인한 뒤 다시 시도해주세요.");
        return;
      }

      setAssistantSuggestions(response.suggestions);
      setAssistantUsedAi(true);
      setAssistantError(null);
    } catch (error) {
      if (assistantRequestIdRef.current !== requestId) {
        return;
      }
      setAssistantSuggestions([]);
      setAssistantUsedAi(false);
      setAssistantError(
        error instanceof Error
          ? error.message
          : "추천 문구를 불러오지 못했어요.",
      );
    } finally {
      if (assistantRequestIdRef.current === requestId) {
        setIsAssistantLoading(false);
      }
    }
  };

  const handleLoadAssistantSuggestions = async (goal: MessageAssistantGoal) => {
    setIsAssistantExpanded(true);
    setAssistantGoal(goal);
    setAssistantError(null);
    setIsAssistantLoading(true);
    setHasAssistantRequested(true);
    await loadAssistantSuggestions(goal);
  };

  const handleSelectAssistantGoal = (goal: MessageAssistantGoal) => {
    if (assistantGoal === goal) {
      return;
    }

    setAssistantGoal(goal);
    setAssistantSuggestions([]);
    setAssistantUsedAi(false);
    setAssistantError(null);
  };

  const handleRefreshAssistantSuggestions = async () => {
    if (!activeConversation || isAssistantLoading) {
      return;
    }

    setIsAssistantExpanded(true);
    setHasAssistantRequested(true);
    await loadAssistantSuggestions(assistantGoal);
  };

  const handleApplyAssistantSuggestion = (suggestion: string) => {
    updateMessageText(normalizeAssistantSuggestionText(suggestion));
    messageInputRef.current?.focus();
  };

  const verifySentMessageFromHistory = async (
    conversationId: number,
    clientId: string,
    partnerUserId: string
  ) => {
    const messageResponses = await getConversationMessagesApi(conversationId);
    syncLatestServerMessageIdFromResponses(conversationId, messageResponses);
    const matchedMessage = messageResponses.find(
      (message) => message.clientId === clientId || String(message.id) === clientId
    );

    if (!matchedMessage) {
      return null;
    }

    return mapChatMessageResponse(matchedMessage, {
      currentUserId,
      partnerUserId,
    });
  };

  const recoverFailedOutgoingMessage = async (params: {
    conversationId: number;
    clientId: string;
    partnerUserId: string;
    message: string;
    attachments: ReturnType<typeof buildOutgoingAttachmentsPayload>;
  }) => {
    const retryDelays = [0, 350, 900, 1800];

    for (const delayMs of retryDelays) {
      if (delayMs > 0) {
        await wait(delayMs);
      }

      const verifiedMessage = await verifySentMessageFromHistory(
        params.conversationId,
        params.clientId,
        params.partnerUserId
      );

      if (verifiedMessage) {
        return verifiedMessage;
      }
    }

    try {
      const savedMessage = await sendConversationMessageApi(params.conversationId, {
        clientId: params.clientId,
        message: params.message,
        attachments: params.attachments,
      });

      return mapChatMessageResponse(savedMessage, {
        currentUserId,
        partnerUserId: params.partnerUserId,
      });
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!activeConversation || !latestActiveMessage) {
      return;
    }

    if (assistantInitialConversationLoadRef.current === activeConversation.id) {
      return;
    }

    assistantInitialConversationLoadRef.current = activeConversation.id;

    if (latestActiveMessage.isSelf) {
      return;
    }

    setAssistantGoal("reply");
    setAssistantError(null);
    setIsAssistantExpanded(true);
    setHasAssistantRequested(true);
    void loadAssistantSuggestions("reply", { force: true });
  }, [activeConversation, latestActiveMessage]);

  const getCurrentTime = () => {
    return new Intl.DateTimeFormat("ko-KR", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date());
  };

  const uploadPendingMessageAttachments = async (
    conversationId: number,
    files: File[],
    attachmentIds: string[],
  ) => {
    try {
      const response = await uploadMessageAttachmentsApi(conversationId, files);

      setPendingAttachments((prev) =>
        prev.map((attachment) => {
          const attachmentIndex = attachmentIds.indexOf(attachment.id);
          if (attachmentIndex < 0) {
            return attachment;
          }

          const uploadedAttachment = response.attachments[attachmentIndex];
          if (!uploadedAttachment) {
            return {
              ...attachment,
              uploadStatus: "failed",
            };
          }

          if (attachment.type === "image" && uploadedAttachment.type === "image") {
            return {
              ...attachment,
              src: uploadedAttachment.url,
              uploadedUrl: uploadedAttachment.url,
              mimeType: uploadedAttachment.contentType,
              size: uploadedAttachment.size,
              uploadStatus: "ready",
            };
          }

          if (attachment.type === "file" && uploadedAttachment.type === "file") {
            return {
              ...attachment,
              url: uploadedAttachment.url,
              uploadedUrl: uploadedAttachment.url,
              mimeType: uploadedAttachment.contentType,
              size: uploadedAttachment.size,
              uploadStatus: "ready",
            };
          }

          return {
            ...attachment,
            uploadStatus: "failed",
          };
        }),
      );
    } catch {
      setPendingAttachments((prev) =>
        prev.map((attachment) =>
          attachmentIds.includes(attachment.id)
            ? { ...attachment, uploadStatus: "failed" }
            : attachment,
        ),
      );
    }
  };

  const markAttachmentReady = (attachmentId: string, delayMs = 0) => {
    window.setTimeout(() => {
      setPendingAttachments((prev) =>
        prev.map((attachment) =>
          attachment.id === attachmentId
            ? { ...attachment, uploadStatus: "ready" }
            : attachment
        )
      );
    }, delayMs);
  };

  const handleSendMessage = () => {
    if (!activeConversation) return;
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage && pendingAttachments.length === 0) return;
    if (hasUploadingAttachments || hasFailedAttachments) return;
    if (trimmedMessage.length > MAX_CHAT_MESSAGE_LENGTH) {
      toast.error("메시지는 4000자 이하로 전송할 수 있어요.");
      return;
    }

    stopOwnTyping(activeConversation.id);

    const clientId = createClientId("msg");
    const serializedAttachments = buildOutgoingAttachmentsPayload(pendingAttachments);
    const outgoingMessage: ChatMessage = {
      id: clientId,
      clientId,
      conversationId: activeConversation.id,
      senderId: CURRENT_USER_ID,
      sender: "나",
      message: trimmedMessage,
      time: getCurrentTime(),
      createdAt: new Date().toISOString(),
      isSelf: true,
      status: "sending",
      attachments: [...pendingAttachments],
    };

    setChatMessages((prev) => [...prev, outgoingMessage]);
    setMessageText("");
    setMessageDrafts((prev) => {
      const nextDrafts = { ...prev };
      delete nextDrafts[String(activeConversation.id)];
      return nextDrafts;
    });
    setPendingAttachments([]);
    setIsIconPickerOpen(false);
    setIsAttachMenuOpen(false);

    const activeConversationIdAtSend = activeConversation.id;
    const activePartnerUserIdAtSend = activeConversation.partnerId;

    const sendMessageWithRestFallback = () =>
      sendConversationMessageApi(outgoingMessage.conversationId, {
        clientId: outgoingMessage.clientId,
        message: outgoingMessage.message,
        attachments: serializedAttachments,
      }).then((savedMessage) => ({
        serverId: String(savedMessage.id),
        createdAt: savedMessage.createdAt,
      }));

    const sendMessageToServer = messageSocketRef.current?.isOpen()
      ? messageSocketRef.current
          .sendMessage({
            clientId: outgoingMessage.clientId,
            conversationId: outgoingMessage.conversationId,
            message: outgoingMessage.message,
            attachments: serializedAttachments,
            createdAt: outgoingMessage.createdAt,
          })
          .catch(() => sendMessageWithRestFallback())
      : sendMessageWithRestFallback();

    sendMessageToServer
      .then(({ serverId, createdAt }) => {
        updateLatestServerMessageId(activeConversationIdAtSend, serverId);
        setChatMessages((prev) =>
          prev.map((message) =>
            message.clientId === clientId
              ? {
                  ...message,
                  id: serverId,
                  serverId,
                  status: "sent",
                  createdAt: createdAt ?? message.createdAt,
                  time: createdAt ? formatMessageTime(createdAt) : message.time,
                }
              : message
          )
        );
        setConversationReloadKey((key) => key + 1);
      })
      .catch(() => {
        void recoverFailedOutgoingMessage({
          conversationId: activeConversationIdAtSend,
          clientId,
          partnerUserId: activePartnerUserIdAtSend,
          message: outgoingMessage.message,
          attachments: serializedAttachments,
        })
          .then((verifiedMessage) => {
            if (!verifiedMessage) {
              setChatMessages((prev) =>
                prev.map((message) =>
                  message.clientId === clientId
                    ? { ...message, status: "failed" }
                    : message
                )
              );
              return;
            }

            setChatMessages((prev) =>
              prev.map((message) =>
                message.clientId === clientId
                  ? {
                      ...message,
                      ...verifiedMessage,
                      clientId,
                    }
                  : message
              )
            );
            updateLatestServerMessageId(
              activeConversationIdAtSend,
              verifiedMessage.serverId ?? verifiedMessage.id
            );
            setConversationReloadKey((key) => key + 1);
          })
          .catch(() => {
            setChatMessages((prev) =>
              prev.map((message) =>
                message.clientId === clientId
                  ? { ...message, status: "failed" }
                  : message
              )
            );
          });
      });
  };

  const handleMessageKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      activeConversation &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      (event.key.length === 1 || event.key === "Backspace" || event.key === "Delete")
    ) {
      startOwnTyping(activeConversation.id);
    }

    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleMessageCompositionStart = () => {
    if (!activeConversation) return;
    isMessageComposingRef.current = true;
    startOwnTyping(activeConversation.id);
  };

  const handleMessageCompositionUpdate = () => {
    if (!activeConversation) return;
    isMessageComposingRef.current = true;
    startOwnTyping(activeConversation.id);
  };

  const handleMessageCompositionEnd = (
    event: React.CompositionEvent<HTMLInputElement>
  ) => {
    if (!activeConversation) return;
    isMessageComposingRef.current = false;
    updateMessageText(event.currentTarget.value);
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith("image/")
    );
    event.target.value = "";

    if (!activeConversation || files.length === 0) return;

    const previewSources = await Promise.all(
      files.map((file) => readFileAsDataUrl(file).catch(() => ""))
    );
    const attachments = files.map((file, index) => ({
      id: createClientId(`image-${index}`),
      type: "image" as const,
      src: previewSources[index] || "",
      name: file.name,
      size: file.size,
      mimeType: file.type || "application/octet-stream",
      uploadStatus: "uploading" as const,
    }));

    setPendingAttachments((prev) => [...prev, ...attachments]);
    void uploadPendingMessageAttachments(
      activeConversation.id,
      files,
      attachments.map((attachment) => attachment.id),
    );
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!activeConversation || files.length === 0) return;

    const attachments = files.map((file) => ({
      id: createClientId("file"),
      type: "file" as const,
      name: file.name,
      size: file.size,
      mimeType: file.type || "application/octet-stream",
      uploadStatus: "uploading" as const,
    }));

    setPendingAttachments((prev) => [...prev, ...attachments]);
    void uploadPendingMessageAttachments(
      activeConversation.id,
      files,
      attachments.map((attachment) => attachment.id),
    );
    setIsAttachMenuOpen(false);
  };

  const handleAttachIcon = (icon: string) => {
    setPendingAttachments((prev) => [
      ...prev,
      {
        id: createClientId("icon"),
        type: "icon",
        value: icon,
        name: "메시지 이모티콘",
        uploadStatus: "ready",
      },
    ]);
    setIsIconPickerOpen(false);
  };

  const handleAttachIntegration = (provider: IntegrationProvider) => {
    setIntegrationModalProvider(provider);
    setIntegrationUrl("");
    setIntegrationUrlTouched(false);
    setIsAttachMenuOpen(false);
    return;

    const label = provider === "figma" ? "Figma" : "Adobe";
    const url = window.prompt(`${label} 공유 링크를 붙여넣어 주세요.`);
    if (!url?.trim()) return;
    const attachmentId = createClientId(provider);
    const normalizedUrl = normalizeExternalUrl(url.trim());
    const preview = getIntegrationPreview(provider, normalizedUrl);

    setPendingAttachments((prev) => [
      ...prev,
      {
        id: attachmentId,
        type: "integration",
        provider,
        url: normalizedUrl,
        name: `${label} 작업 링크`,
        uploadStatus: "uploading",
        ...preview,
      },
    ]);
    markAttachmentReady(attachmentId, 620);
    setIsAttachMenuOpen(false);
  };

  const closeIntegrationModal = () => {
    setIntegrationModalProvider(null);
    setIntegrationUrl("");
    setIntegrationUrlTouched(false);
  };

  const submitIntegrationAttachment = () => {
    if (!integrationModalProvider) return;
    setIntegrationUrlTouched(true);
    if (!canSubmitIntegrationLink) return;

    const provider = integrationModalProvider;
    const label = integrationProviderMeta[provider].label;
    const attachmentId = createClientId(provider);
    const normalizedUrl = normalizeExternalUrl(trimmedIntegrationUrl);
    const preview = getIntegrationPreview(provider, normalizedUrl);

    setPendingAttachments((prev) => [
      ...prev,
      {
        id: attachmentId,
        type: "integration",
        provider,
        url: normalizedUrl,
        name: `${label} 작업 링크`,
        uploadStatus: "ready",
        ...preview,
      },
    ]);
    closeIntegrationModal();
  };

  const handleToggleReaction = async (messageClientId: string, emoji: string) => {
    const targetMessage = chatMessages.find(
      (message) => message.clientId === messageClientId
    );
    const targetReaction = targetMessage?.reactions?.find(
      (reaction) => reaction.emoji === emoji
    );
    const shouldBounceCount = !targetReaction || !targetReaction.reactedByMe;
    const messageId = Number(targetMessage?.serverId ?? targetMessage?.id);

    setReactionAnimation({
      messageClientId,
      emoji,
      key: Date.now(),
      shouldBounceCount,
    });
    setReactionPickerMessageId(null);

    if (!activeConversation || !Number.isFinite(messageId)) return;

    try {
      const response = await toggleMessageReactionApi(activeConversation.id, messageId, emoji);
      setChatMessages((prev) =>
        prev.map((message) =>
          message.clientId === messageClientId || Number(message.serverId ?? message.id) === response.messageId
              ? {
                  ...message,
                  reactions: normalizeMessageReactions(response.reactions),
                }
              : message
        )
      );
    } catch (error) {
      setConversationError(
        error instanceof Error ? error.message : "메시지 반응을 저장하지 못했습니다."
      );
    }
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    setPendingAttachments((prev) =>
      prev.filter((attachment) => attachment.id !== attachmentId)
    );
  };

  const renderAttachmentStatus = (
    attachment: MessageAttachment,
    showReady = false
  ) => {
    if (!attachment.uploadStatus || (!showReady && attachment.uploadStatus === "ready")) {
      return null;
    }

    const isUploading = attachment.uploadStatus === "uploading";
    const isFailed = attachment.uploadStatus === "failed";

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
          isFailed
            ? isNight ? "bg-[#3a1a14] text-[#FF8A6E]" : "bg-[#FFF1ED] text-[#D84325]"
            : isUploading
              ? isNight ? "bg-[#2e1e0e] text-[#FFB36B]" : "bg-[#FFF4E8] text-[#B65318]"
              : isNight ? "bg-[#0e2e28] text-[#00C9A7]" : "bg-[#E8FBF7] text-[#007E68]"
        }`}
      >
        {isUploading ? (
          <Clock className="size-3 animate-spin" />
        ) : isFailed ? (
          <XCircle className="size-3" />
        ) : (
          <CheckCircle className="size-3" />
        )}
        {getAttachmentStatusLabel(attachment.uploadStatus)}
      </span>
    );
  };

  const renderImageAttachmentGallery = (
    images: ImageAttachment[],
    compact = false,
    removable = false
  ) => {
    if (images.length === 0) return null;

    const visibleImages = images.slice(0, 4);
    const hiddenCount = Math.max(0, images.length - visibleImages.length);
    const galleryClass =
      images.length === 1
        ? compact
          ? "grid-cols-1"
          : "grid-cols-1 max-w-72"
        : compact
          ? "grid-cols-4"
          : "grid-cols-2 max-w-72";
    const imageClass =
      images.length === 1
        ? compact
          ? "size-20"
          : "max-h-52 w-full"
        : compact
          ? "size-16"
          : "size-28";

    return (
      <div className="space-y-1.5">
        {images.length > 1 && (
          <div className={`flex items-center gap-2 text-[10px] font-bold ${isNight ? "text-white/40" : "text-[#2D5A4D]/70"}`}>
            <Image className="size-3.5" />
            이미지 {images.length}장
          </div>
        )}
        <div className={`grid gap-1.5 ${galleryClass}`}>
          {visibleImages.map((attachment, index) => (
            <div key={attachment.id} className="relative">
              <button
                type="button"
                onClick={() =>
                  setSelectedImage({ src: attachment.src, name: attachment.name })
                }
                className={`relative overflow-hidden rounded-lg border shadow-sm ${isNight ? "border-white/10 bg-[#1a2035]" : "border-white/60 bg-white"} ${imageClass}`}
                aria-label={`${attachment.name} 크게 보기`}
              >
                <ImageWithFallback
                  src={attachment.src}
                  alt={attachment.name}
                  className="size-full object-cover transition-transform hover:scale-105"
                />
                {hiddenCount > 0 && index === visibleImages.length - 1 && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-sm font-bold text-white">
                    +{hiddenCount}
                  </span>
                )}
                {attachment.uploadStatus === "uploading" && (
                  <span className="absolute inset-0 flex items-center justify-center gap-1 bg-black/45 text-[10px] font-bold text-white">
                    <Clock className="size-3 animate-spin" />
                    첨부 중
                  </span>
                )}
              </button>
              {removable && (
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(attachment.id)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                  aria-label={`${attachment.name} 제거`}
                >
                  <XCircle className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFileAttachmentCard = (
    attachment: FileAttachment,
    removable = false
  ) => {
    const meta = getFileAttachmentMeta(attachment, isNight);
    const cardContent = (
      <>
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-[10px] font-black ${meta.className}`}
        >
          {meta.label}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-xs font-semibold ${isNight ? "text-white" : ""}`}>{attachment.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className={`text-[10px] ${isNight ? "text-white/50" : "text-gray-500"}`}>
              {formatFileSize(attachment.size)}
            </span>
            {renderAttachmentStatus(attachment)}
          </div>
        </div>
      </>
    );

    if (!removable && attachment.url) {
      return (
        <a
          key={attachment.id}
          href={attachment.url}
          target="_blank"
          rel="noreferrer"
          className={`relative flex max-w-72 items-center gap-2 rounded-lg border px-3 py-2 pr-8 text-left shadow-sm transition-all hover:-translate-y-0.5 ${isNight ? "border-white/10 bg-[#1a2035] hover:bg-[#1e2540]" : "border-white/70 bg-white/80 hover:bg-white"}`}
        >
          {cardContent}
        </a>
      );
    }

    return (
      <div
        key={attachment.id}
        className={`relative flex max-w-72 items-center gap-2 rounded-lg border px-3 py-2 pr-8 text-left shadow-sm ${isNight ? "border-white/10 bg-[#1a2035]" : "border-white/70 bg-white/80"}`}
      >
        {cardContent}
        {removable && (
          <button
            type="button"
            onClick={() => handleRemoveAttachment(attachment.id)}
            className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-0.5 text-white"
            aria-label={`${attachment.name} 제거`}
          >
            <XCircle className="size-4" />
          </button>
        )}
      </div>
    );
  };

  const renderIntegrationAttachmentCard = (
    attachment: IntegrationAttachment,
    removable = false
  ) => {
    const meta = getIntegrationMeta(attachment.provider, isNight);
    const cardClass = `relative flex max-w-80 gap-3 rounded-lg border p-3 pr-9 text-left shadow-sm transition-all ${
      removable ? "" : isNight ? "hover:-translate-y-0.5 hover:bg-[#1e2540]" : "hover:-translate-y-0.5 hover:bg-white"
    } ${meta.borderClassName} ${isNight ? "bg-[#1a2035]" : "bg-white/85"}`;
    const cardContent = (
      <>
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${meta.iconClassName}`}
        >
          {renderIntegrationProviderIcon(attachment.provider)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-1.5">
            <p className={`truncate text-xs font-bold ${isNight ? "text-white" : "text-[#12382D]"}`}>
              {attachment.previewTitle ?? attachment.name}
            </p>
            <ExternalLink className={`size-3.5 shrink-0 ${isNight ? "text-white/30" : "text-gray-400"}`} />
          </div>
          <p className={`line-clamp-2 text-[11px] leading-snug ${isNight ? "text-white/50" : "text-gray-600"}`}>
            {attachment.previewDescription}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className={`truncate rounded-full px-2 py-0.5 text-[10px] font-semibold ${isNight ? "bg-white/10 text-white/50" : "bg-[#F7F7F5] text-gray-500"}`}>
              {attachment.host ?? getUrlHost(attachment.url)}
            </span>
            {renderAttachmentStatus(attachment)}
          </div>
        </div>
      </>
    );

    if (removable) {
      return (
        <div key={attachment.id} className={cardClass}>
          {cardContent}
          <button
            type="button"
            onClick={() => handleRemoveAttachment(attachment.id)}
            className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-0.5 text-white"
            aria-label={`${attachment.name} 제거`}
          >
            <XCircle className="size-4" />
          </button>
        </div>
      );
    }

    return (
      <a
        key={attachment.id}
        href={attachment.url}
        target="_blank"
        rel="noreferrer"
        className={cardClass}
      >
        {cardContent}
      </a>
    );
  };

  const closeEndProcessModal = () => {
    setIsEndProcessModalOpen(false);
    setEndProcessModalStep("info");
  };

  const handleEndWork = () => {
    setEndProcessModalStep("info");
    setIsEndProcessModalOpen(true);
  };

  const handleConfirmEndProcess = async () => {
    if (!activeConversation || isEndingProcess) return;
    setIsEndingProcess(true);
    try {
      const saved = await persistProcesses([], {
        optimistic: true,
        preferredExpandedId: null,
        successMessage: "작업 프로세스를 종료했습니다.",
      });
      if (saved !== null) {
        closeEndProcessModal();
        setIsProcessModalOpen(false);
        setDraftProcesses(createDefaultProcessDraft());
        setProcessDraftSnapshot(createDefaultProcessDraft());
      }
    } finally {
      setIsEndingProcess(false);
    }
  };

  const getStatusColor = (status: ProcessStatus) => {
    switch (status) {
      case "completed": return "bg-[#00C9A7]";
      case "in-progress": return "bg-[#FF5C3A]";
      default: return "bg-gray-300";
    }
  };

  const getStatusLabel = (status: ProcessStatus) => {
    switch (status) {
      case "completed": return "완료";
      case "in-progress": return "진행 중";
      default: return "대기";
    }
  };

  const getDeliveryStatusLabel = (status: MessageDeliveryStatus) => {
    switch (status) {
      case "sending": return "전송 중";
      case "sent": return "전송 완료";
      case "read": return "읽음";
      case "failed": return "전송 실패";
      default: return "";
    }
  };

  const getDeliveryStatusClass = (status: MessageDeliveryStatus) => {
    switch (status) {
      case "sending": return isNight ? "text-white/40" : "text-gray-500";
      case "sent": return "text-[#00A88C]";
      case "read": return isNight ? "text-[#00C9A7]" : "text-[#007E68]";
      case "failed": return "text-[#FF5C3A]";
      default: return isNight ? "text-white/40" : "text-gray-500";
    }
  };

  const renderDeliveryStatusIcon = (status: MessageDeliveryStatus) => {
    switch (status) {
      case "sending":
        return <Clock className="size-3.5 animate-spin" />;
      case "sent":
        return <Check className="size-3.5" />;
      case "read":
        return <CheckCheck className="size-3.5" />;
      case "failed":
        return <XCircle className="size-3.5" />;
      default:
        return null;
    }
  };

  if (!activeConversation) {
    if (isConversationsLoading) {
      return (
        <div className={`min-h-screen transition-colors duration-700 ${isNight ? "bg-[#0C1222]" : "bg-[#F7F7F5]"}`}>
          <Navigation />
          <main className="pickxel-animate-page-in mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-5xl items-center justify-center px-6 py-16">
            <div className={`flex flex-col items-center gap-4 ${isNight ? "text-white/50" : "text-gray-500"}`}>
              <div className="size-10 animate-spin rounded-full border-4 border-[#00C9A7] border-t-transparent" />
              <p className="text-sm font-medium">대화를 불러오는 중입니다...</p>
            </div>
          </main>
        </div>
      );
    }

    return (
      <div className={`min-h-screen transition-colors duration-700 ${isNight ? "bg-[#0C1222]" : "bg-[#F7F7F5]"}`}>
        <Navigation />
        <main className="pickxel-animate-page-in mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-5xl items-center justify-center px-6 py-16">
          <section className={`w-full rounded-lg border border-dashed p-10 text-center shadow-sm ${isNight ? "border-white/10 bg-[#141d30]" : "border-gray-300 bg-white"}`}>
            <div className={`mx-auto mb-5 grid size-14 place-items-center rounded-lg ${isNight ? "bg-[#00C9A7]/15 text-[#00C9A7]" : "bg-[#E8FBF7] text-[#007E68]"}`}>
              <Send className="size-7" />
            </div>
            <h1 className={`text-2xl font-bold ${isNight ? "text-white" : "text-[#0F0F0F]"}`}>아직 대화가 없습니다</h1>
            <p className={`mt-3 text-sm leading-relaxed ${isNight ? "text-white/50" : "text-gray-600"}`}>
              {conversationError ??
                "피드나 프로젝트에서 제안을 시작하면 이곳에 대화가 생성됩니다."}
            </p>
            <button
              type="button"
              onClick={() => navigate("/feed")}
              className="mt-6 h-11 rounded-lg bg-[#00C9A7] px-5 text-sm font-bold text-[#0F0F0F] transition-colors hover:bg-[#00A88C]"
            >
              피드 둘러보기
            </button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-700 ${isNight ? "bg-[#0C1222]" : "bg-[#F7F7F5]"}`}>
      <style>{`
        @keyframes pickxelSelfMessageIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pickxelPartnerMessageIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pickxelTypingBubbleIn {
          from { opacity: 0; transform: translateX(-8px) translateY(4px); }
          to { opacity: 1; transform: translateX(0) translateY(0); }
        }

        @keyframes pickxelTypingDot {
          0%, 60%, 100% { opacity: 0.35; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-3px); }
        }

        @keyframes pickxelAssistantCardPulse {
          0%, 100% { opacity: 0.78; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-1px); }
        }

        @keyframes pickxelAssistantLineShimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }

        @keyframes pickxelDeliveryPop {
          from { opacity: 0; transform: scale(0.86); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes pickxelReactionPickerIn {
          from { opacity: 0; transform: translateY(4px) scale(0.92); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes pickxelReactionChipPop {
          0% { transform: scale(0.9); }
          58% { transform: scale(1.16); }
          100% { transform: scale(1); }
        }

        @keyframes pickxelReactionCountBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          45% { transform: translateY(-3px) scale(1.18); }
        }

        @keyframes pickxelReactionEmojiTap {
          0% { transform: scale(1); }
          50% { transform: scale(1.18) rotate(-4deg); }
          100% { transform: scale(1) rotate(0); }
        }

        @keyframes pickxelProcessCheckPop {
          0% { opacity: 0; transform: scale(0.65) rotate(-10deg); }
          60% { opacity: 1; transform: scale(1.12) rotate(4deg); }
          100% { opacity: 1; transform: scale(1) rotate(0); }
        }

        @keyframes pickxelProcessCheckRing {
          0% { opacity: 0.45; transform: scale(0.86); }
          100% { opacity: 0; transform: scale(1.75); }
        }

        @keyframes pickxelProcessToastIn {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes pickxelModalBackdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes pickxelModalPanelIn {
          from { opacity: 0; transform: translateY(6px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes pickxelBottomSheetIn {
          from { opacity: 0; transform: translateY(18px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes pickxelProcessDetailsIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pickxelUnreadBadgeIn {
          from { opacity: 0; transform: translateY(2px) scale(0.94); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes pickxelUnreadBadgeOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(-2px) scale(0.86); }
        }

        .modal-backdrop-in {
          animation: pickxelModalBackdropIn 160ms ease-out both;
        }

        .modal-panel-in {
          animation: pickxelModalPanelIn 180ms ease-out both;
        }

        .bottom-sheet-in {
          animation: pickxelBottomSheetIn 200ms ease-out both;
          transform-origin: bottom center;
        }

        .process-details-in {
          animation: pickxelProcessDetailsIn 180ms ease-out both;
        }

        .unread-message-badge {
          animation: pickxelUnreadBadgeIn 180ms ease-out both;
        }

        .unread-message-badge::before {
          content: "";
          position: absolute;
          left: -4px;
          top: 50%;
          width: 8px;
          height: 8px;
          border-bottom: 1px solid ${isNight ? "#FF5C3A55" : "#ffb5a4"};
          border-left: 1px solid ${isNight ? "#FF5C3A55" : "#ffb5a4"};
          border-radius: 2px;
          background: ${isNight ? "#3a1a14" : "#fff3ef"};
          transform: translateY(-50%) rotate(45deg);
        }

        .unread-badge-out {
          animation: pickxelUnreadBadgeOut 180ms ease-out both;
        }

        .process-check-pop {
          animation: pickxelProcessCheckPop 680ms cubic-bezier(0.2, 0.85, 0.25, 1.2);
        }

        .process-check-pop::after {
          content: "";
          position: absolute;
          inset: -4px;
          border-radius: 12px;
          border: 2px solid rgba(0, 201, 167, 0.45);
          animation: pickxelProcessCheckRing 900ms ease-out;
          pointer-events: none;
        }

        .process-toast-in {
          animation: pickxelProcessToastIn 220ms ease-out;
        }

        .reaction-picker-in {
          transform-origin: bottom center;
          animation: pickxelReactionPickerIn 150ms ease-out both;
        }

        .reaction-chip-pop {
          animation: pickxelReactionChipPop 240ms cubic-bezier(0.2, 0.85, 0.25, 1.2);
        }

        .reaction-count-bounce {
          animation: pickxelReactionCountBounce 260ms ease-out;
        }

        .reaction-emoji-tap {
          animation: pickxelReactionEmojiTap 220ms ease-out;
        }
      `}</style>
      <Navigation />

      {processToast && (
        <div className={`process-toast-in fixed bottom-6 right-6 z-[80] flex items-center gap-2 rounded-lg border border-[#00C9A7]/35 px-4 py-3 text-sm font-semibold shadow-xl ${isNight ? "bg-[#141d30] text-[#00C9A7]" : "bg-white text-[#007E68]"}`}>
          <CheckCircle className="size-4 text-[#00C9A7]" />
          {processToast.message}
        </div>
      )}

      <motion.div
        className="flex h-[calc(100vh-72px)] min-h-0 w-full min-w-0 overflow-hidden sm:h-[calc(100vh-76px)]"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Conversations Sidebar */}
        <motion.div
          className={`h-full min-h-0 w-full flex-col lg:flex lg:w-80 lg:shrink-0 lg:border-r ${
            mobileView === "list" ? "flex" : "hidden"
          } ${isNight ? "border-white/10 bg-[#141d30]" : "border-gray-200 bg-white"}`}
          initial={false}
        >
          <div className={`p-4 border-b ${isNight ? "border-white/10" : "border-gray-200"}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold ${isNight ? "text-white" : ""}`}>메시지</h2>
              {totalUnreadMessageCount > 0 && (
                <span className={`rounded-md border px-2.5 py-1 text-xs font-bold shadow-sm ${isNight ? "border-[#FF5C3A]/30 bg-[#3a1a14] text-[#FF8A6E] shadow-[#FF5C3A]/10" : "border-[#FFD0C5] bg-[#FFF3EF] text-[#D84325] shadow-[#FF5C3A]/10"}`}>
                  읽지 않음 {totalUnreadMessageCount}
                </span>
              )}
            </div>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 size-4 ${isNight ? "text-white/30" : "text-gray-400"}`} />
              <input
                type="text"
                value={conversationSearch}
                onChange={(event) => setConversationSearch(event.target.value)}
                placeholder="이름 또는 키워드 검색"
                className={`w-full pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:border-2 focus:border-[#00C9A7] transition-all ${isNight ? "bg-white/5 text-white placeholder:text-white/30 focus:bg-[#0e1524]" : "bg-[#F7F7F5] focus:bg-white"}`}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((conv, index) => {
              const isSelected = conv.id === activeConversation?.id;
              const unreadCount = getConversationUnreadCount(conv);
              const lastMessagePreview = getConversationLastMessagePreview(conv.id);

              return (
                <motion.button
                  key={conv.id}
                  type="button"
                  onClick={() => handleSelectConversation(conv.id)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.28,
                    ease: [0.22, 1, 0.36, 1],
                    delay: Math.min(index * 0.035, 0.28),
                  }}
                  whileTap={{ scale: 0.985 }}
                  className={`w-full border-b border-l-4 p-4 text-left transition-colors duration-200 ${
                    isNight
                      ? `border-b-white/5 hover:bg-white/5 ${isSelected ? "border-l-[#00C9A7] bg-white/5" : "border-l-transparent"}`
                      : `border-b-gray-100 hover:bg-[#A8F0E4]/10 ${isSelected ? "border-l-[#00A88C] bg-[#F0FBF7]" : "border-l-transparent bg-white"}`
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="relative shrink-0">
                      <ImageWithFallback
                        src={conv.avatar}
                        alt={conv.name}
                        className={`size-12 rounded-full object-cover ring-2 shadow-sm ${isNight ? "ring-white/10" : "ring-white"}`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <h3
                          className={`truncate text-sm ${
                            isSelected || unreadCount > 0
                              ? isNight ? "font-bold text-white" : "font-bold text-[#12382D]"
                              : isNight ? "font-semibold text-white/80" : "font-semibold text-gray-800"
                          }`}
                        >
                          {conv.name}
                        </h3>
                        <span className={`shrink-0 text-xs ${isNight ? "text-white/40" : "text-gray-500"}`}>
                          {conv.time}
                        </span>
                      </div>
                      <div className="mb-1 flex items-center gap-1.5">
                        <span
                          className={`size-1.5 shrink-0 rounded-full ${
                            conv.online ? "bg-[#72CDBD]" : isNight ? "bg-white/20" : "bg-gray-300"
                          }`}
                        />
                        <p className={`min-w-0 flex-1 truncate text-xs ${isNight ? "text-white/40" : "text-gray-500"}`}>
                          {conv.statusText}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p
                          className={`min-w-0 flex-1 truncate text-sm ${
                            isSelected || unreadCount > 0
                              ? isNight ? "font-semibold text-white" : "font-semibold text-[#12382D]"
                              : isNight ? "font-normal text-white/50" : "font-normal text-gray-600"
                          }`}
                        >
                          {lastMessagePreview}
                        </p>
                        {unreadCount > 0 && (
                          <span
                            className={`unread-message-badge relative inline-flex h-6 min-w-[52px] shrink-0 items-center justify-center rounded-md border px-2 text-[10px] font-bold leading-none shadow-[0_4px_10px_rgba(255,92,58,0.14)] ${
                              isNight ? "border-[#FF5C3A]/30 bg-[#3a1a14] text-[#FF8A6E]" : "border-[#FFB5A4] bg-[#FFF3EF] text-[#D84325]"
                            } ${
                              clearingUnreadConversationId === conv.id
                                ? "unread-badge-out"
                                : ""
                            }`}
                            aria-label={`읽지 않은 메시지 ${unreadCount}개`}
                          >
                            <span className="relative z-10 tracking-[0.08em]">NEW</span>
                            <span className="relative z-10 ml-1.5 rounded-[4px] bg-[#FF5C3A] px-1 py-0.5 text-[10px] leading-none text-white">
                              {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
            {filteredConversations.length === 0 && (
              <div className="px-4 py-10 text-center">
                <p className={`text-sm font-semibold ${isNight ? "text-white/60" : "text-gray-600"}`}>
                  검색 결과가 없습니다.
                </p>
                <p className={`mt-1 text-xs ${isNight ? "text-white/30" : "text-gray-400"}`}>
                  이름, 프로젝트, 마지막 메시지를 다시 확인해보세요.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Chat Area */}
        <div
          className={`flex min-h-0 min-w-0 flex-1 flex-col lg:flex ${
            mobileView === "chat" ? "flex" : "hidden"
          } ${isNight ? "bg-[#0b0f16]" : "bg-[#f3f5f4]"}`}
        >
          {/* Chat Header */}
          <div
            className={`flex shrink-0 items-center justify-between border-b px-4 py-2.5 sm:px-6 lg:px-8 ${
              isNight
                ? "border-white/[0.07] bg-[#141d30]/90 backdrop-blur-md"
                : "border-gray-200/80 bg-white/90 backdrop-blur-md"
            }`}
          >
            <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={() => setMobileView("list")}
                className={`rounded-lg p-1.5 transition-colors lg:hidden ${isNight ? "text-white/60 hover:bg-white/10" : "text-gray-600 hover:bg-black/[0.04]"}`}
                aria-label="대화 목록으로 돌아가기"
              >
                <ArrowLeft className="size-[1.125rem]" />
              </button>
              <ImageWithFallback
                src={activeConversation?.avatar}
                alt={activeConversation?.name || "대화 상대"}
                className={`size-9 shrink-0 rounded-full object-cover ring-1 shadow-sm ${isNight ? "ring-white/10" : "ring-black/[0.06]"}`}
              />
              <div className="min-w-0">
                <h3 className={`truncate text-[0.9375rem] font-semibold tracking-tight ${isNight ? "text-white" : "text-[#0f172a]"}`}>
                  {activeConversation?.name}
                </h3>
                <p className={`flex items-center gap-1.5 text-[11px] ${isNight ? "text-white/45" : "text-gray-500"}`}>
                  <span
                    className={`size-1.5 rounded-full ${
                      activeConversation?.online ? "bg-[#72CDBD]" : isNight ? "bg-white/20" : "bg-gray-300"
                    }`}
                  />
                  {activeConversation?.online ? "메시지 가능" : "자리비움"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("profile");
                  setMobileView("detail");
                }}
                className={`rounded-lg p-1.5 transition-colors ${isNight ? "hover:bg-white/10" : "hover:bg-black/[0.04]"}`}
                aria-label="대화 정보 보기"
              >
                <Info className={`size-[1.125rem] ${isNight ? "text-white/45 hover:text-[#00C9A7]" : "text-gray-500 hover:text-[#00A88C]"}`} />
              </button>
            </div>
          </div>

          {/* Messages (스크롤 전용 — 대화 비중 확보) */}
          <div
            className={`min-h-0 flex-1 overflow-y-auto scroll-smooth ${
              isNight
                ? "bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(0,201,167,0.07),transparent_50%),radial-gradient(ellipse_80%_50%_at_100%_50%,rgba(255,92,58,0.05),transparent_45%),#0b0f16]"
                : "bg-[radial-gradient(ellipse_100%_60%_at_50%_0%,rgba(0,201,167,0.09),transparent_55%),#eef0ee]"
            }`}
          >
            <div className="w-full space-y-3 px-4 py-3 sm:space-y-3.5 sm:px-6 sm:py-4 lg:px-8">
            <div className={`mb-1 text-center text-[11px] font-medium tracking-wide ${isNight ? "text-white/35" : "text-gray-500"}`}>
              2024년 5월 24일 금요일
            </div>

            <div className="flex justify-start">
              <div
                className={`max-w-[min(100%,20rem)] rounded-2xl rounded-tl-md border px-3.5 py-3 shadow-sm sm:max-w-[min(100%,22rem)] ${
                  isNight ? "border-[#00C9A7]/18 bg-[#141d30]/95" : "border-[#c5ebe0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <Sparkles className="size-4 text-[#00A88C]" />
                  <span className={`text-[13px] font-semibold ${isNight ? "text-white" : "text-[#12382D]"}`}>
                    작업 프로세스 만들기
                  </span>
                </div>
                <p className={`mb-2.5 text-[13px] leading-relaxed ${isNight ? "text-white/55" : "text-gray-600"}`}>
                  {activeConversation?.role}를 단계별로 정리해두면 일정, 피드백,
                  최종 납품까지 한눈에 관리할 수 있어요.
                </p>
                <button
                  type="button"
                  onClick={handleCreateProcess}
                  className="rounded-lg bg-[#FF5C3A] px-3.5 py-1.5 text-[13px] font-semibold text-white transition-all hover:bg-[#E94F2F] hover:shadow-md"
                >
                  작업 프로세스 만들기
                </button>
              </div>
            </div>

            {activeMessages.map((msg) => (
              <div
                key={msg.clientId}
                className={`flex ${msg.isSelf ? "justify-end" : "justify-start"}`}
                style={{
                  animation: msg.isSelf
                    ? "pickxelSelfMessageIn 180ms ease-out both"
                    : "pickxelPartnerMessageIn 220ms ease-out both",
                }}
              >
                <div
                  className={`w-fit min-w-0 max-w-[min(100%,40rem)] shadow-sm ${
                    msg.isSelf
                      ? isNight
                        ? "rounded-2xl rounded-tr-md border border-[#00C9A7]/22 bg-[#00C9A7]/12 text-white"
                        : "rounded-2xl rounded-tr-md border border-[#a8e6d4] bg-[#e8f8f2] text-[#12382D] shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
                      : isNight
                        ? "rounded-2xl rounded-tl-md border border-white/[0.08] bg-[#151b2e] text-white/85"
                        : "rounded-2xl rounded-tl-md border border-gray-200/90 bg-white text-gray-800 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                  } ${msg.highlighted ? isNight ? "border-[#00C9A7]/35 bg-[#00C9A7]/15 text-white" : "border-[#6edcc0] bg-[#dff7ee] text-[#12382D]" : ""} px-3 py-2 sm:px-3.5 sm:py-2.5`}
                >
                  {!msg.isSelf && (
                    <div className="mb-1.5 flex items-center gap-2">
                      <ImageWithFallback
                        src={activeConversation?.avatar}
                        alt={activeConversation?.name}
                        className="size-5 rounded-full object-cover"
                      />
                    </div>
                  )}
                  {msg.message && (
                    <p className="break-words text-[13px] leading-[1.55] sm:text-sm">{msg.message}</p>
                  )}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className={`${msg.message ? "mt-3" : ""} flex max-w-full flex-wrap gap-2`}>
                      {renderImageAttachmentGallery(
                        msg.attachments.filter(isImageAttachment)
                      )}
                      {msg.attachments
                        .filter((attachment) => !isImageAttachment(attachment))
                        .map((attachment) => {
                          if (isFileAttachment(attachment)) {
                            return renderFileAttachmentCard(attachment);
                          }

                          if (isIntegrationAttachment(attachment)) {
                            return renderIntegrationAttachmentCard(attachment);
                          }

                          return (
                            <span
                              key={attachment.id}
                              className={`inline-flex size-12 items-center justify-center rounded-lg text-2xl shadow-sm ${isNight ? "bg-white/10" : "bg-white/70"}`}
                              aria-label={attachment.name}
                            >
                              {attachment.value}
                            </span>
                          );
                        })}
                    </div>
                  )}
                  <p
                    className={`text-xs mt-2 ${
                      msg.isSelf || msg.highlighted
                        ? isNight ? "text-[#00C9A7]/60" : "text-[#2D5A4D]/70"
                        : isNight ? "text-white/30" : "text-gray-500"
                    }`}
                  >
                    <span>{msg.time}</span>
                    {msg.isSelf && (
                      <span
                        className={`ml-2 inline-flex w-20 items-center justify-end gap-1 whitespace-nowrap align-middle ${getDeliveryStatusClass(msg.status)}`}
                        style={{ animation: "pickxelDeliveryPop 160ms ease-out both" }}
                      >
                        {renderDeliveryStatusIcon(msg.status)}
                        {getDeliveryStatusLabel(msg.status)}
                      </span>
                    )}
                  </p>
                  <div className={`relative mt-2 flex flex-wrap items-center gap-1 overflow-visible ${msg.isSelf ? "justify-end" : "justify-start"}`}>
                    {msg.reactions?.map((reaction) => {
                      const isReactionAnimating =
                        reactionAnimation?.messageClientId === msg.clientId &&
                        reactionAnimation.emoji === reaction.emoji;

                      return (
                        <button
                          key={`${reaction.emoji}-${
                            isReactionAnimating ? reactionAnimation.key : "idle"
                          }`}
                          type="button"
                          onClick={() => handleToggleReaction(msg.clientId, reaction.emoji)}
                          className={`inline-flex h-7 items-center gap-1 rounded-full border px-2 text-xs shadow-sm transition-all hover:-translate-y-0.5 ${
                            reaction.reactedByMe
                              ? isNight
                                ? "border-[#FF5C3A]/40 bg-[#FF5C3A]/15 text-[#FF8A6E] ring-1 ring-[#FF5C3A]/20"
                                : "border-[#FF5C3A] bg-[#FFF1ED] text-[#B13A21] ring-1 ring-[#FF5C3A]/20"
                              : isNight
                                ? "border-white/10 bg-white/5 text-white/70 hover:border-[#00C9A7]/30 hover:bg-white/10"
                                : "border-gray-200 bg-white/85 text-gray-700 hover:border-[#BDEFD8] hover:bg-white"
                          } ${isReactionAnimating ? "reaction-chip-pop" : ""}`}
                          aria-label={`${reaction.emoji} 반응 ${reaction.count}개`}
                        >
                          <span
                            className={`inline-block ${
                              isReactionAnimating ? "reaction-emoji-tap" : ""
                            }`}
                          >
                            {reaction.emoji}
                          </span>
                          <span
                            className={`inline-block min-w-2 text-center ${
                              isReactionAnimating &&
                              reactionAnimation?.shouldBounceCount
                                ? "reaction-count-bounce"
                                : ""
                            }`}
                          >
                            {reaction.count}
                          </span>
                        </button>
                      );
                    })}
                    <div className="relative overflow-visible">
                      <button
                        type="button"
                        onClick={() =>
                          setReactionPickerMessageId((currentId) =>
                            currentId === msg.clientId ? null : msg.clientId
                          )
                        }
                        className={`inline-flex h-7 items-center gap-1 rounded-full border px-2 text-xs transition-all ${isNight ? "border-white/10 bg-white/5 text-white/50 hover:border-[#00C9A7]/30 hover:bg-white/10" : "border-gray-200 bg-white/70 text-gray-600 hover:border-[#BDEFD8] hover:bg-white"}`}
                        aria-label="메시지에 이모티콘 반응 추가"
                      >
                        <Smile className="size-3.5" />
                        반응
                      </button>
                      {reactionPickerMessageId === msg.clientId && (
                        <div
                          className={`reaction-picker-in absolute bottom-full z-50 mb-2 grid w-max grid-cols-5 gap-1 rounded-lg border p-2 shadow-xl ${
                            isNight ? "border-white/10 bg-[#1a2035]" : "border-[#BDEFD8] bg-white"
                          } ${msg.isSelf ? "right-0" : "left-0"}`}
                        >
                          {reactionIcons.map((emoji, index) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleToggleReaction(msg.clientId, emoji)}
                              className={`flex size-9 items-center justify-center rounded-lg text-xl transition-all hover:scale-110 active:scale-95 ${isNight ? "hover:bg-white/10" : "hover:bg-[#A8F0E4]/20"}`}
                              style={{
                                animation: "pickxelReactionPickerIn 150ms ease-out both",
                                animationDelay: `${index * 12}ms`,
                              }}
                              aria-label={`${emoji} 반응 추가`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
            </div>
          </div>

          {/* AI 도우미 — 입력 위 고정 영역 (대화 스크롤과 분리) */}
          <div
            className={`max-h-[min(36vh,280px)] shrink-0 overflow-y-auto border-t ${
              isNight ? "border-white/[0.07] bg-[#121826]/95" : "border-gray-200/70 bg-white/85"
            } backdrop-blur-sm`}
          >
            <div className="w-full px-4 py-2 sm:px-6 sm:py-2.5 lg:px-8">
            <div
              className={`rounded-xl border px-2.5 py-2 shadow-sm sm:px-3 sm:py-2.5 ${
                isNight
                  ? "border-[#E8456D]/18 bg-gradient-to-br from-[#221018]/90 via-[#181420]/90 to-[#141d30]/90"
                  : "border-[#f5c2cf]/60 bg-gradient-to-br from-[#fff8f9] via-[#fff0f3] to-white"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-[#E8456D]" />
                    <span className={`text-sm font-medium ${isNight ? "text-[#FF6B8A]" : "text-[#A30F3D]"}`}>AI 메시지 도우미</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${isNight ? "bg-white/10 text-[#FF6B8A]" : "bg-white/80 text-[#8C4458]"}`}>
                      {assistantActionItems.find((action) => action.goal === assistantGoal)?.label}
                    </span>
                  </div>
                  <p className={`mt-1 text-xs ${isNight ? "text-white/40" : "text-[#6E3A49]"}`}>
                    {isAssistantExpanded
                      ? "모드를 고른 뒤 생성 버튼을 누르면 대화 흐름에 맞는 문구를 준비해드려요."
                      : "처음 연결할 때 한 번 답장 추천을 띄우고, 이후엔 원하는 모드로 다시 생성할 수 있어요."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAssistantExpanded((prev) => !prev)}
                  className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${isNight ? "border-[#E8456D]/30 bg-white/5 text-[#FF6B8A] hover:bg-white/10" : "border-[#FFD6DE] bg-white/80 text-[#A30F3D] hover:bg-white"}`}
                  aria-label={isAssistantExpanded ? "AI 도우미 접기" : "AI 도우미 펼치기"}
                >
                  {isAssistantExpanded ? "접기" : "펼치기"}
                  {isAssistantExpanded ? (
                    <ChevronUp className="size-3.5" />
                  ) : (
                    <ChevronDown className="size-3.5" />
                  )}
                </button>
              </div>

              {isAssistantExpanded && (
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-2">
                      {assistantActionItems.map((action) => {
                        const isSelected = assistantGoal === action.goal;

                        return (
                          <button
                            key={action.goal}
                            type="button"
                            onClick={() => handleSelectAssistantGoal(action.goal)}
                            disabled={isAssistantLoading}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                              isSelected
                                ? "bg-[#E8456D] text-white hover:bg-[#D7375F] hover:shadow-md"
                                : isNight
                                  ? "bg-white/5 border border-[#E8456D]/30 text-[#FF6B8A] hover:bg-white/10"
                                  : "bg-white border border-[#FFB8C5] text-[#A30F3D] hover:bg-[#FFF7F9]"
                            }`}
                          >
                            {action.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleLoadAssistantSuggestions(assistantGoal)}
                        disabled={isAssistantLoading}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#E8456D] px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-[#D7375F] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="AI 추천 생성"
                      >
                        <Sparkles className="size-3.5" />
                        생성
                      </button>
                      {(assistantError || assistantSuggestions.length > 0 || hasAssistantRequested) && (
                        <button
                          type="button"
                          onClick={handleRefreshAssistantSuggestions}
                          disabled={isAssistantLoading}
                          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${isNight ? "border-[#E8456D]/30 bg-white/5 text-[#FF6B8A] hover:bg-white/10" : "border-[#FFD6DE] bg-white/85 text-[#A30F3D] hover:bg-white"}`}
                          aria-label="AI 추천 다시 불러오기"
                        >
                          <RefreshCw className={`size-3.5 ${isAssistantLoading ? "animate-spin" : ""}`} />
                          {assistantError ? "다시 시도" : "새로고침"}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {isAssistantLoading ? (
                      <div className={`rounded-lg border px-3 py-3 text-sm ${isNight ? "border-[#E8456D]/20 bg-white/5 text-[#FF6B8A]/70" : "border-[#FFD6DE] bg-white/92 text-[#7C3044]"}`}>
                        <div className={`flex items-center gap-2 text-sm font-semibold ${isNight ? "text-[#FF6B8A]" : "text-[#9A3652]"}`}>
                          <div className="flex shrink-0 items-center gap-1">
                            {[0, 1, 2].map((index) => (
                              <span
                                key={index}
                                className="size-1.5 rounded-full bg-[#E8456D]"
                                style={{
                                  animation: "pickxelTypingDot 1s ease-in-out infinite",
                                  animationDelay: `${index * 0.16}s`,
                                }}
                              />
                            ))}
                          </div>
                          <span>Gemini가 최근 대화와 작업 단계를 읽고 있어요.</span>
                        </div>
                        <p className={`mt-1 text-xs font-medium ${isNight ? "text-[#FF6B8A]/50" : "text-[#8C4458]"}`}>
                          상대가 방금 보낸 말에 맞는 추천 문구를 정리하는 중이에요.
                        </p>
                        <div className="mt-3 space-y-2">
                          {assistantLoadingPreviewItems.map((item, index) => (
                            <div
                              key={`${item.primaryWidth}-${index}`}
                              className={`rounded-lg border px-3 py-2.5 ${isNight ? "border-[#E8456D]/15 bg-white/5" : "border-[#FFE0E7] bg-[#FFF9FB]"}`}
                              style={{
                                animation: "pickxelAssistantCardPulse 1.5s ease-in-out infinite",
                                animationDelay: `${index * 0.14}s`,
                              }}
                            >
                              <div
                                className="h-2.5 rounded-full"
                                style={{
                                  width: item.primaryWidth,
                                  background:
                                    "linear-gradient(90deg, rgba(232,69,109,0.16) 0%, rgba(232,69,109,0.3) 45%, rgba(255,214,222,0.45) 100%)",
                                  backgroundSize: "200% 100%",
                                  animation:
                                    "pickxelAssistantLineShimmer 1.5s linear infinite",
                                }}
                              />
                              <div
                                className="mt-2 h-2 rounded-full"
                                style={{
                                  width: item.secondaryWidth,
                                  background:
                                    "linear-gradient(90deg, rgba(140,68,88,0.12) 0%, rgba(232,69,109,0.22) 55%, rgba(255,214,222,0.38) 100%)",
                                  backgroundSize: "200% 100%",
                                  animation:
                                    "pickxelAssistantLineShimmer 1.6s linear infinite",
                                  animationDelay: `${index * 0.1}s`,
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : assistantSuggestions.length > 0 ? (
                      <>
                        <p className={`text-xs font-semibold ${isNight ? "text-[#FF6B8A]/60" : "text-[#8C4458]"}`}>
                          {assistantUsedAi
                            ? "최근 대화와 작업 프로세스를 바탕으로 추천했어요."
                            : "대화 흐름과 작업 단계에 맞춰 빠르게 쓸 수 있는 문구예요."}
                        </p>
                        {assistantSuggestions.map((suggestion, index) => (
                          <button
                            key={`${assistantGoal}-${index}`}
                            type="button"
                            onClick={() => handleApplyAssistantSuggestion(suggestion)}
                            className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-all ${isNight ? "border-[#E8456D]/20 bg-white/5 text-white/70 hover:border-[#E8456D]/40 hover:bg-white/10" : "border-[#FFD6DE] bg-white/95 text-[#5F2938] hover:border-[#E8456D] hover:bg-[#FFF7F9]"}`}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </>
                    ) : (
                      <div className={`rounded-lg border border-dashed px-3 py-2.5 text-sm ${isNight ? "border-[#E8456D]/20 bg-white/5 text-white/40" : "border-[#FFD6DE] bg-white/70 text-[#7C3044]"}`}>
                        버튼을 누르면 최근 대화와 작업 프로세스를 바탕으로 추천 문구를 3개 준비해드려요.
                      </div>
                    )}
                    {assistantError && (
                      <div className="space-y-1">
                        <p className={`text-xs font-semibold ${isNight ? "text-[#FF6B8A]" : "text-[#C43E60]"}`}>{assistantError}</p>
                        <p className={`text-[11px] ${isNight ? "text-[#FF6B8A]/50" : "text-[#8C4458]"}`}>
                          오류 상태에서는 자동 재요청을 멈추고, 위 버튼으로만 다시 시도해요.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>

          {/* Message Input */}
          <div
            className={`shrink-0 border-t ${isNight ? "border-white/[0.07] bg-[#141d30]/95" : "border-gray-200/80 bg-white"} backdrop-blur-sm`}
          >
            <div className="w-full px-4 py-2 sm:px-6 sm:py-2.5 lg:px-8">
            <div className="mb-1.5 min-h-0 px-0.5">
              {isPartnerTyping && (
                <div
                  aria-live="polite"
                  className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium shadow-sm ${isNight ? "border-[#00C9A7]/20 bg-[#00C9A7]/10 text-[#00C9A7]" : "border-[#BDEFD8] bg-[#F3FFFB] text-[#0F6C5C]"}`}
                  style={{ animation: "pickxelTypingBubbleIn 180ms ease-out both" }}
                >
                  <div className="flex shrink-0 items-center gap-1">
                    {[0, 1, 2].map((index) => (
                      <span
                        key={index}
                        className="size-1.5 rounded-full bg-[#00A88C]"
                        style={{
                          animation: "pickxelTypingDot 1s ease-in-out infinite",
                          animationDelay: `${index * 0.16}s`,
                        }}
                      />
                    ))}
                  </div>
                  <p className="min-w-0 break-words leading-5">
                    {activeConversation?.profileName}님이 입력 중...
                  </p>
                </div>
              )}
            </div>
            {pendingAttachments.length > 0 && (
              <div className={`mb-3 flex flex-wrap items-start gap-2 rounded-xl p-3 ${isNight ? "bg-white/5" : "bg-[#F7F7F5]"}`}>
                {renderImageAttachmentGallery(
                  pendingAttachments.filter(isImageAttachment),
                  true,
                  true
                )}
                {pendingAttachments
                  .filter((attachment) => !isImageAttachment(attachment))
                  .map((attachment) => {
                    if (isFileAttachment(attachment)) {
                      return renderFileAttachmentCard(attachment, true);
                    }

                    if (isIntegrationAttachment(attachment)) {
                      return renderIntegrationAttachmentCard(attachment, true);
                    }

                    return (
                      <div
                        key={attachment.id}
                        className={`relative flex size-16 items-center justify-center rounded-lg border text-3xl ${isNight ? "border-white/10 bg-[#1a2035]" : "border-gray-200 bg-white"}`}
                      >
                        {attachment.value}
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(attachment.id)}
                          className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                          aria-label={`${attachment.name} 제거`}
                        >
                          <XCircle className="size-4" />
                        </button>
                      </div>
                    );
                  })}
                {hasUploadingAttachments && (
                  <div className={`flex basis-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${isNight ? "bg-white/10 text-[#FFB36B]" : "bg-white/80 text-[#B65318]"}`}>
                    <Clock className="size-3.5 animate-spin" />
                    첨부 파일을 준비하는 중입니다. 완료되면 전송할 수 있어요.
                  </div>
                )}
              </div>
            )}
            <div className="flex items-end gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsAttachMenuOpen((prev) => !prev)}
                  className={`p-2 rounded-lg transition-colors ${isNight ? "hover:bg-white/10" : "hover:bg-[#A8F0E4]/20"}`}
                  aria-label="파일 및 외부 도구 첨부"
                >
                  <AtSign className="size-5 text-[#00A88C]" />
                </button>
                {isAttachMenuOpen && (
                  <>
                    <div className={`absolute bottom-full left-0 z-20 mb-3 hidden w-56 overflow-hidden rounded-xl border shadow-lg lg:block ${isNight ? "border-white/10 bg-[#1a2035]" : "border-gray-200 bg-white"}`}>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${isNight ? "text-white/80 hover:bg-white/5" : "hover:bg-[#A8F0E4]/15"}`}
                      >
                        <Paperclip className="size-4 text-[#00A88C]" />
                        파일 첨부
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAttachIntegration("figma")}
                        className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${isNight ? "text-white/80 hover:bg-white/5" : "hover:bg-[#A8F0E4]/15"}`}
                      >
                        <Figma className="size-4 text-[#00A88C]" />
                        Figma 링크 연동
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAttachIntegration("adobe")}
                        className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${isNight ? "text-white/80 hover:bg-white/5" : "hover:bg-[#A8F0E4]/15"}`}
                      >
                        <Sparkles className="size-4 text-[#FF5C3A]" />
                        Adobe 링크 연동
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAttachIntegration("pinterest")}
                        className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${isNight ? "text-white/80 hover:bg-white/5" : "hover:bg-[#FFF0F3]"}`}
                      >
                        <Bookmark className="size-4 text-[#D3224B]" />
                        Pinterest 링크 연동
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAttachIntegration("photoshop")}
                        className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${isNight ? "text-white/80 hover:bg-white/5" : "hover:bg-[#EAF2FF]"}`}
                      >
                        <Image className="size-4 text-[#2453A6]" />
                        Photoshop 링크 연동
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAttachMenuOpen(false)}
                      className="modal-backdrop-in fixed inset-0 z-40 bg-black/35 lg:hidden"
                      aria-label="첨부 메뉴 닫기"
                    />
                    <div className={`bottom-sheet-in fixed inset-x-0 bottom-0 z-50 rounded-t-2xl p-4 shadow-2xl lg:hidden ${isNight ? "bg-[#1a2035]" : "bg-white"}`}>
                      <div className={`mx-auto mb-3 h-1 w-10 rounded-full ${isNight ? "bg-white/20" : "bg-gray-200"}`} />
                      <p className={`mb-3 text-sm font-bold ${isNight ? "text-white" : "text-[#12382D]"}`}>
                        첨부 추가
                      </p>
                      <div className="grid gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition-colors ${isNight ? "bg-white/5 text-white/80 hover:bg-white/10" : "bg-[#F7F7F5] hover:bg-[#EFFBF6]"}`}
                        >
                          <Paperclip className="size-4 text-[#00A88C]" />
                          파일 첨부
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAttachIntegration("figma")}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition-colors ${isNight ? "bg-white/5 text-white/80 hover:bg-white/10" : "bg-[#F7F7F5] hover:bg-[#EFFBF6]"}`}
                        >
                          <Figma className="size-4 text-[#00A88C]" />
                          Figma 링크 연동
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAttachIntegration("adobe")}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition-colors ${isNight ? "bg-white/5 text-white/80 hover:bg-white/10" : "bg-[#F7F7F5] hover:bg-[#FFF1ED]"}`}
                        >
                          <Sparkles className="size-4 text-[#FF5C3A]" />
                          Adobe 링크 연동
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAttachIntegration("pinterest")}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition-colors ${isNight ? "bg-white/5 text-white/80 hover:bg-white/10" : "bg-[#F7F7F5] hover:bg-[#FFF0F3]"}`}
                        >
                          <Bookmark className="size-4 text-[#D3224B]" />
                          Pinterest 링크 연동
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAttachIntegration("photoshop")}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition-colors ${isNight ? "bg-white/5 text-white/80 hover:bg-white/10" : "bg-[#F7F7F5] hover:bg-[#EAF2FF]"}`}
                        >
                          <Image className="size-4 text-[#2453A6]" />
                          Photoshop 링크 연동
                        </button>
                      </div>
                    </div>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <div className={`relative flex min-w-0 flex-1 items-center gap-2 rounded-2xl border-2 border-transparent px-3 py-3 transition-all focus-within:border-[#00C9A7] sm:px-4 ${isNight ? "bg-white/5" : "bg-[#F7F7F5]"}`}>
                <input
                  ref={messageInputRef}
                  type="text"
                  value={messageText}
                  onChange={(event) => updateMessageText(event.target.value)}
                  onKeyDown={handleMessageKeyDown}
                  onCompositionStart={handleMessageCompositionStart}
                  onCompositionUpdate={handleMessageCompositionUpdate}
                  onCompositionEnd={handleMessageCompositionEnd}
                  placeholder={`${activeConversation?.name}님에게 메시지 보내기...`}
                  className={`min-w-0 flex-1 bg-transparent text-sm focus:outline-none ${isNight ? "text-white placeholder:text-white/30" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setIsIconPickerOpen((prev) => !prev)}
                  className={`p-1 rounded-lg transition-colors ${isNight ? "hover:bg-white/10" : "hover:bg-[#A8F0E4]/30"}`}
                  aria-label="아이콘 첨부"
                >
                  <Smile className={`size-5 ${isNight ? "text-white/50" : "text-gray-600"}`} />
                </button>
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className={`p-1 rounded-lg transition-colors ${isNight ? "hover:bg-white/10" : "hover:bg-[#A8F0E4]/30"}`}
                  aria-label="이미지 첨부"
                >
                  <Image className={`size-5 ${isNight ? "text-white/50" : "text-gray-600"}`} />
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
                {isIconPickerOpen && (
                  <div className={`absolute bottom-full right-2 mb-3 grid grid-cols-6 gap-1 rounded-xl border p-2 shadow-lg ${isNight ? "border-white/10 bg-[#1a2035]" : "border-gray-200 bg-white"}`}>
                    {attachableIcons.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => handleAttachIcon(icon)}
                        className={`flex size-9 items-center justify-center rounded-lg text-xl transition-colors ${isNight ? "hover:bg-white/10" : "hover:bg-[#A8F0E4]/20"}`}
                        aria-label={`${icon} 아이콘 첨부`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={
                  hasUploadingAttachments ||
                  hasFailedAttachments ||
                  (!messageText.trim() && pendingAttachments.length === 0)
                }
                title={hasUploadingAttachments ? "첨부가 완료되면 전송할 수 있어요." : undefined}
                className="bg-gradient-to-r from-[#00C9A7] to-[#00A88C] text-[#0F0F0F] p-3 rounded-full hover:shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="size-5" />
              </button>
            </div>
          </div>
        </div>
        </div>

        {/* Right Sidebar */}
        {mobileView === "detail" && (
          <button
            type="button"
            onClick={() => setMobileView("chat")}
            className="modal-backdrop-in fixed inset-0 z-40 bg-black/35 lg:hidden"
            aria-label="대화 정보 닫기"
          />
        )}
        <div
          className={`w-full flex-col lg:static lg:z-auto lg:flex lg:max-h-none lg:w-80 lg:shrink-0 lg:rounded-none lg:border-l lg:shadow-none ${
            isNight ? "border-white/10 bg-[#141d30]" : "border-gray-200 bg-white"
          } ${
            mobileView === "detail"
              ? `bottom-sheet-in fixed inset-x-0 bottom-0 z-50 flex max-h-[86vh] rounded-t-2xl shadow-2xl ${isNight ? "bg-[#141d30]" : ""}`
              : "hidden"
          }`}
        >
          <div className={`flex items-center gap-2 border-b p-3 lg:hidden ${isNight ? "border-white/10" : "border-gray-200"}`}>
            <button
              type="button"
              onClick={() => setMobileView("chat")}
              className={`rounded-lg p-2 transition-colors ${isNight ? "text-white/60 hover:bg-white/10" : "text-gray-600 hover:bg-[#A8F0E4]/20"}`}
              aria-label="채팅으로 돌아가기"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div className="min-w-0">
              <p className={`text-sm font-bold ${isNight ? "text-white" : "text-[#12382D]"}`}>대화 정보</p>
              <p className={`truncate text-xs ${isNight ? "text-white/40" : "text-gray-500"}`}>
                {activeConversation?.name}
              </p>
            </div>
          </div>
          {/* Tab Navigation */}
          <div className={`flex border-b ${isNight ? "border-white/10" : "border-gray-200"}`}>
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex-1 py-3 text-sm font-medium transition-all ${
                activeTab === "profile"
                  ? "text-[#00C9A7] border-b-2 border-[#00C9A7]"
                  : isNight ? "text-white/50 hover:text-[#00C9A7]" : "text-gray-600 hover:text-[#00A88C]"
              }`}
            >
              프로필
            </button>
            <button
              onClick={() => setActiveTab("process")}
              className={`flex-1 py-3 text-sm font-medium transition-all ${
                activeTab === "process"
                  ? "text-[#00C9A7] border-b-2 border-[#00C9A7]"
                  : isNight ? "text-white/50 hover:text-[#00C9A7]" : "text-gray-600 hover:text-[#00A88C]"
              }`}
            >
              작업 프로세스
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {activeTab === "profile" ? (
              <>
                <div className="text-center mb-6">
                  <ImageWithFallback
                    src={activeConversation?.avatar}
                    alt={activeConversation?.name || ""}
                    className="mx-auto mb-4 size-24 rounded-full object-cover ring-4 ring-[#A8F0E4]/40 shadow-lg"
                  />
                  <div className="mb-1 flex items-center justify-center gap-2">
                    <span
                      className={`inline-flex size-2.5 rounded-full ${
                        activeConversation?.online ? "bg-[#00C853] shadow-[0_0_0_4px_rgba(0,200,83,0.14)]" : isNight ? "bg-white/20" : "bg-gray-300"
                      }`}
                      aria-hidden="true"
                    />
                    <h3 className={`font-bold text-lg ${isNight ? "text-white" : ""}`}>{activeConversation?.profileName}</h3>
                  </div>
                  <p className={`text-sm ${isNight ? "text-white/50" : "text-gray-600"}`}>
                    {activeConversation?.title}
                    <span className={`mx-1.5 ${isNight ? "text-white/20" : "text-gray-300"}`}>·</span>
                    {activeConversation?.online ? "메시지 가능" : "자리비움"}
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <button
                    onClick={handleOpenProfile}
                    className="w-full bg-[#FF5C3A] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#E94F2F] hover:shadow-md transition-all"
                  >
                    프로필 보기
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className={`font-medium mb-2 ${isNight ? "text-white" : ""}`}>소개</h4>
                    <p className={`text-sm ${isNight ? "text-white/50" : "text-gray-600"}`}>
                      {activeConversation?.bio}
                    </p>
                  </div>

                  <div>
                    <h4 className={`font-medium mb-2 ${isNight ? "text-white" : ""}`}>공유된 미디어</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {activeConversation?.sharedMedia.map((media) => (
                        <button
                          key={media.id}
                          type="button"
                          onClick={() => setSelectedImage({ src: media.src, name: media.title })}
                          className={`group relative aspect-square overflow-hidden rounded-lg border shadow-sm ${isNight ? "border-white/10 bg-white/5" : "border-gray-100 bg-gray-100"}`}
                          aria-label={media.title}
                        >
                          <ImageWithFallback
                            src={media.src}
                            alt={media.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <span className="absolute inset-x-0 bottom-0 bg-black/50 px-1.5 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                            {media.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className={`font-medium mb-2 ${isNight ? "text-white" : ""}`}>설정</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isNight ? "text-white/70" : ""}`}>메시지 알림 받기</span>
                        <input type="checkbox" className="toggle" defaultChecked />
                      </div>
                      <button
                        type="button"
                        onClick={handleDeleteConversation}
                        className="text-[0px] font-semibold text-[#FF5C3A] hover:text-[#FF5C3A]/80 transition-colors [&>span]:text-sm"
                      >
                        <span>대화방 나가기</span>
                        대화방 나가기
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Process Tab */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`font-bold text-lg ${isNight ? "text-white" : ""}`}>프로젝트 진행 상황</h3>
                    {processCreated ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCreateProcess}
                          className="flex items-center gap-1 rounded-lg border border-[#FF5C3A] px-3 py-1.5 text-sm font-semibold text-[#FF5C3A] transition-all hover:bg-[#FFF1ED]"
                        >
                          <Edit className="size-4" />
                          수정
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCreateProcess}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FF5C3A] text-sm font-semibold text-white transition-all hover:bg-[#E94F2F] hover:shadow-md"
                      >
                        <Sparkles className="size-4" />
                        만들기
                      </button>
                    )}
                  </div>
                  <p className={`text-sm mb-4 ${isNight ? "text-white/50" : "text-gray-600"}`}>
                    프로젝트 단계별 진행 상황을 확인하고 관리하세요.
                  </p>
                </div>

                {!processCreated ? (
                  null
                ) : (
                  <>
                    {/* Progress Overview */}
                    <div className={`border border-[#00C9A7]/30 rounded-xl p-4 mb-6 ${isNight ? "bg-gradient-to-br from-[#00C9A7]/10 to-[#141d30]" : "bg-gradient-to-br from-[#A8F0E4]/20 to-white"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${isNight ? "text-white/70" : ""}`}>전체 진행률</span>
                        <span className="text-sm font-bold text-[#00A88C]">
                          {getTotalProgress()}%
                        </span>
                      </div>
                      <div className={`h-2 rounded-full overflow-hidden ${isNight ? "bg-white/10" : "bg-gray-200"}`}>
                        <div
                          className="h-full bg-gradient-to-r from-[#00C9A7] to-[#00A88C] transition-all duration-500"
                          style={{
                            width: `${getTotalProgress()}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Process Steps */}
                    <div className="space-y-3">
                      {processes.map((process) => {
                        const progress = getProgressPercentage(process.tasks);
                        const isExpanded = expandedProcess === process.id;
                        const isProcessApproved =
                          progress === 100 && hasBothConfirmations(process.confirmations);
                        const approvalBadge = getProcessApprovalBadge(process, progress);
                        const approvalSummary = getProcessApprovalSummary(process, progress);
                        const confirmationRoles: Array<keyof ProcessConfirmations> = [
                          partnerProcessConfirmationRole,
                          currentProcessConfirmationRole,
                        ];

                        return (
                          <div
                            key={process.id}
                            className={`border rounded-xl overflow-hidden transition-all hover:border-[#00C9A7]/50 ${
                              isProcessApproved
                                ? isNight
                                  ? "border-[#00C9A7]/40 bg-[#00C9A7]/5 shadow-[0_12px_30px_rgba(0,201,167,0.08)]"
                                  : "border-[#00C9A7]/60 bg-[#F7FFFC] shadow-[0_12px_30px_rgba(0,201,167,0.12)]"
                                : isNight ? "border-white/10" : "border-gray-200"
                            }`}
                          >
                            <button
                              onClick={() => setExpandedProcess(isExpanded ? null : process.id)}
                              className={`w-full p-4 flex items-center justify-between transition-colors ${isNight ? "hover:bg-white/5" : "hover:bg-gray-50"}`}
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {isProcessApproved ? (
                              <div className="process-check-pop relative mt-0.5 flex h-8 min-w-[58px] shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#12382D] px-2.5 text-white shadow-[0_8px_18px_rgba(18,56,45,0.18)]">
                                <CheckCheck className="size-4 text-[#A8F0E4]" />
                                <span className="text-[11px] font-black">완료</span>
                              </div>
                            ) : (
                              <div className={`mt-2 size-2.5 shrink-0 rounded-full ${getStatusColor(process.status)}`}></div>
                            )}
                            <div className="text-left flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h4 className={`font-semibold text-sm ${isNight ? "text-white" : "text-[#12382D]"}`}>{process.title}</h4>
                                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${approvalBadge.className}`}>
                                  {approvalBadge.label}
                                </span>
                              </div>
                              <p className={`text-xs font-medium ${isNight ? "text-white/40" : "text-gray-600"}`}>
                                {approvalSummary}
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <span className={`text-[11px] font-semibold ${isNight ? "text-white/30" : "text-gray-500"}`}>
                                  세부 작업
                                </span>
                                <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isNight ? "bg-white/10" : "bg-gray-200"}`}>
                                  <div
                                    className={`h-full ${
                                      progress === 100 ? "bg-[#00C9A7]" : getStatusColor(process.status)
                                    } transition-all duration-500`}
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                                <span className={`text-xs font-medium min-w-[40px] text-right ${isNight ? "text-white/40" : "text-gray-500"}`}>
                                  {progress}%
                                </span>
                              </div>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="size-4 text-gray-400 ml-2" />
                          ) : (
                            <ChevronDown className="size-4 text-gray-400 ml-2" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className={`process-details-in px-4 pb-4 ${isNight ? "bg-white/[0.02]" : "bg-gray-50/50"}`}>
                            <div className="space-y-2">
                              {process.tasks.map((task) => (
                                <div
                                  key={task.id}
                                  className="flex items-start gap-2 group"
                                >
                                  <button
                                    onClick={() => toggleTask(process.id, task.id)}
                                    className="mt-0.5 flex-shrink-0"
                                  >
                                    {task.completed ? (
                                      <CheckCircle className="size-4 text-[#00C9A7]" />
                                    ) : (
                                      <Circle className={`size-4 ${isNight ? "text-white/20 group-hover:text-white/30" : "text-gray-300 group-hover:text-gray-400"}`} />
                                    )}
                                  </button>
                                  <span
                                    className={`text-sm ${
                                      task.completed
                                        ? isNight ? "text-white/30 line-through" : "text-gray-500 line-through"
                                        : isNight ? "text-white/70" : "text-gray-700"
                                    }`}
                                  >
                                    {task.text}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className={`mt-4 rounded-lg border p-3 ${isNight ? "border-[#00C9A7]/20 bg-[#141d30]" : "border-[#BDEFD8] bg-white"}`}>
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <div>
                                  <p className={`text-sm font-semibold ${isNight ? "text-white" : "text-[#12382D]"}`}>
                                    완료 확인
                                  </p>
                                  <p className={`text-xs ${isNight ? "text-white/40" : "text-gray-500"}`}>
                                    {processCompletionGuideText}
                                  </p>
                                  <p className="mt-1 text-xs font-semibold text-[#00A88C]">
                                    {approvalSummary}
                                  </p>
                                </div>
                                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${approvalBadge.className}`}>
                                  {approvalBadge.label}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {confirmationRoles.map((role) => {
                                  const isCurrentParticipant = role === currentProcessConfirmationRole;
                                  const canEditConfirmation =
                                    isProcessConfirmationEditable(role);
                                  const isConfirmed = process.confirmations[role];

                                  return (
                                    <button
                                      key={`${process.id}-${role}`}
                                      type="button"
                                      onClick={() => {
                                        if (!canEditConfirmation) return;
                                        toggleProcessConfirmation(process.id, role);
                                      }}
                                      disabled={!canEditConfirmation}
                                      aria-pressed={isConfirmed}
                                      aria-disabled={!canEditConfirmation}
                                      className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all ${
                                        isConfirmed
                                          ? isNight
                                            ? "border-[#00C9A7]/40 bg-[#00C9A7]/10 text-white shadow-[0_8px_20px_rgba(0,201,167,0.08)] ring-1 ring-[#00C9A7]/20"
                                            : "border-[#9EE7D0] bg-white text-[#12382D] shadow-[0_8px_20px_rgba(0,201,167,0.12)] ring-1 ring-[#DDF8EC]"
                                          : canEditConfirmation
                                            ? isNight
                                              ? "border-white/10 bg-white/5 text-white/60 hover:-translate-y-0.5 hover:border-[#00C9A7]/30 hover:bg-white/10"
                                              : "border-gray-200 bg-[#F7F7F5] text-gray-600 hover:-translate-y-0.5 hover:border-[#00C9A7] hover:bg-white"
                                            : isNight
                                              ? "border-white/5 bg-white/[0.02] text-white/20"
                                              : "border-gray-200 bg-[#F3F4F6] text-gray-400"
                                      }`}
                                    >
                                      <span
                                        className={`flex items-center gap-2 ${
                                          isCurrentParticipant
                                            ? "justify-end text-right"
                                            : "justify-start text-left"
                                        }`}
                                      >
                                        {isCurrentParticipant && (
                                          <span className="min-w-0 flex-1 leading-tight">
                                            <span className="block truncate">
                                              {getProcessParticipantButtonTitle(role)}
                                            </span>
                                            <span
                                              className={`block truncate text-[11px] font-bold ${
                                                isConfirmed
                                                  ? "text-[#007E68]"
                                                  : isNight ? "text-white/20" : "text-gray-400"
                                              }`}
                                            >
                                              {`${getProcessParticipantButtonSubtitle(role)} · ${
                                                isConfirmed ? "완료" : "대기"
                                              }`}
                                            </span>
                                          </span>
                                        )}
                                        <span
                                          className={`flex size-6 shrink-0 items-center justify-center rounded-full border transition-all ${
                                            isConfirmed
                                              ? "border-[#00C9A7] bg-[#00C9A7] text-white"
                                              : isNight ? "border-white/20 bg-transparent text-transparent" : "border-gray-300 bg-white text-transparent"
                                          }`}
                                        >
                                          <CheckCircle className="size-4" />
                                        </span>
                                        {!isCurrentParticipant && (
                                          <span className="min-w-0 flex-1 leading-tight">
                                            <span className="block truncate">
                                              {getProcessParticipantButtonTitle(role)}
                                            </span>
                                            <span
                                              className={`block truncate text-[11px] font-bold ${
                                                isConfirmed
                                                  ? "text-[#007E68]"
                                                  : isNight ? "text-white/20" : "text-gray-400"
                                              }`}
                                            >
                                              {`${getProcessParticipantButtonSubtitle(role)} · ${
                                                isConfirmed ? "완료" : "대기"
                                              }`}
                                            </span>
                                          </span>
                                        )}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Save Notice */}
                {saved && (
                  <div className="mt-4 p-3 bg-[#00C9A7]/10 border border-[#00C9A7]/30 rounded-lg">
                    <p className="text-sm text-[#00A88C] font-medium flex items-center gap-2">
                      <CheckCircle className="size-4" />
                      작업 프로세스가 저장되었습니다.
                    </p>
                  </div>
                )}

                {/* Complete/End Work Button */}
                <div className={`mt-6 pt-6 border-t ${isNight ? "border-white/10" : "border-gray-200"}`}>
                  {areAllProcessesCompleted() ? (
                    <button
                      onClick={handleCompleteWork}
                      className="w-full bg-gradient-to-r from-[#00C9A7] to-[#00A88C] backdrop-blur-md text-[#0F0F0F] py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all border border-white/30 flex items-center justify-center gap-2"
                    >
                      <ThumbsUp className="size-5" />
                      작업 완료 및 후기 작성
                    </button>
                  ) : (
                    <button
                      onClick={handleEndWork}
                      className={`w-full border-2 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${isNight ? "border-white/10 text-white/60 hover:bg-white/5 hover:border-[#FF5C3A] hover:text-[#FF5C3A]" : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-[#FF5C3A] hover:text-[#FF5C3A]"}`}
                    >
                      <XCircle className="size-5" />
                      작업 종료
                    </button>
                  )}
                  <p className={`text-xs text-center mt-3 ${isNight ? "text-white/30" : "text-gray-500"}`}>
                    {areAllProcessesCompleted()
                      ? "모든 작업과 양쪽 확인이 완료되었습니다. 후기를 작성해주세요."
                      : "모든 세부 작업을 완료하고 디자이너와 클라이언트가 모두 확인해야 완료됩니다."}
                  </p>
                </div>
              </>
            )}
              </>
            )}
          </div>
        </div>
      </motion.div>
      {isEndProcessModalOpen && (
        <div
          className="modal-backdrop-in fixed inset-0 z-[65] flex items-center justify-center bg-black/45 p-4"
          onClick={closeEndProcessModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby={
            endProcessModalStep === "info" ? "end-process-info-title" : "end-process-confirm-title"
          }
        >
          <div
            className={`modal-panel-in w-full min-w-0 max-w-md overflow-hidden rounded-2xl shadow-2xl ${
              isNight ? "border border-white/10 bg-[#141d30]" : "bg-white"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {endProcessModalStep === "info" ? (
              <>
                <div className={`border-b px-5 py-4 ${isNight ? "border-white/10" : "border-gray-200"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
                          isNight ? "bg-[#FF5C3A]/15 text-[#FFB199]" : "bg-[#FFF1ED] text-[#B13A21]"
                        }`}
                      >
                        <AlertTriangle className="size-6" aria-hidden />
                      </div>
                      <div>
                        <h2
                          id="end-process-info-title"
                          className={`text-lg font-bold leading-tight ${isNight ? "text-white" : "text-[#12382D]"}`}
                        >
                          작업 프로세스 종료
                        </h2>
                        <p className={`mt-1.5 text-sm leading-relaxed ${isNight ? "text-white/65" : "text-gray-600"}`}>
                          <strong className={isNight ? "text-white/90" : "text-gray-800"}>
                            이 대화에 설정된 작업 프로세스 전체를 없앱니다
                          </strong>
                          . 체크·확인 내역이 모두 사라지고, 필요하면 나중에 다시
                          <strong> 만들기</strong>로 잡을 수 있어요.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={closeEndProcessModal}
                      className={`shrink-0 rounded-lg p-2 transition-colors ${
                        isNight ? "text-white/40 hover:bg-white/10 hover:text-white/70" : "text-gray-500 hover:bg-gray-100"
                      }`}
                      aria-label="닫기"
                    >
                      <XCircle className="size-5" />
                    </button>
                  </div>
                </div>
                <div className={`space-y-3 px-5 py-4 text-sm ${isNight ? "text-white/80" : "text-gray-700"}`}>
                  <p className={`font-semibold ${isNight ? "text-white/90" : "text-[#0F0F0F]"}`}>
                    프로젝트 후기를 남기려면
                  </p>
                  <p className="leading-relaxed">
                    이후에 다시 프로세스를 만들고, 각 단계·양쪽 확인을 모두 끝내면{" "}
                    <strong className="text-[#00A88C]">「작업 완료 및 후기 작성」</strong>에서 후기로 이어질
                    수 있어요. 지금 종료하면 <strong>후기 작성 전</strong>에 프로세스를 다시 잡아야 합니다.
                  </p>
                </div>
                <div
                  className={`flex flex-col gap-2 px-5 pb-5 sm:flex-row sm:justify-end ${isNight ? "bg-[#0e1524]/50" : "bg-gray-50/80"}`}
                >
                  <button
                    type="button"
                    onClick={closeEndProcessModal}
                    className={`order-2 w-full rounded-xl border-2 py-3 text-sm font-bold transition-colors sm:order-1 sm:w-auto sm:min-w-[100px] ${
                      isNight
                        ? "border-white/15 text-white/80 hover:bg-white/5"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={() => setEndProcessModalStep("confirm")}
                    className="order-1 w-full rounded-xl border border-[#FF5C3A]/40 bg-[#FF5C3A]/10 py-3 text-sm font-bold text-[#B13A21] transition-colors hover:bg-[#FF5C3A]/20 dark:text-[#FFB199] sm:order-2 sm:w-auto sm:min-w-[120px]"
                  >
                    정말 종료할지 확인
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={`border-b px-5 py-4 ${isNight ? "border-white/10" : "border-gray-200"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2
                        id="end-process-confirm-title"
                        className={`text-lg font-bold leading-tight ${isNight ? "text-white" : "text-[#12382D]"}`}
                      >
                        작업 프로세스를 전부 삭제할까요?
                      </h2>
                      <p className={`mt-2 text-sm leading-relaxed ${isNight ? "text-white/65" : "text-gray-600"}`}>
                        이 작업은 되돌릴 수 없습니다. 서버에 저장된 이 대화의 프로세스·세부 작업·확인
                        기록이 함께 제거돼요.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={closeEndProcessModal}
                      className={`shrink-0 rounded-lg p-2 transition-colors ${
                        isNight ? "text-white/40 hover:bg-white/10 hover:text-white/70" : "text-gray-500 hover:bg-gray-100"
                      }`}
                      aria-label="닫기"
                    >
                      <XCircle className="size-5" />
                    </button>
                  </div>
                </div>
                <div
                  className={`flex w-full min-w-0 flex-col gap-2 px-5 py-4 sm:flex-row sm:items-stretch sm:gap-3 ${isNight ? "bg-[#0e1524]/50" : "bg-gray-50/80"}`}
                >
                  <button
                    type="button"
                    onClick={() => setEndProcessModalStep("info")}
                    disabled={isEndingProcess}
                    className={`w-full shrink-0 whitespace-nowrap rounded-xl border-2 py-3 text-sm font-bold transition-colors sm:w-auto sm:min-w-[6rem] sm:px-4 ${
                      isNight
                        ? "border-white/15 text-white/80 hover:bg-white/5"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    } ${isEndingProcess ? "pointer-events-none opacity-50" : ""}`}
                  >
                    이전
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleConfirmEndProcess()}
                    disabled={isEndingProcess}
                    className="w-full min-w-0 flex-1 rounded-xl bg-gradient-to-r from-[#E94A2A] to-[#c73718] py-3 text-center text-sm font-bold text-white shadow-sm transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 sm:min-w-[9rem] sm:px-5"
                  >
                    {isEndingProcess ? "처리 중…" : "프로세스 종료"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {integrationModalProvider && integrationModalMeta && (
        <div
          className="modal-backdrop-in fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4"
          onClick={closeIntegrationModal}
        >
          <div
            className={`modal-panel-in w-full max-w-lg overflow-hidden rounded-lg shadow-2xl ${isNight ? "bg-[#141d30]" : "bg-white"}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={`border-b p-5 ${isNight ? "border-white/10 bg-[#0e1524]" : "border-gray-200 bg-[#FAFBF8]"}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-[#FF5C3A]">
                    작업 링크 첨부
                  </p>
                  <h3 className={`text-xl font-bold ${isNight ? "text-white" : "text-[#12382D]"}`}>
                    디자인 파일 공유
                  </h3>
                  <p className={`mt-1 text-sm ${isNight ? "text-white/50" : "text-gray-600"}`}>
                    링크를 붙이면 채팅에 깔끔한 프로젝트 카드로 첨부됩니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeIntegrationModal}
                  className={`rounded-lg p-2 transition-colors ${isNight ? "text-white/40 hover:bg-white/10 hover:text-white/60" : "text-gray-500 hover:bg-white hover:text-gray-800"}`}
                  aria-label="링크 첨부 닫기"
                >
                  <XCircle className="size-5" />
                </button>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {integrationProviderOrder.map((provider) => {
                  const meta = getIntegrationMeta(provider, isNight);
                  const isSelected = integrationModalProvider === provider;

                  return (
                    <button
                      key={provider}
                      type="button"
                      onClick={() => {
                        setIntegrationModalProvider(provider);
                        setIntegrationUrlTouched(false);
                      }}
                      className={`rounded-lg border p-3 text-left transition-all ${
                        isSelected
                          ? `${meta.borderClassName} ${isNight ? "bg-white/5" : "bg-white"} shadow-sm`
                          : isNight ? "border-white/10 bg-white/[0.02] hover:bg-white/5" : "border-gray-200 bg-white/60 hover:bg-white"
                      }`}
                    >
                      <span
                        className={`mb-2 flex size-9 items-center justify-center rounded-lg ${meta.iconClassName}`}
                      >
                        {renderIntegrationProviderIcon(provider, "size-4")}
                      </span>
                      <span className={`block text-xs font-bold ${isNight ? "text-white" : "text-[#12382D]"}`}>
                        {meta.shortLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className={`mb-2 block text-sm font-bold ${isNight ? "text-white" : "text-[#12382D]"}`}>
                  {integrationModalMeta.title}
                </label>
                <div
                  className={`flex items-center gap-3 rounded-lg border px-3 py-3 transition-colors ${
                    isNight ? "bg-[#0e1524]" : "bg-white"
                  } ${
                    integrationUrlTouched && !canSubmitIntegrationLink
                      ? "border-[#FF5C3A]"
                      : isNight ? "border-white/10 focus-within:border-[#00C9A7]" : "border-gray-200 focus-within:border-[#00C9A7]"
                  }`}
                >
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${integrationModalMeta.iconClassName}`}
                  >
                    {renderIntegrationProviderIcon(integrationModalProvider)}
                  </span>
                  <input
                    type="url"
                    value={integrationUrl}
                    onChange={(event) => setIntegrationUrl(event.target.value)}
                    onBlur={() => setIntegrationUrlTouched(true)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") submitIntegrationAttachment();
                    }}
                    autoFocus
                    placeholder={integrationModalMeta.placeholder}
                    className={`min-w-0 flex-1 bg-transparent text-sm outline-none ${isNight ? "text-white placeholder:text-white/30" : ""}`}
                  />
                </div>
                {integrationUrlTouched && !canSubmitIntegrationLink && (
                  <p className={`mt-2 text-xs font-semibold ${isNight ? "text-[#FF8A6E]" : "text-[#D84325]"}`}>
                    공유할 수 있는 링크 주소를 입력해주세요.
                  </p>
                )}
              </div>

              <div className={`rounded-lg border p-4 ${integrationModalMeta.borderClassName} ${isNight ? "bg-white/5" : "bg-white"}`}>
                <div className="flex gap-3">
                  <span
                    className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${integrationModalMeta.iconClassName}`}
                  >
                    {renderIntegrationProviderIcon(integrationModalProvider)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <p className={`truncate text-sm font-bold ${isNight ? "text-white" : "text-[#12382D]"}`}>
                        {integrationModalMeta.previewTitle}
                      </p>
                      <ExternalLink className={`size-4 shrink-0 ${isNight ? "text-white/30" : "text-gray-400"}`} />
                    </div>
                    <p className={`text-xs leading-relaxed ${isNight ? "text-white/50" : "text-gray-600"}`}>
                      {integrationModalMeta.description}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${integrationModalMeta.chipClassName}`}>
                        {integrationModalMeta.shortLabel}
                      </span>
                      <span className={`max-w-[210px] truncate rounded-lg px-2.5 py-1 text-xs font-semibold ${isNight ? "bg-white/10 text-white/40" : "bg-[#F7F7F5] text-gray-500"}`}>
                        {integrationUrlHost || "링크를 붙이면 도메인이 보여요"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`flex items-center justify-end gap-2 border-t p-4 ${isNight ? "border-white/10 bg-[#0e1524]" : "border-gray-200 bg-[#FAFBF8]"}`}>
              <button
                type="button"
                onClick={closeIntegrationModal}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${isNight ? "border-white/10 bg-white/5 text-white/60 hover:bg-white/10" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}
              >
                취소
              </button>
              <button
                type="button"
                onClick={submitIntegrationAttachment}
                disabled={!canSubmitIntegrationLink}
                className="rounded-lg bg-[#FF5C3A] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#E94F2F] disabled:cursor-not-allowed disabled:opacity-40"
              >
                링크 첨부
              </button>
            </div>
          </div>
        </div>
      )}

      {isProcessModalOpen && (
        <div
          className="modal-backdrop-in fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4"
          onClick={requestCloseProcessModal}
        >
          <div
            className={`modal-panel-in flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg shadow-2xl ${isNight ? "bg-[#141d30]" : "bg-white"}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={`flex items-start justify-between border-b p-5 ${isNight ? "border-white/10" : "border-gray-200"}`}>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-[#FF5C3A]">
                  작업 프로세스
                </p>
                <h3 className={`text-xl font-bold ${isNight ? "text-white" : "text-[#12382D]"}`}>
                  프로세스 섹션 만들기
                </h3>
                <p className={`mt-1 text-sm ${isNight ? "text-white/50" : "text-gray-600"}`}>
                  큰 프로세스를 나누고, 각 섹션 안에 세부 프로세스를 추가하세요.
                </p>
              </div>
              <button
                type="button"
                onClick={requestCloseProcessModal}
                className={`rounded-lg p-2 transition-colors ${isNight ? "text-white/40 hover:bg-white/10 hover:text-white/60" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"}`}
                aria-label="프로세스 모달 닫기"
              >
                <XCircle className="size-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {draftProcesses.map((process, processIndex) => (
                <div
                  key={process.id}
                  onDragOver={(event) => {
                    if (draggingDraftProcessId !== null) event.preventDefault();
                  }}
                  onDrop={() => handleDraftProcessDrop(process.id)}
                  className={`rounded-lg border p-4 shadow-sm transition-all ${
                    draggingDraftProcessId === process.id
                      ? isNight ? "border-[#FF5C3A]/40 bg-[#FF5C3A]/5" : "border-[#FF5C3A] bg-[#FFF7F4]"
                      : isNight ? "border-white/10 bg-[#1a2035]" : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <button
                      type="button"
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = "move";
                        setDraggingDraftProcessId(process.id);
                      }}
                      onDragEnd={() => setDraggingDraftProcessId(null)}
                      className={`flex size-8 shrink-0 cursor-grab items-center justify-center rounded-lg border transition-colors hover:border-[#FF5C3A] hover:text-[#FF5C3A] active:cursor-grabbing ${isNight ? "border-white/10 bg-transparent text-white/30" : "border-gray-200 bg-white text-gray-400"}`}
                      aria-label="프로세스 순서 변경"
                    >
                      <GripVertical className="size-4" />
                    </button>
                    <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${isNight ? "bg-[#FF5C3A]/15 text-[#FF8A6E]" : "bg-[#FFF1ED] text-[#FF5C3A]"}`}>
                      {processIndex + 1}
                    </span>
                    <label className="min-w-0 flex-1">
                      <span className={`mb-1 block text-xs font-semibold ${isNight ? "text-white/40" : "text-gray-500"}`}>
                        프로세스 이름
                      </span>
                      <input
                        type="text"
                        value={process.title}
                        onChange={(event) =>
                          updateDraftProcessTitle(process.id, event.target.value)
                        }
                        className={`w-full rounded-lg border px-3 py-2 text-sm font-semibold outline-none transition-colors focus:border-[#FF5C3A] ${isNight ? "border-white/10 bg-[#0e1524] text-white focus:bg-[#141d30] placeholder:text-white/30" : "border-gray-200 bg-[#FAFBF8] text-[#12382D] focus:bg-white"}`}
                        placeholder={`프로세스 ${processIndex + 1}`}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removeDraftProcess(process.id)}
                      className={`flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${isNight ? "border-[#FF5C3A]/20 bg-[#FF5C3A]/10 text-[#FF8A6E] hover:bg-[#FF5C3A]/15" : "border-[#FFD1C8] bg-[#FFF7F4] text-[#D84325] hover:bg-[#FFF1ED]"}`}
                      aria-label="프로세스 삭제"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  <div className={`rounded-lg p-3 ${isNight ? "bg-white/5" : "bg-[#F7F7F5]"}`}>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className={`text-sm font-semibold ${isNight ? "text-white/70" : "text-gray-700"}`}>
                        세부 프로세스
                      </p>
                      <button
                        type="button"
                        onClick={() => addDraftTask(process.id)}
                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${isNight ? "bg-[#141d30] text-[#00C9A7] hover:bg-[#1a2035]" : "bg-white text-[#00A88C] hover:bg-[#EFFBF6]"}`}
                      >
                        <Plus className="size-3.5" />
                        추가
                      </button>
                    </div>

                    <div className="space-y-2">
                      {process.tasks.map((task, taskIndex) => (
                        <div
                          key={task.id}
                          onDragOver={(event) => {
                            if (draggingDraftTask?.processId === process.id) {
                              event.preventDefault();
                            }
                          }}
                          onDrop={() => handleDraftTaskDrop(process.id, task.id)}
                          className={`flex items-center gap-2 rounded-lg border px-2 py-2 transition-all ${
                            draggingDraftTask?.processId === process.id &&
                            draggingDraftTask.taskId === task.id
                              ? isNight ? "border-[#00C9A7]/40 bg-[#00C9A7]/10" : "border-[#00A88C] bg-[#EFFBF6]"
                              : isNight ? "border-white/10 bg-[#141d30]" : "border-gray-200 bg-white"
                          }`}
                        >
                          <button
                            type="button"
                            draggable
                            onDragStart={(event) => {
                              event.dataTransfer.effectAllowed = "move";
                              setDraggingDraftTask({
                                processId: process.id,
                                taskId: task.id,
                              });
                            }}
                            onDragEnd={() => setDraggingDraftTask(null)}
                            className={`flex size-7 shrink-0 cursor-grab items-center justify-center rounded-lg transition-colors active:cursor-grabbing ${isNight ? "text-white/30 hover:bg-white/10 hover:text-[#00C9A7]" : "text-gray-400 hover:bg-[#EFFBF6] hover:text-[#00A88C]"}`}
                            aria-label="세부 프로세스 순서 변경"
                          >
                            <GripVertical className="size-4" />
                          </button>
                          <span className={`flex size-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${isNight ? "bg-[#00C9A7]/15 text-[#00C9A7]" : "bg-[#EFFBF6] text-[#00A88C]"}`}>
                            {taskIndex + 1}
                          </span>
                          <input
                            type="text"
                            value={task.text}
                            onChange={(event) =>
                              updateDraftTaskText(process.id, task.id, event.target.value)
                            }
                            className={`min-w-0 flex-1 bg-transparent text-sm outline-none ${isNight ? "text-white/70 placeholder:text-white/30" : "text-gray-700"}`}
                            placeholder={`세부 프로세스 ${taskIndex + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => removeDraftTask(process.id, task.id)}
                            className={`flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors ${isNight ? "text-white/30 hover:bg-[#FF5C3A]/10 hover:text-[#FF8A6E]" : "text-gray-400 hover:bg-[#FFF1ED] hover:text-[#D84325]"}`}
                            aria-label="세부 프로세스 삭제"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      ))}

                      {process.tasks.length === 0 && (
                        <div className={`rounded-lg border border-dashed px-3 py-4 text-center text-xs font-semibold ${isNight ? "border-white/10 bg-white/5 text-white/40" : "border-gray-300 bg-white/70 text-gray-500"}`}>
                          세부 프로세스를 하나 이상 추가해주세요.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addDraftProcess}
                className={`flex w-full items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm font-semibold transition-colors ${isNight ? "border-[#FF5C3A]/30 bg-[#FF5C3A]/5 text-[#FF8A6E] hover:bg-[#FF5C3A]/10" : "border-[#FF5C3A] bg-[#FFF7F4] text-[#FF5C3A] hover:bg-[#FFF1ED]"}`}
              >
                <Plus className="size-4" />
                프로세스 추가
              </button>

              <section className={`rounded-lg border p-4 ${isNight ? "border-[#00C9A7]/20 bg-[#00C9A7]/5" : "border-[#BDEFD8] bg-[#F5FFFB]"}`}>
                <div className="flex items-center gap-2">
                  <Eye className="size-4 text-[#00A88C]" />
                  <p className={`text-sm font-bold ${isNight ? "text-white" : "text-[#12382D]"}`}>
                    저장 전 미리보기
                  </p>
                </div>
                <div className="mt-3 space-y-3">
                  {draftProcesses.length > 0 ? (
                    draftProcesses.map((process, processIndex) => (
                      <div
                        key={`preview-${process.id}`}
                        className={`rounded-lg border p-3 ${isNight ? "border-white/10 bg-[#141d30]" : "border-[#DCEFE7] bg-white"}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${isNight ? "bg-[#FF5C3A]/15 text-[#FF8A6E]" : "bg-[#FFF1ED] text-[#FF5C3A]"}`}>
                            {processIndex + 1}
                          </span>
                          <p className={`min-w-0 flex-1 truncate text-sm font-bold ${isNight ? "text-white" : "text-[#12382D]"}`}>
                            {process.title.trim() || "프로세스 이름 없음"}
                          </p>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {process.tasks.length > 0 ? (
                            process.tasks.map((task, taskIndex) => (
                              <span
                                key={`preview-task-${task.id}`}
                                className={`rounded-lg px-2 py-1 text-xs font-semibold ${isNight ? "bg-[#00C9A7]/15 text-[#00C9A7]" : "bg-[#EFFBF6] text-[#007E68]"}`}
                              >
                                {taskIndex + 1}. {task.text.trim() || "세부 이름 없음"}
                              </span>
                            ))
                          ) : (
                            <span className={`rounded-lg px-2 py-1 text-xs font-semibold ${isNight ? "bg-[#FF5C3A]/15 text-[#FF8A6E]" : "bg-[#FFF1ED] text-[#D84325]"}`}>
                              세부 프로세스 없음
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={`rounded-lg border border-dashed px-3 py-5 text-center text-sm font-semibold ${isNight ? "border-white/10 bg-white/5 text-white/40" : "border-[#DCEFE7] bg-white/70 text-gray-500"}`}>
                      미리볼 프로세스가 없습니다.
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className={`flex flex-col gap-3 border-t p-4 md:flex-row md:items-center md:justify-between ${isNight ? "border-white/10 bg-[#0e1524]" : "border-gray-200 bg-[#FAFBF8]"}`}>
              <p
                className={`text-xs font-semibold ${
                  draftValidationMessage ? isNight ? "text-[#FF8A6E]" : "text-[#D84325]" : isNight ? "text-white/40" : "text-gray-500"
                }`}
              >
                {draftValidationMessage || "미리보기를 확인한 뒤 저장할 수 있어요."}
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={requestCloseProcessModal}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${isNight ? "border-white/10 bg-white/5 text-white/60 hover:bg-white/10" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={applyProcessDraft}
                  disabled={Boolean(draftValidationMessage)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all ${
                    draftValidationMessage
                      ? isNight ? "cursor-not-allowed bg-white/10" : "cursor-not-allowed bg-gray-300"
                      : "bg-[#FF5C3A] hover:bg-[#E94F2F] hover:shadow-md"
                  }`}
                >
                  프로세스 저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-h-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80"
              aria-label="이미지 닫기"
            >
              <XCircle className="size-6" />
            </button>
            <ImageWithFallback
              src={selectedImage.src}
              alt={selectedImage.name}
              className="max-h-[82vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            />
            <p className="mt-3 text-center text-sm font-medium text-white">
              {selectedImage.name}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
