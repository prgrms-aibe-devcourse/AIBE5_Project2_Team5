import { apiRequest } from "./apiClient";

export type ProfileImageUploadResponse = {
  imageUrl: string;
};

export type FeedImagesUploadResponse = {
  postId: number;
  imageUrls: string[];
  thumbnailImageUrl: string | null;
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
  formData.append("file", file);

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
  files.forEach((file) => formData.append("files", file));

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
  files.forEach((file) => formData.append("files", file));

  return apiRequest<FeedImagesUploadResponse>(
    "/api/uploads/feed-images/replace",
    {
      method: "POST",
      body: formData,
    },
    "Failed to replace feed images.",
  );
}

export async function uploadMessageAttachmentsApi(conversationId: number, files: File[]) {
  const formData = new FormData();
  formData.append("conversationId", String(conversationId));
  files.forEach((file) => formData.append("files", file));

  return apiRequest<MessageAttachmentsUploadResponse>(
    "/api/uploads/message-attachments",
    {
      method: "POST",
      body: formData,
    },
    "Failed to upload message attachments.",
  );
}
