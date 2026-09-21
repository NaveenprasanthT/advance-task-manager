"use client";

import { LayoutDashboard, ListTodo, Briefcase, BarChart3, Settings, ShieldCheck, Sparkles } from "lucide-react";
import { NavItem } from "./NavItem";
import { UserMenu } from "./UserMenu";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { PuzzleGameLauncher } from "@/components/puzzle/PuzzleGameLauncher";

interface AppSidebarProps {
  isAdmin: boolean;
  hasPuzzleAccess: boolean;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export function AppSidebar({ isAdmin, hasPuzzleAccess, name, email, image }: AppSidebarProps) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r bg-background p-4">
      <div className="mb-6 flex items-center gap-2 px-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-teal-400 text-white shadow-sm">
          <Sparkles className="size-4" />
        </span>
        <span className="bg-gradient-to-r from-indigo-500 to-teal-500 bg-clip-text text-lg font-semibold text-transparent">
          TaskFlow
        </span>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        <NavItem href="/dashboard" label="Dashboard" icon={LayoutDashboard} />
        <NavItem href="/personal" label="Personal Board" icon={ListTodo} />
        <NavItem href="/professional" label="Professional Board" icon={Briefcase} />
        <NavItem href="/analytics" label="Analytics" icon={BarChart3} />
        <NavItem href="/settings" label="Settings" icon={Settings} />
        {isAdmin ? (
          <>
            <Separator className="my-2" />
            <NavItem href="/admin/dashboard" label="Admin Panel" icon={ShieldCheck} />
          </>
        ) : null}
      </nav>
      {hasPuzzleAccess ? (
        <div className="mb-1 flex items-center justify-between px-2">
          <span className="text-xs font-medium text-muted-foreground">Picture Puzzle</span>
          <PuzzleGameLauncher />
        </div>
      ) : null}
      <Separator className="mb-3" />
      <UserMenu name={name} email={email} image={image} />
    </aside>
  );
}
