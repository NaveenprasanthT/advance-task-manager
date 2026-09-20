import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminSidebar } from "@/components/sidebar/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/dashboard");

  return (
    <div className="flex h-screen">
      <AdminSidebar name={session.user.name} email={session.user.email} image={session.user.image} />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
