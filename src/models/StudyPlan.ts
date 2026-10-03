import { Schema, model, models, Types, type InferSchemaType, type Model } from "mongoose";

export const STUDY_PLAN_FREQUENCIES = ["daily", "weekly", "monthly"] as const;
export type StudyPlanFrequency = (typeof STUDY_PLAN_FREQUENCIES)[number];

export const STUDY_PLAN_STATUSES = ["active", "archived"] as const;
export type StudyPlanStatus = (typeof STUDY_PLAN_STATUSES)[number];

const studyPlanSourceFileSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    fileName: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const studyPlanSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    frequency: { type: String, enum: STUDY_PLAN_FREQUENCIES, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    status: { type: String, enum: STUDY_PLAN_STATUSES, default: "active" },
    // Only present when the plan was created by uploading a document -
    // kept for provenance/audit, never required to render the plan itself.
    sourceFile: { type: studyPlanSourceFileSchema },
  },
  { timestamps: true },
);

studyPlanSchema.index({ owner: 1, status: 1 });

export type IStudyPlanSourceFile = InferSchemaType<typeof studyPlanSourceFileSchema>;
export type IStudyPlan = InferSchemaType<typeof studyPlanSchema> & { _id: Types.ObjectId };

export const StudyPlanModel: Model<IStudyPlan> = models.StudyPlan ?? model<IStudyPlan>("StudyPlan", studyPlanSchema);
