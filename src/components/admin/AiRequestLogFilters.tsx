"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DatePicker } from "@/components/ui/date-picker";
import type { AiRequestStatus } from "@/models/AiRequestLog";
import type { AiRequestLogFiltersState } from "@/hooks/useAiRequestLogs";

interface AiRequestLogFiltersProps {
  filters: AiRequestLogFiltersState;
  onChange: (next: AiRequestLogFiltersState) => void;
}

export function AiRequestLogFilters({ filters, onChange }: AiRequestLogFiltersProps) {
  const isActive =
    filters.status.length > 0 || filters.userEmail.trim().length > 0 || Boolean(filters.from) || Boolean(filters.to);

  function update(patch: Partial<AiRequestLogFiltersState>) {
    onChange({ ...filters, ...patch, page: 1 });
  }

  function clearAll() {
    onChange({ status: [], userEmail: "", from: undefined, to: undefined, page: 1 });
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="relative w-56">
        <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search user email..."
          value={filters.userEmail}
          onChange={(e) => update({ userEmail: e.target.value })}
          className="pl-7"
        />
      </div>

      <ToggleGroup
        value={filters.status}
        onValueChange={(v) => update({ status: v as AiRequestStatus[] })}
        multiple
        size="sm"
      >
        <ToggleGroupItem value="success">Success</ToggleGroupItem>
        <ToggleGroupItem value="failure">Failure</ToggleGroupItem>
      </ToggleGroup>

      <div className="w-36">
        <DatePicker value={filters.from} onChange={(v) => update({ from: v })} placeholder="From" />
      </div>
      <div className="w-36">
        <DatePicker value={filters.to} onChange={(v) => update({ to: v })} placeholder="To" />
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
