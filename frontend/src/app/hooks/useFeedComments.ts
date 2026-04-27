import { useEffect, useRef, useState } from "react";
import { apiRequest } from "../api/apiClient";
import { getUserAvatar } from "../utils/avatar";

type CurrentUserLike = {
  userId?: number | null;
  nickname?: string | null;
  role?: string | null;
  profileImage?: string | null;
};

type FeedAuthorLike = {
  userId?: number;
};

type BaseFeedItemLike = {
  id: number;
  author: FeedAuthorLike;
  comments: number;
};

type FeedComment = {
  id: string;
  author: {
    name: string;
    avatar: string;
    role: string;
    profileKey?: string;
  };
  content: string;
  isMine?: boolean;
};

type CommentApiItem = {
  commentId: number;
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
  role: string;
  description: string;
  mine: boolean;
};

type CommentListApiData = {
  comments: CommentApiItem[];
};

type CreateCommentApiData = {
  commentId: number;
  postId: number;
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
  description: string;
};

export function useFeedComments<
  TFeed extends BaseFeedItemLike,
  TSelectedFeed extends TFeed
>({
  selectedFeed,
  currentUser,
  currentUserId,
  setApiFeedItems,
  setSelectedFeed,
  toFeedCommentRole,
}: {
  selectedFeed: TSelectedFeed | null;
  apiFeedItems: TFeed[];
  currentUser: CurrentUserLike | null;
  currentUserId: number | null;
  setApiFeedItems: React.Dispatch<React.SetStateAction<TFeed[]>>;
  setSelectedFeed: React.Dispatch<React.SetStateAction<TSelectedFeed | null>>;
  toFeedCommentRole: (role: string) => string;
}) {
  const [commentText, setCommentText] = useState("");
  const [commentSubmitError, setCommentSubmitError] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [commentLoadError, setCommentLoadError] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [isUpdatingComment, setIsUpdatingComment] = useState(false);
  const [isDeletingCommentId, setIsDeletingCommentId] = useState<string | null>(null);
  const [feedComments, setFeedComments] = useState<Record<number, FeedComment[]>>({});
  const loadedCommentPostIds = useRef<Record<number, true>>({});

  const selectedFeedComments = selectedFeed ? feedComments[selectedFeed.id] ?? [] : [];

  function mapApiComment(comment: CommentApiItem): FeedComment {
    return {
      id: String(comment.commentId),
      author: {
        name: comment.nickname,
        avatar: getUserAvatar(comment.profileImageUrl, comment.userId, comment.nickname),
        role: toFeedCommentRole(comment.role),
        profileKey: String(comment.userId),
      },
      content: comment.description,
      isMine: comment.mine,
    };
  }

  useEffect(() => {
    setFeedComments({});
    loadedCommentPostIds.current = {};
    setEditingCommentId(null);
    setEditingCommentText("");
    setCommentLoadError(null);
    setCommentSubmitError(null);
  }, [currentUserId]);

  useEffect(() => {
    let mounted = true;

    async function loadComments(postId: number) {
      try {
        setIsCommentsLoading(true);
        setCommentLoadError(null);

        const commentData = await apiRequest<CommentListApiData>(
          `/api/posts/${postId}/comments`,
          {},
          "댓글 목록을 불러오지 못했습니다.",
        );

        if (!mounted) return;

        const comments = (commentData?.comments ?? []).map(mapApiComment);

        setFeedComments((prev) => ({
          ...prev,
          [postId]: comments,
        }));
        loadedCommentPostIds.current[postId] = true;
        setApiFeedItems((prev) =>
          prev.map((item) =>
            item.id === postId ? ({ ...item, comments: comments.length } as TFeed) : item,
          ),
        );
        setSelectedFeed((prev) =>
          prev && prev.id === postId
            ? ({ ...prev, comments: comments.length } as TSelectedFeed)
            : prev,
        );
      } catch (error) {
        if (!mounted) return;
        setCommentLoadError(
          error instanceof Error ? error.message : "댓글 목록을 불러오지 못했습니다.",
        );
      } finally {
        if (mounted) {
          setIsCommentsLoading(false);
        }
      }
    }

    if (!selectedFeed) {
      setCommentLoadError(null);
      setCommentSubmitError(null);
      setEditingCommentId(null);
      setEditingCommentText("");
      return () => {
        mounted = false;
      };
    }

    if (loadedCommentPostIds.current[selectedFeed.id]) {
      setIsCommentsLoading(false);
      setCommentLoadError(null);
      return () => {
        mounted = false;
      };
    }

    void loadComments(selectedFeed.id);

    return () => {
      mounted = false;
    };
  }, [selectedFeed?.id, currentUserId]);

  async function handleSubmitComment() {
    if (!selectedFeed) return;

    const trimmedComment = commentText.trim();
    if (!trimmedComment) return;

    try {
      setIsSubmittingComment(true);
      setCommentSubmitError(null);

      const savedComment = await apiRequest<CreateCommentApiData>(
        `/api/posts/${selectedFeed.id}/comments`,
        {
          method: "POST",
          body: JSON.stringify({
            description: trimmedComment,
          }),
        },
        "댓글 등록에 실패했습니다.",
      );

      const newComment: FeedComment = {
        id: String(savedComment.commentId),
        author: {
          name: savedComment.nickname || currentUser?.nickname || "나",
          avatar: getUserAvatar(
            savedComment.profileImageUrl || currentUser?.profileImage,
            savedComment.userId,
            savedComment.nickname || currentUser?.nickname,
          ),
          role: toFeedCommentRole(currentUser?.role ?? ""),
          profileKey: String(savedComment.userId),
        },
        content: savedComment.description,
        isMine: true,
      };

      setFeedComments((prev) => ({
        ...prev,
        [selectedFeed.id]: [...(prev[selectedFeed.id] ?? []), newComment],
      }));
      setApiFeedItems((prev) =>
        prev.map((item) =>
          item.id === selectedFeed.id
            ? ({ ...item, comments: item.comments + 1 } as TFeed)
            : item,
        ),
      );
      setSelectedFeed((prev) =>
        prev ? ({ ...prev, comments: prev.comments + 1 } as TSelectedFeed) : prev,
      );
      setCommentText("");
    } catch (error) {
      setCommentSubmitError(
        error instanceof Error ? error.message : "댓글 등록에 실패했습니다.",
      );
    } finally {
      setIsSubmittingComment(false);
    }
  }

  function handleCommentKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    event.preventDefault();
    void handleSubmitComment();
  }

  function startEditingComment(comment: FeedComment) {
    setCommentSubmitError(null);
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.content);
  }

  function cancelEditingComment() {
    setEditingCommentId(null);
    setEditingCommentText("");
  }

  async function handleUpdateComment() {
    if (!selectedFeed || !editingCommentId) return;

    const trimmedComment = editingCommentText.trim();
    if (!trimmedComment) return;

    try {
      setIsUpdatingComment(true);
      setCommentSubmitError(null);

      const updatedComment = await apiRequest<{
        commentId: number;
        postId: number;
        description: string;
      }>(
        `/api/posts/${selectedFeed.id}/comments/${editingCommentId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            description: trimmedComment,
          }),
        },
        "댓글 수정에 실패했습니다.",
      );

      setFeedComments((prev) => ({
        ...prev,
        [selectedFeed.id]: (prev[selectedFeed.id] ?? []).map((comment) =>
          comment.id === String(updatedComment.commentId)
            ? {
                ...comment,
                content: updatedComment.description,
              }
            : comment,
        ),
      }));
      cancelEditingComment();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "댓글 수정 중 오류가 발생했습니다.";
      setCommentSubmitError(message);
    } finally {
      setIsUpdatingComment(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!selectedFeed) return;

    try {
      setIsDeletingCommentId(commentId);
      setCommentSubmitError(null);

      await apiRequest<{ commentId: number; postId: number }>(
        `/api/posts/${selectedFeed.id}/comments/${commentId}`,
        {
          method: "DELETE",
        },
        "댓글 삭제에 실패했습니다.",
      );

      setFeedComments((prev) => ({
        ...prev,
        [selectedFeed.id]: (prev[selectedFeed.id] ?? []).filter(
          (comment) => comment.id !== commentId,
        ),
      }));
      setApiFeedItems((prev) =>
        prev.map((item) =>
          item.id === selectedFeed.id
            ? ({ ...item, comments: Math.max(0, item.comments - 1) } as TFeed)
            : item,
        ),
      );
      setSelectedFeed((prev) =>
        prev
          ? ({ ...prev, comments: Math.max(0, prev.comments - 1) } as TSelectedFeed)
          : prev,
      );

      if (editingCommentId === commentId) {
        cancelEditingComment();
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "댓글 삭제 중 오류가 발생했습니다.";
      setCommentSubmitError(message);
    } finally {
      setIsDeletingCommentId(null);
    }
  }

  return {
    commentText,
    setCommentText,
    commentSubmitError,
    isSubmittingComment,
    isCommentsLoading,
    commentLoadError,
    editingCommentId,
    editingCommentText,
    setEditingCommentText,
    isUpdatingComment,
    isDeletingCommentId,
    selectedFeedComments,
    handleSubmitComment,
    handleCommentKeyDown,
    startEditingComment,
    cancelEditingComment,
    handleUpdateComment,
    handleDeleteComment,
  };
}
