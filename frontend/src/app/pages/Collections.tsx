import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  ChevronDown,
  FolderPlus,
  Layers3,
  MoreHorizontal,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import Navigation from "../components/Navigation";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import {
  type CollectionFilter,
  type CollectionRecord,
  getFeedById,
  getSavedFeedIds,
  getStoredCollections,
  setStoredCollections,
} from "../utils/collections";

const filterOptions: { id: CollectionFilter; label: string; description: string }[] = [
  { id: "all", label: "전체 보기", description: "모든 컬렉션을 표시합니다." },
  { id: "recent", label: "최근 업데이트", description: "최근 수정된 컬렉션부터 봅니다." },
  { id: "most-items", label: "피드 많은 순", description: "저장된 피드가 많은 컬렉션을 먼저 봅니다." },
  { id: "empty", label: "비어있는 컬렉션", description: "피드가 없는 컬렉션만 표시합니다." },
];

function formatUpdatedAt(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const day = 1000 * 60 * 60 * 24;
  const hour = 1000 * 60 * 60;

  if (diff < hour) {
    return "방금 업데이트";
  }

  if (diff < day) {
    return `${Math.max(1, Math.floor(diff / hour))}시간 전 업데이트`;
  }

  return `${Math.max(1, Math.floor(diff / day))}일 전 업데이트`;
}

