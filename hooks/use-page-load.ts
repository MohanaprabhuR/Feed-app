"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage } from "@/lib/errors";
import { isLoadCancelled, runLoader } from "@/lib/loader";
import { PAGE_LOAD_MIN_DELAY_MS } from "@/lib/minimum-delay";

type UsePageLoadOptions<T> = {
  enabled?: boolean;
  initialData: T;
  fallbackError: string;
  minDelayMs?: number;
  /** When false, skip the first skeleton (data already on screen). */
  initialLoading?: boolean;
};

type ReloadOptions = {
  /** Keep current data visible; skip the loading skeleton and min delay. */
  silent?: boolean;
};

/**
 * Shared client loader: aborts in-flight work on unmount/dep change,
 * applies the page min-delay on first paint, and surfaces a retry helper.
 */
export function usePageLoad<T>(
  loader: (signal: AbortSignal) => Promise<T>,
  deps: readonly unknown[],
  options: UsePageLoadOptions<T>,
) {
  const {
    enabled = true,
    initialData,
    fallbackError,
    minDelayMs = PAGE_LOAD_MIN_DELAY_MS,
    initialLoading,
  } = options;

  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(initialLoading ?? enabled);
  const [error, setError] = useState<string | null>(null);

  // Latest-value refs so the async `reload` reads current values without being
  // re-created. Intentional render-time sync (see react-hooks/refs).
  const loaderRef = useRef(loader);
  // eslint-disable-next-line react-hooks/refs -- keep latest loader for async reload
  loaderRef.current = loader;
  const initialDataRef = useRef(initialData);
  // eslint-disable-next-line react-hooks/refs -- keep latest initialData for async reload
  initialDataRef.current = initialData;
  const dataRef = useRef(data);
  // eslint-disable-next-line react-hooks/refs -- keep latest data for abort-return
  dataRef.current = data;
  const abortRef = useRef<AbortController | null>(null);

  const reload = useCallback(
    async (reloadOptions: ReloadOptions = {}) => {
      abortRef.current?.abort();

      if (!enabled) {
        setData(initialDataRef.current);
        setError(null);
        setLoading(false);
        return initialDataRef.current;
      }

      const silent = Boolean(reloadOptions.silent);
      const controller = new AbortController();
      abortRef.current = controller;

      if (!silent) {
        setLoading(true);
        setError(null);
      }

      try {
        const next = await runLoader((signal) => loaderRef.current(signal), {
          signal: controller.signal,
          minDelayMs: silent ? 0 : minDelayMs,
        });
        if (controller.signal.aborted) return dataRef.current;
        setData(next);
        setError(null);
        return next;
      } catch (err) {
        if (isLoadCancelled(err) || controller.signal.aborted) {
          return dataRef.current;
        }
        setData(initialDataRef.current);
        setError(getErrorMessage(err, fallbackError));
        return initialDataRef.current;
      } finally {
        if (!controller.signal.aborted && !silent) {
          setLoading(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/use-memo -- caller-provided dynamic deps can't be a static array literal.
    [enabled, fallbackError, minDelayMs, ...deps],
  );

  useEffect(() => {
    void reload();
    return () => {
      abortRef.current?.abort();
    };
  }, [reload]);

  return { data, setData, loading, error, setError, reload };
}
