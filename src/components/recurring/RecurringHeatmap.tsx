"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent, PopoverHeader, PopoverTitle } from "@/components/ui/popover";
import { RecurringMissedReasonDialog } from "@/components/recurring/RecurringMissedReasonDialog";
import { useRecurringTaskLog, useToggleRecurringLogDay } from "@/hooks/useRecurringTasks";

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

function formatDateLong(iso: string): string {
  return new Date(`${iso}T00:00:00.000Z`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function RecurringHeatmap({
  templateId,
  startDate,
  days = 90,
}: {
  templateId: string;
  startDate: string;
  days?: number;
}) {
  const { data, isLoading } = useRecurringTaskLog(templateId, days);
  const toggle = useToggleRecurringLogDay(templateId);
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [pendingMissed, setPendingMissed] = useState<{ date: string; existingNote: string } | null>(null);

  const today = toISODate(new Date());

  const noteByDate = useMemo(
    () => new Map((data?.entries ?? []).map((e) => [e.date, e.note ?? ""])),
    [data],
  );

  const weeks = useMemo(() => {
    if (!data) return [];

    const statusByDate = new Map(data.entries.map((e) => [e.date, e.status]));
    const dueDates = new Set(data.dueDates);
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
  }, [data, startDate, today]);

  const todayDue = Boolean(data?.dueDates.includes(today));
  const todayStatus = data?.entries.find((e) => e.date === today)?.status ?? null;
  const todayNote = noteByDate.get(today) ?? "";

  function markDone(date: string) {
    toggle.mutate({ date, status: "done" });
  }

  function requestMissed(date: string) {
    setOpenDate(null);
    setPendingMissed({ date, existingNote: noteByDate.get(date) ?? "" });
  }

  function confirmMissed(reason: string) {
    if (!pendingMissed) return;
    toggle.mutate(
      { date: pendingMissed.date, status: "missed", note: reason },
      { onSettled: () => setPendingMissed(null) },
    );
  }

  if (isLoading || !data) {
    return <p className="text-sm text-muted-foreground">Loading history...</p>;
  }

  return (
    <div className="space-y-4">
      {todayDue ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Today</span>
              <Badge variant="secondary">
                {todayStatus === "done" ? "Done" : todayStatus === "missed" ? "Missed" : "Not marked yet"}
              </Badge>
            </div>
            {todayStatus === "missed" && todayNote ? (
              <p className="text-xs text-muted-foreground">{todayNote}</p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={todayStatus === "done" ? "default" : "outline"}
              disabled={toggle.isPending}
              onClick={() => markDone(today)}
            >
              <CheckCircle2 className="size-3.5" />
              Mark Done
            </Button>
            <Button
              type="button"
              size="sm"
              variant={todayStatus === "missed" ? "default" : "outline"}
              disabled={toggle.isPending}
              onClick={() => requestMissed(today)}
            >
              <XCircle className="size-3.5" />
              Mark Missed
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Not due today.</p>
      )}

      <div className="space-y-2">
        <div className="flex gap-1 overflow-x-auto pb-1">
          <div className="flex flex-col gap-1 pt-0 text-[10px] text-muted-foreground">
            {WEEKDAY_ROW_LABELS.map((label, i) => (
              <div key={i} className="flex h-4 w-6 items-center">
                {label}
              </div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((cell) =>
                cell.clickable ? (
                  <Popover
                    key={cell.date}
                    open={openDate === cell.date}
                    onOpenChange={(next) => setOpenDate(next ? cell.date : null)}
                  >
                    <PopoverTrigger
                      className={`size-4 rounded-sm hover:ring-2 hover:ring-primary/40 ${CELL_CLASS[cell.state]}`}
                    />
                    <PopoverContent className="w-56">
                      <PopoverHeader>
                        <PopoverTitle>{formatDateLong(cell.date)}</PopoverTitle>
                      </PopoverHeader>
                      <Badge variant="secondary" className="w-fit">
                        {cell.state === "done" ? "Done" : cell.state === "missed" ? "Missed" : "Not marked yet"}
                      </Badge>
                      {cell.state === "missed" && noteByDate.get(cell.date) ? (
                        <p className="text-xs text-muted-foreground">{noteByDate.get(cell.date)}</p>
                      ) : null}
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          className="flex-1"
                          variant={cell.state === "done" ? "default" : "outline"}
                          disabled={toggle.isPending}
                          onClick={() => markDone(cell.date)}
                        >
                          <CheckCircle2 className="size-3.5" />
                          Done
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="flex-1"
                          variant={cell.state === "missed" ? "default" : "outline"}
                          disabled={toggle.isPending}
                          onClick={() => requestMissed(cell.date)}
                        >
                          <XCircle className="size-3.5" />
                          Missed
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <span key={cell.date} className={`size-4 rounded-sm ${CELL_CLASS[cell.state]}`} />
                ),
              )}
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
            <span className="size-3 rounded-sm bg-amber-100 ring-2 ring-inset ring-amber-400 dark:bg-amber-950" /> Due
            today
          </span>
          <span className="flex items-center gap-1">
            <span className="size-3 rounded-sm bg-muted" /> Not due
          </span>
        </div>
        <p className="text-xs text-muted-foreground">Tap a day to update it.</p>
      </div>

      <RecurringMissedReasonDialog
        key={pendingMissed?.date ?? "none"}
        open={Boolean(pendingMissed)}
        existingNote={pendingMissed?.existingNote ?? ""}
        onCancel={() => setPendingMissed(null)}
        onConfirm={confirmMissed}
      />
    </div>
  );
}
