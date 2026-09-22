"use client";

import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUpcomingMemories } from "@/hooks/useMemories";

export function UpcomingMemoriesCard() {
  const { data, isLoading } = useUpcomingMemories(5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <CalendarClock className="size-4" />
          Upcoming memories
        </CardTitle>
        <Link href="/memories" className="text-xs text-primary hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing coming up.</p>
        ) : (
          <ul className="space-y-2">
            {data.map((memory) => (
              <li key={memory.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{memory.name}</span>
                <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                  {memory.category ? <Badge variant="secondary">{memory.category}</Badge> : null}
                  {memory.rememberDate ? new Date(memory.rememberDate).toLocaleDateString() : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
