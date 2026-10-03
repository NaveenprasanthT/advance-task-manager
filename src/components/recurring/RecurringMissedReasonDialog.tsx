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

interface RecurringMissedReasonDialogProps {
  open: boolean;
  existingNote: string;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

// The caller remounts this (via a `key` tied to the target day) each time a
// different day is being marked missed, so initial state below is always
// that day's existing note - no effect needed to re-sync it.
export function RecurringMissedReasonDialog({
  open,
  existingNote,
  onCancel,
  onConfirm,
}: RecurringMissedReasonDialogProps) {
  const [reason, setReason] = useState(existingNote);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark as missed</DialogTitle>
          <DialogDescription>Please provide a reason for missing this day.</DialogDescription>
        </DialogHeader>
        <Textarea
          autoFocus
          placeholder="Why was this missed?"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button disabled={!reason.trim()} onClick={() => onConfirm(reason.trim())}>
            Confirm missed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