function getFilteredCollections(collections: CollectionRecord[], filter: CollectionFilter) {
  if (filter === "recent") {
    return [...collections].sort(
      (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    );
  }

  if (filter === "most-items") {
    return [...collections].sort((left, right) => right.feedIds.length - left.feedIds.length);
  }

  if (filter === "empty") {
    return collections.filter((collection) => collection.feedIds.length === 0);
  }

  return collections;
}

function getCollectionPreviewFeeds(collection: CollectionRecord) {
  const feeds = collection.feedIds.map((feedId) => getFeedById(feedId)).filter(Boolean);

  if (feeds.length === 0) {
    return [];
  }

  if (feeds.length >= 3) {
    return feeds.slice(0, 3);
  }

  const previewFeeds = [...feeds];

  while (previewFeeds.length < 3) {
    previewFeeds.push(feeds[previewFeeds.length % feeds.length]);
  }

  return previewFeeds;
}

export default function Collections() {
  const navigate = useNavigate();
  const { collectionId } = useParams();

  const [collections, setCollections] = useState<CollectionRecord[]>(() => getStoredCollections());
  const [activeFilter, setActiveFilter] = useState<CollectionFilter>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [newCollectionTitle, setNewCollectionTitle] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");

  useEffect(() => {
    setStoredCollections(collections);
  }, [collections]);

  const selectedCollection = useMemo(
    () => collections.find((collection) => collection.id === collectionId) ?? null,
    [collectionId, collections],
  );
  const savedFeedIds = useMemo(() => getSavedFeedIds(), [collections]);
  const filteredCollections = useMemo(
    () => getFilteredCollections(collections, activeFilter),
    [activeFilter, collections],
  );
  const selectedFilter = filterOptions.find((option) => option.id === activeFilter) ?? filterOptions[0];
  const selectedFeeds = useMemo(
    () => (selectedCollection ? selectedCollection.feedIds.map((feedId) => getFeedById(feedId)).filter(Boolean) : []),
    [selectedCollection],
  );

  const handleCreateCollection = () => {
    const title = newCollectionTitle.trim();

    if (!title) {
      return;
    }

    const timestamp = new Date().toISOString();
    const nextCollection: CollectionRecord = {
      id: `collection-${Date.now()}`,
      title,
      description: newCollectionDescription.trim() || "저장한 피드를 모아두는 개인 컬렉션",
      feedIds: savedFeedIds,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setCollections((current) => [nextCollection, ...current]);
    setIsCreateOpen(false);
    setNewCollectionTitle("");
    setNewCollectionDescription("");
  };

  const handleDeleteCollection = (collection: CollectionRecord) => {
    const shouldDelete = window.confirm(`'${collection.title}' 컬렉션을 삭제하시겠습니까?`);

    if (!shouldDelete) {
      return;
    }

    setCollections((current) => current.filter((item) => item.id !== collection.id));
    setOpenMenuId(null);

    if (collectionId === collection.id) {
      navigate("/collections");
    }
  };

  const handleRemoveFeedFromCollection = (feedId: number) => {
    if (!selectedCollection) {
      return;
    }

    const shouldRemove = window.confirm("이 피드를 현재 컬렉션에서 삭제하시겠습니까?");

    if (!shouldRemove) {
      return;
    }

    setCollections((current) =>
      current.map((collection) =>
        collection.id === selectedCollection.id
          ? {
              ...collection,
              feedIds: collection.feedIds.filter((id) => id !== feedId),
              updatedAt: new Date().toISOString(),
            }
          : collection,
      ),
    );
  };

  if (collectionId && !selectedCollection) {
    return (
      <div className="min-h-screen bg-[#F7F7F5]">
        <Navigation />
        <div className="mx-auto max-w-[1400px] px-6 py-16">
          <div className="rounded-3xl border border-dashed border-[#D8D7D0] bg-white px-10 py-16 text-center">
            <h1 className="text-3xl font-bold text-[#171717]">컬렉션을 찾을 수 없습니다.</h1>
            <p className="mt-3 text-[#5F5E5A]">삭제되었거나 잘못된 경로입니다.</p>
            <button
              type="button"
              onClick={() => navigate("/collections")}
              className="mt-6 rounded-full bg-black px-6 py-3 text-sm font-medium text-white"
            >
              컬렉션 목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      <Navigation />

      <div className="mx-auto max-w-[1400px] px-6 py-8">
        {selectedCollection ? (
          <>
            <div className="mb-8 flex items-start justify-between gap-6">
              <div>
                <button
                  type="button"
                  onClick={() => navigate("/collections")}
                  className="mb-4 inline-flex items-center gap-2 text-sm text-[#5F5E5A] transition-colors hover:text-black"
                >
                  <ArrowLeft className="size-4" />
                  컬렉션 목록으로
                </button>
                <h1 className="text-4xl font-bold text-[#171717]">{selectedCollection.title}</h1>
                <p className="mt-3 max-w-2xl text-[#5F5E5A]">{selectedCollection.description}</p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-[#5F5E5A]">
                  <Layers3 className="size-4 text-[#00A88C]" />
                  저장된 피드 {selectedFeeds.length}개
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#222]"
                >
                  <FolderPlus className="size-4" />
                  새 컬렉션
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenuId((current) => (current === selectedCollection.id ? null : selectedCollection.id))
                    }
                    className="rounded-full border border-[#DDDAD2] bg-white p-3 text-[#5F5E5A] transition-colors hover:bg-[#F1EFE8]"
                  >
                    <MoreHorizontal className="size-5" />
                  </button>
                  {openMenuId === selectedCollection.id && (
                    <div className="absolute right-0 top-14 z-20 min-w-44 rounded-2xl border border-[#E6E2D9] bg-white p-2 shadow-xl">
                      <button
                        type="button"
                        onClick={() => handleDeleteCollection(selectedCollection)}
                        className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-sm font-medium text-[#C43D2F] transition-colors hover:bg-[#FFF1EE]"
                      >
                        <Trash2 className="size-4" />
                        컬렉션 삭제
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {selectedFeeds.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#D8D7D0] bg-white px-10 py-16 text-center">
                <Sparkles className="mx-auto size-10 text-[#00A88C]" />
                <h2 className="mt-4 text-2xl font-bold">저장된 피드가 없습니다.</h2>
                <p className="mt-2 text-[#5F5E5A]">피드 탭에서 북마크한 작업을 이 컬렉션에서 grid로 볼 수 있습니다.</p>
                <Link
                  to="/feed"
                  className="mt-6 inline-flex items-center rounded-full bg-[#4DD4AC] px-6 py-3 text-sm font-medium text-black"
                >
                  피드 보러가기
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {selectedFeeds.map((feed) => (
                  <article
                    key={feed.id}
                    className="overflow-hidden rounded-3xl border border-[#E8E6DE] bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <ImageWithFallback
                        src={feed.image}
                        alt={feed.title}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFeedFromCollection(feed.id)}
                        className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/92 px-3 py-2 text-xs font-medium text-[#C43D2F] shadow-sm transition-colors hover:bg-[#FFF1EE]"
                      >
                        <Trash2 className="size-3.5" />
                        피드 삭제
                      </button>
                    </div>

                    <div className="p-5">
                      <div className="mb-3 flex flex-wrap gap-2">
                        {feed.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-[#A8F0E4]/20 px-3 py-1 text-xs font-medium text-[#008A72]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <h2 className="text-xl font-bold text-[#171717]">{feed.title}</h2>
                      <p className="mt-2 line-clamp-2 text-sm text-[#5F5E5A]">{feed.description}</p>
                      <div className="mt-4 flex items-center gap-3">
                        <ImageWithFallback
                          src={feed.author.avatar}
                          alt={feed.author.name}
                          className="size-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-sm font-semibold text-[#171717]">{feed.author.name}</p>
                          <p className="text-xs text-[#5F5E5A]">{feed.author.role}</p>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mb-8 flex items-center justify-between gap-6">
              <div>
                <h1 className="text-4xl font-bold text-[#171717]">나의 컬렉션</h1>
                <p className="mt-2 text-[#5F5E5A]">
                  저장한 피드를 컬렉션으로 묶고, 필요할 때 grid로 다시 꺼내 볼 수 있습니다.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen((current) => !current)}
                    className="inline-flex items-center gap-2 rounded-full border border-[#DDDAD2] bg-white px-4 py-2 text-sm font-medium text-[#2A2A2A] transition-colors hover:bg-[#F1EFE8]"
                  >
                    {selectedFilter.label}
                    <ChevronDown className="size-4" />
                  </button>
                  {isFilterOpen && (
                    <div className="absolute right-0 top-12 z-20 w-64 rounded-2xl border border-[#E6E2D9] bg-white p-2 shadow-xl">
                      {filterOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            setActiveFilter(option.id);
                            setIsFilterOpen(false);
                          }}
                          className={`w-full rounded-xl px-4 py-3 text-left transition-colors ${
                            activeFilter === option.id ? "bg-[#F1EFE8]" : "hover:bg-[#F7F7F5]"
                          }`}
                        >
                          <div className="text-sm font-medium text-[#171717]">{option.label}</div>
                          <div className="mt-1 text-xs text-[#5F5E5A]">{option.description}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreateOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#222]"
                >
                  <Plus className="size-4" />
                  새 컬렉션
                </button>
              </div>
            </div>

            <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredCollections.map((collection) => {
                const previewFeeds = getCollectionPreviewFeeds(collection);
                const additionalCount = Math.max(0, collection.feedIds.length - 3);

                return (
                  <div
                    key={collection.id}
                    className="flex flex-col overflow-hidden rounded-3xl bg-white text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                  >
                    <button
                      type="button"
                      onClick={() => navigate(`/collections/${collection.id}`)}
                      className="block w-full shrink-0 text-left"
                    >
                      <div className="relative h-72 bg-[#F1EFE8] p-2">
                        {collection.featured && (
                          <div className="absolute left-4 top-4 z-10 rounded-full bg-black/80 px-3 py-1 text-xs font-medium text-white">
                            추천 컬렉션
                          </div>
                        )}

                        <div className="grid h-full grid-cols-2 gap-2">
                          {previewFeeds.map((feed, index) => (
                            <div
                              key={`${collection.id}-${feed.id}-${index}`}
                              className={index === 0 ? "row-span-2" : ""}
                            >
                              <ImageWithFallback
                                src={feed.image}
                                alt={feed.title}
                                className="h-full w-full rounded-2xl object-cover"
                              />
                            </div>
                          ))}

                          {previewFeeds.length === 0 && (
                            <div className="col-span-2 flex h-full items-center justify-center rounded-2xl border border-dashed border-[#D7D2C7] bg-[#F8F6F0] text-sm text-[#7A766C]">
                              아직 저장된 피드가 없습니다
                            </div>
                          )}
                        </div>
                      </div>
                    </button>

                    <div className="flex min-h-[128px] items-start justify-between border-t border-[#F1EFE8] bg-white p-5">
                      <div className="min-w-0 pr-4">
                        <h2 className="text-xl font-bold text-[#171717]">{collection.title}</h2>
                        <p className="mt-2 text-sm text-[#5F5E5A]">{collection.description}</p>
                        <p className="mt-3 text-sm text-[#7B776D]">
                          피드 {collection.feedIds.length}개 · {formatUpdatedAt(collection.updatedAt)}
                        </p>
                        {additionalCount > 0 && (
                          <p className="mt-1 text-xs font-medium text-[#00A88C]">
                            미리보기 외 +{additionalCount}개
                          </p>
                        )}
                      </div>

                      <div className="relative shrink-0">
                        <button
                          type="button"
                          onClick={() => setOpenMenuId((current) => (current === collection.id ? null : collection.id))}
                          className="rounded-full p-2 transition-colors hover:bg-[#F1EFE8]"
                        >
                          <MoreHorizontal className="size-5 text-[#5F5E5A]" />
                        </button>
                        {openMenuId === collection.id && (
                          <div className="absolute right-0 top-11 z-20 min-w-44 rounded-2xl border border-[#E6E2D9] bg-white p-2 shadow-xl">
                            <button
                              type="button"
                              onClick={() => handleDeleteCollection(collection)}
                              className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-sm font-medium text-[#C43D2F] transition-colors hover:bg-[#FFF1EE]"
                            >
                              <Trash2 className="size-4" />
                              컬렉션 삭제
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="flex h-[388px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#D9D5CA] bg-[#F1EFE8] transition-colors hover:bg-white"
              >
                <div className="rounded-full bg-white p-4 shadow-sm">
                  <Plus className="size-8 text-[#5F5E5A]" />
                </div>
                <p className="mt-4 text-base font-medium text-[#5F5E5A]">새 컬렉션 만들기</p>
                <p className="mt-1 text-sm text-[#7B776D]">현재 저장된 피드를 담아 새 컬렉션을 생성합니다.</p>
              </button>
            </div>
          </>
        )}

        <section className="mt-16 flex items-center justify-between rounded-3xl bg-gradient-to-r from-[#EEF0EA] to-[#D4F4F4] p-12">
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold text-[#171717]">컬렉션을 더 잘 쓰는 방법</h2>
            <p className="mt-4 leading-relaxed text-[#4E4B45]">
              피드에서 저장한 작업을 주제별로 분류해 두면 레퍼런스를 빠르게 다시 찾을 수 있습니다.
              새 컬렉션은 현재 저장한 피드를 기반으로 생성되며, 클릭하면 grid 형태로 정리된 뷰를 바로 확인할 수 있습니다.
            </p>
          </div>
          <div className="hidden h-64 w-80 rounded-3xl bg-white/60 xl:block" />
        </section>
      </div>

      {isCreateOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-6"
          onClick={() => setIsCreateOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-[#171717]">새 컬렉션 만들기</h2>
            <p className="mt-2 text-sm text-[#5F5E5A]">
              현재 저장된 피드 {savedFeedIds.length}개가 새 컬렉션에 담깁니다.
            </p>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#171717]">컬렉션 이름</span>
                <input
                  value={newCollectionTitle}
                  onChange={(event) => setNewCollectionTitle(event.target.value)}
                  placeholder="예: 브랜딩 레퍼런스"
                  className="w-full rounded-2xl border border-[#DDDAD2] px-4 py-3 outline-none transition-colors focus:border-[#00A88C]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#171717]">설명</span>
                <textarea
                  value={newCollectionDescription}
                  onChange={(event) => setNewCollectionDescription(event.target.value)}
                  placeholder="이 컬렉션을 어떤 기준으로 모으는지 적어보세요."
                  rows={4}
                  className="w-full rounded-2xl border border-[#DDDAD2] px-4 py-3 outline-none transition-colors focus:border-[#00A88C]"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-full border border-[#DDDAD2] px-5 py-3 text-sm font-medium text-[#2A2A2A]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleCreateCollection}
                disabled={newCollectionTitle.trim().length === 0}
                className="rounded-full bg-black px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-[#BDBAB2]"
              >
                컬렉션 생성
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-gray-200 bg-white py-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-[1400px] px-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-2 text-xl font-bold">
                pick<span className="text-[#00C9A7]">x</span>el<span className="text-[#FF5C3A]">.</span>
              </div>
              <p className="text-sm text-gray-600">© 2024 pickxel. Crafted for the creative elite.</p>
            </div>
            <div className="flex gap-8 text-sm text-gray-600">
              <a href="#" className="transition-colors hover:text-black">
                이용약관
              </a>
              <a href="#" className="transition-colors hover:text-black">
                개인정보처리방침
              </a>
              <a href="#" className="transition-colors hover:text-black">
                고객센터
              </a>
              <a href="#" className="transition-colors hover:text-black">
                인재채용
              </a>
              <a href="#" className="transition-colors hover:text-black">
                비즈니스 문의
              </a>
            </div>
          </div>
        </motion.div>
      </footer>
    </div>
  );
}
