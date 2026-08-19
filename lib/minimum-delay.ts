/** Minimum time to show page loading UI so refresh/navigation feels intentional. */
export const PAGE_LOAD_MIN_DELAY_MS = 650;

export function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const id = setTimeout(() => resolve(), ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(id);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

export async function withMinimumDelay<T>(
  promise: PromiseLike<T>,
  minimumMs: number,
): Promise<T> {
  const [result] = await Promise.all([
    Promise.resolve(promise),
    delay(minimumMs),
  ]);
  return result;
}
