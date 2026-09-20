"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";

/**
 * Applies the signed-in user's DB-saved theme preference to next-themes on
 * load, so the same user gets their saved theme on any device/browser rather
 * than relying on that browser's localStorage. Runs once per session value
 * change - it never fights a manual toggle, which updates both next-themes
 * and the DB/session together (see ThemeToggle).
 */
export function ThemeSync() {
  const { data: session, status } = useSession();
  const { setTheme } = useTheme();
  const appliedFor = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    const key = `${session.user.id}:${session.user.theme}`;
    if (appliedFor.current === key) return;
    appliedFor.current = key;
    setTheme(session.user.theme ?? "system");
  }, [status, session, setTheme]);

  return null;
}
