"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEQUENTIAL_CHART_COLOR } from "@/lib/chart-colors";
import { ChartTooltip, chartAxisTick } from "./ChartTooltip";

interface LeaderboardEntry {
  name: string;
  completed: number;
}

export function LeaderboardChart({ leaderboard }: { leaderboard: LeaderboardEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top users by completed tasks</CardTitle>
      </CardHeader>
      <CardContent>
        {leaderboard.length === 0 ? (
          <p className="text-sm text-muted-foreground">No completed tasks yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={leaderboard} layout="vertical" margin={{ left: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
              <XAxis type="number" allowDecimals={false} tick={chartAxisTick} />
              <YAxis type="category" dataKey="name" width={100} tick={chartAxisTick} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="completed" fill={SEQUENTIAL_CHART_COLOR} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
