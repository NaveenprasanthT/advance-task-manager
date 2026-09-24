"use client";

import { useState } from "react";
import { NotebookText } from "lucide-react";
import { NoteList } from "@/components/notes/NoteList";
import { NoteEditorPanel } from "@/components/notes/NoteEditorPanel";
import { useNotesQuery, useCreateNote } from "@/hooks/useNotes";

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
      <NoteList
        notes={notes}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={handleCreate}
        isCreating={createNote.isPending}
      />
      {selectedNote ? (
        <NoteEditorPanel key={selectedNote.id} note={selectedNote} onDeleted={() => setSelectedId(null)} />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
          <NotebookText className="size-8" />
          <p className="text-sm">Select a note or create one to get started.</p>
        </div>
      )}
    </div>
  );
}
