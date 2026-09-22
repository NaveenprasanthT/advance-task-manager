"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CRON_STATUS_COLORS } from "@/lib/constants";
import { CronLogFilters } from "@/components/admin/CronLogFilters";
import { CronLogDetailSheet } from "@/components/admin/CronLogDetailSheet";
import { useCronLogs, DEFAULT_CRON_LOG_FILTERS, type CronLogFiltersState } from "@/hooks/useCronLogs";

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function CronRunsTab() {
  const [filters, setFilters] = useState<CronLogFiltersState>(DEFAULT_CRON_LOG_FILTERS);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const { data, isLoading } = useCronLogs(filters);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-6">
      <CronLogFilters filters={filters} onChange={setFilters} />

      {isLoading || !data ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : data.logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No cron runs match these filters.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Started</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Entries</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.logs.map((log) => (
                <TableRow key={log.id} className="cursor-pointer" onClick={() => setSelectedLogId(log.id)}>
                  <TableCell>{new Date(log.startedAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{log.trigger === "manual_retry" ? "Manual retry" : "Scheduled"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={CRON_STATUS_COLORS[log.status]} variant="secondary">
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.usersConsidered}</TableCell>
                  <TableCell className="space-x-1">
                    {log.entryStatusCounts.success > 0 ? (
                      <Badge className={CRON_STATUS_COLORS.success} variant="secondary">
                        {log.entryStatusCounts.success} ok
                      </Badge>
                    ) : null}
                    {log.entryStatusCounts.partial > 0 ? (
                      <Badge className={CRON_STATUS_COLORS.partial} variant="secondary">
                        {log.entryStatusCounts.partial} partial
                      </Badge>
                    ) : null}
                    {log.entryStatusCounts.failure > 0 ? (
                      <Badge className={CRON_STATUS_COLORS.failure} variant="secondary">
                        {log.entryStatusCounts.failure} failed
                      </Badge>
                    ) : null}
                    {log.entryStatusCounts.skipped > 0 ? (
                      <Badge className={CRON_STATUS_COLORS.skipped} variant="secondary">
                        {log.entryStatusCounts.skipped} skipped
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>{formatDuration(log.durationMs)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Page {data.page} of {totalPages} ({data.total} run{data.total === 1 ? "" : "s"})
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

      <CronLogDetailSheet logId={selectedLogId} onClose={() => setSelectedLogId(null)} />
    </div>
  );
}
