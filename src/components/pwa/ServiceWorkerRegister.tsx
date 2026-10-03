"use client";

import { useEffect } from "react";

// Production-only: a service worker caching the app shell during `next dev`
// fights Turbopack's own hot-reload/fast-refresh (stale cached bundles), so
// it's deliberately skipped there.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((err) => console.error("Service worker registration failed", err));
  }, []);

  return null;
}
