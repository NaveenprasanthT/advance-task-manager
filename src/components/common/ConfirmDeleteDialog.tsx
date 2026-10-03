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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface ConfirmDeleteDialogProps {
  open: boolean;
  /** The exact text the user must retype - typically the item's title/name. */
  itemName: string;
  /** What kind of thing this is, for the dialog copy, e.g. "recurring task", "study plan". */
  itemTypeLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  isPending?: boolean;
}

// Shared "type the name to confirm" delete guard - used anywhere deleting
// something is hard to undo and carries real data loss (a recurring task's
// schedule, a whole study plan and its entries), unlike a single Task card
// which already has undo-adjacent affordances elsewhere in the app.
export function ConfirmDeleteDialog({
  open,
  itemName,
  itemTypeLabel,
  onCancel,
  onConfirm,
  isPending,
}: ConfirmDeleteDialogProps) {
  const [typed, setTyped] = useState("");

  function handleOpenChange(next: boolean) {
    if (!next) {
      setTyped("");
      onCancel();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this {itemTypeLabel}?</DialogTitle>
          <DialogDescription>
            This cannot be undone. Type <span className="font-medium text-foreground">{itemName}</span> below to
            confirm.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-delete-input">Confirm by typing the name</Label>
          <Input
            id="confirm-delete-input"
            autoFocus
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={itemName}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={typed !== itemName || Boolean(isPending)}
            onClick={() => {
              onConfirm();
              setTyped("");
            }}
          >
            Delete {itemTypeLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
