"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_CHART_COLORS } from "@/lib/chart-colors";
import { ChartTooltip, chartAxisTick } from "@/components/analytics/ChartTooltip";
import type { RecurringTemplateStats } from "@/hooks/useRecurringTasks";

export function RecurringTemplateAdherenceChart({ templates }: { templates: RecurringTemplateStats[] }) {
  const data = templates
    .filter((t) => t.totalDue > 0)
    .map((t) => ({ name: t.title, adherenceRate: t.adherenceRate ?? 0 }))
    .sort((a, b) => b.adherenceRate - a.adherenceRate);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Adherence by routine</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Not enough data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(160, data.length * 36)}>
            <BarChart data={data} layout="vertical" margin={{ left: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
              <XAxis type="number" domain={[0, 100]} tick={chartAxisTick} />
              <YAxis type="category" dataKey="name" width={110} tick={chartAxisTick} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="adherenceRate" name="Adherence %" fill={STATUS_CHART_COLORS.Done} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
