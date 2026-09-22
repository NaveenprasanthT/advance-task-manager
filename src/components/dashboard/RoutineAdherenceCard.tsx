"use client";

import Link from "next/link";
import { Flame, Repeat } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRecurringAnalytics } from "@/hooks/useRecurringTasks";

export function RoutineAdherenceCard() {
  const { data, isLoading } = useRecurringAnalytics();

  if (!isLoading && (!data || data.templates.length === 0)) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <Repeat className="size-4" />
          Routine adherence
        </CardTitle>
        <Link href="/recurring" className="text-xs text-primary hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <div className="space-y-3">
            <div className="text-2xl font-semibold">
              {data.overall.adherenceRate === null ? "—" : `${data.overall.adherenceRate}%`}
              <span className="ml-1 text-sm font-normal text-muted-foreground">last 30 days</span>
            </div>
            <ul className="space-y-1.5">
              {data.templates.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{t.title}</span>
                  <span className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                    <span>{t.adherenceRate === null ? "—" : `${t.adherenceRate}%`}</span>
                    <span className="flex items-center gap-1">
                      <Flame className="size-3.5 text-orange-500" />
                      {t.currentStreak}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
