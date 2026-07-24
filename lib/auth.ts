export type SignUpInput = {
  name: string;
  username: string;
  email: string;
  password: string;
};

/** Routes accessible without a session */
export const PUBLIC_ROUTES = [
  "/splash",
  "/welcome",
  "/login",
  "/register",
  "/forgot-password",
  "/otp",
  "/verify-email",
  "/terms",
  "/about",
] as const;

/** Auth screens — logged-in users are redirected away */
export const AUTH_ONLY_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/otp",
  "/verify-email",
] as const;

export function matchesRoute(pathname: string, routes: readonly string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function isPublicRoute(pathname: string) {
  return (
    matchesRoute(pathname, PUBLIC_ROUTES) || pathname.startsWith("/auth/")
  );
}

export function isAuthOnlyRoute(pathname: string) {
  return matchesRoute(pathname, AUTH_ONLY_ROUTES);
}

export function getSafeRedirectPath(next: string | null) {
  if (
    !next ||
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.includes("://") ||
    next.includes("\\")
  ) {
    return "/feed";
  }
  if (isAuthOnlyRoute(next)) {
    return "/feed";
  }
  return next;
}

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export function validateSignUpInput(input: SignUpInput): string | null {
  if (!input.name.trim()) return "Full name is required.";
  if (input.name.trim().length < 2) return "Name must be at least 2 characters.";

  const username = normalizeUsername(input.username);
  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return "Username must be 3–20 characters (letters, numbers, underscore).";
  }

  if (!input.email.trim()) return "Email is required.";
  if (input.password.length < 6) {
    return "Password must be at least 6 characters.";
  }

  return null;
}

export function validateLoginInput(username: string, password: string): string | null {
  const normalized = normalizeUsername(username);

  if (!normalized) return "Username is required.";
  if (!/^[a-z0-9_]{3,20}$/.test(normalized)) {
    return "Enter a valid username (3–20 characters).";
  }
  if (!password) return "Password is required.";

  return null;
}

/** UI Faces human avatars: https://uifaces.co/category/human (222 images). */
const UI_FACES_HUMAN_COUNT = 222;

function hashUsernameToAvatarId(username: string) {
  let hash = 0;
  for (const char of username.toLowerCase()) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return (hash % UI_FACES_HUMAN_COUNT) + 1;
}

export function getDefaultAvatar(username: string) {
  const id = hashUsernameToAvatarId(username.trim() || "user");
  return `https://mockmind-api.uifaces.co/content/human/${id}.jpg`;
}

export function formatAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "Too many signup attempts. Try signing in with your username, or wait a few minutes.";
  }

  if (
    lower.includes("already registered") ||
    lower.includes("already been registered")
  ) {
    return "This email is already registered. Try signing in with your username.";
  }

  if (lower.includes("invalid login credentials")) {
    return "Invalid username or password.";
  }

  return message;
}


export function isAlreadyRegisteredError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("already registered") ||
    lower.includes("already been registered")
  );
}

export function isRateLimitError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("rate limit") || lower.includes("too many requests");
}

export function isEmailNotConfirmedError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("email not confirmed") ||
    lower.includes("email_not_confirmed")
  );
}
