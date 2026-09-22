"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, Pause, Pencil, Play, Trash2 } from "lucide-react";
import { PRIORITY_COLORS } from "@/lib/constants";
import { frequencySummary } from "@/lib/recurring-format";
import { useDeleteRecurringTask, useUpdateRecurringTask, type RecurringTemplateStats } from "@/hooks/useRecurringTasks";
import type { RecurringTaskDTO } from "@/types/recurring-task";

export function RecurringTaskCard({
  template,
  stats,
  onEdit,
}: {
  template: RecurringTaskDTO;
  stats?: RecurringTemplateStats;
  onEdit: () => void;
}) {
  const updateTemplate = useUpdateRecurringTask();
  const deleteTemplate = useDeleteRecurringTask();

  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={onEdit}>
      <CardHeader>
        <CardTitle className="flex items-start justify-between gap-2">
          <span className="line-clamp-2">{template.title}</span>
          <Badge className={PRIORITY_COLORS[template.priority]} variant="secondary">
            {template.priority}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {template.description ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{template.description}</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="font-normal">
            {template.category}
          </Badge>
          <span>{frequencySummary(template)}</span>
          {!template.active ? <Badge variant="secondary">Paused</Badge> : null}
        </div>

        {stats ? (
          <div className="flex items-center gap-4 text-sm">
            <span>
              {stats.adherenceRate === null ? "—" : `${stats.adherenceRate}%`}{" "}
              <span className="text-xs text-muted-foreground">last 30d</span>
            </span>
            <span className="flex items-center gap-1">
              <Flame className="size-3.5 text-orange-500" />
              {stats.currentStreak}
            </span>
          </div>
        ) : null}

        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button type="button" variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="size-3.5" />
            Edit
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => updateTemplate.mutate({ id: template.id, active: !template.active })}
          >
            {template.active ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            {template.active ? "Pause" : "Resume"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => deleteTemplate.mutate(template.id)}>
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
