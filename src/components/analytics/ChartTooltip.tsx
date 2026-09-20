import type { TooltipContentProps } from "recharts/types/component/Tooltip";

export function ChartTooltip({ active, payload, label }: Partial<TooltipContentProps<number, string>>) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
      {label ? <p className="mb-1 font-medium">{label}</p> : null}
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center gap-2" style={{ color: entry.color }}>
          <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-foreground">
            {entry.name}: {entry.value}
          </span>
        </p>
      ))}
    </div>
  );
}

export const chartAxisTick = { fontSize: 12, fill: "var(--muted-foreground)" };
export const chartLegendStyle = { color: "var(--foreground)", fontSize: 13 };
