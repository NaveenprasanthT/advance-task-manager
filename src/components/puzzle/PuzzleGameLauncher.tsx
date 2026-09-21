"use client";

import { useState } from "react";
import { Puzzle as PuzzleIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PuzzleGame } from "./PuzzleGame";

export function PuzzleGameLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Puzzle game">
            <PuzzleIcon className="size-4" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Picture Puzzle</DialogTitle>
        </DialogHeader>
        {open ? <PuzzleGame /> : null}
      </DialogContent>
    </Dialog>
  );
}
