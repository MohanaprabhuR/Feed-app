export function getProfilePath(userId: string, currentUserId?: string | null) {
  if (currentUserId && userId === currentUserId) {
    return "/profile";
  }
  return `/user/${userId}`;
}
