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

export type PostType = "post" | "article" | "event";

export type ReactionType =
  | "like"
  | "celebrate"
  | "support"
  | "love"
  | "insightful"
  | "funny";

export type PostEvent = {
  title: string;
  startsAt: string;
  endsAt?: string;
  location?: string;
};

export type CelebrationOccasion =
  | "new-job"
  | "work-anniversary"
  | "promotion"
  | "certification"
  | "retirement"
  | "volunteering"
  | "other";

export type PostCelebration = {
  occasion: CelebrationOccasion;
  message?: string;
};

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
  event?: PostEvent;
  celebration?: PostCelebration;
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
  isLiked?: boolean;
  reaction?: ReactionType | null;
  /** Top reaction types on this post (LinkedIn-style summary icons). */
  reactionSummary?: ReactionType[];
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
  type: "like" | "comment" | "message" | "follow" | "mention" | "system";
  message: string;
  user?: User;
  postId?: string;
  commentId?: string;
  conversationId?: string;
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
