import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { StudyPlanEntryModel } from "@/models/StudyPlanEntry";
import { requireUser } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { serializeStudyPlanEntry } from "@/lib/serialize";
import { verifyPlanOwnership } from "@/lib/study-plan/verify-ownership";

type Params = { params: Promise<{ id: string; entryId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id, entryId } = await params;
    const body = await req.json();

    await connectMongoose();
    if (!(await verifyPlanOwnership(id, user.id))) {
      return NextResponse.json({ error: "Study plan not found" }, { status: 404 });
    }

    const entry = await StudyPlanEntryModel.findOne({ _id: entryId, studyPlanId: id });
    if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

    if ("label" in body) {
      entry.label = typeof body.label === "string" ? body.label.trim() || undefined : undefined;
    }
    if ("topics" in body) {
      if (!Array.isArray(body.topics)) {
        return NextResponse.json({ error: "topics must be an array" }, { status: 400 });
      }
      const topics = body.topics
        .filter((t: { title?: unknown }) => typeof t.title === "string" && t.title.trim())
        .map((t: { title: string; description?: unknown }) => ({
          title: t.title.trim(),
          description: typeof t.description === "string" ? t.description.trim() || undefined : undefined,
        }));
      if (topics.length === 0) {
        return NextResponse.json({ error: "At least one topic is required" }, { status: 400 });
      }
      entry.topics = topics;
    }
    if ("notes" in body) {
      entry.notes = typeof body.notes === "string" ? body.notes.trim() || undefined : undefined;
    }

    await entry.save();
    return NextResponse.json(serializeStudyPlanEntry(entry.toObject()));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id, entryId } = await params;

    await connectMongoose();
    if (!(await verifyPlanOwnership(id, user.id))) {
      return NextResponse.json({ error: "Study plan not found" }, { status: 404 });
    }

    const result = await StudyPlanEntryModel.deleteOne({ _id: entryId, studyPlanId: id });
    if (result.deletedCount === 0) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
