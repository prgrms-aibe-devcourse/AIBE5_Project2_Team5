import { useEffect, useMemo, useState } from "react";
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
import { motion } from "motion/react";
import Navigation from "../components/Navigation";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import {
  type CollectionFeedItem,
  type SavedCollection,
  loadCollectibleFeedItems,
  loadSavedCollections,
  saveCollections,
} from "../utils/collectionState";

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
  const [collections, setCollections] = useState<SavedCollection[]>(() => loadSavedCollections());
  const [feedItems, setFeedItems] = useState<CollectionFeedItem[]>(() => loadCollectibleFeedItems());
  const [activeFilter, setActiveFilter] = useState<CollectionFilter>("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [openCollectionMenuId, setOpenCollectionMenuId] = useState<string | null>(null);
  const [editingCollectionName, setEditingCollectionName] = useState("");
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draggingCollectionId, setDraggingCollectionId] = useState<string | null>(null);

  useEffect(() => {
    saveCollections(collections);
  }, [collections]);

  useEffect(() => {
    setFeedItems(loadCollectibleFeedItems());
  }, []);

  const feedItemMap = useMemo(
    () => new Map(feedItems.map((item) => [item.id, item])),
    [feedItems]
  );

  const filteredCollections = useMemo(() => {
    const orderedCollections =
      activeFilter === "recent"
        ? [...collections].sort((left, right) => {
            return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
          })
        : collections;

    if (activeFilter === "all" || activeFilter === "recent") return orderedCollections;
    if (activeFilter === "with-items") {
      return orderedCollections.filter((collection) => collection.itemIds.length > 0);
    }
    return orderedCollections.filter((collection) => collection.itemIds.length === 0);
  }, [activeFilter, collections]);

  const selectedCollection = useMemo(
    () => collections.find((collection) => collection.id === selectedCollectionId) ?? null,
    [collections, selectedCollectionId]
  );

  const selectedCollectionItems = useMemo(() => {
    if (!selectedCollection) return [];
    return selectedCollection.itemIds
      .map((itemId) => feedItemMap.get(itemId))
      .filter((item): item is CollectionFeedItem => Boolean(item));
  }, [feedItemMap, selectedCollection]);

  const handleCreateCollection = () => {
    const trimmedName = newCollectionName.trim();
    if (!trimmedName) return;

    const newCollection: SavedCollection = {
      id: `collection-${Date.now()}`,
      name: trimmedName,
      itemIds: [],
      updatedAt: new Date().toISOString(),
    };

    setCollections((prev) => [newCollection, ...prev]);
    setNewCollectionName("");
    setShowCreateModal(false);
  };

  const moveCollectionToIndex = (collectionId: string, targetCollectionId: string) => {
    setCollections((prev) => {
      const currentIndex = prev.findIndex((collection) => collection.id === collectionId);
      const targetIndex = prev.findIndex((collection) => collection.id === targetCollectionId);
      if (currentIndex === -1 || targetIndex === -1 || currentIndex === targetIndex) return prev;

      const next = [...prev];
      const [movedCollection] = next.splice(currentIndex, 1);
      next.splice(targetIndex, 0, movedCollection);
      return next;
    });
  };

  const deleteCollection = (collectionId: string) => {
    setCollections((prev) => prev.filter((collection) => collection.id !== collectionId));
    if (selectedCollectionId === collectionId) {
      setSelectedCollectionId(null);
    }
    setOpenCollectionMenuId(null);
  };

  const startReorderMode = () => {
    setActiveFilter("all");
    setIsReorderMode(true);
    setOpenCollectionMenuId(null);
  };

  const stopReorderMode = () => {
    setIsReorderMode(false);
    setDraggingCollectionId(null);
  };

  const handleCollectionDragStart = (collectionId: string) => {
    if (!isReorderMode) return;
    setDraggingCollectionId(collectionId);
  };

  const handleCollectionDrop = (targetCollectionId: string) => {
    if (!draggingCollectionId || draggingCollectionId === targetCollectionId) return;
    moveCollectionToIndex(draggingCollectionId, targetCollectionId);
    setDraggingCollectionId(null);
  };

  const handleOpenCollectionDetail = (collectionId: string) => {
    setSelectedCollectionId(collectionId);
    const collection = collections.find((item) => item.id === collectionId);
    setEditingCollectionName(collection?.name ?? "");
  };

  const handleRenameSelectedCollection = () => {
    if (!selectedCollection || !editingCollectionName.trim()) return;

    setCollections((prev) =>
      prev.map((collection) =>
        collection.id === selectedCollection.id
          ? {
              ...collection,
              name: editingCollectionName.trim(),
              updatedAt: new Date().toISOString(),
            }
          : collection
      )
    );
  };

  const handleRemoveFeedFromCollection = (itemId: number) => {
    if (!selectedCollection) return;

    setCollections((prev) =>
      prev.map((collection) =>
        collection.id === selectedCollection.id
          ? {
              ...collection,
              itemIds: collection.itemIds.filter((storedItemId) => storedItemId !== itemId),
              updatedAt: new Date().toISOString(),
            }
          : collection
      )
    );
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      <Navigation />

      <div className="max-w-[1400px] mx-auto px-6 py-8">
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
            const previewItems = collection.itemIds
              .map((itemId) => feedItemMap.get(itemId))
              .filter((item): item is CollectionFeedItem => Boolean(item))
              .slice(0, 3);

            return (
              <div
                key={collection.id}
                onClick={() => handleOpenCollectionDetail(collection.id)}
                draggable={isReorderMode && activeFilter === "all"}
                onDragStart={() => handleCollectionDragStart(collection.id)}
                onDragOver={(event) => {
                  if (!isReorderMode) return;
                  event.preventDefault();
                }}
                onDrop={() => handleCollectionDrop(collection.id)}
                onDragEnd={() => setDraggingCollectionId(null)}
                className={`relative cursor-pointer overflow-visible rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-lg ${
                  draggingCollectionId === collection.id ? "opacity-60 ring-2 ring-[#00C9A7]" : ""
                } ${isReorderMode && activeFilter === "all" ? "cursor-grab" : ""}`}
              >
                <div className="relative h-64 bg-gray-100 p-1">
                  {collection.itemIds.length > 0 ? (
                    <div className="grid h-full grid-cols-2 gap-1">
                      {previewItems.map((item, index) => (
                        <div
                          key={item.id}
                          className={`relative overflow-hidden rounded ${
                            index === 0 ? "col-span-1 row-span-2" : "col-span-1"
                          }`}
                        >
                          <ImageWithFallback
                            src={item.image}
                            alt={item.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                      {collection.itemIds.length > 3 && (
                        <div className="flex items-center justify-center rounded bg-black/85 text-white">
                          <span className="text-xl font-semibold">
                            +{collection.itemIds.length - 3}
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
                    <h3 className="mb-1 text-lg font-semibold">{collection.name}</h3>
                    <p className="text-sm text-[#5F5E5A]">
                      피드 {collection.itemIds.length}개 · {getRelativeUpdateLabel(collection.updatedAt)}
                    </p>
                    </div>
                  </div>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      setOpenCollectionMenuId((prev) =>
                        prev === collection.id ? null : collection.id
                      );
                    }}
                    className="rounded-lg p-2 hover:bg-[#F1EFE8]"
                  >
                    <MoreHorizontal className="size-5 text-[#5F5E5A]" />
                  </button>
                </div>

                {openCollectionMenuId === collection.id && (
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
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteCollection(collection.id);
                      }}
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

      <footer className="bg-white border-t border-gray-200 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-[1400px] mx-auto px-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-2 text-xl font-bold">
                pick<span className="text-[#00C9A7]">x</span>el<span className="text-[#FF5C3A]">.</span>
              </div>
              <p className="text-sm text-gray-600">© 2024 pickxel. Crafted for the creative elite.</p>
            </div>
            <div className="flex gap-8 text-sm text-gray-600">
              <a href="#" className="transition-colors hover:text-black">이용약관</a>
              <a href="#" className="transition-colors hover:text-black">개인정보처리방침</a>
              <a href="#" className="transition-colors hover:text-black">고객센터</a>
              <a href="#" className="transition-colors hover:text-black">인재채용</a>
              <a href="#" className="transition-colors hover:text-black">비즈니스 문의</a>
            </div>
          </div>
        </motion.div>
      </footer>

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
          onClick={() => setSelectedCollectionId(null)}
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
                    onClick={() => deleteCollection(selectedCollection.id)}
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
                onClick={() => setSelectedCollectionId(null)}
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
                      key={item.id}
                      className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
                    >
                      <ImageWithFallback
                        src={item.image}
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
                          <img
                            src={item.author.avatar}
                            alt={item.author.name}
                            className="size-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm font-semibold text-[#0F0F0F]">{item.author.name}</p>
                            <p className="text-xs text-gray-500">{item.author.role}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex gap-4 text-xs text-gray-500">
                          <span>좋아요 {item.likes}</span>
                          <span>댓글 {item.comments}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveFeedFromCollection(item.id)}
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
    </div>
  );
}
