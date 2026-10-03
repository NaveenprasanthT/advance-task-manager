import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { StudyPlanEntryModel } from "@/models/StudyPlanEntry";
import { requireUser } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { serializeStudyPlanEntry } from "@/lib/serialize";
import { verifyPlanOwnership } from "@/lib/study-plan/verify-ownership";

type Params = { params: Promise<{ id: string; entryId: string }> };

function normalizeUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id, entryId } = await params;
    const body = await req.json();

    const url = normalizeUrl(body.url);
    if (!url) return NextResponse.json({ error: "A valid http(s) URL is required" }, { status: 400 });
    const label = typeof body.label === "string" ? body.label.trim() || undefined : undefined;

    await connectMongoose();
    if (!(await verifyPlanOwnership(id, user.id))) {
      return NextResponse.json({ error: "Study plan not found" }, { status: 404 });
    }

    const entry = await StudyPlanEntryModel.findOne({ _id: entryId, studyPlanId: id });
    if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

    entry.links.push({ url, label });
    await entry.save();

    return NextResponse.json(serializeStudyPlanEntry(entry.toObject()), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
