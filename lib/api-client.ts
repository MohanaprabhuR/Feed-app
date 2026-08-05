import type {
  Comment,
  Post,
  PostCelebration,
  PostEvent,
  ReactionType,
  User,
} from "@/lib/types";

export class ApiClientError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiClientError";
  }
}

type Json = Record<string, unknown> | undefined;

async function apiFetch<T>(
  path: string,
  options: {
    method?: string;
    body?: Json;
  } = {},
): Promise<T> {
  const { method = "GET", body } = options;
  const response = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
  } & T;

  if (!response.ok) {
    throw new ApiClientError(
      payload.error || `Request failed (${response.status})`,
      response.status,
    );
  }

  return payload;
}

/** REST client for feed-app API routes (cookie session). */
export const api = {
  posts: {
    list: () => apiFetch<{ posts: Post[] }>("/api/posts"),

    get: (id: string) => apiFetch<{ post: Post }>(`/api/posts/${id}`),

    create: (input: {
      content: string;
      media?: { image?: string; video?: string; file?: string };
      images?: string[];
      imageCaptions?: string[];
      mediaLayout?: "grid" | "slider" | "document";
      title?: string;
      event?: PostEvent;
      celebration?: PostCelebration;
    }) =>
      apiFetch<{ post: Post }>("/api/posts", {
        method: "POST",
        body: input,
      }),

    createArticle: (input: {
      title: string;
      content: string;
      coverImage?: string;
    }) =>
      apiFetch<{ post: Post }>("/api/posts", {
        method: "POST",
        body: { type: "article", ...input },
      }),

    update: (
      id: string,
      input: {
        content: string;
        media?: { image?: string; video?: string; file?: string } | null;
        images?: string[] | null;
        title?: string;
        event?: PostEvent | null;
      },
    ) =>
      apiFetch<{ post: Post }>(`/api/posts/${id}`, {
        method: "PATCH",
        body: input,
      }),

    delete: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/posts/${id}`, {
        method: "DELETE",
      }),

    comments: {
      list: (postId: string) =>
        apiFetch<{ comments: Comment[] }>(`/api/posts/${postId}/comments`),

      create: (
        postId: string,
        input: { content: string; parentId?: string },
      ) =>
        apiFetch<{ comment: Comment }>(`/api/posts/${postId}/comments`, {
          method: "POST",
          body: input,
        }),
    },

    reactions: {
      list: (postId: string) =>
        apiFetch<{ reactors: Array<User & { reaction: ReactionType }> }>(
          `/api/posts/${postId}/reactions`,
        ),

      set: (postId: string, reaction: ReactionType) =>
        apiFetch<{ reaction: ReactionType | null; likesCount: number }>(
          `/api/posts/${postId}/reactions`,
          { method: "PUT", body: { reaction } },
        ),

      clear: (postId: string) =>
        apiFetch<{ reaction: null; likesCount: number }>(
          `/api/posts/${postId}/reactions`,
          { method: "DELETE" },
        ),
    },

    save: (postId: string) =>
      apiFetch<{ saved: true }>(`/api/posts/${postId}/save`, {
        method: "PUT",
      }),

    unsave: (postId: string) =>
      apiFetch<{ saved: false }>(`/api/posts/${postId}/save`, {
        method: "DELETE",
      }),

    share: (postId: string, recipientIds: string[]) =>
      apiFetch<{ sharedCount: number; sharesCount: number }>(
        `/api/posts/${postId}/share`,
        { method: "POST", body: { recipientIds } },
      ),
  },

  comments: {
    reactions: {
      set: (commentId: string, reaction: ReactionType) =>
        apiFetch<{ reaction: ReactionType | null; likesCount: number }>(
          `/api/comments/${commentId}/reactions`,
          { method: "PUT", body: { reaction } },
        ),

      clear: (commentId: string) =>
        apiFetch<{ reaction: ReactionType | null; likesCount: number }>(
          `/api/comments/${commentId}/reactions`,
          { method: "DELETE" },
        ),
    },
  },

  saved: {
    list: () => apiFetch<{ posts: Post[] }>("/api/saved"),
  },

  me: {
    get: () => apiFetch<{ user: User }>("/api/me"),

    update: (input: {
      name?: string;
      email?: string | null;
      phone?: string | null;
      bio?: string | null;
      address?: string | null;
      city?: string | null;
      state?: string | null;
      zipCode?: string | null;
      avatar?: string | null;
    }) =>
      apiFetch<{ user: User }>("/api/me", {
        method: "PATCH",
        body: input,
      }),
  },

  users: {
    posts: (userId: string) =>
      apiFetch<{ posts: Post[] }>(`/api/users/${userId}/posts`),

    follow: (userId: string) =>
      apiFetch<{ following: true }>(`/api/users/${userId}/follow`, {
        method: "PUT",
      }),

    unfollow: (userId: string) =>
      apiFetch<{ following: false }>(`/api/users/${userId}/follow`, {
        method: "DELETE",
      }),
  },
};
