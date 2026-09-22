import { Schema, model, models, Types, type Model } from "mongoose";
import { TASK_CATEGORIES, type TaskCategory } from "@/models/Task";

export const CRON_LOG_ENTRY_TYPES = ["user_category", "unauthorized", "route_error"] as const;
export type CronLogEntryType = (typeof CRON_LOG_ENTRY_TYPES)[number];

export const CRON_LOG_ENTRY_STATUSES = ["success", "partial", "failure", "skipped"] as const;
export type CronLogEntryStatus = (typeof CRON_LOG_ENTRY_STATUSES)[number];

export const CRON_RUN_STATUSES = ["success", "partial", "failure"] as const;
export type CronRunStatus = (typeof CRON_RUN_STATUSES)[number];

export const CRON_RUN_TRIGGERS = ["scheduled", "manual_retry"] as const;
export type CronRunTrigger = (typeof CRON_RUN_TRIGGERS)[number];

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
export function cronLogExpiryFrom(startedAt: Date): Date {
  return new Date(startedAt.getTime() + THIRTY_DAYS_MS);
}

// One interest attempted within a user+category entry.
const cronLogInterestResultSchema = new Schema(
  {
    interest: { type: String, required: true, trim: true },
    succeeded: { type: Boolean, required: true },
    suggestionsCreated: { type: Number, default: 0 },
    attempts: { type: Number, default: 1 },
    errorMessage: { type: String, maxlength: 2000 },
  },
  { _id: false },
);

// One user+category processed in a run (or the single target of a manual
// retry). This is the granularity `lastGeneratedAt` is advanced at and what
// "Retry now" targets, so status/userId/category live here rather than only
// at the run level.
const cronLogEntrySchema = new Schema(
  {
    type: { type: String, enum: CRON_LOG_ENTRY_TYPES, required: true, default: "user_category" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    userEmail: { type: String, trim: true, lowercase: true },
    userName: { type: String, trim: true },
    category: { type: String, enum: TASK_CATEGORIES },
    status: { type: String, enum: CRON_LOG_ENTRY_STATUSES, required: true },
    interests: { type: [cronLogInterestResultSchema], default: [] },
    suggestionsCreated: { type: Number, default: 0 },
    lastGeneratedAtAdvanced: { type: Boolean, default: false },
    errorMessage: { type: String, maxlength: 2000 },
    durationMs: { type: Number },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const cronLogSchema = new Schema(
  {
    trigger: { type: String, enum: CRON_RUN_TRIGGERS, required: true, default: "scheduled" },
    triggeredBy: { type: Schema.Types.ObjectId, ref: "User" },
    retryOfLogId: { type: Schema.Types.ObjectId, ref: "CronLog" },
    retryOfEntryId: { type: Schema.Types.ObjectId },
    status: { type: String, enum: CRON_RUN_STATUSES, required: true, default: "success" },
    startedAt: { type: Date, required: true, default: Date.now },
    finishedAt: { type: Date },
    durationMs: { type: Number },
    usersConsidered: { type: Number, default: 0 },
    entries: { type: [cronLogEntrySchema], default: [] },
    hadUnauthorizedAttempt: { type: Boolean, default: false },
    hadRouteError: { type: Boolean, default: false },
    // 30-day retention, mirroring Puzzle.ts's TTL pattern - zero maintenance.
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

cronLogSchema.index({ createdAt: -1 });
cronLogSchema.index({ status: 1, createdAt: -1 });
cronLogSchema.index({ "entries.userId": 1, createdAt: -1 });
cronLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Hand-written (not InferSchemaType) so a freshly-built entry - before
// Mongoose assigns its _id/createdAt at save time - satisfies the same type
// used to read it back afterwards; InferSchemaType only models the
// post-save/hydrated shape (DocumentArray, required timestamps, etc.),
// which is too strict for constructing entries to pass into `.create()`.
export interface ICronLogInterestResult {
  interest: string;
  succeeded: boolean;
  suggestionsCreated?: number;
  attempts?: number;
  errorMessage?: string;
}

export interface ICronLogEntry {
  _id?: Types.ObjectId;
  type: CronLogEntryType;
  userId?: string;
  userEmail?: string;
  userName?: string;
  category?: TaskCategory;
  status: CronLogEntryStatus;
  interests?: ICronLogInterestResult[];
  suggestionsCreated?: number;
  lastGeneratedAtAdvanced?: boolean;
  errorMessage?: string;
  durationMs?: number;
  createdAt?: Date;
}

export interface ICronLog {
  _id: Types.ObjectId;
  trigger: CronRunTrigger;
  triggeredBy?: string;
  retryOfLogId?: Types.ObjectId | string;
  retryOfEntryId?: Types.ObjectId | string;
  status: CronRunStatus;
  startedAt: Date;
  finishedAt?: Date;
  durationMs?: number;
  usersConsidered?: number;
  entries: ICronLogEntry[];
  hadUnauthorizedAttempt?: boolean;
  hadRouteError?: boolean;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export const CronLogModel: Model<ICronLog> = models.CronLog ?? model<ICronLog>("CronLog", cronLogSchema);
