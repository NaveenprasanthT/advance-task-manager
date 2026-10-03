import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { StudyPlanEntryModel } from "@/models/StudyPlanEntry";
import { requireUser } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { serializeStudyPlanEntry } from "@/lib/serialize";
import { uploadStudyPlanEntryFile } from "@/lib/cloudinary";
import { validateMemoryFile } from "@/lib/memory-files";
import { verifyPlanOwnership } from "@/lib/study-plan/verify-ownership";

type Params = { params: Promise<{ id: string; entryId: string }> };

// Reuses validateMemoryFile - attaching reference material to a study day
// is the same use case (images/PDF/spreadsheets) as Memory's file feature.
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id, entryId } = await params;
    const formData = await req.formData();

    const incomingFiles = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    if (incomingFiles.length === 0) {
      return NextResponse.json({ error: "At least one file is required" }, { status: 400 });
    }
    for (const file of incomingFiles) {
      const error = validateMemoryFile(file);
      if (error) return NextResponse.json({ error }, { status: 400 });
    }

    await connectMongoose();
    if (!(await verifyPlanOwnership(id, user.id))) {
      return NextResponse.json({ error: "Study plan not found" }, { status: 404 });
    }

    const entry = await StudyPlanEntryModel.findOne({ _id: entryId, studyPlanId: id });
    if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

    const uploaded = await Promise.all(
      incomingFiles.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await uploadStudyPlanEntryFile(buffer, file.name);
        return { ...result, fileName: file.name, fileType: file.type, fileSize: file.size };
      }),
    );
    entry.files.push(...uploaded);

    await entry.save();
    return NextResponse.json(serializeStudyPlanEntry(entry.toObject()), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
