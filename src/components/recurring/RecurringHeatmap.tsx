"use client";

import { useMemo } from "react";
import { useRecurringTaskLog, useToggleRecurringLogDay, type RecurringLogStatus } from "@/hooks/useRecurringTasks";

const WEEKDAY_ROW_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

type CellState = "done" | "missed" | "pending-today" | "not-due" | "before-start" | "outside-window";

interface Cell {
  date: string; // "YYYY-MM-DD"
  state: CellState;
  clickable: boolean;
}

const CELL_CLASS: Record<CellState, string> = {
  done: "bg-emerald-500 hover:bg-emerald-600",
  missed: "bg-red-400 hover:bg-red-500",
  "pending-today": "bg-amber-100 ring-2 ring-inset ring-amber-400 dark:bg-amber-950",
  "not-due": "bg-muted",
  "before-start": "bg-transparent opacity-30",
  "outside-window": "bg-transparent",
};

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function RecurringHeatmap({ templateId, startDate, days = 90 }: { templateId: string; startDate: string; days?: number }) {
  const { data, isLoading } = useRecurringTaskLog(templateId, days);
  const toggle = useToggleRecurringLogDay(templateId);

  const weeks = useMemo(() => {
    if (!data) return [];

    const statusByDate = new Map(data.entries.map((e) => [e.date, e.status]));
    const dueDates = new Set(data.dueDates);
    const today = toISODate(new Date());
    const templateStart = startDate.slice(0, 10);

    const toDate = new Date(`${data.to}T00:00:00.000Z`);
    const fromDate = new Date(`${data.from}T00:00:00.000Z`);
    // Align the grid to a Sunday so weekday rows line up across columns.
    const gridStart = new Date(fromDate);
    gridStart.setUTCDate(gridStart.getUTCDate() - gridStart.getUTCDay());

    const cells: Cell[] = [];
    for (let d = new Date(gridStart); d <= toDate; d.setUTCDate(d.getUTCDate() + 1)) {
      const iso = toISODate(d);
      let state: CellState;
      if (iso < data.from || iso > data.to) {
        state = "outside-window";
      } else if (iso < templateStart) {
        state = "before-start";
      } else if (statusByDate.get(iso) === "done") {
        state = "done";
      } else if (statusByDate.get(iso) === "missed") {
        state = "missed";
      } else if (iso === today && dueDates.has(iso)) {
        state = "pending-today";
      } else {
        state = "not-due";
      }
      const clickable = iso <= today && iso >= templateStart && dueDates.has(iso);
      cells.push({ date: iso, state, clickable });
    }

    const grouped: Cell[][] = [];
    for (let i = 0; i < cells.length; i += 7) grouped.push(cells.slice(i, i + 7));
    return grouped;
  }, [data, startDate]);

  function handleClick(cell: Cell) {
    if (!cell.clickable) return;
    const next: RecurringLogStatus = cell.state === "done" ? "missed" : "done";
    toggle.mutate({ date: cell.date, status: next });
  }

  if (isLoading || !data) {
    return <p className="text-sm text-muted-foreground">Loading history...</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1 overflow-x-auto pb-1">
        <div className="flex flex-col gap-1 pt-0 text-[10px] text-muted-foreground">
          {WEEKDAY_ROW_LABELS.map((label, i) => (
            <div key={i} className="flex h-3 w-6 items-center">
              {label}
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((cell) => (
              <button
                key={cell.date}
                type="button"
                title={`${cell.date} - ${cell.state === "pending-today" ? "due today, not yet marked" : cell.state}`}
                disabled={!cell.clickable || toggle.isPending}
                onClick={() => handleClick(cell)}
                className={`size-3 rounded-sm ${CELL_CLASS[cell.state]} ${
                  cell.clickable ? "cursor-pointer" : "cursor-default"
                }`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="size-3 rounded-sm bg-emerald-500" /> Done
        </span>
        <span className="flex items-center gap-1">
          <span className="size-3 rounded-sm bg-red-400" /> Missed
        </span>
        <span className="flex items-center gap-1">
          <span className="size-3 rounded-sm bg-amber-100 ring-2 ring-inset ring-amber-400 dark:bg-amber-950" /> Today
        </span>
        <span className="flex items-center gap-1">
          <span className="size-3 rounded-sm bg-muted" /> Not due
        </span>
      </div>
    </div>
  );
}
