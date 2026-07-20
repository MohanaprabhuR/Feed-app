export function formatUsernameHandle(username: string): string {
  const normalized = username.trim().toLowerCase().replace(/^@+/, "");
  return normalized ? `@${normalized}` : "@user";
}
