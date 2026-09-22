"use client";

import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useContext } from "react";
import { Compass, LogOut } from "lucide-react";
import { OnboardingTourContext } from "@/components/onboarding/OnboardingTourContext";

export function UserMenu({ name, email, image }: { name?: string | null; email?: string | null; image?: string | null }) {
  // Optional: absent in the admin sidebar, which isn't wrapped in the
  // provider (the tour's steps all live in the regular app, reachable from
  // admin via the existing "Back to my tasks" link).
  const tour = useContext(OnboardingTourContext);
  const initials = (name ?? email ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md p-2 text-left hover:bg-muted">
        <Avatar className="size-8">
          {image ? <AvatarImage src={image} alt={name ?? "User"} /> : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>My account</DropdownMenuLabel>
        </DropdownMenuGroup>
        {tour ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={tour.openTour}>
              <Compass className="size-4" />
              Take a tour
            </DropdownMenuItem>
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
