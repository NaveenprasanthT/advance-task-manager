"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Sparkles, Trash2, ListTodo, Briefcase } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  useAutoGenSettings,
  useUpdateAutoGenSettings,
  type AutoGenCategoryKey,
  type AutoGenCategorySettings,
} from "@/hooks/useAutoGen";
import type { AutoGenFrequency } from "@/models/User";

const FREQUENCIES: { value: AutoGenFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const CATEGORY_ICONS = { personal: ListTodo, professional: Briefcase } as const;

function AutoGenCategoryCard({
  category,
  title,
  settings,
}: {
  category: AutoGenCategoryKey;
  title: string;
  settings: AutoGenCategorySettings;
}) {
  const [newInterest, setNewInterest] = useState("");
  const update = useUpdateAutoGenSettings();
  const Icon = CATEGORY_ICONS[category];

  function addInterest(e: React.FormEvent) {
    e.preventDefault();
    const value = newInterest.trim();
    if (!value || settings.interests.includes(value)) return;
    update.mutate({ category, interests: [...settings.interests, value] });
    setNewInterest("");
  }

  function removeInterest(interest: string) {
    update.mutate({ category, interests: settings.interests.filter((i) => i !== interest) });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </span>
          <div>
            <CardTitle className="flex items-center gap-2">
              {title}
              <Badge
                variant="secondary"
                className={
                  settings.enabled
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200"
                    : "font-normal text-muted-foreground"
                }
              >
                {settings.enabled ? "Active" : "Paused"}
              </Badge>
            </CardTitle>
            <CardDescription>Auto-suggest tasks for your {title.toLowerCase()} board.</CardDescription>
          </div>
        </div>
        <Switch
          checked={settings.enabled}
          onCheckedChange={(checked) => update.mutate({ category, enabled: checked })}
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <div className="space-y-1.5">
            <Label>Frequency</Label>
            <Select
              value={settings.frequency}
              onValueChange={(value) => update.mutate({ category, frequency: value as AutoGenFrequency })}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="pb-2 text-xs text-muted-foreground">
            {settings.lastGeneratedAt
              ? `Last generated ${formatDistanceToNow(new Date(settings.lastGeneratedAt), { addSuffix: true })}`
              : "Nothing generated yet"}
          </p>
        </div>

        <div>
          <Label className="mb-2 block">Interests</Label>
          <div className="mb-2 flex flex-wrap gap-2">
            {settings.interests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No interests added yet.</p>
            ) : (
              settings.interests.map((interest) => (
                <Badge key={interest} variant="secondary" className="gap-1 pr-1">
                  {interest}
                  <button
                    type="button"
                    aria-label={`Remove ${interest}`}
                    onClick={() => removeInterest(interest)}
                    className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
          <form onSubmit={addInterest} className="flex gap-2">
            <Input
              placeholder="e.g. AI trends, personal finance"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
            />
            <Button type="submit" variant="outline" disabled={!newInterest.trim()}>
              Add
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AutoGenerateSettingsPage() {
  const { data, isLoading } = useAutoGenSettings();

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-violet-500" />
        <h1 className="text-2xl font-semibold">Auto-generated to-dos</h1>
      </div>

      <div className="rounded-md border border-violet-200 bg-violet-50 p-3 text-sm text-violet-800 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-200">
        Add a few topics you care about, pick how often, and turn it on. We&apos;ll find real articles and drop
        suggested tasks into your board&apos;s Suggested lane - accept the ones you want, dismiss the rest.
      </div>

      {isLoading || !data ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <>
          <AutoGenCategoryCard category="personal" title="Personal" settings={data.personal} />
          <AutoGenCategoryCard category="professional" title="Professional" settings={data.professional} />
        </>
      )}
    </div>
  );
}
