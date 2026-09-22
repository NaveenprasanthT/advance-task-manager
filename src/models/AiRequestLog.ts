import { Schema, model, models, Types, type Model } from "mongoose";

export const AI_REQUEST_FEATURES = ["puzzle"] as const;
export type AiRequestFeature = (typeof AI_REQUEST_FEATURES)[number];

export const AI_REQUEST_STATUSES = ["success", "failure"] as const;
export type AiRequestStatus = (typeof AI_REQUEST_STATUSES)[number];

export const AI_REQUEST_STAGES = ["gemini", "unsplash"] as const;
export type AiRequestStage = (typeof AI_REQUEST_STAGES)[number];

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
export function aiRequestLogExpiryFrom(startedAt: Date): Date {
  return new Date(startedAt.getTime() + THIRTY_DAYS_MS);
}

const aiRequestLogSchema = new Schema(
  {
    feature: { type: String, enum: AI_REQUEST_FEATURES, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    userEmail: { type: String, trim: true, lowercase: true },
    status: { type: String, enum: AI_REQUEST_STATUSES, required: true },
    stage: { type: String, enum: AI_REQUEST_STAGES },
    errorMessage: { type: String, maxlength: 2000 },
    attempts: { type: Number, default: 1 },
    durationMs: { type: Number },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

aiRequestLogSchema.index({ createdAt: -1 });
aiRequestLogSchema.index({ status: 1, createdAt: -1 });
aiRequestLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Hand-written for the same reason as CronLog's types - a freshly built
// entry (pre-save) shouldn't need to satisfy a strict InferSchemaType shape.
export interface IAiRequestLog {
  _id: Types.ObjectId;
  feature: AiRequestFeature;
  userId?: string;
  userEmail?: string;
  status: AiRequestStatus;
  stage?: AiRequestStage;
  errorMessage?: string;
  attempts?: number;
  durationMs?: number;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export const AiRequestLogModel: Model<IAiRequestLog> =
  models.AiRequestLog ?? model<IAiRequestLog>("AiRequestLog", aiRequestLogSchema);
