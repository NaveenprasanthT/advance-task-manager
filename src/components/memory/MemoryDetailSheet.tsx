"use client";

import { useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Trash2, FileText, FileSpreadsheet, File as FileIcon, Paperclip } from "lucide-react";
import type { MemoryDTO } from "@/types/memory";
import type { TaskPriority } from "@/models/Task";
import { PRIORITY_COLORS } from "@/lib/constants";
import { useUpdateMemory, useDeleteMemory, useAddMemoryFiles, useDeleteMemoryFile } from "@/hooks/useMemories";
import { validateMemoryFile } from "@/lib/memory-files";

interface MemoryDetailSheetProps {
  memory: MemoryDTO | null;
  onClose: () => void;
}

function fileIconFor(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return FileText;
  if (ext === "xls" || ext === "xlsx" || ext === "csv") return FileSpreadsheet;
  return FileIcon;
}

export function MemoryDetailSheet({ memory, onClose }: MemoryDetailSheetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateMemory = useUpdateMemory();
  const deleteMemory = useDeleteMemory();
  const addFiles = useAddMemoryFiles();
  const deleteFile = useDeleteMemoryFile();

  if (!memory) return null;

  function handleAddFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (!memory) return;
    const picked = Array.from(e.target.files ?? []);
    for (const file of picked) {
      const error = validateMemoryFile(file);
      if (error) {
        toast.error(error);
        e.target.value = "";
        return;
      }
    }
    if (picked.length > 0) {
      addFiles.mutate({ id: memory.id, files: picked });
    }
    e.target.value = "";
  }

  return (
    <Sheet open={Boolean(memory)} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="w-full max-w-md overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="break-words">{memory.name}</SheetTitle>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge className={PRIORITY_COLORS[memory.priority]} variant="secondary">
              {memory.priority}
            </Badge>
          </div>
        </SheetHeader>

        <div className="space-y-4 px-4">
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              defaultValue={memory.description ?? ""}
              onBlur={(e) => updateMemory.mutate({ id: memory.id, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input
                defaultValue={memory.category ?? ""}
                onBlur={(e) => updateMemory.mutate({ id: memory.id, category: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={memory.priority}
                onValueChange={(v) => updateMemory.mutate({ id: memory.id, priority: v as TaskPriority })}
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
            <div className="col-span-2 space-y-1.5">
              <Label>Date to remember</Label>
              <DatePicker
                value={memory.rememberDate ? memory.rememberDate.slice(0, 10) : undefined}
                onChange={(v) => updateMemory.mutate({ id: memory.id, rememberDate: v ?? null })}
                displayFormat="MMM d, yyyy"
              />
            </div>
          </div>

          <div>
            <Label className="mb-2 flex items-center gap-1.5">
              <Paperclip className="size-3.5" />
              Files
            </Label>
            <div className="space-y-2">
              {memory.files.map((file) => {
                const Icon = fileIconFor(file.fileName);
                return (
                  <div key={file.id} className="flex items-center gap-2 rounded-md border p-2">
                    {file.resourceType === "image" ? (
                      <div className="relative size-10 shrink-0 overflow-hidden rounded bg-muted">
                        <Image src={file.url} alt={file.fileName} fill className="object-cover" unoptimized />
                      </div>
                    ) : (
                      <Icon className="size-5 shrink-0 text-muted-foreground" />
                    )}
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 truncate text-sm text-primary hover:underline"
                    >
                      {file.fileName}
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={deleteFile.isPending}
                      onClick={() => deleteFile.mutate({ id: memory.id, fileId: file.id })}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                );
              })}
              {memory.files.length === 0 ? (
                <p className="text-sm text-muted-foreground">No files attached.</p>
              ) : null}
            </div>
            <div className="mt-2">
              <Input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.xls,.xlsx,.csv"
                onChange={handleAddFiles}
                disabled={addFiles.isPending}
              />
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button
            variant="destructive"
            onClick={() => {
              deleteMemory.mutate(memory.id);
              onClose();
            }}
          >
            <Trash2 className="size-4" />
            Delete memory
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
