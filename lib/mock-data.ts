import type {
  Comment,
  Conversation,
  Message,
  Notification,
  Post,
  TrendingTopic,
  User,
} from "./types";

export const currentUser: User = {
  id: "me",
  name: "Alex Morgan",
  username: "alexmorgan",
  avatar: "https://mockmind-api.uifaces.co/content/human/222.jpg",
  bio: "Designer & coffee enthusiast. Building things on the internet.",
  followers: 1240,
  following: 380,
  posts: 48,
};

export const users: User[] = [
  currentUser,
  {
    id: "u1",
    name: "Sarah Chen",
    username: "sarahchen",
    avatar: "https://mockmind-api.uifaces.co/content/human/80.jpg",
    bio: "Photographer | Travel lover",
    followers: 5200,
    following: 412,
    posts: 156,
    isFollowing: true,
  },
  {
    id: "u2",
    name: "James Wilson",
    username: "jamesw",
    avatar: "https://mockmind-api.uifaces.co/content/human/81.jpg",
    bio: "Software engineer at a startup",
    followers: 890,
    following: 210,
    posts: 34,
    isFollowing: false,
  },
  {
    id: "u3",
    name: "Mia Rodriguez",
    username: "miar",
    avatar: "https://mockmind-api.uifaces.co/content/human/220.jpg",
    bio: "Food blogger & recipe creator",
    followers: 12400,
    following: 520,
    posts: 289,
    isFollowing: true,
  },
  {
    id: "u4",
    name: "David Kim",
    username: "davidk",
    avatar: "https://mockmind-api.uifaces.co/content/human/150.jpg",
    bio: "Fitness coach | Marathon runner",
    followers: 3200,
    following: 180,
    posts: 92,
    isFollowing: false,
  },
];

export const posts: Post[] = [
  {
    id: "p1",
    type: "post",
    author: users[1],
    content:
      "Golden hour at the coast never gets old. Sometimes the best shots happen when you least expect them.",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=500&fit=crop",
    likes: 342,
    comments: 28,
    shares: 12,
    createdAt: "2h ago",
    isLiked: true,
    isSaved: false,
  },
  {
    id: "p2",
    type: "post",
    author: users[2],
    content:
      "Just shipped a major feature after three weeks of late nights. Grateful for an amazing team. What's everyone building this week?",
    likes: 89,
    comments: 15,
    shares: 4,
    createdAt: "4h ago",
    isLiked: false,
    isSaved: true,
  },
  {
    id: "p3",
    type: "post",
    author: users[3],
    content:
      "New recipe drop: spicy miso ramen with soft-boiled eggs. Link in bio for the full walkthrough!",
    image:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=500&fit=crop",
    likes: 1205,
    comments: 94,
    shares: 67,
    createdAt: "6h ago",
    isLiked: true,
    isSaved: true,
  },
  {
    id: "p4",
    type: "post",
    author: users[4],
    content:
      "Morning run complete. 10K before breakfast — consistency beats intensity every single time.",
    likes: 156,
    comments: 22,
    shares: 8,
    createdAt: "8h ago",
    isLiked: false,
    isSaved: false,
  },
  {
    id: "p5",
    type: "post",
    author: currentUser,
    content:
      "Redesigned my portfolio this weekend. Minimal, fast, and accessible. Feedback welcome!",
    image:
      "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&h=500&fit=crop",
    likes: 67,
    comments: 11,
    shares: 3,
    createdAt: "1d ago",
    isLiked: false,
    isSaved: false,
  },
];

export const comments: Comment[] = [
  {
    id: "c1",
    author: users[2],
    content: "Absolutely stunning shot! What camera did you use?",
    createdAt: "1h ago",
    likes: 12,
    replies: [
      {
        id: "c1r1",
        author: users[1],
        content: "Thanks! Sony A7IV with a 35mm prime lens.",
        createdAt: "45m ago",
        likes: 5,
      },
    ],
  },
  {
    id: "c2",
    author: users[3],
    content: "The colors are incredible. Saving this for inspiration.",
    createdAt: "30m ago",
    likes: 8,
  },
];

export const notifications: Notification[] = [
  {
    id: "n1",
    type: "like",
    message: "liked your post",
    user: users[1],
    postId: "p5",
    createdAt: "5m ago",
    read: false,
  },
  {
    id: "n2",
    type: "follow",
    message: "started following you",
    user: users[4],
    createdAt: "1h ago",
    read: false,
  },
  {
    id: "n3",
    type: "comment",
    message: "commented on your post",
    user: users[2],
    postId: "p5",
    createdAt: "2h ago",
    read: true,
  },
  {
    id: "n4",
    type: "message",
    message: "sent you a message: Hey there!",
    user: users[3],
    conversationId: "conv1",
    createdAt: "5h ago",
    read: true,
  },
  {
    id: "n5",
    type: "system",
    message: "Your account security settings were updated",
    createdAt: "1d ago",
    read: true,
  },
];

export const conversations: Conversation[] = [
  {
    id: "conv1",
    user: users[1],
    lastMessage: "That photo is amazing! Where was it taken?",
    lastMessageAt: "10m ago",
    unread: 2,
  },
  {
    id: "conv2",
    user: users[3],
    lastMessage: "I'll send you the recipe tonight!",
    lastMessageAt: "1h ago",
    unread: 0,
  },
  {
    id: "conv3",
    user: users[2],
    lastMessage: "Want to collaborate on the open source project?",
    lastMessageAt: "3h ago",
    unread: 1,
  },
];

export const messages: Record<string, Message[]> = {
  conv1: [
    {
      id: "m1",
      senderId: "u1",
      content: "Hey! Loved your portfolio redesign.",
      createdAt: "2h ago",
    },
    {
      id: "m2",
      senderId: "me",
      content: "Thank you so much! It took a while to get right.",
      createdAt: "1h ago",
    },
    {
      id: "m3",
      senderId: "u1",
      content: "That photo is amazing! Where was it taken?",
      createdAt: "10m ago",
    },
  ],
  conv2: [
    {
      id: "m4",
      senderId: "me",
      content: "Can you share the ramen recipe?",
      createdAt: "2h ago",
    },
    {
      id: "m5",
      senderId: "u3",
      content: "I'll send you the recipe tonight!",
      createdAt: "1h ago",
    },
  ],
  conv3: [
    {
      id: "m6",
      senderId: "u2",
      content: "Want to collaborate on the open source project?",
      createdAt: "3h ago",
    },
  ],
};

export const trendingTopics: TrendingTopic[] = [
  { id: "t1", tag: "DesignSystems", posts: 12400 },
  { id: "t2", tag: "MorningRoutine", posts: 8900 },
  { id: "t3", tag: "TechNews", posts: 45200 },
  { id: "t4", tag: "FoodPhotography", posts: 6700 },
  { id: "t5", tag: "WeekendVibes", posts: 15600 },
];

export const blockedUsers: User[] = [
  {
    id: "b1",
    name: "Spam Account",
    username: "spamuser99",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Spam",
    bio: "",
    followers: 12,
    following: 5000,
    posts: 0,
  },
];

export function getUserById(id: string): User | undefined {
  return users.find((u) => u.id === id);
}

export function getPostById(id: string): Post | undefined {
  return posts.find((p) => p.id === id);
}

export function getConversationById(id: string): Conversation | undefined {
  return conversations.find((c) => c.id === id);
}
