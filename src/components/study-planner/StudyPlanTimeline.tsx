"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  Pause,
  XCircle,
  AlertTriangle,
  RotateCcw,
  StickyNote,
  ChevronDown,
  ChevronUp,
  Trash2,
  FileText,
  FileSpreadsheet,
  File as FileIcon,
  Paperclip,
  Link2,
  Plus,
} from "lucide-react";
import { StudyPlanSkipReasonDialog } from "@/components/study-planner/StudyPlanSkipReasonDialog";
import {
  useUpdateStudyPlanEntryStatus,
  useUpdateStudyPlanEntry,
  useAddStudyPlanEntryFiles,
  useDeleteStudyPlanEntryFile,
  useAddStudyPlanEntryLink,
  useDeleteStudyPlanEntryLink,
} from "@/hooks/useStudyPlans";
import { validateMemoryFile } from "@/lib/memory-files";
import type { StudyPlanEntryDTO } from "@/types/study-plan";

const STATUS_BADGE_CLASS: Record<StudyPlanEntryDTO["status"], string> = {
  Pending: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  Completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200",
  Paused: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200",
  Skipped: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
};

function fileIconFor(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return FileText;
  if (ext === "xls" || ext === "xlsx" || ext === "csv") return FileSpreadsheet;
  return FileIcon;
}

