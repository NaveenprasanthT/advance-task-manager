"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lightbulb, SkipForward, CheckCircle2, RefreshCw } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClue, useGuessPuzzle, useNewPuzzle } from "@/hooks/usePuzzle";

export function PuzzleGame() {
  const newPuzzle = useNewPuzzle();
  const guessPuzzle = useGuessPuzzle();
  const clue = useClue();

  const [needsInterests, setNeedsInterests] = useState(false);
  const [puzzleId, setPuzzleId] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [wordLength, setWordLength] = useState(0);
  const [revealed, setRevealed] = useState<Record<number, string>>({});
  const [guess, setGuess] = useState("");
  const [status, setStatus] = useState<"loading" | "playing" | "correct">("loading");

  function fetchPuzzle() {
    newPuzzle.reset();
    newPuzzle.mutate(undefined, {
      onSuccess: (res) => {
        if (res.needsInterests) {
          setNeedsInterests(true);
          return;
        }
        setNeedsInterests(false);
        setPuzzleId(res.puzzleId ?? null);
        setImageUrls(res.imageUrls ?? []);
        setWordLength(res.wordLength ?? 0);
        setStatus("playing");
      },
    });
  }

  // Initial fetch on mount - state is already at its "loading"/empty defaults,
  // so no resets are needed here (unlike loadPuzzle, used for subsequent loads).
  useEffect(() => {
    fetchPuzzle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadPuzzle() {
    setStatus("loading");
    setGuess("");
    setRevealed({});
    guessPuzzle.reset();
    fetchPuzzle();
  }

  function handleClue() {
    if (!puzzleId) return;
    clue.mutate(puzzleId, {
      onSuccess: ({ index, letter }) => {
        setRevealed((prev) => ({ ...prev, [index]: letter }));
        setGuess((prev) => {
          const chars = prev.padEnd(wordLength, " ").split("");
          chars[index] = letter;
          return chars.join("").trimEnd();
        });
      },
    });
  }

  function handleGuess(e: React.FormEvent) {
    e.preventDefault();
    if (!puzzleId || guess.trim().length !== wordLength) return;

    guessPuzzle.mutate(
      { puzzleId, guess },
      {
        onSuccess: ({ correct }) => {
          if (correct) {
            setStatus("correct");
            setTimeout(loadPuzzle, 1200);
          }
          // A wrong-but-valid guess isn't an error - the `wrongGuess` derived
          // state below surfaces it inline instead of via toast.
        },
      },
    );
  }

  if (needsInterests) {
    return (
      <div className="space-y-3 py-6 text-center">
        <p className="text-sm text-muted-foreground">
          Add a few interests to Personal or Professional auto-generate settings to unlock puzzles themed around
          them.
        </p>
        <Button render={<Link href="/settings/auto-generate">Go to Settings</Link>} />
      </div>
    );
  }

  const wrongGuess = guessPuzzle.isSuccess && guessPuzzle.data?.correct === false && status === "playing";
  const loadFailed = newPuzzle.isError && status === "loading";

  if (loadFailed) {
    return (
      <div className="space-y-3 py-6 text-center">
        <p className="text-sm text-muted-foreground">
          Couldn&apos;t load a puzzle right now — the image/word service may be temporarily busy.
        </p>
        <Button type="button" variant="outline" onClick={loadPuzzle}>
          <RefreshCw className="size-4" />
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {status === "loading" || imageUrls.length === 0
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-md bg-muted" />
            ))
          : imageUrls.map((url, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-md bg-muted">
                <Image src={url} alt="Puzzle hint" fill sizes="200px" className="object-cover" unoptimized />
              </div>
            ))}
      </div>

      {status === "correct" ? (
        <div className="flex items-center justify-center gap-2 py-4 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-5" />
          <span className="font-medium">Correct! Loading next puzzle...</span>
        </div>
      ) : (
        <form onSubmit={handleGuess} className="space-y-3">
          <div className="flex justify-center gap-1.5">
            {Array.from({ length: wordLength }).map((_, i) => (
              <div
                key={i}
                className="flex size-9 items-center justify-center rounded-md border bg-background text-lg font-semibold uppercase"
              >
                {revealed[i] ?? guess[i] ?? ""}
              </div>
            ))}
          </div>

          <Input
            value={guess}
            onChange={(e) => setGuess(e.target.value.toUpperCase().slice(0, wordLength))}
            maxLength={wordLength}
            placeholder="Type your guess"
            className="text-center uppercase tracking-widest"
            autoFocus
          />

          {wrongGuess ? <p className="text-center text-sm text-destructive">Not quite — try again.</p> : null}

          <div className="flex justify-center gap-2">
            <Button type="button" variant="outline" onClick={handleClue} disabled={clue.isPending}>
              <Lightbulb className="size-4" />
              Clue
            </Button>
            <Button type="submit" disabled={guess.trim().length !== wordLength || guessPuzzle.isPending}>
              Guess
            </Button>
            <Button type="button" variant="ghost" onClick={loadPuzzle}>
              <SkipForward className="size-4" />
              Skip
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
