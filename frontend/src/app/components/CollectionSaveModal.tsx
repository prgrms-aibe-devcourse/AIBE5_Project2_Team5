import { useEffect, useState } from "react";
import { X, Check, Bookmark, FolderPlus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getCollectionFoldersApi, saveFeedToFolderApi, CollectionFolderResponseDto } from "../api/collectionApi";

interface CollectionSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: number;
  postTitle: string;
  onSaveSuccess?: () => void;
}

export default function CollectionSaveModal({ isOpen, onClose, postId, postTitle, onSaveSuccess }: CollectionSaveModalProps) {
  const [collections, setCollections] = useState<CollectionFolderResponseDto[]>([]);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [notice, setNotice] = useState("");

  const loadCollectionFolders = async () => {
    try {
      const response = await getCollectionFoldersApi();
      if (response && Array.isArray(response)) {
        setCollections(response);
      }
    } catch (error) {
      console.error("컬렉션 폴더 목록을 불러오지 못했습니다.", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setNotice("");
      setNewCollectionName("");
      loadCollectionFolders();
    }
  }, [isOpen]);

  const saveToCollection = async (folderId: number) => {
    try {
      await saveFeedToFolderApi(folderId, postId);
      const targetFolder = collections.find(c => c.folderId === folderId);
      setNotice(`'${targetFolder?.folderName}'에 저장했습니다.`);
      await loadCollectionFolders(); // itemIds 갱신
      
      onSaveSuccess?.();
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      if (error instanceof Error && error.message.includes("이미")) {
        setNotice("이미 저장된 피드입니다.");
      } else {
        setNotice("저장에 실패했습니다.");
      }
    }
  };

  const createCollectionAndSave = () => {
    setNotice("새 폴더 생성 기능은 곧 업데이트될 예정입니다!");
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-white/40 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#00A88C] mb-1">컬렉션 저장</p>
            <h3 className="font-bold text-xl text-[#0F0F0F]">어디에 저장할까요?</h3>
            <p className="text-sm text-gray-500 mt-1 line-clamp-1">{postTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="size-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-[#0F0F0F] transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="max-h-[300px] overflow-y-auto p-2 space-y-2">
            {collections.map((col) => {
              const isSaved = col.itemIds.includes(postId);
              return (
                <button
                  key={col.folderId}
                  onClick={() => saveToCollection(col.folderId)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors border text-left ${
                    isSaved
                      ? "bg-[#E7FAF6] border-[#00C9A7] text-[#007D69]"
                      : "bg-white border-gray-200 hover:border-[#00C9A7] hover:bg-[#F2FFFC]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-10 rounded-lg flex items-center justify-center transition-colors ${
                        isSaved ? "bg-[#00C9A7] text-white" : "bg-[#F7F7F5] text-[#00A88C]"
                      }`}
                    >
                      {isSaved ? <Check className="size-5" /> : <Bookmark className="size-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{col.folderName}</p>
                      <p className="text-xs text-gray-500">{col.itemIds.length}개 저장됨</p>
                    </div>
                  </div>
                  {isSaved && <span className="text-xs font-bold text-[#00A88C] shrink-0">저장됨</span>}
                </button>
              );
            })}
            {collections.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">저장할 폴더가 없습니다.</p>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              createCollectionAndSave();
            }}
            className="pt-4 border-t border-gray-100"
          >
            <label className="text-sm font-bold text-[#0F0F0F] mb-2 block">새 컬렉션 만들기</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="예: 메인페이지 레퍼런스"
                className="flex-1 px-3 py-2.5 rounded-lg bg-[#F7F7F5] border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C9A7] focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!newCollectionName.trim()}
                className="px-4 py-2.5 rounded-lg bg-[#0F0F0F] text-white text-sm font-semibold hover:bg-[#00A88C] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <FolderPlus className="size-4" />
                만들기
              </button>
            </div>
          </form>

          {notice && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                notice.includes("실패") || notice.includes("이미") 
                  ? "bg-[#FFF0ED] text-[#FF5C3A]" 
                  : "bg-[#E7FAF6] text-[#007D69]"
              }`}
            >
              {notice}
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
}
