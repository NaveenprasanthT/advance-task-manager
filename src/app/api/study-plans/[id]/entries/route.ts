import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { StudyPlanModel } from "@/models/StudyPlan";
import { StudyPlanEntryModel } from "@/models/StudyPlanEntry";
import { requireUser } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { serializeStudyPlanEntry } from "@/lib/serialize";
import { computeEntryDate } from "@/lib/study-plan/compute-entry-date";

type Params = { params: Promise<{ id: string }> };

// Manual "add a day" path - used both for plans created without an import
// (title/frequency/dates only) and for appending extra days to an existing
// imported plan later.
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json();

    const topics = Array.isArray(body.topics)
      ? body.topics
          .filter((t: { title?: unknown }) => typeof t.title === "string" && t.title.trim())
          .map((t: { title: string; description?: unknown }) => ({
            title: t.title.trim(),
            description: typeof t.description === "string" ? t.description.trim() || undefined : undefined,
          }))
      : [];
    if (topics.length === 0) {
      return NextResponse.json({ error: "At least one topic is required" }, { status: 400 });
    }
    const label = typeof body.label === "string" ? body.label.trim() || undefined : undefined;

    await connectMongoose();
    const plan = await StudyPlanModel.findOne({ _id: id, owner: user.id }).lean();
    if (!plan) return NextResponse.json({ error: "Study plan not found" }, { status: 404 });

    const lastEntry = await StudyPlanEntryModel.findOne({ studyPlanId: id }).sort({ index: -1 }).select("index").lean();
    const nextIndex = lastEntry ? lastEntry.index + 1 : 0;

    const entry = await StudyPlanEntryModel.create({
      studyPlanId: id,
      index: nextIndex,
      date: computeEntryDate(new Date(plan.startDate), plan.frequency, nextIndex),
      label,
      topics,
    });

    return NextResponse.json(serializeStudyPlanEntry(entry.toObject()), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
