import { useEffect, useMemo, useState } from "react";
import {
  createCollectionFolderApi,
  getCollectionFolderApi,
  getMyCollectionsApi,
  removeFeedFromCollectionApi,
  saveFeedToCollectionApi,
  type CollectionFolderResponse,
} from "../api/collectionApi";

type FeedLike = {
  id: number;
  title: string;
};

export function useFeedCollections<TFeed extends FeedLike>() {
  const [collections, setCollections] = useState<CollectionFolderResponse[]>([]);
  const [collectionPostIdsByFolder, setCollectionPostIdsByFolder] = useState<Record<number, number[]>>({});
  const [collectionModalFeed, setCollectionModalFeed] = useState<TFeed | null>(null);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [collectionSavedNotice, setCollectionSavedNotice] = useState("");
  const [isCollectionSaving, setIsCollectionSaving] = useState(false);

  const savedItemIds = useMemo(
    () => new Set(Object.values(collectionPostIdsByFolder).flat()),
    [collectionPostIdsByFolder]
  );

  async function loadCollections() {
    try {
      const folders = await getMyCollectionsApi();
      setCollections(folders);

      const folderDetails = await Promise.all(
        folders.map(async (folder) => {
          const detail = await getCollectionFolderApi(folder.folderId);
          return [folder.folderId, detail.feeds.map((feed) => feed.postId)] as const;
        })
      );

      setCollectionPostIdsByFolder(Object.fromEntries(folderDetails));
    } catch (error) {
      console.error("컬렉션 로딩 실패:", error);
    }
  }

  useEffect(() => {
    void loadCollections();
  }, []);

  const openCollectionModal = (feed: TFeed, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCollectionModalFeed(feed);
    setCollectionSavedNotice("");
    setIsCollectionSaving(false);
    setNewCollectionName("");
    void loadCollections();
  };

  const closeCollectionModal = () => {
    setCollectionModalFeed(null);
  };

  const saveToCollection = async (folderId: number) => {
    if (!collectionModalFeed) return;

    const selectedFolder = collections.find((collection) => collection.folderId === folderId);
    const savedPostIds = collectionPostIdsByFolder[folderId] ?? [];
    if (savedPostIds.includes(collectionModalFeed.id)) {
      try {
        setIsCollectionSaving(true);
        await removeFeedFromCollectionApi(folderId, collectionModalFeed.id);
        setCollectionPostIdsByFolder((prev) => ({
          ...prev,
          [folderId]: (prev[folderId] ?? []).filter((postId) => postId !== collectionModalFeed.id),
        }));
        setCollectionSavedNotice(`${selectedFolder?.folderName ?? "컬렉션"}에서 제거했어요.`);
        void loadCollections();
      } catch (error) {
        setCollectionSavedNotice("컬렉션에서 제거하는 중 오류가 발생했습니다.");
      } finally {
        setIsCollectionSaving(false);
      }
      return;
    }

    try {
      setIsCollectionSaving(true);
      await saveFeedToCollectionApi(folderId, collectionModalFeed.id);
      setCollectionPostIdsByFolder((prev) => ({
        ...prev,
        [folderId]: [...(prev[folderId] ?? []), collectionModalFeed.id],
      }));
      setCollectionSavedNotice(`${selectedFolder?.folderName ?? "컬렉션"}에 저장했어요.`);
      void loadCollections();
    } catch (error) {
      setCollectionSavedNotice("컬렉션 저장 중 오류가 발생했습니다.");
      setIsCollectionSaving(false);
      return;
    }

    setIsCollectionSaving(false);
  };

  const createCollectionAndSave = async () => {
    if (!collectionModalFeed) return;

    const folderName = newCollectionName.trim();
    if (!folderName) return;

    try {
      setIsCollectionSaving(true);
      const newFolder = await createCollectionFolderApi(folderName);
      await saveFeedToCollectionApi(newFolder.folderId, collectionModalFeed.id);
      setCollectionPostIdsByFolder((prev) => ({
        ...prev,
        [newFolder.folderId]: [collectionModalFeed.id],
      }));
      setCollectionSavedNotice(`${folderName} 컬렉션을 만들고 저장했어요.`);
      setNewCollectionName("");
      void loadCollections();
    } catch (error) {
      setCollectionSavedNotice("컬렉션 생성 또는 저장 중 오류가 발생했습니다.");
      setIsCollectionSaving(false);
      return;
    }

    setIsCollectionSaving(false);
  };

  return {
    collections,
    collectionPostIdsByFolder,
    collectionModalFeed,
    newCollectionName,
    collectionSavedNotice,
    isCollectionSaving,
    savedItemIds,
    setNewCollectionName,
    loadCollections,
    openCollectionModal,
    closeCollectionModal,
    saveToCollection,
    createCollectionAndSave,
  };
}
