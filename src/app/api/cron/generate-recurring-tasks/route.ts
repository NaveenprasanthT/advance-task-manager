import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { RecurringTaskModel } from "@/models/RecurringTask";
import { sweepMissedOccurrences } from "@/lib/recurring/resolve-occurrences";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectMongoose();

  const templates = await RecurringTaskModel.find({ active: true });
  const today = new Date();

  let templatesProcessed = 0;
  let missedCreated = 0;
  for (const template of templates) {
    try {
      missedCreated += await sweepMissedOccurrences(template, today);
      templatesProcessed++;
    } catch (err) {
      console.error(`Failed to sweep occurrences for recurring task ${template._id.toString()}`, err);
    }
  }

  return NextResponse.json({ success: true, templatesProcessed, missedCreated });
}
