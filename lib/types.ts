export type User = {
  id: string;
  name: string;
  username: string;
  email?: string;
  avatar: string;
  bio: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  followers: number;
  following: number;
  posts: number;
  isFollowing?: boolean;
};

export type PostType = "post" | "article";

export type ReactionType =
  | "like"
  | "celebrate"
  | "support"
  | "love"
  | "insightful"
  | "funny";

export type Post = {
  id: string;
  author: User;
  type: PostType;
  title?: string;
  content: string;
  image?: string;
  video?: string;
  file?: {
    url: string;
    name: string;
  };
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
  isLiked?: boolean;
  reaction?: ReactionType | null;
  isSaved?: boolean;
};

export type Comment = {
  id: string;
  author: User;
  content: string;
  createdAt: string;
  likes: number;
  isLiked?: boolean;
  reaction?: ReactionType | null;
  parentId?: string | null;
  replies?: Comment[];
};

export type Notification = {
  id: string;
  type: "like" | "comment" | "follow" | "mention" | "system";
  message: string;
  user?: User;
  postId?: string;
  createdAt: string;
  read: boolean;
};

export type Conversation = {
  id: string;
  user: User;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
};

export type Message = {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
};

export type TrendingTopic = {
  id: string;
  tag: string;
  posts: number;
};
