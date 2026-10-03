import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { StudyPlanModel, STUDY_PLAN_FREQUENCIES, STUDY_PLAN_STATUSES, type StudyPlanFrequency } from "@/models/StudyPlan";
import { StudyPlanEntryModel } from "@/models/StudyPlanEntry";
import { requireUser } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { serializeStudyPlan, serializeStudyPlanEntry } from "@/lib/serialize";
import { deleteStudyPlanFile } from "@/lib/cloudinary";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await connectMongoose();

    const plan = await StudyPlanModel.findOne({ _id: id, owner: user.id }).lean();
    if (!plan) return NextResponse.json({ error: "Study plan not found" }, { status: 404 });

    const entries = await StudyPlanEntryModel.find({ studyPlanId: id }).sort({ index: 1 }).lean();

    return NextResponse.json({
      plan: serializeStudyPlan(plan as never),
      entries: entries.map((e) => serializeStudyPlanEntry(e as never)),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json();

    await connectMongoose();
    const plan = await StudyPlanModel.findOne({ _id: id, owner: user.id });
    if (!plan) return NextResponse.json({ error: "Study plan not found" }, { status: 404 });

    if ("title" in body) {
      if (typeof body.title !== "string" || !body.title.trim()) {
        return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
      }
      plan.title = body.title.trim();
    }
    if ("frequency" in body) {
      if (!STUDY_PLAN_FREQUENCIES.includes(body.frequency as StudyPlanFrequency)) {
        return NextResponse.json({ error: "Invalid frequency" }, { status: 400 });
      }
      plan.frequency = body.frequency;
    }
    if ("endDate" in body) {
      plan.endDate = body.endDate ? new Date(body.endDate) : undefined;
    }
    if ("status" in body) {
      if (!STUDY_PLAN_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      plan.status = body.status;
    }

    await plan.save();
    return NextResponse.json(serializeStudyPlan(plan.toObject()));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await connectMongoose();

    const plan = await StudyPlanModel.findOne({ _id: id, owner: user.id });
    if (!plan) return NextResponse.json({ error: "Study plan not found" }, { status: 404 });

    await StudyPlanEntryModel.deleteMany({ studyPlanId: id });
    if (plan.sourceFile) {
      await deleteStudyPlanFile(plan.sourceFile.publicId).catch((err) =>
        console.error(`Failed to delete Cloudinary asset ${plan.sourceFile!.publicId}`, err),
      );
    }
    await plan.deleteOne();

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
