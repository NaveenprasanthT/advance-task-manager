"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Plus } from "lucide-react";
import { useCreateRecurringTask } from "@/hooks/useRecurringTasks";
import type { TaskCategory, TaskPriority } from "@/models/Task";
import type { RecurrenceFrequency } from "@/models/RecurringTask";
import { WEEKDAY_OPTIONS, MONTH_DAY_OPTIONS } from "@/lib/recurring-format";

export function NewRecurringTaskDialog({ category }: { category?: TaskCategory }) {
  const [open, setOpen] = useState(false);
  const [taskCategory, setTaskCategory] = useState<TaskCategory>(category ?? "Personal");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [frequency, setFrequency] = useState<RecurrenceFrequency>("daily");
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>([]);
  const [daysOfMonth, setDaysOfMonth] = useState<string[]>([]);

  const createRecurringTask = useCreateRecurringTask();

  function reset() {
    setTitle("");
    setDescription("");
    setPriority("Medium");
    setFrequency("daily");
    setDaysOfWeek([]);
    setDaysOfMonth([]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (frequency === "weekly" && daysOfWeek.length === 0) return;
    if (frequency === "monthly" && daysOfMonth.length === 0) return;

    createRecurringTask.mutate(
      {
        category: taskCategory,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        frequency,
        daysOfWeek: frequency === "weekly" ? daysOfWeek.map(Number) : undefined,
        daysOfMonth: frequency === "monthly" ? daysOfMonth.map(Number) : undefined,
      },
      {
        onSuccess: () => {
          reset();
          setOpen(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <Plus className="size-4" />
            New recurring task
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New recurring task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="recurring-title">Title</Label>
            <Input id="recurring-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="recurring-description">Description</Label>
            <Textarea
              id="recurring-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Board</Label>
              <Select value={taskCategory} onValueChange={(v) => setTaskCategory(v as TaskCategory)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Personal">Personal</SelectItem>
                  <SelectItem value="Professional">Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
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
          </div>

          <div className="space-y-1.5">
            <Label>Frequency</Label>
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
          </div>

          {frequency === "weekly" ? (
            <div className="space-y-1.5">
              <Label>Days of the week</Label>
              <ToggleGroup value={daysOfWeek} onValueChange={setDaysOfWeek} multiple size="sm" className="flex-wrap">
                {WEEKDAY_OPTIONS.map((d) => (
                  <ToggleGroupItem key={d.value} value={d.value}>
                    {d.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          ) : null}

          {frequency === "monthly" ? (
            <div className="space-y-1.5">
              <Label>Dates of the month</Label>
              <ToggleGroup value={daysOfMonth} onValueChange={setDaysOfMonth} multiple size="sm" className="flex-wrap">
                {MONTH_DAY_OPTIONS.map((d) => (
                  <ToggleGroupItem key={d} value={d} className="w-9">
                    {d}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={createRecurringTask.isPending}>
              {createRecurringTask.isPending ? "Creating..." : "Create recurring task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
