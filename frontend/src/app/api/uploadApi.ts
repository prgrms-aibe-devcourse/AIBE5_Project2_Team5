import { apiRequest } from "./apiClient";

export type ProfileImageUploadResponse = {
  imageUrl: string;
};

export type FeedImagesUploadResponse = {
  postId: number;
  imageUrls: string[];
  thumbnailImageUrl: string | null;
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
