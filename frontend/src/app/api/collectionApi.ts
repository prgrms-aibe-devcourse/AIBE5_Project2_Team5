import { apiRequest } from "./apiClient";

export type CollectionFolderResponseDto = {
  folderId: number;
  folderName: string;
  itemIds: number[];
};

// 19. 컬렉션 폴더 목록 조회
export async function getCollectionFoldersApi() {
  return apiRequest<CollectionFolderResponseDto[]>(
    "/api/collections",
    {},
    "컬렉션 폴더 목록을 불러오는데 실패했습니다."
  );
}

// 20. 컬렉션에 피드 저장
export async function saveFeedToFolderApi(folderId: number, postId: number) {
  return apiRequest<{ message: string }>(
    `/api/collections/${folderId}/feeds`,
    {
      method: "POST",
      body: JSON.stringify({ postId }),
    },
    "피드를 컬렉션에 저장하는데 실패했습니다."
  );
}
