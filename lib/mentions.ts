export type ActiveMention = {
  query: string;
  start: number;
};

export function getActiveMention(
  value: string,
  caret: number,
): ActiveMention | null {
  const before = value.slice(0, caret);
  const match = before.match(/(?:^|[\s([{"'])@([a-z0-9_]*)$/i);
  if (!match) return null;

  const query = match[1] ?? "";
  return { query, start: caret - query.length - 1 };
}

export function insertMentionAtCaret(
  value: string,
  caret: number,
  username: string,
): { value: string; caret: number } {
  const active = getActiveMention(value, caret);
  if (!active) return { value, caret };

  const before = value.slice(0, active.start);
  const after = value.slice(caret);
  const mention = `@${username} `;
  return {
    value: before + mention + after,
    caret: before.length + mention.length,
  };
}
