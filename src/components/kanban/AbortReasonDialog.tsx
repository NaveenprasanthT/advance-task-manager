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

interface AbortReasonDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

export function AbortReasonDialog({ open, onCancel, onConfirm }: AbortReasonDialogProps) {
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
          <DialogTitle>Abort task</DialogTitle>
          <DialogDescription>Please provide a reason for aborting this task.</DialogDescription>
        </DialogHeader>
        <Textarea
          autoFocus
          placeholder="Why is this task being aborted?"
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
            Abort task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
