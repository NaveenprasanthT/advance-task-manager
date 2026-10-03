"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_CHART_COLORS } from "@/lib/chart-colors";
import { ChartTooltip, chartAxisTick } from "@/components/analytics/ChartTooltip";
import type { StudyPlanAnalytics } from "@/hooks/useStudyPlans";

export function StudyPlanActivityTrendChart({ trend }: { trend: StudyPlanAnalytics["dailyTrend"] }) {
  const data = trend.map((t) => ({
    date: new Date(`${t.date}T00:00:00.000Z`).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    completedCount: t.completedCount,
  }));
  const hasActivity = data.some((d) => d.completedCount > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Study activity</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasActivity ? (
          <p className="text-sm text-muted-foreground">Not enough data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
              <XAxis dataKey="date" tick={chartAxisTick} />
              <YAxis allowDecimals={false} tick={chartAxisTick} width={30} />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="completedCount"
                name="Days completed"
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
