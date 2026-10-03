import { Schema, model, models, Types, type InferSchemaType, type Model } from "mongoose";

export const STUDY_PLAN_ENTRY_STATUSES = ["Pending", "Completed", "Paused", "Skipped"] as const;
export type StudyPlanEntryStatus = (typeof STUDY_PLAN_ENTRY_STATUSES)[number];

const studyPlanTopicSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, maxlength: 2000 },
  },
  { _id: false },
);

// Mirrors Memory's memoryFileSchema (src/models/Memory.ts) - same
// attach-reference-material use case, just scoped to one plan day.
const studyPlanEntryFileSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    resourceType: { type: String, required: true },
    fileName: { type: String, required: true, trim: true },
    fileType: { type: String },
    fileSize: { type: Number },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// A reference link (article, video, docs page) attached to one plan day -
// distinct from `files` (uploaded binaries) and `notes` (free text).
const studyPlanEntryLinkSchema = new Schema(
  {
    url: { type: String, required: true, trim: true, maxlength: 2000 },
    label: { type: String, trim: true, maxlength: 200 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// One row per day/week/month unit of a plan - a self-contained unit of
// curriculum (its own topic list) plus its own tracking state. Unlike
// RecurringTask occurrences there is no automatic "missed" sweep: a plan is
// finite and self-paced, so a past-due Pending entry just stays Pending
// until the user resolves it (that's what Paused is for).
const studyPlanEntrySchema = new Schema(
  {
    studyPlanId: { type: Schema.Types.ObjectId, ref: "StudyPlan", required: true },
    // 0-based ordinal within the plan - "Day 1" in the source document is index 0.
    index: { type: Number, required: true, min: 0 },
    // Calendar date this unit falls on, computed from the plan's
    // startDate + frequency + index at creation time.
    date: { type: Date, required: true },
    // Optional trailing free text after "Day 1: <label>" in the source document.
    label: { type: String, trim: true, maxlength: 200 },
    topics: { type: [studyPlanTopicSchema], default: [] },
    status: { type: String, enum: STUDY_PLAN_ENTRY_STATUSES, default: "Pending" },
    reason: {
      type: String,
      maxlength: 1000,
      validate: {
        validator: function (this: { status?: string }, value: string | undefined) {
          if (this.status === "Skipped") return Boolean(value && value.trim().length > 0);
          return true;
        },
        message: "reason is required when status is Skipped",
      },
    },
    resolvedAt: { type: Date },
    // Free-form per-day notes, independent of `reason` (which is only ever
    // the Skip explanation) - editable regardless of status.
    notes: { type: String, maxlength: 10000 },
    files: { type: [studyPlanEntryFileSchema], default: [] },
    links: { type: [studyPlanEntryLinkSchema], default: [] },
  },
  { timestamps: true },
);

studyPlanEntrySchema.index({ studyPlanId: 1, index: 1 }, { unique: true });

export type IStudyPlanTopic = InferSchemaType<typeof studyPlanTopicSchema>;
export type IStudyPlanEntryFile = InferSchemaType<typeof studyPlanEntryFileSchema> & { _id: Types.ObjectId };
export type IStudyPlanEntryLink = InferSchemaType<typeof studyPlanEntryLinkSchema> & { _id: Types.ObjectId };
export type IStudyPlanEntry = InferSchemaType<typeof studyPlanEntrySchema> & {
  _id: Types.ObjectId;
  files: IStudyPlanEntryFile[];
  links: IStudyPlanEntryLink[];
};

export const StudyPlanEntryModel: Model<IStudyPlanEntry> =
  models.StudyPlanEntry ?? model<IStudyPlanEntry>("StudyPlanEntry", studyPlanEntrySchema);
