"use client";

import { useState } from "react";
import { Repeat, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
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
  // Priority/origin/overdue only take real screen real estate on mobile,
  // where each one wraps onto its own full-width row (4 extra rows before
  // any tasks are visible). Collapsed behind a toggle there; on sm+ there's
  // room for everything on one wrapped row, same as before this existed.
  const [expanded, setExpanded] = useState(false);
  const activeFilterCount = priorityFilter.length + (originFilter !== "all" ? 1 : 0) + (overdueOnly ? 1 : 0);
  const isActive = activeFilterCount > 0 || search.trim().length > 0;

  function clearAll() {
    onPriorityFilterChange([]);
    onOriginFilterChange("all");
    onOverdueOnlyChange(false);
    onSearchChange("");
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="relative w-full sm:w-48">
        <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search title..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-7"
        />
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="sm:hidden"
        onClick={() => setExpanded((v) => !v)}
      >
        <SlidersHorizontal className="size-3.5" />
        Filters
        {activeFilterCount > 0 ? (
          <Badge variant="secondary" className="px-1.5">
            {activeFilterCount}
          </Badge>
        ) : null}
      </Button>

      <ToggleGroup
        value={priorityFilter}
        onValueChange={(v) => onPriorityFilterChange(v as TaskPriority[])}
        multiple
        size="sm"
        className={cn(expanded ? "flex" : "hidden", "sm:flex")}
      >
        <ToggleGroupItem value="High">High</ToggleGroupItem>
        <ToggleGroupItem value="Medium">Medium</ToggleGroupItem>
        <ToggleGroupItem value="Low">Low</ToggleGroupItem>
      </ToggleGroup>

      <ToggleGroup
        value={[originFilter]}
        onValueChange={(v) => onOriginFilterChange(((v[0] as "all" | TaskOrigin) ?? "all"))}
        size="sm"
        className={cn(expanded ? "flex" : "hidden", "sm:flex")}
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

      <div className={cn("items-center gap-2", expanded ? "flex" : "hidden", "sm:flex")}>
        <Switch checked={overdueOnly} onCheckedChange={onOverdueOnlyChange} id="overdue-only" />
        <Label htmlFor="overdue-only" className="text-sm font-normal text-muted-foreground">
          Overdue only
        </Label>
      </div>

      {isActive ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className={cn(expanded ? "inline-flex" : "hidden", "sm:inline-flex")}
        >
          <X className="size-3.5" />
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
