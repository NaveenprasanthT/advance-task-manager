"use client";

import { CalendarDays, Paperclip } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PRIORITY_COLORS } from "@/lib/constants";
import type { MemoryDTO } from "@/types/memory";

export function MemoryCard({ memory, onClick }: { memory: MemoryDTO; onClick: () => void }) {
  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={onClick}>
      <CardHeader>
        <CardTitle className="flex items-start justify-between gap-2">
          <span className="line-clamp-2">{memory.name}</span>
          <Badge className={PRIORITY_COLORS[memory.priority]} variant="secondary">
            {memory.priority}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {memory.description ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{memory.description}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {memory.category ? (
            <Badge variant="secondary" className="font-normal">
              {memory.category}
            </Badge>
          ) : null}
          {memory.rememberDate ? (
            <span className="flex items-center gap-1">
              <CalendarDays className="size-3.5" />
              {new Date(memory.rememberDate).toLocaleDateString()}
            </span>
          ) : null}
          {memory.files.length > 0 ? (
            <span className="flex items-center gap-1">
              <Paperclip className="size-3.5" />
              {memory.files.length}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
