import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="pointer-events-none absolute -top-40 -left-32 size-96 rounded-full bg-indigo-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 size-96 rounded-full bg-teal-400/25 blur-3xl" />
      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-teal-400 text-white shadow-sm">
            <Sparkles className="size-5" />
          </span>
          <span className="bg-gradient-to-r from-indigo-500 to-teal-500 bg-clip-text text-2xl font-semibold text-transparent">
            TaskFlow
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
