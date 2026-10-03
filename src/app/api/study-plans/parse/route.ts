import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { validateStudyPlanFile } from "@/lib/study-plan/validate-file";
import { extractPlanText } from "@/lib/study-plan/extract-text";
import { parsePlanDocument } from "@/lib/study-plan/parse-plan-document";

// Preview-only: parses an uploaded document and returns the result without
// writing anything to the database or Cloudinary, so the user can fix their
// file and re-upload as many times as needed before committing.
export async function POST(req: NextRequest) {
  try {
    await requireUser();
    const formData = await req.formData();

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "A file is required" }, { status: 400 });
    }

    const validationError = validateStudyPlanFile(file);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractPlanText(buffer, file.type);
    const result = parsePlanDocument(text);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
