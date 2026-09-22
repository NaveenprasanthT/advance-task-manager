"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Trash2 } from "lucide-react";
import { PRIORITY_COLORS } from "@/lib/constants";
import { WEEKDAY_OPTIONS, MONTH_DAY_OPTIONS } from "@/lib/recurring-format";
import { useDeleteRecurringTask, useUpdateRecurringTask } from "@/hooks/useRecurringTasks";
import type { RecurringTaskDTO } from "@/types/recurring-task";
import type { TaskPriority } from "@/models/Task";
import type { RecurrenceFrequency } from "@/models/RecurringTask";

interface RecurringTaskDetailSheetProps {
  template: RecurringTaskDTO | null;
  onClose: () => void;
}

export function RecurringTaskDetailSheet({ template, onClose }: RecurringTaskDetailSheetProps) {
  const updateTemplate = useUpdateRecurringTask();
  const deleteTemplate = useDeleteRecurringTask();

  // Initialized once from the template this instance was mounted for - the
  // parent remounts this component (via `key={template.id}`) whenever a
  // different template is opened, so this never needs to re-sync mid-life.
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(template?.frequency ?? "daily");
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>((template?.daysOfWeek ?? []).map(String));
  const [daysOfMonth, setDaysOfMonth] = useState<string[]>((template?.daysOfMonth ?? []).map(String));

  if (!template) return null;

  const scheduleChanged =
    frequency !== template.frequency ||
    (frequency === "weekly" &&
      JSON.stringify(daysOfWeek.map(Number).sort()) !== JSON.stringify((template.daysOfWeek ?? []).slice().sort())) ||
    (frequency === "monthly" &&
      JSON.stringify(daysOfMonth.map(Number).sort()) !==
        JSON.stringify((template.daysOfMonth ?? []).slice().sort()));

  function saveSchedule() {
    if (!template) return;
    if (frequency === "weekly" && daysOfWeek.length === 0) return;
    if (frequency === "monthly" && daysOfMonth.length === 0) return;
    updateTemplate.mutate({
      id: template.id,
      frequency,
      daysOfWeek: frequency === "weekly" ? daysOfWeek.map(Number) : undefined,
      daysOfMonth: frequency === "monthly" ? daysOfMonth.map(Number) : undefined,
    });
  }

  return (
    <Sheet open={Boolean(template)} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="w-full max-w-md overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="break-words">{template.title}</SheetTitle>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge className={PRIORITY_COLORS[template.priority]} variant="secondary">
              {template.priority}
            </Badge>
            <Badge variant="secondary" className="font-normal">
              {template.category}
            </Badge>
          </div>
        </SheetHeader>

        <div className="space-y-4 px-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              defaultValue={template.title}
              onBlur={(e) => e.target.value.trim() && updateTemplate.mutate({ id: template.id, title: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              defaultValue={template.description ?? ""}
              onBlur={(e) => updateTemplate.mutate({ id: template.id, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={template.priority}
                onValueChange={(v) => updateTemplate.mutate({ id: template.id, priority: v as TaskPriority })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Estimate</Label>
              <Input
                type="number"
                min={0}
                defaultValue={template.estimateValue ?? ""}
                onBlur={(e) =>
                  updateTemplate.mutate({
                    id: template.id,
                    estimateValue: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={template.active}
              onCheckedChange={(checked) => updateTemplate.mutate({ id: template.id, active: checked })}
              id="recurring-active"
            />
            <Label htmlFor="recurring-active" className="text-sm font-normal text-muted-foreground">
              {template.active ? "Active" : "Paused"}
            </Label>
          </div>

          <div className="space-y-3 rounded-md border p-3">
            <Label>Schedule</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as RecurrenceFrequency)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly (selected days)</SelectItem>
                <SelectItem value="monthly">Monthly (selected dates)</SelectItem>
              </SelectContent>
            </Select>

            {frequency === "weekly" ? (
              <ToggleGroup value={daysOfWeek} onValueChange={setDaysOfWeek} multiple size="sm" className="flex-wrap">
                {WEEKDAY_OPTIONS.map((d) => (
                  <ToggleGroupItem key={d.value} value={d.value}>
                    {d.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            ) : null}

            {frequency === "monthly" ? (
              <ToggleGroup value={daysOfMonth} onValueChange={setDaysOfMonth} multiple size="sm" className="flex-wrap">
                {MONTH_DAY_OPTIONS.map((d) => (
                  <ToggleGroupItem key={d} value={d} className="w-9">
                    {d}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            ) : null}

            {scheduleChanged ? (
              <Button type="button" size="sm" onClick={saveSchedule} disabled={updateTemplate.isPending}>
                Save schedule
              </Button>
            ) : null}
          </div>
        </div>

        <SheetFooter>
          <Button
            variant="destructive"
            onClick={() => {
              deleteTemplate.mutate(template.id);
              onClose();
            }}
          >
            <Trash2 className="size-4" />
            Delete recurring task
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
