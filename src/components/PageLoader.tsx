import { Sparkles } from "lucide-react";

// Shared route-transition loader (src/app/(app)/loading.tsx and
// src/app/(admin)/loading.tsx) - a rotating conic-gradient ring in the app's
// own brand colors (same indigo->teal gradient as the sidebar logo mark,
// icon.svg, and the PWA manifest's theme color) with the sparkle badge
// gently pulsing at its center, rather than a generic spinner icon.
export function PageLoader() {
  return (
    <div className="flex flex-1 animate-in fade-in-0 flex-col items-center justify-center gap-4 py-20 duration-300">
      <div className="relative size-16">
        <div
          className="absolute inset-0 animate-spin rounded-full"
          style={{
            background: "conic-gradient(from 0deg, transparent 0%, #6366f1 50%, #2dd4bf 85%, transparent 100%)",
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 4px))",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 4px))",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-8 animate-pulse items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-teal-400 text-white shadow-lg">
            <Sparkles className="size-4" />
          </span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  );
}
