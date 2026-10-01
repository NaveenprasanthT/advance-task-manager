"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_CHART_COLORS } from "@/lib/chart-colors";
import { ChartTooltip, chartAxisTick } from "@/components/analytics/ChartTooltip";
import type { RecurringDailyTrendPoint } from "@/hooks/useRecurringTasks";

export function RecurringAdherenceTrendChart({ trend }: { trend: RecurringDailyTrendPoint[] }) {
  const data = trend
    .filter((t) => t.totalDue > 0)
    .map((t) => ({
      date: new Date(`${t.date}T00:00:00.000Z`).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      adherenceRate: Math.round((t.totalDone / t.totalDue) * 100),
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Routine adherence trend</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Not enough data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
              <XAxis dataKey="date" tick={chartAxisTick} />
              <YAxis domain={[0, 100]} tick={chartAxisTick} width={36} />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="adherenceRate"
                name="Adherence %"
                stroke={STATUS_CHART_COLORS.Done}
                fill={STATUS_CHART_COLORS.Done}
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
