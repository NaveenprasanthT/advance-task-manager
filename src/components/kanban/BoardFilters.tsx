"use client";

import { Repeat, Search, Sparkles, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { TaskOrigin, TaskPriority } from "@/models/Task";

export interface BoardFiltersState {
  priorityFilter: TaskPriority[];
  originFilter: "all" | TaskOrigin;
  overdueOnly: boolean;
  search: string;
}

interface BoardFiltersProps extends BoardFiltersState {
  onPriorityFilterChange: (v: TaskPriority[]) => void;
  onOriginFilterChange: (v: "all" | TaskOrigin) => void;
  onOverdueOnlyChange: (v: boolean) => void;
  onSearchChange: (v: string) => void;
}

export function BoardFilters({
  priorityFilter,
  originFilter,
  overdueOnly,
  search,
  onPriorityFilterChange,
  onOriginFilterChange,
  onOverdueOnlyChange,
  onSearchChange,
}: BoardFiltersProps) {
  const isActive = priorityFilter.length > 0 || originFilter !== "all" || overdueOnly || search.trim().length > 0;

  function clearAll() {
    onPriorityFilterChange([]);
    onOriginFilterChange("all");
    onOverdueOnlyChange(false);
    onSearchChange("");
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="relative w-48">
        <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search title..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-7"
        />
      </div>

      <ToggleGroup
        value={priorityFilter}
        onValueChange={(v) => onPriorityFilterChange(v as TaskPriority[])}
        multiple
        size="sm"
      >
        <ToggleGroupItem value="High">High</ToggleGroupItem>
        <ToggleGroupItem value="Medium">Medium</ToggleGroupItem>
        <ToggleGroupItem value="Low">Low</ToggleGroupItem>
      </ToggleGroup>

      <ToggleGroup
        value={[originFilter]}
        onValueChange={(v) => onOriginFilterChange(((v[0] as "all" | TaskOrigin) ?? "all"))}
        size="sm"
      >
        <ToggleGroupItem value="all">All</ToggleGroupItem>
        <ToggleGroupItem value="manual">Manual</ToggleGroupItem>
        <ToggleGroupItem value="auto">
          <Sparkles className="size-3" />
          Auto
        </ToggleGroupItem>
        <ToggleGroupItem value="recurring">
          <Repeat className="size-3" />
          Recurring
        </ToggleGroupItem>
      </ToggleGroup>

      <div className="flex items-center gap-2">
        <Switch checked={overdueOnly} onCheckedChange={onOverdueOnlyChange} id="overdue-only" />
        <Label htmlFor="overdue-only" className="text-sm font-normal text-muted-foreground">
          Overdue only
        </Label>
      </div>

      {isActive ? (
        <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
          <X className="size-3.5" />
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
