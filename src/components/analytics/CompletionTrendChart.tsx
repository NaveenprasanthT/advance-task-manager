"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEQUENTIAL_CHART_COLOR } from "@/lib/chart-colors";
import { ChartTooltip, chartAxisTick } from "./ChartTooltip";

interface TrendPoint {
  week: string;
  completed: number;
}

export function CompletionTrendChart({ trend, title = "Completion trend" }: { trend: TrendPoint[]; title?: string }) {
  const data = trend.map((t) => ({
    week: new Date(t.week).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    completed: t.completed,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Not enough data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
              <XAxis dataKey="week" tick={chartAxisTick} />
              <YAxis allowDecimals={false} tick={chartAxisTick} width={30} />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="completed"
                stroke={SEQUENTIAL_CHART_COLOR}
                fill={SEQUENTIAL_CHART_COLOR}
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
