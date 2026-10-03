import { WifiOff } from "lucide-react";

// Served by the service worker (public/sw.js) when a navigation request
// fails with no network and nothing cached for that page - intentionally
// static (no data fetching, no auth check) so it always renders instantly
// from the service worker's cache regardless of sign-in state.
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <WifiOff className="size-10 text-muted-foreground" />
      <h1 className="text-xl font-semibold">You&apos;re offline</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        This page needs an internet connection to load your data. Reconnect and try again.
      </p>
    </div>
  );
}
