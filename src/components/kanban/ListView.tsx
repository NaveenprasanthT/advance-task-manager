"use client";

import { CalendarClock, ListChecks } from "lucide-react";
import type { TaskDTO } from "@/types/task";
import type { TaskStatus } from "@/models/Task";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BOARD_LANES, STATUS_COLUMNS } from "@/lib/constants";
import { isTaskOverdue, OVERDUE_BADGE_CLASS } from "@/lib/task-utils";
import { cn } from "@/lib/utils";

interface ListViewProps {
  grouped: Record<string, TaskDTO[]>;
  onSelectTask: (id: string) => void;
  onChangeStatus: (taskId: string, status: TaskStatus) => void;
}

export function ListView({ grouped, onSelectTask, onChangeStatus }: ListViewProps) {
  const lanes = BOARD_LANES.filter((lane) => (grouped[lane.id]?.length ?? 0) > 0);

  if (lanes.length === 0) {
    return <p className="text-sm text-muted-foreground">No tasks yet.</p>;
  }

  return (
    <div className="flex-1 space-y-6 overflow-y-auto pb-4">
      {lanes.map(({ id, label, badgeClassName }) => (
        <div key={id}>
          <div className="mb-2 flex items-center gap-2">
            <Badge className={badgeClassName} variant="secondary">
              {label}
            </Badge>
            <span className="text-xs text-muted-foreground">{grouped[id].length}</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead>Estimate</TableHead>
                <TableHead>Subtasks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grouped[id].map((task) => {
                const overdue = isTaskOverdue(task);
                const doneSubtasks = task.subtasks.filter((s) => s.status === "Done").length;

                return (
                  <TableRow key={task.id} className="cursor-pointer" onClick={() => onSelectTask(task.id)}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <Select
                          value={task.status}
                          onValueChange={(value) => onChangeStatus(task.id, value as TaskStatus)}
                        >
                          <SelectTrigger size="sm" className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_COLUMNS.map(({ status, label: statusLabel }) => (
                              <SelectItem key={status} value={status}>
                                {statusLabel}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {overdue ? (
                          <Badge className={OVERDUE_BADGE_CLASS} variant="secondary">
                            Overdue
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      {task.dueDate ? (
                        <span
                          className={cn(
                            "flex items-center gap-1 text-sm",
                            overdue && "font-medium text-destructive",
                          )}
                        >
                          <CalendarClock className="size-3.5" />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {task.estimateValue ? `${task.estimateValue} ${task.estimateUnit}` : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {task.subtasks.length > 0 ? (
                        <span className="flex items-center gap-1">
                          <ListChecks className="size-3.5" />
                          {doneSubtasks}/{task.subtasks.length}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}
