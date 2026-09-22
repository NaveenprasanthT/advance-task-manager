import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { UserModel } from "@/models/User";
import { PuzzleModel } from "@/models/Puzzle";
import { AiRequestLogModel, aiRequestLogExpiryFrom } from "@/models/AiRequestLog";
import { requirePuzzleAccess } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { buildPuzzle, PuzzleGenerationError } from "@/lib/puzzle-game";

export const maxDuration = 30;

export async function POST() {
  try {
    const user = await requirePuzzleAccess();
    await connectMongoose();

    const dbUser = await UserModel.findById(user.id).select("autoGen").lean();
    const interests = [
      ...(dbUser?.autoGen?.personal?.interests ?? []),
      ...(dbUser?.autoGen?.professional?.interests ?? []),
    ];
    const pool = Array.from(new Set(interests.map((i) => i.trim()).filter(Boolean)));

    if (pool.length === 0) {
      return NextResponse.json({ needsInterests: true });
    }

    const startedAt = new Date();
    let word: string;
    let imageUrls: string[];
    try {
      ({ word, imageUrls } = await buildPuzzle(pool));
    } catch (err) {
      await AiRequestLogModel.create({
        feature: "puzzle",
        userId: user.id,
        userEmail: user.email ?? undefined,
        status: "failure",
        stage: err instanceof PuzzleGenerationError ? err.stage : undefined,
        errorMessage: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - startedAt.getTime(),
        expiresAt: aiRequestLogExpiryFrom(startedAt),
      }).catch((logErr) => console.error("Failed to record AI request log", logErr));
      throw err;
    }

    await AiRequestLogModel.create({
      feature: "puzzle",
      userId: user.id,
      userEmail: user.email ?? undefined,
      status: "success",
      durationMs: Date.now() - startedAt.getTime(),
      expiresAt: aiRequestLogExpiryFrom(startedAt),
    }).catch((logErr) => console.error("Failed to record AI request log", logErr));

    const puzzle = await PuzzleModel.create({
      owner: user.id,
      word,
      imageUrls,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    return NextResponse.json({
      puzzleId: puzzle._id.toString(),
      imageUrls,
      wordLength: word.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
