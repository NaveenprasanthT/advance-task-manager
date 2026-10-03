"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface StudyPlanSkipReasonDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

// Same required-reason pattern as AbortReasonDialog.tsx / RecurringMissedReasonDialog.tsx.
export function StudyPlanSkipReasonDialog({ open, onCancel, onConfirm }: StudyPlanSkipReasonDialogProps) {
  const [reason, setReason] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Skip this day</DialogTitle>
          <DialogDescription>Please provide a reason for skipping this day.</DialogDescription>
        </DialogHeader>
        <Textarea
          autoFocus
          placeholder="Why was this skipped?"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!reason.trim()}
            onClick={() => {
              onConfirm(reason.trim());
              setReason("");
            }}
          >
            Skip day
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