function NotesAndFiles({ entry, planId }: { entry: StudyPlanEntryDTO; planId: string }) {
  const updateEntry = useUpdateStudyPlanEntry(planId);
  const addFiles = useAddStudyPlanEntryFiles(planId);
  const deleteFile = useDeleteStudyPlanEntryFile(planId);
  const addLink = useAddStudyPlanEntryLink(planId);
  const deleteLink = useDeleteStudyPlanEntryLink(planId);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");

  function handleAddLink(e: React.FormEvent) {
    e.preventDefault();
    if (!linkUrl.trim()) return;
    addLink.mutate(
      { entryId: entry.id, url: linkUrl.trim(), label: linkLabel.trim() || undefined },
      {
        onSuccess: () => {
          setLinkUrl("");
          setLinkLabel("");
        },
      },
    );
  }

  function handleAddFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    for (const file of picked) {
      const error = validateMemoryFile(file);
      if (error) {
        toast.error(error);
        e.target.value = "";
        return;
      }
    }
    if (picked.length > 0) addFiles.mutate({ entryId: entry.id, files: picked });
    e.target.value = "";
  }

  return (
    <div className="space-y-3 border-t pt-3">
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Notes</span>
        <Textarea
          defaultValue={entry.notes ?? ""}
          placeholder="Notes for later reference..."
          onBlur={(e) => updateEntry.mutate({ entryId: entry.id, notes: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Link2 className="size-3.5" />
          Links
        </span>
        <div className="space-y-2">
          {entry.links.map((link) => (
            <div key={link.id} className="flex items-center gap-2 rounded-md border p-2">
              <Link2 className="size-4 shrink-0 text-muted-foreground" />
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 truncate text-sm text-primary hover:underline"
              >
                {link.label || link.url}
              </a>
              <Button
                variant="ghost"
                size="icon"
                disabled={deleteLink.isPending}
                onClick={() => deleteLink.mutate({ entryId: entry.id, linkId: link.id })}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          {entry.links.length === 0 ? <p className="text-sm text-muted-foreground">No links added.</p> : null}
        </div>
        <form onSubmit={handleAddLink} className="flex flex-wrap gap-2">
          <Input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
            className="min-w-0 flex-1"
          />
          <Input
            value={linkLabel}
            onChange={(e) => setLinkLabel(e.target.value)}
            placeholder="Label (optional)"
            className="w-36"
          />
          <Button type="submit" size="sm" variant="outline" disabled={addLink.isPending || !linkUrl.trim()}>
            <Plus className="size-3.5" />
            Add
          </Button>
        </form>
      </div>

      <div className="space-y-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Paperclip className="size-3.5" />
          Files
        </span>
        <div className="space-y-2">
          {entry.files.map((file) => {
            const Icon = fileIconFor(file.fileName);
            return (
              <div key={file.id} className="flex items-center gap-2 rounded-md border p-2">
                {file.resourceType === "image" ? (
                  <div className="relative size-10 shrink-0 overflow-hidden rounded bg-muted">
                    <Image src={file.url} alt={file.fileName} fill className="object-cover" unoptimized />
                  </div>
                ) : (
                  <Icon className="size-5 shrink-0 text-muted-foreground" />
                )}
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 truncate text-sm text-primary hover:underline"
                >
                  {file.fileName}
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={deleteFile.isPending}
                  onClick={() => deleteFile.mutate({ entryId: entry.id, fileId: file.id })}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            );
          })}
          {entry.files.length === 0 ? <p className="text-sm text-muted-foreground">No files attached.</p> : null}
        </div>
        <Input
          type="file"
          multiple
          accept="image/*,.pdf,.xls,.xlsx,.csv"
          onChange={handleAddFiles}
          disabled={addFiles.isPending}
        />
      </div>
    </div>
  );
}

function EntryRow({ entry, planId }: { entry: StudyPlanEntryDTO; planId: string }) {
  const updateStatus = useUpdateStudyPlanEntryStatus(planId);
  const [skipping, setSkipping] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const isOverdue = entry.status === "Pending" && new Date(entry.date) < new Date(new Date().toDateString());
  const hasNotesOrFiles = Boolean(entry.notes) || entry.files.length > 0 || entry.links.length > 0;

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              Day {entry.index + 1}
              {entry.label ? ` - ${entry.label}` : ""}
            </span>
            <span className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            {isOverdue ? (
              <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200">
                <AlertTriangle className="size-3" />
                Overdue
              </Badge>
            ) : null}
            <Badge className={STATUS_BADGE_CLASS[entry.status]} variant="secondary">
              {entry.status}
            </Badge>
          </div>
        </div>

        {entry.topics.length > 0 ? (
          <ul className="space-y-2">
            {entry.topics.map((topic, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium">{topic.title}</span>
                {topic.description ? <p className="text-muted-foreground">{topic.description}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No topics listed for this day.</p>
        )}

        {entry.status === "Skipped" && entry.reason ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs">{entry.reason}</div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={entry.status === "Completed" ? "default" : "outline"}
            disabled={updateStatus.isPending}
            onClick={() => updateStatus.mutate({ entryId: entry.id, status: "Completed" })}
          >
            <CheckCircle2 className="size-3.5" />
            Complete
          </Button>
          <Button
            type="button"
            size="sm"
            variant={entry.status === "Paused" ? "default" : "outline"}
            disabled={updateStatus.isPending}
            onClick={() => updateStatus.mutate({ entryId: entry.id, status: "Paused" })}
          >
            <Pause className="size-3.5" />
            Pause
          </Button>
          <Button
            type="button"
            size="sm"
            variant={entry.status === "Skipped" ? "default" : "outline"}
            disabled={updateStatus.isPending}
            onClick={() => setSkipping(true)}
          >
            <XCircle className="size-3.5" />
            Skip
          </Button>
          {entry.status !== "Pending" ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={updateStatus.isPending}
              onClick={() => updateStatus.mutate({ entryId: entry.id, status: "Pending" })}
            >
              <RotateCcw className="size-3.5" />
              Undo
            </Button>
          ) : null}

          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={() => setNotesOpen((v) => !v)}
          >
            <StickyNote className={hasNotesOrFiles ? "size-3.5 text-primary" : "size-3.5"} />
            Notes & files
            {notesOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </Button>
        </div>

        {notesOpen ? <NotesAndFiles entry={entry} planId={planId} /> : null}
      </CardContent>

      <StudyPlanSkipReasonDialog
        open={skipping}
        onCancel={() => setSkipping(false)}
        onConfirm={(reason) => {
          updateStatus.mutate({ entryId: entry.id, status: "Skipped", reason }, { onSettled: () => setSkipping(false) });
        }}
      />
    </Card>
  );
}

export function StudyPlanTimeline({ entries, planId }: { entries: StudyPlanEntryDTO[]; planId: string }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No days yet - add one below.</p>;
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <EntryRow key={entry.id} entry={entry} planId={planId} />
      ))}
    </div>
  );
}
