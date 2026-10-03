import { ImageResponse } from "next/og";

// iOS's "Add to Home Screen" ignores the web manifest's icons and needs a
// real PNG <link rel="apple-touch-icon">, which this special file generates
// automatically (same convention as icon.svg, just rasterized) - reuses the
// sparkle mark from src/app/icon.svg as a solid fill (gradients are kept out
// of the og-image renderer to avoid any satori compatibility edge cases at
// this small a size).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <svg width="180" height="180" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="#6366f1" />
        <path d="M16 6l1.8 5.2L23 13l-5.2 1.8L16 20l-1.8-5.2L9 13l5.2-1.8L16 6z" fill="white" />
        <path d="M24 20l0.9 2.6L27.5 23.5l-2.6 0.9L24 27l-0.9-2.6L20.5 23.5l2.6-0.9L24 20z" fill="white" opacity={0.85} />
      </svg>
    ),
    { ...size },
  );
}
