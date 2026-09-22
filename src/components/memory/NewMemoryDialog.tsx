"use client";

import { useState } from "react";
import { toast } from "sonner";
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
import { useCreateMemory } from "@/hooks/useMemories";
import type { TaskPriority } from "@/models/Task";
import { validateMemoryFile } from "@/lib/memory-files";

export function NewMemoryDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [rememberDate, setRememberDate] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const createMemory = useCreateMemory();

  function reset() {
    setName("");
    setDescription("");
    setCategory("");
    setPriority("Medium");
    setRememberDate("");
    setFiles([]);
  }

  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    for (const file of picked) {
      const error = validateMemoryFile(file);
      if (error) {
        toast.error(error);
        e.target.value = "";
        return;
      }
    }
    setFiles(picked);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    createMemory.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        priority,
        rememberDate: rememberDate || undefined,
        files,
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
            New memory
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New memory</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="memory-name">Name</Label>
            <Input id="memory-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="memory-description">Description</Label>
            <Textarea
              id="memory-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="memory-category">Category</Label>
              <Input
                id="memory-category"
                placeholder="e.g. Finance"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
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
            <Label>Date to remember</Label>
            <DatePicker
              value={rememberDate}
              onChange={(v) => setRememberDate(v ?? "")}
              placeholder="Past or future date"
              displayFormat="MMM d, yyyy"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="memory-files">Files</Label>
            <Input
              id="memory-files"
              type="file"
              multiple
              accept="image/*,.pdf,.xls,.xlsx,.csv"
              onChange={handleFilesChange}
            />
            {files.length > 0 ? (
              <p className="text-xs text-muted-foreground">{files.length} file(s) selected (max 4MB each)</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createMemory.isPending}>
              {createMemory.isPending ? "Saving..." : "Save memory"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
