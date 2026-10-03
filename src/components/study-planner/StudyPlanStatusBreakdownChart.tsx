"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STUDY_PLAN_STATUS_CHART_COLORS } from "@/lib/chart-colors";
import { ChartTooltip, chartLegendStyle } from "@/components/analytics/ChartTooltip";
import type { StudyPlanEntryStatus } from "@/models/StudyPlanEntry";

// Hardcoded rather than imported from the model file - that file pulls in
// mongoose, which must never end up in a client bundle (see STATUS_COLUMNS
// in src/lib/constants.ts for the same pattern with Task statuses).
const STATUS_ORDER: StudyPlanEntryStatus[] = ["Pending", "Completed", "Paused", "Skipped"];

export function StudyPlanStatusBreakdownChart({
  statusBreakdown,
}: {
  statusBreakdown: Record<StudyPlanEntryStatus, number>;
}) {
  const data = STATUS_ORDER.map((status) => ({
    name: status,
    status,
    value: statusBreakdown[status] ?? 0,
  })).filter((d) => d.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Days by status</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Not enough data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {data.map((entry) => (
                  <Cell key={entry.status} fill={STUDY_PLAN_STATUS_CHART_COLORS[entry.status]} />
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
