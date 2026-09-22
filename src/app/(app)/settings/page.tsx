"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { Sparkles, User, Lock, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAutoGenSettings } from "@/hooks/useAutoGen";

function autoGenSummary(
  settings: { enabled: boolean; interests: string[]; frequency: string } | undefined,
): { label: string; tone: "on" | "off" } {
  if (!settings || !settings.enabled || settings.interests.length === 0) {
    return { label: "Not configured", tone: "off" };
  }
  return {
    label: `${settings.interests.length} interest${settings.interests.length === 1 ? "" : "s"} · ${settings.frequency}`,
    tone: "on",
  };
}

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [saving, setSaving] = useState(false);
  const { data: autoGen } = useAutoGenSettings();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = String(new FormData(e.currentTarget).get("name") ?? "").trim();
    if (!name) return;

    setSaving(true);
    const res = await fetch("/api/me", { method: "PATCH", body: JSON.stringify({ name }) });
    setSaving(false);
    if (!res.ok) {
      toast.error("Couldn't update profile");
      return;
    }
    await update({ name });
    toast.success("Profile updated");
  }

  const personal = autoGenSummary(autoGen?.personal);
  const professional = autoGenSummary(autoGen?.professional);

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <Link href="/settings/auto-generate" className="group block">
        <Card className="ring-1 ring-violet-300 transition-shadow hover:shadow-md dark:ring-violet-800">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-900 dark:text-violet-300">
                <Sparkles className="size-4.5" />
              </span>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Auto-generated to-dos
                  <Badge variant="secondary" className="font-normal">
                    Featured
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Tell us what you&apos;re into and we&apos;ll drop suggested tasks - with real articles - onto your
                  boards on a schedule.
                </CardDescription>
              </div>
            </div>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge
                variant="secondary"
                className={
                  personal.tone === "on"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200"
                    : "font-normal text-muted-foreground"
                }
              >
                Personal: {personal.label}
              </Badge>
              <Badge
                variant="secondary"
                className={
                  professional.tone === "on"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200"
                    : "font-normal text-muted-foreground"
                }
              >
                Professional: {professional.label}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </Link>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-4 text-muted-foreground" />
              Profile
            </CardTitle>
            <CardDescription>Update your display name.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form key={session?.user?.email ?? "loading"} onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={session?.user?.name ?? ""} required />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={session?.user?.email ?? ""} disabled />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="size-4 text-muted-foreground" />
              Password
            </CardTitle>
            <CardDescription>Change or set your login password.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" render={<Link href="/settings/password">Change password</Link>} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
