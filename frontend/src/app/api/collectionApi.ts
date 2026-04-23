import { apiRequest } from "./apiClient";

export type CollectionFeedResponse = {
  postId: number;
  authorId: number;
  authorNickname: string;
  authorProfileImage: string | null;
  title: string;
  description: string | null;
  category: string | null;
  categoryCode: string | null;
  pickCount: number | null;
  commentCount: number;
  thumbnailImageUrl: string | null;
  imageUrls: string[];
  createdAt: string | null;
};

export type CollectionFolderResponse = {
  folderId: number;
  folderName: string;
  ownerId: number;
  ownerNickname: string;
  itemCount: number;
  previewImageUrls: string[];
  createdAt: string | null;
};

export type CollectionFolderDetailResponse = {
  folderId: number;
  folderName: string;
  ownerId: number;
  ownerNickname: string;
  createdAt: string | null;
  feeds: CollectionFeedResponse[];
};

export async function getMyCollectionsApi() {
  return apiRequest<CollectionFolderResponse[]>(
    "/api/collections",
    {},
    "컬렉션을 불러오지 못했습니다.",
  );
}

export async function getProfileCollectionsApi(profileKey: string) {
  return apiRequest<CollectionFolderResponse[]>(
    `/api/profiles/${encodeURIComponent(profileKey)}/collections`,
    {},
    "컬렉션을 불러오지 못했습니다.",
  );
}

export async function getCollectionFolderApi(folderId: number) {
  return apiRequest<CollectionFolderDetailResponse>(
    `/api/collections/${folderId}`,
    {},
    "컬렉션 폴더를 불러오지 못했습니다.",
  );
}

export async function createCollectionFolderApi(folderName: string) {
  return apiRequest<CollectionFolderResponse>(
    "/api/collections/folders",
    {
      method: "POST",
      body: JSON.stringify({ folderName }),
    },
    "컬렉션 폴더를 만들지 못했습니다.",
  );
}

export async function renameCollectionFolderApi(folderId: number, folderName: string) {
  return apiRequest<CollectionFolderResponse>(
    `/api/collections/folders/${folderId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ folderName }),
    },
    "컬렉션 폴더 이름을 바꾸지 못했습니다.",
  );
}

export async function deleteCollectionFolderApi(folderId: number) {
  return apiRequest<void>(
    `/api/collections/folders/${folderId}`,
    { method: "DELETE" },
    "컬렉션 폴더를 삭제하지 못했습니다.",
  );
}

export async function saveFeedToCollectionApi(folderId: number, postId: number) {
  return apiRequest<CollectionFolderDetailResponse>(
    `/api/collections/${folderId}/feeds`,
    {
      method: "POST",
      body: JSON.stringify({ postId }),
    },
    "피드를 컬렉션에 저장하지 못했습니다.",
  );
}

export async function removeFeedFromCollectionApi(folderId: number, postId: number) {
  return apiRequest<CollectionFolderDetailResponse>(
    `/api/collections/${folderId}/feeds/${postId}`,
    { method: "DELETE" },
    "컬렉션에서 피드를 제거하지 못했습니다.",
  );
}

export async function reorderCollectionFoldersApi(folderIds: number[]) {
  return apiRequest<void>(
    "/api/collections/reorder",
    {
      method: "POST",
      body: JSON.stringify({ folderIds }),
    },
    "컬렉션 순서를 저장하지 못했습니다.",
  );
}
