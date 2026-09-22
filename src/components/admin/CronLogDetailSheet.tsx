"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { CRON_STATUS_COLORS } from "@/lib/constants";
import { useCronLogDetail, useRetryCronLogEntry } from "@/hooks/useCronLogs";

interface CronLogDetailSheetProps {
  logId: string | null;
  onClose: () => void;
}

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function CronLogDetailSheet({ logId, onClose }: CronLogDetailSheetProps) {
  const { data: log, isLoading } = useCronLogDetail(logId);
  const retry = useRetryCronLogEntry();

  return (
    <Sheet open={Boolean(logId)} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="w-full max-w-lg overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Cron run detail
            {log ? (
              <Badge className={CRON_STATUS_COLORS[log.status]} variant="secondary">
                {log.status}
              </Badge>
            ) : null}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-6">
          {isLoading || !log ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Trigger: </span>
                  {log.trigger === "manual_retry" ? "Manual retry" : "Scheduled"}
                </div>
                <div>
                  <span className="text-muted-foreground">Users considered: </span>
                  {log.usersConsidered}
                </div>
                <div>
                  <span className="text-muted-foreground">Started: </span>
                  {new Date(log.startedAt).toLocaleString()}
                </div>
                <div>
                  <span className="text-muted-foreground">Duration: </span>
                  {formatDuration(log.durationMs)}
                </div>
              </div>

              <div className="space-y-3">
                {log.entries.map((entry) => (
                  <div key={entry.id} className="space-y-2 rounded-md border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium">
                        {entry.type === "user_category"
                          ? `${entry.userEmail ?? entry.userName ?? "Unknown user"} — ${entry.category}`
                          : entry.type === "unauthorized"
                            ? "Unauthorized request"
                            : "Route error"}
                      </div>
                      <Badge className={CRON_STATUS_COLORS[entry.status]} variant="secondary">
                        {entry.status}
                      </Badge>
                    </div>

                    {entry.errorMessage ? (
                      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs">
                        {entry.errorMessage}
                      </div>
                    ) : null}

                    {entry.interests.length ? (
                      <div className="space-y-1">
                        {entry.interests.map((interest, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            {interest.succeeded ? (
                              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <XCircle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
                            )}
                            <div className="flex-1">
                              <span className="font-medium">{interest.interest}</span>{" "}
                              <span className="text-muted-foreground">
                                — {interest.suggestionsCreated} suggestion
                                {interest.suggestionsCreated === 1 ? "" : "s"}, {interest.attempts} attempt
                                {interest.attempts === 1 ? "" : "s"}
                              </span>
                              {interest.errorMessage ? (
                                <div className="mt-0.5 rounded border border-destructive/30 bg-destructive/5 p-1.5 text-destructive">
                                  {interest.errorMessage}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {entry.type === "user_category" && entry.status !== "success" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={retry.isPending}
                        onClick={() =>
                          log && retry.mutate({ logId: log.id, entryId: entry.id }, { onSuccess: onClose })
                        }
                      >
                        <RefreshCw className={retry.isPending ? "size-3.5 animate-spin" : "size-3.5"} />
                        Retry now
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
