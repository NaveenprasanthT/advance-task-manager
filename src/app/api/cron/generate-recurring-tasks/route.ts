import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { RecurringTaskModel } from "@/models/RecurringTask";
import { backfillOccurrences } from "@/lib/recurring/generate-occurrence";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectMongoose();

  const templates = await RecurringTaskModel.find({ active: true });
  const today = new Date();

  let templatesProcessed = 0;
  let occurrencesCreated = 0;
  for (const template of templates) {
    try {
      occurrencesCreated += await backfillOccurrences(template, today);
      templatesProcessed++;
    } catch (err) {
      console.error(`Failed to generate occurrences for recurring task ${template._id.toString()}`, err);
    }
  }

  return NextResponse.json({ success: true, templatesProcessed, occurrencesCreated });
}
