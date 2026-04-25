import { Bookmark, Check, FolderPlus, X } from "lucide-react";
import type { CollectionFolderResponse } from "../../api/collectionApi";
import type { FeedCardItem } from "../../types/feed";

type CollectionSaveModalProps = {
  feed: FeedCardItem;
  collections: CollectionFolderResponse[];
  collectionPostIdsByFolder: Record<number, number[]>;
  isCollectionSaving: boolean;
  newCollectionName: string;
  collectionSavedNotice: string;
  onClose: () => void;
  onNewCollectionNameChange: (value: string) => void;
  onSaveToCollection: (folderId: number) => void;
  onCreateCollectionAndSave: () => void;
};

export function CollectionSaveModal({
  feed,
  collections,
  collectionPostIdsByFolder,
  isCollectionSaving,
  newCollectionName,
  collectionSavedNotice,
  onClose,
  onNewCollectionNameChange,
  onSaveToCollection,
  onCreateCollectionAndSave,
}: CollectionSaveModalProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-in zoom-in-95 fade-in w-full max-w-md overflow-hidden rounded-xl border border-white/40 bg-white shadow-2xl duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5">
          <div>
            <p className="mb-1 text-xs font-semibold text-[#00A88C]">컬렉션 저장</p>
            <h3 className="text-xl font-bold text-[#0F0F0F]">어디에 저장할까요?</h3>
            <p className="mt-1 line-clamp-1 text-sm text-gray-500">{feed.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#0F0F0F]"
            aria-label="닫기"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="space-y-2">
            {collections.map((collection) => {
              const isSavedInCollection = Boolean(
                collectionPostIdsByFolder[collection.folderId]?.includes(feed.id),
              );

              return (
                <button
                  key={collection.folderId}
                  type="button"
                  disabled={isCollectionSaving}
                  onClick={() => onSaveToCollection(collection.folderId)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-all ${
                    isSavedInCollection
                      ? "border-[#00C9A7] bg-[#E7FAF6] text-[#007D69]"
                      : "border-gray-200 bg-white hover:border-[#00C9A7] hover:bg-[#F2FFFC]"
                  } disabled:cursor-not-allowed disabled:opacity-75`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${
                        isSavedInCollection ? "bg-[#00C9A7] text-white" : "bg-[#F7F7F5] text-[#00A88C]"
                      }`}
                    >
                      {isSavedInCollection ? <Check className="size-5" /> : <Bookmark className="size-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{collection.folderName}</p>
                      <p className="text-xs text-gray-500">{collection.itemCount}개 저장됨</p>
                    </div>
                  </div>
                  {isSavedInCollection && (
                    <span className="shrink-0 text-xs font-bold text-[#00A88C]">저장됨 · 다시 누르면 해제</span>
                  )}
                </button>
              );
            })}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onCreateCollectionAndSave();
            }}
            className="border-t border-gray-100 pt-4"
          >
            <label className="mb-2 block text-sm font-bold text-[#0F0F0F]">새 컬렉션 만들기</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => onNewCollectionNameChange(e.target.value)}
                placeholder="예: 메인페이지 인터페이스"
                className="flex-1 rounded-lg border border-gray-200 bg-[#F7F7F5] px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#00C9A7]"
              />
              <button
                type="submit"
                disabled={!newCollectionName.trim() || isCollectionSaving}
                className="flex items-center gap-2 rounded-lg bg-[#0F0F0F] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#00A88C] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FolderPlus className="size-4" />
                {isCollectionSaving ? "저장 중" : "만들기"}
              </button>
            </div>
          </form>

          {collectionSavedNotice && (
            <p className="rounded-lg bg-[#E7FAF6] px-3 py-2 text-sm font-semibold text-[#007D69]">
              {collectionSavedNotice}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
