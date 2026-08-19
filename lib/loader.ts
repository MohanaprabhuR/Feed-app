import { PAGE_LOAD_MIN_DELAY_MS, delay } from "@/lib/minimum-delay";

export class LoadCancelledError extends Error {
  constructor() {
    super("Load cancelled");
    this.name = "LoadCancelledError";
  }
}

export function isLoadCancelled(error: unknown) {
  if (error instanceof LoadCancelledError) return true;
  return error instanceof DOMException && error.name === "AbortError";
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new LoadCancelledError();
}

/**
 * Run an async page/data load with optional minimum delay and abort support.
 * Callers should ignore `isLoadCancelled` errors instead of showing them.
 */
export async function runLoader<T>(
  load: (signal: AbortSignal) => Promise<T>,
  options: {
    signal?: AbortSignal;
    minDelayMs?: number;
  } = {},
): Promise<T> {
  const { signal, minDelayMs = 0 } = options;
  throwIfAborted(signal);

  const startedAt = Date.now();
  try {
    const result = await load(signal ?? new AbortController().signal);
    throwIfAborted(signal);

    const remaining = minDelayMs - (Date.now() - startedAt);
    if (remaining > 0) {
      await delay(remaining, signal);
      throwIfAborted(signal);
    }

    return result;
  } catch (error) {
    if (isLoadCancelled(error)) throw new LoadCancelledError();
    throwIfAborted(signal);
    throw error;
  }
}

export const DEFAULT_PAGE_LOAD_MS = PAGE_LOAD_MIN_DELAY_MS;
