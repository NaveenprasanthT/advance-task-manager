"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/** True only after hydration - lets a component safely read browser-only state (e.g. localStorage) without a hydration mismatch. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
