"use client";

import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { RichTextEditor } from "./RichTextEditor";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { useUpdateNote, useDeleteNote } from "@/hooks/useNotes";
import type { NoteDTO } from "@/types/note";

export function NoteEditorPanel({ note, onDeleted }: { note: NoteDTO; onDeleted: () => void }) {
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const { debounced: debouncedSaveDescription, flush: flushDescription } = useDebouncedCallback(
    (html: string) => updateNote.mutate({ id: note.id, description: html }),
    800,
  );

  function handleDelete() {
    deleteNote.mutate(note.id);
    onDeleted();
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1.5">
          <Input
            key={`title-${note.id}`}
            defaultValue={note.title}
            className="border-none px-0 text-xl font-semibold shadow-none focus-visible:ring-0"
            onBlur={(e) => {
              flushDescription();
              if (e.target.value.trim()) updateNote.mutate({ id: note.id, title: e.target.value });
            }}
          />
        </div>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Delete note" onClick={handleDelete}>
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">Date</Label>
        <div className="w-40">
          <DatePicker
            value={note.date ? note.date.slice(0, 10) : undefined}
            onChange={(v) => updateNote.mutate({ id: note.id, date: v ?? null })}
            displayFormat="MMM d, yyyy"
          />
        </div>
      </div>

      <RichTextEditor key={`editor-${note.id}`} content={note.description ?? ""} onChange={debouncedSaveDescription} />
    </div>
  );
}
