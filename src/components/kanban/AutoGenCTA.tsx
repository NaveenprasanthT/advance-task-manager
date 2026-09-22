"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAutoGenSettings, type AutoGenCategoryKey } from "@/hooks/useAutoGen";
import { useIsClient } from "@/hooks/useIsClient";
import type { TaskCategory } from "@/models/Task";

function dismissKey(key: AutoGenCategoryKey) {
  return `taskflow:autogen-cta-dismissed:${key}`;
}

export function AutoGenCTA({ category }: { category: TaskCategory }) {
  const key: AutoGenCategoryKey = category === "Personal" ? "personal" : "professional";
  const { data } = useAutoGenSettings();
  const isClient = useIsClient();
  const [dismissedOverride, setDismissedOverride] = useState(false);

  // Gated on isClient (hydration-safe) rather than an effect+setState, so
  // localStorage can just be read directly during render.
  if (!isClient || !data) return null;

  const dismissed = dismissedOverride || localStorage.getItem(dismissKey(key)) === "1";
  const configured = Boolean(data[key]?.enabled && data[key].interests.length > 0);
  if (configured || dismissed) return null;

  return (
    <div
      data-tour="autogen-cta"
      className="mb-4 flex items-center gap-3 rounded-md border border-violet-200 bg-violet-50 p-3 text-sm dark:border-violet-900 dark:bg-violet-950"
    >
      <Sparkles className="size-4 shrink-0 text-violet-600 dark:text-violet-300" />
      <p className="flex-1 text-violet-800 dark:text-violet-200">
        Let AI suggest {category.toLowerCase()} tasks based on topics you&apos;re into.
      </p>
      <Button size="sm" render={<Link href="/settings/auto-generate">Configure</Link>} />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Dismiss"
        onClick={() => {
          localStorage.setItem(dismissKey(key), "1");
          setDismissedOverride(true);
        }}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
