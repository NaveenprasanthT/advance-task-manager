import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { StudyPlanEntryModel, STUDY_PLAN_ENTRY_STATUSES, type StudyPlanEntryStatus } from "@/models/StudyPlanEntry";
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
    const status = body.status as StudyPlanEntryStatus;

    if (!STUDY_PLAN_ENTRY_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (status === "Skipped" && !reason) {
      return NextResponse.json({ error: "A reason is required when skipping a day" }, { status: 400 });
    }

    await connectMongoose();
    if (!(await verifyPlanOwnership(id, user.id))) {
      return NextResponse.json({ error: "Study plan not found" }, { status: 404 });
    }

    const entry = await StudyPlanEntryModel.findOne({ _id: entryId, studyPlanId: id });
    if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

    entry.status = status;
    entry.reason = status === "Skipped" ? reason : undefined;
    entry.resolvedAt = status === "Pending" ? undefined : new Date();
    await entry.save();

    return NextResponse.json(serializeStudyPlanEntry(entry.toObject()));
  } catch (error) {
    return handleApiError(error);
  }
}
