import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Footer from "../components/Footer";
import {
  Funnel,
  Grid3X3,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Navigation from "../components/Navigation";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import {
  getMyCollectionsApi,
  getCollectionFolderApi,
  createCollectionFolderApi,
  renameCollectionFolderApi,
  deleteCollectionFolderApi,
  removeFeedFromCollectionApi,
  reorderCollectionFoldersApi,
  type CollectionFolderResponse,
  type CollectionFolderDetailResponse,
} from "../api/collectionApi";

type CollectionFilter = "all" | "with-items" | "empty" | "recent";

const filterOptions: Array<{ value: CollectionFilter; label: string }> = [
  { value: "all", label: "전체" },
  { value: "with-items", label: "저장된 피드 있음" },
  { value: "empty", label: "빈 컬렉션" },
  { value: "recent", label: "최근 업데이트순" },
];

const getRelativeUpdateLabel = (updatedAt: string) => {
  const diff = Date.now() - new Date(updatedAt).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 1) return "방금 업데이트";
  if (hours < 24) return `${hours}시간 전 업데이트`;
  if (days < 7) return `${days}일 전 업데이트`;
  return "1주 이상 전 업데이트";
};

export default function Collections() {
  const [collections, setCollections] = useState<CollectionFolderResponse[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<CollectionFolderDetailResponse | null>(null);
  const [activeFilter, setActiveFilter] = useState<CollectionFilter>("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [openCollectionMenuId, setOpenCollectionMenuId] = useState<number | null>(null);
  const [editingCollectionName, setEditingCollectionName] = useState("");
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draggingCollectionId, setDraggingCollectionId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [collectionToDeleteId, setCollectionToDeleteId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    void loadCollections();
  }, []);

  async function loadCollections() {
    try {
      setIsLoading(true);
      const data = await getMyCollectionsApi();
      setCollections(data);
    } catch (err) {
      setError("컬렉션을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredCollections = useMemo(() => {
    const orderedCollections =
      activeFilter === "recent"
        ? [...collections].sort((left, right) => {
            const dateL = left.createdAt ? new Date(left.createdAt).getTime() : 0;
            const dateR = right.createdAt ? new Date(right.createdAt).getTime() : 0;
            return dateR - dateL;
          })
        : collections;

    if (activeFilter === "all" || activeFilter === "recent") return orderedCollections;
    if (activeFilter === "with-items") {
      return orderedCollections.filter((collection) => collection.itemCount > 0);
    }
    return orderedCollections.filter((collection) => collection.itemCount === 0);
  }, [activeFilter, collections]);

  const selectedCollectionItems = useMemo(() => {
    return selectedCollection?.feeds ?? [];
  }, [selectedCollection]);

  const handleCreateCollection = async () => {
    const trimmedName = newCollectionName.trim();
    if (!trimmedName) return;

    try {
      await createCollectionFolderApi(trimmedName);
      setNewCollectionName("");
      setShowCreateModal(false);
      void loadCollections();
    } catch (err) {
      toast.error("컬렉션 생성에 실패했습니다.");
    }
  };

  const moveCollectionToIndex = (collectionId: number, targetCollectionId: number) => {
    // API doesn't support reordering yet, keeping local UI state for now
    setCollections((prev) => {
      const currentIndex = prev.findIndex((collection) => collection.folderId === collectionId);
      const targetIndex = prev.findIndex((collection) => collection.folderId === targetCollectionId);
      if (currentIndex === -1 || targetIndex === -1 || currentIndex === targetIndex) return prev;

      const next = [...prev];
      const [movedCollection] = next.splice(currentIndex, 1);
      next.splice(targetIndex, 0, movedCollection);
      return next;
    });
  };

  const deleteCollection = async (collectionId: number) => {
    console.log("Proceeding with API delete call for ID:", collectionId);
    try {
      await deleteCollectionFolderApi(collectionId);
      console.log("Delete API success");
      
      setIsDeleteDialogOpen(false);
      setCollectionToDeleteId(null);
      setSelectedCollectionId(null);
      setSelectedCollection(null);
      setOpenCollectionMenuId(null);
      
      void loadCollections();
    } catch (err) {
      console.error("Delete API failed:", err);
      toast.error("컬렉션 삭제에 실패했습니다.");
    }
  };

  const openDeleteConfirm = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Opening custom delete confirm for ID:", id);
    setCollectionToDeleteId(id);
    setIsDeleteDialogOpen(true);
    setOpenCollectionMenuId(null); // 메뉴 닫기
  };

  const startReorderMode = () => {
    setActiveFilter("all");
    setIsReorderMode(true);
    setOpenCollectionMenuId(null);
  };

  const stopReorderMode = async () => {
    setIsReorderMode(false);
    setDraggingCollectionId(null);
    
    // 변경된 순서를 서버에 저장
    const folderIds = collections.map(c => c.folderId);
    console.log("Saving reordered folder IDs:", folderIds);
    
    try {
      await reorderCollectionFoldersApi(folderIds);
      console.log("Reorder saved successfully");
      void loadCollections(); // 서버의 정렬된 최신 데이터 다시 불러오기
    } catch (err) {
      console.error("Reorder failed:", err);
      toast.error("순서 저장에 실패했습니다.");
      void loadCollections(); // 실패 시 원래 순서로 복구
    }
  };

  const handleCollectionDragStart = (collectionId: number) => {
    if (!isReorderMode) return;
    setDraggingCollectionId(collectionId);
  };

  const handleCollectionDrop = (targetCollectionId: number) => {
    if (!draggingCollectionId || draggingCollectionId === targetCollectionId) return;
    moveCollectionToIndex(draggingCollectionId, targetCollectionId);
    setDraggingCollectionId(null);
  };

  const handleOpenCollectionDetail = async (collectionId: number) => {
    setSelectedCollectionId(collectionId);
    const folder = collections.find((item) => item.folderId === collectionId);
    setEditingCollectionName(folder?.folderName ?? "");
    
    try {
      const detail = await getCollectionFolderApi(collectionId);
      setSelectedCollection(detail);
    } catch (err) {
      toast.error("컬렉션 상세 정보를 불러오지 못했습니다.");
    }
  };

  const handleRenameSelectedCollection = async () => {
    if (!selectedCollectionId || !editingCollectionName.trim()) return;
    console.log("Renaming collection:", selectedCollectionId, "to:", editingCollectionName.trim());

    try {
      await renameCollectionFolderApi(selectedCollectionId, editingCollectionName.trim());
      console.log("Rename successful");
      void loadCollections();
      if (selectedCollection) {
        setSelectedCollection({ ...selectedCollection, folderName: editingCollectionName.trim() });
      }
    } catch (err) {
      console.error("Rename failed:", err);
      toast.error("이름 수정에 실패했습니다.");
    }
  };

  const handleRemoveFeedFromCollection = async (postId: number) => {
    if (!selectedCollectionId) return;

    try {
      await removeFeedFromCollectionApi(selectedCollectionId, postId);
      const detail = await getCollectionFolderApi(selectedCollectionId);
      setSelectedCollection(detail);
      void loadCollections();
    } catch (err) {
      toast.error("피드 제거에 실패했습니다.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F7F5]">
      <Navigation />

      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-[1400px]">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold">나의 컬렉션</h1>
            <p className="text-[#5F5E5A]">
              영감을 주는 작업물과 프로젝트 아이디어를 저장하고 정리해보세요.
              <br />
              저장한 피드를 컬렉션별로 나눠 보고, 새 컬렉션도 직접 만들 수 있습니다.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu((prev) => !prev)}
                className="flex items-center gap-2 rounded-lg border border-[#EAEAE8] px-4 py-2 text-sm hover:bg-[#F1EFE8]"
              >
                <Funnel className="size-4" />
                <span>필터</span>
              </button>
              {showFilterMenu && (
                <div className="absolute right-0 top-12 z-20 w-56 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl">
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setActiveFilter(option.value);
                        setShowFilterMenu(false);
                      }}
                      className={`flex w-full items-center rounded-xl px-3 py-2 text-sm transition-colors ${
                        activeFilter === option.value
                          ? "bg-[#EEF9F6] font-semibold text-[#00A88C]"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-sm text-white hover:bg-gray-800"
            >
              <Plus className="size-4" />새 컬렉션
            </button>
          </div>
        </div>

        <div className="mb-4 text-sm text-[#5F5E5A]">
          현재 보기:{" "}
          <span className="font-semibold text-[#0F0F0F]">
            {filterOptions.find((option) => option.value === activeFilter)?.label}
          </span>
        </div>

        {isReorderMode && (
          <div className="mb-5 flex items-center justify-between rounded-2xl border border-[#CDEFE6] bg-[#F3FCF8] px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-[#0F0F0F]">
              <GripVertical className="size-4 text-[#00A88C]" />
              <span>컬렉션 카드를 끌어서 원하는 순서로 배치하세요.</span>
            </div>
            <button
              onClick={stopReorderMode}
              className="rounded-xl border border-[#B6E6DA] px-3 py-1.5 text-sm text-[#007E68] hover:bg-white"
            >
              순서 변경 종료
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCollections.map((collection) => {
            const previewItems = collection.previewImageUrls.slice(0, 3);

            return (
              <div
                key={collection.folderId}
                onClick={() => handleOpenCollectionDetail(collection.folderId)}
                draggable={isReorderMode && activeFilter === "all"}
                onDragStart={() => handleCollectionDragStart(collection.folderId)}
                onDragOver={(event) => {
                  if (!isReorderMode) return;
                  event.preventDefault();
                }}
                onDrop={() => handleCollectionDrop(collection.folderId)}
                onDragEnd={() => setDraggingCollectionId(null)}
                className={`relative cursor-pointer overflow-visible rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-lg ${
                  draggingCollectionId === collection.folderId ? "opacity-60 ring-2 ring-[#00C9A7]" : ""
                } ${isReorderMode && activeFilter === "all" ? "cursor-grab" : ""}`}
              >
                <div className="relative h-64 bg-gray-100 p-1">
                  {collection.itemCount > 0 ? (
                    <div className="grid h-full grid-cols-2 gap-1">
                      {previewItems.map((url, index) => (
                        <div
                          key={`${collection.folderId}-${index}`}
                          className={`relative overflow-hidden rounded ${
                            index === 0 ? "col-span-1 row-span-2" : "col-span-1"
                          }`}
                        >
                          <ImageWithFallback
                            src={url}
                            alt={collection.folderName}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                      {collection.itemCount > 3 && (
                        <div className="flex items-center justify-center rounded bg-black/85 text-white">
                          <span className="text-xl font-semibold">
                            +{collection.itemCount - 3}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#D8D6CF] bg-[#F7F7F5] text-center">
                      <Grid3X3 className="mb-3 size-10 text-[#8B8A84]" />
                      <p className="font-medium text-[#5F5E5A]">아직 저장된 피드가 없습니다</p>
                      <p className="mt-1 text-sm text-[#8B8A84]">Feed에서 마음에 드는 작업을 저장해보세요.</p>
                    </div>
                  )}
                </div>

                <div className="flex items-start justify-between p-4">
                  <div className="flex items-start gap-3">
                    {isReorderMode && activeFilter === "all" && (
                      <div className="rounded-xl bg-[#F3FCF8] p-2 text-[#00A88C]">
                        <GripVertical className="size-4" />
                      </div>
                    )}
                    <div>
                    <h3 className="mb-1 text-lg font-semibold">{collection.folderName}</h3>
                    <p className="text-sm text-[#5F5E5A]">
                      피드 {collection.itemCount}개 · {collection.createdAt ? getRelativeUpdateLabel(collection.createdAt) : "날짜 없음"}
                    </p>
                    </div>
                  </div>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      setOpenCollectionMenuId((prev) =>
                        prev === collection.folderId ? null : collection.folderId
                      );
                    }}
                    className="rounded-lg p-2 hover:bg-[#F1EFE8]"
                  >
                    <MoreHorizontal className="size-5 text-[#5F5E5A]" />
                  </button>
                </div>

                {openCollectionMenuId === collection.folderId && (
                  <div className="absolute right-4 top-[20.5rem] z-20 w-44 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        startReorderMode();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      <GripVertical className="size-4" />
                      순서 변경
                    </button>
                    <button
                      onClick={(event) => openDeleteConfirm(event, collection.folderId)}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="size-4" />
                      컬렉션 삭제
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex h-[352px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#EAEAE8] bg-[#F1EFE8] transition-colors hover:border-gray-400 hover:bg-[#F7F7F5]"
          >
            <div className="mb-4 rounded-full bg-[#F7F7F5] p-4">
              <Plus className="size-8 text-[#5F5E5A]" />
            </div>
            <p className="font-medium text-[#5F5E5A]">새 컬렉션 추가</p>
          </button>
        </div>

        <section className="mt-16 flex items-center justify-between rounded-2xl bg-gradient-to-r from-gray-100 to-[#D4F4F4] p-12">
          <div className="max-w-xl">
            <h2 className="mb-4 text-3xl font-bold">영감을 실전으로 만드는 방법</h2>
            <p className="mb-6 leading-relaxed text-gray-700">
              저장한 컬렉션은 작업 기준 정리, 레퍼런스 분류, 제안 준비에 바로 활용할 수 있습니다.
              피드를 계속 저장해 컬렉션을 채워보세요.
            </p>
            <button className="flex items-center gap-2 rounded-lg bg-[#4DD4AC] px-6 py-3 font-medium text-black hover:bg-[#3BC99A]">
              AI 분석 시작하기
            </button>
          </div>
          <div className="h-64 w-80 rounded-xl bg-gray-200"></div>
        </section>
      </div>
    </main>

    <Footer />

      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-[#00A88C]">새 컬렉션</p>
                <h2 className="mt-1 text-2xl font-bold text-[#0F0F0F]">컬렉션 만들기</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-full border border-gray-200 p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-700"
              >
                <X className="size-5" />
              </button>
            </div>
            <label className="mb-2 block text-sm font-semibold text-[#0F0F0F]">
              컬렉션 이름
            </label>
            <input
              value={newCollectionName}
              onChange={(event) => setNewCollectionName(event.target.value)}
              placeholder="예: 앱 레퍼런스 모음"
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-[#00C9A7]"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleCreateCollection}
                disabled={!newCollectionName.trim()}
                className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                  newCollectionName.trim()
                    ? "bg-black text-white hover:bg-gray-800"
                    : "cursor-not-allowed bg-gray-100 text-gray-400"
                }`}
              >
                생성하기
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedCollection && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          onClick={() => {
            setSelectedCollectionId(null);
            setSelectedCollection(null);
          }}
        >
          <div
            className="w-full max-w-6xl rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <p className="text-sm font-semibold text-[#00A88C]">컬렉션 상세</p>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    value={editingCollectionName}
                    onChange={(event) => setEditingCollectionName(event.target.value)}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-2xl font-bold text-[#0F0F0F] outline-none transition-colors focus:border-[#00C9A7]"
                  />
                  <button
                    onClick={handleRenameSelectedCollection}
                    className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    <Pencil className="size-4" />
                    이름 수정
                  </button>
                  <button
                    onClick={(e) => openDeleteConfirm(e, selectedCollection.folderId)}
                    className="flex items-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="size-4" />
                    컬렉션 삭제
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  저장된 피드 {selectedCollectionItems.length}개를 격자형으로 확인할 수 있습니다.
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedCollectionId(null);
                  setSelectedCollection(null);
                }}
                className="rounded-full border border-gray-200 p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-700"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="max-h-[72vh] overflow-y-auto px-6 py-6">
              {selectedCollectionItems.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {selectedCollectionItems.map((item) => (
                    <article
                      key={item.postId}
                      className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
                    >
                      <ImageWithFallback
                        src={item.thumbnailImageUrl ?? ""}
                        alt={item.title}
                        className="h-56 w-full object-cover"
                      />
                      <div className="p-4">
                        <p className="text-xs font-semibold text-[#00A88C]">{item.category || "미분류"}</p>
                        <h3 className="mt-2 text-lg font-bold text-[#0F0F0F]">{item.title}</h3>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">
                          {item.description}
                        </p>
                        <div className="mt-4 flex items-center gap-3">
                          <ImageWithFallback
                            src={item.authorProfileImage ?? ""}
                            alt={item.authorNickname}
                            className="size-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm font-semibold text-[#0F0F0F]">{item.authorNickname}</p>
                            <p className="text-xs text-gray-500">디자이너</p>
                          </div>
                        </div>
                        <div className="mt-4 flex gap-4 text-xs text-gray-500">
                          <span>좋아요 {item.pickCount ?? 0}</span>
                          <span>댓글 {item.commentCount}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveFeedFromCollection(item.postId)}
                          className="mt-4 rounded-xl border border-red-200 px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                        >
                          피드 제거
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border-2 border-dashed border-[#D8D6CF] bg-[#F7F7F5] px-6 py-20 text-center">
                  <Grid3X3 className="mx-auto mb-4 size-12 text-[#8B8A84]" />
                  <h3 className="text-2xl font-bold text-[#0F0F0F]">저장된 피드가 없습니다</h3>
                  <p className="mt-2 text-gray-500">
                    Feed에서 북마크 버튼으로 피드를 저장하면 이 컬렉션에서 grid로 볼 수 있습니다.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* 삭제 확인 커스텀 모달 */}
      <AnimatePresence>
        {isDeleteDialogOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteDialogOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                <Trash2 className="size-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">컬렉션 삭제</h3>
              <p className="mb-6 text-sm text-gray-500">
                정말 이 컬렉션을 삭제하시겠습니까? 컬렉션 내의 저장된 피드 정보가 모두 삭제되며, 이 작업은 되돌릴 수 없습니다.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => collectionToDeleteId && deleteCollection(collectionToDeleteId)}
                  className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-semibold text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
                >
                  삭제하기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
