import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

// Concurrency guard for the generate-todos cron: a fixed-_id insert is
// atomic, so a second concurrent run gets an E11000 duplicate key error
// instead of double-processing. Released explicitly in a `finally`, with a
// short TTL as a safety valve if release itself fails (e.g. a hard kill).
const cronLockSchema = new Schema(
  {
    _id: { type: String, required: true },
    lockedAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false },
);

cronLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type ICronLock = InferSchemaType<typeof cronLockSchema>;

export const CronLockModel: Model<ICronLock> = models.CronLock ?? model<ICronLock>("CronLock", cronLockSchema);

export function isLockConflict(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: number }).code === 11000;
}
