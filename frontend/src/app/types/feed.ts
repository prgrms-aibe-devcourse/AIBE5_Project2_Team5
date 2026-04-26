export type FeedAuthor = {
  userId?: number;
  name: string;
  role: string;
  avatar: string;
  profileKey?: string;
};

export type FeedIntegration = {
  provider: "figma" | "adobe";
  label: string;
  url: string;
};

export type BaseFeedItem = {
  id: number;
  author: FeedAuthor;
  title: string;
  description: string;
  image: string;
  images?: string[];
  likes: number;
  comments: number;
  tags: string[];
  category?: string;
  integrations?: FeedIntegration[];
  createdAt?: string;
  userId?: number;
  portfolioUrl?: string | null;
  likedByMe?: boolean;
  isMine?: boolean;
  isApiFeed?: boolean;
};

export type FeedApiItem = {
  postId: number;
  userId: number;
  title: string;
  description: string | null;
  nickname: string;
  profileKey: string;
  profileImageUrl: string | null;
  job: string | null;
  role: string;
  thumbnailUrl: string | null;
  pickCount: number;
  commentCount: number;
  postType: string;
  category: string;
  picked: boolean;
};

export type FeedListApiData = {
  feeds: FeedApiItem[];
  nextCursor: number | null;
  hasNext: boolean;
};

export type FeedPickApiData = {
  postId: number;
  picked: boolean;
  pickCount: number;
};

export type FeedCardItem = BaseFeedItem & {
  feedKey: number;
};

export type FeedComment = {
  id: string;
  author: {
    name: string;
    avatar: string;
    role: string;
    profileKey?: string;
  };
  content: string;
  likes?: number;
  likedByMe?: boolean;
  isMine?: boolean;
};
