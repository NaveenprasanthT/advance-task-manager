"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ThemePreference } from "@/models/User";

const emptySubscribe = () => () => {};

function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { data: session, update } = useSession();
  const isClient = useIsClient();

  if (!isClient) {
    return <div className="size-8" />;
  }

  const isDark = resolvedTheme === "dark";

  async function applyTheme(next: ThemePreference) {
    setTheme(next);
    if (!session?.user) return;

    await update({ theme: next });
    fetch("/api/me/theme", { method: "PATCH", body: JSON.stringify({ theme: next }) }).catch(() => {});
  }

  return (
    <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => applyTheme(isDark ? "light" : "dark")}>
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
