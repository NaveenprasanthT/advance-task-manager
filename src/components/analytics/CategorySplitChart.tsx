"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORY_CHART_COLORS } from "@/lib/chart-colors";
import type { TaskCategory } from "@/models/Task";
import { ChartTooltip, chartLegendStyle } from "./ChartTooltip";

export function CategorySplitChart({ categoryCounts }: { categoryCounts: Record<string, number> }) {
  const categories: TaskCategory[] = ["Personal", "Professional"];
  const data = categories.map((category) => ({ name: category, value: categoryCounts[category] ?? 0 })).filter(
    (d) => d.value > 0,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Personal vs. professional</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {data.map((entry) => (
                  <Cell key={entry.name} fill={CATEGORY_CHART_COLORS[entry.name as TaskCategory]} />
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
