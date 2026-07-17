/** Minimum time to show page loading UI so refresh/navigation feels intentional. */
export const PAGE_LOAD_MIN_DELAY_MS = 650;

export function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
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
