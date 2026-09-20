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
import { DatePicker } from "@/components/ui/date-picker";
import { Plus } from "lucide-react";
import { useCreateTask } from "@/hooks/useTasks";
import type { TaskCategory, EstimateUnit } from "@/models/Task";

export function NewTaskDialog({ category }: { category: TaskCategory }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [estimateValue, setEstimateValue] = useState("");
  const [estimateUnit, setEstimateUnit] = useState<EstimateUnit>("hours");
  const [dueDate, setDueDate] = useState("");
  const [plannedStart, setPlannedStart] = useState("");
  const [plannedEnd, setPlannedEnd] = useState("");

  const createTask = useCreateTask(category);

  function reset() {
    setTitle("");
    setDescription("");
    setEstimateValue("");
    setDueDate("");
    setPlannedStart("");
    setPlannedEnd("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    createTask.mutate(
      {
        category,
        title: title.trim(),
        description: description.trim() || undefined,
        estimateValue: estimateValue ? Number(estimateValue) : undefined,
        estimateUnit,
        dueDate: dueDate || undefined,
        plannedStart: plannedStart || undefined,
        plannedEnd: plannedEnd || undefined,
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
            New task
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New {category.toLowerCase()} task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="estimateValue">Estimate</Label>
              <Input
                id="estimateValue"
                type="number"
                min={0}
                value={estimateValue}
                onChange={(e) => setEstimateValue(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Select value={estimateUnit} onValueChange={(v) => setEstimateUnit(v as EstimateUnit)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="points">Points</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Start</Label>
              <DatePicker
                value={plannedStart}
                onChange={(v) => setPlannedStart(v ?? "")}
                placeholder="Start"
                displayFormat="MMM d"
              />
            </div>
            <div className="space-y-1.5">
              <Label>End</Label>
              <DatePicker
                value={plannedEnd}
                onChange={(v) => setPlannedEnd(v ?? "")}
                placeholder="End"
                displayFormat="MMM d"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Due</Label>
              <DatePicker
                value={dueDate}
                onChange={(v) => setDueDate(v ?? "")}
                placeholder="Due"
                displayFormat="MMM d"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createTask.isPending}>
              {createTask.isPending ? "Creating..." : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
