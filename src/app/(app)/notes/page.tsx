"use client";

import { useState } from "react";
import { ArrowLeft, NotebookText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NoteList } from "@/components/notes/NoteList";
import { NoteEditorPanel } from "@/components/notes/NoteEditorPanel";
import { useNotesQuery, useCreateNote } from "@/hooks/useNotes";
import { cn } from "@/lib/utils";

export default function NotesPage() {
  const { data: notes, isLoading } = useNotesQuery();
  const createNote = useCreateNote();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedNote = notes?.find((n) => n.id === selectedId) ?? null;

  function handleCreate() {
    createNote.mutate(
      { title: "Untitled note" },
      { onSuccess: (note) => setSelectedId(note.id) },
    );
  }

  if (isLoading || !notes) {
    return <p className="text-sm text-muted-foreground">Loading notes...</p>;
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden rounded-lg border">
      {/* Mobile: only one pane at a time - list until a note is picked,
          then a full-width editor with its own back button. Desktop
          (md+): both panes side by side, as before. */}
      <div className={cn("min-h-0", selectedNote && "hidden md:flex")}>
        <NoteList
          notes={notes}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onCreate={handleCreate}
          isCreating={createNote.isPending}
        />
      </div>

      {selectedNote ? (
        <div className="flex min-h-0 w-full flex-1 flex-col">
          <div className="border-b p-2 md:hidden">
            <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
              <ArrowLeft className="size-4" />
              Back to notes
            </Button>
          </div>
          <NoteEditorPanel key={selectedNote.id} note={selectedNote} onDeleted={() => setSelectedId(null)} />
        </div>
      ) : (
        <div className="hidden flex-1 flex-col items-center justify-center gap-2 text-muted-foreground md:flex">
          <NotebookText className="size-8" />
          <p className="text-sm">Select a note or create one to get started.</p>
        </div>
      )}
    </div>
  );
}
