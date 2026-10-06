import { PageLoader } from "@/components/PageLoader";

// Next.js shows this automatically while a route segment under this layout
// is being resolved during client-side navigation (e.g. clicking a sidebar
// link) - covers the "blank screen while the next page's code loads" gap,
// which is where page switches feel slowest on a phone/installed PWA. Each
// page's own data-loading state (React Query's isLoading, already handled
// per-page) takes over once the page itself has mounted - this only covers
// the moment before that.
export default function AppLoading() {
  return <PageLoader />;
}
