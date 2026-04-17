export type FeedProposalMessage = {
  id: string;
  conversationId: number;
  feedId: number;
  feedTitle: string;
  feedDescription: string;
  feedImage: string;
  feedCategory?: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string;
  message: string;
  createdAt: string;
};

export const FEED_PROPOSAL_MESSAGES_KEY = "pickxel:feed-proposal-messages";

export const getFeedProposalMessages = (): FeedProposalMessage[] => {
  if (typeof window === "undefined") return [];

  try {
    const rawValue = window.localStorage.getItem(FEED_PROPOSAL_MESSAGES_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
};

export const saveFeedProposalMessage = (proposal: FeedProposalMessage) => {
  if (typeof window === "undefined") return;

  const proposals = getFeedProposalMessages();
  window.localStorage.setItem(
    FEED_PROPOSAL_MESSAGES_KEY,
    JSON.stringify([proposal, ...proposals])
  );
};
