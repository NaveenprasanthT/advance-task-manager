"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { TaskPriority } from "@/models/Task";
import type { MemoryFiltersState } from "@/hooks/useMemories";

interface MemoryFiltersProps {
  filters: MemoryFiltersState;
  onChange: (next: MemoryFiltersState) => void;
}

export function MemoryFilters({ filters, onChange }: MemoryFiltersProps) {
  const isActive =
    filters.search.trim().length > 0 ||
    filters.category.trim().length > 0 ||
    filters.priority.length > 0 ||
    filters.scope !== "all";

  function update(patch: Partial<MemoryFiltersState>) {
    onChange({ ...filters, ...patch });
  }

  function clearAll() {
    onChange({ search: "", category: "", priority: [], scope: "all" });
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="relative w-56">
        <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search memories..."
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
          className="pl-7"
        />
      </div>

      <Input
        placeholder="Category..."
        value={filters.category}
        onChange={(e) => update({ category: e.target.value })}
        className="w-40"
      />

      <ToggleGroup
        value={filters.priority}
        onValueChange={(v) => update({ priority: v as TaskPriority[] })}
        multiple
        size="sm"
      >
        <ToggleGroupItem value="High">High</ToggleGroupItem>
        <ToggleGroupItem value="Medium">Medium</ToggleGroupItem>
        <ToggleGroupItem value="Low">Low</ToggleGroupItem>
      </ToggleGroup>

      <ToggleGroup
        value={[filters.scope]}
        onValueChange={(v) => update({ scope: (v[0] as MemoryFiltersState["scope"]) ?? "all" })}
        size="sm"
      >
        <ToggleGroupItem value="all">All</ToggleGroupItem>
        <ToggleGroupItem value="upcoming">Upcoming</ToggleGroupItem>
        <ToggleGroupItem value="past">Past</ToggleGroupItem>
      </ToggleGroup>

      {isActive ? (
        <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
          <X className="size-3.5" />
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
