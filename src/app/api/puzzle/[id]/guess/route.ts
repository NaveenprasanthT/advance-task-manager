import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { PuzzleModel } from "@/models/Puzzle";
import { requirePuzzleAccess } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requirePuzzleAccess();
    const { id } = await params;
    const body = await req.json();
    const guess = String(body?.guess ?? "").trim().toUpperCase();

    await connectMongoose();
    const puzzle = await PuzzleModel.findOne({ _id: id, owner: user.id });
    if (!puzzle) return NextResponse.json({ error: "Puzzle not found or expired" }, { status: 404 });

    const correct = guess.length > 0 && guess === puzzle.word;
    if (correct && !puzzle.solved) {
      puzzle.solved = true;
      await puzzle.save();
    }

    return NextResponse.json({ correct });
  } catch (error) {
    return handleApiError(error);
  }
}
