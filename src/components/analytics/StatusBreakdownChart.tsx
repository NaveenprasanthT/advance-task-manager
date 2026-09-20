"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_COLUMNS } from "@/lib/constants";
import { STATUS_CHART_COLORS } from "@/lib/chart-colors";
import { ChartTooltip, chartLegendStyle } from "./ChartTooltip";

export function StatusBreakdownChart({ statusCounts }: { statusCounts: Record<string, number> }) {
  const data = STATUS_COLUMNS.map(({ status, label }) => ({
    name: label,
    status,
    value: statusCounts[status] ?? 0,
  })).filter((d) => d.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tasks by status</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {data.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_CHART_COLORS[entry.status as never]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={chartLegendStyle} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
