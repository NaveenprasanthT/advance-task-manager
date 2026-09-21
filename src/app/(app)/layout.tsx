import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppSidebar } from "@/components/sidebar/AppSidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex h-screen">
      <AppSidebar
        isAdmin={session.user.role === "admin"}
        hasPuzzleAccess={session.user.role === "admin" || session.user.puzzleAccess}
        name={session.user.name}
        email={session.user.email}
        image={session.user.image}
      />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
