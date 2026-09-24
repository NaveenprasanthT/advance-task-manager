"use client";

import { useEffect, useRef } from "react";

/**
 * Returns a debounced version of `callback` plus a `flush` function that
 * immediately invokes any pending call - used so a caller can force a save
 * on unmount/blur instead of losing the last few hundred ms of edits.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs: number,
): { debounced: (...args: Args) => void; flush: () => void } {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingArgsRef = useRef<Args | null>(null);

  function flush() {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (pendingArgsRef.current !== null) {
      const args = pendingArgsRef.current;
      pendingArgsRef.current = null;
      callbackRef.current(...args);
    }
  }

  function debounced(...args: Args) {
    pendingArgsRef.current = args;
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      flush();
    }, delayMs);
  }

  useEffect(() => () => flush(), []);

  return { debounced, flush };
}
