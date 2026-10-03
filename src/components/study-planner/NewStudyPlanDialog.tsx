"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ChevronDown, ChevronUp, Copy, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  useParseStudyPlanFile,
  useCreateStudyPlan,
  type CreateStudyPlanInput,
} from "@/hooks/useStudyPlans";
import type { StudyPlanFrequency } from "@/models/StudyPlan";
import type { ParsePlanDocumentResult } from "@/lib/study-plan/parse-plan-document";

const UNIT_TO_FREQUENCY: Record<string, StudyPlanFrequency> = { day: "daily", week: "weekly", month: "monthly" };

const PROMPT_TEMPLATE = `Create a study plan for "<your subject here>" covering <N> <days/weeks/months>, starting from a beginner level and building up. Output ONLY plain text in exactly this format, nothing else - no Markdown, no numbered lists, no extra commentary:

Day 1
Topic: <topic title>
Description: <1-2 sentence description>

Topic: <topic title>
Description: <1-2 sentence description>

Day 2
Topic: <topic title>
Description: <1-2 sentence description>

Continue this pattern for every day. Use "Week N" instead of "Day N" for a weekly plan, or "Month N" for a monthly plan.`;

function FormatGuide() {
  const [open, setOpen] = useState(false);

  function copyPrompt() {
    navigator.clipboard
      .writeText(PROMPT_TEMPLATE)
      .then(() => toast.success("Prompt copied"))
      .catch(() => toast.error("Couldn't copy to clipboard"));
  }

  return (
    <div className="rounded-md border p-3 text-sm">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 text-left font-medium"
        onClick={() => setOpen((v) => !v)}
      >
        What format should my file be?
        {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </button>
      {open ? (
        <div className="mt-3 space-y-3">
          <p className="text-muted-foreground">
            Save a plain-text (.txt) or Word (.docx) file with one block per day, week, or month:
          </p>
          <pre className="overflow-x-auto rounded-md bg-muted p-2 text-xs">
            {`Day 1
Topic: Introduction to System Design
Description: Understand scalability, reliability, and availability goals.

Topic: Client-Server Architecture
Description: Request/response model and REST basics.

Day 2
Topic: Load Balancing
Description: L4 vs L7, round robin, least connections.`}
          </pre>
          <p className="text-muted-foreground">
            Easiest way to get this: paste the prompt below into ChatGPT, Gemini, or Claude, save the reply as a
            .txt or .docx file, then upload it here.
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Copyable AI prompt</Label>
              <Button type="button" size="sm" variant="ghost" onClick={copyPrompt}>
                <Copy className="size-3.5" />
                Copy
              </Button>
            </div>
            <Textarea readOnly value={PROMPT_TEMPLATE} className="h-32 text-xs" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function NewStudyPlanDialog() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"manual" | "import">("import");

  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState<StudyPlanFrequency>("daily");
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();

  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsePlanDocumentResult | null>(null);

  const parseFile = useParseStudyPlanFile();
  const createPlan = useCreateStudyPlan();

  function reset() {
    setTitle("");
    setFrequency("daily");
    setStartDate(undefined);
    setEndDate(undefined);
    setFile(null);
    setParsed(null);
    setTab("import");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setParsed(null);
    if (!selected) return;

    parseFile.mutate(selected, {
      onSuccess: (result) => {
        setParsed(result);
        if (result.detectedUnit) setFrequency(UNIT_TO_FREQUENCY[result.detectedUnit]);
      },
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !startDate) return;

    const entries: CreateStudyPlanInput["entries"] =
      tab === "import" && parsed
        ? parsed.entries.map((entry) => ({ index: entry.index, label: entry.label, topics: entry.topics }))
        : [];

    createPlan.mutate(
      {
        title: title.trim(),
        frequency,
        startDate,
        endDate,
        entries,
        sourceFile: tab === "import" && file ? file : undefined,
      },
      {
        onSuccess: () => {
          reset();
          setOpen(false);
        },
      },
    );
  }

  const canSubmit =
    title.trim().length > 0 && Boolean(startDate) && (tab === "manual" || (parsed?.entries.length ?? 0) > 0);

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button size="sm">
            <Plus className="size-4" />
            New study plan
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New study plan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "manual" | "import")}>
            <TabsList className="w-full">
              <TabsTrigger value="import" className="flex-1">
                Import from file
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex-1">
                Create manually
              </TabsTrigger>
            </TabsList>

            <TabsContent value="import" className="space-y-3">
              <FormatGuide />
              <div className="space-y-1.5">
                <Label htmlFor="study-plan-file">Plan document</Label>
                <Input id="study-plan-file" type="file" accept=".txt,.docx" onChange={handleFileChange} />
              </div>

              {parseFile.isPending ? <p className="text-sm text-muted-foreground">Parsing...</p> : null}

              {parsed ? (
                <div className="space-y-2 rounded-md border p-3 text-sm">
                  <div className="flex items-center gap-2 font-medium">
                    {parsed.entries.length > 0 ? (
                      <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <AlertTriangle className="size-4 text-destructive" />
                    )}
                    Found {parsed.entries.length} {parsed.detectedUnit ?? "day"}
                    {parsed.entries.length === 1 ? "" : "s"}, {parsed.entries.reduce((a, e) => a + e.topics.length, 0)}{" "}
                    topics
                  </div>
                  {parsed.warnings.length > 0 ? (
                    <ul className="list-inside list-disc space-y-0.5 text-xs text-muted-foreground">
                      {parsed.warnings.slice(0, 8).map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                      {parsed.warnings.length > 8 ? <li>...and {parsed.warnings.length - 8} more</li> : null}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="manual">
              <p className="text-sm text-muted-foreground">
                Creates an empty plan - add each day&apos;s topics afterward from the plan page.
              </p>
            </TabsContent>
          </Tabs>

          <div className="space-y-1.5">
            <Label htmlFor="study-plan-title">Title</Label>
            <Input
              id="study-plan-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. System Design"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as StudyPlanFrequency)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Start date</Label>
              <DatePicker value={startDate} onChange={setStartDate} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>End date (optional)</Label>
            <DatePicker value={endDate} onChange={setEndDate} placeholder="No end date" />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!canSubmit || createPlan.isPending}>
              {createPlan.isPending ? "Creating..." : "Create plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
