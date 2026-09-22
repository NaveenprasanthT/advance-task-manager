"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Trash2, Sparkles, ExternalLink, Check, Repeat } from "lucide-react";
import type { TaskDTO } from "@/types/task";
import type { TaskCategory, SubtaskStatus, TaskPriority } from "@/models/Task";
import {
  useAddSubtask,
  useDeleteSubtask,
  useDeleteTask,
  useUpdateSubtask,
  useUpdateTask,
  useUpdateTaskStatus,
} from "@/hooks/useTasks";
import { PRIORITY_COLORS, STATUS_COLORS } from "@/lib/constants";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isTaskOverdue, OVERDUE_BADGE_CLASS } from "@/lib/task-utils";

interface TaskDetailSheetProps {
  task: TaskDTO | null;
  category: TaskCategory;
  onClose: () => void;
}

export function TaskDetailSheet({ task, category, onClose }: TaskDetailSheetProps) {
  const [newSubtask, setNewSubtask] = useState("");
  const updateTask = useUpdateTask(category);
  const updateStatus = useUpdateTaskStatus(category);
  const deleteTask = useDeleteTask(category);
  const addSubtask = useAddSubtask(category);
  const updateSubtask = useUpdateSubtask(category);
  const deleteSubtask = useDeleteSubtask(category);

  if (!task) return null;

  function handleAddSubtask(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubtask.trim() || !task) return;
    addSubtask.mutate({ taskId: task.id, title: newSubtask.trim() });
    setNewSubtask("");
  }

  return (
    <Sheet open={Boolean(task)} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="w-full max-w-md overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="break-words">{task.title}</SheetTitle>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge className={STATUS_COLORS[task.status]} variant="secondary">
              {task.status}
            </Badge>
            <Badge className={PRIORITY_COLORS[task.priority]} variant="secondary">
              {task.priority}
            </Badge>
            {isTaskOverdue(task) ? (
              <Badge className={OVERDUE_BADGE_CLASS} variant="secondary">
                Overdue
              </Badge>
            ) : null}
            {task.origin === "auto" ? (
              <Badge
                variant="secondary"
                className="gap-1 bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-200"
              >
                <Sparkles className="size-3" />
                Auto-suggested
              </Badge>
            ) : null}
            {task.origin === "recurring" ? (
              <Badge
                variant="secondary"
                className="gap-1 bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-200"
              >
                <Repeat className="size-3" />
                Recurring
              </Badge>
            ) : null}
          </div>
        </SheetHeader>

        <div className="space-y-4 px-4">
          {task.resourceUrl ? (
            <a
              href={task.resourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ExternalLink className="size-3.5" />
              Learn more
            </a>
          ) : null}

          {task.status === "Aborted" && task.abortReason ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <span className="font-medium">Abort reason: </span>
              {task.abortReason}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              defaultValue={task.description ?? ""}
              onBlur={(e) => updateTask.mutate({ id: task.id, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={task.priority}
                onValueChange={(v) => updateTask.mutate({ id: task.id, priority: v as TaskPriority })}
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
                defaultValue={task.estimateValue ?? ""}
                onBlur={(e) =>
                  updateTask.mutate({
                    id: task.id,
                    estimateValue: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Due date</Label>
              <DatePicker
                value={task.dueDate ? task.dueDate.slice(0, 10) : undefined}
                onChange={(v) => updateTask.mutate({ id: task.id, dueDate: v })}
                displayFormat="MMM d, yyyy"
              />
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Subtasks</Label>
            <div className="space-y-2">
              {task.subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center justify-between gap-2 rounded-md border p-2">
                  <span className="flex-1 truncate text-sm">{subtask.title}</span>
                  <ToggleGroup
                    size="sm"
                    value={[subtask.status]}
                    onValueChange={(values) => {
                      const next = values[0] as SubtaskStatus | undefined;
                      if (!next) return;
                      updateSubtask.mutate({
                        taskId: task.id,
                        subtaskId: subtask.id,
                        status: next,
                      });
                    }}
                  >
                    <ToggleGroupItem value="Todo">Todo</ToggleGroupItem>
                    <ToggleGroupItem value="InProgress">Doing</ToggleGroupItem>
                    <ToggleGroupItem value="Done">Done</ToggleGroupItem>
                  </ToggleGroup>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteSubtask.mutate({ taskId: task.id, subtaskId: subtask.id })}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddSubtask} className="mt-2 flex gap-2">
              <Input
                placeholder="Add a subtask"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
              />
              <Button type="submit" variant="outline" disabled={!newSubtask.trim()}>
                Add
              </Button>
            </form>
          </div>
        </div>

        <SheetFooter>
          {task.status === "Suggested" ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  deleteTask.mutate(task.id);
                  onClose();
                }}
              >
                <Trash2 className="size-4" />
                Dismiss
              </Button>
              <Button onClick={() => updateStatus.mutate({ id: task.id, status: "Todo" })}>
                <Check className="size-4" />
                Accept into Todo
              </Button>
            </div>
          ) : (
            <Button
              variant="destructive"
              onClick={() => {
                deleteTask.mutate(task.id);
                onClose();
              }}
            >
              <Trash2 className="size-4" />
              Delete task
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
