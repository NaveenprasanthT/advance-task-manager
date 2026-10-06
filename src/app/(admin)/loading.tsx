import { PageLoader } from "@/components/PageLoader";

// Same as src/app/(app)/loading.tsx, mirrored here since (admin) is a
// separate top-level route group with its own layout (AdminSidebar), so it
// doesn't inherit the other one.
export default function AdminLoading() {
  return <PageLoader />;
}
