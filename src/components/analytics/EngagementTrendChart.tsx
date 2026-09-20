"use client";

import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ENGAGEMENT_CHART_COLORS } from "@/lib/chart-colors";
import { ChartTooltip, chartAxisTick, chartLegendStyle } from "./ChartTooltip";

interface EngagementPoint {
  week: string;
  created: number;
  completed: number;
}

export function EngagementTrendChart({ trend }: { trend: EngagementPoint[] }) {
  const data = trend.map((t) => ({
    week: new Date(t.week).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    Created: t.created,
    Completed: t.completed,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Created vs. completed tasks</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Not enough data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
              <XAxis dataKey="week" tick={chartAxisTick} />
              <YAxis allowDecimals={false} tick={chartAxisTick} width={30} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={chartLegendStyle} />
              <Area
                type="monotone"
                dataKey="Created"
                stroke={ENGAGEMENT_CHART_COLORS.created}
                fill={ENGAGEMENT_CHART_COLORS.created}
                fillOpacity={0.15}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="Completed"
                stroke={ENGAGEMENT_CHART_COLORS.completed}
                fill={ENGAGEMENT_CHART_COLORS.completed}
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
