import { useEffect, useMemo, useRef, useState } from "react";
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
import { AnimatedFolder, getFolderGradientByFolderId, type Project } from "../components/ui/3d-folder";
import { useNightMode } from "../contexts/NightModeContext";
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

function collectionToFolderProjects(collection: CollectionFolderResponse): Project[] {
  return collection.previewImageUrls
    .filter((url) => url?.trim())
    .map((url, i) => ({
      id: `${collection.folderId}-p${i}`,
      image: url,
      title: `${collection.folderName} ${i + 1}`,
    }));
}

export default function Collections() {
  const { isNight } = useNightMode();
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

  useEffect(() => {
    const handleClickOutside = () => {
      if (openCollectionMenuId !== null) setOpenCollectionMenuId(null);
      if (showFilterMenu) setShowFilterMenu(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openCollectionMenuId, showFilterMenu]);

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
    <div className={`flex min-h-screen flex-col transition-colors duration-700 ${isNight ? "bg-[#0C1222]" : "bg-[#F7F7F5]"}`}>
      <Navigation />

      <main className="pickxel-animate-fade-in flex-1 px-6 py-8">
        <div className="mx-auto max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className={`mb-2 text-4xl font-bold ${isNight ? "text-white" : "text-[#0F0F0F]"}`}>나의 컬렉션</h1>
          <p className={isNight ? "text-white/60" : "text-[#5F5E5A]"}>
            영감을 주는 작업물과 프로젝트 아이디어를 저장하고 정리해보세요.
            <br />
            저장한 피드를 컬렉션별로 나눠 보고, 새 컬렉션도 직접 만들 수 있습니다.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-6 flex items-center gap-3"
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowFilterMenu((prev) => !prev)}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${isNight ? "border-white/10 text-white/70 hover:bg-white/10" : "border-[#EAEAE8] hover:bg-[#F1EFE8]"}`}
            >
              <Funnel className="size-4" />
              <span>필터</span>
            </button>
            <AnimatePresence>
              {showFilterMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute left-0 top-12 z-20 w-56 rounded-2xl border p-2 shadow-xl ${isNight ? "border-white/10 bg-[#1a2035]" : "border-gray-200 bg-white"}`}
                >
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setActiveFilter(option.value);
                        setShowFilterMenu(false);
                      }}
                      className={`flex w-full items-center rounded-xl px-3 py-2 text-sm transition-colors ${
                        activeFilter === option.value
                          ? isNight ? "bg-[#00C9A7]/15 font-semibold text-[#00C9A7]" : "bg-[#EEF9F6] font-semibold text-[#00A88C]"
                          : isNight ? "text-white/60 hover:bg-white/5" : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <span className={`text-sm ${isNight ? "text-white/40" : "text-[#5F5E5A]"}`}>
            {filteredCollections.length}개의 컬렉션
          </span>
        </motion.div>

        <AnimatePresence>
          {isReorderMode && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className={`overflow-hidden rounded-2xl border px-4 py-3 ${isNight ? "border-[#00C9A7]/20 bg-[#00C9A7]/5" : "border-[#CDEFE6] bg-[#F3FCF8]"}`}
            >
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-2 text-sm ${isNight ? "text-white/80" : "text-[#0F0F0F]"}`}>
                  <GripVertical className="size-4 text-[#00A88C]" />
                  <span>컬렉션 카드를 끌어서 원하는 순서로 배치하세요.</span>
                </div>
                <button
                  onClick={stopReorderMode}
                  className={`rounded-xl border px-3 py-1.5 text-sm ${isNight ? "border-[#00C9A7]/30 text-[#00C9A7] hover:bg-[#00C9A7]/10" : "border-[#B6E6DA] text-[#007E68] hover:bg-white"}`}
                >
                  순서 변경 종료
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCollections.map((collection, index) => {
            return (
              <motion.div
                key={collection.folderId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
                whileHover={!isReorderMode ? { y: -4, transition: { duration: 0.25 } } : undefined}
                onClick={() => handleOpenCollectionDetail(collection.folderId)}
                draggable={isReorderMode && activeFilter === "all"}
                onDragStart={() => handleCollectionDragStart(collection.folderId)}
                onDragOver={(event: React.DragEvent) => {
                  if (!isReorderMode) return;
                  event.preventDefault();
                }}
                onDrop={() => handleCollectionDrop(collection.folderId)}
                onDragEnd={() => setDraggingCollectionId(null)}
                className={`group relative cursor-pointer overflow-visible rounded-2xl border shadow-sm transition-shadow hover:shadow-lg ${
                  isNight
                    ? "border-white/10 bg-[#141d30] shadow-black/30"
                    : "border-gray-200/80 bg-white"
                } ${
                  draggingCollectionId === collection.folderId ? "opacity-60 ring-2 ring-[#00C9A7]" : ""
                } ${isReorderMode && activeFilter === "all" ? "cursor-grab" : ""}`}
              >
                <div className="relative">
                  {isReorderMode && activeFilter === "all" && (
                    <div
                      className={`absolute left-3 top-3 z-30 flex rounded-xl p-2 ${isNight ? "bg-[#00C9A7]/10 text-[#00C9A7]" : "bg-[#F3FCF8] text-[#00A88C]"}`}
                    >
                      <GripVertical className="size-4" />
                    </div>
                  )}
                  <div className="absolute right-2 top-2 z-30" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenCollectionMenuId((prev) =>
                          prev === collection.folderId ? null : collection.folderId
                        );
                      }}
                      className={`rounded-lg p-2 ${isNight ? "hover:bg-white/10" : "hover:bg-[#F1EFE8]"}`}
                    >
                      <MoreHorizontal className={`size-5 ${isNight ? "text-white/40" : "text-[#5F5E5A]"}`} />
                    </button>

                    <AnimatePresence>
                      {openCollectionMenuId === collection.folderId && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className={`absolute right-0 top-full z-20 mt-1 w-44 rounded-2xl border p-2 shadow-xl ${isNight ? "border-white/10 bg-[#1a2035]" : "border-gray-200 bg-white"}`}
                        >
                          <button
                            type="button"
                            onClick={() => startReorderMode()}
                            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${isNight ? "text-white/60 hover:bg-white/5" : "text-gray-600 hover:bg-gray-50"}`}
                          >
                            <GripVertical className="size-4" />
                            순서 변경
                          </button>
                          <button
                            type="button"
                            onClick={(event) => openDeleteConfirm(event, collection.folderId)}
                            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${isNight ? "text-red-400 hover:bg-red-500/10" : "text-red-500 hover:bg-red-50"}`}
                          >
                            <Trash2 className="size-4" />
                            컬렉션 삭제
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <AnimatedFolder
                    isNight={isNight}
                    title={collection.folderName}
                    projects={collectionToFolderProjects(collection)}
                    itemCount={collection.itemCount}
                    metaLine={
                      collection.itemCount > 0
                        ? collection.createdAt
                          ? getRelativeUpdateLabel(collection.createdAt)
                          : "날짜 없음"
                        : undefined
                    }
                    gradient={getFolderGradientByFolderId(collection.folderId)}
                    className={
                      "w-full !border-0 !bg-transparent !shadow-none hover:!border-transparent hover:!shadow-none"
                    }
                    onViewProject={() => handleOpenCollectionDetail(collection.folderId)}
                    showHoverHint={collection.itemCount > 0}
                    emptyHint="아직 저장된 피드가 없습니다. Feed에서 마음에 드는 작업을 저장해보세요."
                    viewProjectLabel="컬렉션 열기"
                    countLabel="피드"
                  />
                </div>
              </motion.div>
            );
          })}

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: filteredCollections.length * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
            whileHover={{ y: -4, transition: { duration: 0.25 } }}
            onClick={() => setShowCreateModal(true)}
            className={`flex h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors ${isNight ? "border-white/10 bg-[#141d30]/50 hover:border-[#00C9A7]/30 hover:bg-[#00C9A7]/5" : "border-[#EAEAE8] bg-[#F1EFE8] hover:border-gray-400 hover:bg-[#F7F7F5]"}`}
          >
            <div className={`mb-4 rounded-full p-4 ${isNight ? "bg-white/5" : "bg-[#F7F7F5]"}`}>
              <Plus className={`size-8 ${isNight ? "text-white/30" : "text-[#5F5E5A]"}`} />
            </div>
            <p className={`font-medium ${isNight ? "text-white/30" : "text-[#5F5E5A]"}`}>새 컬렉션 추가</p>
          </motion.button>
        </div>

      </div>
    </main>

    <Footer />

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={`w-full max-w-md rounded-3xl p-6 shadow-2xl ${isNight ? "bg-[#141d30]" : "bg-white"}`}
              onClick={(event) => event.stopPropagation()}
            >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-[#00A88C]">새 컬렉션</p>
                <h2 className={`mt-1 text-2xl font-bold ${isNight ? "text-white" : "text-[#0F0F0F]"}`}>컬렉션 만들기</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className={`rounded-full border p-2 transition-colors ${isNight ? "border-white/10 text-white/40 hover:bg-white/10 hover:text-white/70" : "border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-700"}`}
              >
                <X className="size-5" />
              </button>
            </div>
            <label className={`mb-2 block text-sm font-semibold ${isNight ? "text-white/70" : "text-[#0F0F0F]"}`}>
              컬렉션 이름
            </label>
            <input
              value={newCollectionName}
              onChange={(event) => setNewCollectionName(event.target.value)}
              placeholder="예: 앱 레퍼런스 모음"
              className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-colors ${isNight ? "border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-[#00C9A7]" : "border-gray-200 bg-white text-[#0F0F0F] focus:border-[#00C9A7]"}`}
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className={`rounded-xl border px-4 py-2 text-sm ${isNight ? "border-white/10 text-white/50 hover:bg-white/5" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
              >
                취소
              </button>
              <button
                onClick={handleCreateCollection}
                disabled={!newCollectionName.trim()}
                className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                  newCollectionName.trim()
                    ? isNight ? "bg-[#00C9A7] text-[#0F0F0F] hover:bg-[#00b899]" : "bg-black text-white hover:bg-gray-800"
                    : isNight ? "cursor-not-allowed bg-white/5 text-white/20" : "cursor-not-allowed bg-gray-100 text-gray-400"
                }`}
              >
                생성하기
              </button>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
      {selectedCollection && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          onClick={() => {
            setSelectedCollectionId(null);
            setSelectedCollection(null);
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={`w-full max-w-6xl rounded-3xl shadow-2xl ${isNight ? "bg-[#0f1828]" : "bg-white"}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={`flex items-start justify-between border-b px-6 py-5 ${isNight ? "border-white/10" : "border-gray-100"}`}>
              <div>
                <p className="text-sm font-semibold text-[#00A88C]">컬렉션 상세</p>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    value={editingCollectionName}
                    onChange={(event) => setEditingCollectionName(event.target.value)}
                    className={`rounded-xl border px-3 py-2 text-2xl font-bold outline-none transition-colors ${isNight ? "border-white/10 bg-white/5 text-white focus:border-[#00C9A7]" : "border-gray-200 text-[#0F0F0F] focus:border-[#00C9A7]"}`}
                  />
                  <button
                    onClick={handleRenameSelectedCollection}
                    className={`flex items-center gap-1 rounded-xl border px-3 py-2 text-sm ${isNight ? "border-white/10 text-white/50 hover:bg-white/5" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                  >
                    <Pencil className="size-4" />
                    이름 수정
                  </button>
                  <button
                    onClick={(e) => openDeleteConfirm(e, selectedCollection.folderId)}
                    className={`flex items-center gap-1 rounded-xl border px-3 py-2 text-sm ${isNight ? "border-red-500/20 text-red-400 hover:bg-red-500/10" : "border-red-200 text-red-500 hover:bg-red-50"}`}
                  >
                    <Trash2 className="size-4" />
                    컬렉션 삭제
                  </button>
                </div>
                <p className={`mt-2 text-sm ${isNight ? "text-white/40" : "text-gray-500"}`}>
                  저장된 피드 {selectedCollectionItems.length}개를 격자형으로 확인할 수 있습니다.
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedCollectionId(null);
                  setSelectedCollection(null);
                }}
                className={`rounded-full border p-2 transition-colors ${isNight ? "border-white/10 text-white/40 hover:bg-white/10 hover:text-white/70" : "border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-700"}`}
              >
                <X className="size-5" />
              </button>
            </div>

            <div className={`max-h-[72vh] overflow-y-auto px-6 py-6 ${isNight ? "bg-[#0C1222]" : ""}`}>
              {selectedCollectionItems.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {selectedCollectionItems.map((item) => (
                    <article
                      key={item.postId}
                      className={`overflow-hidden rounded-2xl border ${isNight ? "border-white/10 bg-[#141d30]" : "border-gray-200 bg-white"}`}
                    >
                      <ImageWithFallback
                        src={item.thumbnailImageUrl ?? ""}
                        alt={item.title}
                        className="h-56 w-full object-cover"
                      />
                      <div className="p-4">
                        <p className="text-xs font-semibold text-[#00A88C]">{item.category || "미분류"}</p>
                        <h3 className={`mt-2 text-lg font-bold ${isNight ? "text-white" : "text-[#0F0F0F]"}`}>{item.title}</h3>
                        <p className={`mt-2 line-clamp-2 text-sm leading-6 ${isNight ? "text-white/50" : "text-gray-600"}`}>
                          {item.description}
                        </p>
                        <div className="mt-4 flex items-center gap-3">
                          <ImageWithFallback
                            src={item.authorProfileImage ?? ""}
                            alt={item.authorNickname}
                            className="size-10 rounded-full object-cover"
                          />
                          <div>
                            <p className={`text-sm font-semibold ${isNight ? "text-white/80" : "text-[#0F0F0F]"}`}>{item.authorNickname}</p>
                            <p className={`text-xs ${isNight ? "text-white/30" : "text-gray-500"}`}>디자이너</p>
                          </div>
                        </div>
                        <div className={`mt-4 flex gap-4 text-xs ${isNight ? "text-white/30" : "text-gray-500"}`}>
                          <span>좋아요 {item.pickCount ?? 0}</span>
                          <span>댓글 {item.commentCount}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveFeedFromCollection(item.postId)}
                          className={`mt-4 rounded-xl border px-3 py-2 text-sm ${isNight ? "border-red-500/20 text-red-400 hover:bg-red-500/10" : "border-red-200 text-red-500 hover:bg-red-50"}`}
                        >
                          피드 제거
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className={`rounded-3xl border-2 border-dashed px-6 py-20 text-center ${isNight ? "border-white/10 bg-[#0C1222]" : "border-[#D8D6CF] bg-[#F7F7F5]"}`}>
                  <Grid3X3 className={`mx-auto mb-4 size-12 ${isNight ? "text-white/15" : "text-[#8B8A84]"}`} />
                  <h3 className={`text-2xl font-bold ${isNight ? "text-white/60" : "text-[#0F0F0F]"}`}>저장된 피드가 없습니다</h3>
                  <p className={`mt-2 ${isNight ? "text-white/30" : "text-gray-500"}`}>
                    Feed에서 북마크 버튼으로 피드를 저장하면 이 컬렉션에서 grid로 볼 수 있습니다.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
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
              className={`relative w-full max-w-sm rounded-3xl p-6 shadow-2xl ${isNight ? "bg-[#141d30]" : "bg-white"}`}
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${isNight ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-500"}`}>
                <Trash2 className="size-6" />
              </div>
              <h3 className={`mb-2 text-lg font-bold ${isNight ? "text-white" : "text-gray-900"}`}>컬렉션 삭제</h3>
              <p className={`mb-6 text-sm ${isNight ? "text-white/40" : "text-gray-500"}`}>
                정말 이 컬렉션을 삭제하시겠습니까? 컬렉션 내의 저장된 피드 정보가 모두 삭제되며, 이 작업은 되돌릴 수 없습니다.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-colors ${isNight ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
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
