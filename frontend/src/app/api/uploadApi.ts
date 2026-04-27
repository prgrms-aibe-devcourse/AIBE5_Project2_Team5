import { apiRequest } from "./apiClient";

const EXT_MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

function normalizeFileType(file: File): File {
  if (file.type) return file;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mimeType = EXT_MIME_MAP[ext];
  if (!mimeType) return file;
  return new File([file], file.name, { type: mimeType });
}

export type ProfileImageUploadResponse = {
  imageUrl: string;
};

export type FeedImagesUploadResponse = {
  postId: number;
  imageUrls: string[];
  thumbnailImageUrl: string | null;
};

export type ApplicationPortfolioUploadResponse = {
  postId: number;
  fileUrl: string;
  fileName: string;
  contentType: string;
  size: number;
};

export type MessageAttachmentUploadItemResponse = {
  type: "image" | "file";
  name: string;
  url: string;
  contentType: string;
  size: number;
};

export type MessageAttachmentsUploadResponse = {
  conversationId: number;
  attachments: MessageAttachmentUploadItemResponse[];
};

export async function uploadProfileImageApi(file: File) {
  const formData = new FormData();
  formData.append("file", normalizeFileType(file));

  return apiRequest<ProfileImageUploadResponse>(
    "/api/uploads/profile-image",
    {
      method: "POST",
      body: formData,
    },
    "Failed to upload profile image.",
  );
}

export async function uploadFeedImagesApi(postId: number, files: File[]) {
  const formData = new FormData();
  formData.append("postId", String(postId));
  files.forEach((file) => formData.append("files", normalizeFileType(file)));

  return apiRequest<FeedImagesUploadResponse>(
    "/api/uploads/feed-images",
    {
      method: "POST",
      body: formData,
    },
    "Failed to upload feed images.",
  );
}

export async function replaceFeedImagesApi(
  postId: number,
  existingImageUrls: string[],
  files: File[],
) {
  const formData = new FormData();
  formData.append("postId", String(postId));
  existingImageUrls.forEach((imageUrl) => formData.append("existingImageUrls", imageUrl));
  files.forEach((file) => formData.append("files", normalizeFileType(file)));

  return apiRequest<FeedImagesUploadResponse>(
    "/api/uploads/feed-images/replace",
    {
      method: "POST",
      body: formData,
    },
    "Failed to replace feed images.",
  );
}

export async function uploadProjectApplicationPortfolioApi(postId: number, file: File) {
  const formData = new FormData();
  formData.append("postId", String(postId));
  formData.append("file", normalizeFileType(file));

  return apiRequest<ApplicationPortfolioUploadResponse>(
    "/api/uploads/project-application-portfolio",
    {
      method: "POST",
      body: formData,
    },
    "Failed to upload project application portfolio.",
  );
}

export async function uploadMessageAttachmentsApi(conversationId: number, files: File[]) {
  const formData = new FormData();
  formData.append("conversationId", String(conversationId));
  files.forEach((file) => formData.append("files", normalizeFileType(file)));

  return apiRequest<MessageAttachmentsUploadResponse>(
    "/api/uploads/message-attachments",
    {
      method: "POST",
      body: formData,
    },
    "Failed to upload message attachments.",
  );
}
