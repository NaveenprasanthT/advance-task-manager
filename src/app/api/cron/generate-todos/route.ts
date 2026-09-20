import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { UserModel, type AutoGenFrequency } from "@/models/User";
import { TaskModel, type TaskCategory } from "@/models/Task";
import { generateSuggestionsForInterest } from "@/lib/auto-generate";

export const maxDuration = 60;

const CATEGORY_MAP: Record<"personal" | "professional", TaskCategory> = {
  personal: "Personal",
  professional: "Professional",
};

const MAX_SUGGESTIONS_PER_INTEREST = 3;

function isDue(frequency: AutoGenFrequency, lastGeneratedAt: Date | null | undefined): boolean {
  if (!lastGeneratedAt) return true;
  const days = { daily: 1, weekly: 7, monthly: 30 }[frequency];
  return Date.now() - new Date(lastGeneratedAt).getTime() >= days * 24 * 60 * 60 * 1000;
}

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectMongoose();

  const users = await UserModel.find({
    $or: [{ "autoGen.personal.enabled": true }, { "autoGen.professional.enabled": true }],
  });

  const results: { userId: string; category: TaskCategory; created: number }[] = [];

  for (const user of users) {
    let changed = false;
    const ownerId = user._id.toString();

    for (const key of Object.keys(CATEGORY_MAP) as (keyof typeof CATEGORY_MAP)[]) {
      const settings = user.autoGen?.[key];
      const category = CATEGORY_MAP[key];
      if (!settings?.enabled || !settings.interests.length) continue;
      if (!isDue(settings.frequency as AutoGenFrequency, settings.lastGeneratedAt)) continue;

      const highestOrder = await TaskModel.findOne({ owner: ownerId, category, status: "Suggested" })
        .sort({ boardOrder: -1 })
        .select("boardOrder")
        .lean();
      let nextOrder = highestOrder ? (highestOrder.boardOrder ?? 0) + 1 : 0;

      let created = 0;
      for (const interest of settings.interests) {
        try {
          const drafts = await generateSuggestionsForInterest(interest, MAX_SUGGESTIONS_PER_INTEREST);
          for (const draft of drafts) {
            await TaskModel.create({
              owner: ownerId,
              category,
              title: draft.title,
              description: draft.description,
              resourceUrl: draft.resourceUrl,
              origin: "auto",
              status: "Suggested",
              statusHistory: [{ status: "Suggested", enteredAt: new Date() }],
              boardOrder: nextOrder++,
            });
            created++;
          }
        } catch (err) {
          console.error(`auto-generate failed for user ${ownerId}, interest "${interest}"`, err);
        }
      }

      settings.lastGeneratedAt = new Date();
      changed = true;
      results.push({ userId: ownerId, category, created });
    }

    if (changed) await user.save();
  }

  return NextResponse.json({ success: true, results });
}
