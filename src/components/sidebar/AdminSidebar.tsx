"use client";

import Link from "next/link";
import { ArrowLeft, BarChart3, ScrollText, ShieldCheck, Users } from "lucide-react";
import { NavItem } from "./NavItem";
import { UserMenu } from "./UserMenu";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";

interface AdminSidebarProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export function AdminSidebar({ name, email, image }: AdminSidebarProps) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r bg-background p-4">
      <div className="mb-4 flex items-center gap-2 px-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-400 text-white shadow-sm">
          <ShieldCheck className="size-4" />
        </span>
        <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-lg font-semibold text-transparent">
          Admin
        </span>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
      <Link
        href="/dashboard"
        className="mb-6 flex items-center gap-2 px-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to my tasks
      </Link>
      <nav className="flex flex-1 flex-col gap-1">
        <NavItem href="/admin/dashboard" label="Dashboard" icon={BarChart3} />
        <NavItem href="/admin/users" label="Users" icon={Users} />
        <NavItem href="/admin/system-log" label="System Log" icon={ScrollText} />
      </nav>
      <Separator className="mb-3" />
      <UserMenu name={name} email={email} image={image} />
    </aside>
  );
}
