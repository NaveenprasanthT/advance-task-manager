"use client";

import { useState } from "react";
import { NewRecurringTaskDialog } from "@/components/recurring/NewRecurringTaskDialog";
import { RecurringTaskCard } from "@/components/recurring/RecurringTaskCard";
import { RecurringTaskDetailSheet } from "@/components/recurring/RecurringTaskDetailSheet";
import { useRecurringTasksQuery, useRecurringAnalytics } from "@/hooks/useRecurringTasks";

export default function RecurringTasksPage() {
  const { data: templates, isLoading } = useRecurringTasksQuery();
  const { data: analytics } = useRecurringAnalytics();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const statsById = new Map((analytics?.templates ?? []).map((s) => [s.id, s]));
  const selectedTemplate = templates?.find((t) => t.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Recurring Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Routines that generate a fresh task each day they&apos;re due - mark today&apos;s Done to keep your streak.
          </p>
        </div>
        <NewRecurringTaskDialog />
      </div>

      {analytics && analytics.overall.totalDue > 0 ? (
        <p className="text-sm text-muted-foreground">
          Overall adherence (last 30 days):{" "}
          <span className="font-medium text-foreground">{analytics.overall.adherenceRate}%</span> (
          {analytics.overall.totalDone}/{analytics.overall.totalDue} due days)
        </p>
      ) : null}

      {isLoading || !templates ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : templates.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recurring tasks yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <RecurringTaskCard
              key={template.id}
              template={template}
              stats={statsById.get(template.id)}
              onEdit={() => setSelectedId(template.id)}
            />
          ))}
        </div>
      )}

      <RecurringTaskDetailSheet
        key={selectedTemplate?.id ?? "none"}
        template={selectedTemplate}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
