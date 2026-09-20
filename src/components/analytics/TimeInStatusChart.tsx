"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_COLUMNS } from "@/lib/constants";
import { STATUS_CHART_COLORS } from "@/lib/chart-colors";
import { ChartTooltip, chartAxisTick } from "./ChartTooltip";

export function TimeInStatusChart({ avgDays }: { avgDays: Record<string, number> }) {
  const data = STATUS_COLUMNS.map(({ status, label }) => ({
    status,
    name: label,
    days: avgDays[status] ?? 0,
  })).filter((d) => d.days > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Average time in status (days)</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Not enough data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data} layout="vertical" margin={{ left: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
              <XAxis type="number" tick={chartAxisTick} />
              <YAxis type="category" dataKey="name" width={90} tick={chartAxisTick} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="days" radius={[0, 4, 4, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_CHART_COLORS[entry.status as never]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
