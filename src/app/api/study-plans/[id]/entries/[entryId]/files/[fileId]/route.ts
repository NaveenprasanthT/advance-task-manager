import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { StudyPlanEntryModel } from "@/models/StudyPlanEntry";
import { requireUser } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { serializeStudyPlanEntry } from "@/lib/serialize";
import { deleteStudyPlanEntryFile } from "@/lib/cloudinary";
import { verifyPlanOwnership } from "@/lib/study-plan/verify-ownership";

type Params = { params: Promise<{ id: string; entryId: string; fileId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id, entryId, fileId } = await params;

    await connectMongoose();
    if (!(await verifyPlanOwnership(id, user.id))) {
      return NextResponse.json({ error: "Study plan not found" }, { status: 404 });
    }

    const entry = await StudyPlanEntryModel.findOne({ _id: entryId, studyPlanId: id });
    if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

    const file = entry.files.id(fileId);
    if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

    await deleteStudyPlanEntryFile(file.publicId, file.resourceType).catch((err) =>
      console.error(`Failed to delete Cloudinary asset ${file.publicId}`, err),
    );
    file.deleteOne();
    await entry.save();

    return NextResponse.json(serializeStudyPlanEntry(entry.toObject()));
  } catch (error) {
    return handleApiError(error);
  }
}
