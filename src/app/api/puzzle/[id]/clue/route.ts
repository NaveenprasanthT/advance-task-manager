import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { PuzzleModel } from "@/models/Puzzle";
import { requirePuzzleAccess } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const user = await requirePuzzleAccess();
    const { id } = await params;

    await connectMongoose();
    const puzzle = await PuzzleModel.findOne({ _id: id, owner: user.id });
    if (!puzzle) return NextResponse.json({ error: "Puzzle not found or expired" }, { status: 404 });

    const revealed = new Set(puzzle.revealedIndices);
    let nextIndex = -1;
    for (let i = 0; i < puzzle.word.length; i++) {
      if (!revealed.has(i)) {
        nextIndex = i;
        break;
      }
    }

    if (nextIndex === -1) {
      return NextResponse.json({ error: "No more clues available" }, { status: 400 });
    }

    puzzle.revealedIndices.push(nextIndex);
    await puzzle.save();

    return NextResponse.json({ index: nextIndex, letter: puzzle.word[nextIndex] });
  } catch (error) {
    return handleApiError(error);
  }
}
