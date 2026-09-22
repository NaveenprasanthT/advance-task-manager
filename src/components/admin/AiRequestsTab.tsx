"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CRON_STATUS_COLORS } from "@/lib/constants";
import { AiRequestLogFilters } from "@/components/admin/AiRequestLogFilters";
import {
  useAiRequestLogs,
  DEFAULT_AI_REQUEST_LOG_FILTERS,
  type AiRequestLogFiltersState,
} from "@/hooks/useAiRequestLogs";

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function AiRequestsTab() {
  const [filters, setFilters] = useState<AiRequestLogFiltersState>(DEFAULT_AI_REQUEST_LOG_FILTERS);
  const { data, isLoading } = useAiRequestLogs(filters);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-6">
      <AiRequestLogFilters filters={filters} onChange={setFilters} />

      {isLoading || !data ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : data.logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No AI requests match these filters.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Started</TableHead>
                <TableHead>Feature</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Error</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.createdAt ? new Date(log.createdAt).toLocaleString() : "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{log.feature}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{log.userEmail ?? "—"}</TableCell>
                  <TableCell>
                    <Badge className={CRON_STATUS_COLORS[log.status]} variant="secondary">
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{log.stage ?? "—"}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground" title={log.errorMessage ?? ""}>
                    {log.errorMessage ?? "—"}
                  </TableCell>
                  <TableCell>{formatDuration(log.durationMs)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Page {data.page} of {totalPages} ({data.total} request{data.total === 1 ? "" : "s"})
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={filters.page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={filters.page >= totalPages}
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
