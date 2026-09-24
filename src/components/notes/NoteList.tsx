"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NoteDTO } from "@/types/note";

function stripHtml(html: string | null): string {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function NoteList({
  notes,
  selectedId,
  onSelect,
  onCreate,
  isCreating,
}: {
  notes: NoteDTO[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  isCreating: boolean;
}) {
  const [search, setSearch] = useState("");

  const filtered = notes.filter((n) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return n.title.toLowerCase().includes(query) || stripHtml(n.description).toLowerCase().includes(query);
  });

  return (
    <div className="flex h-full w-72 shrink-0 flex-col border-r">
      <div className="space-y-2 border-b p-3">
        <Button size="sm" className="w-full" onClick={onCreate} disabled={isCreating}>
          <Plus className="size-4" />
          New note
        </Button>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-7"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">No notes found.</p>
        ) : (
          filtered.map((note) => (
            <button
              key={note.id}
              type="button"
              onClick={() => onSelect(note.id)}
              className={cn(
                "block w-full border-b p-3 text-left transition-colors hover:bg-muted",
                selectedId === note.id && "bg-muted",
              )}
            >
              <p className="truncate text-sm font-medium">{note.title}</p>
              {note.date ? (
                <p className="text-xs text-muted-foreground">{new Date(note.date).toLocaleDateString()}</p>
              ) : null}
              <p className="line-clamp-2 text-xs text-muted-foreground">{stripHtml(note.description) || "No content"}</p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
