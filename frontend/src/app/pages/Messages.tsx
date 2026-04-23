import Navigation from "../components/Navigation";
import { Edit, Search, Info, Send, Image, Smile, AtSign, Sparkles, Calendar, FileText, CheckCircle, Circle, ChevronDown, ChevronUp, ThumbsUp, XCircle, Paperclip, Figma, ExternalLink, Plus, Clock, Check, CheckCheck, Trash2, GripVertical, Eye, ArrowLeft, Bookmark } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import {
  getUnreadMessageConversationIds,
  markConversationRead,
} from "../utils/notificationState";
import {
  getConversationMessagesApi,
  getMessageConversationsApi,
  sendConversationMessageApi,
  type ChatMessageResponse as ApiChatMessageResponse,
  type MessageConversationResponse as ApiMessageConversationResponse,
} from "../api/messageApi";
import { createMessageSocket, type IncomingChatSocketMessage } from "../api/messageSocket";
import { getCurrentUser } from "../utils/auth";

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
    })
  | (MessageAttachmentBase & {
      type: "icon";
      value: string;
    })
  | (MessageAttachmentBase & {
      type: "file";
      size: number;
      mimeType: string;
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

const CURRENT_USER_ID = "me";
const PROCESS_STORAGE_KEY = "pickxel:message-processes:v2";
const PROCESS_CREATED_STORAGE_KEY = "pickxel:message-processes-created:v2";
const MESSAGE_DRAFTS_STORAGE_KEY = "pickxel:message-drafts";
const LEFT_CONVERSATIONS_STORAGE_KEY = "pickxel:left-message-conversations";

const createClientId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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

const getFileAttachmentMeta = (attachment: FileAttachment) => {
  const extension = getFileExtension(attachment.name);

  if (attachment.mimeType.includes("pdf") || extension === "PDF") {
    return { label: "PDF", className: "bg-[#FFF1ED] text-[#D84325]" };
  }

  if (["DOC", "DOCX", "HWP"].includes(extension)) {
    return { label: "DOC", className: "bg-[#EAF2FF] text-[#2453A6]" };
  }

  if (["XLS", "XLSX", "CSV"].includes(extension)) {
    return { label: "XLS", className: "bg-[#E8F8EF] text-[#127A4B]" };
  }

  if (["PPT", "PPTX", "KEY"].includes(extension)) {
    return { label: "PPT", className: "bg-[#FFF4E8] text-[#B65318]" };
  }

  if (["ZIP", "RAR", "7Z"].includes(extension)) {
    return { label: "ZIP", className: "bg-[#F1EEFF] text-[#5B42B5]" };
  }

  if (["PNG", "JPG", "JPEG", "GIF", "WEBP", "SVG"].includes(extension)) {
    return { label: "IMG", className: "bg-[#E8FBF7] text-[#007E68]" };
  }

  return { label: extension.slice(0, 4), className: "bg-gray-100 text-gray-600" };
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

const integrationProviderMeta: Record<
  IntegrationProvider,
  {
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
  }
> = {
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
  },
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
    username: conversation.partnerLoginId || partnerDisplayName,
    name: partnerDisplayName,
    profileName: partnerDisplayName,
    title,
    role: title,
    message: conversation.lastMessage ?? "새 대화를 시작해보세요.",
    time: formatConversationTime(conversation.lastMessageAt),
    unread: conversation.unreadCount > 0,
    unreadCount: conversation.unreadCount,
    online: false,
    statusText: "메시지 가능",
    avatar:
      conversation.partnerProfileImage ||
      `https://i.pravatar.cc/150?u=message-${conversation.partnerUserId}`,
    bio: conversation.partnerIntroduction || "프로젝트 대화를 진행 중입니다.",
    sharedMedia: [],
  };
};

const mapChatMessageResponse = (
  message: ApiChatMessageResponse,
  currentUserId?: number
): ChatMessage => {
  const isSelf = currentUserId === message.senderUserId;
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
    status: "sent",
    attachments: (message.attachments ?? []) as MessageAttachment[],
  };
};

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
  const [searchParams] = useSearchParams();
  const currentUser = getCurrentUser();
  const requestedConversationId = Number(searchParams.get("conversationId") ?? 0);
  const storedProcessesRef = useRef<ProjectProcess[] | null>(readStoredProcesses());
  const storedMessageDraftsRef = useRef<Record<string, string>>(readStoredMessageDrafts());
  const [serverConversations, setServerConversations] = useState<Conversation[]>([]);
  const [isConversationsLoading, setIsConversationsLoading] = useState(true);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const [conversationReloadKey, setConversationReloadKey] = useState(0);
  const [leftConversationIds, setLeftConversationIds] = useState<number[]>(
    readLeftConversationIds
  );
  const rawConversations = [...serverConversations, ...conversations];
  const allConversations = rawConversations.filter(
    (conversation) => !leftConversationIds.includes(conversation.id)
  );
  const messageSocketConversationIds = allConversations
    .map((conversation) => conversation.id)
    .join("|");
  const [activeTab, setActiveTab] = useState<"profile" | "process">("profile");
  const [activeConversationId, setActiveConversationId] = useState(0);
  const [mobileView, setMobileView] = useState<"list" | "chat" | "detail">("list");
  const [conversationSearch, setConversationSearch] = useState("");
  const [processes, setProcesses] = useState<ProjectProcess[]>(
    () => storedProcessesRef.current ?? initialProcesses
  );
  const [expandedProcess, setExpandedProcess] = useState<number | null>(2);
  const [processCreated, setProcessCreated] = useState(
    () => readStoredProcessCreated()
  );
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
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
  const [typingConversationId, setTypingConversationId] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ src: string; name: string } | null>(null);
  const [processToast, setProcessToast] = useState<ProcessToast | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageSocketRef = useRef<ReturnType<typeof createMessageSocket> | null>(null);
  const activeConversationIdRef = useRef(activeConversationId);
  const activeConversation =
    allConversations.find((conversation) => conversation.id === activeConversationId) ??
    allConversations[0] ??
    null;
  const activeMessages = activeConversation
    ? chatMessages.filter((message) => message.conversationId === activeConversation.id)
    : [];

  useEffect(() => {
    let mounted = true;

    async function loadConversations() {
      try {
        setIsConversationsLoading(true);
        setConversationError(null);
        const conversationResponses = await getMessageConversationsApi();

        if (!mounted) return;

        const nextConversations = conversationResponses.map(mapConversationResponse);
        setServerConversations(nextConversations);

        const requestedId = Number.isFinite(requestedConversationId)
          ? requestedConversationId
          : 0;
        const requestedConversation = nextConversations.find(
          (conversation) => conversation.id === requestedId
        );

        setActiveConversationId((currentId) => {
          if (nextConversations.some((conversation) => conversation.id === currentId)) {
            return currentId;
          }
          return requestedConversation?.id ?? nextConversations[0]?.id ?? 0;
        });
      } catch (error) {
        if (!mounted) return;
        setConversationError(
          error instanceof Error ? error.message : "대화 목록을 불러오지 못했습니다."
        );
      } finally {
        if (mounted) {
          setIsConversationsLoading(false);
        }
      }
    }

    loadConversations();

    return () => {
      mounted = false;
    };
  }, [requestedConversationId, conversationReloadKey]);

  useEffect(() => {
    if (!activeConversation) return;

    let mounted = true;
    const conversationId = activeConversation.id;

    async function loadConversationMessages() {
      try {
        const messageResponses = await getConversationMessagesApi(conversationId);

        if (!mounted) return;

        const nextMessages = messageResponses.map((message) =>
          mapChatMessageResponse(message, currentUser?.userId)
        );

        setChatMessages((prev) => {
          const pendingMessages = prev.filter(
            (message) =>
              message.conversationId === conversationId && message.status === "sending"
          );
          const otherMessages = prev.filter(
            (message) => message.conversationId !== conversationId
          );
          const pendingMessagesNotInHistory = pendingMessages.filter(
            (pendingMessage) =>
              !nextMessages.some((message) => message.clientId === pendingMessage.clientId)
          );

          return [...otherMessages, ...nextMessages, ...pendingMessagesNotInHistory];
        });
      } catch (error) {
        setConversationError(
          error instanceof Error ? error.message : "메시지 내역을 불러오지 못했습니다."
        );
      }
    }

    loadConversationMessages();

    return () => {
      mounted = false;
    };
  }, [activeConversation?.id, currentUser?.userId]);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    const conversationIds = messageSocketConversationIds
      .split("|")
      .map((conversationId) => Number(conversationId))
      .filter((conversationId) => Number.isFinite(conversationId));

    const socket = createMessageSocket({
      onOpen: () => {
        if (conversationIds.length > 0) {
          socket.subscribe(conversationIds);
        }
      },
      onMessage: (incomingMessage: IncomingChatSocketMessage) => {
        const isSelfMessage = currentUser?.userId === incomingMessage.senderUserId;
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
          status: "sent",
          attachments: (incomingMessage.attachments ?? []) as MessageAttachment[],
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
                  status: "sent",
                  createdAt: nextMessage.createdAt,
                  time: nextMessage.time,
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
    });

    messageSocketRef.current = socket;
    socket.connect();

    return () => {
      if (messageSocketRef.current === socket) {
        messageSocketRef.current = null;
      }
      socket.close();
    };
  }, [currentUser?.userId, messageSocketConversationIds]);

  const isPartnerTyping = Boolean(activeConversation && typingConversationId === activeConversation.id);
  const draftValidationMessage = getProcessDraftValidation(draftProcesses);
  const isProcessDraftDirty =
    JSON.stringify(draftProcesses) !== JSON.stringify(processDraftSnapshot);
  const hasUploadingAttachments = pendingAttachments.some(
    (attachment) => attachment.uploadStatus === "uploading"
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

    const hasText = Boolean(lastMessage.message.trim());
    const hasAttachments = Boolean(lastMessage.attachments?.length);

    if (!hasText && hasAttachments && lastMessage.attachments) {
      return getAttachmentConversationPreview(lastMessage.attachments);
    }

    return lastMessage.message || fallbackConversation?.message || "";
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
    writeJsonToStorage(PROCESS_STORAGE_KEY, processes);
    writeJsonToStorage(PROCESS_CREATED_STORAGE_KEY, processCreated);
  }, [processCreated, processes]);

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
    setProcesses(prev => prev.map(process => {
      if (process.id === processId) {
        const tasks = process.tasks.map(task =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        );
        return {
          ...process,
          status: getProcessStatusFromState(tasks, process.confirmations),
          tasks,
        };
      }
      return process;
    }));
  };

  const toggleProcessConfirmation = (
    processId: number,
    role: keyof ProcessConfirmations
  ) => {
    const targetProcess = processes.find((process) => process.id === processId);
    const isConfirming = targetProcess ? !targetProcess.confirmations[role] : false;

    setProcesses((prev) =>
      prev.map((process) => {
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
      })
    );

    if (isConfirming) {
      const roleLabel = role === "designer" ? "디자이너" : "클라이언트";
      showProcessToast(`${roleLabel} 확인이 기록되었습니다.`);
    }
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

  const applyProcessDraft = () => {
    if (draftValidationMessage) return;

    const normalizedProcesses = draftProcesses.map((process) => {
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

    setProcesses(normalizedProcesses);
    setProcessCreated(true);
    setActiveTab("process");
    setExpandedProcess(normalizedProcesses[0]?.id ?? null);
    setProcessDraftSnapshot(cloneProcesses(normalizedProcesses));
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

  const getConfirmationLabel = (
    role: keyof ProcessConfirmations,
    confirmations: ProcessConfirmations
  ) => {
    const roleLabel = role === "designer" ? "디자이너" : "클라이언트";
    return confirmations[role] ? `${roleLabel} 확인 완료` : `${roleLabel} 대기`;
  };

  const getProcessApprovalSummary = (process: ProjectProcess, progress: number) =>
    `작업 ${progress}% · ${getConfirmationLabel(
      "designer",
      process.confirmations
    )} · ${getConfirmationLabel("client", process.confirmations)}`;

  const getProcessApprovalBadge = (process: ProjectProcess, progress: number) => {
    if (progress === 100 && hasBothConfirmations(process.confirmations)) {
      return {
        label: "승인 완료",
        className: "bg-[#DDF8EC] text-[#007E68] border-[#00C9A7]/40",
      };
    }

    if (progress === 100) {
      return {
        label: "완료 대기중",
        className: "bg-[#FFF4E8] text-[#B65318] border-[#FFB36B]/50",
      };
    }

    if (progress > 0) {
      return {
        label: "작업 진행 중",
        className: "bg-[#FFF1ED] text-[#D64928] border-[#FF5C3A]/30",
      };
    }

    return {
      label: "시작 전",
      className: "bg-gray-100 text-gray-600 border-gray-200",
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
    navigate(
      `/review/write?client=${encodeURIComponent(activeConversation.name)}&project=${encodeURIComponent(activeConversation.role)}`
    );
  };

  const handleOpenProfile = () => {
    if (!activeConversation) return;
    navigate(`/profile/${encodeURIComponent(activeConversation.username)}`);
  };

  const handleSelectConversation = (conversationId: number) => {
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
    setActiveTab("profile");
    setMobileView("chat");
    setIsAttachMenuOpen(false);
    setIsIconPickerOpen(false);
    setReactionPickerMessageId(null);
    setTypingConversationId(null);
  };

  const handleLeaveConversation = () => {
    if (!activeConversation) return;
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

  const updateMessageText = (value: string) => {
    if (!activeConversation) return;
    setMessageText(value);
    setMessageDrafts((prev) => ({
      ...prev,
      [String(activeConversation.id)]: value,
    }));
  };

  const getCurrentTime = () => {
    return new Intl.DateTimeFormat("ko-KR", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date());
  };

  const markAttachmentReady = (attachmentId: string, delay = 650) => {
    window.setTimeout(() => {
      setPendingAttachments((prev) =>
        prev.map((attachment) =>
          attachment.id === attachmentId
            ? { ...attachment, uploadStatus: "ready" }
            : attachment
        )
      );
    }, delay);
  };

  const handleSendMessage = () => {
    if (!activeConversation) return;
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage && pendingAttachments.length === 0) return;
    if (hasUploadingAttachments) return;

    const clientId = createClientId("msg");
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

    const sendMessageToServer = messageSocketRef.current?.isOpen()
      ? messageSocketRef.current.sendMessage({
          clientId: outgoingMessage.clientId,
          conversationId: outgoingMessage.conversationId,
          message: outgoingMessage.message,
          attachments: outgoingMessage.attachments,
          createdAt: outgoingMessage.createdAt,
        })
      : sendConversationMessageApi(outgoingMessage.conversationId, {
          clientId: outgoingMessage.clientId,
          message: outgoingMessage.message,
          attachments: outgoingMessage.attachments,
        }).then((savedMessage) => ({
          serverId: String(savedMessage.id),
          createdAt: savedMessage.createdAt,
        }));

    sendMessageToServer
      .then(({ serverId, createdAt }) => {
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
        setTypingConversationId(outgoingMessage.conversationId);
        window.setTimeout(() => {
          setChatMessages((prev) =>
            prev.map((message) =>
              message.clientId === clientId && message.status === "sent"
                ? { ...message, status: "read" }
                : message
            )
          );
        }, 900);
        window.setTimeout(() => {
          setTypingConversationId((currentId) =>
            currentId === outgoingMessage.conversationId ? null : currentId
          );
        }, 1600);
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
  };

  const handleMessageKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith("image/")
    );
    if (files.length === 0) return;

    files.forEach((file, index) => {
      const attachmentId = createClientId(`image-${index}`);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== "string") return;
        setPendingAttachments((prev) => [
          ...prev,
          {
            id: attachmentId,
            type: "image",
            src: reader.result,
            name: file.name,
            uploadStatus: "uploading",
          },
        ]);
        markAttachmentReady(attachmentId, 560 + index * 120);
      };
      reader.readAsDataURL(file);
    });

    event.target.value = "";
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const attachments = files.map((file) => ({
      id: createClientId("file"),
      type: "file" as const,
      name: file.name,
      size: file.size,
      mimeType: file.type || "application/octet-stream",
      uploadStatus: "uploading" as const,
    }));

    setPendingAttachments((prev) => [...prev, ...attachments]);
    attachments.forEach((attachment, index) => {
      markAttachmentReady(attachment.id, 520 + index * 140);
    });
    setIsAttachMenuOpen(false);
    event.target.value = "";
  };

  const handleAttachIcon = (icon: string) => {
    setPendingAttachments((prev) => [
      ...prev,
      {
        id: createClientId("icon"),
        type: "icon",
        value: icon,
        name: `${icon} 아이콘`,
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
        uploadStatus: "uploading",
        ...preview,
      },
    ]);
    markAttachmentReady(attachmentId, 620);
    closeIntegrationModal();
  };

  const handleToggleReaction = (messageClientId: string, emoji: string) => {
    const targetMessage = chatMessages.find(
      (message) => message.clientId === messageClientId
    );
    const targetReaction = targetMessage?.reactions?.find(
      (reaction) => reaction.emoji === emoji
    );
    const shouldBounceCount = !targetReaction || !targetReaction.reactedByMe;

    setReactionAnimation({
      messageClientId,
      emoji,
      key: Date.now(),
      shouldBounceCount,
    });

    setChatMessages((prev) =>
      prev.map((message) => {
        if (message.clientId !== messageClientId) return message;

        const reactions = message.reactions ?? [];
        const existingReaction = reactions.find((reaction) => reaction.emoji === emoji);

        if (!existingReaction) {
          return {
            ...message,
            reactions: [...reactions, { emoji, count: 1, reactedByMe: true }],
          };
        }

        if (existingReaction.reactedByMe) {
          const nextCount = existingReaction.count - 1;
          return {
            ...message,
            reactions: reactions
              .map((reaction) =>
                reaction.emoji === emoji
                  ? { ...reaction, count: nextCount, reactedByMe: false }
                  : reaction
              )
              .filter((reaction) => reaction.count > 0),
          };
        }

        return {
          ...message,
          reactions: reactions.map((reaction) =>
            reaction.emoji === emoji
              ? { ...reaction, count: reaction.count + 1, reactedByMe: true }
              : reaction
          ),
        };
      })
    );
    setReactionPickerMessageId(null);
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
            ? "bg-[#FFF1ED] text-[#D84325]"
            : isUploading
              ? "bg-[#FFF4E8] text-[#B65318]"
              : "bg-[#E8FBF7] text-[#007E68]"
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
          <div className="flex items-center gap-2 text-[10px] font-bold text-[#2D5A4D]/70">
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
                className={`relative overflow-hidden rounded-lg border border-white/60 bg-white shadow-sm ${imageClass}`}
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
    const meta = getFileAttachmentMeta(attachment);

    return (
      <div
        key={attachment.id}
        className="relative flex max-w-72 items-center gap-2 rounded-lg border border-white/70 bg-white/80 px-3 py-2 pr-8 text-left shadow-sm"
      >
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-[10px] font-black ${meta.className}`}
        >
          {meta.label}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">{attachment.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-gray-500">
              {formatFileSize(attachment.size)}
            </span>
            {renderAttachmentStatus(attachment)}
          </div>
        </div>
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
    const meta = integrationProviderMeta[attachment.provider];
    const cardClass = `relative flex max-w-80 gap-3 rounded-lg border bg-white/85 p-3 pr-9 text-left shadow-sm transition-all ${
      removable ? "" : "hover:-translate-y-0.5 hover:bg-white"
    } ${meta.borderClassName}`;
    const cardContent = (
      <>
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${meta.iconClassName}`}
        >
          {renderIntegrationProviderIcon(attachment.provider)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-1.5">
            <p className="truncate text-xs font-bold text-[#12382D]">
              {attachment.previewTitle ?? attachment.name}
            </p>
            <ExternalLink className="size-3.5 shrink-0 text-gray-400" />
          </div>
          <p className="line-clamp-2 text-[11px] leading-snug text-gray-600">
            {attachment.previewDescription}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="truncate rounded-full bg-[#F7F7F5] px-2 py-0.5 text-[10px] font-semibold text-gray-500">
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

  const handleEndWork = () => {
    if (confirm("작업을 종료하시겠습니까? 진행 중인 작업이 있는 경우 저장되지 않을 수 있습니다.")) {
      // 작업 종료 처리
      alert("작업이 종료되었습니다.");
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
      case "sending": return "text-gray-500";
      case "sent": return "text-[#00A88C]";
      case "read": return "text-[#007E68]";
      case "failed": return "text-[#FF5C3A]";
      default: return "text-gray-500";
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
    return (
      <div className="min-h-screen bg-[#F7F7F5]">
        <Navigation />
        <main className="mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-5xl items-center justify-center px-6 py-16">
          <section className="w-full rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-5 grid size-14 place-items-center rounded-lg bg-[#E8FBF7] text-[#007E68]">
              <Send className="size-7" />
            </div>
            <h1 className="text-2xl font-bold text-[#0F0F0F]">
              {isConversationsLoading ? "대화를 불러오는 중입니다" : "아직 대화가 없습니다"}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
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
    <div className="min-h-screen bg-[#F7F7F5]">
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
          border-bottom: 1px solid #ffb5a4;
          border-left: 1px solid #ffb5a4;
          border-radius: 2px;
          background: #fff3ef;
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
        <div className="process-toast-in fixed bottom-6 right-6 z-[80] flex items-center gap-2 rounded-lg border border-[#00C9A7]/35 bg-white px-4 py-3 text-sm font-semibold text-[#007E68] shadow-xl">
          <CheckCircle className="size-4 text-[#00C9A7]" />
          {processToast.message}
        </div>
      )}

      <div className="mx-auto flex h-[calc(100vh-73px)] max-w-[1400px] overflow-hidden">
        {/* Conversations Sidebar */}
        <div
          className={`w-full flex-col border-gray-200 bg-white lg:flex lg:w-80 lg:shrink-0 lg:border-r ${
            mobileView === "list" ? "flex" : "hidden"
          }`}
        >
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">메시지</h2>
              {totalUnreadMessageCount > 0 && (
                <span className="rounded-md border border-[#FFD0C5] bg-[#FFF3EF] px-2.5 py-1 text-xs font-bold text-[#D84325] shadow-sm shadow-[#FF5C3A]/10">
                  읽지 않음 {totalUnreadMessageCount}
                </span>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                type="text"
                value={conversationSearch}
                onChange={(event) => setConversationSearch(event.target.value)}
                placeholder="이름 또는 키워드 검색"
                className="w-full pl-10 pr-4 py-2 bg-[#F7F7F5] rounded-lg text-sm focus:outline-none focus:bg-white focus:border-2 focus:border-[#00C9A7] transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((conv) => {
              const isSelected = conv.id === activeConversation.id;
              const unreadCount = getConversationUnreadCount(conv);
              const lastMessagePreview = getConversationLastMessagePreview(conv.id);

              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`w-full border-b border-l-4 border-gray-100 p-4 text-left transition-colors hover:bg-[#A8F0E4]/10 ${
                    isSelected
                      ? "border-l-[#00A88C] bg-[#F0FBF7]"
                      : "border-l-transparent bg-white"
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="relative shrink-0">
                      <ImageWithFallback
                        src={conv.avatar}
                        alt={conv.name}
                        className="size-12 rounded-full object-cover ring-2 ring-white shadow-sm"
                      />
                      <span
                        className={`absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white ${
                          conv.online ? "bg-[#72CDBD]" : "bg-gray-300"
                        }`}
                        aria-label={conv.online ? "온라인" : "오프라인"}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <h3
                          className={`truncate text-sm ${
                            isSelected || unreadCount > 0
                              ? "font-bold text-[#12382D]"
                              : "font-semibold text-gray-800"
                          }`}
                        >
                          {conv.name}
                        </h3>
                        <span className="shrink-0 text-xs text-gray-500">
                          {conv.time}
                        </span>
                      </div>
                      <div className="mb-1 flex items-center gap-1.5">
                        <span
                          className={`size-1.5 shrink-0 rounded-full ${
                            conv.online ? "bg-[#72CDBD]" : "bg-gray-300"
                          }`}
                        />
                        <p className="min-w-0 flex-1 truncate text-xs text-gray-500">
                          {conv.online ? "온라인" : conv.statusText}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p
                          className={`min-w-0 flex-1 truncate text-sm ${
                            isSelected || unreadCount > 0
                              ? "font-semibold text-[#12382D]"
                              : "font-normal text-gray-600"
                          }`}
                        >
                          {lastMessagePreview}
                        </p>
                        {unreadCount > 0 && (
                          <span
                            className={`unread-message-badge relative inline-flex h-6 min-w-[52px] shrink-0 items-center justify-center rounded-md border border-[#FFB5A4] bg-[#FFF3EF] px-2 text-[10px] font-bold leading-none text-[#D84325] shadow-[0_4px_10px_rgba(255,92,58,0.14)] ${
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
                </button>
              );
            })}
            {filteredConversations.length === 0 && (
              <div className="px-4 py-10 text-center">
                <p className="text-sm font-semibold text-gray-600">
                  검색 결과가 없습니다.
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  이름, 프로젝트, 마지막 메시지를 다시 확인해보세요.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div
          className={`min-w-0 flex-1 flex-col bg-white lg:flex ${
            mobileView === "chat" ? "flex" : "hidden"
          }`}
        >
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-white to-[#F7F7F5] p-3 sm:p-4">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setMobileView("list")}
                className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-[#A8F0E4]/20 lg:hidden"
                aria-label="대화 목록으로 돌아가기"
              >
                <ArrowLeft className="size-5" />
              </button>
              <ImageWithFallback
                src={activeConversation.avatar}
                alt={activeConversation.name}
                className="size-10 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm"
              />
              <div className="min-w-0">
                <h3 className="truncate font-semibold">{activeConversation.name}</h3>
                <p className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span
                    className={`size-1.5 rounded-full ${
                      activeConversation.online ? "bg-[#72CDBD]" : "bg-gray-300"
                    }`}
                  />
                  {activeConversation.statusText}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("profile");
                  setMobileView("detail");
                }}
                className="rounded-lg p-2 transition-colors hover:bg-[#A8F0E4]/20"
                aria-label="대화 정보 보기"
              >
                <Info className="size-5 text-gray-600 hover:text-[#00A88C]" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto bg-[radial-gradient(circle_at_12%_0%,rgba(255,92,58,0.16),transparent_30%),radial-gradient(circle_at_92%_18%,rgba(0,201,167,0.12),transparent_28%),linear-gradient(180deg,#E7EBE6_0%,#DCE3DE_58%,#E9DBD8_100%)] p-4 sm:p-6">
            <div className="text-center text-xs text-gray-500 mb-4">
              2024년 5월 24일 금요일
            </div>

            <div className="flex justify-start">
              <div className="max-w-[88%] rounded-2xl rounded-tl-sm border border-[#BDEFD8] bg-white p-4 shadow-sm sm:max-w-[70%]">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="size-5 text-[#00A88C]" />
                  <span className="text-sm font-semibold text-[#12382D]">
                    작업 프로세스 만들기
                  </span>
                </div>
                <p className="mb-3 text-sm leading-relaxed text-gray-700">
                  {activeConversation.role}를 단계별로 정리해두면 일정, 피드백,
                  최종 납품까지 한눈에 관리할 수 있어요.
                </p>
                <button
                  type="button"
                  onClick={handleCreateProcess}
                  className="rounded-lg bg-[#FF5C3A] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#E94F2F] hover:shadow-md"
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
                  className={`max-w-[88%] shadow-sm sm:max-w-[70%] ${
                    msg.isSelf
                      ? "bg-[#DDF8EC] text-[#12382D] rounded-2xl rounded-tr-sm border border-[#BDEFD8]"
                      : "bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-gray-200"
                  } ${msg.highlighted ? "bg-[#DDF8EC] text-[#12382D] border-[#BDEFD8]" : ""} p-4`}
                >
                  {!msg.isSelf && (
                    <div className="flex items-center gap-2 mb-2">
                      <ImageWithFallback
                        src={activeConversation.avatar}
                        alt={activeConversation.name}
                        className="size-6 rounded-full object-cover"
                      />
                    </div>
                  )}
                  {msg.message && (
                    <p className="text-sm leading-relaxed">{msg.message}</p>
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
                              className="inline-flex size-12 items-center justify-center rounded-lg bg-white/70 text-2xl shadow-sm"
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
                      msg.isSelf || msg.highlighted ? "text-[#2D5A4D]/70" : "text-gray-500"
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
                              ? "border-[#FF5C3A] bg-[#FFF1ED] text-[#B13A21] ring-1 ring-[#FF5C3A]/20"
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
                        className="inline-flex h-7 items-center gap-1 rounded-full border border-gray-200 bg-white/70 px-2 text-xs text-gray-600 transition-all hover:border-[#BDEFD8] hover:bg-white"
                        aria-label="메시지에 이모티콘 반응 추가"
                      >
                        <Smile className="size-3.5" />
                        반응
                      </button>
                      {reactionPickerMessageId === msg.clientId && (
                        <div
                          className={`reaction-picker-in absolute bottom-full z-50 mb-2 grid w-max grid-cols-5 gap-1 rounded-lg border border-[#BDEFD8] bg-white p-2 shadow-xl ${
                            msg.isSelf ? "right-0" : "left-0"
                          }`}
                        >
                          {reactionIcons.map((emoji, index) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleToggleReaction(msg.clientId, emoji)}
                              className="flex size-9 items-center justify-center rounded-lg text-xl transition-all hover:scale-110 hover:bg-[#A8F0E4]/20 active:scale-95"
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
            {isPartnerTyping && (
              <div
                className="flex justify-start"
                style={{ animation: "pickxelTypingBubbleIn 180ms ease-out both" }}
              >
                <div className="flex max-w-[88%] items-end gap-2 sm:max-w-[70%]">
                  <ImageWithFallback
                    src={activeConversation.avatar}
                    alt={activeConversation.name}
                    className="size-7 rounded-full object-cover shadow-sm"
                  />
                  <div className="rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-4 py-3 shadow-sm">
                    <div className="mb-1 text-xs font-medium text-gray-500">
                      {activeConversation.profileName}님이 입력 중...
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2].map((index) => (
                        <span
                          key={index}
                          className="size-2 rounded-full bg-[#00A88C]"
                          style={{
                            animation: "pickxelTypingDot 1s ease-in-out infinite",
                            animationDelay: `${index * 0.16}s`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-[#FFF1F3] via-[#FFE4EA] to-white border-2 border-[#FFB8C5]/70 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="size-5 text-[#E8456D]" />
                <span className="font-medium text-sm text-[#A30F3D]">AI 메시지 도우미</span>
              </div>
              <p className="text-sm text-[#5F2938] mb-3">
                답장을 더 자연스럽게 다듬거나, 다음 작업 단계에 맞는 메시지를 빠르게 작성해보세요.
              </p>
            <div className="flex flex-wrap gap-2">
                <button className="bg-[#E8456D] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#D7375F] hover:shadow-md transition-all">
                  미팅 일정 잡기
                </button>
                <button className="bg-white border-2 border-[#FFB8C5] px-4 py-2 rounded-lg text-sm text-[#A30F3D] hover:bg-[#FFF7F9] transition-all">
                  프로젝트 문서 첨부
                </button>
              </div>
            </div>
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 bg-white p-3 sm:p-4">
            {pendingAttachments.length > 0 && (
              <div className="mb-3 flex flex-wrap items-start gap-2 rounded-xl bg-[#F7F7F5] p-3">
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
                        className="relative flex size-16 items-center justify-center rounded-lg border border-gray-200 bg-white text-3xl"
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
                  <div className="flex basis-full items-center gap-2 rounded-lg bg-white/80 px-3 py-2 text-xs font-semibold text-[#B65318]">
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
                  className="p-2 hover:bg-[#A8F0E4]/20 rounded-lg transition-colors"
                  aria-label="파일 및 외부 도구 첨부"
                >
                  <AtSign className="size-5 text-[#00A88C]" />
                </button>
                {isAttachMenuOpen && (
                  <>
                    <div className="absolute bottom-full left-0 z-20 mb-3 hidden w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg lg:block">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-[#A8F0E4]/15"
                      >
                        <Paperclip className="size-4 text-[#00A88C]" />
                        파일 첨부
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAttachIntegration("figma")}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-[#A8F0E4]/15"
                      >
                        <Figma className="size-4 text-[#00A88C]" />
                        Figma 링크 연동
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAttachIntegration("adobe")}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-[#A8F0E4]/15"
                      >
                        <Sparkles className="size-4 text-[#FF5C3A]" />
                        Adobe 링크 연동
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAttachIntegration("pinterest")}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-[#FFF0F3]"
                      >
                        <Bookmark className="size-4 text-[#D3224B]" />
                        Pinterest 링크 연동
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAttachIntegration("photoshop")}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-[#EAF2FF]"
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
                    <div className="bottom-sheet-in fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white p-4 shadow-2xl lg:hidden">
                      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />
                      <p className="mb-3 text-sm font-bold text-[#12382D]">
                        첨부 추가
                      </p>
                      <div className="grid gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex w-full items-center gap-3 rounded-lg bg-[#F7F7F5] px-3 py-3 text-left text-sm font-semibold transition-colors hover:bg-[#EFFBF6]"
                        >
                          <Paperclip className="size-4 text-[#00A88C]" />
                          파일 첨부
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAttachIntegration("figma")}
                          className="flex w-full items-center gap-3 rounded-lg bg-[#F7F7F5] px-3 py-3 text-left text-sm font-semibold transition-colors hover:bg-[#EFFBF6]"
                        >
                          <Figma className="size-4 text-[#00A88C]" />
                          Figma 링크 연동
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAttachIntegration("adobe")}
                          className="flex w-full items-center gap-3 rounded-lg bg-[#F7F7F5] px-3 py-3 text-left text-sm font-semibold transition-colors hover:bg-[#FFF1ED]"
                        >
                          <Sparkles className="size-4 text-[#FF5C3A]" />
                          Adobe 링크 연동
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAttachIntegration("pinterest")}
                          className="flex w-full items-center gap-3 rounded-lg bg-[#F7F7F5] px-3 py-3 text-left text-sm font-semibold transition-colors hover:bg-[#FFF0F3]"
                        >
                          <Bookmark className="size-4 text-[#D3224B]" />
                          Pinterest 링크 연동
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAttachIntegration("photoshop")}
                          className="flex w-full items-center gap-3 rounded-lg bg-[#F7F7F5] px-3 py-3 text-left text-sm font-semibold transition-colors hover:bg-[#EAF2FF]"
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
              <div className="relative flex min-w-0 flex-1 items-center gap-2 rounded-2xl border-2 border-transparent bg-[#F7F7F5] px-3 py-3 transition-all focus-within:border-[#00C9A7] sm:px-4">
                <input
                  type="text"
                  value={messageText}
                  onChange={(event) => updateMessageText(event.target.value)}
                  onKeyDown={handleMessageKeyDown}
                  placeholder={`${activeConversation.name}님에게 메시지 보내기...`}
                  className="min-w-0 flex-1 bg-transparent text-sm focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setIsIconPickerOpen((prev) => !prev)}
                  className="p-1 hover:bg-[#A8F0E4]/30 rounded-lg transition-colors"
                  aria-label="아이콘 첨부"
                >
                  <Smile className="size-5 text-gray-600" />
                </button>
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="p-1 hover:bg-[#A8F0E4]/30 rounded-lg transition-colors"
                  aria-label="이미지 첨부"
                >
                  <Image className="size-5 text-gray-600" />
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
                  <div className="absolute bottom-full right-2 mb-3 grid grid-cols-6 gap-1 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                    {attachableIcons.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => handleAttachIcon(icon)}
                        className="flex size-9 items-center justify-center rounded-lg text-xl transition-colors hover:bg-[#A8F0E4]/20"
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
          className={`w-full flex-col border-gray-200 bg-white lg:static lg:z-auto lg:flex lg:max-h-none lg:w-80 lg:shrink-0 lg:rounded-none lg:border-l lg:shadow-none ${
            mobileView === "detail"
              ? "bottom-sheet-in fixed inset-x-0 bottom-0 z-50 flex max-h-[86vh] rounded-t-2xl shadow-2xl"
              : "hidden"
          }`}
        >
          <div className="flex items-center gap-2 border-b border-gray-200 p-3 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileView("chat")}
              className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-[#A8F0E4]/20"
              aria-label="채팅으로 돌아가기"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#12382D]">대화 정보</p>
              <p className="truncate text-xs text-gray-500">
                {activeConversation.name}
              </p>
            </div>
          </div>
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex-1 py-3 text-sm font-medium transition-all ${
                activeTab === "profile"
                  ? "text-[#00C9A7] border-b-2 border-[#00C9A7]"
                  : "text-gray-600 hover:text-[#00A88C]"
              }`}
            >
              프로필
            </button>
            <button
              onClick={() => setActiveTab("process")}
              className={`flex-1 py-3 text-sm font-medium transition-all ${
                activeTab === "process"
                  ? "text-[#00C9A7] border-b-2 border-[#00C9A7]"
                  : "text-gray-600 hover:text-[#00A88C]"
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
                    src={activeConversation.avatar}
                    alt={activeConversation.name}
                    className="mx-auto mb-4 size-24 rounded-full object-cover ring-4 ring-[#A8F0E4]/40 shadow-lg"
                  />
                  <h3 className="font-bold text-lg mb-1">{activeConversation.profileName}</h3>
                  <p className="text-sm text-gray-600">{activeConversation.title}</p>
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
                    <h4 className="font-medium mb-2">소개</h4>
                    <p className="text-sm text-gray-600">
                      {activeConversation.bio}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">공유된 미디어</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {activeConversation.sharedMedia.map((media) => (
                        <button
                          key={media.id}
                          type="button"
                          onClick={() => setSelectedImage({ src: media.src, name: media.title })}
                          className="group relative aspect-square overflow-hidden rounded-lg border border-gray-100 bg-gray-100 shadow-sm"
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
                    <h4 className="font-medium mb-2">설정</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">메시지 알림 받기</span>
                        <input type="checkbox" className="toggle" defaultChecked />
                      </div>
                      <button
                        type="button"
                        onClick={handleLeaveConversation}
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
                    <h3 className="font-bold text-lg">프로젝트 진행 상황</h3>
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
                  <p className="text-sm text-gray-600 mb-4">
                    프로젝트 단계별 진행 상황을 확인하고 관리하세요.
                  </p>
                </div>

                {!processCreated ? (
                  null
                ) : (
                  <>
                    {/* Progress Overview */}
                    <div className="bg-gradient-to-br from-[#A8F0E4]/20 to-white border border-[#00C9A7]/30 rounded-xl p-4 mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">전체 진행률</span>
                        <span className="text-sm font-bold text-[#00A88C]">
                          {getTotalProgress()}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
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

                        return (
                          <div
                            key={process.id}
                            className={`border rounded-xl overflow-hidden transition-all hover:border-[#00C9A7]/50 ${
                              isProcessApproved
                                ? "border-[#00C9A7]/60 bg-[#F7FFFC] shadow-[0_12px_30px_rgba(0,201,167,0.12)]"
                                : "border-gray-200"
                            }`}
                          >
                            <button
                              onClick={() => setExpandedProcess(isExpanded ? null : process.id)}
                              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
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
                                <h4 className="font-semibold text-sm text-[#12382D]">{process.title}</h4>
                                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${approvalBadge.className}`}>
                                  {approvalBadge.label}
                                </span>
                              </div>
                              <p className="text-xs font-medium text-gray-600">
                                {approvalSummary}
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-[11px] font-semibold text-gray-500">
                                  세부 작업
                                </span>
                                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${
                                      progress === 100 ? "bg-[#00C9A7]" : getStatusColor(process.status)
                                    } transition-all duration-500`}
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-500 font-medium min-w-[40px] text-right">
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
                          <div className="process-details-in px-4 pb-4 bg-gray-50/50">
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
                                      <Circle className="size-4 text-gray-300 group-hover:text-gray-400" />
                                    )}
                                  </button>
                                  <span
                                    className={`text-sm ${
                                      task.completed
                                        ? "text-gray-500 line-through"
                                        : "text-gray-700"
                                    }`}
                                  >
                                    {task.text}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-4 rounded-lg border border-[#BDEFD8] bg-white p-3">
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-[#12382D]">
                                    완료 확인
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    디자이너와 클라이언트가 모두 확인해야 완료됩니다.
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
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleProcessConfirmation(process.id, "designer")
                                  }
                                  aria-pressed={process.confirmations.designer}
                                  className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all ${
                                    process.confirmations.designer
                                      ? "border-[#9EE7D0] bg-white text-[#12382D] shadow-[0_8px_20px_rgba(0,201,167,0.12)] ring-1 ring-[#DDF8EC]"
                                      : "border-gray-200 bg-[#F7F7F5] text-gray-600 hover:-translate-y-0.5 hover:border-[#00C9A7] hover:bg-white"
                                  }`}
                                >
                                  <span className="flex items-center justify-center gap-2">
                                    <span
                                      className={`flex size-6 shrink-0 items-center justify-center rounded-full border transition-all ${
                                        process.confirmations.designer
                                          ? "border-[#00C9A7] bg-[#00C9A7] text-white"
                                          : "border-gray-300 bg-white text-transparent"
                                      }`}
                                    >
                                      <CheckCircle className="size-4" />
                                    </span>
                                    <span className="text-left leading-tight">
                                      <span className="block">디자이너</span>
                                      <span
                                        className={`block text-[11px] font-bold ${
                                          process.confirmations.designer
                                            ? "text-[#007E68]"
                                            : "text-gray-400"
                                        }`}
                                      >
                                        {process.confirmations.designer ? "확인 완료" : "확인 대기"}
                                      </span>
                                    </span>
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleProcessConfirmation(process.id, "client")
                                  }
                                  aria-pressed={process.confirmations.client}
                                  className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all ${
                                    process.confirmations.client
                                      ? "border-[#9EE7D0] bg-white text-[#12382D] shadow-[0_8px_20px_rgba(0,201,167,0.12)] ring-1 ring-[#DDF8EC]"
                                      : "border-gray-200 bg-[#F7F7F5] text-gray-600 hover:-translate-y-0.5 hover:border-[#00C9A7] hover:bg-white"
                                  }`}
                                >
                                  <span className="flex items-center justify-center gap-2">
                                    <span
                                      className={`flex size-6 shrink-0 items-center justify-center rounded-full border transition-all ${
                                        process.confirmations.client
                                          ? "border-[#00C9A7] bg-[#00C9A7] text-white"
                                          : "border-gray-300 bg-white text-transparent"
                                      }`}
                                    >
                                      <CheckCircle className="size-4" />
                                    </span>
                                    <span className="text-left leading-tight">
                                      <span className="block">클라이언트</span>
                                      <span
                                        className={`block text-[11px] font-bold ${
                                          process.confirmations.client
                                            ? "text-[#007E68]"
                                            : "text-gray-400"
                                        }`}
                                      >
                                        {process.confirmations.client ? "확인 완료" : "확인 대기"}
                                      </span>
                                    </span>
                                  </span>
                                </button>
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
                <div className="mt-6 pt-6 border-t border-gray-200">
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
                      className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 hover:border-[#FF5C3A] hover:text-[#FF5C3A] transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle className="size-5" />
                      작업 종료
                    </button>
                  )}
                  <p className="text-xs text-gray-500 text-center mt-3">
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
      </div>
      {integrationModalProvider && integrationModalMeta && (
        <div
          className="modal-backdrop-in fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4"
          onClick={closeIntegrationModal}
        >
          <div
            className="modal-panel-in w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-gray-200 bg-[#FAFBF8] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-[#FF5C3A]">
                    작업 링크 첨부
                  </p>
                  <h3 className="text-xl font-bold text-[#12382D]">
                    디자인 파일 공유
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    링크를 붙이면 채팅에 깔끔한 프로젝트 카드로 첨부됩니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeIntegrationModal}
                  className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-white hover:text-gray-800"
                  aria-label="링크 첨부 닫기"
                >
                  <XCircle className="size-5" />
                </button>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {integrationProviderOrder.map((provider) => {
                  const meta = integrationProviderMeta[provider];
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
                          ? `${meta.borderClassName} bg-white shadow-sm`
                          : "border-gray-200 bg-white/60 hover:bg-white"
                      }`}
                    >
                      <span
                        className={`mb-2 flex size-9 items-center justify-center rounded-lg ${meta.iconClassName}`}
                      >
                        {renderIntegrationProviderIcon(provider, "size-4")}
                      </span>
                      <span className="block text-xs font-bold text-[#12382D]">
                        {meta.shortLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-[#12382D]">
                  {integrationModalMeta.title}
                </label>
                <div
                  className={`flex items-center gap-3 rounded-lg border bg-white px-3 py-3 transition-colors ${
                    integrationUrlTouched && !canSubmitIntegrationLink
                      ? "border-[#FF5C3A]"
                      : "border-gray-200 focus-within:border-[#00C9A7]"
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
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  />
                </div>
                {integrationUrlTouched && !canSubmitIntegrationLink && (
                  <p className="mt-2 text-xs font-semibold text-[#D84325]">
                    공유할 수 있는 링크 주소를 입력해주세요.
                  </p>
                )}
              </div>

              <div className={`rounded-lg border p-4 ${integrationModalMeta.borderClassName} bg-white`}>
                <div className="flex gap-3">
                  <span
                    className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${integrationModalMeta.iconClassName}`}
                  >
                    {renderIntegrationProviderIcon(integrationModalProvider)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-[#12382D]">
                        {integrationModalMeta.previewTitle}
                      </p>
                      <ExternalLink className="size-4 shrink-0 text-gray-400" />
                    </div>
                    <p className="text-xs leading-relaxed text-gray-600">
                      {integrationModalMeta.description}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${integrationModalMeta.chipClassName}`}>
                        {integrationModalMeta.shortLabel}
                      </span>
                      <span className="max-w-[210px] truncate rounded-lg bg-[#F7F7F5] px-2.5 py-1 text-xs font-semibold text-gray-500">
                        {integrationUrlHost || "링크를 붙이면 도메인이 보여요"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-[#FAFBF8] p-4">
              <button
                type="button"
                onClick={closeIntegrationModal}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
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
            className="modal-panel-in flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-gray-200 p-5">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-[#FF5C3A]">
                  작업 프로세스
                </p>
                <h3 className="text-xl font-bold text-[#12382D]">
                  프로세스 섹션 만들기
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  큰 프로세스를 나누고, 각 섹션 안에 세부 프로세스를 추가하세요.
                </p>
              </div>
              <button
                type="button"
                onClick={requestCloseProcessModal}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
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
                  className={`rounded-lg border bg-white p-4 shadow-sm transition-all ${
                    draggingDraftProcessId === process.id
                      ? "border-[#FF5C3A] bg-[#FFF7F4]"
                      : "border-gray-200"
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
                      className="flex size-8 shrink-0 cursor-grab items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 transition-colors hover:border-[#FF5C3A] hover:text-[#FF5C3A] active:cursor-grabbing"
                      aria-label="프로세스 순서 변경"
                    >
                      <GripVertical className="size-4" />
                    </button>
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#FFF1ED] text-sm font-bold text-[#FF5C3A]">
                      {processIndex + 1}
                    </span>
                    <label className="min-w-0 flex-1">
                      <span className="mb-1 block text-xs font-semibold text-gray-500">
                        프로세스 이름
                      </span>
                      <input
                        type="text"
                        value={process.title}
                        onChange={(event) =>
                          updateDraftProcessTitle(process.id, event.target.value)
                        }
                        className="w-full rounded-lg border border-gray-200 bg-[#FAFBF8] px-3 py-2 text-sm font-semibold text-[#12382D] outline-none transition-colors focus:border-[#FF5C3A] focus:bg-white"
                        placeholder={`프로세스 ${processIndex + 1}`}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removeDraftProcess(process.id)}
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#FFD1C8] bg-[#FFF7F4] text-[#D84325] transition-colors hover:bg-[#FFF1ED]"
                      aria-label="프로세스 삭제"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  <div className="rounded-lg bg-[#F7F7F5] p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-gray-700">
                        세부 프로세스
                      </p>
                      <button
                        type="button"
                        onClick={() => addDraftTask(process.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#00A88C] shadow-sm transition-colors hover:bg-[#EFFBF6]"
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
                          className={`flex items-center gap-2 rounded-lg border bg-white px-2 py-2 transition-all ${
                            draggingDraftTask?.processId === process.id &&
                            draggingDraftTask.taskId === task.id
                              ? "border-[#00A88C] bg-[#EFFBF6]"
                              : "border-gray-200"
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
                            className="flex size-7 shrink-0 cursor-grab items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-[#EFFBF6] hover:text-[#00A88C] active:cursor-grabbing"
                            aria-label="세부 프로세스 순서 변경"
                          >
                            <GripVertical className="size-4" />
                          </button>
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-[#EFFBF6] text-xs font-bold text-[#00A88C]">
                            {taskIndex + 1}
                          </span>
                          <input
                            type="text"
                            value={task.text}
                            onChange={(event) =>
                              updateDraftTaskText(process.id, task.id, event.target.value)
                            }
                            className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 outline-none"
                            placeholder={`세부 프로세스 ${taskIndex + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => removeDraftTask(process.id, task.id)}
                            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-[#FFF1ED] hover:text-[#D84325]"
                            aria-label="세부 프로세스 삭제"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      ))}

                      {process.tasks.length === 0 && (
                        <div className="rounded-lg border border-dashed border-gray-300 bg-white/70 px-3 py-4 text-center text-xs font-semibold text-gray-500">
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
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#FF5C3A] bg-[#FFF7F4] px-4 py-3 text-sm font-semibold text-[#FF5C3A] transition-colors hover:bg-[#FFF1ED]"
              >
                <Plus className="size-4" />
                프로세스 추가
              </button>

              <section className="rounded-lg border border-[#BDEFD8] bg-[#F5FFFB] p-4">
                <div className="flex items-center gap-2">
                  <Eye className="size-4 text-[#00A88C]" />
                  <p className="text-sm font-bold text-[#12382D]">
                    저장 전 미리보기
                  </p>
                </div>
                <div className="mt-3 space-y-3">
                  {draftProcesses.length > 0 ? (
                    draftProcesses.map((process, processIndex) => (
                      <div
                        key={`preview-${process.id}`}
                        className="rounded-lg border border-[#DCEFE7] bg-white p-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#FFF1ED] text-xs font-bold text-[#FF5C3A]">
                            {processIndex + 1}
                          </span>
                          <p className="min-w-0 flex-1 truncate text-sm font-bold text-[#12382D]">
                            {process.title.trim() || "프로세스 이름 없음"}
                          </p>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {process.tasks.length > 0 ? (
                            process.tasks.map((task, taskIndex) => (
                              <span
                                key={`preview-task-${task.id}`}
                                className="rounded-lg bg-[#EFFBF6] px-2 py-1 text-xs font-semibold text-[#007E68]"
                              >
                                {taskIndex + 1}. {task.text.trim() || "세부 이름 없음"}
                              </span>
                            ))
                          ) : (
                            <span className="rounded-lg bg-[#FFF1ED] px-2 py-1 text-xs font-semibold text-[#D84325]">
                              세부 프로세스 없음
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed border-[#DCEFE7] bg-white/70 px-3 py-5 text-center text-sm font-semibold text-gray-500">
                      미리볼 프로세스가 없습니다.
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-200 bg-[#FAFBF8] p-4 md:flex-row md:items-center md:justify-between">
              <p
                className={`text-xs font-semibold ${
                  draftValidationMessage ? "text-[#D84325]" : "text-gray-500"
                }`}
              >
                {draftValidationMessage || "미리보기를 확인한 뒤 저장할 수 있어요."}
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={requestCloseProcessModal}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={applyProcessDraft}
                  disabled={Boolean(draftValidationMessage)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all ${
                    draftValidationMessage
                      ? "cursor-not-allowed bg-gray-300"
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
