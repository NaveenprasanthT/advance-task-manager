import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { StudyPlanModel, STUDY_PLAN_FREQUENCIES, type StudyPlanFrequency } from "@/models/StudyPlan";
import { StudyPlanEntryModel } from "@/models/StudyPlanEntry";
import { requireUser } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { serializeStudyPlan } from "@/lib/serialize";
import { uploadStudyPlanFile } from "@/lib/cloudinary";
import { validateStudyPlanFile } from "@/lib/study-plan/validate-file";
import { computeEntryDate } from "@/lib/study-plan/compute-entry-date";
import { computeStreakStats } from "@/lib/study-plan/compute-progress";
import { toDateOnly } from "@/lib/recurrence";
import type { StudyPlanSummaryDTO } from "@/types/study-plan";

interface IncomingTopic {
  title?: unknown;
  description?: unknown;
}

interface IncomingEntry {
  index?: unknown;
  label?: unknown;
  topics?: unknown;
}

export async function GET() {
  try {
    const user = await requireUser();
    await connectMongoose();

    const plans = await StudyPlanModel.find({ owner: user.id }).sort({ createdAt: -1 }).lean();
    if (plans.length === 0) return NextResponse.json([]);

    const planIds = plans.map((p) => p._id);
    const entries = await StudyPlanEntryModel.find({ studyPlanId: { $in: planIds } })
      .select("studyPlanId index date label status")
      .sort({ index: 1 })
      .lean();

    const byPlan = new Map<string, typeof entries>();
    for (const entry of entries) {
      const key = entry.studyPlanId.toString();
      if (!byPlan.has(key)) byPlan.set(key, []);
      byPlan.get(key)!.push(entry);
    }

    const today = toDateOnly(new Date());
    const summaries: StudyPlanSummaryDTO[] = plans.map((plan) => {
      const planEntries = byPlan.get(plan._id.toString()) ?? [];
      const totalEntries = planEntries.length;
      const completedEntries = planEntries.filter((e) => e.status === "Completed").length;
      const percentComplete = totalEntries > 0 ? Math.round((completedEntries / totalEntries) * 100) : null;
      const nextPending = planEntries.find((e) => e.status === "Pending" && new Date(e.date) <= today) ?? planEntries.find((e) => e.status === "Pending");

      const { currentStreak, bestStreak, expectedByToday, completedByToday } = computeStreakStats(planEntries, today);
      const behindCount = expectedByToday - completedByToday;

      return {
        ...serializeStudyPlan(plan as never),
        totalEntries,
        completedEntries,
        percentComplete,
        nextPendingEntry: nextPending
          ? { index: nextPending.index, date: new Date(nextPending.date).toISOString(), label: nextPending.label ?? null }
          : null,
        currentStreak,
        bestStreak,
        paceStatus: behindCount > 0 ? "behind" : "onTrack",
        behindCount: Math.max(0, behindCount),
      };
    });

    return NextResponse.json(summaries);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const formData = await req.formData();

    const title = formData.get("title");
    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const frequencyRaw = formData.get("frequency");
    if (typeof frequencyRaw !== "string" || !STUDY_PLAN_FREQUENCIES.includes(frequencyRaw as StudyPlanFrequency)) {
      return NextResponse.json({ error: "A valid frequency is required" }, { status: 400 });
    }
    const frequency = frequencyRaw as StudyPlanFrequency;

    const startDateRaw = formData.get("startDate");
    if (typeof startDateRaw !== "string" || !startDateRaw) {
      return NextResponse.json({ error: "A start date is required" }, { status: 400 });
    }
    const startDate = new Date(startDateRaw);
    if (Number.isNaN(startDate.getTime())) {
      return NextResponse.json({ error: "Invalid start date" }, { status: 400 });
    }

    const endDateRaw = formData.get("endDate");
    const endDate = typeof endDateRaw === "string" && endDateRaw ? new Date(endDateRaw) : undefined;

    const entriesRaw = formData.get("entries");
    let incomingEntries: IncomingEntry[] = [];
    if (typeof entriesRaw === "string" && entriesRaw) {
      try {
        incomingEntries = JSON.parse(entriesRaw);
      } catch {
        return NextResponse.json({ error: "entries must be valid JSON" }, { status: 400 });
      }
    }
    if (!Array.isArray(incomingEntries)) {
      return NextResponse.json({ error: "entries must be an array" }, { status: 400 });
    }

    const normalizedEntries = incomingEntries.map((entry, i) => {
      const index = Number.isFinite(entry.index) ? Number(entry.index) : i;
      const label = typeof entry.label === "string" ? entry.label.trim() || undefined : undefined;
      const topics = Array.isArray(entry.topics)
        ? (entry.topics as IncomingTopic[])
            .filter((t) => typeof t.title === "string" && t.title.trim())
            .map((t) => ({
              title: String(t.title).trim(),
              description: typeof t.description === "string" ? t.description.trim() || undefined : undefined,
            }))
        : [];
      return { index, label, topics };
    });

    const sourceFileField = formData.get("sourceFile");

    await connectMongoose();

    let sourceFile;
    if (sourceFileField instanceof File && sourceFileField.size > 0) {
      const validationError = validateStudyPlanFile(sourceFileField);
      if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });
      const buffer = Buffer.from(await sourceFileField.arrayBuffer());
      const uploaded = await uploadStudyPlanFile(buffer, sourceFileField.name);
      sourceFile = { url: uploaded.url, publicId: uploaded.publicId, fileName: sourceFileField.name };
    }

    const plan = await StudyPlanModel.create({
      owner: user.id,
      title: title.trim(),
      frequency,
      startDate,
      endDate,
      sourceFile,
    });

    if (normalizedEntries.length > 0) {
      await StudyPlanEntryModel.insertMany(
        normalizedEntries.map((entry) => ({
          studyPlanId: plan._id,
          index: entry.index,
          date: computeEntryDate(startDate, frequency, entry.index),
          label: entry.label,
          topics: entry.topics,
        })),
      );
    }

    return NextResponse.json(serializeStudyPlan(plan.toObject()), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
