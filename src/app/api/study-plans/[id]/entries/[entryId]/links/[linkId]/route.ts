import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { StudyPlanEntryModel } from "@/models/StudyPlanEntry";
import { requireUser } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { serializeStudyPlanEntry } from "@/lib/serialize";
import { verifyPlanOwnership } from "@/lib/study-plan/verify-ownership";

type Params = { params: Promise<{ id: string; entryId: string; linkId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id, entryId, linkId } = await params;

    await connectMongoose();
    if (!(await verifyPlanOwnership(id, user.id))) {
      return NextResponse.json({ error: "Study plan not found" }, { status: 404 });
    }

    const entry = await StudyPlanEntryModel.findOne({ _id: entryId, studyPlanId: id });
    if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

    const link = entry.links.id(linkId);
    if (!link) return NextResponse.json({ error: "Link not found" }, { status: 404 });

    link.deleteOne();
    await entry.save();

    return NextResponse.json(serializeStudyPlanEntry(entry.toObject()));
  } catch (error) {
    return handleApiError(error);
  }
}
