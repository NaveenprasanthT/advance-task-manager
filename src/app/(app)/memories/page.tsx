"use client";

import { useState } from "react";
import { NewMemoryDialog } from "@/components/memory/NewMemoryDialog";
import { MemoryFilters } from "@/components/memory/MemoryFilters";
import { MemoryCard } from "@/components/memory/MemoryCard";
import { MemoryDetailSheet } from "@/components/memory/MemoryDetailSheet";
import { useMemoriesQuery, DEFAULT_MEMORY_FILTERS, type MemoryFiltersState } from "@/hooks/useMemories";

export default function MemoriesPage() {
  const [filters, setFilters] = useState<MemoryFiltersState>(DEFAULT_MEMORY_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data, isLoading } = useMemoriesQuery(filters);

  const selectedMemory = data?.find((m) => m.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Memory</h1>
          <p className="text-sm text-muted-foreground">Things worth remembering - past or future - with files attached.</p>
        </div>
        <NewMemoryDialog />
      </div>

      <MemoryFilters filters={filters} onChange={setFilters} />

      {isLoading || !data ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No memories match these filters.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((memory) => (
            <MemoryCard key={memory.id} memory={memory} onClick={() => setSelectedId(memory.id)} />
          ))}
        </div>
      )}

      <MemoryDetailSheet memory={selectedMemory} onClose={() => setSelectedId(null)} />
    </div>
  );
}
