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
import { Plus, Trash2 } from "lucide-react";
import { useAddStudyPlanEntry } from "@/hooks/useStudyPlans";

interface TopicDraft {
  title: string;
  description: string;
}

export function AddStudyPlanEntryDialog({ planId }: { planId: string }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [topics, setTopics] = useState<TopicDraft[]>([{ title: "", description: "" }]);

  const addEntry = useAddStudyPlanEntry(planId);

  function reset() {
    setLabel("");
    setTopics([{ title: "", description: "" }]);
  }

  function updateTopic(index: number, patch: Partial<TopicDraft>) {
    setTopics((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validTopics = topics.filter((t) => t.title.trim());
    if (validTopics.length === 0) return;

    addEntry.mutate(
      {
        label: label.trim() || undefined,
        topics: validTopics.map((t) => ({ title: t.title.trim(), description: t.description.trim() || undefined })),
      },
      {
        onSuccess: () => {
          reset();
          setOpen(false);
        },
      },
    );
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline">
            <Plus className="size-4" />
            Add day
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a day</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="entry-label">Label (optional)</Label>
            <Input id="entry-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Fundamentals" />
          </div>

          <div className="space-y-3">
            <Label>Topics</Label>
            {topics.map((topic, i) => (
              <div key={i} className="space-y-1.5 rounded-md border p-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={topic.title}
                    onChange={(e) => updateTopic(i, { title: e.target.value })}
                    placeholder="Topic title"
                  />
                  {topics.length > 1 ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setTopics((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  ) : null}
                </div>
                <Textarea
                  value={topic.description}
                  onChange={(e) => updateTopic(i, { description: e.target.value })}
                  placeholder="Description (optional)"
                />
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setTopics((prev) => [...prev, { title: "", description: "" }])}
            >
              <Plus className="size-3.5" />
              Add another topic
            </Button>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={addEntry.isPending}>
              {addEntry.isPending ? "Adding..." : "Add day"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
