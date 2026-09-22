"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CronRunsTab } from "@/components/admin/CronRunsTab";
import { AiRequestsTab } from "@/components/admin/AiRequestsTab";

export default function SystemLogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">System Log</h1>
        <p className="text-sm text-muted-foreground">
          Cron runs for auto-generated suggestions, and every AI request (suggestions + puzzle) - success or
          failure.
        </p>
      </div>

      <Tabs defaultValue="cron">
        <TabsList>
          <TabsTrigger value="cron">Cron Runs</TabsTrigger>
          <TabsTrigger value="ai">AI Requests</TabsTrigger>
        </TabsList>
        <TabsContent value="cron">
          <CronRunsTab />
        </TabsContent>
        <TabsContent value="ai">
          <AiRequestsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
