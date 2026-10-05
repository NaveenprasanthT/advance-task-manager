"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  ListTodo,
  Briefcase,
  BarChart3,
  Settings,
  ShieldCheck,
  Sparkles,
  Brain,
  Repeat,
  NotebookText,
  GraduationCap,
  CalendarCheck,
  Menu,
} from "lucide-react";
import { NavItem } from "./NavItem";
import { UserMenu } from "./UserMenu";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { PuzzleGameLauncher } from "@/components/puzzle/PuzzleGameLauncher";

interface AppSidebarProps {
  isAdmin: boolean;
  hasPuzzleAccess: boolean;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

// No horizontal padding of its own - callers already provide their own
// container padding (the desktop header row, the mobile top bar), and
// double-padding here was throwing off alignment against whatever sits on
// the opposite side of that row.
function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-teal-400 text-white shadow-sm">
        <Sparkles className="size-4" />
      </span>
      <span className="bg-gradient-to-r from-indigo-500 to-teal-500 bg-clip-text text-lg font-semibold text-transparent">
        TaskFlow
      </span>
    </div>
  );
}

function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  return (
    <nav className="flex flex-1 flex-col gap-1">
      <NavItem href="/today" label="Today" icon={CalendarCheck} />
      <NavItem href="/dashboard" label="Dashboard" icon={LayoutDashboard} />
      <NavItem href="/personal" label="Personal Board" icon={ListTodo} tourId="nav-personal" />
      <NavItem href="/professional" label="Professional Board" icon={Briefcase} />
      <NavItem href="/recurring" label="Recurring Tasks" icon={Repeat} tourId="nav-recurring" />
      <NavItem href="/study-planner" label="Study Planner" icon={GraduationCap} />
      <NavItem href="/memories" label="My Memory" icon={Brain} tourId="nav-memories" />
      <NavItem href="/notes" label="Notes" icon={NotebookText} />
      <NavItem href="/analytics" label="Analytics" icon={BarChart3} tourId="nav-analytics" />
      <NavItem href="/settings" label="Settings" icon={Settings} tourId="nav-settings" />
      {isAdmin ? (
        <>
          <Separator className="my-2" />
          <NavItem href="/admin/dashboard" label="Admin Panel" icon={ShieldCheck} />
        </>
      ) : null}
    </nav>
  );
}

function SidebarBody({ isAdmin, hasPuzzleAccess, name, email, image }: AppSidebarProps) {
  return (
    <>
      <NavLinks isAdmin={isAdmin} />
      {hasPuzzleAccess ? (
        <div className="mb-1 flex items-center justify-between px-2">
          <span className="text-xs font-medium text-muted-foreground">Picture Puzzle</span>
          <PuzzleGameLauncher />
        </div>
      ) : null}
      <Separator className="mb-3" />
      <UserMenu name={name} email={email} image={image} />
    </>
  );
}

// Desktop: a fixed, always-visible sidebar column. Hidden below md - on
// small/mobile screens the same nav content moves into MobileHeader's
// slide-in Sheet instead, so there's only ever one copy of the nav list
// markup to keep in sync.
export function AppSidebar(props: AppSidebarProps) {
  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col border-r bg-background p-4 md:flex">
      <div className="mb-6 flex items-center gap-2 px-2">
        <Logo />
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
      <SidebarBody {...props} />
    </aside>
  );
}

// Mobile: a slim top bar with a hamburger button that opens the same nav
// content in a left-side Sheet drawer, so the fixed 256px sidebar never
// eats the screen on a phone.
export function MobileHeader(props: AppSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between border-b bg-background px-4 py-3 md:hidden">
      <Logo />
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Sheet open={open} onOpenChange={setOpen}>
          <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(true)}>
            <Menu className="size-5" />
            <span className="sr-only">Open menu</span>
          </Button>
          <SheetContent side="left" className="flex w-72 flex-col p-4">
            <SheetHeader className="p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
            </SheetHeader>
            <div className="flex flex-1 flex-col" onClick={() => setOpen(false)}>
              <SidebarBody {...props} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
