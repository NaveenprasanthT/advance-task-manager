import type { MetadataRoute } from "next";

// Next.js auto-serves this at /manifest.webmanifest and injects the
// <link rel="manifest"> tag - no manual wiring needed in layout.tsx.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TaskFlow",
    short_name: "TaskFlow",
    description: "Advanced personal and professional task manager",
    start_url: "/today",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#6366f1",
    icons: [
      // SVG with sizes "any" is the modern, officially-supported way to give
      // installable PWAs a crisp icon at every size Chrome/Android asks for,
      // without needing to ship a set of pre-rasterized PNGs.
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
